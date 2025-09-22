import { Component, OnInit, inject } from '@angular/core';
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
import { TranslateModule, TranslateService } from '@ngx-translate/core';

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
    SurveyBuilderComponent,
    TranslateModule
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

  // Services via inject()
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private surveyService = inject(SurveyService);
  private auth = inject(Auth);
  private dialog = inject(MatDialog);
  private translate = inject(TranslateService);

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
      this.errorMsg = this.translate.instant('edit.errorLoad');
    }
  }

  // Änderungen speichern: entweder als Entwurf oder veröffentlichen
  async updateSurvey(status: 'draft' | 'published') {
    if (!this.surveyId) return;

    try {
      this.questions = this.questions.map((q, idx) => ({
        ...q,
        order: idx
      }));
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
      this.errorMsg = this.translate.instant('edit.errorSave');
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
