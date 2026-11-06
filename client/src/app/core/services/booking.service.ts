import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import {
  BookingListResponse,
  CancelBookingResponse,
  ShareSeatsRequest,
  ShareSeatsResponse,
  CreateBookingRequest,
  CreateBookingResponse,
} from '../models/booking.model';
import { API_BASE } from './auth.service';

/** Wallet fields the API adds to booking responses (optional until every response carries them). */
export interface WalletSplit {
  walletUsed?: number;
  amountDue?: number;
}

export type CreateBookingPayload = CreateBookingRequest & { useWallet?: boolean };
export type CreateBookingResult = CreateBookingResponse & WalletSplit;
export type CancelBookingResult = CancelBookingResponse & { refundToWallet?: number; refundToCard?: number };

@Injectable({ providedIn: 'root' })
export class BookingService {
  private readonly http = inject(HttpClient);

  createBooking(request: CreateBookingPayload): Observable<CreateBookingResult> {
    return this.http.post<CreateBookingResult>(`${API_BASE}/bookings`, request);
  }

  getBookings(status = 'All', page = 1): Observable<BookingListResponse> {
    const params = new HttpParams().set('status', status).set('page', String(page));
    return this.http.get<BookingListResponse>(`${API_BASE}/my-bookings`, { params });
  }

  getBooking(bookingId: number): Observable<{ booking: import('../models/booking.model').BookingDetail }> {
    return this.http.get<{ booking: import('../models/booking.model').BookingDetail }>(
      `${API_BASE}/bookings/${bookingId}`,
    );
  }

  /** Moves some of the booking's seats to another account, found by mobile number. */
  shareSeats(bookingId: number, request: ShareSeatsRequest): Observable<ShareSeatsResponse> {
    return this.http.post<ShareSeatsResponse>(`${API_BASE}/bookings/${bookingId}/share`, request);
  }

  cancelBooking(bookingId: number): Observable<CancelBookingResult> {
    return this.http.post<CancelBookingResult>(`${API_BASE}/bookings/${bookingId}/cancel`, {});
  }
}
