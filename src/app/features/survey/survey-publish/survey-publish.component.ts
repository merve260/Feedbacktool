import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterModule } from '@angular/router';

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

  // ----- Helpers -----
  private startOfDay(d: Date | null | undefined): Date | null {
    if (!d) return null;
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x;
  }

  private get today(): Date {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return t;
  }

  /** Start < heute ? */
  get startInPast(): boolean {
    const s = this.startOfDay(this.startDate);
    return !!(s && s < this.today);
  }

  /** End < Start ? */
  get endBeforeStart(): boolean {
    const s = this.startOfDay(this.startDate);
    const e = this.startOfDay(this.endDate);
    return !!(s && e && e < s);
  }

  // Link
  getSurveyLink(): string {
    return `https://mein-umfragetool.de/umfrage/${this.surveyId}`;
  }

  isReady(): boolean {
    const hasDates = !!this.startDate && !!this.endDate;
    const hasQuestions = this.canvasQuestions.length > 0;
    const hasTitle = !!this.surveyTitle;

    return hasTitle && hasDates && hasQuestions;
  }


  publishSurvey(): void {
    if (!this.isReady()) return;

    this.linkVisible = true;
    setTimeout(() => {
      document.getElementById('linkSection')
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  }

  copyLinkToClipboard(): void {
    navigator.clipboard.writeText(this.getSurveyLink()).then(() => {
      this.copied = true;
      setTimeout(() => (this.copied = false), 2000);
    });
  }

  goToViewer(): void {
    window.open(`/survey/${this.surveyId}`, '_blank');
  }


  @Input() surveyTitle: string = '';

}
