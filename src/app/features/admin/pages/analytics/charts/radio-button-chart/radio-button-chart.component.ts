import {
  Component, Input, OnInit, OnDestroy, AfterViewInit,
  ViewChild, ElementRef, OnChanges, SimpleChanges
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Question } from '../../../../../../core/models/survey.models';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

Chart.register(...registerables);

@Component({
  selector: 'app-radio-button-chart',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './radio-button-chart.component.html',
  styleUrls: ['./radio-button-chart.component.scss'],
})
export class RadioButtonChartComponent implements OnInit, AfterViewInit, OnDestroy, OnChanges {
  private chart!: Chart;

  @Input() surveyId!: string;
  @Input() question?: Question;
  @Input() inDialog = false;
  @Input() answers: any[] = [];
  @ViewChild('chartCanvas') chartCanvas!: ElementRef<HTMLCanvasElement>;

  answerCount: number = 0;
  optionCounts: { option: string; count: number }[] = [];

  constructor(private translate: TranslateService) {}

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

  /** Berechnet die Ergebnisse aus den Antworten */
  private calculateResults() {
    if (!this.question) return;

    const counts: Record<string, number> = {};
    this.question.options?.forEach(opt => counts[opt] = 0);

    this.answers.forEach((doc: any) => {
      (doc.answers || []).forEach((ans: any) => {
        if (ans.questionId === this.question?.id && ans.textValue) {
          if (counts[ans.textValue] !== undefined) {
            counts[ans.textValue]++;
          }
        }
      });
    });

    this.optionCounts = Object.entries(counts).map(([option, count]) => ({ option, count }));
    this.answerCount = this.optionCounts.reduce((sum, r) => sum + r.count, 0);
  }

  /** Erstellt oder aktualisiert das Chart */
  private updateChart() {
    if (!this.chartCanvas || this.optionCounts.length === 0) return;
    if (this.chart) this.chart.destroy();

    const ctx = this.chartCanvas.nativeElement;
    const labels = this.optionCounts.map(o => o.option);
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

    const data: ChartConfiguration<'bar'>['data'] = {
      labels,
      datasets: [{
        data: values,
        backgroundColor: backgroundColors,
        borderColor: borderColors,
        borderWidth: 2,
      }]
    };

    this.chart = new Chart(ctx, {
      type: 'bar',
      data,
      options: {
        indexAxis: 'x',
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: { beginAtZero: true, ticks: { stepSize: 1 } },
          y: { ticks: { font: { size: 14 }, stepSize: 1 } }
        },
        interaction: {
          mode: 'nearest',
          intersect: true
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const index = ctx.dataIndex;
                const opt = this.optionCounts[index]?.option || '';
                const value = ctx.dataset.data[index] as number;
                return this.translate.instant('chart.radio.tooltip', {
                  option: opt,
                  count: value
                });
              }
            }
          }
        }
      }
    });
  }

  ngOnDestroy() {
    if (this.chart) this.chart.destroy();
  }
}
