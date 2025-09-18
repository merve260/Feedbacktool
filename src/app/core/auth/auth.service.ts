// src/app/core/auth/auth.service.ts
import { Injectable, inject } from '@angular/core';
import {
  Auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  user,
  updateProfile as fbUpdateProfile
} from '@angular/fire/auth';
import { Firestore, doc, setDoc, docData } from '@angular/fire/firestore';
import { map, Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private auth = inject(Auth);
  private firestore = inject(Firestore);

  // Aktueller User Stream (observable für async pipe)
  user$ = user(this.auth);
  isAuthenticated$ = this.user$.pipe(map(u => !!u));

  get userId(): string | null {
    return this.auth.currentUser?.uid ?? null;
  }

  // Login
  async login(email: string, password: string): Promise<void> {
    try {
      await signInWithEmailAndPassword(this.auth, email, password);
    } catch (err: any) {
      throw new Error(this.mapAuthError(err));  // 🔥 burada
    }
  }

  // Registrierung (immer als Admin)
  async register(email: string, password: string) {
    try {
      const cred = await createUserWithEmailAndPassword(this.auth, email, password);
      const uid = cred.user.uid;

      // Rolle speichern
      await setDoc(doc(this.firestore, 'roles', uid), { role: 'admin' });

      return cred;
    } catch (err: any) {
      throw new Error(this.mapAuthError(err));
    }
  }


  // Profil updaten (Name, Foto-URL falls nötig)
  async updateProfile(data: { displayName?: string; photoURL?: string }) {
    if (!this.auth.currentUser) throw new Error('Kein Benutzer angemeldet');
    return fbUpdateProfile(this.auth.currentUser, data);
  }

  // Logout
  logout() {
    return signOut(this.auth);
  }

  // Avatar als Base64 speichern (Firestore)
  // Avatar als Base64 speichern (im roles-Dokument)
  async uploadUserAvatarBase64(base64: string): Promise<void> {
    if (!this.auth.currentUser) throw new Error('Kein Benutzer angemeldet');
    const uid = this.auth.currentUser.uid;

    await setDoc(
      doc(this.firestore, 'roles', uid),
      { photoBase64: base64 },
      { merge: true }
    );
  }

// Avatar laden
  getUserAvatar(uid: string): Observable<string | null> {
    return docData(doc(this.firestore, 'roles', uid)).pipe(
      map((data: any) => data?.photoBase64 ?? null)
    );
  }

// Avatar löschen
  async deleteAvatar(): Promise<void> {
    if (!this.auth.currentUser) throw new Error('Kein Benutzer angemeldet');
    const uid = this.auth.currentUser.uid;

    await setDoc(
      doc(this.firestore, 'roles', uid),
      { photoBase64: null },
      { merge: true }
    );

    await fbUpdateProfile(this.auth.currentUser, { photoURL: null });
  }

  async updateDisplayName(name: string) {
    if (!this.auth.currentUser) throw new Error('Kein Benutzer angemeldet');
    await fbUpdateProfile(this.auth.currentUser, { displayName: name });

    const uid = this.auth.currentUser.uid;
    await setDoc(
      doc(this.firestore, 'roles', uid),
      { displayName: name },
      { merge: true }
    );
  }

  private mapAuthError(error: any): string {
    switch (error.code) {
      case 'auth/invalid-email':
        return 'Bitte geben Sie eine gültige E-Mail-Adresse ein.';
      case 'auth/user-not-found':
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        return 'E-Mail oder Passwort ist falsch.';
      case 'auth/email-already-in-use':
        return 'Diese E-Mail-Adresse wird bereits verwendet.';
      case 'auth/weak-password':
        return 'Das Passwort ist zu schwach.';
      default:
        return 'Ein unbekannter Fehler ist aufgetreten. Bitte versuchen Sie es erneut.';
    }
  }


}
