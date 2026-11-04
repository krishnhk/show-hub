import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  HostListener,
  inject,
  signal,
  untracked,
} from '@angular/core';

import { Movie } from '../../core/models/catalog.model';
import { CatalogService } from '../../core/services/catalog.service';
import { LocationService } from '../../core/services/location.service';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { MovieCardComponent } from '../../shared/components/movie-card/movie-card.component';

interface TimingOption {
  value: string;
  label: string;
  hint: string;
}

const TIMINGS: TimingOption[] = [
  { value: 'Morning', label: 'Morning', hint: 'Before 12 PM' },
  { value: 'Afternoon', label: 'Afternoon', hint: '12 to 4 PM' },
  { value: 'Evening', label: 'Evening', hint: '4 to 8 PM' },
  { value: 'Night', label: 'Night', hint: 'After 8 PM' },
];

@Component({
  selector: 'app-movie-browse',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MovieCardComponent, EmptyStateComponent],
  templateUrl: './movie-browse.html',
  styleUrl: './movie-browse.css',
})
export class MovieBrowseComponent {
  private readonly catalog = inject(CatalogService);
  readonly location = inject(LocationService);

  readonly timings = TIMINGS;
  readonly genre = signal('All');
  readonly timing = signal('All');

  readonly movies = signal<Movie[]>([]);
  readonly genres = signal<string[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly skeletons = [0, 1, 2, 3, 4, 5, 6, 7];

  readonly filtersOpen = signal(false);
  readonly activeCount = computed(
    () => (this.genre() !== 'All' ? 1 : 0) + (this.timing() !== 'All' ? 1 : 0),
  );
  readonly hasFilters = computed(() => this.activeCount() > 0);

  constructor() {
    // Reload whenever the city or a filter changes (this also runs the first load).
    effect(() => {
      const city = this.location.city();
      const genre = this.genre();
      const timing = this.timing();
      if (city === null) {
        return;
      }
      untracked(() => this.load(city, genre, timing));
    });
  }

  openFilters(): void {
    this.filtersOpen.set(true);
  }

  @HostListener('document:keydown.escape')
  closeFilters(): void {
    this.filtersOpen.set(false);
  }

  clearFilters(): void {
    this.genre.set('All');
    this.timing.set('All');
  }

  private load(city: string, genre: string, timing: string): void {
    this.loading.set(true);
    this.error.set(null);

    this.catalog.getMovies({ city, genre, timing }).subscribe({
      next: (response) => {
        this.movies.set(response.movies);
        this.genres.set(response.genres);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.error.set('We could not load the movie catalogue right now. Please try again.');
      },
    });
  }
}
