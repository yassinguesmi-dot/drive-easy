import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { ApiErrorService } from './api-error.service';

export const apiErrorInterceptor: HttpInterceptorFn = (request, next) => {
  const errors = inject(ApiErrorService);
  return next(request).pipe(catchError((error: unknown) => {
    if (error instanceof HttpErrorResponse) {
      const message = error.error?.detail ?? error.error?.message
        ?? `Erreur API (${error.status || 'réseau'}). Vérifiez que le backend est démarré.`;
      errors.show(message);
    }
    return throwError(() => error);
  }));
};
