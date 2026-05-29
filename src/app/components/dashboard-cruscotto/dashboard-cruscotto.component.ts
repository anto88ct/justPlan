import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule, NgClass } from '@angular/common';
import { BusinessPlanService } from '../../services/business-plan.service';

@Component({
  selector: 'app-dashboard-cruscotto',
  standalone: true,
  host: { class: 'flex flex-col h-full overflow-hidden' },
  imports: [CommonModule, NgClass],
  styles: [`
    .cell-editable { cursor: text; }
    .cell-editable:hover { background: rgba(99,102,241,0.04); }

    @keyframes cellSaved {
      0%   { background: rgba(99,102,241,0.12); }
      100% { background: transparent; }
    }
    .cell-flash { animation: cellSaved 0.6s ease-out; }
  `],
  template: `
    <div class="flex flex-col h-full overflow-y-auto scrollbar-thin">

      <!-- Page header -->
      <div class="px-4 md:px-8 pt-5 md:pt-8 pb-4 md:pb-5 border-b border-zinc-100 flex items-center justify-between gap-3 flex-shrink-0">
        <div>
          <p class="text-xs font-medium text-brand-600 uppercase tracking-widest mb-1 font-body">Dashboard</p>
          <h1 class="text-2xl font-bold text-zinc-900 font-display">Business Plan 2025–2027</h1>
        </div>
        @if (planService.isAiUpdated()) {
          <div class="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 rounded-full border border-emerald-200 animate-fade-in">
            <div class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
            <span class="text-xs font-medium text-emerald-700 font-body">Aggiornato dall'AI</span>
          </div>
        }
      </div>

      <div class="flex-1 px-4 md:px-8 py-4 md:py-6 space-y-6">

        <!-- KPI Cards -->
        <div class="grid grid-cols-2 xl:grid-cols-4 gap-3 md:gap-4">
          @for (kpi of kpiCards(); track kpi.id) {
            <div [ngClass]="[
                'bg-white rounded-2xl border p-5 shadow-card hover:shadow-card-hover transition-all duration-300',
                planService.isAiUpdated() ? 'border-emerald-200 ring-1 ring-emerald-100' : 'border-zinc-100'
              ]">
              <div class="flex items-start justify-between mb-3">
                <div class="w-9 h-9 rounded-xl flex items-center justify-center" [class]="kpi.iconBg">
                  <span class="text-base">{{ kpi.icon }}</span>
                </div>
                @if (planService.isAiUpdated() && kpi.delta) {
                  <span class="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full font-body animate-fade-in">
                    {{ kpi.delta }}
                  </span>
                }
              </div>
              <p class="text-xs text-zinc-500 font-medium font-body mb-1">{{ kpi.label }}</p>
              <p [ngClass]="[
                  'text-2xl font-bold font-display number-highlight transition-all duration-500',
                  planService.isAiUpdated() ? 'text-emerald-600' : 'text-zinc-900'
                ]">
                {{ kpi.value }}
              </p>
            </div>
          }
        </div>

        <!-- Cash Flow Chart -->
        <div class="bg-white rounded-2xl border border-zinc-100 shadow-card p-4 md:p-6">
          <div class="flex flex-wrap items-start justify-between gap-2 mb-4 md:mb-5">
            <div>
              <h3 class="text-sm font-semibold text-zinc-800 font-display">Flusso di Cassa</h3>
              <p class="text-xs text-zinc-400 font-body mt-0.5">Proiezione mensile — Anno 1</p>
            </div>
            <div class="flex items-center gap-4 text-xs text-zinc-500 font-body">
              <div class="flex items-center gap-1.5">
                <div class="w-3 h-0.5 rounded-full"
                     [class]="planService.isAiUpdated() ? 'bg-emerald-500' : 'bg-brand-500'"></div>
                <span>Cash Flow</span>
              </div>
              <div class="flex items-center gap-1.5">
                <div class="w-3 h-px border-t border-dashed border-zinc-300"></div>
                <span>Break-even</span>
              </div>
            </div>
          </div>

          <div class="relative w-full" style="height: 180px;">
            <svg viewBox="0 0 800 160" class="w-full h-full overflow-visible" preserveAspectRatio="none">
              <defs>
                <linearGradient id="gradBlue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stop-color="#6366f1" stop-opacity="0.18"/>
                  <stop offset="100%" stop-color="#6366f1" stop-opacity="0.01"/>
                </linearGradient>
                <linearGradient id="gradGreen" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stop-color="#22c55e" stop-opacity="0.20"/>
                  <stop offset="100%" stop-color="#22c55e" stop-opacity="0.01"/>
                </linearGradient>
              </defs>
              @for (yv of [0, 40, 80, 120, 160]; track yv) {
                <line x1="0" [attr.y1]="yv" x2="800" [attr.y2]="yv" stroke="#f4f4f5" stroke-width="1"/>
              }
              <line x1="0" [attr.y1]="chartGeom().zeroY" x2="800" [attr.y2]="chartGeom().zeroY"
                    stroke="#e4e4e7" stroke-width="1.5" stroke-dasharray="6,4"/>
              <path [attr.d]="chartGeom().areaPath"
                    [attr.fill]="planService.isAiUpdated() ? 'url(#gradGreen)' : 'url(#gradBlue)'"
                    class="transition-all duration-700"/>
              <path [attr.d]="chartGeom().linePath" fill="none"
                    [attr.stroke]="planService.isAiUpdated() ? '#22c55e' : '#6366f1'"
                    stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"
                    class="transition-all duration-700"/>
              @for (pt of chartGeom().coords; track $index) {
                <circle [attr.cx]="pt.x" [attr.cy]="pt.y" r="3.5"
                        [attr.fill]="planService.isAiUpdated() ? '#22c55e' : '#6366f1'"
                        stroke="white" stroke-width="1.5" class="transition-all duration-700"/>
              }
            </svg>
          </div>
          <div class="flex justify-between mt-1">
            @for (lbl of chartGeom().labels; track $index) {
              <span class="text-xs text-zinc-400 font-body">{{ lbl }}</span>
            }
          </div>
        </div>

        <!-- Income Statement Table — editable -->
        <div class="bg-white rounded-2xl border border-zinc-100 shadow-card overflow-hidden">
          <div class="px-4 md:px-6 py-3 md:py-4 border-b border-zinc-100 flex items-center justify-between gap-2">
            <div>
              <h3 class="text-sm font-semibold text-zinc-800 font-display">Conto Economico Sintetico</h3>
              <p class="text-xs text-zinc-400 font-body mt-0.5">Proiezione triennale</p>
            </div>
            <div class="flex items-center gap-1.5 text-xs text-zinc-400 font-body">
              <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round"
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
              </svg>
              Clicca cella per modificare
            </div>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full border-collapse">
              <thead>
                <tr>
                  <th class="text-left px-6 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide font-body bg-zinc-50 border-b border-zinc-100">Voce</th>
                  <th class="text-right px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide font-body bg-zinc-50 border-b border-zinc-100">Anno 1</th>
                  <th class="text-right px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide font-body bg-zinc-50 border-b border-zinc-100">Anno 2</th>
                  <th class="text-right px-6 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide font-body bg-zinc-50 border-b border-zinc-100">Anno 3</th>
                </tr>
              </thead>
              <tbody>
                @for (row of planService.incomeStatement(); track row.label; let ri = $index) {
                  <tr [ngClass]="row.isHighlight
                    ? 'bg-brand-50 border-b border-zinc-100'
                    : 'bg-white border-b border-zinc-50 hover:bg-zinc-50/50'">

                    <!-- Label -->
                    <td [ngClass]="[
                        'px-6 py-3 text-sm font-body',
                        row.isHighlight ? 'font-semibold text-zinc-800' : 'text-zinc-600 pl-10'
                      ]">
                      @if (!row.isHighlight) {
                        <span class="text-zinc-300 mr-1.5 text-xs">—</span>
                      }
                      {{ row.label }}
                      @if (!planService.isEditableRow(row.label)) {
                        <span class="ml-1.5 text-zinc-300 text-xs font-normal">calc.</span>
                      }
                    </td>

                    <!-- Anno 1 -->
                    <td [ngClass]="[
                        'px-4 py-0 text-right text-sm font-mono transition-all duration-300',
                        row.isHighlight ? 'font-semibold' : '',
                        (row.isCost || row.anno1 < 0) ? 'text-rose-500' : 'text-zinc-800',
                        planService.isEditableRow(row.label) ? 'cell-editable' : 'opacity-80'
                      ]"
                      (click)="startEdit(row.label, 'anno1')">
                      @if (isEditing(row.label, 'anno1')) {
                        <input type="number" [value]="row.anno1" autofocus
                               class="w-full text-right bg-transparent font-mono text-sm py-3 px-4 outline-none border-b-2 border-brand-400"
                               (blur)="commitEdit($event, row.label, 'anno1')"
                               (keydown.enter)="blurTarget($event)"
                               (keydown.escape)="cancelEdit()"/>
                      } @else {
                        <span class="block px-4 py-3">{{ formatCurrency(row.anno1) }}</span>
                      }
                    </td>

                    <!-- Anno 2 -->
                    <td [ngClass]="[
                        'px-4 py-0 text-right text-sm font-mono transition-all duration-300',
                        row.isHighlight ? 'font-semibold' : '',
                        (row.isCost || row.anno2 < 0) ? 'text-rose-500' : 'text-zinc-800',
                        planService.isEditableRow(row.label) ? 'cell-editable' : 'opacity-80'
                      ]"
                      (click)="startEdit(row.label, 'anno2')">
                      @if (isEditing(row.label, 'anno2')) {
                        <input type="number" [value]="row.anno2" autofocus
                               class="w-full text-right bg-transparent font-mono text-sm py-3 px-4 outline-none border-b-2 border-brand-400"
                               (blur)="commitEdit($event, row.label, 'anno2')"
                               (keydown.enter)="blurTarget($event)"
                               (keydown.escape)="cancelEdit()"/>
                      } @else {
                        <span class="block px-4 py-3">{{ formatCurrency(row.anno2) }}</span>
                      }
                    </td>

                    <!-- Anno 3 -->
                    <td [ngClass]="[
                        'px-6 py-0 text-right text-sm font-mono transition-all duration-300',
                        row.isHighlight ? 'font-semibold' : '',
                        (row.isCost || row.anno3 < 0) ? 'text-rose-500' : 'text-zinc-800',
                        planService.isEditableRow(row.label) ? 'cell-editable' : 'opacity-80'
                      ]"
                      (click)="startEdit(row.label, 'anno3')">
                      @if (isEditing(row.label, 'anno3')) {
                        <input type="number" [value]="row.anno3" autofocus
                               class="w-full text-right bg-transparent font-mono text-sm py-3 px-6 outline-none border-b-2 border-brand-400"
                               (blur)="commitEdit($event, row.label, 'anno3')"
                               (keydown.enter)="blurTarget($event)"
                               (keydown.escape)="cancelEdit()"/>
                      } @else {
                        <span class="block px-4 py-3">{{ formatCurrency(row.anno3) }}</span>
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
  `,
})
export class DashboardCruscottoComponent {
  readonly planService = inject(BusinessPlanService);

  editingCell = signal<{ rowLabel: string; year: 'anno1' | 'anno2' | 'anno3' } | null>(null);

  readonly kpiCards = computed(() => {
    const k = this.planService.kpi();
    const d = this.planService.kpiDelta();
    return [
      { id: 'fatturato', label: 'Fatturato Totale', icon: '💰', iconBg: 'bg-blue-50',    value: this.formatCurrency(k.fatturatoTotale), delta: d?.fatturato },
      { id: 'ebitda',    label: 'EBITDA',           icon: '📈', iconBg: 'bg-violet-50',  value: this.formatCurrency(k.ebitda),           delta: d?.ebitda },
      { id: 'utile',     label: 'Utile Netto',      icon: '✅', iconBg: 'bg-emerald-50', value: this.formatCurrency(k.utileNetto),       delta: d?.utile },
      { id: 'runway',    label: 'Cash Runway',      icon: '🛫', iconBg: 'bg-amber-50',   value: `${k.cashRunway} mesi`,                  delta: d?.runway },
    ];
  });

  readonly chartGeom = computed(() => {
    const points = this.planService.cashFlow();
    const W = 800, H = 160;
    const values = points.map(p => p.value);
    const minVal = Math.min(...values);
    const maxVal = Math.max(...values);
    const pad = (maxVal - minVal) * 0.18;
    const yMin = minVal - pad;
    const yMax = maxVal + pad;
    const yRange = yMax - yMin;

    const toX = (i: number) => (i / (points.length - 1)) * W;
    const toY = (v: number) => H - ((v - yMin) / yRange) * H;

    const coords = points.map((p, i) => ({ x: toX(i), y: toY(p.value) }));
    const zeroY = Math.min(Math.max(toY(0), 0), H);
    const linePath = coords.map((c, i) => `${i === 0 ? 'M' : 'L'}${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(' ');
    const last = coords[coords.length - 1];
    const first = coords[0];
    const areaPath = `${linePath} L${last.x.toFixed(1)},${zeroY.toFixed(1)} L${first.x.toFixed(1)},${zeroY.toFixed(1)} Z`;

    return { coords, linePath, areaPath, zeroY, labels: points.map(p => p.month) };
  });

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
    const val = parseFloat(input.value);
    if (!isNaN(val)) {
      this.planService.updateCell(rowLabel, year, val);
    }
    this.editingCell.set(null);
  }

  cancelEdit(): void {
    this.editingCell.set(null);
  }

  blurTarget(event: Event): void {
    (event.target as HTMLElement).blur();
  }

  formatCurrency(value: number): string {
    const abs = Math.abs(value);
    const sign = value < 0 ? '-' : '';
    if (abs >= 1_000_000) return `${sign}€${(abs / 1_000_000).toFixed(2)}M`;
    if (abs >= 1_000)     return `${sign}€${Math.round(abs / 1000)}K`;
    return `${sign}€${abs}`;
  }
}
