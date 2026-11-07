import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { BookingDetail } from '../../core/models/booking.model';
import { languagesOf, Movie } from '../../core/models/catalog.model';
import { ResaleTicketDetail } from '../../core/models/resale.model';
import { AuthService } from '../../core/services/auth.service';
import { BookingService } from '../../core/services/booking.service';
import { CatalogService } from '../../core/services/catalog.service';
import { LocationService } from '../../core/services/location.service';
import { ResaleService } from '../../core/services/resale.service';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { ResaleCardComponent } from '../../shared/components/resale-card/resale-card.component';
import { LanguageChooserComponent } from '../../shared/components/language-chooser/language-chooser.component';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { MovieCardComponent } from '../../shared/components/movie-card/movie-card.component';
import { ShowDatePipe, ShowTimePipe } from '../../shared/pipes/date.pipes';

/** How many films can take the featured spot, how many more posters follow, and how many spare tickets. */
const FEATURED_COUNT = 4;
const MOVIES_SHOWN = 6;
const SPARE_SHOWN = 4;
/** A trackpad swipe counts as one gesture until the wheel has been quiet this long. */
const WHEEL_GESTURE_GAP_MS = 200;
const DISMISSED_KEY = 'thiraihub.nextShow.dismissed';

function readDismissedId(): number | null {
  try {
    const value = Number(sessionStorage.getItem(DISMISSED_KEY));
    return value > 0 ? value : null;
  } catch {
    return null;
  }
}

/**
 * The home page. A signed-in visitor first sees their next show, then one featured film like a
 * cinema lobby poster, the rest of what is showing, and real spare tickets from the resale side.
 * The featured film is the newest release in the city; the dots switch to the next newest ones.
 */
@Component({
  selector: 'app-landing',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    ShowDatePipe,
    ShowTimePipe,
    LanguageChooserComponent,
    MovieCardComponent,
    ResaleCardComponent,
    LoadingSpinnerComponent,
    EmptyStateComponent,
  ],
  templateUrl: './landing.html',
  styleUrl: './landing.css',
})
export class LandingComponent {
  private readonly catalog = inject(CatalogService);
  private readonly resale = inject(ResaleService);
  private readonly bookings = inject(BookingService);
  private readonly auth = inject(AuthService);
  private readonly location = inject(LocationService);
  private readonly router = inject(Router);
  private readonly document = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);

  readonly loading = signal(true);
  readonly movies = signal<Movie[]>([]);

  /**
   * The newest films by release date, newest first, so the featured spot always holds the latest one,
   * including a film that opens tomorrow.
   */
  readonly featuredPicks = computed(() =>
    [...this.movies()]
      .sort((a, b) => new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime())
      .slice(0, FEATURED_COUNT),
  );

  /** Whether the language popup is open for the featured film. */
  readonly choosing = signal(false);

  private readonly featuredIndex = signal(0);
  readonly hero = computed(() => this.featuredPicks()[this.featuredIndex()] ?? null);
  readonly heroLanguages = computed(() => {
    const hero = this.hero();
    return hero ? languagesOf(hero) : [];
  });

  /** The other films, newest release first (one that opens soon comes first), without the featured one. */
  readonly others = computed(() => {
    const hero = this.hero();
    return this.movies()
      .filter((movie) => movie.id !== hero?.id)
      .sort((a, b) => new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime())
      .slice(0, MOVIES_SHOWN);
  });

  /** The signed-in visitor's soonest show that has not started, leaving out seats listed for resale. */
  readonly nextShow = signal<BookingDetail | null>(null);

  /** The booking whose card the visitor closed this session; a later show gets its own card. */
  private readonly dismissedId = signal<number | null>(readDismissedId());
  readonly showNextCard = computed(() => {
    const next = this.nextShow();
    return next && next.id !== this.dismissedId() ? next : null;
  });

  private readonly spare = signal<ResaleTicketDetail[]>([]);

  /** Other people's spare tickets, soonest show first. */
  readonly spareTop = computed(() => {
    const me = this.auth.user()?.id;
    return this.spare()
      .filter((ticket) => ticket.seller.id !== me)
      .sort(
        (a, b) =>
          new Date(a.showtime.showDateTime).getTime() - new Date(b.showtime.showDateTime).getTime(),
      )
      .slice(0, SPARE_SHOWN);
  });

  constructor() {
    effect(() => {
      const city = this.location.city();
      if (city === null) {
        return;
      }

      this.loading.set(true);
      this.featuredIndex.set(0);
      this.catalog.getMovies({ city }).subscribe({
        next: (response) => {
          this.movies.set(response.movies);
          this.loading.set(false);
        },
        error: () => {
          this.movies.set([]);
          this.loading.set(false);
        },
      });

      this.resale.getTickets({ city }).subscribe({
        next: (response) => this.spare.set(response.tickets),
        error: () => this.spare.set([]),
      });
    });

    // The next-show card sits over the bottom corner of the page, so leave room under the footer for it.
    effect(() => {
      this.document.body.classList.toggle('has-dock', this.showNextCard() !== null);
    });
    this.destroyRef.onDestroy(() => this.document.body.classList.remove('has-dock'));
    this.destroyRef.onDestroy(() => clearTimeout(this.wheelTimer));

    effect(() => {
      if (!this.auth.isLoggedIn()) {
        this.nextShow.set(null);
        return;
      }
      this.bookings.getBookings('Completed').subscribe({
        next: (response) => {
          const now = Date.now();
          const soonest = response.bookings
            .filter((booking) => !booking.isListed && new Date(booking.showtime.showDateTime).getTime() > now)
            .sort(
              (a, b) =>
                new Date(a.showtime.showDateTime).getTime() - new Date(b.showtime.showDateTime).getTime(),
            )[0];
          this.nextShow.set(soonest ?? null);
        },
        error: () => this.nextShow.set(null),
      });
    });
  }

  /** Hides the next-show card for the rest of this session. */
  dismissNextShow(bookingId: number): void {
    this.dismissedId.set(bookingId);
    try {
      sessionStorage.setItem(DISMISSED_KEY, String(bookingId));
    } catch {
      // storage can be blocked; the card then comes back on reload
    }
  }

  /** Which way the featured film last moved, so the next one slides in from the right side. */
  readonly swipeDirection = signal(1);
  private touchStartX = 0;
  private touchStartY = 0;
  private wheelMoved = false;
  private wheelTimer?: ReturnType<typeof setTimeout>;

  showFeatured(index: number): void {
    this.swipeDirection.set(index >= this.featuredIndex() ? 1 : -1);
    this.featuredIndex.set(index);
  }

  swipeStart(event: TouchEvent): void {
    this.touchStartX = event.changedTouches[0].clientX;
    this.touchStartY = event.changedTouches[0].clientY;
  }

  /**
   * A two-finger sideways swipe on a trackpad sends horizontal wheel events. One gesture moves the
   * featured film once; the gesture ends after a short pause with no wheel events (its inertia included).
   */
  swipeWheel(event: WheelEvent): void {
    const horizontal = Math.abs(event.deltaX) > Math.abs(event.deltaY) && Math.abs(event.deltaX) > 4;
    clearTimeout(this.wheelTimer);
    this.wheelTimer = setTimeout(() => (this.wheelMoved = false), WHEEL_GESTURE_GAP_MS);
    if (!horizontal || this.wheelMoved) return;

    this.wheelMoved = true;
    const next = this.featuredIndex() + (event.deltaX > 0 ? 1 : -1);
    if (next >= 0 && next < this.featuredPicks().length) this.showFeatured(next);
  }

  /** A mostly horizontal swipe moves to the next or previous featured film. */
  swipeEnd(event: TouchEvent): void {
    const dx = event.changedTouches[0].clientX - this.touchStartX;
    const dy = event.changedTouches[0].clientY - this.touchStartY;
    if (Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
    const next = this.featuredIndex() + (dx < 0 ? 1 : -1);
    if (next >= 0 && next < this.featuredPicks().length) this.showFeatured(next);
  }

  /** A film in several languages asks for one first; otherwise it opens straight away. */
  book(movie: Movie): void {
    if (this.heroLanguages().length > 1) {
      this.choosing.set(true);
    } else {
      void this.router.navigate(['/movies', movie.id]);
    }
  }

  chooseLanguage(movie: Movie, language: string): void {
    this.choosing.set(false);
    void this.router.navigate(['/movies', movie.id], { queryParams: { lang: language } });
  }
}
