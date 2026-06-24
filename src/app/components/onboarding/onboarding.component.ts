import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AziendaFormComponent } from './azienda-form/azienda-form.component';
import { CompanyService, NuovaAzienda } from '../../services/company.service';
import { OnboardingService } from '../../services/onboarding.service';

@Component({
  selector: 'app-onboarding',
  standalone: true,
  imports: [AziendaFormComponent],
  styles: [`
    :host { display: block; min-height: 100vh; }
  `],
  template: `
    <div class="min-h-screen w-full bg-zinc-50 dark:bg-zinc-950 flex flex-col">

      <!-- Top bar -->
      <div class="px-6 lg:px-10 py-5 flex items-center">
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
               style="background: linear-gradient(135deg, #6366f1, #8b5cf6);">
            <svg class="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
            </svg>
          </div>
          <span class="text-base font-bold text-zinc-900 dark:text-zinc-100 font-display tracking-tight">Businext Plan</span>
        </div>
      </div>

      <!-- Content -->
      <div class="flex-1 flex items-start justify-center px-6 pb-16 pt-4 lg:pt-10">
        <div class="w-full max-w-2xl">
          <app-azienda-form
            [askHasCompany]="true"
            (completed)="onCompleted($event)"
          />
        </div>
      </div>

    </div>
  `,
})
export class OnboardingComponent {
  private readonly router = inject(Router);
  private readonly companyService = inject(CompanyService);
  private readonly onboardingService = inject(OnboardingService);

  onCompleted(data: NuovaAzienda | null): void {
    if (data) {
      this.companyService.addCompany(data);
    }
    this.onboardingService.markComplete();
    this.router.navigate(['/app']);
  }
}
