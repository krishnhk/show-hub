import { ChangeDetectionStrategy, Component, ElementRef, effect, inject, input, output } from '@angular/core';

/** One day in the strip. A day with nothing to show is disabled. */
export interface StripDay {
  key: string;
  weekday: string;
  number: number;
  month: string;
  enabled: boolean;
}

/** Disabled days shown after the last day that has anything. */
const TRAILING_DAYS = 7;

/** A date as local yyyy-mm-dd, so shows and strip days compare by calendar day. */
export function dayKey(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

function fromKey(key: string): Date {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year, (month ?? 1) - 1, day ?? 1);
}

function stripDay(date: Date, today: Date, enabled: boolean): StripDay {
  const key = dayKey(date);
  return {
    key,
    weekday: key === dayKey(today) ? 'Today' : date.toLocaleDateString('en-IN', { weekday: 'short' }),
    number: date.getDate(),
    month: date.toLocaleDateString('en-IN', { month: 'short' }),
    enabled,
  };
}

/**
 * Only the days that have something, starting with the first one even when today and tomorrow are
 * empty, then a week of disabled days after the last. With nothing at all it shows a week of
 * disabled days from today.
 */
export function buildStripDays(withItems: Set<string>): StripDay[] {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const keys = [...withItems].sort();
  const last = keys.length ? fromKey(keys[keys.length - 1]) : new Date(today.getTime() - 86_400_000);

  return [
    ...keys.map((key) => stripDay(fromKey(key), today, true)),
    ...Array.from({ length: TRAILING_DAYS }, (_, offset) =>
      stripDay(new Date(last.getFullYear(), last.getMonth(), last.getDate() + offset + 1), today, false),
    ),
  ];
}

/**
 * The days that have something, one picked at a time like tabs. Days with no listings or shows are
 * disabled, and the picked day cannot be switched off.
 */
@Component({
  selector: 'app-day-strip',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="days" role="group" [attr.aria-label]="label()">
      @for (d of days(); track d.key) {
        <button
          type="button"
          class="day"
          [class.on]="selected() === d.key"
          [disabled]="!d.enabled"
          [attr.aria-pressed]="selected() === d.key"
          (click)="picked.emit(d.key)"
        >
          <small>{{ d.weekday }}</small>
          <b>{{ d.number }}</b>
          <small>{{ d.month }}</small>
        </button>
      }
    </div>
  `,
  styles: `
    /* The 2px of padding keeps the focus ring from being clipped; the negative margin puts the first day
       exactly on the page's left edge. */
    .days {
      display: flex;
      gap: 8px;
      margin-inline: -2px;
      padding: 2px 2px 8px;
      overflow-x: auto;
      scrollbar-width: none;
    }

    .days::-webkit-scrollbar { display: none; }

    .day {
      flex: 0 0 auto;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1px;
      min-width: 68px;
      padding: 8px 10px;
      border: 1px solid var(--border);
      border-radius: var(--radius-sm, 10px);
      background: var(--surface);
      color: var(--text);
      font-family: inherit;
      cursor: pointer;
    }

    .day b { font-size: 1.1rem; line-height: 1.2; }

    .day small {
      font-size: 0.68rem;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: var(--text-muted);
    }

    .day.on {
      border-color: var(--text);
      background: var(--text);
      color: var(--bg);
    }

    .day.on small { color: var(--bg); opacity: 0.75; }

    .day:disabled {
      border-style: dashed;
      background: transparent;
      color: var(--text-muted);
      opacity: 0.5;
      cursor: not-allowed;
    }

    .day:focus-visible {
      outline: 2px solid var(--accent);
      outline-offset: 2px;
    }
  `,
})
export class DayStripComponent {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly days = input.required<StripDay[]>();
  /** The picked day as yyyy-mm-dd. */
  readonly selected = input<string | null>(null);
  readonly label = input('Show day');
  readonly picked = output<string>();
  constructor() {
    // On a narrow screen the picked day can be off to the side, so slide the strip to it.
    effect(() => {
      this.selected();
      this.days();
      setTimeout(() => {
        const strip = this.host.nativeElement.querySelector<HTMLElement>('.days');
        const day = strip?.querySelector<HTMLElement>('.day.on');
        if (strip && day) {
          strip.scrollTo({ left: day.offsetLeft - (strip.clientWidth - day.offsetWidth) / 2 });
        }
      });
    });
  }
}
