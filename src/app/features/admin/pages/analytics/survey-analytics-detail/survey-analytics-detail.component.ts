// Komponente: Detail-Analyse einer Umfrage
// Zeigt Charts und ermöglicht Excel-Export

import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { Firestore, doc, getDoc, collection, collectionData } from '@angular/fire/firestore';
import { Timestamp } from 'firebase/firestore';
import { MatDialog } from '@angular/material/dialog';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import {combineLatest, firstValueFrom, take} from 'rxjs';

import { Survey, Question } from '../../../../../core/models/survey.models';

// Import der Chart-Komponenten
import { MultipleChartComponent } from '../charts/multiple-chart/multiple-chart.component';
import { SkalaChartComponent } from '../charts/skala-chart/skala-chart.component';
import { RadioButtonChartComponent } from '../charts/radio-button-chart/radio-button-chart.component';
import { StarRatingChartComponent } from '../charts/star-rating-chart/star-rating-chart.component';
import { FreiTextListComponent } from '../charts/freitext-list/freitext-list.component';
import { FreiTextDialogComponent } from '../charts/chart-dialogs/frei-text-dialog.component';
import { AuthService } from '../../../../../core/auth/auth.service';

@Component({
  selector: 'app-survey-analytics-detail',
  standalone: true,
  imports: [
    CommonModule,
    MultipleChartComponent,
    SkalaChartComponent,
    RadioButtonChartComponent,
    StarRatingChartComponent,
    FreiTextListComponent
  ],
  templateUrl: './survey-analytics-detail.component.html',
  styleUrls: ['./survey-analytics-detail.component.scss'],
})
export class SurveyAnalyticsDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private firestore = inject(Firestore);
  private dialog = inject(MatDialog);
  private auth = inject(AuthService);

  survey?: Survey;
  questions: Question[] = [];
  answers: any[] = [];
  questionsMap: Record<string, string> = {};
  freitextAnswersMap: Record<string, { name: string; text: string }[]> = {};

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;
    const u = await firstValueFrom(this.auth.user$.pipe(take(1)));
    console.log("Aktueller User:", u);
    if (!u) return;

    // Umfrage-Dokument laden
    const docRef = doc(this.firestore, 'umfragen', id);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data() as any;
      console.log("Umfrage-Daten:", data);
      if (data.ownerId !== u.uid) {
        alert('Keine Berechtigung für diese Analyse.');
        return;
      }
      this.survey = {
        id: snap.id,
        ...data,
        startAt: data.startAt instanceof Timestamp ? data.startAt.toDate() : data.startAt,
        endAt: data.endAt instanceof Timestamp ? data.endAt.toDate() : data.endAt,
      } as Survey;

    }

    // Fragen + Antworten gleichzeitig laden
    const fragenCol = collection(this.firestore, `umfragen/${id}/fragen`);
    const answersCol = collection(this.firestore, `umfragen/${id}/antworten`);

    combineLatest([
      collectionData(fragenCol, { idField: 'id' }),
      collectionData(answersCol, { idField: 'id' })
    ]).subscribe(([fragen, ans]: [any[], any[]]) => {
      this.questions = fragen;
      this.answers = ans;

      // Fragen-Mapping
      this.questions.forEach(q => {
        this.questionsMap[q.id] = q.title || q.text || q.id;
      });

      // Freitext-Antworten vorbereiten
      this.freitextAnswersMap = {};
      this.questions.forEach(q => {
        if (q.type === 'freitext') {
          this.freitextAnswersMap[q.id] = this.answers
            .flatMap(entry =>
              (entry.answers || [])
                .filter((a: any) => a.questionId === q.id && a.textValue)
                .map((a: any) => ({
                  name: entry.name || 'Anonym',
                  text: a.textValue.length > 50 ? a.textValue.slice(0, 50) + '…' : a.textValue
                }))
            );
        }
      });
    });
  }

  // Export der Antworten nach Excel
  exportToExcel() {
    if (!this.answers || this.answers.length === 0) {
      alert('Keine Antworten vorhanden!');
      return;
    }

    const rows: any[] = [];
    this.answers.forEach((entry: any) => {
      const name = entry.name || 'Anonym';
      const createdAt = entry.createdAt?.toDate?.() || entry.createdAt || '';

      (entry.answers || []).forEach((ans: any) => {
        let value = '';

        if (ans.textValue) {
          value = ans.textValue;
        } else if (ans.numberValue !== undefined) {
          value = ans.numberValue;
        } else if (ans.listValue) {
          value = ans.listValue.join(', ');
        } else if (ans.dateRangeValue) {
          const start = ans.dateRangeValue.start
            ? new Date(ans.dateRangeValue.start).toLocaleString('de-DE', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })
            : '';
          const end = ans.dateRangeValue.end
            ? new Date(ans.dateRangeValue.end).toLocaleString('de-DE', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })
            : '';
          value = `${start}${end ? ' – ' + end : ''}`;
        }

        rows.push({
          Teilnehmer: name,
          'Erstell-Datum': createdAt,
          Frage: this.questionsMap[ans.questionId] || ans.questionId,
          'Antwort-Datum': ans.answeredAt?.toDate?.() || ans.answeredAt,
          Antwort: value,
        });
      });
    });

    if (rows.length === 0) {
      alert('Keine Antworten in den Dokumenten gefunden.');
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(rows, {
      header: ['Teilnehmer', 'Erstell-Datum', 'Frage', 'Antwort-Datum', 'Antwort'],
    });

    const workbook = { Sheets: { Antworten: worksheet }, SheetNames: ['Antworten'] };
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { type: 'application/octet-stream' });
    saveAs(data, `umfrage-${this.survey?.title || 'antworten'}.xlsx`);
  }

  // Dialog für Freitext
  openChartDialog(question: Question) {
    if (question.type === 'freitext') {
      this.dialog.open(FreiTextDialogComponent, {
        width: '90%',
        data: {
          title: question.title || 'Antworten',
          answers: this.answers
            .flatMap((entry: any) =>
              (entry.answers || [])
                .filter((ans: any) => ans.questionId === question.id && ans.textValue)
                .map((ans: any) => ({
                  name: entry.name || 'Anonym',
                  text: ans.textValue
                }))
            )
        }
      });
    }
  }
}
