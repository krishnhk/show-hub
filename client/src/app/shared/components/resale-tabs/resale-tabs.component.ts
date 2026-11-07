import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';
import { MyListingsStore } from '../../../core/services/my-listings.store';

/**
 * The three tabs of the resale section: the marketplace, selling a booking, and the listings already made.
 * Shown to a signed-in visitor, since selling needs an account.
 */
@Component({
  selector: 'app-resale-tabs',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive],
  template: `
    @if (auth.isLoggedIn()) {
      <nav class="seg-tabs resale-tabs" aria-label="Resale">
        <a routerLink="/resale" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">Marketplace</a>
        <a routerLink="/resale/sell" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">Ready to sell</a>
        <a routerLink="/resale/sell/listings" routerLinkActive="active">
          Your listings
          <span class="tab-count">{{ store.stats().active }}</span>
        </a>
      </nav>
    }
  `,
  styles: `
    .resale-tabs {
      max-width: 520px;
      margin-bottom: 18px;
    }

    .tab-count {
      min-width: 22px;
      padding: 1px 7px;
      border-radius: 999px;
      background: var(--surface-3);
      color: var(--text-soft);
      font-size: 0.78rem;
      text-align: center;
    }

    /* Phones: three tabs share the width, so each one is narrower and its label stays on one line */
    @media (max-width: 560px) {
      .resale-tabs { max-width: none; }
      .resale-tabs a {
        min-width: 0;
        padding: 8px 4px;
        font-size: 0.8rem;
        white-space: nowrap;
      }
      .tab-count { min-width: 18px; padding: 1px 5px; font-size: 0.7rem; }
    }
  `,
})
export class ResaleTabsComponent implements OnInit {
  readonly auth = inject(AuthService);
  readonly store = inject(MyListingsStore);

  ngOnInit(): void {
    if (this.auth.isLoggedIn()) {
      this.store.refresh();
    }
  }
}
