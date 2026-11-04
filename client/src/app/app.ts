import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { AuthService } from './core/services/auth.service';
import { LoadingService } from './core/services/loading.service';
import { ThemeService } from './core/services/theme.service';
import { FooterComponent } from './shared/components/footer/footer.component';
import { LocationPickerComponent } from './shared/components/location-picker/location-picker.component';
import { NavbarComponent } from './shared/components/navbar/navbar.component';
import { SplashComponent } from './shared/components/splash/splash.component';
import { ToastContainerComponent } from './shared/components/toast-container/toast-container.component';

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterOutlet,
    NavbarComponent,
    FooterComponent,
    LocationPickerComponent,
    SplashComponent,
    ToastContainerComponent,
  ],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  readonly loading = inject(LoadingService);
  private readonly auth = inject(AuthService);
  // Created here so the saved theme is applied on every page load, not only when Settings is opened.
  private readonly theme = inject(ThemeService);

  constructor() {
    // Restore the session on a hard refresh — the token lives in
    // localStorage, the user profile has to be fetched again.
    if (this.auth.isLoggedIn() && !this.auth.user()) {
      this.auth.loadMe().subscribe({ error: () => undefined });
    }
  }
}
