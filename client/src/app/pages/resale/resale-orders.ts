import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { ResaleTransaction } from '../../core/models/resale.model';
import { ResaleService } from '../../core/services/resale.service';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { ShowDatePipe, ShowTimePipe, TimeAgoPipe } from '../../shared/pipes/date.pipes';
import { InrPipe } from '../../shared/pipes/inr.pipe';

type OrderTab = 'All' | 'buyer' | 'seller';

@Component({
  selector: 'app-resale-orders',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    LoadingSpinnerComponent,
    EmptyStateComponent,
    ShowDatePipe,
    ShowTimePipe,
    TimeAgoPipe,
    InrPipe,
  ],
  templateUrl: './resale-orders.html',
  styleUrl: './resale-orders.css',
})
export class ResaleOrdersComponent implements OnInit {
  private readonly resale = inject(ResaleService);

  readonly tabs: { key: OrderTab; label: string }[] = [
    { key: 'All', label: 'All orders' },
    { key: 'buyer', label: 'Buying' },
    { key: 'seller', label: 'Selling' },
  ];

  readonly transactions = signal<ResaleTransaction[]>([]);
  readonly tab = signal<OrderTab>('All');
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  readonly visible = computed(() => {
    const tab = this.tab();
    return tab === 'All'
      ? this.transactions()
      : this.transactions().filter((transaction) => transaction.role === tab);
  });

  readonly totals = computed(() => {
    const all = this.transactions();
    return {
      buying: all.filter((transaction) => transaction.role === 'buyer').length,
      selling: all.filter((transaction) => transaction.role === 'seller').length,
    };
  });

  ngOnInit(): void {
    this.load();
  }

  setTab(tab: OrderTab): void {
    this.tab.set(tab);
  }

  statusClass(transaction: ResaleTransaction): string {
    switch (transaction.status) {
      case 'Completed':
        return 'badge-success';
      case 'Refunded':
        return 'badge-info';
      default:
        return 'badge-danger';
    }
  }

  private load(): void {
    this.loading.set(true);
    this.error.set(null);

    this.resale.getTransactions().subscribe({
      next: (response) => {
        this.transactions.set(response.transactions);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.error.set('We could not load your resale orders. Please try again.');
      },
    });
  }
}
