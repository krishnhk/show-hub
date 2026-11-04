import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { timer } from 'rxjs';

import { ResaleTransaction } from '../../core/models/resale.model';
import { AuthService } from '../../core/services/auth.service';
import { WalletStore } from '../../core/services/wallet.store';
import { ResaleService } from '../../core/services/resale.service';
import { ToastService } from '../../core/services/toast.service';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { ShowDatePipe, ShowTimePipe } from '../../shared/pipes/date.pipes';
import { InrPipe } from '../../shared/pipes/inr.pipe';

@Component({
  selector: 'app-resale-checkout',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    LoadingSpinnerComponent,
    EmptyStateComponent,
    ShowDatePipe,
    ShowTimePipe,
    InrPipe,
  ],
  templateUrl: './resale-checkout.html',
  styleUrl: './resale-checkout.css',
})
export class ResaleCheckoutComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly resale = inject(ResaleService);
  private readonly toast = inject(ToastService);
  private readonly auth = inject(AuthService);
  protected readonly wallet = inject(WalletStore);
  private readonly destroyRef = inject(DestroyRef);

  readonly transactionId = Number(this.route.snapshot.paramMap.get('transactionId'));

  readonly transaction = signal<ResaleTransaction | null>(null);
  readonly loading = signal(true);
  readonly notFound = signal(false);
  readonly paying = signal(false);
  readonly paid = signal(false);

  /** The buyer's new booking, carried over from the purchase; falls back to My Bookings. */
  readonly bookingId = signal<number | null>(
    (this.router.getCurrentNavigation()?.extras.state?.['bookingId'] as number | undefined) ??
      (history.state?.['bookingId'] as number | undefined) ??
      null,
  );
  readonly ticketsLink = computed(() => {
    const id = this.bookingId();
    return id ? ['/bookings', id, 'confirmation'] : ['/my-bookings'];
  });

  /** The wallet share applied when the purchase was created; the rest is paid by card/UPI. */
  readonly walletUsed = computed(() => this.transaction()?.walletPaid ?? 0);
  readonly amountDue = computed(() => {
    const current = this.transaction();
    return current ? Math.max(0, Math.round((current.totalBuyerPays - this.walletUsed()) * 100) / 100) : 0;
  });
  readonly walletCoversAll = computed(() => !!this.transaction() && this.amountDue() === 0);

  /** The API rejects buying your own listing; the page says so up front. */
  readonly isOwnListing = computed(() => {
    const current = this.transaction();
    const me = this.auth.user();
    return !!current && !!me && current.sellerId === me.id;
  });

  ngOnInit(): void {
    this.wallet.refresh();
    this.resale.getTransactions().subscribe({
      next: (response) => {
        const found =
          response.transactions.find((item) => item.id === this.transactionId) ?? null;
        this.transaction.set(found);
        this.notFound.set(!found);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.notFound.set(true);
      },
    });
  }

  pay(): void {
    const transaction = this.transaction();
    if (!transaction || this.paying() || this.paid() || this.isOwnListing()) {
      return;
    }

    this.paying.set(true);
    timer(900)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.paying.set(false);
        this.paid.set(true);
        this.wallet.refresh();
        this.toast.success(`${this.formatMoney(transaction.totalBuyerPays)} paid. Your tickets are booked`);
      });
  }

  formatMoney(value: number): string {
    return value.toLocaleString('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    });
  }
}
