import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';

/**
 * Turns API failures into user friendly toasts and redirects to the login
 * screen when the session has expired. Internal error details are never
 * surfaced to the user — only the message the API chose to expose.
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const toast = inject(ToastService);
  const auth = inject(AuthService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      const status = error.status;
      const message = extractMessage(error);

      if (status === 401) {
        auth.logout();
        toast.info('Please sign in to continue.');
        router.navigate(['/sign-in'], { queryParams: { returnUrl: router.url } });
        return throwError(() => error);
      }

      if (status !== 0) {
        toast.error(message);
      }

      return throwError(() => error);
    }),
  );
};

function extractMessage(error: HttpErrorResponse): string {
  const payload = error.error as { message?: string; error?: string } | null;
  return payload?.message ?? payload?.error ?? 'Something went wrong. Please try again.';
}
