import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { SeatMap } from '../../core/models/catalog.model';
import { ResaleTicketDetail } from '../../core/models/resale.model';
import { AuthService } from '../../core/services/auth.service';
import { CatalogService } from '../../core/services/catalog.service';
import { ResaleService } from '../../core/services/resale.service';
import { ToastService } from '../../core/services/toast.service';
import { WalletStore } from '../../core/services/wallet.store';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { FilmThumbComponent } from '../../shared/components/film-thumb/film-thumb.component';
import { SeatMapComponent } from '../../shared/components/seat-map/seat-map.component';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { ShowDatePipe, ShowTimePipe } from '../../shared/pipes/date.pipes';
import { InrPipe } from '../../shared/pipes/inr.pipe';

@Component({
  selector: 'app-resale-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    LoadingSpinnerComponent,
    EmptyStateComponent,
    FilmThumbComponent,
    SeatMapComponent,
    ShowDatePipe,
    ShowTimePipe,
    InrPipe,
  ],
  templateUrl: './resale-detail.html',
  styleUrl: './resale-detail.css',
})
export class ResaleDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly resale = inject(ResaleService);
  private readonly catalog = inject(CatalogService);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  protected readonly wallet = inject(WalletStore);

  readonly ticketId = Number(this.route.snapshot.paramMap.get('id'));

  readonly ticket = signal<ResaleTicketDetail | null>(null);
  readonly loading = signal(true);
  readonly notFound = signal(false);
  readonly buying = signal(false);
  /** Whether the wallet balance is applied to this purchase; on by default. */
  readonly useWallet = signal(true);
  readonly seatMap = signal<SeatMap | null>(null);
  /** Seats the buyer has chosen; starts as every seat in the listing. */
  readonly chosen = signal<string[]>([]);

  readonly canPick = computed(() => {
    const ticket = this.ticket();
    return (
      !!ticket && ticket.allowPartial && ticket.seatNumbers.length > 1 && this.isAvailable() && !this.isOwner()
    );
  });
  private readonly share = computed(() => {
    const ticket = this.ticket();
    return ticket && ticket.seatNumbers.length > 0 ? this.chosen().length / ticket.seatNumbers.length : 1;
  });
  readonly buyingAll = computed(() => {
    const ticket = this.ticket();
    return !ticket || this.chosen().length === ticket.seatNumbers.length;
  });
  /** What the chosen seats cost: the sum of each seat's own price. */
  readonly selectionPrice = computed(() => {
    const ticket = this.ticket();
    if (!ticket) {
      return 0;
    }
    if (this.buyingAll()) {
      return ticket.resalePrice;
    }
    const total = this.chosen().reduce((sum, seat) => sum + (ticket.seatPrices[seat] ?? 0), 0);
    return Math.round(total * 100) / 100;
  });
  readonly selectionOriginal = computed(() => {
    const ticket = this.ticket();
    return ticket ? Math.round(ticket.originalPrice * this.share() * 100) / 100 : 0;
  });
  readonly selectionFee = computed(() => {
    const ticket = this.ticket();
    if (!ticket) {
      return 0;
    }
    return this.buyingAll() ? ticket.buyerFee : Math.round((this.selectionPrice() * 0.025 + 0.3) * 100) / 100;
  });
  readonly selectionSellerReceives = computed(() => Math.round(this.selectionPrice() * 95) / 100);
  readonly selectionCommission = computed(() => Math.round(this.selectionPrice() * 5) / 100);
  readonly selectionTotal = computed(() => this.selectionPrice() + this.selectionFee());

  readonly isOwner = computed(() => this.ticket()?.sellerId === this.auth.user()?.id);
  readonly isAvailable = computed(() => this.ticket()?.status === 'Available');
  readonly totalBuyerPays = computed(() => {
    const ticket = this.ticket();
    return ticket ? ticket.resalePrice + ticket.buyerFee : 0;
  });
  readonly posterHue = computed(() => {
    const title = this.ticket()?.showtime.movie.title ?? '';
    let hash = 0;
    for (let index = 0; index < title.length; index++) {
      hash = (hash << 5) - hash + title.charCodeAt(index);
      hash |= 0;
    }
    return Math.abs(hash) % 360;
  });

  ngOnInit(): void {
    // The wallet balance decides whether the pay-with-wallet option shows, so load it on a direct visit too.
    if (this.auth.isLoggedIn()) {
      this.wallet.refresh();
    }

    this.resale.getTicket(this.ticketId).subscribe({
      next: (response) => {
        this.ticket.set(response.ticket);
        this.chosen.set([...response.ticket.seatNumbers]);
        this.loading.set(false);
        this.catalog.getSeats(response.ticket.showtime.id).subscribe({
          next: (seats) => this.seatMap.set(seats.seatMap),
          error: () => this.seatMap.set(null),
        });
      },
      error: () => {
        this.loading.set(false);
        this.notFound.set(true);
      },
    });
  }

  buy(): void {
    if (!this.auth.isLoggedIn()) {
      this.router.navigate(['/login'], { queryParams: { returnUrl: `/resale/${this.ticketId}` } });
      return;
    }
    if (!this.isAvailable() || this.isOwner() || this.buying()) {
      return;
    }

    if (this.chosen().length === 0) {
      this.toast.error('Choose at least one seat.');
      return;
    }

    this.buying.set(true);
    this.resale.purchase(this.ticketId, this.buyingAll() ? undefined : this.chosen(), this.useWallet()).subscribe({
      next: (response) => {
        this.buying.set(false);
        this.toast.success('Ticket booked. Complete the payment to finish.');
        this.router.navigate(['/resale/checkout', response.transactionId], {
          state: { bookingId: response.bookingId },
        });
      },
      error: () => {
        this.buying.set(false);
      },
    });
  }
}
