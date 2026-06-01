import { Injectable, signal, effect } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  dark = signal<boolean>(
    typeof localStorage !== 'undefined'
      ? localStorage.getItem('theme') === 'dark'
      : false
  );

  constructor() {
    this.applyTheme(this.dark());
    effect(() => this.applyTheme(this.dark()));
  }

  toggle(): void {
    this.dark.update(v => !v);
    // Apply synchronously so DOM/localStorage are updated immediately,
    // regardless of when the effect() scheduler fires in test environments.
    this.applyTheme(this.dark());
  }

  private applyTheme(isDark: boolean): void {
    document.documentElement.classList.toggle('dark', isDark);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('theme', isDark ? 'dark' : 'light');
    }
  }
}
