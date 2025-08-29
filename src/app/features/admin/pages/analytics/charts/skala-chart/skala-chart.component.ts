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
  @Input() answers: any[] = []; // ✨ Antworten von außen
  @ViewChild('chartCanvas') chartCanvas!: ElementRef<HTMLCanvasElement>;

  averageValue: number = 0;
  answerCount: number = 0;
  private parsedAnswers: { name: string; value: number }[] = [];

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

    let sum = 0;
    let count = 0;
    const all: { name: string; value: number }[] = [];

    this.answers.forEach((doc: any) => {
      const userName = doc.name || 'Anonym';
      (doc.answers || []).forEach((ans: any) => {
        if (ans.questionId === this.question?.id && ans.numberValue !== undefined) {
          all.push({ name: userName, value: ans.numberValue });
          sum += ans.numberValue;
          count++;
        }
      });
    });

    this.parsedAnswers = all;
    this.answerCount = count;
    this.averageValue = count > 0 ? sum / count : 0;
  }

  private updateChart() {
    if (!this.chartCanvas || this.parsedAnswers.length === 0) return;
    if (this.chart) this.chart.destroy();

    const ctx = this.chartCanvas.nativeElement;
    const labels = this.parsedAnswers.map(a => a.name);
    const values = this.parsedAnswers.map(a => a.value);

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
        barThickness: 45
      }]
    };

    this.chart = new Chart(ctx, {
      type: 'bar',
      data,
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'y', intersect: false },
        scales: {
          x: {
            min: 0,
            max: this.question?.max || 10,
            ticks: { stepSize: 1 }
          },
          y: { ticks: { font: { size: 12 } } }
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            bodyFont: { size: 18, family: 'Arial' },
            titleFont: { size: 16, family: 'Arial' },
            padding: 12,
            callbacks: {
              label: (ctx) => {
                const name = ctx.label || 'Anonym';
                const value = ctx.dataset.data[ctx.dataIndex] as number;
                return `${name}: ${value} / ${this.question?.max || 10}`;
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
