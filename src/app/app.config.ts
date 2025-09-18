// app.config.ts
import { ApplicationConfig, provideZoneChangeDetection, importProvidersFrom, LOCALE_ID } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

import { registerLocaleData } from '@angular/common';
import localeDe from '@angular/common/locales/de';

import { MAT_DATE_LOCALE, MAT_DATE_FORMATS, MatDateFormats, MatNativeDateModule } from '@angular/material/core';

// Firebase
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { provideAuth, getAuth } from '@angular/fire/auth';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';

import { environment } from '../environments/environment';

// --- i18n ---
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { HttpClient } from '@angular/common/http';

export function HttpLoaderFactory(http: HttpClient): TranslateHttpLoader {
  return new TranslateHttpLoader(http, 'assets/i18n/', '.json');
}
// --- Locale-Registrierung (Deutsch) ---
registerLocaleData(localeDe);
registerLocaleData(localeDe, 'de-DE');

// --- Datepicker-Format: dd.MM.yyyy ---
export const DE_DATE_FORMATS: MatDateFormats = {
  parse:   { dateInput: 'dd.MM.yyyy' },
  display: {
    dateInput: 'dd.MM.yyyy',
    monthYearLabel: 'MMM yyyy',
    dateA11yLabel: 'dd.MM.yyyy',
    monthYearA11yLabel: 'MMMM yyyy',
  },
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),

    // Router + HTTP
    provideRouter(routes),
    provideHttpClient(withInterceptorsFromDi()),

    // Firebase Initialisierung
    provideFirebaseApp(() => initializeApp(environment.firebase)),
    provideAuth(() => getAuth()),
    provideFirestore(() => getFirestore()),

    // Locale & Datumskonfiguration
    { provide: LOCALE_ID, useValue: 'de-DE' },
    { provide: MAT_DATE_LOCALE, useValue: 'de-DE' },
    { provide: MAT_DATE_FORMATS, useValue: DE_DATE_FORMATS },

    // Native Date-Unterstützung
    importProvidersFrom(MatNativeDateModule),

    // i18n
    importProvidersFrom(
      TranslateModule.forRoot({
        defaultLanguage: 'de',
        loader: {
          provide: TranslateLoader,
          useFactory: HttpLoaderFactory,
          deps: [HttpClient],
        },
      })
    )
  ],
};
