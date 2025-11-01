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
import {TranslateModule} from '@ngx-translate/core';

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
    TranslateModule
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
    // Startwerte aus den übergebenen Daten übernehmen
    this.title = data?.title || '';
    this.text = data?.text || '';
    this.options = data?.options?.length ? [...data.options] : ['Option 1'];

    // Ursprungszustand merken (für Änderungsprüfung)
    this.initialState = JSON.stringify({
      title: this.title,
      text: this.text,
      options: this.options
    });
  }

  // Neue Option hinzufügen
  addOption(): void {
    this.options.push('');
  }

  // Option entfernen
  removeOption(index: number): void {
    this.options.splice(index, 1);
  }

  // Abbrechen mit Prüfung auf ungespeicherte Änderungen
  onCancel(): void {
    if (this.isDirty()) {
      this.confirmLeave();
    } else {
      this.dialogRef.close();
    }
  }

  // Speichern und Dialog schließen
  onSave(): void {
    this.dialogRef.close({
      type: 'radio',
      title: this.title,
      text: this.text,
      options: this.options
    });
  }

  // Prüfen, ob sich etwas geändert hat
  isDirty(): boolean {
    const currentState = JSON.stringify({
      title: this.title,
      text: this.text,
      options: this.options
    });
    return currentState !== this.initialState;
  }

  // Bestätigungsdialog beim Verlassen mit Änderungen
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

  // Für *ngFor -> stabile Indizes
  trackByIndex(index: number, item: string): number {
    return index;
  }
}
