import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { BOOKING_COMMISSION_PER_TICKET } from '../../core/models/booking.model';
import { Seat, SeatMap, ShowtimeWithRefs } from '../../core/models/catalog.model';
import { CatalogService } from '../../core/services/catalog.service';
import { ToastService } from '../../core/services/toast.service';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { SeatMapComponent } from '../../shared/components/seat-map/seat-map.component';
import { ShowDatePipe, ShowTimePipe } from '../../shared/pipes/date.pipes';
import { InrPipe } from '../../shared/pipes/inr.pipe';

const MAX_TICKETS = 8;

@Component({
  selector: 'app-seat-selection',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    SeatMapComponent,
    LoadingSpinnerComponent,
    EmptyStateComponent,
    ShowDatePipe,
    ShowTimePipe,
    InrPipe,
  ],
  templateUrl: './seat-selection.html',
  styleUrl: './seat-selection.css',
})
export class SeatSelectionComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly catalog = inject(CatalogService);
  private readonly toast = inject(ToastService);

  readonly showtimeId = Number(this.route.snapshot.paramMap.get('showtimeId'));
  readonly maxTickets = MAX_TICKETS;

  readonly showtime = signal<ShowtimeWithRefs | null>(null);
  readonly seatMap = signal<SeatMap | null>(null);
  readonly availableSeats = signal(0);
  readonly selected = signal<string[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  readonly quantity = computed(() => this.selected().length);

  readonly selectedSeats = computed<Seat[]>(() => {
    const map = new Map<string, Seat>();
    this.seatMap()?.rows.forEach((row) => row.seats.forEach((seat) => map.set(seat.id, seat)));
    return this.selected()
      .map((id) => map.get(id))
      .filter((seat): seat is Seat => !!seat);
  });

  readonly seatSubtotal = computed(() =>
    this.selectedSeats().reduce((total, seat) => total + seat.price, 0),
  );

  readonly commission = computed(() => this.quantity() * BOOKING_COMMISSION_PER_TICKET);

  readonly total = computed(() => this.seatSubtotal() + this.commission());

  ngOnInit(): void {
    this.catalog.getShowtime(this.showtimeId).subscribe({
      next: (response) => {
        this.showtime.set(response.showtime);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.error.set('We could not load this show. Please pick another showtime.');
      },
    });

    this.catalog.getSeats(this.showtimeId).subscribe({
      next: (response) => {
        this.seatMap.set(response.seatMap);
        this.availableSeats.set(response.availableSeats);
      },
      error: () => {
        this.loading.set(false);
        this.error.set('We could not load the seat map. Please refresh and try again.');
      },
    });
  }

  onSeatMapClick(event: MouseEvent): void {
    const target = event.target as HTMLElement | null;
    const button = target?.closest('button[aria-label]');
    const seatId = button?.getAttribute('aria-label')?.split(' ')[0];
    if (!seatId || this.selected().includes(seatId)) {
      return;
    }
    if (this.quantity() >= MAX_TICKETS) {
      this.toast.error(
        `You can book up to ${MAX_TICKETS} tickets per booking. Remove a seat to continue.`,
      );
    }
  }

  onSelectionChange(seats: string[]): void {
    this.selected.set(seats);
  }

  proceed(): void {
    if (!this.quantity()) {
      return;
    }
    this.router.navigate(['/book', this.showtimeId, 'checkout'], {
      queryParams: { seats: this.selected().join(',') },
    });
  }
}
