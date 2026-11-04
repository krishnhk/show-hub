import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { BOOKING_COMMISSION_PER_TICKET } from '../../core/models/booking.model';
import { Seat, SeatMap, ShowtimeWithRefs } from '../../core/models/catalog.model';
import { BookingService } from '../../core/services/booking.service';
import { CatalogService } from '../../core/services/catalog.service';
import { WalletStore } from '../../core/services/wallet.store';
import { ToastService } from '../../core/services/toast.service';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { ShowDatePipe, ShowTimePipe } from '../../shared/pipes/date.pipes';
import { InrPipe } from '../../shared/pipes/inr.pipe';

@Component({
  selector: 'app-checkout',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    LoadingSpinnerComponent,
    ShowDatePipe,
    ShowTimePipe,
    InrPipe,
  ],
  templateUrl: './checkout.html',
  styleUrl: './checkout.css',
})
export class CheckoutComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly catalog = inject(CatalogService);
  private readonly bookingService = inject(BookingService);
  private readonly toast = inject(ToastService);
  protected readonly wallet = inject(WalletStore);

  readonly showtimeId = Number(this.route.snapshot.paramMap.get('showtimeId'));

  readonly showtime = signal<ShowtimeWithRefs | null>(null);
  readonly seatMap = signal<SeatMap | null>(null);
  readonly seatNumbers = signal<string[]>([]);
  readonly loading = signal(true);
  readonly paying = signal(false);
  readonly paymentError = signal<string | null>(null);

  readonly quantity = computed(() => this.selectedSeats().length);

  readonly selectedSeats = computed<Seat[]>(() => {
    const map = new Map<string, Seat>();
    this.seatMap()?.rows.forEach((row) => row.seats.forEach((seat) => map.set(seat.id, seat)));
    return this.seatNumbers()
      .map((id) => map.get(id))
      .filter((seat): seat is Seat => !!seat);
  });

  readonly seatSubtotal = computed(() =>
    this.selectedSeats().reduce((total, seat) => total + seat.price, 0),
  );

  readonly commission = computed(() => this.quantity() * BOOKING_COMMISSION_PER_TICKET);

  readonly total = computed(() => this.seatSubtotal() + this.commission());

  /** The user's own choice; the wallet is only used when it actually holds money. */
  readonly walletChoice = signal(true);
  readonly useWallet = computed(() => this.walletChoice() && this.wallet.balance() > 0);
  readonly walletPortion = computed(() =>
    this.useWallet() ? Math.min(this.wallet.balance(), this.total()) : 0,
  );
  readonly cardPortion = computed(() => Math.max(0, this.total() - this.walletPortion()));
  readonly walletCoversAll = computed(() => this.total() > 0 && this.cardPortion() === 0);

  toggleWallet(): void {
    this.walletChoice.update((value) => !value);
  }

  ngOnInit(): void {
    this.wallet.refresh();
    const seatsParam = this.route.snapshot.queryParamMap.get('seats');
    const seats = (seatsParam ?? '')
      .split(',')
      .map((seat) => seat.trim())
      .filter((seat) => seat.length > 0);

    if (seats.length === 0) {
      this.router.navigate(['/book', this.showtimeId, 'seats']);
      return;
    }

    this.seatNumbers.set(seats);

    this.catalog.getShowtime(this.showtimeId).subscribe({
      next: (response) => {
        this.showtime.set(response.showtime);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.paymentError.set('We could not load this show. Please pick another showtime.');
      },
    });

    this.catalog.getSeats(this.showtimeId).subscribe({
      next: (response) => {
        this.seatMap.set(response.seatMap);
      },
      error: () => {
        this.loading.set(false);
        this.paymentError.set('We could not load the seat prices. Please try again.');
      },
    });
  }

  changePaymentMethod(): void {
    this.toast.info('Card management is available from Settings.');
  }

  pay(): void {
    if (this.paying() || !this.seatNumbers().length) {
      return;
    }

    this.paying.set(true);
    this.paymentError.set(null);

    this.bookingService
      .createBooking({
        showtimeId: this.showtimeId,
        seatNumbers: this.seatNumbers(),
        quantity: this.seatNumbers().length,
        useWallet: this.useWallet(),
      })
      .subscribe({
        next: (response) => {
          this.paying.set(false);
          this.wallet.refresh();
          this.toast.success('Payment successful. Your tickets are confirmed.');
          const walletUsed = response.walletUsed ?? this.walletPortion();
          const amountDue = response.amountDue ?? Math.max(0, response.totalAmount - walletUsed);
          this.router.navigate(['/bookings', response.bookingId, 'confirmation'], {
            state: { walletUsed, amountDue, justBooked: true },
          });
        },
        error: (error: HttpErrorResponse) => {
          this.paying.set(false);
          const payload = error.error as { message?: string } | null;
          this.paymentError.set(payload?.message ?? 'Payment failed. Please try again.');
        },
      });
  }
}
