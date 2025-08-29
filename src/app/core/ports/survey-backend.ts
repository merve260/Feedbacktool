import { Survey, Question } from '../models/survey.models';

// Einheitliche Schnittstelle für alle Datenquellen (z. B. Firebase, CMS).
// Wichtig: Alle Adapter müssen diese Signaturen exakt umsetzen.
export interface SurveyBackend {
  // Erstellt einen Entwurf und gibt die neue Survey-ID zurück
  createDraft(s: Partial<Survey>): Promise<string>;

  // Holt eine Umfrage anhand der ID, gibt null zurück wenn nicht vorhanden
  getById(id: string): Promise<Survey | null>;

  // Listet alle Umfragen eines bestimmten Benutzers
  listByOwner(ownerId: string): Promise<Survey[]>;

  // Fügt eine Frage hinzu und gibt deren ID zurück
  addQuestion(surveyId: string, q: Question): Promise<string>;

  // Veröffentlicht eine Umfrage (setzt Zeitraum und Status)
  publish(surveyId: string, startAt: Date, endAt: Date): Promise<void>;

  // Lädt alle Fragen einer Umfrage
  listQuestions(surveyId: string): Promise<Question[]>;

  // Sendet Antworten, Rückgabe nur Erfolg oder Fehler
  submitResponse(
    surveyId: string,
    payload: { name?: string; answers: any[] }
  ): Promise<void>;

  // Aktualisiert eine Umfrage inkl. Fragen
  updateSurveyWithQuestions(
    surveyId: string,
    survey: Omit<Survey, 'id'>,
    questions: Array<Omit<Question, 'id'> & { id?: string }>
  ): Promise<void>;

  // Lädt eine Umfrage mit allen dazugehörigen Fragen
  getSurveyWithQuestions(id: string): Promise<{ survey: Survey; questions: Question[] } | null>;

  // Erstellt eine neue Umfrage zusammen mit Fragen
  createSurveyWithQuestions(
    survey: Omit<Survey, 'id'>,
    questions: Omit<Question, 'id'>[]
  ): Promise<string>;

  // Setzt oder überschreibt eine Umfrage mit einer bestimmten ID
  setSurveyWithId(id: string, s: Partial<Survey>): Promise<void>;
}
