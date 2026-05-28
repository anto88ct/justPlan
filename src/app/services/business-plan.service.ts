import { Injectable, signal, computed } from '@angular/core';

export interface KpiData {
  fatturatoTotale: number;
  ebitda: number;
  utileNetto: number;
  cashRunway: number;
}

export interface CashFlowPoint {
  month: string;
  value: number;
}

export interface IncomeRow {
  label: string;
  anno1: number;
  anno2: number;
  anno3: number;
  isHighlight?: boolean;
  isCost?: boolean;
}

export interface SavedPlan {
  id: string;
  name: string;
  savedAt: Date;
  kpi: KpiData;
  incomeStatement: IncomeRow[];
  cashFlow: CashFlowPoint[];
}

@Injectable({ providedIn: 'root' })
export class BusinessPlanService {

  private readonly CALCULATED_ROWS = ['Gross Profit', 'EBITDA', 'Utile Netto'];

  private readonly baseKpi: KpiData = {
    fatturatoTotale: 485000,
    ebitda: 97000,
    utileNetto: 68000,
    cashRunway: 14,
  };

  private readonly baseCashFlow: CashFlowPoint[] = [
    { month: 'Gen', value: -15000 },
    { month: 'Feb', value: -8000 },
    { month: 'Mar', value: 5000 },
    { month: 'Apr', value: 12000 },
    { month: 'Mag', value: 18000 },
    { month: 'Giu', value: 25000 },
    { month: 'Lug', value: 22000 },
    { month: 'Ago', value: 30000 },
    { month: 'Set', value: 38000 },
    { month: 'Ott', value: 45000 },
    { month: 'Nov', value: 52000 },
    { month: 'Dic', value: 60000 },
  ];

  private readonly baseIncome: IncomeRow[] = [
    { label: 'Ricavi Totali',      anno1:  485000, anno2:  728000, anno3: 1092000, isHighlight: true },
    { label: 'Costo del Venduto',  anno1: -194000, anno2: -256000, anno3: -328000, isCost: true },
    { label: 'Gross Profit',       anno1:  291000, anno2:  472000, anno3:  764000, isHighlight: true },
    { label: 'Marketing & Sales',  anno1:  -48500, anno2:  -72800, anno3:  -87360, isCost: true },
    { label: 'Personale',          anno1: -120000, anno2: -180000, anno3: -240000, isCost: true },
    { label: 'G&A',                anno1:  -25500, anno2:  -41000, anno3:  -55000, isCost: true },
    { label: 'EBITDA',             anno1:   97000, anno2:  178200, anno3:  381640, isHighlight: true },
    { label: 'Ammortamenti',       anno1:  -15000, anno2:  -18000, anno3:  -22000, isCost: true },
    { label: 'Utile Netto',        anno1:   68000, anno2:  136200, anno3:  313640, isHighlight: true },
  ];

  readonly kpi = signal<KpiData>({ ...this.baseKpi });
  readonly cashFlow = signal<CashFlowPoint[]>(this.baseCashFlow.map(p => ({ ...p })));
  readonly incomeStatement = signal<IncomeRow[]>(this.baseIncome.map(r => ({ ...r })));
  readonly isAiUpdated = signal(false);

  readonly kpiDelta = computed(() => {
    if (!this.isAiUpdated()) return null;
    return { fatturato: '+18%', ebitda: '+15%', utile: '+22%', runway: '+4 mesi' };
  });

  readonly savedPlans = signal<SavedPlan[]>([
    {
      id: 'plan-001',
      name: 'TechHub Pro',
      savedAt: new Date('2025-01-15'),
      kpi: { fatturatoTotale: 892000, ebitda: 267000, utileNetto: 198000, cashRunway: 22 },
      cashFlow: [
        { month: 'Gen', value: 12000 }, { month: 'Feb', value: 28000 }, { month: 'Mar', value: 45000 },
        { month: 'Apr', value: 52000 }, { month: 'Mag', value: 68000 }, { month: 'Giu', value: 75000 },
        { month: 'Lug', value: 82000 }, { month: 'Ago', value: 88000 }, { month: 'Set', value: 95000 },
        { month: 'Ott', value: 102000 }, { month: 'Nov', value: 112000 }, { month: 'Dic', value: 125000 },
      ],
      incomeStatement: [
        { label: 'Ricavi Totali',     anno1:  892000, anno2: 1350000, anno3: 2100000, isHighlight: true },
        { label: 'Costo del Venduto', anno1: -312000, anno2: -405000, anno3: -525000, isCost: true },
        { label: 'Gross Profit',      anno1:  580000, anno2:  945000, anno3: 1575000, isHighlight: true },
        { label: 'Marketing & Sales', anno1:  -89200, anno2: -135000, anno3: -189000, isCost: true },
        { label: 'Personale',         anno1: -180000, anno2: -270000, anno3: -360000, isCost: true },
        { label: 'G&A',               anno1:  -43800, anno2:  -65000, anno3:  -82000, isCost: true },
        { label: 'EBITDA',            anno1:  267000, anno2:  475000, anno3:  944000, isHighlight: true },
        { label: 'Ammortamenti',      anno1:  -35000, anno2:  -42000, anno3:  -55000, isCost: true },
        { label: 'Utile Netto',       anno1:  198000, anno2:  375000, anno3:  793000, isHighlight: true },
      ],
    },
    {
      id: 'plan-002',
      name: 'FoodieApp',
      savedAt: new Date('2025-02-28'),
      kpi: { fatturatoTotale: 320000, ebitda: 45000, utileNetto: 22000, cashRunway: 9 },
      cashFlow: [
        { month: 'Gen', value: -22000 }, { month: 'Feb', value: -15000 }, { month: 'Mar', value: -5000 },
        { month: 'Apr', value: 8000 },  { month: 'Mag', value: 15000 },  { month: 'Giu', value: 22000 },
        { month: 'Lug', value: 18000 }, { month: 'Ago', value: 25000 },  { month: 'Set', value: 32000 },
        { month: 'Ott', value: 38000 }, { month: 'Nov', value: 45000 },  { month: 'Dic', value: 52000 },
      ],
      incomeStatement: [
        { label: 'Ricavi Totali',     anno1:  320000, anno2:  580000, anno3:  980000, isHighlight: true },
        { label: 'Costo del Venduto', anno1: -128000, anno2: -208000, anno3: -343000, isCost: true },
        { label: 'Gross Profit',      anno1:  192000, anno2:  372000, anno3:  637000, isHighlight: true },
        { label: 'Marketing & Sales', anno1:  -64000, anno2: -116000, anno3: -196000, isCost: true },
        { label: 'Personale',         anno1:  -72000, anno2: -108000, anno3: -162000, isCost: true },
        { label: 'G&A',               anno1:  -11000, anno2:  -20000, anno3:  -32000, isCost: true },
        { label: 'EBITDA',            anno1:   45000, anno2:  128000, anno3:  247000, isHighlight: true },
        { label: 'Ammortamenti',      anno1:  -12000, anno2:  -15000, anno3:  -18000, isCost: true },
        { label: 'Utile Netto',       anno1:   22000, anno2:  100000, anno3:  208000, isHighlight: true },
      ],
    },
    {
      id: 'plan-003',
      name: 'EcoStore',
      savedAt: new Date('2025-03-10'),
      kpi: { fatturatoTotale: 156000, ebitda: -28000, utileNetto: -42000, cashRunway: 6 },
      cashFlow: [
        { month: 'Gen', value: -35000 }, { month: 'Feb', value: -28000 }, { month: 'Mar', value: -18000 },
        { month: 'Apr', value: -8000 },  { month: 'Mag', value: 2000 },   { month: 'Giu', value: 8000 },
        { month: 'Lug', value: 5000 },   { month: 'Ago', value: 12000 },  { month: 'Set', value: 18000 },
        { month: 'Ott', value: 22000 },  { month: 'Nov', value: 28000 },  { month: 'Dic', value: 35000 },
      ],
      incomeStatement: [
        { label: 'Ricavi Totali',     anno1:  156000, anno2:  312000, anno3:  624000, isHighlight: true },
        { label: 'Costo del Venduto', anno1:  -93600, anno2: -156000, anno3: -280800, isCost: true },
        { label: 'Gross Profit',      anno1:   62400, anno2:  156000, anno3:  343200, isHighlight: true },
        { label: 'Marketing & Sales', anno1:  -46800, anno2:  -62400, anno3:  -93600, isCost: true },
        { label: 'Personale',         anno1:  -36000, anno2:  -72000, anno3: -108000, isCost: true },
        { label: 'G&A',               anno1:   -7600, anno2:  -12000, anno3:  -16000, isCost: true },
        { label: 'EBITDA',            anno1:  -28000, anno2:    9600, anno3:  125600, isHighlight: true },
        { label: 'Ammortamenti',      anno1:   -8000, anno2:  -10000, anno3:  -12000, isCost: true },
        { label: 'Utile Netto',       anno1:  -42000, anno2:    -400, anno3:  113600, isHighlight: true },
      ],
    },
  ]);

  isEditableRow(label: string): boolean {
    return !this.CALCULATED_ROWS.includes(label);
  }

  updateCell(rowLabel: string, year: 'anno1' | 'anno2' | 'anno3', value: number): void {
    this.incomeStatement.update(rows => {
      const updated = rows.map(r => r.label === rowLabel ? { ...r, [year]: value } : { ...r });
      return this.recompute(updated);
    });
    this.syncKpiFromStatement();
  }

  private recompute(rows: IncomeRow[]): IncomeRow[] {
    const r = rows.map(row => ({ ...row }));
    const by = (label: string) => r.find(row => row.label === label)!;

    const rev  = by('Ricavi Totali');
    const cogs = by('Costo del Venduto');
    const gp   = by('Gross Profit');
    const mktg = by('Marketing & Sales');
    const per  = by('Personale');
    const ga   = by('G&A');
    const ebi  = by('EBITDA');
    const amm  = by('Ammortamenti');
    const net  = by('Utile Netto');

    for (const y of ['anno1', 'anno2', 'anno3'] as const) {
      gp[y]  = rev[y] + cogs[y];
      ebi[y] = gp[y] + mktg[y] + per[y] + ga[y];
      net[y] = ebi[y] + amm[y];
    }

    return r;
  }

  private syncKpiFromStatement(): void {
    const income = this.incomeStatement();
    const get = (label: string) => income.find(r => r.label === label);
    this.kpi.update(k => ({
      ...k,
      fatturatoTotale: get('Ricavi Totali')?.anno1 ?? k.fatturatoTotale,
      ebitda:          get('EBITDA')?.anno1          ?? k.ebitda,
      utileNetto:      get('Utile Netto')?.anno1     ?? k.utileNetto,
    }));
  }

  savePlan(name?: string): void {
    const planName = name ?? `Business Plan ${new Date().toLocaleDateString('it-IT')}`;
    const newPlan: SavedPlan = {
      id: `plan-${Date.now()}`,
      name: planName,
      savedAt: new Date(),
      kpi: { ...this.kpi() },
      cashFlow: this.cashFlow().map(p => ({ ...p })),
      incomeStatement: this.incomeStatement().map(r => ({ ...r })),
    };
    this.savedPlans.update(plans => [newPlan, ...plans]);
  }

  loadPlan(plan: SavedPlan): void {
    this.kpi.set({ ...plan.kpi });
    this.cashFlow.set(plan.cashFlow.map(p => ({ ...p })));
    this.incomeStatement.set(plan.incomeStatement.map(r => ({ ...r })));
    this.isAiUpdated.set(false);
  }

  deletePlan(id: string): void {
    this.savedPlans.update(plans => plans.filter(p => p.id !== id));
  }

  applyAiScenario(): void {
    const m = 1.18;
    this.kpi.set({
      fatturatoTotale: Math.round(this.baseKpi.fatturatoTotale * m),
      ebitda:          Math.round(this.baseKpi.ebitda * 1.15),
      utileNetto:      Math.round(this.baseKpi.utileNetto * 1.22),
      cashRunway:      this.baseKpi.cashRunway + 4,
    });
    this.cashFlow.set(
      this.baseCashFlow.map(p => ({ ...p, value: Math.round(p.value * m) }))
    );
    this.incomeStatement.set(
      this.baseIncome.map(row => ({
        ...row,
        anno1: Math.round(row.anno1 * (row.anno1 >= 0 ? m : 1 / m)),
        anno2: Math.round(row.anno2 * (row.anno2 >= 0 ? m : 1 / m)),
        anno3: Math.round(row.anno3 * (row.anno3 >= 0 ? m : 1 / m)),
      }))
    );
    this.isAiUpdated.set(true);
  }

  reset(): void {
    this.kpi.set({ ...this.baseKpi });
    this.cashFlow.set(this.baseCashFlow.map(p => ({ ...p })));
    this.incomeStatement.set(this.baseIncome.map(r => ({ ...r })));
    this.isAiUpdated.set(false);
  }
}
