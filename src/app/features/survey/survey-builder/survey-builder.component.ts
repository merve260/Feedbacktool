// src/app/features/survey/survey-builder/survey-builder.component.ts
import { Component, EventEmitter, Input, Output, OnInit,OnChanges, SimpleChanges } from '@angular/core';
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

import { MultipleChoiceModalComponent } from '../../../shared/modals/multiple-choice-modal/multiple-choice-modal.component';
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
import { ComponentType } from '@angular/cdk/overlay';


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
export class SurveyBuilderComponent implements OnInit, OnChanges {

  // Eingangs- und Ausgangsparameter für Bindung
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

  @Input() logoUrl: string | null = null;
  @Output() logoUrlChange = new EventEmitter<string | null>();

  @Input() showActions = true;


  // Fragetypen links in der Palette
  questionTypes = [
    { type: 'multiple', label: 'Mehrfachauswahl' },
    { type: 'freitext', label: 'Freitext' },
    { type: 'star',     label: 'Sternebewertung' },
    { type: 'slider',   label: 'Skala / Slider' },
    { type: 'radio',    label: 'Radiobutton Auswahl' }
  ];

  // Fragen, die im Canvas angezeigt werden
  canvasQuestions: any[] = [];

  // Formular für Titel, Beschreibung und Zeitraum
  infoForm: FormGroup<{
    title: FormControl<string>;
    startDate: FormControl<Date | null>;
    endDate: FormControl<Date | null>;
    description: FormControl<string | null>;
    logoUrl: FormControl<string | null>;
  }>;

  isEditMode = false;
  isSaving = false;
  currentSurveyId: string | null = null;

  constructor(
    private dialog: MatDialog,
    private surveyService: SurveyService,
    private auth: AuthService,
    private router: Router,
    private route: ActivatedRoute,
  ) {
    // Initialisierung des Formulars mit Validatoren
    this.infoForm = new FormGroup({
      title: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
      startDate: new FormControl<Date | null>(null, { validators: [Validators.required] }),
      endDate: new FormControl<Date | null>(null, { validators: [Validators.required] }),
      description: new FormControl<string | null>(null),
      logoUrl: new FormControl<string | null>(null)
    }, { validators: this.dateRangeValidator });
  }

  // Daten laden, wenn bereits eine Umfrage-ID existiert (Bearbeitungsmodus)
  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');

    // Nur laden, wenn NICHT von außen via @Input() geliefert
    if (id && (!this.questions || this.questions.length === 0)) {
      this.currentSurveyId = id;
      const result = await this.surveyService.getSurveyWithQuestions(id);
      if (result) {
        const { survey, questions } = result;

        this.infoForm.patchValue({
          title:       survey.title,
          description: survey.description ?? '',
          startDate:   survey.startAt ? new Date(survey.startAt) : null,
          endDate:     survey.endAt   ? new Date(survey.endAt)   : null,
          logoUrl:     survey.logoUrl ?? null
        });

        this.canvasQuestions = questions ?? [];
        this.isEditMode = true;

        this.titleChange.emit(survey.title);
        this.descriptionChange.emit(survey.description ?? '');
        this.startDateChange.emit(survey.startAt ? new Date(survey.startAt) : undefined);
        this.endDateChange.emit(survey.endAt ? new Date(survey.endAt) : undefined);
        this.questionsChange.emit(questions ?? []);
      }
    } else if (this.questions?.length) {
      // Falls Input schon Fragen liefert → Canvas direkt übernehmen
      this.canvasQuestions = [...this.questions];
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['questions'] && changes['questions'].currentValue) {
      console.log("Builder ngOnChanges questions:", this.questions.map(q => q.order));
      // Externe questions übernehmen und Canvas aktualisieren
      this.canvasQuestions = [...this.questions];
    }
  }

  // Hilfsfunktion: konvertiert ein Objekt in ein gültiges Question-Format
  private toQuestion = (q: any): Omit<Question, 'id'> & { id?: string } => {
    const base: any = { id: q.id, type: q.type, title: q.title, text: q.text };

    if (['multiple','radio'].includes(q.type)) {
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
    }
    base.order = q.order ?? 0;
    return base;
  };
  onLogoSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        const value = reader.result as string;
        console.log("Selected logo:", value.substring(0,50));

        this.infoForm.controls.logoUrl.setValue(value);

        this.logoUrl = value;
        this.logoUrlChange.emit(value);
      };
      reader.readAsDataURL(file);
    }
  }

  removeLogo() {
    this.infoForm.controls.logoUrl.setValue(null);

    this.logoUrl = null;
    this.logoUrlChange.emit(null);
  }

  // Speichern als Draft oder Publish
  async saveAs(status: SurveyStatus) {
    console.log("Survey payload", this.canvasQuestions.map(this.toQuestion));
    if (this.infoForm.invalid || this.canvasQuestions.length === 0) {
      this.infoForm.markAllAsTouched();
      alert('Bitte Titel, Zeitraum und mindestens eine Frage angeben.');
      return;
    }

    this.isSaving = true;
    try {
      const u = await firstValueFrom(this.auth.user$.pipe(take(1)));
      if (!u) { alert('Bitte einloggen.'); return; }
      console.log("LogoUrl saving:", this.infoForm.controls.logoUrl.value);

      const survey: Omit<Survey, 'id'> = {
        ownerId: u.uid,
        title: (this.titleCtrl.value || '').trim(),
        description: this.infoForm.controls.description.value ?? undefined,
        startAt: this.startCtrl.value ?? undefined,
        endAt:   this.endCtrl.value   ?? undefined,
        status,
        logoUrl: this.logoUrl ?? this.infoForm.controls.logoUrl.value ?? null
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

  // Getter fürs Template
  get titleCtrl() { return this.infoForm.controls.title; }
  get startCtrl() { return this.infoForm.controls.startDate; }
  get endCtrl()   { return this.infoForm.controls.endDate; }

  // Validator für das Start-/Enddatum
  private dateRangeValidator = (group: AbstractControl): ValidationErrors | null => {
    const s: Date | null = group.get('startDate')?.value ?? null;
    const e: Date | null = group.get('endDate')?.value ?? null;
    if (!s || !e) return null;
    return e >= s ? null : { dateInvalid: true };
  };

  // Drag & Drop von Fragetypen
  onDrop(event: CdkDragDrop<any[]>) {
    if (event.previousContainer === event.container) {
      moveItemInArray(this.canvasQuestions, event.previousIndex, event.currentIndex);
      this.canvasQuestions.forEach((q, idx) => {
        q.order = idx;
      });

      this.questionsChange.emit(this.canvasQuestions);
      return;
    }
    const draggedItem = event.item.data;

    if (draggedItem.type === 'multiple') return this.openMultipleChoiceModal(draggedItem);
    if (draggedItem.type === 'freitext') return this.openFreitextModal(draggedItem);
    if (draggedItem.type === 'star')     return this.openStarRatingModal(draggedItem);
    if (draggedItem.type === 'slider')   return this.openSliderModal(draggedItem);
    if (draggedItem.type === 'radio')    return this.openRadioModal(draggedItem);

    const copiedItem = { ...draggedItem, title: draggedItem.label, editing: false };
    this.canvasQuestions.splice(event.currentIndex, 0, {
      ...copiedItem,
      order: event.currentIndex
    });
    this.canvasQuestions.forEach((q, idx) => {
      q.order = idx;
    });
    this.questionsChange.emit(this.canvasQuestions);
  }

  // Öffnet ein Modal für jede Fragetyp-Erstellung
  openMultipleChoiceModal(q: any) {
    const ref = this.dialog.open(MultipleChoiceModalComponent, { data: { ...q, options: ['', ''] }, disableClose: true, panelClass: 'pol-dialog' });
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

  // Bestehende Frage bearbeiten
  onEdit(index: number) {
    const q = this.canvasQuestions[index];
    const component: ComponentType<any> =
      q.type === 'multiple' ? MultipleChoiceModalComponent :
        q.type === 'freitext' ? FreitextModalComponent :
          q.type === 'star'     ? StarRatingModalComponent :
            q.type === 'slider'   ? SkalaSliderModalComponent :
              RadioModalComponent;

    this.dialog.open(component, {
      data: { ...q },
      disableClose: true,
      panelClass: 'pol-dialog'
    }).afterClosed().subscribe(r => {
      if (r) {
        this.canvasQuestions[index] = { ...this.canvasQuestions[index], ...r };
        this.questionsChange.emit(this.canvasQuestions);
      }
    });
  }

  // Nur heutiges oder zukünftiges Datum erlaubt
  dateFilter: (d: Date | null) => boolean = (d: Date | null) => {
    if (!d) return false;
    const today = new Date(); today.setHours(0,0,0,0);
    const x = new Date(d);    x.setHours(0,0,0,0);
    return x >= today;
  };

  get startDateValue(): Date | null {
    const val = this.startCtrl.value;
    return val instanceof Date ? val : (val ? new Date(val) : null);
  }

  get endDateValue(): Date | null {
    const val = this.endCtrl.value;
    return val instanceof Date ? val : (val ? new Date(val) : null);
  }

  // Löscht eine Frage aus dem Canvas
  onDelete(index: number) {
    this.canvasQuestions.splice(index, 1);
    this.questionsChange.emit(this.canvasQuestions);
  }

  // Navigation zurück zum Dashboard
  goToDashboard(): void {
    this.router.navigateByUrl('/admin/umfragen');
  }
}
