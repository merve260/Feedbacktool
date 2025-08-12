import { inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { SurveyBackend } from '../../core/ports/survey-backend';
import { Survey, Question } from '../../core/models/survey.models';

export class CmsSurveyAdapter implements SurveyBackend {
  private http = inject(HttpClient);
  private base = environment.apiBaseUrl; // z.B.: 'https://api.company.com'

  async createDraft(s: Partial<Survey>): Promise<string> {
    const r = await this.http.post<{id:string}>(`${this.base}/surveys`, s).toPromise();
    return r!.id;
  }
  getById(id: string)         { return this.http.get<Survey>(`${this.base}/surveys/${id}`).toPromise() as any; }
  listByOwner(ownerId: string){ return this.http.get<Survey[]>(`${this.base}/surveys?ownerId=${ownerId}`).toPromise() as any; }
  addQuestion(id: string, q: Question) { return this.http.post<void>(`${this.base}/surveys/${id}/questions`, q).toPromise() as any; }
  publish(id: string, s: Date, e: Date) {
    return this.http.post<void>(`${this.base}/surveys/${id}/publish`, { startAt: s, endAt: e }).toPromise() as any;
  }
}
