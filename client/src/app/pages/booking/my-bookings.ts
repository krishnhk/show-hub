import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { BookingDetail } from '../../core/models/booking.model';
import { BookingService } from '../../core/services/booking.service';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { FilmThumbComponent } from '../../shared/components/film-thumb/film-thumb.component';
import { MyBookingsHeaderComponent } from '../../shared/components/my-bookings-header/my-bookings-header.component';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { ShowDatePipe, ShowTimePipe } from '../../shared/pipes/date.pipes';

type TicketState = 'upcoming' | 'listed' | 'cancelled' | 'past';

/**
 * Every booking of the signed-in user, the latest booked first. Each ticket shows when its show starts.
 * Opening a ticket shows the ticket itself, where selling and cancelling live.
 */
@Component({
  selector: 'app-my-bookings',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    MyBookingsHeaderComponent,
    FilmThumbComponent,
    LoadingSpinnerComponent,
    EmptyStateComponent,
    ShowDatePipe,
    ShowTimePipe,
  ],
  templateUrl: './my-bookings.html',
  styleUrl: './my-bookings.css',
})
export class MyBookingsComponent implements OnInit {
  private readonly bookingService = inject(BookingService);

  readonly bookings = signal<BookingDetail[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  /** Tickets whose show is still to start, the latest booked first. */
  readonly activeList = computed(() =>
    this.bookings()
      .filter((booking) => this.isActive(booking))
      .sort((a, b) => this.bookedOf(b) - this.bookedOf(a)),
  );

  /** Cancelled bookings and shows already over, the latest booked first. */
  readonly pastList = computed(() =>
    this.bookings()
      .filter((booking) => !this.isActive(booking))
      .sort((a, b) => this.bookedOf(b) - this.bookedOf(a)),
  );

  /** Past tickets stay folded away; each click on the link brings in the next page of them. */
  readonly pastShown = signal(0);

  private readonly pastPage = 10;

  readonly shown = computed(() => [...this.activeList(), ...this.pastList().slice(0, this.pastShown())]);

  /** Whether there are past tickets still folded away. */
  readonly hasMorePast = computed(() => this.pastList().length > this.pastShown());

  showMorePast(): void {
    this.pastShown.update((count) => count + this.pastPage);
  }

  ngOnInit(): void {
    this.load();
  }

  /** Where the ticket stands: drives the card's colored edge and the status tag. */
  state(booking: BookingDetail): TicketState {
    if (booking.status === 'Cancelled') {
      return 'cancelled';
    }
    if (this.startOf(booking) <= Date.now()) {
      return 'past';
    }
    return booking.isListed ? 'listed' : 'upcoming';
  }

  /** The status written on the card's tag. */
  statusLabel(booking: BookingDetail): string {
    switch (this.state(booking)) {
      case 'cancelled':
        return 'Cancelled';
      case 'past':
        return 'Completed';
      case 'listed':
        return 'Listed for sale';
      default:
        return 'Confirmed';
    }
  }

  private isActive(booking: BookingDetail): boolean {
    return booking.status === 'Completed' && this.startOf(booking) > Date.now();
  }

  private startOf(booking: BookingDetail): number {
    return new Date(booking.showtime.showDateTime).getTime();
  }

  private bookedOf(booking: BookingDetail): number {
    return new Date(booking.bookedAt).getTime();
  }

  private load(): void {
    this.loading.set(true);
    this.error.set(null);

    this.bookingService.getBookings('All').subscribe({
      next: (response) => {
        this.bookings.set(response.bookings);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.error.set('We could not load your tickets right now. Please try again.');
      },
    });
  }
}
