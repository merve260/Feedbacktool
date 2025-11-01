import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { map, take } from 'rxjs/operators';

// Prüft, ob ein Nutzer eingeloggt ist, bevor er eine Route aufrufen darf
export const AuthGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  // Zugriff nur erlauben, wenn Benutzer authentifiziert ist
  // Falls nicht, wird zur Login-Seite umgeleitet
  return auth.isAuthenticated$.pipe(
    take(1),
    map(ok => ok ? true : router.createUrlTree(['/login']))
  );
};
