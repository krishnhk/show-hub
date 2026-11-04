import { SeatCategory } from '../models/catalog.model';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import {
  CreateTransactionResponse,
  MyListingsResponse,
  PricingGuidance,
  ResaleListResponse,
  ResaleTicketDetail,
  TransactionListResponse,
} from '../models/resale.model';
import { API_BASE } from './auth.service';

export interface ResaleQuery {
  movieId?: number | string;
  theaterId?: number | string;
  city?: string;
  format?: string;
  minPrice?: number | string;
  maxPrice?: number | string;
  page?: number;
}

@Injectable({ providedIn: 'root' })
export class ResaleService {
  private readonly http = inject(HttpClient);

  getTickets(query: ResaleQuery = {}): Observable<ResaleListResponse> {
    let params = new HttpParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '' && value !== 'All') {
        params = params.set(key, String(value));
      }
    });
    return this.http.get<ResaleListResponse>(`${API_BASE}/resale-tickets`, { params });
  }

  getTicket(ticketId: number): Observable<{ ticket: ResaleTicketDetail }> {
    return this.http.get<{ ticket: ResaleTicketDetail }>(`${API_BASE}/resale-tickets/${ticketId}`);
  }

  getMyListings(): Observable<MyListingsResponse> {
    return this.http.get<MyListingsResponse>(`${API_BASE}/resale-tickets/my-listings`);
  }

  createTicket(payload: {
    bookingId: number;
    /** One seat's price in each category the listing contains, e.g. { Premium: 380, Regular: 240 }. */
    categoryPrices: Partial<Record<SeatCategory, number>>;
    allowPartial?: boolean;
    /** Seats to sell; every unlisted seat of the booking when left out. */
    seatNumbers?: string[];
  }): Observable<{ resaleTicketId: number; listedAt: string; expiresAt: string }> {
    return this.http.post<{ resaleTicketId: number; listedAt: string; expiresAt: string }>(
      `${API_BASE}/resale-tickets`,
      payload,
    );
  }

  updateTicket(
    ticketId: number,
    payload: { price?: number; categoryPrices?: Partial<Record<SeatCategory, number>>; allowPartial?: boolean },
  ): Observable<{ success: boolean; ticket: ResaleTicketDetail }> {
    return this.http.put<{ success: boolean; ticket: ResaleTicketDetail }>(
      `${API_BASE}/resale-tickets/${ticketId}`,
      payload,
    );
  }

  delistTicket(ticketId: number): Observable<{ success: boolean }> {
    return this.http.delete<{ success: boolean }>(`${API_BASE}/resale-tickets/${ticketId}`);
  }

  getPricingGuidance(bookingId: number, seatCount?: number): Observable<PricingGuidance> {
    let params = new HttpParams().set('bookingId', String(bookingId));
    if (seatCount) {
      params = params.set('seatCount', String(seatCount));
    }
    return this.http.get<PricingGuidance>(`${API_BASE}/resale-tickets/pricing-guidance`, { params });
  }

  /** Buys the whole listing, or only `seatNumbers` when the seller allows individual seats. */
  purchase(
    ticketId: number,
    seatNumbers?: string[],
    useWallet = true,
  ): Observable<CreateTransactionResponse & { walletUsed?: number; amountDue?: number; bookingId?: number }> {
    return this.http.post<CreateTransactionResponse & { walletUsed?: number; amountDue?: number; bookingId?: number }>(
      `${API_BASE}/resale-transactions`,
      { resaleTicketId: ticketId, seatNumbers, useWallet },
    );
  }

  getTransactions(): Observable<TransactionListResponse> {
    return this.http.get<TransactionListResponse>(`${API_BASE}/my-transactions`);
  }
}
