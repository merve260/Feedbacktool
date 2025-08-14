import { Routes } from '@angular/router';

import { LoginComponent } from './features/admin/login/login.component';
import { SurveyBuilderComponent } from './features/survey/survey-builder/survey-builder.component';
import { SurveyPublishComponent } from './features/survey/survey-publish/survey-publish.component';
import { SurveyViewerComponent } from './features/survey/survey-viewer/survey-viewer.component';

import { AuthGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  // Admin
  { path: 'admin', component: LoginComponent },                       // Login
  { path: 'admin/builder', canActivate: [AuthGuard], component: SurveyBuilderComponent },
  { path: 'admin/publish/:id', canActivate: [AuthGuard], component: SurveyPublishComponent },

  // Teilnehmer
  { path: 'survey/:id', component: SurveyViewerComponent },

  // Defaults
  { path: '', redirectTo: 'admin', pathMatch: 'full' },
  { path: '**', redirectTo: 'admin' }
];
