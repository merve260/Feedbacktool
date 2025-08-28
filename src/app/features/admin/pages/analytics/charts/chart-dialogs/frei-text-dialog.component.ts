import {Component, inject, Inject} from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-frei-text-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule],
  template: `
    <p></p>
    <h2 mat-dialog-title>{{ data.title }}</h2>
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
      max-height: 100%;
      overflow-y: auto;
    }

    ul {
      list-style: none;
      padding: 0;
    }

    li {
      border-bottom: 1px solid #eee;
      padding: 6px 0;
      font-size: 0.95rem;

      strong {
        color: #6b4cff;
      }
    }
  `]
})
export class FreiTextDialogComponent {
  data = inject<{ title: string, answers: { name: string, text: string }[] }>(MAT_DIALOG_DATA);
}

