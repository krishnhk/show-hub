import { Injectable, inject, signal } from '@angular/core';

import { ResaleTicketDetail } from '../models/resale.model';
import { ResaleService } from './resale.service';

export type ListingFilter = 'active' | 'sold' | 'closed' | 'all';

/** The seller's own listings and their totals, shared by every page under /sell. */
@Injectable({ providedIn: 'root' })
export class MyListingsStore {
  private readonly resale = inject(ResaleService);

  readonly listings = signal<ResaleTicketDetail[]>([]);
  readonly stats = signal({
    active: 0,
    sold: 0,
    expired: 0,
    earnings: 0,
  });
  readonly loading = signal(true);

  /** The filter the seller picked on Your listings, kept here so it survives opening a listing and coming back. */
  readonly chosenFilter = signal<ListingFilter | null>(null);

  refresh(): void {
    this.resale.getMyListings().subscribe({
      next: (response) => {
        this.listings.set(response.listings);
        this.stats.set(response.stats);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
