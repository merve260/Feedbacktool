// src/app/features/admin/login/login.component.ts
import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Router, ActivatedRoute } from '@angular/router';
import { take, switchMap } from 'rxjs/operators';

import { AuthDialogComponent } from '../../../shared/dialogs/auth-dialog/auth-dialog.component';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  imports: [CommonModule, MatButtonModule, MatIconModule, MatDialogModule],
})
export class LoginComponent implements OnInit {
  // Services
  private dialog = inject(MatDialog);
  private router = inject(Router);
  private route  = inject(ActivatedRoute);
  private auth   = inject(AuthService);

  currentYear = new Date().getFullYear();

  ngOnInit(): void {
    // Prüfen: ist der User schon eingeloggt?
    // → wenn ja, sofort zum Dashboard (/admin/umfragen)
    this.auth.isAuthenticated$.pipe(take(1)).subscribe(ok => {
      if (ok) this.router.navigateByUrl('/admin/umfragen');
    });
  }

  openAuth(initial: 'login' | 'register' = 'login') {
    // Auth-Dialog öffnen (Login oder Register Tab)
    const ref = this.dialog.open(AuthDialogComponent, {
      width: '720px',
      maxWidth: '92vw',
      panelClass: 'pol-dialog',
      backdropClass: 'pol-backdrop',
      data: { initialTab: initial },
      disableClose: true
    });

    // Nach dem Schließen prüfen:
    // wenn eingeloggt → weiterleiten zum Dashboard
    ref.afterClosed().pipe(
      switchMap(() => this.auth.isAuthenticated$.pipe(take(1)))
    ).subscribe(ok => {
      if (ok) {
        const redirect = this.route.snapshot.queryParamMap.get('redirectTo');
        this.router.navigateByUrl(redirect || '/admin/umfragen');
      }
    });
  }
}
