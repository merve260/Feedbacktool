import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { take } from 'rxjs/operators';
import { firstValueFrom } from 'rxjs';

import { AuthService } from '../../../../core/auth/auth.service';
import { FirebaseSurveyService } from '../../../../core/services/firebase-survey.service';

import { Firestore, collection, query, where, orderBy, getDocs, doc, deleteDoc } from '@angular/fire/firestore';
import { Survey, Question } from '../../../../core/models/survey.models';

@Component({
  selector: 'app-surveys-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './surveys-dashboard.component.html',
  styleUrls: ['./surveys-dashboard.component.scss'],
})
export class SurveysDashboardComponent {
  // Dienste injizieren
  private afs    = inject(Firestore);
  public  auth   = inject(AuthService);               // template’te de kullanılacaksa public bırak
  private fbSvc  = inject(FirebaseSurveyService);
  private router = inject(Router);

  // UI-State
  loading = true;
  items: Survey[] = [];

  // ---------------------------------------
  // Daten laden (nur Umfragen des angemeldeten Users)
  // ---------------------------------------
  async ngOnInit(): Promise<void> {
    try {
      const u = await firstValueFrom(this.auth.user$.pipe(take(1)));
      if (!u) { this.loading = false; return; }

      const col = collection(this.afs, 'umfragen');
      const qy  = query(
        col,
        where('ownerId', '==', u.uid),
        // Hinweis: Für ownerId+beginn kann Firestore ggf. einen Index verlangen
        orderBy('beginn', 'desc')
      );

      const snap = await getDocs(qy);

      this.items = snap.docs.map(d => {
        const data: any = d.data();
        return {
          id: d.id,
          ownerId: data.ownerId,
          title: data.titel,
          description: data.beschreibung ?? undefined,
          startAt: data.beginn?.toDate?.() ?? undefined,
          endAt:   data.ende?.toDate?.()   ?? undefined,
          status:  data.status,
        } as Survey;
      });
    } finally {
      this.loading = false;
    }
  }

  // Status-Chip Klassen (einfaches Mapping)
  statusClass(s: Survey['status']) {
    return {
      draft:     'chip chip--draft',
      published: 'chip chip--pub',
      closed:    'chip chip--closed',
    }[s];
  }

  // Hilfsfunktion: Survey ohne id (für setSurveyWithId)
  private stripId(s: Survey): Omit<Survey, 'id'> {
    const { id, ...rest } = s;
    return rest;
  }

  // ---------------------------------------
  // Aktionen: veröffentlichen / zurückziehen / schließen
  // ---------------------------------------
  async publish(s: Survey) {
    await this.fbSvc.setSurveyWithId(s.id, { ...this.stripId(s), status: 'published' });
    s.status = 'published';
  }

  async unpublish(s: Survey) {
    await this.fbSvc.setSurveyWithId(s.id, { ...this.stripId(s), status: 'draft' });
    s.status = 'draft';
  }

  async close(s: Survey) {
    await this.fbSvc.setSurveyWithId(s.id, { ...this.stripId(s), status: 'closed' });
    s.status = 'closed';
  }

  // Kopieren: Umfrage + Fragen duplizieren (Status = Entwurf)
  async duplicate(s: Survey) {
    const qs = await this.fbSvc.getQuestions(s.id);

    const payload: Omit<Question, 'id'>[] = qs.map(q => {
      const { id, ...rest } = q as any;
      return rest as Omit<Question, 'id'>;
    });

    await this.fbSvc.createSurveyWithQuestions(
      { ...this.stripId(s), title: `${s.title} (Kopie)`, status: 'draft' },
      payload
    );

    // Liste neu laden
    await this.ngOnInit();
  }

  // Löschen (mit einfacher Bestätigung)
  async remove(s: Survey) {
    if (!confirm(`„${s.title}“ wirklich löschen?`)) return;
    await deleteDoc(doc(this.afs, 'umfragen', s.id));
    this.items = this.items.filter(x => x.id !== s.id);
  }

  // Navigationen
  create()      { this.router.navigateByUrl('/admin/builder'); }
  edit(_s: Survey) { this.router.navigateByUrl('/admin/builder'); } // (optional: /admin/builder?id=ID)
}
