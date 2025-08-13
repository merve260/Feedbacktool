import { Survey, Question } from '../models/survey.models';

export interface SurveyBackend {
  createDraft(s: Partial<Survey>): Promise<string>;
  getById(id: string): Promise<Survey>;
  listByOwner(ownerId: string): Promise<Survey[]>;
  addQuestion(surveyId: string, q: Question): Promise<void>;
  publish(surveyId: string, startAt: Date, endAt: Date): Promise<void>;
  listQuestions(surveyId: string): Promise<Question[]>;

  submitResponse(
    surveyId: string,
    payload: { name?: string; answers: any[] }
  ): Promise<string>;

}
