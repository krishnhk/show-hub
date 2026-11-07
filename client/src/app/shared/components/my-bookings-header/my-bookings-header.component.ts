import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

/** The top of the My bookings area: the title, and under it the tabs for the tickets and the theatres they were booked at. */
@Component({
  selector: 'app-my-bookings-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <header class="head">
      <h1>My bookings</h1>

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

    h1 {
      margin: 0;
    }

    @media (max-width: 560px) {
      :host {
        margin-bottom: 16px;
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
export class MyBookingsHeaderComponent {}
