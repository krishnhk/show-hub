import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';

import { NotificationListResponse } from '../models/social.model';
import { API_BASE } from './auth.service';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly http = inject(HttpClient);

  private readonly notificationsSignal = signal<NotificationListResponse | null>(null);
  readonly notifications = computed(() => this.notificationsSignal()?.notifications ?? []);
  readonly unreadCount = computed(() => this.notificationsSignal()?.unreadCount ?? 0);

  load(): Observable<NotificationListResponse> {
    return this.http
      .get<NotificationListResponse>(`${API_BASE}/notifications`)
      .pipe(
        tap((response) => this.notificationsSignal.set(response)),
      );
  }

  markRead(notificationId: number): Observable<{ success: boolean }> {
    return this.http.put<{ success: boolean }>(`${API_BASE}/notifications/${notificationId}/read`, {});
  }

  markAllRead(): Observable<{ success: boolean }> {
    return this.http.put<{ success: boolean }>(`${API_BASE}/notifications/read-all`, {});
  }
}
