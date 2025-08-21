// src/app/core/services/survey.service.ts

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Firestore } from '@angular/fire/firestore';

import { environment } from '../../../environments/environment';
import { SurveyBackend } from '../ports/survey-backend';
import { FirebaseSurveyAdapter } from '../../infra/firebase/firebase-survey.adapter';
import { CmsSurveyAdapter } from '../../infra/http/cms-survey.adapter';
import { Survey, Question } from '../models/survey.models';

@Injectable({ providedIn: 'root' })
export class SurveyService {
  private readonly backend: SurveyBackend;

  private readonly firestore = inject(Firestore);
  private readonly http = inject(HttpClient);

  constructor() {
    this.backend =
      environment.dataProvider === 'firebase'
        ? new FirebaseSurveyAdapter(this.firestore)
        : new CmsSurveyAdapter(this.http, environment.apiBaseUrl);
  }

  listQuestions(surveyId: string) {
    return this.backend.listQuestions(surveyId);
  }

  submitResponse(surveyId: string, payload: { name?: string; answers: any[] }) {
    return this.backend.submitResponse(surveyId, payload);
  }

  createDraft(s: Partial<Survey>)              { return this.backend.createDraft(s); }
  getById(id: string)                          { return this.backend.getById(id); }
  listByOwner(ownerId: string)                 { return this.backend.listByOwner(ownerId); }
  addQuestion(surveyId: string, q: Question)   { return this.backend.addQuestion(surveyId, q); }

  publish(surveyId: string, s: Date, e: Date)  { return this.backend.publish(surveyId, s, e); }


  updateSurveyWithQuestions(
    surveyId: string,
    survey: Omit<Survey, 'id'>,
    questions: Array<Omit<Question, 'id'> & { id?: string }>
  ) {

    return this.backend.updateSurveyWithQuestions(surveyId, survey, questions);
  }
}
