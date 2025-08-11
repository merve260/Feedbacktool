import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialog } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatRadioModule } from '@angular/material/radio';
import {ConfirmDialogComponent} from '../../dialogs/confirm-dialog.component';
import {MatIcon} from '@angular/material/icon';

@Component({
  selector: 'app-yesno-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatRadioModule,
    MatIcon
  ],
  templateUrl: './yesno-modal.component.html',
  styleUrls: ['./yesno-modal.component.scss']
})
export class YesNoModalComponent implements OnInit {

  originalData: any = {};

  constructor(
    public dialogRef: MatDialogRef<YesNoModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    // Orijinal verileri yedekle
    this.originalData = {
      title: this.data.title,
      text: this.data.text,
      options: [...this.data.options]
    };
  }

  isDirty(): boolean {
    return (
      this.data.title !== this.originalData.title ||
      this.data.text !== this.originalData.text ||
      JSON.stringify(this.data.options) !== JSON.stringify(this.originalData.options)
    );
  }

  onClose(): void {
    if (this.isDirty()) {
      const confirmRef = this.dialog.open(ConfirmDialogComponent, {
        width: '400px',
        disableClose: true,
        data: {
          title: 'Änderungen verwerfen?',
          message: 'Sie haben ungespeicherte Änderungen. Möchten Sie wirklich verlassen?'
        }
      });

      confirmRef.afterClosed().subscribe(result => {
        if (result === true) {
          this.dialogRef.close(null);
        }
      });
    } else {
      this.dialogRef.close(null);
    }
  }

  onSave(): void {
    this.dialogRef.close(this.data);
  }
}
