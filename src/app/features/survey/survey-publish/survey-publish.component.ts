import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterModule } from '@angular/router';

import { SurveyService } from '../../../core/services/survey.service';
import { Question } from '../../../core/models/survey.models';

@Component({
  selector: 'app-survey-publish',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatTooltipModule, RouterModule],
  templateUrl: './survey-publish.component.html',
  styleUrls: ['./survey-publish.component.scss']
})
export class SurveyPublishComponent {
  @Input() startDate: Date | null = null;
  @Input() endDate: Date | null = null;
  @Input() canvasQuestions: any[] = [];
  @Input() surveyTitle: string = '';

  // 🔹 Yayınlama durumu / hata / id
  publishing = false;
  errorMsg = '';
  copied = false;
  surveyId: string | null = null;   // << Date.now yerine gerçek Firestore id
  linkVisible = false;

  constructor(private surveyService: SurveyService) {}

  // ---------- Yardımcılar ----------
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

  // 🔹 Link’i bulunduğun ortama göre üret (lokalde de çalışır)
  getSurveyLink(): string {
    if (!this.surveyId) return '#';
    const base = window.location.origin; // örn: http://localhost:4200 veya prod domain
    return `${base}/survey/${this.surveyId}`;
  }

  // 🔹 Yayına hazır mı?
  isReady(): boolean {
    const hasDates = !!this.startDate && !!this.endDate;
    const hasQuestions = this.canvasQuestions.length > 0;
    const hasTitle = !!this.surveyTitle?.trim();
    return hasTitle && hasDates && hasQuestions && !this.startInPast && !this.endBeforeStart;
  }

  // Canvas öğesini Question modeline map’le
  private mapToQuestion(q: any, index: number): Question {
    return {
      type: q.type,
      title: q.title || q.label || `Frage ${index + 1}`,
      text: q.text ?? '',
      order: index,
      // tip-özel alanlar
      options: q.options ?? null,
      min: q.min ?? null,
      max: q.max ?? null,
      step: q.step ?? null,
      required: q.required ?? false
    } as unknown as Question;
  }

  // ---------- Ana iş: Tek tıkla oluştur + soruları yaz + publish ----------
  async publishSurvey(): Promise<void> {
    if (!this.isReady()) return;

    this.errorMsg = '';
    this.publishing = true;
    this.linkVisible = false;
    this.surveyId = null;

    try {
      const title = this.surveyTitle.trim();

      // 1) surveys/{id} oluştur (taslak adını “arka planda” biz atıyoruz)
      const id = await this.surveyService.createDraft({
        ownerId: 'test-user', // TODO: gerçek uid ile değiştirilecektir
        title
      });
      this.surveyId = id;

      // 2) questions ekle
      const writes = this.canvasQuestions.map((q: any, i: number) =>
        this.surveyService.addQuestion(id, this.mapToQuestion(q, i))
      );
      await Promise.all(writes);

      // 3) publish (tarih + status)
      await this.surveyService.publish(id, this.startDate!, this.endDate!);

      // 4) Linki göster
      this.linkVisible = true;

      // Kaydır
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
    }
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
}
