import { Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild, computed, effect, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import {
  BUSINESS_MODEL_OPTIONS, BusinessModel, BusinessModelOption,
  COUNTRY_OPTIONS, CountryOption, Dipendente,
  NuovaAzienda, SETTORE_OPTIONS, Settore, SettoreOption,
} from '../../../services/company.service';

type WizardStep = 'basics' | 'profile' | 'sector' | 'status' | 'upload' | 'team' | 'location' | 'businessModel';
type Step = 'hasCompany' | WizardStep;
/** Local-only row id so @for can track entries stably while their fields are edited. */
type DipendenteRow = Dipendente & { id: number };

@Component({
  selector: 'app-azienda-form',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  styles: [`
    .pick-card {
      transition: border-color 0.15s, background-color 0.15s, box-shadow 0.15s, transform 0.15s;
    }
    .pick-card:hover { transform: translateY(-2px); }
    .pick-card:active { transform: translateY(-2px) scale(0.98); }

    .icon-chip { transition: transform 0.3s cubic-bezier(0.22, 1, 0.36, 1); }
    .pick-card:hover .icon-chip { transform: scale(1.08); }

    .glow-layer {
      transition: opacity 0.35s cubic-bezier(0.22, 1, 0.36, 1);
    }

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

    /* ── Step transition: directional slide + soft depth ──────────────────── */
    @keyframes stepFwd {
      from { opacity: 0; transform: translateX(32px) scale(0.985); filter: blur(3px); }
      to   { opacity: 1; transform: translateX(0) scale(1); filter: blur(0); }
    }
    @keyframes stepBwd {
      from { opacity: 0; transform: translateX(-32px) scale(0.985); filter: blur(3px); }
      to   { opacity: 1; transform: translateX(0) scale(1); filter: blur(0); }
    }
    .step-fwd { animation: stepFwd 0.4s cubic-bezier(0.16, 1, 0.3, 1) both; }
    .step-bwd { animation: stepBwd 0.4s cubic-bezier(0.16, 1, 0.3, 1) both; }

    /* ── Field/option cascade within a step ────────────────────────────────── */
    @keyframes fieldIn {
      from { opacity: 0; transform: translateY(10px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .field-in {
      animation: fieldIn 0.36s cubic-bezier(0.25, 1, 0.5, 1) both;
      animation-delay: calc(var(--i, 0) * 70ms);
    }

    /* ── Selection feedback: soft settle, no bounce easing ─────────────────── */
    @keyframes selectPop {
      0%   { transform: scale(0.94); }
      55%  { transform: scale(1.035); }
      100% { transform: scale(1); }
    }
    .is-selected { animation: selectPop 0.3s cubic-bezier(0.16, 1, 0.3, 1) both; }

    @keyframes checkPop {
      from { opacity: 0; transform: scale(0.4); }
      to   { opacity: 1; transform: scale(1); }
    }
    .check-pop { display: inline-flex; animation: checkPop 0.22s cubic-bezier(0.16, 1, 0.3, 1) both; }

    /* ── Progress dot: pop when it becomes the active step ─────────────────── */
    @keyframes dotPop {
      0%   { transform: scaleY(1) scaleX(0.7); }
      60%  { transform: scaleY(1) scaleX(1.08); }
      100% { transform: scaleY(1) scaleX(1); }
    }
    .dot-active { animation: dotPop 0.34s cubic-bezier(0.16, 1, 0.3, 1) both; }

    /* ── CTA: one-shot entrance the moment it becomes enabled ──────────────── */
    @keyframes ctaReady {
      from { opacity: 0; transform: translateY(4px) scale(0.97); }
      to   { opacity: 1; transform: translateY(0) scale(1); }
    }
    .cta-ready { animation: ctaReady 0.32s cubic-bezier(0.16, 1, 0.3, 1) both; }

    /* ── Segmented toggle: sliding thumb between two options ───────────────── */
    .seg-thumb {
      transition: transform 0.22s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.18s ease-out;
    }

    /* ── Step progress: connecting track fills as the wizard advances ──────── */
    .step-progress-fill {
      transition: transform 0.32s cubic-bezier(0.25, 1, 0.5, 1);
    }

    /* ── Sector card: corner badge pop on selection ─────────────────────────── */
    .corner-check {
      animation: checkPop 0.22s cubic-bezier(0.16, 1, 0.3, 1) both;
    }

    /* ── Submit CTA: color settle on success morph ──────────────────────────── */
    .cta-submit {
      transition: background-color 0.2s ease-out, transform 0.2s, box-shadow 0.2s;
    }

    @media (prefers-reduced-motion: reduce) {
      .step-fwd, .step-bwd, .field-in, .is-selected, .check-pop, .dot-active, .cta-ready, .animate-view-enter, .corner-check {
        animation: none !important; opacity: 1 !important; transform: none !important; filter: none !important;
      }
      .pick-card:hover, .pick-card:active, .pick-card:hover .icon-chip {
        transform: none !important;
      }
      .seg-thumb, .step-progress-fill, .cta-submit {
        transition: none !important;
      }
    }
  `],
  template: `
    <div class="font-body">

      @if (step() === 'hasCompany') {
        <div class="animate-view-enter">
          <p class="text-xs font-semibold text-brand-600 dark:text-brand-400 uppercase tracking-widest mb-1.5">{{ 'onboarding.azienda.gate.eyebrow' | translate }}</p>
          <h1 class="text-2xl font-bold text-zinc-900 dark:text-zinc-100 font-display mb-2 text-balance">{{ 'onboarding.azienda.gate.title' | translate }}</h1>
          <p class="text-sm text-zinc-500 dark:text-zinc-400 max-w-md mb-7">
            {{ 'onboarding.azienda.gate.subtitle' | translate }}
          </p>

          <div class="grid sm:grid-cols-2 gap-4 max-w-xl" role="radiogroup" [attr.aria-label]="'onboarding.azienda.gate.title' | translate">
            <button
              type="button"
              role="radio"
              aria-checked="false"
              (click)="selectHasCompany(true)"
              (mousemove)="onGateMove($event, 'has')"
              (mouseleave)="onGateLeave('has')"
              class="pick-card group relative overflow-hidden text-left p-5 rounded-2xl border-2 border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900
                     hover:border-brand-300 dark:hover:border-brand-600 hover:shadow-card-hover
                     focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-zinc-950">
              <div class="glow-layer absolute inset-0 opacity-0 group-hover:opacity-100 pointer-events-none"
                   [style]="gateGlowStyle('has', 'rgba(99,102,241,0.16)')"></div>
              <div class="icon-chip relative z-10 w-11 h-11 rounded-xl flex items-center justify-center mb-4 bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400 group-hover:bg-brand-100 dark:group-hover:bg-brand-900/50 transition-colors">
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M3 21h18M5 21V5a2 2 0 012-2h10a2 2 0 012 2v16M9 9h1m4 0h1m-5 4h1m4 0h1m-5 4h1m4 0h1"/>
                </svg>
              </div>
              <p class="relative z-10 text-sm font-bold text-zinc-900 dark:text-zinc-100 font-display mb-1">{{ 'onboarding.azienda.gate.hasLabel' | translate }}</p>
              <p class="relative z-10 text-xs text-zinc-500 dark:text-zinc-400 leading-snug">{{ 'onboarding.azienda.gate.hasDesc' | translate }}</p>
            </button>

            <button
              type="button"
              role="radio"
              aria-checked="false"
              (click)="selectHasCompany(false)"
              (mousemove)="onGateMove($event, 'none')"
              (mouseleave)="onGateLeave('none')"
              class="pick-card group relative overflow-hidden text-left p-5 rounded-2xl border-2 border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900
                     hover:border-brand-300 dark:hover:border-brand-600 hover:shadow-card-hover
                     focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-zinc-950">
              <div class="glow-layer absolute inset-0 opacity-0 group-hover:opacity-100 pointer-events-none"
                   [style]="gateGlowStyle('none', 'rgba(113,113,122,0.14)')"></div>
              <div class="icon-chip relative z-10 w-11 h-11 rounded-xl flex items-center justify-center mb-4 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 group-hover:bg-zinc-200 dark:group-hover:bg-zinc-700 transition-colors">
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/>
                </svg>
              </div>
              <p class="relative z-10 text-sm font-bold text-zinc-900 dark:text-zinc-100 font-display mb-1">{{ 'onboarding.azienda.gate.noneLabel' | translate }}</p>
              <p class="relative z-10 text-xs text-zinc-500 dark:text-zinc-400 leading-snug">{{ 'onboarding.azienda.gate.noneDesc' | translate }}</p>
            </button>
          </div>
        </div>
      }

      @if (step() !== 'hasCompany') {
        <div class="animate-view-enter">

          <div class="flex items-start justify-between gap-4 mb-5">
            <div class="flex-1 min-w-0">
              @if (canGoBack()) {
                <button type="button" (click)="back()"
                        class="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors mb-3">
                  <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/>
                  </svg>
                  {{ 'onboarding.azienda.back' | translate }}
                </button>
              }

              <!-- Step progress -->
              <div class="flex items-center gap-2 mb-3" role="progressbar"
                   [attr.aria-valuenow]="stepIndex() + 1" aria-valuemin="1" [attr.aria-valuemax]="stepOrder().length">
                <div class="relative flex items-center gap-1.5">
                  <div class="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[2px] rounded-full bg-zinc-200 dark:bg-zinc-700"></div>
                  <div class="step-progress-fill absolute left-0 top-1/2 -translate-y-1/2 h-[2px] w-full rounded-full bg-brand-400 dark:bg-brand-600 origin-left"
                       [style.transform]="'scaleX(' + progressRatio() + ')'"></div>
                  @for (s of stepOrder(); track s; let i = $index) {
                    <span class="relative h-1.5 rounded-full transition-all duration-300 ease-out origin-center"
                          [ngClass]="[
                            i === stepIndex() ? 'w-6 bg-brand-500 dot-active' : (i < stepIndex() ? 'w-1.5 bg-brand-300 dark:bg-brand-700' : 'w-1.5 bg-zinc-200 dark:bg-zinc-700')
                          ]"></span>
                  }
                </div>
                <span class="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500">
                  {{ 'onboarding.azienda.stepProgress' | translate:{ current: stepIndex() + 1, total: stepOrder().length } }}
                </span>
              </div>

              <p class="text-xs font-semibold text-brand-600 dark:text-brand-400 uppercase tracking-widest mb-1.5">{{ ('onboarding.azienda.steps.' + step() + '.eyebrow') | translate }}</p>
              <h1 class="text-2xl font-bold text-zinc-900 dark:text-zinc-100 font-display mb-2 text-balance">{{ ('onboarding.azienda.steps.' + step() + '.title') | translate }}</h1>
              <p class="text-sm text-zinc-500 dark:text-zinc-400 max-w-md">
                {{ ('onboarding.azienda.steps.' + step() + '.subtitle') | translate }}
              </p>
            </div>
            @if (!askHasCompany) {
              <button type="button" (click)="cancelled.emit()" [attr.title]="'onboarding.azienda.close' | translate"
                      class="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors flex-shrink-0">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            }
          </div>

          <div class="max-w-xl">
            <div [class]="stepAnimClass()">

              @switch (step()) {

                @case ('basics') {
                  <div class="space-y-6">
                    <div class="field-in" style="--i: 0">
                      <label for="azienda-nome" class="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5 uppercase tracking-wide">
                        {{ 'onboarding.azienda.steps.basics.nomeLabel' | translate }}
                      </label>
                      <input
                        #nomeInput
                        id="azienda-nome"
                        type="text"
                        [ngModel]="nome()"
                        (ngModelChange)="nome.set($event)"
                        (keydown.enter)="onNomeEnter()"
                        name="nome"
                        [placeholder]="'onboarding.azienda.steps.basics.nomePlaceholder' | translate"
                        required
                        class="field-input w-full px-4 py-2.5 rounded-xl text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400
                               border border-zinc-200 bg-white"
                      />
                    </div>

                    <div class="field-in" style="--i: 1">
                      <label for="azienda-descrizione" class="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5 uppercase tracking-wide">
                        {{ 'onboarding.azienda.steps.basics.descrizioneLabel' | translate }}
                        <span class="text-zinc-400 dark:text-zinc-500 font-normal">{{ 'onboarding.azienda.steps.basics.descrizioneOptional' | translate }}</span>
                      </label>
                      <textarea
                        id="azienda-descrizione"
                        [ngModel]="descrizione()"
                        (ngModelChange)="descrizione.set($event)"
                        name="descrizione"
                        rows="3"
                        [placeholder]="'onboarding.azienda.steps.basics.descrizionePlaceholder' | translate"
                        class="field-input w-full px-4 py-2.5 rounded-xl text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400
                               border border-zinc-200 bg-white resize-none"
                      ></textarea>
                    </div>
                  </div>
                }

                @case ('profile') {
                  <div class="space-y-6">
                    <div class="field-in" style="--i: 0">
                      <p class="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-2 uppercase tracking-wide">{{ 'onboarding.azienda.steps.profile.startupQuestion' | translate }}</p>
                      <div class="seg-control relative flex w-full max-w-[280px] p-1 rounded-xl bg-zinc-100 dark:bg-zinc-800/60" role="radiogroup" [attr.aria-label]="'onboarding.azienda.steps.profile.startupQuestion' | translate">
                        <div class="seg-thumb absolute inset-y-1 left-1 rounded-lg bg-white dark:bg-zinc-900 shadow-sm"
                             style="width: calc(50% - 0.25rem)"
                             [style.transform]="isStartup() === false ? 'translateX(100%)' : 'translateX(0)'"
                             [style.opacity]="isStartup() === null ? 0 : 1"></div>
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
                      <div class="field-in" style="--i: 1">
                        <p class="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-2 uppercase tracking-wide">{{ 'onboarding.azienda.steps.profile.innovativaQuestion' | translate }}</p>
                        <p class="text-xs text-zinc-400 dark:text-zinc-500 mb-2.5 -mt-1.5">{{ 'onboarding.azienda.steps.profile.innovativaHint' | translate }}</p>
                        <div class="seg-control relative flex w-full max-w-[280px] p-1 rounded-xl bg-zinc-100 dark:bg-zinc-800/60" role="radiogroup" [attr.aria-label]="'onboarding.azienda.steps.profile.innovativaQuestion' | translate">
                          <div class="seg-thumb absolute inset-y-1 left-1 rounded-lg bg-white dark:bg-zinc-900 shadow-sm"
                               style="width: calc(50% - 0.25rem)"
                               [style.transform]="isInnovativa() === false ? 'translateX(100%)' : 'translateX(0)'"
                               [style.opacity]="isInnovativa() === null ? 0 : 1"></div>
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
                  </div>
                }

                @case ('sector') {
                  <div>
                    <p class="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-2 uppercase tracking-wide">{{ 'onboarding.azienda.steps.sector.settoreLabel' | translate }}</p>
                    <div class="grid grid-cols-2 sm:grid-cols-3 gap-2.5" role="radiogroup" [attr.aria-label]="'onboarding.azienda.steps.sector.settoreLabel' | translate">
                      @for (opt of settoreOptions; track opt.id; let i = $index) {
                        <button
                          type="button"
                          role="radio"
                          [attr.aria-checked]="settore() === opt.id"
                          (click)="settore.set(opt.id)"
                          class="field-in"
                          [style]="'--i: ' + i"
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
                  </div>
                }

                @case ('status') {
                  <div>
                    <p class="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-3 uppercase tracking-wide">{{ 'onboarding.azienda.steps.status.question' | translate }}</p>
                    <div class="grid sm:grid-cols-2 gap-3" role="radiogroup" [attr.aria-label]="'onboarding.azienda.steps.status.question' | translate">
                      <button
                        type="button"
                        role="radio"
                        [attr.aria-checked]="isCostituita() === true"
                        (click)="selectCostituita(true)"
                        (mousemove)="onGateMove($event, 'costituita')"
                        (mouseleave)="onGateLeave('costituita')"
                        class="pick-card group relative overflow-hidden text-left p-4 rounded-2xl border-2 field-in
                               focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-zinc-950"
                        style="--i: 0"
                        [ngClass]="isCostituita() === true
                          ? 'border-brand-400 dark:border-brand-500 bg-brand-50 dark:bg-brand-950/40 is-selected'
                          : 'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:border-brand-200 dark:hover:border-brand-700'">
                        <div class="glow-layer absolute inset-0 opacity-0 group-hover:opacity-100 pointer-events-none"
                             [style]="gateGlowStyle('costituita', 'rgba(99,102,241,0.16)')"></div>
                        @if (isCostituita() === true) {
                          <span class="corner-check absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-brand-500 text-white flex items-center justify-center shadow-sm">
                            <svg class="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                              <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
                            </svg>
                          </span>
                        }
                        <div class="icon-chip relative z-10 w-9 h-9 rounded-xl flex items-center justify-center mb-2.5 bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400">
                          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                          </svg>
                        </div>
                        <p class="relative z-10 text-sm font-bold text-zinc-900 dark:text-zinc-100 font-display mb-0.5">{{ 'onboarding.azienda.steps.status.costituitaLabel' | translate }}</p>
                        <p class="relative z-10 text-xs text-zinc-500 dark:text-zinc-400 leading-snug">{{ 'onboarding.azienda.steps.status.costituitaDesc' | translate }}</p>
                      </button>

                      <button
                        type="button"
                        role="radio"
                        [attr.aria-checked]="isCostituita() === false"
                        (click)="selectCostituita(false)"
                        (mousemove)="onGateMove($event, 'nonCostituita')"
                        (mouseleave)="onGateLeave('nonCostituita')"
                        class="pick-card group relative overflow-hidden text-left p-4 rounded-2xl border-2 field-in
                               focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-zinc-950"
                        style="--i: 1"
                        [ngClass]="isCostituita() === false
                          ? 'border-brand-400 dark:border-brand-500 bg-brand-50 dark:bg-brand-950/40 is-selected'
                          : 'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:border-brand-200 dark:hover:border-brand-700'">
                        <div class="glow-layer absolute inset-0 opacity-0 group-hover:opacity-100 pointer-events-none"
                             [style]="gateGlowStyle('nonCostituita', 'rgba(113,113,122,0.14)')"></div>
                        @if (isCostituita() === false) {
                          <span class="corner-check absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-brand-500 text-white flex items-center justify-center shadow-sm">
                            <svg class="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                              <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
                            </svg>
                          </span>
                        }
                        <div class="icon-chip relative z-10 w-9 h-9 rounded-xl flex items-center justify-center mb-2.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400">
                          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/>
                          </svg>
                        </div>
                        <p class="relative z-10 text-sm font-bold text-zinc-900 dark:text-zinc-100 font-display mb-0.5">{{ 'onboarding.azienda.steps.status.nonCostituitaLabel' | translate }}</p>
                        <p class="relative z-10 text-xs text-zinc-500 dark:text-zinc-400 leading-snug">{{ 'onboarding.azienda.steps.status.nonCostituitaDesc' | translate }}</p>
                      </button>
                    </div>
                  </div>
                }

                @case ('upload') {
                  <div>
                    <div class="field-in" style="--i: 0">
                      <p class="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5 uppercase tracking-wide">
                        {{ 'onboarding.azienda.steps.upload.fileLabel' | translate }}
                        <span class="text-zinc-400 dark:text-zinc-500 font-normal">{{ 'onboarding.azienda.steps.upload.fileOptional' | translate }}</span>
                      </p>

                      @if (!storicoFile()) {
                        <label
                          for="azienda-storico"
                          (dragover)="onDragOver($event)"
                          (dragleave)="onDragLeave($event)"
                          (drop)="onFileDrop($event)"
                          [ngClass]="isDragging() ? 'border-brand-400 dark:border-brand-500 bg-brand-50 dark:bg-brand-950/30' : 'border-zinc-200 dark:border-zinc-700 hover:border-brand-200 dark:hover:border-brand-700 bg-white dark:bg-zinc-900'"
                          class="field-input flex flex-col items-center justify-center gap-2 px-4 py-8 rounded-xl border-2 border-dashed cursor-pointer text-center">
                          <div class="w-10 h-10 rounded-xl flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500">
                            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
                              <path stroke-linecap="round" stroke-linejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M12 12v9m0-9l-3 3m3-3l3 3"/>
                            </svg>
                          </div>
                          <p class="text-sm font-semibold text-zinc-700 dark:text-zinc-300">{{ 'onboarding.azienda.steps.upload.dropTitle' | translate }}</p>
                          <p class="text-xs text-zinc-400 dark:text-zinc-500">{{ 'onboarding.azienda.steps.upload.dropHint' | translate }}</p>
                          <input id="azienda-storico" type="file" class="sr-only"
                                 accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                                 (change)="onFileSelected($event)" />
                        </label>
                      } @else {
                        <div class="flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-brand-200 dark:border-brand-700 bg-brand-50 dark:bg-brand-950/30 field-in" style="--i: 0">
                          <div class="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 bg-white dark:bg-zinc-900 text-brand-600 dark:text-brand-400 shadow-sm">
                            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
                              <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6M9 8h1m4 11H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V17a2 2 0 01-2 2z"/>
                            </svg>
                          </div>
                          <div class="min-w-0 flex-1">
                            <p class="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">{{ storicoFile()!.name }}</p>
                            <p class="text-xs text-zinc-400 dark:text-zinc-500">{{ formatFileSize(storicoFile()!.size) }}</p>
                          </div>
                          <button type="button" (click)="removeFile()" [attr.title]="'onboarding.azienda.steps.upload.remove' | translate"
                                  class="w-7 h-7 flex items-center justify-center rounded-lg text-zinc-400 dark:text-zinc-500 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors flex-shrink-0">
                            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
                            </svg>
                          </button>
                        </div>
                      }

                      @if (fileError()) {
                        <p class="text-xs font-semibold text-rose-500 mt-2">{{ fileError() | translate }}</p>
                      }
                    </div>
                  </div>
                }

                @case ('team') {
                  <div class="space-y-6">
                    <div class="field-in" style="--i: 0">
                      <p class="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-2 uppercase tracking-wide">{{ 'onboarding.azienda.steps.team.youngQuestion' | translate }}</p>
                      <p class="text-xs text-zinc-400 dark:text-zinc-500 mb-2.5 -mt-1.5">{{ 'onboarding.azienda.steps.team.youngHint' | translate }}</p>
                      <div class="seg-control relative flex w-full max-w-[280px] p-1 rounded-xl bg-zinc-100 dark:bg-zinc-800/60" role="radiogroup" [attr.aria-label]="'onboarding.azienda.steps.team.youngQuestion' | translate">
                        <div class="seg-thumb absolute inset-y-1 left-1 rounded-lg bg-white dark:bg-zinc-900 shadow-sm"
                             style="width: calc(50% - 0.25rem)"
                             [style.transform]="teamEtaGiovane() === false ? 'translateX(100%)' : 'translateX(0)'"
                             [style.opacity]="teamEtaGiovane() === null ? 0 : 1"></div>
                        <button type="button" role="radio" [attr.aria-checked]="teamEtaGiovane() === true"
                                (click)="teamEtaGiovane.set(true)"
                                class="seg-btn relative z-10 flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-semibold min-h-[40px] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-zinc-950"
                                [ngClass]="teamEtaGiovane() === true ? 'text-brand-700 dark:text-brand-400' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'">
                          @if (teamEtaGiovane() === true) { <span class="check-pop" [innerHTML]="checkIcon"></span> }
                          {{ 'onboarding.azienda.steps.profile.yes' | translate }}
                        </button>
                        <button type="button" role="radio" [attr.aria-checked]="teamEtaGiovane() === false"
                                (click)="teamEtaGiovane.set(false)"
                                class="seg-btn relative z-10 flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-semibold min-h-[40px] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-zinc-950"
                                [ngClass]="teamEtaGiovane() === false ? 'text-brand-700 dark:text-brand-400' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'">
                          @if (teamEtaGiovane() === false) { <span class="check-pop" [innerHTML]="checkIcon"></span> }
                          {{ 'onboarding.azienda.steps.profile.no' | translate }}
                        </button>
                      </div>
                    </div>

                    <div class="field-in" style="--i: 1">
                      <label for="azienda-num-dipendenti" class="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5 uppercase tracking-wide">
                        {{ 'onboarding.azienda.steps.team.countLabel' | translate }}
                        <span class="text-zinc-400 dark:text-zinc-500 font-normal">{{ 'onboarding.azienda.steps.team.countOptional' | translate }}</span>
                      </label>
                      <div class="inline-flex items-center gap-2">
                        <button type="button" (click)="decDipendenti()" [disabled]="dipendenti().length === 0"
                                class="w-9 h-9 flex items-center justify-center rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:border-brand-300 dark:hover:border-brand-600 hover:text-brand-600 dark:hover:text-brand-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M5 12h14"/></svg>
                        </button>
                        <input id="azienda-num-dipendenti" type="number" min="0" max="50"
                               [ngModel]="dipendenti().length"
                               (ngModelChange)="setNumDipendenti($event)"
                               name="numDipendenti"
                               class="field-input w-16 text-center px-2 py-2 rounded-xl text-sm font-semibold text-zinc-900 dark:text-zinc-100 border border-zinc-200 bg-white" />
                        <button type="button" (click)="incDipendenti()" [disabled]="dipendenti().length >= 50"
                                class="w-9 h-9 flex items-center justify-center rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:border-brand-300 dark:hover:border-brand-600 hover:text-brand-600 dark:hover:text-brand-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 5v14m-7-7h14"/></svg>
                        </button>
                      </div>
                    </div>

                    @if (dipendenti().length > 0) {
                      <div class="space-y-2.5">
                        @for (d of dipendenti(); track d.id; let i = $index) {
                          <div class="field-in flex items-start gap-2.5 p-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900" [style]="'--i: ' + i">
                            <div class="grid grid-cols-1 sm:grid-cols-3 gap-2 flex-1">
                              <input type="text" [ngModel]="d.ruolo" (ngModelChange)="updateDipendente(i, 'ruolo', $event)" [name]="'ruolo' + i"
                                     [placeholder]="'onboarding.azienda.steps.team.rolePlaceholder' | translate"
                                     class="field-input px-3 py-2 rounded-lg text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 border border-zinc-200 bg-white" />
                              <input type="text" [ngModel]="d.nome" (ngModelChange)="updateDipendente(i, 'nome', $event)" [name]="'nome' + i"
                                     [placeholder]="'onboarding.azienda.steps.team.nomePlaceholder' | translate"
                                     class="field-input px-3 py-2 rounded-lg text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 border border-zinc-200 bg-white" />
                              <input type="text" [ngModel]="d.cognome" (ngModelChange)="updateDipendente(i, 'cognome', $event)" [name]="'cognome' + i"
                                     [placeholder]="'onboarding.azienda.steps.team.cognomePlaceholder' | translate"
                                     class="field-input px-3 py-2 rounded-lg text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 border border-zinc-200 bg-white" />
                            </div>
                            <button type="button" (click)="removeDipendente(i)" [attr.title]="'onboarding.azienda.steps.team.remove' | translate"
                                    class="w-7 h-7 flex items-center justify-center rounded-lg text-zinc-400 dark:text-zinc-500 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors flex-shrink-0">
                              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                            </button>
                          </div>
                        }
                      </div>
                    }
                  </div>
                }

                @case ('location') {
                  <div class="space-y-5">
                    <div class="field-in" style="--i: 0">
                      <label for="azienda-paese" class="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5 uppercase tracking-wide">
                        {{ 'onboarding.azienda.steps.location.countryLabel' | translate }}
                        <span class="text-zinc-400 dark:text-zinc-500 font-normal">{{ 'onboarding.azienda.steps.location.countryOptional' | translate }}</span>
                      </label>
                      <div class="flex items-center gap-2">
                        <select id="azienda-paese"
                                [ngModel]="countryToAdd()"
                                (ngModelChange)="countryToAdd.set($event)"
                                name="paese"
                                class="field-input flex-1 px-4 py-2.5 rounded-xl text-sm text-zinc-900 dark:text-zinc-100 border border-zinc-200 bg-white">
                          <option value="" disabled>{{ 'onboarding.azienda.steps.location.countryPlaceholder' | translate }}</option>
                          @for (c of countryOptions; track c.code) {
                            <option [value]="c.code">{{ ('onboarding.azienda.countries.' + c.code) | translate }}</option>
                          }
                        </select>
                        <button type="button" (click)="addSede()" [disabled]="!countryToAdd() || sedi().includes(countryToAdd())"
                                class="px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-brand-600 hover:bg-brand-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0">
                          {{ 'onboarding.azienda.steps.location.addLabel' | translate }}
                        </button>
                      </div>
                    </div>

                    @if (sedi().length > 0) {
                      <div class="space-y-2">
                        @for (code of sedi(); track code; let i = $index) {
                          <div class="field-in flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900" [style]="'--i: ' + i">
                            <span class="icon-chip w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-[10px] font-bold text-white font-display bg-brand-500">
                              {{ code.toUpperCase() }}
                            </span>
                            <span class="text-sm font-semibold text-zinc-700 dark:text-zinc-300 flex-1">{{ ('onboarding.azienda.countries.' + code) | translate }}</span>
                            <button type="button" (click)="removeSede(code)" [attr.title]="'onboarding.azienda.steps.location.remove' | translate"
                                    class="w-7 h-7 flex items-center justify-center rounded-lg text-zinc-400 dark:text-zinc-500 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors flex-shrink-0">
                              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                            </button>
                          </div>
                        }
                      </div>
                    }
                  </div>
                }

                @case ('businessModel') {
                  <div>
                    <p class="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-2 uppercase tracking-wide">
                      {{ 'onboarding.azienda.steps.businessModel.modelLabel' | translate }}
                      <span class="text-zinc-400 dark:text-zinc-500 font-normal">{{ 'onboarding.azienda.steps.businessModel.modelOptional' | translate }}</span>
                    </p>
                    <div class="grid grid-cols-2 sm:grid-cols-3 gap-2.5" role="radiogroup" [attr.aria-label]="'onboarding.azienda.steps.businessModel.modelLabel' | translate">
                      @for (opt of businessModelOptions; track opt.id; let i = $index) {
                        <button
                          type="button"
                          role="radio"
                          [attr.aria-checked]="businessModel() === opt.id"
                          (click)="selectBusinessModel(opt.id)"
                          class="field-in"
                          [style]="'--i: ' + i"
                          [ngClass]="[
                            'pick-card relative flex items-center gap-2.5 p-2.5 rounded-xl border-2 text-left min-h-[44px]',
                            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-zinc-950',
                            businessModel() === opt.id
                              ? 'border-brand-400 dark:border-brand-500 bg-brand-50 dark:bg-brand-950/40 is-selected'
                              : 'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:border-brand-200 dark:hover:border-brand-700'
                          ]">
                          @if (businessModel() === opt.id) {
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
                          <span class="text-xs font-semibold text-zinc-700 dark:text-zinc-300 leading-tight">{{ ('onboarding.azienda.businessModel.' + opt.id) | translate }}</span>
                        </button>
                      }
                    </div>
                  </div>
                }
              }

              <!-- Nav -->
              <div class="pt-6">
                @if (!isLastStep()) {
                  <button
                    type="button"
                    [disabled]="!canAdvance()"
                    [class.cta-ready]="canAdvance()"
                    (click)="next()"
                    class="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white transition-all duration-200
                           bg-brand-600 hover:bg-brand-500 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] shadow-md shadow-brand-500/25
                           disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:shadow-none">
                    {{ 'onboarding.azienda.next' | translate }}
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/>
                    </svg>
                  </button>
                } @else {
                  <button
                    type="button"
                    [disabled]="!canSubmit() || submitting()"
                    [class.cta-ready]="canSubmit() && !submitting()"
                    (click)="submit()"
                    [ngClass]="submitting() ? 'bg-emerald-600 shadow-emerald-500/25' : 'bg-brand-600 hover:bg-brand-500 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] shadow-brand-500/25'"
                    class="cta-submit w-full sm:w-auto px-6 py-3 rounded-xl text-sm font-bold text-white shadow-md
                           disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0">
                    @if (submitting()) {
                      <span class="check-pop inline-flex items-center gap-2">
                        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
                        </svg>
                        {{ 'onboarding.azienda.submitted' | translate }}
                      </span>
                    } @else {
                      {{ 'onboarding.azienda.submit' | translate }}
                    }
                  </button>
                }
              </div>

            </div>
          </div>

        </div>
      }

    </div>
  `,
})
export class AziendaFormComponent implements OnInit {
  /** When true, shows the "hai già un'azienda?" gate before the form (post-login onboarding). */
  @Input() askHasCompany = false;

  /** Emits the created Azienda, or null when the user has no company (only reachable when askHasCompany). */
  @Output() completed = new EventEmitter<NuovaAzienda | null>();

  /** Emitted when the user closes the form without saving (only shown when askHasCompany is false). */
  @Output() cancelled = new EventEmitter<void>();

  @ViewChild('nomeInput') nomeInputRef?: ElementRef<HTMLInputElement>;

  readonly settoreOptions: SettoreOption[] = SETTORE_OPTIONS;
  readonly businessModelOptions: BusinessModelOption[] = BUSINESS_MODEL_OPTIONS;
  readonly countryOptions: CountryOption[] = COUNTRY_OPTIONS;
  private readonly baseStepOrder: WizardStep[] = ['basics', 'profile', 'sector', 'status'];

  readonly checkIcon = `<svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>`;

  readonly allowedFileTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
  readonly maxFileBytes = 10 * 1024 * 1024;

  step = signal<Step>('basics');
  /** Direction of the most recent step change, drives the slide-in animation. */
  animDir = signal<'fwd' | 'bwd'>('fwd');
  /** True while the success morph plays on submit, just before `completed` emits. */
  submitting = signal(false);
  /** Cursor position (percent) per pick-card, drives the spotlight hover glow. */
  gateGlow = signal<Record<string, { x: number; y: number }>>({
    has: { x: 50, y: 0 },
    none: { x: 50, y: 0 },
    costituita: { x: 50, y: 0 },
    nonCostituita: { x: 50, y: 0 },
  });

  private readonly prefersReducedMotion =
    typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;

  nome = signal('');
  descrizione = signal('');
  isStartup = signal<boolean | null>(null);
  isInnovativa = signal<boolean | null>(null);
  settore = signal<Settore | null>(null);
  isCostituita = signal<boolean | null>(null);
  storicoFile = signal<File | null>(null);
  fileError = signal<string | null>(null);
  isDragging = signal(false);
  teamEtaGiovane = signal<boolean | null>(null);
  dipendenti = signal<DipendenteRow[]>([]);
  private dipendenteIdSeq = 0;
  sedi = signal<string[]>([]);
  countryToAdd = signal('');
  businessModel = signal<BusinessModel | null>(null);

  /** Upload only joins the flow once the user says the company is already established; the rest are always-optional add-ons. */
  stepOrder = computed<WizardStep[]>(() => {
    const order: WizardStep[] = [...this.baseStepOrder];
    if (this.isCostituita() === true) order.push('upload');
    order.push('team', 'location', 'businessModel');
    return order;
  });

  stepIndex = computed(() => this.stepOrder().indexOf(this.step() as WizardStep));
  isLastStep = computed(() => {
    const order = this.stepOrder();
    return order[order.length - 1] === this.step();
  });
  stepAnimClass = computed(() => (this.animDir() === 'fwd' ? 'step-fwd' : 'step-bwd'));
  progressRatio = computed(() => {
    const order = this.stepOrder();
    return order.length > 1 ? this.stepIndex() / (order.length - 1) : 1;
  });

  canGoBack = computed(() => {
    const s = this.step();
    if (s === 'hasCompany') return false;
    if (s === 'basics') return this.askHasCompany;
    return true;
  });

  canAdvanceBasics = computed(() => this.nome().trim().length > 0);

  canAdvanceProfile = computed(() => {
    const startup = this.isStartup();
    const innovativa = this.isInnovativa();
    return startup !== null && (startup === false || innovativa !== null);
  });

  canAdvance = computed(() => {
    const s = this.step();
    if (s === 'basics') return this.canAdvanceBasics();
    if (s === 'profile') return this.canAdvanceProfile();
    if (s === 'sector') return this.settore() !== null;
    if (s === 'status') return this.isCostituita() !== null;
    return true;
  });

  canSubmit = computed(() =>
    this.canAdvanceBasics() && this.canAdvanceProfile() && this.settore() !== null && this.isCostituita() !== null
  );

  constructor() {
    // Focus the first field of "basics" whenever the user lands on it
    // (initial mount, gate selection, or stepping back) — one less click.
    effect(() => {
      if (this.step() === 'basics') {
        setTimeout(() => this.nomeInputRef?.nativeElement.focus(), 0);
      }
    });
  }

  ngOnInit(): void {
    this.step.set(this.askHasCompany ? 'hasCompany' : 'basics');
  }

  onGateMove(e: MouseEvent, key: string): void {
    if (this.prefersReducedMotion) return;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    this.gateGlow.update(g => ({ ...g, [key]: { x, y } }));
  }

  onGateLeave(key: string): void {
    this.gateGlow.update(g => ({ ...g, [key]: { x: 50, y: 0 } }));
  }

  gateGlowStyle(key: string, color: string): string {
    const { x, y } = this.gateGlow()[key];
    return `background: radial-gradient(circle at ${x}% ${y}%, ${color} 0%, transparent 65%);`;
  }

  selectHasCompany(has: boolean): void {
    if (!has) {
      this.completed.emit(null);
      return;
    }
    this.animDir.set('fwd');
    this.step.set('basics');
  }

  next(): void {
    if (!this.canAdvance()) return;
    this.animDir.set('fwd');
    const order = this.stepOrder();
    const idx = order.indexOf(this.step() as WizardStep);
    if (idx >= 0 && idx < order.length - 1) {
      this.step.set(order[idx + 1]);
    }
  }

  back(): void {
    this.animDir.set('bwd');
    const order = this.stepOrder();
    const idx = order.indexOf(this.step() as WizardStep);
    if (idx > 0) {
      this.step.set(order[idx - 1]);
    } else if (this.askHasCompany) {
      this.step.set('hasCompany');
    }
  }

  onNomeEnter(): void {
    if (this.canAdvanceBasics()) this.next();
  }

  selectStartup(val: boolean): void {
    this.isStartup.set(val);
    if (!val) this.isInnovativa.set(false);
  }

  selectCostituita(val: boolean): void {
    this.isCostituita.set(val);
    if (!val) {
      this.storicoFile.set(null);
      this.fileError.set(null);
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.setFile(input.files?.[0] ?? null);
    input.value = '';
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(false);
  }

  onFileDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(false);
    this.setFile(event.dataTransfer?.files?.[0] ?? null);
  }

  removeFile(): void {
    this.storicoFile.set(null);
    this.fileError.set(null);
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  private setFile(file: File | null): void {
    if (!file) return;
    const hasAllowedExtension = /\.(pdf|docx)$/i.test(file.name);
    if (!this.allowedFileTypes.includes(file.type) && !hasAllowedExtension) {
      this.fileError.set('onboarding.azienda.steps.upload.errorType');
      return;
    }
    if (file.size > this.maxFileBytes) {
      this.fileError.set('onboarding.azienda.steps.upload.errorSize');
      return;
    }
    this.fileError.set(null);
    this.storicoFile.set(file);
  }

  setNumDipendenti(raw: number | string): void {
    const n = Math.max(0, Math.min(50, Math.floor(Number(raw)) || 0));
    this.resizeDipendenti(n);
  }

  incDipendenti(): void {
    this.resizeDipendenti(Math.min(50, this.dipendenti().length + 1));
  }

  decDipendenti(): void {
    this.resizeDipendenti(Math.max(0, this.dipendenti().length - 1));
  }

  private resizeDipendenti(n: number): void {
    this.dipendenti.update(list => {
      if (n === list.length) return list;
      if (n < list.length) return list.slice(0, n);
      const additions = Array.from({ length: n - list.length }, () => ({ id: ++this.dipendenteIdSeq, ruolo: '', nome: '', cognome: '' }));
      return [...list, ...additions];
    });
  }

  updateDipendente(index: number, field: keyof Dipendente, value: string): void {
    this.dipendenti.update(list => list.map((d, i) => (i === index ? { ...d, [field]: value } : d)));
  }

  removeDipendente(index: number): void {
    this.dipendenti.update(list => list.filter((_, i) => i !== index));
  }

  addSede(): void {
    const code = this.countryToAdd();
    if (!code || this.sedi().includes(code)) return;
    this.sedi.update(list => [...list, code]);
    this.countryToAdd.set('');
  }

  removeSede(code: string): void {
    this.sedi.update(list => list.filter(c => c !== code));
  }

  selectBusinessModel(id: BusinessModel): void {
    this.businessModel.set(this.businessModel() === id ? null : id);
  }

  submit(): void {
    if (!this.canSubmit() || this.submitting()) return;
    this.submitting.set(true);
    const file = this.storicoFile();
    const payload: NuovaAzienda = {
      nome: this.nome().trim(),
      descrizione: this.descrizione().trim(),
      isStartup: this.isStartup()!,
      isInnovativa: this.isInnovativa() ?? false,
      settore: this.settore()!,
      isCostituita: this.isCostituita()!,
      storicoDocumento: file ? { name: file.name, size: file.size } : null,
      teamEtaGiovane: this.teamEtaGiovane(),
      dipendenti: this.dipendenti().map(({ ruolo, nome, cognome }) => ({ ruolo, nome, cognome })),
      sedi: this.sedi(),
      businessModel: this.businessModel(),
    };
    setTimeout(() => this.completed.emit(payload), this.prefersReducedMotion ? 0 : 420);
  }
}
