import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { ToastService } from '../../../core/services/toast.service';

/**
 * Messages that appear for a few seconds: a dark pill with a coloured icon, the message, a close button and a thin
 * bar that runs down as the time passes. Bottom right on a desktop, full width at the bottom of a phone.
 */
@Component({
  selector: 'app-toast-container',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="stack" role="status" aria-live="polite">
      @for (toast of toastService.toasts(); track toast.id) {
        <div class="toast" [attr.data-type]="toast.type">
          <span class="icon" aria-hidden="true">
            @switch (toast.type) {
              @case ('success') {
                <svg viewBox="0 0 16 16" width="12" height="12" focusable="false">
                  <path d="M3.5 8.5l3 3 6-6.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              }
              @case ('error') {
                <svg viewBox="0 0 16 16" width="12" height="12" focusable="false">
                  <path d="M8 3.5v5.5M8 12v.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
                </svg>
              }
              @default {
                <svg viewBox="0 0 16 16" width="12" height="12" focusable="false">
                  <path d="M8 7v5M8 4v.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
                </svg>
              }
            }
          </span>

          <span class="message">{{ toast.message }}</span>

          <button type="button" class="close" aria-label="Dismiss" (click)="toastService.dismiss(toast.id)">
            <svg viewBox="0 0 16 16" width="10" height="10" aria-hidden="true" focusable="false">
              <path d="M3.5 3.5l9 9M12.5 3.5l-9 9" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
            </svg>
          </button>

          <span class="timer"></span>
        </div>
      }
    </div>
  `,
  styles: `
    .stack {
      position: fixed;
      right: 20px;
      bottom: 20px;
      z-index: 500;
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 10px;
      max-width: calc(100vw - 40px);
      pointer-events: none;
    }

    .toast {
      position: relative;
      display: flex;
      align-items: center;
      gap: 12px;
      width: max-content;
      min-width: 240px;
      max-width: 380px;
      padding: 12px 14px 13px 12px;
      overflow: hidden;
      border-radius: 14px;
      background: var(--brand);
      color: var(--on-primary);
      box-shadow: 0 10px 30px rgba(15, 23, 42, 0.28);
      font-size: 0.88rem;
      line-height: 1.35;
      pointer-events: auto;
      animation: toast-in 220ms ease;
      --tone: var(--info);
    }

    .toast[data-type='success'] { --tone: var(--success); }
    .toast[data-type='error'] { --tone: var(--danger); }

    .icon {
      display: grid;
      place-items: center;
      width: 24px;
      height: 24px;
      flex-shrink: 0;
      border-radius: 50%;
      background: var(--tone);
      color: #fff;
    }

    .message {
      flex: 1;
      min-width: 0;
      overflow-wrap: anywhere;
    }

    .close {
      display: grid;
      place-items: center;
      width: 22px;
      height: 22px;
      flex-shrink: 0;
      padding: 0;
      border: 0;
      border-radius: 50%;
      background: transparent;
      color: inherit;
      opacity: 0.6;
      cursor: pointer;
    }

    .close:hover {
      background: rgba(255, 255, 255, 0.14);
      opacity: 1;
    }

    .timer {
      position: absolute;
      left: 0;
      bottom: 0;
      height: 3px;
      width: 100%;
      background: var(--tone);
      opacity: 0.85;
      transform-origin: left;
      animation: toast-timer 4200ms linear forwards;
    }

    @keyframes toast-in {
      from { opacity: 0; transform: translateY(12px) scale(0.98); }
      to { opacity: 1; transform: none; }
    }

    @keyframes toast-timer {
      from { transform: scaleX(1); }
      to { transform: scaleX(0); }
    }

    @media (max-width: 640px) {
      .stack {
        left: 14px;
        right: 14px;
        bottom: 14px;
        align-items: stretch;
        max-width: none;
      }

      .toast {
        width: auto;
        min-width: 0;
        max-width: none;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .toast { animation: none; }
      .timer { animation: none; display: none; }
    }
  `,
})
export class ToastContainerComponent {
  readonly toastService = inject(ToastService);
}
