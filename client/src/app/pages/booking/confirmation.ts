import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { BOOKING_CANCEL_HOURS } from '../../core/data/booking-rules';
import { BookingDetail } from '../../core/models/booking.model';
import { BookingService } from '../../core/services/booking.service';
import { ResaleService } from '../../core/services/resale.service';
import { ToastService } from '../../core/services/toast.service';
import { WalletStore } from '../../core/services/wallet.store';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { FilmThumbComponent } from '../../shared/components/film-thumb/film-thumb.component';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { ShowDatePipe, ShowTimePipe, TimeAgoPipe } from '../../shared/pipes/date.pipes';
import { InrPipe } from '../../shared/pipes/inr.pipe';

const QR_SIZE = 21;

/** A cell is dark or light by a well-mixed hash of the code and its position, so neighbours look unrelated. */
function pseudoRandom(code: string, row: number, col: number): boolean {
  const value = `${code}:${row}:${col}`;
  let hash = 2166136261;
  for (let index = 0; index < value.length; index++) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  hash ^= hash >>> 16;
  hash = Math.imul(hash, 2246822507);
  hash ^= hash >>> 13;
  hash = Math.imul(hash, 3266489909);
  hash ^= hash >>> 16;
  return (hash >>> 0) % 100 < 46;
}

function isFinderPixel(row: number, col: number): boolean {
  const corners: [number, number][] = [
    [0, 0],
    [0, QR_SIZE - 7],
    [QR_SIZE - 7, 0],
  ];
  return corners.some(([rowStart, colStart]) => {
    const deltaRow = row - rowStart;
    const deltaCol = col - colStart;
    if (deltaRow < 0 || deltaRow > 6 || deltaCol < 0 || deltaCol > 6) {
      return false;
    }
    return Math.max(Math.abs(deltaRow - 3), Math.abs(deltaCol - 3)) !== 2;
  });
}

@Component({
  selector: 'app-confirmation',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    ConfirmDialogComponent,
    LoadingSpinnerComponent,
    EmptyStateComponent,
    FilmThumbComponent,
    ShowDatePipe,
    ShowTimePipe,
    TimeAgoPipe,
    InrPipe,
  ],
  templateUrl: './confirmation.html',
  styleUrl: './confirmation.css',
})
export class ConfirmationComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly bookingService = inject(BookingService);
  private readonly wallet = inject(WalletStore);
  private readonly toast = inject(ToastService);
  private readonly resale = inject(ResaleService);

  /** What the wallet covered, read from the booking itself so it survives a page refresh. */
  readonly walletUsed = computed(() => this.booking()?.walletPaid ?? 0);
  readonly cardPaid = computed(() => {
    const current = this.booking();
    return current ? Math.max(0, Math.round((current.totalAmount - this.walletUsed()) * 100) / 100) : 0;
  });

  readonly cancelHours = BOOKING_CANCEL_HOURS;
  readonly cancelOpen = signal(false);
  readonly delistOpen = signal(false);
  readonly delisting = signal(false);
  readonly cancelling = signal(false);

  /** The show for this ticket has already started. */
  readonly started = computed(() => {
    const current = this.booking();
    return !!current && new Date(current.showtime.showDateTime).getTime() <= Date.now();
  });

  /** Seats that are still the user's to sell: confirmed, not listed or sold, show not started. */
  readonly canSell = computed(() => {
    const current = this.booking();
    return !!current && current.status === 'Completed' && current.unlistedSeats.length > 0 && !this.started();
  });

  /** Cancelling stays open until BOOKING_CANCEL_HOURS before the show. */
  readonly canCancel = computed(() => {
    const current = this.booking();
    return (
      !!current &&
      current.status === 'Completed' &&
      new Date(current.showtime.showDateTime).getTime() - Date.now() >= BOOKING_CANCEL_HOURS * 3600 * 1000
    );
  });

  readonly cancellable = computed(() => this.booking()?.status === 'Completed' && !this.started());

  /** What the ticket is right now, which sets its colour, its status chip and what the QR code says. */
  readonly state = computed<'upcoming' | 'listed' | 'past' | 'cancelled'>(() => {
    const current = this.booking();
    if (current?.status === 'Cancelled') {
      return 'cancelled';
    }
    if (this.started()) {
      return 'past';
    }
    return current?.isListed ? 'listed' : 'upcoming';
  });

  /** Listed seats can be taken off the market from here until the show starts. */
  readonly canDelist = computed(() => {
    const current = this.booking();
    return !!current && current.isListed && current.resaleListingId !== null && !this.started();
  });

  readonly statusLabel = computed(() => {
    switch (this.state()) {
      case 'cancelled':
        return 'Cancelled';
      case 'past':
        return 'Completed';
      case 'listed':
        return 'Listed for sale';
      default:
        return 'Confirmed';
    }
  });

  /** Set by checkout right after paying. Opening the ticket later, from My Tickets or a reload, never has it. */
  private readonly arrivedFromCheckout = this.router.getCurrentNavigation()?.extras.state?.['justBooked'] === true;

  /** Show "Booking confirmed" on that first view only. */
  readonly justBooked = computed(() => this.arrivedFromCheckout && this.booking()?.status === 'Completed');

  /** Seats of this booking that are no longer the user's own: on resale or already sold. */
  readonly elsewhere = computed(() => {
    const current = this.booking();
    if (!current || current.status !== 'Completed') {
      return [];
    }
    return current.seatNumbers.filter((seat) => !current.unlistedSeats.includes(seat));
  });

  readonly copied = signal(false);

  readonly bookingId = Number(this.route.snapshot.paramMap.get('id'));

  readonly booking = signal<BookingDetail | null>(null);
  readonly loading = signal(true);
  readonly notFound = signal(false);

  readonly qrCells = computed<boolean[]>(() => {
    const code = this.booking()?.qrCode ?? 'THIRAIHUB';
    const cells: boolean[] = [];
    for (let row = 0; row < QR_SIZE; row++) {
      for (let col = 0; col < QR_SIZE; col++) {
        cells.push(isFinderPixel(row, col) || pseudoRandom(code, row, col));
      }
    }
    return cells;
  });

  ngOnInit(): void {
    if (this.arrivedFromCheckout) {
      // Drop the flag from the history entry so going back to this page or reloading it does not repeat the banner.
      history.replaceState({ ...history.state, justBooked: false }, '');
    }
    this.wallet.refresh();
    this.bookingService.getBooking(this.bookingId).subscribe({
      next: (response) => {
        this.booking.set(response.booking);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.notFound.set(true);
      },
    });
  }

  askCancel(): void {
    this.cancelOpen.set(true);
  }

  closeCancel(): void {
    this.cancelOpen.set(false);
  }

  confirmCancel(): void {
    if (this.cancelling()) {
      return;
    }
    this.cancelling.set(true);
    this.bookingService.cancelBooking(this.bookingId).subscribe({
      next: (response) => {
        this.cancelling.set(false);
        this.cancelOpen.set(false);
        this.wallet.refresh();
        const toWallet = response.refundToWallet ?? 0;
        const toCard = response.refundToCard ?? 0;
        if (toWallet > 0 || toCard > 0) {
          const parts: string[] = [];
          if (toWallet > 0) {
            parts.push(`${this.money(toWallet)} back to your wallet`);
          }
          if (toCard > 0) {
            parts.push(`${this.money(toCard)} to your card in 5-7 days`);
          }
          this.toast.success(`Booking cancelled. ${parts.join(', ')}.`);
        } else {
          this.toast.success(response.message);
        }
        this.bookingService.getBooking(this.bookingId).subscribe({ next: (r) => this.booking.set(r.booking) });
      },
      error: () => {
        this.cancelling.set(false);
        this.cancelOpen.set(false);
      },
    });
  }

  private money(value: number): string {
    return value.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
  }

  /** Whether a seat is still the user's own, rather than on resale or sold. */
  isMine(seat: string): boolean {
    const current = this.booking();
    return !!current && (current.status !== 'Completed' || current.unlistedSeats.includes(seat));
  }

  copyCode(): void {
    const code = this.booking()?.confirmationCode;
    if (!code) {
      return;
    }
    navigator.clipboard?.writeText(code).then(
      () => {
        this.copied.set(true);
        setTimeout(() => this.copied.set(false), 1800);
      },
      () => this.toast.error('Could not copy the code. Select it and copy it by hand.'),
    );
  }

  askDelist(): void {
    this.delistOpen.set(true);
  }

  closeDelist(): void {
    this.delistOpen.set(false);
  }

  confirmDelist(): void {
    const id = this.booking()?.resaleListingId;
    if (!id || this.delisting()) {
      return;
    }
    this.delisting.set(true);
    this.resale.delistTicket(id).subscribe({
      next: () => {
        this.delisting.set(false);
        this.delistOpen.set(false);
        this.toast.success('Listing removed. The QR code works again.');
        this.bookingService.getBooking(this.bookingId).subscribe({ next: (r) => this.booking.set(r.booking) });
      },
      error: () => {
        this.delisting.set(false);
        this.delistOpen.set(false);
        this.bookingService.getBooking(this.bookingId).subscribe({ next: (r) => this.booking.set(r.booking) });
      },
    });
  }
}
