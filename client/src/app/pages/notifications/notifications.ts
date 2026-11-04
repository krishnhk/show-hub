import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';

import { AppNotification, NotificationType } from '../../core/models/social.model';
import { NotificationService } from '../../core/services/notification.service';
import { ToastService } from '../../core/services/toast.service';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { TimeAgoPipe } from '../../shared/pipes/date.pipes';

const ICONS: Record<NotificationType, string> = {
  booking: '🎟️',
  resale: '♻️',
  system: '🔔',
};

@Component({
  selector: 'app-notifications',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [EmptyStateComponent, LoadingSpinnerComponent, TimeAgoPipe],
  templateUrl: './notifications.html',
  styleUrl: './notifications.css',
})
export class NotificationsComponent implements OnInit {
  private readonly notificationsApi = inject(NotificationService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  readonly notifications = signal<AppNotification[]>([]);
  readonly unreadCount = signal(0);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly markingAll = signal(false);

  readonly today = computed(() =>
    this.notifications().filter((item) => this.isToday(item.createdAt)),
  );
  readonly earlier = computed(() =>
    this.notifications().filter((item) => !this.isToday(item.createdAt)),
  );

  ngOnInit(): void {
    this.load();
  }

  icon(type: NotificationType): string {
    return ICONS[type] ?? '🔔';
  }

  open(notification: AppNotification): void {
    if (!notification.isRead) {
      this.notificationsApi.markRead(notification.id).subscribe({
        next: () => {
          this.notifications.update((items) =>
            items.map((item) =>
              item.id === notification.id ? { ...item, isRead: true } : item,
            ),
          );
          this.unreadCount.update((count) => Math.max(0, count - 1));
        },
      });
    }

    if (notification.link) {
      this.router.navigateByUrl(notification.link);
    }
  }

  markAllRead(): void {
    if (this.unreadCount() === 0 || this.markingAll()) {
      return;
    }
    this.markingAll.set(true);
    this.notificationsApi.markAllRead().subscribe({
      next: () => {
        this.markingAll.set(false);
        this.notifications.update((items) => items.map((item) => ({ ...item, isRead: true })));
        this.unreadCount.set(0);
      },
      error: () => this.markingAll.set(false),
    });
  }

  private isToday(value: string): boolean {
    const date = new Date(value);
    const now = new Date();
    return (
      date.getFullYear() === now.getFullYear() &&
      date.getMonth() === now.getMonth() &&
      date.getDate() === now.getDate()
    );
  }

  private load(): void {
    this.loading.set(true);
    this.error.set(null);

    this.notificationsApi.load().subscribe({
      next: (response) => {
        this.notifications.set(response.notifications);
        this.unreadCount.set(response.unreadCount);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.error.set('We could not load notifications. Please try again.');
      },
    });
  }
}
