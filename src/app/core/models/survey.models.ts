export type SurveyStatus = 'draft' | 'published' | 'closed';

export interface Survey {
  id: string;
  ownerId: string;
  title: string;
  description?: string | null;
  startAt?: Date;
  endAt?: Date;
  status: SurveyStatus;
  createdAt?: Date;
  updatedAt?: Date;
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
  placeholderText?: string;
  maxStars?: number;
  items?: string[];
  startPlaceholder?: string;
  endPlaceholder?: string;
  thumbLabel?: boolean;
}

export interface Answer {
  id: string;
  questionId: string;
  respondentId: string;
  value: string | number | boolean | string[];
  answeredAt: Date;
}
