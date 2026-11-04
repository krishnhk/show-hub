import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';

/**
 * Small movie poster. Shows a film reel when the movie has no poster or the image fails to load.
 * Size it with the --thumb-w and --thumb-h custom properties.
 */
@Component({
  selector: 'app-film-thumb',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (showImage()) {
      <img [src]="posterUrl()" [alt]="alt()" (error)="failed.set(true)" />
    } @else {
      <svg class="reel" viewBox="0 0 48 48" aria-hidden="true" focusable="false">
        <circle cx="24" cy="24" r="19" />
        <circle cx="24" cy="24" r="3.5" />
        <circle cx="24" cy="12.5" r="4" />
        <circle cx="34" cy="18.3" r="4" />
        <circle cx="34" cy="29.7" r="4" />
        <circle cx="24" cy="35.5" r="4" />
        <circle cx="14" cy="29.7" r="4" />
        <circle cx="14" cy="18.3" r="4" />
      </svg>
    }
  `,
  styles: `
    :host {
      display: grid;
      flex-shrink: 0;
      place-items: center;
      width: var(--thumb-w, 60px);
      height: var(--thumb-h, 84px);
      overflow: hidden;
      border-radius: 10px;
      background: var(--surface-3);
      color: var(--text-muted);
    }

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .reel {
      width: 60%;
      max-width: 38px;
      aspect-ratio: 1;
      fill: none;
      stroke: currentColor;
      stroke-width: 1.8;
    }
  `,
})
export class FilmThumbComponent {
  readonly posterUrl = input<string | null | undefined>(null);
  readonly alt = input('');

  protected readonly failed = signal(false);
  protected readonly showImage = computed(() => !!this.posterUrl() && !this.failed());
}
