import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule, NgClass } from '@angular/common';
import { NgApexchartsModule } from 'ng-apexcharts';
import { BusinessPlanService } from '../../services/business-plan.service';
import { ThemeService } from '../../services/theme.service';

type YearFilter = 1 | 2 | 3;

const COLORS = {
  indigo:  '#6366f1',
  violet:  '#8b5cf6',
  emerald: '#22c55e',
  amber:   '#f59e0b',
  rose:    '#ef4444',
  cyan:    '#06b6d4',
  orange:  '#f97316',
  sky:     '#0ea5e9',
};

const FONT = "'Outfit', sans-serif";

const makeBaseChart = (type: string, height: number, foreColor: string, extra: any = {}) => ({
  type,
  height,
  fontFamily: FONT,
  foreColor,
  toolbar: { show: true, tools: { download: true, selection: false, zoom: false, zoomin: false, zoomout: false, pan: false, reset: false }, ...extra.toolbar },
  animations: { enabled: true, easing: 'easeinout', speed: 600, animateGradually: { enabled: true, delay: 80 }, dynamicAnimation: { enabled: true, speed: 350 } },
  ...extra,
});

const makeGrid = (isDark: boolean) => ({
  borderColor: isDark ? '#27272a' : '#f4f4f5',
  strokeDashArray: 4,
  xaxis: { lines: { show: false } },
  yaxis: { lines: { show: true } },
  padding: { top: 4, right: 8, bottom: 4, left: 8 },
});

const legendConfig: any = { fontFamily: FONT, fontSize: '12px', markers: { radius: 4 } };

function fmtK(val: number): string {
  const abs = Math.abs(val);
  const sign = val < 0 ? '-' : '';
  if (abs >= 1_000_000) return `${sign}€${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000)     return `${sign}€${Math.round(abs / 1000)}K`;
  return `${sign}€${abs}`;
}

@Component({
  selector: 'app-report',
  standalone: true,
  imports: [CommonModule, NgClass, NgApexchartsModule],
  styles: [`
    :host { display: block; height: 100%; }

    .chart-card {
      background: white;
      border: 1px solid #f4f4f5;
      border-radius: 20px;
      padding: 20px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }

    .filter-pill {
      padding: 5px 14px;
      border-radius: 999px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      font-family: 'Outfit', sans-serif;
      border: 1.5px solid transparent;
    }
    .filter-pill.active {
      background: #6366f1;
      color: white;
      border-color: #6366f1;
    }
    .filter-pill:not(.active) {
      background: white;
      color: #71717a;
      border-color: #e4e4e7;
    }
    .filter-pill:not(.active):hover {
      border-color: #a5b4fc;
      color: #6366f1;
    }

    @keyframes fadeSlide {
      from { opacity: 0; transform: translateY(12px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .fade-slide { animation: fadeSlide 0.4s cubic-bezier(0.16,1,0.3,1) both; }

    .kpi-chip {
      padding: 4px 10px;
      border-radius: 8px;
      font-size: 11px;
      font-weight: 700;
      font-family: 'JetBrains Mono', monospace;
    }

    /* ── Dark mode ────────────────────────────────────────────────────────── */
    :host-context(.dark) .chart-card {
      background: #18181b;
      border-color: #27272a;
      box-shadow: 0 1px 3px rgba(0,0,0,0.3);
    }
    :host-context(.dark) .filter-pill:not(.active) {
      background: #27272a;
      color: #a1a1aa;
      border-color: #3f3f46;
    }
    :host-context(.dark) .filter-pill:not(.active):hover {
      border-color: #818cf8;
      color: #818cf8;
    }
  `],
  template: `
    <div class="h-full overflow-y-auto scrollbar-thin bg-zinc-50 dark:bg-zinc-950">

      <!-- ── Header ─────────────────────────────────────────────────────── -->
      <div class="px-4 md:px-8 pt-5 md:pt-8 pb-5 border-b border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-wrap items-start justify-between gap-4 sticky top-0 z-10">
        <div>
          <p class="text-xs font-semibold text-brand-600 uppercase tracking-widest font-body mb-1">Analytics</p>
          <h1 class="text-2xl font-bold text-zinc-900 dark:text-zinc-100 font-display">Report & Dashboard</h1>
          <p class="text-sm text-zinc-400 dark:text-zinc-500 font-body mt-0.5">{{ planName() }}</p>
        </div>

        <!-- Year filter -->
        <div class="flex items-center gap-2 flex-wrap">
          <span class="text-xs text-zinc-400 font-body mr-1">Visualizza:</span>
          @for (y of years; track y.value) {
            <button class="filter-pill"
                    [class.active]="selectedYear() === y.value"
                    (click)="selectedYear.set(y.value)">
              {{ y.label }}
            </button>
          }
        </div>
      </div>

      <!-- ── KPI Strip ───────────────────────────────────────────────────── -->
      <div class="px-4 md:px-8 pt-5 pb-0">
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          @for (kpi of kpiStrip(); track kpi.label) {
            <div class="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 px-4 py-3 shadow-sm fade-slide flex items-center gap-3">
              <div class="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-base" [class]="kpi.iconBg">{{ kpi.icon }}</div>
              <div class="min-w-0">
                <p class="text-xs text-zinc-400 dark:text-zinc-500 font-body truncate">{{ kpi.label }}</p>
                <p class="text-lg font-bold font-mono leading-tight" [class]="kpi.valClass">{{ kpi.value }}</p>
              </div>
            </div>
          }
        </div>
      </div>

      <!-- ── Charts Grid ─────────────────────────────────────────────────── -->
      <div class="px-4 md:px-8 py-5 grid grid-cols-1 xl:grid-cols-2 gap-5">

        <!-- 1 · Revenue & Profitability ─────────────────────────────────── -->
        <div class="chart-card fade-slide xl:col-span-2">
          <div class="flex flex-wrap items-center justify-between gap-2 mb-4">
            <div>
              <h3 class="text-sm font-bold text-zinc-800 dark:text-zinc-200 font-display">Ricavi e Redditività</h3>
              <p class="text-xs text-zinc-400 dark:text-zinc-500 font-body">Proiezione triennale</p>
            </div>
            <div class="flex gap-1.5">
              @for (m of revenueMetrics; track m.key) {
                <button class="filter-pill"
                        [class.active]="activeRevenueMetric() === m.key"
                        (click)="activeRevenueMetric.set(m.key)">
                  {{ m.label }}
                </button>
              }
            </div>
          </div>
          <apx-chart
            [series]="revenueBarSeries()"
            [chart]="revenueChart()"
            [xaxis]="threeYearXAxis"
            [yaxis]="euroYAxis"
            [plotOptions]="barPlotOptions"
            [dataLabels]="noDataLabels"
            [stroke]="barStroke"
            [fill]="solidFill"
            [colors]="revenueColors()"
            [grid]="gridConf()"
            [legend]="legendTop"
            [tooltip]="euroTooltip"
          ></apx-chart>
        </div>

        <!-- 2 · Monthly Cash Flow ───────────────────────────────────────── -->
        <div class="chart-card fade-slide">
          <div class="mb-4">
            <h3 class="text-sm font-bold text-zinc-800 dark:text-zinc-200 font-display">Flusso di Cassa Mensile</h3>
            <p class="text-xs text-zinc-400 dark:text-zinc-500 font-body">Anno {{ selectedYear() }} — posizione cumulata</p>
          </div>
          <apx-chart
            [series]="cashFlowAreaSeries()"
            [chart]="cashFlowChart()"
            [xaxis]="cashFlowXAxis()"
            [yaxis]="euroYAxis"
            [dataLabels]="noDataLabels"
            [stroke]="smoothStroke"
            [fill]="gradientFill"
            [colors]="['#6366f1']"
            [grid]="gridConf()"
            [annotations]="zeroLineAnnotation()"
            [tooltip]="euroTooltip"
            [markers]="dotMarkers"
          ></apx-chart>
        </div>

        <!-- 3 · Cost Structure ──────────────────────────────────────────── -->
        <div class="chart-card fade-slide">
          <div class="mb-4">
            <h3 class="text-sm font-bold text-zinc-800 dark:text-zinc-200 font-display">Struttura dei Costi</h3>
            <p class="text-xs text-zinc-400 dark:text-zinc-500 font-body">Anno {{ selectedYear() }}</p>
          </div>
          <apx-chart
            [series]="costDonutSeries()"
            [chart]="donutChart()"
            [labels]="costLabels"
            [colors]="donutColors"
            [plotOptions]="donutPlotOptions()"
            [dataLabels]="donutDataLabels"
            [legend]="legendBottom"
            [tooltip]="euroTooltipNonAxis"
          ></apx-chart>
        </div>

        <!-- 4 · Margin Trends ───────────────────────────────────────────── -->
        <div class="chart-card fade-slide">
          <div class="mb-4">
            <h3 class="text-sm font-bold text-zinc-800 dark:text-zinc-200 font-display">Evoluzione dei Margini</h3>
            <p class="text-xs text-zinc-400 dark:text-zinc-500 font-body">% su Ricavi Totali — 3 anni</p>
          </div>
          <apx-chart
            [series]="marginLineSeries()"
            [chart]="lineChart()"
            [xaxis]="threeYearXAxis"
            [yaxis]="pctYAxis"
            [stroke]="smoothStrokeThick"
            [dataLabels]="pctDataLabels"
            [colors]="['#6366f1','#22c55e','#f59e0b']"
            [grid]="gridConf()"
            [markers]="roundMarkers"
            [legend]="legendTop"
            [tooltip]="pctTooltip"
          ></apx-chart>
        </div>

        <!-- 5 · Cost Composition stacked ───────────────────────────────── -->
        <div class="chart-card fade-slide">
          <div class="mb-4">
            <h3 class="text-sm font-bold text-zinc-800 dark:text-zinc-200 font-display">Composizione dei Costi</h3>
            <p class="text-xs text-zinc-400 dark:text-zinc-500 font-body">Stacked — proiezione 3 anni</p>
          </div>
          <apx-chart
            [series]="stackedCostSeries()"
            [chart]="stackedBarChart()"
            [xaxis]="threeYearXAxis"
            [yaxis]="euroYAxis"
            [plotOptions]="stackedBarPlotOptions"
            [dataLabels]="noDataLabels"
            [stroke]="barStroke"
            [fill]="solidFill"
            [colors]="['#ef4444','#f97316','#8b5cf6','#06b6d4']"
            [grid]="gridConf()"
            [legend]="legendTop"
            [tooltip]="euroTooltip"
          ></apx-chart>
        </div>

        <!-- 6 · Margin Radial ───────────────────────────────────────────── -->
        <div class="chart-card fade-slide">
          <div class="mb-2">
            <h3 class="text-sm font-bold text-zinc-800 dark:text-zinc-200 font-display">Indicatori di Marginalità</h3>
            <p class="text-xs text-zinc-400 dark:text-zinc-500 font-body">Anno {{ selectedYear() }} — % su Ricavi</p>
          </div>
          <div class="flex flex-col lg:flex-row items-center gap-4">
            <apx-chart
              [series]="radialSeries()"
              [chart]="radialChart()"
              [plotOptions]="radialPlotOptions"
              [labels]="radialLabels"
              [colors]="['#6366f1','#22c55e','#f59e0b']"
              [stroke]="radialStroke"
              [fill]="radialFill()"
            ></apx-chart>
            <!-- Legend chips -->
            <div class="flex flex-col gap-3 min-w-0">
              @for (item of radialLegend(); track item.label) {
                <div class="flex items-center justify-between gap-4 p-3 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
                  <div class="flex items-center gap-2.5">
                    <div class="w-2.5 h-2.5 rounded-full flex-shrink-0" [style.background]="item.color"></div>
                    <span class="text-xs text-zinc-600 dark:text-zinc-400 font-body">{{ item.label }}</span>
                  </div>
                  <span class="kpi-chip" [style.background]="item.color + '18'" [style.color]="item.color">
                    {{ item.value }}%
                  </span>
                </div>
              }
            </div>
          </div>
        </div>

      </div>

      <!-- ── No-plan placeholder ─────────────────────────────────────────── -->
      @if (!hasPlan()) {
        <div class="fixed inset-0 bg-zinc-50/95 dark:bg-zinc-950/95 flex flex-col items-center justify-center z-20 p-8">
          <div class="w-20 h-20 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 flex items-center justify-center mb-5 shadow-sm">
            <span class="text-4xl">📊</span>
          </div>
          <h2 class="text-xl font-bold text-zinc-800 dark:text-zinc-200 font-display mb-2">Nessun piano generato</h2>
          <p class="text-sm text-zinc-500 dark:text-zinc-400 font-body text-center max-w-xs leading-relaxed">
            Genera un Business Plan dal wizard per visualizzare le dashboard interattive.
          </p>
        </div>
      }

    </div>
  `,
})
export class ReportComponent {
  private svc = inject(BusinessPlanService);
  private themeService = inject(ThemeService);
  private isDark = computed(() => this.themeService.dark());

  selectedYear = signal<YearFilter>(1);
  activeRevenueMetric = signal<'all' | 'ricavi' | 'gp' | 'ebitda' | 'utile'>('all');

  years: { label: string; value: YearFilter }[] = [
    { label: 'Anno 1', value: 1 },
    { label: 'Anno 2', value: 2 },
    { label: 'Anno 3', value: 3 },
  ];

  revenueMetrics = [
    { key: 'all'    as const, label: 'Tutti' },
    { key: 'ricavi' as const, label: 'Ricavi' },
    { key: 'gp'     as const, label: 'Gross Profit' },
    { key: 'ebitda' as const, label: 'EBITDA' },
    { key: 'utile'  as const, label: 'Utile' },
  ];

  costLabels   = ['COGS', 'Marketing', 'Personale', 'G&A'];
  radialLabels = ['Gross Margin', 'EBITDA Margin', 'Net Margin'];
  donutColors  = [COLORS.indigo, COLORS.violet, COLORS.amber, COLORS.cyan];

  // ── Helpers ──────────────────────────────────────────────────────────────

  private get income() { return this.svc.incomeStatement(); }
  private row(label: string) { return this.income.find(r => r.label === label); }
  private val(label: string, y: YearFilter): number {
    const r = this.row(label);
    return r ? r[`anno${y}`] : 0;
  }

  hasPlan = computed(() => this.income.some(r => r.label === 'Ricavi Totali' && r.anno1 !== 0));

  planName = computed(() => {
    const kpi = this.svc.kpi();
    return kpi.fatturatoTotale > 0
      ? `Fatturato Y1: ${fmtK(kpi.fatturatoTotale)} · EBITDA: ${fmtK(kpi.ebitda)} · Runway: ${kpi.cashRunway} mesi`
      : 'Dati dal Business Plan attivo';
  });

  // ── KPI strip ─────────────────────────────────────────────────────────────

  kpiStrip = computed(() => {
    const y = this.selectedYear();
    const ricavi = this.val('Ricavi Totali', y);
    const gp     = this.val('Gross Profit', y);
    const ebitda = this.val('EBITDA', y);
    const utile  = this.val('Utile Netto', y);
    const gmPct  = ricavi ? +((gp / ricavi) * 100).toFixed(1) : 0;

    return [
      { label: `Ricavi Anno ${y}`,     icon: '💰', iconBg: 'bg-blue-50',    value: fmtK(ricavi), valClass: 'text-zinc-900' },
      { label: `EBITDA Anno ${y}`,     icon: '📈', iconBg: 'bg-violet-50',  value: fmtK(ebitda), valClass: ebitda >= 0 ? 'text-emerald-600' : 'text-rose-500' },
      { label: `Utile Netto Anno ${y}`,icon: '✅', iconBg: 'bg-emerald-50', value: fmtK(utile),  valClass: utile >= 0 ? 'text-zinc-900' : 'text-rose-500' },
      { label: 'Gross Margin %',        icon: '📊', iconBg: 'bg-amber-50',   value: `${gmPct}%`,   valClass: 'text-zinc-900' },
    ];
  });

  // ── Chart 1: Revenue Bar ───────────────────────────────────────────────────

  revenueBarSeries = computed(() => {
    const all = [
      { name: 'Ricavi Totali', data: [this.val('Ricavi Totali',1), this.val('Ricavi Totali',2), this.val('Ricavi Totali',3)], key: 'ricavi' },
      { name: 'Gross Profit',  data: [this.val('Gross Profit',1),  this.val('Gross Profit',2),  this.val('Gross Profit',3)],  key: 'gp' },
      { name: 'EBITDA',        data: [this.val('EBITDA',1),        this.val('EBITDA',2),        this.val('EBITDA',3)],        key: 'ebitda' },
      { name: 'Utile Netto',   data: [this.val('Utile Netto',1),   this.val('Utile Netto',2),   this.val('Utile Netto',3)],   key: 'utile' },
    ];
    const m = this.activeRevenueMetric();
    return m === 'all' ? all.map(s => ({ name: s.name, data: s.data })) : all.filter(s => s.key === m).map(s => ({ name: s.name, data: s.data }));
  });

  revenueColors = computed(() => {
    const m = this.activeRevenueMetric();
    if (m === 'all') return [COLORS.indigo, COLORS.violet, COLORS.emerald, COLORS.amber];
    const map: Record<string, string> = { ricavi: COLORS.indigo, gp: COLORS.violet, ebitda: COLORS.emerald, utile: COLORS.amber };
    return [map[m]];
  });

  // ── Chart 2: Cash Flow Area ────────────────────────────────────────────────

  cashFlowAreaSeries = computed(() => [{
    name: 'Cash Flow',
    data: this.svc.cashFlow().map(p => p.value),
  }]);

  cashFlowXAxis = computed(() => ({
    categories: this.svc.cashFlow().map(p => p.month),
    labels: { style: { fontFamily: FONT, fontSize: '11px', colors: '#a1a1aa' } },
    axisBorder: { show: false },
    axisTicks: { show: false },
  }));

  // ── Chart 3: Cost Donut ────────────────────────────────────────────────────

  costDonutSeries = computed((): number[] => {
    const y = this.selectedYear();
    return [
      Math.abs(this.val('Costo del Venduto',  y)),
      Math.abs(this.val('Marketing & Sales',  y)),
      Math.abs(this.val('Personale',          y)),
      Math.abs(this.val('G&A',                y)),
    ];
  });

  donutPlotOptions = computed(() => {
    const total = this.costDonutSeries().reduce((a, b) => a + b, 0);
    return {
      pie: {
        donut: {
          size: '65%',
          labels: {
            show: true,
            name: { show: true, fontFamily: FONT, fontSize: '12px', color: '#71717a' },
            value: { show: true, fontFamily: FONT, fontSize: '18px', fontWeight: '700', color: this.isDark() ? '#f4f4f5' : '#18181b',
                     formatter: (val: string) => fmtK(parseFloat(val)) },
            total: { show: true, label: 'Tot. Costi', fontFamily: FONT, fontSize: '11px', color: this.isDark() ? '#a1a1aa' : '#71717a',
                     formatter: () => fmtK(total) },
          },
        },
      },
    };
  });

  // ── Chart 4: Margin Lines ──────────────────────────────────────────────────

  marginLineSeries = computed(() => {
    const pct = (num: number, den: number) => den ? +((num / den) * 100).toFixed(1) : 0;
    const ys: YearFilter[] = [1, 2, 3];
    return [
      { name: 'Gross Margin %',  data: ys.map(y => pct(this.val('Gross Profit', y),  this.val('Ricavi Totali', y))) },
      { name: 'EBITDA Margin %', data: ys.map(y => pct(this.val('EBITDA', y),        this.val('Ricavi Totali', y))) },
      { name: 'Net Margin %',    data: ys.map(y => pct(this.val('Utile Netto', y),   this.val('Ricavi Totali', y))) },
    ];
  });

  // ── Chart 5: Stacked Cost Bar ──────────────────────────────────────────────

  stackedCostSeries = computed(() => {
    const ys: YearFilter[] = [1, 2, 3];
    return [
      { name: 'COGS',      data: ys.map(y => Math.abs(this.val('Costo del Venduto', y))) },
      { name: 'Marketing', data: ys.map(y => Math.abs(this.val('Marketing & Sales', y))) },
      { name: 'Personale', data: ys.map(y => Math.abs(this.val('Personale', y))) },
      { name: 'G&A',       data: ys.map(y => Math.abs(this.val('G&A', y))) },
    ];
  });

  // ── Chart 6: Radial ────────────────────────────────────────────────────────

  radialSeries = computed((): number[] => {
    const y = this.selectedYear();
    const ricavi = this.val('Ricavi Totali', y);
    if (!ricavi) return [0, 0, 0];
    const clamp = (v: number) => Math.max(-100, Math.min(100, +v.toFixed(1)));
    return [
      clamp((this.val('Gross Profit', y)  / ricavi) * 100),
      clamp((this.val('EBITDA', y)        / ricavi) * 100),
      clamp((this.val('Utile Netto', y)   / ricavi) * 100),
    ];
  });

  radialFill = computed(() => ({
    type: 'gradient',
    gradient: {
      shade: 'dark',
      type: 'horizontal',
      gradientToColors: [COLORS.violet, COLORS.emerald, COLORS.amber],
      stops: [0, 100],
    },
  }));

  radialLegend = computed(() => {
    const vals = this.radialSeries();
    return [
      { label: 'Gross Margin',  color: COLORS.indigo,  value: vals[0] },
      { label: 'EBITDA Margin', color: COLORS.emerald, value: vals[1] },
      { label: 'Net Margin',    color: COLORS.amber,   value: vals[2] },
    ];
  });

  // ── Static chart configs ──────────────────────────────────────────────────

  revenueChart    = computed(() => makeBaseChart('bar', 300, this.isDark() ? '#a1a1aa' : '#71717a', { toolbar: { show: true, tools: { download: true } } }));
  cashFlowChart   = computed(() => ({ ...makeBaseChart('area', 250, this.isDark() ? '#a1a1aa' : '#71717a'), toolbar: { show: false }, zoom: { enabled: false } }));
  donutChart      = computed(() => ({ ...makeBaseChart('donut', 300, this.isDark() ? '#a1a1aa' : '#71717a'), toolbar: { show: false } }));
  lineChart       = computed(() => ({ ...makeBaseChart('line', 250, this.isDark() ? '#a1a1aa' : '#71717a'), toolbar: { show: false } }));
  stackedBarChart = computed(() => ({ ...makeBaseChart('bar', 250, this.isDark() ? '#a1a1aa' : '#71717a'), stacked: true, toolbar: { show: false } }));
  radialChart     = computed(() => ({ ...makeBaseChart('radialBar', 260, this.isDark() ? '#a1a1aa' : '#71717a'), toolbar: { show: false } }));
  gridConf        = computed(() => makeGrid(this.isDark()));

  readonly threeYearXAxis = {
    categories: ['Anno 1', 'Anno 2', 'Anno 3'],
    labels: { style: { fontFamily: FONT, fontSize: '12px', colors: '#a1a1aa' } },
    axisBorder: { show: false },
    axisTicks: { show: false },
  };

  readonly euroYAxis = {
    labels: {
      style: { fontFamily: FONT, fontSize: '11px', colors: '#a1a1aa' },
      formatter: (val: number) => fmtK(val),
    },
  };

  readonly pctYAxis = {
    labels: {
      style: { fontFamily: FONT, fontSize: '11px', colors: '#a1a1aa' },
      formatter: (val: number) => `${val.toFixed(0)}%`,
    },
  };

  readonly barPlotOptions = {
    bar: { horizontal: false, columnWidth: '60%', borderRadius: 6, borderRadiusApplication: 'end' as const },
  };

  readonly stackedBarPlotOptions = {
    bar: { horizontal: false, columnWidth: '55%', borderRadius: 4, borderRadiusApplication: 'end' as const },
  };

  readonly noDataLabels   = { enabled: false };
  readonly barStroke      = { show: true, width: 2, colors: ['transparent'] };
  readonly smoothStroke   = { curve: 'smooth' as const, width: 2.5 };
  readonly smoothStrokeThick = { curve: 'smooth' as const, width: [3, 3, 3] };
  readonly solidFill      = { opacity: 1 };
  readonly gradientFill   = { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.35, opacityTo: 0.03, stops: [0, 100] } };
  readonly legendTop      = { ...legendConfig, position: 'top' as const, horizontalAlign: 'left' as const };
  readonly legendBottom   = { ...legendConfig, position: 'bottom' as const };
  readonly dotMarkers     = { size: 0, hover: { size: 5, sizeOffset: 2 } };
  readonly roundMarkers   = { size: 5, strokeWidth: 2, hover: { size: 7 } };
  readonly radialStroke   = { lineCap: 'round' as const };

  readonly pctDataLabels = {
    enabled: true,
    formatter: (val: number) => `${val}%`,
    style: { fontFamily: FONT, fontSize: '11px', fontWeight: '600', colors: ['#71717a'] },
    background: { enabled: false },
  };

  readonly donutDataLabels = {
    enabled: true,
    formatter: (val: number) => `${Math.round(val)}%`,
    style: { fontFamily: FONT, fontSize: '11px', fontWeight: '600' },
    dropShadow: { enabled: false },
  };

  readonly euroTooltip = {
    theme: 'light',
    y: { formatter: (val: number) => fmtK(val) },
    style: { fontFamily: FONT },
  };

  readonly euroTooltipNonAxis = {
    theme: 'light',
    y: { formatter: (val: number) => fmtK(val) },
    style: { fontFamily: FONT },
  };

  readonly pctTooltip = {
    theme: 'light',
    y: { formatter: (val: number) => `${val}%` },
    style: { fontFamily: FONT },
  };

  zeroLineAnnotation = computed(() => ({
    yaxis: [{
      y: 0,
      borderColor: this.isDark() ? '#3f3f46' : '#e4e4e7',
      borderWidth: 1.5,
      strokeDashArray: 5,
      label: {
        text: 'Break-even',
        style: { background: this.isDark() ? '#27272a' : '#f4f4f5', color: '#a1a1aa', fontSize: '10px', fontFamily: FONT, padding: { left: 6, right: 6, top: 2, bottom: 2 } },
        position: 'right',
      },
    }],
  }));

  readonly radialPlotOptions = {
    radialBar: {
      hollow: { size: '35%', background: 'transparent' },
      track: { background: '#f4f4f5', margin: 6 },
      dataLabels: {
        name: { show: true, fontSize: '11px', fontFamily: FONT, color: '#a1a1aa', offsetY: -4 },
        value: { show: true, fontSize: '15px', fontFamily: "'JetBrains Mono', monospace", fontWeight: '700', color: this.isDark() ? '#f4f4f5' : '#18181b', offsetY: 4,
                 formatter: (val: number) => `${val}%` },
        total: {
          show: true,
          label: 'EBITDA',
          fontSize: '10px',
          fontFamily: FONT,
          color: '#a1a1aa',
          formatter: () => {
            const vals = this.radialSeries();
            return `${vals[1]}%`;
          },
        },
      },
    },
  };
}
