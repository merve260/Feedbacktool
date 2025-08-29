// src/app/shared/modals/multiple-choice-modal/multiple-choice-modal.component.ts
import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialog } from '@angular/material/dialog';
import { MatCheckbox } from '@angular/material/checkbox';
import { ConfirmDialogComponent } from '../../dialogs/confirm-dialog.component';

@Component({
  selector: 'app-multiple-choice-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCheckbox,
  ],
  templateUrl: './multiple-choice-modal.component.html',
  styleUrls: ['./multiple-choice-modal.component.scss']
})
export class MultipleChoiceModalComponent implements OnInit {
  private initialState: string = '';

  constructor(
    public dialogRef: MatDialogRef<MultipleChoiceModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    // Anfangszustand merken
    this.initialState = JSON.stringify(this.data);
  }

  addOption() {
    this.data.options.push('');
  }

  updateOption(index: number, event: Event) {
    const input = event.target as HTMLInputElement;
    this.data.options[index] = input.value;
  }

  removeOption(index: number) {
    this.data.options.splice(index, 1);
  }

  // A, B, C ... für Optionen
  getOptionLetter(index: number): string {
    return String.fromCharCode(65 + index);
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

  // Prüfen, ob Änderungen vorliegen
  isDirty(): boolean {
    const currentState = JSON.stringify(this.data);
    return currentState !== this.initialState;
  }

  // Dialog bei ungespeicherten Änderungen
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

  trackByIndex(index: number, _: any): number {
    return index;
  }
}
