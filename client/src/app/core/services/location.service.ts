import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';

import { MovieListResponse } from '../models/catalog.model';
import { API_BASE } from './auth.service';

const STORAGE_KEY = 'showhub.city';

/** The city the user is browsing in. Applies across the app and is remembered between visits. */
@Injectable({ providedIn: 'root' })
export class LocationService {
  private readonly http = inject(HttpClient);

  readonly city = signal<string | null>(this.read());
  readonly cities = signal<string[]>([]);
  readonly pickerOpen = signal(false);

  /** The picker is forced open until a city has been chosen. */
  readonly pickerVisible = computed(() => this.city() === null || this.pickerOpen());

  constructor() {
    this.http.get<MovieListResponse>(`${API_BASE}/movies`).subscribe({
      next: (response) => {
        this.cities.set([...response.cities].sort());
        const current = this.city();
        if (current !== null && !response.cities.includes(current)) {
          this.city.set(null);
        }
        // With one city on offer there is nothing to choose, so skip the picker.
        if (this.city() === null && response.cities.length === 1) {
          this.select(response.cities[0]);
        }
      },
      error: () => undefined,
    });
  }

  select(city: string): void {
    this.city.set(city);
    this.write(city);
    this.pickerOpen.set(false);
  }

  openPicker(): void {
    this.pickerOpen.set(true);
  }

  closePicker(): void {
    if (this.city() !== null) {
      this.pickerOpen.set(false);
    }
  }

  private read(): string | null {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch {
      return null;
    }
  }

  private write(city: string): void {
    try {
      localStorage.setItem(STORAGE_KEY, city);
    } catch {
      // storage can be blocked; the choice then lasts for this visit only
    }
  }
}
