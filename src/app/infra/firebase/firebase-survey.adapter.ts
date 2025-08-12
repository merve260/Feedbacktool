import { inject } from '@angular/core';
import { Firestore, collection, addDoc, doc, getDoc, getDocs, updateDoc } from '@angular/fire/firestore';
import { SurveyBackend } from '../../core/ports/survey-backend';
import { Survey, Question } from '../../core/models/survey.models';

export class FirebaseSurveyAdapter implements SurveyBackend {
  private db = inject(Firestore);
  private col = collection(this.db, 'surveys');

  async createDraft(s: Partial<Survey>): Promise<string> {
    const now = new Date();
    const ref = await addDoc(this.col, {
      ownerId: s.ownerId!, title: s.title ?? 'Neue Umfrage',
      status: 'draft', createdAt: now, updatedAt: now
    });
    return ref.id;
  }

  async getById(id: string): Promise<Survey> {
    const snap = await getDoc(doc(this.db, 'surveys', id));
    const d = snap.data() as any;
    return { id: snap.id, ...d, startAt: d?.startAt?.toDate?.() ?? d?.startAt, endAt: d?.endAt?.toDate?.() ?? d?.endAt };
  }

  async listByOwner(ownerId: string): Promise<Survey[]> {
    // basit: tümünü çekip filtrele (demo). Gerçekte query kullan.
    const snaps = await getDocs(this.col);
    return snaps.docs
      .map(s => ({ id: s.id, ...s.data() } as any))
      .filter(x => x.ownerId === ownerId)
      .map(x => ({ ...x, startAt: x.startAt?.toDate?.() ?? x.startAt, endAt: x.endAt?.toDate?.() ?? x.endAt })) as Survey[];
  }

  async addQuestion(surveyId: string, q: Question): Promise<void> {
    const qCol = collection(this.db, `surveys/${surveyId}/questions`);
    await addDoc(qCol, q);
  }

  async publish(surveyId: string, startAt: Date, endAt: Date): Promise<void> {
    await updateDoc(doc(this.db, 'surveys', surveyId), {
      status: 'published', startAt, endAt, updatedAt: new Date()
    } as any);
  }
}
