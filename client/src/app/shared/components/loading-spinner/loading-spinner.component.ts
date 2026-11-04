import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-loading-spinner',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="loading-block">
      <span class="spinner" [class.spinner-lg]="large()"></span>
      @if (label()) {
        <span>{{ label() }}</span>
      }
    </div>
  `,
})
export class LoadingSpinnerComponent {
  readonly large = input<boolean>(false);
  readonly label = input<string>('Loading…');
}
