import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialog } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ConfirmDialogComponent } from '../../dialogs/confirm-dialog.component';

@Component({
  selector: 'app-star-rating-modal',
  standalone: true,
  templateUrl: './star-rating-modal.component.html',
  styleUrls: ['./star-rating-modal.component.scss'],
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatOptionModule,
    MatButtonModule,
    MatIconModule
  ]
})
export class StarRatingModalComponent {
  initialData: string = '';

  constructor(
    public dialogRef: MatDialogRef<StarRatingModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private dialog: MatDialog
  ) {
    // Standardwert für Sterne (falls nicht gesetzt)
    if (!this.data.maxStars) {
      this.data.maxStars = 5;
    }
    // Anfangszustand merken (für Dirty-Check)
    this.initialData = JSON.stringify(this.data);
  }

  // Speichern und Dialog schließen
  onSave() {
    this.dialogRef.close(this.data);
  }

  // Prüfen, ob Änderungen gemacht wurden
  isDirty(): boolean {
    return this.initialData !== JSON.stringify(this.data);
  }

  // Abbrechen mit Warnung bei ungespeicherten Änderungen
  onCancel() {
    if (!this.isDirty()) {
      this.dialogRef.close();
    } else {
      const confirmDialog = this.dialog.open(ConfirmDialogComponent, {
        width: '700px',
        disableClose: true,
        data: {
          title: 'Änderungen verwerfen?',
          message: 'Sie haben ungespeicherte Änderungen. Möchten Sie wirklich verlassen?'
        }
      });

      confirmDialog.afterClosed().subscribe(result => {
        if (result === true) {
          this.dialogRef.close();
        }
      });
    }
  }
}
