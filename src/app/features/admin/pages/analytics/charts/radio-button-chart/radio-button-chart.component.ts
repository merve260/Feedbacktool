import {
  Component, Input, OnInit, OnDestroy, AfterViewInit,
  ViewChild, ElementRef, OnChanges, SimpleChanges
} from '@angular/core';
import { CommonModule } from '@angular/common';
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
export class RadioButtonChartComponent implements OnInit, AfterViewInit, OnDestroy, OnChanges {
  private chart!: Chart;

  @Input() surveyId!: string;   // 🔹 ID der Umfrage
  @Input() question?: Question; // 🔹 Aktuelle Frage
  @Input() inDialog = false;    // 🔹 Flag: wird im Dialog angezeigt?
  @Input() answers: any[] = []; // 🔹 Antworten (vom Parent übergeben)
  @ViewChild('chartCanvas') chartCanvas!: ElementRef<HTMLCanvasElement>;

  answerCount: number = 0; // Gesamtanzahl Antworten
  optionCounts: { option: string; count: number }[] = []; // Stimmen pro Option

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
    // Chart erst nach Rendern aufbauen
    setTimeout(() => this.updateChart(), 100);
  }

  /** Berechnet die Ergebnisse aus den Antworten */
  private calculateResults() {
    if (!this.question) return;

    // Zähler initialisieren
    const counts: Record<string, number> = {};
    this.question.options?.forEach(opt => counts[opt] = 0);

    // Antworten durchgehen
    this.answers.forEach((doc: any) => {
      (doc.answers || []).forEach((ans: any) => {
        if (ans.questionId === this.question?.id && ans.textValue) {
          if (counts[ans.textValue] !== undefined) {
            counts[ans.textValue]++;
          }
        }
      });
    });

    // Ergebnisse speichern
    this.optionCounts = Object.entries(counts).map(([option, count]) => ({ option, count }));
    this.answerCount = this.optionCounts.reduce((sum, r) => sum + r.count, 0);
  }

  /** Baut das Chart.js Diagramm auf */
  private updateChart() {
    if (!this.chartCanvas || this.optionCounts.length === 0) return;
    if (this.chart) this.chart.destroy();

    const ctx = this.chartCanvas.nativeElement;
    const labels = this.optionCounts.map(o => o.option);
    const values = this.optionCounts.map(o => o.count);

    // Farben
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

    // Daten für Chart.js
    const data: ChartConfiguration<'bar'>['data'] = {
      labels,
      datasets: [{
        data: values,
        backgroundColor: backgroundColors,
        borderColor: borderColors,
        borderWidth: 2,
      }]
    };

    // Chart.js Config: Horizontal Bar Chart
    this.chart = new Chart(ctx, {
      type: 'bar',
      data,
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: { beginAtZero: true, ticks: { stepSize: 1 } },
          y: { ticks: { font: { size: 14 } } }
        },
        plugins: {
          legend: { display: false }, // keine Legende
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const index = ctx.dataIndex;
                const opt = this.optionCounts[index]?.option || '';
                const value = ctx.dataset.data[index] as number;
                return `${opt}: ${value} Stimmen`;
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
