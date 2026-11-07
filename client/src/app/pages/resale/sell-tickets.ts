import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { LISTING_CUTOFF_MINUTES } from '../../core/data/resale-rules';
import { BookingDetail } from '../../core/models/booking.model';
import { BookingService } from '../../core/services/booking.service';
import { FilmThumbComponent } from '../../shared/components/film-thumb/film-thumb.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { ShowDatePipe, ShowTimePipe } from '../../shared/pipes/date.pipes';
import { InrPipe } from '../../shared/pipes/inr.pipe';

/** Step one of selling: the seller's upcoming bookings. Picking one opens its own page. */
@Component({
  selector: 'app-sell-tickets',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    LoadingSpinnerComponent,
    EmptyStateComponent,
    FilmThumbComponent,
    ShowDatePipe,
    ShowTimePipe,
    InrPipe,
  ],
  templateUrl: './sell-tickets.html',
  styleUrl: './sell-tickets.css',
})
export class SellTicketsComponent implements OnInit {
  private readonly bookingService = inject(BookingService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly bookings = signal<BookingDetail[]>([]);
  readonly loading = signal(true);
  /** How long before a show its tickets can no longer be listed. */
  readonly cutoffMinutes = LISTING_CUTOFF_MINUTES;

  /** Sellable bookings, the show that starts soonest first since its seats lose value fastest. */
  readonly eligibleBookings = computed(() =>
    this.bookings()
      .filter(
        (booking) =>
          booking.status === 'Completed' &&
          booking.unlistedSeats.length > 0 &&
          // a show closer than the listing cutoff cannot be put up for resale, so its ticket is not offered here
          new Date(booking.showtime.showDateTime).getTime() - Date.now() >= LISTING_CUTOFF_MINUTES * 60000,
      )
      .sort(
        (a, b) => new Date(a.showtime.showDateTime).getTime() - new Date(b.showtime.showDateTime).getTime(),
      ),
  );

  /** "Starts in 3 hours" style label for the picker. */
  startsIn(booking: BookingDetail): string {
    const minutes = Math.max(0, Math.round((new Date(booking.showtime.showDateTime).getTime() - Date.now()) / 60000));
    if (minutes < 60) {
      return `Starts in ${minutes} min`;
    }
    const hours = Math.round(minutes / 60);
    if (hours < 48) {
      return `Starts in ${hours} hour${hours === 1 ? '' : 's'}`;
    }
    return `Starts in ${Math.round(hours / 24)} days`;
  }

  /** Whether the show starts inside the listing cutoff, too late to resell. */
  isTooClose(booking: BookingDetail): boolean {
    return new Date(booking.showtime.showDateTime).getTime() - Date.now() < LISTING_CUTOFF_MINUTES * 60000;
  }

  /** Whether the show is close enough that a quick sale matters. */
  isSoon(booking: BookingDetail): boolean {
    return new Date(booking.showtime.showDateTime).getTime() - Date.now() < 24 * 3600 * 1000;
  }

  /** The most the seller can take home for the seats still open, after the 5% fee. */
  recoverable(booking: BookingDetail): number {
    const paid = booking.unlistedSeatDetails.reduce((sum, seat) => sum + seat.paid, 0);
    return Math.round(paid * 0.95);
  }

  ngOnInit(): void {
    // Old links such as /sell?bookingId=7 go straight to that booking's page.
    const bookingId = Number(this.route.snapshot.queryParamMap.get('bookingId'));
    if (Number.isFinite(bookingId) && bookingId > 0) {
      void this.router.navigate(['/resale/sell/booking', bookingId], { replaceUrl: true });
      return;
    }

    this.bookingService.getBookings('All').subscribe({
      next: (response) => {
        this.bookings.set(response.bookings);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  /** Opens the booking's selling page. */
  open(booking: BookingDetail): void {
    if (!this.isTooClose(booking)) {
      void this.router.navigate(['/resale/sell/booking', booking.id]);
    }
  }
}
