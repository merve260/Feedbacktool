import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ConfirmDialogComponent } from '../../dialogs/confirm-dialog.component';
import {TranslateModule} from '@ngx-translate/core';

@Component({
  selector: 'app-freitext-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    TranslateModule,
  ],
  templateUrl: './freitext-modal.component.html',
  styleUrls: ['./freitext-modal.component.scss']
})
export class FreitextModalComponent implements OnInit {
  private initialState: string = '';

  constructor(
    public dialogRef: MatDialogRef<FreitextModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {
    // Anfangszustand merken
    this.initialState = JSON.stringify({
      title: this.data.title,
      text: this.data.text,
      placeholderText: this.data.placeholderText
    });
  }

  ngOnInit(): void {
    // Zustand bei Start erneut setzen
    this.initialState = JSON.stringify({
      title: this.data.title,
      text: this.data.text,
      placeholderText: this.data.placeholderText
    });
  }

  // Prüft, ob Änderungen gemacht wurden
  isDirty(): boolean {
    const currentState = JSON.stringify({
      title: this.data.title,
      text: this.data.text,
      placeholderText: this.data.placeholderText
    });
    return currentState !== this.initialState;
  }

  // Dialog, wenn ungespeicherte Änderungen vorhanden sind
  confirmLeave(): void {
    const confirmRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      disableClose: true,
      data: {
        message: 'Sie haben ungespeicherte Änderungen. Möchten Sie wirklich verlassen?',
        confirmText: 'Verlassen',
        cancelText: 'Im Dialog bleiben'
      }
    });

    confirmRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.dialogRef.close();
      }
    });
  }

  onSave() {
    this.dialogRef.close(this.data);
  }

  onCancel() {
    if (this.isDirty()) {
      this.confirmLeave();
    } else {
      this.dialogRef.close();
    }
  }
}
