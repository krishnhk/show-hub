import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-empty-state',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="empty-state">
      <div class="icon">{{ icon() }}</div>
      <h3>{{ title() }}</h3>
      @if (message()) {
        <p class="text-sm">{{ message() }}</p>
      }
      <ng-content />
    </div>
  `,
})
export class EmptyStateComponent {
  readonly icon = input<string>('🎬');
  readonly title = input<string>('Nothing here yet');
  readonly message = input<string>('');
}
