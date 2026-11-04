import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

/** The "Choose a language" popup shown before opening a movie that plays in more than one language. */
@Component({
  selector: 'app-language-chooser',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="overlay" (click)="closed.emit()">
      <div
        class="dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="language-title"
        (click)="$event.stopPropagation()"
      >
        <h3 id="language-title">Choose a language</h3>
        <p class="text-soft text-sm">{{ title() }} is showing in more than one language.</p>
        <div class="language-grid">
          @for (language of languages(); track language) {
            <button type="button" class="language" (click)="chosen.emit(language)">{{ language }}</button>
          }
        </div>
        <div class="dialog-actions">
          <button type="button" class="btn btn-ghost" (click)="closed.emit()">Cancel</button>
        </div>
      </div>
    </div>
  `,
  styles: `
    .language-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap: 10px; margin-top: 14px; }
    .language {
      min-height: 48px;
      padding: 0 14px;
      border-radius: var(--radius-sm);
      border: 1px solid var(--border);
      background: var(--surface-2);
      color: var(--text);
      font-weight: 500;
      cursor: pointer;
    }
    .language:hover { border-color: var(--accent); }
  `,
})
export class LanguageChooserComponent {
  readonly title = input.required<string>();
  readonly languages = input.required<string[]>();
  readonly chosen = output<string>();
  readonly closed = output<void>();
}
