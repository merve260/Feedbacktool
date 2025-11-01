import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Injectable({ providedIn: 'root' })
export class LanguageService {
  constructor(private translate: TranslateService) {
    // Verfügbare Sprachen definieren und Standardsprache setzen
    // Fügt unterstützte Sprachen ('de', 'en') hinzu und legt 'de' als Standard fest.
    this.translate.addLangs(['de', 'en']);
    this.translate.setDefaultLang('de');

    // Gespeicherte Sprache aus localStorage laden oder Standard verwenden
    const browserLang = localStorage.getItem('lang') || 'de';
    this.use(browserLang);
  }

  use(lang: string) {
    // Sprache aktivieren und im localStorage speichern
    // Dadurch bleibt die gewählte Sprache auch nach einem Reload erhalten.
    this.translate.use(lang);
    localStorage.setItem('lang', lang);
  }

  currentLang(): string {
    return this.translate.currentLang;
  }
}
