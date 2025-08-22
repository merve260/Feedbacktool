import { Survey, Question } from '../models/survey.models';

/**
 * Einheitliche Schnittstelle für alle Datenquellen (Firebase, CMS, ...).
 * ACHTUNG: Signaturen hier ne ise tüm adapterler birebir uymalı.
 */
export interface SurveyBackend {
  // Legt einen Entwurf an und liefert die neue Survey-ID zurück
  createDraft(s: Partial<Survey>): Promise<string>;

  // Holt eine Umfrage; existiert sie nicht, -> null
  getById(id: string): Promise<Survey | null>;

  // Listet alle Umfragen eines Besitzers
  listByOwner(ownerId: string): Promise<Survey[]>;

  // Fügt eine Frage hinzu und gibt die Fragen-ID zurück
  addQuestion(surveyId: string, q: Question): Promise<string>;

  // Veröffentlicht (setzt Zeitraum + Status)
  publish(surveyId: string, startAt: Date, endAt: Date): Promise<void>;

  // Fragen der Umfrage abrufen
  listQuestions(surveyId: string): Promise<Question[]>;

  // Antworten übermitteln (nur Erfolg/Fehler genügt)
  submitResponse(
    surveyId: string,
    payload: { name?: string; answers: any[] }
  ): Promise<void>;

  updateSurveyWithQuestions(
    surveyId: string,
    survey: Omit<Survey, 'id'>,
    questions: Array<Omit<Question, 'id'> & { id?: string }>
  ): Promise<void>;
  getSurveyWithQuestions(id: string): Promise<{ survey: Survey; questions: Question[] } | null>;
  createSurveyWithQuestions(
    survey: Omit<Survey, 'id'>,
    questions: Omit<Question, 'id'>[]
  ): Promise<string>;

  setSurveyWithId(id: string, s: Partial<Survey>): Promise<void>;


}
