import {
  Component, Input, OnInit, OnDestroy, AfterViewInit,
  ViewChild, ElementRef, inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Firestore, collection, collectionData } from '@angular/fire/firestore';
import { Subscription, map } from 'rxjs';
import { Question } from '../../../../../../core/models/survey.models';
import { Chart, ChartConfiguration, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-radio-button-chart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './radio-button-chart.component.html',
  styleUrls: ['./radio-button-chart.component.scss'],
})
export class RadioButtonChartComponent implements OnInit, AfterViewInit, OnDestroy {
  private firestore = inject(Firestore);
  private chart!: Chart;
  private sub!: Subscription;

  @Input() surveyId!: string;
  @Input() question?: Question;
  @ViewChild('chartCanvas') chartCanvas!: ElementRef<HTMLCanvasElement>;

  answerCount: number = 0;
  optionCounts: { option: string; count: number }[] = [];

  ngOnInit() {
    if (!this.surveyId || !this.question) return;

    const answersCol = collection(this.firestore, `umfragen/${this.surveyId}/antworten`);
    this.sub = collectionData(answersCol, { idField: 'id' })
      .pipe(
        map((docs: any[]) => {
          const counts: Record<string, number> = {};
          this.question?.options?.forEach(opt => counts[opt] = 0);

          docs.forEach((doc) => {
            (doc.answers || []).forEach((ans: any) => {
              if (ans.questionId === this.question?.id && ans.textValue) {
                if (counts[ans.textValue] !== undefined) {
                  counts[ans.textValue]++;
                }
              }
            });
          });

          const results = Object.entries(counts).map(([option, count]) => ({ option, count }));
          this.optionCounts = results;
          this.answerCount = results.reduce((sum, r) => sum + r.count, 0);
          return results;
        })
      )
      .subscribe(() => this.updateChart());
  }

  ngAfterViewInit() {
    setTimeout(() => this.updateChart(), 100);
  }

  private updateChart() {
    if (!this.chartCanvas) return;
    if (this.chart) this.chart.destroy();

    const ctx = this.chartCanvas.nativeElement;

    const labels = this.optionCounts.map((_, i) => `${i + 1}`);
    const values = this.optionCounts.map(o => o.count);

    const pastelColors = [
      'rgba(54, 162, 235, 0.3)',
      'rgba(153, 102, 255, 0.3)',
      'rgba(75, 192, 192, 0.3)',
      'rgba(255, 99, 132, 0.3)',
      'rgba(255, 206, 86, 0.3)',
      'rgba(255, 159, 64, 0.3)'
    ];

    const backgroundColors = values.map((_, i) => pastelColors[i % pastelColors.length]);
    const borderColors = backgroundColors.map(c => c.replace('0.3', '1'));
    const hoverColors = backgroundColors.map(c => c.replace('0.3', '0.8'));

    const data: ChartConfiguration<'bar'>['data'] = {
      labels,
      datasets: [{
        data: values,
        backgroundColor: backgroundColors,
        hoverBackgroundColor: hoverColors,
        borderColor: borderColors,
        borderWidth: 2,
        barThickness: 40
      }]
    };

    this.chart = new Chart(ctx, {
      type: 'bar',
      data,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: { ticks: { font: { size: 12 } } },
          y: { beginAtZero: true, ticks: { stepSize: 1 } }
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            bodyFont: { size: 18, family: 'Arial' },
            titleFont: { size: 16, family: 'Arial' },
            padding: 12,
            callbacks: {
              // Tooltip
              label: (ctx) => {
                const index = ctx.dataIndex;
                const opt = this.optionCounts[index]?.option || '';
                const value = ctx.dataset.data[index] as number;
                return `${value} Stimmen`;
              }
            }
          }
        }
      }
    });
  }


  ngOnDestroy() {
    if (this.chart) this.chart.destroy();
    if (this.sub) this.sub.unsubscribe();
  }
}
