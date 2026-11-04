import { ChangeDetectionStrategy, Component, HostListener, inject } from '@angular/core';

import { LocationService } from '../../../core/services/location.service';

/** Modal city chooser. Cannot be dismissed until a city has been picked. */
@Component({
  selector: 'app-location-picker',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (location.pickerVisible()) {
      <div class="overlay" (click)="location.closePicker()">
        <div
          class="dialog picker"
          role="dialog"
          aria-modal="true"
          aria-labelledby="city-picker-title"
          (click)="$event.stopPropagation()"
        >
          <h3 id="city-picker-title">{{ location.city() ? 'Change city' : 'Choose your city' }}</h3>
          <p class="text-soft text-sm">We'll show the movies that are running in your city.</p>

          @if (location.cities().length === 0) {
            <p class="text-muted text-sm">Loading cities…</p>
          } @else {
            <div class="city-grid">
              @for (city of location.cities(); track city) {
                <button
                  type="button"
                  class="city"
                  [class.active]="city === location.city()"
                  [attr.aria-pressed]="city === location.city()"
                  (click)="location.select(city)"
                >
                  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
                    <path
                      d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.800 12 21 12 21z"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linejoin="round"
                    />
                    <circle cx="12" cy="9.5" r="2.5" fill="currentColor" />
                  </svg>
                  {{ city }}
                </button>
              }
            </div>
          }

          @if (location.city()) {
            <div class="dialog-actions">
              <button type="button" class="btn btn-ghost" (click)="location.closePicker()">Cancel</button>
            </div>
          }
        </div>
      </div>
    }
  `,
  styles: `
    .overlay { z-index: 450; }
    .picker { max-width: 520px; }
    .city-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 10px; margin-top: 14px; }
    .city {
      display: flex;
      align-items: center;
      gap: 8px;
      min-height: 48px;
      padding: 0 14px;
      border-radius: var(--radius-sm);
      border: 1px solid var(--border);
      background: var(--surface-2);
      color: var(--text);
      font-weight: 500;
      cursor: pointer;
    }
    .city:hover { border-color: var(--accent); }
    .city.active { background: var(--accent); border-color: var(--accent); color: var(--on-primary); }
  `,
})
export class LocationPickerComponent {
  readonly location = inject(LocationService);

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.location.closePicker();
  }
}
