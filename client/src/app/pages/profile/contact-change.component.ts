import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, input, output, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';

import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';

type Step = 'idle' | 'enter' | 'verify';

/**
 * Changes a mobile number or an email. The new one has to be proven first: a code is sent to it and
 * the change only happens once the code is entered. Until then the old one stays on the account.
 */
@Component({
  selector: 'app-contact-change',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
  template: `
    <div class="field">
      <label [attr.for]="id()">{{ label() }}@if (kind() === 'email') { <span class="text-muted"> (optional)</span> }</label>

      @if (step() === 'idle') {
        <div class="current">
          <span class="value" [class.mono]="kind() === 'phone'" [class.muted]="!current()">
            {{ current() || 'Not added' }}
          </span>
          <button type="button" class="btn btn-outline btn-sm" (click)="start()">
            {{ current() ? 'Change' : 'Add' }}
          </button>
        </div>
      } @else if (step() === 'enter') {
        <div class="entry">
          @if (kind() === 'phone') {
            <span class="prefix mono">+91</span>
          }
          <input
            [id]="id()"
            class="input"
            [class.mono]="kind() === 'phone'"
            [type]="kind() === 'phone' ? 'tel' : 'email'"
            [attr.inputmode]="kind() === 'phone' ? 'numeric' : 'email'"
            [attr.maxlength]="kind() === 'phone' ? 10 : null"
            [placeholder]="kind() === 'phone' ? '10-digit mobile number' : 'name@example.com'"
            [formControl]="value"
            (keydown.enter)="$event.preventDefault(); send()"
          />
          <button type="button" class="btn btn-sm" [disabled]="busy()" (click)="send()">
            {{ busy() ? 'Sending…' : 'Send OTP' }}
          </button>
          <button type="button" class="btn btn-ghost btn-sm" (click)="cancel()">Cancel</button>
        </div>
      } @else {
        <p class="sent">
          We sent a 6-digit OTP to <strong>{{ kind() === 'phone' ? '+91 ' + value.value : value.value }}</strong>.
        </p>
        <div class="entry">
          <input
            [id]="id()"
            class="input otp mono"
            type="text"
            inputmode="numeric"
            maxlength="6"
            autocomplete="one-time-code"
            placeholder="6-digit OTP"
            [formControl]="otp"
            (input)="digitsOnly($event)"
            (keydown.enter)="$event.preventDefault(); verify()"
          />
          <button type="button" class="btn btn-sm" [disabled]="busy() || otp.invalid" (click)="verify()">
            {{ busy() ? 'Verifying…' : 'Verify' }}
          </button>
          <button type="button" class="btn btn-ghost btn-sm" (click)="cancel()">Cancel</button>
        </div>
        @if (devOtp(); as code) {
          <span class="hint">Demo OTP: {{ code }}</span>
        }
        <button type="button" class="link" [disabled]="busy()" (click)="send()">Resend OTP</button>
      }

      @if (error()) {
        <span class="error-text">{{ error() }}</span>
      }
    </div>
  `,
  styles: `
    :host { display: block; }
    .current { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
    .value { font-weight: 600; overflow-wrap: anywhere; }
    .value.muted { font-weight: 400; color: var(--text-muted); }
    .entry { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
    .entry .input { flex: 1; min-width: 160px; }
    .prefix { color: var(--text-soft); font-weight: 600; }
    .otp { letter-spacing: 0.3em; }
    .sent { margin: 0 0 8px; font-size: 0.88rem; color: var(--text-soft); }
    .link {
      align-self: flex-start;
      margin-top: 6px;
      padding: 0;
      border: 0;
      background: none;
      color: var(--accent);
      font: inherit;
      font-size: 0.84rem;
      font-weight: 700;
      text-decoration: underline;
      cursor: pointer;
    }
    .link:disabled { color: var(--text-muted); cursor: default; }
    .field { display: flex; flex-direction: column; }
  `,
})
export class ContactChangeComponent {
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);

  readonly kind = input.required<'phone' | 'email'>();
  /** What the account has now, already formatted for showing. */
  readonly current = input<string | null>(null);
  /** Fires once the new number or email is verified and saved. */
  readonly changed = output<void>();

  readonly step = signal<Step>('idle');
  readonly busy = signal(false);
  readonly error = signal('');
  readonly devOtp = signal('');

  readonly value = new FormControl('', { nonNullable: true });
  readonly otp = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.pattern(/^\d{6}$/)],
  });

  readonly id = computed(() => `contact-${this.kind()}`);
  readonly label = computed(() => (this.kind() === 'phone' ? 'Mobile number' : 'Email'));

  start(): void {
    this.value.reset('');
    this.otp.reset('');
    this.error.set('');
    this.step.set('enter');
  }

  cancel(): void {
    this.error.set('');
    this.step.set('idle');
  }

  digitsOnly(event: Event): void {
    const input = event.target as HTMLInputElement;
    const digits = input.value.replace(/\D/g, '').slice(0, 6);
    if (digits !== input.value) {
      input.value = digits;
    }
    this.otp.setValue(digits);
  }

  send(): void {
    const entered = this.value.value.trim();
    if (this.busy()) {
      return;
    }
    if (this.kind() === 'phone' && !/^\d{10}$/.test(entered)) {
      this.error.set('Enter a 10-digit mobile number.');
      return;
    }
    if (this.kind() === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(entered)) {
      this.error.set('Enter a valid email address.');
      return;
    }

    this.busy.set(true);
    this.error.set('');
    this.auth.sendContactOtp(this.kind(), entered).subscribe({
      next: (response) => {
        this.busy.set(false);
        this.devOtp.set(response.devOtp ?? '');
        this.otp.reset('');
        this.step.set('verify');
      },
      error: (error: HttpErrorResponse) => {
        this.busy.set(false);
        this.error.set(error.error?.message ?? 'We could not send the OTP. Try again.');
      },
    });
  }

  verify(): void {
    if (this.busy() || this.otp.invalid) {
      return;
    }

    this.busy.set(true);
    this.error.set('');
    this.auth.verifyContact(this.kind(), this.value.value.trim(), this.otp.value).subscribe({
      next: () => {
        this.busy.set(false);
        this.step.set('idle');
        this.toast.success(this.kind() === 'phone' ? 'Mobile number updated.' : 'Email updated.');
        this.changed.emit();
      },
      error: (error: HttpErrorResponse) => {
        this.busy.set(false);
        this.error.set(error.error?.message ?? 'We could not verify that OTP. Try again.');
      },
    });
  }
}
