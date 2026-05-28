import { Component } from '@angular/core';
import { AppLayoutComponent } from './components/app-layout/app-layout.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [AppLayoutComponent],
  host: { class: 'block h-full w-full' },
  template: `<app-layout/>`
})
export class AppComponent {}
