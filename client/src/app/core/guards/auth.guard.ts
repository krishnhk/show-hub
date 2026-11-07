import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  if (auth.isLoggedIn()) {
    return true;
  }

  const router = inject(Router);
  return router.createUrlTree(['/sign-in'], { queryParams: { returnUrl: state.url } });
};
