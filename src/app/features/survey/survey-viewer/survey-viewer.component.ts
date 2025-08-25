// src/app/features/survey/survey-viewer/survey-viewer.component.ts
import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import {NgClass, NgForOf, NgIf, NgSwitch, NgSwitchCase, NgSwitchDefault} from '@angular/common';
import { FormsModule } from '@angular/forms';

import { MatRadioGroup, MatRadioButton } from '@angular/material/radio';
import { MatSlider, MatSliderThumb } from '@angular/material/slider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatButton } from '@angular/material/button';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';

import { SurveyService } from '../../../core/services/survey.service';
import { Question, Answer } from '../../../core/models/survey.models';

// Firestore-ID Generator (für eindeutige Antwort-IDs)
import { doc, collection, Firestore } from '@angular/fire/firestore';

@Component({
  selector: 'app-survey-viewer',
  standalone: true,
  templateUrl: './survey-viewer.component.html',
  styleUrls: ['./survey-viewer.component.scss'],
  encapsulation: ViewEncapsulation.None,
  imports: [
    NgIf,
    NgSwitch,
    NgSwitchCase,
    NgSwitchDefault,
    FormsModule,
    MatRadioGroup,
    MatRadioButton,
    MatSlider,
    MatSliderThumb,
    MatFormFieldModule,
    MatInputModule,
    MatProgressBarModule,
    MatButton,
    MatCheckbox,
    MatIconModule,
    NgClass,
    NgForOf
  ]
})
export class SurveyViewerComponent implements OnInit {
  surveyId = '';
  surveyData: { title: string; questions: Question[] } | null = null;

  // 🔄 UI-Zustand
  currentIndex = 0;
  answers: any[] = [];
  isCompleted = false;
  loading = false;
  errorMsg = '';
  respondentName = '';

  constructor(
    private route: ActivatedRoute,
    private surveyService: SurveyService,
    private firestore: Firestore
  ) {}

  ngOnInit(): void {
    // Survey-ID aus der URL lesen und laden
    this.route.paramMap.subscribe(async (params) => {
      this.surveyId = params.get('id') || '';
      await this.loadSurvey(this.surveyId);
    });
  }

  // ----------------- Umfrage + Fragen laden -----------------
  private async loadSurvey(id: string): Promise<void> {
    this.loading = true;
    this.errorMsg = '';
    this.surveyData = null;
    this.currentIndex = 0;
    this.answers = [];

    try {
      const survey = await this.surveyService.getById(id);
      if (!survey) {
        this.errorMsg = 'Diese Umfrage existiert nicht oder ist nicht mehr verfügbar.';
        this.loading = false;
        return;
      }

      const questions = await this.surveyService.listQuestions(id);

      this.surveyData = {
        title: survey.title ?? 'Umfrage',
        questions: questions ?? []
      };

      // Initialwerte je nach Fragetyp setzen
      this.answers = this.surveyData.questions.map((q: Question) => {
        switch (q.type) {
          case 'yesno':
          case 'radio':
            return null;
          case 'multiple':
            return Array(q.options?.length || 0).fill(false);
          case 'slider':
            return q.min ?? 1;
          case 'star':
            return 0;
          case 'freitext':
            return '';
          case 'date':
            return { start: '', end: '' };
          case 'dragdrop':
            return q.items ? [...q.items] : [];
          default:
            return null;
        }
      });

    } catch (e: any) {
      console.error(e);
      this.errorMsg = e?.message || 'Umfrage konnte nicht geladen werden.';
    } finally {
      this.loading = false;
    }
  }

  // ----------------- Navigation -----------------
  get currentQuestion() {
    return this.surveyData?.questions?.[this.currentIndex];
  }

  weiter(): void {
    if (!this.surveyData) return;
    if (this.currentIndex < this.surveyData.questions.length - 1) {
      this.currentIndex++;
    }
  }

  zurueck(): void {
    if (this.currentIndex > 0) {
      this.currentIndex--;
    }
  }

  getProgress(): number {
    const total = this.surveyData?.questions?.length ?? 0;
    if (!total) return 0;
    return ((this.currentIndex + 1) / total) * 100;
  }

  // ----------------- Antworten speichern -----------------
  async speichern(): Promise<void> {
    if (!this.surveyData) return;

    try {
      const responses: Answer[] = this.surveyData.questions.map((q, i) => {
        const val = this.answers[i];
        const answer: Answer = {
          id: this.generateId(),         // eindeutige Antwort-ID
          questionId: q.id,
          answeredAt: new Date()
        };

        // Typ-spezifische Antwortzuordnung
        if (q.type === 'yesno' || q.type === 'radio' || q.type === 'freitext') {
          answer.textValue = val ?? '';
        } else if (q.type === 'slider' || q.type === 'star') {
          answer.numberValue = typeof val === 'number' ? val : Number(val);
        } else if (q.type === 'multiple' || q.type === 'dragdrop') {
          if (Array.isArray(val) && q.options) {
            answer.listValue = q.type === 'multiple'
              ? q.options.filter((_, idx) => val[idx])
              : val;
          }
        } else if (q.type === 'date') {
          answer.dateRangeValue = {
            start: val?.start || '',
            end: val?.end || ''
          };
        }
        return answer;
      });

      // Name speichern → falls leer, "Anonym"
      await this.surveyService.submitResponse(this.surveyId, {
        name: this.respondentName?.trim() || 'Anonym',
        answers: responses
      });

      this.isCompleted = true;
    } catch (e: any) {
      console.error(e);
      this.errorMsg = e?.message || 'Antworten konnten nicht gespeichert werden.';
    }
  }

  // ----------------- Hilfsfunktion: Firestore-ID -----------------
  private generateId(): string {
    return doc(collection(this.firestore, '_')).id;
  }
}
