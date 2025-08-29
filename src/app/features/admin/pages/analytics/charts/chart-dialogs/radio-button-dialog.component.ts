import {Component, inject} from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { RadioButtonChartComponent } from '../radio-button-chart/radio-button-chart.component';
import { Question } from '../../../../../../core/models/survey.models';

@Component({
  selector: 'app-radio-button-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, RadioButtonChartComponent],
  template: `
    <!-- Titel = Frage -->
    <h2 mat-dialog-title>{{ data.question.title }}</h2>

    <!-- Inhalt = Radio-Button-Chart -->
    <mat-dialog-content class="dialog-wrapper">
      <app-radio-button-chart
        [surveyId]="data.surveyId"
        [question]="data.question"
        [inDialog]="true">
      </app-radio-button-chart>
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
  `]
})
export class RadioButtonDialogComponent {
  // Daten vom Dialog: Umfrage-ID + aktuelle Frage
  data = inject<{ surveyId: string; question: Question }>(MAT_DIALOG_DATA);
}
