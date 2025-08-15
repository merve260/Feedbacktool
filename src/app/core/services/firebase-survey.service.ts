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
  CollectionReference,
  DocumentReference,
} from '@angular/fire/firestore';
import { Timestamp, FirestoreDataConverter } from 'firebase/firestore';
import { Survey, Question } from '../models/survey.models';

@Injectable({ providedIn: 'root' })
export class FirebaseSurveyService {
  private readonly rootColName = 'umfragen';
  private readonly subColName  = 'fragen';

  constructor(private firestore: Firestore) {}

  // --- Converters: Firestore
  private surveyConverter: FirestoreDataConverter<Survey> = {
    toFirestore(s: Survey) {
      return {
        ownerId: s.ownerId,
        titel: s.title,
        beschreibung: s.description ?? null,
        beginn: s.startAt ? Timestamp.fromDate(s.startAt) : null,
        ende: s.endAt ? Timestamp.fromDate(s.endAt) : null,
        status: s.status,
      };
    },
    fromFirestore(snapshot) {
      const d: any = snapshot.data();
      const survey: Survey = {
        id: snapshot.id,
        ownerId: d.ownerId,
        title: d.titel,
        description: d.beschreibung ?? undefined,
        startAt: d.beginn ? (d.beginn as Timestamp).toDate() : undefined,
        endAt: d.ende ? (d.ende as Timestamp).toDate() : undefined,
        status: d.status,
      };
      return survey;
    },
  };

  private questionConverter: FirestoreDataConverter<Question> = {
    toFirestore(q: Question) {
      return {
        typ: q.type,
        titel: q.title,
        text: q.text ?? null,
        optionen: q.options ?? null,
        min: q.min ?? null,
        max: q.max ?? null,
        schritt: q.step ?? null,
      };
    },
    fromFirestore(snapshot) {
      const d: any = snapshot.data();
      const q: Question = {
        id: snapshot.id,
        type: d.typ,
        title: d.titel,
        text: d.text ?? undefined,
        options: d.optionen ?? undefined,
        min: d.min ?? undefined,
        max: d.max ?? undefined,
        step: d.schritt ?? undefined,
      };
      return q;
    },
  };

  // --- Referans helper ---
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

  // --- Survey Teil ---
  async createSurveyWithQuestions(
    survey: Omit<Survey, 'id'>,
    questions: Omit<Question, 'id'>[]
  ): Promise<string> {
    try {
      const surveyRef = await addDoc(this.surveysCol(), survey as Survey);
      if (questions && questions.length > 0) {
        const batchPromises = questions.map(q =>
          addDoc(this.questionsCol(surveyRef.id), q as Question)
        );
        await Promise.all(batchPromises);
      }
      return surveyRef.id;
    } catch (e: any) {
      console.error('[SERVICE] createSurveyWithQuestions error:', e?.code, e?.message);
      throw e;
    }
  }

  async setSurveyWithId(id: string, s: Omit<Survey, 'id'>): Promise<void> {
    await setDoc(this.surveyDoc(id), s as Survey);
  }

  async getSurvey(id: string): Promise<Survey | null> {
    const snap = await getDoc(this.surveyDoc(id));
    return snap.exists() ? snap.data()! : null;
  }

  // --- Question (Subcollection)  ---
  async addQuestion(surveyId: string, q: Omit<Question, 'id'>): Promise<string> {
    try {
      const ref = await addDoc(this.questionsCol(surveyId), q as Question);
      return ref.id;
    } catch (e:any) {
      console.error('[SERVICE] addQuestion error:', e?.code, e?.message);
      throw e;
    }
  }

  async setQuestionWithId(surveyId: string, qId: string, q: Omit<Question, 'id'>): Promise<void> {
    await setDoc(this.questionDoc(surveyId, qId), q as Question);
  }

  async getQuestions(surveyId: string): Promise<Question[]> {
    const qSnap = await getDocs(query(this.questionsCol(surveyId)));
    return qSnap.docs.map(d => d.data());
  }
}
