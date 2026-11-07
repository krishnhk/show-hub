import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { EMPTY, Observable, expand, reduce } from 'rxjs';

import { BookingDetail } from '../../core/models/booking.model';
import { BookingService } from '../../core/services/booking.service';
import {
  TheatreSort,
  areaOf,
  buildTheatres,
  searchTheatres,
  sortTheatres,
} from '../../core/utils/theatre-visits';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { MyBookingsHeaderComponent } from '../../shared/components/my-bookings-header/my-bookings-header.component';
import { TheatreLogoComponent } from '../../shared/components/theatre-logo/theatre-logo.component';

/**
 * The Theatres tab of My tickets: every theatre the user has booked at, with how often they went and which seats
 * they used. Searchable by name or area, and sortable.
 */
@Component({
  selector: 'app-my-theatres',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    DatePipe,
    MyBookingsHeaderComponent,
    TheatreLogoComponent,
    LoadingSpinnerComponent,
    EmptyStateComponent,
  ],
  templateUrl: './my-theatres.html',
  styleUrl: './my-theatres.css',
})
export class MyTheatresComponent implements OnInit {
  private readonly bookingService = inject(BookingService);

  readonly sorts: { id: TheatreSort; label: string }[] = [
    { id: 'visits', label: 'Most visited' },
    { id: 'name', label: 'A to Z' },
    { id: 'recent', label: 'Recent visit' },
  ];

  readonly bookings = signal<BookingDetail[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  readonly query = signal('');
  readonly sort = signal<TheatreSort>('visits');
  readonly menuOpen = signal(false);

  readonly theatres = computed(() => buildTheatres(this.bookings()));

  /** The theatres matching the search, in the chosen order. */
  readonly visible = computed(() => sortTheatres(searchTheatres(this.theatres(), this.query()), this.sort()));

  readonly sortLabel = computed(() => this.sorts.find((option) => option.id === this.sort())!.label);

  readonly area = areaOf;

  ngOnInit(): void {
    this.load();
  }

  toggleMenu(): void {
    this.menuOpen.update((open) => !open);
  }

  pick(sort: TheatreSort): void {
    this.sort.set(sort);
    this.menuOpen.set(false);
  }

  clearSearch(): void {
    this.query.set('');
  }

  @HostListener('document:click', ['$event'])
  closeOnOutsideClick(event: MouseEvent): void {
    if (this.menuOpen() && !(event.target as HTMLElement).closest('.filter')) {
      this.menuOpen.set(false);
    }
  }

  @HostListener('document:keydown.escape')
  closeMenu(): void {
    this.menuOpen.set(false);
  }

  private load(): void {
    this.loading.set(true);
    this.error.set(null);

    this.loadAll().subscribe({
      next: (bookings) => {
        this.bookings.set(bookings);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.error.set('We could not load your theatres right now. Please try again.');
      },
    });
  }

  /** Every page of the user's bookings, since the theatres need all of them. */
  private loadAll(): Observable<BookingDetail[]> {
    let page = 1;
    let loaded = 0;
    return this.bookingService.getBookings('All', page).pipe(
      expand((response) => {
        loaded += response.bookings.length;
        if (response.bookings.length === 0 || loaded >= response.total) {
          return EMPTY;
        }
        page++;
        return this.bookingService.getBookings('All', page);
      }),
      reduce<{ bookings: BookingDetail[] }, BookingDetail[]>((all, response) => [...all, ...response.bookings], []),
    );
  }
}
