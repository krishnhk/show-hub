import { ChangeDetectionStrategy, Component, OnDestroy, signal } from '@angular/core';

const SEEN_KEY = 'thiraihub.splash.seen';
const HOLD_MS = 3000;
const FADE_MS = 400;

const ORBITS = [
  { count: 22, radius: 47, width: 9, opacity: 0.55, seconds: 160, reverse: false },
  { count: 16, radius: 34, width: 6.4, opacity: 0.4, seconds: 120, reverse: true },
  { count: 12, radius: 24, width: 4.6, opacity: 0.28, seconds: 90, reverse: false },
];

/** Opening screen: the Ticket Play outline draws itself, fills, then the name appears. Plays once per session. */
@Component({
  selector: 'app-splash',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (visible()) {
      <div class="splash" [class.leaving]="leaving()" role="status" aria-label="Loading ThiraiHub" (click)="dismiss()">
        <div class="scene" aria-hidden="true">
          <svg class="defs" width="0" height="0" focusable="false">
            <symbol id="splash-stub" viewBox="0 0 120 80">
              <path
                fill="currentColor"
                d="M10 0h100a10 10 0 0 1 10 10v8a12 12 0 0 0 0 24v28a10 10 0 0 1-10 10H10A10 10 0 0 1 0 70V58a12 12 0 0 0 0-24V10A10 10 0 0 1 10 0z"
              />
              <path fill="var(--bg)" d="M30 22l30 18-30 18z" />
              <g fill="var(--bg)">
                <rect x="84" y="14" width="7" height="7" rx="1" />
                <rect x="84" y="29" width="7" height="7" rx="1" />
                <rect x="84" y="44" width="7" height="7" rx="1" />
                <rect x="84" y="59" width="7" height="7" rx="1" />
              </g>
            </symbol>
          </svg>
          <div class="dots"></div>
          <div class="hole l"></div>
          <div class="hole r"></div>
          <div class="ring" style="--d: 40"></div>
          <div class="ring" style="--d: 56"></div>
          <div class="ring" style="--d: 76"></div>
          <div class="sprock" style="--d: 62; --t: 100s"></div>
          <div class="sprock rev" style="--d: 88; --t: 140s"></div>
          @for (orbit of orbits; track $index) {
            <div class="orbit" [class.rev]="orbit.reverse" [style.--t]="orbit.seconds + 's'">
              @for (stub of orbit.stubs; track $index) {
                <div class="stub" [style.--a]="stub.angle + 'deg'" [style.--r]="orbit.radius" [style.--w]="orbit.width" [style.--op]="stub.opacity">
                  <svg viewBox="0 0 120 80"><use href="#splash-stub" /></svg>
                </div>
              }
            </div>
          }
          <div class="core"></div>
          <div class="edge top"><span>ThiraiHub</span><span>35mm · 24 fps</span><span>Now showing</span></div>
          <div class="edge bottom"><span>Reel 01</span><span>Book · Resell · Repeat</span><span>Frame 0001</span></div>
        </div>
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
      overflow: hidden;
      /* one unit = 1% of the wider of the screen width or a 16:9 width, so the scene fills phones and desktops alike */
      --u: max(1vw, 0.5625vh);
      --ink: color-mix(in srgb, var(--text) 16%, transparent);
      background: radial-gradient(60% 80% at 50% 50%, color-mix(in srgb, var(--bg) 70%, white) 0%, var(--bg) 60%, color-mix(in srgb, var(--bg) 92%, var(--text)) 100%);
      transition: opacity 400ms ease;
    }

    .splash.leaving { opacity: 0; pointer-events: none; }

    /* tall phone screens: scale the scene to the height so the reel fills it instead of floating in the middle */
    @media (orientation: portrait) {
      .splash { --u: max(1vw, 0.8vh); }
      .edge { letter-spacing: 0.16em; padding: 0 16px; }
    }

    .scene { position: absolute; inset: 0; animation: fade-in 700ms both; }
    .defs { position: absolute; }
    .dots {
      position: absolute;
      inset: 0;
      background: radial-gradient(color-mix(in srgb, var(--text) 10%, transparent) 1px, transparent 1.3px) 0 0 / calc(2.4 * var(--u)) calc(2.4 * var(--u));
      mask: radial-gradient(closest-side, #000, transparent);
    }

    .ring, .sprock {
      position: absolute;
      left: 50%;
      top: 50%;
      width: calc(var(--d) * var(--u));
      height: calc(var(--d) * var(--u));
      border-radius: 50%;
      /* a separate property, so the spin animation (which sets transform) does not drop the centring */
      translate: -50% -50%;
    }
    .ring { border: 1px solid var(--ink); }
    .sprock { border: max(2px, calc(0.7 * var(--u))) dashed var(--ink); animation: spin var(--t) linear infinite; }
    .sprock.rev, .orbit.rev { animation-direction: reverse; }

    .orbit { position: absolute; left: 50%; top: 50%; width: 0; height: 0; animation: spin var(--t) linear infinite; }
    /* rotate around the orbit's centre, not the stub's own middle, so every stub sits on the same circle */
    .stub { position: absolute; left: 0; top: 0; transform-origin: 0 0; transform: rotate(var(--a)) translateY(calc(var(--r) * var(--u) * -1)) rotate(90deg); }
    .stub svg { display: block; width: calc(var(--w) * var(--u)); height: auto; transform: translate(-50%, -50%); color: var(--brand); opacity: var(--op); }

    .core {
      position: absolute;
      left: 50%;
      top: 50%;
      width: calc(46 * var(--u));
      height: calc(46 * var(--u));
      transform: translate(-50%, -50%);
      border-radius: 50%;
      background: radial-gradient(closest-side, color-mix(in srgb, var(--bg) 40%, white 60%), color-mix(in srgb, var(--bg) 70%, white 30%) 60%, transparent);
    }

    .hole {
      position: absolute;
      top: 0;
      bottom: 0;
      width: calc(3 * var(--u));
      background: repeating-linear-gradient(180deg, color-mix(in srgb, var(--text) 12%, transparent) 0 calc(1.6 * var(--u)), transparent calc(1.6 * var(--u)) calc(3.4 * var(--u)));
      mask: linear-gradient(90deg, #000, transparent);
      animation: holes 6s linear infinite;
    }
    .hole.l { left: 0; }
    .hole.r { right: 0; transform: scaleX(-1); }

    .edge {
      position: absolute;
      left: 0;
      right: 0;
      display: flex;
      justify-content: space-between;
      padding: 0 calc(4.6 * var(--u));
      font-size: clamp(9px, calc(1.1 * var(--u)), 13px);
      font-weight: 600;
      letter-spacing: 0.3em;
      text-transform: uppercase;
      color: color-mix(in srgb, var(--text) 42%, transparent);
    }
    .edge.top { top: calc(2 * var(--u)); }
    .edge.bottom { bottom: calc(2 * var(--u)); }

    @keyframes spin { to { transform: rotate(360deg); } }
    @keyframes holes { to { background-position: 0 calc(3.4 * var(--u)); } }

    .lock { position: relative; display: flex; flex-direction: column; align-items: center; gap: 22px; }
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
  /** Rings of ticket stubs that orbit the logo like a projector reel (radius and width in scene units). */
  readonly orbits = ORBITS.map((orbit) => ({
    ...orbit,
    stubs: Array.from({ length: orbit.count }, (_, index) => ({
      angle: (360 / orbit.count) * index,
      opacity: +(orbit.opacity * (0.45 + 0.55 * ((index % 4) / 3))).toFixed(2),
    })),
  }));
  readonly visible = signal(false);
  readonly leaving = signal(false);

  private holdTimer?: ReturnType<typeof setTimeout>;
  private fadeTimer?: ReturnType<typeof setTimeout>;

  constructor() {
    if (this.alreadySeen() || this.prefersReducedMotion()) {
      return;
    }

    this.visible.set(true);
    // the page behind must not show its scrollbar over the opening screen
    document.documentElement.style.overflow = 'hidden';
    this.holdTimer = setTimeout(() => this.dismiss(), HOLD_MS);
  }

  ngOnDestroy(): void {
    clearTimeout(this.holdTimer);
    clearTimeout(this.fadeTimer);
    document.documentElement.style.overflow = '';
  }

  dismiss(): void {
    if (!this.visible() || this.leaving()) {
      return;
    }

    clearTimeout(this.holdTimer);
    this.markSeen();
    this.leaving.set(true);
    this.fadeTimer = setTimeout(() => {
      this.visible.set(false);
      document.documentElement.style.overflow = '';
    }, FADE_MS);
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
