import {
  Component, Input, inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Question } from '../../../../../../core/models/survey.models';
import { MatDialogModule } from '@angular/material/dialog';

@Component({
  selector: 'app-freitext-list',
  standalone: true,
  imports: [CommonModule, MatDialogModule],
  templateUrl: './freitext-list.component.html',
  styleUrls: ['./freitext-list.component.scss'],
})
export class FreiTextListComponent {

  @Input() surveyId!: string;       // ID der aktuellen Umfrage
  @Input() question?: Question;     // Aktuelle Frage (vom Typ Freitext)
  @Input() answers: { name: string; text: string }[] = []; // Antworten kommen vom Parent

}
