import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { resaleBuyerFee } from '../../core/data/resale-rules';
import { BOOKING_COMMISSION_PER_TICKET } from '../../core/models/booking.model';
import { ResaleTicketDetail } from '../../core/models/resale.model';
import { AuthService } from '../../core/services/auth.service';
import { ResaleService } from '../../core/services/resale.service';
import { WalletStore } from '../../core/services/wallet.store';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { ShowSummaryComponent } from '../../shared/components/show-summary/show-summary.component';
import { InrPipe } from '../../shared/pipes/inr.pipe';

/** What the purchase came to once it went through. */
interface PaidOrder {
  bookingId: number | null;
  total: number;
  walletUsed: number;
  amountDue: number;
}

/**
 * Checkout for a resale ticket. Nothing is bought until "Pay": the seats and the wallet choice are settled here,
 * the same way as for a theatre booking.
 */
@Component({
  selector: 'app-resale-checkout',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, LoadingSpinnerComponent, EmptyStateComponent, ShowSummaryComponent, InrPipe],
  templateUrl: './resale-checkout.html',
  styleUrl: './resale-checkout.css',
})
export class ResaleCheckoutComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly resale = inject(ResaleService);
  private readonly auth = inject(AuthService);
  protected readonly wallet = inject(WalletStore);

  readonly ticketId = Number(this.route.snapshot.paramMap.get('listingId'));
  readonly feePerTicket = BOOKING_COMMISSION_PER_TICKET;

  readonly ticket = signal<ResaleTicketDetail | null>(null);
  readonly loading = signal(true);
  readonly notFound = signal(false);
  readonly paying = signal(false);
  readonly paymentError = signal<string | null>(null);
  readonly paid = signal<PaidOrder | null>(null);

  /** Seats being bought: the ones named in the link, or every seat in the listing. */
  readonly seats = signal<string[]>([]);
  readonly seatCount = computed(() => this.seats().length);
  readonly buyingAll = computed(() => {
    const ticket = this.ticket();
    return !ticket || this.seats().length === ticket.seatNumbers.length;
  });

  readonly price = computed(() => {
    const ticket = this.ticket();
    if (!ticket) {
      return 0;
    }
    if (this.buyingAll()) {
      return ticket.resalePrice;
    }
    const total = this.seats().reduce((sum, seat) => sum + (ticket.seatPrices[seat] ?? 0), 0);
    return Math.round(total * 100) / 100;
  });
  readonly fee = computed(() => resaleBuyerFee(this.seatCount()));
  readonly total = computed(() => this.price() + this.fee());

  /** The buyer's own choice; the wallet is only used when it actually holds money. */
  readonly walletChoice = signal(true);
  readonly useWallet = computed(() => this.walletChoice() && this.wallet.balance() > 0);
  readonly walletPortion = computed(() => (this.useWallet() ? Math.min(this.wallet.balance(), this.total()) : 0));
  readonly cardPortion = computed(() => Math.max(0, Math.round((this.total() - this.walletPortion()) * 100) / 100));
  readonly walletCoversAll = computed(() => this.total() > 0 && this.cardPortion() === 0);

  readonly isOwnListing = computed(() => {
    const ticket = this.ticket();
    const me = this.auth.user();
    return !!ticket && !!me && ticket.sellerId === me.id;
  });
  readonly isAvailable = computed(() => this.ticket()?.status === 'Available');

  ngOnInit(): void {
    this.wallet.refresh();
    const wanted = (this.route.snapshot.queryParamMap.get('seats') ?? '')
      .split(',')
      .map((seat) => seat.trim())
      .filter((seat) => seat.length > 0);

    this.resale.getTicket(this.ticketId).subscribe({
      next: (response) => {
        const listing = response.ticket;
        const valid = wanted.filter((seat) => listing.seatNumbers.includes(seat));
        this.ticket.set(listing);
        this.seats.set(valid.length > 0 ? valid : [...listing.seatNumbers]);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.notFound.set(true);
      },
    });
  }

  toggleWallet(): void {
    this.walletChoice.update((value) => !value);
  }

  pay(): void {
    if (this.paying() || this.paid() || this.isOwnListing() || !this.isAvailable() || this.seatCount() === 0) {
      return;
    }

    this.paying.set(true);
    this.paymentError.set(null);
    this.resale.purchase(this.ticketId, this.buyingAll() ? undefined : this.seats(), this.useWallet()).subscribe({
      next: (response) => {
        this.paying.set(false);
        this.wallet.refresh();
        this.paid.set({
          bookingId: response.bookingId ?? null,
          total: response.totalBuyerPays,
          walletUsed: response.walletUsed ?? 0,
          amountDue: response.amountDue ?? response.totalBuyerPays,
        });
      },
      error: (error: HttpErrorResponse) => {
        this.paying.set(false);
        const payload = error.error as { message?: string } | null;
        this.paymentError.set(payload?.message ?? 'Payment failed. Please try again.');
      },
    });
  }

  ticketsLink(): string[] {
    const id = this.paid()?.bookingId;
    return id ? ['/my-bookings', String(id)] : ['/my-bookings'];
  }
}
