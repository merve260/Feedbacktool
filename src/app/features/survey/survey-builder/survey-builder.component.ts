// src/app/features/survey/survey-builder/survey-builder.component.ts
import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { Router, ActivatedRoute } from '@angular/router';

import {
  FormsModule,
  ReactiveFormsModule,
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
import { SurveyService } from '../../../core/services/survey.service';

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

  // ===== Eingangs- und Ausgangsparameter (2-Wege-Bindung) =====
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

  // ===== Verfügbare Fragetypen (Palette links) =====
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

  // Rechts im Canvas angezeigte Fragen
  canvasQuestions: any[] = [];

  // Formular für Titel + Zeitraum
  infoForm: FormGroup<{
    title: FormControl<string>;
    startDate: FormControl<Date | null>;
    endDate: FormControl<Date | null>;
    description: FormControl<string | null>;
  }>;

  isEditMode = false;              // Bearbeiten-Modus
  isSaving = false;                // Speichern-Status
  currentSurveyId: string | null = null;  // Aktuelle Umfrage-ID

  constructor(
    private dialog: MatDialog,
    private surveyService: SurveyService,
    private auth: AuthService,
    private router: Router,
    private route: ActivatedRoute,
  ) {
    // Formular initialisieren
    this.infoForm = new FormGroup({
      title: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
      startDate: new FormControl<Date | null>(null, { validators: [Validators.required] }),
      endDate: new FormControl<Date | null>(null, { validators: [Validators.required] }),
      description: new FormControl<string | null>(null)
    }, { validators: this.dateRangeValidator });
  }

  // ------------------ Lifecycle ------------------
  async ngOnInit() {
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
        // console.log('emit title ->', survey.title);
        this.descriptionChange.emit(survey.description ?? '');
        this.startDateChange.emit(survey.startAt ? new Date(survey.startAt) : undefined);
        // console.log('emit startDate ->', survey.startAt);
        this.endDateChange.emit(survey.endAt ? new Date(survey.endAt) : undefined);
        // console.log('emit endDate ->', survey.endAt);
        this.questionsChange.emit(questions ?? []);
        // console.log('emit questions ->', questions);
      }
    }
  }

  // ------------------ Hilfsfunktion: Normalisieren ------------------
  private toQuestion = (q: any): Omit<Question, 'id'> & { id?: string } => {
    const base: any = { id: q.id, type: q.type, title: q.title, text: q.text };

    if (['yesno','multiple','radio'].includes(q.type)) {
      base.options = q.options ?? q.choices ?? [];
    } else if (q.type === 'slider') {
      base.min = Number(q.min ?? 0);
      base.max = Number(q.max ?? 10);
      base.step = Number(q.step ?? 1);
      base.thumbLabel = !!(q.thumbLabel ?? q.showValue);
    } else if (q.type === 'freitext') {
      base.placeholderText = q.placeholderText ?? '';
    } else if (q.type === 'star') {
      base.maxStars = Number(q.maxStars ?? 5);
    } else if (q.type === 'date') {
      base.startPlaceholder = q.startPlaceholder ?? '';
      base.endPlaceholder   = q.endPlaceholder   ?? '';
      base.startLabel = q.startLabel ?? 'Start';
      base.endLabel   = q.endLabel   ?? 'Ende';
    } else if (q.type === 'dragdrop') {
      base.items = Array.isArray(q.items) ? q.items : (q.items ? [q.items] : []);
    }
    return base;
  };

  // ------------------ Speichern (Draft/Publish) ------------------
  async saveAs(status: SurveyStatus) {
    // console.log('SAVE survey', status, this.startDate, this.endDate);
    if (this.infoForm.invalid || this.canvasQuestions.length === 0) {
      this.infoForm.markAllAsTouched();
      alert('Bitte Titel, Zeitraum und mindestens eine Frage angeben.');
      return;
    }

    this.isSaving = true;
    try {
      const u = await firstValueFrom(this.auth.user$.pipe(take(1)));
      if (!u) { alert('Bitte einloggen.'); return; }

      const survey: Omit<Survey, 'id'> = {
        ownerId: u.uid,
        title: (this.titleCtrl.value || '').trim(),
        description: this.infoForm.controls.description.value ?? undefined,
        startAt: this.startCtrl.value ?? undefined,
        endAt:   this.endCtrl.value   ?? undefined,
        status,
      };

      const qPayload = this.canvasQuestions.map(this.toQuestion);

      if (!this.currentSurveyId) {
        const id = await this.surveyService.createSurveyWithQuestions(survey, qPayload);
        this.currentSurveyId = id;
      } else {
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

  // ------------------ Getter fürs Template ------------------
  get titleCtrl() { return this.infoForm.controls.title; }
  get startCtrl() { return this.infoForm.controls.startDate; }
  get endCtrl()   { return this.infoForm.controls.endDate; }

  get surveyTitle(): string    { return this.titleCtrl.value; }
  get startDateValue(): Date | null {
    const val = this.startCtrl.value;
    return val instanceof Date ? val : (val ? new Date(val) : null);
  }
  get endDateValue(): Date | null {
    const val = this.endCtrl.value;
    return val instanceof Date ? val : (val ? new Date(val) : null);
  }

  // ------------------ Validatoren ------------------
  private dateRangeValidator = (group: AbstractControl): ValidationErrors | null => {
    const s: Date | null = group.get('startDate')?.value ?? null;
    const e: Date | null = group.get('endDate')?.value ?? null;
    if (!s || !e) return null;
    return e >= s ? null : { dateInvalid: true };
  };

  dateFilter = (d: Date | null): boolean => {
    if (!d) return false;
    const today = new Date(); today.setHours(0,0,0,0);
    const x = new Date(d);    x.setHours(0,0,0,0);
    return x >= today;
  };

  // ------------------ Drag & Drop ------------------
  drop(event: CdkDragDrop<any[]>) {
    if (event.previousContainer === event.container) {
      moveItemInArray(this.canvasQuestions, event.previousIndex, event.currentIndex);
      this.questionsChange.emit(this.canvasQuestions);
      return;
    }
    const draggedItem = event.item.data;
    if (draggedItem.type === 'yesno')    return this.openYesNoModal(draggedItem);
    if (draggedItem.type === 'multiple') return this.openMultipleChoiceModal(draggedItem);
    if (draggedItem.type === 'date')     return this.openDateTimeModal(draggedItem);
    if (draggedItem.type === 'dragdrop') return this.openDragDropModal(draggedItem);
    if (draggedItem.type === 'freitext') return this.openFreitextModal(draggedItem);
    if (draggedItem.type === 'star')     return this.openStarRatingModal(draggedItem);
    if (draggedItem.type === 'slider')   return this.openSliderModal(draggedItem);
    if (draggedItem.type === 'radio')    return this.openRadioModal(draggedItem);

    const copiedItem = { ...draggedItem, title: draggedItem.label, editing: false };
    this.canvasQuestions.splice(event.currentIndex, 0, copiedItem);
    this.questionsChange.emit(this.canvasQuestions);
  }

  // ------------------ Modals: Neue Fragen ------------------
  openYesNoModal(q: any) {
    const ref = this.dialog.open(YesNoModalComponent, { data: { ...q, options: ['Ja','Nein'] }, disableClose: true, panelClass: 'pol-dialog' });
    ref.afterClosed().subscribe(r => { if (r) { this.canvasQuestions.push(r); this.questionsChange.emit(this.canvasQuestions); }});
  }
  openMultipleChoiceModal(q: any) {
    const ref = this.dialog.open(MultipleChoiceModalComponent, { data: { ...q, options: ['', ''] }, disableClose: true, panelClass: 'pol-dialog' });
    ref.afterClosed().subscribe(r => { if (r) { this.canvasQuestions.push(r); this.questionsChange.emit(this.canvasQuestions); }});
  }
  openDateTimeModal(q: any) {
    const ref = this.dialog.open(DateTimeModalComponent, { data: { ...q }, disableClose: true, panelClass: 'pol-dialog' });
    ref.afterClosed().subscribe(r => { if (r) { this.canvasQuestions.push({ ...q, ...r }); this.questionsChange.emit(this.canvasQuestions); }});
  }
  openDragDropModal(q: any) {
    const ref = this.dialog.open(DragDropModalComponent, { data: { ...q, items: ['Element 1','Element 2'] }, disableClose: true, panelClass: 'pol-dialog' });
    ref.afterClosed().subscribe(r => { if (r) { this.canvasQuestions.push(r); this.questionsChange.emit(this.canvasQuestions); }});
  }
  openFreitextModal(q: any) {
    const ref = this.dialog.open(FreitextModalComponent, { data: { ...q, placeholderText: '' }, disableClose: true, panelClass: 'pol-dialog' });
    ref.afterClosed().subscribe(r => { if (r) { this.canvasQuestions.push(r); this.questionsChange.emit(this.canvasQuestions); }});
  }
  openStarRatingModal(q: any) {
    const ref = this.dialog.open(StarRatingModalComponent, { data: { ...q, maxStars: 5 }, disableClose: true, panelClass: 'pol-dialog' });
    ref.afterClosed().subscribe(r => { if (r) { this.canvasQuestions.push(r); this.questionsChange.emit(this.canvasQuestions); }});
  }
  openSliderModal(q: any) {
    const ref = this.dialog.open(SkalaSliderModalComponent, { data: { ...q }, disableClose: true, panelClass: 'pol-dialog' });
    ref.afterClosed().subscribe(r => { if (r) { this.canvasQuestions.push(r); this.questionsChange.emit(this.canvasQuestions); }});
  }
  openRadioModal(q: any) {
    const ref = this.dialog.open(RadioModalComponent, { data: { ...q, options: ['Option 1','Option 2'] }, disableClose: true, panelClass: 'pol-dialog' });
    ref.afterClosed().subscribe(r => { if (r) { this.canvasQuestions.push(r); this.questionsChange.emit(this.canvasQuestions); }});
  }

  // ------------------ Frage bearbeiten ------------------
  private openDialogSame<T, D = any>(component: any, data: D) {
    return this.dialog.open<T>(component, { data, disableClose: true, panelClass: 'pol-dialog', width: 'min(92vw, 550px)' });
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

    this.openDialogSame(component, { ...q }).afterClosed().subscribe(r => {
      if (r) { this.canvasQuestions[index] = { ...this.canvasQuestions[index], ...r }; this.questionsChange.emit(this.canvasQuestions); }
    });
  }

  // ------------------ Löschen ------------------
  async onDeleteSurvey(id: string): Promise<void> {
    try {
      await this.surveyService.deleteSurvey(id);
      this.goToDashboard();
    } catch (err) {
      console.error('Fehler beim Löschen:', err);
    }
  }
  onDrop(event: CdkDragDrop<any[]>) { this.drop(event); }
  onEdit(index: number) { this.editQuestion(index); }
  onDelete(index: number) {
    this.canvasQuestions.splice(index, 1);
    this.questionsChange.emit(this.canvasQuestions);
  }

  goToDashboard(): void {
    this.router.navigateByUrl('/admin/umfragen');
  }
}
