import { Injectable, inject, signal } from '@angular/core';

import { ResaleTicketDetail } from '../models/resale.model';
import { ResaleService } from './resale.service';

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
