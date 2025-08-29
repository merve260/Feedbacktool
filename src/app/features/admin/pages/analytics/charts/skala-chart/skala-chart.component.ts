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
  selector: 'app-skala-chart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './skala-chart.component.html',
  styleUrls: ['./skala-chart.component.scss'],
})
export class SkalaChartComponent implements OnInit, AfterViewInit, OnDestroy {
  private firestore = inject(Firestore);
  private chart!: Chart;
  private sub!: Subscription;

  @Input() surveyId!: string;
  @Input() question?: Question;
  @Input() inDialog = false;
  @ViewChild('chartCanvas') chartCanvas!: ElementRef<HTMLCanvasElement>;

  averageValue: number = 0;   // Durchschnitt aller Antworten
  answerCount: number = 0;    // Anzahl der Antworten
  private answers: { name: string; value: number }[] = []; // Einzelne Antworten

  ngOnInit() {
    if (!this.surveyId || !this.question) return;

    // Firestore → Collection mit Antworten laden
    const answersCol = collection(this.firestore, `umfragen/${this.surveyId}/antworten`);
    this.sub = collectionData(answersCol, { idField: 'id' })
      .pipe(
        map((docs: any[]) => {
          let sum = 0;
          let count = 0;
          const all: { name: string; value: number }[] = [];

          // Alle Dokumente durchgehen
          docs.forEach((doc) => {
            const userName = doc.name || 'Anonym';
            (doc.answers || []).forEach((ans: any) => {
              // Nur Antworten für diese Frage (numberValue)
              if (ans.questionId === this.question?.id && ans.numberValue !== undefined) {
                all.push({ name: userName, value: ans.numberValue });
                sum += ans.numberValue;
                count++;
              }
            });
          });

          // Ergebnisse berechnen
          this.answers = all;
          this.answerCount = count;
          this.averageValue = count > 0 ? sum / count : 0;
          return this.answers;
        })
      )
      .subscribe(() => this.updateChart());
  }

  ngAfterViewInit() {
    // Chart erst nach Render starten
    setTimeout(() => this.updateChart(), 100);
  }

  private updateChart() {
    if (!this.chartCanvas) return;
    if (this.chart) this.chart.destroy();

    const ctx = this.chartCanvas.nativeElement;

    const labels = this.answers.map(a => a.name);   // Namen der Teilnehmer
    const values = this.answers.map(a => a.value);  // Werte (Zahlen)

    // Farben für Balken
    const pastelColors = [
      'rgba(54, 162, 235, 0.3)',   // blau
      'rgba(153, 102, 255, 0.3)',  // lila
      'rgba(75, 192, 192, 0.3)',   // türkis
      'rgba(255, 99, 132, 0.3)',   // pink
      'rgba(255, 206, 86, 0.3)',   // gelb
      'rgba(255, 159, 64, 0.3)'    // orange
    ];

    const backgroundColors = values.map((_, i) => pastelColors[i % pastelColors.length]);
    const borderColors = backgroundColors.map(c => c.replace('0.3', '1'));
    const hoverColors = values.map((_, i) =>
      pastelColors[i % pastelColors.length].replace('0.3', '0.8')
    );

    // Chart-Daten
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

    // Chart initialisieren
    this.chart = new Chart(ctx, {
      type: 'bar',
      data,
      options: {
        indexAxis: 'y',  // horizontale Balken
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'y', intersect: false },
        scales: {
          x: {
            min: 0,
            max: this.question?.max || 10, // max aus der Frage
            ticks: { stepSize: 1 }
          },
          y: { ticks: { font: { size: 12 } } }
        },
        plugins: {
          legend: { display: false }, // keine Legende
          tooltip: {
            bodyFont: { size: 18, family: 'Arial' },
            titleFont: { size: 16, family: 'Arial' },
            padding: 12,
            callbacks: {
              // Tooltip: zeigt Name + Wert
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
    if (this.chart) this.chart.destroy(); // Chart aufräumen
    if (this.sub) this.sub.unsubscribe(); // Firestore-Subscription beenden
  }
}
