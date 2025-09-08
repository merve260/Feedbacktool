import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-umfrage-link-dialog',
  standalone: true,
  templateUrl: './umfrage-link-dialog.component.html',
  styleUrls: ['./umfrage-link-dialog.component.scss'],
  imports: [
    CommonModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule
  ]
})
export class UmfrageLinkDialogComponent {
  surveyLink: string;
  endDate: Date | null;

  constructor(
    public dialogRef: MatDialogRef<UmfrageLinkDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { id: string; endDate?: string },
    private snackBar: MatSnackBar
  ) {
    // Basis-Link zur Umfrage aufbauen
    this.surveyLink = `${window.location.origin}/survey/${data.id}`;
    this.endDate = data.endDate ? new Date(data.endDate) : null;
  }

  // Link in die Zwischenablage kopieren
  copyLink(): void {
    navigator.clipboard.writeText(this.surveyLink).then(() => {
      this.snackBar.open('Link kopiert!', 'OK', {
        duration: 2000,
        panelClass: ['snackbar-success']
      });
    });
  }

  // Link öffnen, nur wenn gültig und nicht abgelaufen
  openLink(): void {
    if (!this.endDate) {
      this.snackBar.open('Kein Enddatum definiert!', 'OK', {
        duration: 2500,
        panelClass: ['snackbar-error']
      });
      return;
    }

    const now = new Date();
    const deadline = new Date(this.endDate);
    deadline.setHours(23, 59, 59, 999);

    if (now > deadline) {
      this.snackBar.open('Der Link ist abgelaufen!', 'OK', {
        duration: 2500,
        panelClass: ['snackbar-error']
      });
      return;
    }

    window.open(this.surveyLink, '_blank');
  }

  // Dialog schließen
  onClose(): void {
    this.dialogRef.close();
  }
}
