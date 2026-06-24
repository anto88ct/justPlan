import { Component, EventEmitter, Input, OnInit, Output, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { Azienda, NuovaAzienda, SETTORE_OPTIONS, Settore, SettoreOption } from '../../../services/company.service';

@Component({
  selector: 'app-azienda-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  styles: [`
    .field-input {
      transition: border-color 0.15s, box-shadow 0.15s, background-color 0.15s;
    }
    .field-input:focus {
      border-color: #6366f1;
      box-shadow: 0 0 0 3px rgba(99,102,241,0.14);
      outline: none;
    }
    :host-context(.dark) .field-input {
      background: #18181b;
      border-color: #3f3f46;
      color: #f4f4f5;
    }
    :host-context(.dark) .field-input::placeholder { color: #52525b; }
    :host-context(.dark) .field-input:focus {
      background: #27272a;
      border-color: #818cf8;
      box-shadow: 0 0 0 3px rgba(99,102,241,0.18);
    }

    .pick-card {
      transition: border-color 0.15s, background-color 0.15s, box-shadow 0.15s, transform 0.15s;
    }
    .pick-card:hover { transform: translateY(-2px); }
    .pick-card:active { transform: translateY(-2px) scale(0.98); }
    .icon-chip { transition: transform 0.3s cubic-bezier(0.22, 1, 0.36, 1), background 0.2s; }
    .pick-card:hover .icon-chip { transform: scale(1.08); }

    @keyframes fieldIn {
      from { opacity: 0; transform: translateY(10px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .field-in {
      animation: fieldIn 0.36s cubic-bezier(0.25, 1, 0.5, 1) both;
      animation-delay: calc(var(--i, 0) * 60ms);
    }

    @keyframes checkPop {
      from { opacity: 0; transform: scale(0.4); }
      to   { opacity: 1; transform: scale(1); }
    }
    .check-pop { display: inline-flex; animation: checkPop 0.22s cubic-bezier(0.16, 1, 0.3, 1) both; }
    .corner-check { animation: checkPop 0.22s cubic-bezier(0.16, 1, 0.3, 1) both; }

    @keyframes selectPop {
      0%   { transform: scale(0.94); }
      55%  { transform: scale(1.035); }
      100% { transform: scale(1); }
    }
    .is-selected { animation: selectPop 0.3s cubic-bezier(0.16, 1, 0.3, 1) both; }

    .seg-thumb {
      transition: transform 0.22s cubic-bezier(0.25, 1, 0.5, 1);
    }

    .cta-submit {
      transition: background-color 0.2s ease-out, transform 0.2s, box-shadow 0.2s;
    }

    @keyframes viewEnter {
      from { opacity: 0; transform: translateY(16px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .detail-enter { animation: viewEnter 0.4s cubic-bezier(0.16, 1, 0.3, 1) both; }

    @media (prefers-reduced-motion: reduce) {
      .field-in, .check-pop, .corner-check, .is-selected, .detail-enter {
        animation: none !important; opacity: 1 !important; transform: none !important;
      }
      .pick-card:hover, .pick-card:active, .pick-card:hover .icon-chip {
        transform: none !important;
      }
      .seg-thumb, .cta-submit {
        transition: none !important;
      }
    }
  `],
  template: `
    <div class="font-body" [class.detail-enter]="!supportsViewTransition">

      <button type="button" (click)="cancelled.emit()"
              class="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors mb-5">
        <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/>
        </svg>
        {{ 'aziende.backToList' | translate }}
      </button>

      <div class="flex items-center gap-3 mb-8" [style.view-transition-name]="'azienda-' + azienda.id">
        <span class="icon-chip w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 text-sm font-bold text-white font-display"
              [style.background]="settoreColor()">
          {{ settoreMonogram() }}
        </span>
        <div class="min-w-0">
          <p class="text-xs font-semibold text-brand-600 dark:text-brand-400 uppercase tracking-widest mb-0.5">{{ 'aziende.detail.eyebrow' | translate }}</p>
          <h1 class="text-2xl font-bold text-zinc-900 dark:text-zinc-100 font-display text-balance truncate">{{ nome() || azienda.nome }}</h1>
        </div>
      </div>

      <div class="max-w-xl space-y-8">

        <section class="space-y-4">
          <p class="text-xs font-semibold text-brand-600 dark:text-brand-400 uppercase tracking-widest">{{ 'onboarding.azienda.steps.basics.label' | translate }}</p>

          <div class="field-in" style="--i: 0">
            <label for="detail-nome" class="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5 uppercase tracking-wide">
              {{ 'onboarding.azienda.steps.basics.nomeLabel' | translate }}
            </label>
            <input
              id="detail-nome"
              type="text"
              [ngModel]="nome()"
              (ngModelChange)="nome.set($event)"
              name="nome"
              [placeholder]="'onboarding.azienda.steps.basics.nomePlaceholder' | translate"
              required
              class="field-input w-full px-4 py-2.5 rounded-xl text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400
                     border border-zinc-200 bg-white"
            />
          </div>

          <div class="field-in" style="--i: 1">
            <label for="detail-descrizione" class="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5 uppercase tracking-wide">
              {{ 'onboarding.azienda.steps.basics.descrizioneLabel' | translate }}
              <span class="text-zinc-400 dark:text-zinc-500 font-normal">{{ 'onboarding.azienda.steps.basics.descrizioneOptional' | translate }}</span>
            </label>
            <textarea
              id="detail-descrizione"
              [ngModel]="descrizione()"
              (ngModelChange)="descrizione.set($event)"
              name="descrizione"
              rows="3"
              [placeholder]="'onboarding.azienda.steps.basics.descrizionePlaceholder' | translate"
              class="field-input w-full px-4 py-2.5 rounded-xl text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400
                     border border-zinc-200 bg-white resize-none"
            ></textarea>
          </div>
        </section>

        <section class="space-y-4">
          <p class="text-xs font-semibold text-brand-600 dark:text-brand-400 uppercase tracking-widest">{{ 'onboarding.azienda.steps.profile.label' | translate }}</p>

          <div class="field-in" style="--i: 2">
            <p class="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-2 uppercase tracking-wide">{{ 'onboarding.azienda.steps.profile.startupQuestion' | translate }}</p>
            <div class="seg-control relative flex w-full max-w-[280px] p-1 rounded-xl bg-zinc-100 dark:bg-zinc-800/60" role="radiogroup" [attr.aria-label]="'onboarding.azienda.steps.profile.startupQuestion' | translate">
              <div class="seg-thumb absolute inset-y-1 left-1 rounded-lg bg-white dark:bg-zinc-900 shadow-sm"
                   style="width: calc(50% - 0.25rem)"
                   [style.transform]="isStartup() === false ? 'translateX(100%)' : 'translateX(0)'"></div>
              <button type="button" role="radio" [attr.aria-checked]="isStartup() === true"
                      (click)="selectStartup(true)"
                      class="seg-btn relative z-10 flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-semibold min-h-[40px] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-zinc-950"
                      [ngClass]="isStartup() === true ? 'text-brand-700 dark:text-brand-400' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'">
                @if (isStartup() === true) { <span class="check-pop" [innerHTML]="checkIcon"></span> }
                {{ 'onboarding.azienda.steps.profile.yes' | translate }}
              </button>
              <button type="button" role="radio" [attr.aria-checked]="isStartup() === false"
                      (click)="selectStartup(false)"
                      class="seg-btn relative z-10 flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-semibold min-h-[40px] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-zinc-950"
                      [ngClass]="isStartup() === false ? 'text-brand-700 dark:text-brand-400' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'">
                @if (isStartup() === false) { <span class="check-pop" [innerHTML]="checkIcon"></span> }
                {{ 'onboarding.azienda.steps.profile.no' | translate }}
              </button>
            </div>
          </div>

          @if (isStartup() === true) {
            <div class="field-in" style="--i: 3">
              <p class="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-2 uppercase tracking-wide">{{ 'onboarding.azienda.steps.profile.innovativaQuestion' | translate }}</p>
              <p class="text-xs text-zinc-400 dark:text-zinc-500 mb-2.5 -mt-1.5">{{ 'onboarding.azienda.steps.profile.innovativaHint' | translate }}</p>
              <div class="seg-control relative flex w-full max-w-[280px] p-1 rounded-xl bg-zinc-100 dark:bg-zinc-800/60" role="radiogroup" [attr.aria-label]="'onboarding.azienda.steps.profile.innovativaQuestion' | translate">
                <div class="seg-thumb absolute inset-y-1 left-1 rounded-lg bg-white dark:bg-zinc-900 shadow-sm"
                     style="width: calc(50% - 0.25rem)"
                     [style.transform]="isInnovativa() === false ? 'translateX(100%)' : 'translateX(0)'"></div>
                <button type="button" role="radio" [attr.aria-checked]="isInnovativa() === true"
                        (click)="isInnovativa.set(true)"
                        class="seg-btn relative z-10 flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-semibold min-h-[40px] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-zinc-950"
                        [ngClass]="isInnovativa() === true ? 'text-brand-700 dark:text-brand-400' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'">
                  @if (isInnovativa() === true) { <span class="check-pop" [innerHTML]="checkIcon"></span> }
                  {{ 'onboarding.azienda.steps.profile.yes' | translate }}
                </button>
                <button type="button" role="radio" [attr.aria-checked]="isInnovativa() === false"
                        (click)="isInnovativa.set(false)"
                        class="seg-btn relative z-10 flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-semibold min-h-[40px] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-zinc-950"
                        [ngClass]="isInnovativa() === false ? 'text-brand-700 dark:text-brand-400' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'">
                  @if (isInnovativa() === false) { <span class="check-pop" [innerHTML]="checkIcon"></span> }
                  {{ 'onboarding.azienda.steps.profile.no' | translate }}
                </button>
              </div>
            </div>
          }
        </section>

        <section class="space-y-4">
          <p class="text-xs font-semibold text-brand-600 dark:text-brand-400 uppercase tracking-widest">{{ 'onboarding.azienda.steps.sector.label' | translate }}</p>
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-2.5" role="radiogroup" [attr.aria-label]="'onboarding.azienda.steps.sector.settoreLabel' | translate">
            @for (opt of settoreOptions; track opt.id; let i = $index) {
              <button
                type="button"
                role="radio"
                [attr.aria-checked]="settore() === opt.id"
                (click)="settore.set(opt.id)"
                class="field-in"
                [style]="'--i: ' + (i + 4)"
                [ngClass]="[
                  'pick-card relative flex items-center gap-2.5 p-2.5 rounded-xl border-2 text-left min-h-[44px]',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-zinc-950',
                  settore() === opt.id
                    ? 'border-brand-400 dark:border-brand-500 bg-brand-50 dark:bg-brand-950/40 is-selected'
                    : 'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:border-brand-200 dark:hover:border-brand-700'
                ]">
                @if (settore() === opt.id) {
                  <span class="corner-check absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-brand-500 text-white flex items-center justify-center shadow-sm">
                    <svg class="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
                    </svg>
                  </span>
                }
                <span class="icon-chip w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-[10px] font-bold text-white font-display"
                      [style.background]="opt.color">
                  {{ opt.monogram }}
                </span>
                <span class="text-xs font-semibold text-zinc-700 dark:text-zinc-300 leading-tight">{{ ('onboarding.azienda.settore.' + opt.id) | translate }}</span>
              </button>
            }
          </div>
        </section>

        <div class="flex items-center gap-4 pt-2 pb-2">
          <button
            type="button"
            [disabled]="!canSave() || saving()"
            (click)="save()"
            [ngClass]="saving() ? 'bg-emerald-600 shadow-emerald-500/25' : 'bg-brand-600 hover:bg-brand-500 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] shadow-brand-500/25'"
            class="cta-submit w-full sm:w-auto px-6 py-3 rounded-xl text-sm font-bold text-white shadow-md
                   disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0">
            @if (saving()) {
              <span class="check-pop inline-flex items-center gap-2">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
                </svg>
                {{ 'aziende.detail.saved' | translate }}
              </span>
            } @else {
              {{ 'aziende.detail.save' | translate }}
            }
          </button>
          <button type="button" (click)="cancelled.emit()"
                  class="text-sm font-semibold text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors">
            {{ 'aziende.detail.cancel' | translate }}
          </button>
        </div>

      </div>
    </div>
  `,
})
export class AziendaDetailComponent implements OnInit {
  @Input({ required: true }) azienda!: Azienda;

  @Output() saved = new EventEmitter<NuovaAzienda>();
  @Output() cancelled = new EventEmitter<void>();

  readonly settoreOptions: SettoreOption[] = SETTORE_OPTIONS;
  readonly checkIcon = `<svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>`;

  readonly supportsViewTransition =
    typeof document !== 'undefined' &&
    typeof (document as Document & { startViewTransition?: unknown }).startViewTransition === 'function' &&
    !(typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);

  nome = signal('');
  descrizione = signal('');
  isStartup = signal(false);
  isInnovativa = signal(false);
  settore = signal<Settore | null>(null);
  isCostituita = signal(false);
  storicoDocumento = signal<{ name: string; size: number } | null>(null);

  saving = signal(false);

  canSave = computed(() => this.nome().trim().length > 0 && this.settore() !== null);

  settoreColor = computed(() => this.settoreOptions.find(o => o.id === this.settore())?.color ?? '#71717a');
  settoreMonogram = computed(() => this.settoreOptions.find(o => o.id === this.settore())?.monogram ?? '?');

  ngOnInit(): void {
    this.nome.set(this.azienda.nome);
    this.descrizione.set(this.azienda.descrizione);
    this.isStartup.set(this.azienda.isStartup);
    this.isInnovativa.set(this.azienda.isInnovativa);
    this.settore.set(this.azienda.settore);
    this.isCostituita.set(this.azienda.isCostituita);
    this.storicoDocumento.set(this.azienda.storicoDocumento ?? null);
  }

  selectStartup(val: boolean): void {
    this.isStartup.set(val);
    if (!val) this.isInnovativa.set(false);
  }

  save(): void {
    if (!this.canSave() || this.saving()) return;
    this.saving.set(true);
    const payload: NuovaAzienda = {
      nome: this.nome().trim(),
      descrizione: this.descrizione().trim(),
      isStartup: this.isStartup(),
      isInnovativa: this.isInnovativa(),
      settore: this.settore()!,
      isCostituita: this.isCostituita(),
      storicoDocumento: this.storicoDocumento(),
      teamEtaGiovane: this.azienda.teamEtaGiovane,
      dipendenti: this.azienda.dipendenti,
      sedi: this.azienda.sedi,
      businessModel: this.azienda.businessModel,
    };
    setTimeout(() => this.saved.emit(payload), this.supportsViewTransition ? 420 : 0);
  }
}
