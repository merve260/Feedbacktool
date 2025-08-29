import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';

import { AuthService } from '../../../../core/auth/auth.service';
import { ConfirmDialogComponent } from '../../../../shared/dialogs/confirm-dialog.component';
import { CanComponentDeactivate } from '../../../../core/guards/unsaved-changes.guard';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-profile-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './profile-settings.component.html',
  styleUrls: ['./profile-settings.component.scss'],
})
export class ProfileSettingsComponent implements OnInit, CanComponentDeactivate {
  private fb = inject(FormBuilder);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private auth: AuthService = inject(AuthService);

  // Observable: aktueller User aus AuthService
  user$ = this.auth.user$;
  form!: FormGroup;

  ngOnInit() {
    // Wenn User geladen, Formular mit Daten füllen
    this.user$.subscribe(u => {
      if (u) {
        this.form = this.fb.group({
          displayName: [u.displayName || ''],
        });
      }
    });
  }

  // Guard: verhindert Verlassen mit ungespeicherten Änderungen
  canDeactivate(): boolean {
    return !this.form?.dirty;
  }

  // Speichern des Profils
  async saveProfile() {
    if (!this.form || !this.form.dirty) return;

    const { displayName } = this.form.value;
    try {
      await this.auth.updateProfile({ displayName });
      this.form.markAsPristine(); // Änderungen zurücksetzen

      // Erfolgsmeldung (SnackBar)
      this.snackBar.open('Profil gespeichert!', 'Schließen', {
        duration: 3000,
        horizontalPosition: 'center',
        verticalPosition: 'top',
      });

    } catch (err) {
      console.error('Fehler beim Aktualisieren!', err);

      // Fehlermeldung (SnackBar)
      this.snackBar.open('Fehler beim Speichern!', 'Schließen', {
        duration: 3000,
        horizontalPosition: 'center',
        verticalPosition: 'top',
      });
    }
  }

  // Logout mit Sicherheitsabfrage
  logout() {
    if (this.form?.dirty) {
      // Wenn Änderungen nicht gespeichert → Dialog zeigen
      const ref = this.dialog.open(ConfirmDialogComponent, {
        disableClose: true,
        data: {
          message: 'Es gibt ungespeicherte Änderungen. Wirklich verlassen?',
          confirmText: 'Verlassen',
          cancelText: 'Abbrechen'
        }
      });

      ref.afterClosed().subscribe(result => {
        if (result) {
          this.auth.logout();
        }
      });
    } else {
      // Direktes Logout ohne Warnung
      this.auth.logout();
    }
  }
}
