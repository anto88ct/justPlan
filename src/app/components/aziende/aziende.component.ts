import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { AziendaFormComponent } from '../onboarding/azienda-form/azienda-form.component';
import { AziendaDetailComponent } from './azienda-detail/azienda-detail.component';
import { Azienda, CompanyService, NuovaAzienda, SETTORE_OPTIONS } from '../../services/company.service';

@Component({
  selector: 'app-aziende',
  standalone: true,
  host: { class: 'flex flex-col h-full overflow-hidden' },
  imports: [CommonModule, AziendaFormComponent, AziendaDetailComponent, TranslatePipe],
  styles: [`
    .azienda-card {
      transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s;
      cursor: pointer;
    }
    .azienda-card:hover { transform: translateY(-2px); }
    .azienda-card:active { transform: translateY(-2px) scale(0.99); }
  `],
  template: `
    <div class="view-enter h-full overflow-y-auto scrollbar-thin p-6 lg:p-8">
      <div class="max-w-5xl mx-auto">

        @if (selected(); as azienda) {

          <app-azienda-detail
            [azienda]="azienda"
            (saved)="onUpdated(azienda.id, $event)"
            (cancelled)="closeDetail()"
          />

        } @else if (creating()) {

          <button type="button" (click)="creating.set(false)"
                  class="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors mb-5">
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/>
            </svg>
            {{ 'aziende.backToList' | translate }}
          </button>

          <app-azienda-form
            [askHasCompany]="false"
            (completed)="onCreated($event)"
            (cancelled)="creating.set(false)"
          />

        } @else {

          <!-- Header -->
          <div class="flex items-start justify-between mb-7">
            <div>
              <p class="text-xs font-semibold text-brand-600 uppercase tracking-widest mb-1">Anagrafica</p>
              <h1 class="text-2xl font-bold text-zinc-900 dark:text-zinc-100 font-display">Le mie aziende</h1>
              <p class="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                {{ companyService.companies().length }} {{ companyService.companies().length === 1 ? 'azienda registrata' : 'aziende registrate' }}
              </p>
            </div>
            <button (click)="creating.set(true)"
                    class="flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-500
                           text-white text-sm font-semibold rounded-xl transition-all duration-200
                           hover:-translate-y-0.5 shadow-md shadow-brand-500/25 flex-shrink-0">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/>
              </svg>
              Nuova azienda
            </button>
          </div>

          @if (companyService.companies().length === 0) {
            <div class="text-center py-20">
              <div class="w-16 h-16 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mx-auto mb-4">
                <svg class="w-7 h-7 text-zinc-400 dark:text-zinc-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M3 21h18M5 21V5a2 2 0 012-2h10a2 2 0 012 2v16M9 9h1m4 0h1m-5 4h1m4 0h1m-5 4h1m4 0h1"/>
                </svg>
              </div>
              <p class="text-sm font-semibold text-zinc-600 dark:text-zinc-400 font-display mb-1">Nessuna azienda registrata</p>
              <p class="text-xs text-zinc-400 dark:text-zinc-500">Aggiungi la tua azienda per personalizzare il piano finanziario.</p>
            </div>
          } @else {
            <div class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              @for (azienda of companyService.companies(); track azienda.id; let i = $index) {
                <div class="azienda-card bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-card hover:shadow-card-hover overflow-hidden
                            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-zinc-950"
                     [style.animation-delay]="(i * 60) + 'ms'"
                     [style.view-transition-name]="'azienda-' + azienda.id"
                     style="animation: viewEnter 0.4s cubic-bezier(0.16,1,0.3,1) both;"
                     role="button"
                     tabindex="0"
                     [attr.aria-label]="azienda.nome"
                     (click)="openDetail(azienda)"
                     (keydown.enter)="openDetail(azienda)"
                     (keydown.space)="$event.preventDefault(); openDetail(azienda)">

                  <div class="px-5 pt-4 pb-3 border-b border-zinc-50 dark:border-zinc-800 flex items-start justify-between gap-3">
                    <div class="flex items-center gap-3 min-w-0">
                      <span class="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-xs font-bold text-white font-display"
                            [style.background]="settoreColor(azienda.settore)">
                        {{ settoreMonogram(azienda.settore) }}
                      </span>
                      <div class="min-w-0">
                        <p class="text-sm font-bold text-zinc-900 dark:text-zinc-100 font-display truncate">{{ azienda.nome }}</p>
                        <p class="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">{{ settoreLabel(azienda.settore) }}</p>
                      </div>
                    </div>
                    <button (click)="$event.stopPropagation(); companyService.removeCompany(azienda.id)"
                            class="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0
                                   text-zinc-300 dark:text-zinc-500 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all">
                      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
                      </svg>
                    </button>
                  </div>

                  @if (azienda.descrizione) {
                    <p class="px-5 pt-3 text-xs text-zinc-500 dark:text-zinc-400 leading-snug line-clamp-2">{{ azienda.descrizione }}</p>
                  }

                  <div class="px-5 py-3.5 flex items-center gap-1.5 flex-wrap">
                    @if (azienda.isStartup) {
                      <span class="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-brand-50 dark:bg-brand-950/40 text-brand-700 dark:text-brand-400">Startup</span>
                    }
                    @if (azienda.isInnovativa) {
                      <span class="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400">Innovativa</span>
                    }
                  </div>
                </div>
              }
            </div>
          }

        }

      </div>
    </div>
  `,
})
export class AziendeComponent {
  readonly companyService = inject(CompanyService);

  creating = signal(false);
  selected = signal<Azienda | null>(null);

  private readonly prefersReducedMotion =
    typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;

  onCreated(data: NuovaAzienda | null): void {
    if (data) this.companyService.addCompany(data);
    this.creating.set(false);
  }

  openDetail(azienda: Azienda): void {
    this.runTransition(() => this.selected.set(azienda));
  }

  closeDetail(): void {
    this.runTransition(() => this.selected.set(null));
  }

  onUpdated(id: string, data: NuovaAzienda): void {
    this.companyService.updateCompany(id, data);
    this.closeDetail();
  }

  private runTransition(mutate: () => void): void {
    const doc = document as Document & { startViewTransition?: (cb: () => void) => void };
    if (this.prefersReducedMotion || typeof doc.startViewTransition !== 'function') {
      mutate();
      return;
    }
    doc.startViewTransition(() => mutate());
  }

  settoreLabel(id: string): string {
    return SETTORE_OPTIONS.find(o => o.id === id)?.label ?? id;
  }

  settoreMonogram(id: string): string {
    return SETTORE_OPTIONS.find(o => o.id === id)?.monogram ?? '?';
  }

  settoreColor(id: string): string {
    return SETTORE_OPTIONS.find(o => o.id === id)?.color ?? '#71717a';
  }
}
