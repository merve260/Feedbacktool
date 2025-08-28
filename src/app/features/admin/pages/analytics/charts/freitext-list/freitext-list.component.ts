import {
  Component, Input, OnInit, OnDestroy, AfterViewInit,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Firestore, collection, collectionData } from '@angular/fire/firestore';
import { Subscription } from 'rxjs';
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
export class FreiTextListComponent implements OnInit, OnDestroy {
  private firestore = inject(Firestore);
  private sub!: Subscription;
  private dialog = inject(MatDialog);

  @Input() surveyId!: string;
  @Input() question?: Question;

  answers: { name: string; text: string }[] = [];

  ngOnInit() {
    if (!this.surveyId || !this.question) return;

    const answersCol = collection(this.firestore, `umfragen/${this.surveyId}/antworten`);
    this.sub = collectionData(answersCol, { idField: 'id' }).subscribe((docs: any[]) => {
      const all: { name: string; text: string }[] = [];
      docs.forEach(doc => {
        const userName = doc.name || 'Anonym';
        (doc.answers || []).forEach((ans: any) => {
          if (ans.questionId === this.question?.id && ans.textValue) {
            all.push({ name: userName, text: ans.textValue });
          }
        });
      });
      this.answers = all;
    });
  }

  openDialog() {
    this.dialog.open(FreiTextDialogComponent, {
      width: '90%',
      data: { title: this.question?.title, answers: this.answers }
    });
  }

  ngOnDestroy() {
    if (this.sub) this.sub.unsubscribe();
  }
}
