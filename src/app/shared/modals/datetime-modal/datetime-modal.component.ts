import { Component, Inject, OnInit, LOCALE_ID } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog, MatDialogActions } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatButtonModule } from '@angular/material/button';
import { DatePipe, formatDate } from '@angular/common';
import { ConfirmDialogComponent } from '../../dialogs/confirm-dialog.component';
import { MatIcon } from '@angular/material/icon';


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
  ],
})
export class DateTimeModalComponent implements OnInit {
  title = '';
  text = '';
  date: Date | null = null;
  time = ''; // "HH:mm"

  startPlaceholder = '';
  endPlaceholder   = '';

  private initialState = '';

  constructor(
    private dialogRef: MatDialogRef<DateTimeModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    @Inject(LOCALE_ID) private locale: string,
  ) {
    this.title = data?.title || '';
    this.text  = data?.text  || '';
    this.date  = data?.date  || null;
    this.time  = data?.time  || '';

    this.startPlaceholder = data?.startPlaceholder ?? '';
    this.endPlaceholder   = data?.endPlaceholder   ?? '';

    this.initialState = JSON.stringify({
      title: this.title,
      text: this.text,
      date: this.date,
      time: this.time,
      startPlaceholder: this.startPlaceholder,
      endPlaceholder: this.endPlaceholder
    });
  }

  ngOnInit(): void {
    this.dialogRef.backdropClick().subscribe(() => this.onCancel());
  }

  private combineDateTime(date: Date | null, time: string): Date | null {
    if (!date) return null;
    if (!time) return date;
    const [hh, mm] = time.split(':').map(n => parseInt(n, 10));
    const d = new Date(date);
    if (!isNaN(hh)) d.setHours(hh);
    if (!isNaN(mm)) d.setMinutes(mm);
    d.setSeconds(0, 0);
    return d;
  }

  onSave(): void {
    const dt = this.combineDateTime(this.date, this.time);
    const autoPH = dt ? formatDate(dt, 'dd.MM.yyyy HH:mm', this.locale) : '';

    const startPH = (this.startPlaceholder?.trim() || autoPH) || undefined;
    const endPH   = (this.endPlaceholder?.trim()   || undefined);

    this.dialogRef.close({
      type: 'date',
      title: this.title,
      text: this.text,
      startPlaceholder: startPH,
      endPlaceholder: endPH,
      date: this.date,
      time: this.time
    });
  }

  onCancel(): void {
    if (this.isDirty()) {
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
      confirmRef.afterClosed().subscribe(ok => { if (ok) this.dialogRef.close(); });
    } else {
      this.dialogRef.close();
    }
  }

  private isDirty(): boolean {
    const current = JSON.stringify({
      title: this.title,
      text: this.text,
      date: this.date,
      time: this.time,
      startPlaceholder: this.startPlaceholder,
      endPlaceholder: this.endPlaceholder
    });
    return current !== this.initialState;
  }
}
