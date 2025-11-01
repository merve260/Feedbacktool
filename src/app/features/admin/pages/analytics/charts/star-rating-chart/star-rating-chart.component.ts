import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Question } from '../../../../../../core/models/survey.models';
import {TranslateModule} from '@ngx-translate/core';

@Component({
  selector: 'app-star-rating-chart',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './star-rating-chart.component.html',
  styleUrls: ['./star-rating-chart.component.scss'],
})
export class StarRatingChartComponent implements OnChanges {
  @Input() surveyId!: string;
  @Input() question?: Question;
  @Input() inDialog = false;
  @Input() answers: any[] = []; // Antworten kommen von außen

  counts: Record<number, number> = { 1:0, 2:0, 3:0, 4:0, 5:0 };
  total: number = 0;
  average: number = 0;

  ngOnChanges(changes: SimpleChanges) {
    //Wenn sich Antworten oder Frage ändern → Ergebnisse neu berechnen
    if (changes['answers'] || changes['question']) {
      this.calculateResults();
    }
  }

  private calculateResults() {
    //Sternebewertung (1–5) aus allen Antworten zusammenzählen
    if (!this.question) return;

    const counts: Record<number, number> = { 1:0, 2:0, 3:0, 4:0, 5:0 };
    let sum = 0;
    let count = 0;
  //Alle Dokumente durchlaufen und Bewertungen dieser Frage auswerten
    this.answers.forEach(doc => {
      (doc.answers || []).forEach((ans: any) => {
        if (ans.questionId === this.question?.id && ans.numberValue !== undefined) {
          const val = ans.numberValue;
          if (counts[val] !== undefined) {
            counts[val]++;
            sum += val;
            count++;
          }
        }
      });
    });
  //Statistische Kennzahlen speichern (Gesamtzahl + Durchschnitt)
    this.counts = counts;
    this.total = count;
    this.average = count > 0 ? sum / count : 0;
  }

  // // Math-Funktionen im Template verfügbar machen (z. B. für Rundung)
  protected readonly Math = Math;
}
