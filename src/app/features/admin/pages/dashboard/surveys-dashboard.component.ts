// src/app/features/survey/surveys-dashboard/surveys-dashboard.component.ts

import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { take } from 'rxjs/operators';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../../../core/auth/auth.service';

import {
  Firestore,
  collection,
  query,
  where,
  orderBy,
  getDocs,
  doc,
  deleteDoc
} from '@angular/fire/firestore';

import { Survey } from '../../../../core/models/survey.models';
import { FirebaseSurveyAdapter } from '../../../../infra/firebase/firebase-survey.adapter';

// Angular Material
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '../../../../shared/dialogs/confirm-dialog.component';
import { MatTooltip } from '@angular/material/tooltip';
import {UmfrageLinkDialogComponent} from '../../../../shared/modals/umfragelink-modal/umfrage-link-dialog.component';

@Component({
  selector: 'app-surveys-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatMenuModule,
    MatIconModule,
    MatButtonModule,
    MatTooltip
  ],
  templateUrl: './surveys-dashboard.component.html',
  styleUrls: ['./surveys-dashboard.component.scss'],
})
export class SurveysDashboardComponent {

  // =========================================================
  // Services injizieren (Firestore, Adapter, Auth, Router, Dialog)
  // =========================================================
  private afs    = inject(Firestore);
  private fbSvc  = inject(FirebaseSurveyAdapter);
  public  auth   = inject(AuthService);
  private router = inject(Router);
  private dialog = inject(MatDialog);

  // =========================================================
  // Zustände für UI
  // =========================================================
  loading = true;   // Ladeindikator

  // Alle geladenen Umfragen (Rohdaten)
  private allItems: Array<Survey & { createdAt?: Date; updatedAt?: Date }> = [];

  // Gefilterte + sortierte Umfragen für die Anzeige
  items: Array<Survey & { createdAt?: Date; updatedAt?: Date }> = [];

  // Suchtext für Filter
  search = '';

  showStatusHinweis = true;

  // Sortierrichtung: desc = neueste oben, asc = älteste oben
  sortDir: 'desc' | 'asc' = 'desc';

  // =========================================================
  // Lifecycle – Initiales Laden
  // =========================================================
  async ngOnInit(): Promise<void> {
    try {
      // 1) Aktuellen Benutzer laden
      const u = await firstValueFrom(this.auth.user$.pipe(take(1)));
      if (!u) {
        this.loading = false;
        return;
      }

      // 2) Firestore-Referenz holen (hier ohne Converter!)
      const colRef = collection(this.afs, 'umfragen');

      let snap;
      try {
        // Versuche mit Sortierung nach "createdAt"
        snap = await getDocs(
          query(colRef, where('ownerId', '==', u.uid), orderBy('createdAt', 'desc'))
        );
      } catch {
        // Fallback: nur Filter ohne orderBy
        snap = await getDocs(query(colRef, where('ownerId', '==', u.uid)));
      }

      // 3) Hilfsfunktion: Timestamp → Date umwandeln
      const toDate = (x: any): Date | undefined => {
        if (!x) return undefined;
        if (x.toDate) return x.toDate();     // Firestore Timestamp
        if (x instanceof Date) return x;     // Bereits Date
        return new Date(x);                  // String oder Zahl
      };

      // 4) Mapping: Firestore-Dokumente → Survey-Objekte
      this.allItems = snap.docs.map(d => {
        const data: any = d.data();
        return {
          id: d.id,
          ownerId: data.ownerId,
          title: data.title ?? '',
          description: data.description ?? undefined,
          startAt: toDate(data.startAt),
          endAt:   toDate(data.endAt),

          status:  data.status,
          createdAt: toDate(data.createdAt ?? null),
          updatedAt: toDate(data.updatedAt ?? null),
        } as Survey & { createdAt?: Date; updatedAt?: Date };
      });

      // 5) Erste Ansicht anwenden (Filter + Sortierung)
      this.applyView();

    } finally {
      this.loading = false;
    }
  }

  // =========================================================
  // Hilfsmethoden für Filter / Sortierung
  // =========================================================
  applyView() {
    const q = this.search.trim().toLowerCase();
    let list = [...this.allItems];

    // Filter: Titel durchsuchen
    if (q) list = list.filter(x => (x.title || '').toLowerCase().includes(q));

    // Sortierung: nach createdAt oder startAt
    const factor = this.sortDir === 'desc' ? -1 : 1;
    list.sort((a, b) => {
      const aVal = a.createdAt?.getTime?.() ?? a.startAt?.getTime?.() ?? 0;
      const bVal = b.createdAt?.getTime?.() ?? b.startAt?.getTime?.() ?? 0;
      return (aVal - bVal) * factor;
    });

    this.items = list;
  }

  toggleCreatedSort() {
    this.sortDir = this.sortDir === 'desc' ? 'asc' : 'desc';
    this.applyView();
  }

  clearSearch() {
    this.search = '';
    this.applyView();
  }

  // =========================================================
  // Status-Label CSS-Klassen
  // =========================================================
  statusClass(s: Survey['status']) {
    return {
      draft:     'chip chip--draft',
      published: 'chip chip--pub',
      closed:    'chip chip--closed',
    }[s];
  }

  // =========================================================
  // Aktionen (Publish / Unpublish / Close / Delete)
  // =========================================================
  private stripId(s: Survey): Omit<Survey, 'id'> {
    const { id, ...rest } = s;
    return rest;
  }

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

  async remove(s: Survey) {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      disableClose: true,
      data: {
        message: `"${s.title}" wirklich löschen?`,
        confirmText: 'Löschen',
        cancelText: 'Abbrechen'
      }
    });

    ref.afterClosed().subscribe(async result => {
      if (result) {
        await deleteDoc(doc(this.afs, 'umfragen', s.id));
        this.allItems = this.allItems.filter(x => x.id !== s.id);
        this.applyView();
      }
    });
  }

  // =========================================================
  // Navigation
  // =========================================================
  create() {
    this.router.navigateByUrl('/admin/builder');
  }
  openLinkDialog(survey: Survey) {
    this.dialog.open(UmfrageLinkDialogComponent, {
      width: '720px',
      data: {
        id: survey.id,
        endDate: survey.endAt ? survey.endAt.toISOString() : null
      }
    });
  }

  edit(s: Survey) {
    this.router.navigate(['/admin/umfragen', s.id, 'edit']);
  }


}
