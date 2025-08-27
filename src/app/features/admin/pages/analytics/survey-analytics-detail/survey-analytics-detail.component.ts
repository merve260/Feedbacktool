import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { Firestore, doc, getDoc, collection, collectionData } from '@angular/fire/firestore';
import { Survey } from '../../../../../core/models/survey.models';
import { Timestamp } from 'firebase/firestore';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

@Component({
  selector: 'app-survey-analytics-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './survey-analytics-detail.component.html',
  styleUrls: ['./survey-analytics-detail.component.scss'],
})
export class SurveyAnalyticsDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private firestore = inject(Firestore);

  survey?: Survey;
  answers: any[] = [];
  questionsMap: Record<string, string> = {};

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;

    // --- Survey selbst laden ---
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
    }

    // --- Fragen laden ---
    const fragenCol = collection(this.firestore, `umfragen/${id}/fragen`);
    collectionData(fragenCol, { idField: 'id' }).subscribe((fragen: any[]) => {
      fragen.forEach((q) => {
        this.questionsMap[q.id] = q.title || q.text || q.id;
      });
    });

    // --- Antworten laden ---
    const answersCol = collection(this.firestore, `umfragen/${id}/antworten`);
    collectionData(answersCol, { idField: 'id' }).subscribe((ans: any[]) => {
      this.answers = ans;
    });
  }

  exportToExcel() {
    if (!this.answers || this.answers.length === 0) {
      alert('Keine Antworten vorhanden!');
      return;
    }

    const rows: any[] = [];
    this.answers.forEach((entry: any) => {
      const name = entry.name || 'Anonym';
      const createdAt = entry.createdAt?.toDate?.() || entry.createdAt;

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
              day: '2-digit', month: '2-digit', year: 'numeric',
              hour: '2-digit', minute: '2-digit'
            })
            : '';
          const end = ans.dateRangeValue.end
            ? new Date(ans.dateRangeValue.end).toLocaleString('de-DE', {
              day: '2-digit', month: '2-digit', year: 'numeric',
              hour: '2-digit', minute: '2-digit'
            })
            : '';
          value = `${start}${end ? ' – ' + end : ''}`;
        }

        rows.push({
          Teilnehmer: name,
          'Erstell-Datum': createdAt,
          Frage: this.questionsMap[ans.questionId] || ans.questionId,
          'Antwort-Datum': ans.answeredAt?.toDate?.() || ans.answeredAt,
          Antwort: value
        });
      });
    });

    if (rows.length === 0) {
      alert('Keine Antworten in den Dokumenten gefunden.');
      return;
    }

    // Deutsche Header explizit verwenden
    const worksheet = XLSX.utils.json_to_sheet(rows, {
      header: ['Teilnehmer', 'Erstell-Datum', 'Frage', 'Antwort-Datum', 'Antwort']
    });

    const workbook = { Sheets: { 'Antworten': worksheet }, SheetNames: ['Antworten'] };
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { type: 'application/octet-stream' });
    saveAs(data, `umfrage-${this.survey?.title || 'antworten'}.xlsx`);
  }

}
