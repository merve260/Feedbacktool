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
  @Input() fullscreen = false;

  @ViewChild('chartCanvas') chartCanvas!: ElementRef<HTMLCanvasElement>;

  answers$!: Observable<{ option: string; count: number }[]>;
  mostChosenOptions: { option: string; count: number }[] = [];

  private chartData: { option: string; count: number }[] = [];

  ngOnInit() {
    if (!this.surveyId || !this.question) return;

    const answersCol = collection(this.firestore, `umfragen/${this.surveyId}/antworten`);
    this.answers$ = collectionData(answersCol, { idField: 'id' }).pipe(
      map((docs: any[]) => {
        if (!this.question) return [];

        const counts: Record<string, number> = {};
        this.question.options?.forEach(opt => counts[opt] = 0);

        docs.forEach((doc: any) => {
          (doc.answers || []).forEach((ans: any) => {
            if (ans.questionId === this.question!.id && ans.listValue) {
              ans.listValue.forEach((opt: string) => {
                if (counts[opt] !== undefined) counts[opt]++;
              });
            }
          });
        });

        const results = Object.entries(counts).map(([option, count]) => ({ option, count }));
        if (results.length > 0) {
          const maxCount = Math.max(...results.map(r => r.count));
          this.mostChosenOptions = results.filter(r => r.count === maxCount && maxCount > 0);
        } else {
          this.mostChosenOptions = [];
        }
        return results;
      })
    );

    this.sub = this.answers$.subscribe(results => {
      this.chartData = results;
      this.updateChart();
    });
  }

  ngAfterViewInit() {
    // dialog açıldığında boyutu ayarlaması için
    setTimeout(() => this.updateChart(), 100);
  }

  private updateChart() {
    if (!this.chartCanvas || this.chartData.length === 0) return;
    if (this.chart) this.chart.destroy();

    const ctx = this.chartCanvas.nativeElement;
    const colors = this.generateColors(this.chartData.length);

    const allZero = this.chartData.every(r => r.count === 0);
    const values = allZero ? this.chartData.map(() => 0.0001) : this.chartData.map(r => r.count);

    const data: ChartConfiguration<'pie'>['data'] = {
      labels: this.chartData.map(r => r.option),
      datasets: [{
        label: 'Stimmen',
        data: values,
        backgroundColor: colors,                      // normal renk (saydam)
        hoverBackgroundColor: colors,                 // hover da aynı kalsın
        borderColor: colors.map(c => c.replace('0.6', '1')), // daha koyu kenar
        borderWidth: 1,
        hoverOffset: 12
      }]
    };


    this.chart = new Chart(ctx, {
      type: 'pie',
      data,
      options: {
        responsive: true,
        maintainAspectRatio: true,  // 🔹 burada sorun çıkıyorsa
        aspectRatio: 1,             // 🔹 kare tutmak için ekle
        plugins: {
          legend: { position: 'top' }
        },
        layout: {
          padding: 10
        }
      }
    });

  }

  private generateColors(count: number): string[] {
    const pastelPalette = [
      'rgba(255, 99, 132, 0.6)',   // Soft pink
      'rgba(54, 162, 235, 0.6)',   // Soft blue
      'rgba(153, 102, 255, 0.6)',  // Soft purple
      'rgba(75, 192, 192, 0.6)',   // Soft teal
      'rgba(201, 203, 207, 0.6)',  // Soft grey
      'rgba(255, 159, 64, 0.6)',   // Soft orange
    ];

    return Array.from({ length: count }, (_, i) => pastelPalette[i % pastelPalette.length]);
  }

  ngOnDestroy() {
    if (this.chart) this.chart.destroy();
    if (this.sub) this.sub.unsubscribe();
  }
}
