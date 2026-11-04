import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { debounceTime, distinctUntilChanged } from 'rxjs';

import { Movie, TheaterWithMovies } from '../../core/models/catalog.model';
import { CatalogService } from '../../core/services/catalog.service';
import { LocationService } from '../../core/services/location.service';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { MovieCardComponent } from '../../shared/components/movie-card/movie-card.component';

@Component({
  selector: 'app-search',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink, MovieCardComponent, EmptyStateComponent],
  templateUrl: './search.html',
  styleUrl: './search.css',
})
export class SearchComponent implements OnInit {
  private readonly catalog = inject(CatalogService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  readonly location = inject(LocationService);

  readonly queryControl = new FormControl('', { nonNullable: true });
  readonly term = signal('');
  readonly movies = signal<Movie[]>([]);
  readonly theaters = signal<TheaterWithMovies[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  readonly searching = computed(() => this.term().trim() !== '');
  readonly noResults = computed(
    () => !this.loading() && this.movies().length === 0 && this.theaters().length === 0,
  );

  private requestId = 0;

  constructor() {
    // Search again whenever the text or the chosen city changes.
    effect(() => {
      const city = this.location.city();
      const text = this.term();
      if (city === null) {
        return;
      }
      untracked(() => this.load(text, city));
    });
  }

  ngOnInit(): void {
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const text = params.get('q') ?? '';
      if (text !== this.queryControl.value) {
        this.queryControl.setValue(text, { emitEvent: false });
      }
      this.term.set(text);
    });

    this.queryControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe((text) => {
        void this.router.navigate([], {
          relativeTo: this.route,
          queryParams: { q: text.trim() || null },
          queryParamsHandling: 'merge',
          replaceUrl: true,
        });
      });
  }

  clear(): void {
    this.queryControl.setValue('');
  }

  private load(text: string, city: string): void {
    const id = ++this.requestId;
    this.loading.set(true);
    this.error.set(null);

    this.catalog.search(text, city).subscribe({
      next: (response) => {
        if (id !== this.requestId) {
          return;
        }
        this.movies.set(response.movies);
        this.theaters.set(response.theaters);
        this.loading.set(false);
      },
      error: () => {
        if (id !== this.requestId) {
          return;
        }
        this.loading.set(false);
        this.error.set('We could not run that search right now. Please try again.');
      },
    });
  }
}
