import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import {CdkDragDrop, CdkDropList, moveItemInArray} from '@angular/cdk/drag-drop';
import { DragDropModule } from '@angular/cdk/drag-drop';



@Component({
  selector: 'app-drag-drop-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    CdkDropList,
    DragDropModule
  ],
  templateUrl: './drag-drop-modal.component.html',
  styleUrls: ['./drag-drop-modal.component.scss']
})
export class DragDropModalComponent {
  constructor(
    public dialogRef: MatDialogRef<DragDropModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  // Neues Drag-Element hinzufügen
  addItem() {
    this.data.items.push('Neues Element');
  }

  // Drag-Element entfernen
  removeItem(index: number) {
    this.data.items.splice(index, 1);
  }

  // Speichern und Dialog schließen
  onSave() {
    this.dialogRef.close(this.data);
  }

  // Abbrechen und Dialog schließen
  onClose() {
    this.dialogRef.close(null);
  }

  dropPreview(event: CdkDragDrop<string[]>) {
    moveItemInArray(this.data.items, event.previousIndex, event.currentIndex);
  }
  // trackBy zur Performance-Optimierung
  trackByIndex(index: number, _: any): number {
    return index;
  }
}
