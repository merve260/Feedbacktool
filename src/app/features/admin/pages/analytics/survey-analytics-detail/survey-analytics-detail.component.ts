// src/app/features/admin/pages/analytics/survey-analytics-detail/survey-analytics-detail.component.ts

import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { Firestore, doc, getDoc, collection, collectionData } from '@angular/fire/firestore';
import { Timestamp } from 'firebase/firestore';
import { MatDialog } from '@angular/material/dialog';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { Survey, Question } from '../../../../../core/models/survey.models';
import { MultipleChartComponent } from '../charts/multiple-chart/multiple-chart.component';

@Component({
  selector: 'app-survey-analytics-detail',
  standalone: true,
  imports: [CommonModule, MultipleChartComponent],
  templateUrl: './survey-analytics-detail.component.html',
  styleUrls: ['./survey-analytics-detail.component.scss'],
})
export class SurveyAnalyticsDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private firestore = inject(Firestore);
  private dialog = inject(MatDialog);

  survey?: Survey;
  questions: Question[] = [];
  answers: any[] = [];
  questionsMap: Record<string, string> = {};

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;

    // --- Umfrage-Dokument laden ---
    const docRef = doc(this.firestore, 'umfragen', id);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data() as any;
      this.survey = {
        id: snap.id,
        ...data,
        startAt: data.startAt instanceof Timestamp ? data.startAt.toDate() : data.startAt,
        endAt: data.endAt instanceof Timestamp ? data.endAt.toDate() : data.endAt,
      } as Survey;
      console.log(' Survey geladen:', this.survey);
    }

    // --- Fragen laden ---
    const fragenCol = collection(this.firestore, `umfragen/${id}/fragen`);
    collectionData(fragenCol, { idField: 'id' }).subscribe((fragen: any[]) => {
      this.questions = fragen;
      console.log(' Fragen geladen:', this.questions);

      fragen.forEach((q) => {
        this.questionsMap[q.id] = q.title || q.text || q.id;
      });
    });

    // --- Antworten laden ---
    const answersCol = collection(this.firestore, `umfragen/${id}/antworten`);
    collectionData(answersCol, { idField: 'id' }).subscribe((ans: any[]) => {
      this.answers = ans;
      console.log(' Antworten geladen:', this.answers);
    });
  }

  // ---------------- Excel-Export ----------------
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

  openChartDialog(question: Question) {
    this.dialog.open(MultipleChartComponent, {
      width: '750px',
      height: '600px',
      data: {
        surveyId: this.survey?.id!,
        question,
        fullscreen: true
      }
    });
  }
}
