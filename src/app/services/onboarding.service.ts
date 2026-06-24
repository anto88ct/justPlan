import { Injectable, signal } from '@angular/core';

const STORAGE_KEY = 'bnp_onboarding_complete';

@Injectable({ providedIn: 'root' })
export class OnboardingService {
  readonly isComplete = signal<boolean>(this.readFlag());

  private readFlag(): boolean {
    try {
      return localStorage.getItem(STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  }

  markComplete(): void {
    this.isComplete.set(true);
    try {
      localStorage.setItem(STORAGE_KEY, 'true');
    } catch {
      // localStorage unavailable (e.g. private mode) — gate just won't persist across sessions
    }
  }
}
