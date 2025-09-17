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
  login(email: string, password: string) {
    return signInWithEmailAndPassword(this.auth, email, password);
  }

  // Registrierung (immer als Admin)
  async register(email: string, password: string) {
    const cred = await createUserWithEmailAndPassword(this.auth, email, password);
    const uid = cred.user.uid;

    // Rolle speichern
    await setDoc(doc(this.firestore, 'roles', uid), { role: 'admin' });

    return cred;
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


}
