import { Component, inject, HostListener } from '@angular/core';
import {
  Router, ActivatedRoute, NavigationEnd,
  RouterOutlet, RouterLink, RouterLinkActive,
} from '@angular/router';
import { filter, map, startWith } from 'rxjs/operators';
import { Observable } from 'rxjs';

import { CommonModule, AsyncPipe, NgIf } from '@angular/common';

// Angular Material
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';

import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [
    // Router
    RouterOutlet, RouterLink, RouterLinkActive,
    // Common
    CommonModule, AsyncPipe, NgIf,
    // Material
    MatSidenavModule, MatToolbarModule, MatIconModule, MatListModule,
    MatButtonModule, MatMenuModule, MatDividerModule,
  ],
  templateUrl: './admin-layout.component.html',
  styleUrls: ['./admin-layout.component.scss'],
})
export class AdminLayoutComponent {
  // AuthService → für User-Infos im Template
  public auth = inject(AuthService);

  private router = inject(Router);
  private route = inject(ActivatedRoute);

  // 🔹 Flag für Responsive Sidebar (true = Mobile)
  isMobile = window.innerWidth <= 768;

  // Fenstergröße überwachen
  @HostListener('window:resize')
  onResize() {
    this.isMobile = window.innerWidth <= 768;
  }

  // Seitentitel aus den Routen-Data
  pageTitle$: Observable<string> = this.router.events.pipe(
    filter(e => e instanceof NavigationEnd),
    map(() => {
      let r = this.route;
      while (r.firstChild) r = r.firstChild;
      return r.snapshot.data?.['title'] ?? 'Meine Umfragen';
    }),
    startWith(this.route.snapshot.firstChild?.data?.['title'] ?? 'Meine Umfragen')
  );

  // Logout → zurück zur Login-Seite
  async logout(): Promise<void> {
    await this.auth.logout();
    await this.router.navigateByUrl('/login');
  }
}
