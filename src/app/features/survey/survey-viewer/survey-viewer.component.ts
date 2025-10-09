import { Component, OnInit, inject, ViewEncapsulation } from '@angular/core';
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

// Services & Modelle
import { SurveyService } from '../../../core/services/survey.service';
import { Question, Answer } from '../../../core/models/survey.models';

// Firestore-ID Generator
import { doc, collection, Firestore } from '@angular/fire/firestore';

// Translate
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-survey-viewer',
  standalone: true,
  templateUrl: './survey-viewer.component.html',
  styleUrls: ['./survey-viewer.component.scss'],
  encapsulation: ViewEncapsulation.None,
  imports: [
    NgIf, NgSwitch, NgSwitchCase, NgSwitchDefault, NgForOf, NgClass,
    FormsModule,
    MatRadioGroup, MatRadioButton, MatFormFieldModule, MatInputModule,
    MatProgressBarModule, MatButton, MatCheckbox, MatIconModule,
    TranslateModule
  ]
})
export class SurveyViewerComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private surveyService = inject(SurveyService);
  private firestore = inject(Firestore);
  private translate = inject(TranslateService);

  surveyId = '';
  surveyData: { title: string; logoUrl?: string | null; questions: Question[] } | null = null;
  currentLang = 'de';
  currentIndex = 0;
  answers: any[] = [];
  isCompleted = false;
  loading = false;
  errorMsg = '';
  respondentName = '';

  ngOnInit(): void {
    this.currentLang = this.translate.currentLang || 'de';
    this.route.paramMap.subscribe(async (params) => {
      this.surveyId = params.get('id') || '';
      await this.loadSurvey(this.surveyId);
    });
  }

  private async loadSurvey(id: string): Promise<void> {
    this.loading = true;
    this.errorMsg = '';
    this.surveyData = null;
    this.currentIndex = 0;
    this.answers = [];

    try {
      const survey = await this.surveyService.getById(id);
      if (!survey) {
        this.errorMsg = 'viewer.errorNotFound';
        return;
      }

      const now = new Date();
      const start = survey.startAt && typeof (survey.startAt as any).toDate === 'function'
        ? (survey.startAt as any).toDate()
        : survey.startAt ?? null;
      const end = survey.endAt && typeof (survey.endAt as any).toDate === 'function'
        ? (survey.endAt as any).toDate()
        : survey.endAt ?? null;

      if (survey.status === 'closed') {
        this.errorMsg = 'viewer.errorClosed';
        return;
      }

      if (start && now < start) {
        this.errorMsg = 'viewer.errorNotStarted';
        return;
      }

      if (end && now > end) {
        this.errorMsg = 'viewer.errorExpired';
        if (survey.status === 'published') {
          await this.surveyService.updateStatus(id, 'closed');
        }
        return;
      }

      const questions = await this.surveyService.listQuestions(id);
      this.surveyData = {
        title: survey.title ?? 'Umfrage',
        logoUrl: survey.logoUrl ?? null,
        questions: questions ?? []
      };

      this.answers = this.surveyData.questions.map((q: Question) => {
        switch (q.type) {
          case 'radio': return null;
          case 'multiple': return Array(q.options?.length || 0).fill(false);
          case 'slider': return q.min ?? 1;
          case 'star': return 0;
          case 'freitext': return '';
          default: return null;
        }
      });
    } catch (e: any) {
      console.error(e);
      this.errorMsg = 'viewer.errorLoad';
    } finally {
      this.loading = false;
    }
  }

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
    return total ? ((this.currentIndex + 1) / total) * 100 : 0;
  }

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
        if (q.type === 'radio' || q.type === 'freitext') {
          answer.textValue = val ?? '';
        } else if (q.type === 'slider' || q.type === 'star') {
          answer.numberValue = typeof val === 'number' ? val : Number(val);
        } else if (q.type === 'multiple' && Array.isArray(val) && q.options) {
          answer.listValue = q.options.filter((_, idx) => val[idx]);
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
      this.errorMsg = 'viewer.errorSave';
    }
  }

  private generateId(): string {
    return doc(collection(this.firestore, '_')).id;
  }

  getPercent(i: number): number {
    const min = this.surveyData?.questions[i].min ?? 1;
    const max = this.surveyData?.questions[i].max ?? 10;
    const val = this.answers[i] ?? min;
    return ((val - min) / (max - min)) * 100;
  }

  onSlide(i: number): void {}

  getSliderBackground(value: number, min: number, max: number): string {
    const percent = ((value - min) / (max - min)) * 100;
    return `linear-gradient(to right, #8133ae ${percent}%, #e2cdea ${percent}%)`;
  }

  // Sprache umschalten
  switchLang(lang: 'de' | 'en') {
    this.translate.use(lang);
    this.currentLang = lang;
  }
}
