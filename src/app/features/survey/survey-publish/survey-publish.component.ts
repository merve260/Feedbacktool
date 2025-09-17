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

  // Eingabewerte vom Eltern-Component
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
  @Input() logoUrl: string | null = null;


  // Ausgaben für Eltern-Component
  @Output() draftRequested = new EventEmitter<string>();
  @Output() publishRequested = new EventEmitter<string>();
  @Output() questionsChange = new EventEmitter<Question[]>();

  // Zustände
  busy = false;          // blockiert, wenn Speichern/Veröffentlichen läuft
  publishing = false;    // ob aktuell Veröffentlichen läuft
  errorMsg = '';         // Fehlermeldungen
  copied = false;        // ob Link kopiert wurde
  linkVisible = false;   // soll der Teilnehmer-Link angezeigt werden
  surveyId: string | null = null;

  // Services
  private surveyService = inject(SurveyService);
  private auth = inject(AuthService);

  // Hilfsmethode: Datum normalisieren (auf Tagesanfang setzen)
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

  // Validierungen für Zeiträume
  get startInPast(): boolean {
    const s = this.startOfDay(this.startDate);
    return !!(s && s < this.today);
  }

  get endBeforeStart(): boolean {
    const s = this.startOfDay(this.startDate);
    const e = this.startOfDay(this.endDate);
    return !!(s && e && e < s);
  }

  // Überprüfung, ob Titel, Zeitraum und Fragen vorhanden sind
  isReady(): boolean {
    const hasTitle = !!this.surveyTitle?.trim();
    const hasDates = !!this.startDate && !!this.endDate;
    const hasQuestions = this.canvasQuestions?.length > 0;
    return hasTitle && hasDates && hasQuestions && !this.startInPast && !this.endBeforeStart;
  }

  // Teilnehmer-Link erzeugen
  getSurveyLink(): string {
    if (!this.surveyId) return '#';
    return `${window.location.origin}/survey/${this.surveyId}`;
  }

  // Link in Zwischenablage kopieren
  copyLinkToClipboard(): void {
    const link = this.getSurveyLink();
    if (!this.surveyId || link === '#') return;

    navigator.clipboard.writeText(link).then(() => {
      this.copied = true;
      setTimeout(() => (this.copied = false), 2000);
    });
  }

  // Direkt im neuen Tab öffnen
  goToViewer(): void {
    if (!this.surveyId) return;
    window.open(`/survey/${this.surveyId}`, '_blank');
  }

  // Frage normalisieren (Mapping in einheitliches Schema)
  private mapToQuestion(q: any, index: number): Question {
    const opts = Array.isArray(q.options) ? q.options.filter((x: any) => x != null) : undefined;

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
      thumbLabel: q.thumbLabel ?? null,
    } as Question;
  }

  // Entwurf speichern
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
        description: this.surveySubDescription || null,
        startAt: this.startDate ? new Date(this.startDate) : undefined,
        endAt:   this.endDate ? new Date(this.endDate) : undefined,
        logoUrl: this.logoUrl ?? null
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

  // Umfrage veröffentlichen
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

      // Umfrage anlegen
      const id = await this.surveyService.createDraft({
        ownerId: u.uid,
        title: this.surveyTitle.trim(),
        description: this.surveySubDescription || null,
        startAt: this.startDate!,
        endAt: this.endDate!,
        logoUrl: this.logoUrl ?? null
      });

      this.surveyId = id;

      const writes = this.canvasQuestions.map((q, i) =>
        this.surveyService.addQuestion(id, this.mapToQuestion(q, i))
      );
      await Promise.all(writes);

      // Status auf "published" setzen
      await this.surveyService.publish(id, this.startDate!, this.endDate!);

      this.linkVisible = true;
      this.publishRequested.emit(id);

      // Automatisch nach unten scrollen, damit der Link sichtbar wird
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
