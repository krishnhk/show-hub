import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { ResaleTicketDetail } from '../../../core/models/resale.model';
import { ShowDatePipe, ShowTimePipe } from '../../pipes/date.pipes';
import { FilmThumbComponent } from '../film-thumb/film-thumb.component';

/**
 * The top of every listing popup: poster, status badge, title, then date, time and venue in
 * tiles and the seats. Sold, unsold and active listings all start with the same block so the
 * popups read as one family.
 */
@Component({
  selector: 'app-listing-summary',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FilmThumbComponent, ShowDatePipe, ShowTimePipe],
  template: `
    <header class="top">
      <app-film-thumb [posterUrl]="ticket().showtime.movie.posterUrl" [alt]="ticket().showtime.movie.title" />
      <div class="title">
        <span
          class="badge"
          [class.badge-success]="tone() === 'success'"
          [class.badge-info]="tone() === 'info'"
          [class.badge-muted]="tone() === 'muted'"
        >
          {{ badge() }}
        </span>
        <h2 [id]="titleId()">{{ ticket().showtime.movie.title }}</h2>
      </div>
      <button type="button" class="btn btn-ghost btn-sm" aria-label="Close" (click)="closed.emit()">✕</button>
    </header>

    <div class="when">
      <div class="tile">
        <span class="k">Date</span>
        <span class="v">{{ ticket().showtime.showDateTime | showDate }}</span>
      </div>
      <div class="tile">
        <span class="k">Time</span>
        <span class="v">{{ ticket().showtime.showDateTime | showTime }}</span>
      </div>
      <div class="tile">
        <span class="k">Venue</span>
        <span class="v">{{ ticket().showtime.theater.name }}</span>
      </div>
    </div>

    <div class="seats">
      <span class="k">Seats</span>
      <span class="row">
        @for (seat of ticket().seatNumbers; track seat) {
          <span class="seat">{{ seat }}</span>
        }
      </span>
      @if (note()) {
        <span class="note">{{ note() }}</span>
      }
    </div>
  `,
  styles: `
    :host {
      display: contents;
      --thumb-w: 68px;
      --thumb-h: 94px;
    }

    .top {
      display: grid;
      grid-template-columns: auto minmax(0, 1fr) auto;
      align-items: center;
      gap: 18px;
    }

    .title {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 8px;
      min-width: 0;
    }

    h2 {
      margin: 0;
      font-size: 1.6rem;
      line-height: 1.15;
    }

    .badge-muted {
      background: var(--surface-2);
      color: var(--text-muted);
    }

    .k {
      font-size: 0.7rem;
      font-weight: 700;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: var(--text-muted);
    }

    .when {
      display: grid;
      grid-template-columns: 1fr 1fr 1.3fr;
      gap: 12px;
    }

    .tile {
      display: flex;
      flex-direction: column;
      gap: 6px;
      padding: 14px 16px;
      border: 1px solid var(--border-soft);
      border-radius: var(--radius);
      background: var(--surface-2);
    }

    .v {
      font-family: var(--font);
      font-weight: 700;
    }

    .seats {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 8px 14px;
    }

    .row {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }

    .seat {
      padding: 5px 14px;
      border: 1px solid var(--border);
      border-radius: 999px;
      background: var(--surface);
      color: var(--text-soft);
      font-size: 0.78rem;
      font-weight: 700;
    }

    .note {
      font-size: 0.78rem;
      color: var(--text-muted);
    }

    @media (max-width: 480px) {
      .when {
        grid-template-columns: 1fr 1fr;
      }

      .tile:last-child {
        grid-column: 1 / 3;
      }
    }
  `,
})
export class ListingSummaryComponent {
  readonly ticket = input.required<ResaleTicketDetail>();
  readonly badge = input.required<string>();
  readonly tone = input<'success' | 'info' | 'muted'>('muted');
  /** Small line after the seats, such as "Locked: seats can't be changed". */
  readonly note = input<string | null>(null);
  readonly titleId = input('pop-title');

  readonly closed = output<void>();
}
