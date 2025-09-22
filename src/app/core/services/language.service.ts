import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Injectable({ providedIn: 'root' })
export class LanguageService {
  constructor(private translate: TranslateService) {
    this.translate.addLangs(['de', 'en']);
    this.translate.setDefaultLang('de');

    const browserLang = localStorage.getItem('lang') || 'de';
    this.use(browserLang);
  }

  use(lang: string) {
    this.translate.use(lang);
    localStorage.setItem('lang', lang);
  }

  currentLang(): string {
    return this.translate.currentLang;
  }
}
