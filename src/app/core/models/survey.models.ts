// Mögliche Statuswerte einer Umfrage
export type SurveyStatus = 'draft' | 'published' | 'closed';

// Datenstruktur für eine Umfrage
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

// Datenstruktur für eine Frage innerhalb einer Umfrage
export interface Question {
  id: string;
  type: 'multiple' | 'slider' | 'star' | 'freitext' | 'radio';
  title: string;
  text?: string;
  options?: string[];       // Antwortmöglichkeiten für Multiple Choice / Radio
  min?: number;             // Minimalwert für Slider
  max?: number;             // Maximalwert für Slider
  step?: number;            // Schrittweite für Slider
  placeholderText?: string; // Platzhalter für Freitext
  maxStars?: number;        // Anzahl Sterne bei Bewertung
  thumbLabel?: boolean;     // Anzeige des Werts am Slider
  createdAt?: Date;
  updatedAt?: Date;
  order?: number;
}

// Datenstruktur für eine Antwort eines Teilnehmers
export interface Answer {
  id: string;
  questionId: string;
  answeredAt: Date;

  // Je nach Fragetyp unterschiedliche Antwortwerte
  textValue?: string;     // Freitext oder Radio
  numberValue?: number;   // Slider oder Star
  listValue?: string[];   // Multiple Choice
}
