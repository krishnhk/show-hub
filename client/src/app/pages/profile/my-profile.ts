import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { User } from '../../core/models/user.model';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { ContactChangeComponent } from './contact-change.component';

/** Photos are shrunk to this many pixels square before they are kept. */
const PHOTO_SIZE = 256;
const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

/**
 * The signed-in user's profile: photo, first and last name, mobile number, email and birthday.
 * It is also where the profile is edited, in place. A new mobile number or email is verified with an
 * OTP before it replaces the old one.
 */
@Component({
  selector: 'app-my-profile',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, DatePipe, ContactChangeComponent],
  templateUrl: './my-profile.html',
  styleUrl: './my-profile.css',
})
export class MyProfileComponent {
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder);

  readonly user = this.auth.user;
  readonly editing = signal(false);
  readonly saving = signal(false);
  /** The photo being edited: the current one until another is chosen, or null once it is removed. */
  readonly photo = signal<string | null>(null);
  readonly photoError = signal('');

  /** A birthday cannot be in the future. */
  readonly today = new Date().toISOString().slice(0, 10);

  readonly form = this.fb.nonNullable.group({
    firstName: ['', [Validators.required]],
    lastName: ['', [Validators.required]],
    birthday: [''],
  });

  edit(): void {
    const me = this.user();
    if (!me) {
      return;
    }
    this.form.reset({
      firstName: me.firstName,
      lastName: me.lastName,
      birthday: me.birthday ?? '',
    });
    this.photo.set(me.profileImageUrl);
    this.photoError.set('');
    this.editing.set(true);
  }

  cancel(): void {
    this.editing.set(false);
  }

  save(): void {
    const birthday = this.form.controls.birthday.value;
    if (birthday && birthday > this.today) {
      this.form.controls.birthday.setErrors({ future: true });
    }
    if (this.saving()) {
      return;
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    this.saving.set(true);
    this.auth
      .updateProfile({
        firstName: value.firstName.trim(),
        lastName: value.lastName.trim(),
        birthday: value.birthday || null,
        profileImageUrl: this.photo(),
      })
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.editing.set(false);
          this.toast.success('Profile updated.');
        },
        error: () => this.saving.set(false),
      });
  }

  removePhoto(): void {
    this.photo.set(null);
  }

  async onPhotoChosen(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) {
      return;
    }
    if (!file.type.startsWith('image/')) {
      this.photoError.set('Choose an image file.');
      return;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      this.photoError.set('Choose a photo smaller than 5 MB.');
      return;
    }

    try {
      this.photo.set(await this.shrink(file));
      this.photoError.set('');
    } catch {
      this.photoError.set('That photo could not be read. Try another one.');
    }
  }

  initials(user: User): string {
    return `${user.firstName[0] ?? ''}${user.lastName[0] ?? ''}`.toUpperCase() || (user.fullName[0] ?? '?').toUpperCase();
  }

  displayPhone(user: User): string {
    const digits = user.phoneNumber.replace(/^\+91/, '');
    return digits.length === 10
      ? `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`
      : user.phoneNumber;
  }

  /** Crops the photo to a centred square and scales it down so it stays small. */
  private async shrink(file: File): Promise<string> {
    const bitmap = await createImageBitmap(file);
    const side = Math.min(bitmap.width, bitmap.height);
    const canvas = document.createElement('canvas');
    canvas.width = PHOTO_SIZE;
    canvas.height = PHOTO_SIZE;
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('No canvas');
    }
    context.drawImage(
      bitmap,
      (bitmap.width - side) / 2,
      (bitmap.height - side) / 2,
      side,
      side,
      0,
      0,
      PHOTO_SIZE,
      PHOTO_SIZE,
    );
    bitmap.close();
    return canvas.toDataURL('image/jpeg', 0.85);
  }
}
