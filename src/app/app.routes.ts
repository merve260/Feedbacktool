import { Routes } from '@angular/router';

import { LoginComponent } from './features/admin/login/login.component';
import { SurveyBuilderComponent } from './features/survey/survey-builder/survey-builder.component';
import { SurveyPublishComponent } from './features/survey/survey-publish/survey-publish.component';

import { AuthGuard } from './core/auth/auth.guard';
import { UnsavedChangesGuard } from './core/guards/unsaved-changes.guard';

// Admin layout + pages
import { AdminLayoutComponent } from './features/admin/layout/admin-layout.component';
import { SurveysDashboardComponent } from './features/admin/pages/dashboard/surveys-dashboard.component';
import { ResultsAnalyticsComponent } from './features/admin/pages/analytics/results-analytics.component';
import { ProfileSettingsComponent } from './features/admin/pages/profile-settings/profile-settings.component';
import { SurveyEditComponent } from './features/survey/survey-edit/survey-edit.component';
import { SurveyAnalyticsDetailComponent } from './features/admin/pages/analytics/survey-analytics-detail/survey-analytics-detail.component';

export const routes: Routes = [

  // --- Public Route: Login ---
  { path: 'login', component: LoginComponent },

  // --- Builder & Publish (Admin only) ---
  { path: 'admin/builder/:id', canActivate: [AuthGuard], component: SurveyBuilderComponent },
  { path: 'admin/builder',     canActivate: [AuthGuard], component: SurveyBuilderComponent },
  { path: 'admin/publish/:id', canActivate: [AuthGuard], component: SurveyPublishComponent },

  // --- Admin Area with Layout and Subpages ---
  {
    path: 'admin',
    canActivate: [AuthGuard],
    component: AdminLayoutComponent,
    children: [
      { path: '', redirectTo: 'surveys', pathMatch: 'full' },

      // Dashboard: List of all surveys
      { path: 'surveys', component: SurveysDashboardComponent, data: { title: 'dashboard.pageTitle' } },

      // Edit survey
      { path: 'surveys/:id/edit', component: SurveyEditComponent, data: { title: 'survey.editTitle' } },

      // Results & Analytics
      { path: 'results', component: ResultsAnalyticsComponent, data: { title: 'results.pageTitle' } },
      { path: 'results/:id', component: SurveyAnalyticsDetailComponent, data: { title: 'results.detailTitle' } },

      // Profile settings (guard for unsaved changes)
      {
        path: 'profile',
        component: ProfileSettingsComponent,
        canDeactivate: [UnsavedChangesGuard],
        data: { title: 'profile.editTitle' }
      },
    ],
  },

  // Der Survey Viewer wird nur bei Bedarf geladen (Lazy Loading)
  {
    path: 'survey/:id',
    loadComponent: () =>
      import('./features/survey/survey-viewer/survey-viewer.component')
        .then(m => m.SurveyViewerComponent)
  },


  // --- Default start page → Dashboard ---
  { path: '', pathMatch: 'full', redirectTo: 'admin/surveys' },

  // --- Fallback: unknown routes → Dashboard ---
  { path: '**', redirectTo: 'admin/surveys' },
];
