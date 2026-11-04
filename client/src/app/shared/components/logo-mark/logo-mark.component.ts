import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** ThiraiHub "Ticket Play" mark: a ticket stub with a play cue. */
@Component({
  selector: 'app-logo-mark',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg viewBox="4 12 56 40" [style.width.px]="width()" aria-hidden="true" focusable="false">
      <path
        d="M10 16h44a3 3 0 0 1 3 3v8a5 5 0 0 0 0 10v8a3 3 0 0 1-3 3H10a3 3 0 0 1-3-3v-8a5 5 0 0 0 0-10v-8a3 3 0 0 1 3-3z"
        fill="var(--brand)"
      />
      <path d="M20 25l12 7-12 7z" fill="var(--on-primary)" />
      <path d="M44 20v24" stroke="var(--on-primary)" stroke-width="2.4" stroke-dasharray="3.5 3.5" />
    </svg>
  `,
  styles: `
    :host { display: inline-flex; flex-shrink: 0; }
    svg { display: block; height: auto; }
  `,
})
export class LogoMarkComponent {
  readonly width = input(40);
}
