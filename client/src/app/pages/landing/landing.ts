import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  HostListener,
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
const UPCOMING_SHOWN = 3;

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

  /** The signed-in visitor's next few shows that have not started, leaving out seats listed for resale. */
  readonly upcoming = signal<BookingDetail[]>([]);
  readonly nextShow = computed(() => this.upcoming()[0] ?? null);

  /** Whether the pill has opened into the slides of stubs, and which slide is showing. */
  readonly dockOpen = signal(false);
  readonly slide = signal(0);

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

    // The floating pill sits over the bottom of the page, so leave room under the footer for it.
    effect(() => {
      this.document.body.classList.toggle('has-dock', this.nextShow() !== null);
    });
    this.destroyRef.onDestroy(() => this.document.body.classList.remove('has-dock'));

    effect(() => {
      if (!this.auth.isLoggedIn()) {
        this.upcoming.set([]);
        return;
      }
      this.bookings.getBookings('Completed').subscribe({
        next: (response) => {
          const now = Date.now();
          const upcoming = response.bookings
            .filter((booking) => !booking.isListed && new Date(booking.showtime.showDateTime).getTime() > now)
            .sort(
              (a, b) =>
                new Date(a.showtime.showDateTime).getTime() - new Date(b.showtime.showDateTime).getTime(),
            );
          this.upcoming.set(upcoming.slice(0, UPCOMING_SHOWN));
        },
        error: () => this.upcoming.set([]),
      });
    });
  }

  toggleDock(): void {
    this.dockOpen.update((open) => !open);
    this.slide.set(0);
  }

  /** Closes the slides, and brings the pill back, when the click lands outside the dock. */
  @HostListener('document:click', ['$event'])
  closeDockOnOutsideClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    // The pill leaves the page as it opens, so a click that landed on it is not an outside click.
    if (this.dockOpen() && target.isConnected && !target.closest('.dock')) {
      this.dockOpen.set(false);
    }
  }

  @HostListener('document:keydown.escape')
  closeDock(): void {
    this.dockOpen.set(false);
  }

  /** How far one slide is from the next, gap included. */
  private stride(track: HTMLElement): number {
    const [first, second] = Array.from(track.children) as HTMLElement[];
    return first && second ? second.offsetLeft - first.offsetLeft : 0;
  }

  /** Keeps the dots in step with the slide the visitor has swiped to. */
  onSlides(track: HTMLElement): void {
    const stride = this.stride(track);
    if (stride > 0) {
      this.slide.set(Math.round(track.scrollLeft / stride));
    }
  }

  /** Moves one slide left or right. */
  step(track: HTMLElement, direction: number): void {
    track.scrollBy({ left: direction * this.stride(track), behavior: 'smooth' });
  }

  /** Which way the featured film last moved, so the next one slides in from the right side. */
  readonly swipeDirection = signal(1);
  private touchStartX = 0;
  private touchStartY = 0;

  showFeatured(index: number): void {
    this.swipeDirection.set(index >= this.featuredIndex() ? 1 : -1);
    this.featuredIndex.set(index);
  }

  swipeStart(event: TouchEvent): void {
    this.touchStartX = event.changedTouches[0].clientX;
    this.touchStartY = event.changedTouches[0].clientY;
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
