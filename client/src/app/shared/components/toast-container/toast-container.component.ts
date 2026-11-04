import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-toast-container',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="toast-stack">
      @for (toast of toastService.toasts(); track toast.id) {
        <div class="toast" [class]="'toast toast-' + toast.type">
          <span>{{ icon(toast.type) }}</span>
          <span class="message">{{ toast.message }}</span>
          <button type="button" class="close" aria-label="Dismiss" (click)="toastService.dismiss(toast.id)">
            ×
          </button>
        </div>
      }
    </div>
  `,
  styles: `
    .close {
      margin-left: auto;
      background: none;
      border: none;
      color: var(--text-muted);
      font-size: 1.1rem;
      cursor: pointer;
      line-height: 1;
    }

    .message { flex: 1; }

    .toast-success,
    .toast-error,
    .toast-info { background: var(--surface-2); }

    .toast-success { border-left: 3px solid var(--success); }
    .toast-error { border-left: 3px solid var(--danger); }
    .toast-info { border-left: 3px solid var(--info); }
  `,
})
export class ToastContainerComponent {
  readonly toastService = inject(ToastService);

  icon(type: string): string {
    return type === 'success' ? '✅' : type === 'error' ? '⚠️' : 'ℹ️';
  }
}
