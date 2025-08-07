import { Routes } from '@angular/router';
import { SurveyPublishComponent } from './features/survey/survey-publish/survey-publish.component';
import { SurveyViewerComponent } from './features/survey/survey-viewer/survey-viewer.component';
import { SurveyBuilderComponent } from './features/survey/survey-builder/survey-builder.component';

export const routes: Routes = [
  {
    path: '',
    component: SurveyBuilderComponent
  },
  {
    path: 'survey/publish/:id',
    component: SurveyPublishComponent
  },
  {
    path: 'survey/:id',
    component: SurveyViewerComponent
  }
];
