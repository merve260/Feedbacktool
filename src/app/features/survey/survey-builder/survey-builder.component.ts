import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';

import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  Validators,
  AbstractControl,
  ValidationErrors,
  FormGroup,
  FormControl
} from '@angular/forms';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSliderModule } from '@angular/material/slider';

import { YesNoModalComponent } from '../../../shared/modals/yesno-modal/yesno-modal.component';
import { MultipleChoiceModalComponent } from '../../../shared/modals/multiple-choice-modal/multiple-choice-modal.component';
import { DateTimeModalComponent } from '../../../shared/modals/datetime-modal/datetime-modal.component';
import { DragDropModalComponent } from '../../../shared/modals/drag-drop-modal/drag-drop-modal.component';
import { FreitextModalComponent } from '../../../shared/modals/freitext-modal/freitext-modal.component';
import { StarRatingModalComponent } from '../../../shared/modals/star-rating-modal/star-rating-modal.component';
import { SkalaSliderModalComponent } from '../../../shared/modals/skala-slider-modal/skala-slider-modal.component';
import { RadioModalComponent } from '../../../shared/modals/radio-modal/radio-modal.component';
import { SurveyPublishComponent } from '../survey-publish/survey-publish.component';
import { FirebaseSurveyService } from '../../../core/services/firebase-survey.service';
import { Survey, Question } from '../../../core/models/survey.models';
import {AuthService} from '../../../core/auth/auth.service';
import {take} from 'rxjs/operators';
import {firstValueFrom} from 'rxjs';

@Component({
  selector: 'app-survey-builder',
  standalone: true,
  imports: [
    CommonModule,
    DragDropModule,
    FormsModule,             // optional (falls irgendwo noch ngModel genutzt wird)
    ReactiveFormsModule,
    MatFormFieldModule,
    MatDatepickerModule,
    MatInputModule,
    MatNativeDateModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatSliderModule,
    SurveyPublishComponent
  ],

  templateUrl: './survey-builder.component.html',
  styleUrls: ['./survey-builder.component.scss']
})
export class SurveyBuilderComponent {

  // --- Linke Palette: verfügbare Fragetypen ---
  questionTypes = [
    { type: 'yesno',    label: 'Ja / Nein' },
    { type: 'multiple', label: 'Mehrfachauswahl' },
    { type: 'date',     label: 'Datum / Uhrzeit' },
    { type: 'dragdrop', label: 'Drag & Drop' },
    { type: 'freitext', label: 'Freitext' },
    { type: 'star',     label: 'Sternebewertung' },
    { type: 'slider',   label: 'Skala / Slider' },
    { type: 'radio',    label: 'Radiobutton Auswahl' }
  ];

  // --- Rechte Seite (Canvas): aktuell hinzugefügte Fragen ---
  canvasQuestions: any[] = [];

  // --- Oberes Info-Formular: NUR Titel + Zeitraum (Hinweis ist statischer Text) ---
  infoForm: FormGroup<{
    title: FormControl<string>;
    startDate: FormControl<Date | null>;
    endDate: FormControl<Date | null>;
  }>;

  constructor( private dialog: MatDialog,
               private fb: FormBuilder,
               private fbSurvey: FirebaseSurveyService,
               private auth: AuthService) {
    this.infoForm = this.fb.group(
      {
        // Titel ist Pflichtfeld
        title: this.fb.nonNullable.control<string>('', { validators: [Validators.required] }),
        // Date-Range (beide Pflicht)
        startDate: this.fb.control<Date | null>(null, { validators: [Validators.required] }),
        endDate:   this.fb.control<Date | null>(null, { validators: [Validators.required] }),
      },
      { validators: this.dateRangeValidator }   // Enddatum >= Startdatum
    );
  }
  isSaving = false;

  async saveAll() {
    if (this.infoForm.invalid || this.canvasQuestions.length === 0) {
      this.infoForm.markAllAsTouched();
      alert('Bitte Titel, Zeitraum und mindestens eine Frage angeben.');
      return;
    }

    this.isSaving = true;
    try {
      const u = await firstValueFrom(this.auth.user$.pipe(take(1)));
      if (!u) { alert('Bitte einloggen.'); return; }

      const title = (this.titleCtrl.value || '').trim();
      const start = this.startCtrl.value!;
      const end   = this.endCtrl.value!;

      const survey: Omit<Survey, 'id'> = {
        ownerId: u.uid,
        title,
        description: undefined,
        startAt: start,
        endAt: end,
        status: 'draft',
      };

      // Modal verisini Question modeline map et
      const toQuestion = (q: any): Omit<Question, 'id'> => {
        const base = { type: q.type, title: q.title, text: q.text } as Omit<Question,'id'>;
        if (q.type === 'yesno' || q.type === 'multiple' || q.type === 'radio') {
          return { ...base, options: q.options ?? [] };
        }
        if (q.type === 'slider') {
          return { ...base, min: q.min ?? 0, max: q.max ?? 10, step: q.step ?? 1 };
        }
        return base; // star/date/dragdrop/freitext için şimdilik yeterli
      };

      // (İstersen sırayı da kaydetmek için: map((q,i)=>({...toQuestion(q), order: i+1})))
      const questions: Omit<Question, 'id'>[] = this.canvasQuestions.map(toQuestion);

      // Tek çağrıda anket + sorular
      const surveyId = await this.fbSurvey.createSurveyWithQuestions(survey, questions);

      alert('Umfrage gespeichert. (ID: ' + surveyId + ')');
      console.log('Gespeichert:', surveyId);
    } catch (e: any) {
      console.error('SAVE ERROR -> code:', e?.code, 'message:', e?.message, 'raw:', e);
      alert('Fehler: ' + (e?.code || e?.message || e));
    } finally {
      this.isSaving = false;
    }
  }


  // --- Komfort-Getter für Template ---
  get titleCtrl() { return this.infoForm.controls.title; }
  get startCtrl() { return this.infoForm.controls.startDate; }
  get endCtrl()   { return this.infoForm.controls.endDate; }

  // --- Kompatibel zu <app-survey-publish> ---
  get surveyTitle(): string    { return this.titleCtrl.value; }
  get startDate(): Date | null { return this.startCtrl.value; }
  get endDate(): Date | null   { return this.endCtrl.value; }

  // --- Custom-Validator: Enddatum darf nicht vor Startdatum liegen ---
  private dateRangeValidator = (group: AbstractControl): ValidationErrors | null => {
    const s: Date | null = group.get('startDate')?.value ?? null;
    const e: Date | null = group.get('endDate')?.value ?? null;
    if (!s || !e) return null;
    const s0 = new Date(s); s0.setHours(0,0,0,0);
    const e0 = new Date(e); e0.setHours(0,0,0,0);
    return e0 >= s0 ? null : { dateInvalid: true };
  };

  // --- Optionaler Filter: nur heutige/ zukünftige Tage ---
  // WICHTIG: Beim Date-Range gehört der Filter auf <mat-date-range-input [dateFilter]>
  dateFilter = (d: Date | null): boolean => {
    if (!d) return false;
    const today = new Date(); today.setHours(0,0,0,0);
    const x = new Date(d);    x.setHours(0,0,0,0);
    return x >= today;
  };

  // --- Drag & Drop Logik ---
  drop(event: CdkDragDrop<any[]>) {
    // Reordering im Canvas
    if (event.previousContainer === event.container) {
      moveItemInArray(this.canvasQuestions, event.previousIndex, event.currentIndex);
      return;
    }

    // Aus der Palette auf den Canvas gezogen → passenden Dialog öffnen
    const draggedItem = event.item.data;

    if (draggedItem.type === 'yesno')    { this.openYesNoModal(draggedItem);    return; }
    if (draggedItem.type === 'multiple') { this.openMultipleChoiceModal(draggedItem); return; }
    if (draggedItem.type === 'date')     { this.openDateTimeModal(draggedItem); return; }
    if (draggedItem.type === 'dragdrop') { this.openDragDropModal(draggedItem); return; }
    if (draggedItem.type === 'freitext') { this.openFreitextModal(draggedItem); return; }
    if (draggedItem.type === 'star')     { this.openStarRatingModal(draggedItem); return; }
    if (draggedItem.type === 'slider')   { this.openSliderModal(draggedItem);   return; }
    if (draggedItem.type === 'radio')    { this.openRadioModal(draggedItem);    return; }

    // Fallback: einfache Kopie einfügen
    const copiedItem = { ...draggedItem, title: draggedItem.label, editing: false };
    this.canvasQuestions.splice(event.currentIndex, 0, copiedItem);
  }

  // --- Dialog-Öffner ---
  openYesNoModal(questionData: any) {
    const ref = this.dialog.open(YesNoModalComponent, {
      width: '720px',
      maxWidth: '92vw',
      panelClass: 'pol-dialog',
      backdropClass: 'pol-backdrop',
      data: { ...questionData, title: '', text: '', options: ['Ja', 'Nein'] },
      disableClose: true
    });
    ref.afterClosed().subscribe(r => { if (r) this.canvasQuestions.push(r); });
  }

  openMultipleChoiceModal(questionData: any) {
    const ref = this.dialog.open(MultipleChoiceModalComponent, {
      width: '720px',
      maxWidth: '92vw',
      panelClass: 'pol-dialog',
      backdropClass: 'pol-backdrop',
      data: { ...questionData, title: '', text: '', options: ['', ''] },
      disableClose: true
    });
    ref.afterClosed().subscribe(r => { if (r) this.canvasQuestions.push(r); });
  }

  openDateTimeModal(questionData: any) {
    const ref = this.dialog.open(DateTimeModalComponent, {
      width: '720px',
      maxWidth: '92vw',
      panelClass: 'pol-dialog',
      backdropClass: 'pol-backdrop',
      data: { ...questionData, title: '', text: '', required: false },
      disableClose: true
    });
    ref.afterClosed().subscribe(r => { if (r) this.canvasQuestions.push(r); });
  }

  openDragDropModal(questionData: any) {
    const ref = this.dialog.open(DragDropModalComponent, {
      width: '720px',
      maxWidth: '92vw',
      panelClass: 'pol-dialog',
      backdropClass: 'pol-backdrop',
      data: { ...questionData, title: '', text: '', items: ['Element 1', 'Element 2'] },
      disableClose: true
    });
    ref.afterClosed().subscribe(r => { if (r) this.canvasQuestions.push(r); });
  }

  openFreitextModal(questionData: any) {
    const ref = this.dialog.open(FreitextModalComponent, {
      width: '720px',
      maxWidth: '92vw',
      panelClass: 'pol-dialog',
      backdropClass: 'pol-backdrop',
      data: { ...questionData, title: '', text: '', placeholderText: '' },
      disableClose: true
    });
    ref.afterClosed().subscribe(r => { if (r) this.canvasQuestions.push(r); });
  }

  openStarRatingModal(questionData: any) {
    const ref = this.dialog.open(StarRatingModalComponent, {
      width: '720px',
      maxWidth: '92vw',
      panelClass: 'pol-dialog',
      backdropClass: 'pol-backdrop',
      data: { ...questionData, title: '', text: '', maxStars: 5 },
      disableClose: true
    });
    ref.afterClosed().subscribe(r => { if (r) this.canvasQuestions.push(r); });
  }

  openSliderModal(questionData: any) {
    const ref = this.dialog.open(SkalaSliderModalComponent, {
      width: '720px',
      maxWidth: '92vw',
      panelClass: 'pol-dialog',
      backdropClass: 'pol-backdrop',
      data: {
        ...questionData,
        title: questionData?.title || '',
        text:  questionData?.text  || '',
        min:   questionData?.min  ?? 0,
        max:   questionData?.max  ?? 10,
        step:  questionData?.step ?? 1,
        thumbLabel: questionData?.thumbLabel ?? true,
        value: questionData?.value ?? questionData?.min ?? 0
      },
      disableClose: true
    });
    ref.afterClosed().subscribe(r => { if (r) this.canvasQuestions.push(r); });
  }

  openRadioModal(questionData: any) {
    const ref = this.dialog.open(RadioModalComponent, {
      width: '720px',
      maxWidth: '92vw',
      panelClass: 'pol-dialog',
      backdropClass: 'pol-backdrop',
      data: { ...questionData, title: '', text: '', options: ['Option 1', 'Option 2'] },
      disableClose: true
    });
    ref.afterClosed().subscribe(r => { if (r) this.canvasQuestions.push(r); });
  }
  // === Gemeinsame Dialog-Optionen (Create + Edit) ===
  private openDialogSame<T, D = any>(component: any, data: D) {
    return this.dialog.open<T>(component, {
      width: '720px',
      maxWidth: '92vw',
      panelClass: 'pol-dialog',
      backdropClass: 'pol-backdrop',
      data,
      disableClose: true
    });
  }


  // --- Bearbeiten / Entfernen ---
  editQuestion(index: number) {
    const q = this.canvasQuestions[index];

    if (q.type === 'yesno') {
      this.openDialogSame(YesNoModalComponent, { ...q })
        .afterClosed().subscribe(r => { if (r) this.canvasQuestions[index] = r; });
      return;
    }

    if (q.type === 'multiple') {
      this.openDialogSame(MultipleChoiceModalComponent, { ...q })
        .afterClosed().subscribe(r => { if (r) this.canvasQuestions[index] = r; });
      return;
    }

    if (q.type === 'date') {
      this.openDialogSame(DateTimeModalComponent, { ...q })
        .afterClosed().subscribe(r => { if (r) this.canvasQuestions[index] = r; });
      return;
    }

    if (q.type === 'dragdrop') {
      this.openDialogSame(DragDropModalComponent, { ...q })
        .afterClosed().subscribe(r => { if (r) this.canvasQuestions[index] = r; });
      return;
    }

    if (q.type === 'freitext') {
      this.openDialogSame(FreitextModalComponent, { ...q })
        .afterClosed().subscribe(r => { if (r) this.canvasQuestions[index] = r; });
      return;
    }

    if (q.type === 'star') {
      this.openDialogSame(StarRatingModalComponent, { ...q })
        .afterClosed().subscribe(r => { if (r) this.canvasQuestions[index] = r; });
      return;
    }

    if (q.type === 'slider') {
      this.openDialogSame(SkalaSliderModalComponent, { ...q })
        .afterClosed().subscribe(r => { if (r) this.canvasQuestions[index] = r; });
      return;
    }

    if (q.type === 'radio') {
      this.openDialogSame(RadioModalComponent, { ...q })
        .afterClosed().subscribe(r => { if (r) this.canvasQuestions[index] = r; });
      return;
    }
  }


  removeQuestion(index: number) {
    this.canvasQuestions.splice(index, 1);
  }
}
