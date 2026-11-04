import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';

import { WalletStore } from '../../core/services/wallet.store';
import { WalletHistoryComponent } from '../../shared/components/wallet-history/wallet-history.component';
import { InrPipe } from '../../shared/pipes/inr.pipe';

type Flow = 'all' | 'in' | 'out';

/** The signed-in user's wallet: what is available now and every credit and debit. */
@Component({
  selector: 'app-wallet',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [WalletHistoryComponent, InrPipe],
  templateUrl: './wallet.html',
  styleUrl: './wallet.css',
})
export class WalletComponent implements OnInit {
  readonly store = inject(WalletStore);

  readonly flow = signal<Flow>('all');

  /** Money that came in: resale sales and refunds. */
  readonly moneyIn = computed(() =>
    this.round(this.store.entries().filter((e) => e.type !== 'debit').reduce((sum, e) => sum + e.amount, 0)),
  );

  /** Money that went out: bookings and resale purchases paid from the wallet. */
  readonly moneyOut = computed(() =>
    this.round(this.store.entries().filter((e) => e.type === 'debit').reduce((sum, e) => sum + e.amount, 0)),
  );

  readonly tabs = computed(() => [
    { id: 'all' as const, label: 'All', count: this.store.entries().length },
    { id: 'in' as const, label: 'Money in', count: this.store.entries().filter((e) => e.type !== 'debit').length },
    { id: 'out' as const, label: 'Money out', count: this.store.entries().filter((e) => e.type === 'debit').length },
  ]);

  readonly entries = computed(() => {
    const flow = this.flow();
    return this.store
      .entries()
      .filter((entry) => (flow === 'all' ? true : flow === 'in' ? entry.type !== 'debit' : entry.type === 'debit'));
  });

  ngOnInit(): void {
    this.store.refresh();
  }

  private round(value: number): number {
    return Math.round(value * 100) / 100;
  }
}
