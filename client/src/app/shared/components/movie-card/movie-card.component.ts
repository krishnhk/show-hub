import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';

import { Movie, languagesOf } from '../../../core/models/catalog.model';
import { InrPipe } from '../../pipes/inr.pipe';
import { LanguageChooserComponent } from '../language-chooser/language-chooser.component';
import { posterGradient } from '../../utils/poster-gradient';

@Component({
  selector: 'app-movie-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [InrPipe, LanguageChooserComponent],
  template: `
    <a class="movie-card card card-hover" [href]="'/movies/' + movie().id" (click)="onOpen($event)">
      <div class="poster">
        @if (movie().posterUrl) {
          <img [src]="movie().posterUrl" [alt]="movie().title" loading="lazy" />
        } @else {
          <div
            class="poster-fallback"
            [style.background]="gradient()"
          >
            <span>{{ movie().title }}</span>
          </div>
        }
        <span class="poster-badge badge badge-brand">★ {{ movie().tmdbRating }}</span>
      </div>

      <div class="meta">
        <h3 class="clamp-2">{{ movie().title }}</h3>
        <p class="text-xs text-muted clamp-2">{{ movie().genre }}</p>
        @if (price(); as moviePrice) {
          <p class="price text-sm">
            from <span class="pill-price">{{ moviePrice | inr }}</span>
          </p>
        }
      </div>
    </a>

    @if (choosing()) {
      <app-language-chooser
        [title]="movie().title"
        [languages]="languages()"
        (chosen)="chooseLanguage($event)"
        (closed)="closeChooser()"
      />
    }
  `,
  styles: `
    :host { display: block; }

    .movie-card {
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding: 12px;
      color: inherit;
      text-decoration: none;
    }

    .movie-card:hover { text-decoration: none; }
    .movie-card { transition: transform 160ms ease, box-shadow 160ms ease; }
    .movie-card:hover { transform: translateY(-3px); box-shadow: var(--shadow); }

    .meta { display: flex; flex-direction: column; gap: 6px; }
    .meta h3 { margin: 0; font-size: 0.98rem; }
    .meta p { margin: 0; }
    .price { color: var(--text-soft); }

  `,
})
export class MovieCardComponent {
  private readonly router = inject(Router);

  readonly movie = input.required<Movie>();
  readonly price = input<number | null>(null);

  readonly choosing = signal(false);
  readonly languages = computed(() => languagesOf(this.movie()));

  readonly gradient = computed(() => posterGradient(this.movie().title));

  /** A movie in several languages asks for one first; otherwise the link opens it directly. */
  onOpen(event: MouseEvent): void {
    // Let the browser handle "open in new tab" style clicks.
    if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) {
      return;
    }

    event.preventDefault();
    if (this.languages().length > 1) {
      this.choosing.set(true);
    } else {
      void this.router.navigate(['/movies', this.movie().id]);
    }
  }

  chooseLanguage(language: string): void {
    this.choosing.set(false);
    void this.router.navigate(['/movies', this.movie().id], { queryParams: { lang: language } });
  }

  @HostListener('document:keydown.escape')
  closeChooser(): void {
    this.choosing.set(false);
  }
}
