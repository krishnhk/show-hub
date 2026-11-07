import { ChangeDetectionStrategy, Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { MIN_PRICE_SHARE, SELLER_KEEPS } from '../../core/data/resale-rules';
import { SeatCategory } from '../../core/models/catalog.model';
import { ResaleTicketDetail } from '../../core/models/resale.model';
import { MyListingsStore } from '../../core/services/my-listings.store';
import { ResaleService } from '../../core/services/resale.service';
import { ToastService } from '../../core/services/toast.service';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { ShowSummaryComponent } from '../../shared/components/show-summary/show-summary.component';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { ShowDatePipe, ShowTimePipe } from '../../shared/pipes/date.pipes';
import { InrPipe } from '../../shared/pipes/inr.pipe';

const CATEGORIES: SeatCategory[] = ['Recliner', 'Premium', 'Couple', 'Regular'];

interface EditGroup {
  category: SeatCategory;
  seats: string[];
  /** What one seat of this category cost the seller. */
  paid: number;
  /** The lowest price one seat may be listed at. */
  floor: number;
}

/**
 * One of the seller's listings on its own page. An active listing can be repriced, switched
 * between whole-set and seat-by-seat, or taken down (the seats themselves are locked); a sold,
 * delisted or unsold one shows what happened to it.
 */
@Component({
  selector: 'app-sell-listing-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, EmptyStateComponent, LoadingSpinnerComponent, ShowSummaryComponent, ConfirmDialogComponent, ShowDatePipe, ShowTimePipe, InrPipe],
  templateUrl: './sell-listing-detail.html',
  styleUrl: './sell-listing-detail.css',
})
export class SellListingDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly resale = inject(ResaleService);
  private readonly toast = inject(ToastService);
  readonly store = inject(MyListingsStore);

  private readonly listingId = Number(this.route.snapshot.paramMap.get('listingId'));

  /** Price per seat for each category in the listing being edited. */
  readonly editPrices = signal<Partial<Record<SeatCategory, number | null>>>({});
  readonly editPartial = signal(true);
  readonly saving = signal(false);
  readonly delistTarget = signal<ResaleTicketDetail | null>(null);

  /** The platform fee as a whole percent, for the sold-ticket breakdown. */
  readonly feePercent = Math.round((1 - SELLER_KEEPS) * 100);

  constructor() {
    this.store.refresh();

    // Fill the form once, when the listing first arrives.
    let filled = false;
    effect(() => {
      const ticket = this.ticket();
      if (ticket && !filled) {
        filled = true;
        untracked(() => {
          const prices: Partial<Record<SeatCategory, number>> = {};
          for (const seat of ticket.seatDetails ?? []) {
            prices[seat.category] = seat.price;
          }
          this.editPrices.set(prices);
          this.editPartial.set(ticket.allowPartial);
        });
      }
    });
  }

  readonly ticket = computed(() => this.store.listings().find((l) => l.id === this.listingId) ?? null);
  /** The form edits the same listing, so the form's helpers read it as "editing". */
  private readonly editing = this.ticket;

  /** The listing's seats grouped by category, as they are priced. */
  readonly editGroups = computed<EditGroup[]>(() => {
    const seats = this.editing()?.seatDetails ?? [];
    return CATEGORIES.flatMap((category) => {
      const inCategory = seats.filter((seat) => seat.category === category);
      if (!inCategory.length) {
        return [];
      }
      const paid = inCategory[0].paid;
      return [{ category, seats: inCategory.map((seat) => seat.id), paid, floor: Math.ceil(paid * MIN_PRICE_SHARE) }];
    });
  });

  /** What is wrong with each category's typed price, or null. */
  readonly groupErrors = computed(() => {
    const prices = this.editPrices();
    const out: Partial<Record<SeatCategory, string | null>> = {};
    for (const group of this.editGroups()) {
      const price = Number(prices[group.category]);
      if (!Number.isFinite(price) || price <= 0) {
        out[group.category] = 'Enter a price above ₹0.';
      } else if (price > group.paid) {
        out[group.category] = `Can't be above what you paid (₹${group.paid}).`;
      } else if (price < group.floor) {
        out[group.category] = `Can't be below ₹${group.floor}.`;
      } else {
        out[group.category] = null;
      }
    }
    return out;
  });

  readonly editTotal = computed(() =>
    this.editGroups().reduce((sum, group) => sum + group.seats.length * (Number(this.editPrices()[group.category]) || 0), 0),
  );

  /** The platform fee on the typed prices, to the paisa like the stored listing. */
  readonly editFee = computed(() => Math.round(this.editTotal() * (1 - SELLER_KEEPS) * 100) / 100);

  readonly editReceive = computed(() => Math.round((this.editTotal() - this.editFee()) * 100) / 100);

  readonly hasErrors = computed(() => Object.values(this.groupErrors()).some((error) => !!error));

  /** Non-blocking nudge when the total is very low but still allowed. */
  readonly editWarning = computed<string | null>(() => {
    const ticket = this.editing();
    return ticket && !this.hasErrors() && this.editTotal() < ticket.originalPrice * 0.5
      ? 'That is under half of what you paid.'
      : null;
  });

  /** Whether anything differs from the listing as it stands. */
  readonly changed = computed(() => {
    const ticket = this.editing();
    if (!ticket) {
      return false;
    }
    const pricesChanged = this.editGroups().some((group) => {
      const current = ticket.seatDetails?.find((seat) => seat.category === group.category)?.price;
      return Number(this.editPrices()[group.category]) !== current;
    });
    return pricesChanged || this.editPartial() !== ticket.allowPartial;
  });

  readonly canSave = computed(() => !!this.editing() && !this.hasErrors() && this.changed() && !this.saving());

  /** For a listing that came from a split: "Part of a 2-seat listing · E2 sold". */
  partNote(listing: ResaleTicketDetail): string | null {
    if (!listing.splitGroup) {
      return null;
    }
    const outcome: Record<ResaleTicketDetail['status'], string> = {
      Sold: 'sold',
      Available: 'still listed',
      Delisted: 'delisted',
      Expired: 'unsold',
    };
    const siblings = this.store
      .listings()
      .filter((other) => other.splitGroup === listing.splitGroup && other.id !== listing.id);
    const parts = siblings.map((other) => `${other.seatNumbers.join(', ')} ${outcome[other.status]}`);
    const count = listing.listedSeatCount ?? listing.seatNumbers.length + siblings.reduce((n, o) => n + o.seatNumbers.length, 0);
    return `Part of a ${count}-seat listing` + (parts.length ? ` · ${parts.join(', ')}` : '');
  }

  /** Expired listings are shown as "Unsold": the show started and nobody bought them. */
  statusLabel(status: ResaleTicketDetail['status']): string {
    return status === 'Expired' ? 'Unsold' : status;
  }

  /** What the seller takes home for a price, after the platform fee. */
  net(price: number): number {
    return Math.round(price * SELLER_KEEPS);
  }

  back(): void {
    void this.router.navigate(['/resale/sell/listings']);
  }

  setPrice(category: SeatCategory, raw: string): void {
    this.editPrices.update((prices) => ({ ...prices, [category]: raw === '' ? null : Number(raw) }));
  }

  setPartial(allow: boolean): void {
    this.editPartial.set(allow);
  }

  saveEdit(): void {
    const ticket = this.editing();
    if (!ticket || !this.canSave()) {
      return;
    }

    const categoryPrices: Partial<Record<SeatCategory, number>> = {};
    for (const group of this.editGroups()) {
      categoryPrices[group.category] = Number(this.editPrices()[group.category]);
    }

    this.saving.set(true);
    this.resale.updateTicket(ticket.id, { categoryPrices, allowPartial: this.editPartial() }).subscribe({
      next: () => {
        this.saving.set(false);
        this.toast.success('Listing updated.');
        this.store.refresh();
        this.back();
      },
      error: () => {
        this.saving.set(false);
        this.store.refresh();
      },
    });
  }

  askDelist(ticket: ResaleTicketDetail): void {
    this.delistTarget.set(ticket);
  }

  confirmDelist(): void {
    const ticket = this.delistTarget();
    this.delistTarget.set(null);
    if (!ticket) {
      return;
    }
    this.resale.delistTicket(ticket.id).subscribe({
      next: () => {
        this.toast.success('Listing removed. Your tickets are back in My bookings.');
        this.store.refresh();
        this.back();
      },
      error: () => this.store.refresh(),
    });
  }
}
