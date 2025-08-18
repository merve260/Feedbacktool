// AdminLayoutComponent
// --------------------
// Diese Shell umschließt alle Admin-Unterseiten.
// - Linke Sidenav mit Navigation (Meine Umfragen, Ergebnisse, Profil, Logout)
// - Obere Toolbar mit dynamischem Seitentitel und "Erstellen"-Button
// - <router-outlet> rendert die jeweilige Unterseite
//
// Hinweis: Der Seitentitel wird aus den Routen-Daten (data.title) des jeweils
//          tiefsten aktiven Child-Routes gelesen.

import { Component, inject } from '@angular/core';
import {
  Router,
  ActivatedRoute,
  NavigationEnd,
  RouterOutlet,
  RouterLink,
  RouterLinkActive,
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
import {MatTooltip} from '@angular/material/tooltip';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [
    // Router
    RouterOutlet, RouterLink, RouterLinkActive,
    CommonModule, AsyncPipe, NgIf,
    MatSidenavModule, MatToolbarModule, MatIconModule, MatListModule,
    MatButtonModule, MatMenuModule, MatDividerModule, MatTooltip,
  ],
  templateUrl: './admin-layout.component.html',
  styleUrls: ['./admin-layout.component.scss'],
})
export class AdminLayoutComponent {
  // AuthService öffentlich machen, damit das Template auf user$ zugreifen kann
  public auth = inject(AuthService);

  private router = inject(Router);
  private route  = inject(ActivatedRoute);
  collapsed = JSON.parse(localStorage.getItem('adminSideCollapsed') || 'false');

  toggleSide() {
    this.collapsed = !this.collapsed;
    localStorage.setItem('adminSideCollapsed', JSON.stringify(this.collapsed));
  }


  // Seitentitel: lies data.title des tiefsten aktiven Child-Routes
  pageTitle$: Observable<string> = this.router.events.pipe(
    filter(e => e instanceof NavigationEnd),
    map(() => {
      let r = this.route;
      while (r.firstChild) r = r.firstChild;
      return r.snapshot.data?.['title'] ?? 'Meine Umfragen';
    }),
    // Beim ersten Laden bereits einen Wert liefern
    startWith(this.route.snapshot.firstChild?.data?.['title'] ?? 'Meine Umfragen')
  );

  // Logout und zurück zur Login-Seite navigieren
  async logout(): Promise<void> {
    await this.auth.logout();
    await this.router.navigateByUrl('/login'); // Falls dein Login unter /admin liegt, entsprechend anpassen
  }
}
