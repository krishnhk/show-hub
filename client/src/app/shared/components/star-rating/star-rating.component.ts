import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, model, output } from '@angular/core';

export type StarSize = 'sm' | 'md' | 'lg';

/**
 * Star rating. Renders as a read-only summary by default and becomes an
 * interactive picker when `interactive` is enabled (used by review forms).
 */
@Component({
  selector: 'app-star-rating',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="stars" [class.sm]="size() === 'sm'" [class.lg]="size() === 'lg'">
      @for (star of stars(); track $index) {
        <button
          type="button"
          class="star"
          [class.off]="star <= 0"
          [class.pickable]="interactive()"
          [attr.aria-label]="star + ' star' + (star === 1 ? '' : 's')"
          [disabled]="!interactive()"
          (click)="pick(star)"
        >
          ★
        </button>
      }
    </span>
    @if (showValue()) {
      <span class="rating-value">{{ value() | number: '1.1-1' }}</span>
    }
  `,
  styles: `
    :host {
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }

    .stars {
      display: inline-flex;
      gap: 2px;
      color: var(--accent);
      line-height: 1;
    }

    .star {
      background: none;
      border: none;
      padding: 0 1px;
      font-size: 1rem;
      color: inherit;
      cursor: default;
    }

    .stars.sm .star { font-size: 0.8rem; }
    .stars.lg .star { font-size: 1.5rem; }

    .star.pickable { cursor: pointer; transition: transform 120ms ease; }
    .star.pickable:hover { transform: scale(1.15); }

    .star.off { color: var(--surface-3); }
  `,
  imports: [DecimalPipe],
})
export class StarRatingComponent {
  readonly value = model<number>(0);
  readonly size = input<StarSize>('md');
  readonly interactive = input<boolean>(false);
  readonly showValue = input<boolean>(false);

  readonly ratingChange = output<number>();

  readonly stars = computed(() => [1, 2, 3, 4, 5]);

  pick(star: number): void {
    if (!this.interactive()) {
      return;
    }
    this.value.set(star);
    this.ratingChange.emit(star);
  }
}
