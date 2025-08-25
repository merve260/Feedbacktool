// src/app/features/survey/survey-builder/survey-builder.component.ts

import {Component, EventEmitter, Input, Output, OnInit} from '@angular/core';
import { CommonModule } from '@angular/common';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { Router, ActivatedRoute } from '@angular/router';

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

import { Survey, Question, SurveyStatus } from '../../../core/models/survey.models';
import { AuthService } from '../../../core/auth/auth.service';
import { take } from 'rxjs/operators';
import { firstValueFrom } from 'rxjs';
import {SurveyService} from '../../../core/services/survey.service';

@Component({
  selector: 'app-survey-builder',
  standalone: true,
  imports: [
    CommonModule,
    DragDropModule,
    FormsModule,
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
export class SurveyBuilderComponent implements OnInit {

  // ----------------------------------------------------------
  // Eingangs- und Ausgangsparameter (für 2-Wege-Bindung geeignet)
  // ----------------------------------------------------------
  @Input() surveyId?: string;

  @Input() title: string = '';
  @Output() titleChange = new EventEmitter<string>();

  @Input() description: string = '';
  @Output() descriptionChange = new EventEmitter<string>();

  @Input() startDate?: Date;
  @Output() startDateChange = new EventEmitter<Date>();

  @Input() endDate?: Date;
  @Output() endDateChange = new EventEmitter<Date>();

  @Input() questions: Question[] = [];
  @Output() questionsChange = new EventEmitter<Question[]>();

  @Input() showActions = true;

  // ----------------------------------------------------------
  // Verfügbare Fragetypen in der linken Palette
  // ----------------------------------------------------------
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

  // Fragen, die rechts im Canvas angezeigt werden
  canvasQuestions: any[] = [];

  // Oberes Formular: Titel + Zeitraum
  infoForm: FormGroup<{
    title: FormControl<string>;
    startDate: FormControl<Date | null>;
    endDate: FormControl<Date | null>;
    description: FormControl<string | null>;
  }>;

  isEditMode = false;           // Bearbeiten-Modus
  isSaving = false;             // Speichern-Status
  currentSurveyId: string | null = null;  // aktuelle Umfrage-ID

  constructor(
    private dialog: MatDialog,
    private fb: FormBuilder,
    private surveyService: SurveyService,
    private auth: AuthService,
    private router: Router,
    private route: ActivatedRoute,
  ) {
    // Formular-Initialisierung mit Validatoren
    this.infoForm = new FormGroup({
      title: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
      startDate: new FormControl<Date | null>(null, { validators: [Validators.required] }),
      endDate: new FormControl<Date | null>(null, { validators: [Validators.required] }),
      description: new FormControl<string | null>(null)
    }, { validators: this.dateRangeValidator });

  }

  // ----------------------------------------------------------
  // Lifecycle: Beim Start prüfen, ob eine bestehende Umfrage geladen werden soll
  // ----------------------------------------------------------
  async ngOnInit() {
    // Prüfen, ob eine ID in der URL steht (Edit-Modus)
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.currentSurveyId = id;
      const result = await this.surveyService.getSurveyWithQuestions(id);
      if (result) {
        const { survey, questions } = result;

        this.infoForm.patchValue({
          title:       survey.title,
          description: survey.description ?? '',
          startDate:   survey.startAt ? new Date(survey.startAt) : null,
          endDate:     survey.endAt   ? new Date(survey.endAt)   : null
        });

        this.canvasQuestions = questions ?? [];
        this.isEditMode = true;

        this.titleChange.emit(survey.title);
        //console.log('emit title ->', survey.title);
        this.descriptionChange.emit(survey.description ?? '');
        this.startDateChange.emit(survey.startAt ? new Date(survey.startAt) : undefined);
        //console.log('emit startDate ->', survey.startAt);
        this.endDateChange.emit(survey.endAt ? new Date(survey.endAt) : undefined);
        //console.log('emit endDate ->', survey.endAt);
        this.questionsChange.emit(questions ?? []);
        //console.log('emit questions ->', questions);
      }

    }
  }


  // ----------------------------------------------------------
  // Hilfsfunktion: Fragedaten normalisieren für Firestore
  // ----------------------------------------------------------
  private toQuestion = (q: any): Omit<Question, 'id'> & { id?: string } => {
    const base: any = { id: q.id, type: q.type, title: q.title, text: q.text };

    if (q.type === 'yesno' || q.type === 'multiple' || q.type === 'radio') {
      base.options = q.options ?? q.choices ?? [];
      return base;
    }

    if (q.type === 'slider') {
      const min  = q.min ?? q.minimum ?? 0;
      const max  = q.max ?? q.maximum ?? 10;
      const step = q.step ?? q.schritt ?? 1;
      base.min = Number(min);
      base.max = Number(max);
      base.step = Number(step);
      base.thumbLabel = !!(q.thumbLabel ?? q.showValue ?? q.wertAnzeige);
      return base;
    }

    if (q.type === 'freitext') {
      base.placeholderText = q.placeholderText ?? q.placeholder ?? q.placeholder_text ?? '';
      return base;
    }

    if (q.type === 'star') {
      const stars = q.maxStars ?? q.stars ?? q.max ?? 5;
      base.maxStars = Number(stars);
      return base;
    }

    if (q.type === 'date') {
      base.startPlaceholder = q.startPlaceholder ?? '';
      base.endPlaceholder   = q.endPlaceholder   ?? '';
      base.startLabel = q.startLabel ?? 'Start';
      base.endLabel   = q.endLabel   ?? 'Ende';
      return base;
    }

    if (q.type === 'dragdrop') {
      const items = q.items ?? [];
      base.items = Array.isArray(items) ? items : (items ? [items] : []);
      return base;
    }

    return base;
  };

  // ----------------------------------------------------------
  // SPEICHERN – einheitliche Methode für Draft / Publish
  // ----------------------------------------------------------
  async saveAs(status: SurveyStatus) {
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
        description: this.infoForm.controls.description.value ?? undefined,
        startAt: start,
        endAt: end,
        status,
      };

      const qPayload = this.canvasQuestions.map(this.toQuestion);

      if (!this.currentSurveyId) {
        // Neue Umfrage erstellen
        const id = await this.surveyService.createSurveyWithQuestions(survey, qPayload);
        this.currentSurveyId = id;
      } else {
        // Bestehende Umfrage aktualisieren
        await this.surveyService.updateSurveyWithQuestions(this.currentSurveyId, survey, qPayload);
      }

      alert(status === 'published' ? 'Umfrage veröffentlicht.' : 'Entwurf gespeichert.');
      await this.router.navigateByUrl('/admin/umfragen');

    } catch (e: any) {
      console.error('SAVE ERROR ->', e);
      alert('Fehler: ' + (e?.code || e?.message || e));
    } finally {
      this.isSaving = false;
    }
  }

  saveDraft() { return this.saveAs('draft'); }
  async saveAll() { return this.saveAs('draft'); }

  // ----------------------------------------------------------
  // Getter für Template
  // ----------------------------------------------------------
  get titleCtrl() { return this.infoForm.controls.title; }
  get startCtrl() { return this.infoForm.controls.startDate; }
  get endCtrl()   { return this.infoForm.controls.endDate; }

  get surveyTitle(): string    { return this.titleCtrl.value; }
  get startDateValue(): Date | null { return this.startCtrl.value; }
  get endDateValue(): Date | null   { return this.endCtrl.value; }

  // ----------------------------------------------------------
  // Validatoren
  // ----------------------------------------------------------
  private dateRangeValidator = (group: AbstractControl): ValidationErrors | null => {
    const s: Date | null = group.get('startDate')?.value ?? null;
    const e: Date | null = group.get('endDate')?.value ?? null;
    if (!s || !e) return null;
    return e >= s ? null : { dateInvalid: true };
  };

  // Nur heutiges Datum und Zukunft erlauben
  dateFilter = (d: Date | null): boolean => {
    if (!d) return false;
    const today = new Date(); today.setHours(0,0,0,0);
    const x = new Date(d);    x.setHours(0,0,0,0);
    return x >= today;
  };

  // ----------------------------------------------------------
  // Drag & Drop Logik
  // ----------------------------------------------------------
  drop(event: CdkDragDrop<any[]>) {
    if (event.previousContainer === event.container) {
      moveItemInArray(this.canvasQuestions, event.previousIndex, event.currentIndex);
      this.questionsChange.emit(this.canvasQuestions);
      return;
    }

    const draggedItem = event.item.data;
    if (draggedItem.type === 'yesno')    { this.openYesNoModal(draggedItem);    return; }
    if (draggedItem.type === 'multiple') { this.openMultipleChoiceModal(draggedItem); return; }
    if (draggedItem.type === 'date')     { this.openDateTimeModal(draggedItem); return; }
    if (draggedItem.type === 'dragdrop') { this.openDragDropModal(draggedItem); return; }
    if (draggedItem.type === 'freitext') { this.openFreitextModal(draggedItem); return; }
    if (draggedItem.type === 'star')     { this.openStarRatingModal(draggedItem); return; }
    if (draggedItem.type === 'slider')   { this.openSliderModal(draggedItem);   return; }
    if (draggedItem.type === 'radio')    { this.openRadioModal(draggedItem);    return; }

    const copiedItem = { ...draggedItem, title: draggedItem.label, editing: false };
    this.canvasQuestions.splice(event.currentIndex, 0, copiedItem);
    this.questionsChange.emit(this.canvasQuestions);
  }

  // ----------------------------------------------------------
  // Modale zum Erstellen neuer Fragen
  // ----------------------------------------------------------
  openYesNoModal(questionData: any) {
    const ref = this.dialog.open(YesNoModalComponent, {
      data: { ...questionData, options: ['Ja','Nein'] },
      disableClose: true,
      panelClass: 'pol-dialog'
    });
    ref.afterClosed().subscribe(r => {
      if (r) { this.canvasQuestions.push(r);
      //  console.log('add question ->', this.canvasQuestions);
        this.questionsChange.emit(this.canvasQuestions); }
    });
  }

  openMultipleChoiceModal(questionData: any) {
    const ref = this.dialog.open(MultipleChoiceModalComponent, {
      disableClose: true,
      panelClass: 'pol-dialog',
      data: { ...questionData, options: ['', ''] },

    });
    ref.afterClosed().subscribe(r => {
      if (r) { this.canvasQuestions.push(r); this.questionsChange.emit(this.canvasQuestions); }
    });
  }

  openDateTimeModal(questionData: any) {
    const ref = this.dialog.open(DateTimeModalComponent, {
      data: { ...questionData },
      disableClose: true,
      panelClass: 'pol-dialog'
    });
    ref.afterClosed().subscribe(r => {
      if (r) { this.canvasQuestions.push({ ...questionData, ...r }); this.questionsChange.emit(this.canvasQuestions); }
    });
  }

  openDragDropModal(questionData: any) {
    const ref = this.dialog.open(DragDropModalComponent, {
      data: { ...questionData, items: ['Element 1','Element 2'] },
      disableClose: true,
      panelClass: 'pol-dialog'
    });
    ref.afterClosed().subscribe(r => {
      if (r) { this.canvasQuestions.push(r); this.questionsChange.emit(this.canvasQuestions); }
    });
  }

  openFreitextModal(questionData: any) {
    const ref = this.dialog.open(FreitextModalComponent, {
      data: { ...questionData, placeholderText: '' },
      disableClose: true,
      panelClass: 'pol-dialog'
    });
    ref.afterClosed().subscribe(r => {
      if (r) { this.canvasQuestions.push(r); this.questionsChange.emit(this.canvasQuestions); }
    });
  }

  openStarRatingModal(questionData: any) {
    const ref = this.dialog.open(StarRatingModalComponent, {
      data: { ...questionData, maxStars: 5 },
      disableClose: true,
      panelClass: 'pol-dialog'
    });
    ref.afterClosed().subscribe(r => {
      if (r) { this.canvasQuestions.push(r); this.questionsChange.emit(this.canvasQuestions); }
    });
  }

  openSliderModal(questionData: any) {
    const ref = this.dialog.open(SkalaSliderModalComponent, {
      data: { ...questionData },
      disableClose: true,
      panelClass: 'pol-dialog'
    });
    ref.afterClosed().subscribe(r => {
      if (r) { this.canvasQuestions.push(r); this.questionsChange.emit(this.canvasQuestions); }
    });
  }

  openRadioModal(questionData: any) {
    const ref = this.dialog.open(RadioModalComponent, {
      data: { ...questionData, options: ['Option 1','Option 2'] },
      disableClose: true,
      panelClass: 'pol-dialog'
    });
    ref.afterClosed().subscribe(r => {
      if (r) { this.canvasQuestions.push(r); this.questionsChange.emit(this.canvasQuestions); }
    });
  }


  // ----------------------------------------------------------
  // Existierende Frage bearbeiten
  // ----------------------------------------------------------
  private openDialogSame<T, D = any>(component: any, data: D) {
    return this.dialog.open<T>(component, {
      data,
      disableClose: true,
      panelClass: 'pol-dialog',
      width: 'min(92vw, 550px)'});
  }

  editQuestion(index: number) {
    const q = this.canvasQuestions[index];
    const component = q.type === 'yesno' ? YesNoModalComponent :
      q.type === 'multiple' ? MultipleChoiceModalComponent :
        q.type === 'date' ? DateTimeModalComponent :
          q.type === 'dragdrop' ? DragDropModalComponent :
            q.type === 'freitext' ? FreitextModalComponent :
              q.type === 'star' ? StarRatingModalComponent :
                q.type === 'slider' ? SkalaSliderModalComponent :
                  RadioModalComponent;

    this.openDialogSame(component, { ...q })
      .afterClosed().subscribe(r => {
      if (r) { this.canvasQuestions[index] = { ...this.canvasQuestions[index], ...r }; this.questionsChange.emit(this.canvasQuestions); }
    });
  }

  // ----------------------------------------------------------
  // Löschen
  // ----------------------------------------------------------
  async onDeleteSurvey(id: string): Promise<void> {
    try {
      await this.surveyService.deleteSurvey(id);
      this.goToDashboard();
    } catch (err) {
      console.error('Fehler beim Löschen:', err);
    }
  }
  onDrop(event: CdkDragDrop<any[]>) {
    this.drop(event);
  }
  onEdit(index: number) {
    this.editQuestion(index);
  }
  onDelete(index: number) {
    this.canvasQuestions.splice(index, 1);
    this.questionsChange.emit(this.canvasQuestions);
  }

  goToDashboard(): void {
    this.router.navigateByUrl('/admin/umfragen');
  }
}
