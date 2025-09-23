import { TestBed } from '@angular/core/testing';
import { SurveyBuilderComponent } from './survey-builder.component';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { SurveyService } from '../../../core/services/survey.service';
import { AuthService } from '../../../core/auth/auth.service';
import { Router } from '@angular/router';
import { ActivatedRoute } from '@angular/router';



// Mock Services
const mockSurveyService = {
  createSurveyWithQuestions: jest.fn(),
  updateSurveyWithQuestions: jest.fn(),
  getSurveyWithQuestions: jest.fn()
};

const mockAuthService = {
  user$: of({ uid: 'test-user' })
};

const mockRouter = { navigateByUrl: jest.fn() };
const mockSnackBar = { open: jest.fn() };
const mockTranslate = {
  instant: (key: string) => key,
  addLangs: jest.fn(),
  setDefaultLang: jest.fn(),
  use: jest.fn()
};

const mockActivatedRoute = {
  snapshot: { paramMap: new Map() }
};

describe('SurveyBuilderComponent (Jest)', () => {
  let component: SurveyBuilderComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [SurveyBuilderComponent],
      providers: [
        { provide: SurveyService, useValue: mockSurveyService },
        { provide: AuthService, useValue: mockAuthService },
        { provide: Router, useValue: mockRouter },
        { provide: MatSnackBar, useValue: mockSnackBar },
        { provide: TranslateService, useValue: mockTranslate },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(SurveyBuilderComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => jest.clearAllMocks());

  //Date Validator
  it('should invalidate if endDate < startDate', () => {
    const group: any = {
      get: (key: string) =>
        key === 'startDate'
          ? { value: new Date('2025-01-10') }
          : { value: new Date('2025-01-01') }
    };
    const result = (component as any).dateRangeValidator(group);
    expect(result).toEqual({ dateInvalid: true });
  });

  // Logo Upload: Too large
  it('should show snackbar if file is too large', () => {
    const fakeFile = new File(['xxx'], 'big.png', { type: 'image/png' });
    Object.defineProperty(fakeFile, 'size', { value: 2 * 1024 * 1024 }); // 2MB

    const inputEvent = {
      target: { files: [fakeFile] }
    } as unknown as Event;

    component.onLogoSelected(inputEvent);
    expect(mockSnackBar.open).toHaveBeenCalledWith(
      'avatar.tooLarge',
      'common.ok',
      expect.any(Object)
    );
  });

  // SaveAs: should call createSurveyWithQuestions
  it('should create survey if no currentSurveyId', async () => {
    component.canvasQuestions = [
      { id: 'q1', type: 'freitext', title: 'Test', order: 0 }
    ];
    component.titleCtrl.setValue('My Survey');
    component.startCtrl.setValue(new Date());
    component.endCtrl.setValue(new Date(Date.now() + 1000000));

    (mockSurveyService.createSurveyWithQuestions as jest.Mock).mockResolvedValue('new-id');

    await component.saveAs('draft');

    expect(mockSurveyService.createSurveyWithQuestions).toHaveBeenCalled();
    expect(mockRouter.navigateByUrl).toHaveBeenCalledWith('/admin/umfragen');
  });
});
