import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';

import {
  CompleteProfileRequest,
  OtpChallengeResponse,
  PublicProfile,
  User,
  VerifyOtpResponse,
  WalletEntriesResponse,
  WalletSummary,
} from '../models/user.model';

export const API_BASE = '/api';
const TOKEN_KEY = 'thiraihub_token';

function readToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function writeToken(token: string | null): void {
  try {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  } catch {
    /* storage unavailable (private mode) — session stays in memory only */
  }
}

/**
 * Passwordless (OTP) authentication, mirroring the `/api/auth/*` contract.
 * The token and the resolved user are exposed as signals so guards, the
 * navbar and every page stay in sync without extra round-trips.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);

  private readonly tokenSignal = signal<string | null>(readToken());
  private readonly userSignal = signal<User | null>(null);
  private readonly profileSignal = signal<PublicProfile | null>(null);

  readonly token = this.tokenSignal.asReadonly();
  readonly user = this.userSignal.asReadonly();
  readonly profile = this.profileSignal.asReadonly();

  readonly isLoggedIn = computed(() => !!this.tokenSignal());
  readonly displayName = computed(() => this.userSignal()?.fullName || 'ThiraiHub Member');
  readonly initials = computed(() => {
    const name = this.userSignal()?.fullName?.trim() ?? '';
    if (!name) {
      return 'SH';
    }
    return name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0].toUpperCase())
      .join('');
  });

  sendOtp(phoneNumber: string): Observable<OtpChallengeResponse> {
    return this.http.post<OtpChallengeResponse>(`${API_BASE}/auth/send-otp`, { phoneNumber });
  }

  verifyOtp(phoneNumber: string, otp: string): Observable<VerifyOtpResponse> {
    return this.http
      .post<VerifyOtpResponse>(`${API_BASE}/auth/verify-otp`, { phoneNumber, otp })
      .pipe(
        tap((response) => {
          writeToken(response.token);
          this.tokenSignal.set(response.token);
          if (response.user) {
            this.userSignal.set(response.user);
          }
        }),
      );
  }

  completeProfile(payload: CompleteProfileRequest): Observable<{ success: boolean; user: User }> {
    return this.http
      .post<{ success: boolean; user: User }>(`${API_BASE}/auth/complete-profile`, payload)
      .pipe(tap((response) => this.userSignal.set(response.user)));
  }

  /** Sends a code to a new mobile number or email the user wants to switch to. */
  sendContactOtp(kind: 'phone' | 'email', value: string): Observable<OtpChallengeResponse> {
    return this.http.post<OtpChallengeResponse>(`${API_BASE}/me/contact/send-otp`, { kind, value });
  }

  /** Checks the code and, if it is right, switches the account to the new number or email. */
  verifyContact(kind: 'phone' | 'email', value: string, otp: string): Observable<{ success: boolean; user: User }> {
    return this.http
      .post<{ success: boolean; user: User }>(`${API_BASE}/me/contact/verify`, { kind, value, otp })
      .pipe(tap((response) => this.userSignal.set(response.user)));
  }

  loadMe(): Observable<{ user: User }> {
    return this.http.get<{ user: User }>(`${API_BASE}/auth/me`).pipe(
      tap((response) => this.userSignal.set(response.user)),
    );
  }

  loadProfile(userId: number): Observable<PublicProfile> {
    return this.http
      .get<PublicProfile>(`${API_BASE}/users/${userId}`)
      .pipe(tap((response) => this.profileSignal.set(response)));
  }

  updateProfile(payload: Partial<User>): Observable<{ success: boolean; user: User }> {
    return this.http
      .put<{ success: boolean; user: User }>(`${API_BASE}/me/profile`, payload)
      .pipe(tap((response) => this.userSignal.set(response.user)));
  }

  wallet(): Observable<WalletSummary> {
    return this.http.get<WalletSummary>(`${API_BASE}/me/wallet`);
  }

  walletEntries(): Observable<WalletEntriesResponse> {
    return this.http.get<WalletEntriesResponse>(`${API_BASE}/me/wallet/transactions`);
  }

  logout(): void {
    if (this.tokenSignal()) {
      this.http.post(`${API_BASE}/auth/logout`, {}).subscribe({ error: () => undefined });
    }
    writeToken(null);
    this.tokenSignal.set(null);
    this.userSignal.set(null);
    this.profileSignal.set(null);
  }
}
