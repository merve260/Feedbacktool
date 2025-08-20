import { HttpClient, HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { SurveyBackend } from '../../core/ports/survey-backend';
import { Survey, Question } from '../../core/models/survey.models';

/**
 * CMS-Adapter (HTTP):
 * Tüm imzalar SurveyBackend ile birebir uyumlu.
 */
export class CmsSurveyAdapter implements SurveyBackend {
  constructor(
    private http: HttpClient,
    private base: string // z.B. environment.apiBaseUrl
  ) {}

  async createDraft(s: Partial<Survey>): Promise<string> {
    const r = await firstValueFrom(
      this.http.post<{ id: string }>(`${this.base}/surveys`, s)
    );
    return r?.id ?? crypto.randomUUID();
  }

  async getById(id: string): Promise<Survey | null> {
    try {
      return await firstValueFrom(
        this.http.get<Survey>(`${this.base}/surveys/${id}`)
      );
    } catch (e: any) {
      // 404 → null döndür (diğer hataları ileri fırlatmak istersen yakalama)
      return null;
    }
  }

  listByOwner(ownerId: string): Promise<Survey[]> {
    const params = new HttpParams().set('ownerId', ownerId);
    return firstValueFrom(
      this.http.get<Survey[]>(`${this.base}/surveys`, { params })
    );
  }

  async addQuestion(id: string, q: Question): Promise<string> {
    const r = await firstValueFrom(
      this.http.post<{ id: string }>(`${this.base}/surveys/${id}/questions`, q)
    );
    return r?.id ?? crypto.randomUUID();
  }

  publish(id: string, s: Date, e: Date): Promise<void> {
    return firstValueFrom(
      this.http.post<void>(`${this.base}/surveys/${id}/publish`, {
        startAt: s.toISOString(),
        endAt: e.toISOString(),
      })
    );
  }

  listQuestions(surveyId: string): Promise<Question[]> {
    return firstValueFrom(
      this.http.get<Question[]>(`${this.base}/surveys/${surveyId}/questions`)
    );
  }

  async submitResponse(
    surveyId: string,
    payload: { name?: string; answers: any[] }
  ): Promise<void> {
    await firstValueFrom(
      this.http.post<void>(`${this.base}/surveys/${surveyId}/responses`, payload)
    );
  }

  async updateSurveyWithQuestions(
    surveyId: string,
    survey: Omit<Survey, 'id'>,
    questions: Array<Omit<Question, 'id'> & { id?: string }>
  ): Promise<void> {
    // TODO: Für CMS später implementieren
    console.warn('[CmsSurveyAdapter] updateSurveyWithQuestions noch nicht implementiert');
    return Promise.resolve();
  }


  }
