import {
  Component, Input, inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Question } from '../../../../../../core/models/survey.models';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { FreiTextDialogComponent } from '../chart-dialogs/frei-text-dialog.component';

@Component({
  selector: 'app-freitext-list',
  standalone: true,
  imports: [CommonModule, MatDialogModule],
  templateUrl: './freitext-list.component.html',
  styleUrls: ['./freitext-list.component.scss'],
})
export class FreiTextListComponent {
  private dialog = inject(MatDialog);

  @Input() surveyId!: string;       // ID der aktuellen Umfrage
  @Input() question?: Question;     // Aktuelle Frage (vom Typ Freitext)
  @Input() answers: { name: string; text: string }[] = []; // Antworten kommen vom Parent

  // Öffnet den Dialog mit allen Antworten
  openDialog() {
    this.dialog.open(FreiTextDialogComponent, {
      width: '90%',
      data: { title: this.question?.title, answers: this.answers }
    });
  }
}
