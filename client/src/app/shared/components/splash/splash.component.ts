import { ChangeDetectionStrategy, Component, OnDestroy, signal } from '@angular/core';

const SEEN_KEY = 'thiraihub.splash.seen';
const HOLD_MS = 3000;
const FADE_MS = 400;

/** Opening screen: the Ticket Play outline draws itself, fills, then the name appears. Plays once per session. */
@Component({
  selector: 'app-splash',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (visible()) {
      <div class="splash" [class.leaving]="leaving()" role="status" aria-label="Loading ThiraiHub" (click)="dismiss()">
        <div class="lock">
          <svg viewBox="4 12 56 40" aria-hidden="true" focusable="false">
            <g class="tl">
              <path d="M10 16h34v32H10a3 3 0 0 1-3-3v-8a5 5 0 0 0 0-10v-8a3 3 0 0 1 3-3z" fill="var(--brand)" />
            </g>
            <g class="tr">
              <path d="M44 16h10a3 3 0 0 1 3 3v8a5 5 0 0 0 0 10v8a3 3 0 0 1-3 3H44z" fill="var(--brand)" />
            </g>
            <path class="perf" d="M44 20v24" stroke="var(--bg)" stroke-width="2.4" stroke-dasharray="3.5 3.5" />
            <path class="play" d="M20 25l12 7-12 7z" fill="var(--on-primary)" />
            <path
              class="outline"
              pathLength="1"
              d="M10 16h44a3 3 0 0 1 3 3v8a5 5 0 0 0 0 10v8a3 3 0 0 1-3 3H10a3 3 0 0 1-3-3v-8a5 5 0 0 0 0-10v-8a3 3 0 0 1 3-3z"
              fill="none"
              stroke="var(--accent)"
              stroke-width="1.6"
            />
          </svg>
          <span class="wm" aria-hidden="true">
            @for (letter of letters; track $index) {
              <i [class.hub]="$index >= 6" [style.--i]="$index">{{ letter }}</i>
            }
          </span>
        </div>
      </div>
    }
  `,
  styles: `
    .splash {
      position: fixed;
      inset: 0;
      z-index: 1000;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--bg);
      transition: opacity 400ms ease;
    }

    .splash.leaving { opacity: 0; pointer-events: none; }

    .lock { display: flex; flex-direction: column; align-items: center; gap: 22px; }
    svg { width: clamp(110px, 22vw, 190px); height: auto; overflow: visible; display: block; }

    .wm { font-weight: 800; font-size: clamp(32px, 6vw, 56px); letter-spacing: -0.03em; line-height: 1; color: var(--text); white-space: nowrap; }
    .wm i { font-style: normal; display: inline-block; animation: fade-up 400ms calc(1.7s + var(--i) * 60ms) both; }
    .wm i.hub { color: var(--accent); }

    .tl, .tr, .play { transform-box: fill-box; transform-origin: center; }
    .tl, .tr { animation: fade-in 500ms 1.2s both; }
    .perf { animation: fade-in 300ms 1.55s both; }
    .play { animation: pop 400ms 1.55s cubic-bezier(0.3, 1.6, 0.5, 1) both; }
    .outline { stroke-dasharray: 1; opacity: 0; animation: draw 1.6s ease-in-out both; }

    @keyframes draw {
      0% { opacity: 1; stroke-dashoffset: 1; }
      72% { opacity: 1; stroke-dashoffset: 0; }
      100% { opacity: 0; stroke-dashoffset: 0; }
    }
    @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
    @keyframes fade-up { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }
    @keyframes pop { 0% { transform: scale(0); } 70% { transform: scale(1.25); } 100% { transform: scale(1); } }

    @media (prefers-reduced-motion: reduce) {
      .splash *, .splash { animation: none !important; transition: none !important; }
    }
  `,
})
export class SplashComponent implements OnDestroy {
  readonly letters = 'ThiraiHub'.split('');
  readonly visible = signal(false);
  readonly leaving = signal(false);

  private holdTimer?: ReturnType<typeof setTimeout>;
  private fadeTimer?: ReturnType<typeof setTimeout>;

  constructor() {
    if (this.alreadySeen() || this.prefersReducedMotion()) {
      return;
    }

    this.visible.set(true);
    this.holdTimer = setTimeout(() => this.dismiss(), HOLD_MS);
  }

  ngOnDestroy(): void {
    clearTimeout(this.holdTimer);
    clearTimeout(this.fadeTimer);
  }

  dismiss(): void {
    if (!this.visible() || this.leaving()) {
      return;
    }

    clearTimeout(this.holdTimer);
    this.markSeen();
    this.leaving.set(true);
    this.fadeTimer = setTimeout(() => this.visible.set(false), FADE_MS);
  }

  private alreadySeen(): boolean {
    try {
      return sessionStorage.getItem(SEEN_KEY) === '1';
    } catch {
      return false;
    }
  }

  private markSeen(): void {
    try {
      sessionStorage.setItem(SEEN_KEY, '1');
    } catch {
      // storage can be blocked; the splash then plays on every load
    }
  }

  private prefersReducedMotion(): boolean {
    return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  }
}
