import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, OnDestroy, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { CompleteProfileRequest, UserType } from '../../core/models/user.model';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { LogoMarkComponent } from '../../shared/components/logo-mark/logo-mark.component';

type LoginStep = 'phone' | 'otp' | 'profile';

const CITIES = ['Chennai'];
const INTERESTS = [
  'Action',
  'Drama',
  'Sci-Fi',
  'Comedy',
  'Romance',
  'Horror',
  'Thriller',
  'Animation',
  'Family',
  'History',
];
const ROLES: UserType[] = ['Buyer', 'Seller', 'Both'];
const RESEND_SECONDS = 30;
const OTP_LENGTH = 6;
const DEMO_PHONE = '9876543210';

@Component({
  selector: 'app-login',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink, LogoMarkComponent],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class LoginComponent implements OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly cities = CITIES;
  readonly interests = INTERESTS;
  readonly roles = ROLES;
  readonly demoPhone = DEMO_PHONE;

  readonly step = signal<LoginStep>('phone');
  readonly loading = signal(false);
  readonly errorMessage = signal('');
  readonly noticeMessage = signal('');
  readonly devOtp = signal<string | null>(null);
  readonly resendIn = signal(0);
  readonly selectedInterests = signal<string[]>([]);

  readonly phoneForm = this.fb.group({
    phoneNumber: this.fb.control('', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(/^\d{10}$/)],
    }),
  });

  readonly otpForm = this.fb.group({
    otp: this.fb.control('', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(/^\d{6}$/)],
    }),
  });

  readonly profileForm = this.fb.group({
    firstName: this.fb.control('', { nonNullable: true, validators: [Validators.required] }),
    lastName: this.fb.control('', { nonNullable: true, validators: [Validators.required] }),
    email: this.fb.control('', { nonNullable: true, validators: [Validators.email] }),
    city: this.fb.control('Chennai', { nonNullable: true, validators: [Validators.required] }),
    userType: this.fb.control<UserType>('Both', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    birthday: this.fb.control('', { nonNullable: true }),
  });

  private readonly phoneStatus = toSignal(this.phoneForm.statusChanges, {
    initialValue: this.phoneForm.status,
  });
  private readonly otpStatus = toSignal(this.otpForm.statusChanges, {
    initialValue: this.otpForm.status,
  });
  private readonly profileStatus = toSignal(this.profileForm.statusChanges, {
    initialValue: this.profileForm.status,
  });

  readonly phoneValid = computed(() => this.phoneStatus() === 'VALID');
  readonly otpValid = computed(() => this.otpStatus() === 'VALID');
  readonly profileValid = computed(() => this.profileStatus() === 'VALID');

  private countdownId: ReturnType<typeof setInterval> | null = null;

  constructor() {
    if (this.auth.isLoggedIn()) {
      this.router.navigateByUrl(this.resolveReturnUrl());
    }
  }

  ngOnDestroy(): void {
    this.clearCountdown();
  }

  sanitizePhone(event: Event): void {
    const input = event.target as HTMLInputElement;
    const digits = input.value.replace(/\D/g, '').slice(0, 10);
    if (digits !== input.value) {
      input.value = digits;
    }
    this.phoneForm.controls.phoneNumber.setValue(digits);
  }

  sanitizeOtp(event: Event): void {
    const input = event.target as HTMLInputElement;
    const digits = input.value.replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (digits !== input.value) {
      input.value = digits;
    }
    this.otpForm.controls.otp.setValue(digits);
  }

  sendOtp(): void {
    if (!this.phoneValid() || this.loading()) {
      this.phoneForm.controls.phoneNumber.markAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');

    this.auth.sendOtp(this.phoneForm.controls.phoneNumber.value).subscribe({
      next: (response) => {
        this.loading.set(false);
        if (!response.success) {
          this.errorMessage.set(response.message);
          return;
        }
        this.noticeMessage.set(response.message);
        this.devOtp.set(response.devOtp ?? null);
        this.otpForm.reset();
        this.step.set('otp');
        this.startCountdown();
      },
      error: (error: HttpErrorResponse) => {
        this.loading.set(false);
        this.errorMessage.set(this.readError(error));
      },
    });
  }

  resendOtp(): void {
    if (this.resendIn() > 0 || this.loading()) {
      return;
    }
    this.loading.set(true);
    this.errorMessage.set('');

    this.auth.sendOtp(this.phoneForm.controls.phoneNumber.value).subscribe({
      next: (response) => {
        this.loading.set(false);
        this.noticeMessage.set(response.message);
        this.devOtp.set(response.devOtp ?? null);
        this.startCountdown();
      },
      error: (error: HttpErrorResponse) => {
        this.loading.set(false);
        this.errorMessage.set(this.readError(error));
      },
    });
  }

  verifyOtp(): void {
    if (!this.otpValid() || this.loading()) {
      this.otpForm.controls.otp.markAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');

    this.auth
      .verifyOtp(this.phoneForm.controls.phoneNumber.value, this.otpForm.controls.otp.value)
      .subscribe({
        next: (response) => {
          this.loading.set(false);
          if (response.isNewUser) {
            this.prefillProfile(response.user?.fullName, response.user?.email, response.user?.city);
            this.step.set('profile');
            return;
          }
          this.finish();
        },
        error: (error: HttpErrorResponse) => {
          this.loading.set(false);
          this.errorMessage.set(this.readError(error));
        },
      });
  }

  backToPhone(): void {
    this.errorMessage.set('');
    this.noticeMessage.set('');
    this.devOtp.set(null);
    this.otpForm.reset();
    this.clearCountdown();
    this.step.set('phone');
  }

  toggleInterest(interest: string): void {
    this.selectedInterests.update((current) =>
      current.includes(interest)
        ? current.filter((entry) => entry !== interest)
        : [...current, interest],
    );
  }

  isInterestSelected(interest: string): boolean {
    return this.selectedInterests().includes(interest);
  }

  submitProfile(): void {
    if (this.loading()) {
      return;
    }
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    const value = this.profileForm.getRawValue();
    const payload: CompleteProfileRequest = {
      firstName: value.firstName.trim(),
      lastName: value.lastName.trim(),
      email: value.email.trim() || null,
      city: value.city,
      userType: value.userType,
      birthday: value.birthday || null,
      interests: this.selectedInterests(),
    };

    this.loading.set(true);
    this.errorMessage.set('');

    this.auth.completeProfile(payload).subscribe({
      next: () => {
        this.loading.set(false);
        this.toast.success('Profile saved. Welcome to ShowHub!');
        this.finish();
      },
      error: (error: HttpErrorResponse) => {
        this.loading.set(false);
        this.errorMessage.set(this.readError(error));
      },
    });
  }

  private prefillProfile(fullName?: string | null, email?: string | null, city?: string | null): void {
    this.profileForm.patchValue({
      firstName: (fullName ?? '').trim().split(' ')[0] ?? '',
      lastName: (fullName ?? '').trim().split(' ').slice(1).join(' '),
      email: email ?? '',
      city: city && CITIES.includes(city) ? city : 'Chennai',
    });
  }

  private finish(): void {
    this.router.navigateByUrl(this.resolveReturnUrl());
  }

  private resolveReturnUrl(): string {
    const target = this.route.snapshot.queryParamMap.get('returnUrl');
    if (target && target.startsWith('/') && !target.startsWith('//')) {
      return target;
    }
    return '/';
  }

  private readError(error: HttpErrorResponse): string {
    const payload = error.error as { message?: string; error?: string } | null;
    return payload?.message ?? payload?.error ?? 'Something went wrong. Please try again.';
  }

  private startCountdown(): void {
    this.clearCountdown();
    this.resendIn.set(RESEND_SECONDS);
    this.countdownId = setInterval(() => {
      const next = this.resendIn() - 1;
      if (next <= 0) {
        this.resendIn.set(0);
        this.clearCountdown();
        return;
      }
      this.resendIn.set(next);
    }, 1000);
  }

  private clearCountdown(): void {
    if (this.countdownId !== null) {
      clearInterval(this.countdownId);
      this.countdownId = null;
    }
  }
}
