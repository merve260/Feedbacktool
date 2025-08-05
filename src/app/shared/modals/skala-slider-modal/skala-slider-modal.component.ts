import {Component, Inject, OnInit} from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSliderModule } from '@angular/material/slider';

@Component({
  selector: 'app-slider-modal',
  templateUrl: './skala-slider-modal.component.html',
  styleUrls: ['./skala-slider-modal.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCheckboxModule,
    MatSliderModule
  ]
})
export class SliderModalComponent implements OnInit {
  constructor(
    public dialogRef: MatDialogRef<SliderModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    // Default değerler
    if (data.value === undefined) data.value = data.min;
    if (data.min === undefined) data.min = 0;
    if (data.max === undefined) data.max = 10;
    if (data.step === undefined) data.step = 1;
    if (data.thumbLabel === undefined) data.thumbLabel = true;
  }
  ngOnInit() {
    if ((this.data.value - this.data.min) % this.data.step !== 0) {
      this.data.value = this.data.min;
    }
  }

  onClose() {
    this.dialogRef.close();
  }

  onSave() {
    this.dialogRef.close(this.data);
  }
  get isInvalidRange(): boolean {
    return this.data.max - this.data.min < 2;
  }

}
