// src/app/features/survey/survey-analytics/survey-analytics-detail/survey-analytics-detail.component.ts

import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import {
  Firestore,
  doc,
  getDoc,
  collection,
  collectionData
} from '@angular/fire/firestore';
import { Timestamp } from 'firebase/firestore';
import { MatDialog } from '@angular/material/dialog';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { combineLatest, firstValueFrom, take } from 'rxjs';

import { Survey, Question } from '../../../../../core/models/survey.models';

// Charts
import { MultipleChartComponent } from '../charts/multiple-chart/multiple-chart.component';
import { SkalaChartComponent } from '../charts/skala-chart/skala-chart.component';
import { RadioButtonChartComponent } from '../charts/radio-button-chart/radio-button-chart.component';
import { StarRatingChartComponent } from '../charts/star-rating-chart/star-rating-chart.component';
import { FreiTextListComponent } from '../charts/freitext-list/freitext-list.component';
import { FreiTextDialogComponent } from '../charts/chart-dialogs/frei-text-dialog.component';

import { AuthService } from '../../../../../core/auth/auth.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-survey-analytics-detail',
  standalone: true,
  imports: [
    CommonModule,
    MultipleChartComponent,
    SkalaChartComponent,
    RadioButtonChartComponent,
    StarRatingChartComponent,
    FreiTextListComponent,
    TranslateModule
  ],
  templateUrl: './survey-analytics-detail.component.html',
  styleUrls: ['./survey-analytics-detail.component.scss'],
})
export class SurveyAnalyticsDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private firestore = inject(Firestore);
  private dialog = inject(MatDialog);
  private auth = inject(AuthService);
  private translate = inject(TranslateService);

  survey?: Survey;
  questions: Question[] = [];
  answers: any[] = [];
  questionsMap: Record<string, string> = {};
  freitextAnswersMap: Record<string, { name: string; text: string }[]> = {};

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;

    const u = await firstValueFrom(this.auth.user$.pipe(take(1)));
    if (!u) return;

    const docRef = doc(this.firestore, 'umfragen', id);
    const snap = await getDoc(docRef);

    if (!snap.exists()) {
      alert(this.translate.instant('results.notFound'));
      return;
    }

    const data = snap.data() as any;
    if (data.ownerId !== u.uid) {
      alert(this.translate.instant('results.noPermission'));
      return;
    }

    this.survey = {
      id: snap.id,
      ...data,
      startAt: data.startAt instanceof Timestamp ? data.startAt.toDate() : data.startAt,
      endAt: data.endAt instanceof Timestamp ? data.endAt.toDate() : data.endAt,
    } as Survey;

    const fragenCol = collection(this.firestore, `umfragen/${id}/fragen`);
    const answersCol = collection(this.firestore, `umfragen/${id}/antworten`);

    combineLatest([
      collectionData(fragenCol, { idField: 'id' }),
      collectionData(answersCol, { idField: 'id' })
    ]).subscribe(([fragen, ans]: [any[], any[]]) => {
      this.questions = fragen;
      this.answers = ans;

      this.questionsMap = {};
      this.questions.forEach(q => {
        this.questionsMap[q.id] = q.title || q.text || q.id;
      });

      this.freitextAnswersMap = {};
      this.questions.forEach(q => {
        if (q.type === 'freitext') {
          this.freitextAnswersMap[q.id] = this.answers
            .flatMap(entry =>
              (entry.answers || [])
                .filter((a: any) => a.questionId === q.id && a.textValue)
                .map((a: any) => ({
                  name: entry.name || this.translate.instant('results.anonymous'),
                  text: a.textValue.length > 50 ? a.textValue.slice(0, 50) + '…' : a.textValue
                }))
            );
        }
      });
      setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
      }, 100);
    });
  }

  // Excel-Export (mehrsprachig)
  exportToExcel() {
    if (!this.answers || this.answers.length === 0) {
      alert(this.translate.instant('results.noAnswers'));
      return;
    }

    const rows: any[] = [];
    this.answers.forEach((entry: any) => {
      const name = entry.name || this.translate.instant('results.anonymous');
      const createdAt = entry.createdAt?.toDate?.() || entry.createdAt || '';

      (entry.answers || []).forEach((ans: any) => {
        let value = '';

        if (ans.textValue) {
          value = ans.textValue;
        } else if (ans.numberValue !== undefined) {
          value = ans.numberValue;
        } else if (ans.listValue) {
          value = ans.listValue.join(', ');
        }

        rows.push({
          [this.translate.instant('results.excel.participant')]: name,
          [this.translate.instant('results.excel.createdAt')]: createdAt,
          [this.translate.instant('results.excel.question')]: this.questionsMap[ans.questionId] || ans.questionId,
          [this.translate.instant('results.excel.answeredAt')]: ans.answeredAt?.toDate?.() || ans.answeredAt,
          [this.translate.instant('results.excel.answer')]: value,
        });
      });
    });

    if (rows.length === 0) {
      alert(this.translate.instant('results.noAnswersDocs'));
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const sheetName = this.translate.instant('results.excel.sheetName');
    const workbook = { Sheets: { [sheetName]: worksheet }, SheetNames: [sheetName] };

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { type: 'application/octet-stream' });
    const fileName = `${this.translate.instant('results.excel.filePrefix')}-${this.survey?.title || 'answers'}.xlsx`;
    saveAs(data, fileName);
  }

  openChartDialog(question: Question) {
    if (question.type === 'freitext') {
      this.dialog.open(FreiTextDialogComponent, {
        width: '90%',
        data: {
          title: question.title || this.translate.instant('results.answers'),
          answers: this.answers
            .flatMap((entry: any) =>
              (entry.answers || [])
                .filter((ans: any) => ans.questionId === question.id && ans.textValue)
                .map((ans: any) => ({
                  name: entry.name || this.translate.instant('results.anonymous'),
                  text: ans.textValue
                }))
            )
        }
      });
    }
  }
}
