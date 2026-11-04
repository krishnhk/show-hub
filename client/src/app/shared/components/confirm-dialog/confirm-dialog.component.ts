import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

/**
 * Lightweight confirmation modal used before destructive or irreversible
 * actions (cancelling a booking, delisting a ticket, …).
 */
@Component({
  selector: 'app-confirm-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="overlay" (click)="onBackdrop($event)">
      <div class="dialog" role="dialog" aria-modal="true">
        <h3>{{ title() }}</h3>
        <p class="text-soft">{{ message() }}</p>
        <div class="dialog-actions">
          <button type="button" class="btn btn-outline" (click)="cancelled.emit()">
            {{ cancelLabel() }}
          </button>
          <button type="button" class="btn" [class.btn-danger]="danger()" (click)="confirmed.emit()">
            {{ confirmLabel() }}
          </button>
        </div>
      </div>
    </div>
  `,
})
export class ConfirmDialogComponent {
  readonly title = input<string>('Are you sure?');
  readonly message = input<string>('');
  readonly confirmLabel = input<string>('Confirm');
  readonly cancelLabel = input<string>('Cancel');
  readonly danger = input<boolean>(true);

  readonly confirmed = output<void>();
  readonly cancelled = output<void>();

  onBackdrop(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.cancelled.emit();
    }
  }
}
