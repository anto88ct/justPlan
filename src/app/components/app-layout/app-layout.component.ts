import { Component, signal, computed, inject, HostBinding, OnInit, OnDestroy, effect, ViewChildren, QueryList, ElementRef, NgZone } from '@angular/core';
import { ThemeService } from '../../services/theme.service';
import { LanguageService } from '../../services/language.service';
import { CommonModule, NgClass } from '@angular/common';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { WizardFormComponent } from '../wizard-form/wizard-form.component';
import { DashboardCruscottoComponent } from '../dashboard-cruscotto/dashboard-cruscotto.component';
import { AiChatbotComponent, AgentId } from '../ai-chatbot/ai-chatbot.component';
import { ReportComponent } from '../report/report.component';
import { ProfileComponent } from '../profile/profile.component';
import { UploadBusinessPlanComponent } from '../upload-business-plan/upload-business-plan.component';
import { BusinessPlanService, SavedPlan, PlanVersion } from '../../services/business-plan.service';

type View = 'panoramica' | 'wizard' | 'dashboard' | 'scenari' | 'report' | 'impostazioni' | 'piani-salvati' | 'profilo' | 'caricamenti' | 'co-work';

interface CoworkMember {
  id: string;
  name: string;
  email: string;
  role: 'editor' | 'reader';
  status: 'pending' | 'joined';
  avatarColor: string;
  initials: string;
}

interface NetworkNode extends CoworkMember {
  x: number;
  y: number;
}

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

interface PanoramaMessage {
  role: 'user' | 'assistant';
  text: string;
  agent: string;
  ts: number;
}

interface ChatSession {
  id: string;
  title: string;
  messages: PanoramaMessage[];
  ts: number;
}

@Component({
  selector: 'app-layout',
  standalone: true,
  host: { class: 'flex h-full w-full overflow-hidden' },
  imports: [CommonModule, NgClass, MatTooltipModule, TranslatePipe, WizardFormComponent, DashboardCruscottoComponent, AiChatbotComponent, ReportComponent, ProfileComponent, UploadBusinessPlanComponent],
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

    @keyframes pickerUp {
      from { opacity: 0; transform: translateY(5px) scale(0.98); }
      to   { opacity: 1; transform: translateY(0) scale(1); }
    }
    .picker-up { animation: pickerUp 0.17s cubic-bezier(0.16,1,0.3,1) both; }

    .panorama-input-box {
      transition: box-shadow 0.2s ease, border-color 0.2s ease;
    }
    .panorama-input-box:focus-within {
      box-shadow: 0 0 0 3px rgba(99,102,241,0.12);
      border-color: #a5b4fc;
    }
    .dark .panorama-input-box:focus-within {
      box-shadow: 0 0 0 3px rgba(99,102,241,0.18);
      border-color: #6366f1;
    }

    .chip-btn {
      transition: background 0.15s ease, border-color 0.15s ease, transform 0.15s ease;
    }
    .chip-btn:hover { transform: translateY(-1px); }

    @media (prefers-reduced-motion: reduce) {
      .picker-up { animation: none; }
      .chip-btn:hover { transform: none; }
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

    @keyframes networkNodeEnter {
      from { opacity: 0; transform: scale(0.3); }
      to   { opacity: 1; transform: scale(1); }
    }
    @keyframes memberRowEnter {
      from { opacity: 0; transform: translateX(18px); }
      to   { opacity: 1; transform: translateX(0); }
    }
    @keyframes svgPendingRing {
      0%   { opacity: 0.7; transform: scale(1); }
      100% { opacity: 0;   transform: scale(1.8); }
    }
    @keyframes svgJoinedPulse {
      0%, 100% { opacity: 0.3; transform: scale(1); }
      50%      { opacity: 0.7; transform: scale(1.15); }
    }
    @keyframes statusBadgeIn {
      from { opacity: 0; transform: scale(0.7) translateY(-4px); }
      to   { opacity: 1; transform: scale(1) translateY(0); }
    }
    @keyframes orbitPulse {
      0%   { stroke-dashoffset: 200; opacity: 0; }
      10%  { opacity: 1; }
      90%  { opacity: 1; }
      100% { stroke-dashoffset: 0; opacity: 0; }
    }

    .network-node-enter { animation: networkNodeEnter 0.45s cubic-bezier(0.16,1,0.3,1) both; }
    .member-row-enter   { animation: memberRowEnter 0.35s cubic-bezier(0.16,1,0.3,1) both; }
    .status-badge-in    { animation: statusBadgeIn 0.3s cubic-bezier(0.16,1,0.3,1) both; }

    .pending-ring {
      transform-box: fill-box;
      transform-origin: center;
      animation: svgPendingRing 2s ease-out infinite;
    }
    .pending-ring-2 {
      transform-box: fill-box;
      transform-origin: center;
      animation: svgPendingRing 2s ease-out 0.9s infinite;
    }
    .joined-glow {
      transform-box: fill-box;
      transform-origin: center;
      animation: svgJoinedPulse 2.5s ease-in-out infinite;
    }
    .orbit-line {
      animation: orbitPulse 2.2s cubic-bezier(0.4,0,0.6,1) infinite;
    }
    .orbit-line-2 { animation: orbitPulse 2.2s cubic-bezier(0.4,0,0.6,1) 1.1s infinite; }

    @keyframes solarCenterBreathe {
      0%, 100% { transform: scale(1);    opacity: 0.38; }
      50%       { transform: scale(1.28); opacity: 0.14; }
    }

    /* Orbit nodes & lines are driven by RAF (direct DOM transform updates).
       GPU-friendly: only the transform attribute changes, no filters on movers. */
    .orbit-node-g {
      transform-box: view-box;
      will-change: transform;
    }
    .orbit-line {
      transition: stroke 0.4s ease;
    }
    .solar-center-ring {
      transform-box: fill-box;
      transform-origin: center;
      animation: solarCenterBreathe 4.2s cubic-bezier(0.45, 0, 0.55, 1) infinite;
    }
    .solar-center-ring-2 {
      transform-box: fill-box;
      transform-origin: center;
      animation: solarCenterBreathe 4.2s cubic-bezier(0.45, 0, 0.55, 1) -2.1s infinite;
    }

    @keyframes commentPop {
      0%, 100% { opacity: 0; transform: translateY(8px) scale(0.82); }
      14%, 74%  { opacity: 1; transform: translateY(0) scale(1); }
      90%       { opacity: 0; transform: translateY(-4px) scale(0.94); }
    }
    .comment-bubble-anim {
      transform-box: fill-box;
      transform-origin: center bottom;
      animation: commentPop 9s cubic-bezier(0.22, 1, 0.36, 1) infinite;
    }

    @media (prefers-reduced-motion: reduce) {
      .network-node-enter, .member-row-enter, .status-badge-in { animation: none; opacity: 1; transform: none; }
      .pending-ring, .pending-ring-2, .joined-glow { animation: none; }
      .solar-center-ring, .solar-center-ring-2 { animation: none !important; }
      .comment-bubble-anim { animation: none !important; opacity: 1; }
    }

    /* =============================================
       AGENTI AI — Animations
       ============================================= */

    /* --- ELIO (solar orbit) --- */
    @keyframes elio-breathe {
      0%, 100% { transform: scale(1);    opacity: 0.18; }
      50%       { transform: scale(1.45); opacity: 0.06; }
    }
    @keyframes elio-orbit-1 {
      from { transform: scaleY(0.357) rotate(0deg); }
      to   { transform: scaleY(0.357) rotate(360deg); }
    }
    @keyframes elio-orbit-2 {
      from { transform: scaleY(0.35) rotate(0deg); }
      to   { transform: scaleY(0.35) rotate(360deg); }
    }
    @keyframes elio-orbit-3 {
      from { transform: scaleY(0.346) rotate(0deg); }
      to   { transform: scaleY(0.346) rotate(360deg); }
    }
    .elio-sun-glow {
      transform-box: fill-box; transform-origin: center;
      animation: elio-breathe 3.2s ease-in-out infinite;
    }
    .elio-sun-glow-2 {
      transform-box: fill-box; transform-origin: center;
      animation: elio-breathe 3.2s ease-in-out -1.6s infinite;
    }
    .elio-orbit-1-g {
      transform-box: view-box; transform-origin: 80px 80px;
      animation: elio-orbit-1 13s linear infinite;
    }
    .elio-orbit-2-g {
      transform-box: view-box; transform-origin: 80px 80px;
      animation: elio-orbit-2 8.5s linear infinite;
    }
    .elio-orbit-3-g {
      transform-box: view-box; transform-origin: 80px 80px;
      animation: elio-orbit-3 5.5s linear infinite;
    }

    /* --- ARGON (radar scanner) --- */
    @keyframes argon-scan-rotate {
      from { transform: rotate(0deg); }
      to   { transform: rotate(360deg); }
    }
    @keyframes argon-ring-spin {
      from { transform: rotate(0deg); }
      to   { transform: rotate(360deg); }
    }
    @keyframes argon-anomaly-pulse {
      0%, 100% { transform: scale(1);   opacity: 0.9; }
      50%       { transform: scale(1.8); opacity: 0.15; }
    }
    .argon-scan-g {
      transform-box: view-box; transform-origin: 80px 80px;
      animation: argon-scan-rotate 4s linear infinite;
    }
    .argon-ring-dash {
      transform-box: view-box; transform-origin: 80px 80px;
      animation: argon-ring-spin 14s linear infinite;
    }
    .argon-ring-dash-2 {
      transform-box: view-box; transform-origin: 80px 80px;
      animation: argon-ring-spin 10s linear infinite reverse;
    }
    .argon-anomaly-1 {
      transform-box: fill-box; transform-origin: center;
      animation: argon-anomaly-pulse 2.0s ease-in-out infinite;
    }
    .argon-anomaly-2 {
      transform-box: fill-box; transform-origin: center;
      animation: argon-anomaly-pulse 2.0s ease-in-out -0.67s infinite;
    }
    .argon-anomaly-3 {
      transform-box: fill-box; transform-origin: center;
      animation: argon-anomaly-pulse 2.0s ease-in-out -1.33s infinite;
    }

    /* --- XENO (crystal knowledge) --- */
    @keyframes xeno-outer-spin {
      from { transform: rotate(0deg); }
      to   { transform: rotate(360deg); }
    }
    @keyframes xeno-mid-spin {
      from { transform: rotate(0deg); }
      to   { transform: rotate(-360deg); }
    }
    @keyframes xeno-core-pulse {
      0%, 100% { transform: scale(1);    opacity: 0.9; }
      50%       { transform: scale(1.2);  opacity: 0.5; }
    }
    @keyframes xeno-particle-orbit {
      from { transform: rotate(0deg); }
      to   { transform: rotate(360deg); }
    }
    .xeno-outer-g {
      transform-box: view-box; transform-origin: 80px 80px;
      animation: xeno-outer-spin 22s linear infinite;
    }
    .xeno-mid-g {
      transform-box: view-box; transform-origin: 80px 80px;
      animation: xeno-mid-spin 15s linear infinite;
    }
    .xeno-inner-g {
      transform-box: view-box; transform-origin: 80px 80px;
      animation: xeno-outer-spin 9s linear infinite;
    }
    .xeno-core {
      transform-box: fill-box; transform-origin: center;
      animation: xeno-core-pulse 2.8s ease-in-out infinite;
    }
    .xeno-particle-g {
      transform-box: view-box; transform-origin: 80px 80px;
      animation: xeno-particle-orbit 7s linear infinite;
    }
    .xeno-particle-g-2 {
      transform-box: view-box; transform-origin: 80px 80px;
      animation: xeno-particle-orbit 11s linear infinite reverse;
    }

    /* Agent card lift on hover */
    .agent-card {
      transition: transform 0.22s cubic-bezier(0.16,1,0.3,1),
                  box-shadow 0.22s cubic-bezier(0.16,1,0.3,1);
    }
    .agent-card:hover { transform: translateY(-4px); }

    /* Reduced motion for all agent animations */
    @media (prefers-reduced-motion: reduce) {
      .elio-sun-glow, .elio-sun-glow-2,
      .elio-orbit-1-g, .elio-orbit-2-g, .elio-orbit-3-g { animation: none !important; }
      .argon-scan-g, .argon-ring-dash, .argon-ring-dash-2,
      .argon-anomaly-1, .argon-anomaly-2, .argon-anomaly-3 { animation: none !important; }
      .xeno-outer-g, .xeno-mid-g, .xeno-inner-g, .xeno-core,
      .xeno-particle-g, .xeno-particle-g-2 { animation: none !important; }
    }
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
          <button (click)="toggleSidebar()" [matTooltip]="'sidebar.expandTooltip' | translate" matTooltipPosition="right"
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
            <div class="flex flex-col leading-none">
              <span class="text-base font-bold text-white tracking-tight font-display">Businext Plan</span>
              <span class="text-[9px] text-zinc-500 font-body tracking-wide mt-0.5">by AirPlan</span>
            </div>
          </div>
          <button (click)="toggleSidebar()" [title]="'sidebar.collapseTitle' | translate"
                  class="hidden lg:flex w-6 h-6 rounded-lg items-center justify-center
                         text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800 transition-all flex-shrink-0">
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M11 19l-7-7 7-7m8 14l-7-7 7-7"/>
            </svg>
          </button>
        </div>
      }

      <div class="mx-3 h-px bg-zinc-800/70 mb-3"></div>

      <!-- Nav -->
      <nav class="flex-1 px-2 space-y-0.5 overflow-y-auto">
        @if (!sidebarCollapsed()) {
          <p class="px-3 mb-2 text-xs font-semibold text-zinc-600 uppercase tracking-[0.12em] font-body">{{ 'nav.menu' | translate }}</p>
        }

        @for (item of navItems; track item.id) {
          <button
            (click)="navigate(item)"
            [matTooltip]="sidebarCollapsed() ? (item.label | translate) : ''"
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
              <span class="flex-1 text-left z-10 text-[13px]">{{ item.label | translate }}</span>
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

      <!-- Project switcher (bottom) -->
      <div class="mt-auto">
        <div class="mx-3 h-px bg-zinc-800/70 mt-2 mb-2"></div>
        @if (!sidebarCollapsed()) {
          <div class="px-2 pb-3">
            <button
              (click)="navigate({id: 'piani-salvati', view: 'piani-salvati'})"
              [ngClass]="[
                'w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all duration-150 group',
                currentView() === 'piani-salvati'
                  ? 'bg-zinc-800'
                  : 'bg-zinc-900 hover:bg-zinc-800/80'
              ]">
              <div class="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
                   style="background: linear-gradient(135deg, #f59e0b, #f97316);">
                <span class="text-white text-xs font-bold">{{ projectInitial() }}</span>
              </div>
              <div class="flex-1 text-left min-w-0">
                <p class="text-xs font-semibold text-zinc-200 truncate font-body">
                  {{ planService.currentProjectName() || ('sidebar.myProject' | translate) }}
                </p>
                <p class="text-xs text-zinc-600 font-body">{{ 'sidebar.pianoCorrente' | translate }} {{ planService.currentStartYear() }}</p>
              </div>
              <svg class="w-3.5 h-3.5 text-zinc-600 group-hover:text-zinc-400 transition-colors flex-shrink-0"
                   fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M8 9l4-4 4 4m0 6l-4 4-4-4"/>
              </svg>
            </button>
          </div>
        } @else {
          <div class="px-2 pb-3 flex justify-center">
            <button
              (click)="navigate({id: 'piani-salvati', view: 'piani-salvati'})"
              [matTooltip]="planService.currentProjectName() || ('sidebar.myProject' | translate)"
              matTooltipPosition="right"
              class="w-8 h-8 rounded-lg flex items-center justify-center hover:opacity-90 transition-opacity"
              style="background: linear-gradient(135deg, #f59e0b, #f97316);">
              <span class="text-white text-xs font-bold">{{ projectInitial() }}</span>
            </button>
          </div>
        }
      </div>

    </aside>

    <!-- ═══════════════════ MAIN ═══════════════════ -->
    <main class="flex-1 flex flex-col overflow-hidden bg-zinc-50 dark:bg-zinc-950 min-w-0">

      <!-- Topbar -->
      <header class="h-12 bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800 flex items-center px-3 md:px-5 gap-1 md:gap-2 flex-shrink-0 shadow-sm relative z-10">
        <button (click)="sidebarOpen.set(true)"
                class="lg:hidden flex items-center justify-center w-8 h-8 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors flex-shrink-0">
          <svg class="w-4 h-4 text-zinc-600 dark:text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16"/>
          </svg>
        </button>
        <div class="flex items-center gap-1.5 text-xs font-body">
          <span class="text-zinc-400 dark:text-zinc-500">Businext Plan</span>
          <svg class="w-3 h-3 text-zinc-300 dark:text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
          </svg>
          <span class="text-zinc-700 dark:text-zinc-300 font-semibold">{{ currentTitle() | translate }}</span>
        </div>

        <div class="flex-1"></div>

        @if (currentView() === 'dashboard') {
          <button (click)="goToWizard()"
                  class="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 px-2 sm:px-3 py-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all font-body flex-shrink-0">
            <svg class="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
            </svg>
            <span class="hidden sm:inline">{{ 'topbar.modifica' | translate }}</span>
          </button>
          <button (click)="exportPdf()" class="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400 px-2 sm:px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600 bg-white dark:bg-zinc-800 transition-all font-body flex-shrink-0">
            <svg class="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
            </svg>
            <span class="hidden sm:inline">{{ 'topbar.pdf' | translate }}</span>
          </button>
          <button (click)="onSavePlan()"
                  [ngClass]="[
                    'flex items-center gap-1.5 text-xs font-semibold px-2 sm:px-3 py-1.5 rounded-lg border transition-all duration-300 font-body flex-shrink-0',
                    justSaved()
                      ? 'bg-emerald-500 text-white border-emerald-500'
                      : 'bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700 hover:border-zinc-300'
                  ]">
            @if (justSaved()) {
              <svg class="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
              </svg>
              <span class="hidden sm:inline">{{ 'topbar.salvato' | translate }}</span>
            } @else {
              <svg class="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"/>
              </svg>
              <span class="hidden sm:inline">{{ 'topbar.salva' | translate }}</span>
            }
          </button>
          <button (click)="onSaveRevision()"
                  [ngClass]="[
                    'flex items-center gap-1.5 text-xs font-semibold px-2 sm:px-3 py-1.5 rounded-lg border transition-all duration-300 font-body flex-shrink-0',
                    justSavedRevision()
                      ? 'bg-emerald-500 text-white border-emerald-500'
                      : 'bg-brand-600 text-white border-brand-600 hover:bg-brand-500'
                  ]">
            @if (justSavedRevision()) {
              <svg class="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
              </svg>
              <span class="hidden sm:inline">Revisione salvata</span>
            } @else {
              <svg class="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z"/>
              </svg>
              <span class="hidden sm:inline">Salva revisione</span>
            }
          </button>
          <button (click)="openShareDialog()"
                  class="flex items-center gap-1.5 text-xs font-semibold px-2 sm:px-3 py-1.5 rounded-lg border transition-all duration-200 font-body flex-shrink-0
                         bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700 hover:border-violet-300 hover:text-violet-600 dark:hover:text-violet-400">
            <svg class="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"/>
            </svg>
            <span class="hidden sm:inline">{{ 'topbar.condividi' | translate }}</span>
          </button>
        }

        <!-- Language picker -->
        <div class="relative flex-shrink-0">
          <button (click)="langDropdownOpen.set(!langDropdownOpen())"
                  class="flex items-center gap-1.5 h-8 px-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-600 transition-all select-none">
            <span class="text-base leading-none">{{ languageService.getCurrentLanguage().flag }}</span>
            <span class="text-[11px] font-semibold text-zinc-600 dark:text-zinc-300 font-body">{{ languageService.currentLang() }}</span>
            <svg class="w-3 h-3 text-zinc-400 transition-transform duration-200"
                 [class.rotate-180]="langDropdownOpen()"
                 fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/>
            </svg>
          </button>

          @if (langDropdownOpen()) {
            <div class="picker-up absolute top-full right-0 mt-1.5 w-36 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-700 shadow-xl overflow-hidden z-50">
              @for (lang of languageService.languages; track lang.code) {
                <button
                  (click)="languageService.setLanguage(lang.code); langDropdownOpen.set(false)"
                  [ngClass]="[
                    'w-full flex items-center gap-2.5 px-3 py-2.5 text-left transition-colors',
                    languageService.currentLang() === lang.code
                      ? 'bg-zinc-50 dark:bg-zinc-800'
                      : 'hover:bg-zinc-50 dark:hover:bg-zinc-800'
                  ]">
                  <span class="text-base leading-none flex-shrink-0">{{ lang.flag }}</span>
                  <span class="flex-1 text-xs font-semibold text-zinc-700 dark:text-zinc-300 font-body">{{ lang.code }}</span>
                  @if (languageService.currentLang() === lang.code) {
                    <svg class="w-3 h-3 text-brand-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
                    </svg>
                  }
                </button>
              }
            </div>
          }
        </div>

        <button (click)="toggleAi()"
                [ngClass]="[
                  'flex items-center gap-1.5 text-xs font-semibold px-2 sm:px-3 py-1.5 rounded-lg border transition-all duration-200 font-body flex-shrink-0',
                  aiOpen() ? 'bg-brand-600 text-white border-brand-600 shadow-md shadow-brand-500/25'
                           : 'bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700 hover:border-brand-300 hover:text-brand-600'
                ]">
          <svg class="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
          </svg>
          <span class="hidden sm:inline">{{ 'topbar.aiCopilot' | translate }}</span>
        </button>

        <!-- Profile avatar with plan badge — far right -->
        <div class="relative flex-shrink-0">
          <button (click)="navigate({ id: 'profilo', view: 'profilo' })"
                  [matTooltip]="'sidebar.profiloTooltip' | translate"
                  matTooltipPosition="below"
                  [ngClass]="[
                    'flex items-center justify-center w-8 h-8 rounded-xl transition-all duration-200 ring-2 ring-offset-1 ring-offset-white dark:ring-offset-zinc-900',
                    currentView() === 'profilo' ? 'opacity-90' : 'hover:scale-105 hover:shadow-sm',
                    userPlan() === 'max'  ? 'ring-violet-500'
                    : userPlan() === 'pro' ? 'ring-amber-400'
                    : 'ring-brand-500'
                  ]"
                  style="background: linear-gradient(135deg, #f59e0b, #ef4444);">
            <span class="text-white text-xs font-bold select-none">F</span>
          </button>
          <span [ngClass]="[
                  'absolute -bottom-1.5 left-1/2 -translate-x-1/2 px-1.5 py-px rounded text-[7px] font-black leading-none tracking-wider text-white pointer-events-none whitespace-nowrap',
                  userPlan() === 'max' ? 'bg-violet-600' : userPlan() === 'pro' ? 'bg-amber-500' : 'bg-zinc-500'
                ]">
            {{ userPlan() | uppercase }}
          </span>
        </div>
      </header>

      <!-- View + AI split -->
      <div class="flex-1 overflow-hidden flex flex-col lg:flex-row min-h-0">

        <!-- ── VIEWS ── -->
        <div class="flex-1 min-w-0 overflow-hidden">

          <!-- PANORAMICA: Claude-style AI landing -->
          @if (currentView() === 'panoramica') {
            <div class="view-enter h-full flex overflow-hidden bg-zinc-50 dark:bg-zinc-950 relative">

              <!-- Mobile backdrop for chat history -->
              @if (chatHistoryOpen()) {
                <div class="absolute inset-0 bg-black/40 z-10 lg:hidden"
                     (click)="chatHistoryOpen.set(false)"></div>
              }

              <!-- ── Chat history sidebar ── -->
              <div [ngClass]="[
                'flex flex-col bg-white dark:bg-zinc-900 border-r border-zinc-100 dark:border-zinc-800 transition-all duration-300 overflow-hidden',
                chatHistoryOpen()
                  ? 'absolute inset-y-0 left-0 z-20 w-52 shadow-xl lg:relative lg:inset-auto lg:z-auto lg:shadow-none lg:flex-shrink-0'
                  : 'w-0 lg:flex-shrink-0'
              ]">
                <div class="p-3 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between gap-2 min-w-[208px]">
                  <span class="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Cronologia</span>
                  <button (click)="newPanoramaChat()"
                          class="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                    <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/>
                    </svg>
                    Nuova
                  </button>
                </div>
                <div class="flex-1 overflow-y-auto p-2 space-y-px min-w-[208px]">
                  @if (chatSessions().length === 0) {
                    <p class="text-center text-xs text-zinc-400 dark:text-zinc-600 py-8 px-3 leading-relaxed">Nessuna conversazione ancora</p>
                  }
                  @for (session of chatSessions(); track session.id) {
                    <div [ngClass]="[
                      'group flex items-start gap-1.5 w-full rounded-lg px-2.5 py-2 cursor-pointer transition-colors',
                      activeChatId() === session.id
                        ? 'bg-zinc-100 dark:bg-zinc-800'
                        : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/60'
                    ]" (click)="loadChatSession(session.id)">
                      <div class="flex-1 min-w-0">
                        <p class="text-xs font-medium text-zinc-700 dark:text-zinc-300 truncate leading-snug">{{ session.title }}</p>
                        <p class="text-[10px] text-zinc-400 mt-0.5">{{ formatSessionDate(session.ts) }}</p>
                      </div>
                      <button (click)="deleteChatSession(session.id, $event)"
                              class="opacity-0 group-hover:opacity-100 w-5 h-5 rounded flex items-center justify-center text-zinc-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all flex-shrink-0 mt-0.5">
                        <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                      </button>
                    </div>
                  }
                </div>
              </div>

              <!-- ── Main area ── -->
              <div class="flex-1 flex flex-col min-w-0 relative">

                <!-- Toggle history button -->
                <button (click)="chatHistoryOpen.set(!chatHistoryOpen())"
                        class="absolute top-3 left-3 z-10 w-7 h-7 flex items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all">
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h7"/>
                  </svg>
                </button>

                @if (panoramaMessages().length === 0) {
                  <!-- ── Landing ── -->
                  <div class="flex-1 overflow-y-auto flex flex-col items-center justify-center px-4 py-12">
                    <div class="mb-8 text-center" style="animation: viewEnter 0.5s cubic-bezier(0.16,1,0.3,1) both;">
                      <div class="flex items-center justify-center gap-3 mb-2">
                        <div class="w-10 h-10 rounded-2xl flex items-center justify-center shadow-sm flex-shrink-0"
                             style="background: linear-gradient(135deg, #6366f1, #8b5cf6);">
                          <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6L12 2z"/>
                          </svg>
                        </div>
                        <h1 class="text-[1.85rem] font-bold text-zinc-900 dark:text-zinc-100 font-display tracking-tight">
                          {{ panoramaGreeting() }}, AirPlan
                        </h1>
                      </div>
                      <p class="text-sm text-zinc-500 dark:text-zinc-400 font-body mt-1">
                        Scegli un agente AI e fai la tua prima domanda
                      </p>
                    </div>

                    <div class="w-full max-w-2xl" style="animation: viewEnter 0.5s 80ms cubic-bezier(0.16,1,0.3,1) both;">
                      <div class="panorama-input-box bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-700 shadow-lg overflow-visible">
                        <textarea
                          [value]="panoramaInput()"
                          (input)="panoramaInput.set($any($event.target).value)"
                          (keydown)="onPanoramaKeydown($event)"
                          placeholder="Incolla un documento, un'email o una domanda per iniziare"
                          rows="3"
                          class="w-full px-5 pt-4 pb-2 bg-transparent text-zinc-800 dark:text-zinc-200 text-base font-body resize-none focus:outline-none placeholder-zinc-400 dark:placeholder-zinc-500 leading-relaxed block">
                        </textarea>
                        <div class="px-3 pb-3 flex items-center justify-between gap-2">
                          <div class="flex items-center gap-2">
                            <div class="relative">
                              <button (click)="panoramaAgentPickerOpen.set(!panoramaAgentPickerOpen())"
                                      class="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-600 transition-all text-xs font-semibold font-body text-zinc-700 dark:text-zinc-300 select-none">
                                <span class="w-2 h-2 rounded-full flex-shrink-0 transition-colors duration-300" [style.background]="panoramaAgentDot()"></span>
                                {{ panoramaAgentName() }}
                                <svg class="w-3 h-3 text-zinc-400 transition-transform duration-200" [class.rotate-180]="panoramaAgentPickerOpen()" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                  <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/>
                                </svg>
                              </button>
                              @if (panoramaAgentPickerOpen()) {
                                <div class="picker-up absolute bottom-full left-0 mb-2 w-52 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-700 shadow-xl overflow-hidden z-30">
                                  @for (agent of panoramaAgents; track agent.id) {
                                    <button (click)="panoramaSelectedAgent.set(agent.id); panoramaAgentPickerOpen.set(false)"
                                            [ngClass]="['w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors', panoramaSelectedAgent() === agent.id ? 'bg-zinc-50 dark:bg-zinc-800' : 'hover:bg-zinc-50 dark:hover:bg-zinc-800']">
                                      <span class="w-3 h-3 rounded-full flex-shrink-0" [style.background]="agent.dot"></span>
                                      <div class="flex-1 min-w-0">
                                        <p class="text-sm font-bold text-zinc-800 dark:text-zinc-200 font-body">{{ agent.name }}</p>
                                        <p class="text-[10px] text-zinc-400 dark:text-zinc-500 font-body truncate">{{ agent.role }}</p>
                                      </div>
                                      @if (panoramaSelectedAgent() === agent.id) {
                                        <svg class="w-3.5 h-3.5 text-brand-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                                          <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
                                        </svg>
                                      }
                                    </button>
                                  }
                                </div>
                              }
                            </div>
                          </div>
                          <button (click)="onPanoramaSubmit()" [disabled]="!panoramaInput().trim()"
                                  [ngClass]="['w-9 h-9 flex items-center justify-center rounded-xl transition-all duration-200 flex-shrink-0',
                                    panoramaInput().trim()
                                      ? 'bg-brand-600 hover:bg-brand-500 text-white shadow-sm shadow-brand-500/30 hover:scale-105 active:scale-95'
                                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-300 dark:text-zinc-600 cursor-not-allowed']">
                            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                              <path stroke-linecap="round" stroke-linejoin="round" d="M5 12h14m-7-7l7 7-7 7"/>
                            </svg>
                          </button>
                        </div>
                      </div>

                      <div class="flex flex-wrap gap-2 mt-5 justify-center" style="animation: viewEnter 0.5s 160ms cubic-bezier(0.16,1,0.3,1) both;">
                        @for (chip of panoramaSuggestions; track chip.label) {
                          <button (click)="onPanoramaSuggestion(chip.text)"
                                  class="chip-btn flex items-center gap-2 px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-full text-sm text-zinc-700 dark:text-zinc-300 font-body hover:border-zinc-300 dark:hover:border-zinc-600 hover:bg-zinc-50 dark:hover:bg-zinc-800 shadow-sm whitespace-nowrap">
                            <span class="text-base leading-none select-none">{{ chip.icon }}</span>
                            {{ chip.label }}
                          </button>
                        }
                      </div>
                    </div>
                  </div>

                } @else {
                  <!-- ── Active chat thread ── -->
                  <div class="flex-1 overflow-y-auto px-4 md:px-12 py-8 space-y-6" id="panoramaMessages">
                    @for (msg of panoramaMessages(); track $index) {
                      @if (msg.role === 'user') {
                        <div class="flex justify-end">
                          <div class="max-w-[72%] px-4 py-3 rounded-2xl rounded-tr-sm bg-brand-600 text-white text-sm font-body leading-relaxed shadow-sm"
                               style="animation: viewEnter 0.25s cubic-bezier(0.16,1,0.3,1) both;">
                            {{ msg.text }}
                          </div>
                        </div>
                      } @else {
                        <div class="flex gap-3 items-start" style="animation: viewEnter 0.3s cubic-bezier(0.16,1,0.3,1) both;">
                          <div class="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm"
                               style="background: linear-gradient(135deg, #6366f1, #8b5cf6);">
                            <svg class="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6L12 2z"/>
                            </svg>
                          </div>
                          <div class="max-w-[72%]">
                            <p class="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 mb-1.5 uppercase tracking-wider">{{ msg.agent }}</p>
                            <div class="px-4 py-3 rounded-2xl rounded-tl-sm bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 text-sm font-body text-zinc-700 dark:text-zinc-300 leading-relaxed shadow-sm">
                              {{ msg.text }}
                            </div>
                          </div>
                        </div>
                      }
                    }

                    @if (aiThinking()) {
                      <div class="flex gap-3 items-start">
                        <div class="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm"
                             style="background: linear-gradient(135deg, #6366f1, #8b5cf6);">
                          <svg class="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6L12 2z"/>
                          </svg>
                        </div>
                        <div class="px-4 py-3.5 rounded-2xl rounded-tl-sm bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 shadow-sm">
                          <div class="flex items-center gap-1.5">
                            <span class="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce" style="animation-delay:0ms"></span>
                            <span class="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce" style="animation-delay:150ms"></span>
                            <span class="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce" style="animation-delay:300ms"></span>
                          </div>
                        </div>
                      </div>
                    }
                  </div>

                  <!-- Chat input bar -->
                  <div class="border-t border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 py-3">
                    <div class="max-w-3xl mx-auto">
                      <div class="panorama-input-box bg-zinc-50 dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700">
                        <textarea
                          [value]="panoramaInput()"
                          (input)="panoramaInput.set($any($event.target).value)"
                          (keydown)="onPanoramaKeydown($event)"
                          placeholder="Continua la conversazione..."
                          rows="1"
                          class="w-full px-4 pt-3 pb-1 bg-transparent text-zinc-800 dark:text-zinc-200 text-base font-body resize-none focus:outline-none placeholder-zinc-400 dark:placeholder-zinc-500 leading-relaxed block">
                        </textarea>
                        <div class="px-3 pb-2.5 flex items-center justify-between gap-2">
                          <div class="relative">
                            <button (click)="panoramaAgentPickerOpen.set(!panoramaAgentPickerOpen())"
                                    class="flex items-center gap-1.5 px-2 py-1 rounded-lg border border-zinc-200 dark:border-zinc-600 bg-white dark:bg-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-500 transition-all text-[11px] font-semibold font-body text-zinc-600 dark:text-zinc-300 select-none">
                              <span class="w-2 h-2 rounded-full flex-shrink-0" [style.background]="panoramaAgentDot()"></span>
                              {{ panoramaAgentName() }}
                              <svg class="w-2.5 h-2.5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/>
                              </svg>
                            </button>
                            @if (panoramaAgentPickerOpen()) {
                              <div class="picker-up absolute bottom-full left-0 mb-2 w-48 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-700 shadow-xl overflow-hidden z-30">
                                @for (agent of panoramaAgents; track agent.id) {
                                  <button (click)="panoramaSelectedAgent.set(agent.id); panoramaAgentPickerOpen.set(false)"
                                          [ngClass]="['w-full flex items-center gap-3 px-3 py-2 text-left transition-colors', panoramaSelectedAgent() === agent.id ? 'bg-zinc-50 dark:bg-zinc-800' : 'hover:bg-zinc-50 dark:hover:bg-zinc-800']">
                                    <span class="w-2.5 h-2.5 rounded-full flex-shrink-0" [style.background]="agent.dot"></span>
                                    <div class="flex-1 min-w-0">
                                      <p class="text-xs font-bold text-zinc-800 dark:text-zinc-200 font-body">{{ agent.name }}</p>
                                      <p class="text-[10px] text-zinc-400 font-body truncate">{{ agent.role }}</p>
                                    </div>
                                  </button>
                                }
                              </div>
                            }
                          </div>
                          <button (click)="onPanoramaSubmit()" [disabled]="!panoramaInput().trim() || aiThinking()"
                                  [ngClass]="['w-8 h-8 flex items-center justify-center rounded-lg transition-all duration-200 flex-shrink-0',
                                    panoramaInput().trim() && !aiThinking()
                                      ? 'bg-brand-600 hover:bg-brand-500 text-white shadow-sm hover:scale-105 active:scale-95'
                                      : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-400 cursor-not-allowed']">
                            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                              <path stroke-linecap="round" stroke-linejoin="round" d="M5 12h14m-7-7l7 7-7 7"/>
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                }

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

          <!-- AGENTI AI (ex Scenari) -->
          @if (currentView() === 'scenari') {
            <div class="view-enter h-full overflow-y-auto scrollbar-thin p-8">
              <div class="max-w-5xl mx-auto">

                <!-- Header -->
                <div class="mb-10" style="animation: viewEnter 0.4s cubic-bezier(0.16,1,0.3,1) both;">
                  <h1 class="text-2xl font-bold text-zinc-900 dark:text-zinc-100 font-display mb-2 text-balance">
                    {{ 'agenti.title' | translate }}
                  </h1>
                  <p class="text-sm text-zinc-500 dark:text-zinc-400 font-body max-w-lg">
                    {{ 'agenti.desc' | translate }}
                  </p>
                </div>

                <!-- Agent cards -->
                <div class="grid grid-cols-1 lg:grid-cols-3 gap-5">

                  <!-- ===== ELIO ===== -->
                  <div class="agent-card bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800
                               shadow-card hover:shadow-card-hover overflow-hidden flex flex-col"
                       style="animation: viewEnter 0.5s 60ms cubic-bezier(0.16,1,0.3,1) both;">
                    <!-- SVG stage -->
                    <div class="flex items-center justify-center pt-7 pb-3 bg-amber-50/60 dark:bg-amber-950/20">
                      <svg viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg"
                           width="140" height="140" aria-hidden="true">
                        <defs>
                          <radialGradient id="elio-bg-g" cx="50%" cy="50%" r="50%">
                            <stop offset="0%"   stop-color="#fbbf24" stop-opacity="0.25"/>
                            <stop offset="100%" stop-color="#fbbf24" stop-opacity="0"/>
                          </radialGradient>
                          <filter id="elio-gf" x="-40%" y="-40%" width="180%" height="180%">
                            <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="b"/>
                            <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
                          </filter>
                        </defs>
                        <!-- Ambient -->
                        <circle cx="80" cy="80" r="62" fill="url(#elio-bg-g)"/>
                        <!-- Orbit tracks (static perspective ellipses) -->
                        <ellipse cx="80" cy="80" rx="56" ry="20" stroke="#fde68a" stroke-width="1" stroke-opacity="0.55"/>
                        <ellipse cx="80" cy="80" rx="40" ry="14" stroke="#fbbf24" stroke-width="1" stroke-opacity="0.45"/>
                        <ellipse cx="80" cy="80" rx="26" ry="9"  stroke="#fb923c" stroke-width="1" stroke-opacity="0.4"/>
                        <!-- Sun glow rings -->
                        <circle class="elio-sun-glow"   cx="80" cy="80" r="22" fill="#fbbf24" opacity="0.14"/>
                        <circle class="elio-sun-glow-2" cx="80" cy="80" r="15" fill="#fbbf24" opacity="0.22"/>
                        <!-- Planet orbit 1 (outer) — 13s -->
                        <g class="elio-orbit-1-g">
                          <circle cx="136" cy="80" r="5.5" fill="#fb923c" filter="url(#elio-gf)"/>
                          <circle cx="136" cy="80" r="2.5" fill="#fed7aa" opacity="0.9"/>
                        </g>
                        <!-- Planet orbit 2 (mid) — 8.5s -->
                        <g class="elio-orbit-2-g">
                          <circle cx="120" cy="80" r="4"   fill="#fbbf24" filter="url(#elio-gf)"/>
                          <circle cx="120" cy="80" r="1.8" fill="#fef9c3" opacity="0.9"/>
                        </g>
                        <!-- Planet orbit 3 (inner) — 5.5s -->
                        <g class="elio-orbit-3-g">
                          <circle cx="106" cy="80" r="2.5" fill="#fde68a"/>
                        </g>
                        <!-- Central sun -->
                        <circle cx="80" cy="80" r="9" fill="#fbbf24" filter="url(#elio-gf)"/>
                        <circle cx="80" cy="80" r="5.5" fill="#fef9c3"/>
                      </svg>
                    </div>
                    <!-- Info -->
                    <div class="flex flex-col flex-1 p-5 gap-3">
                      <div>
                        <span class="text-[10px] font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-[0.15em] font-body">
                          {{ 'agenti.elio.role' | translate }}
                        </span>
                        <h2 class="text-xl font-bold text-zinc-900 dark:text-zinc-100 font-display leading-tight mt-0.5">
                          {{ 'agenti.elio.name' | translate }}
                        </h2>
                      </div>
                      <p class="text-xs text-zinc-500 dark:text-zinc-400 font-body leading-relaxed flex-1">
                        {{ 'agenti.elio.desc' | translate }}
                      </p>
                      <p class="text-[11px] text-amber-600/80 dark:text-amber-400/70 font-body italic">
                        "{{ 'agenti.elio.example' | translate }}"
                      </p>
                      <button
                        (click)="openAiWithScenario(translate.instant('agenti.elio.example'), 'elio')"
                        class="mt-1 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl
                               bg-amber-500 hover:bg-amber-400 active:bg-amber-600
                               text-white text-sm font-semibold font-body
                               transition-colors duration-150 shadow-sm">
                        {{ 'agenti.elio.cta' | translate }}
                        <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/>
                        </svg>
                      </button>
                    </div>
                  </div>

                  <!-- ===== ARGON ===== -->
                  <div class="agent-card bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800
                               shadow-card hover:shadow-card-hover overflow-hidden flex flex-col"
                       style="animation: viewEnter 0.5s 140ms cubic-bezier(0.16,1,0.3,1) both;">
                    <!-- SVG stage -->
                    <div class="flex items-center justify-center pt-7 pb-3 bg-blue-50/60 dark:bg-blue-950/20">
                      <svg viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg"
                           width="140" height="140" aria-hidden="true">
                        <defs>
                          <radialGradient id="argon-bg-g" cx="50%" cy="50%" r="50%">
                            <stop offset="0%"   stop-color="#3b82f6" stop-opacity="0.15"/>
                            <stop offset="100%" stop-color="#3b82f6" stop-opacity="0"/>
                          </radialGradient>
                          <filter id="argon-gf" x="-60%" y="-60%" width="220%" height="220%">
                            <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" result="b"/>
                            <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
                          </filter>
                        </defs>
                        <!-- Ambient -->
                        <circle cx="80" cy="80" r="62" fill="url(#argon-bg-g)"/>
                        <!-- Rotating dashed ring -->
                        <circle class="argon-ring-dash"   cx="80" cy="80" r="55" stroke="#3b82f6"
                                stroke-width="1" stroke-opacity="0.3" stroke-dasharray="9 7"/>
                        <circle class="argon-ring-dash-2" cx="80" cy="80" r="38" stroke="#22d3ee"
                                stroke-width="1" stroke-opacity="0.4" stroke-dasharray="5 6"/>
                        <!-- Static inner ring -->
                        <circle cx="80" cy="80" r="22" stroke="#3b82f6" stroke-width="1.5" stroke-opacity="0.5"/>
                        <!-- Crosshair ticks -->
                        <line x1="80" y1="56" x2="80" y2="62" stroke="#3b82f6" stroke-width="1"   stroke-opacity="0.5"/>
                        <line x1="80" y1="98" x2="80" y2="104" stroke="#3b82f6" stroke-width="1"  stroke-opacity="0.5"/>
                        <line x1="56" y1="80" x2="62" y2="80"  stroke="#3b82f6" stroke-width="1"  stroke-opacity="0.5"/>
                        <line x1="98" y1="80" x2="104" y2="80" stroke="#3b82f6" stroke-width="1"  stroke-opacity="0.5"/>
                        <!-- Rotating scan beam -->
                        <g class="argon-scan-g">
                          <polygon points="80,80 135,73 135,87" fill="#22d3ee" fill-opacity="0.07"/>
                          <line x1="80" y1="80" x2="135" y2="80"
                                stroke="#22d3ee" stroke-width="1.5" stroke-opacity="0.85"
                                filter="url(#argon-gf)"/>
                        </g>
                        <!-- Anomaly nodes (pulsing) -->
                        <circle class="argon-anomaly-1" cx="121" cy="52" r="3.5" fill="#f97316" opacity="0.9"/>
                        <circle cx="121" cy="52" r="1.8" fill="#fed7aa"/>
                        <circle class="argon-anomaly-2" cx="43"  cy="99" r="3"   fill="#ef4444" opacity="0.9"/>
                        <circle cx="43"  cy="99" r="1.5" fill="#fecaca"/>
                        <circle class="argon-anomaly-3" cx="113" cy="117" r="2.5" fill="#f97316" opacity="0.8"/>
                        <!-- Cardinal data points on outer ring -->
                        <circle cx="135" cy="80" r="2" fill="#3b82f6" opacity="0.6"/>
                        <circle cx="25"  cy="80" r="2" fill="#3b82f6" opacity="0.6"/>
                        <circle cx="80"  cy="25" r="2" fill="#3b82f6" opacity="0.6"/>
                        <circle cx="80"  cy="135" r="2" fill="#3b82f6" opacity="0.6"/>
                        <!-- Central node -->
                        <circle cx="80" cy="80" r="4.5" fill="#22d3ee" opacity="0.8" filter="url(#argon-gf)"/>
                        <circle cx="80" cy="80" r="2"   fill="#e0f2fe"/>
                      </svg>
                    </div>
                    <!-- Info -->
                    <div class="flex flex-col flex-1 p-5 gap-3">
                      <div>
                        <span class="text-[10px] font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-[0.15em] font-body">
                          {{ 'agenti.argon.role' | translate }}
                        </span>
                        <h2 class="text-xl font-bold text-zinc-900 dark:text-zinc-100 font-display leading-tight mt-0.5">
                          {{ 'agenti.argon.name' | translate }}
                        </h2>
                      </div>
                      <p class="text-xs text-zinc-500 dark:text-zinc-400 font-body leading-relaxed flex-1">
                        {{ 'agenti.argon.desc' | translate }}
                      </p>
                      <p class="text-[11px] text-blue-600/80 dark:text-blue-400/70 font-body italic">
                        "{{ 'agenti.argon.example' | translate }}"
                      </p>
                      <button
                        (click)="openAiWithScenario(translate.instant('agenti.argon.example'), 'argon')"
                        class="mt-1 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl
                               bg-blue-500 hover:bg-blue-400 active:bg-blue-600
                               text-white text-sm font-semibold font-body
                               transition-colors duration-150 shadow-sm">
                        {{ 'agenti.argon.cta' | translate }}
                        <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/>
                        </svg>
                      </button>
                    </div>
                  </div>

                  <!-- ===== XENO ===== -->
                  <div class="agent-card bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800
                               shadow-card hover:shadow-card-hover overflow-hidden flex flex-col"
                       style="animation: viewEnter 0.5s 220ms cubic-bezier(0.16,1,0.3,1) both;">
                    <!-- SVG stage -->
                    <div class="flex items-center justify-center pt-7 pb-3 bg-violet-50/60 dark:bg-violet-950/20">
                      <svg viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg"
                           width="140" height="140" aria-hidden="true">
                        <defs>
                          <radialGradient id="xeno-bg-g" cx="50%" cy="50%" r="50%">
                            <stop offset="0%"   stop-color="#8b5cf6" stop-opacity="0.2"/>
                            <stop offset="100%" stop-color="#8b5cf6" stop-opacity="0"/>
                          </radialGradient>
                          <filter id="xeno-gf" x="-50%" y="-50%" width="200%" height="200%">
                            <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="b"/>
                            <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
                          </filter>
                        </defs>
                        <!-- Ambient -->
                        <circle cx="80" cy="80" r="62" fill="url(#xeno-bg-g)"/>
                        <!-- Outer hexagon — slow CW -->
                        <g class="xeno-outer-g">
                          <polygon
                            points="80,28 106.4,44 106.4,76 80,92 53.6,76 53.6,44"
                            stroke="#8b5cf6" stroke-width="1.2" stroke-opacity="0.55" fill="none"/>
                        </g>
                        <!-- Particle orbit A (CW) — offset dot -->
                        <g class="xeno-particle-g">
                          <circle cx="134" cy="80" r="3"   fill="#c084fc" opacity="0.8"/>
                          <circle cx="26"  cy="80" r="2"   fill="#c084fc" opacity="0.5"/>
                        </g>
                        <!-- Mid hexagon — CCW -->
                        <g class="xeno-mid-g">
                          <polygon
                            points="80,46 100,57.5 100,80.5 80,92 60,80.5 60,57.5"
                            stroke="#c084fc" stroke-width="1" stroke-opacity="0.5" fill="none"/>
                          <!-- Connector spokes -->
                          <line x1="80" y1="46"  x2="80" y2="60"  stroke="#a78bfa" stroke-width="0.7" stroke-opacity="0.4"/>
                          <line x1="80" y1="92"  x2="80" y2="104" stroke="#a78bfa" stroke-width="0.7" stroke-opacity="0.4"/>
                          <line x1="60" y1="69"  x2="46" y2="69"  stroke="#a78bfa" stroke-width="0.7" stroke-opacity="0.4"/>
                          <line x1="100" y1="69" x2="114" y2="69" stroke="#a78bfa" stroke-width="0.7" stroke-opacity="0.4"/>
                        </g>
                        <!-- Inner hexagon — CW fast -->
                        <g class="xeno-inner-g">
                          <polygon
                            points="80,60 92,66.9 92,80.9 80,87.8 68,80.9 68,66.9"
                            stroke="#ddd6fe" stroke-width="1" stroke-opacity="0.6" fill="none"/>
                        </g>
                        <!-- Particle orbit B (CCW) -->
                        <g class="xeno-particle-g-2">
                          <circle cx="80" cy="28" r="2.5" fill="#8b5cf6" opacity="0.7"/>
                          <circle cx="80" cy="132" r="1.8" fill="#8b5cf6" opacity="0.45"/>
                        </g>
                        <!-- Core glow -->
                        <circle class="xeno-core" cx="80" cy="80" r="12" fill="#8b5cf6" opacity="0.12" filter="url(#xeno-gf)"/>
                        <circle cx="80" cy="80" r="6"  fill="#8b5cf6" filter="url(#xeno-gf)"/>
                        <circle cx="80" cy="80" r="3"  fill="#ede9fe"/>
                      </svg>
                    </div>
                    <!-- Info -->
                    <div class="flex flex-col flex-1 p-5 gap-3">
                      <div>
                        <span class="text-[10px] font-semibold text-violet-600 dark:text-violet-400 uppercase tracking-[0.15em] font-body">
                          {{ 'agenti.xeno.role' | translate }}
                        </span>
                        <h2 class="text-xl font-bold text-zinc-900 dark:text-zinc-100 font-display leading-tight mt-0.5">
                          {{ 'agenti.xeno.name' | translate }}
                        </h2>
                      </div>
                      <p class="text-xs text-zinc-500 dark:text-zinc-400 font-body leading-relaxed flex-1">
                        {{ 'agenti.xeno.desc' | translate }}
                      </p>
                      <p class="text-[11px] text-violet-600/80 dark:text-violet-400/70 font-body italic">
                        "{{ 'agenti.xeno.example' | translate }}"
                      </p>
                      <button
                        (click)="openAiWithScenario(translate.instant('agenti.xeno.example'), 'xeno')"
                        class="mt-1 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl
                               bg-violet-500 hover:bg-violet-400 active:bg-violet-600
                               text-white text-sm font-semibold font-body
                               transition-colors duration-150 shadow-sm">
                        {{ 'agenti.xeno.cta' | translate }}
                        <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/>
                        </svg>
                      </button>
                    </div>
                  </div>

                </div><!-- /grid -->

                <!-- No plan warning -->
                @if (!hasPlan()) {
                  <div class="mt-8 p-4 bg-amber-50 dark:bg-amber-950/30 rounded-2xl border border-amber-100 dark:border-amber-900/40"
                       style="animation: viewEnter 0.5s 0.35s cubic-bezier(0.16,1,0.3,1) both;">
                    <p class="text-sm text-amber-700 dark:text-amber-400 font-body">
                      {{ 'agenti.noPlanWarn' | translate }}
                      <button (click)="goToWizard()"
                              class="ml-1.5 underline font-bold hover:text-amber-900 dark:hover:text-amber-200 transition-colors">
                        {{ 'agenti.goToWizard' | translate }}
                      </button>
                    </p>
                  </div>
                }

              </div>
            </div>
          }

          <!-- PIANI SALVATI -->
          @if (currentView() === 'piani-salvati') {
            <div class="view-enter h-full flex overflow-hidden">

              <!-- ── Plan list ── -->
              <div [ngClass]="[
                'flex flex-col transition-all duration-300 ease-in-out overflow-y-auto scrollbar-thin',
                selectedPlanId() ? 'w-0 lg:w-80 lg:flex-shrink-0 overflow-hidden' : 'flex-1'
              ]">
                <div class="p-6 lg:p-8 min-w-[18rem]">
                  <div class="flex items-start justify-between mb-7">
                    <div>
                      <p class="text-xs font-semibold text-brand-600 uppercase tracking-widest font-body mb-1">{{ 'pianiSalvati.archivio' | translate }}</p>
                      <h1 class="text-2xl font-bold text-zinc-900 dark:text-zinc-100 font-display">{{ 'pianiSalvati.title' | translate }}</h1>
                      <p class="text-sm text-zinc-500 dark:text-zinc-400 font-body mt-1">{{ planService.savedPlans().length }} {{ 'pianiSalvati.count' | translate }}</p>
                    </div>
                    <button (click)="goToWizard()"
                            class="flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-500
                                   text-white text-sm font-semibold rounded-xl transition-all duration-200 font-body
                                   hover:-translate-y-0.5 shadow-md shadow-brand-500/25 flex-shrink-0">
                      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/>
                      </svg>
                      {{ 'pianiSalvati.nuovoPiano' | translate }}
                    </button>
                  </div>

                  @if (planService.savedPlans().length === 0) {
                    <div class="text-center py-20">
                      <div class="w-16 h-16 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mx-auto mb-4 float-anim">
                        <svg class="w-7 h-7 text-zinc-400 dark:text-zinc-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8l1 12h12l1-12"/>
                        </svg>
                      </div>
                      <p class="text-sm font-semibold text-zinc-600 dark:text-zinc-400 font-display mb-1">{{ 'pianiSalvati.nessunPiano' | translate }}</p>
                      <p class="text-xs text-zinc-400 dark:text-zinc-500 font-body">{{ 'pianiSalvati.nessunPianoDesc' | translate }}</p>
                    </div>
                  } @else {
                    <div [ngClass]="selectedPlanId() ? 'space-y-3' : 'grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4'">
                      @for (plan of planService.savedPlans(); track plan.id; let i = $index) {
                        <div (click)="selectedPlanId.set(plan.id)"
                             [ngClass]="[
                               'cursor-pointer bg-white dark:bg-zinc-900 rounded-2xl border shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200 overflow-hidden',
                               selectedPlanId() === plan.id
                                 ? 'border-brand-300 dark:border-brand-700 ring-2 ring-brand-100 dark:ring-brand-900/30'
                                 : plan.isCowork ? 'border-violet-200 dark:border-violet-800/50' : 'border-zinc-100 dark:border-zinc-800'
                             ]"
                             [style.animation-delay]="(i * 60) + 'ms'"
                             style="animation: viewEnter 0.4s cubic-bezier(0.16,1,0.3,1) both;">

                          <div class="px-5 pt-4 pb-3 border-b border-zinc-50 dark:border-zinc-800">
                            <!-- Cowork badge -->
                            @if (plan.isCowork) {
                              <div class="flex items-center justify-between mb-2">
                                <div class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-violet-50 dark:bg-violet-950/40 border border-violet-100 dark:border-violet-800/50">
                                  <svg class="w-3 h-3 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"/>
                                  </svg>
                                  <span class="text-[10px] font-semibold text-violet-700 dark:text-violet-400 font-body">Co-work</span>
                                </div>
                              </div>
                            }
                            <div class="flex items-start justify-between gap-3">
                              <div class="min-w-0">
                                <p class="text-sm font-bold text-zinc-900 dark:text-zinc-100 font-display truncate">{{ plan.name }}</p>
                                <p class="text-xs text-zinc-400 dark:text-zinc-500 font-body mt-0.5">
                                  {{ plan.versions.length }} versioni · {{ formatDate(plan.createdAt) }}
                                </p>
                              </div>
                              <button (click)="$event.stopPropagation(); planService.deletePlan(plan.id)"
                                      class="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0
                                             text-zinc-300 dark:text-zinc-500 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all">
                                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
                                </svg>
                              </button>
                            </div>
                          </div>

                          <!-- Version color dots -->
                          <div class="px-5 py-3 flex items-center gap-2">
                            @for (v of plan.versions; track v.id) {
                              <div class="w-2.5 h-2.5 rounded-full flex-shrink-0 ring-1 ring-white dark:ring-zinc-900"
                                   [style.background]="v.color"
                                   [title]="v.name + ' (' + v.status + ')'"></div>
                            }
                            <span class="text-xs text-zinc-400 dark:text-zinc-500 font-body ml-1">
                              {{ countVersionsByStatus(plan, 'definitivo') }} definitive,
                              {{ countVersionsByStatus(plan, 'bozza') }} bozze
                            </span>
                          </div>

                          <div class="px-5 pb-4">
                            <div class="text-xs text-brand-600 dark:text-brand-400 font-semibold font-body flex items-center gap-1">
                              <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/>
                              </svg>
                              Vedi versioni
                            </div>
                          </div>
                        </div>
                      }
                    </div>
                  }
                </div>
              </div>

              <!-- ── Versions panel ── -->
              @if (selectedPlan()) {
                <div class="flex-1 flex flex-col border-l border-zinc-100 dark:border-zinc-800 overflow-hidden bg-zinc-50 dark:bg-zinc-950"
                     style="animation: slideFromRight 0.3s cubic-bezier(0.16,1,0.3,1) both;">

                  <!-- Panel header -->
                  <div class="flex items-center justify-between px-6 py-4 bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800 flex-shrink-0">
                    <div class="flex items-center gap-3 min-w-0">
                      <button (click)="selectedPlanId.set(null); colorPickerVersionId.set(null)"
                              class="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors lg:hidden flex-shrink-0">
                        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/>
                        </svg>
                      </button>
                      <div class="min-w-0">
                        <h2 class="text-base font-bold text-zinc-900 dark:text-zinc-100 font-display truncate">{{ selectedPlan()!.name }}</h2>
                        <p class="text-xs text-zinc-400 dark:text-zinc-500 font-body mt-0.5 flex items-center gap-1.5">
                          {{ selectedPlan()!.versions.length }} versioni
                          @if (selectedPlan()!.isCowork) {
                            <span class="inline-flex items-center gap-1 px-1.5 py-px bg-violet-50 dark:bg-violet-950/40 border border-violet-100 dark:border-violet-800/50 rounded-full">
                              <svg class="w-2.5 h-2.5 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"/>
                              </svg>
                              <span class="text-[9px] font-semibold text-violet-700 dark:text-violet-400 font-body">Co-work</span>
                            </span>
                          }
                        </p>
                      </div>
                    </div>
                    <button (click)="selectedPlanId.set(null); colorPickerVersionId.set(null)"
                            class="hidden lg:flex w-8 h-8 items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors flex-shrink-0">
                      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
                      </svg>
                    </button>
                  </div>

                  <!-- Version list -->
                  <div class="flex-1 overflow-y-auto scrollbar-thin p-6 space-y-3">
                    @for (version of selectedPlan()!.versions; track version.id; let vi = $index) {
                      <div class="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-card overflow-visible"
                           [style.animation-delay]="(vi * 50) + 'ms'"
                           style="animation: viewEnter 0.35s cubic-bezier(0.16,1,0.3,1) both;">

                        <!-- Color accent bar -->
                        <div class="h-1 rounded-t-2xl" [style.background]="version.color"></div>

                        <div class="px-5 pt-4 pb-3">
                          <div class="flex items-start gap-3">

                            <!-- Color swatch + picker -->
                            <div class="relative flex-shrink-0">
                              <button (click)="$event.stopPropagation(); colorPickerVersionId.set(colorPickerVersionId() === version.id ? null : version.id)"
                                      class="w-8 h-8 rounded-lg border-2 border-white dark:border-zinc-800 shadow-sm hover:scale-110 transition-transform"
                                      [style.background]="version.color"
                                      title="Cambia colore"></button>

                              @if (colorPickerVersionId() === version.id) {
                                <div class="absolute top-10 left-0 z-50 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-700 shadow-2xl p-4 w-52"
                                     (click)="$event.stopPropagation()"
                                     style="animation: pickerUp 0.17s cubic-bezier(0.16,1,0.3,1) both;">
                                  <p class="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider font-body mb-3">Colore versione</p>
                                  <div class="grid grid-cols-5 gap-2">
                                    @for (color of versionColors; track color) {
                                      <button (click)="selectVersionColor(selectedPlan()!.id, version.id, color)"
                                              class="w-8 h-8 rounded-xl transition-all hover:scale-110 hover:shadow-md ring-offset-2 dark:ring-offset-zinc-900"
                                              [class.ring-2]="version.color === color"
                                              [style.background]="color"
                                              [style.ring-color]="color"></button>
                                    }
                                  </div>
                                </div>
                              }
                            </div>

                            <!-- Name + meta -->
                            <div class="flex-1 min-w-0">
                              <!-- Editable name -->
                              @if (editingVersionId() === version.id) {
                                <input
                                  type="text"
                                  class="w-full text-base font-bold font-display text-zinc-900 dark:text-zinc-100 bg-transparent border-b-2 border-brand-400 focus:outline-none pb-0.5 mb-0.5"
                                  [value]="editingVersionName()"
                                  (input)="editingVersionName.set($any($event.target).value)"
                                  (blur)="commitVersionName(selectedPlan()!.id, version.id)"
                                  (keydown.enter)="commitVersionName(selectedPlan()!.id, version.id)"
                                  (keydown.escape)="editingVersionId.set(null)"
                                  autofocus/>
                              } @else {
                                <button (click)="startEditVersionName(version)"
                                        class="text-sm font-bold font-display text-zinc-900 dark:text-zinc-100 hover:text-brand-600 dark:hover:text-brand-400 transition-colors text-left truncate max-w-full group flex items-center gap-1">
                                  {{ version.name }}
                                  <svg class="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                                  </svg>
                                </button>
                              }
                              <div class="flex items-center gap-2 mt-0.5">
                                <!-- Status badge -->
                                <span [ngClass]="[
                                  'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold font-body',
                                  version.status === 'definitivo'
                                    ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                                    : 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                                ]">
                                  <div [ngClass]="['w-1.5 h-1.5 rounded-full', version.status === 'definitivo' ? 'bg-emerald-500' : 'bg-amber-400']"></div>
                                  {{ version.status === 'definitivo' ? 'Definitivo' : 'Bozza' }}
                                </span>
                                <span class="text-[11px] text-zinc-400 dark:text-zinc-500 font-body">{{ formatDate(version.savedAt) }}</span>
                              </div>
                            </div>

                            <!-- Delete version -->
                            <button (click)="planService.deleteVersion(selectedPlan()!.id, version.id)"
                                    class="w-7 h-7 flex items-center justify-center rounded-lg text-zinc-300 dark:text-zinc-600 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all flex-shrink-0">
                              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
                              </svg>
                            </button>
                          </div>

                          <!-- KPI summary row -->
                          <div class="mt-3 grid grid-cols-3 gap-2 pb-3 border-b border-zinc-50 dark:border-zinc-800">
                            <div>
                              <p class="text-[10px] text-zinc-400 dark:text-zinc-500 font-body">Fatturato Y1</p>
                              <p class="text-xs font-bold text-zinc-800 dark:text-zinc-200 font-mono mt-0.5">{{ formatK(version.kpi.fatturatoTotale) }}</p>
                            </div>
                            <div>
                              <p class="text-[10px] text-zinc-400 dark:text-zinc-500 font-body">EBITDA Y1</p>
                              <p [ngClass]="['text-xs font-bold font-mono mt-0.5', version.kpi.ebitda >= 0 ? 'text-emerald-600' : 'text-rose-500']">
                                {{ formatK(version.kpi.ebitda) }}
                              </p>
                            </div>
                            <div>
                              <p class="text-[10px] text-zinc-400 dark:text-zinc-500 font-body">Cash Runway</p>
                              <p class="text-xs font-bold text-zinc-800 dark:text-zinc-200 font-mono mt-0.5">{{ version.kpi.cashRunway }} mesi</p>
                            </div>
                          </div>

                          <!-- Cowork: contributors per version -->
                          @if (selectedPlan()!.isCowork && version.contributors && version.contributors.length > 0) {
                            <div class="mt-3 pb-3 border-b border-zinc-50 dark:border-zinc-800">
                              <p class="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider font-body mb-2">Chi ha operato</p>
                              <div class="space-y-1.5">
                                @for (contributor of version.contributors; track contributor.name) {
                                  <div class="flex items-center gap-2">
                                    <div class="w-5 h-5 rounded-full flex items-center justify-center text-white text-[8px] font-bold flex-shrink-0"
                                         [style.background]="contributor.avatarColor">{{ contributor.initials }}</div>
                                    <span class="text-xs text-zinc-600 dark:text-zinc-400 font-body flex-1 truncate">{{ contributor.name }}</span>
                                    <span class="text-[10px] text-zinc-400 dark:text-zinc-500 font-body flex-shrink-0">{{ formatDate(contributor.lastEditedAt) }}</span>
                                  </div>
                                }
                              </div>
                            </div>
                          }

                          <!-- Actions -->
                          <div class="mt-3 flex items-center gap-2">
                            <button (click)="loadVersionAndNavigate(version, selectedPlan()!.id)"
                                    class="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-zinc-950 dark:bg-zinc-800 hover:bg-zinc-800 dark:hover:bg-zinc-700
                                           text-white text-xs font-semibold rounded-xl transition-all duration-150 font-body">
                              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>
                              </svg>
                              Carica
                            </button>
                            <button (click)="sendVersionToAi(version, selectedPlan()!.id)"
                                    class="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-brand-600 hover:bg-brand-500
                                           text-white text-xs font-semibold rounded-xl transition-all duration-150 font-body shadow-sm shadow-brand-500/20">
                              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
                              </svg>
                              Chiedi all'AI
                            </button>
                          </div>
                        </div>
                      </div>
                    }
                  </div>
                </div>
              }

            </div>
          }

          <!-- CO-WORK -->
          @if (currentView() === 'co-work') {
            <div class="view-enter relative h-full overflow-hidden flex flex-col lg:flex-row"
                 (mousemove)="onCoworkMouseMove($event)">

              <!-- ── BACKGROUND: full-screen animated network ── -->
              <div class="absolute inset-0 overflow-hidden" aria-hidden="true">
                <div class="absolute inset-0 bg-zinc-50 dark:bg-zinc-950"></div>
                <div class="absolute inset-0"
                     [style.background]="themeService.dark()
                       ? 'radial-gradient(ellipse 80% 70% at 58% 50%, rgba(99,102,241,0.18) 0%, transparent 70%)'
                       : 'radial-gradient(ellipse 80% 70% at 58% 50%, rgba(99,102,241,0.08) 0%, transparent 70%)'">
                </div>
                <svg viewBox="0 0 700 700" preserveAspectRatio="xMidYMid meet"
                     class="absolute inset-0 w-full h-full" style="pointer-events: none;">
                  <defs>
                    <radialGradient id="cw-owner-grad2" cx="40%" cy="35%">
                      <stop offset="0%" stop-color="#f59e0b"/>
                      <stop offset="100%" stop-color="#ef4444"/>
                    </radialGradient>
                    <radialGradient id="cw-core-glow2" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stop-color="#6366f1"
                            [attr.stop-opacity]="themeService.dark() ? '0.38' : '0.22'"/>
                      <stop offset="100%" stop-color="#6366f1" stop-opacity="0"/>
                    </radialGradient>
                    <filter id="cw-node-glow2" x="-60%" y="-60%" width="220%" height="220%">
                      <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" result="b"/>
                      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
                    </filter>
                    <filter id="cw-blur2" x="-80%" y="-80%" width="260%" height="260%">
                      <feGaussianBlur in="SourceGraphic" stdDeviation="5"/>
                    </filter>
                    <radialGradient id="cw-node-halo-joined" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stop-color="#6366f1" stop-opacity="0.55"/>
                      <stop offset="55%" stop-color="#6366f1" stop-opacity="0.18"/>
                      <stop offset="100%" stop-color="#6366f1" stop-opacity="0"/>
                    </radialGradient>
                    <radialGradient id="cw-node-halo-pending" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stop-color="#f59e0b" stop-opacity="0.5"/>
                      <stop offset="55%" stop-color="#f59e0b" stop-opacity="0.16"/>
                      <stop offset="100%" stop-color="#f59e0b" stop-opacity="0"/>
                    </radialGradient>
                  </defs>

                  <!-- Center ambient glow -->
                  <ellipse cx="350" cy="350" rx="95" ry="85" fill="url(#cw-core-glow2)" opacity="0.9"/>

                  <!-- Orbit rings: solid, clean -->
                  <circle cx="350" cy="350" r="145" fill="none"
                          [attr.stroke]="themeService.dark() ? 'rgba(99,102,241,0.12)' : 'rgba(99,102,241,0.08)'"
                          stroke-width="1"/>
                  <circle cx="350" cy="350" r="248" fill="none"
                          [attr.stroke]="themeService.dark() ? 'rgba(99,102,241,0.08)' : 'rgba(99,102,241,0.05)'"
                          stroke-width="1"/>
                  <circle cx="350" cy="350" r="340" fill="none"
                          [attr.stroke]="themeService.dark() ? 'rgba(99,102,241,0.05)' : 'rgba(99,102,241,0.03)'"
                          stroke-width="0.5"/>

                  <!-- Orbiting member nodes (RAF-driven, see _runOrbitLoop) -->
                  <ng-container *ngFor="let node of orbitalNodes(); let i = index; trackBy: trackOrbitNode">
                    <!-- Connection line: x1,y1 fixed at sun; x2,y2 updated each frame -->
                    <line #orbitLine
                          x1="350" y1="350"
                          [attr.x2]="node.x0" [attr.y2]="node.y0"
                          class="orbit-line"
                          [attr.stroke]="node.status === 'joined'
                            ? (themeService.dark() ? 'rgba(99,102,241,0.28)' : 'rgba(99,102,241,0.18)')
                            : (themeService.dark() ? 'rgba(245,158,11,0.22)' : 'rgba(245,158,11,0.14)')"
                          stroke-width="0.8" stroke-linecap="round"/>

                    <!-- Node group: transform updated each frame by RAF -->
                    <g #orbitNodeG
                       class="orbit-node-g"
                       [attr.transform]="'translate(' + node.x0 + ',' + node.y0 + ')'"
                       style="pointer-events: auto; cursor: pointer;"
                       (mouseenter)="hoveredCoworkNode.set(node)"
                       (mouseleave)="hoveredCoworkNode.set(null)">

                      <!-- Pending pulse rings -->
                      <circle r="28" fill="none" stroke="#f59e0b" stroke-width="1.2"
                              class="pending-ring"
                              [style.display]="node.status === 'pending' ? '' : 'none'"/>
                      <circle r="28" fill="none" stroke="#f59e0b" stroke-width="0.8"
                              class="pending-ring-2"
                              [style.display]="node.status === 'pending' ? '' : 'none'"/>

                      <!-- Joined glow ring -->
                      <circle r="27" fill="none" stroke="#6366f1" stroke-width="1.5"
                              class="joined-glow"
                              [style.display]="node.status === 'joined' ? '' : 'none'"
                              [attr.opacity]="themeService.dark() ? '0.45' : '0.30'"/>

                      <!-- Soft halo (gradient fill, no filter — GPU-friendly) -->
                      <circle r="34"
                              [attr.fill]="node.status === 'joined' ? 'url(#cw-node-halo-joined)' : 'url(#cw-node-halo-pending)'"
                              [attr.opacity]="themeService.dark() ? '0.85' : '0.65'"/>

                      <!-- Avatar bg + initials (no filter; clean stroke handles depth) -->
                      <circle r="22"
                              [attr.fill]="themeService.dark() ? '#18181b' : '#ffffff'"
                              [attr.stroke]="node.status === 'joined' ? '#6366f1' : '#f59e0b'"
                              stroke-width="2"
                              [attr.stroke-opacity]="node.status === 'joined' ? '0.82' : '0.58'"/>
                      <circle r="20" [attr.fill]="node.avatarColor" opacity="0.95"/>
                      <text text-anchor="middle" dy="0.38em" font-size="10" font-weight="700" fill="white"
                            font-family="system-ui,-apple-system,sans-serif">{{ node.initials }}</text>

                      <!-- Status dot -->
                      <circle cx="15" cy="-15" r="5.5"
                              [attr.fill]="node.status === 'joined' ? '#10b981' : '#f59e0b'"
                              [attr.stroke]="themeService.dark() ? '#09090b' : '#f8fafc'"
                              stroke-width="1.5"/>

                      <!-- Floating comment bubble -->
                      <g class="comment-bubble-anim"
                         [style.animation-delay]="(i * 2.8) + 's'"
                         style="pointer-events: none;">
                        <rect x="-44" y="-62" width="88" height="22" rx="5.5"
                              [attr.fill]="themeService.dark() ? '#1e1b4b' : '#ffffff'"
                              fill-opacity="0.97"
                              [attr.stroke]="node.status === 'joined' ? '#6366f1' : '#f59e0b'"
                              stroke-width="0.8" stroke-opacity="0.55"/>
                        <polygon points="-4,-40 4,-40 0,-34"
                                 [attr.fill]="themeService.dark() ? '#1e1b4b' : '#ffffff'"
                                 fill-opacity="0.97"/>
                        <circle cx="-32" cy="-51" r="2.8"
                                [attr.fill]="node.status === 'joined' ? '#6366f1' : '#f59e0b'"/>
                        <text x="-22" y="-47" text-anchor="start" font-size="7.5" font-weight="600"
                              [attr.fill]="themeService.dark() ? '#c7d2fe' : '#3730a3'"
                              font-family="system-ui,-apple-system,sans-serif">{{ coworkCommentTexts[i % coworkCommentTexts.length] }}</text>
                      </g>
                    </g>
                  </ng-container>

                  <!-- Owner sun: breathing rings -->
                  <circle cx="350" cy="350" r="52" fill="none" stroke="#6366f1" stroke-width="1"
                          [attr.opacity]="themeService.dark() ? '0.20' : '0.13'"
                          class="solar-center-ring"/>
                  <circle cx="350" cy="350" r="40" fill="none" stroke="#6366f1" stroke-width="1.5"
                          [attr.opacity]="themeService.dark() ? '0.28' : '0.18'"
                          class="solar-center-ring-2"/>
                  <circle cx="350" cy="350" r="32" fill="url(#cw-owner-grad2)" opacity="0.20"
                          filter="url(#cw-blur2)"/>
                  <circle cx="350" cy="350" r="29" fill="url(#cw-owner-grad2)" opacity="0.95"
                          filter="url(#cw-node-glow2)"/>
                  <circle cx="350" cy="350" r="29" fill="none" stroke="white" stroke-width="0.75" opacity="0.35"/>
                  <text x="350" y="355" text-anchor="middle" font-size="14" font-weight="800" fill="white"
                        font-family="system-ui,-apple-system,sans-serif">F</text>
                </svg>
              </div>

              <!-- ── HOVER TOOLTIP ── -->
              @if (hoveredCoworkNode()) {
                <div class="fixed z-[100] pointer-events-none select-none rounded-xl shadow-lg border px-3 py-2.5 min-w-[160px] max-w-[220px]
                            bg-white/95 dark:bg-zinc-900/95 backdrop-blur-sm border-zinc-200/80 dark:border-zinc-700/80"
                     [style.left.px]="coworkTooltipX()"
                     [style.top.px]="coworkTooltipY()"
                     style="animation: viewEnter 0.15s ease both;">
                  <div class="flex items-center gap-2 mb-1.5">
                    <div class="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0"
                         [style.background]="hoveredCoworkNode()!.avatarColor">
                      {{ hoveredCoworkNode()!.initials }}
                    </div>
                    <span class="text-[11px] font-bold text-zinc-800 dark:text-zinc-100 font-body truncate">
                      {{ hoveredCoworkNode()!.name || hoveredCoworkNode()!.email.split('@')[0] }}
                    </span>
                  </div>
                  <p class="text-[10px] text-zinc-500 dark:text-zinc-400 font-body truncate mb-1.5">
                    {{ hoveredCoworkNode()!.email }}
                  </p>
                  <div class="flex items-center gap-1.5">
                    <span [ngClass]="hoveredCoworkNode()!.role === 'editor'
                      ? 'bg-violet-50 dark:bg-violet-950/50 text-violet-700 dark:text-violet-400'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400'"
                          class="text-[9px] font-bold px-1.5 py-0.5 rounded-full font-body capitalize">
                      {{ hoveredCoworkNode()!.role }}
                    </span>
                    <div class="w-1.5 h-1.5 rounded-full"
                         [ngClass]="hoveredCoworkNode()!.status === 'joined' ? 'bg-emerald-400' : 'bg-amber-400'"></div>
                    <span class="text-[9px] text-zinc-400 dark:text-zinc-500 font-body">
                      {{ hoveredCoworkNode()!.status === 'joined' ? ('cowork.attivo' | translate) : ('cowork.inAttesa' | translate) }}
                    </span>
                  </div>
                </div>
              }

              <!-- ── FORM PANEL: compact left sidebar ── -->
              <div class="w-full lg:w-[26rem] xl:w-[30rem] flex-shrink-0 flex flex-col overflow-hidden relative z-10
                          bg-white/85 dark:bg-zinc-950/85 backdrop-blur-md
                          border-b lg:border-b-0 lg:border-r border-zinc-200/50 dark:border-zinc-800/50">
                <div class="flex-1 flex flex-col min-h-0 p-5 gap-4 overflow-hidden">

                  <!-- Header row -->
                  <div class="flex items-center justify-between flex-shrink-0 pt-1">
                    <div class="flex items-center gap-2.5">
                      <h1 class="text-lg font-bold text-zinc-900 dark:text-zinc-100 font-display">{{ 'cowork.title' | translate }}</h1>
                      @if (coworkMembers().length > 0) {
                        <div class="flex items-center gap-1.5">
                          <div class="flex items-center -space-x-1.5">
                            @for (m of coworkMembers().slice(0, 4); track m.id) {
                              <div class="w-5 h-5 rounded-full border border-white dark:border-zinc-900 flex items-center justify-center text-white text-[7px] font-bold flex-shrink-0"
                                   [style.background]="m.avatarColor">{{ m.initials }}</div>
                            }
                          </div>
                          <span class="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 font-body">
                            {{ coworkJoinedCount() }}/{{ coworkMembers().length + 1 }}
                          </span>
                        </div>
                      }
                    </div>
                    <button (click)="goToWizard()"
                            class="flex items-center gap-1.5 px-3 py-1.5 bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold rounded-xl transition-all duration-200 font-body hover:-translate-y-0.5 shadow-sm flex-shrink-0">
                      <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                      </svg>
                      {{ 'cowork.pianoBtn' | translate }}
                    </button>
                  </div>

                  <!-- Invite by email -->
                  <div class="bg-white/90 dark:bg-zinc-900/80 rounded-xl border border-zinc-200/70 dark:border-zinc-700/60 p-4 flex-shrink-0">
                    <p class="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wide font-body mb-3">{{ 'cowork.invitaEmail' | translate }}</p>
                    <div class="flex gap-2">
                      <input type="email" placeholder="nome@azienda.com"
                             [value]="coworkEmailInput()"
                             (input)="coworkEmailInput.set($any($event.target).value)"
                             (keydown.enter)="addCoworkMember()"
                             class="flex-1 min-w-0 px-3 py-2 text-base bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg font-body text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:border-brand-400 transition-all"/>
                      <div class="flex gap-0.5 p-0.5 bg-zinc-100 dark:bg-zinc-800 rounded-lg flex-shrink-0">
                        <button (click)="coworkRoleInput.set('reader')"
                                [matTooltip]="'cowork.tooltipReader' | translate" matTooltipPosition="below"
                                [ngClass]="coworkRoleInput() === 'reader' ? 'bg-white dark:bg-zinc-700 text-zinc-800 dark:text-zinc-100 shadow-sm' : 'text-zinc-400 dark:text-zinc-500'"
                                class="px-2.5 py-1.5 rounded-md transition-all flex items-center justify-center">
                          <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                            <path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                          </svg>
                        </button>
                        <button (click)="coworkRoleInput.set('editor')"
                                [matTooltip]="'cowork.tooltipEditor' | translate" matTooltipPosition="below"
                                [ngClass]="coworkRoleInput() === 'editor' ? 'bg-white dark:bg-zinc-700 text-zinc-800 dark:text-zinc-100 shadow-sm' : 'text-zinc-400 dark:text-zinc-500'"
                                class="px-2.5 py-1.5 rounded-md transition-all flex items-center justify-center">
                          <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                          </svg>
                        </button>
                      </div>
                      <button (click)="addCoworkMember()"
                              [disabled]="!coworkEmailInput()"
                              [ngClass]="coworkEmailInput() ? 'bg-brand-600 hover:bg-brand-500 text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed'"
                              class="flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200 flex-shrink-0">
                        <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/>
                        </svg>
                      </button>
                    </div>
                  </div>

                  <!-- Invite link: compact single row -->
                  <div class="bg-white/90 dark:bg-zinc-900/80 rounded-xl border border-zinc-200/70 dark:border-zinc-700/60 p-4 flex-shrink-0">
                    <div class="flex items-center gap-2">
                      <div class="flex-1 min-w-0 flex items-center gap-1.5">
                        <p class="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wide font-body">{{ 'cowork.linkInvito' | translate }}</p>
                        <span class="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/40 border border-amber-100 dark:border-amber-800/50 cursor-default"
                              tabindex="0"
                              [matTooltip]="'cowork.tooltip2h' | translate" matTooltipPosition="below">
                          <svg class="w-2.5 h-2.5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                          </svg>
                          <span class="text-[9px] font-semibold text-amber-700 dark:text-amber-400 font-body">2h</span>
                        </span>
                      </div>
                      <div class="flex items-center gap-1 flex-shrink-0">
                        <div class="flex gap-0.5 p-0.5 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
                          <button (click)="inviteLinkRole.set('reader')"
                                  [matTooltip]="'cowork.tooltipReader' | translate" matTooltipPosition="below"
                                  [ngClass]="inviteLinkRole() === 'reader' ? 'bg-white dark:bg-zinc-700 text-zinc-800 dark:text-zinc-100 shadow-sm' : 'text-zinc-400 dark:text-zinc-500'"
                                  class="px-2.5 py-1.5 rounded-md transition-all flex items-center justify-center">
                            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                              <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                              <path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                            </svg>
                          </button>
                          <button (click)="inviteLinkRole.set('editor')"
                                  [matTooltip]="'cowork.tooltipEditor' | translate" matTooltipPosition="below"
                                  [ngClass]="inviteLinkRole() === 'editor' ? 'bg-white dark:bg-zinc-700 text-zinc-800 dark:text-zinc-100 shadow-sm' : 'text-zinc-400 dark:text-zinc-500'"
                                  class="px-2.5 py-1.5 rounded-md transition-all flex items-center justify-center">
                            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                              <path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                            </svg>
                          </button>
                        </div>
                        <button (click)="generateInviteLink()"
                                class="flex items-center gap-1 px-2.5 py-1.5 bg-zinc-900 dark:bg-zinc-700 hover:bg-zinc-800 dark:hover:bg-zinc-600 text-white text-[10px] font-semibold rounded-lg font-body transition-all duration-200">
                          @if (inviteLinkCopied()) {
                            <svg class="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                              <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
                            </svg>
                            {{ 'cowork.copiato' | translate }}
                          } @else {
                            <svg class="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                              <path stroke-linecap="round" stroke-linejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                            </svg>
                            {{ 'cowork.copia' | translate }}
                          }
                        </button>
                      </div>
                    </div>
                  </div>

                  <!-- Team list: compact, fills remaining height -->
                  <div class="bg-white/90 dark:bg-zinc-900/80 rounded-xl border border-zinc-200/70 dark:border-zinc-700/60 overflow-hidden flex-1 flex flex-col min-h-0">
                    <div class="px-3 py-2 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between flex-shrink-0">
                      <p class="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wide font-body">{{ 'cowork.title' | translate }} ({{ coworkMembers().length + 1 }})</p>
                      <div class="flex items-center gap-1">
                        @if (coworkPendingCount() > 0) {
                          <span class="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 font-body">{{ coworkPendingCount() }} {{ 'cowork.attesa' | translate }}</span>
                        }
                        @if (coworkJoinedCount() > 0) {
                          <span class="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 font-body">{{ coworkJoinedCount() }} {{ 'cowork.attivi' | translate }}</span>
                        }
                      </div>
                    </div>
                    <div class="flex-1 overflow-hidden">
                      <!-- Owner row -->
                      <div class="flex items-center gap-2.5 px-3 py-2.5 border-b border-zinc-50 dark:border-zinc-800/50">
                        <div class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                             style="background: linear-gradient(135deg, #f59e0b, #ef4444);">F</div>
                        <div class="flex-1 min-w-0">
                          <p class="text-xs font-semibold text-zinc-800 dark:text-zinc-200 font-body">{{ 'cowork.founderLabel' | translate }}</p>
                          <p class="text-[10px] text-zinc-400 dark:text-zinc-500 font-body truncate">antonio.darrigoct&#64;gmail.com</p>
                        </div>
                        <span class="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-brand-50 dark:bg-brand-950/40 text-brand-700 dark:text-brand-400 font-body flex-shrink-0">Owner</span>
                      </div>
                      @for (member of coworkMembers(); track member.id; let i = $index) {
                        <div class="flex items-center gap-2.5 px-3 py-2.5 border-b border-zinc-50 dark:border-zinc-800/50 last:border-b-0 member-row-enter"
                             [style.animation-delay]="(i * 60 + 80) + 'ms'">
                          <div class="relative flex-shrink-0">
                            <div class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                                 [style.background]="member.avatarColor">{{ member.initials }}</div>
                            <div [ngClass]="member.status === 'joined' ? 'bg-emerald-400' : 'bg-amber-400'"
                                 class="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-white dark:border-zinc-900"></div>
                          </div>
                          <div class="flex-1 min-w-0">
                            <p class="text-xs font-semibold text-zinc-800 dark:text-zinc-200 font-body truncate">{{ member.name || member.email.split('@')[0] }}</p>
                            <p class="text-[10px] text-zinc-400 dark:text-zinc-500 font-body truncate">{{ member.email }}</p>
                          </div>
                          <span [ngClass]="member.role === 'editor' ? 'bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-400' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400'"
                                class="text-[9px] font-semibold px-1.5 py-0.5 rounded-full font-body flex-shrink-0 capitalize">{{ member.role }}</span>
                          <div class="flex items-center gap-0.5 flex-shrink-0">
                            @if (member.status === 'pending') {
                              <button (click)="acceptMember(member.id)"
                                      class="w-6 h-6 flex items-center justify-center rounded-lg text-zinc-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-all"
                                      title="Accetta">
                                <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                                  <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
                                </svg>
                              </button>
                            }
                            <button (click)="removeCoworkMember(member.id)"
                                    class="w-6 h-6 flex items-center justify-center rounded-lg text-zinc-300 dark:text-zinc-600 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all">
                              <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
                              </svg>
                            </button>
                          </div>
                        </div>
                      }
                      @if (coworkMembers().length === 0) {
                        <div class="px-3 py-8 text-center">
                          <p class="text-xs font-semibold text-zinc-600 dark:text-zinc-400 font-body mb-0.5">{{ 'cowork.nessunCollaboratore' | translate }}</p>
                          <p class="text-[10px] text-zinc-400 dark:text-zinc-500 font-body">{{ 'cowork.nessunCollaboratoreDesc' | translate }}</p>
                        </div>
                      }
                    </div>
                  </div>

                </div>
              </div>

              <!-- Spacer: SVG visible on right portion of desktop -->
              <div class="hidden lg:flex flex-1" aria-hidden="true"></div>

            </div>
          }

          <!-- CARICAMENTI -->
          @if (currentView() === 'caricamenti') {
            <div class="view-enter flex flex-col h-full overflow-hidden">
              <app-upload-business-plan/>
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
                <p class="text-xs font-semibold text-brand-600 uppercase tracking-widest font-body mb-1">{{ 'settings.subtitle' | translate }}</p>
                <h1 class="text-2xl font-bold text-zinc-900 dark:text-zinc-100 font-display mb-7">{{ 'settings.title' | translate }}</h1>
                <div class="space-y-4">
                  @for (section of settingSections; track section.label; let i = $index) {
                    <div class="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-5 shadow-card"
                         [style.animation-delay]="(i * 70 + 50) + 'ms'"
                         style="animation: viewEnter 0.45s cubic-bezier(0.16,1,0.3,1) both;">
                      <p class="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest font-body mb-4">{{ section.label | translate }}</p>
                      <div class="space-y-4">
                        @for (item of section.items; track item.key) {
                          <div class="flex items-center justify-between">
                            <div class="flex-1 pr-4">
                              <p class="text-sm font-medium text-zinc-700 dark:text-zinc-300 font-body">{{ item.label | translate }}</p>
                              <p class="text-xs text-zinc-400 dark:text-zinc-500 font-body mt-0.5">{{ item.desc | translate }}</p>
                            </div>
                            <button
                              (click)="toggleSettingItem(item)"
                              [ngClass]="[
                                'relative w-11 h-6 rounded-full transition-all duration-300 flex-shrink-0',
                                item.enabled ? 'bg-brand-600' : 'bg-zinc-200 dark:bg-zinc-700'
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


                  <!-- SEZIONE CONTATTI -->
                  <div class="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-5 shadow-card"
                       [style.animation-delay]="((settingSections.length + 1) * 70 + 50) + 'ms'"
                       style="animation: viewEnter 0.45s cubic-bezier(0.16,1,0.3,1) both;">
                    <p class="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest font-body mb-4">{{ 'settings.sections.contatti.label' | translate }}</p>
                    <p class="text-xs text-zinc-400 dark:text-zinc-500 font-body mb-4 leading-relaxed">{{ 'settings.sections.contatti.intro' | translate }}</p>

                    <!-- Canali email -->
                    <div class="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-5">
                      @for (channel of contactEmails; track channel.address) {
                        <div class="flex flex-col gap-1 px-3 py-2.5 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-800/40">
                          <span class="text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 font-body">{{ channel.labelKey | translate }}</span>
                          <span class="text-xs font-mono text-zinc-700 dark:text-zinc-300 truncate">{{ channel.address }}</span>
                        </div>
                      }
                    </div>

                    <!-- Form di contatto supporto -->
                    @if (contactSent()) {
                      <div class="flex items-center gap-3 px-4 py-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-900/40"
                           style="animation: viewEnter 0.3s cubic-bezier(0.16,1,0.3,1) both;">
                        <div class="w-9 h-9 flex items-center justify-center rounded-full bg-emerald-500 text-white flex-shrink-0">
                          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
                          </svg>
                        </div>
                        <div>
                          <p class="text-sm font-semibold text-emerald-700 dark:text-emerald-300 font-body">{{ 'settings.sections.contatti.form.inviato.title' | translate }}</p>
                          <p class="text-xs text-emerald-600/80 dark:text-emerald-400/70 font-body mt-0.5">{{ 'settings.sections.contatti.form.inviato.desc' | translate }}</p>
                        </div>
                      </div>
                    } @else {
                      <form (submit)="$event.preventDefault(); submitContactForm()" class="space-y-3">
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label class="text-xs font-semibold text-zinc-600 dark:text-zinc-400 font-body mb-1.5 block">{{ 'settings.sections.contatti.form.nome' | translate }}</label>
                            <input type="text" [placeholder]="'settings.sections.contatti.form.nomePlaceholder' | translate"
                                   [value]="contactName()"
                                   (input)="contactName.set($any($event.target).value)"
                                   class="w-full px-3 py-2.5 text-base bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl font-body text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 dark:focus:ring-brand-900/30 transition-all"/>
                          </div>
                          <div>
                            <label class="text-xs font-semibold text-zinc-600 dark:text-zinc-400 font-body mb-1.5 block">{{ 'settings.sections.contatti.form.email' | translate }}</label>
                            <input type="email" placeholder="nome@azienda.com"
                                   [value]="contactEmail()"
                                   (input)="contactEmail.set($any($event.target).value)"
                                   class="w-full px-3 py-2.5 text-base bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl font-body text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 dark:focus:ring-brand-900/30 transition-all"/>
                          </div>
                        </div>
                        <div>
                          <label class="text-xs font-semibold text-zinc-600 dark:text-zinc-400 font-body mb-1.5 block">{{ 'settings.sections.contatti.form.oggetto' | translate }}</label>
                          <input type="text" [placeholder]="'settings.sections.contatti.form.oggettoPlaceholder' | translate"
                                 [value]="contactSubject()"
                                 (input)="contactSubject.set($any($event.target).value)"
                                 class="w-full px-3 py-2.5 text-base bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl font-body text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 dark:focus:ring-brand-900/30 transition-all"/>
                        </div>
                        <div>
                          <label class="text-xs font-semibold text-zinc-600 dark:text-zinc-400 font-body mb-1.5 block">{{ 'settings.sections.contatti.form.messaggio' | translate }}</label>
                          <textarea rows="4" [placeholder]="'settings.sections.contatti.form.messaggioPlaceholder' | translate"
                                    [value]="contactMessage()"
                                    (input)="contactMessage.set($any($event.target).value)"
                                    class="w-full px-3 py-2.5 text-base bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl font-body text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 dark:focus:ring-brand-900/30 transition-all resize-none"></textarea>
                        </div>
                        <button type="submit"
                                [disabled]="!contactEmail().trim() || !contactMessage().trim()"
                                class="w-full flex items-center justify-center gap-2 py-2.5 bg-brand-600 hover:bg-brand-500 disabled:bg-zinc-200 disabled:dark:bg-zinc-800 disabled:text-zinc-400 disabled:dark:text-zinc-600 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-all duration-200 font-body">
                          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                          </svg>
                          {{ 'settings.sections.contatti.form.invia' | translate }}
                        </button>
                      </form>
                    }
                  </div>

                  <!-- SEZIONE FAQ -->
                  <div class="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-5 shadow-card"
                       [style.animation-delay]="((settingSections.length + 2) * 70 + 50) + 'ms'"
                       style="animation: viewEnter 0.45s cubic-bezier(0.16,1,0.3,1) both;">
                    <p class="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest font-body mb-4">{{ 'settings.sections.faq.label' | translate }}</p>
                    <div class="space-y-2">
                      @for (faq of faqItems; track faq.qKey; let fi = $index) {
                        <div class="rounded-xl border border-zinc-100 dark:border-zinc-800 overflow-hidden">
                          <button (click)="toggleFaq(fi)"
                                  class="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                            <span class="text-sm font-medium text-zinc-700 dark:text-zinc-300 font-body">{{ faq.qKey | translate }}</span>
                            <svg [ngClass]="openFaqIndex() === fi ? 'rotate-180' : ''"
                                 class="w-4 h-4 text-zinc-400 dark:text-zinc-500 flex-shrink-0 transition-transform duration-300 ease-out"
                                 fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                              <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/>
                            </svg>
                          </button>
                          <div class="grid transition-all duration-300 ease-out"
                               [ngClass]="openFaqIndex() === fi ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'"
                               style="display: grid;">
                            <div class="overflow-hidden">
                              <p class="px-4 pb-4 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400 font-body">{{ faq.aKey | translate }}</p>
                            </div>
                          </div>
                        </div>
                      }
                    </div>
                  </div>

                  <!-- SEZIONE LANDING / SITO UFFICIALE -->
                  <div class="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-5 shadow-card flex items-center justify-between gap-4 flex-wrap"
                       [style.animation-delay]="((settingSections.length + 2) * 70 + 50) + 'ms'"
                       style="animation: viewEnter 0.45s cubic-bezier(0.16,1,0.3,1) both;">
                    <div>
                      <p class="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest font-body mb-1">{{ 'settings.sections.landing.label' | translate }}</p>
                      <p class="text-xs text-zinc-400 dark:text-zinc-500 font-body leading-relaxed max-w-md">{{ 'settings.sections.landing.intro' | translate }}</p>
                    </div>
                    <a href="https://airplan.io" target="_blank" rel="noopener noreferrer"
                       class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-semibold font-body transition-colors whitespace-nowrap">
                      {{ 'settings.sections.landing.cta' | translate }}
                      <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                      </svg>
                    </a>
                  </div>

                </div>
              </div>
            </div>
          }

        </div>

        <!-- AI Panel — resizable/fullscreen on desktop, fullscreen overlay on mobile -->
        @if (aiOpen()) {
          <div [ngClass]="
                  isLargeScreen() && chatDesktopFullscreen()
                    ? 'fixed inset-0 z-50 flex bg-white dark:bg-zinc-900 overflow-hidden'
                    : isLargeScreen()
                      ? 'ai-enter flex-shrink-0 h-full flex border-l border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden'
                      : 'fixed inset-0 z-50 flex flex-col bg-white dark:bg-zinc-900 overflow-hidden'"
               [style.width]="isLargeScreen() && !chatDesktopFullscreen() ? chatWidth() + 'px' : null">

            <!-- Mobile header with close button -->
            @if (!isLargeScreen()) {
              <div class="flex items-center justify-between px-4 h-12 border-b border-zinc-100 dark:border-zinc-800 flex-shrink-0 bg-white dark:bg-zinc-900">
                <div class="flex items-center gap-2">
                  <svg class="w-4 h-4 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
                  </svg>
                  <span class="text-sm font-semibold text-zinc-800 dark:text-zinc-200 font-body">{{ 'topbar.aiCopilot' | translate }}</span>
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
                  <span class="text-xs font-semibold text-zinc-600 dark:text-zinc-400 font-body">{{ 'topbar.aiCopilot' | translate }}</span>
                </div>
                <div class="flex items-center gap-0.5">
                  @if (chatDesktopFullscreen()) {
                    <!-- Dock back to side panel -->
                    <button (click)="chatDesktopFullscreen.set(false)"
                            [title]="'topbar.aiCopilotDockTitle' | translate"
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
                            [title]="'topbar.aiCopilotFullscreenTitle' | translate"
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
                          [title]="'topbar.aiCopilotCloseTitle' | translate"
                          class="w-7 h-7 flex items-center justify-center rounded-lg text-zinc-400 dark:text-zinc-500
                                 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                    <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                  </button>
                </div>
              </div>

              <div class="flex-1 overflow-hidden min-w-0">
                <app-ai-chatbot [agentId]="currentAiAgent()"/>
              </div>
            </div>
          </div>
        }

      </div>
    </main>

    <!-- ═══════════════════ SHARE DIALOG ═══════════════════ -->
    @if (shareDialogOpen()) {
      <div class="fixed inset-0 z-[60] flex items-center justify-center p-4"
           style="background: rgba(0,0,0,0.55); backdrop-filter: blur(4px);"
           (click)="closeShareDialog()">
        <div class="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
             (click)="$event.stopPropagation()"
             style="animation: viewEnter 0.25s cubic-bezier(0.16,1,0.3,1) both;">

          <!-- Header -->
          <div class="flex items-center justify-between px-6 pt-6 pb-4">
            <div>
              <h2 class="text-base font-bold text-zinc-900 dark:text-zinc-100 font-display">{{ 'share.title' | translate }}</h2>
              <p class="text-xs text-zinc-400 dark:text-zinc-500 font-body mt-0.5">{{ projectDisplayName() }}</p>
            </div>
            <button (click)="closeShareDialog()"
                    class="w-8 h-8 flex items-center justify-center rounded-xl text-zinc-400 dark:text-zinc-500
                           hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-700 dark:hover:text-zinc-300 transition-all">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>

          <!-- Tabs -->
          <div class="px-6 pb-4">
            <div class="flex gap-1 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl">
              <button (click)="shareTab.set('link')"
                      [ngClass]="shareTab() === 'link'
                        ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm'
                        : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'"
                      class="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold font-body transition-all duration-200">
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/>
                </svg>
                {{ 'share.generaLink' | translate }}
              </button>
              <button (click)="shareTab.set('email')"
                      [ngClass]="shareTab() === 'email'
                        ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm'
                        : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'"
                      class="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold font-body transition-all duration-200">
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                </svg>
                {{ 'share.inviaEmail' | translate }}
              </button>
            </div>
          </div>

          <!-- Tab: Link -->
          @if (shareTab() === 'link') {
            <div class="px-6 pb-6 space-y-4">
              <!-- Permission selector -->
              <div>
                <p class="text-xs font-semibold text-zinc-600 dark:text-zinc-400 font-body mb-2">{{ 'share.permessiAccesso' | translate }}</p>
                <div class="flex gap-2">
                  <button (click)="sharePermission.set('reader')"
                          [ngClass]="sharePermission() === 'reader'
                            ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/40 text-brand-700 dark:text-brand-300'
                            : 'border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:border-zinc-300'"
                          class="flex-1 flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all duration-200 font-body">
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                      <path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                    </svg>
                    <span class="text-[11px] font-semibold">Reader</span>
                    <span class="text-[10px] text-center leading-tight opacity-70">{{ 'share.soloLettura' | translate }}</span>
                  </button>
                  <button (click)="sharePermission.set('editor')"
                          [ngClass]="sharePermission() === 'editor'
                            ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/40 text-brand-700 dark:text-brand-300'
                            : 'border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:border-zinc-300'"
                          class="flex-1 flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all duration-200 font-body">
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                    </svg>
                    <span class="text-[11px] font-semibold">Editor</span>
                    <span class="text-[10px] text-center leading-tight opacity-70">{{ 'share.puoModificare' | translate }}</span>
                  </button>
                </div>
              </div>

              <!-- Generate / copy link -->
              @if (!linkGenerated()) {
                <button (click)="generateLink()"
                        class="w-full flex items-center justify-center gap-2 py-2.5 bg-brand-600 hover:bg-brand-500 text-white text-sm font-semibold rounded-xl transition-all duration-200 font-body">
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/>
                  </svg>
                  {{ 'share.generaLinkBtn' | translate }}
                </button>
              } @else {
                <div>
                  <p class="text-xs font-semibold text-zinc-600 dark:text-zinc-400 font-body mb-2">{{ 'share.linkGenerato' | translate }}</p>
                  <div class="flex gap-2">
                    <input type="text" [value]="shareLink()" readonly
                           class="flex-1 px-3 py-2 text-base bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl font-mono text-zinc-600 dark:text-zinc-400 focus:outline-none truncate"/>
                    <button (click)="copyLink()"
                            [ngClass]="linkCopied() ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700 hover:border-brand-300'"
                            class="flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold font-body transition-all duration-200 flex-shrink-0">
                      @if (linkCopied()) {
                        <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
                        </svg>
                        {{ 'share.copiato' | translate }}
                      } @else {
                        <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                        </svg>
                        {{ 'share.copia' | translate }}
                      }
                    </button>
                  </div>
                  <div class="mt-2 flex items-center gap-1.5">
                    <div [ngClass]="sharePermission() === 'editor' ? 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400'"
                         class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold font-body">
                      <div [ngClass]="sharePermission() === 'editor' ? 'bg-violet-500' : 'bg-zinc-400'" class="w-1.5 h-1.5 rounded-full"></div>
                      {{ sharePermission() === 'editor' ? ('share.accessoEditor' | translate) : ('share.accessoReader' | translate) }}
                    </div>
                    <button (click)="linkGenerated.set(false)" class="text-[10px] text-zinc-400 hover:text-zinc-600 font-body transition-colors">{{ 'share.rigenera' | translate }}</button>
                  </div>
                </div>
              }
            </div>
          }

          <!-- Tab: Email -->
          @if (shareTab() === 'email') {
            <div class="px-6 pb-6 space-y-4">
              <div>
                <label class="text-xs font-semibold text-zinc-600 dark:text-zinc-400 font-body mb-2 block">{{ 'share.indirizzoEmail' | translate }}</label>
                <input type="email" placeholder="nome@azienda.com"
                       [value]="shareEmailInput()"
                       (input)="shareEmailInput.set($any($event.target).value)"
                       class="w-full px-3 py-2.5 text-base bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl font-body text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 dark:focus:ring-brand-900/30 transition-all"/>
              </div>
              <!-- Permission selector -->
              <div>
                <p class="text-xs font-semibold text-zinc-600 dark:text-zinc-400 font-body mb-2">{{ 'share.permessi' | translate }}</p>
                <div class="flex gap-2">
                  <button (click)="shareEmailPermission.set('reader')"
                          [ngClass]="shareEmailPermission() === 'reader'
                            ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/40 text-brand-700 dark:text-brand-300'
                            : 'border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:border-zinc-300'"
                          class="flex-1 flex items-center justify-center gap-2 p-2.5 rounded-xl border-2 transition-all duration-200 font-body">
                    <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                      <path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                    </svg>
                    <span class="text-[11px] font-semibold">Reader</span>
                  </button>
                  <button (click)="shareEmailPermission.set('editor')"
                          [ngClass]="shareEmailPermission() === 'editor'
                            ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/40 text-brand-700 dark:text-brand-300'
                            : 'border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:border-zinc-300'"
                          class="flex-1 flex items-center justify-center gap-2 p-2.5 rounded-xl border-2 transition-all duration-200 font-body">
                    <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                    </svg>
                    <span class="text-[11px] font-semibold">Editor</span>
                  </button>
                </div>
              </div>
              <button (click)="sendShareEmail()"
                      [disabled]="!shareEmailInput()"
                      [ngClass]="emailSent()
                        ? 'bg-emerald-500 border-emerald-500 text-white'
                        : shareEmailInput()
                          ? 'bg-brand-600 hover:bg-brand-500 text-white border-brand-600'
                          : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-600 border-zinc-200 dark:border-zinc-700 cursor-not-allowed'"
                      class="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-xl border transition-all duration-200 font-body">
                @if (emailSent()) {
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
                  </svg>
                  {{ 'share.invitoInviato' | translate }}
                } @else {
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                  </svg>
                  {{ 'share.inviaInvito' | translate }}
                }
              </button>
            </div>
          }
        </div>
      </div>
    }
  `,
})
export class AppLayoutComponent implements OnInit, OnDestroy {
  readonly planService     = inject(BusinessPlanService);
  readonly themeService    = inject(ThemeService);
  readonly languageService = inject(LanguageService);
  readonly translate       = inject(TranslateService);

  sidebarOpen      = signal(false);
  sidebarCollapsed = signal(false);
  currentView      = signal<View>('panoramica');
  aiOpen           = signal(false);
  hasPlan          = signal(false);
  justSaved        = signal(false);
  justSavedRevision = signal(false);

  // ── Piani salvati: versioni ──────────────────────────────────────────────
  selectedPlanId      = signal<string | null>(null);
  editingVersionId    = signal<string | null>(null);
  editingVersionName  = signal('');
  colorPickerVersionId = signal<string | null>(null);

  readonly selectedPlan = computed(() => {
    const id = this.selectedPlanId();
    return id ? this.planService.savedPlans().find(p => p.id === id) ?? null : null;
  });

  readonly versionColors = [
    '#6366f1', '#10b981', '#f59e0b', '#f97316',
    '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16',
    '#ef4444', '#14b8a6',
  ];

  chatWidth             = signal(480);
  currentAiAgent        = signal<AgentId>('xeno');
  isLargeScreen         = signal(typeof window !== 'undefined' && window.innerWidth >= 1024);
  chatDesktopFullscreen = signal(false);
  langDropdownOpen      = signal(false);
  userPlan              = signal<'free' | 'pro' | 'max'>('max');

  // ── Panoramica chat landing ─────────────────────────────────────────────────
  panoramaInput           = signal('');
  panoramaSelectedAgent   = signal<AgentId | 'auto'>('auto');
  panoramaAgentPickerOpen = signal(false);

  panoramaGreeting = computed(() => {
    const h = new Date().getHours();
    if (h >= 5  && h < 12) return 'Buon mattino';
    if (h >= 12 && h < 18) return 'Buon pomeriggio';
    return 'Buona sera';
  });

  panoramaAgentDot = computed(() => {
    const dots: Record<string, string> = {
      auto: '#6366f1', xeno: '#a78bfa', elio: '#fbbf24', argon: '#60a5fa',
    };
    return dots[this.panoramaSelectedAgent()] ?? '#6366f1';
  });

  panoramaAgentName = computed(() => {
    const names: Record<string, string> = {
      auto: 'AUTO', xeno: 'XENO', elio: 'ELIO', argon: 'ARGON',
    };
    return names[this.panoramaSelectedAgent()] ?? 'AUTO';
  });

  panoramaAgents: { id: AgentId | 'auto'; name: string; role: string; dot: string }[] = [
    { id: 'auto',  name: 'AUTO',  role: 'Selezione automatica',    dot: '#6366f1' },
    { id: 'xeno',  name: 'XENO',  role: 'Strategia & Mercato',     dot: '#a78bfa' },
    { id: 'elio',  name: 'ELIO',  role: 'Proiezioni Finanziarie',  dot: '#fbbf24' },
    { id: 'argon', name: 'ARGON', role: 'Analisi & Rischi',        dot: '#60a5fa' },
  ];

  panoramaSuggestions: { icon: string; label: string; text: string }[] = [
    { icon: '📊', label: 'Scenario what-if',  text: 'Cosa succede se aumento il prezzo del 20%?' },
    { icon: '📈', label: 'Proiezioni',        text: 'Proietta il mio fatturato per i prossimi 3 anni' },
    { icon: '💸', label: 'Analisi costi',     text: 'Come riduco i costi operativi senza perdere qualità?' },
    { icon: '🌍', label: 'Nuovo mercato',     text: 'Lancio in un nuovo mercato con volume +30%, proietta' },
    { icon: '✨', label: 'Scelto da AI',      text: 'Analizza il mio business plan e suggerisci i miglioramenti principali' },
  ];

  // ── Inline chat state ───────────────────────────────────────────────────────
  panoramaMessages = signal<PanoramaMessage[]>([]);
  chatSessions     = signal<ChatSession[]>(this._loadChatSessions());
  activeChatId     = signal<string | null>(null);
  chatHistoryOpen  = signal(true);
  aiThinking       = signal(false);

  // ── Share dialog ────────────────────────────────────────────────────────────
  shareDialogOpen      = signal(false);
  shareTab             = signal<'link' | 'email'>('link');
  sharePermission      = signal<'editor' | 'reader'>('reader');
  shareEmailPermission = signal<'editor' | 'reader'>('reader');
  shareEmailInput      = signal('');
  shareLink            = signal('');
  linkGenerated        = signal(false);
  linkCopied           = signal(false);
  emailSent            = signal(false);

  // ── Settings: Contatti & FAQ ─────────────────────────────────────────────────
  contactName    = signal('');
  contactEmail   = signal('');
  contactSubject = signal('');
  contactMessage = signal('');
  contactSent    = signal(false);

  openFaqIndex = signal<number | null>(0);

  // ── Co-Work ─────────────────────────────────────────────────────────────────
  coworkEmailInput  = signal('');
  coworkRoleInput   = signal<'editor' | 'reader'>('editor');
  inviteLinkRole    = signal<'editor' | 'reader'>('editor');
  inviteLinkCopied  = signal(false);
  coworkMembers     = signal<CoworkMember[]>([
    { id: 'demo1', name: 'Marco Rossi',      email: 'marco.rossi@startup.io',      role: 'editor', status: 'joined',  avatarColor: 'linear-gradient(135deg, #6366f1, #8b5cf6)', initials: 'MR' },
    { id: 'demo2', name: 'Anna Lucci',       email: 'anna.lucci@venture.com',       role: 'reader', status: 'joined',  avatarColor: 'linear-gradient(135deg, #f59e0b, #f97316)', initials: 'AL' },
    { id: 'demo3', name: '',                 email: 'giuseppe.ferrari@gmail.com',   role: 'editor', status: 'pending', avatarColor: 'linear-gradient(135deg, #10b981, #06b6d4)', initials: 'GF' },
    { id: 'demo4', name: '',                 email: 'sara.bianchi@fintech.it',      role: 'reader', status: 'pending', avatarColor: 'linear-gradient(135deg, #ef4444, #ec4899)', initials: 'SB' },
  ]);

  readonly coworkJoinedCount  = computed(() => this.coworkMembers().filter(m => m.status === 'joined').length);
  readonly coworkPendingCount = computed(() => this.coworkMembers().filter(m => m.status === 'pending').length);

  hoveredCoworkNode = signal<(CoworkMember & { orbitRadius: number; orbitDuration: number; initialAngle: number; x0: number; y0: number }) | null>(null);
  coworkTooltipX    = signal(0);
  coworkTooltipY    = signal(0);

  readonly orbitalNodes = computed(() => {
    const members = this.coworkMembers();
    const orbits = [
      { r: 145, dur: 32 },
      { r: 248, dur: 54 },
      { r: 340, dur: 78 },
    ];
    const assign = (i: number) => i < 2 ? 0 : i < 5 ? 1 : 2;
    return members.map((m, i) => {
      const orbitIdx = assign(i);
      const orbit   = orbits[Math.min(orbitIdx, 2)];
      const peers   = members.filter((_, j) => assign(j) === orbitIdx);
      const pos     = peers.findIndex(p => p.id === m.id);
      const initialAngle = (pos / Math.max(peers.length, 1)) * Math.PI * 2;
      const x0 = +(350 + orbit.r * Math.cos(initialAngle)).toFixed(2);
      const y0 = +(350 + orbit.r * Math.sin(initialAngle)).toFixed(2);
      return { ...m, orbitRadius: orbit.r, orbitDuration: orbit.dur, initialAngle, x0, y0 };
    });
  });

  trackOrbitNode = (_: number, n: { id: string }) => n.id;

  @ViewChildren('orbitNodeG') private _orbitNodeEls!: QueryList<ElementRef<SVGGElement>>;
  @ViewChildren('orbitLine')  private _orbitLineEls!: QueryList<ElementRef<SVGLineElement>>;
  private _zone   = inject(NgZone);
  private _rafId  = 0;
  private _animT0 = 0;

  demoCollaborators = [
    { initials: 'MR', color: 'linear-gradient(135deg, #6366f1, #8b5cf6)', name: 'Marco Rossi',      role: 'editor' },
    { initials: 'AL', color: 'linear-gradient(135deg, #f59e0b, #f97316)', name: 'Anna Lucci',       role: 'reader' },
    { initials: 'GF', color: 'linear-gradient(135deg, #10b981, #06b6d4)', name: 'Giuseppe Ferrari', role: 'editor' },
  ];

  coworkCommentTexts = [
    'EBITDA +12%',
    'Budget Q3 ↑',
    '+2 persone',
    'Prezzo 59€',
    'Costi -20%',
    'KPI aggiornati',
  ];

  private _avatarColors = [
    'linear-gradient(135deg, #6366f1, #8b5cf6)',
    'linear-gradient(135deg, #f59e0b, #f97316)',
    'linear-gradient(135deg, #10b981, #06b6d4)',
    'linear-gradient(135deg, #ef4444, #ec4899)',
    'linear-gradient(135deg, #3b82f6, #6366f1)',
  ];

  @HostBinding('class.resizing') private _resizing = false;
  private _resizeStartX = 0;
  private _resizeStartW = 0;

  navItems: NavItem[] = [
    {
      id: 'panoramica', view: 'panoramica', label: 'nav.chat',
      svgPath: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
    },
    {
      id: 'piani-salvati', view: 'piani-salvati', label: 'nav.pianiSalvati',
      svgPath: 'M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8l1 12h12l1-12',
    },
    {
      id: 'co-work', view: 'co-work', label: 'nav.coWork',
      svgPath: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
    },
    {
      id: 'caricamenti', view: 'caricamenti', label: 'nav.caricamenti',
      svgPath: 'M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5',
    },
    {
      id: 'scenari', view: 'scenari', label: 'nav.scenariLabel',
      svgPath: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z',
    },
    {
      id: 'report', view: 'report', label: 'nav.report',
      svgPath: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
    },
    {
      id: 'impostazioni', view: 'impostazioni', label: 'nav.impostazioni',
      svgPath: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z',
    },
  ];

  scenariExamples = [
    {
      iconPath: 'M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
      iconBg: 'bg-blue-50 dark:bg-blue-900/30', iconColor: 'text-blue-500 dark:text-blue-400',
      titleKey: 'scenari.variazionePrezzo',
      qKey: 'scenari.variazionePrezzo_q',
    },
    {
      iconPath: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z',
      iconBg: 'bg-violet-50 dark:bg-violet-900/30', iconColor: 'text-violet-500 dark:text-violet-400',
      titleKey: 'scenari.espansioneTeam',
      qKey: 'scenari.espansioneTeam_q',
    },
    {
      iconPath: 'M13 17h8m0 0V9m0 8l-8-8-4 4-6-6',
      iconBg: 'bg-emerald-50 dark:bg-emerald-900/30', iconColor: 'text-emerald-500 dark:text-emerald-400',
      titleKey: 'scenari.riduzioneCosti',
      qKey: 'scenari.riduzioneCosti_q',
    },
    {
      iconPath: 'M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
      iconBg: 'bg-amber-50 dark:bg-amber-900/30', iconColor: 'text-amber-500 dark:text-amber-400',
      titleKey: 'scenari.nuovoMercato',
      qKey: 'scenari.nuovoMercato_q',
    },
  ];

  settingSections: { label: string; items: SettingItem[] }[] = [
    {
      label: 'settings.sections.progetto.label',
      items: [
        { key: 'notify',   label: 'settings.sections.progetto.notifiche.label', desc: 'settings.sections.progetto.notifiche.desc', enabled: true },
        { key: 'autosave', label: 'settings.sections.progetto.autosave.label',  desc: 'settings.sections.progetto.autosave.desc',  enabled: true },
      ]
    },
    {
      label: 'settings.sections.visualizzazione.label',
      items: [
        { key: 'currency', label: 'settings.sections.visualizzazione.currency.label', desc: 'settings.sections.visualizzazione.currency.desc', enabled: false },
        { key: 'dark',     label: 'settings.sections.visualizzazione.dark.label',     desc: 'settings.sections.visualizzazione.dark.desc',     enabled: false },
      ]
    }
  ];

  contactEmails: { labelKey: string; address: string }[] = [
    { labelKey: 'settings.sections.contatti.canali.supporto', address: 'supporto@airplan.io' },
    { labelKey: 'settings.sections.contatti.canali.vendite',  address: 'vendite@airplan.io' },
    { labelKey: 'settings.sections.contatti.canali.stampa',   address: 'stampa@airplan.io' },
  ];

  faqItems: { qKey: string; aKey: string }[] = [
    { qKey: 'settings.sections.faq.items.businessPlan.q', aKey: 'settings.sections.faq.items.businessPlan.a' },
    { qKey: 'settings.sections.faq.items.aiCopilot.q',    aKey: 'settings.sections.faq.items.aiCopilot.a' },
    { qKey: 'settings.sections.faq.items.datiSalvati.q',  aKey: 'settings.sections.faq.items.datiSalvati.a' },
    { qKey: 'settings.sections.faq.items.coWork.q',       aKey: 'settings.sections.faq.items.coWork.a' },
    { qKey: 'settings.sections.faq.items.exportPdf.q',    aKey: 'settings.sections.faq.items.exportPdf.a' },
    { qKey: 'settings.sections.faq.items.importazione.q', aKey: 'settings.sections.faq.items.importazione.a' },
  ];

  ngOnInit(): void {
    const darkItem = this.settingSections
      .flatMap(s => s.items)
      .find(i => i.key === 'dark');
    if (darkItem) darkItem.enabled = this.themeService.dark();
  }

  ngOnDestroy(): void {
    if (this._rafId) cancelAnimationFrame(this._rafId);
  }

  constructor() {
    // Drive the orbital animation via RAF only when the Co-Work view is mounted.
    // Direct DOM transform updates outside Angular zone = no CD churn, smooth 60fps.
    effect((onCleanup) => {
      const view = this.currentView();
      // touch orbitalNodes() so we restart RAF when members change
      const nodes = this.orbitalNodes();
      if (this._rafId) { cancelAnimationFrame(this._rafId); this._rafId = 0; }
      if (view !== 'co-work' || nodes.length === 0) return;

      const reduced = typeof window !== 'undefined'
        && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
      if (reduced) return; // keep static initial positions from template

      this._zone.runOutsideAngular(() => {
        this._animT0 = 0;
        const tick = (t: number) => {
          if (!this._animT0) this._animT0 = t;
          const elapsed = (t - this._animT0) / 1000;
          const ns  = this.orbitalNodes();
          const gs  = this._orbitNodeEls?.toArray() ?? [];
          const lns = this._orbitLineEls?.toArray() ?? [];
          for (let i = 0; i < ns.length; i++) {
            const n = ns[i];
            const omega = (Math.PI * 2) / n.orbitDuration;
            // gentle radial breath: ±2.5px sinus, phase per node
            const bob = Math.sin(elapsed * 0.55 + i * 1.7) * 2.5;
            const r = n.orbitRadius + bob;
            const angle = n.initialAngle + omega * elapsed;
            const x = 350 + r * Math.cos(angle);
            const y = 350 + r * Math.sin(angle);
            const g  = gs[i]?.nativeElement;
            const ln = lns[i]?.nativeElement;
            if (g)  g.setAttribute('transform', `translate(${x.toFixed(2)},${y.toFixed(2)})`);
            if (ln) { ln.setAttribute('x2', x.toFixed(2)); ln.setAttribute('y2', y.toFixed(2)); }
          }
          this._rafId = requestAnimationFrame(tick);
        };
        this._rafId = requestAnimationFrame(tick);
      });

      onCleanup(() => {
        if (this._rafId) { cancelAnimationFrame(this._rafId); this._rafId = 0; }
      });
    });
  }

  // ── Tutorial steps (reactive to hasPlan) ────────────────────────────────────

  readonly tutorialSteps = computed(() => {
    // depend on language signal so steps re-compute on language change
    this.languageService.currentLang();
    return [
    {
      num: '01',
      title: this.translate.instant('tutorial.step1.title'),
      desc:  this.translate.instant('tutorial.step1.desc'),
      cta:   this.translate.instant('tutorial.step1.cta'),
      iconPath: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01',
      iconBg:    'bg-brand-50 dark:bg-brand-900/30',
      iconColor: 'text-brand-500 dark:text-brand-400',
      targetView: 'wizard' as View,
      done: this.hasPlan(),
    },
    {
      num: '02',
      title: this.translate.instant('tutorial.step2.title'),
      desc:  this.translate.instant('tutorial.step2.desc'),
      cta:   this.translate.instant('tutorial.step2.cta'),
      iconPath: 'M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z',
      iconBg:    'bg-violet-50 dark:bg-violet-900/30',
      iconColor: 'text-violet-500 dark:text-violet-400',
      targetView: 'dashboard' as View,
      done: false,
    },
    {
      num: '03',
      title: this.translate.instant('tutorial.step3.title'),
      desc:  this.translate.instant('tutorial.step3.desc'),
      cta:   this.translate.instant('tutorial.step3.cta'),
      iconPath: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z',
      iconBg:    'bg-emerald-50 dark:bg-emerald-900/30',
      iconColor: 'text-emerald-500 dark:text-emerald-400',
      targetView: 'scenari' as View,
      done: false,
    },
    {
      num: '04',
      title: this.translate.instant('tutorial.step4.title'),
      desc:  this.translate.instant('tutorial.step4.desc'),
      cta:   this.translate.instant('tutorial.step4.cta'),
      iconPath: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
      iconBg:    'bg-amber-50 dark:bg-amber-900/30',
      iconColor: 'text-amber-500 dark:text-amber-400',
      targetView: 'report' as View,
      done: false,
    },
    ];
  });

  // ── Computed ────────────────────────────────────────────────────────────────

  readonly projectDisplayName = computed(() => {
    this.languageService.currentLang(); // reactive on language change
    return this.planService.currentProjectName() || this.translate.instant('sidebar.myProject');
  });

  readonly projectInitial = computed(() =>
    (this.planService.currentProjectName() || 'P').charAt(0).toUpperCase()
  );

  readonly liveKpis = computed(() => {
    this.languageService.currentLang(); // reactive on language change
    const k = this.planService.kpi();
    const fmt = (v: number) => {
      const abs = Math.abs(v);
      const s   = v < 0 ? '-' : '';
      if (abs >= 1_000_000) return `${s}€${(abs / 1_000_000).toFixed(1)}M`;
      if (abs >= 1_000)     return `${s}€${Math.round(abs / 1000)}K`;
      return `${s}€${abs}`;
    };
    return [
      { label: this.translate.instant('kpi.fatturatoY1'), value: fmt(k.fatturatoTotale) },
      { label: this.translate.instant('kpi.ebitdaY1'),    value: fmt(k.ebitda) },
      { label: this.translate.instant('kpi.utileNetto'),  value: fmt(k.utileNetto) },
      { label: this.translate.instant('kpi.cashRunway'),  value: `${k.cashRunway} ${this.translate.instant('kpi.mesi')}` },
    ];
  });

  readonly currentTitle = computed(() => {
    this.languageService.currentLang(); // reactive on language change
    const map: Record<View, string> = {
      panoramica:      'views.chat',
      wizard:          'views.wizard',
      dashboard:       'views.dashboard',
      scenari:         'views.scenari',
      report:          'views.report',
      impostazioni:    'views.impostazioni',
      'piani-salvati': 'views.pianiSalvati',
      'co-work':       'views.coWork',
      profilo:         'views.profilo',
      caricamenti:     'views.caricamenti',
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
    const planId = this.planService.currentPlanId();
    if (planId) {
      this.planService.autoSaveDraft(planId);
    } else {
      this.planService.savePlan();
    }
    this.justSaved.set(true);
    setTimeout(() => this.justSaved.set(false), 2200);
  }

  onSaveRevision(): void {
    this.planService.saveRevision();
    this.justSavedRevision.set(true);
    setTimeout(() => this.justSavedRevision.set(false), 2200);
  }

  loadAndNavigate(plan: SavedPlan): void {
    this.planService.loadPlan(plan);
    this.hasPlan.set(true);
    this.currentView.set('dashboard');
  }

  loadVersionAndNavigate(version: PlanVersion, planId: string): void {
    this.planService.loadVersion(version, planId);
    this.hasPlan.set(true);
    this.currentView.set('dashboard');
  }

  startEditVersionName(version: PlanVersion): void {
    this.editingVersionId.set(version.id);
    this.editingVersionName.set(version.name);
  }

  commitVersionName(planId: string, versionId: string): void {
    const name = this.editingVersionName().trim();
    if (name) this.planService.updateVersionName(planId, versionId, name);
    this.editingVersionId.set(null);
  }

  selectVersionColor(planId: string, versionId: string, color: string): void {
    this.planService.updateVersionColor(planId, versionId, color);
    this.colorPickerVersionId.set(null);
  }

  sendVersionToAi(version: PlanVersion, planId: string): void {
    this.loadVersionAndNavigate(version, planId);
    this.aiOpen.set(true);
  }

  countVersionsByStatus(plan: SavedPlan, status: 'bozza' | 'definitivo'): number {
    return plan.versions.filter(v => v.status === status).length;
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
    // Auto-create a draft plan entry if none active
    if (!this.planService.currentPlanId()) {
      const name = this.planService.currentProjectName() || 'Business Plan';
      this.planService.createDraftPlan(name);
    } else {
      this.planService.autoSaveDraft(this.planService.currentPlanId()!);
    }
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

  submitContactForm(): void {
    if (!this.contactEmail().trim() || !this.contactMessage().trim() || this.contactSent()) return;
    this.contactSent.set(true);
    setTimeout(() => {
      this.contactSent.set(false);
      this.contactName.set('');
      this.contactEmail.set('');
      this.contactSubject.set('');
      this.contactMessage.set('');
    }, 3200);
  }

  toggleFaq(index: number): void {
    this.openFaqIndex.update(curr => curr === index ? null : index);
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

  openAiWithScenario(_q: string, agentId: AgentId = 'xeno'): void {
    this.currentAiAgent.set(agentId);
    this.aiOpen.set(true);
  }

  onPanoramaSubmit(): void {
    const q = this.panoramaInput().trim();
    if (!q || this.aiThinking()) return;
    const sel     = this.panoramaSelectedAgent();
    const agentId = (sel === 'auto' ? 'xeno' : sel) as AgentId;

    if (this.panoramaMessages().length === 0) {
      this.activeChatId.set(Date.now().toString());
    }

    this.panoramaMessages.update(msgs => [...msgs, { role: 'user', text: q, agent: agentId, ts: Date.now() }]);
    this.panoramaInput.set('');
    this.panoramaAgentPickerOpen.set(false);
    this.aiThinking.set(true);
    this._scrollPanoramaToBottom();

    setTimeout(() => {
      this.aiThinking.set(false);
      this.panoramaMessages.update(msgs => [...msgs, {
        role: 'assistant',
        text: `Analisi in corso con ${agentId.toUpperCase()}. Collega il tuo piano finanziario per ricevere risposte personalizzate basate sui dati reali del tuo progetto.`,
        agent: agentId,
        ts: Date.now(),
      }]);
      this._saveChatSession();
      this._scrollPanoramaToBottom();
    }, 1400);
  }

  onPanoramaKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.onPanoramaSubmit();
    }
  }

  onPanoramaSuggestion(text: string): void {
    this.panoramaInput.set(text);
  }

  newPanoramaChat(): void {
    this.panoramaMessages.set([]);
    this.activeChatId.set(null);
    this.aiThinking.set(false);
  }

  loadChatSession(id: string): void {
    const session = this.chatSessions().find(s => s.id === id);
    if (!session) return;
    this.panoramaMessages.set(session.messages);
    this.activeChatId.set(id);
    setTimeout(() => this._scrollPanoramaToBottom(), 50);
  }

  deleteChatSession(id: string, event: Event): void {
    event.stopPropagation();
    this.chatSessions.update(s => s.filter(x => x.id !== id));
    this._persistChatSessions();
    if (this.activeChatId() === id) this.newPanoramaChat();
  }

  formatSessionDate(ts: number): string {
    const d    = new Date(ts);
    const diff = Date.now() - ts;
    if (diff < 86_400_000)  return d.toLocaleTimeString('it', { hour: '2-digit', minute: '2-digit' });
    if (diff < 604_800_000) return d.toLocaleDateString('it', { weekday: 'short' });
    return d.toLocaleDateString('it', { day: '2-digit', month: 'short' });
  }

  private _saveChatSession(): void {
    const id   = this.activeChatId();
    const msgs = this.panoramaMessages();
    if (!id || msgs.length === 0) return;
    const first = msgs[0].text;
    const title = first.length > 42 ? first.slice(0, 42) + '…' : first;
    const session: ChatSession = { id, title, messages: msgs, ts: Date.now() };
    this.chatSessions.update(sessions => {
      const idx = sessions.findIndex(s => s.id === id);
      if (idx >= 0) { const updated = [...sessions]; updated[idx] = session; return updated; }
      return [session, ...sessions];
    });
    this._persistChatSessions();
  }

  private _persistChatSessions(): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('panorama_chat_sessions', JSON.stringify(this.chatSessions()));
    }
  }

  private _loadChatSessions(): ChatSession[] {
    if (typeof localStorage === 'undefined') return [];
    try { return JSON.parse(localStorage.getItem('panorama_chat_sessions') ?? '[]'); }
    catch { return []; }
  }

  private _scrollPanoramaToBottom(): void {
    setTimeout(() => {
      const el = document.getElementById('panoramaMessages');
      if (el) el.scrollTop = el.scrollHeight;
    }, 30);
  }

  exportPdf(): void {
    const prevView = this.currentView();
    this.currentView.set('report');
    setTimeout(() => {
      window.print();
      this.currentView.set(prevView);
    }, 400);
  }

  // ── Share dialog ─────────────────────────────────────────────────────────────
  openShareDialog(): void {
    this.shareDialogOpen.set(true);
    this.linkGenerated.set(false);
    this.linkCopied.set(false);
    this.emailSent.set(false);
    this.shareEmailInput.set('');
  }

  closeShareDialog(): void {
    this.shareDialogOpen.set(false);
  }

  generateLink(): void {
    const perm = this.sharePermission();
    const id   = Math.random().toString(36).slice(2, 10);
    this.shareLink.set(`https://app.airplan.io/shared/${id}?role=${perm}`);
    this.linkGenerated.set(true);
  }

  copyLink(): void {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(this.shareLink()).catch(() => {});
    }
    this.linkCopied.set(true);
    setTimeout(() => this.linkCopied.set(false), 2000);
  }

  sendShareEmail(): void {
    if (!this.shareEmailInput()) return;
    this.emailSent.set(true);
    setTimeout(() => {
      this.emailSent.set(false);
      this.shareEmailInput.set('');
    }, 2200);
  }

  // ── Co-Work ──────────────────────────────────────────────────────────────────
  addCoworkMember(): void {
    const email = this.coworkEmailInput().trim();
    if (!email) return;
    const existing = this.coworkMembers().find(m => m.email === email);
    if (existing) { this.coworkEmailInput.set(''); return; }
    const parts    = email.split('@')[0].split(/[._-]/);
    const initials = parts.length >= 2
      ? (parts[0][0] + parts[1][0]).toUpperCase()
      : email.slice(0, 2).toUpperCase();
    const color    = this._avatarColors[this.coworkMembers().length % this._avatarColors.length];
    const member: CoworkMember = {
      id:          Math.random().toString(36).slice(2),
      name:        '',
      email,
      role:        this.coworkRoleInput(),
      status:      'pending',
      avatarColor: color,
      initials,
    };
    this.coworkMembers.update(list => [...list, member]);
    this.coworkEmailInput.set('');
  }

  acceptMember(id: string): void {
    this.coworkMembers.update(list =>
      list.map(m => m.id === id ? { ...m, status: 'joined' as const } : m)
    );
  }

  removeCoworkMember(id: string): void {
    this.coworkMembers.update(list => list.filter(m => m.id !== id));
  }

  generateInviteLink(): void {
    const role = this.inviteLinkRole();
    const id   = Math.random().toString(36).slice(2, 10);
    const link = `https://app.airplan.io/invite/${id}?role=${role}`;
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(link).catch(() => {});
    }
    this.inviteLinkCopied.set(true);
    setTimeout(() => this.inviteLinkCopied.set(false), 2000);
  }

  onCoworkMouseMove(event: MouseEvent): void {
    const tipW = 224;
    const x = event.clientX + 16;
    this.coworkTooltipX.set(x + tipW > window.innerWidth ? event.clientX - tipW - 8 : x);
    this.coworkTooltipY.set(Math.max(event.clientY - 92, 8));
  }
}
