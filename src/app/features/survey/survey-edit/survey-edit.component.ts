import {Component, OnInit} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FirebaseSurveyService } from '../../../core/services/firebase-survey.service';
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
    private surveyService: FirebaseSurveyService,
    private auth: Auth
  ) {
  }

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
  /** Ganze Umfrage speichern mit Statuswechsel */
  async updateSurvey(status: 'draft' | 'published') {
    if (!this.surveyId) return;

    try {
      console.log('Update starten für Survey:', this.surveyId);
      console.log('Neue Werte (vor Update):', {
        ownerId: this.auth.currentUser?.uid ?? '',
        title: this.title,
        description: this.description,
        startAt: this.startAt,
        endAt: this.endAt,
        status,
        questions: this.questions
      });

      // 1. Survey + Questions speichern
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

      // 2. Danach Fragen erneut laden, damit IDs auch im Frontend ankommen
      this.questions = await this.surveyService.listQuestions(this.surveyId);

      console.log('Update erfolgreich gespeichert!');
      console.log('Fragen nach Reload:', this.questions);

      // 3. Navigation (kendi isteğine göre burayı değiştirebilirsin)
      this.router.navigate(['/admin/umfragen']);
    } catch (err) {
      console.error('Speichern fehlgeschlagen:', err);
      this.errorMsg = 'Speichern fehlgeschlagen.';
    }
  }
}
