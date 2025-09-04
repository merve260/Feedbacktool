import {
  Component, Input, OnInit, OnDestroy, AfterViewInit,
  ViewChild, ElementRef, OnChanges, SimpleChanges
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Question } from '../../../../../../core/models/survey.models';
import { Chart, ChartConfiguration, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-skala-chart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './skala-chart.component.html',
  styleUrls: ['./skala-chart.component.scss'],
})
export class SkalaChartComponent implements OnInit, AfterViewInit, OnDestroy, OnChanges {
  private chart!: Chart;

  @Input() surveyId!: string;
  @Input() question?: Question;
  @Input() inDialog = false;
  @Input() answers: any[] = [];
  @ViewChild('chartCanvas') chartCanvas!: ElementRef<HTMLCanvasElement>;

  averageValue: number = 0;
  answerCount: number = 0;
  private counts: Record<number, number> = {};

  ngOnInit() {
    this.calculateResults();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['answers'] || changes['question']) {
      this.calculateResults();
      this.updateChart();
    }
  }

  ngAfterViewInit() {
    setTimeout(() => this.updateChart(), 100);
  }

  private calculateResults() {
    if (!this.question) return;

    this.counts = {};
    let sum = 0;
    let count = 0;

    this.answers.forEach((doc: any) => {
      (doc.answers || []).forEach((ans: any) => {
        if (ans.questionId === this.question?.id && ans.numberValue !== undefined) {
          const val = ans.numberValue;
          this.counts[val] = (this.counts[val] || 0) + 1;
          sum += val;
          count++;
        }
      });
    });

    this.answerCount = count;
    this.averageValue = count > 0 ? sum / count : 0;
  }

  private updateChart() {
    if (!this.chartCanvas) return;
    if (this.chart) this.chart.destroy();

    const ctx = this.chartCanvas.nativeElement;
    const maxVal = this.question?.max || 10;

    const labels = Array.from({ length: maxVal }, (_, i) => i + 1);
    const dataValues = labels.map(v => this.counts[v] || 0);

    const maxCount = Math.max(...dataValues);
    const yMax = maxCount > 0 ? Math.ceil(maxCount * 1.2) : 1;

    const data: ChartConfiguration<'line'>['data'] = {
      labels,
      datasets: [
        {
          label: 'Antworten',
          data: dataValues,
          borderColor: 'rgba(255, 99, 132, 1)',
          backgroundColor: 'rgba(255, 99, 132, 0.4)',
          pointStyle: 'circle',
          pointRadius: dataValues.map(v => v > 0 ? 8 : 0),
          pointHoverRadius: dataValues.map(v => v > 0 ? 12 : 0),
          pointHitRadius: 15,
          borderWidth: 3,
          tension: 0
        }
      ]
    };

    this.chart = new Chart(ctx, {
      type: 'line',
      data,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            title: { display: true, text: 'Skala-Wert' },
          },
          y: {
            beginAtZero: true,
            max: yMax,
            title: { display: true, text: 'Anzahl Personen' },
            ticks: {
              stepSize: 1
            }
          }
        },
        interaction: {
          mode: 'nearest',
          intersect: false
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            enabled: true,
            usePointStyle: true,
            bodyFont: { size: 14 },
            titleFont: { size: 14 },
            callbacks: {
              label: (ctx) => {
                const wert = ctx.parsed.x;
                const count = ctx.parsed.y;
                return `${count} Person(en) haben ${wert} gewählt`;
              }
            }
          }
        }
      }
    });
  }

  getAnswerValue(entry: any, questionId: string): number | string {
    const ans = (entry.answers || []).find(
      (a: any) => a.questionId === questionId && a.numberValue !== undefined
    );
    return ans ? ans.numberValue : '-';
  }


  ngOnDestroy() {
    if (this.chart) this.chart.destroy();
  }
}
