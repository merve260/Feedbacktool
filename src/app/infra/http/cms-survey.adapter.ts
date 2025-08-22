import { HttpClient } from '@angular/common/http';
import { SurveyBackend } from '../../core/ports/survey-backend';
import { Survey, Question } from '../../core/models/survey.models';

/**
 * CMS-Adapter (Stub):
 * Enthält nur leere Implementierungen.
 * → Später vom CMS-Team mit echter Logik gefüllt.
 */
export class CmsSurveyAdapter implements SurveyBackend {
  constructor(
    private http: HttpClient,
    private base: string
  ) {}

  async createDraft(s: Partial<Survey>): Promise<string> {
    return Promise.resolve(''); // leerer Rückgabewert
  }

  async getById(id: string): Promise<Survey | null> {
    return Promise.resolve(null);
  }

  async listByOwner(ownerId: string): Promise<Survey[]> {
    return Promise.resolve([]);
  }

  async addQuestion(surveyId: string, q: Question): Promise<string> {
    return Promise.resolve('');
  }

  async publish(id: string, s: Date, e: Date): Promise<void> {
    return Promise.resolve();
  }

  async listQuestions(surveyId: string): Promise<Question[]> {
    return Promise.resolve([]);
  }

  async submitResponse(
    surveyId: string,
    payload: { name?: string; answers: any[] }
  ): Promise<void> {
    return Promise.resolve();
  }

  async updateSurveyWithQuestions(
    surveyId: string,
    survey: Omit<Survey, 'id'>,
    questions: Array<Omit<Question, 'id'> & { id?: string }>
  ): Promise<void> {
    return Promise.resolve();
  }
}
