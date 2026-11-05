import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  computed,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';

import { ResaleTicketDetail } from '../../core/models/resale.model';
import { AuthService } from '../../core/services/auth.service';
import { LocationService } from '../../core/services/location.service';
import { ResaleService } from '../../core/services/resale.service';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { buildStripDays, DayStripComponent, dayKey } from '../../shared/components/day-strip/day-strip.component';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { ResaleCardComponent } from '../../shared/components/resale-card/resale-card.component';

type FilterKey = 'need' | 'language';

interface Dropdown {
  key: FilterKey;
  label: string;
  /** What is picked, shown on the button; null while the filter is off. */
  value: string | null;
  options: { id: string | number | null; label: string }[];
  selected: string | number | null;
}

/**
 * The marketplace of spare tickets from other people, soonest show first. The city comes from the
 * app-wide location picker. A buyer can search by movie name, say how many tickets are needed and
 * pick a language.
 */
@Component({
  selector: 'app-resale-browse',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DayStripComponent, ResaleCardComponent, LoadingSpinnerComponent, EmptyStateComponent],
  templateUrl: './resale-browse.html',
  styleUrl: './resale-browse.css',
})
export class ResaleBrowseComponent {
  private readonly resale = inject(ResaleService);
  private readonly location = inject(LocationService);
  private readonly auth = inject(AuthService);

  readonly query = signal('');
  /** How many tickets the buyer needs; null means any number. */
  readonly need = signal<number | null>(null);
  /** The show language the buyer wants; null means any. */
  readonly language = signal<string | null>(null);

  /** Which filter dropdown is open; each filter has its own. */
  readonly openMenu = signal<FilterKey | null>(null);

  readonly counts = [1, 2, 3, 4];

  private readonly allTickets = signal<ResaleTicketDetail[]>([]);

  /** Languages that appear in the current listings, for the filter menu. */
  readonly languages = computed(() =>
    [...new Set(this.allTickets().map((ticket) => ticket.showtime.language))].sort(),
  );

  /** The filters, each a button with its own dropdown of options. */
  readonly dropdowns = computed<Dropdown[]>(() => {
    const need = this.need();
    const language = this.language();
    return [
      {
        key: 'need',
        label: 'Tickets',
        value: need === null ? null : need === 1 ? '1 ticket' : `${need} tickets`,
        options: [
          { id: null, label: 'Any number' },
          ...this.counts.map((n) => ({ id: n, label: n === 1 ? '1 ticket' : `${n} tickets` })),
        ],
        selected: need,
      },
      {
        key: 'language',
        label: 'Language',
        value: language,
        options: [{ id: null, label: 'Any language' }, ...this.languages().map((l) => ({ id: l, label: l }))],
        selected: language,
      },
    ];
  });
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  /** The day picked in the day strip, as a local yyyy-mm-dd; null means any day. */
  readonly day = signal<string | null>(null);

  /** Today and the days after it, each enabled only when someone has a ticket for that day. */
  readonly days = computed(() => {
    const me = this.auth.user()?.id;
    return buildStripDays(
      new Set(
        this.allTickets()
          .filter((ticket) => ticket.seller.id !== me)
          .map((ticket) => dayKey(new Date(ticket.showtime.showDateTime))),
      ),
    );
  });

  /** The city of the app-level location, shown above the list. */
  readonly city = this.location.city;

  /** Whether anything is narrowing the list. */
  readonly narrowed = computed(() => !!this.query() || this.need() !== null || !!this.language());

  /** Other people's tickets only (nobody buys their own listing), matching the search and the filters. */
  readonly tickets = computed(() => {
    const me = this.auth.user()?.id;
    const text = this.query().trim().toLowerCase();
    const need = this.need();
    const language = this.language();
    const day = this.day();

    return this.allTickets()
      .filter((ticket) => ticket.seller.id !== me)
      .filter((ticket) => !text || ticket.showtime.movie.title.toLowerCase().includes(text))
      .filter((ticket) => need === null || this.canBuy(ticket, need))
      .filter((ticket) => !language || ticket.showtime.language === language)
      .filter((ticket) => !day || dayKey(new Date(ticket.showtime.showDateTime)) === day)
      .sort(
        (a, b) =>
          new Date(a.showtime.showDateTime).getTime() - new Date(b.showtime.showDateTime).getTime(),
      );
  });

  constructor() {
    // Reload whenever the city in the top bar changes.
    effect(() => {
      const city = this.location.city();
      untracked(() => this.load(city));
    });

    // Show the first day that has a listing, today if it has one, and move on if the picked day empties.
    effect(() => {
      const days = this.days();
      const first = days.find((day) => day.enabled);
      untracked(() => {
        const current = days.find((day) => day.key === this.day());
        if (!current?.enabled) {
          this.day.set(first?.key ?? null);
        }
      });
    });
  }

  toggleMenu(key: FilterKey): void {
    this.openMenu.update((open) => (open === key ? null : key));
  }

  /** Closes the open dropdown when the click lands outside every filter. */
  @HostListener('document:click', ['$event'])
  closeOnOutsideClick(event: MouseEvent): void {
    if (this.openMenu() && !(event.target as HTMLElement).closest('.filter')) {
      this.openMenu.set(null);
    }
  }

  @HostListener('document:keydown.escape')
  closeMenu(): void {
    this.openMenu.set(null);
  }

  pick(key: FilterKey, id: string | number | null): void {
    if (key === 'need') {
      this.need.set(id as number | null);
    } else {
      this.language.set(id as string | null);
    }
    this.openMenu.set(null);
  }

  setNeed(count: number | null): void {
    this.need.set(count);
  }

  setLanguage(language: string | null): void {
    this.language.set(language);
  }

  clearSearch(): void {
    this.query.set('');
  }

  clearAll(): void {
    this.query.set('');
    this.need.set(null);
    this.language.set(null);
  }

  /** The day strip works like tabs: one day is always showing, so there is nothing to clear. */
  selectDay(key: string): void {
    this.day.set(key);
  }

  /** A buyer who needs `count` tickets can take them from this listing: all of it, or that many seats of a split one. */
  private canBuy(ticket: ResaleTicketDetail, count: number): boolean {
    const seats = ticket.seatNumbers.length;
    return seats === count || (ticket.allowPartial && seats >= count);
  }

  private load(city: string | null): void {
    this.loading.set(true);
    this.error.set(null);

    this.resale.getTickets({ city: city ?? 'All' }).subscribe({
      next: (response) => {
        this.allTickets.set(response.tickets);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.error.set('We could not load the resale marketplace. Please try again.');
      },
    });
  }
}
