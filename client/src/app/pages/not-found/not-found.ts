import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-not-found',
  imports: [RouterLink, EmptyStateComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="container" style="padding: 48px 0">
      <app-empty-state
        icon="🎬"
        title="Page not found"
        message="The page you are looking for does not exist or has moved."
      >
        <a class="btn btn-primary" routerLink="/">Back to home</a>
      </app-empty-state>
    </div>
  `,
})
export class NotFoundComponent {}
