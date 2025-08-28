import { Component, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Firestore, collection, collectionData } from '@angular/fire/firestore';
import { Subscription, map } from 'rxjs';
import { Question } from '../../../../../../core/models/survey.models';

@Component({
  selector: 'app-star-rating-chart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './star-rating-chart.component.html',
  styleUrls: ['./star-rating-chart.component.scss'],
})
export class StarRatingChartComponent implements OnInit {
  private firestore = inject(Firestore);
  private sub!: Subscription;

  @Input() surveyId!: string;
  @Input() question?: Question;
  @Input() inDialog = false;

  counts: Record<number, number> = { 1:0, 2:0, 3:0, 4:0, 5:0 };
  total: number = 0;
  average: number = 0;

  ngOnInit() {
    if (!this.surveyId || !this.question) return;

    const answersCol = collection(this.firestore, `umfragen/${this.surveyId}/antworten`);
    this.sub = collectionData(answersCol, { idField: 'id' })
      .pipe(
        map((docs: any[]) => {
          const counts: Record<number, number> = { 1:0, 2:0, 3:0, 4:0, 5:0 };
          let sum = 0;
          let count = 0;

          docs.forEach(doc => {
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

          this.counts = counts;
          this.total = count;
          this.average = count > 0 ? sum / count : 0;
        })
      )
      .subscribe();
  }

  protected readonly Math = Math;
}
