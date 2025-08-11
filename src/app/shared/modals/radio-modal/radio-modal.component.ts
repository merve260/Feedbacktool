import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatRadioModule } from '@angular/material/radio';
import { ConfirmDialogComponent } from '../../dialogs/confirm-dialog.component';

@Component({
  selector: 'app-radio-modal',
  standalone: true,
  templateUrl: './radio-modal.component.html',
  styleUrls: ['./radio-modal.component.scss'],
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatRadioModule,
    ConfirmDialogComponent
  ]
})
export class RadioModalComponent {
  title: string = '';
  text: string = '';
  options: string[] = [];
  private initialState: string = '';

  constructor(
    public dialogRef: MatDialogRef<RadioModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private dialog: MatDialog
  ) {
    this.title = data?.title || '';
    this.text = data?.text || '';
    this.options = data?.options?.length ? [...data.options] : ['Option 1'];

    this.initialState = JSON.stringify({
      title: this.title,
      text: this.text,
      options: this.options
    });
  }

  addOption(): void {
    this.options.push('');
  }

  removeOption(index: number): void {
    this.options.splice(index, 1);
  }

  onCancel(): void {
    if (this.isDirty()) {
      this.confirmLeave();
    } else {
      this.dialogRef.close();
    }
  }

  onSave(): void {
    this.dialogRef.close({
      type: 'radio',
      title: this.title,
      text: this.text,
      options: this.options
    });
  }

  isDirty(): boolean {
    const currentState = JSON.stringify({
      title: this.title,
      text: this.text,
      options: this.options
    });
    return currentState !== this.initialState;
  }

  confirmLeave(): void {
    const confirmRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      disableClose: true,
      data: {
        message: 'Sie haben ungespeicherte Änderungen.Möchten Sie wirklich verlassen?',
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

  trackByIndex(index: number, item: string): number {
    return index;
  }
}
