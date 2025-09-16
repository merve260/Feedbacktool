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
import { MatDialog } from '@angular/material/dialog';
import { SurveyPreviewModalComponent } from '../../../shared/modals/survey-preview-modal/survey-preview-modal';

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

  // Zustandsvariablen für die zu bearbeitende Umfrage
  surveyId!: string;
  title = '';
  description = '';
  startAt?: Date;
  endAt?: Date;
  questions: Question[] = [];
  errorMsg = '';
  logoUrl: string | null = null;


  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private surveyService: SurveyService,
    private auth: Auth,
    private dialog: MatDialog
  ) {}

  // Beim Laden der Seite: vorhandene Umfrage + Fragen holen
  async ngOnInit() {
    this.surveyId = this.route.snapshot.paramMap.get('id')!;

    try {
      const survey = await this.surveyService.getById(this.surveyId);
      if (!survey) throw new Error('Not found');

      // Basisdaten setzen
      this.title = survey.title ?? '';
      this.description = survey.description ?? '';
      this.startAt = survey.startAt ?? undefined;
      this.endAt   = survey.endAt   ?? undefined;
      this.logoUrl = survey.logoUrl ?? null;

      // Fragen separat laden
      this.questions = await this.surveyService.listQuestions(this.surveyId);

    } catch (err) {
      this.errorMsg = 'Fehler beim Laden.';
    }
  }

  // Änderungen speichern: entweder als Entwurf oder veröffentlichen
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
          status,
          logoUrl: this.logoUrl ?? null
        },
        this.questions
      );

      // Fragenliste nach Speichern neu laden
      this.questions = await this.surveyService.listQuestions(this.surveyId);

      // Zurück zum Dashboard
      this.router.navigate(['/admin/umfragen']);

    } catch (err) {
      console.error('Speichern fehlgeschlagen:', err);
      this.errorMsg = 'Speichern fehlgeschlagen.';
    }
  }

  // Vorschau öffnet ein Dialog-Fenster mit Umfragedaten
  openPreview() {
    this.dialog.open(SurveyPreviewModalComponent, {
      width: '700px',
      data: {
        title: this.title,
        description: this.description,
        questions: this.questions
      }
    });
  }
}
