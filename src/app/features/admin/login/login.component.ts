// src/app/features/admin/login/login.component.ts
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { AuthDialogComponent } from '../../../shared/auth-dialog/auth-dialog.component';

@Component({
  selector: 'app-login',
  standalone: true,
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  imports: [CommonModule, MatButtonModule, MatIconModule, MatDialogModule]
})
export class LoginComponent {
  private dialog = inject(MatDialog);
  currentYear = new Date().getFullYear();

  openAuth(initial: 'login' | 'register' = 'login') {
    this.dialog.open(AuthDialogComponent, {
      width: '720px',
      maxWidth: '92vw',
      panelClass: 'pol-dialog',
      backdropClass: 'pol-backdrop',
      data: { initialTab: initial },
      disableClose: true
    });
  }
}
