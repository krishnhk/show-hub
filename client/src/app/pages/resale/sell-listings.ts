import { ChangeDetectionStrategy, Component, HostListener, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { MIN_PRICE_SHARE, SELLER_KEEPS } from '../../core/data/resale-rules';
import { SeatCategory } from '../../core/models/catalog.model';
import { ResaleTicketDetail } from '../../core/models/resale.model';
import { MyListingsStore } from '../../core/services/my-listings.store';
import { ResaleService } from '../../core/services/resale.service';
import { ToastService } from '../../core/services/toast.service';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { FilmThumbComponent } from '../../shared/components/film-thumb/film-thumb.component';
import { ListingSummaryComponent } from '../../shared/components/listing-summary/listing-summary.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { ShowDatePipe, ShowTimePipe, TimeAgoPipe } from '../../shared/pipes/date.pipes';
import { InrPipe } from '../../shared/pipes/inr.pipe';

type ListingFilter = 'active' | 'sold' | 'closed' | 'all';

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
 * Resale listings the seller has already posted. Editing happens in a popup that changes the
 * prices and the buyer option or takes the listing down; the seats themselves can't be changed.
 */
@Component({
  selector: 'app-sell-listings',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, EmptyStateComponent, FilmThumbComponent, ListingSummaryComponent, ConfirmDialogComponent, ShowDatePipe, ShowTimePipe, TimeAgoPipe, InrPipe],
  templateUrl: './sell-listings.html',
  styleUrl: './sell-listings.css',
})
export class SellListingsComponent {
  private readonly resale = inject(ResaleService);
  private readonly toast = inject(ToastService);
  readonly store = inject(MyListingsStore);

  /** The listing open in the edit popup. */
  readonly editingId = signal<number | null>(null);
  /** Price per seat for each category in the listing being edited. */
  readonly editPrices = signal<Partial<Record<SeatCategory, number | null>>>({});
  readonly editPartial = signal(true);
  readonly saving = signal(false);
  readonly filterOpen = signal(false);
  readonly delistTarget = signal<ResaleTicketDetail | null>(null);
  /** The sold, delisted or expired listing open in the read-only details popup. */
  readonly closedView = signal<ResaleTicketDetail | null>(null);
  private readonly chosenFilter = signal<ListingFilter | null>(null);

  readonly counts = computed(() => {
    const all = this.store.listings();
    return {
      active: all.filter((l) => l.status === 'Available').length,
      sold: all.filter((l) => l.status === 'Sold').length,
      closed: all.filter((l) => l.status === 'Delisted' || l.status === 'Expired').length,
      all: all.length,
    };
  });

  /** Until the seller picks a filter, show active listings, or everything when none are active. */
  readonly filter = computed<ListingFilter>(
    () => this.chosenFilter() ?? (this.counts().active > 0 ? 'active' : 'all'),
  );

  readonly filters = computed(() => [
    { id: 'active' as const, label: 'Active', count: this.counts().active },
    { id: 'sold' as const, label: 'Sold', count: this.counts().sold },
    { id: 'closed' as const, label: 'Closed', count: this.counts().closed },
    { id: 'all' as const, label: 'All', count: this.counts().all },
  ]);

  readonly activeFilter = computed(() => this.filters().find((f) => f.id === this.filter())!);

  /** Active listings first, soonest show first; the rest newest first. */
  readonly visible = computed(() => {
    const filter = this.filter();
    const rows = this.store.listings().filter((l) => {
      switch (filter) {
        case 'active':
          return l.status === 'Available';
        case 'sold':
          return l.status === 'Sold';
        case 'closed':
          return l.status === 'Delisted' || l.status === 'Expired';
        default:
          return true;
      }
    });
    const showTime = (l: ResaleTicketDetail) => new Date(l.showtime.showDateTime).getTime();
    return [...rows].sort((a, b) => {
      const aLive = a.status === 'Available' ? 0 : 1;
      const bLive = b.status === 'Available' ? 0 : 1;
      if (aLive !== bLive) {
        return aLive - bLive;
      }
      return aLive === 0 ? showTime(a) - showTime(b) : new Date(b.listedAt).getTime() - new Date(a.listedAt).getTime();
    });
  });

  readonly editing = computed(() => this.store.listings().find((l) => l.id === this.editingId()) ?? null);

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

  toggleFilter(): void {
    this.filterOpen.update((open) => !open);
  }

  /** The platform fee as a whole percent, for the sold-ticket breakdown. */
  readonly feePercent = Math.round((1 - SELLER_KEEPS) * 100);

  setFilter(filter: ListingFilter): void {
    this.chosenFilter.set(filter);
    this.filterOpen.set(false);
    this.closeEdit();
  }

  /** Closes the filter menu when the click lands outside it. */
  @HostListener('document:click', ['$event'])
  closeFilterOnOutsideClick(event: MouseEvent): void {
    if (this.filterOpen() && !(event.target as HTMLElement).closest('.filter')) {
      this.filterOpen.set(false);
    }
  }

  startEdit(ticket: ResaleTicketDetail): void {
    const prices: Partial<Record<SeatCategory, number>> = {};
    for (const seat of ticket.seatDetails ?? []) {
      prices[seat.category] = seat.price;
    }
    this.editPrices.set(prices);
    this.editPartial.set(ticket.allowPartial);
    this.editingId.set(ticket.id);
  }

  @HostListener('document:keydown.escape')
  closeEdit(): void {
    this.filterOpen.set(false);
    if (this.delistTarget() || this.saving()) {
      return;
    }
    this.editingId.set(null);
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
        this.editingId.set(null);
        this.store.refresh();
      },
      error: () => {
        this.saving.set(false);
        this.store.refresh();
      },
    });
  }

  viewClosed(ticket: ResaleTicketDetail): void {
    this.closedView.set(ticket);
  }

  closeClosed(): void {
    this.closedView.set(null);
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
        this.toast.success('Listing removed. Your tickets are back in My tickets.');
        this.editingId.set(null);
        this.store.refresh();
      },
      error: () => this.store.refresh(),
    });
  }
}
