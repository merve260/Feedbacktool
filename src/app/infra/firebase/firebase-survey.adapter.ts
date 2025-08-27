// src/app/infra/firebase/firebase-survey.adapter.ts
import { Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
  CollectionReference,
  DocumentReference,
  writeBatch,
  updateDoc,
} from '@angular/fire/firestore';

import { SurveyBackend } from '../../core/ports/survey-backend';
import { Survey, Question, SurveyStatus } from '../../core/models/survey.models';
import { FirestoreDataConverter, WithFieldValue } from 'firebase/firestore';

/** Entfernt alle `undefined`-Felder → Firestore akzeptiert das nicht */
function omitUndefined<T extends object>(obj: T): Partial<T> {
  const out: Partial<T> = {};
  (Object.entries(obj) as [keyof T, any][])
    .forEach(([k, v]) => { if (v !== undefined) (out as any)[k] = v; });
  return out;
}

/** Hilfsfunktion: Egal ob Date, Firestore Timestamp oder String → immer Date */
function toDateSafe(v: any): Date | undefined {
  if (!v) return undefined;
  if (v instanceof Date) return v;
  if (v instanceof Timestamp) return v.toDate();
  if (typeof v === 'string') {
    const parsed = new Date(v);
    return isNaN(parsed.getTime()) ? undefined : parsed;
  }
  return undefined;
}

/** Bereitet Survey-Daten für Firestore vor */
function prepareSurveyData(
  s: Partial<Survey>,
  statusOverride?: SurveyStatus
): WithFieldValue<Survey> {
  const sDate = toDateSafe(s.startAt);
  const eDate = toDateSafe(s.endAt);

  return omitUndefined({
    ownerId: s.ownerId,
    title: s.title,
    description: s.description ?? null,
    status: (statusOverride ?? s.status ?? 'draft') as SurveyStatus,

    startAt: sDate ? Timestamp.fromDate(sDate) : null,
    endAt:   eDate ? Timestamp.fromDate(eDate) : null,

    createdAt: (s as any).createdAt ?? serverTimestamp(),
    updatedAt: serverTimestamp(),
  }) as WithFieldValue<Survey>;
}

@Injectable({ providedIn: 'root' })
export class FirebaseSurveyAdapter implements SurveyBackend {
  private readonly rootColName = 'umfragen';
  private readonly subColName = 'fragen';
  private readonly responsesSubCol = 'antworten';

  constructor(private firestore: Firestore) {}

  // -----------------------------------------------------
  // Converter – sorgt für Typ-Sicherheit bei Firestore
  // -----------------------------------------------------
  private surveyConverter: FirestoreDataConverter<Survey> = {
    toFirestore(s: Survey) {
      return prepareSurveyData(s);
    },
    fromFirestore(snapshot) {
      const d: any = snapshot.data();
      return {
        id: snapshot.id,
        ownerId: d.ownerId,
        title: d.title,
        description: d.description ?? null,
        startAt: d.startAt ? (d.startAt as Timestamp).toDate() : undefined,
        endAt: d.endAt ? (d.endAt as Timestamp).toDate() : undefined,
        status: d.status as SurveyStatus,
        createdAt: d.createdAt?.toDate?.(),
        updatedAt: d.updatedAt?.toDate?.(),
      };
    },
  };

  private questionConverter: FirestoreDataConverter<Question> = {
    toFirestore(q: Question) {
      return omitUndefined({
        id: q.id,
        type: q.type,
        title: q.title,
        text: q.text ?? null,
        options: q.options ?? null,
        min: q.min ?? null,
        max: q.max ?? null,
        step: q.step ?? null,
        thumbLabel: q.thumbLabel ?? null,
        placeholderText: q.placeholderText ?? null,
        maxStars: q.maxStars ?? null,
        order: (q as any).order ?? null,
        createdAt: (q as any).createdAt ?? serverTimestamp(),
        updatedAt: serverTimestamp(),
      }) as any;
    },
    fromFirestore(snapshot) {
      const d: any = snapshot.data();
      return {
        id: d.id ?? snapshot.id,
        type: d.type,
        title: d.title,
        text: d.text ?? undefined,
        options: d.options ?? undefined,
        min: d.min ?? undefined,
        max: d.max ?? undefined,
        step: d.step ?? undefined,
        thumbLabel: d.thumbLabel ?? undefined,
        placeholderText: d.placeholderText ?? undefined,
        maxStars: d.maxStars ?? undefined,
        order: d.order ?? undefined,
        createdAt: d.createdAt?.toDate?.(),
        updatedAt: d.updatedAt?.toDate?.(),
      };
    },
  };


  // -----------------------------------------------------
  // Referenzen
  // -----------------------------------------------------
  private surveysCol(): CollectionReference<Survey> {
    return collection(this.firestore, this.rootColName).withConverter(this.surveyConverter);
  }
  private surveyDoc(id: string): DocumentReference<Survey> {
    return doc(this.firestore, this.rootColName, id).withConverter(this.surveyConverter);
  }
  private questionsCol(surveyId: string): CollectionReference<Question> {
    return collection(this.firestore, this.rootColName, surveyId, this.subColName)
      .withConverter(this.questionConverter);
  }
  private questionDoc(surveyId: string, qId: string): DocumentReference<Question> {
    return doc(this.firestore, this.rootColName, surveyId, this.subColName, qId)
      .withConverter(this.questionConverter);
  }

  // -----------------------------------------------------
  // Methoden (Survey)
  // -----------------------------------------------------
  async createDraft(s: Partial<Survey>): Promise<string> {
    const ref = doc(this.surveysCol());
    await setDoc(ref, prepareSurveyData(s, 'draft'));
    return ref.id;
  }

  async getById(id: string): Promise<Survey | null> {
    const snap = await getDoc(this.surveyDoc(id));
    return snap.exists() ? snap.data()! : null;
  }

  async listByOwner(ownerId: string): Promise<Survey[]> {
    const qy = query(this.surveysCol(), where('ownerId', '==', ownerId));
    const snaps = await getDocs(qy);
    return snaps.docs.map(s => s.data());
  }

  async publish(surveyId: string, startAt: Date, endAt: Date): Promise<void> {
    await setDoc(
      this.surveyDoc(surveyId),
      prepareSurveyData({ startAt, endAt }, 'published'),
      { merge: true }
    );
  }

  async updateSurveyWithQuestions(
    surveyId: string,
    survey: Omit<Survey, 'id'>,
    questions: Array<Omit<Question, 'id'> & { id?: string }>
  ): Promise<void> {
    const batch = writeBatch(this.firestore as any);

    batch.set(this.surveyDoc(surveyId), prepareSurveyData(survey), { merge: true });

    const existingSnap = await getDocs(this.questionsCol(surveyId));
    const existingIds = new Set(existingSnap.docs.map(d => d.id));
    const keptIds = new Set<string>();

    for (const q of questions) {
      const qRef = q.id ? this.questionDoc(surveyId, q.id) : doc(this.questionsCol(surveyId));
      batch.set(qRef, { ...q, id: qRef.id } as any);
      keptIds.add(qRef.id);
    }

    for (const oldId of existingIds) {
      if (!keptIds.has(oldId)) {
        batch.delete(this.questionDoc(surveyId, oldId));
      }
    }

    await batch.commit();
  }

  async getSurveyWithQuestions(
    id: string
  ): Promise<{ survey: Survey; questions: Question[] } | null> {
    const surveySnap = await getDoc(this.surveyDoc(id));
    if (!surveySnap.exists()) return null;

    const survey = surveySnap.data() as Survey;
    const qSnap = await getDocs(collection(this.firestore, this.rootColName, id, this.subColName));
    const questions = qSnap.docs.map(d => d.data() as Question);

    return { survey: { ...survey, id }, questions };
  }

  async createSurveyWithQuestions(
    survey: Omit<Survey, 'id'>,
    questions: Omit<Question, 'id'>[]
  ): Promise<string> {
    const surveyRef = doc(collection(this.firestore, this.rootColName));
    await setDoc(surveyRef, prepareSurveyData(survey));

    const batch = writeBatch(this.firestore);
    for (const q of questions) {
      const qRef = doc(collection(this.firestore, this.rootColName, surveyRef.id, this.subColName));
      batch.set(qRef, { ...q, id: qRef.id } as any);
    }
    await batch.commit();

    return surveyRef.id;
  }

  async deleteSurvey(id: string): Promise<void> {
    const surveyRef = this.surveyDoc(id);
    const qSnap = await getDocs(this.questionsCol(id));
    const batch = writeBatch(this.firestore);

    qSnap.forEach(qDoc => batch.delete(qDoc.ref));
    batch.delete(surveyRef);

    await batch.commit();
  }

  async setSurveyWithId(id: string, s: Partial<Survey>): Promise<void> {
    await setDoc(this.surveyDoc(id), prepareSurveyData(s), { merge: true });
    await updateDoc(this.surveyDoc(id), { updatedAt: serverTimestamp() } as any);
  }

  // -----------------------------------------------------
  // Methoden (Questions)
  // -----------------------------------------------------
  async addQuestion(surveyId: string, q: Question): Promise<string> {
    const qRef = doc(this.questionsCol(surveyId));
    await setDoc(
      qRef,
      omitUndefined({
        ...q,
        id: qRef.id,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }) as WithFieldValue<Question>
    );
    return qRef.id;
  }

  async listQuestions(surveyId: string): Promise<Question[]> {
    const snaps = await getDocs(query(this.questionsCol(surveyId), orderBy('order', 'asc')));
    return snaps.docs.map(d => d.data());
  }

  // -----------------------------------------------------
  // Methoden (Responses)
  // -----------------------------------------------------
  async submitResponse(
    surveyId: string,
    payload: { name?: string; answers: any[] }
  ): Promise<void> {
    const respRef = doc(
      collection(this.firestore, this.rootColName, surveyId, this.responsesSubCol)
    );
    await setDoc(respRef, { ...payload, createdAt: serverTimestamp() });
  }
}
