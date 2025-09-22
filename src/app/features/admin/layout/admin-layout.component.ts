import { Component, inject, HostListener } from '@angular/core';
import { Router, ActivatedRoute, NavigationEnd, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { filter, map, startWith } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { CommonModule, AsyncPipe, NgIf } from '@angular/common';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { AuthService } from '../../../core/auth/auth.service';
import { take } from 'rxjs/operators';
import { firstValueFrom } from 'rxjs';
import { LanguageService } from '../../../core/services/language.service';
import {TranslateModule} from '@ngx-translate/core';


@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [
    // Router
    RouterOutlet, RouterLink, RouterLinkActive,
    // Common
    CommonModule, AsyncPipe, NgIf,
    // Material
    MatSidenavModule, MatToolbarModule, MatIconModule,
    MatListModule, MatButtonModule, MatMenuModule, MatDividerModule, TranslateModule,
  ],
  templateUrl: './admin-layout.component.html',
  styleUrls: ['./admin-layout.component.scss'],
})
export class AdminLayoutComponent {
  public auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private languageService = inject(LanguageService);

  isMobile = window.innerWidth <= 768;
  avatar$: Observable<string | null> | null = null;
  displayName: string | null = null;
  currentLang = this.languageService.currentLang();

  constructor() {
    if (this.auth.userId) {
      this.avatar$ = this.auth.getUserAvatar(this.auth.userId);
    }
    firstValueFrom(this.auth.user$.pipe(take(1))).then(user => {
      this.displayName = user?.displayName ?? 'Gast';
    });
  }

  @HostListener('window:resize')
  onResize() {
    this.isMobile = window.innerWidth <= 768;
  }

  pageTitle$: Observable<string> = this.router.events.pipe(
    filter(e => e instanceof NavigationEnd),
    map(() => {
      let r = this.route;
      while (r.firstChild) r = r.firstChild;
      return r.snapshot.data?.['title'] ?? 'Meine Umfragen';
    }),
    startWith(this.route.snapshot.firstChild?.data?.['title'] ?? 'Meine Umfragen')
  );

  async logout(): Promise<void> {
    await this.auth.logout();
    await this.router.navigateByUrl('/login');
  }

  async changeAvatar() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.click();

    input.onchange = async () => {
      const file = input.files?.[0];
      if (file) {
        const base64 = await this.toBase64(file);
        await this.auth.uploadUserAvatarBase64(base64);
      }
    };
  }

  private toBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  }
  switchLang(lang: string) {
    this.languageService.use(lang);
    this.currentLang = lang;
  }
}
