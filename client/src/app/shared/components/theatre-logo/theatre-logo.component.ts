import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { theatreHue, theatreInitials } from '../../../core/utils/theatre-visits';

/**
 * A theatre's logo tile. The demo has no logo images, so the tile is drawn from the theatre's initials in a steady
 * colour of its own; a real logo URL would replace it. Size it with --logo-size (default 56px).
 */
@Component({
  selector: 'app-theatre-logo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span class="tile" [class.long]="initials().length > 2" [style.--h]="hue()" aria-hidden="true">{{ initials() }}</span>`,
  styles: `
    :host {
      display: inline-flex;
      flex-shrink: 0;
    }

    .tile {
      display: grid;
      place-items: center;
      width: var(--logo-size, 56px);
      height: var(--logo-size, 56px);
      border-radius: var(--radius-lg);
      color: #fff;
      font-family: var(--font-display);
      font-weight: 600;
      font-size: calc(var(--logo-size, 56px) * 0.34);
      letter-spacing: 0.02em;
      background: linear-gradient(145deg, hsl(var(--h) 34% 42%), hsl(calc(var(--h) + 25) 38% 24%));
      box-shadow: inset 0 0 0 1.5px rgba(255, 255, 255, 0.2);
    }

    .tile.long {
      font-size: calc(var(--logo-size, 56px) * 0.28);
    }
  `,
})
export class TheatreLogoComponent {
  readonly name = input.required<string>();
  readonly id = input.required<number>();

  protected readonly initials = computed(() => theatreInitials(this.name()));
  protected readonly hue = computed(() => theatreHue(this.id()));
}
