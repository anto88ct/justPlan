import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LanguageService } from './services/language.service';
import { ThemeService } from './services/theme.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  host: { class: 'block h-full w-full' },
  template: `<router-outlet/>`,
})
export class AppComponent {
  // Constructed here (root, always instantiated) so translate.use() and the
  // dark-class effect fire before any route renders — routes outside the
  // app-shell (login, onboarding) never injected these otherwise, leaving
  // TranslatePipe showing raw keys and dark mode never applying.
  private readonly languageService = inject(LanguageService);
  private readonly themeService = inject(ThemeService);
}
