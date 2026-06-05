import { Injectable, signal, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

export type LanguageCode = 'it' | 'en' | 'es' | 'fr';

export interface Language {
  code: LanguageCode;
  label: string;
  nativeLabel: string;
  flag: string;
}

export const SUPPORTED_LANGUAGES: Language[] = [
  { code: 'it', label: 'Italiano',  nativeLabel: 'Italiano',  flag: '🇮🇹' },
  { code: 'en', label: 'Inglese',   nativeLabel: 'English',   flag: '🇬🇧' },
  { code: 'es', label: 'Spagnolo',  nativeLabel: 'Español',   flag: '🇪🇸' },
  { code: 'fr', label: 'Francese',  nativeLabel: 'Français',  flag: '🇫🇷' },
];

const STORAGE_KEY = 'app_language';

@Injectable({ providedIn: 'root' })
export class LanguageService {
  private readonly translate = inject(TranslateService);

  readonly languages = SUPPORTED_LANGUAGES;
  currentLang = signal<LanguageCode>(this.loadFromStorage());

  constructor() {
    const lang = this.loadFromStorage();
    this.translate.addLangs(SUPPORTED_LANGUAGES.map(l => l.code));
    this.translate.setDefaultLang('it');
    this.translate.use(lang);
  }

  setLanguage(code: LanguageCode): void {
    if (code === this.currentLang()) return;
    this.currentLang.set(code);
    this.translate.use(code);
    this.persistToStorage(code);
    // TODO: call backend API when available
    // this.http.patch('/api/user/preferences', { language: code }).subscribe();
  }

  getCurrentLanguage(): Language {
    return SUPPORTED_LANGUAGES.find(l => l.code === this.currentLang())!;
  }

  private loadFromStorage(): LanguageCode {
    if (typeof localStorage === 'undefined') return 'it';
    const stored = localStorage.getItem(STORAGE_KEY) as LanguageCode | null;
    return stored && SUPPORTED_LANGUAGES.some(l => l.code === stored) ? stored : 'it';
  }

  private persistToStorage(code: LanguageCode): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, code);
    }
  }
}
