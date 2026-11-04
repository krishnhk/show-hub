import { Injectable, signal } from '@angular/core';

export type Theme = 'plain-grey' | 'ice-grey' | 'plain-burgundy';

export const THEMES: { id: Theme; label: string; hint: string }[] = [
  { id: 'plain-grey', label: 'Plain Grey', hint: 'Flat and calm' },
  { id: 'ice-grey', label: 'Ice Grey', hint: 'Cool slate' },
  { id: 'plain-burgundy', label: 'Plain Burgundy', hint: 'Flat, ivory and wine' },
];

const STORAGE_KEY = 'thiraihub.theme';

function readStored(): Theme {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return THEMES.some((theme) => theme.id === stored) ? (stored as Theme) : 'ice-grey';
  } catch {
    return 'ice-grey';
  }
}

/** The app's theme. The choice is applied to <html> and kept per viewer in this browser. */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly themes = THEMES;
  readonly theme = signal<Theme>(readStored());

  constructor() {
    this.apply(this.theme());
  }

  set(theme: Theme): void {
    this.theme.set(theme);
    this.apply(theme);
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // Private windows can refuse storage; the theme still applies for this visit.
    }
  }

  private apply(theme: Theme): void {
    document.documentElement.dataset['theme'] = theme;
  }
}
