// src/app/core/services/firebase-survey.service.ts
import { Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  doc,
  addDoc,
  setDoc,
  getDoc,
  getDocs,
  query,
  orderBy,
  updateDoc,
  CollectionReference,
  DocumentReference,
  serverTimestamp,
} from '@angular/fire/firestore';
import { Timestamp, FirestoreDataConverter, writeBatch } from 'firebase/firestore';
import { Survey, Question } from '../models/survey.models';

@Injectable({ providedIn: 'root' })
export class FirebaseSurveyService {
  // ---- Namen der Sammlungen ----
  private readonly rootColName = 'umfragen';   // Hauptsammlung
  private readonly subColName = 'fragen';     // Subcollection je Umfrage

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
      };
    },
    fromFirestore(snapshot) {
      const d: any = snapshot.data();
      const survey: Survey = {
        id: snapshot.id,
        ownerId: d.ownerId,
        title: d.title,
        description: d.description ?? null,
        startAt: d.startAt ? (d.startAt as Timestamp).toDate() : undefined,
        endAt: d.endAt ? (d.endAt as Timestamp).toDate() : undefined,
        status: d.status,
      };
      return survey;
    },
  };

  private questionConverter: FirestoreDataConverter<Question> = {
    toFirestore(q: Question) {
      const data: any = {
        type: q.type,
        title: q.title,
      };
      if (q.text !== undefined) data.text = q.text;
      if (q.options !== undefined) data.options = q.options;
      if (q.min !== undefined) data.min = q.min;
      if (q.max !== undefined) data.max = q.max;
      if (q.step !== undefined) data.step = q.step;
      if (q.thumbLabel !== undefined) data.thumbLabel = q.thumbLabel;

      // zusätzliche optionale Felder
      if (q.placeholderText !== undefined) data.placeholderText = q.placeholderText;
      if (q.maxStars !== undefined) data.maxStars = q.maxStars;
      if (q.items !== undefined) data.items = q.items;
      if (q.startPlaceholder !== undefined) data.startPlaceholder = q.startPlaceholder;
      if (q.endPlaceholder !== undefined) data.endPlaceholder = q.endPlaceholder;

      if ((q as any).order !== undefined) data.order = (q as any).order;
      return data;
    },
    fromFirestore(snapshot) {
      const d: any = snapshot.data();
      const q: Question = {
        id: snapshot.id,
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
        ...(d.order !== undefined ? { order: d.order } : {}),
      };
      return q;
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
  // API - Umfragen + Fragen CRUD
  // ======================================================

  async createSurveyWithQuestions(
    survey: Omit<Survey, 'id'>,
    questions: Omit<Question, 'id'>[]
  ): Promise<string> {
    const surveyRef = doc(this.surveysCol());
    await setDoc(surveyRef, survey as Survey);
    await updateDoc(doc(this.firestore, this.rootColName, surveyRef.id), {
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    } as any);

    for (const q of questions ?? []) {
      const qRef = doc(this.questionsCol(surveyRef.id));
      await setDoc(qRef, q as Question);
    }
    return surveyRef.id;
  }

  async setSurveyWithId(id: string, s: Omit<Survey, 'id'>): Promise<void> {
    await setDoc(this.surveyDoc(id), s as Survey, { merge: true });
    await updateDoc(doc(this.firestore, this.rootColName, id), {
      updatedAt: serverTimestamp(),
    } as any);
  }

  async getSurvey(id: string): Promise<Survey | null> {
    const snap = await getDoc(this.surveyDoc(id));
    return snap.exists() ? snap.data()! : null;
  }

  async addQuestion(surveyId: string, q: Omit<Question, 'id'>): Promise<string> {
    const ref = doc(this.questionsCol(surveyId));
    await setDoc(ref, q as Question);
    return ref.id;
  }

  async setQuestionWithId(surveyId: string, qId: string, q: Omit<Question, 'id'>): Promise<void> {
    await setDoc(this.questionDoc(surveyId, qId), q as Question);
  }

  async getQuestions(surveyId: string): Promise<Question[]> {
    const qRef = this.questionsCol(surveyId);
    const qSnap = await getDocs(query(qRef, orderBy('order', 'asc') as any));
    return qSnap.docs.map(d => d.data());
  }

  async updateSurveyWithQuestions(
    surveyId: string,
    survey: Omit<Survey, 'id'>,
    questions: Array<Omit<Question, 'id'> & { id?: string }>
  ): Promise<string[]> {
    const batch = writeBatch(this.firestore as any);

    batch.set(this.surveyDoc(surveyId), survey as Survey, { merge: true });

    const existingSnap = await getDocs(this.questionsCol(surveyId));
    const existingIds = new Set(existingSnap.docs.map(d => d.id));

    const keptIds = new Set<string>();
    const finalIds: string[] = [];

    for (const q of questions) {
      const qRef = q.id
        ? this.questionDoc(surveyId, q.id)
        : doc(this.questionsCol(surveyId));

      batch.set(qRef, q as Question);
      keptIds.add(qRef.id);
      finalIds.push(qRef.id);
    }

    for (const oldId of existingIds) {
      if (!keptIds.has(oldId)) {
        batch.delete(this.questionDoc(surveyId, oldId));
      }
    }

    batch.update(doc(this.firestore, this.rootColName, surveyId) as any, {
      updatedAt: serverTimestamp(),
    } as any);

    await batch.commit();
    return finalIds;
  }

  async getSurveyWithQuestions(id: string): Promise<Survey & { questions: Question[] }> {
    const snap = await getDoc(this.surveyDoc(id));
    if (!snap.exists()) {
      throw new Error(`Umfrage mit ID ${id} nicht gefunden`);
    }
    const survey = snap.data()!;

    const qSnap = await getDocs(query(this.questionsCol(id), orderBy('order', 'asc') as any));
    const questions = qSnap.docs.map(d => d.data());

    return {
      ...survey,
      questions,
    };
  }

  async deleteSurvey(id: string): Promise<void> {
    const surveyRef = doc(this.firestore, this.rootColName, id);
    const questionsCol = collection(surveyRef, this.subColName);

    const qSnap = await getDocs(questionsCol);
    const batch = writeBatch(this.firestore);

    qSnap.forEach((qDoc) => {
      batch.delete(qDoc.ref);
    });

    batch.delete(surveyRef);
    await batch.commit();
  }
}
