import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { ResaleTicketDetail } from '../../../core/models/resale.model';
import { ShowDatePipe, ShowTimePipe } from '../../pipes/date.pipes';
import { InrPipe } from '../../pipes/inr.pipe';
import { FilmThumbComponent } from '../film-thumb/film-thumb.component';

/** Seats shown on a card; the rest collapse into a "+n" chip so every card keeps one size. */
const MAX_SEAT_CHIPS = 5;

/**
 * One spare ticket on the marketplace, on the home page and in the resale list: the poster and the show on top, the
 * seats, the buying option and the price underneath. Every card has the same size whatever it holds.
 */
@Component({
  selector: 'app-resale-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, FilmThumbComponent, ShowDatePipe, ShowTimePipe, InrPipe],
  template: `
    <a class="tile" [routerLink]="['/resale/listings', ticket().id]">
      <span class="head">
        <app-film-thumb [posterUrl]="ticket().showtime.movie.posterUrl" [alt]="ticket().showtime.movie.title" />

        <span class="info">
          <span class="title">
            <strong class="movie">{{ ticket().showtime.movie.title }}</strong>
            @if (ticket().discountPercent > 0) {
              <span class="off">{{ ticket().discountPercent }}% off</span>
            }
          </span>
          <span class="when">
            {{ ticket().showtime.showDateTime | showDate }} | {{ ticket().showtime.showDateTime | showTime }}
          </span>
          <span class="where">{{ ticket().showtime.theater.name }}</span>
          <span class="fmt">{{ ticket().showtime.format }} · {{ ticket().showtime.language }}</span>
        </span>
      </span>

      <span class="foot">
        <span class="seats">
          @for (seat of ticket().seatNumbers.slice(0, maxChips); track seat) {
            <span class="seat">{{ seat }}</span>
          }
          @if (ticket().seatNumbers.length > maxChips) {
            <span class="seat more">+{{ ticket().seatNumbers.length - maxChips }}</span>
          }
        </span>

        <span class="bottom">
          <span class="mode" [attr.data-mode]="mode()">{{ modeLabel() }}</span>
          <span class="price">
            @if (ticket().originalPrice > ticket().resalePrice) {
              <s>{{ ticket().originalPrice | inr }}</s>
            }
            <strong>{{ ticket().resalePrice | inr }}</strong>
          </span>
        </span>
      </span>
    </a>
  `,
  styles: `
    :host { display: block; }

    .tile {
      display: flex;
      flex-direction: column;
      height: 100%;
      border: 1px solid var(--border);
      border-radius: var(--radius);
      background: var(--surface);
      color: var(--text);
      text-decoration: none;
      overflow: hidden;
      transition: border-color 120ms, box-shadow 120ms;
    }

    .tile:hover {
      border-color: var(--text-muted);
      box-shadow: var(--shadow);
      text-decoration: none;
    }

    .tile:focus-visible {
      outline: 2px solid var(--accent);
      outline-offset: 2px;
    }

    .head {
      flex: 1;
      display: grid;
      grid-template-columns: auto minmax(0, 1fr);
      gap: 14px;
      align-items: start;
      padding: 14px 16px;
      --thumb-w: 68px;
      --thumb-h: 96px;
    }

    .info {
      display: flex;
      flex-direction: column;
      gap: 3px;
      min-width: 0;
    }

    .title {
      display: flex;
      align-items: center;
      gap: 8px;
      min-width: 0;
    }

    .movie {
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-size: 1.05rem;
      line-height: 1.3;
    }

    .off {
      flex: none;
      padding: 2px 9px;
      border-radius: 999px;
      background: var(--success-soft);
      color: var(--success);
      font-size: 0.7rem;
      font-weight: 700;
      white-space: nowrap;
    }

    .when {
      margin-top: 4px;
      font-size: 0.9rem;
      font-weight: 600;
    }

    .where,
    .fmt {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .where { color: var(--text-soft); font-size: 0.85rem; }
    .fmt { color: var(--text-muted); font-size: 0.8rem; }

    .foot {
      display: flex;
      flex-direction: column;
      gap: 10px;
      padding: 12px 16px 14px;
      border-top: 1px solid var(--border-soft);
    }

    .seats {
      display: flex;
      flex-wrap: nowrap;
      gap: 5px;
      overflow: hidden;
    }

    .seat {
      padding: 2px 10px;
      border: 1px solid var(--border);
      border-radius: 999px;
      background: var(--surface-2);
      color: var(--text-soft);
      font-size: 0.78rem;
      font-weight: 700;
      line-height: 1.4;
      white-space: nowrap;
    }

    .seat.more {
      background: var(--surface-3);
      color: var(--text-muted);
    }

    .bottom {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }

    .mode {
      padding: 2px 10px;
      border-radius: 999px;
      background: var(--surface-3);
      color: var(--text-soft);
      font-size: 0.72rem;
      font-weight: 700;
      line-height: 1.4;
      white-space: nowrap;
    }

    .mode[data-mode='single'] { background: var(--brand-soft); color: var(--text); }
    .mode[data-mode='partial'] { background: var(--info-soft); color: var(--info); }
    .mode[data-mode='whole'] { background: var(--warning-soft); color: var(--warning); }

    .price {
      display: flex;
      align-items: baseline;
      gap: 8px;
    }

    .price s { color: var(--text-muted); font-size: 0.82rem; }
    .price strong { font-size: 1.35rem; line-height: 1.1; }
  `,
})
export class ResaleCardComponent {
  readonly ticket = input.required<ResaleTicketDetail>();
  protected readonly maxChips = MAX_SEAT_CHIPS;

  protected mode(): 'single' | 'partial' | 'whole' {
    const ticket = this.ticket();
    return ticket.seatNumbers.length < 2 ? 'single' : ticket.allowPartial ? 'partial' : 'whole';
  }

  protected modeLabel(): string {
    return { single: 'Single seat', partial: 'Seat by seat', whole: 'All together' }[this.mode()];
  }
}
