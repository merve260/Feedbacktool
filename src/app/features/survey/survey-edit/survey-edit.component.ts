// src/app/features/survey/survey-edit/survey-edit.component.ts
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SurveyService } from '../../../core/services/survey.service';
import { Question } from '../../../core/models/survey.models';
import { SurveyBuilderComponent } from '../survey-builder/survey-builder.component';
import { NgIf, CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { ReactiveFormsModule } from '@angular/forms';
import { Auth } from '@angular/fire/auth';

@Component({
  selector: 'app-survey-edit',
  standalone: true,
  templateUrl: './survey-edit.component.html',
  styleUrls: ['./survey-edit.component.scss'],
  imports: [
    CommonModule,
    NgIf,
    ReactiveFormsModule,
    MatButtonModule,
    SurveyBuilderComponent
  ]
})
export class SurveyEditComponent implements OnInit {

  // ===== Eigenschaften (State) =====
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

  // ------------------ Initialisierung ------------------
  async ngOnInit() {
    this.surveyId = this.route.snapshot.paramMap.get('id')!;

    try {
      // Umfrage laden
      const survey = await this.surveyService.getById(this.surveyId);
      if (!survey) throw new Error('Not found');

      // Felder setzen
      this.title = survey.title ?? '';
      this.description = survey.description ?? '';
      this.startAt = survey.startAt ?? undefined;
      this.endAt   = survey.endAt   ?? undefined;

      // Fragen laden
      this.questions = await this.surveyService.listQuestions(this.surveyId);

    } catch (err) {
      this.errorMsg = 'Fehler beim Laden.';
    }
  }

  // ------------------ Update (Speichern) ------------------
  async updateSurvey(status: 'draft' | 'published') {
    if (!this.surveyId) return;

    try {
      // Umfrage + Fragen aktualisieren
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

      // Fragenliste nach Update neu laden
      this.questions = await this.surveyService.listQuestions(this.surveyId);

      // Nach Dashboard zurück
      this.router.navigate(['/admin/umfragen']);

    } catch (err) {
      console.error('Speichern fehlgeschlagen:', err);
      this.errorMsg = 'Speichern fehlgeschlagen.';
    }
  }
}
