import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { MyListingsStore } from '../../core/services/my-listings.store';
import { WalletStore } from '../../core/services/wallet.store';
import { InrPipe } from '../../shared/pipes/inr.pipe';

/** Shell for /sell: the heading, the seller's totals and the tabs for its two child pages. */
@Component({
  selector: 'app-sell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, InrPipe],
  templateUrl: './sell.html',
  styleUrl: './sell.css',
})
export class SellComponent implements OnInit {
  readonly store = inject(MyListingsStore);
  readonly wallet = inject(WalletStore);

  ngOnInit(): void {
    this.store.refresh();
    this.wallet.refresh();
  }
}
