import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';

import { AuthService } from '../../core/services/auth.service';
import { Theme, ThemeService } from '../../core/services/theme.service';
import { ToastService } from '../../core/services/toast.service';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';

interface NotificationPrefs {
  booking: boolean;
  resale: boolean;
}

/** Account settings: theme, notifications, data and sign-out. The profile itself is edited on the profile page. */
@Component({
  selector: 'app-settings',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ConfirmDialogComponent],
  templateUrl: './settings.html',
  styleUrl: './settings.css',
})
export class SettingsComponent {
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  readonly theme = inject(ThemeService);

  readonly confirmDelete = signal(false);

  readonly notifications = signal<NotificationPrefs>({
    booking: true,
    resale: true,
  });

  readonly user = this.auth.user;

  pickTheme(theme: Theme): void {
    this.theme.set(theme);
  }

  toggleNotification(key: keyof NotificationPrefs): void {
    this.notifications.update((current) => ({ ...current, [key]: !current[key] }));
  }

  exportData(): void {
    const user = this.user();
    if (!user) {
      return;
    }
    const payload = {
      exportedAt: new Date().toISOString(),
      profile: user,
      preferences: this.notifications(),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'showhub-data.json';
    link.click();
    URL.revokeObjectURL(url);
    this.toast.success('Your data export is downloading.');
  }

  deleteAccount(): void {
    this.confirmDelete.set(false);
    this.toast.success('Account deletion scheduled. You have 30 days to change your mind.');
  }

  logout(): void {
    this.auth.logout();
    this.toast.info('Signed out.');
    this.router.navigate(['/']);
  }
}
