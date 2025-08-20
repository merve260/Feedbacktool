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
  title: string = '';
  startDate?: Date;
  endDate?: Date;
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
      this.title = survey.title;
      this.startDate = survey.startAt ? new Date(survey.startAt) : undefined;
      this.endDate = survey.endAt ? new Date(survey.endAt) : undefined;
      this.questions = survey.questions ?? [];
    } catch (err) {
      this.errorMsg = 'Fehler beim Laden.';
    }
  }

  async saveAs(status: 'draft' | 'published') {
    if (!this.title || !this.startDate || !this.endDate || this.questions.length === 0) return;

    this.busy = true;
    try {
      await this.surveyService.updateSurveyWithQuestions(
        this.surveyId,
        {
          ownerId: this.auth.currentUser?.uid ?? 'UNKNOWN',
          title: this.title,
          description: undefined,
          startAt: this.startDate,
          endAt: this.endDate,
          status
        },
        this.questions
      );
      this.router.navigate(['/admin/umfragen']);
    } catch (err) {
      console.error(err);
      this.errorMsg = 'Speichern fehlgeschlagen.';
    } finally {
      this.busy = false;
    }
  }

}
