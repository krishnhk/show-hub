import { ChangeDetectionStrategy, Component, ViewEncapsulation, input } from '@angular/core';

import { ShowDatePipe, ShowTimePipe } from '../../pipes/date.pipes';
import { FilmThumbComponent } from '../film-thumb/film-thumb.component';

/**
 * The movie and its seats as one piece, the same on the resale ticket, the booking confirmation and the
 * sell listing: the movie details on a grey band, the seats directly underneath.
 *
 * Projected content:
 *  - `[ssTags]`     status tags beside the title (use `.ss-tag` with `data-tone`)
 *  - `[ssSeatTag]`  a tag beside the "Seats" label
 *  - `[ssAction]`   a `.ss-link` button at the right end of the seats heading
 *  - `[ssChips]`    a `.ss-chips` element holding the `.ss-chip` seats
 *  - anything else  notes or buttons under the seats (`.ss-note`)
 *
 * Embed it in another box by setting --ss-border and --ss-radius on the host.
 */
@Component({
  selector: 'app-show-summary',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [FilmThumbComponent, ShowDatePipe, ShowTimePipe],
  template: `
    <div class="ss">
      <div class="ss-head">
        <app-film-thumb [posterUrl]="posterUrl()" [alt]="title()" />

        <div class="ss-info">
          <div class="ss-title">
            <h1>{{ title() }}</h1>
            <ng-content select="[ssTags]" />
          </div>
          <p class="ss-when">{{ dateTime() | showDate }} | {{ dateTime() | showTime }}</p>
          <p class="ss-venue">{{ theatre() }}</p>
          <p class="ss-meta">{{ format() }} · {{ language() }}</p>
        </div>
      </div>

      @if (showSeats()) {
      <div class="ss-seats">
        <div class="ss-seats-head">
          <h2 class="ss-label">{{ seatCount() === 1 ? 'Seat' : 'Seats' }}</h2>
          <ng-content select="[ssSeatTag]" />
          <ng-content select="[ssAction]" />
        </div>
        <ng-content select="[ssChips]" />
        <ng-content />
      </div>
      }
    </div>
  `,
  styles: `
    app-show-summary {
      display: block;
    }

    .ss {
      display: flex;
      flex-direction: column;
      height: 100%;
      border: var(--ss-border, 1px solid var(--border-soft));
      border-radius: var(--ss-radius, var(--radius));
      background: var(--surface);
      overflow: hidden;
    }

    .ss-head {
      display: grid;
      grid-template-columns: auto minmax(0, 1fr);
      gap: 18px;
      align-items: center;
      padding: 14px 24px;
      border-bottom: 1px solid var(--border-soft);
      background: var(--surface-2);
      --thumb-w: 112px;
      --thumb-h: 158px;
    }

    .ss-info {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 4px;
      min-width: 0;
    }

    .ss-title {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 4px 10px;
    }

    .ss-title h1 {
      margin: 0;
      font-size: 1.5rem;
      line-height: 1.15;
    }

    .ss-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }

    .ss-when {
      margin: 6px 0 0;
      font-size: 0.95rem;
      font-weight: 600;
    }

    .ss-venue,
    .ss-meta {
      margin: 0;
      font-size: 0.9rem;
      color: var(--text-soft);
    }

    .ss-meta {
      color: var(--text-muted);
    }

    /* Status tags: one shape, a colour per meaning */
    .ss-tag {
      padding: 2px 10px;
      border-radius: 999px;
      background: var(--surface-3);
      color: var(--text);
      font-size: 0.72rem;
      font-weight: 700;
      white-space: nowrap;
    }

    .ss-tag[data-tone='success'] { background: var(--success-soft); color: var(--success); }
    .ss-tag[data-tone='info'] { background: var(--info-soft); color: var(--info); }
    .ss-tag[data-tone='danger'] { background: var(--danger-soft); color: var(--danger); }
    .ss-tag[data-tone='warning'] { background: var(--warning-soft, var(--surface-3)); color: var(--warning); }
    .ss-tag[data-tone='muted'] { background: var(--surface-3); color: var(--text-muted); }

    .ss-seats {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 10px;
      padding: 18px 24px;
    }

    .ss-seats-head {
      display: flex;
      align-items: center;
      align-self: stretch;
      gap: 10px;
    }

    .ss-link {
      margin-left: auto;
      padding: 2px 0;
      border: 0;
      background: none;
      color: var(--accent);
      font-family: inherit;
      font-size: 0.82rem;
      font-weight: 600;
      cursor: pointer;
    }

    .ss-link:hover {
      text-decoration: underline;
    }

    .ss-label {
      margin: 0;
      font-size: 0.7rem;
      font-weight: 700;
      line-height: 1.15;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: var(--text-muted);
    }

    .ss-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }

    .ss-chip {
      padding: 2px 10px;
      border: 1px solid var(--border);
      border-radius: 999px;
      background: var(--surface-2);
      color: var(--text-soft);
      font-family: inherit;
      font-size: 0.78rem;
      font-weight: 700;
      line-height: inherit;
    }

    button.ss-chip {
      cursor: pointer;
    }

    .ss-chip.off,
    .ss-chip.gone {
      text-decoration: line-through;
    }

    .ss-chip.off {
      opacity: 0.4;
    }

    .ss-note {
      margin: 0;
      font-size: 0.78rem;
      color: var(--text-muted);
    }

    @media (max-width: 560px) {
      .ss-head {
        gap: 12px;
        align-items: start;
        padding: 14px 16px;
        --thumb-w: 88px;
        --thumb-h: 124px;
      }

      .ss-title h1 {
        font-size: 1.25rem;
      }

      .ss-seats {
        padding: 16px;
      }
    }
  `,
})
export class ShowSummaryComponent {
  readonly posterUrl = input<string | null | undefined>();
  readonly title = input.required<string>();
  readonly dateTime = input.required<string | Date>();
  readonly theatre = input.required<string>();
  readonly format = input.required<string>();
  readonly language = input.required<string>();
  readonly seatCount = input(0);
  /** False for screens that only identify the show, such as picking seats. */
  readonly showSeats = input(true);
}
