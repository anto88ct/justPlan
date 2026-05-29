import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  host: { class: 'block h-full w-full' },
  template: `<router-outlet/>`,
})
export class AppComponent {}
