// src/app/core/auth/auth.service.ts
import { Injectable, inject } from '@angular/core';
import { Auth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, user, updateProfile, } from '@angular/fire/auth';
import { map } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private auth = inject(Auth);
  user$ = user(this.auth);                         // Firebase User-Stream
  isAuthenticated$ = this.user$.pipe(map(u => !!u));

  get userId(): string | null {
    return this.auth.currentUser?.uid ?? null;
  }

  login(email: string, password: string) {

    return signInWithEmailAndPassword(this.auth, email, password);
  }

  register(email: string, password: string) {
    return createUserWithEmailAndPassword(this.auth, email, password);
  }
  async updateProfile(data: { displayName?: string; photoURL?: string }) {
    if (!this.auth.currentUser) throw new Error('Kein Benutzer angemeldet');
    return updateProfile(this.auth.currentUser, data);
  }

  logout() { return signOut(this.auth); }
}
