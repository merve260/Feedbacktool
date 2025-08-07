import {Component, OnInit, ViewEncapsulation} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {
  MatRadioButton,
  MatRadioGroup
} from '@angular/material/radio';
import {MatSlider, MatSliderThumb} from '@angular/material/slider';
import {
  NgForOf,
  NgIf,
  NgSwitch,
  NgSwitchCase,
  NgSwitchDefault
} from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { FormsModule } from '@angular/forms';
import {MatButton} from '@angular/material/button';

@Component({
  selector: 'app-survey-viewer',
  standalone: true,
  templateUrl: './survey-viewer.component.html',
  styleUrls: ['./survey-viewer.component.scss'],
  encapsulation: ViewEncapsulation.None,
  imports: [
    NgIf,
    NgSwitch,
    NgSwitchCase,
    NgSwitchDefault,
    FormsModule,
    MatRadioGroup,
    MatRadioButton,
    MatSlider,
    MatFormFieldModule,
    MatInputModule,
    MatProgressBarModule,
    MatSliderThumb,
    MatButton
  ]
})
export class SurveyViewerComponent implements OnInit {
  surveyId = '';
  surveyData: any;
  currentIndex = 0;
  answers: any[] = [];
  isCompleted: boolean = false;

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.surveyId = params.get('id') || '';
      this.loadSurvey(this.surveyId);
    });
  }

  loadSurvey(id: string): void {
    this.surveyData = {
      title: 'Beispielumfrage',
      questions: [
        { title: 'Sind Sie zufrieden?', type: 'yesno' },
        { title: 'Bewerten Sie uns von 1 bis 10', type: 'slider' },
        { title: 'Warum haben Sie diese Bewertung gegeben?', type: 'freitext' }
      ]
    };
    this.answers = Array(this.surveyData.questions.length).fill(null);
  }

  get currentQuestion() {
    return this.surveyData?.questions[this.currentIndex];
  }

  weiter(): void {
    if (this.currentIndex < this.surveyData.questions.length - 1) {
      this.currentIndex++;
    }
  }

  zurueck(): void {
    if (this.currentIndex > 0) {
      this.currentIndex--;
    }
  }

  getProgress(): number {
    return ((this.currentIndex + 1) / this.surveyData.questions.length) * 100;
  }
  speichern(): void {
    console.log("Antworten: ", this.answers);
    this.isCompleted = true;

  }

}
