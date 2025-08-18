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
  CollectionReference,
  DocumentReference,
} from '@angular/fire/firestore';
import { Timestamp, FirestoreDataConverter, writeBatch } from 'firebase/firestore';
import { Survey, Question } from '../models/survey.models';

@Injectable({ providedIn: 'root' })
export class FirebaseSurveyService {
  // ---- Sammlungen ----
  private readonly rootColName = 'umfragen';
  private readonly subColName  = 'fragen';

  constructor(private firestore: Firestore) {}

  // ---- Converter: Domain <-> Firestore ----
  private surveyConverter: FirestoreDataConverter<Survey> = {
    toFirestore(s: Survey) {
      // Nur bekannte Felder schreiben (undefined NICHT schreiben)
      return {
        ownerId: s.ownerId,
        titel: s.title,
        beschreibung: s.description ?? null,
        beginn: s.startAt ? Timestamp.fromDate(s.startAt) : null,
        ende:   s.endAt   ? Timestamp.fromDate(s.endAt)   : null,
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
        endAt:   d.ende   ? (d.ende   as Timestamp).toDate() : undefined,
        status: d.status,
      };
      return survey;
    },
  };

  private questionConverter: FirestoreDataConverter<Question> = {
    toFirestore(q: Question) {
      // Nur definierte Properties schreiben
      const data: any = {
        typ: q.type,
        titel: q.title,
      };
      if (q.text !== undefined) data.text = q.text;
      if (q.options !== undefined) data.optionen = q.options;
      if (q.min !== undefined) data.min = q.min;
      if (q.max !== undefined) data.max = q.max;
      if (q.step !== undefined) data.schritt = q.step;
      if (q.thumbLabel !== undefined) data.wertAnzeige = q.thumbLabel;

      // zusätzliche Felder (Builder-Modals)
      if (q.placeholderText !== undefined) data.platzhalter = q.placeholderText;
      if (q.maxStars !== undefined) data.sterneMax = q.maxStars;
      if (q.items !== undefined) data.elemente = q.items;
      if (q.startPlaceholder !== undefined) data.bereichStartPlatzhalter = q.startPlaceholder;
      if (q.endPlaceholder   !== undefined) data.bereichEndePlatzhalter  = q.endPlaceholder;

      // optionale Sortierung
      if ((q as any).order !== undefined) data.order = (q as any).order;

      return data;
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
        thumbLabel: d.wertAnzeige ?? undefined,

        // zusätzliche Felder zurück mappen
        placeholderText: d.platzhalter ?? undefined,
        maxStars: d.sterneMax ?? undefined,
        items: d.elemente ?? undefined,
        startPlaceholder: d.bereichStartPlatzhalter ?? undefined,
        endPlaceholder:   d.bereichEndePlatzhalter  ?? undefined,

        // optionale Sortierung
        ...(d.order !== undefined ? { order: d.order } : {}),
      };
      return q;
    },
  };

  // ---- Referenz-Helfer ----
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
  //                     API
  // ======================================================

  // Umfrage + (optional) Fragen anlegen -> ID zurück
  async createSurveyWithQuestions(
    survey: Omit<Survey, 'id'>,
    questions: Omit<Question, 'id'>[]
  ): Promise<string> {
    const surveyRef = doc(this.surveysCol());      // yeni ref
    await setDoc(surveyRef, survey as Survey);     // anketi yaz

    // Soruları yaz (converter + undefined filtreleme garanti)
    for (const q of questions ?? []) {
      const qRef = doc(this.questionsCol(surveyRef.id));
      await setDoc(qRef, q as Question);
    }
    return surveyRef.id;
  }

  // Umfrage mit fixer ID setzen / überschreiben
  async setSurveyWithId(id: string, s: Omit<Survey, 'id'>): Promise<void> {
    await setDoc(this.surveyDoc(id), s as Survey);
  }

  // Einzelne Umfrage laden
  async getSurvey(id: string): Promise<Survey | null> {
    const snap = await getDoc(this.surveyDoc(id));
    return snap.exists() ? snap.data()! : null;
  }

  // Einzelne Frage anlegen -> neue Frage-ID
  async addQuestion(surveyId: string, q: Omit<Question, 'id'>): Promise<string> {
    const ref = doc(this.questionsCol(surveyId));
    await setDoc(ref, q as Question);
    return ref.id;
  }

  // Frage mit fixer ID setzen / überschreiben
  async setQuestionWithId(surveyId: string, qId: string, q: Omit<Question, 'id'>): Promise<void> {
    await setDoc(this.questionDoc(surveyId, qId), q as Question);
  }

  // Fragenliste laden (wenn order varsa buna göre)
  async getQuestions(surveyId: string): Promise<Question[]> {
    const qRef = this.questionsCol(surveyId);
    const qSnap = await getDocs(query(qRef, orderBy('order', 'asc') as any));
    return qSnap.docs.map(d => d.data());
  }

  // --- WICHTIG: Builder'ın kullandığı toplu güncelleme ---
  async updateSurveyWithQuestions(
    surveyId: string,
    survey: Omit<Survey, 'id'>,
    questions: Array<Omit<Question, 'id'> & { id?: string }>
  ): Promise<string[]> {
    const batch = writeBatch(this.firestore as any);

    // 1) Umfrage (merge)
    batch.set(this.surveyDoc(surveyId), survey as Survey);

    // 2) Mevcut ID’ler
    const existingSnap = await getDocs(this.questionsCol(surveyId));
    const existingIds = new Set(existingSnap.docs.map(d => d.id));

    // 3) Upsert
    const keptIds = new Set<string>();
    const finalIds: string[] = [];

    for (const q of questions) {
      const qRef = q.id
        ? this.questionDoc(surveyId, q.id)
        : doc(this.questionsCol(surveyId));  // yeni ID

      batch.set(qRef, q as Question);        // converter çalışır
      keptIds.add(qRef.id);
      finalIds.push(qRef.id);
    }

    // 4) Silinenleri kaldır
    for (const oldId of existingIds) {
      if (!keptIds.has(oldId)) {
        batch.delete(this.questionDoc(surveyId, oldId));
      }
    }

    await batch.commit();
    return finalIds;
  }

}
