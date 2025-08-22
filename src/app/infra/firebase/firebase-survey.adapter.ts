// src/app/infra/firebase/firebase-survey.adapter.ts
import { Injectable } from '@angular/core';
import {
  Firestore, collection, doc, setDoc, getDoc, getDocs,
  query, where, orderBy, serverTimestamp,
  Timestamp, CollectionReference, DocumentReference, writeBatch, updateDoc
} from '@angular/fire/firestore';
import { SurveyBackend } from '../../core/ports/survey-backend';
import { Survey, Question } from '../../core/models/survey.models';
import { FirestoreDataConverter,WithFieldValue } from 'firebase/firestore';



function omitUndefined<T extends object>(obj: T): Partial<T> {
  const out: Partial<T> = {};
  (Object.entries(obj) as [keyof T, any][])
    .forEach(([k, v]) => { if (v !== undefined) (out as any)[k] = v; });
  return out;
}

@Injectable({ providedIn: 'root' })
export class FirebaseSurveyAdapter implements SurveyBackend {

  private readonly rootColName = 'umfragen';
  private readonly subColName  = 'fragen';
  private readonly responsesSubCol = 'antworten';

  constructor(private firestore: Firestore) {}

  // ======================================================
  // Converter: Domain-Objekte <-> Firestore
  // ======================================================
  private surveyConverter: FirestoreDataConverter<Survey> = {
    toFirestore(s: Survey) {
      return {
        ownerId: s.ownerId,
        title: s.title,
        description: s.description ?? null,
        startAt: s.startAt ? Timestamp.fromDate(s.startAt) : null,
        endAt: s.endAt ? Timestamp.fromDate(s.endAt) : null,
        status: s.status,
        createdAt: s['createdAt'] ?? serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
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
        status: d.status,
        createdAt: d.createdAt?.toDate?.(),
        updatedAt: d.updatedAt?.toDate?.(),
      };
    },
  };

  private questionConverter: FirestoreDataConverter<Question> = {
    toFirestore(q: Question) {
      const data: any = {
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
        items: q.items ?? null,
        startPlaceholder: q.startPlaceholder ?? null,
        endPlaceholder: q.endPlaceholder ?? null,
        order: (q as any).order ?? null,
        createdAt: q['createdAt'] ?? serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      return omitUndefined(data);
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
        items: d.items ?? undefined,
        startPlaceholder: d.startPlaceholder ?? undefined,
        endPlaceholder: d.endPlaceholder ?? undefined,
        startAt: d.startAt ? (d.startAt as Timestamp).toDate() : undefined,
        endAt:   d.endAt   ? (d.endAt as Timestamp).toDate()   : undefined,
        order: d.order ?? undefined,
        createdAt: d.createdAt?.toDate?.(),
        updatedAt: d.updatedAt?.toDate?.(),
      };
    },
  };

  // ======================================================
  // Hilfsfunktionen für Referenzen
  // ======================================================
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

  // ======================================================
  // Implementierung von SurveyBackend
  // ======================================================

  async createDraft(s: Partial<Survey>): Promise<string> {
    const ref = doc(this.surveysCol());
    await setDoc(ref, {
      ownerId: s.ownerId,
      title: s.title ?? 'Neue Umfrage',
      status: 'draft',
      description: s.description ?? null,
      startAt: s.startAt ? Timestamp.fromDate(s.startAt as Date) : undefined,
      endAt:   s.endAt   ? Timestamp.fromDate(s.endAt as Date)   : undefined,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    } as any);
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

  async addQuestion(surveyId: string, q: Question): Promise<string> {
    const qRef = doc(this.questionsCol(surveyId));
    await setDoc(qRef, omitUndefined({
      ...q,
      id: qRef.id,
      createdAt: serverTimestamp(),
    }) as WithFieldValue<Question>);

    return qRef.id;
  }

  async publish(surveyId: string, startAt: Date, endAt: Date): Promise<void> {
    await setDoc(this.surveyDoc(surveyId), {
      status: 'published',
      startAt: Timestamp.fromDate(startAt),
      endAt: Timestamp.fromDate(endAt),
      updatedAt: serverTimestamp(),
    } as any, { merge: true });
  }

  async listQuestions(surveyId: string): Promise<Question[]> {
    const snaps = await getDocs(query(this.questionsCol(surveyId), orderBy('order', 'asc')));
    return snaps.docs.map(d => d.data());
  }

  async submitResponse(
    surveyId: string,
    payload: { name?: string; answers: any[] }
  ): Promise<void> {
    const respRef = doc(collection(this.firestore, this.rootColName, surveyId, this.responsesSubCol));
    await setDoc(respRef, {
      ...payload,
      createdAt: serverTimestamp(),
    });
  }

  async updateSurveyWithQuestions(
    surveyId: string,
    survey: Omit<Survey, 'id'>,
    questions: Array<Omit<Question, 'id'> & { id?: string }>
  ): Promise<void> {
    const batch = writeBatch(this.firestore as any);

    batch.set(this.surveyDoc(surveyId), survey as Survey, { merge: true });

    const existingSnap = await getDocs(this.questionsCol(surveyId));
    const existingIds = new Set(existingSnap.docs.map(d => d.id));

    const keptIds = new Set<string>();

    for (const q of questions) {
      const qRef = q.id
        ? this.questionDoc(surveyId, q.id)
        : doc(this.questionsCol(surveyId));
      const fullData = { ...q, id: qRef.id };
      batch.set(qRef, fullData as Question);
      keptIds.add(qRef.id);
    }

    for (const oldId of existingIds) {
      if (!keptIds.has(oldId)) {
        batch.delete(this.questionDoc(surveyId, oldId));
      }
    }

    batch.update(this.surveyDoc(surveyId), { updatedAt: serverTimestamp() } as any);
    await batch.commit();
  }

  async getSurveyWithQuestions(id: string): Promise<{ survey: Survey; questions: Question[] } | null> {
    const surveySnap = await getDoc(this.surveyDoc(id));
    if (!surveySnap.exists()) return null;

    const survey = surveySnap.data() as Survey;

    const qSnap = await getDocs(collection(this.firestore, 'umfragen', id, 'fragen'));
    const questions = qSnap.docs.map(d => d.data() as Question);

    return { survey: { ...survey, id }, questions };
  }

  async createSurveyWithQuestions(
    survey: Omit<Survey, 'id'>,
    questions: Omit<Question, 'id'>[]
  ): Promise<string> {
    const surveyRef = doc(collection(this.firestore, 'umfragen'));
    await setDoc(surveyRef, survey as Survey);

    const batch = writeBatch(this.firestore);
    for (const q of questions) {
      const qRef = doc(collection(this.firestore, 'umfragen', surveyRef.id, 'fragen'));
      batch.set(qRef, { ...q, id: qRef.id } as Question);
    }
    await batch.commit();

    return surveyRef.id;
  }


  async deleteSurvey(id: string): Promise<void> {
    const surveyRef = this.surveyDoc(id);
    const qSnap = await getDocs(this.questionsCol(id));
    const batch = writeBatch(this.firestore);

    qSnap.forEach((qDoc) => {
      batch.delete(qDoc.ref);
    });

    batch.delete(surveyRef);
    await batch.commit();
  }

  async setSurveyWithId(id: string, s: Partial<Survey>): Promise<void> {
    const docRef = doc(this.firestore, this.rootColName, id).withConverter(this.surveyConverter);
    await setDoc(docRef, s as Survey, { merge: true });
    await updateDoc(doc(this.firestore, this.rootColName, id), {
      updatedAt: serverTimestamp(),
    } as any);
  }



}
