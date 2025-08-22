import {Component, OnInit} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SurveyService } from '../../../core/services/survey.service';
import { Question } from '../../../core/models/survey.models';
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
  errorMsg = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private surveyService: SurveyService,
    private auth: Auth
  ) {}

  async ngOnInit() {
    this.surveyId = this.route.snapshot.paramMap.get('id')!;
    try {
      const survey = await this.surveyService.getById(this.surveyId);

      if (!survey) throw new Error('Not found');

      this.title = survey.title ?? '';
      this.description = survey.description ?? '';
      this.startAt = survey.startAt ?? undefined;
      this.endAt   = survey.endAt   ?? undefined;
      this.questions = await this.surveyService.listQuestions(this.surveyId);
    } catch (err) {
      this.errorMsg = 'Fehler beim Laden.';
    }
  }

  async updateSurvey(status: 'draft' | 'published') {
    if (!this.surveyId) return;
    try {
      await this.surveyService.updateSurveyWithQuestions(
        this.surveyId,
        {
          ownerId: this.auth.currentUser?.uid ?? '',
          title: this.title,
          description: this.description ?? '',
          startAt: this.startAt ?? undefined,
          endAt: this.endAt ?? undefined,
          status
        },
        this.questions
      );

      this.questions = await this.surveyService.listQuestions(this.surveyId);

      this.router.navigate(['/admin/umfragen']);
    } catch (err) {
      console.error('Speichern fehlgeschlagen:', err);
      this.errorMsg = 'Speichern fehlgeschlagen.';
    }
  }
}
