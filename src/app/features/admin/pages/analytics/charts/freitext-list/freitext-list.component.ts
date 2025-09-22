import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Question } from '../../../../../../core/models/survey.models';
import { MatDialogModule } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-freitext-list',
  standalone: true,
  imports: [CommonModule, MatDialogModule, TranslateModule],
  templateUrl: './freitext-list.component.html',
  styleUrls: ['./freitext-list.component.scss'],
})
export class FreiTextListComponent {
  @Input() surveyId!: string;
  @Input() question?: Question;
  @Input() answers: { name: string; text: string }[] = [];
}
