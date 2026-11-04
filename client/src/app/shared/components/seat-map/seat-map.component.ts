import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  computed,
  inject,
  input,
  model,
  output,
  signal,
} from '@angular/core';

import { Seat, SeatMap } from '../../../core/models/catalog.model';
import { InrPipe } from '../../pipes/inr.pipe';

const SEAT_GAP_PX = 6;
const SEAT_PITCH_PX = 28 + SEAT_GAP_PX;
const ROW_LABEL_SPACE_PX = 2 * (20 + 10);

/**
 * Visual seat map with click-to-select. Emits the selected seat ids and
 * enforces the 1–8 ticket limit enforced by the booking rules.
 */
@Component({
  selector: 'app-seat-map',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [InrPipe],
  template: `
    <div class="seat-map">
      <div class="screen">
        <span>{{ seatMap().screenLabel }}</span>
      </div>

      <div class="rows" [style.zoom]="zoom()">
        @for (item of rowItems(); track item.row.label) {
          @let row = item.row;
          @if (item.header; as header) {
            <div class="category-break">
              <span class="rule"></span>
              <span class="category-name">{{ header.category }} · {{ header.price | inr }}</span>
              <span class="rule"></span>
            </div>
          }
          <div class="row-line">
            <span class="row-label">{{ row.label }}</span>
            <div class="seats">
              @for (seat of row.seats; track seat.id) {
                <button
                  type="button"
                  class="seat"
                  [class.available]="seat.status === 'Available'"
                  [class.booked]="seat.status === 'Booked'"
                  [class.blocked]="seat.status === 'Blocked'"
                  [class.selected]="isSelected(seat.id)"
                  [class.premium]="seat.category === 'Premium'"
                  [class.mine]="isHighlighted(seat.id)"
                  [class.unpicked]="pickable() && isHighlighted(seat.id) && !isSelected(seat.id)"
                  [disabled]="isDisabled(seat)"
                  [attr.aria-label]="seat.id + ' ' + seat.status + ' ' + seat.price"
                  [attr.title]="seat.id + ' · ' + seat.category + ' · ' + (seat.price | inr)"
                  (click)="toggle(seat)"
                >
                  {{ seat.number }}
                </button>
              }
            </div>
            <span class="row-label">{{ row.label }}</span>
          </div>
        }
      </div>

      <div class="legend">
        <span><i class="dot available"></i> Available</span>
        @if (readonly()) {
          <span><i class="dot selected"></i> {{ pickable() ? 'Your seats' : 'Resale seats' }}</span>
          @if (pickable()) {
            <span><i class="dot unpicked"></i> Not buying</span>
          }
        } @else {
          <span><i class="dot selected"></i> Selected</span>
        }
        <span><i class="dot booked"></i> Booked</span>
      </div>
    </div>
  `,
  styles: `
    /* A block host so its width can be measured; without it the fit-to-width size would read as 0. */
    :host { display: block; min-width: 0; }

    .seat-map { display: flex; flex-direction: column; gap: 18px; }

    /* The cinema screen: a curved bar above the rows, drawn in theme colours so it shows on light themes too. */
    .screen {
      height: 46px;
      border-radius: 50% / 100% 100% 0 0;
      background: linear-gradient(180deg, var(--surface-3), transparent);
      display: flex;
      align-items: flex-start;
      justify-content: center;
      padding-top: 8px;
      font-size: 0.72rem;
      font-weight: 700;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      color: var(--text-soft);
      border-bottom: 3px solid var(--text-muted);
    }

    .rows { display: flex; flex-direction: column; gap: 7px; overflow-x: auto; padding-bottom: 4px; }

    /* Row letters sit in fixed outer columns so they line up on both sides; the seats centre under the screen. */
    .row-line {
      display: grid;
      grid-template-columns: 20px minmax(max-content, 1fr) 20px;
      align-items: center;
      gap: 10px;
      min-width: max-content;
    }

    .category-break {
      display: flex;
      align-items: center;
      gap: 12px;
      min-width: max-content;
      margin: 8px 0 2px;
    }

    .category-break .rule { flex: 1; height: 1px; background: var(--border); }

    .category-name {
      font-size: 0.72rem;
      font-weight: 700;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: var(--text-soft);
      white-space: nowrap;
    }

    .row-label {
      width: 20px;
      flex-shrink: 0;
      text-align: center;
      font-size: 0.72rem;
      font-weight: 700;
      color: var(--text-muted);
    }

    .seats { display: flex; justify-content: center; gap: 6px; }

    .seat {
      width: 28px;
      height: 26px;
      border-radius: 6px 6px 3px 3px;
      border: 1px solid var(--text-soft);
      background: transparent;
      color: var(--text-muted);
      font-size: 0.7rem;
      font-weight: 600;
      cursor: pointer;
      transition: transform 120ms ease, background 120ms ease, border-color 120ms ease;
    }

    .seat.available:hover { transform: scale(1.12); border-color: var(--accent); }

    .seat.premium { border-color: color-mix(in srgb, var(--accent) 45%, transparent); }

    .seat.selected {
      background: var(--accent);
      border-color: var(--accent);
      color: var(--on-primary);
      transform: scale(1.08);
      box-shadow: 0 0 12px color-mix(in srgb, var(--accent) 55%, transparent);
    }

    .seat.booked,
    .seat.blocked {
      background: var(--surface-3);
      border-color: var(--surface-3);
      color: var(--text-muted);
      cursor: not-allowed;
    }

    /* Seats on offer in a resale listing: bold saffron with a glow so they read at a glance */
    .seat.mine {
      background: var(--accent);
      border-color: var(--text);
      border-width: 2px;
      color: var(--on-primary);
      font-weight: 800;
      transform: scale(1.12);
      box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 35%, transparent), 0 0 14px color-mix(in srgb, var(--accent) 70%, transparent);
      cursor: default;
      z-index: 1;
    }

    .seat.mine.unpicked {
      background: transparent;
      border: 2px dashed var(--accent);
      color: var(--accent);
      box-shadow: none;
      transform: none;
      cursor: pointer;
    }

    .seat.mine.unpicked:hover { background: var(--accent-soft); }

    .legend {
      display: flex;
      gap: 16px;
      flex-wrap: wrap;
      font-size: 0.76rem;
      color: var(--text-muted);
    }

    .legend span { display: inline-flex; align-items: center; gap: 6px; }

    .dot { width: 12px; height: 12px; border-radius: 4px; display: inline-block; border: 1px solid var(--text-soft); }
    .dot.available { background: transparent; }
    .dot.selected { background: var(--accent); border-color: var(--accent); }
    .dot.unpicked { background: transparent; border: 1.5px dashed var(--accent); }
    .dot.booked { background: var(--surface-3); border-color: var(--border); }
  `,
})
export class SeatMapComponent {
  readonly seatMap = input.required<SeatMap>();
  readonly selected = model<string[]>([]);
  readonly maxSelection = input<number>(8);
  /** Show-only mode: no seat can be picked, and the seats in `highlighted` stand out. */
  readonly readonly = input<boolean>(false);
  readonly highlighted = input<string[]>([]);
  /** In show-only mode, lets the viewer tap highlighted seats to choose some of them (kept in `selected`). */
  readonly pickable = input<boolean>(false);

  readonly selectionChange = output<string[]>();

  readonly selectedCount = computed(() => this.selected().length);

  private readonly width = signal(0);

  /** The map is always sized to fill the available width, shrinking only when the widest row would not fit. */
  readonly zoom = computed(() => {
    const widest = Math.max(...this.seatMap().rows.map((row) => row.seats.length), 1);
    // seat width + gap per seat, plus the two row-letter columns and their gaps
    const naturalWidth = widest * SEAT_PITCH_PX - SEAT_GAP_PX + ROW_LABEL_SPACE_PX;
    const width = this.width();
    return width > 0 ? Math.min(1, width / naturalWidth) : 1;
  });

  constructor() {
    const host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    this.width.set(host.clientWidth);

    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(() => this.width.set(host.clientWidth));
      observer.observe(host);
      inject(DestroyRef).onDestroy(() => observer.disconnect());
    }
  }

  /** Rows in order, with a category heading (name and price) above each new category when there is more than one. */
  readonly rowItems = computed(() => {
    const rows = this.seatMap().rows;
    const mixed = new Set(rows.map((row) => row.category)).size > 1;
    return rows.map((row, index) => ({
      row,
      header:
        mixed && (index === 0 || rows[index - 1].category !== row.category)
          ? { category: row.category, price: row.seats[0]?.price ?? 0 }
          : null,
    }));
  });

  isDisabled(seat: Seat): boolean {
    if (this.readonly()) {
      return !(this.pickable() && this.isHighlighted(seat.id));
    }
    return seat.status !== 'Available';
  }

  isHighlighted(seatId: string): boolean {
    return this.highlighted().includes(seatId);
  }

  isSelected(seatId: string): boolean {
    return this.selected().includes(seatId);
  }

  toggle(seat: Seat): void {
    if (this.readonly()) {
      if (this.pickable() && this.isHighlighted(seat.id)) {
        const current = this.selected();
        this.apply(
          current.includes(seat.id) ? current.filter((id) => id !== seat.id) : [...current, seat.id],
        );
      }
      return;
    }
    if (seat.status !== 'Available') {
      return;
    }
    const current = this.selected();
    if (current.includes(seat.id)) {
      this.apply(current.filter((id) => id !== seat.id));
      return;
    }
    if (current.length >= this.maxSelection()) {
      return;
    }
    this.apply([...current, seat.id]);
  }

  private apply(seats: string[]): void {
    this.selected.set(seats);
    this.selectionChange.emit(seats);
  }
}
