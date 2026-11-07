import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink, RouterLinkActive } from '@angular/router';

/**
 * The top of the My bookings area: the heading and subtitle of the tab showing (taken from its route), and under
 * them the tabs for the tickets and the theatres they were booked at.
 */
@Component({
  selector: 'app-my-bookings-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <header class="head">
      <div class="title">
        <h1>{{ heading }}</h1>
        <p class="lede">{{ lede }}</p>
      </div>

      <nav class="seg-tabs" aria-label="My bookings">
        <a routerLink="/my-bookings" routerLinkActive="on" ariaCurrentWhenActive="page" [routerLinkActiveOptions]="{ exact: true }">Tickets</a>
        <a routerLink="/my-bookings/theatres" routerLinkActive="on" ariaCurrentWhenActive="page">Theatres</a>
      </nav>
    </header>
  `,
  styles: `
    :host {
      display: block;
      max-width: 1120px;
      margin: 0 auto 22px;
    }

    .head {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 14px;
    }

    .title {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    h1 {
      margin: 0;
    }

    .lede {
      margin: 0;
      font-size: 0.92rem;
      color: var(--text-muted);
    }

    @media (max-width: 560px) {
      :host {
        margin-bottom: 16px;
      }

      .lede {
        display: none;
      }

      .head {
        gap: 12px;
      }

      .seg-tabs {
        max-width: none;
      }
    }
  `,
})
export class MyBookingsHeaderComponent {
  /** The tab's heading and subtitle, from the route of the page that holds this header. */
  private readonly data = inject(ActivatedRoute).snapshot.data as { heading?: string; lede?: string };
  readonly heading = this.data.heading ?? 'My bookings';
  readonly lede = this.data.lede ?? '';
}
