import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-survey-publish',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatTooltipModule, RouterModule],
  templateUrl: './survey-publish.component.html',
  styleUrls: ['./survey-publish.component.scss']
})
export class SurveyPublishComponent {
  @Input() startDate: Date | null = null;
  @Input() endDate: Date | null = null;
  @Input() canvasQuestions: any[] = [];

  copied = false;
  surveyId = Date.now().toString();
  linkVisible = false;

  getSurveyLink(): string {
    return `https://mein-umfragetool.de/umfrage/${this.surveyId}`;
  }

  isReady(): boolean {
    return !!this.startDate && !!this.endDate && this.canvasQuestions.length > 0;
  }

  publishSurvey() {
    if (this.isReady()) {
      this.linkVisible = true;

      setTimeout(() => {
        const el = document.getElementById('linkSection');
        el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }


  copyLinkToClipboard() {
    navigator.clipboard.writeText(this.getSurveyLink()).then(() => {
      this.copied = true;
      setTimeout(() => (this.copied = false), 2000);
    });
  }

  goToViewer() {
    // Örn. /survey/:id sayfasına yönlendirme
    window.open(`/survey/${this.surveyId}`, '_blank');
  }
}
