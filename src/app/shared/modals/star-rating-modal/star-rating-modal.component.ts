import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-star-rating-modal',
  standalone: true,
  templateUrl: './star-rating-modal.component.html',
  styleUrls: ['./star-rating-modal.component.scss'],
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatOptionModule,
    MatButtonModule,
    MatIconModule
  ]
})
export class StarRatingModalComponent {
  constructor(
    public dialogRef: MatDialogRef<StarRatingModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {

    if (!this.data.maxStars) {
      this.data.maxStars = 5;
    }
  }

  onClose() {
    this.dialogRef.close(null);
  }

  onSave() {
    this.dialogRef.close(this.data);
  }
}

