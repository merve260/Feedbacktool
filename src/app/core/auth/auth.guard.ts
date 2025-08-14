// src/app/core/auth/auth.guard.ts
import { Injectable, inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { map, tap } from 'rxjs/operators';

export const AuthGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  // Wenn nicht eingeloggt → /admin (Login)
  return auth.isAuthenticated$.pipe(
    tap(ok => { if (!ok) router.navigate(['/admin']); }),
    map(ok => ok)
  );
};
