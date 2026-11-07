import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { theatreHue, theatreInitials } from '../../../core/utils/theatre-visits';

/**
 * A theatre's logo tile. A theatre with a logo image shows it on a white tile, sized to the tile's height so wide
 * wordmarks keep their proportions. Otherwise the tile is drawn from the theatre's initials in a steady colour of its
 * own. Size it with --logo-size (default 56px).
 */
@Component({
  selector: 'app-theatre-logo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (logoUrl(); as url) {
      <span class="tile logo" [class.fill]="logoFill()" aria-hidden="true">
        <img [src]="url" alt="" />
      </span>
    } @else {
      <span class="tile" [class.long]="initials().length > 2" [style.--h]="hue()" aria-hidden="true">{{ initials() }}</span>
    }
  `,
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

    /* A logo sits inside the same square as the initials tile, scaled to fit with even padding */
    .tile.logo {
      padding: calc(var(--logo-size, 56px) * 0.12);
      background: #fff;
      box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--text) 10%, transparent);
    }

    .tile.logo img {
      display: block;
      width: 100%;
      height: 100%;
      object-fit: contain;
    }

    /* a photo or full-bleed mark fills the square edge to edge */
    .tile.logo.fill {
      padding: 0;
      overflow: hidden;
    }
  `,
})
export class TheatreLogoComponent {
  readonly name = input.required<string>();
  readonly id = input.required<number>();
  readonly logoUrl = input<string | null | undefined>(null);
  /** The logo fills its square instead of sitting on white with padding. */
  readonly logoFill = input<boolean | null | undefined>(false);

  protected readonly initials = computed(() => theatreInitials(this.name()));
  protected readonly hue = computed(() => theatreHue(this.id()));
}
