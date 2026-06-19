import { Injectable, signal, computed } from '@angular/core';

export interface KpiData {
  fatturatoTotale: number;
  ebitda: number;
  utileNetto: number;
  cashRunway: number;
  grossMarginPct?: number;
  ebitdaPct?: number;
  breakevenRevenue?: number;
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

export interface PlanVersionContributor {
  name: string;
  initials: string;
  avatarColor: string;
  lastEditedAt: Date;
}

export interface PlanVersion {
  id: string;
  name: string;
  color: string;
  status: 'bozza' | 'definitivo';
  savedAt: Date;
  kpi: KpiData;
  incomeStatement: IncomeRow[];
  cashFlow: CashFlowPoint[];
  contributors?: PlanVersionContributor[];
}

export interface SavedPlan {
  id: string;
  name: string;
  createdAt: Date;
  isCowork?: boolean;
  versions: PlanVersion[];
}

// ── Wizard input interfaces ──────────────────────────────────────────────────

export interface WizardConfig {
  projectName: string;
  startYear: number;
  iresRate: number;
  irapRate: number;
  badDebtPct: number;
  isNewStartup: boolean;
  initialCash: number;
  residualCredits: number;
  residualDebts: number;
}

export interface WizardProduct {
  name: string;
  unitPrice: number;
  volumeMode: 'linear' | 'monthly';
  linearStart: number;
  linearGrowthPct: number;
  monthlyVolumes: number[];
  collectionDelay: number;
  annualGrowthPct?: number;
}

export interface WizardEmployee {
  role: string;
  ral: number;
  fte: number;
  startMonth: number;
  startYear: number;
}

export interface WizardHrParams {
  inpsPct: number;
  inailPct: number;
  tfrPct: number;
  salaryMonths: number;
}

export interface WizardVariableCost {
  costType?: 'cogs' | 'opex';
  valueType: 'pct' | 'abs';
  value: number;
  paymentDelay: number;
}

export interface WizardFixedCost {
  category: string;
  monthlyBudget: number;
  paymentDelay: number;
}

export interface WizardCapex {
  category: string;
  cost: number;
  purchaseMonth: number;
  purchaseYear: number;
}

export interface WizardEquity {
  amount: number;
  month: number;
  year: number;
}

export interface WizardLoan {
  amount: number;
  month: number;
  year: number;
  interestRate: number;
  durationMonths: number;
  preAmortizationMonths: number;
  firstPaymentMonth: number;
  firstPaymentYear: number;
}

export interface WizardInput {
  config: WizardConfig;
  products: WizardProduct[];
  employees: WizardEmployee[];
  hrParams: WizardHrParams;
  variableCosts: WizardVariableCost[];
  fixedCosts: WizardFixedCost[];
  investments: WizardCapex[];
  equityInjections: WizardEquity[];
  loans: WizardLoan[];
}

// ─────────────────────────────────────────────────────────────────────────────

const AMMO_RATES: Record<string, number> = {
  fabbricati:   3,
  impianti:    15,
  attrezzature: 25,
  impianto:    20,
  rnd:         20,
};

const MONTHS_IT = ['Gen','Feb','Mar','Apr','Mag','Giu','Lug','Ago','Set','Ott','Nov','Dic'];

@Injectable({ providedIn: 'root' })
export class BusinessPlanService {

  private readonly CALCULATED_ROWS = ['Gross Profit', 'EBITDA', 'Imposte', 'Utile Netto'];

  private _taxRate  = 0.28;
  private _iresRate = 0.24;
  private _irapRate = 0.04;

  private _computedBase: { kpi: KpiData; cashFlow: CashFlowPoint[]; incomeStatement: IncomeRow[] } | null = null;

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
  readonly currentProjectName = signal<string>('');
  readonly currentStartYear = signal<number>(new Date().getFullYear());

  readonly kpiDelta = computed(() => {
    if (!this.isAiUpdated()) return null;
    return { fatturato: '+18%', ebitda: '+15%', utile: '+22%', runway: '+4 mesi' };
  });

  readonly currentPlanId = signal<string | null>(null);

  readonly savedPlans = signal<SavedPlan[]>([
    {
      id: 'plan-001',
      name: 'TechHub Pro',
      createdAt: new Date('2025-01-10'),
      isCowork: true,
      versions: [
        {
          id: 'v-001-1',
          name: 'Base Ottimistica',
          color: '#6366f1',
          status: 'definitivo',
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
          contributors: [
            { name: 'Marco Bianchi', initials: 'MB', avatarColor: '#6366f1', lastEditedAt: new Date('2025-01-15') },
            { name: 'Sara Neri', initials: 'SN', avatarColor: '#f59e0b', lastEditedAt: new Date('2025-01-14') },
          ],
        },
        {
          id: 'v-001-2',
          name: 'Scenario Prudente',
          color: '#10b981',
          status: 'definitivo',
          savedAt: new Date('2025-02-01'),
          kpi: { fatturatoTotale: 720000, ebitda: 180000, utileNetto: 130000, cashRunway: 18 },
          cashFlow: [
            { month: 'Gen', value: 5000 }, { month: 'Feb', value: 15000 }, { month: 'Mar', value: 30000 },
            { month: 'Apr', value: 38000 }, { month: 'Mag', value: 52000 }, { month: 'Giu', value: 60000 },
            { month: 'Lug', value: 65000 }, { month: 'Ago', value: 72000 }, { month: 'Set', value: 78000 },
            { month: 'Ott', value: 85000 }, { month: 'Nov', value: 92000 }, { month: 'Dic', value: 100000 },
          ],
          incomeStatement: [
            { label: 'Ricavi Totali',     anno1:  720000, anno2: 1080000, anno3: 1680000, isHighlight: true },
            { label: 'Costo del Venduto', anno1: -252000, anno2: -324000, anno3: -420000, isCost: true },
            { label: 'Gross Profit',      anno1:  468000, anno2:  756000, anno3: 1260000, isHighlight: true },
            { label: 'Marketing & Sales', anno1:  -72000, anno2: -108000, anno3: -151200, isCost: true },
            { label: 'Personale',         anno1: -180000, anno2: -270000, anno3: -360000, isCost: true },
            { label: 'G&A',               anno1:  -36000, anno2:  -54000, anno3:  -70000, isCost: true },
            { label: 'EBITDA',            anno1:  180000, anno2:  324000, anno3:  678800, isHighlight: true },
            { label: 'Ammortamenti',      anno1:  -28000, anno2:  -35000, anno3:  -44000, isCost: true },
            { label: 'Utile Netto',       anno1:  130000, anno2:  252000, anno3:  564000, isHighlight: true },
          ],
          contributors: [
            { name: 'Marco Bianchi', initials: 'MB', avatarColor: '#6366f1', lastEditedAt: new Date('2025-02-01') },
          ],
        },
        {
          id: 'v-001-3',
          name: 'Draft Revisione Q2',
          color: '#f59e0b',
          status: 'bozza',
          savedAt: new Date('2025-03-05'),
          kpi: { fatturatoTotale: 950000, ebitda: 290000, utileNetto: 210000, cashRunway: 24 },
          cashFlow: [
            { month: 'Gen', value: 18000 }, { month: 'Feb', value: 35000 }, { month: 'Mar', value: 55000 },
            { month: 'Apr', value: 65000 }, { month: 'Mag', value: 80000 }, { month: 'Giu', value: 88000 },
            { month: 'Lug', value: 95000 }, { month: 'Ago', value: 102000 }, { month: 'Set', value: 110000 },
            { month: 'Ott', value: 118000 }, { month: 'Nov', value: 128000 }, { month: 'Dic', value: 140000 },
          ],
          incomeStatement: [
            { label: 'Ricavi Totali',     anno1:  950000, anno2: 1450000, anno3: 2250000, isHighlight: true },
            { label: 'Costo del Venduto', anno1: -332500, anno2: -435000, anno3: -562500, isCost: true },
            { label: 'Gross Profit',      anno1:  617500, anno2: 1015000, anno3: 1687500, isHighlight: true },
            { label: 'Marketing & Sales', anno1:  -95000, anno2: -145000, anno3: -202500, isCost: true },
            { label: 'Personale',         anno1: -192000, anno2: -288000, anno3: -384000, isCost: true },
            { label: 'G&A',               anno1:  -40500, anno2:  -68000, anno3:  -88000, isCost: true },
            { label: 'EBITDA',            anno1:  290000, anno2:  514000, anno3: 1013000, isHighlight: true },
            { label: 'Ammortamenti',      anno1:  -38000, anno2:  -46000, anno3:  -60000, isCost: true },
            { label: 'Utile Netto',       anno1:  210000, anno2:  408000, anno3:  848000, isHighlight: true },
          ],
          contributors: [
            { name: 'Marco Bianchi', initials: 'MB', avatarColor: '#6366f1', lastEditedAt: new Date('2025-03-05') },
            { name: 'Sara Neri', initials: 'SN', avatarColor: '#f59e0b', lastEditedAt: new Date('2025-03-04') },
            { name: 'Luca Verdi', initials: 'LV', avatarColor: '#10b981', lastEditedAt: new Date('2025-03-03') },
          ],
        },
      ],
    },
    {
      id: 'plan-002',
      name: 'FoodieApp',
      createdAt: new Date('2025-02-25'),
      isCowork: false,
      versions: [
        {
          id: 'v-002-1',
          name: 'Versione Iniziale',
          color: '#f97316',
          status: 'definitivo',
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
      ],
    },
    {
      id: 'plan-003',
      name: 'EcoStore',
      createdAt: new Date('2025-03-08'),
      isCowork: false,
      versions: [
        {
          id: 'v-003-1',
          name: 'Piano di Lancio',
          color: '#8b5cf6',
          status: 'definitivo',
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
    const by = (label: string) => r.find(row => row.label === label);

    const rev   = by('Ricavi Totali')!;
    const cogs  = by('Costo del Venduto')!;
    const gp    = by('Gross Profit')!;
    const mktg  = by('Marketing & Sales')!;
    const per   = by('Personale')!;
    const ga    = by('G&A')!;
    const opexV = by('OPEX Variabili');
    const sval  = by('Svalutazione Crediti');
    const ebi   = by('EBITDA')!;
    const amm   = by('Ammortamenti')!;
    const fin   = by('Oneri Finanziari');
    const tax   = by('Imposte');
    const net   = by('Utile Netto')!;

    for (const y of ['anno1', 'anno2', 'anno3'] as const) {
      gp[y]  = rev[y] + cogs[y];
      ebi[y] = gp[y] + mktg[y] + per[y] + ga[y]
             + (opexV ? opexV[y] : 0)
             + (sval  ? sval[y]  : 0);
      const ebt = ebi[y] + amm[y] + (fin ? fin[y] : 0);
      if (tax) tax[y] = -Math.round(Math.max(0, ebt) * this._taxRate);
      net[y] = ebt + (tax ? tax[y] : 0);
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

  // ── Full financial engine ─────────────────────────────────────────────────

  computeFromWizard(input: WizardInput): void {
    const { config, products, employees, hrParams, variableCosts, fixedCosts, investments, equityInjections, loans } = input;
    const N = 36;

    const absMonth = (year: number, month: number) => (year - config.startYear) * 12 + (month - 1);
    const sumY = (arr: number[], y: number) =>
      arr.slice(y * 12, (y + 1) * 12).reduce((s, v) => s + v, 0);

    // ── Revenue ────────────────────────────────────────────────────────────
    const revenue       = new Array(N).fill(0) as number[];
    const cashRevenue   = new Array(N).fill(0) as number[];

    for (const p of products) {
      const delayMonths = Math.round(p.collectionDelay / 30);
      for (let m = 0; m < N; m++) {
        let vol: number;
        if (p.volumeMode === 'linear') {
          vol = Math.round(p.linearStart * Math.pow(1 + p.linearGrowthPct / 100, m));
        } else {
          // fix 2.3: apply annual growth factor per year on monthly pattern
          const yearIdx    = Math.floor(m / 12);
          const baseVol    = p.monthlyVolumes[m % 12] ?? 0;
          const annGrowth  = p.annualGrowthPct ?? 0;
          vol = Math.round(baseVol * Math.pow(1 + annGrowth / 100, yearIdx));
        }
        revenue[m] += vol * p.unitPrice;
        const cashM = m + delayMonths;
        if (cashM < N) cashRevenue[cashM] += vol * p.unitPrice;
      }
    }

    // Bad debt reduces cash collections only (CE row added separately below)
    const badDebtFactor = 1 - config.badDebtPct / 100;
    for (let m = 0; m < N; m++) cashRevenue[m] = Math.round(cashRevenue[m] * badDebtFactor);

    // ── HR ─────────────────────────────────────────────────────────────────
    const hrMult = (1 + hrParams.inpsPct / 100 + hrParams.inailPct / 100 + hrParams.tfrPct / 100)
                 * (hrParams.salaryMonths / 12);
    const hrCosts = new Array(N).fill(0) as number[];

    for (const e of employees) {
      const startAbs    = absMonth(e.startYear, e.startMonth);
      const monthlyCost = (e.ral * e.fte * hrMult) / 12;
      for (let m = Math.max(0, startAbs); m < N; m++) {
        hrCosts[m] += monthlyCost;
      }
    }

    // ── Variable costs: COGS vs OPEX (fix 4.2) ────────────────────────────
    const varCogs      = new Array(N).fill(0) as number[];
    const varOpex      = new Array(N).fill(0) as number[];
    const cashVarCosts = new Array(N).fill(0) as number[];

    for (const vc of variableCosts) {
      const delayMonths = Math.round(vc.paymentDelay / 30);
      const isCogs      = (vc.costType ?? 'opex') === 'cogs';
      for (let m = 0; m < N; m++) {
        const cost = vc.valueType === 'pct' ? revenue[m] * vc.value / 100 : vc.value / 12;
        if (isCogs) varCogs[m] += cost; else varOpex[m] += cost;
        const cashM = m + delayMonths;
        if (cashM < N) cashVarCosts[cashM] += cost;
      }
    }

    // ── Fixed costs ────────────────────────────────────────────────────────
    const mktgCosts      = new Array(N).fill(0) as number[];
    const gaCosts        = new Array(N).fill(0) as number[];
    const cashFixedCosts = new Array(N).fill(0) as number[];

    for (const fc of fixedCosts) {
      const delayMonths = Math.round(fc.paymentDelay / 30);
      const monthly     = fc.monthlyBudget;
      for (let m = 0; m < N; m++) {
        if (fc.category === 'marketing' || fc.category === 'commerciali') {
          mktgCosts[m] += monthly;
        } else {
          gaCosts[m] += monthly;
        }
        const cashM = m + delayMonths;
        if (cashM < N) cashFixedCosts[cashM] += monthly;
      }
    }

    // ── CAPEX & Depreciation (fix 5.1: half rate first fiscal year) ────────
    const capexPayments = new Array(N).fill(0) as number[];
    const depreciation  = new Array(N).fill(0) as number[];

    for (const inv of investments) {
      const purchAbs = absMonth(inv.purchaseYear, inv.purchaseMonth);
      if (purchAbs >= 0 && purchAbs < N) {
        capexPayments[purchAbs] += inv.cost;
        const annualRate       = (AMMO_RATES[inv.category] ?? 0) / 100;
        const fullMonthlyDep   = (inv.cost * annualRate) / 12;
        const halfMonthlyDep   = fullMonthlyDep / 2;
        const firstFiscalYrEnd = (Math.floor(purchAbs / 12) + 1) * 12;
        for (let m = purchAbs; m < N; m++) {
          depreciation[m] += m < firstFiscalYrEnd ? halfMonthlyDep : fullMonthlyDep;
        }
      }
    }

    // ── Loans ──────────────────────────────────────────────────────────────
    const loanDisbursements = new Array(N).fill(0) as number[];
    const interestExpense   = new Array(N).fill(0) as number[];
    const loanRepayments    = new Array(N).fill(0) as number[];

    for (const loan of loans) {
      const disbAbs  = absMonth(loan.year, loan.month);
      if (disbAbs >= 0 && disbAbs < N) loanDisbursements[disbAbs] += loan.amount;

      const firstAbs = absMonth(loan.firstPaymentYear, loan.firstPaymentMonth);
      const r        = loan.interestRate / 100 / 12;
      const nAmort   = Math.max(0, loan.durationMonths - loan.preAmortizationMonths);
      const installment = nAmort > 0
        ? (r === 0
            ? Math.round(loan.amount / nAmort)
            : Math.round(loan.amount * r * Math.pow(1 + r, nAmort) / (Math.pow(1 + r, nAmort) - 1)))
        : 0;

      let balance = loan.amount;

      // Pre-amortization: interest only
      for (let i = 0; i < loan.preAmortizationMonths; i++) {
        const m = firstAbs + i;
        if (m >= 0 && m < N) {
          const interest = Math.round(balance * r);
          interestExpense[m] += interest;
          loanRepayments[m]  += interest;
        }
      }

      // Amortization: full installment (fix 6.1: french amortization preserved)
      for (let i = 0; i < nAmort; i++) {
        const m = firstAbs + loan.preAmortizationMonths + i;
        if (m >= 0 && m < N) {
          const interest  = Math.round(balance * r);
          const principal = Math.max(0, installment - interest);
          interestExpense[m] += interest;
          loanRepayments[m]  += installment;
          balance = Math.max(0, balance - principal);
        }
      }
    }

    // ── Equity injections ──────────────────────────────────────────────────
    const equityCashIn = new Array(N).fill(0) as number[];

    for (const eq of equityInjections) {
      const eqAbs = absMonth(eq.year, eq.month);
      if (eqAbs >= 0 && eqAbs < N) equityCashIn[eqAbs] += eq.amount;
    }

    // ── Annual P&L aggregation ─────────────────────────────────────────────
    this._iresRate = config.iresRate / 100;
    this._irapRate = config.irapRate / 100;
    this._taxRate  = this._iresRate + this._irapRate; // kept for recompute compat

    const annualRevenue  = [0, 1, 2].map(y => Math.round(sumY(revenue, y)));
    const annualVarCogs  = [0, 1, 2].map(y => -Math.round(sumY(varCogs, y)));
    const annualVarOpex  = [0, 1, 2].map(y => -Math.round(sumY(varOpex, y)));
    const annualBadDebt  = [0, 1, 2].map(y => -Math.round(annualRevenue[y] * config.badDebtPct / 100));
    const annualMktg     = [0, 1, 2].map(y => -Math.round(sumY(mktgCosts, y)));
    const annualPersonal = [0, 1, 2].map(y => -Math.round(sumY(hrCosts, y)));
    const annualGA       = [0, 1, 2].map(y => -Math.round(sumY(gaCosts, y)));
    const annualAmm      = [0, 1, 2].map(y => -Math.round(sumY(depreciation, y)));
    const annualFin      = [0, 1, 2].map(y => -Math.round(sumY(interestExpense, y)));

    const annualGP  = [0, 1, 2].map(y => annualRevenue[y] + annualVarCogs[y]);
    const annualEbi = [0, 1, 2].map(y =>
      annualGP[y] + annualBadDebt[y] + annualMktg[y] + annualPersonal[y] + annualGA[y] + annualVarOpex[y]
    );
    const annualEBT = [0, 1, 2].map(y => annualEbi[y] + annualAmm[y] + annualFin[y]);

    // fix 1.1: IRAP base excludes personale and oneri finanziari
    const annualIrap = [0, 1, 2].map(y => {
      const irapBase = annualRevenue[y]
        + annualVarCogs[y]
        + annualVarOpex[y]
        + annualBadDebt[y]
        + annualMktg[y]
        + annualGA[y]
        + annualAmm[y]; // annualPersonal and annualFin intentionally excluded
      return -Math.round(Math.max(0, irapBase) * this._irapRate);
    });

    // fix 1.2: IRES with loss carryforward (100% offset for startup/first 3yr, 80% otherwise)
    let lossCarryforward = 0;
    const annualIres: number[] = [];
    for (let y = 0; y < 3; y++) {
      const ebt = annualEBT[y];
      if (ebt <= 0) {
        lossCarryforward += Math.abs(ebt);
        annualIres.push(0);
      } else {
        const maxOffset = config.isNewStartup && y < 3 ? lossCarryforward : lossCarryforward * 0.8;
        const offset    = Math.min(maxOffset, ebt);
        lossCarryforward = Math.max(0, lossCarryforward - offset);
        annualIres.push(-Math.round((ebt - offset) * this._iresRate));
      }
    }

    const annualTax = [0, 1, 2].map(y => annualIres[y] + annualIrap[y]);
    const annualNet = [0, 1, 2].map(y => annualEBT[y] + annualTax[y]);

    // ── Income statement ───────────────────────────────────────────────────
    const incomeRows: IncomeRow[] = [
      { label: 'Ricavi Totali',     anno1: annualRevenue[0],  anno2: annualRevenue[1],  anno3: annualRevenue[2],  isHighlight: true },
      { label: 'Costo del Venduto', anno1: annualVarCogs[0],  anno2: annualVarCogs[1],  anno3: annualVarCogs[2],  isCost: true },
      { label: 'Gross Profit',      anno1: annualGP[0],       anno2: annualGP[1],       anno3: annualGP[2],       isHighlight: true },
      { label: 'Marketing & Sales', anno1: annualMktg[0],     anno2: annualMktg[1],     anno3: annualMktg[2],     isCost: true },
      { label: 'Personale',         anno1: annualPersonal[0], anno2: annualPersonal[1], anno3: annualPersonal[2], isCost: true },
      { label: 'G&A',               anno1: annualGA[0],       anno2: annualGA[1],       anno3: annualGA[2],       isCost: true },
    ];

    // fix 4.2: show OPEX variabili as separate row when classified as such
    if (annualVarOpex.some(v => v !== 0)) {
      incomeRows.push({ label: 'OPEX Variabili', anno1: annualVarOpex[0], anno2: annualVarOpex[1], anno3: annualVarOpex[2], isCost: true });
    }

    // fix 1.4: bad debt now appears in CE as accrual
    if (config.badDebtPct > 0) {
      incomeRows.push({ label: 'Svalutazione Crediti', anno1: annualBadDebt[0], anno2: annualBadDebt[1], anno3: annualBadDebt[2], isCost: true });
    }

    incomeRows.push(
      { label: 'EBITDA',       anno1: annualEbi[0], anno2: annualEbi[1], anno3: annualEbi[2], isHighlight: true },
      { label: 'Ammortamenti', anno1: annualAmm[0], anno2: annualAmm[1], anno3: annualAmm[2], isCost: true },
    );

    if (loans.length > 0) {
      incomeRows.push({ label: 'Oneri Finanziari', anno1: annualFin[0], anno2: annualFin[1], anno3: annualFin[2], isCost: true });
    }

    incomeRows.push(
      { label: 'Imposte',     anno1: annualTax[0], anno2: annualTax[1], anno3: annualTax[2], isCost: true },
      { label: 'Utile Netto', anno1: annualNet[0], anno2: annualNet[1], anno3: annualNet[2], isHighlight: true },
    );

    // ── Cash flow 36 months (fix 7.2) ─────────────────────────────────────
    let cash = config.isNewStartup ? 0 : config.initialCash + config.residualCredits - config.residualDebts;
    const cashFlowPoints: CashFlowPoint[] = [];

    for (let m = 0; m < N; m++) {
      cash += equityCashIn[m]
            + loanDisbursements[m]
            + cashRevenue[m]
            - hrCosts[m]
            - cashVarCosts[m]
            - cashFixedCosts[m]
            - capexPayments[m]
            - loanRepayments[m];
      const yr    = config.startYear + Math.floor(m / 12);
      const label = `${MONTHS_IT[m % 12]} '${String(yr).slice(-2)}`;
      cashFlowPoints.push({ month: label, value: Math.round(cash) });
    }

    // Cash runway: first month where cumulative cash goes negative
    const firstNeg = cashFlowPoints.findIndex(p => p.value <= 0);
    const cashRunway = firstNeg === -1 ? 36 : firstNeg;

    // ── Investor KPIs (fix 7.3) ────────────────────────────────────────────
    const rev1           = annualRevenue[0];
    const gp1            = annualGP[0];
    const ebi1           = annualEbi[0];
    const totalVarCosts1 = Math.abs(annualVarCogs[0]) + Math.abs(annualVarOpex[0]);
    const fixedBase1     = Math.abs(annualPersonal[0]) + Math.abs(annualMktg[0]) + Math.abs(annualGA[0])
                         + Math.abs(annualAmm[0]) + Math.abs(annualFin[0]);

    const grossMarginPct    = rev1 > 0 ? Math.round(gp1 / rev1 * 1000) / 10 : 0;
    const ebitdaPct         = rev1 > 0 ? Math.round(ebi1 / rev1 * 1000) / 10 : 0;
    const contribMargin     = rev1 > 0 ? (rev1 - totalVarCosts1) / rev1 : 1;
    const breakevenRevenue  = contribMargin > 0 ? Math.round(fixedBase1 / contribMargin) : 0;

    // ── KPI ────────────────────────────────────────────────────────────────
    const kpiResult: KpiData = {
      fatturatoTotale: rev1,
      ebitda:          ebi1,
      utileNetto:      annualNet[0],
      cashRunway,
      grossMarginPct,
      ebitdaPct,
      breakevenRevenue,
    };

    // ── Store project metadata ────────────────────────────────────────────
    this.currentProjectName.set(config.projectName || 'Business Plan');
    this.currentStartYear.set(config.startYear);

    // ── Persist as base for reset/AI scenario ──────────────────────────────
    this._computedBase = {
      kpi:             { ...kpiResult },
      cashFlow:        cashFlowPoints.map(p => ({ ...p })),
      incomeStatement: incomeRows.map(r => ({ ...r })),
    };

    this.kpi.set(kpiResult);
    this.cashFlow.set(cashFlowPoints);
    this.incomeStatement.set(incomeRows);
    this.isAiUpdated.set(false);
  }

  // ── Plan / version helpers ───────────────────────────────────────────────

  private _versionColors = ['#6366f1', '#10b981', '#f59e0b', '#f97316', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];
  private _nextVersionColor(planId: string): string {
    const plan = this.savedPlans().find(p => p.id === planId);
    const used = plan?.versions.map(v => v.color) ?? [];
    return this._versionColors.find(c => !used.includes(c)) ?? this._versionColors[0];
  }

  createDraftPlan(name: string): string {
    const planId = `plan-${Date.now()}`;
    const versionId = `v-${Date.now()}`;
    const newPlan: SavedPlan = {
      id: planId,
      name,
      createdAt: new Date(),
      isCowork: false,
      versions: [{
        id: versionId,
        name: 'Bozza',
        color: '#6366f1',
        status: 'bozza',
        savedAt: new Date(),
        kpi: { ...this.kpi() },
        cashFlow: this.cashFlow().map(p => ({ ...p })),
        incomeStatement: this.incomeStatement().map(r => ({ ...r })),
      }],
    };
    this.savedPlans.update(plans => [newPlan, ...plans]);
    this.currentPlanId.set(planId);
    return planId;
  }

  savePlan(name?: string): void {
    const planName = name || this.currentProjectName() || `Business Plan ${new Date().toLocaleDateString('it-IT')}`;
    const existing = this.currentPlanId();
    if (existing) {
      this.autoSaveDraft(existing);
      return;
    }
    this.createDraftPlan(planName);
  }

  autoSaveDraft(planId: string): void {
    this.savedPlans.update(plans => plans.map(p => {
      if (p.id !== planId) return p;
      const draftIdx = p.versions.findIndex(v => v.status === 'bozza');
      const updatedVersion: PlanVersion = {
        id: draftIdx >= 0 ? p.versions[draftIdx].id : `v-${Date.now()}`,
        name: draftIdx >= 0 ? p.versions[draftIdx].name : 'Bozza',
        color: draftIdx >= 0 ? p.versions[draftIdx].color : '#6366f1',
        status: 'bozza',
        savedAt: new Date(),
        kpi: { ...this.kpi() },
        cashFlow: this.cashFlow().map(pt => ({ ...pt })),
        incomeStatement: this.incomeStatement().map(r => ({ ...r })),
        contributors: draftIdx >= 0 ? p.versions[draftIdx].contributors : undefined,
      };
      const versions = draftIdx >= 0
        ? p.versions.map((v, i) => i === draftIdx ? updatedVersion : v)
        : [...p.versions, updatedVersion];
      return { ...p, versions };
    }));
  }

  saveRevision(versionName?: string): void {
    const planId = this.currentPlanId();
    if (!planId) {
      const newId = this.createDraftPlan(this.currentProjectName() || 'Business Plan');
      this._finalizeRevision(newId, versionName);
      return;
    }
    this._finalizeRevision(planId, versionName);
  }

  private _finalizeRevision(planId: string, versionName?: string): void {
    const color = this._nextVersionColor(planId);
    const plan = this.savedPlans().find(p => p.id === planId);
    const revNum = (plan?.versions.filter(v => v.status === 'definitivo').length ?? 0) + 1;
    const newVersion: PlanVersion = {
      id: `v-${Date.now()}`,
      name: versionName ?? `Revisione ${revNum}`,
      color,
      status: 'definitivo',
      savedAt: new Date(),
      kpi: { ...this.kpi() },
      cashFlow: this.cashFlow().map(p => ({ ...p })),
      incomeStatement: this.incomeStatement().map(r => ({ ...r })),
    };
    this.savedPlans.update(plans => plans.map(p =>
      p.id === planId ? { ...p, versions: [...p.versions, newVersion] } : p
    ));
  }

  loadVersion(version: PlanVersion, planId: string): void {
    this.kpi.set({ ...version.kpi });
    this.cashFlow.set(version.cashFlow.map(p => ({ ...p })));
    this.incomeStatement.set(version.incomeStatement.map(r => ({ ...r })));
    this.isAiUpdated.set(false);
    this.currentPlanId.set(planId);
  }

  loadPlan(plan: SavedPlan): void {
    const latest = plan.versions[plan.versions.length - 1];
    if (latest) this.loadVersion(latest, plan.id);
  }

  deletePlan(id: string): void {
    this.savedPlans.update(plans => plans.filter(p => p.id !== id));
    if (this.currentPlanId() === id) this.currentPlanId.set(null);
  }

  deleteVersion(planId: string, versionId: string): void {
    this.savedPlans.update(plans => plans.map(p => {
      if (p.id !== planId) return p;
      const versions = p.versions.filter(v => v.id !== versionId);
      return { ...p, versions };
    }));
  }

  updateVersionName(planId: string, versionId: string, name: string): void {
    this.savedPlans.update(plans => plans.map(p => {
      if (p.id !== planId) return p;
      return { ...p, versions: p.versions.map(v => v.id === versionId ? { ...v, name } : v) };
    }));
  }

  updateVersionColor(planId: string, versionId: string, color: string): void {
    this.savedPlans.update(plans => plans.map(p => {
      if (p.id !== planId) return p;
      return { ...p, versions: p.versions.map(v => v.id === versionId ? { ...v, color } : v) };
    }));
  }

  applyAiScenario(): void {
    const m = 1.18;
    const curKpi = this.kpi();
    this.kpi.set({
      fatturatoTotale: Math.round(curKpi.fatturatoTotale * m),
      ebitda:          Math.round(curKpi.ebitda * 1.15),
      utileNetto:      Math.round(curKpi.utileNetto * 1.22),
      cashRunway:      Math.round(curKpi.cashRunway * 1.3),
    });
    this.cashFlow.update(cf => cf.map(p => ({ ...p, value: Math.round(p.value * m) })));
    this.incomeStatement.update(rows => {
      const scaled = rows.map(row => {
        if (this.CALCULATED_ROWS.includes(row.label)) return { ...row };
        return {
          ...row,
          anno1: Math.round(row.anno1 * (row.anno1 >= 0 ? m : 1 / m)),
          anno2: Math.round(row.anno2 * (row.anno2 >= 0 ? m : 1 / m)),
          anno3: Math.round(row.anno3 * (row.anno3 >= 0 ? m : 1 / m)),
        };
      });
      return this.recompute(scaled);
    });
    this.isAiUpdated.set(true);
  }

  reset(): void {
    if (this._computedBase) {
      this.kpi.set({ ...this._computedBase.kpi });
      this.cashFlow.set(this._computedBase.cashFlow.map(p => ({ ...p })));
      this.incomeStatement.set(this._computedBase.incomeStatement.map(r => ({ ...r })));
    } else {
      this.kpi.set({ ...this.baseKpi });
      this.cashFlow.set(this.baseCashFlow.map(p => ({ ...p })));
      this.incomeStatement.set(this.baseIncome.map(r => ({ ...r })));
    }
    this.isAiUpdated.set(false);
  }
}
