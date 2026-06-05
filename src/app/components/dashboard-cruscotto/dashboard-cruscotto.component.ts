import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { trigger, transition, style, animate } from '@angular/animations';
import { NgApexchartsModule } from 'ng-apexcharts';
import { BusinessPlanService, IncomeRow } from '../../services/business-plan.service';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-dashboard-cruscotto',
  standalone: true,
  host: { class: 'flex flex-col h-full overflow-hidden' },
  imports: [CommonModule, NgClass, FormsModule, NgApexchartsModule],
  animations: [
    trigger('drawerSlide', [
      transition(':enter', [
        style({ transform: 'translateX(100%)' }),
        animate('320ms cubic-bezier(0.16, 1, 0.3, 1)', style({ transform: 'translateX(0)' }))
      ]),
      transition(':leave', [
        animate('240ms ease-in', style({ transform: 'translateX(100%)' }))
      ])
    ]),
    trigger('backdropFade', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('220ms ease', style({ opacity: 1 }))
      ]),
      transition(':leave', [
        animate('200ms ease', style({ opacity: 0 }))
      ])
    ])
  ],
  styles: [`
    .cell-editable { cursor: text; }
    .cell-editable:hover { background: rgba(99,102,241,0.04); }

    @keyframes cellSaved {
      0%   { background: rgba(99,102,241,0.12); }
      100% { background: transparent; }
    }
    .cell-flash { animation: cellSaved 0.6s ease-out; }

    .label-clickable {
      cursor: pointer;
      transition: color 0.15s;
    }
    .label-clickable:hover { color: #4f46e5; }
    .label-clickable:hover .label-expand-icon { opacity: 1; }
    .label-expand-icon {
      opacity: 0;
      transition: opacity 0.15s;
    }

    .year-input {
      background: transparent;
      border: none;
      outline: none;
      text-align: right;
      font-family: 'JetBrains Mono', 'Fira Mono', monospace;
      width: 100%;
      font-size: 1.35rem;
      font-weight: 700;
      padding: 0;
      line-height: 1.2;
    }
    .year-input:focus { color: #4f46e5; }
    .year-input::placeholder { color: #d1d5db; }

    .bar-segment {
      transition: width 0.5s cubic-bezier(0.16,1,0.3,1);
    }

    /* ApexCharts overrides for minimal premium look */
    :host ::ng-deep .apexcharts-toolbar       { display: none !important; }
    :host ::ng-deep .apexcharts-legend         { display: none !important; }
    :host ::ng-deep .apexcharts-tooltip {
      border-radius: 12px !important;
      border: 1px solid #f0f0f0 !important;
      box-shadow: 0 8px 24px -4px rgba(0,0,0,0.10) !important;
      font-family: 'Outfit', sans-serif !important;
    }
    :host ::ng-deep .apexcharts-tooltip-title {
      background: #f9fafb !important;
      border-bottom: 1px solid #f0f0f0 !important;
      font-family: 'Outfit', sans-serif !important;
      font-size: 11px !important;
      color: #71717a !important;
    }
    :host ::ng-deep .apexcharts-tooltip-y-group {
      font-family: 'JetBrains Mono', monospace !important;
      font-size: 13px !important;
      font-weight: 600 !important;
    }
    :host ::ng-deep .apexcharts-svg { overflow: visible; }

    /* ── Dark mode ────────────────────────────────────────────────────────── */
    :host-context(.dark) .cell-editable:hover { background: rgba(99,102,241,0.08); }

    :host-context(.dark) ::ng-deep .apexcharts-tooltip {
      background: #18181b !important;
      border-color: #3f3f46 !important;
      box-shadow: 0 8px 24px -4px rgba(0,0,0,0.5) !important;
    }
    :host-context(.dark) ::ng-deep .apexcharts-tooltip-title {
      background: #27272a !important;
      border-bottom-color: #3f3f46 !important;
      color: #a1a1aa !important;
    }
    :host-context(.dark) ::ng-deep .apexcharts-tooltip-y-group { color: #f4f4f5 !important; }

    :host-context(.dark) .year-input { color: #f4f4f5; }
    :host-context(.dark) .year-input:focus { color: #818cf8; }
    :host-context(.dark) .year-input::placeholder { color: #52525b; }
  `],
  template: `
    <div class="flex flex-col h-full overflow-y-auto scrollbar-thin">

      <!-- ═══ PAGE HEADER ═══ -->
      <div class="animate-fade-in px-4 md:px-8 pt-5 md:pt-7 pb-4 border-b border-zinc-100 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-3 flex-shrink-0">
        <div>
          <p class="text-[10px] font-semibold text-brand-500 uppercase tracking-[0.18em] mb-1 font-body">Panoramica</p>
          <h1 class="text-xl md:text-2xl font-bold text-zinc-900 dark:text-zinc-100 font-display tracking-tight">Business Plan 2025–2027</h1>
        </div>
        @if (planService.isAiUpdated()) {
          <div class="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 rounded-full border border-emerald-200 animate-fade-in">
            <span class="relative flex h-2 w-2 flex-shrink-0">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span class="text-xs font-medium text-emerald-700 font-body whitespace-nowrap">Aggiornato dall'AI</span>
          </div>
        }
      </div>

      <!-- ═══ MAIN CONTENT ═══ -->
      <div class="flex-1 px-4 md:px-8 py-5 md:py-6 space-y-4 md:space-y-5 min-w-0">

        <!-- KPI Cards — 2 col on mobile, 4 on xl -->
        <div class="grid grid-cols-2 xl:grid-cols-4 gap-3">
          @for (kpi of kpiCards(); track kpi.id; let i = $index) {
            <div
              class="animate-kpi-in bg-white dark:bg-zinc-900 rounded-2xl border shadow-card
                     hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-300
                     p-4 md:p-5 flex flex-col gap-3 min-w-0 relative overflow-hidden"
              [ngClass]="planService.isAiUpdated() ? 'border-emerald-200 dark:border-emerald-800 ring-1 ring-emerald-100 dark:ring-emerald-900/40' : 'border-zinc-100 dark:border-zinc-800'"
              [style.animation-delay]="(i * 65) + 'ms'">

              <!-- Colored accent bar at top -->
              <div class="absolute top-0 left-0 right-0 h-[3px]" [ngClass]="kpi.accentFill"></div>

              <!-- Icon + delta row -->
              <div class="flex items-start justify-between gap-2 mt-1">
                <div class="w-9 h-9 flex-shrink-0 rounded-xl flex items-center justify-center" [ngClass]="kpi.iconBg">
                  <svg class="w-5 h-5" [ngClass]="kpi.iconColor"
                       fill="none" stroke="currentColor" stroke-width="1.5"
                       viewBox="0 0 24 24" aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round" [attr.d]="kpi.iconPath"/>
                  </svg>
                </div>
                @if (planService.isAiUpdated() && kpi.delta) {
                  <span class="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full animate-fade-in whitespace-nowrap flex-shrink-0">
                    {{ kpi.delta }}
                  </span>
                }
              </div>

              <!-- Label + Value -->
              <div class="min-w-0">
                <p class="text-[11px] text-zinc-400 dark:text-zinc-500 font-medium font-body truncate mb-0.5">{{ kpi.label }}</p>
                <p class="text-xl md:text-[1.6rem] font-bold font-mono number-highlight truncate leading-tight transition-colors duration-500"
                   [ngClass]="planService.isAiUpdated() ? 'text-emerald-600' : 'text-zinc-900 dark:text-zinc-100'">
                  {{ kpi.value }}
                </p>
              </div>
            </div>
          }
        </div>

        <!-- ═══ CASH FLOW CHART ═══ -->
        <div class="animate-slide-up bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-card p-4 md:p-6"
             style="animation-delay: 280ms">
          <!-- Chart header -->
          <div class="flex flex-wrap items-start justify-between gap-2 mb-2">
            <div>
              <h3 class="text-sm font-semibold text-zinc-800 dark:text-zinc-200 font-display">Flusso di Cassa</h3>
              <p class="text-[11px] text-zinc-400 dark:text-zinc-500 font-body mt-0.5">Proiezione mensile — Anno 1</p>
            </div>
            <div class="flex items-center gap-4 text-[11px] text-zinc-400 dark:text-zinc-500 font-body">
              <div class="flex items-center gap-1.5">
                <div class="w-3 h-0.5 rounded-full transition-colors duration-500"
                     [ngClass]="planService.isAiUpdated() ? 'bg-emerald-500' : 'bg-brand-500'"></div>
                <span>Cash Flow</span>
              </div>
              <div class="flex items-center gap-1.5">
                <div class="w-3 h-px border-t border-dashed border-zinc-300"></div>
                <span>Break-even</span>
              </div>
            </div>
          </div>

          <!-- ApexCharts area chart -->
          <apx-chart
            [series]="apexSeries()"
            [chart]="apexChartConfig"
            [xaxis]="apexXaxis()"
            [yaxis]="apexYaxis"
            [stroke]="apexStroke"
            [fill]="apexFill"
            [colors]="apexColors()"
            [grid]="apexGrid()"
            [markers]="apexMarkers"
            [tooltip]="apexTooltip"
            [responsive]="apexResponsive"
          ></apx-chart>
        </div>

        <!-- ═══ INCOME STATEMENT TABLE ═══ -->
        <div class="animate-slide-up bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-card overflow-hidden"
             style="animation-delay: 380ms">
          <!-- Table header -->
          <div class="px-4 md:px-6 py-3 md:py-4 border-b border-zinc-100 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 class="text-sm font-semibold text-zinc-800 dark:text-zinc-200 font-display">Conto Economico Sintetico</h3>
              <p class="text-[11px] text-zinc-400 dark:text-zinc-500 font-body mt-0.5">Proiezione triennale</p>
            </div>
            <div class="hidden sm:flex items-center gap-4 text-[10px] text-zinc-400 dark:text-zinc-500 font-body">
              <div class="flex items-center gap-1">
                <svg class="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24"
                     stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round"
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                </svg>
                <span>Clicca voce per dettaglio</span>
              </div>
              <div class="flex items-center gap-1">
                <svg class="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24"
                     stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round"
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                </svg>
                <span>Clicca cella per modificare</span>
              </div>
            </div>
          </div>

          <!-- Scrollable table with right-fade on mobile -->
          <div class="relative overflow-x-auto">
            <div class="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white dark:from-zinc-900 to-transparent pointer-events-none z-10 md:hidden"></div>
            <table class="w-full border-collapse min-w-[440px]">
              <thead>
                <tr>
                  <th class="text-left px-4 md:px-6 py-3 text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest font-body bg-zinc-50/80 dark:bg-zinc-800/60 border-b border-zinc-100 dark:border-zinc-700 whitespace-nowrap">
                    Voce
                  </th>
                  <th class="text-right px-4 py-3 text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest font-body bg-zinc-50/80 dark:bg-zinc-800/60 border-b border-zinc-100 dark:border-zinc-700 whitespace-nowrap">
                    Anno 1
                  </th>
                  <th class="text-right px-4 py-3 text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest font-body bg-zinc-50/80 dark:bg-zinc-800/60 border-b border-zinc-100 dark:border-zinc-700 whitespace-nowrap">
                    Anno 2
                  </th>
                  <th class="text-right px-4 md:px-6 py-3 text-[10px] font-semibold text-zinc-500 uppercase tracking-widest font-body bg-zinc-50/80 border-b border-zinc-100 whitespace-nowrap">
                    Anno 3
                  </th>
                </tr>
              </thead>
              <tbody>
                @for (row of planService.incomeStatement(); track row.label; let ri = $index) {
                  <tr [ngClass]="row.isHighlight
                    ? 'bg-brand-50/50 dark:bg-brand-950/20 border-b border-zinc-100 dark:border-zinc-800'
                    : 'bg-white dark:bg-zinc-900 border-b border-zinc-50 dark:border-zinc-800/50 hover:bg-zinc-50/60 dark:hover:bg-zinc-800/40 transition-colors duration-150'">

                    <!-- Label — clickable -->
                    <td [ngClass]="[
                        'px-4 md:px-6 py-0 text-sm font-body',
                        row.isHighlight ? 'font-semibold text-zinc-800 dark:text-zinc-200' : 'text-zinc-600 dark:text-zinc-400'
                      ]">
                      <button
                        class="label-clickable flex items-center gap-1.5 text-left w-full"
                        [ngClass]="!row.isHighlight ? 'pl-4' : ''"
                        [class.font-semibold]="row.isHighlight"
                        (click)="openRowDetail(row)">
                        @if (!row.isHighlight) {
                          <span class="text-zinc-200 text-xs flex-shrink-0">—</span>
                        }
                        <span class="truncate max-w-[160px] md:max-w-none">{{ row.label }}</span>
                        @if (!planService.isEditableRow(row.label)) {
                          <span class="text-zinc-300 text-[10px] font-normal flex-shrink-0">calc.</span>
                        }
                        <svg class="label-expand-icon w-3.5 h-3.5 text-brand-400 ml-auto flex-shrink-0"
                             fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/>
                        </svg>
                      </button>
                    </td>

                    <!-- Anno 1 -->
                    <td [ngClass]="[
                        'px-4 py-0 text-right text-sm font-mono transition-all duration-300',
                        row.isHighlight ? 'font-semibold' : '',
                        (row.isCost || row.anno1 < 0) ? 'text-rose-500' : 'text-zinc-800 dark:text-zinc-200',
                        planService.isEditableRow(row.label) ? 'cell-editable' : 'opacity-60'
                      ]"
                      (click)="startEdit(row.label, 'anno1')">
                      @if (isEditing(row.label, 'anno1')) {
                        <input type="number" [value]="row.anno1" autofocus
                               class="w-full text-right bg-transparent font-mono text-sm py-3 px-3 outline-none border-b-2 border-brand-400"
                               (blur)="commitEdit($event, row.label, 'anno1')"
                               (keydown.enter)="blurTarget($event)"
                               (keydown.escape)="cancelEdit()"/>
                      } @else {
                        <span class="block px-3 py-3 whitespace-nowrap">{{ formatCurrency(row.anno1) }}</span>
                      }
                    </td>

                    <!-- Anno 2 -->
                    <td [ngClass]="[
                        'px-4 py-0 text-right text-sm font-mono transition-all duration-300',
                        row.isHighlight ? 'font-semibold' : '',
                        (row.isCost || row.anno2 < 0) ? 'text-rose-500' : 'text-zinc-800 dark:text-zinc-200',
                        planService.isEditableRow(row.label) ? 'cell-editable' : 'opacity-60'
                      ]"
                      (click)="startEdit(row.label, 'anno2')">
                      @if (isEditing(row.label, 'anno2')) {
                        <input type="number" [value]="row.anno2" autofocus
                               class="w-full text-right bg-transparent font-mono text-sm py-3 px-3 outline-none border-b-2 border-brand-400"
                               (blur)="commitEdit($event, row.label, 'anno2')"
                               (keydown.enter)="blurTarget($event)"
                               (keydown.escape)="cancelEdit()"/>
                      } @else {
                        <span class="block px-3 py-3 whitespace-nowrap">{{ formatCurrency(row.anno2) }}</span>
                      }
                    </td>

                    <!-- Anno 3 -->
                    <td [ngClass]="[
                        'px-4 md:px-6 py-0 text-right text-sm font-mono transition-all duration-300',
                        row.isHighlight ? 'font-semibold' : '',
                        (row.isCost || row.anno3 < 0) ? 'text-rose-500' : 'text-zinc-800 dark:text-zinc-200',
                        planService.isEditableRow(row.label) ? 'cell-editable' : 'opacity-60'
                      ]"
                      (click)="startEdit(row.label, 'anno3')">
                      @if (isEditing(row.label, 'anno3')) {
                        <input type="number" [value]="row.anno3" autofocus
                               class="w-full text-right bg-transparent font-mono text-sm py-3 px-3 outline-none border-b-2 border-brand-400"
                               (blur)="commitEdit($event, row.label, 'anno3')"
                               (keydown.enter)="blurTarget($event)"
                               (keydown.escape)="cancelEdit()"/>
                      } @else {
                        <span class="block px-3 py-3 whitespace-nowrap">{{ formatCurrency(row.anno3) }}</span>
                      }
                    </td>

                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>

    <!-- ═══════════════════ ROW DETAIL DRAWER ═══════════════════ -->
    @if (selectedRow()) {
      <!-- Backdrop -->
      <div @backdropFade
           class="fixed inset-0 z-50 bg-zinc-950/40 backdrop-blur-sm"
           (click)="closeDetail()"></div>

      <!-- Drawer panel -->
      <aside @drawerSlide
             class="fixed inset-y-0 right-0 z-50 w-full max-w-sm sm:max-w-md flex flex-col bg-white dark:bg-zinc-900 shadow-2xl border-l border-zinc-200 dark:border-zinc-800">

        <!-- Drawer header -->
        <div class="flex items-start justify-between px-5 pt-5 pb-4 border-b border-zinc-100 dark:border-zinc-800">
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-1.5">
              @if (planService.isEditableRow(selectedRow()!.label)) {
                <span class="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-brand-600 bg-brand-50 border border-brand-100 px-2 py-0.5 rounded-full font-body">
                  <svg class="w-2.5 h-2.5 flex-shrink-0" fill="none" viewBox="0 0 24 24"
                       stroke="currentColor" stroke-width="2.5">
                    <path stroke-linecap="round" stroke-linejoin="round"
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                  </svg>
                  Modificabile
                </span>
              } @else {
                <span class="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 px-2 py-0.5 rounded-full font-body">
                  <svg class="w-2.5 h-2.5 flex-shrink-0" fill="none" viewBox="0 0 24 24"
                       stroke="currentColor" stroke-width="2.5">
                    <path stroke-linecap="round" stroke-linejoin="round"
                          d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 11h.01M12 11h.01M15 11h.01M4 19h16a2 2 0 002-2V7a2 2 0 00-2-2H4a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                  </svg>
                  Calcolato
                </span>
              }
            </div>
            <h2 class="text-lg md:text-xl font-bold text-zinc-900 dark:text-zinc-100 font-display truncate">{{ selectedRow()!.label }}</h2>
            <p class="text-[11px] text-zinc-400 dark:text-zinc-500 font-body mt-0.5">Proiezione triennale</p>
          </div>
          <button
            class="ml-3 flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            (click)="closeDetail()">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <!-- Drawer body -->
        <div class="flex-1 overflow-y-auto px-5 py-5 space-y-3 scrollbar-thin">

          <!-- Year cards with stagger -->
          @for (yc of yearCards(); track yc.year; let yi = $index) {
            <div class="animate-slide-up"
                 [style.animation-delay]="(yi * 70) + 'ms'"
                 [ngClass]="[
                   'rounded-2xl border p-4 md:p-5 transition-all duration-200',
                   yc.isEditable
                     ? 'border-zinc-200 dark:border-zinc-700 hover:border-brand-200 dark:hover:border-brand-700 hover:shadow-sm bg-white dark:bg-zinc-800'
                     : 'border-zinc-100 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-800/40'
                 ]">
              <div class="flex items-center justify-between mb-3">
                <span class="text-[10px] font-bold uppercase tracking-widest font-body"
                      [ngClass]="yc.isEditable ? 'text-brand-500' : 'text-zinc-400'">
                  {{ yc.year }}
                </span>
                @if (yc.growthPct !== null) {
                  <span [ngClass]="[
                      'text-xs font-semibold px-2 py-0.5 rounded-full font-body',
                      yc.growthPct >= 0 ? 'text-emerald-700 bg-emerald-50' : 'text-rose-600 bg-rose-50'
                    ]">
                    {{ yc.growthPct >= 0 ? '+' : '' }}{{ yc.growthPct.toFixed(1) }}%
                  </span>
                }
              </div>

              @if (yc.isEditable) {
                <div class="flex items-end gap-1 border-b-2 border-zinc-200 dark:border-zinc-600 focus-within:border-brand-400 pb-1 transition-colors">
                  <span class="text-zinc-400 dark:text-zinc-500 text-lg font-mono mb-0.5">€</span>
                  <input
                    type="number"
                    class="year-input"
                    [ngClass]="detailValues()![yc.key] < 0 ? 'text-rose-500' : 'text-zinc-900 dark:text-zinc-100'"
                    [ngModel]="detailValues()![yc.key]"
                    (ngModelChange)="updateDetailValue(yc.key, $event)"
                    [placeholder]="'0'"/>
                </div>
                <p class="text-[11px] text-zinc-400 font-body mt-2">{{ formatCurrency(detailValues()![yc.key]) }}</p>
              } @else {
                <p [ngClass]="[
                    'text-2xl font-bold font-mono',
                    getAnnoValue(selectedRow()!, yi + 1) < 0 ? 'text-rose-500' : 'text-zinc-800 dark:text-zinc-200'
                  ]">
                  {{ formatCurrency(getAnnoValue(selectedRow()!, yi + 1)) }}
                </p>
                <p class="text-[11px] text-zinc-400 dark:text-zinc-500 font-body mt-1">Valore calcolato automaticamente</p>
              }

              <!-- Mini progress bar -->
              <div class="mt-4 h-1 rounded-full bg-zinc-100 dark:bg-zinc-700 overflow-hidden">
                <div class="bar-segment h-full rounded-full"
                     [style.width.%]="yc.barPct"
                     [ngClass]="yc.isEditable ? 'bg-brand-400' : 'bg-zinc-300'"></div>
              </div>
            </div>
          }

          <!-- Triennial comparison bars -->
          <div class="animate-slide-up rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 px-5 py-4"
               style="animation-delay: 240ms">
            <p class="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest font-body mb-3">Confronto triennale</p>
            <div class="flex items-end gap-2 h-14">
              @for (bar of comparisonBars(); track bar.year) {
                <div class="flex-1 flex flex-col items-center gap-1">
                  <div class="w-full rounded-t-md transition-all duration-500"
                       [style.height.px]="bar.height"
                       [ngClass]="[
                         bar.negative ? 'bg-rose-300' : 'bg-brand-300',
                         bar.isMax ? (bar.negative ? '!bg-rose-500' : '!bg-brand-500') : ''
                       ]">
                  </div>
                  <span class="text-[10px] font-body text-zinc-400 dark:text-zinc-500">{{ bar.year }}</span>
                </div>
              }
            </div>
          </div>

        </div>

        <!-- Drawer footer -->
        <div class="px-5 py-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center gap-3">
          @if (planService.isEditableRow(selectedRow()!.label)) {
            <button
              class="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 active:scale-[0.98] text-white text-sm font-semibold rounded-xl transition-all duration-150 font-body shadow-sm"
              (click)="saveDetail()">
              <svg class="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24"
                   stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
              </svg>
              Salva modifiche
            </button>
            <button
              class="px-4 py-2.5 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors font-body"
              (click)="closeDetail()">
              Annulla
            </button>
          } @else {
            <button
              class="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-sm font-semibold rounded-xl transition-colors font-body"
              (click)="closeDetail()">
              Chiudi
            </button>
          }
        </div>

      </aside>
    }
  `,
})
export class DashboardCruscottoComponent {
  readonly planService = inject(BusinessPlanService);
  private themeService = inject(ThemeService);

  editingCell = signal<{ rowLabel: string; year: 'anno1' | 'anno2' | 'anno3' } | null>(null);
  selectedRow  = signal<IncomeRow | null>(null);
  detailValues = signal<{ anno1: number; anno2: number; anno3: number } | null>(null);

  // ── ApexCharts: static config objects ──────────────────────────────────────

  readonly apexChartConfig = {
    type: 'area' as const,
    height: 220,
    toolbar: { show: false },
    zoom: { enabled: false },
    sparkline: { enabled: false },
    animations: {
      enabled: true,
      speed: 700,
      animateGradually: { enabled: true, delay: 120 },
    },
    background: 'transparent',
    fontFamily: 'Outfit, sans-serif',
  };

  readonly apexStroke = { curve: 'smooth' as const, width: 2.5 };

  readonly apexFill = {
    type: 'gradient',
    gradient: { shadeIntensity: 1, opacityFrom: 0.20, opacityTo: 0.01, stops: [0, 95, 100] },
  };

  readonly apexGrid = computed(() => ({
    borderColor: this.themeService.dark() ? '#27272a' : '#f4f4f5',
    strokeDashArray: 4,
    yaxis: { lines: { show: true } },
    xaxis: { lines: { show: false } },
    padding: { top: 0, right: 8, bottom: 0, left: 8 },
  }));

  readonly apexYaxis = { show: false };

  readonly apexMarkers = {
    size: 4,
    strokeWidth: 2,
    strokeColors: '#ffffff',
    fillOpacity: 1,
    hover: { size: 6 },
  };

  readonly apexTooltip = {
    theme: 'light' as const,
    style: { fontFamily: 'JetBrains Mono, monospace', fontSize: '12px' },
    x: { show: true },
    y: { formatter: (val: number) => this.formatCurrency(val) },
  };

  readonly apexResponsive = [
    { breakpoint: 640, options: { chart: { height: 165 } } },
  ];

  // ── ApexCharts: reactive computed inputs ────────────────────────────────────

  readonly apexSeries = computed(() => [{
    name: 'Cash Flow',
    data: this.planService.cashFlow().map(p => Math.round(p.value)),
  }]);

  readonly apexColors = computed(() =>
    this.planService.isAiUpdated() ? ['#22c55e'] : ['#6366f1']
  );

  readonly apexXaxis = computed(() => ({
    categories: this.planService.cashFlow().map(p => p.month),
    axisBorder: { show: false },
    axisTicks: { show: false },
    labels: {
      style: {
        colors: Array(12).fill('#a1a1aa'),
        fontSize: '10px',
        fontFamily: 'Outfit, sans-serif',
      },
    },
  }));

  // ── KPI Cards ───────────────────────────────────────────────────────────────

  readonly kpiCards = computed(() => {
    const k = this.planService.kpi();
    const d = this.planService.kpiDelta();
    return [
      {
        id: 'fatturato',
        label: 'Fatturato Totale',
        iconPath: 'M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
        iconBg:    'bg-indigo-50',
        iconColor: 'text-indigo-500',
        accentFill: 'bg-indigo-300',
        value: this.formatCurrency(k.fatturatoTotale),
        delta: d?.fatturato,
      },
      {
        id: 'ebitda',
        label: 'EBITDA',
        iconPath: 'M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941',
        iconBg:    'bg-violet-50',
        iconColor: 'text-violet-500',
        accentFill: 'bg-violet-300',
        value: this.formatCurrency(k.ebitda),
        delta: d?.ebitda,
      },
      {
        id: 'utile',
        label: 'Utile Netto',
        iconPath: 'M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
        iconBg:    'bg-emerald-50',
        iconColor: 'text-emerald-500',
        accentFill: 'bg-emerald-300',
        value: this.formatCurrency(k.utileNetto),
        delta: d?.utile,
      },
      {
        id: 'runway',
        label: 'Cash Runway',
        iconPath: 'M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z',
        iconBg:    'bg-amber-50',
        iconColor: 'text-amber-500',
        accentFill: 'bg-amber-300',
        value: `${k.cashRunway} mesi`,
        delta: d?.runway,
      },
    ];
  });

  // ── Drawer computeds ────────────────────────────────────────────────────────

  readonly yearCards = computed(() => {
    const row  = this.selectedRow();
    const vals = this.detailValues();
    if (!row || !vals) return [];

    const isEditable = this.planService.isEditableRow(row.label);
    const rawVals    = [row.anno1, row.anno2, row.anno3];
    const maxAbs     = Math.max(...rawVals.map(Math.abs), 1);

    return [
      {
        year: 'Anno 1', key: 'anno1' as const,
        isEditable,
        growthPct: null,
        barPct: Math.min(100, Math.abs(row.anno1) / maxAbs * 100),
      },
      {
        year: 'Anno 2', key: 'anno2' as const,
        isEditable,
        growthPct: row.anno1 !== 0 ? ((row.anno2 - row.anno1) / Math.abs(row.anno1)) * 100 : null,
        barPct: Math.min(100, Math.abs(row.anno2) / maxAbs * 100),
      },
      {
        year: 'Anno 3', key: 'anno3' as const,
        isEditable,
        growthPct: row.anno2 !== 0 ? ((row.anno3 - row.anno2) / Math.abs(row.anno2)) * 100 : null,
        barPct: Math.min(100, Math.abs(row.anno3) / maxAbs * 100),
      },
    ];
  });

  readonly comparisonBars = computed(() => {
    const row = this.selectedRow();
    if (!row) return [];
    const vals   = [row.anno1, row.anno2, row.anno3];
    const maxAbs = Math.max(...vals.map(Math.abs), 1);
    const MAX_H  = 40;
    return vals.map((v, i) => ({
      year: `A${i + 1}`,
      height: Math.max(4, Math.abs(v) / maxAbs * MAX_H),
      negative: v < 0,
      isMax: Math.abs(v) === maxAbs,
    }));
  });

  // ── Methods ─────────────────────────────────────────────────────────────────

  openRowDetail(row: IncomeRow): void {
    this.editingCell.set(null);
    this.selectedRow.set({ ...row });
    this.detailValues.set({ anno1: row.anno1, anno2: row.anno2, anno3: row.anno3 });
  }

  closeDetail(): void {
    this.selectedRow.set(null);
    this.detailValues.set(null);
  }

  updateDetailValue(key: 'anno1' | 'anno2' | 'anno3', raw: number | string): void {
    const val = typeof raw === 'string' ? parseFloat(raw) : raw;
    if (!isNaN(val)) {
      this.detailValues.update(v => v ? { ...v, [key]: val } : v);
    }
  }

  saveDetail(): void {
    const row  = this.selectedRow();
    const vals = this.detailValues();
    if (!row || !vals) return;
    if (this.planService.isEditableRow(row.label)) {
      (['anno1', 'anno2', 'anno3'] as const).forEach(y => {
        this.planService.updateCell(row.label, y, vals[y]);
      });
    }
    this.closeDetail();
  }

  isEditing(rowLabel: string, year: 'anno1' | 'anno2' | 'anno3'): boolean {
    const c = this.editingCell();
    return !!c && c.rowLabel === rowLabel && c.year === year;
  }

  startEdit(rowLabel: string, year: 'anno1' | 'anno2' | 'anno3'): void {
    if (this.planService.isEditableRow(rowLabel)) {
      this.editingCell.set({ rowLabel, year });
    }
  }

  commitEdit(event: Event, rowLabel: string, year: 'anno1' | 'anno2' | 'anno3'): void {
    const input = event.target as HTMLInputElement;
    const val   = parseFloat(input.value);
    if (!isNaN(val)) {
      this.planService.updateCell(rowLabel, year, val);
    }
    this.editingCell.set(null);
  }

  cancelEdit(): void { this.editingCell.set(null); }

  blurTarget(event: Event): void { (event.target as HTMLElement).blur(); }

  getAnnoValue(row: IncomeRow, annoIndex: number): number {
    if (annoIndex === 1) return row.anno1;
    if (annoIndex === 2) return row.anno2;
    return row.anno3;
  }

  formatCurrency(value: number): string {
    const abs  = Math.abs(value);
    const sign = value < 0 ? '-' : '';
    if (abs >= 1_000_000) return `${sign}€${(abs / 1_000_000).toFixed(2)}M`;
    if (abs >= 1_000)     return `${sign}€${Math.round(abs / 1000)}K`;
    return `${sign}€${abs}`;
  }
}
