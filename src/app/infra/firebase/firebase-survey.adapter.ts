// src/app/features/survey/survey-publish/firebase-survey.adapter.ts
import { Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
} from '@angular/fire/firestore';
import { SurveyBackend } from '../../core/ports/survey-backend';
import { Survey, Question } from '../../core/models/survey.models';


// undefined alanları payload'dan çıkarır
function omitUndefined<T extends object>(obj: T): Partial<T> {
  const out: Partial<T> = {};
  (Object.entries(obj) as [keyof T, any][])
    .forEach(([k, v]) => {
      if (v !== undefined) (out as any)[k] = v;
    });
  return out;
}


@Injectable({ providedIn: 'root' })
export class FirebaseSurveyAdapter implements SurveyBackend {
  constructor(private db: Firestore) {}

  // Lazy referans yardımcıları (constructor'da collection tutmuyoruz)
  private surveysCol() {
    return collection(this.db, 'umfragen');
  }
  private questionsCol(surveyId: string) {
    return collection(this.db, `umfragen/${surveyId}/fragen`);
  }
  private responsesCol(surveyId: string) {
    return collection(this.db, `umfragen/${surveyId}/responses`);
  }

  async createDraft(s: Partial<Survey>): Promise<string> {
    if (!s.ownerId) throw new Error('ownerId required');

    const ref = doc(this.surveysCol());
    await setDoc(ref, {
      ownerId: s.ownerId,
      title: s.title ?? 'Neue Umfrage',
      description: s.description ?? null,
      status: 'draft',
      startAt: s.startAt ? Timestamp.fromDate(s.startAt as Date) : null,
      endAt:   s.endAt   ? Timestamp.fromDate(s.endAt as Date)   : null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    } as any);

    return ref.id;
  }

  async getById(id: string): Promise<Survey | null> {
    const ref = doc(this.db, 'umfragen', id);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;

    const d = snap.data() as any;
    return {
      id: snap.id,
      ownerId: d.ownerId,
      title: d.title,
      description: d.description ?? undefined,
      status: d.status,
      startAt: d?.startAt?.toDate?.() ?? d?.startAt ?? null,
      endAt: d?.endAt?.toDate?.() ?? d?.endAt ?? null,
    } as Survey;
  }

  async listByOwner(ownerId: string): Promise<Survey[]> {
    const qy = query(this.surveysCol(), where('ownerId', '==', ownerId));
    const snaps = await getDocs(qy);
    return snaps.docs.map((s) => {
      const d = s.data() as any;
      return {
        id: s.id,
        ownerId: d.ownerId,
        title: d.title,
        description: d.description ?? undefined,
        status: d.status,
        startAt: d?.startAt?.toDate?.() ?? d?.startAt ?? null,
        endAt: d?.endAt?.toDate?.() ?? d?.endAt ?? null,
      } as Survey;
    });
  }

  async addQuestion(surveyId: string, q: Question): Promise<string> {
    // Diziler boşsa yazmıyoruz; undefined'lar tamamen atılıyor
    const options =
      Array.isArray(q.options) && q.options.length ? q.options : undefined;
    const items =
      Array.isArray((q as any).items) && (q as any).items.length
        ? (q as any).items
        : undefined;

    const payload = omitUndefined({
      // id asla yazma
      type: (q as any).type ?? (q as any)['typ'] ?? q['type'],
      title: q.title,
      text: q.text,
      options,
      min: q.min,
      max: q.max,
      step: q.step,
      placeholderText: (q as any).placeholderText,
      maxStars: (q as any).maxStars,
      items,
      startPlaceholder: (q as any).startPlaceholder,
      endPlaceholder: (q as any).endPlaceholder,
      thumbLabel: (q as any).thumbLabel,
      order: (q as any)?.order ?? Date.now(),
      createdAt: serverTimestamp(),
    });

    const qRef = doc(this.questionsCol(surveyId));
    await setDoc(qRef, payload as any);
    return qRef.id;
  }

  async publish(surveyId: string, start: Date, end: Date): Promise<void> {
    const ref = doc(this.db, 'umfragen', surveyId);
    await updateDoc(ref, {
      status: 'published',
      startAt: Timestamp.fromDate(start),
      endAt:   Timestamp.fromDate(end),
      updatedAt: serverTimestamp(),
    } as any);
  }

  async submitResponse(
    surveyId: string,
    payload: { name?: string; answers: any[] }
  ): Promise<void> {
    const rRef = doc(this.responsesCol(surveyId));
    await setDoc(rRef, {
      name: payload.name ?? null,
      answers: payload.answers ?? [],
      submittedAt: serverTimestamp(),
    } as any);
  }

  async listQuestions(surveyId: string): Promise<Question[]> {
    const qy = query(this.questionsCol(surveyId), orderBy('order', 'asc'));
    const snaps = await getDocs(qy);
    return snaps.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as Question[];
  }
}
