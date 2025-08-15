// src/app/features/admin/quick-create/quick-create.component.ts
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/auth/auth.service';
import { FirebaseSurveyService } from '../../../core/services/firebase-survey.service';
import { take } from 'rxjs/operators';

@Component({
  standalone: true,
  imports: [CommonModule],
  template: `
    <div style="max-width:560px;margin:40px auto;padding:16px;border:1px dashed #cbbef5;border-radius:12px;background:#fff">
      <h2>⚡ QuickCreate (Geçici)</h2>
      <p>Tek tıkla: Taslak → 1 soru ekle → Yayınla (7 gün).</p>
      <button (click)="run()" style="padding:.6rem 1rem;border-radius:10px;background:#824CFF;color:#fff;font-weight:700;border:none">Oluştur & Yayınla</button>

      <div *ngIf="log.length" style="margin-top:14px;font-family:monospace;white-space:pre-wrap">
        <div *ngFor="let l of log">• {{l}}</div>
      </div>
    </div>
  `
})
export class QuickCreateComponent {
  private auth = inject(AuthService);
  private surveys = inject(FirebaseSurveyService);
  log: string[] = [];

  run() {
    this.log = [];
    this.auth.user$.pipe(take(1)).subscribe(async u => {
      if (!u) { this.log.push('Önce login ol (/admin).'); return; }
      try {
        this.log.push('1) Taslak oluşturuluyor...');
        const surveyId = await this.surveys.createSurvey({
          title: 'Hızlı Test Anketi',
          description: 'Bu bir hızlı testtir.',
          ownerId: u.uid,
          status: 'draft',
          startAt: new Date(),
          endAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        });

        this.log.push(`→ surveyId: ${surveyId}`);
        this.log.push('2) Soru ekleniyor...');
        await this.surveys.addQuestion(surveyId, {
          type: 'yesno',
          title: 'Uygulamayı beğendiniz mi?',
          text: 'Evet/Hayır',
          options: ['Ja', 'Nein'],

        });

        this.log.push('3) Yayın durumu: draft (şimdilik).');
        this.log.push('✅ Bitti. Viewer linki: /survey/' + surveyId);
      } catch (e:any) {
        this.log.push('Hata: ' + (e?.message || e));
      }
    });
  }
}
