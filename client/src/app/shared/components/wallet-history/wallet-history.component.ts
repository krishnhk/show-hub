import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';

import { WalletEntry } from '../../../core/models/user.model';
import { InrPipe } from '../../pipes/inr.pipe';

/** Wallet transaction list: latest 10 rows with a toggle to show everything. */
@Component({
  selector: 'app-wallet-history',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, InrPipe],
  template: `
    @if (entries().length === 0) {
      <p class="empty text-sm text-muted">No wallet activity yet</p>
    } @else {
      <ul class="list">
        @for (entry of visible(); track entry.id) {
          <li class="row">
            <div class="main">
              <span class="reason">{{ entry.reason }}</span>
              <span class="date text-xs text-muted">{{ entry.createdAt | date: 'd MMM y, h:mm a' }}</span>
            </div>
            <div class="amounts">
              <span class="amt" [class.plus]="entry.type !== 'debit'">
                {{ entry.type === 'debit' ? '-' : '+' }}{{ entry.amount | inr }}
              </span>
              <span class="bal text-xs text-muted">Balance {{ entry.balanceAfter | inr }}</span>
            </div>
          </li>
        }
      </ul>
      @if (entries().length > limit()) {
        <button type="button" class="btn btn-ghost btn-sm toggle" (click)="showAll.set(!showAll())">
          {{ showAll() ? 'Show latest ' + limit() : 'Show all (' + entries().length + ')' }}
        </button>
      }
    }
  `,
  styles: `
    .list { list-style: none; margin: 0; padding: 0; }
    .row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      padding: 10px 0;
      border-bottom: 1px solid var(--border-soft);
    }
    .row:last-child { border-bottom: 0; }
    .main, .amounts { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
    .amounts { align-items: flex-end; flex-shrink: 0; }
    .reason { font-weight: 600; font-size: 0.9rem; overflow-wrap: anywhere; }
    .amt, .bal { font-family: var(--font); }
    .amt { font-weight: 700; color: var(--text); }
    .amt.plus { color: var(--success); }
    .empty { padding: 12px 0; }
    .toggle { margin-top: 8px; }
  `,
})
export class WalletHistoryComponent {
  readonly entries = input.required<WalletEntry[]>();
  /** Rows shown before the "Show all" toggle. */
  readonly limit = input(10);
  readonly showAll = signal(false);
  readonly visible = computed(() =>
    this.showAll() ? this.entries() : this.entries().slice(0, this.limit()),
  );
}
