import { Injectable, inject } from '@angular/core';
import { environment } from '../../environments/environment';
import { SurveyBackend } from '../core/ports/survey-backend';
import { FirebaseSurveyAdapter } from '../infra/firebase/firebase-survey.adapter';
import { CmsSurveyAdapter } from '../infra/http/cms-survey.adapter';
import { Survey, Question } from '../core/models/survey.models';

@Injectable({ providedIn: 'root' })
export class SurveyService {
  private backend: SurveyBackend;

  constructor() {
    this.backend = environment.dataProvider === 'firebase'
      ? new FirebaseSurveyAdapter()
      : new CmsSurveyAdapter();
  }

  createDraft(s: Partial<Survey>)              { return this.backend.createDraft(s); }
  getById(id: string)                          { return this.backend.getById(id); }
  listByOwner(ownerId: string)                 { return this.backend.listByOwner(ownerId); }
  addQuestion(surveyId: string, q: Question)   { return this.backend.addQuestion(surveyId, q); }
  publish(surveyId: string, s: Date, e: Date)  { return this.backend.publish(surveyId, s, e); }
}
