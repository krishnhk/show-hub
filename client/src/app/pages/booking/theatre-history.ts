import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Observable, catchError, forkJoin, of, switchMap } from 'rxjs';

import { BookingDetail } from '../../core/models/booking.model';
import { SeatMap } from '../../core/models/catalog.model';
import { BookingService } from '../../core/services/booking.service';
import { CatalogService } from '../../core/services/catalog.service';
import {
  HallRow,
  TheatreSummary,
  TheatreVisit,
  areaOf,
  buildTheatres,
  heatLevel,
  mergeHall,
  seatUse,
} from '../../core/utils/theatre-visits';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { FilmThumbComponent } from '../../shared/components/film-thumb/film-thumb.component';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { ShowDatePipe, ShowTimePipe } from '../../shared/pipes/date.pipes';

const MAX_HALL_SHOWS = 8;
const monthFormatter = new Intl.DateTimeFormat('en-IN', { month: 'long', year: 'numeric' });

/** A line of the films list: a month heading or one visit. */
type FilmItem = { kind: 'month'; label: string } | { kind: 'visit'; visit: TheatreVisit };

/**
 * One theatre the user booked at: its seat map with the seats they have used, and the films they watched there.
 * Tapping a seat lists its films; tapping a film marks its seats on the map.
 */
@Component({
  selector: 'app-theatre-history',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    NgTemplateOutlet,
    RouterLink,
    EmptyStateComponent,
    FilmThumbComponent,
    LoadingSpinnerComponent,
    ShowDatePipe,
    ShowTimePipe,
  ],
  templateUrl: './theatre-history.html',
  styleUrl: './theatre-history.css',
})
export class TheatreHistoryComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly bookingService = inject(BookingService);
  private readonly catalogService = inject(CatalogService);

  readonly summary = signal<TheatreSummary | null>(null);
  readonly seatMaps = signal<SeatMap[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  readonly selectedSeat = signal<string | null>(null);
  /** The booking id of the selected film's visit. */
  readonly selectedFilm = signal<number | null>(null);

  readonly use = computed(() => seatUse(this.summary()?.visits ?? []));

  readonly hall = computed<HallRow[]>(() => mergeHall(this.seatMaps(), [...this.use().keys()]));

  /** Hall rows with a category heading above each new category. */
  readonly hallRows = computed(() =>
    this.hall().map((row, index, rows) => ({
      row,
      header: index === 0 || rows[index - 1].category !== row.category ? row.category : null,
    })),
  );

  readonly filmVisit = computed(() => {
    const id = this.selectedFilm();
    return id === null
      ? null
      : (this.summary()?.visits.find((visit) => visit.bookingId === id) ?? null);
  });

  /** Seats to mark while a film is selected. */
  readonly filmSeats = computed(() => new Set(this.filmVisit()?.seats ?? []));

  /** Visits that included the selected seat, newest first. */
  readonly seatVisits = computed(() => {
    const seat = this.selectedSeat();
    return seat ? (this.summary()?.visits ?? []).filter((visit) => visit.seats.includes(seat)) : [];
  });

  readonly seatCategory = computed(() => {
    const seat = this.selectedSeat();
    return this.hall().find((row) => seat !== null && row.seats.includes(seat))?.category ?? '';
  });

  readonly seatWatched = computed(
    () => this.seatVisits().filter((visit) => !visit.upcoming).length,
  );

  /** All films newest first under month headings. */
  readonly items = computed<FilmItem[]>(() => {
    const items: FilmItem[] = [];
    let current = '';
    for (const visit of this.summary()?.visits ?? []) {
      const label = monthFormatter.format(new Date(visit.showDateTime));
      if (label !== current) {
        current = label;
        items.push({ kind: 'month', label });
      }
      items.push({ kind: 'visit', visit });
    }
    return items;
  });

  readonly area = computed(() => {
    const summary = this.summary();
    return summary ? `${areaOf(summary.theater)}, ${summary.theater.city}` : '';
  });

  ngOnInit(): void {
    this.load();
  }

  watched(seat: string): number {
    return this.use().get(seat)?.watched ?? 0;
  }

  upcoming(seat: string): boolean {
    return (this.use().get(seat)?.upcoming ?? 0) > 0;
  }

  level(seat: string): number {
    return heatLevel(this.watched(seat));
  }

  seatLabel(seat: string): string {
    const watched = this.watched(seat);
    const parts = [seat];
    if (watched > 0) {
      parts.push(`watched ${watched} ${watched === 1 ? 'time' : 'times'}`);
    }
    if (this.upcoming(seat)) {
      parts.push('upcoming booking');
    }
    return parts.join(', ');
  }

  pickSeat(seat: string): void {
    this.selectedFilm.set(null);
    this.selectedSeat.set(this.selectedSeat() === seat ? null : seat);
  }

  pickFilm(visit: TheatreVisit): void {
    this.selectedSeat.set(null);
    this.selectedFilm.set(visit.bookingId);
  }

  clear(): void {
    this.selectedSeat.set(null);
    this.selectedFilm.set(null);
  }

  private load(): void {
    const theaterId = Number(this.route.snapshot.paramMap.get('theatreId'));
    this.loading.set(true);
    this.error.set(null);

    this.loadBookings().subscribe({
      next: (bookings) => {
        const summary =
          buildTheatres(bookings).find((entry) => entry.theater.id === theaterId) ?? null;
        this.summary.set(summary);
        if (summary) {
          this.loadHall(summary);
        } else {
          this.loading.set(false);
        }
      },
      error: () => {
        this.loading.set(false);
        this.error.set('We could not load this theatre right now. Please try again.');
      },
    });
  }

  /** Every booking of the user: the first page, then the pages after it. */
  private loadBookings(): Observable<BookingDetail[]> {
    return this.bookingService.getBookings('All', 1).pipe(
      switchMap((first) => {
        const pages = Math.ceil(first.total / Math.max(first.bookings.length, 1));
        if (pages <= 1) {
          return of(first.bookings);
        }
        const rest = Array.from({ length: pages - 1 }, (_, index) =>
          this.bookingService.getBookings('All', index + 2),
        );
        return forkJoin(rest).pipe(
          switchMap((responses) =>
            of([...first.bookings, ...responses.flatMap((response) => response.bookings)]),
          ),
        );
      }),
    );
  }

  /** The hall is drawn from the seat maps of the latest shows visited; a map that fails to load is skipped. */
  private loadHall(summary: TheatreSummary): void {
    const showtimeIds = [...new Set(summary.visits.map((visit) => visit.showtimeId))].slice(
      0,
      MAX_HALL_SHOWS,
    );
    forkJoin(
      showtimeIds.map((id) => this.catalogService.getSeats(id).pipe(catchError(() => of(null)))),
    ).subscribe((responses) => {
      this.seatMaps.set(responses.flatMap((response) => (response ? [response.seatMap] : [])));
      this.loading.set(false);
    });
  }
}
