import { ChangeDetectionStrategy, Component, HostListener, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { SELLER_KEEPS } from '../../core/data/resale-rules';
import { ResaleTicketDetail } from '../../core/models/resale.model';
import { ListingFilter, MyListingsStore } from '../../core/services/my-listings.store';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { FilmThumbComponent } from '../../shared/components/film-thumb/film-thumb.component';
import { ShowDatePipe, ShowTimePipe } from '../../shared/pipes/date.pipes';
import { InrPipe } from '../../shared/pipes/inr.pipe';

/**
 * Resale listings the seller has already posted. Each row opens that listing on its own page,
 * to change its prices and buyer option, take it down, or see what happened to it.
 */
@Component({
  selector: 'app-sell-listings',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, EmptyStateComponent, FilmThumbComponent, ShowDatePipe, ShowTimePipe, InrPipe],
  templateUrl: './sell-listings.html',
  styleUrl: './sell-listings.css',
})
export class SellListingsComponent {
  readonly store = inject(MyListingsStore);

  readonly filterOpen = signal(false);
  private readonly chosenFilter = this.store.chosenFilter;

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

  setFilter(filter: ListingFilter): void {
    this.chosenFilter.set(filter);
    this.filterOpen.set(false);
  }

  /** Closes the filter menu when the click lands outside it. */
  @HostListener('document:click', ['$event'])
  closeFilterOnOutsideClick(event: MouseEvent): void {
    if (this.filterOpen() && !(event.target as HTMLElement).closest('.filter')) {
      this.filterOpen.set(false);
    }
  }
}
