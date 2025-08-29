import {
  Component, Input, OnInit, OnDestroy, AfterViewInit,
  inject, ViewChild, ElementRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Firestore, collection, collectionData } from '@angular/fire/firestore';
import { map, Observable, Subscription } from 'rxjs';
import { Question } from '../../../../../../core/models/survey.models';
import { Chart, ChartConfiguration, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-multiple-chart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './multiple-chart.component.html',
  styleUrls: ['./multiple-chart.component.scss'],
})
export class MultipleChartComponent implements OnInit, AfterViewInit, OnDestroy {
  private firestore = inject(Firestore);
  private chart!: Chart;
  private sub!: Subscription;

  @Input() surveyId!: string;
  @Input() question?: Question;
  @Input() inDialog = false;
  @ViewChild('chartCanvas') chartCanvas!: ElementRef<HTMLCanvasElement>;

  answers$!: Observable<{ option: string; count: number }[]>;
  mostChosenOptions: { option: string; count: number }[] = [];

  private chartData: { option: string; count: number }[] = [];

  ngOnInit() {
    if (!this.surveyId || !this.question) return;

    // Firestore Collection mit Antworten
    const answersCol = collection(this.firestore, `umfragen/${this.surveyId}/antworten`);
    this.answers$ = collectionData(answersCol, { idField: 'id' }).pipe(
      map((docs: any[]) => {
        if (!this.question) return [];

        // Zähler initialisieren
        const counts: Record<string, number> = {};
        this.question.options?.forEach(opt => counts[opt] = 0);

        // Antworten auswerten
        docs.forEach((doc: any) => {
          (doc.answers || []).forEach((ans: any) => {
            if (ans.questionId === this.question!.id && ans.listValue) {
              ans.listValue.forEach((opt: string) => {
                if (counts[opt] !== undefined) counts[opt]++;
              });
            }
          });
        });

        // Ergebnisse berechnen
        const results = Object.entries(counts).map(([option, count]) => ({ option, count }));

        // Meistgewählte Option merken
        if (results.length > 0) {
          const maxCount = Math.max(...results.map(r => r.count));
          this.mostChosenOptions = results.filter(r => r.count === maxCount && maxCount > 0);
        } else {
          this.mostChosenOptions = [];
        }
        return results;
      })
    );

    // Subscription starten → Chart aktualisieren
    this.sub = this.answers$.subscribe(results => {
      this.chartData = results;
      this.updateChart();
    });
  }

  ngAfterViewInit() {
    // kleine Verzögerung, um Canvas sicher zu rendern
    setTimeout(() => this.updateChart(), 100);
  }

  private updateChart() {
    if (!this.chartCanvas || this.chartData.length === 0) return;
    if (this.chart) this.chart.destroy();

    const ctx = this.chartCanvas.nativeElement;
    const colors = this.generateColors(this.chartData.length);

    // Wenn alle Werte = 0, dann kleine Zahl eintragen (Chart.js Bugfix)
    const allZero = this.chartData.every(r => r.count === 0);
    const values = allZero ? this.chartData.map(() => 0.0001) : this.chartData.map(r => r.count);

    // Daten für Chart.js
    const data: ChartConfiguration<'pie'>['data'] = {
      labels: this.chartData.map(r => r.option),
      datasets: [{
        label: 'Stimmen',
        data: values,
        backgroundColor: colors.backgrounds,
        borderColor: colors.borders,
        borderWidth: 2,
        hoverBackgroundColor: colors.borders,
        hoverOffset: 16,
        offset: 8
      }]
    };

    // Chart initialisieren
    this.chart = new Chart(ctx, {
      type: 'pie',
      data,
      options: {
        responsive: true,
        aspectRatio: 1,
        plugins: {
          legend: { position: 'top' },
          tooltip: {
            bodyFont: { size: 18, family: 'Arial' },
            titleFont: { size: 16, family: 'Arial' },
            padding: 12
          },
        },
        layout: { padding: 10 }
      }
    });
  }

  // Hilfsfunktion: Farben für Optionen
  private generateColors(count: number) {
    const base = [
      [255, 99, 132],   // pink
      [54, 162, 235],   // blau
      [153, 102, 255],  // lila
      [75, 192, 192],   // türkis
      [201, 203, 207],  // grau
      [255, 159, 64],   // orange
    ];

    const backgrounds: string[] = [];
    const borders: string[] = [];

    for (let i = 0; i < count; i++) {
      const rgb = base[i % base.length];
      backgrounds.push(`rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0.3)`);
      borders.push(`rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 1)`);
    }
    return { backgrounds, borders };
  }

  ngOnDestroy() {
    if (this.chart) this.chart.destroy();
    if (this.sub) this.sub.unsubscribe();
  }
}
