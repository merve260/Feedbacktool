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
  @Input() canvasQuestions: any[] = [];
  @Input() surveyTitle: string = '';

  // ------ Outputs ------
  @Output() draftRequested = new EventEmitter<string>();
  @Output() publishRequested = new EventEmitter<string>();

  // ------ States ------
  busy = false;
  publishing = false;
  errorMsg = '';
  copied = false;
  linkVisible = false;
  surveyId: string | null = null;

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
      text: q.text ?? undefined,
      options: opts && opts.length ? opts : undefined,
      min: q.min ?? undefined,
      max: q.max ?? undefined,
      step: q.step ?? undefined,
      placeholderText: q.placeholderText ?? undefined,
      maxStars: q.maxStars ?? undefined,
      items: items && items.length ? items : undefined,
      startPlaceholder: q.startPlaceholder ?? undefined,
      endPlaceholder: q.endPlaceholder ?? undefined,
      thumbLabel: q.thumbLabel ?? undefined,
    } as Question;
  }

  // ------------------ Draft speichern ------------------
  async onDraft(): Promise<void> {
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
        startAt: this.startDate!,
        endAt: this.endDate!
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
