// src/app/infra/firebase/firebase-survey.adapter.ts
import {
  Firestore,
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  serverTimestamp,
  orderBy
} from '@angular/fire/firestore';
import { SurveyBackend } from '../../core/ports/survey-backend';
import { Survey, Question } from '../../core/models/survey.models';

export class FirebaseSurveyAdapter implements SurveyBackend {
  private surveysCol;

  constructor(private db: Firestore) {
    this.surveysCol = collection(this.db, 'surveys');
  }

  async createDraft(s: Partial<Survey>): Promise<string> {
    const ref = await addDoc(this.surveysCol, {
      ownerId: s.ownerId!,
      title: s.title ?? 'Neue Umfrage',
      status: 'draft',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return ref.id;
  }

  async getById(id: string): Promise<Survey> {
    const ref = doc(this.db, 'surveys', id);
    const snap = await getDoc(ref);
    if (!snap.exists()) throw new Error('Survey not found');

    const d = snap.data() as any;
    return {
      id: snap.id,
      ...d,
      startAt: d?.startAt?.toDate?.() ?? d?.startAt ?? null,
      endAt: d?.endAt?.toDate?.() ?? d?.endAt ?? null,
    } as Survey;
  }

  async listByOwner(ownerId: string): Promise<Survey[]> {
    const qy = query(this.surveysCol, where('ownerId', '==', ownerId));
    const snaps = await getDocs(qy);
    return snaps.docs.map((s) => {
      const d = s.data() as any;
      return {
        id: s.id,
        ...d,
        startAt: d?.startAt?.toDate?.() ?? d?.startAt ?? null,
        endAt: d?.endAt?.toDate?.() ?? d?.endAt ?? null,
      } as Survey;
    });
  }

  async addQuestion(surveyId: string, q: Question): Promise<void> {
    const qCol = collection(this.db, `surveys/${surveyId}/questions`);
    await addDoc(qCol, {
      ...q,
      createdAt: serverTimestamp(),
    });
  }

  async publish(surveyId: string, startAt: Date, endAt: Date): Promise<void> {
    const ref = doc(this.db, 'surveys', surveyId);
    await updateDoc(ref, {
      status: 'published',
      startAt,   // Date kabul edilir; okurken toDate? guard'ını zaten yaptık
      endAt,
      updatedAt: serverTimestamp(),
    } as any);
  }

  async submitResponse(
    surveyId: string,
    payload: { name?: string; answers: any[] }
  ): Promise<string> {
    const respCol = collection(this.db, `surveys/${surveyId}/responses`);
    const ref = await addDoc(respCol, {
      name: payload.name ?? null,
      answers: payload.answers ?? [],
      submittedAt: serverTimestamp(),
    });
    return ref.id;
  }

  async listQuestions(surveyId: string): Promise<Question[]> {
    const qCol = collection(this.db, `surveys/${surveyId}/questions`);
    const qy = query(qCol, orderBy('order', 'asc'));
    const snaps = await getDocs(qy);
    return snaps.docs.map(d => ({ id: d.id, ...(d.data() as any) })) as Question[];
  }


}
