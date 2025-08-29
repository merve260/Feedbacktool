import {Component, inject} from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MultipleChartComponent } from '../multiple-chart/multiple-chart.component';
import { Question } from '../../../../../../core/models/survey.models';

@Component({
  selector: 'app-multiple-chart-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MultipleChartComponent],
  template: `
    <!-- Titel = Frage -->
    <h2 mat-dialog-title>{{ data.question.title }}</h2>

    <!-- Inhalt = Chart für diese Frage -->
    <mat-dialog-content class="dialog-wrapper">
      <app-multiple-chart
        [surveyId]="data.surveyId"
        [question]="data.question"
        [inDialog]="true">
      </app-multiple-chart>
    </mat-dialog-content>
  `,
  styles: [`
    .dialog-wrapper {
      display: flex;              /* Inhalt mittig */
      justify-content: center;
      align-items: center;
      padding: 1rem;
      width: 100%;
      box-sizing: border-box;
    }
    .dialog-wrapper app-multiple-chart .chart-wrapper canvas {
      max-width: 500px !important; /* Chart nicht größer als 500px */
    }
  `]
})
export class MultipleChartDialogComponent {
  // Daten vom Dialog: Umfrage-ID + aktuelle Frage
  data = inject<{ surveyId: string; question: Question }>(MAT_DIALOG_DATA);
}
