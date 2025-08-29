import {Component, inject} from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { StarRatingChartComponent } from '../star-rating-chart/star-rating-chart.component';
import { Question } from '../../../../../../core/models/survey.models';

@Component({
  selector: 'app-star-rating-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, StarRatingChartComponent],
  template: `
    <!-- Titel = Frage -->
    <h2 mat-dialog-title>{{ data.question.title }}</h2>

    <!-- Inhalt = Sternebewertung-Chart -->
    <mat-dialog-content class="dialog-wrapper">
      <app-star-rating-chart
        [surveyId]="data.surveyId"
        [question]="data.question"
        [inDialog]="true">
      </app-star-rating-chart>
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
export class StarRatingDialogComponent {
  // Eingabedaten vom Dialog: Umfrage-ID + aktuelle Frage
  data = inject<{ surveyId: string; question: Question }>(MAT_DIALOG_DATA);
}
