import {
  Component, Input, OnInit, OnDestroy, AfterViewInit,
  OnChanges, SimpleChanges,
  ViewChild, ElementRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
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
export class MultipleChartComponent implements OnInit, AfterViewInit, OnDestroy, OnChanges {
  private chart!: Chart;

  @Input() surveyId!: string;       // ID der aktuellen Umfrage
  @Input() question?: Question;     // Aktuelle Frage (Multiple Choice)
  @Input() inDialog = false;        // Flag: wird im Dialog angezeigt?
  @Input() answers: any[] = [];     // ✨ Alle Antworten (vom Parent übergeben)
  @ViewChild('chartCanvas') chartCanvas!: ElementRef<HTMLCanvasElement>;

  // Speichert meistgewählte Optionen
  mostChosenOptions: { option: string; count: number }[] = [];
  // Interne Datenstruktur für Chart
  private chartData: { option: string; count: number }[] = [];

  ngOnInit() {
    // Initialisierung: Logik passiert über ngOnChanges
  }

  ngOnChanges(changes: SimpleChanges) {
    // Wird aufgerufen, wenn sich Antworten oder Frage ändern
    if (changes['answers'] || changes['question']) {
      if (this.answers && this.question) {
        this.processAnswers(this.answers);
      }
    }
  }

  ngAfterViewInit() {
    // Canvas erst nach Rendern verfügbar → dann Chart aufbauen
    setTimeout(() => this.updateChart(), 100);
  }

  /**
   * Verarbeitet alle Antworten und zählt die Auswahl pro Option
   */
  private processAnswers(docs: any[]) {
   // console.log("Dialog Question ID:", this.question?.id);
   // console.log("All answers (raw):", docs);

    if (!this.question) return;

    // Zähler initialisieren (alle Optionen = 0)
    const counts: Record<string, number> = {};
    this.question.options?.forEach(opt => counts[opt] = 0);

    // Alle Antwort-Dokumente durchlaufen
    docs.forEach((entry: any) => {
      // Jede Antwort im Dokument prüfen
      (entry.answers || []).forEach((ans: any) => {
        // Nur Antworten zur aktuellen Frage berücksichtigen
        if (ans.questionId === this.question!.id && ans.listValue) {
          ans.listValue.forEach((opt: string) => {
            if (counts[opt] !== undefined) counts[opt]++; // Zähler erhöhen
          });
        }
      });
    });

    // Ergebnisse in Array umwandeln → für Chart.js
    this.chartData = Object.entries(counts).map(([option, count]) => ({ option, count }));

    // Meistgewählte Optionen berechnen
    const maxCount = this.chartData.length > 0 ? Math.max(...this.chartData.map(r => r.count)) : 0;
    this.mostChosenOptions = this.chartData.filter(r => r.count === maxCount && maxCount > 0);

    // Chart aktualisieren
    this.updateChart();
  }

  /**
   * Erstellt oder aktualisiert das Chart
   */
  private updateChart() {
    if (!this.chartCanvas || this.chartData.length === 0) return;
    if (this.chart) this.chart.destroy(); // Vorheriges Chart löschen

    const ctx = this.chartCanvas.nativeElement;
    const colors = this.generateColors(this.chartData.length);

    // Verhindern, dass Chart komplett leer ist
    const allZero = this.chartData.every(r => r.count === 0);
    const values = allZero ? this.chartData.map(() => 0.0001) : this.chartData.map(r => r.count);

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

    // Neues Chart erstellen
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

  /**
   * Generiert Farben für die Optionen
   */
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
    // Chart beim Zerstören der Komponente bereinigen
    if (this.chart) this.chart.destroy();
  }
}
