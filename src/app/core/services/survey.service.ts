// src/app/core/services/survey.service.ts
import { Injectable } from '@angular/core';
import { Survey, Question } from '../models/survey.models';
import { FirebaseSurveyAdapter } from '../../infra/firebase/firebase-survey.adapter';
import { Firestore, collection, getDocs, query, orderBy } from '@angular/fire/firestore';


@Injectable({ providedIn: 'root' })
export class SurveyService {

  constructor(private backend: FirebaseSurveyAdapter,private firestore: Firestore) {}

  // Surveys anlegen, abrufen und verwalten
  createDraft(s: Partial<Survey>): Promise<string> {
    return this.backend.createDraft(s);
  }

  getById(id: string): Promise<Survey | null> {
    return this.backend.getById(id);
  }

  listByOwner(ownerId: string): Promise<Survey[]> {
    return this.backend.listByOwner(ownerId);
  }

  publish(surveyId: string, startAt: Date, endAt: Date): Promise<void> {
    return this.backend.publish(surveyId, startAt, endAt);
  }

  updateSurveyWithQuestions(
    surveyId: string,
    survey: Omit<Survey, 'id'>,
    questions: Array<Omit<Question, 'id'> & { id?: string }>
  ): Promise<void> {
    return this.backend.updateSurveyWithQuestions(surveyId, survey, questions);
  }

  getSurveyWithQuestions(id: string) {
    return this.backend.getSurveyWithQuestions(id);
  }

  createSurveyWithQuestions(
    survey: Omit<Survey, 'id'>,
    questions: Omit<Question, 'id'>[]
  ) {
    return this.backend.createSurveyWithQuestions(survey, questions);
  }

  deleteSurvey(id: string): Promise<void> {
    return this.backend.deleteSurvey(id);
  }

  // Fragen hinzufügen und abrufen
  addQuestion(surveyId: string, q: Question): Promise<string> {
    return this.backend.addQuestion(surveyId, q);
  }

  async listQuestions(surveyId: string): Promise<Question[]> {
    const colRef = collection(this.firestore, `umfragen/${surveyId}/fragen`);
    const q = query(colRef, orderBy('order'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Question));
  }


  // Survey-Daten direkt überschreiben
  setSurveyWithId(id: string, s: Partial<Survey>): Promise<void> {
    return this.backend.setSurveyWithId(id, s);
  }

  // Antworten speichern
  submitResponse(
    surveyId: string,
    payload: { name?: string; answers: any[] }
  ): Promise<void> {
    return this.backend.submitResponse(surveyId, payload);
  }

  // Status aktualisieren (z. B. draft → published → closed)
  updateStatus(id: string, status: 'draft' | 'published' | 'closed'): Promise<void> {
    return this.setSurveyWithId(id, { status });
  }
}
