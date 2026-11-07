import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { SEAT_CATEGORIES } from '../../core/data/mock-seed';
import { LISTING_CUTOFF_MINUTES } from '../../core/data/resale-rules';
import { BookingDetail, ListableSeat } from '../../core/models/booking.model';
import { SeatCategory } from '../../core/models/catalog.model';
import { PricingGuidance } from '../../core/models/resale.model';
import { BookingService } from '../../core/services/booking.service';
import { MyListingsStore } from '../../core/services/my-listings.store';
import { ResaleService } from '../../core/services/resale.service';
import { ToastService } from '../../core/services/toast.service';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { ShowDatePipe, ShowTimePipe } from '../../shared/pipes/date.pipes';
import { InrPipe } from '../../shared/pipes/inr.pipe';

type Category = SeatCategory;

const CATEGORIES: Category[] = SEAT_CATEGORIES;

/** The seats of one category, as shown in the seat list. */
interface SeatGroup {
  category: Category;
  paid: number;
  seats: ListableSeat[];
}

/**
 * Lists one booking's open seats on a page of its own: pick the seats, say whether buyers can take
 * some or all of them, set a price for each seat category and put them on the resale market.
 */
@Component({
  selector: 'app-sell-booking',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    LoadingSpinnerComponent,
    EmptyStateComponent,
    ShowDatePipe,
    ShowTimePipe,
    InrPipe,
  ],
  templateUrl: './sell-booking.html',
  styleUrl: './sell-booking.css',
})
export class SellBookingComponent implements OnInit {
  private readonly bookingService = inject(BookingService);
  private readonly resale = inject(ResaleService);
  private readonly toast = inject(ToastService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly store = inject(MyListingsStore);

  readonly selectedBooking = signal<BookingDetail | null>(null);
  readonly guidance = signal<PricingGuidance | null>(null);
  readonly guidanceLoading = signal(false);
  readonly loading = signal(true);
  readonly submitting = signal(false);

  /** Seat ids the seller is selling. Every open seat to begin with; tap one to leave it out. */
  readonly pickedSeats = signal<string[]>([]);
  /** Whether buyers may take some of the seats (seat by seat) or must take them all together. */
  readonly allowPartial = signal(true);
  /** One seat's price in each category, as typed or taken from the market. Null while empty. */
  readonly prices = signal<Partial<Record<Category, number | null>>>({});

  /** Categories whose price the seller typed; these keep their price instead of following the market. */
  private readonly typed = new Set<Category>();

  /** The open seats of the booking, grouped by category, in the order the categories are shown. */
  readonly seatGroups = computed<SeatGroup[]>(() => {
    const booking = this.selectedBooking();
    if (!booking) {
      return [];
    }
    return CATEGORIES.flatMap((category) => {
      const seats = booking.unlistedSeatDetails.filter((seat) => seat.category === category);
      return seats.length ? [{ category, paid: seats[0].paid, seats }] : [];
    });
  });

  /** The categories the booking has, in display order. These price rows stay on screen whatever is selected. */
  readonly bookingCategories = computed(() => {
    const seats = this.selectedBooking()?.unlistedSeatDetails ?? [];
    return CATEGORIES.filter((category) => seats.some((seat) => seat.category === category));
  });

  /** The seats being sold, with their category and what was paid for them. */
  readonly pickedDetails = computed(() => {
    const picked = this.pickedSeats();
    return (this.selectedBooking()?.unlistedSeatDetails ?? []).filter((seat) => picked.includes(seat.id));
  });

  /** The categories among the seats being sold, in display order. */
  readonly pickedCategories = computed(() =>
    CATEGORIES.filter((category) => this.pickedDetails().some((seat) => seat.category === category)),
  );

  /** What one seat of each category cost the seller. */
  readonly paidByCategory = computed(() => {
    const paid: Partial<Record<Category, number>> = {};
    for (const group of this.seatGroups()) {
      paid[group.category] = group.paid;
    }
    return paid;
  });

  /** The price of the listing: each seat counted at its category's price. */
  readonly total = computed(() => {
    const prices = this.prices();
    const total = this.pickedDetails().reduce((sum, seat) => {
      const price = prices[seat.category];
      return sum + (price !== null && price !== undefined && this.isValid(seat.category) ? price : 0);
    }, 0);
    return Math.round(total * 100) / 100;
  });

  readonly receive = computed(() => Math.round(this.total() * 95) / 100);

  readonly canList = computed(() => {
    const categories = this.pickedCategories();
    return categories.length > 0 && categories.every((category) => this.isValid(category)) && !this.submitting();
  });

  readonly warning = computed(() => {
    const categories = this.pickedCategories();
    if (categories.some((category) => this.isOver(category))) {
      return 'A seat is priced above what it cost.';
    }
    if (categories.some((category) => this.priceOf(category) === null)) {
      return 'Set a price for each category to list.';
    }
    return '';
  });

  /** Set when the booking can't be sold from: not found, not upcoming, no open seats, or too close to the show. */
  readonly unavailable = signal<string | null>(null);

  ngOnInit(): void {
    const bookingId = Number(this.route.snapshot.paramMap.get('bookingId'));
    this.bookingService.getBooking(bookingId).subscribe({
      next: ({ booking }) => {
        this.loading.set(false);
        const start = new Date(booking.showtime.showDateTime).getTime();
        if (booking.status !== 'Completed' || start <= Date.now() || booking.unlistedSeats.length === 0) {
          this.unavailable.set('Only upcoming bookings with seats that are not already listed can be resold.');
        } else if (start - Date.now() < LISTING_CUTOFF_MINUTES * 60000) {
          this.unavailable.set('This show starts too soon to list its seats.');
        } else {
          this.selectedBooking.set(booking);
          this.pickedSeats.set(booking.unlistedSeatDetails.map((seat) => seat.id));
          this.loadGuidance(booking);
        }
      },
      error: () => {
        this.loading.set(false);
        this.unavailable.set('We could not find this booking.');
      },
    });
    this.store.refresh();
  }

  setPartial(allow: boolean): void {
    this.allowPartial.set(allow);
  }

  /** Picks every open seat of the booking in one tap, or none of them. */
  setAllSeats(all: boolean): void {
    const booking = this.selectedBooking();
    if (!booking) {
      return;
    }
    this.pickedSeats.set(all ? booking.unlistedSeatDetails.map((seat) => seat.id) : []);
    this.fillFromMarket();
  }

  toggleSeat(seat: string): void {
    this.pickedSeats.update((seats) =>
      seats.includes(seat) ? seats.filter((item) => item !== seat) : [...seats, seat],
    );
    this.fillFromMarket();
  }

  isPicked(seat: string): boolean {
    return this.pickedSeats().includes(seat);
  }

  /** The seats of one category that are being sold, as a comma-separated list. */
  seatsOf(category: Category): string {
    return this.pickedDetails()
      .filter((seat) => seat.category === category)
      .map((seat) => seat.id)
      .join(', ');
  }

  countOf(category: Category): number {
    return this.pickedDetails().filter((seat) => seat.category === category).length;
  }

  marketFor(category: Category): number | null {
    return this.guidance()?.categoryMarket[category] ?? null;
  }

  /** The price typed for a category, or null while it is empty. */
  priceOf(category: Category): number | null {
    const value = this.prices()[category];
    return value === undefined ? null : value;
  }

  /** What the price box shows: zero while no seat of the category is selected, blank while it is empty. */
  inputValue(category: Category): string {
    if (this.countOf(category) === 0) {
      return '0';
    }
    const price = this.priceOf(category);
    return price === null ? '' : String(price);
  }

  seatCountOf(category: Category): number {
    return (this.selectedBooking()?.unlistedSeatDetails ?? []).filter((seat) => seat.category === category).length;
  }

  allPicked(): boolean {
    return this.pickedDetails().length === (this.selectedBooking()?.unlistedSeatDetails.length ?? 0);
  }

  setPrice(category: Category, value: string): void {
    this.typed.add(category);
    this.prices.update((prices) => ({ ...prices, [category]: value === '' ? null : Number(value) }));
  }

  /** Goes back to the market price for a category. */
  useMarket(category: Category): void {
    const market = this.marketFor(category);
    if (market === null) {
      return;
    }
    this.typed.delete(category);
    this.prices.update((prices) => ({ ...prices, [category]: this.capped(category, market) }));
  }

  /** The most a seat of a category may be listed for: what it cost. */
  maxFor(category: Category): number {
    return this.paidByCategory()[category] ?? 0;
  }

  isValid(category: Category): boolean {
    const price = this.priceOf(category);
    return price !== null && price >= 1 && price <= this.maxFor(category);
  }

  isOver(category: Category): boolean {
    const price = this.priceOf(category);
    return price !== null && price > this.maxFor(category);
  }

  /** The one short line under a category's name; it never wraps, so the row keeps its height. */
  rowMeta(category: Category): string {
    const max = `₹${this.maxFor(category)}`;
    if (this.countOf(category) === 0) {
      return 'No seats selected';
    }
    if (this.isOver(category)) {
      return `Over the ${max} max`;
    }
    return `${this.countOf(category)} of ${this.seatCountOf(category)} · max ${max}`;
  }

  submit(): void {
    const booking = this.selectedBooking();
    if (!booking || !this.canList()) {
      return;
    }

    const categoryPrices: Partial<Record<Category, number>> = {};
    for (const category of this.pickedCategories()) {
      categoryPrices[category] = this.priceOf(category) ?? 0;
    }
    const count = this.pickedDetails().length;

    this.submitting.set(true);
    this.resale
      .createTicket({
        bookingId: booking.id,
        categoryPrices,
        allowPartial: count > 1 && this.allowPartial(),
        seatNumbers: this.pickedSeats(),
      })
      .subscribe({
        next: () => {
          this.submitting.set(false);
          this.toast.success('Your seats are live on the resale market.');
          this.store.refresh();
          void this.router.navigate(['/resale/sell/listings']);
        },
        error: () => {
          this.submitting.set(false);
        },
      });
  }

  private capped(category: Category, price: number): number {
    return Math.max(1, Math.min(Math.round(price * 100) / 100, this.maxFor(category)));
  }

  /** Fills the price of each category being sold from the market, unless the seller typed one. */
  private fillFromMarket(): void {
    const guide = this.guidance();
    const prices = { ...this.prices() };
    for (const category of this.pickedCategories()) {
      if (this.typed.has(category) || !guide) {
        continue;
      }
      prices[category] = this.capped(category, guide.categoryMarket[category]);
    }
    this.prices.set(prices);
  }

  private loadGuidance(booking: BookingDetail): void {
    this.guidanceLoading.set(true);
    this.resale.getPricingGuidance(booking.id).subscribe({
      next: (guidance) => {
        if (this.selectedBooking()?.id !== booking.id) {
          return;
        }
        this.guidance.set(guidance);
        this.guidanceLoading.set(false);
        this.fillFromMarket();
      },
      error: () => {
        this.guidance.set(null);
        this.guidanceLoading.set(false);
      },
    });
  }
}
