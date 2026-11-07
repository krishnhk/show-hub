import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { BookingDetail, ShareSeatsResponse } from '../../core/models/booking.model';
import { BookingService } from '../../core/services/booking.service';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { ShowSummaryComponent } from '../../shared/components/show-summary/show-summary.component';

/**
 * Gives some seats of a booking to someone else. The seats move into a new booking on that person's account, found
 * by mobile number, and the owner keeps at least one seat.
 */
@Component({
  selector: 'app-share-seats',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, LoadingSpinnerComponent, EmptyStateComponent, ShowSummaryComponent],
  templateUrl: './share-seats.html',
  styleUrl: './share-seats.css',
})
export class ShareSeatsComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly bookings = inject(BookingService);

  readonly bookingId = Number(this.route.snapshot.paramMap.get('bookingId'));

  readonly booking = signal<BookingDetail | null>(null);
  readonly loading = signal(true);
  readonly notFound = signal(false);

  /** Seats picked to give away. */
  readonly chosen = signal<string[]>([]);
  readonly phone = signal('');
  readonly sharing = signal(false);
  readonly error = signal<string | null>(null);
  readonly result = signal<ShareSeatsResponse | null>(null);

  readonly started = computed(() => {
    const current = this.booking();
    return !current || new Date(current.showtime.showDateTime).getTime() <= Date.now();
  });

  /** Seats that can still move: not on the resale market. */
  readonly shareable = computed(() => this.booking()?.unlistedSeats ?? []);

  /** Sharing needs a seat to give and a seat to keep. */
  readonly canShare = computed(() => {
    const current = this.booking();
    return (
      !!current &&
      current.status === 'Completed' &&
      !this.started() &&
      this.shareable().length > 0 &&
      current.seatNumbers.length >= 2
    );
  });

  /** The ten digits of the number, allowing for a typed +91 or a leading 0. */
  readonly digits = computed(() => {
    const all = this.phone().replace(/\D/g, '');
    if (all.length === 12 && all.startsWith('91')) {
      return all.slice(2);
    }
    return all.length === 11 && all.startsWith('0') ? all.slice(1) : all;
  });
  readonly phoneOk = computed(() => this.digits().length === 10);
  readonly keepsASeat = computed(() => {
    const current = this.booking();
    return !!current && this.chosen().length < current.seatNumbers.length;
  });
  readonly ready = computed(() => this.chosen().length > 0 && this.keepsASeat() && this.phoneOk() && !this.sharing());

  /** What stops the button, in words, once the buyer has started picking. */
  readonly hint = computed(() => {
    if (this.chosen().length === 0) {
      return 'Tap the seats you want to give away.';
    }
    if (!this.keepsASeat()) {
      return 'Keep at least one seat in this booking.';
    }
    return null;
  });

  ngOnInit(): void {
    this.bookings.getBooking(this.bookingId).subscribe({
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

  toggle(seat: string): void {
    if (!this.shareable().includes(seat)) {
      return;
    }
    this.error.set(null);
    this.chosen.update((seats) => (seats.includes(seat) ? seats.filter((item) => item !== seat) : [...seats, seat]));
  }

  setPhone(value: string): void {
    this.error.set(null);
    this.phone.set(value.replace(/[^\d+\s-]/g, ''));
  }

  share(): void {
    if (!this.ready()) {
      return;
    }
    this.sharing.set(true);
    this.error.set(null);
    this.bookings.shareSeats(this.bookingId, { seatNumbers: this.chosen(), phoneNumber: this.phone() }).subscribe({
      next: (response) => {
        this.sharing.set(false);
        this.result.set(response);
      },
      error: (failure: HttpErrorResponse) => {
        this.sharing.set(false);
        const payload = failure.error as { message?: string } | null;
        this.error.set(payload?.message ?? 'We could not share these seats. Please try again.');
      },
    });
  }
}
