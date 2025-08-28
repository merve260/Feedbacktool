import {Component, inject, Inject} from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { SkalaChartComponent } from '../skala-chart/skala-chart.component';
import { Question } from '../../../../../../core/models/survey.models';

@Component({
  selector: 'app-skala-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, SkalaChartComponent],
  template: `
    <h2 mat-dialog-title></h2>
    <mat-dialog-content class="dialog-wrapper">
      <app-skala-chart
        [surveyId]="data.surveyId"
        [question]="data.question">
      </app-skala-chart>
    </mat-dialog-content>
    <p></p>
  `,
  styles: [`
    .dialog-wrapper {
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 1rem;
      width: 100%;
      box-sizing: border-box;
    }
  `]
})
export class SkalaDialogComponent {
  data = inject<{ surveyId: string; question: Question }>(MAT_DIALOG_DATA);
}
