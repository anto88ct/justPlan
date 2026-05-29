import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule, NgClass } from '@angular/common';
import { WizardFormComponent } from '../wizard-form/wizard-form.component';
import { DashboardCruscottoComponent } from '../dashboard-cruscotto/dashboard-cruscotto.component';
import { AiChatbotComponent } from '../ai-chatbot/ai-chatbot.component';
import { BusinessPlanService, SavedPlan } from '../../services/business-plan.service';

type View = 'panoramica' | 'wizard' | 'dashboard' | 'scenari' | 'report' | 'impostazioni' | 'piani-salvati';

interface NavItem {
  id: string;
  view: View;
  label: string;
  svgPath: string;
}

interface SettingItem {
  key: string;
  label: string;
  desc: string;
  enabled: boolean;
}

@Component({
  selector: 'app-layout',
  standalone: true,
  host: { class: 'flex h-full w-full overflow-hidden' },
  imports: [CommonModule, NgClass, WizardFormComponent, DashboardCruscottoComponent, AiChatbotComponent],
  styles: [`
    :host { display: flex; height: 100%; width: 100%; overflow: hidden; }

    .nav-btn { position: relative; }
    .nav-btn::after {
      content: '';
      position: absolute;
      left: 0; top: 50%;
      transform: translateY(-50%) scaleY(0);
      width: 3px; height: 55%;
      background: linear-gradient(180deg, #a5b4fc, #818cf8);
      border-radius: 0 3px 3px 0;
      transition: transform 0.25s cubic-bezier(0.34,1.56,0.64,1);
    }
    .nav-btn.is-active::after { transform: translateY(-50%) scaleY(1); }

    @keyframes viewEnter {
      from { opacity: 0; transform: translateY(14px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes slideFromRight {
      from { opacity: 0; transform: translateX(20px); }
      to   { opacity: 1; transform: translateX(0); }
    }
    @keyframes floatAnim {
      0%, 100% { transform: translateY(0); }
      50%      { transform: translateY(-6px); }
    }
    .view-enter    { animation: viewEnter 0.4s cubic-bezier(0.16,1,0.3,1) both; }
    .ai-enter      { animation: slideFromRight 0.35s cubic-bezier(0.16,1,0.3,1) both; }
    .float-anim    { animation: floatAnim 3s ease-in-out infinite; }
  `],
  template: `
    <!-- ═══════════════════ LEFT SIDEBAR ═══════════════════ -->
    <aside class="flex flex-col w-52 flex-shrink-0 bg-zinc-950 overflow-hidden relative">

      <!-- Ambient glow -->
      <div class="absolute top-0 right-0 w-40 h-40 pointer-events-none"
           style="background: radial-gradient(circle at 100% 0%, rgba(99,102,241,0.14) 0%, transparent 65%);"></div>

      <!-- Logo -->
      <div class="px-5 pt-6 pb-4 relative">
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
               style="background: linear-gradient(135deg, #6366f1, #8b5cf6);">
            <svg class="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
            </svg>
          </div>
          <span class="text-base font-bold text-white tracking-tight font-display">AirPlan</span>
        </div>
      </div>

      <!-- Project pill -->
      <div class="px-3 pb-4">
        <button class="w-full flex items-center gap-2.5 px-3 py-2.5 bg-zinc-900 hover:bg-zinc-800/80
                       rounded-xl transition-all duration-150 group">
          <div class="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
               style="background: linear-gradient(135deg, #f59e0b, #f97316);">
            <span class="text-white text-xs font-bold">M</span>
          </div>
          <div class="flex-1 text-left min-w-0">
            <p class="text-xs font-semibold text-zinc-200 truncate font-body">MyStartup SaaS</p>
            <p class="text-xs text-zinc-600 font-body">Piano 2025</p>
          </div>
          <svg class="w-3.5 h-3.5 text-zinc-600 group-hover:text-zinc-400 transition-colors flex-shrink-0"
               fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M8 9l4-4 4 4m0 6l-4 4-4-4"/>
          </svg>
        </button>
      </div>

      <div class="mx-4 h-px bg-zinc-800/70 mb-3"></div>

      <!-- Nav -->
      <nav class="flex-1 px-2 space-y-0.5 overflow-y-auto">
        <p class="px-3 mb-2 text-xs font-semibold text-zinc-600 uppercase tracking-[0.12em] font-body">Menu</p>

        @for (item of navItems; track item.id) {
          <button
            (click)="navigate(item)"
            [ngClass]="[
              'nav-btn w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 font-body group relative overflow-hidden',
              isActive(item) ? 'is-active bg-brand-600 text-white' : 'text-zinc-400 hover:bg-zinc-800/70 hover:text-zinc-200'
            ]">

            <!-- Active shimmer overlay -->
            @if (isActive(item)) {
              <div class="absolute inset-0 rounded-xl pointer-events-none"
                   style="background: linear-gradient(135deg, rgba(255,255,255,0.12) 0%, transparent 55%);"></div>
            }

            <svg class="w-4 h-4 flex-shrink-0 z-10 transition-all duration-200 group-hover:scale-110"
                 fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
              <path stroke-linecap="round" stroke-linejoin="round" [attr.d]="item.svgPath"/>
            </svg>
            <span class="flex-1 text-left z-10 text-[13px]">{{ item.label }}</span>

            @if (item.id === 'piano' && hasPlan()) {
              <span [ngClass]="[
                'text-xs px-1.5 py-0.5 rounded-lg font-semibold z-10',
                isActive(item) ? 'bg-white/20 text-white' : 'bg-zinc-800 text-zinc-500'
              ]">1</span>
            }
          </button>
        }
      </nav>

      <div class="mx-4 h-px bg-zinc-800/70 mt-3 mb-3"></div>

      <!-- User -->
      <div class="px-3 pb-5">
        <div class="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-zinc-800/50 transition-colors cursor-pointer">
          <div class="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
               style="background: linear-gradient(135deg, #f59e0b, #ef4444);">
            <span class="text-white text-xs font-bold">F</span>
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-xs font-semibold text-zinc-300 font-body truncate">Founder</p>
            <p class="text-xs text-zinc-600 font-body truncate">Piano Starter</p>
          </div>
          <svg class="w-3.5 h-3.5 text-zinc-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
          </svg>
        </div>
      </div>
    </aside>

    <!-- ═══════════════════ MAIN ═══════════════════ -->
    <main class="flex-1 flex flex-col overflow-hidden bg-zinc-50 min-w-0">

      <!-- Topbar -->
      <header class="h-12 bg-white border-b border-zinc-100 flex items-center px-5 gap-3 flex-shrink-0 shadow-sm">
        <div class="flex items-center gap-1.5 text-xs font-body">
          <span class="text-zinc-400">AirPlan</span>
          <svg class="w-3 h-3 text-zinc-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
          </svg>
          <span class="text-zinc-700 font-semibold">{{ currentTitle() }}</span>
        </div>

        <div class="flex-1"></div>

        @if (currentView() === 'dashboard') {
          <button (click)="goToWizard()"
                  class="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-800 px-3 py-1.5 rounded-lg hover:bg-zinc-100 transition-all font-body">
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
            </svg>
            Modifica
          </button>
          <button class="flex items-center gap-1.5 text-xs text-zinc-600 px-3 py-1.5 rounded-lg border border-zinc-200 hover:border-zinc-300 bg-white transition-all font-body">
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
            </svg>
            PDF
          </button>

          <!-- Save button -->
          <button (click)="onSavePlan()"
                  [ngClass]="[
                    'flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all duration-300 font-body',
                    justSaved()
                      ? 'bg-emerald-500 text-white border-emerald-500'
                      : 'bg-brand-600 text-white border-brand-600 hover:bg-brand-500'
                  ]">
            @if (justSaved()) {
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
              </svg>
              Salvato!
            } @else {
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"/>
              </svg>
              Salva Business Plan
            }
          </button>
        }

        <button (click)="toggleAi()"
                [ngClass]="[
                  'flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all duration-200 font-body',
                  aiOpen() ? 'bg-brand-600 text-white border-brand-600 shadow-md shadow-brand-500/25'
                           : 'bg-white text-zinc-600 border-zinc-200 hover:border-brand-300 hover:text-brand-600'
                ]">
          <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
          </svg>
          AI Copilot
        </button>
      </header>

      <!-- View + AI split -->
      <div class="flex-1 overflow-hidden flex min-h-0">

        <!-- ── VIEWS ── -->
        <div class="flex-1 min-w-0 overflow-hidden">

          <!-- PANORAMICA -->
          @if (currentView() === 'panoramica') {
            <div class="view-enter h-full overflow-y-auto scrollbar-thin p-8">
              <div class="max-w-xl mx-auto">
                <!-- Hero card -->
                <div class="relative rounded-3xl overflow-hidden mb-7 p-8 shadow-xl"
                     style="background: linear-gradient(135deg, #3730a3 0%, #4f46e5 40%, #7c3aed 80%, #9333ea 100%);">
                  <div class="absolute inset-0 pointer-events-none"
                       style="background: radial-gradient(ellipse at 85% 15%, rgba(255,255,255,0.18) 0%, transparent 55%);"></div>
                  <div class="absolute bottom-4 right-6 w-24 h-24 rounded-full pointer-events-none float-anim"
                       style="background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.1);"></div>
                  <div class="absolute bottom-10 right-14 w-12 h-12 rounded-full pointer-events-none"
                       style="background: rgba(255,255,255,0.06); animation: floatAnim 2.5s ease-in-out 0.5s infinite;"></div>
                  <div class="relative z-10">
                    <p class="text-indigo-300 text-xs font-semibold font-body mb-3 uppercase tracking-widest">Benvenuto</p>
                    <h1 class="text-3xl font-bold text-white font-display mb-3 leading-snug">
                      Il tuo Business Plan,<br>senza il mal di testa.
                    </h1>
                    <p class="text-indigo-200 text-sm font-body mb-6 leading-relaxed max-w-xs">
                      3 minuti per inserire i dati. L'AI CFO fa il resto.
                    </p>
                    <div class="flex items-center gap-3">
                      <button (click)="goToWizard()"
                              class="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-brand-700
                                     font-semibold text-sm rounded-xl shadow-lg
                                     hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 font-body">
                        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                        </svg>
                        Inizia ora
                      </button>
                      @if (hasPlan()) {
                        <button (click)="currentView.set('dashboard')"
                                class="inline-flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20
                                       text-white text-sm rounded-xl border border-white/20 transition-all duration-200 font-body">
                          Vedi Piano
                        </button>
                      }
                    </div>
                  </div>
                </div>

                <!-- Feature grid -->
                <div class="grid grid-cols-3 gap-3">
                  @for (feat of features; track feat.title; let i = $index) {
                    <div class="bg-white rounded-2xl border border-zinc-100 p-4 shadow-card
                                hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200 cursor-default"
                         [style.animation-delay]="(i * 90 + 100) + 'ms'"
                         style="animation: viewEnter 0.5s cubic-bezier(0.16,1,0.3,1) both;">
                      <div class="w-8 h-8 rounded-lg flex items-center justify-center mb-3" [class]="feat.bg">
                        <span class="text-base">{{ feat.icon }}</span>
                      </div>
                      <p class="text-xs font-bold text-zinc-800 font-display mb-1">{{ feat.title }}</p>
                      <p class="text-xs text-zinc-400 font-body leading-relaxed">{{ feat.desc }}</p>
                    </div>
                  }
                </div>
              </div>
            </div>
          }

          <!-- WIZARD -->
          @if (currentView() === 'wizard') {
            <div class="view-enter flex flex-col h-full overflow-hidden">
              <app-wizard-form (planGenerated)="onPlanGenerated()"/>
            </div>
          }

          <!-- DASHBOARD -->
          @if (currentView() === 'dashboard') {
            <div class="view-enter flex flex-col h-full overflow-hidden">
              <app-dashboard-cruscotto/>
            </div>
          }

          <!-- SCENARI -->
          @if (currentView() === 'scenari') {
            <div class="view-enter h-full overflow-y-auto scrollbar-thin p-8">
              <div class="max-w-xl mx-auto">
                <p class="text-xs font-semibold text-brand-600 uppercase tracking-widest font-body mb-1">Scenari</p>
                <h1 class="text-2xl font-bold text-zinc-900 font-display mb-1">What-If Simulator</h1>
                <p class="text-sm text-zinc-500 font-body mb-7">Clicca uno scenario per aprirlo nell'AI Copilot.</p>

                <div class="space-y-3">
                  @for (s of scenariExamples; track s.q; let i = $index) {
                    <button
                      class="w-full bg-white rounded-2xl border border-zinc-100 p-4 shadow-card text-left
                             hover:border-brand-200 hover:shadow-card-hover hover:-translate-y-0.5
                             transition-all duration-200 group"
                      [style.animation-delay]="(i * 65 + 50) + 'ms'"
                      style="animation: viewEnter 0.45s cubic-bezier(0.16,1,0.3,1) both;"
                      (click)="openAiWithScenario(s.q)">
                      <div class="flex items-center gap-4">
                        <div class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" [class]="s.bg">
                          <span class="text-lg">{{ s.icon }}</span>
                        </div>
                        <div class="flex-1 min-w-0">
                          <p class="text-sm font-semibold text-zinc-800 font-body group-hover:text-brand-700 transition-colors">{{ s.title }}</p>
                          <p class="text-xs text-zinc-400 font-body mt-0.5 italic truncate">"{{ s.q }}"</p>
                        </div>
                        <svg class="w-4 h-4 text-zinc-300 group-hover:text-brand-500 group-hover:translate-x-0.5
                                    transition-all flex-shrink-0"
                             fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/>
                        </svg>
                      </div>
                    </button>
                  }
                </div>

                @if (!hasPlan()) {
                  <div class="mt-6 p-4 bg-amber-50 rounded-2xl border border-amber-100"
                       style="animation: viewEnter 0.5s 0.3s cubic-bezier(0.16,1,0.3,1) both;">
                    <p class="text-sm text-amber-700 font-body">
                      <strong>Prima</strong> genera un Business Plan.
                      <button (click)="goToWizard()" class="ml-1 underline font-bold hover:text-amber-900 transition-colors">
                        Vai al wizard →
                      </button>
                    </p>
                  </div>
                }
              </div>
            </div>
          }

          <!-- PIANI SALVATI -->
          @if (currentView() === 'piani-salvati') {
            <div class="view-enter h-full overflow-y-auto scrollbar-thin p-8">
              <div class="max-w-4xl mx-auto">
                <div class="flex items-start justify-between mb-7">
                  <div>
                    <p class="text-xs font-semibold text-brand-600 uppercase tracking-widest font-body mb-1">Archivio</p>
                    <h1 class="text-2xl font-bold text-zinc-900 font-display">I Miei Piani</h1>
                    <p class="text-sm text-zinc-500 font-body mt-1">{{ planService.savedPlans().length }} piani salvati</p>
                  </div>
                  <button (click)="goToWizard()"
                          class="flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-500
                                 text-white text-sm font-semibold rounded-xl transition-all duration-200 font-body
                                 hover:-translate-y-0.5 shadow-md shadow-brand-500/25">
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/>
                    </svg>
                    Nuovo Piano
                  </button>
                </div>

                @if (planService.savedPlans().length === 0) {
                  <div class="text-center py-20">
                    <div class="w-16 h-16 rounded-2xl bg-zinc-100 flex items-center justify-center mx-auto mb-4 float-anim">
                      <svg class="w-7 h-7 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8l1 12h12l1-12"/>
                      </svg>
                    </div>
                    <p class="text-sm font-semibold text-zinc-600 font-display mb-1">Nessun piano salvato</p>
                    <p class="text-xs text-zinc-400 font-body">Genera un piano e premi "Salva Business Plan".</p>
                  </div>
                } @else {
                  <div class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                    @for (plan of planService.savedPlans(); track plan.id; let i = $index) {
                      <div class="bg-white rounded-2xl border border-zinc-100 shadow-card hover:shadow-card-hover
                                  hover:-translate-y-0.5 transition-all duration-200 overflow-hidden"
                           [style.animation-delay]="(i * 60) + 'ms'"
                           style="animation: viewEnter 0.4s cubic-bezier(0.16,1,0.3,1) both;">

                        <!-- Card header -->
                        <div class="px-5 pt-5 pb-4 border-b border-zinc-50">
                          <div class="flex items-start justify-between gap-3">
                            <div class="min-w-0">
                              <p class="text-sm font-bold text-zinc-900 font-display truncate">{{ plan.name }}</p>
                              <p class="text-xs text-zinc-400 font-body mt-0.5">{{ formatDate(plan.savedAt) }}</p>
                            </div>
                            <button (click)="planService.deletePlan(plan.id)"
                                    class="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0
                                           text-zinc-300 hover:text-rose-500 hover:bg-rose-50 transition-all">
                              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
                              </svg>
                            </button>
                          </div>
                        </div>

                        <!-- KPI mini grid -->
                        <div class="px-5 py-4 grid grid-cols-2 gap-3">
                          <div>
                            <p class="text-xs text-zinc-400 font-body">Fatturato Y1</p>
                            <p class="text-sm font-bold text-zinc-800 font-mono mt-0.5">{{ formatK(plan.kpi.fatturatoTotale) }}</p>
                          </div>
                          <div>
                            <p class="text-xs text-zinc-400 font-body">EBITDA Y1</p>
                            <p [ngClass]="['text-sm font-bold font-mono mt-0.5', plan.kpi.ebitda >= 0 ? 'text-emerald-600' : 'text-rose-500']">
                              {{ formatK(plan.kpi.ebitda) }}
                            </p>
                          </div>
                          <div>
                            <p class="text-xs text-zinc-400 font-body">Utile Netto</p>
                            <p [ngClass]="['text-sm font-bold font-mono mt-0.5', plan.kpi.utileNetto >= 0 ? 'text-zinc-800' : 'text-rose-500']">
                              {{ formatK(plan.kpi.utileNetto) }}
                            </p>
                          </div>
                          <div>
                            <p class="text-xs text-zinc-400 font-body">Cash Runway</p>
                            <p class="text-sm font-bold text-zinc-800 font-mono mt-0.5">{{ plan.kpi.cashRunway }} mesi</p>
                          </div>
                        </div>

                        <!-- Sustainability badge -->
                        <div class="px-5 pb-4">
                          <div [ngClass]="[
                            'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold font-body',
                            plan.kpi.ebitda >= 0
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-amber-50 text-amber-700'
                          ]">
                            <div [ngClass]="['w-1.5 h-1.5 rounded-full', plan.kpi.ebitda >= 0 ? 'bg-emerald-500' : 'bg-amber-500']"></div>
                            {{ plan.kpi.ebitda >= 0 ? 'Piano sostenibile' : 'Rivedere i costi' }}
                          </div>
                        </div>

                        <!-- Action -->
                        <div class="px-5 pb-5">
                          <button (click)="loadAndNavigate(plan)"
                                  class="w-full flex items-center justify-center gap-2 px-4 py-2.5
                                         bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-semibold
                                         rounded-xl transition-all duration-200 font-body">
                            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                              <path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>
                            </svg>
                            Carica Piano
                          </button>
                        </div>

                      </div>
                    }
                  </div>
                }
              </div>
            </div>
          }

          <!-- REPORT -->
          @if (currentView() === 'report') {
            <div class="view-enter h-full flex items-center justify-center p-8">
              <div class="text-center max-w-xs">
                <div class="w-20 h-20 rounded-3xl bg-zinc-100 flex items-center justify-center mx-auto mb-5 float-anim">
                  <span class="text-4xl">📄</span>
                </div>
                <h2 class="text-xl font-bold text-zinc-800 font-display mb-2">Report & Export</h2>
                <p class="text-sm text-zinc-500 font-body leading-relaxed mb-5">
                  Esporta il Business Plan in PDF professionale, Excel o condividilo via link protetto.
                </p>
                <span class="inline-flex items-center gap-2 px-4 py-2 bg-zinc-100 text-zinc-500 rounded-full text-xs font-medium font-body">
                  <span class="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                  In sviluppo
                </span>
              </div>
            </div>
          }

          <!-- IMPOSTAZIONI -->
          @if (currentView() === 'impostazioni') {
            <div class="view-enter h-full overflow-y-auto scrollbar-thin p-8">
              <div class="max-w-lg mx-auto">
                <p class="text-xs font-semibold text-brand-600 uppercase tracking-widest font-body mb-1">Config</p>
                <h1 class="text-2xl font-bold text-zinc-900 font-display mb-7">Impostazioni</h1>
                <div class="space-y-4">
                  @for (section of settingSections; track section.label; let i = $index) {
                    <div class="bg-white rounded-2xl border border-zinc-100 p-5 shadow-card"
                         [style.animation-delay]="(i * 70 + 50) + 'ms'"
                         style="animation: viewEnter 0.45s cubic-bezier(0.16,1,0.3,1) both;">
                      <p class="text-xs font-bold text-zinc-400 uppercase tracking-widest font-body mb-4">{{ section.label }}</p>
                      <div class="space-y-4">
                        @for (item of section.items; track item.key) {
                          <div class="flex items-center justify-between">
                            <div class="flex-1 pr-4">
                              <p class="text-sm font-medium text-zinc-700 font-body">{{ item.label }}</p>
                              <p class="text-xs text-zinc-400 font-body mt-0.5">{{ item.desc }}</p>
                            </div>
                            <button
                              (click)="item.enabled = !item.enabled"
                              [ngClass]="[
                                'relative w-11 h-6 rounded-full transition-all duration-300 flex-shrink-0',
                                item.enabled ? 'bg-brand-600' : 'bg-zinc-200'
                              ]">
                              <div [ngClass]="[
                                'absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all duration-300',
                                item.enabled ? 'left-6' : 'left-1'
                              ]"></div>
                            </button>
                          </div>
                        }
                      </div>
                    </div>
                  }
                </div>
              </div>
            </div>
          }

        </div>

        <!-- AI Panel -->
        @if (aiOpen()) {
          <div class="ai-enter w-80 flex-shrink-0 border-l border-zinc-100 overflow-hidden">
            <app-ai-chatbot/>
          </div>
        }

      </div>
    </main>
  `,
})
export class AppLayoutComponent {
  readonly planService = inject(BusinessPlanService);

  currentView = signal<View>('panoramica');
  aiOpen = signal(false);
  hasPlan = signal(false);
  justSaved = signal(false);

  navItems: NavItem[] = [
    {
      id: 'panoramica', view: 'panoramica', label: 'Panoramica',
      svgPath: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
    },
    {
      id: 'piano', view: 'wizard', label: 'Business Plan',
      svgPath: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
    },
    {
      id: 'piani-salvati', view: 'piani-salvati', label: 'I Miei Piani',
      svgPath: 'M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8l1 12h12l1-12',
    },
    {
      id: 'scenari', view: 'scenari', label: 'Scenari',
      svgPath: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z',
    },
    {
      id: 'report', view: 'report', label: 'Report',
      svgPath: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
    },
    {
      id: 'impostazioni', view: 'impostazioni', label: 'Impostazioni',
      svgPath: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z',
    },
  ];

  features = [
    { icon: '⚡', title: 'Wizard 3 min', desc: 'Input guidato, nessun Excel.', bg: 'bg-brand-50' },
    { icon: '📊', title: 'Dashboard Live', desc: 'KPI, grafici, conto economico.', bg: 'bg-violet-50' },
    { icon: '🤖', title: 'AI Copilot', desc: 'Scenari What-If in 2 secondi.', bg: 'bg-emerald-50' },
  ];

  scenariExamples = [
    { icon: '💰', title: 'Variazione Prezzo',  q: 'Cosa succede se alzo il prezzo a 59€?',             bg: 'bg-blue-50' },
    { icon: '👥', title: 'Espansione Team',    q: 'Simula 2 dipendenti in più dal Q3',                  bg: 'bg-violet-50' },
    { icon: '📉', title: 'Riduzione Costi',    q: 'Quanto runway guadagno tagliando il marketing 20%?', bg: 'bg-emerald-50' },
    { icon: '🌍', title: 'Nuovo Mercato',      q: 'Proiezione se lancio in UK con volume +30%',         bg: 'bg-amber-50' },
  ];

  settingSections: { label: string; items: SettingItem[] }[] = [
    {
      label: 'Progetto',
      items: [
        { key: 'notify',   label: 'Notifiche AI',       desc: "Avvisi quando l'AI aggiorna il piano", enabled: true },
        { key: 'autosave', label: 'Salvataggio Auto',   desc: 'Salva modifiche automaticamente',       enabled: true },
      ]
    },
    {
      label: 'Visualizzazione',
      items: [
        { key: 'currency', label: 'Formato in migliaia', desc: 'Mostra i valori in K€',             enabled: false },
        { key: 'dark',     label: 'Tema Scuro',          desc: 'Interfaccia in dark mode',           enabled: false },
      ]
    }
  ];

  readonly currentTitle = computed(() => {
    const map: Record<View, string> = {
      panoramica:      'Panoramica',
      wizard:          'Nuovo Piano',
      dashboard:       'Business Plan',
      scenari:         'Scenari What-If',
      report:          'Report',
      impostazioni:    'Impostazioni',
      'piani-salvati': 'I Miei Piani',
    };
    return map[this.currentView()];
  });

  isActive(item: NavItem): boolean {
    const v = this.currentView();
    if (item.id === 'piano') return v === 'wizard' || v === 'dashboard';
    return v === item.view;
  }

  onSavePlan(): void {
    this.planService.savePlan();
    this.justSaved.set(true);
    setTimeout(() => this.justSaved.set(false), 2200);
  }

  loadAndNavigate(plan: SavedPlan): void {
    this.planService.loadPlan(plan);
    this.hasPlan.set(true);
    this.currentView.set('dashboard');
  }

  formatK(value: number): string {
    const abs = Math.abs(value);
    const sign = value < 0 ? '-' : '';
    if (abs >= 1_000_000) return `${sign}€${(abs / 1_000_000).toFixed(1)}M`;
    if (abs >= 1_000)     return `${sign}€${Math.round(abs / 1000)}K`;
    return `${sign}€${abs}`;
  }

  formatDate(date: Date): string {
    return new Intl.DateTimeFormat('it-IT', { day: '2-digit', month: 'short', year: 'numeric' }).format(date);
  }

  navigate(item: NavItem): void {
    if (item.id === 'piano') {
      this.currentView.set(this.hasPlan() ? 'dashboard' : 'wizard');
    } else {
      this.currentView.set(item.view);
    }
  }

  goToWizard(): void {
    this.currentView.set('wizard');
  }

  onPlanGenerated(): void {
    this.hasPlan.set(true);
    this.currentView.set('dashboard');
    this.aiOpen.set(true);
  }

  toggleAi(): void {
    this.aiOpen.update(v => !v);
  }

  openAiWithScenario(_q: string): void {
    this.aiOpen.set(true);
  }
}
