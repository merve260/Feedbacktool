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
  deleteDoc,
  addDoc,
  CollectionReference,
  DocumentReference
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

  // default koleksiyon adları
  private readonly rootColName = 'umfragen';
  private readonly subColName  = 'fragen';

  constructor(private firestore: Firestore) {}

  // Lazy referans yardımcıları
  private surveysCol() {
    return collection(this.firestore, this.rootColName);
  }
  private questionsCol(surveyId: string) {
    return collection(this.firestore, `${this.rootColName}/${surveyId}/${this.subColName}`);
  }
  private responsesCol(surveyId: string) {
    return collection(this.firestore, `${this.rootColName}/${surveyId}/responses`);
  }

  async createDraft(s: Partial<Survey>): Promise<string> {
    if (!s.ownerId) throw new Error('ownerId required');

    const ref = doc(this.surveysCol());
    await setDoc(ref, {
      ownerId: s.ownerId,
      title: s.title ?? 'Neue Umfrage',
      status: 'draft',
      description: s.description,
      startAt: s.startAt ? Timestamp.fromDate(s.startAt as Date) : undefined,
      endAt:   s.endAt   ? Timestamp.fromDate(s.endAt as Date)   : undefined,

      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    } as any);

    return ref.id;
  }

  async getById(id: string): Promise<Survey | null> {
    const ref = doc(this.firestore, this.rootColName, id);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;

    const d = snap.data() as any;
    return {
      id: snap.id,
      ownerId: d.ownerId,
      title: d.title,
      description: d.description ?? undefined,
      status: d.status,
      startAt: d?.startAt?.toDate?.(),
      endAt:   d?.endAt?.toDate?.(),

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
        startAt: d?.startAt?.toDate?.(),
        endAt:   d?.endAt?.toDate?.(),

      } as Survey;
    });
  }

  async addQuestion(surveyId: string, q: Question): Promise<string> {
    const options =
      Array.isArray(q.options) && q.options.length ? q.options : undefined;
    const items =
      Array.isArray((q as any).items) && (q as any).items.length
        ? (q as any).items
        : undefined;

    const payload = omitUndefined({
      type: q.type,
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
    const ref = doc(this.firestore, this.rootColName, surveyId);
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

  async updateSurveyWithQuestions(
    surveyId: string,
    s: Omit<Survey, 'id'>,
    questions: Array<Omit<Question, 'id'> & { id?: string }>
  ): Promise<void> {
    console.log('Update fertig');
    const qCol = this.questionsCol(surveyId);

    // 1. Survey update
    const surveyRef = doc(this.firestore, this.rootColName, surveyId);
    await setDoc(surveyRef, omitUndefined({
      ...s,
      updatedAt: serverTimestamp(),
    }), { merge: true });

    // 2. Eski soruları oku
    const existing = await getDocs(qCol);
    const existingIds = new Set(existing.docs.map(d => d.id));

    const keptIds = new Set<string>();

    // 3. Yeni soruları ekle/güncelle
    for (const q of questions) {
      if (q.id) {
        // update
        const { id, ...rest } = q;
        const qRef = doc(this.firestore, `${this.rootColName}/${surveyId}/${this.subColName}/${id}`);
        await setDoc(qRef, omitUndefined(rest), { merge: true });
        keptIds.add(id);
      } else {
        // create
        const { id, ...rest } = q;
        const qRef = doc(qCol);
        await setDoc(qRef, omitUndefined(rest));
        keptIds.add(qRef.id);
      }
    }

    // 4. Artık olmayan soruları sil
    for (const oldId of existingIds) {
      if (!keptIds.has(oldId)) {
        await deleteDoc(doc(this.firestore, `${this.rootColName}/${surveyId}/${this.subColName}/${oldId}`));
      }
    }
  }

  async listQuestions(surveyId: string): Promise<Question[]> {
    const qy = query(this.questionsCol(surveyId), orderBy('order', 'asc'));
    const snaps = await getDocs(qy);
    return snaps.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as Question[];
  }
}
