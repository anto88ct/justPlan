import { Component, signal, computed, inject, HostBinding, OnInit } from '@angular/core';
import { ThemeService } from '../../services/theme.service';
import { CommonModule, NgClass } from '@angular/common';
import { MatTooltipModule } from '@angular/material/tooltip';
import { WizardFormComponent } from '../wizard-form/wizard-form.component';
import { DashboardCruscottoComponent } from '../dashboard-cruscotto/dashboard-cruscotto.component';
import { AiChatbotComponent } from '../ai-chatbot/ai-chatbot.component';
import { ReportComponent } from '../report/report.component';
import { ProfileComponent } from '../profile/profile.component';
import { BusinessPlanService, SavedPlan } from '../../services/business-plan.service';

type View = 'panoramica' | 'wizard' | 'dashboard' | 'scenari' | 'report' | 'impostazioni' | 'piani-salvati' | 'profilo';

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
  imports: [CommonModule, NgClass, MatTooltipModule, WizardFormComponent, DashboardCruscottoComponent, AiChatbotComponent, ReportComponent, ProfileComponent],
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

    .sidebar-wrap {
      transition: width 0.28s cubic-bezier(0.4,0,0.2,1);
    }

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
    @keyframes shimmerPulse {
      0%, 100% { opacity: 0.25; }
      50%      { opacity: 0.55; }
    }
    @keyframes progressLine {
      from { transform: scaleX(0); }
      to   { transform: scaleX(1); }
    }

    .view-enter    { animation: viewEnter 0.4s cubic-bezier(0.16,1,0.3,1) both; }
    .ai-enter      { animation: slideFromRight 0.35s cubic-bezier(0.16,1,0.3,1) both; }
    .float-anim    { animation: floatAnim 3s ease-in-out infinite; }
    .shimmer-bar   { animation: shimmerPulse 1.8s ease-in-out infinite; }

    .step-card:hover .step-cta-arrow {
      transform: translateX(2px);
    }
    .step-cta-arrow { transition: transform 0.2s ease; }

    :host.resizing { cursor: col-resize; user-select: none; }
  `],
  template: `
    <!-- Mobile backdrop -->
    @if (sidebarOpen()) {
      <div class="fixed inset-0 bg-black/60 z-40 lg:hidden"
           (click)="sidebarOpen.set(false)"></div>
    }

    <!-- ═══════════════════ LEFT SIDEBAR ═══════════════════ -->
    <aside [ngClass]="[
        'sidebar-wrap flex flex-col flex-shrink-0 bg-zinc-950 overflow-y-auto overflow-x-clip',
        'fixed inset-y-0 left-0 z-50 transition-transform duration-300 ease-in-out',
        'lg:relative lg:translate-x-0 lg:inset-auto lg:z-auto',
        sidebarOpen()  ? 'translate-x-0' : '-translate-x-full',
        sidebarCollapsed() ? 'lg:w-14' : 'lg:w-56',
        'w-56'
      ]">

      <!-- Ambient glow -->
      <div class="absolute top-0 right-0 w-40 h-40 pointer-events-none"
           style="background: radial-gradient(circle at 100% 0%, rgba(99,102,241,0.14) 0%, transparent 65%);"></div>

      <!-- Logo row + collapse toggle -->
      @if (sidebarCollapsed()) {
        <div class="pt-5 pb-4 flex justify-center">
          <button (click)="toggleSidebar()" matTooltip="Espandi sidebar" matTooltipPosition="right"
                  class="hidden lg:flex w-8 h-8 rounded-xl items-center justify-center
                         transition-all hover:scale-110 hover:ring-2 hover:ring-indigo-400/40"
                  style="background: linear-gradient(135deg, #6366f1, #8b5cf6);">
            <svg class="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
            </svg>
          </button>
          <div class="lg:hidden w-8 h-8 rounded-xl flex items-center justify-center"
               style="background: linear-gradient(135deg, #6366f1, #8b5cf6);">
            <svg class="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
            </svg>
          </div>
        </div>
      } @else {
        <div class="px-3 pt-5 pb-4 flex items-center justify-between">
          <div class="flex items-center gap-2.5 min-w-0">
            <div class="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                 style="background: linear-gradient(135deg, #6366f1, #8b5cf6);">
              <svg class="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
              </svg>
            </div>
            <span class="text-base font-bold text-white tracking-tight font-display">AirPlan</span>
          </div>
          <button (click)="toggleSidebar()" title="Comprimi sidebar"
                  class="hidden lg:flex w-6 h-6 rounded-lg items-center justify-center
                         text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800 transition-all flex-shrink-0">
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M11 19l-7-7 7-7m8 14l-7-7 7-7"/>
            </svg>
          </button>
        </div>
      }

      <!-- Project pill -->
      @if (!sidebarCollapsed()) {
        <div class="px-3 pb-4">
          <button class="w-full flex items-center gap-2.5 px-3 py-2.5 bg-zinc-900 hover:bg-zinc-800/80
                         rounded-xl transition-all duration-150 group">
            <div class="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
                 style="background: linear-gradient(135deg, #f59e0b, #f97316);">
              <span class="text-white text-xs font-bold">{{ projectInitial() }}</span>
            </div>
            <div class="flex-1 text-left min-w-0">
              <p class="text-xs font-semibold text-zinc-200 truncate font-body">{{ projectDisplayName() }}</p>
              <p class="text-xs text-zinc-600 font-body">Piano {{ planService.currentStartYear() }}</p>
            </div>
            <svg class="w-3.5 h-3.5 text-zinc-600 group-hover:text-zinc-400 transition-colors flex-shrink-0"
                 fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M8 9l4-4 4 4m0 6l-4 4-4-4"/>
            </svg>
          </button>
        </div>
      }

      <div class="mx-3 h-px bg-zinc-800/70 mb-3"></div>

      <!-- Nav -->
      <nav class="flex-1 px-2 space-y-0.5 overflow-y-auto">
        @if (!sidebarCollapsed()) {
          <p class="px-3 mb-2 text-xs font-semibold text-zinc-600 uppercase tracking-[0.12em] font-body">Menu</p>
        }

        @for (item of navItems; track item.id) {
          <button
            (click)="navigate(item)"
            [matTooltip]="sidebarCollapsed() ? item.label : ''"
            matTooltipPosition="right"
            [ngClass]="[
              'nav-btn w-full flex items-center px-3 py-2.5 rounded-xl text-sm transition-all duration-200 font-body group relative overflow-hidden',
              sidebarCollapsed() ? 'justify-center gap-0' : 'gap-3',
              isActive(item) ? 'is-active bg-brand-600 text-white' : 'text-zinc-400 hover:bg-zinc-800/70 hover:text-zinc-200'
            ]">
            @if (isActive(item)) {
              <div class="absolute inset-0 rounded-xl pointer-events-none"
                   style="background: linear-gradient(135deg, rgba(255,255,255,0.12) 0%, transparent 55%);"></div>
            }
            <svg class="w-4 h-4 flex-shrink-0 z-10 transition-all duration-200 group-hover:scale-110"
                 fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
              <path stroke-linecap="round" stroke-linejoin="round" [attr.d]="item.svgPath"/>
            </svg>
            @if (!sidebarCollapsed()) {
              <span class="flex-1 text-left z-10 text-[13px]">{{ item.label }}</span>
              @if (item.id === 'piano' && hasPlan()) {
                <span [ngClass]="[
                  'text-xs px-1.5 py-0.5 rounded-lg font-semibold z-10',
                  isActive(item) ? 'bg-white/20 text-white' : 'bg-zinc-800 text-zinc-500'
                ]">1</span>
              }
            }
          </button>
        }
      </nav>

      <div class="mx-3 h-px bg-zinc-800/70 mt-3 mb-3"></div>

      <!-- User -->
      <div class="px-2 pb-4">
        <button
          (click)="navigate({ id: 'profilo', view: 'profilo' })"
          [matTooltip]="sidebarCollapsed() ? 'Profilo' : ''"
          matTooltipPosition="right"
          [ngClass]="[
            'w-full flex items-center rounded-xl hover:bg-zinc-800/50 transition-colors py-2 px-2',
            sidebarCollapsed() ? 'justify-center gap-0' : 'gap-3'
          ]"
          [class.bg-zinc-800]="currentView() === 'profilo'">
          <div class="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
               style="background: linear-gradient(135deg, #f59e0b, #ef4444);">
            <span class="text-white text-xs font-bold">F</span>
          </div>
          @if (!sidebarCollapsed()) {
            <div class="flex-1 min-w-0 text-left">
              <p class="text-xs font-semibold text-zinc-300 font-body truncate">Founder</p>
              <p class="text-xs text-zinc-600 font-body truncate">Piano Starter</p>
            </div>
            <svg class="w-3.5 h-3.5 text-zinc-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round"
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
            </svg>
          }
        </button>
      </div>
    </aside>

    <!-- ═══════════════════ MAIN ═══════════════════ -->
    <main class="flex-1 flex flex-col overflow-hidden bg-zinc-50 dark:bg-zinc-950 min-w-0">

      <!-- Topbar -->
      <header class="h-12 bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800 flex items-center px-3 md:px-5 gap-1 md:gap-2 flex-shrink-0 shadow-sm overflow-hidden">
        <button (click)="sidebarOpen.set(true)"
                class="lg:hidden flex items-center justify-center w-8 h-8 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors flex-shrink-0">
          <svg class="w-4 h-4 text-zinc-600 dark:text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16"/>
          </svg>
        </button>
        <div class="flex items-center gap-1.5 text-xs font-body">
          <span class="text-zinc-400 dark:text-zinc-500">AirPlan</span>
          <svg class="w-3 h-3 text-zinc-300 dark:text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
          </svg>
          <span class="text-zinc-700 dark:text-zinc-300 font-semibold">{{ currentTitle() }}</span>
        </div>

        <div class="flex-1"></div>

        @if (currentView() === 'dashboard') {
          <button (click)="goToWizard()"
                  class="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 px-2 sm:px-3 py-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all font-body flex-shrink-0">
            <svg class="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
            </svg>
            <span class="hidden sm:inline">Modifica</span>
          </button>
          <button (click)="exportPdf()" class="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400 px-2 sm:px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600 bg-white dark:bg-zinc-800 transition-all font-body flex-shrink-0">
            <svg class="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
            </svg>
            <span class="hidden sm:inline">PDF</span>
          </button>
          <button (click)="onSavePlan()"
                  [ngClass]="[
                    'flex items-center gap-1.5 text-xs font-semibold px-2 sm:px-3 py-1.5 rounded-lg border transition-all duration-300 font-body flex-shrink-0',
                    justSaved()
                      ? 'bg-emerald-500 text-white border-emerald-500'
                      : 'bg-brand-600 text-white border-brand-600 hover:bg-brand-500'
                  ]">
            @if (justSaved()) {
              <svg class="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
              </svg>
              <span class="hidden sm:inline">Salvato!</span>
            } @else {
              <svg class="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"/>
              </svg>
              <span class="hidden sm:inline">Salva Business Plan</span>
            }
          </button>
        }

        <button (click)="toggleAi()"
                [ngClass]="[
                  'flex items-center gap-1.5 text-xs font-semibold px-2 sm:px-3 py-1.5 rounded-lg border transition-all duration-200 font-body flex-shrink-0',
                  aiOpen() ? 'bg-brand-600 text-white border-brand-600 shadow-md shadow-brand-500/25'
                           : 'bg-white text-zinc-600 border-zinc-200 hover:border-brand-300 hover:text-brand-600'
                ]">
          <svg class="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
          </svg>
          <span class="hidden sm:inline">AI Copilot</span>
        </button>
      </header>

      <!-- View + AI split -->
      <div class="flex-1 overflow-hidden flex flex-col lg:flex-row min-h-0">

        <!-- ── VIEWS ── -->
        <div class="flex-1 min-w-0 overflow-hidden">

          <!-- ════════════════════════════════════════════════════════
               PANORAMICA — redesigned with tutorial + animated hero
               ════════════════════════════════════════════════════════ -->
          @if (currentView() === 'panoramica') {
            <div class="view-enter h-full overflow-y-auto scrollbar-thin">
              <div class="max-w-3xl mx-auto px-4 py-7 space-y-5">

                <!-- ─── HERO: dark split layout ─── -->
                <div class="relative rounded-3xl overflow-hidden shadow-xl"
                     style="background: linear-gradient(155deg, #18181b 0%, #27272a 40%, #1e1b4b 100%);">

                  <!-- Dot grid texture -->
                  <div class="absolute inset-0 pointer-events-none"
                       style="background-image: radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px); background-size: 22px 22px; opacity: 0.35;"></div>

                  <!-- Ambient glow blobs -->
                  <div class="absolute top-0 right-0 w-72 h-72 pointer-events-none"
                       style="background: radial-gradient(circle at 100% 0%, rgba(99,102,241,0.28) 0%, transparent 60%);"></div>
                  <div class="absolute bottom-0 left-0 w-48 h-48 pointer-events-none"
                       style="background: radial-gradient(circle at 0% 100%, rgba(139,92,246,0.14) 0%, transparent 65%);"></div>

                  <!-- Decorative floating orbs -->
                  <div class="absolute bottom-5 right-10 w-20 h-20 rounded-full pointer-events-none float-anim"
                       style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);"></div>
                  <div class="absolute bottom-14 right-20 w-10 h-10 rounded-full pointer-events-none"
                       style="background: rgba(255,255,255,0.03); animation: floatAnim 2.6s ease-in-out 0.45s infinite;"></div>
                  <div class="absolute top-8 right-32 w-6 h-6 rounded-full pointer-events-none"
                       style="background: rgba(255,255,255,0.05); animation: floatAnim 3.2s ease-in-out 0.8s infinite;"></div>

                  <!-- Content: split flex layout -->
                  <div class="relative z-10 flex flex-col sm:flex-row">

                    <!-- Left: headline + CTA -->
                    <div class="flex-1 p-7 md:p-8">
                      <p class="text-indigo-400 text-[10px] font-bold font-body uppercase tracking-[0.2em] mb-3">
                        Il tuo CFO Virtuale
                      </p>
                      <h1 class="text-2xl md:text-[1.85rem] font-bold text-white font-display mb-3 leading-tight tracking-tight">
                        Business Plan in<br>3 minuti. Davvero.
                      </h1>
                      <p class="text-zinc-400 text-sm font-body mb-6 leading-relaxed max-w-[300px]">
                        Inserisci i dati una volta. L'AI Copilot analizza, simula e ottimizza il tuo piano finanziario.
                      </p>
                      <div class="flex items-center gap-3 flex-wrap">
                        <button (click)="goToWizard()"
                                class="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-500 hover:bg-brand-400
                                       text-white font-semibold text-sm rounded-xl transition-all duration-200 font-body
                                       shadow-lg shadow-brand-600/30 hover:-translate-y-0.5 active:scale-[0.98]">
                          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                          </svg>
                          Inizia ora
                        </button>
                        @if (hasPlan()) {
                          <button (click)="currentView.set('dashboard')"
                                  class="inline-flex items-center gap-2 px-4 py-2.5 hover:bg-white/10
                                         text-zinc-300 text-sm rounded-xl border border-white/15 transition-all duration-200 font-body">
                            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                              <path stroke-linecap="round" stroke-linejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                            </svg>
                            Vedi Piano
                          </button>
                        }
                      </div>
                    </div>

                    <!-- Right: animated KPI preview (hidden xs, shown sm+) -->
                    <div class="hidden sm:flex flex-col gap-2 justify-center px-6 pb-7 md:pb-0 md:py-7 md:pl-0 md:pr-8 min-w-[180px]">
                      @if (hasPlan()) {
                        @for (kpi of liveKpis().slice(0, 3); track kpi.label; let i = $index) {
                          <div class="animate-kpi-in bg-white/10 backdrop-blur-sm rounded-xl px-3 py-2.5 border border-white/10"
                               [style.animation-delay]="(i * 85) + 'ms'">
                            <p class="text-zinc-500 text-[10px] font-body mb-0.5">{{ kpi.label }}</p>
                            <p class="text-white text-base font-bold font-mono">{{ kpi.value }}</p>
                          </div>
                        }
                      } @else {
                        <!-- Shimmer skeleton (no plan yet) -->
                        @for (idx of [0, 1, 2]; track idx) {
                          <div class="rounded-xl px-3 py-2.5 border border-white/8"
                               style="background: rgba(255,255,255,0.05);"
                               [style.animation-delay]="(idx * 100) + 'ms'">
                            <div class="h-1.5 w-14 rounded-full mb-2 shimmer-bar"
                                 style="background: rgba(255,255,255,0.18);"
                                 [style.animation-delay]="(idx * 80) + 'ms'"></div>
                            <div class="h-4 w-20 rounded-full shimmer-bar"
                                 style="background: rgba(255,255,255,0.25);"
                                 [style.animation-delay]="(idx * 80 + 200) + 'ms'"></div>
                          </div>
                        }
                      }
                    </div>
                  </div>
                </div>

                <!-- ─── LIVE KPIS (only if plan exists) ─── -->
                @if (hasPlan()) {
                  <div>
                    <p class="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.16em] font-body mb-3">
                      Piano corrente
                    </p>
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
                      @for (kpi of liveKpis(); track kpi.label; let i = $index) {
                        <div class="animate-kpi-in bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-card
                                     hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200 p-4"
                             [style.animation-delay]="(i * 55 + 40) + 'ms'">
                          <p class="text-[11px] text-zinc-400 dark:text-zinc-500 font-medium font-body truncate mb-0.5">{{ kpi.label }}</p>
                          <p class="text-lg font-bold font-mono text-zinc-900 dark:text-zinc-100 number-highlight">{{ kpi.value }}</p>
                        </div>
                      }
                    </div>
                  </div>
                }

                <!-- ─── TUTORIAL STEPS ─── -->
                <div>
                  <div class="flex items-baseline justify-between mb-4">
                    <div>
                      <p class="text-[10px] font-semibold text-brand-500 uppercase tracking-[0.18em] font-body mb-0.5">
                        Come funziona
                      </p>
                      <h2 class="text-base font-bold text-zinc-900 dark:text-zinc-100 font-display">Guida rapida</h2>
                    </div>
                    @if (!hasPlan()) {
                      <span class="text-[10px] text-zinc-400 dark:text-zinc-500 font-body hidden sm:block">
                        Clicca un passo per iniziare
                      </span>
                    }
                  </div>

                  <!-- 2-col mobile, 4-col md -->
                  <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
                    @for (step of tutorialSteps(); track step.num; let i = $index) {
                      <button
                        class="step-card animate-kpi-in bg-white dark:bg-zinc-900 rounded-2xl border shadow-card
                               hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200
                               p-4 text-left cursor-pointer group relative overflow-hidden"
                        [ngClass]="step.done ? 'border-emerald-100 dark:border-emerald-700 ring-1 ring-emerald-50 dark:ring-emerald-900/40' : 'border-zinc-100 dark:border-zinc-800'"
                        [style.animation-delay]="(i * 70 + 120) + 'ms'"
                        (click)="navigateToStep(step)">

                        <!-- Completion badge -->
                        @if (step.done) {
                          <div class="absolute top-3 right-3 z-10">
                            <div class="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center">
                              <svg class="w-3 h-3 text-emerald-600" fill="none" viewBox="0 0 24 24"
                                   stroke="currentColor" stroke-width="3">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
                              </svg>
                            </div>
                          </div>
                        }

                        <!-- Large muted step number as bg decoration -->
                        <span class="absolute bottom-1 right-2 text-5xl font-bold select-none leading-none font-display"
                              [ngClass]="step.done ? 'text-emerald-50 dark:text-emerald-900/20' : 'text-zinc-50 dark:text-zinc-800'">
                          {{ step.num }}
                        </span>

                        <!-- Icon -->
                        <div class="w-8 h-8 rounded-xl flex items-center justify-center mb-3 relative z-10"
                             [ngClass]="step.iconBg">
                          <svg class="w-4 h-4" [ngClass]="step.iconColor"
                               fill="none" stroke="currentColor" stroke-width="1.5"
                               viewBox="0 0 24 24" aria-hidden="true">
                            <path stroke-linecap="round" stroke-linejoin="round" [attr.d]="step.iconPath"/>
                          </svg>
                        </div>

                        <!-- Title + description -->
                        <p class="text-[12px] font-bold text-zinc-900 dark:text-zinc-100 font-display mb-1 leading-snug relative z-10">
                          {{ step.title }}
                        </p>
                        <p class="text-[10px] text-zinc-400 dark:text-zinc-500 font-body leading-relaxed relative z-10 line-clamp-2">
                          {{ step.desc }}
                        </p>

                        <!-- Hover CTA -->
                        <div class="flex items-center gap-1 mt-3 relative z-10">
                          <span class="text-[10px] font-semibold font-body transition-colors"
                                [ngClass]="step.done ? 'text-emerald-400 group-hover:text-emerald-600' : 'text-zinc-300 group-hover:text-brand-500'">
                            {{ step.cta }}
                          </span>
                          <svg class="step-cta-arrow w-3 h-3 transition-colors"
                               [ngClass]="step.done ? 'text-emerald-400 group-hover:text-emerald-600' : 'text-zinc-300 group-hover:text-brand-500'"
                               fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/>
                          </svg>
                        </div>
                      </button>
                    }
                  </div>

                  <!-- AI tip banner -->
                  <div class="mt-3 flex items-center gap-3 px-4 py-3 bg-brand-50 dark:bg-brand-950/40 rounded-2xl border border-brand-100 dark:border-brand-900/50 animate-fade-in"
                       style="animation-delay: 560ms">
                    <div class="w-8 h-8 rounded-xl bg-brand-100 dark:bg-brand-900/40 flex items-center justify-center flex-shrink-0">
                      <svg class="w-4 h-4 text-brand-600 dark:text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
                      </svg>
                    </div>
                    <div class="flex-1 min-w-0">
                      <p class="text-xs font-semibold text-brand-700 dark:text-brand-300 font-body">Suggerimento</p>
                      <p class="text-[11px] text-brand-600 dark:text-brand-400 font-body leading-relaxed">
                        Dopo il wizard, usa l'AI Copilot per simulare scenari what-if in pochi secondi.
                      </p>
                    </div>
                    <button (click)="toggleAi()"
                            class="flex-shrink-0 flex items-center gap-1.5 text-[11px] font-semibold text-brand-600 dark:text-brand-400
                                   hover:text-brand-800 dark:hover:text-brand-200 px-3 py-1.5 bg-white dark:bg-zinc-900 rounded-xl border border-brand-200 dark:border-brand-800
                                   hover:border-brand-300 transition-all font-body whitespace-nowrap">
                      Apri AI
                      <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/>
                      </svg>
                    </button>
                  </div>
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
                <h1 class="text-2xl font-bold text-zinc-900 dark:text-zinc-100 font-display mb-1">What-If Simulator</h1>
                <p class="text-sm text-zinc-500 dark:text-zinc-400 font-body mb-7">Clicca uno scenario per aprirlo nell'AI Copilot.</p>
                <div class="space-y-3">
                  @for (s of scenariExamples; track s.q; let i = $index) {
                    <button
                      class="w-full bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-4 shadow-card text-left
                             hover:border-brand-200 dark:hover:border-brand-800 hover:shadow-card-hover hover:-translate-y-0.5
                             transition-all duration-200 group"
                      [style.animation-delay]="(i * 65 + 50) + 'ms'"
                      style="animation: viewEnter 0.45s cubic-bezier(0.16,1,0.3,1) both;"
                      (click)="openAiWithScenario(s.q)">
                      <div class="flex items-center gap-4">
                        <div class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                             [ngClass]="s.iconBg">
                          <svg class="w-5 h-5" [ngClass]="s.iconColor"
                               fill="none" stroke="currentColor" stroke-width="1.5"
                               viewBox="0 0 24 24" aria-hidden="true">
                            <path stroke-linecap="round" stroke-linejoin="round" [attr.d]="s.iconPath"/>
                          </svg>
                        </div>
                        <div class="flex-1 min-w-0">
                          <p class="text-sm font-semibold text-zinc-800 dark:text-zinc-200 font-body group-hover:text-brand-700 dark:group-hover:text-brand-400 transition-colors">
                            {{ s.title }}
                          </p>
                          <p class="text-xs text-zinc-400 dark:text-zinc-500 font-body mt-0.5 italic truncate">"{{ s.q }}"</p>
                        </div>
                        <svg class="w-4 h-4 text-zinc-300 dark:text-zinc-600 group-hover:text-brand-500 dark:group-hover:text-brand-400 group-hover:translate-x-0.5
                                    transition-all flex-shrink-0"
                             fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/>
                        </svg>
                      </div>
                    </button>
                  }
                </div>
                @if (!hasPlan()) {
                  <div class="mt-6 p-4 bg-amber-50 dark:bg-amber-950/30 rounded-2xl border border-amber-100 dark:border-amber-900/40"
                       style="animation: viewEnter 0.5s 0.3s cubic-bezier(0.16,1,0.3,1) both;">
                    <p class="text-sm text-amber-700 dark:text-amber-400 font-body">
                      <strong>Prima</strong> genera un Business Plan.
                      <button (click)="goToWizard()" class="ml-1 underline font-bold hover:text-amber-900 dark:hover:text-amber-200 transition-colors">
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
                    <h1 class="text-2xl font-bold text-zinc-900 dark:text-zinc-100 font-display">I Miei Piani</h1>
                    <p class="text-sm text-zinc-500 dark:text-zinc-400 font-body mt-1">{{ planService.savedPlans().length }} piani salvati</p>
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
                    <div class="w-16 h-16 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mx-auto mb-4 float-anim">
                      <svg class="w-7 h-7 text-zinc-400 dark:text-zinc-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8l1 12h12l1-12"/>
                      </svg>
                    </div>
                    <p class="text-sm font-semibold text-zinc-600 dark:text-zinc-400 font-display mb-1">Nessun piano salvato</p>
                    <p class="text-xs text-zinc-400 dark:text-zinc-500 font-body">Genera un piano e premi "Salva Business Plan".</p>
                  </div>
                } @else {
                  <div class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                    @for (plan of planService.savedPlans(); track plan.id; let i = $index) {
                      <div class="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-card hover:shadow-card-hover
                                  hover:-translate-y-0.5 transition-all duration-200 overflow-hidden"
                           [style.animation-delay]="(i * 60) + 'ms'"
                           style="animation: viewEnter 0.4s cubic-bezier(0.16,1,0.3,1) both;">
                        <div class="px-5 pt-5 pb-4 border-b border-zinc-50 dark:border-zinc-800">
                          <div class="flex items-start justify-between gap-3">
                            <div class="min-w-0">
                              <p class="text-sm font-bold text-zinc-900 dark:text-zinc-100 font-display truncate">{{ plan.name }}</p>
                              <p class="text-xs text-zinc-400 dark:text-zinc-500 font-body mt-0.5">{{ formatDate(plan.savedAt) }}</p>
                            </div>
                            <button (click)="planService.deletePlan(plan.id)"
                                    class="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0
                                           text-zinc-300 dark:text-zinc-500 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all">
                              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
                              </svg>
                            </button>
                          </div>
                        </div>
                        <div class="px-5 py-4 grid grid-cols-2 gap-3">
                          <div>
                            <p class="text-xs text-zinc-400 dark:text-zinc-500 font-body">Fatturato Y1</p>
                            <p class="text-sm font-bold text-zinc-800 dark:text-zinc-200 font-mono mt-0.5">{{ formatK(plan.kpi.fatturatoTotale) }}</p>
                          </div>
                          <div>
                            <p class="text-xs text-zinc-400 dark:text-zinc-500 font-body">EBITDA Y1</p>
                            <p [ngClass]="['text-sm font-bold font-mono mt-0.5', plan.kpi.ebitda >= 0 ? 'text-emerald-600' : 'text-rose-500']">
                              {{ formatK(plan.kpi.ebitda) }}
                            </p>
                          </div>
                          <div>
                            <p class="text-xs text-zinc-400 dark:text-zinc-500 font-body">Utile Netto</p>
                            <p [ngClass]="['text-sm font-bold font-mono mt-0.5', plan.kpi.utileNetto >= 0 ? 'text-zinc-800' : 'text-rose-500']">
                              {{ formatK(plan.kpi.utileNetto) }}
                            </p>
                          </div>
                          <div>
                            <p class="text-xs text-zinc-400 dark:text-zinc-500 font-body">Cash Runway</p>
                            <p class="text-sm font-bold text-zinc-800 dark:text-zinc-200 font-mono mt-0.5">{{ plan.kpi.cashRunway }} mesi</p>
                          </div>
                        </div>
                        <div class="px-5 pb-4">
                          <div [ngClass]="[
                            'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold font-body',
                            plan.kpi.ebitda >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                          ]">
                            <div [ngClass]="['w-1.5 h-1.5 rounded-full', plan.kpi.ebitda >= 0 ? 'bg-emerald-500' : 'bg-amber-500']"></div>
                            {{ plan.kpi.ebitda >= 0 ? 'Piano sostenibile' : 'Rivedere i costi' }}
                          </div>
                        </div>
                        <div class="px-5 pb-5">
                          <button (click)="loadAndNavigate(plan)"
                                  class="w-full flex items-center justify-center gap-2 px-4 py-2.5
                                         bg-zinc-950 dark:bg-zinc-800 hover:bg-zinc-800 dark:hover:bg-zinc-700 text-white text-xs font-semibold
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
            <div class="view-enter flex flex-col h-full overflow-hidden">
              <app-report/>
            </div>
          }

          <!-- PROFILO -->
          @if (currentView() === 'profilo') {
            <div class="view-enter flex flex-col h-full overflow-hidden">
              <app-profile/>
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
                              (click)="toggleSettingItem(item)"
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

        <!-- AI Panel — resizable/fullscreen on desktop, fullscreen overlay on mobile -->
        @if (aiOpen()) {
          <div [ngClass]="
                  isLargeScreen() && chatDesktopFullscreen()
                    ? 'fixed inset-0 z-50 flex bg-white overflow-hidden'
                    : isLargeScreen()
                      ? 'ai-enter flex-shrink-0 h-full flex border-l border-zinc-100 overflow-hidden'
                      : 'fixed inset-0 z-50 flex flex-col bg-white overflow-hidden'"
               [style.width]="isLargeScreen() && !chatDesktopFullscreen() ? chatWidth() + 'px' : null">

            <!-- Mobile header with close button -->
            @if (!isLargeScreen()) {
              <div class="flex items-center justify-between px-4 h-12 border-b border-zinc-100 dark:border-zinc-800 flex-shrink-0 bg-white dark:bg-zinc-900">
                <div class="flex items-center gap-2">
                  <svg class="w-4 h-4 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
                  </svg>
                  <span class="text-sm font-semibold text-zinc-800 dark:text-zinc-200 font-body">AI Copilot</span>
                </div>
                <button (click)="toggleAi()"
                        class="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                </button>
              </div>
            }

            <!-- Desktop resize handle (only when docked) -->
            @if (!chatDesktopFullscreen()) {
              <div class="hidden lg:flex w-2 flex-shrink-0 items-center justify-center
                          cursor-col-resize group border-l border-zinc-100 dark:border-zinc-800 hover:border-brand-300
                          transition-colors select-none"
                   (mousedown)="onResizeStart($event)">
                <div class="w-0.5 h-8 rounded-full bg-zinc-200 dark:bg-zinc-700 group-hover:bg-brand-400 transition-colors"></div>
              </div>
            }

            <div class="flex-1 overflow-hidden min-w-0 flex flex-col">

              <!-- Desktop toolbar with dock/fullscreen toggle -->
              <div class="hidden lg:flex items-center justify-between px-3 h-10 border-b border-zinc-100 dark:border-zinc-800 flex-shrink-0 bg-white dark:bg-zinc-900">
                <div class="flex items-center gap-2">
                  <svg class="w-3.5 h-3.5 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
                  </svg>
                  <span class="text-xs font-semibold text-zinc-600 dark:text-zinc-400 font-body">AI Copilot</span>
                </div>
                <div class="flex items-center gap-0.5">
                  @if (chatDesktopFullscreen()) {
                    <!-- Dock back to side panel -->
                    <button (click)="chatDesktopFullscreen.set(false)"
                            title="Aggancia a destra"
                            class="w-7 h-7 flex items-center justify-center rounded-lg text-zinc-400 dark:text-zinc-500
                                   hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                      <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round"
                              d="M9 3H5a2 2 0 00-2 2v14a2 2 0 002 2h4M9 3v18M21 3h-4M21 21h-4M21 3v18"/>
                      </svg>
                    </button>
                  } @else {
                    <!-- Expand to fullscreen -->
                    <button (click)="chatDesktopFullscreen.set(true)"
                            title="Schermo intero"
                            class="w-7 h-7 flex items-center justify-center rounded-lg text-zinc-400 dark:text-zinc-500
                                   hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                      <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round"
                              d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"/>
                      </svg>
                    </button>
                  }
                  <!-- Close -->
                  <button (click)="toggleAi()"
                          title="Chiudi"
                          class="w-7 h-7 flex items-center justify-center rounded-lg text-zinc-400 dark:text-zinc-500
                                 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                    <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                  </button>
                </div>
              </div>

              <div class="flex-1 overflow-hidden min-w-0">
                <app-ai-chatbot/>
              </div>
            </div>
          </div>
        }

      </div>
    </main>
  `,
})
export class AppLayoutComponent implements OnInit {
  readonly planService = inject(BusinessPlanService);
  readonly themeService = inject(ThemeService);

  sidebarOpen      = signal(false);
  sidebarCollapsed = signal(false);
  currentView      = signal<View>('panoramica');
  aiOpen           = signal(false);
  hasPlan          = signal(false);
  justSaved        = signal(false);

  chatWidth             = signal(320);
  isLargeScreen         = signal(typeof window !== 'undefined' && window.innerWidth >= 1024);
  chatDesktopFullscreen = signal(false);

  @HostBinding('class.resizing') private _resizing = false;
  private _resizeStartX = 0;
  private _resizeStartW = 0;

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

  scenariExamples = [
    {
      iconPath: 'M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
      iconBg: 'bg-blue-50', iconColor: 'text-blue-500',
      title: 'Variazione Prezzo',
      q: 'Cosa succede se alzo il prezzo a 59€?',
    },
    {
      iconPath: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z',
      iconBg: 'bg-violet-50', iconColor: 'text-violet-500',
      title: 'Espansione Team',
      q: 'Simula 2 dipendenti in più dal Q3',
    },
    {
      iconPath: 'M13 17h8m0 0V9m0 8l-8-8-4 4-6-6',
      iconBg: 'bg-emerald-50', iconColor: 'text-emerald-500',
      title: 'Riduzione Costi',
      q: 'Quanto runway guadagno tagliando il marketing 20%?',
    },
    {
      iconPath: 'M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
      iconBg: 'bg-amber-50', iconColor: 'text-amber-500',
      title: 'Nuovo Mercato',
      q: 'Proiezione se lancio in UK con volume +30%',
    },
  ];

  settingSections: { label: string; items: SettingItem[] }[] = [
    {
      label: 'Progetto',
      items: [
        { key: 'notify',   label: 'Notifiche AI',     desc: "Avvisi quando l'AI aggiorna il piano", enabled: true },
        { key: 'autosave', label: 'Salvataggio Auto', desc: 'Salva modifiche automaticamente',       enabled: true },
      ]
    },
    {
      label: 'Visualizzazione',
      items: [
        { key: 'currency', label: 'Formato in migliaia', desc: 'Mostra i valori in K€',    enabled: false },
        { key: 'dark',     label: 'Tema Scuro',           desc: 'Interfaccia in dark mode', enabled: false },
      ]
    }
  ];

  ngOnInit(): void {
    const darkItem = this.settingSections
      .flatMap(s => s.items)
      .find(i => i.key === 'dark');
    if (darkItem) darkItem.enabled = this.themeService.dark();
  }

  // ── Tutorial steps (reactive to hasPlan) ────────────────────────────────────

  readonly tutorialSteps = computed(() => [
    {
      num: '01',
      title: 'Configura il Progetto',
      desc: 'Inserisci ricavi, costi e team con il wizard guidato.',
      cta: 'Vai al Wizard',
      iconPath: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01',
      iconBg:    'bg-brand-50',
      iconColor: 'text-brand-500',
      targetView: 'wizard' as View,
      done: this.hasPlan(),
    },
    {
      num: '02',
      title: 'Analizza i KPI',
      desc: 'Visualizza fatturato, EBITDA e cash flow in tempo reale.',
      cta: 'Vedi Dashboard',
      iconPath: 'M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z',
      iconBg:    'bg-violet-50',
      iconColor: 'text-violet-500',
      targetView: 'dashboard' as View,
      done: false,
    },
    {
      num: '03',
      title: 'Simula Scenari',
      desc: "Chiedi all'AI Copilot cosa succede se cambi strategia.",
      cta: 'Apri Scenari',
      iconPath: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z',
      iconBg:    'bg-emerald-50',
      iconColor: 'text-emerald-500',
      targetView: 'scenari' as View,
      done: false,
    },
    {
      num: '04',
      title: 'Esporta il Report',
      desc: 'Genera un PDF professionale per investitori e stakeholder.',
      cta: 'Vedi Report',
      iconPath: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
      iconBg:    'bg-amber-50',
      iconColor: 'text-amber-500',
      targetView: 'report' as View,
      done: false,
    },
  ]);

  // ── Computed ────────────────────────────────────────────────────────────────

  readonly projectDisplayName = computed(() =>
    this.planService.currentProjectName() || 'Il mio Progetto'
  );

  readonly projectInitial = computed(() =>
    (this.planService.currentProjectName() || 'P').charAt(0).toUpperCase()
  );

  readonly liveKpis = computed(() => {
    const k = this.planService.kpi();
    const fmt = (v: number) => {
      const abs = Math.abs(v);
      const s   = v < 0 ? '-' : '';
      if (abs >= 1_000_000) return `${s}€${(abs / 1_000_000).toFixed(1)}M`;
      if (abs >= 1_000)     return `${s}€${Math.round(abs / 1000)}K`;
      return `${s}€${abs}`;
    };
    return [
      { label: 'Fatturato Y1', value: fmt(k.fatturatoTotale) },
      { label: 'EBITDA Y1',    value: fmt(k.ebitda) },
      { label: 'Utile Netto',  value: fmt(k.utileNetto) },
      { label: 'Cash Runway',  value: `${k.cashRunway} mesi` },
    ];
  });

  readonly currentTitle = computed(() => {
    const map: Record<View, string> = {
      panoramica:      'Panoramica',
      wizard:          'Nuovo Piano',
      dashboard:       'Business Plan',
      scenari:         'Scenari What-If',
      report:          'Report',
      impostazioni:    'Impostazioni',
      'piani-salvati': 'I Miei Piani',
      profilo:         'Profilo',
    };
    return map[this.currentView()];
  });

  // ── Methods ─────────────────────────────────────────────────────────────────

  isActive(item: NavItem): boolean {
    const v = this.currentView();
    if (item.id === 'piano') return v === 'wizard' || v === 'dashboard';
    return v === item.view;
  }

  navigateToStep(step: { targetView: View }): void {
    if (step.targetView === 'dashboard' && !this.hasPlan()) {
      this.currentView.set('wizard');
    } else {
      this.currentView.set(step.targetView);
    }
    this.sidebarOpen.set(false);
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
    const abs  = Math.abs(value);
    const sign = value < 0 ? '-' : '';
    if (abs >= 1_000_000) return `${sign}€${(abs / 1_000_000).toFixed(1)}M`;
    if (abs >= 1_000)     return `${sign}€${Math.round(abs / 1000)}K`;
    return `${sign}€${abs}`;
  }

  formatDate(date: Date): string {
    return new Intl.DateTimeFormat('it-IT', { day: '2-digit', month: 'short', year: 'numeric' }).format(date);
  }

  navigate(item: Pick<NavItem, 'id' | 'view'>): void {
    if (item.id === 'piano') {
      this.currentView.set(this.hasPlan() ? 'dashboard' : 'wizard');
    } else {
      this.currentView.set(item.view);
    }
    this.sidebarOpen.set(false);
  }

  goToWizard(): void {
    this.currentView.set('wizard');
    this.sidebarOpen.set(false);
  }

  onPlanGenerated(): void {
    this.hasPlan.set(true);
    this.currentView.set('dashboard');
    if (this.isLargeScreen()) {
      this.aiOpen.set(true);
    }
  }

  toggleSidebar(): void {
    this.sidebarCollapsed.update(v => !v);
  }

  toggleSettingItem(item: SettingItem): void {
    if (item.key === 'dark') {
      this.themeService.toggle();
      item.enabled = this.themeService.dark();
    } else {
      item.enabled = !item.enabled;
    }
  }

  onResizeStart(event: MouseEvent): void {
    this._resizing = true;
    this._resizeStartX = event.clientX;
    this._resizeStartW = this.chatWidth();
    event.preventDefault();

    const onMove = (e: MouseEvent) => {
      const delta = this._resizeStartX - e.clientX;
      this.chatWidth.set(Math.min(640, Math.max(240, this._resizeStartW + delta)));
    };
    const onUp = () => {
      this._resizing = false;
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }

  toggleAi(): void {
    const next = !this.aiOpen();
    this.aiOpen.set(next);
    if (!next) this.chatDesktopFullscreen.set(false);
  }

  openAiWithScenario(_q: string): void {
    this.aiOpen.set(true);
  }

  exportPdf(): void {
    const prevView = this.currentView();
    this.currentView.set('report');
    setTimeout(() => {
      window.print();
      this.currentView.set(prevView);
    }, 400);
  }
}
