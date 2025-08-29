import { HttpClient } from '@angular/common/http';
import { SurveyBackend } from '../../core/ports/survey-backend';
import { Survey, Question } from '../../core/models/survey.models';

/**
 * CMS-Adapter (Stub)
 * Dieser Adapter implementiert das SurveyBackend-Interface,
 * enthält aber keine echte Logik.
 * Er dient nur als Platzhalter für ein zukünftiges CMS.
 */
export class CmsSurveyAdapter implements SurveyBackend {
  constructor(
    private http: HttpClient,
    private base: string
  ) {}

  // Legt einen Entwurf an (derzeit leer)
  async createDraft(s: Partial<Survey>): Promise<string> {
    return Promise.resolve('');
  }

  // Holt eine Umfrage nach ID (derzeit leer)
  async getById(id: string): Promise<Survey | null> {
    return Promise.resolve(null);
  }

  // Listet alle Umfragen eines Benutzers (derzeit leer)
  async listByOwner(ownerId: string): Promise<Survey[]> {
    return Promise.resolve([]);
  }

  // Fügt eine Frage hinzu (derzeit leer)
  async addQuestion(surveyId: string, q: Question): Promise<string> {
    return Promise.resolve('');
  }

  // Veröffentlicht eine Umfrage (derzeit leer)
  async publish(id: string, s: Date, e: Date): Promise<void> {
    return Promise.resolve();
  }

  // Fragen einer Umfrage abrufen (derzeit leer)
  async listQuestions(surveyId: string): Promise<Question[]> {
    return Promise.resolve([]);
  }

  // Antworten speichern (derzeit leer)
  async submitResponse(
    surveyId: string,
    payload: { name?: string; answers: any[] }
  ): Promise<void> {
    return Promise.resolve();
  }

  // Update einer Umfrage + Fragen (derzeit leer)
  async updateSurveyWithQuestions(
    surveyId: string,
    survey: Omit<Survey, 'id'>,
    questions: Array<Omit<Question, 'id'> & { id?: string }>
  ): Promise<void> {
    return Promise.resolve();
  }
}
