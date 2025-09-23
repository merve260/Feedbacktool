import { SurveyService } from './survey.service';
import { FirebaseSurveyAdapter } from '../../infra/firebase/firebase-survey.adapter';
import { Firestore } from '@angular/fire/firestore';

describe('SurveyService (Jest)', () => {
  let service: SurveyService;
  let backendMock: jest.Mocked<FirebaseSurveyAdapter>;
  let firestoreMock: jest.Mocked<Firestore>;

  beforeEach(() => {
    backendMock = {
      createDraft: jest.fn(),
      getById: jest.fn(),
      listByOwner: jest.fn(),
      publish: jest.fn(),
      updateSurveyWithQuestions: jest.fn(),
      getSurveyWithQuestions: jest.fn(),
      createSurveyWithQuestions: jest.fn(),
      deleteSurvey: jest.fn(),
      addQuestion: jest.fn(),
      setSurveyWithId: jest.fn(),
      submitResponse: jest.fn()
    } as any;

    firestoreMock = {} as any; // şimdilik boş, listQuestions için ayrıca mock'larız

    service = new SurveyService(backendMock, firestoreMock);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should call backend.createDraft', async () => {
    (backendMock.createDraft as jest.Mock).mockResolvedValue('123');
    const result = await service.createDraft({ title: 'Test' } as any);
    expect(result).toBe('123');
    expect(backendMock.createDraft).toHaveBeenCalledWith({ title: 'Test' });
  });

  it('should call backend.getById', async () => {
    const fakeSurvey = { id: '1', title: 'Test Survey' } as any;
    (backendMock.getById as jest.Mock).mockResolvedValue(fakeSurvey);

    const result = await service.getById('1');

    expect(result).toEqual(fakeSurvey);
    expect(backendMock.getById).toHaveBeenCalledWith('1');
  });

  it('should call backend.deleteSurvey', async () => {
    (backendMock.deleteSurvey as jest.Mock).mockResolvedValue(undefined);

    await service.deleteSurvey('1');

    expect(backendMock.deleteSurvey).toHaveBeenCalledWith('1');
  });

  it('should call backend.submitResponse', async () => {
    const payload = { name: 'Merve', answers: [] };
    (backendMock.submitResponse as jest.Mock).mockResolvedValue(undefined);

    await service.submitResponse('1', payload);

    expect(backendMock.submitResponse).toHaveBeenCalledWith('1', payload);
  });

  it('should call backend.setSurveyWithId in updateStatus', async () => {
    (backendMock.setSurveyWithId as jest.Mock).mockResolvedValue(undefined);

    await service.updateStatus('1', 'published');

    expect(backendMock.setSurveyWithId).toHaveBeenCalledWith('1', { status: 'published' });
  });
});
