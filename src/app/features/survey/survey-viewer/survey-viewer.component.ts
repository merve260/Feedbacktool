// src/app/features/survey/survey-viewer/survey-viewer.component.ts
import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import {
  NgClass, NgForOf, NgIf,
  NgSwitch, NgSwitchCase, NgSwitchDefault
} from '@angular/common';
import { FormsModule } from '@angular/forms';

// Angular Material
import { MatRadioGroup, MatRadioButton } from '@angular/material/radio';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatButton } from '@angular/material/button';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepicker, MatDatepickerInput, MatDatepickerToggle } from '@angular/material/datepicker';

// Drag & Drop
import { CdkDrag, CdkDragHandle, CdkDropList } from '@angular/cdk/drag-drop';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';

// Services & Modelle
import { SurveyService } from '../../../core/services/survey.service';
import { Question, Answer } from '../../../core/models/survey.models';

// Firestore-ID Generator
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
    FormsModule,
    MatRadioGroup,
    MatRadioButton,
    MatFormFieldModule,
    MatInputModule,
    MatProgressBarModule,
    MatButton,
    MatCheckbox,
    MatIconModule,
    NgClass,
    NgForOf,
    CdkDropList,
    CdkDragHandle,
    CdkDrag,
    MatDatepickerInput,
    MatDatepickerToggle,
    MatDatepicker,
    NgSwitchDefault
  ]
})
export class SurveyViewerComponent implements OnInit {
  surveyId = '';
  surveyData: { title: string; questions: Question[] } | null = null;

  // UI-Zustand
  currentIndex = 0;              // Index der aktuellen Frage
  answers: any[] = [];           // Gesammelte Antworten
  isCompleted = false;           // Wurde die Umfrage beendet?
  loading = false;               // Ladezustand
  errorMsg = '';                 // Fehlermeldung
  respondentName = '';           // Teilnehmername (optional)

  constructor(
    private route: ActivatedRoute,
    private surveyService: SurveyService,
    private firestore: Firestore
  ) {}

  ngOnInit(): void {
    // Umfrage-ID aus URL lesen und Daten laden
    this.route.paramMap.subscribe(async (params) => {
      this.surveyId = params.get('id') || '';
      await this.loadSurvey(this.surveyId);
    });
  }

  // ----------------- Umfrage laden -----------------
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
            return { date: null, time: '' };

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
          id: this.generateId(),
          questionId: q.id,
          answeredAt: new Date()
        };

        // Antwort je nach Typ zuordnen
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
          let combined: Date | null = null;
          if (val?.date) {
            combined = new Date(val.date);
            if (val.time) {
              const [hh, mm] = val.time.split(':').map(Number);
              if (!isNaN(hh)) combined.setHours(hh);
              if (!isNaN(mm)) combined.setMinutes(mm);
            }
          }

          answer.dateRangeValue = {
            start: combined ? combined.toISOString() : '',
            end: '' // falls du später ein Enddatum brauchst
          };
        }
        return answer;
      });

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

  // ----------------- Hilfsfunktionen -----------------
  private generateId(): string {
    return doc(collection(this.firestore, '_')).id;
  }

  onDrop(event: CdkDragDrop<string[]>): void {
    moveItemInArray(this.answers[this.currentIndex], event.previousIndex, event.currentIndex);
  }
  getPercent(i: number): number {
    const min = this.surveyData?.questions[i].min ?? 1;
    const max = this.surveyData?.questions[i].max ?? 10;
    const val = this.answers[i] ?? min;
    return ((val - min) / (max - min)) * 100;
  }
  onSlide(i: number): void {
    const val = this.answers[i];
    console.log(`Slider für Frage ${i + 1}: Wert = ${val}`);
  }
  getSliderBackground(value: number, min: number, max: number): string {
    const percent = ((value - min) / (max - min)) * 100;
    return `linear-gradient(to right, #8133ae ${percent}%, #e2cdea ${percent}%)`;
  }


}
