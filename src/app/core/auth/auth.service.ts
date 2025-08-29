// src/app/core/auth/auth.service.ts
import { Injectable, inject } from '@angular/core';
import {
  Auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  user,
  updateProfile
} from '@angular/fire/auth';
import { Firestore, doc, setDoc } from '@angular/fire/firestore'; // ✨ Firestore Import
import { map } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private auth = inject(Auth);
  private firestore = inject(Firestore); // ✨ Firestore-Service injizieren

  // Stream des aktuellen Firebase-Benutzers
  user$ = user(this.auth);

  // Gibt true zurück, wenn ein Benutzer eingeloggt ist
  isAuthenticated$ = this.user$.pipe(map(u => !!u));

  // Liefert die User-ID des aktuell eingeloggten Benutzers oder null
  get userId(): string | null {
    return this.auth.currentUser?.uid ?? null;
  }

  // Anmeldung mit E-Mail und Passwort
  login(email: string, password: string) {
    return signInWithEmailAndPassword(this.auth, email, password);
  }

  // Registrierung eines neuen Benutzers (immer als Admin)
  async register(email: string, password: string) {
    // 1. User in Firebase Auth erstellen
    const cred = await createUserWithEmailAndPassword(this.auth, email, password);

    // 2. UID vom neuen User holen
    const uid = cred.user.uid;

    // 3. Rolle in Firestore setzen → automatisch "admin"
    await setDoc(doc(this.firestore, 'roles', uid), { role: 'admin' });

    return cred;
  }

  // Aktualisiert Profilinformationen (Name oder Foto)
  async updateProfile(data: { displayName?: string; photoURL?: string }) {
    if (!this.auth.currentUser) throw new Error('Kein Benutzer angemeldet');
    return updateProfile(this.auth.currentUser, data);
  }

  // Abmelden des aktuellen Benutzers
  logout() {
    return signOut(this.auth);
  }
}
