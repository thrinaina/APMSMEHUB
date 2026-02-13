import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { environment } from '@environments/environment';
import { AuthService } from '@auth/auth.service';
import { catchError, switchMap, throwError } from 'rxjs';
import { TokenStorageService } from '@shared/services/token-storage/token-storage.service';
import { ActivatedRoute, Router } from '@angular/router';
import { EncryptionService } from '@services/encryption/encryption.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const tokenStorageService = inject(TokenStorageService);
  const token = authService.accessToken();
  const encryptionService = inject(EncryptionService);
  const router = inject(Router);
  const route = inject(ActivatedRoute);

  // Clone & Set Requisite Headers
  let authReq = req.clone({
    setHeaders: {
      'x-client-key': environment.clientKey, // Industry standard pre-login check
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  });

  return next(authReq).pipe(
    catchError((error) => {
      // Check if the error is from the REFRESH endpoint itself
      // If it is, DO NOT retry. Just log out.
      if (req.url.includes('/auth/refresh')) {
        const data = {
          token: tokenStorageService.getToken(),
          status: false,
          sessionLogDesc: "Logout",
          ipAddress: tokenStorageService.getIPAddress(),
          browserName: tokenStorageService.getBrowserName()
        };
        authService.inactiveSessions({ payload: encryptionService.encrypt(data) }).toPromise();
        tokenStorageService.signOut();
        router.navigate(["/"], { relativeTo: route });
        return throwError(() => error);
      }

      // Handle 401 Unauthorized (Audit-compliant silent refresh)
      if (error instanceof HttpErrorResponse && error.status === 401) {
        return authService.refreshAccessToken().pipe(
          switchMap((res: any) => {
            // Retry original request with NEW token
            const retryReq = req.clone({
              setHeaders: {
                'x-client-key': environment.clientKey,
                Authorization: `Bearer ${res.accessToken}`
              }
            });
            return next(retryReq);
          }),
          catchError((refreshErr) => {
            // If refresh fails, kill the session to stop the loop
            const data = {
              token: tokenStorageService.getToken(),
              status: false,
              sessionLogDesc: "Logout",
              ipAddress: tokenStorageService.getIPAddress(),
              browserName: tokenStorageService.getBrowserName()
            };
            authService.inactiveSessions({ payload: encryptionService.encrypt(data) }).toPromise();
            tokenStorageService.signOut();
            router.navigate(["/"], { relativeTo: route });
            return throwError(() => refreshErr);
          })
        );
      }
      return throwError(() => error);
    })
  );
};