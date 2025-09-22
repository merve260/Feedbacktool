import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  Firestore,
  collection,
  collectionData,
  query,
  where,
} from '@angular/fire/firestore';
import { Observable, map, shareReplay, firstValueFrom } from 'rxjs';
import { Survey } from '../../../../core/models/survey.models';
import { Timestamp } from 'firebase/firestore';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/auth/auth.service';
import {TranslateModule} from '@ngx-translate/core';

@Component({
  selector: 'app-results-analytics',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './results-analytics.component.html',
  styleUrls: ['./results-analytics.component.scss'],
})
export class ResultsAnalyticsComponent implements OnInit {
  private firestore = inject(Firestore);
  private router = inject(Router);
  private auth = inject(AuthService);

  surveys$!: Observable<Survey[]>;


  async ngOnInit() {
    const u = await firstValueFrom(this.auth.user$);
    if (!u) return;

    const surveysCol = collection(this.firestore, 'umfragen');
    const q = query(
      surveysCol,
      where('ownerId', '==', u.uid),
      where('status', 'in', ['published', 'closed'])
    );

    this.surveys$ = collectionData(q, { idField: 'id' }).pipe(
      map((docs: any[]) =>
        docs.map((doc) => ({
          ...doc,
          startAt: doc.startAt instanceof Timestamp ? doc.startAt.toDate() : doc.startAt,
          endAt: doc.endAt instanceof Timestamp ? doc.endAt.toDate() : doc.endAt,
          createdAt: doc.createdAt instanceof Timestamp ? doc.createdAt.toDate() : doc.createdAt,
          updatedAt: doc.updatedAt instanceof Timestamp ? doc.updatedAt.toDate() : doc.updatedAt,
        }))
      ),
      shareReplay(1)
    ) as Observable<Survey[]>;
  }

  openAnalytics(survey: Survey) {
    this.router.navigate(['/admin/ergebnisse', survey.id]);
  }

}
