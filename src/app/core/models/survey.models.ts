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
  type: 'multiple' | 'slider' | 'star' | 'freitext' | 'radio';
  title: string;
  text?: string;
  options?: string[];        // für multiple / radio
  min?: number;              // für slider
  max?: number;              // für slider
  step?: number;             // für slider
  placeholderText?: string;  // für freitext behalten
  maxStars?: number;         // für star
  thumbLabel?: boolean;      // für slider
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Answer {
  id: string;
  questionId: string;
  answeredAt: Date;

  // mögliche Antwort-Werte
  textValue?: string;      // Freitext, Radio
  numberValue?: number;    // Slider, Star
  listValue?: string[];    // Multiple Choice
}
