import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class LoadingService {
  private readonly pendingSignal = signal(0);

  readonly pending = this.pendingSignal.asReadonly();
  readonly isLoading = signal(false);

  start(): void {
    this.pendingSignal.update((value) => value + 1);
    this.isLoading.set(true);
  }

  stop(): void {
    this.pendingSignal.update((value) => Math.max(0, value - 1));
    this.isLoading.set(this.pendingSignal() > 0);
  }
}
