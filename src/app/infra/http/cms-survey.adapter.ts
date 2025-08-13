// src/app/infra/http/cms-survey.adapter.ts
import { HttpClient, HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { SurveyBackend } from '../../core/ports/survey-backend';
import { Survey, Question } from '../../core/models/survey.models';

export class CmsSurveyAdapter implements SurveyBackend {
  constructor(
    private http: HttpClient,
    private base: string // z.B: environment.apiBaseUrl
  ) {}

  async createDraft(s: Partial<Survey>): Promise<string> {
    const r = await firstValueFrom(
      this.http.post<{ id: string }>(`${this.base}/surveys`, s)
    );
    return r.id;
  }

  getById(id: string): Promise<Survey> {
    return firstValueFrom(this.http.get<Survey>(`${this.base}/surveys/${id}`));
  }

  listByOwner(ownerId: string): Promise<Survey[]> {
    const params = new HttpParams().set('ownerId', ownerId);
    return firstValueFrom(this.http.get<Survey[]>(`${this.base}/surveys`, { params }));
  }

  addQuestion(id: string, q: Question): Promise<void> {
    return firstValueFrom(this.http.post<void>(`${this.base}/surveys/${id}/questions`, q));
  }

  publish(id: string, s: Date, e: Date): Promise<void> {
    return firstValueFrom(
      this.http.post<void>(`${this.base}/surveys/${id}/publish`, {
        startAt: s.toISOString(),
        endAt: e.toISOString(),
      })
    );
  }

  async submitResponse(
    surveyId: string,
    payload: { name?: string; answers: any[] }
  ): Promise<string> {

    throw new Error('submitResponse is not implemented for CMS backend yet.');
  }

}
