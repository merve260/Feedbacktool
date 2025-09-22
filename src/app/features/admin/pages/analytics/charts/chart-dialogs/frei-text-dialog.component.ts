import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-frei-text-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, TranslateModule],
  template: `
    <!-- Titel der Frage -->
    <h2 mat-dialog-title>
      {{ data.title || ('results.answers' | translate) }}
    </h2>

    <!-- Inhalt: Liste der Antworten -->
    <mat-dialog-content class="dialog-content">
      <ul>
        <li *ngFor="let ans of data.answers">
          <strong>{{ ans.name }}:</strong> {{ ans.text }}
        </li>
      </ul>
    </mat-dialog-content>
  `,
  styles: [`
    .dialog-content {
      max-height: 70vh;       /* Scrollbar wenn viele Antworten */
      overflow-y: auto;
    }

    ul {
      list-style: none;       /* Keine Standard-Punkte */
      padding: 0;
      margin: 0;
    }

    li {
      border-bottom: 1px solid #eee;
      padding: 6px 0;
      font-size: 0.95rem;
      word-break: break-word;  /* Lange Texte umbrechen */

      strong {
        color: #6b4cff;       /* Name lila markieren */
      }
    }

    :host ::ng-deep .mat-mdc-dialog-container {
      max-width: 700px;
      width: 100%;
    }
  `]
})
export class FreiTextDialogComponent {
  // Daten vom Dialog (Titel + Liste der Antworten)
  data = inject<{ title: string, answers: { name: string, text: string }[] }>(MAT_DIALOG_DATA);
}
