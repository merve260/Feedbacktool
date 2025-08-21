import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FirebaseSurveyService } from '../../../core/services/firebase-survey.service';
import { Survey, Question } from '../../../core/models/survey.models';
import { SurveyBuilderComponent } from '../survey-builder/survey-builder.component';
import { NgIf } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { Auth } from '@angular/fire/auth';

@Component({
  selector: 'app-survey-edit',
  standalone: true,
  templateUrl: './survey-edit.component.html',
  styleUrls: ['./survey-edit.component.scss'],
  imports: [
    NgIf,
    MatButtonModule,
    SurveyBuilderComponent
  ]
})
export class SurveyEditComponent implements OnInit {
  surveyId!: string;
  title = '';
  description = '';
  startAt?: Date;
  endAt?: Date;
  questions: Question[] = [];

  busy = false;
  errorMsg = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private surveyService: FirebaseSurveyService,
    private auth: Auth
  ) {}

  async ngOnInit() {
    this.surveyId = this.route.snapshot.paramMap.get('id')!;
    try {
      const survey = await this.surveyService.getSurveyWithQuestions(this.surveyId);

      // direkt normalleştirilmiş alanları kullan
      this.title = survey.title ?? '';
      this.description = survey.description ?? '';
      this.startAt = survey.startAt ? new Date(survey.startAt) : undefined;
      this.endAt = survey.endAt ? new Date(survey.endAt) : undefined;
      this.questions = survey.questions ?? [];
    } catch (err) {
      this.errorMsg = 'Fehler beim Laden.';
    }
  }

  /** Ganze Umfrage speichern mit Statuswechsel */
  async updateSurvey(status: 'draft' | 'published') {
    if (!this.surveyId) return;

    try {
      await this.surveyService.updateSurveyWithQuestions(
        this.surveyId,
        {
          ownerId: this.auth.currentUser?.uid ?? '',
          title: this.title,
          description: this.description,
          startAt: this.startAt,
          endAt: this.endAt,
          status
        },
        this.questions
      );
      this.router.navigate(['/admin/umfragen']);
    } catch (err) {
      console.error('Speichern fehlgeschlagen:', err);
      this.errorMsg = 'Speichern fehlgeschlagen.';
    }
  }
}
