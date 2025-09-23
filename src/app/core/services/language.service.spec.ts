import { LanguageService } from './language.service';
import { TranslateService } from '@ngx-translate/core';

describe('LanguageService (Jest)', () => {
  let service: LanguageService;
  let translateMock: jest.Mocked<TranslateService>;
  let store: Record<string, string>;

  beforeEach(() => {
    store = {};

    // localStorage tamamen mocklanıyor
    const localStorageMock = {
      getItem: jest.fn((key: string) => store[key] ?? null),
      setItem: jest.fn((key: string, value: string) => {
        store[key] = value;
      }),
    };

    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true,
    });

    // TranslateService mock
    translateMock = {
      addLangs: jest.fn(),
      setDefaultLang: jest.fn(),
      use: jest.fn(),
      currentLang: 'de',
    } as any;

    service = new LanguageService(translateMock);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should initialize with default languages and default lang', () => {
    expect(translateMock.addLangs).toHaveBeenCalledWith(['de', 'en']);
    expect(translateMock.setDefaultLang).toHaveBeenCalledWith('de');
    expect(translateMock.use).toHaveBeenCalledWith('de');
  });

  it('should call translate.use and set localStorage when use() is called', () => {
    service.use('en');
    expect(translateMock.use).toHaveBeenCalledWith('en');
    expect(window.localStorage.setItem).toHaveBeenCalledWith('lang', 'en');
    expect(window.localStorage.getItem('lang')).toBe('en');
  });

  it('should return current language', () => {
    translateMock.currentLang = 'en';
    expect(service.currentLang()).toBe('en');
  });
});
