import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSliderModule } from '@angular/material/slider';
import { MatIconModule } from '@angular/material/icon';
import {ConfirmDialogComponent} from '../../dialogs/confirm-dialog.component';

@Component({
  selector: 'app-skala-slider-modal',
  standalone: true,
  templateUrl: './skala-slider-modal.component.html',
  styleUrls: ['./skala-slider-modal.component.scss'],
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCheckboxModule,
    MatSliderModule,
    MatIconModule,
  ]
})
export class SkalaSliderModalComponent implements OnInit {
  min: number = 0;
  max: number = 10;
  step: number = 1;
  value: number = 5;
  thumbLabel: boolean = false;
  disabled: boolean = false;
  showTicks: boolean = false;

  originalData: any = {};

  constructor(
    public dialogRef: MatDialogRef<SkalaSliderModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.min = this.data.min ?? 0;
    this.max = this.data.max ?? 10;
    this.step = this.data.step ?? 1;
    this.value = this.data.value ?? 5;
    this.thumbLabel = this.data.thumbLabel ?? false;

    // Orijinal değerleri sakla
    this.originalData = {
      title: this.data.title,
      text: this.data.text,
      min: this.min,
      max: this.max,
      step: this.step,
      value: this.value,
      thumbLabel: this.thumbLabel
    };
  }

  get isInvalidRange(): boolean {
    return this.max - this.min < 2;
  }

  getSliderBackground(): string {
    const percentage = ((this.value - this.min) / (this.max - this.min)) * 100;
    return `linear-gradient(to right, #1976d2 0%, #1976d2 ${percentage}%, #c0c0c0 ${percentage}%, #c0c0c0 100%)`;
  }

  isDirty(): boolean {
    return (
      this.data.title !== this.originalData.title ||
      this.data.text !== this.originalData.text ||
      this.min !== this.originalData.min ||
      this.max !== this.originalData.max ||
      this.step !== this.originalData.step ||
      this.value !== this.originalData.value ||
      this.thumbLabel !== this.originalData.thumbLabel
    );
  }

  onClose(): void {
    if (this.isDirty()) {
      const confirmRef = this.dialog.open(ConfirmDialogComponent, {
        width: '400px',
        disableClose: true,
        data: {
          title: 'Änderungen verwerfen?',
          message: 'Sie haben ungespeicherte Änderungen. Möchten Sie den Dialog wirklich schließen?'
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
    this.dialogRef.close({
      type: 'slider',
      title: this.data.title,
      text: this.data.text,
      value: this.value,
      min: this.min,
      max: this.max,
      step: this.step,
      thumbLabel: this.thumbLabel
    });
  }
}
