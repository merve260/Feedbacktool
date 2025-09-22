// src/app/shared/modals/survey-preview-modal/survey-preview-modal.ts
import { Component, Inject } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle
} from '@angular/material/dialog';

import { CommonModule, NgIf, NgFor, NgSwitch, NgSwitchCase, NgSwitchDefault } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatRadioGroup, MatRadioButton } from '@angular/material/radio';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatSlider, MatSliderThumb } from '@angular/material/slider';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

import { Question } from '../../../core/models/survey.models';
import {TranslateModule} from '@ngx-translate/core';

@Component({
  selector: 'app-survey-preview-modal',
  standalone: true,
  templateUrl: './survey-preview-modal.html',
  styleUrls: ['./survey-preview-modal.scss'],
  imports: [
    CommonModule,
    NgIf,
    NgFor,
    NgSwitch,
    NgSwitchCase,
    NgSwitchDefault,
    MatFormFieldModule,
    MatInputModule,
    MatRadioGroup,
    MatRadioButton,
    MatCheckbox,
    MatSlider,
    MatSliderThumb,
    MatIconModule,
    MatButtonModule,
    MatDialogContent,
    MatDialogTitle,
    MatDialogActions,
    TranslateModule
  ]
})
export class SurveyPreviewModalComponent {

  // Dialog zeigt eine Umfrage als Vorschau
  constructor(
    public dialogRef: MatDialogRef<SurveyPreviewModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { title: string; description?: string; questions: Question[] }
  ) {}

  // Dialog schließen
  close(): void {
    this.dialogRef.close();
  }
}
