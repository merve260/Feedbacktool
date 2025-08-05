// app.component.ts
import { Component } from '@angular/core';
import { SurveyBuilderComponent } from './features/survey/survey-builder/survey-builder.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [SurveyBuilderComponent],
  template: `<app-survey-builder></app-survey-builder>`,
})
export class AppComponent {}
