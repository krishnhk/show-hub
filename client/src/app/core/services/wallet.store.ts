import { Injectable, computed, inject, signal } from '@angular/core';

import { WalletEntry, WalletSummary } from '../models/user.model';
import { AuthService } from './auth.service';

/**
 * The signed-in user's wallet: available balance, and the history.
 * Anything that changes the wallet (a booking, a resale purchase, a refund) should call refresh().
 */
@Injectable({ providedIn: 'root' })
export class WalletStore {
  private readonly auth = inject(AuthService);

  readonly summary = signal<WalletSummary | null>(null);
  readonly entries = signal<WalletEntry[]>([]);

  /** Spendable now. */
  readonly balance = computed(() => this.summary()?.balance ?? 0);

  refresh(): void {
    this.auth.wallet().subscribe({ next: (summary) => this.summary.set(summary) });
    this.auth.walletEntries().subscribe({ next: (response) => this.entries.set(response.entries) });
  }
}
