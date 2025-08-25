// src/app/features/survey/survey-publish/survey-publish.component.ts
import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterModule } from '@angular/router';

import { SurveyService } from '../../../core/services/survey.service';
import { Question } from '../../../core/models/survey.models';
import { AuthService } from '../../../core/auth/auth.service';
import { firstValueFrom } from 'rxjs';
import { take } from 'rxjs/operators';

@Component({
  selector: 'app-survey-publish',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatTooltipModule, RouterModule],
  templateUrl: './survey-publish.component.html',
  styleUrls: ['./survey-publish.component.scss']
})
export class SurveyPublishComponent {
  // ------ Inputs ------
  @Input() startDate: Date | null | undefined = null;
  @Input() endDate: Date | null | undefined = null;
  @Input() showActions: boolean = true;
  @Input() surveyTitle: string = '';
  @Input() surveySubTitle: string = '';
  @Input() surveySubDescription: string = '';
  @Input() surveyQuestions: Question[] = [];
  @Input() surveySubQuestions: Question[] = [];
  @Input() surveyQuestionCount: number = 0;
  @Input() surveySubQuestionCount: number = 0;
  @Input() canvasQuestions: Question[] = [];

  // ------ Outputs ------
  @Output() draftRequested = new EventEmitter<string>();
  @Output() publishRequested = new EventEmitter<string>();
  @Output() questionsChange = new EventEmitter<Question[]>();

  // ------ States ------
  busy = false;
  publishing = false;
  errorMsg = '';
  copied = false;
  linkVisible = false;
  surveyId: string | null = null;

  constructor() {
    console.log('SurveyPublishComponent CONSTRUCTOR', { showActions: this.showActions });
  }

  // ------ Services ------
  private surveyService = inject(SurveyService);
  private auth = inject(AuthService);

  // ------------------ Date Helpers ------------------
  private startOfDay(d: Date | null | undefined): Date | null {
    if (!d) return null;
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x;
  }

  private get today(): Date {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return t;
  }

  get startInPast(): boolean {
    const s = this.startOfDay(this.startDate);
    return !!(s && s < this.today);
  }

  get endBeforeStart(): boolean {
    const s = this.startOfDay(this.startDate);
    const e = this.startOfDay(this.endDate);
    return !!(s && e && e < s);
  }

  // ------------------ Validation ------------------
  isReady(): boolean {
    const hasTitle = !!this.surveyTitle?.trim();
    const hasDates = !!this.startDate && !!this.endDate;
    const hasQuestions = this.canvasQuestions?.length > 0;

    console.log('READY CHECK', {
      title: this.surveyTitle,
      start: this.startDate,
      end: this.endDate,
      questions: this.canvasQuestions,
      result: hasTitle && hasDates && hasQuestions && !this.startInPast && !this.endBeforeStart
    });


    return hasTitle && hasDates && hasQuestions && !this.startInPast && !this.endBeforeStart;
  }


  // ------------------ Link Helpers ------------------
  getSurveyLink(): string {
    if (!this.surveyId) return '#';
    return `${window.location.origin}/survey/${this.surveyId}`;
  }

  copyLinkToClipboard(): void {
    const link = this.getSurveyLink();
    if (!this.surveyId || link === '#') return;

    navigator.clipboard.writeText(link).then(() => {
      this.copied = true;
      setTimeout(() => (this.copied = false), 2000);
    });
  }

  goToViewer(): void {
    if (!this.surveyId) return;
    window.open(`/survey/${this.surveyId}`, '_blank');
  }

  // ------------------ Question Mapping ------------------
  private mapToQuestion(q: any, index: number): Question {
    const opts = Array.isArray(q.options) ? q.options.filter((x: any) => x != null) : undefined;
    const items = Array.isArray(q.items) ? q.items.filter((x: any) => x != null) : undefined;

    return {
      type: q.type,
      title: q.title || q.label || `Frage ${index + 1}`,
      text: q.text ?? null,
      options: opts && opts.length ? opts : undefined,
      min: q.min ?? null,
      max: q.max ?? null,
      step: q.step ?? null,
      placeholderText: q.placeholderText ?? null,
      maxStars: q.maxStars ?? null,
      items: items && items.length ? items : undefined,
      startPlaceholder: q.startPlaceholder ?? null,
      endPlaceholder: q.endPlaceholder ?? null,
      thumbLabel: q.thumbLabel ?? null,
    } as Question;
  }

  // ------------------ Draft speichern ------------------
  async onDraft(): Promise<void> {
    console.log('PUBLISH INPUTS', this.startDate, this.endDate, this.surveyTitle);

    if (!this.isReady() || this.busy) return;

    this.errorMsg = '';
    this.linkVisible = false;
    this.surveyId = null;
    this.busy = true;

    try {
      const u = await firstValueFrom(this.auth.user$.pipe(take(1)));
      if (!u) throw new Error('Nicht angemeldet.');

      const id = await this.surveyService.createDraft({
        ownerId: u.uid,
        title: this.surveyTitle.trim(),
        description: this.surveySubDescription || null,
        startAt: this.startDate ? new Date(this.startDate) : undefined,
        endAt:   this.endDate ? new Date(this.endDate) : undefined
      });


      this.surveyId = id;

      const writes = this.canvasQuestions.map((q, i) =>
        this.surveyService.addQuestion(id, this.mapToQuestion(q, i))
      );
      await Promise.all(writes);

      this.draftRequested.emit(id);
    } catch (e: any) {
      console.error(e);
      this.errorMsg = e?.message || 'Entwurf konnte nicht gespeichert werden.';
      this.surveyId = null;
    } finally {
      this.busy = false;
    }
  }

  // ------------------ Veröffentlichen ------------------
  async publishSurvey(): Promise<void> {
    if (!this.isReady() || this.busy) return;

    this.errorMsg = '';
    this.linkVisible = false;
    this.surveyId = null;
    this.busy = true;
    this.publishing = true;

    try {
      const u = await firstValueFrom(this.auth.user$.pipe(take(1)));
      if (!u) throw new Error('Nicht angemeldet.');

      const id = await this.surveyService.createDraft({
        ownerId: u.uid,
        title: this.surveyTitle.trim(),
        description: this.surveySubDescription || null,  // 🔑 description fix
        startAt: this.startDate!,
        endAt: this.endDate!
      });

      this.surveyId = id;

      const writes = this.canvasQuestions.map((q, i) =>
        this.surveyService.addQuestion(id, this.mapToQuestion(q, i))
      );
      await Promise.all(writes);

      await this.surveyService.publish(id, this.startDate!, this.endDate!);

      this.linkVisible = true;
      this.publishRequested.emit(id);

      setTimeout(() => {
        document.getElementById('linkSection')
          ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);

    } catch (e: any) {
      console.error(e);
      this.errorMsg = e?.message || 'Veröffentlichen fehlgeschlagen.';
      this.surveyId = null;
      this.linkVisible = false;
    } finally {
      this.publishing = false;
      this.busy = false;
    }
  }
}
