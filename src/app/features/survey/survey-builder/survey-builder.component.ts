import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';
import { moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule } from '@angular/material/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { YesNoModalComponent } from '../../../shared/modals/yesno-modal/yesno-modal.component';
import { MultipleChoiceModalComponent } from '../../../shared/modals/multiple-choice-modal/multiple-choice-modal.component';
import { DateTimeModalComponent } from '../../../shared/modals/datetime-modal/datetime-modal.component';
import { DragDropModalComponent } from '../../../shared/modals/drag-drop-modal/drag-drop-modal.component';
import { FreitextModalComponent } from '../../../shared/modals/freitext-modal/freitext-modal.component';
import {StarRatingModalComponent} from '../../../shared/modals/star-rating-modal/star-rating-modal.component';
import { SkalaSliderModalComponent } from '../../../shared/modals/skala-slider-modal/skala-slider-modal.component';
import { RadioModalComponent } from '../../../shared/modals/radio-modal/radio-modal.component';
import { MatSliderModule } from '@angular/material/slider';
import {SurveyPublishComponent} from '../survey-publish/survey-publish.component';



@Component({
  selector: 'app-survey-builder',
  standalone: true,
  imports: [
    CommonModule,
    DragDropModule,
    FormsModule,
    MatFormFieldModule,
    MatDatepickerModule,
    MatInputModule,
    MatNativeDateModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatSliderModule,
    YesNoModalComponent,
    MultipleChoiceModalComponent,
    DateTimeModalComponent,
    DragDropModalComponent,
    FreitextModalComponent,
    RadioModalComponent,
    SurveyPublishComponent
  ],
  templateUrl: './survey-builder.component.html',
  styleUrls: ['./survey-builder.component.scss']
})
export class SurveyBuilderComponent {
  // Verfügbare Fragetypen auf der linken Seite
  questionTypes = [
    { type: 'yesno', label: 'Ja / Nein' },
    { type: 'multiple', label: 'Mehrfachauswahl' },
    { type: 'date', label: 'Datum / Uhrzeit' },
    { type: 'dragdrop', label: 'Drag & Drop' },
    { type: 'freitext', label: 'Freitext' },
    { type: 'star', label: 'Sternebewertung' },
    { type: 'slider', label: 'Skala / Slider' },
    { type: 'radio', label: 'Radiobutton Auswahl' }
  ];

  // Fragen im rechten Canvas
  canvasQuestions: any[] = [];

  // Datumseinstellungen für Umfragelink
  startDate: Date | null = null;
  endDate: Date | null = null;
  copied: boolean = false;

  constructor(private dialog: MatDialog) {}

  // Drag & Drop Aktion
  drop(event: CdkDragDrop<any[]>) {
    if (event.previousContainer === event.container) {
      // Aynı listede sürüklendiyse: reorder
      moveItemInArray(this.canvasQuestions, event.previousIndex, event.currentIndex);
    } else {
      // Sol paletten sağa sürükleme
      const draggedItem = event.item.data;

      if (draggedItem.type === 'yesno') {
        this.openYesNoModal(draggedItem);
        return;
      }

      if (draggedItem.type === 'multiple') {
        this.openMultipleChoiceModal(draggedItem);
        return;
      }

      if (draggedItem.type === 'date') {
        this.openDateTimeModal(draggedItem);
        return;
      }

      // Drag & Drop Frage -> Modal öffnen
      if (draggedItem.type === 'dragdrop') {
        this.openDragDropModal(draggedItem);
        return;
      }

      // Freitext Frage -> Modal öffnen
      if (draggedItem.type === 'freitext') {
        this.openFreitextModal(draggedItem);
        return;
      }
      //star-rating -> Modal öffnen
      if (draggedItem.type === 'star') {
        this.openStarRatingModal(draggedItem);
        return;
      }
      //skala-slider -> Modal öffnen
      if (draggedItem.type === 'slider') {
        this.openSliderModal(draggedItem);
        return;
      }
      //radio -> Modal öffnen
      if (draggedItem.type === 'radio') {
        this.openRadioModal(draggedItem);
        return;
      }



      const copiedItem = {
        ...draggedItem,
        title: draggedItem.label,
        editing: false
      };
      this.canvasQuestions.splice(event.currentIndex, 0, copiedItem);
    }
  }

  // Ja/Nein Modal öffnen
  openYesNoModal(questionData: any) {
    const dialogRef = this.dialog.open(YesNoModalComponent, {
      width: '500px',
      data: {
        ...questionData,
        title: '',
        text: '',
        options: ['Ja', 'Nein']
      },
      disableClose: true
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) this.canvasQuestions.push(result);
    });
  }

  // Mehrfachauswahl Modal öffnen
  openMultipleChoiceModal(questionData: any) {
    const dialogRef = this.dialog.open(MultipleChoiceModalComponent, {
      width: '500px',
      data: {
        ...questionData,
        title: '',
        text: '',
        options: ['', '']
      },
      disableClose: true
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) this.canvasQuestions.push(result);
    });
  }

  // Datum / Uhrzeit Modal öffnen
  openDateTimeModal(questionData: any) {
    const dialogRef = this.dialog.open(DateTimeModalComponent, {
      width: '500px',
      data: {
        ...questionData,
        title: '',
        text: '',
        required: false
      },
      disableClose: true
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) this.canvasQuestions.push(result);
    });
  }
//Drag and Drop Modal öffnen
  openDragDropModal(questionData: any) {
    const dialogRef = this.dialog.open(DragDropModalComponent, {
      width: '500px',
      data: {
        ...questionData,
        title: '',
        text: '',
        items: ['Element 1', 'Element 2']
      },
      disableClose: true
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.canvasQuestions.push(result);
      }
    });
  }
//Freitext Modal öffnen
  openFreitextModal(questionData: any) {
    const dialogRef = this.dialog.open(FreitextModalComponent, {
      width: '500px',
      data: {
        ...questionData,
        title: '',
        text: '',
        placeholderText: ''
      },
      disableClose: true
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.canvasQuestions.push(result);
      }
    });
  }
// Star-rating modal öffnen
  openStarRatingModal(questionData: any) {
    const dialogRef = this.dialog.open(StarRatingModalComponent, {
      width: '500px',
      data: {
        ...questionData,
        title: '',
        text: '',
        maxStars: 5
      },
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.canvasQuestions.push(result);
      }
    });
  }
//Slider modal öffnen
  openSliderModal(questionData: any) {
    const dialogRef = this.dialog.open(SkalaSliderModalComponent, {
      width: '500px',
      data: {
        ...questionData,
        title: questionData?.title || '',
        text: questionData?.text || '',
        min: questionData?.min ?? 0,
        max: questionData?.max ?? 10,
        step: questionData?.step ?? 1,
        thumbLabel: questionData?.thumbLabel ?? true,
        value: questionData?.value ?? questionData?.min ?? 0
      },
      disableClose: true,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.canvasQuestions.push(result);
      }
    });
  }
  //radio modal öffnen
  openRadioModal(questionData: any) {
    const dialogRef = this.dialog.open(RadioModalComponent, {
      width: '500px',
      data: {
        ...questionData,
        title: '',
        text: '',
        options: ['Option 1', 'Option 2']
      },
      disableClose: true
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.canvasQuestions.push(result);
      }
    });
  }



  // Frage bearbeiten
  editQuestion(index: number) {
    const question = this.canvasQuestions[index];

    if (question.type === 'yesno') {
      const dialogRef = this.dialog.open(YesNoModalComponent, {
        width: '500px',
        data: { ...question },
        disableClose: true
      });
      dialogRef.afterClosed().subscribe(result => {
        if (result) this.canvasQuestions[index] = result;
      });
    }

    if (question.type === 'multiple') {
      const dialogRef = this.dialog.open(MultipleChoiceModalComponent, {
        width: '500px',
        data: { ...question },
        disableClose: true
      });
      dialogRef.afterClosed().subscribe(result => {
        if (result) this.canvasQuestions[index] = result;
      });
    }

    if (question.type === 'date') {
      const dialogRef = this.dialog.open(DateTimeModalComponent, {
        width: '500px',
        data: { ...question },
        disableClose: true
      });

      dialogRef.afterClosed().subscribe((result) => {
        if (result) {
          this.canvasQuestions[index] = result;
        }
      });
    }
    if (question.type === 'dragdrop') {
      const dialogRef = this.dialog.open(DragDropModalComponent, {
        width: '500px',
        data: { ...question },
        disableClose: true
      });

      dialogRef.afterClosed().subscribe((result) => {
        if (result) {
          this.canvasQuestions[index] = result;
        }
      });
    }

    if (question.type === 'freitext') {
      const dialogRef = this.dialog.open(FreitextModalComponent, {
        width: '500px',
        data: { ...question },
        disableClose: true
      });

      dialogRef.afterClosed().subscribe((result) => {
        if (result) {
          this.canvasQuestions[index] = result;
        }
      });
    }
    if (question.type === 'star') {
      const dialogRef = this.dialog.open(StarRatingModalComponent, {
        width: '500px',
        data: { ...question },
        disableClose: true
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          this.canvasQuestions[index] = result;
        }
      });
      return;
    }
    if (question.type === 'slider') {
      const dialogRef = this.dialog.open(SkalaSliderModalComponent, {
        width: '500px',
        data: { ...question },
        disableClose: true
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          this.canvasQuestions[index] = result;
        }
      });
      return;
    }

    if (question.type === 'radio') {
      const dialogRef = this.dialog.open(RadioModalComponent, {
        width: '500px',
        data: { ...question },
        disableClose: true
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result) this.canvasQuestions[index] = result;
      });
      return;
    }

    // Weitere Typen hier ergänzen
  }

  // Frage entfernen
  removeQuestion(index: number) {
    this.canvasQuestions.splice(index, 1);
  }

}
