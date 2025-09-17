// src/app/features/survey/surveys-dashboard/surveys-dashboard.component.ts

import {Component, inject, OnInit} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { take } from 'rxjs/operators';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../../../core/auth/auth.service';
import { getDoc } from '@angular/fire/firestore';

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
import {UmfrageLinkDialogComponent} from '../../../../shared/modals/umfragelink-modal/umfrage-link-dialog.component';

@Component({
  selector: 'app-surveys-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatMenuModule,
    MatIconModule,
    MatButtonModule
  ],
  templateUrl: './surveys-dashboard.component.html',
  styleUrls: ['./surveys-dashboard.component.scss'],
})
export class SurveysDashboardComponent implements OnInit{

  // Dienste: Firestore, Adapter, Auth, Router, Dialog
  private afs    = inject(Firestore);
  private fbSvc  = inject(FirebaseSurveyAdapter);
  public  auth   = inject(AuthService);
  private router = inject(Router);
  private dialog = inject(MatDialog);

  // Zustände für UI
  loading = true;
  private allItems: Array<Survey & { createdAt?: Date; updatedAt?: Date }> = [];
  items: Array<Survey & { createdAt?: Date; updatedAt?: Date }> = [];
  search = '';
  showStatusHinweis = true;
  sortDir: 'desc' | 'asc' = 'desc';
  displayName: string | null = null;

  // Initiales Laden aller Umfragen
  async ngOnInit(): Promise<void> {
    try {
      const u = await firstValueFrom(this.auth.user$.pipe(take(1)));
      if (!u) { this.loading = false; return; }
      this.displayName = u.displayName || u.email || 'Benutzer';
      const roleDoc = await getDoc(doc(this.afs, 'roles', u.uid));
      if (roleDoc.exists()) {
        const data: any = roleDoc.data();
        this.displayName = data.displayName || u.displayName || u.email;
      }
      const colRef = collection(this.afs, 'umfragen');
      let snap;
      try {
        snap = await getDocs(query(colRef, where('ownerId', '==', u.uid), orderBy('createdAt', 'desc')));
      } catch {
        snap = await getDocs(query(colRef, where('ownerId', '==', u.uid)));
      }

      const toDate = (x: any): Date | undefined => {
        if (!x) return undefined;
        if (x.toDate) return x.toDate();
        if (x instanceof Date) return x;
        return new Date(x);
      };

      const now = new Date();

      // Firestore-Daten mappen + abgelaufene Umfragen schließen
      this.allItems = await Promise.all(
        snap.docs.map(async d => {
          const data: any = d.data();
          const survey: Survey & { createdAt?: Date; updatedAt?: Date } = {
            id: d.id,
            ownerId: data.ownerId,
            title: data.title ?? '',
            description: data.description ?? undefined,
            startAt: toDate(data.startAt),
            endAt:   toDate(data.endAt),
            status:  data.status,
            createdAt: toDate(data.createdAt ?? null),
            updatedAt: toDate(data.updatedAt ?? null),
          };

          // Prüfen ob Umfrage abgelaufen ist
          if (survey.status === 'published' && survey.endAt && survey.endAt < now) {
            await this.fbSvc.setSurveyWithId(survey.id, { ...this.stripId(survey), status: 'closed' });
            survey.status = 'closed';
          }

          return survey;
        })
      );

      this.applyView();
    } finally {
      this.loading = false;
    }
  }

  // Filter und Sortierung anwenden
  applyView() {
    const q = this.search.trim().toLowerCase();
    let list = [...this.allItems];
    if (q) list = list.filter(x => (x.title || '').toLowerCase().includes(q));

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

  // CSS-Klassen für Status-Chips
  statusClass(s: Survey['status']) {
    return {
      draft:     'chip chip--draft',
      published: 'chip chip--pub',
      closed:    'chip chip--closed',
    }[s];
  }

  // Aktionen: Status ändern oder löschen
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

  // Navigation
  create() {
    this.router.navigateByUrl('/admin/builder');
  }
  openLinkDialog(survey: Survey) {
    this.dialog.open(UmfrageLinkDialogComponent, {
      width: '720px',
      data: { id: survey.id, endDate: survey.endAt ? survey.endAt.toISOString() : null }
    });
  }
  edit(s: Survey) {
    this.router.navigate(['/admin/umfragen', s.id, 'edit']);
  }

  getDisplayStatus(s: Survey): 'draft' | 'published' | 'closed' {
    const now = new Date();
    if (s.status === 'published' && s.endAt && s.endAt < now) {
      return 'closed';
    }
    return s.status;
  }

}
