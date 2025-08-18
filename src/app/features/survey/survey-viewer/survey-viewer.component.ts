import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { NgIf, NgSwitch, NgSwitchCase, NgSwitchDefault } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { MatRadioGroup, MatRadioButton } from '@angular/material/radio';
import { MatSlider, MatSliderThumb } from '@angular/material/slider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatButton } from '@angular/material/button';

import { SurveyService } from '../../../core/services/survey.service';
import { Question } from '../../../core/models/survey.models';

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
    MatButton
  ]
})
export class SurveyViewerComponent implements OnInit {
  surveyId = '';
  // Firestore’dan gelen veri
  surveyData: { title: string; questions: Question[] } | null = null;

  // UI state
  currentIndex = 0;
  answers: any[] = [];
  isCompleted = false;
  loading = false;
  errorMsg = '';
  respondentName = '';

  constructor(
    private route: ActivatedRoute,
    private surveyService: SurveyService
  ) {}

  ngOnInit(): void {
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
      // 1) Umfrage laden → kann null sein!
      const survey = await this.surveyService.getById(id);
      if (!survey) {
        this.errorMsg = 'Diese Umfrage existiert nicht oder ist nicht mehr verfügbar.';
        this.loading = false;
        return;
      }

      // 2) Fragen laden (geordnet)
      const questions = await this.surveyService.listQuestions(id);

      // 3) View-Model befüllen (hier ist survey garantiert vorhanden)
      this.surveyData = {
        title: survey.title ?? 'Umfrage',
        questions: questions ?? []
      };

      // 4) Antwort-Array initialisieren (Slider z. B. mit min oder 1)
      this.answers = this.surveyData.questions.map((q: any) =>
        q?.type === 'slider' ? (q?.min ?? 1) : null
      );

    } catch (e: any) {
      console.error(e);
      this.errorMsg = e?.message || 'Umfrage konnte nicht geladen werden.';
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
    if (!total) return 0;
    return ((this.currentIndex + 1) / total) * 100;
  }

  async speichern(): Promise<void> {
    try {
      console.log('Antworten:', this.answers, 'Name:', this.respondentName);
      // Firestore'a kaydet
      await this.surveyService.submitResponse(this.surveyId, {
        name: this.respondentName?.trim() || undefined, // boşsa göndermeyiz
        answers: this.answers
      });
      this.isCompleted = true;
    } catch (e: any) {
      console.error(e);
      this.errorMsg = e?.message || 'Antworten konnten nicht gespeichert werden.';
    }
  }

}
