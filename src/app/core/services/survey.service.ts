// src/app/core/services/survey.service.ts
import { Injectable } from '@angular/core';
import { Survey, Question } from '../models/survey.models';
import { SurveyBackend } from '../ports/survey-backend';
import { FirebaseSurveyAdapter } from '../../infra/firebase/firebase-survey.adapter';

@Injectable({ providedIn: 'root' })
export class SurveyService {

  constructor(private backend: FirebaseSurveyAdapter) {}

  // -----------------------------
  // Surveys
  // -----------------------------

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

  // -----------------------------
  // Questions
  // -----------------------------

  addQuestion(surveyId: string, q: Question): Promise<string> {
    return this.backend.addQuestion(surveyId, q);
  }

  listQuestions(surveyId: string): Promise<Question[]> {
    return this.backend.listQuestions(surveyId);
  }

  setSurveyWithId(id: string, s: Partial<Survey>): Promise<void> {
    return this.backend.setSurveyWithId(id, s);
  }


  // -----------------------------
  // Responses
  // -----------------------------

  submitResponse(
    surveyId: string,
    payload: { name?: string; answers: any[] }
  ): Promise<void> {
    return this.backend.submitResponse(surveyId, payload);
  }
}
