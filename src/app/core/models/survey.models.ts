export type SurveyStatus = 'draft' | 'published' | 'closed';

export interface Survey {
  id: string;
  ownerId: string;
  title: string;
  description?: string;
  startAt?: Date;
  endAt?: Date;
  status: SurveyStatus;
}

export interface Question {
  id: string;
  type: 'yesno' | 'multiple' | 'slider' | 'star' | 'date' | 'dragdrop' | 'freitext' | 'radio';
  title: string;
  text?: string;
  options?: string[];
  min?: number;
  max?: number;
  step?: number;
}
export interface Answer {
  id: string;
  questionId: string;
  respondentId: string;
  value: string | number | string[];
  answeredAt: Date;
}
