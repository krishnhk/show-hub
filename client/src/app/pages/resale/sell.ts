import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';

import { MyListingsStore } from '../../core/services/my-listings.store';
import { WalletStore } from '../../core/services/wallet.store';
import { ResaleTabsComponent } from '../../shared/components/resale-tabs/resale-tabs.component';
import { InrPipe } from '../../shared/pipes/inr.pipe';

/** The heading and subtitle a selling tab shows, taken from its route. */
export interface SellPage {
  heading: string;
  lede: string;
}

/** Shell for the selling tabs under /resale/sell: the tab's own heading, the seller's wallet and the tabs. */
@Component({
  selector: 'app-sell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, RouterLink, InrPipe, ResaleTabsComponent],
  templateUrl: './sell.html',
  styleUrl: './sell.css',
})
export class SellComponent implements OnInit {
  private readonly router = inject(Router);
  readonly store = inject(MyListingsStore);
  readonly wallet = inject(WalletStore);

  /** The heading of whichever selling tab is showing. */
  readonly page = signal<SellPage>(this.readPage());

  constructor() {
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => this.page.set(this.readPage()));
  }

  ngOnInit(): void {
    this.store.refresh();
    this.wallet.refresh();
  }

  /** The deepest active route is the selling tab that is showing; its data holds the heading and subtitle. */
  private readPage(): SellPage {
    let route = this.router.routerState.snapshot.root;
    while (route.firstChild) {
      route = route.firstChild;
    }
    const data = route.data as Partial<SellPage>;
    return { heading: data.heading ?? 'Sell your tickets', lede: data.lede ?? '' };
  }
}
