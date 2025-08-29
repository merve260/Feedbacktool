import {Component, inject} from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { SkalaChartComponent } from '../skala-chart/skala-chart.component';
import { Question } from '../../../../../../core/models/survey.models';

@Component({
  selector: 'app-skala-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, SkalaChartComponent],
  template: `
    <!-- Titel = Frage -->
    <h2 mat-dialog-title>{{ data.question.title }}</h2>

    <!-- Inhalt = Skala-Chart -->
    <mat-dialog-content class="dialog-wrapper">
      <app-skala-chart
        [surveyId]="data.surveyId"
        [question]="data.question"
        [inDialog]="true">
      </app-skala-chart>
    </mat-dialog-content>
  `,
  styles: [`
    .dialog-wrapper {
      display: flex;              /* Inhalt mittig ausgerichtet */
      justify-content: center;
      align-items: center;
      padding: 1rem;
      width: 100%;
      box-sizing: border-box;
    }
  `]
})
export class SkalaDialogComponent {
  // Eingabedaten vom Dialog: Umfrage-ID + aktuelle Frage
  data = inject<{ surveyId: string; question: Question }>(MAT_DIALOG_DATA);
}
