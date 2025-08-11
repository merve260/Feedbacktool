import {
  Component,
  Inject,
  HostListener,
  OnInit
} from '@angular/core';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogActions
} from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatButtonModule } from '@angular/material/button';
import { DatePipe } from '@angular/common';
import { ConfirmDialogComponent } from '../../dialogs/confirm-dialog.component';
import {MatIcon} from '@angular/material/icon';

@Component({
  selector: 'app-date-time-modal',
  standalone: true,
  templateUrl: './datetime-modal.component.html',
  styleUrls: ['./datetime-modal.component.scss'],
  imports: [
    MatInputModule,
    FormsModule,
    MatDatepickerModule,
    MatButtonModule,
    DatePipe,
    MatDialogActions,
    MatIcon
  ]
})
export class DateTimeModalComponent implements OnInit {
  title: string = '';
  text: string = '';
  date: Date | null = null;
  time: string = '';
  private initialState: string = '';
  private canClose = true;


  constructor(
    private dialogRef: MatDialogRef<DateTimeModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {
    this.title = data?.title || '';
    this.text = data?.text || '';
    this.date = data?.date || null;
    this.time = data?.time || '';

    this.initialState = JSON.stringify({
      title: this.title,
      text: this.text,
      date: this.date,
      time: this.time
    });

  }

  ngOnInit(): void {
    this.dialogRef.backdropClick().subscribe(() => {
      this.onCancel();
    });
  }


  checkClose(): void {
    if (this.isDirty()) {
      this.confirmLeave();
    } else {
      this.dialogRef.close();
    }
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
      type: 'date',
      title: this.title,
      text: this.text,
      date: this.date,
      time: this.time
    });
  }

  isDirty(): boolean {
    const current = JSON.stringify({
      title: this.title,
      text: this.text,
      date: this.date,
      time: this.time
    });
    return current !== this.initialState;
  }

  confirmLeave(): void {
    const confirmRef = this.dialog.open(ConfirmDialogComponent, {
      width: '420px',
      maxWidth: '92vw',
      panelClass: 'pol-dialog pol-confirm',
      backdropClass: 'pol-backdrop',
      data: {
        message: 'Sie haben ungespeicherte Änderungen. Möchten Sie wirklich verlassen?',
        confirmText: 'Verlassen',
        cancelText: 'Im Dialog bleiben'
      },
      disableClose: true
    });

    confirmRef.afterClosed().subscribe(ok => {
      if (ok === true) {
        this.dialogRef.close();
      }
    });
  }


}
