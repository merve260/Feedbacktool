import { Routes } from '@angular/router';

import { LoginComponent } from './features/admin/login/login.component';
import { SurveyBuilderComponent } from './features/survey/survey-builder/survey-builder.component';
import { SurveyPublishComponent } from './features/survey/survey-publish/survey-publish.component';
import { SurveyViewerComponent } from './features/survey/survey-viewer/survey-viewer.component';

import { AuthGuard } from './core/auth/auth.guard';
import { UnsavedChangesGuard } from './core/guards/unsaved-changes.guard';

// Admin layout + pages
import { AdminLayoutComponent } from './features/admin/layout/admin-layout.component';
import { SurveysDashboardComponent } from './features/admin/pages/dashboard/surveys-dashboard.component';
import { ResultsAnalyticsComponent } from './features/admin/pages/analytics/results-analytics.component';
import { ProfileSettingsComponent } from './features/admin/pages/profil-settings/profile-settings.component';
import { SurveyEditComponent } from './features/survey/survey-edit/survey-edit.component';
import { SurveyAnalyticsDetailComponent } from './features/admin/pages/analytics/survey-analytics-detail/survey-analytics-detail.component';

export const routes: Routes = [

  // --- Öffentliche Routen ---
  { path: 'login', component: LoginComponent },

  // --- Survey Builder & Publish ---
  { path: 'admin/builder/:id', canActivate: [AuthGuard], component: SurveyBuilderComponent },
  { path: 'admin/builder',     canActivate: [AuthGuard], component: SurveyBuilderComponent },

  { path: 'admin/publish/:id', canActivate: [AuthGuard], component: SurveyPublishComponent },

  // --- Admin-Routen mit Layout ---
  {
    path: 'admin',
    canActivate: [AuthGuard],
    component: AdminLayoutComponent,
    children: [
      { path: '', redirectTo: 'umfragen', pathMatch: 'full' },
      { path: 'umfragen', component: SurveysDashboardComponent, data: { title: 'Meine Umfragen' } },

      // ✨ Edit
      { path: 'umfragen/:id/edit', component: SurveyEditComponent, data: { title: 'Umfrage bearbeiten' } },

      // ✨ Ergebnisse
      { path: 'ergebnisse', component: ResultsAnalyticsComponent, data: { title: 'Umfrage Ergebnisse & Analytics' } },
      { path: 'ergebnisse/:id', component: SurveyAnalyticsDetailComponent, data: { title: 'Analyse Detail' } },

      // ✨ Profil
      {
        path: 'profil',
        component: ProfileSettingsComponent,
        canDeactivate: [UnsavedChangesGuard],
        data: { title: 'Profil bearbeiten' }
      },
    ],
  },

  // --- Survey Viewer (öffentlicher Link für Teilnehmer) ---
  { path: 'survey/:id', component: SurveyViewerComponent },

  // --- Startseite → Dashboard ---
  { path: '', pathMatch: 'full', redirectTo: 'admin/umfragen' },

  // --- Fallback ---
  { path: '**', redirectTo: 'admin/umfragen' },
];
