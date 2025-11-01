import { Component, Inject, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatTabsModule } from '@angular/material/tabs';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';

type AuthTab = 'login' | 'register';
interface DialogData { initialTab?: AuthTab; }

@Component({
  selector: 'app-auth-dialog',
  standalone: true,
  imports: [
    CommonModule, MatDialogModule, MatTabsModule,
    ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule
  ],
  templateUrl: './auth-dialog.component.html',
  styleUrls: ['./auth-dialog.component.scss']
})
export class AuthDialogComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  ref = inject(MatDialogRef<AuthDialogComponent>);

  // Index: 0 = Login, 1 = Registrierung
  tabIndex = 0;

  // Zustände
  isLoading = false;   // true = Anfrage läuft
  error = '';          // Fehlermeldung im UI

  constructor(@Inject(MAT_DIALOG_DATA) data: DialogData) {
    // Falls im Aufruf "register" übergeben wird, Tab wechseln
    this.tabIndex = data?.initialTab === 'register' ? 1 : 0;
  }

  // Formular für Login
  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  // Formular für Registrierung
  registerForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  // Login ausführen
  onLogin() {
    if (this.loginForm.invalid) return;
    const { email, password } = this.loginForm.getRawValue();
    this.isLoading = true;
    this.error = '';

    this.auth.login(email!, password!)
      .then(() => this.afterAuth())
      .catch(err => this.error = err?.message || 'Login fehlgeschlagen.')
      .finally(() => this.isLoading = false);
  }

  // Registrierung ausführen
  onRegister() {
    if (this.registerForm.invalid) return;
    const { email, password } = this.registerForm.getRawValue();
    this.isLoading = true;
    this.error = '';

    this.auth.register(email!, password!)
      .then(() => this.afterAuth())
      .catch(err => this.error = err?.message || 'Registrierung fehlgeschlagen.')
      .finally(() => this.isLoading = false);
  }

  // Nach erfolgreicher Authentifizierung → Dialog schließen + weiterleiten
  private afterAuth() {
    this.ref.close();
    this.router.navigate(['/admin/builder']);
  }
}
