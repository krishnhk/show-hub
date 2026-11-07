import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from '../services/auth.service';

/** Transactions require a verified phone number. */
export const verifiedGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isLoggedIn()) {
    return router.createUrlTree(['/sign-in'], { queryParams: { returnUrl: state.url } });
  }

  const user = auth.user();
  if (!user) {
    return true;
  }

  if (!user.isPhoneVerified) {
    return router.createUrlTree(['/settings'], { queryParams: { verify: '1' } });
  }

  return true;
};
