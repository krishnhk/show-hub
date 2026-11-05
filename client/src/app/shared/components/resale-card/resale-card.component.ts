import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { ResaleTicketDetail } from '../../../core/models/resale.model';
import { InrPipe } from '../../pipes/inr.pipe';
import { ShowDatePipe, ShowTimePipe } from '../../pipes/date.pipes';

/** One spare ticket on the resale marketplace: the show, the seats, who sells it and what it costs. */
@Component({
  selector: 'app-resale-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, InrPipe, ShowDatePipe, ShowTimePipe],
  template: `
    <article class="ticket">
      <a class="main" [routerLink]="['/resale', ticket().id]" [attr.aria-label]="ticket().showtime.movie.title">
        <div class="info">

          <p class="venue">{{ ticket().showtime.theater.name }} <span>· {{ ticket().showtime.theater.city }}</span></p>

          <p class="when">
            <b>{{ ticket().showtime.showDateTime | showDate }}</b>
            <span>{{ ticket().showtime.showDateTime | showTime }}</span>
            <span class="dot" aria-hidden="true">·</span>
            <span>{{ ticket().showtime.language }}</span>
            <span class="dot" aria-hidden="true">·</span>
            <span>{{ ticket().showtime.format }}</span>
          </p>

          <div class="seats">
            @for (seat of ticket().seatNumbers; track seat) {
              <span class="seat">{{ seat }}</span>
            }
            @if (ticket().seatNumbers.length > 1) {
              @if (ticket().allowPartial) {
                <span class="partial">Buy seat by seat</span>
              } @else {
                <span class="together">Buy all together</span>
              }
            }
          </div>
        </div>
      </a>

      <footer class="stub">
        @if (ticket().discountPercent > 0) {
          <span class="off">{{ ticket().discountPercent }}% off</span>
        }
        <div class="amount">
          @if (ticket().originalPrice > ticket().resalePrice) {
            <span class="strike">{{ ticket().originalPrice | inr }}</span>
          }
          <strong>{{ ticket().resalePrice | inr }}</strong>
        </div>
      </footer>
    </article>
  `,
  styles: `
    :host { display: block; }

    .ticket {
      display: grid;
      grid-template-columns: minmax(0, 1fr) 132px;
      border: 1px solid var(--border);
      border-radius: var(--radius);
      background: var(--surface);
      transition: border-color 120ms;
    }

    .ticket:hover { border-color: var(--text-muted); }

    .main {
      display: block;
      padding: 18px 20px;
      color: inherit;
      text-decoration: none;
    }

    .main:hover { text-decoration: none; }

    .info { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
    .info p { margin: 0; }

    .off {
      padding: 2px 10px;
      border-radius: 999px;
      background: var(--success-soft);
      color: var(--success);
      font-size: 0.74rem;
      font-weight: 700;
      white-space: nowrap;
    }

    .venue { font-size: 1.05rem; font-weight: 700; color: var(--text); }
    .venue span { font-weight: 500; color: var(--text-muted); }

    .when {
      display: flex;
      flex-wrap: wrap;
      align-items: baseline;
      gap: 2px 6px;
      font-size: 0.88rem;
      color: var(--text-soft);
    }

    .when b { font-weight: 700; color: var(--text); }
    .dot { color: var(--text-muted); }

    .seats { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; margin-top: 2px; }

    .seat {
      padding: 2px 10px;
      border: 1px solid var(--border);
      border-radius: 999px;
      background: var(--surface-2);
      color: var(--text-soft);
      font-size: 0.78rem;
      font-weight: 700;
    }

    .partial {
      padding: 2px 10px;
      border-radius: 999px;
      background: var(--info-soft);
      color: var(--info);
      font-size: 0.72rem;
      font-weight: 700;
    }

    .together {
      padding: 2px 10px;
      border-radius: 999px;
      background: var(--surface-3);
      color: var(--text-soft);
      font-size: 0.72rem;
      font-weight: 700;
    }

    .stub {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 10px;
      padding: 14px 10px;
      border-left: 2px dashed var(--border);
      text-align: center;
    }

    .amount { display: flex; flex-direction: column; align-items: center; gap: 2px; }
    .stub strong { font-family: var(--font); font-size: 1.4rem; font-weight: 700; line-height: 1.1; }
    .strike { font-size: 0.85rem; color: var(--text-muted); text-decoration: line-through; }

    @media (max-width: 560px) {
      .ticket { grid-template-columns: minmax(0, 1fr) 92px; }
      .main { padding: 10px 12px; }
      .info { gap: 3px; }
      .venue { font-size: 0.92rem; line-height: 1.25; }
      .when { font-size: 0.8rem; }
      .seats { gap: 4px; margin-top: 0; }
      .seat { padding: 1px 8px; font-size: 0.72rem; }
      .partial, .together { padding: 1px 8px; font-size: 0.68rem; }
      .stub { gap: 6px; padding: 8px 6px; }
      .stub strong { font-size: 1.15rem; }
      .strike { font-size: 0.75rem; }
      .off { padding: 1px 8px; font-size: 0.68rem; }
    }
  `,
})
export class ResaleCardComponent {
  readonly ticket = input.required<ResaleTicketDetail>();

}
