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

  constructor(private firestore: Firestore) {
  }

  // ======================================================
  // Converter: Domain-Objekte <-> Firestore
  // ======================================================

  private surveyConverter: FirestoreDataConverter<Survey> = {
    toFirestore(s: Survey) {
      // Nur bekannte Felder schreiben (undefined NICHT speichern)
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
      if (q.endPlaceholder !== undefined) data.bereichEndePlatzhalter = q.endPlaceholder;

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
        placeholderText: d.platzhalter ?? undefined,
        maxStars: d.sterneMax ?? undefined,
        items: d.elemente ?? undefined,
        startPlaceholder: d.bereichStartPlatzhalter ?? undefined,
        endPlaceholder: d.bereichEndePlatzhalter ?? undefined,
        ...(d.order !== undefined ? {order: d.order} : {}),
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

  // Neue Umfrage + Fragen erstellen
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

  // Existierende Umfrage überschreiben/aktualisieren
  async setSurveyWithId(id: string, s: Omit<Survey, 'id'>): Promise<void> {
    await setDoc(this.surveyDoc(id), s as Survey, {merge: true});
    await updateDoc(doc(this.firestore, this.rootColName, id), {
      updatedAt: serverTimestamp(),
    } as any);
  }

  // Einzelne Umfrage laden
  async getSurvey(id: string): Promise<Survey | null> {
    const snap = await getDoc(this.surveyDoc(id));
    return snap.exists() ? snap.data()! : null;
  }

  // Einzelne Frage hinzufügen
  async addQuestion(surveyId: string, q: Omit<Question, 'id'>): Promise<string> {
    const ref = doc(this.questionsCol(surveyId));
    await setDoc(ref, q as Question);
    return ref.id;
  }

  // Frage überschreiben
  async setQuestionWithId(surveyId: string, qId: string, q: Omit<Question, 'id'>): Promise<void> {
    await setDoc(this.questionDoc(surveyId, qId), q as Question);
  }

  // Alle Fragen einer Umfrage laden
  async getQuestions(surveyId: string): Promise<Question[]> {
    const qRef = this.questionsCol(surveyId);
    const qSnap = await getDocs(query(qRef, orderBy('order', 'asc') as any));
    return qSnap.docs.map(d => d.data());
  }

  // Umfrage + Fragen zusammen aktualisieren (Batch)
  async updateSurveyWithQuestions(
    surveyId: string,
    survey: Omit<Survey, 'id'>,
    questions: Array<Omit<Question, 'id'> & { id?: string }>
  ): Promise<string[]> {
    const batch = writeBatch(this.firestore as any);

    // 1) Survey speichern
    batch.set(this.surveyDoc(surveyId), survey as Survey, {merge: true});

    // 2) Existierende Fragen-IDs holen
    const existingSnap = await getDocs(this.questionsCol(surveyId));
    const existingIds = new Set(existingSnap.docs.map(d => d.id));

    // 3) Fragen updaten/hinzufügen
    const keptIds = new Set<string>();
    const finalIds: string[] = [];

    for (const q of questions) {
      const qRef = q.id
        ? this.questionDoc(surveyId, q.id)
        : doc(this.questionsCol(surveyId)); // neue Frage

      batch.set(qRef, q as Question);
      keptIds.add(qRef.id);
      finalIds.push(qRef.id);
    }

    // 4) Nicht mehr vorhandene Fragen löschen
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

  // ======================================================
  // NEU: Umfrage + Fragen laden (für Edit-Modus im Builder)
  // ======================================================
  async getSurveyWithQuestions(id: string): Promise<Survey & { questions: Question[] }> {
    // 1) Survey-Dokument laden
    const snap = await getDoc(this.surveyDoc(id));
    if (!snap.exists()) {
      throw new Error(`Umfrage mit ID ${id} nicht gefunden`);
    }
    const survey = snap.data()!; // converter çalıştığı için Survey objesi

    // 2) Fragen laden (order berücksichtigen falls vorhanden)
    const qSnap = await getDocs(query(this.questionsCol(id), orderBy('order', 'asc') as any));
    const questions = qSnap.docs.map(d => d.data());

    // 3) Survey + Fragen birlikte döndür
    return {
      ...survey,
      questions,
    };
  }
}
