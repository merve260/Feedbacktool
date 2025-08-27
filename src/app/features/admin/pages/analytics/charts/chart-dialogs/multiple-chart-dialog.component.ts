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
    <app-multiple-chart
      [surveyId]="data.surveyId"
      [question]="data.question"
      [fullscreen]="true">
    </app-multiple-chart>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
      height: 100%;
    }
    app-multiple-chart {
      width: 100%;
      height: 100%;
      display: block;
    }
  `]
})
export class MultipleChartDialogComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public data: { surveyId: string; question: Question }) {}
}
