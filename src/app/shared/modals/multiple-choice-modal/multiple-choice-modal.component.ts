import { Component, Inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import {MatCheckbox} from '@angular/material/checkbox';

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
    MatCheckbox
  ],
  templateUrl: './multiple-choice-modal.component.html',
  styleUrls: ['./multiple-choice-modal.component.scss']
})
export class MultipleChoiceModalComponent {
  constructor(
    public dialogRef: MatDialogRef<MultipleChoiceModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private cdr: ChangeDetectorRef
  ) {}

  // Neue Antwortoption hinzufügen
  addOption() {
    this.data.options.push('');
    this.cdr.detectChanges();
  }


  updateOption(index: number, event: Event) {
    const input = event.target as HTMLInputElement;
    this.data.options[index] = input.value;
  }


  // Antwortoption entfernen
  removeOption(index: number) {
    this.data.options.splice(index, 1);
  }


  // Buchstaben wie A, B, C hinzufügen
  getOptionLetter(index: number): string {
    return String.fromCharCode(65 + index); // 65 = 'A'
  }

  // Speichern und schließen
  onSave() {
    this.dialogRef.close(this.data);
  }

  // Abbrechen und schließen
  onClose() {
    this.dialogRef.close(null);
  }

  // trackBy zur Vermeidung von unnötigen Renders
  trackByIndex(index: number, _: any): number {
    return index;
  }

}

