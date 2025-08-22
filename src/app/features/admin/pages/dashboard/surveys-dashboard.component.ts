import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { take } from 'rxjs/operators';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../../../core/auth/auth.service';
import { Firestore, collection, query, where, orderBy, getDocs, doc, deleteDoc } from '@angular/fire/firestore';
import { Survey } from '../../../../core/models/survey.models';
import {FirebaseSurveyAdapter} from '../../../../infra/firebase/firebase-survey.adapter'
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '../../../../shared/dialogs/confirm-dialog.component';
import { MatTooltip } from '@angular/material/tooltip';

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
  private afs    = inject(Firestore);
  private fbSvc= inject(FirebaseSurveyAdapter);
  public  auth   = inject(AuthService);
  private router = inject(Router);
  private dialog = inject(MatDialog);

  loading = true;

  /** tüm kayıtlar (ham veri) */
  private allItems: Array<Survey & { createdAt?: Date; updatedAt?: Date }> = [];

  /** görüntülenen (filtre + sort sonrası) */
  items: Array<Survey & { createdAt?: Date; updatedAt?: Date }> = [];

  /** arama metni */
  search = '';

  /** sıralama yönü: yeni→eski = 'desc', eski→yeni = 'asc' */
  sortDir: 'desc' | 'asc' = 'desc';

  async ngOnInit(): Promise<void> {
    try {
      const u = await firstValueFrom(this.auth.user$.pipe(take(1)));
      if (!u) {
        this.loading = false;
        return;
      }

      const colRef = collection(this.afs, 'umfragen');
      const qy = query(colRef, where('ownerId', '==', u.uid), orderBy('startAt', 'desc') as any);

      let snap;
      try {
        snap = await getDocs(qy);
      } catch {
        // Eğer orderBy çalışmazsa sadece where ile çek
        snap = await getDocs(query(colRef, where('ownerId', '==', u.uid)));
      }

      const toDate = (x: any): Date | undefined =>
        x?.toDate?.() ? x.toDate() : (x ?? undefined);

      this.allItems = snap.docs.map(d => {
        const data: any = d.data();
        return {
          id: d.id,
          ownerId: data.ownerId,
          title: data.title ?? '',
          description: data.description ?? undefined,
          startAt: toDate(data.startAt ?? null),
          endAt:   toDate(data.endAt   ?? null),
          status:  data.status,
          createdAt: toDate(data.createdAt ?? null),
          updatedAt: toDate(data.updatedAt ?? null),
        } as Survey & { createdAt?: Date; updatedAt?: Date };
      });

      this.applyView(); // ilk görünüm uygula
    } finally {
      this.loading = false;
    }
  }

  /** Filtre + sıralamayı uygula */
  applyView() {
    const q = this.search.trim().toLowerCase();
    let list = [...this.allItems];

    if (q) list = list.filter(x => (x.title || '').toLowerCase().includes(q));

    const factor = this.sortDir === 'desc' ? -1 : 1; // desc: yeni üstte
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

  statusClass(s: Survey['status']) {
    return {
      draft:     'chip chip--draft',
      published: 'chip chip--pub',
      closed:    'chip chip--closed',
    }[s];
  }

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

  /** Neue Umfrage anlegen */
  create() {
    this.router.navigateByUrl('/admin/builder');
  }

  /** Vorhandene Umfrage bearbeiten */
  edit(s: Survey) {
    this.router.navigate(['/admin/umfragen', s.id, 'edit']);
  }
}
