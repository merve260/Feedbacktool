import { CommonModule } from '@angular/common';
import {
  Component,
  Inject,
  OnInit
} from '@angular/core';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialog,
} from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import {CdkDrag, CdkDragDrop, CdkDragHandle, CdkDropList, moveItemInArray} from '@angular/cdk/drag-drop';

import { ConfirmDialogComponent } from '../../dialogs/confirm-dialog.component';
import {MatFormField, MatInput} from '@angular/material/input';
import {MatIcon} from '@angular/material/icon';
import {FormsModule} from '@angular/forms';
import {MatButton, MatIconButton} from '@angular/material/button';
import {NgForOf} from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-drag-drop-modal',
  standalone: true,
  imports: [
    CommonModule,
    MatFormField,
    MatIcon,
    CdkDropList,
    FormsModule,
    MatButton,
    MatIconButton,
    MatInput,
    NgForOf,
    CdkDrag,
    MatFormFieldModule,
    MatInputModule,
    ConfirmDialogComponent,
    CdkDragHandle
  ],
  templateUrl: './drag-drop-modal.component.html',
  styleUrls: ['./drag-drop-modal.component.scss']
})
export class DragDropModalComponent implements OnInit {
  title: string = '';
  text: string = '';
  items: string[] = [];
  private initialState: string = '';

  constructor(
    public dialogRef: MatDialogRef<DragDropModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {
    this.title = data?.title || '';
    this.text = data?.text || '';
    this.items = data?.items || [];

    this.initialState = JSON.stringify({
      title: this.title,
      text: this.text,
      items: this.items
    });
  }


  ngOnInit(): void {
    this.initialState = JSON.stringify({
      title: this.data.title,
      text: this.data.text,
      items: this.data.items
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

  isDirty(): boolean {
    const currentState = JSON.stringify({
      title: this.data.title,
      text: this.data.text,
      items: this.data.items
    });
    return currentState !== this.initialState;
  }

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


  addItem(): void {
    this.items.push('Neues Element');
  }

  removeItem(index: number): void {
    this.items.splice(index, 1);
  }

  dropPreview(event: CdkDragDrop<string[]>): void {
    moveItemInArray(this.items, event.previousIndex, event.currentIndex);
  }

  trackByIndex(index: number, _: any): number {
    return index;
  }
}
