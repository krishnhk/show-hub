import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import {
  Movie,
  ShowtimeListResponse,
  ShowtimeWithRefs,
  Theater,
} from '../../core/models/catalog.model';
import { CatalogService } from '../../core/services/catalog.service';
import { LocationService } from '../../core/services/location.service';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { buildStripDays, DayStripComponent } from '../../shared/components/day-strip/day-strip.component';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { TheatreLogoComponent } from '../../shared/components/theatre-logo/theatre-logo.component';
import { ShowDatePipe, ShowTimePipe } from '../../shared/pipes/date.pipes';

interface TheatreGroup {
  theater: Theater;
  showtimes: ShowtimeWithRefs[];
}

function mergeValues(current: string[], incoming: string[]): string[] {
  return [...new Set([...current, ...incoming])].sort();
}

@Component({
  selector: 'app-movie-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    DayStripComponent,
    LoadingSpinnerComponent,
    EmptyStateComponent,
    TheatreLogoComponent,
    ShowDatePipe,
    ShowTimePipe,
  ],
  templateUrl: './movie-detail.html',
  styleUrl: './movie-detail.css',
})
export class MovieDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly catalog = inject(CatalogService);
  readonly location = inject(LocationService);

  readonly movieId = Number(this.route.snapshot.paramMap.get('movieId'));
  /** Language picked on the movie card, when the movie plays in more than one. */
  readonly language = this.route.snapshot.queryParamMap.get('lang');

  readonly movie = signal<Movie | null>(null);
  readonly showtimes = signal<ShowtimeWithRefs[]>([]);
  readonly dates = signal<string[]>([]);
  /** The day showing, as yyyy-mm-dd. Null until the first response says which days have shows. */
  readonly selectedDate = signal<string | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  /** Today and the days after it; only days that have shows can be picked. */
  readonly stripDays = computed(() => buildStripDays(new Set(this.dates())));

  readonly groups = computed<TheatreGroup[]>(() => {
    const map = new Map<number, TheatreGroup>();
    this.showtimes().forEach((showtime) => {
      const existing = map.get(showtime.theaterId);
      if (existing) {
        existing.showtimes.push(showtime);
      } else {
        map.set(showtime.theaterId, { theater: showtime.theater, showtimes: [showtime] });
      }
    });
    return [...map.values()].map((group) => ({
      theater: group.theater,
      showtimes: [...group.showtimes].sort(
        (a, b) =>
          new Date(a.showDateTime).getTime() - new Date(b.showDateTime).getTime(),
      ),
    }));
  });

  constructor() {
    // Showtimes belong to a city, so start fresh whenever it changes (this also runs the first load).
    effect(() => {
      this.location.city();
      untracked(() => {
        this.dates.set([]);
        this.selectedDate.set(null);
        this.load();
      });
    });
  }

  /** How full a show is, for the colour on its time chip. */
  seatsLeft(showtime: ShowtimeWithRefs): 'sold-out' | 'low' | 'ok' {
    if (showtime.availableSeats <= 0) {
      return 'sold-out';
    }
    return showtime.availableSeats <= 20 ? 'low' : 'ok';
  }

  /** 169 minutes as "2h 49m". */
  runtime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const rest = minutes % 60;
    return hours ? `${hours}h ${rest}m` : `${rest}m`;
  }

  selectDate(key: string): void {
    if (this.selectedDate() === key) {
      return;
    }
    this.selectedDate.set(key);
    this.load();
  }

  goToSeats(showtime: ShowtimeWithRefs): void {
    this.router.navigate(['/book', showtime.id, 'seats']);
  }

  private load(): void {
    const city = this.location.city();
    if (city === null) {
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    this.catalog
      .getShowtimes(this.movieId, {
        city,
        theaterId: 'All',
        date: this.selectedDate() ?? 'All',
        format: 'All',
        language: this.language ?? undefined,
      })
      .subscribe({
        next: (response) => {
          this.applyResponse(response);
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
          this.error.set('We could not load the showtimes for this movie. Please try again.');
        },
      });
  }

  private applyResponse(response: ShowtimeListResponse): void {
    this.dates.set(mergeValues(this.dates(), response.dates));

    // The first load asks for every day to learn which have shows; open on the first of them,
    // today if it has any.
    if (this.selectedDate() === null) {
      const first = this.stripDays().find((day) => day.enabled);
      if (first) {
        if (response.showtimes.length > 0) {
          this.movie.set(response.showtimes[0].movie);
        }
        this.selectedDate.set(first.key);
        this.load();
        return;
      }
    }

    this.showtimes.set(response.showtimes);

    if (response.showtimes.length > 0) {
      this.movie.set(response.showtimes[0].movie);
      return;
    }

    if (!this.movie()) {
      this.loadMovieFallback();
    }
  }

  private loadMovieFallback(): void {
    this.catalog.getMovies().subscribe({
      next: (response) => {
        this.movie.set(response.movies.find((movie) => movie.id === this.movieId) ?? null);
      },
      error: () => undefined,
    });
  }
}
