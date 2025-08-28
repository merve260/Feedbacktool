import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MultipleChartComponent } from '../multiple-chart/multiple-chart.component';
import { Question } from '../../../../../../core/models/survey.models';

@Component({
  selector: 'app-multiple-chart-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MultipleChartComponent],
  template: `
    <h2 mat-dialog-title>{{ data.question.title }}</h2>
    <mat-dialog-content class="dialog-wrapper">
      <app-multiple-chart
        [surveyId]="data.surveyId"
        [question]="data.question"
        [fullscreen]="true">
      </app-multiple-chart>
    </mat-dialog-content>
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
export class MultipleChartDialogComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public data: { surveyId: string; question: Question }) {}
}
