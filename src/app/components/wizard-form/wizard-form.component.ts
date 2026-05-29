import { Component, output, signal, computed, inject } from '@angular/core';
import { CommonModule, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BusinessPlanService, WizardInput } from '../../services/business-plan.service';

interface ProductLine {
  id: number;
  name: string;
  unitPrice: number;
  volumeMode: 'linear' | 'monthly';
  linearStart: number;
  linearGrowthPct: number;
  monthlyVolumes: number[];
  collectionDelay: number;
}

interface Employee {
  id: number;
  role: string;
  ral: number;
  fte: number;
  startMonth: number;
  startYear: number;
}

interface VariableCost {
  id: number;
  description: string;
  valueType: 'pct' | 'abs';
  value: number;
  vatRate: number;
  paymentDelay: number;
}

interface FixedCost {
  id: number;
  description: string;
  category: string;
  monthlyBudget: number;
  vatRate: number;
  paymentDelay: number;
}

interface CapexItem {
  id: number;
  description: string;
  category: string;
  cost: number;
  purchaseMonth: number;
  purchaseYear: number;
}

interface EquityInjection {
  id: number;
  amount: number;
  month: number;
  year: number;
}

interface LoanItem {
  id: number;
  amount: number;
  month: number;
  year: number;
  interestRate: number;
  durationMonths: number;
  preAmortizationMonths: number;
  firstPaymentMonth: number;
  firstPaymentYear: number;
}

@Component({
  selector: 'app-wizard-form',
  standalone: true,
  host: { class: 'flex flex-col h-full overflow-hidden bg-white' },
  imports: [CommonModule, NgClass, FormsModule],
  styles: [`
    :host { display: flex; flex-direction: column; height: 100%; overflow: hidden; }

    .step-track-fill { transition: width 0.6s cubic-bezier(0.65, 0, 0.35, 1); }

    @keyframes stepFwd {
      from { opacity: 0; transform: translateX(28px); }
      to   { opacity: 1; transform: translateX(0); }
    }
    @keyframes stepBwd {
      from { opacity: 0; transform: translateX(-28px); }
      to   { opacity: 1; transform: translateX(0); }
    }
    .step-fwd { animation: stepFwd 0.38s cubic-bezier(0.16, 1, 0.3, 1) both; }
    .step-bwd { animation: stepBwd 0.38s cubic-bezier(0.16, 1, 0.3, 1) both; }

    input[type=range] {
      -webkit-appearance: none; height: 4px; border-radius: 2px;
      outline: none; cursor: pointer;
    }
    input[type=range]::-webkit-slider-thumb {
      -webkit-appearance: none; width: 18px; height: 18px; border-radius: 50%;
      background: #4f46e5; border: 2px solid white;
      box-shadow: 0 1px 4px rgba(79,70,229,0.4); cursor: pointer; transition: transform 0.15s;
    }
    input[type=range]::-webkit-slider-thumb:hover { transform: scale(1.15); }

    .inp {
      width: 100%; padding: 10px 12px; font-size: 14px; color: #18181b;
      background: #fafafa; border: 1.5px solid #e4e4e7; border-radius: 10px;
      outline: none; transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
      font-family: 'Outfit', sans-serif;
    }
    .inp:focus { border-color: #6366f1; background: white; box-shadow: 0 0 0 3px rgba(99,102,241,0.12); }
    .inp::placeholder { color: #a1a1aa; }
    .inp-prefix { padding-left: 32px; }
    .inp-suffix { padding-right: 40px; }
    select.inp { cursor: pointer; }

    input[type=number]::-webkit-inner-spin-button,
    input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
    input[type=number] { -moz-appearance: textfield; }

    .item-card {
      background: #fafafa; border: 1.5px solid #e4e4e7;
      border-radius: 16px; padding: 16px; position: relative;
    }

    .seg-btn {
      flex: 1; padding: 7px 10px; font-size: 12px; font-weight: 600;
      border-radius: 8px; transition: all 0.2s; cursor: pointer;
      font-family: 'Outfit', sans-serif; white-space: nowrap;
    }
    .seg-active { background: white; color: #4f46e5; box-shadow: 0 1px 4px rgba(0,0,0,0.1); }
    .seg-inactive { background: transparent; color: #a1a1aa; }

    .remove-btn {
      position: absolute; top: 10px; right: 10px;
      width: 22px; height: 22px; border-radius: 50%;
      background: #fee2e2; color: #ef4444; cursor: pointer;
      transition: background 0.15s; display: flex; align-items: center; justify-content: center;
      border: none;
    }
    .remove-btn:hover { background: #fecaca; }

    .add-btn {
      display: flex; align-items: center; gap: 6px; padding: 9px 14px;
      border-radius: 10px; border: 1.5px dashed #c7d2fe; color: #6366f1;
      font-size: 12px; font-weight: 600; font-family: 'Outfit', sans-serif;
      background: #f5f3ff; cursor: pointer; transition: all 0.2s; width: 100%;
      justify-content: center;
    }
    .add-btn:hover { background: #ede9fe; border-color: #6366f1; }
    .add-btn-amber { border-color: #fde68a; background: #fffbeb; color: #d97706; }
    .add-btn-amber:hover { background: #fef3c7; border-color: #f59e0b; }
    .add-btn-sky { border-color: #bae6fd; background: #f0f9ff; color: #0284c7; }
    .add-btn-sky:hover { background: #e0f2fe; border-color: #0ea5e9; }

    .month-inp {
      width: 100%; padding: 5px 4px; font-size: 12px; text-align: center;
      font-family: 'Outfit', sans-serif; font-weight: 600; color: #18181b;
      background: white; border: 1.5px solid #e4e4e7; border-radius: 7px; outline: none;
    }
    .month-inp:focus { border-color: #6366f1; box-shadow: 0 0 0 2px rgba(99,102,241,0.1); }
  `],
  template: `
    <!-- ═══ STEPPER ══════════════════════════════════════════════════════════ -->
    <div class="flex-shrink-0 px-8 pt-6 pb-0 bg-white">
      <div class="relative flex items-center justify-between mb-1">
        <div class="absolute top-4 left-0 right-0 h-0.5 bg-zinc-100"></div>
        <div class="absolute top-4 left-0 h-0.5 bg-brand-500 step-track-fill"
             [style.width]="trackWidth()"></div>

        @for (step of steps; track step.id) {
          <button (click)="jumpToStep(step.id)"
                  [disabled]="step.id > maxReachedStep()"
                  class="relative z-10 flex flex-col items-center gap-1.5"
                  style="cursor: default;">
            <div class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold
                        transition-all duration-400 border-2"
                 [ngClass]="{
                   'bg-brand-600 border-brand-600 text-white scale-110 shadow-md shadow-brand-500/30': currentStep() === step.id,
                   'bg-brand-600 border-brand-600 text-white': currentStep() > step.id,
                   'bg-white border-zinc-200 text-zinc-400': currentStep() < step.id
                 }">
              @if (currentStep() > step.id) {
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
                </svg>
              } @else {
                {{ step.id }}
              }
            </div>
            <span class="text-xs font-medium whitespace-nowrap font-body transition-colors duration-200"
                  [ngClass]="{
                    'text-brand-700': currentStep() === step.id,
                    'text-brand-500': currentStep() > step.id,
                    'text-zinc-400': currentStep() < step.id
                  }">{{ step.label }}</span>
          </button>
        }
      </div>
      <div class="h-px bg-zinc-100 mt-5"></div>
    </div>

    <!-- ═══ BODY ══════════════════════════════════════════════════════════════ -->
    <div class="flex-1 flex overflow-hidden min-h-0">

      <!-- FORM COLUMN -->
      <div class="flex-1 overflow-y-auto scrollbar-thin px-8 py-7 min-w-0">

        <!-- ── Step 1: Setup ─────────────────────────────────────────────── -->
        @if (currentStep() === 1) {
          <div [class]="stepClass()">
            <div class="mb-7">
              <span class="inline-flex items-center gap-1.5 px-2.5 py-1 bg-brand-50 text-brand-700 text-xs font-semibold rounded-full font-body mb-3">
                <span class="w-1.5 h-1.5 rounded-full bg-brand-500"></span> Passo 1 di 6 · Setup
              </span>
              <h2 class="text-xl font-bold text-zinc-900 font-display">Configurazione Globale</h2>
              <p class="text-sm text-zinc-500 mt-1 font-body">Fondamenta fiscali e temporali del piano.</p>
            </div>

            <div class="space-y-4">
              <!-- Nome Progetto -->
              <div>
                <label class="block text-xs font-semibold text-zinc-600 mb-1.5 font-body uppercase tracking-wide">Nome Progetto</label>
                <input type="text" [(ngModel)]="config.projectName" name="projectName"
                       placeholder="es. MyStartup SaaS" class="inp"/>
              </div>

              <!-- Anno Inizio -->
              <div>
                <label class="block text-xs font-semibold text-zinc-600 mb-1.5 font-body uppercase tracking-wide">Anno di Avvio</label>
                <div class="relative" style="width: 160px;">
                  <input type="number" [(ngModel)]="config.startYear" name="startYear"
                         min="2024" max="2035" class="inp text-center font-mono font-semibold"/>
                  <div class="absolute inset-y-0 right-0 flex flex-col border-l border-zinc-200">
                    <button (click)="config.startYear = config.startYear + 1"
                            class="flex-1 px-2 hover:bg-zinc-100 rounded-tr-lg text-zinc-400 hover:text-zinc-700 transition-colors text-xs">▲</button>
                    <button (click)="config.startYear = config.startYear - 1"
                            class="flex-1 px-2 hover:bg-zinc-100 rounded-br-lg text-zinc-400 hover:text-zinc-700 transition-colors border-t border-zinc-200 text-xs">▼</button>
                  </div>
                </div>
              </div>

              <!-- IRES + IRAP -->
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-semibold text-zinc-600 mb-1.5 font-body uppercase tracking-wide">
                    IRES — <span class="text-brand-600 font-bold normal-case">{{ config.iresRate }}%</span>
                  </label>
                  <input type="range" [(ngModel)]="config.iresRate" name="iresRate"
                         min="0" max="50" step="0.5" class="w-full mt-1"
                         [style.background]="'linear-gradient(to right, #4f46e5 ' + (config.iresRate/50*100) + '%, #e4e4e7 ' + (config.iresRate/50*100) + '%)'"/>
                  <div class="flex justify-between text-xs text-zinc-400 font-body mt-1">
                    <span>0%</span><span class="text-brand-600 font-semibold">std: 24%</span><span>50%</span>
                  </div>
                </div>
                <div>
                  <label class="block text-xs font-semibold text-zinc-600 mb-1.5 font-body uppercase tracking-wide">
                    IRAP — <span class="text-brand-600 font-bold normal-case">{{ config.irapRate }}%</span>
                  </label>
                  <input type="range" [(ngModel)]="config.irapRate" name="irapRate"
                         min="0" max="10" step="0.1" class="w-full mt-1"
                         [style.background]="'linear-gradient(to right, #4f46e5 ' + (config.irapRate/10*100) + '%, #e4e4e7 ' + (config.irapRate/10*100) + '%)'"/>
                  <div class="flex justify-between text-xs text-zinc-400 font-body mt-1">
                    <span>0%</span><span class="text-brand-600 font-semibold">std: 4%</span><span>10%</span>
                  </div>
                </div>
              </div>

              <!-- Accantonamento Rischi Crediti -->
              <div>
                <label class="block text-xs font-semibold text-zinc-600 mb-1.5 font-body uppercase tracking-wide">Accantonamento Rischi Crediti</label>
                <div class="flex items-center gap-3">
                  <div class="relative" style="width: 160px;">
                    <input type="number" [(ngModel)]="config.badDebtPct" name="badDebtPct"
                           min="0" max="10" step="0.1" class="inp inp-suffix font-mono text-sm"/>
                    <span class="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 text-xs font-mono pointer-events-none">%</span>
                  </div>
                  <p class="text-xs text-zinc-400 font-body">Default: 0.1% — fondo su crediti inesigibili</p>
                </div>
              </div>

              <!-- Toggle Nuova Startup -->
              <div class="flex items-center justify-between p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                <div>
                  <p class="text-sm font-semibold text-zinc-800 font-body">Sei una nuova Startup?</p>
                  <p class="text-xs text-zinc-500 font-body mt-0.5">Disattiva per inserire saldi storici dello Stato Patrimoniale</p>
                </div>
                <button (click)="config.isNewStartup = !config.isNewStartup"
                        class="relative w-12 h-6 rounded-full transition-colors duration-200 flex-shrink-0 ml-4"
                        [ngClass]="config.isNewStartup ? 'bg-brand-500' : 'bg-zinc-300'">
                  <span class="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all duration-200"
                        [ngClass]="config.isNewStartup ? 'left-6' : 'left-0.5'"></span>
                </button>
              </div>

              <!-- Storico (non-startup) -->
              @if (!config.isNewStartup) {
                <div class="bg-amber-50 rounded-2xl border border-amber-100 p-4 space-y-3">
                  <p class="text-xs font-bold text-amber-700 font-body uppercase tracking-wide flex items-center gap-1.5">
                    <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                    </svg>
                    Saldi Storici — Ultimo Stato Patrimoniale
                  </p>
                  <div class="grid grid-cols-3 gap-2">
                    <div>
                      <label class="block text-xs font-semibold text-zinc-500 mb-1 font-body">Cassa Iniziale</label>
                      <div class="relative">
                        <span class="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-xs pointer-events-none font-mono">€</span>
                        <input type="number" [(ngModel)]="config.initialCash" name="initialCash" min="0" class="inp inp-prefix font-mono text-sm"/>
                      </div>
                    </div>
                    <div>
                      <label class="block text-xs font-semibold text-zinc-500 mb-1 font-body">Crediti Residui</label>
                      <div class="relative">
                        <span class="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-xs pointer-events-none font-mono">€</span>
                        <input type="number" [(ngModel)]="config.residualCredits" name="residualCredits" min="0" class="inp inp-prefix font-mono text-sm"/>
                      </div>
                    </div>
                    <div>
                      <label class="block text-xs font-semibold text-zinc-500 mb-1 font-body">Debiti Residui</label>
                      <div class="relative">
                        <span class="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-xs pointer-events-none font-mono">€</span>
                        <input type="number" [(ngModel)]="config.residualDebts" name="residualDebts" min="0" class="inp inp-prefix font-mono text-sm"/>
                      </div>
                    </div>
                  </div>
                </div>
              }
            </div>

            <div class="mt-6 flex gap-3 p-3.5 bg-brand-50 rounded-xl border border-brand-100/80">
              <div class="w-7 h-7 rounded-lg bg-brand-100 flex items-center justify-center flex-shrink-0">
                <svg class="w-3.5 h-3.5 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
              <p class="text-xs text-brand-700 font-body leading-relaxed">
                <strong>Consiglio:</strong> IRES standard 24%, IRAP 4% (varia per regione). L'accantonamento rischi è una prudenza contabile sulle stime di crediti inesigibili.
              </p>
            </div>
          </div>
        }

        <!-- ── Step 2: Ricavi ────────────────────────────────────────────── -->
        @if (currentStep() === 2) {
          <div [class]="stepClass()">
            <div class="mb-7">
              <span class="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-full font-body mb-3">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Passo 2 di 6 · Ricavi
              </span>
              <h2 class="text-xl font-bold text-zinc-900 font-display">Linee di Prodotto / Servizio</h2>
              <p class="text-sm text-zinc-500 mt-1 font-body">Ogni prodotto o servizio con il suo modello di vendita.</p>
            </div>

            <div class="space-y-4">
              @for (p of products; track p.id; let pi = $index) {
                <div class="item-card">
                  @if (products.length > 1) {
                    <button (click)="removeProduct(p.id)" class="remove-btn" type="button">
                      <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
                      </svg>
                    </button>
                  }

                  <p class="text-xs font-bold text-zinc-500 font-body uppercase tracking-wide mb-3">Prodotto {{ pi + 1 }}</p>

                  <div class="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <label class="block text-xs font-semibold text-zinc-500 mb-1 font-body">Nome / Descrizione</label>
                      <input type="text" [(ngModel)]="products[pi].name" [name]="'pName_' + p.id"
                             placeholder="es. Piano SaaS Pro" class="inp"/>
                    </div>
                    <div>
                      <label class="block text-xs font-semibold text-zinc-500 mb-1 font-body">Prezzo Unitario</label>
                      <div class="relative">
                        <span class="absolute left-3 top-1/2 -translate-y-1/2 text-brand-500 font-bold text-sm pointer-events-none">€</span>
                        <input type="number" [(ngModel)]="products[pi].unitPrice" [name]="'pPrice_' + p.id"
                               min="0" class="inp inp-prefix font-mono font-semibold"/>
                      </div>
                    </div>
                  </div>

                  <!-- Volume mode toggle -->
                  <div class="mb-3">
                    <label class="block text-xs font-semibold text-zinc-500 mb-1.5 font-body">Modalità Volumi</label>
                    <div class="flex bg-zinc-100 p-1 rounded-xl gap-1">
                      <button type="button"
                              (click)="products[pi].volumeMode = 'linear'"
                              class="seg-btn"
                              [ngClass]="products[pi].volumeMode === 'linear' ? 'seg-active' : 'seg-inactive'">
                        📈 Crescita Lineare
                      </button>
                      <button type="button"
                              (click)="products[pi].volumeMode = 'monthly'"
                              class="seg-btn"
                              [ngClass]="products[pi].volumeMode === 'monthly' ? 'seg-active' : 'seg-inactive'">
                        📅 Mese per Mese
                      </button>
                    </div>
                  </div>

                  <!-- Linear mode -->
                  @if (products[pi].volumeMode === 'linear') {
                    <div class="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <label class="block text-xs font-semibold text-zinc-500 mb-1 font-body">Volume Iniziale (mese 1)</label>
                        <div class="flex items-center gap-1.5">
                          <button type="button" (click)="products[pi].linearStart = Math.max(1, products[pi].linearStart - 10)"
                                  class="w-8 h-8 rounded-lg bg-white border border-zinc-200 hover:bg-zinc-100 flex items-center justify-center text-zinc-500 transition-all font-mono flex-shrink-0">−</button>
                          <input type="number" [(ngModel)]="products[pi].linearStart" [name]="'pLinStart_' + p.id"
                                 min="1" class="inp text-center font-mono font-bold"/>
                          <button type="button" (click)="products[pi].linearStart = products[pi].linearStart + 10"
                                  class="w-8 h-8 rounded-lg bg-white border border-zinc-200 hover:bg-zinc-100 flex items-center justify-center text-zinc-500 transition-all font-mono flex-shrink-0">+</button>
                        </div>
                      </div>
                      <div>
                        <label class="block text-xs font-semibold text-zinc-500 mb-1 font-body">Crescita Mensile</label>
                        <div class="relative">
                          <input type="number" [(ngModel)]="products[pi].linearGrowthPct" [name]="'pGrowth_' + p.id"
                                 min="0" max="200" step="0.5" class="inp inp-suffix font-mono font-semibold"/>
                          <span class="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 text-xs font-mono pointer-events-none">%</span>
                        </div>
                      </div>
                    </div>
                    <!-- Mini growth preview -->
                    <div class="bg-zinc-50 rounded-xl p-3">
                      <p class="text-xs text-zinc-400 font-body mb-2">Proiezione prime 6 mensilità</p>
                      <div class="flex items-end gap-1.5" style="height: 40px;">
                        @for (bar of getLinearPreview(products[pi]); track bar; let bi = $index) {
                          <div class="flex-1 flex flex-col items-center gap-0.5" style="height: 100%;">
                            <div class="w-full rounded-t-sm bg-emerald-400 transition-all duration-300 mt-auto"
                                 [style.height]="bar.pct + '%'" style="min-height: 3px;"></div>
                            <span style="font-size: 9px;" class="text-zinc-400 font-body">M{{ bi + 1 }}</span>
                          </div>
                        }
                      </div>
                    </div>
                  }

                  <!-- Monthly mode: 12-field grid -->
                  @if (products[pi].volumeMode === 'monthly') {
                    <div>
                      <label class="block text-xs font-semibold text-zinc-500 mb-2 font-body">Volumi Mensili (unità)</label>
                      <div class="grid grid-cols-4 gap-1.5">
                        @for (mi of monthIndices; track mi) {
                          <div class="text-center">
                            <p class="text-zinc-400 font-body mb-0.5" style="font-size: 10px;">{{ months[mi] }}</p>
                            <input type="number" [(ngModel)]="products[pi].monthlyVolumes[mi]"
                                   [name]="'vol_' + p.id + '_' + mi" min="0" class="month-inp"/>
                          </div>
                        }
                      </div>
                    </div>
                  }

                  <!-- Dilazione incassi -->
                  <div class="mt-3">
                    <label class="block text-xs font-semibold text-zinc-500 mb-1.5 font-body">Dilazione Incassi Clienti</label>
                    <div class="flex gap-1.5">
                      @for (d of collectionDelays; track d.value) {
                        <button type="button"
                                (click)="products[pi].collectionDelay = d.value"
                                class="flex-1 py-2 rounded-xl text-xs font-semibold font-body transition-all border-2"
                                [ngClass]="products[pi].collectionDelay === d.value
                                  ? 'bg-brand-100 text-brand-700 border-brand-300'
                                  : 'bg-zinc-100 text-zinc-500 border-transparent hover:bg-zinc-200'">
                          {{ d.label }}
                        </button>
                      }
                    </div>
                  </div>
                </div>
              }

              <button type="button" (click)="addProduct()" class="add-btn">
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/>
                </svg>
                Aggiungi Linea di Prodotto
              </button>
            </div>
          </div>
        }

        <!-- ── Step 3: Team ──────────────────────────────────────────────── -->
        @if (currentStep() === 3) {
          <div [class]="stepClass()">
            <div class="mb-7">
              <span class="inline-flex items-center gap-1.5 px-2.5 py-1 bg-violet-50 text-violet-700 text-xs font-semibold rounded-full font-body mb-3">
                <span class="w-1.5 h-1.5 rounded-full bg-violet-500"></span> Passo 3 di 6 · Team
              </span>
              <h2 class="text-xl font-bold text-zinc-900 font-display">Risorse Umane</h2>
              <p class="text-sm text-zinc-500 mt-1 font-body">Organico, RAL e struttura contrattuale.</p>
            </div>

            <!-- Parametri Aziendali collapsible -->
            <div class="mb-5 bg-zinc-50 rounded-2xl border border-zinc-100 overflow-hidden">
              <button type="button"
                      (click)="hrParams.showAdvanced = !hrParams.showAdvanced"
                      class="w-full flex items-center justify-between px-4 py-3">
                <div class="flex items-center gap-2">
                  <div class="w-5 h-5 rounded-md bg-violet-100 flex items-center justify-center">
                    <svg class="w-3 h-3 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
                      <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                    </svg>
                  </div>
                  <span class="text-xs font-bold text-zinc-600 font-body uppercase tracking-wide">Parametri Aziendali</span>
                  <span class="text-xs text-zinc-400 font-body">INPS {{ hrParams.inpsPct }}% · INAIL {{ hrParams.inailPct }}% · TFR {{ hrParams.tfrPct }}% · {{ hrParams.salaryMonths }} mensilità</span>
                </div>
                <svg class="w-4 h-4 text-zinc-400 transition-transform duration-200 flex-shrink-0"
                     [ngClass]="hrParams.showAdvanced ? 'rotate-180' : ''"
                     fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/>
                </svg>
              </button>
              @if (hrParams.showAdvanced) {
                <div class="px-4 pb-4 grid grid-cols-2 gap-3 border-t border-zinc-100 pt-3">
                  <div>
                    <label class="block text-xs font-semibold text-zinc-500 mb-1 font-body">% INPS (datore)</label>
                    <div class="relative">
                      <input type="number" [(ngModel)]="hrParams.inpsPct" name="inpsPct" min="0" max="50" step="0.1" class="inp inp-suffix font-mono text-sm"/>
                      <span class="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 text-xs font-mono pointer-events-none">%</span>
                    </div>
                  </div>
                  <div>
                    <label class="block text-xs font-semibold text-zinc-500 mb-1 font-body">% INAIL</label>
                    <div class="relative">
                      <input type="number" [(ngModel)]="hrParams.inailPct" name="inailPct" min="0" max="5" step="0.1" class="inp inp-suffix font-mono text-sm"/>
                      <span class="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 text-xs font-mono pointer-events-none">%</span>
                    </div>
                  </div>
                  <div>
                    <label class="block text-xs font-semibold text-zinc-500 mb-1 font-body">% TFR</label>
                    <div class="relative">
                      <input type="number" [(ngModel)]="hrParams.tfrPct" name="tfrPct" min="0" max="10" step="0.01" class="inp inp-suffix font-mono text-sm"/>
                      <span class="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 text-xs font-mono pointer-events-none">%</span>
                    </div>
                  </div>
                  <div>
                    <label class="block text-xs font-semibold text-zinc-500 mb-1 font-body">Numero Mensilità</label>
                    <select [(ngModel)]="hrParams.salaryMonths" name="salaryMonths" class="inp text-sm">
                      <option [value]="12">12 mensilità</option>
                      <option [value]="13">13ª mensilità</option>
                      <option [value]="14">14ª mensilità</option>
                    </select>
                  </div>
                </div>
              }
            </div>

            <!-- Employee cards -->
            <div class="space-y-3">
              @for (e of employees; track e.id; let ei = $index) {
                <div class="item-card">
                  @if (employees.length > 1) {
                    <button type="button" (click)="removeEmployee(e.id)" class="remove-btn">
                      <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
                      </svg>
                    </button>
                  }

                  <p class="text-xs font-bold text-zinc-500 font-body uppercase tracking-wide mb-3">Risorsa {{ ei + 1 }}</p>

                  <div class="space-y-3">
                    <div>
                      <label class="block text-xs font-semibold text-zinc-500 mb-1 font-body">Ruolo / Livello Contrattuale</label>
                      <input type="text" [(ngModel)]="employees[ei].role" [name]="'eRole_' + e.id"
                             placeholder="es. CTO, Sales Manager, Dev Junior" class="inp"/>
                    </div>

                    <div class="grid grid-cols-2 gap-3">
                      <div>
                        <label class="block text-xs font-semibold text-zinc-500 mb-1 font-body">RAL (€/anno)</label>
                        <div class="relative">
                          <span class="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-xs pointer-events-none font-mono">€</span>
                          <input type="number" [(ngModel)]="employees[ei].ral" [name]="'eRal_' + e.id"
                                 min="0" step="500" class="inp inp-prefix font-mono text-sm"/>
                        </div>
                      </div>
                      <div>
                        <label class="block text-xs font-semibold text-zinc-500 mb-1 font-body">FTE</label>
                        <div class="flex items-center gap-1.5">
                          <button type="button"
                                  (click)="employees[ei].fte = +(Math.max(0.1, employees[ei].fte - 0.5)).toFixed(1)"
                                  class="w-8 h-8 rounded-lg bg-white border border-zinc-200 hover:bg-zinc-100 flex items-center justify-center text-zinc-500 transition-all font-mono flex-shrink-0">−</button>
                          <input type="number" [(ngModel)]="employees[ei].fte" [name]="'eFte_' + e.id"
                                 min="0.1" max="5" step="0.5" class="inp text-center font-mono font-bold text-sm"/>
                          <button type="button"
                                  (click)="employees[ei].fte = +(Math.min(5, employees[ei].fte + 0.5)).toFixed(1)"
                                  class="w-8 h-8 rounded-lg bg-white border border-zinc-200 hover:bg-zinc-100 flex items-center justify-center text-zinc-500 transition-all font-mono flex-shrink-0">+</button>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label class="block text-xs font-semibold text-zinc-500 mb-1 font-body">Data di Ingresso</label>
                      <div class="grid grid-cols-2 gap-2">
                        <select [(ngModel)]="employees[ei].startMonth" [name]="'eMonth_' + e.id" class="inp text-sm">
                          @for (m of months; track m; let mi = $index) {
                            <option [value]="mi + 1">{{ m }}</option>
                          }
                        </select>
                        <input type="number" [(ngModel)]="employees[ei].startYear" [name]="'eYear_' + e.id"
                               min="2024" max="2040" class="inp font-mono text-sm"/>
                      </div>
                    </div>

                    <div class="flex justify-between items-center pt-2 border-t border-zinc-100">
                      <span class="text-xs text-zinc-400 font-body">Costo totale/anno (incl. contributi)</span>
                      <span class="text-sm font-bold text-zinc-700 font-mono">
                        €{{ formatNum(employees[ei].ral * employees[ei].fte * hrCostMultiplier) }}
                      </span>
                    </div>
                  </div>
                </div>
              }

              <button type="button" (click)="addEmployee()" class="add-btn">
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/>
                </svg>
                Aggiungi Risorsa
              </button>
            </div>
          </div>
        }

        <!-- ── Step 4: Costi Operativi ────────────────────────────────────── -->
        @if (currentStep() === 4) {
          <div [class]="stepClass()">
            <div class="mb-7">
              <span class="inline-flex items-center gap-1.5 px-2.5 py-1 bg-rose-50 text-rose-700 text-xs font-semibold rounded-full font-body mb-3">
                <span class="w-1.5 h-1.5 rounded-full bg-rose-500"></span> Passo 4 di 6 · Costi
              </span>
              <h2 class="text-xl font-bold text-zinc-900 font-display">Costi Operativi (OPEX)</h2>
              <p class="text-sm text-zinc-500 mt-1 font-body">Struttura dei costi variabili e fissi.</p>
            </div>

            <!-- Sezione A: Costi Variabili -->
            <div class="mb-6">
              <div class="flex items-center gap-2 mb-3">
                <div class="w-5 h-5 rounded-md bg-rose-100 flex items-center justify-center">
                  <svg class="w-3 h-3 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"/>
                  </svg>
                </div>
                <p class="text-xs font-bold text-zinc-700 font-body uppercase tracking-wide">Costi Variabili</p>
              </div>

              <div class="space-y-3">
                @for (c of variableCosts; track c.id; let ci = $index) {
                  <div class="item-card">
                    <button type="button" (click)="removeVariableCost(c.id)" class="remove-btn">
                      <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
                      </svg>
                    </button>

                    <div class="mb-3">
                      <label class="block text-xs font-semibold text-zinc-500 mb-1 font-body">Descrizione</label>
                      <input type="text" [(ngModel)]="variableCosts[ci].description" [name]="'vcDesc_' + c.id"
                             placeholder="es. Hosting, Commissioni, Materiali" class="inp"/>
                    </div>

                    <div class="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <label class="block text-xs font-semibold text-zinc-500 mb-1 font-body">Tipo</label>
                        <div class="flex bg-zinc-100 p-0.5 rounded-lg gap-0.5">
                          <button type="button"
                                  (click)="variableCosts[ci].valueType = 'pct'"
                                  class="flex-1 py-1.5 rounded-md text-xs font-semibold font-body transition-all"
                                  [ngClass]="variableCosts[ci].valueType === 'pct' ? 'bg-white text-brand-600 shadow-sm' : 'text-zinc-400'">
                            % Fatt.
                          </button>
                          <button type="button"
                                  (click)="variableCosts[ci].valueType = 'abs'"
                                  class="flex-1 py-1.5 rounded-md text-xs font-semibold font-body transition-all"
                                  [ngClass]="variableCosts[ci].valueType === 'abs' ? 'bg-white text-brand-600 shadow-sm' : 'text-zinc-400'">
                            €/Anno
                          </button>
                        </div>
                      </div>
                      <div>
                        <label class="block text-xs font-semibold text-zinc-500 mb-1 font-body">
                          {{ variableCosts[ci].valueType === 'pct' ? 'Percentuale' : 'Importo annuo' }}
                        </label>
                        <div class="relative">
                          @if (variableCosts[ci].valueType === 'abs') {
                            <span class="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-xs font-mono pointer-events-none">€</span>
                          }
                          <input type="number"
                                 [(ngModel)]="variableCosts[ci].value"
                                 [name]="'vcVal_' + c.id"
                                 min="0"
                                 [ngClass]="variableCosts[ci].valueType === 'abs' ? 'inp inp-prefix inp-suffix font-mono text-sm' : 'inp inp-suffix font-mono text-sm'"/>
                          @if (variableCosts[ci].valueType === 'pct') {
                            <span class="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 text-xs font-mono pointer-events-none">%</span>
                          }
                        </div>
                      </div>
                    </div>

                    <div class="grid grid-cols-2 gap-3">
                      <div>
                        <label class="block text-xs font-semibold text-zinc-500 mb-1 font-body">Aliquota IVA</label>
                        <select [(ngModel)]="variableCosts[ci].vatRate" [name]="'vcVat_' + c.id" class="inp text-sm">
                          <option [value]="0">0% — Esente</option>
                          <option [value]="4">4% — Ridotta</option>
                          <option [value]="10">10% — Ridotta</option>
                          <option [value]="22">22% — Ordinaria</option>
                        </select>
                      </div>
                      <div>
                        <label class="block text-xs font-semibold text-zinc-500 mb-1 font-body">Dilazione Fornitori</label>
                        <select [(ngModel)]="variableCosts[ci].paymentDelay" [name]="'vcDel_' + c.id" class="inp text-sm">
                          <option [value]="0">Immediato (0 gg)</option>
                          <option [value]="30">30 giorni</option>
                          <option [value]="60">60 giorni</option>
                          <option [value]="90">90 giorni</option>
                          <option [value]="120">120 giorni</option>
                        </select>
                      </div>
                    </div>
                  </div>
                }

                @if (variableCosts.length === 0) {
                  <div class="p-4 bg-zinc-50 rounded-2xl border border-dashed border-zinc-200">
                    <p class="text-xs text-zinc-400 font-body text-center">Nessun costo variabile — es. hosting, commissioni, costi di erogazione.</p>
                  </div>
                }

                <button type="button" (click)="addVariableCost()" class="add-btn">
                  <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/>
                  </svg>
                  Aggiungi Costo Variabile
                </button>
              </div>
            </div>

            <!-- Sezione B: Costi Fissi -->
            <div>
              <div class="flex items-center gap-2 mb-3">
                <div class="w-5 h-5 rounded-md bg-amber-100 flex items-center justify-center">
                  <svg class="w-3 h-3 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5"/>
                  </svg>
                </div>
                <p class="text-xs font-bold text-zinc-700 font-body uppercase tracking-wide">Costi Fissi di Gestione</p>
              </div>

              <div class="space-y-3">
                @for (c of fixedCosts; track c.id; let fi = $index) {
                  <div class="item-card">
                    <button type="button" (click)="removeFixedCost(c.id)" class="remove-btn">
                      <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
                      </svg>
                    </button>

                    <div class="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <label class="block text-xs font-semibold text-zinc-500 mb-1 font-body">Descrizione</label>
                        <input type="text" [(ngModel)]="fixedCosts[fi].description" [name]="'fcDesc_' + c.id"
                               placeholder="es. Affitto ufficio, Software" class="inp"/>
                      </div>
                      <div>
                        <label class="block text-xs font-semibold text-zinc-500 mb-1 font-body">Categoria</label>
                        <select [(ngModel)]="fixedCosts[fi].category" [name]="'fcCat_' + c.id" class="inp text-sm">
                          @for (cat of fixedCostCategories; track cat.value) {
                            <option [value]="cat.value">{{ cat.label }}</option>
                          }
                        </select>
                      </div>
                    </div>

                    <div class="grid grid-cols-3 gap-2">
                      <div>
                        <label class="block text-xs font-semibold text-zinc-500 mb-1 font-body">Budget/Mese</label>
                        <div class="relative">
                          <span class="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-xs pointer-events-none font-mono">€</span>
                          <input type="number" [(ngModel)]="fixedCosts[fi].monthlyBudget" [name]="'fcBudget_' + c.id"
                                 min="0" class="inp inp-prefix font-mono text-sm"/>
                        </div>
                      </div>
                      <div>
                        <label class="block text-xs font-semibold text-zinc-500 mb-1 font-body">IVA</label>
                        <select [(ngModel)]="fixedCosts[fi].vatRate" [name]="'fcVat_' + c.id" class="inp text-sm">
                          <option [value]="0">0%</option>
                          <option [value]="4">4%</option>
                          <option [value]="10">10%</option>
                          <option [value]="22">22%</option>
                        </select>
                      </div>
                      <div>
                        <label class="block text-xs font-semibold text-zinc-500 mb-1 font-body">Dilazione</label>
                        <select [(ngModel)]="fixedCosts[fi].paymentDelay" [name]="'fcDel_' + c.id" class="inp text-sm">
                          <option [value]="0">0 gg</option>
                          <option [value]="30">30 gg</option>
                          <option [value]="60">60 gg</option>
                          <option [value]="90">90 gg</option>
                        </select>
                      </div>
                    </div>
                  </div>
                }

                @if (fixedCosts.length === 0) {
                  <div class="p-4 bg-zinc-50 rounded-2xl border border-dashed border-zinc-200">
                    <p class="text-xs text-zinc-400 font-body text-center">Nessun costo fisso — es. affitti, utenze, software, marketing, commerciale.</p>
                  </div>
                }

                <button type="button" (click)="addFixedCost()" class="add-btn add-btn-amber">
                  <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/>
                  </svg>
                  Aggiungi Costo Fisso
                </button>
              </div>
            </div>
          </div>
        }

        <!-- ── Step 5: Investimenti CAPEX ─────────────────────────────────── -->
        @if (currentStep() === 5) {
          <div [class]="stepClass()">
            <div class="mb-7">
              <span class="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-700 text-xs font-semibold rounded-full font-body mb-3">
                <span class="w-1.5 h-1.5 rounded-full bg-amber-500"></span> Passo 5 di 6 · Investimenti
              </span>
              <h2 class="text-xl font-bold text-zinc-900 font-display">Investimenti (CAPEX)</h2>
              <p class="text-sm text-zinc-500 mt-1 font-body">Beni strumentali con aliquota di ammortamento automatica.</p>
            </div>

            <div class="space-y-3">
              @for (inv of investments; track inv.id; let ii = $index) {
                <div class="item-card">
                  <button type="button" (click)="removeCapex(inv.id)" class="remove-btn">
                    <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                  </button>

                  <div class="mb-3">
                    <label class="block text-xs font-semibold text-zinc-500 mb-1 font-body">Descrizione Bene</label>
                    <input type="text" [(ngModel)]="investments[ii].description" [name]="'invDesc_' + inv.id"
                           placeholder="es. Server rack, Macchinario, Brevetto" class="inp"/>
                  </div>

                  <div class="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <label class="block text-xs font-semibold text-zinc-500 mb-1 font-body">Categoria</label>
                      <select [(ngModel)]="investments[ii].category" [name]="'invCat_' + inv.id" class="inp text-sm">
                        @for (cat of capexCategories; track cat.value) {
                          <option [value]="cat.value">{{ cat.label }}</option>
                        }
                      </select>
                    </div>
                    <div class="flex flex-col justify-end">
                      <div class="flex items-center gap-2 px-3 bg-emerald-50 rounded-xl border border-emerald-100" style="height: 42px;">
                        <svg class="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                        </svg>
                        <span class="text-xs text-emerald-700 font-body">
                          Amm.: <strong>{{ getAmmRate(investments[ii].category) }}%</strong>/anno
                        </span>
                      </div>
                    </div>
                  </div>

                  <div class="grid grid-cols-3 gap-2">
                    <div>
                      <label class="block text-xs font-semibold text-zinc-500 mb-1 font-body">Costo Netto IVA</label>
                      <div class="relative">
                        <span class="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-xs pointer-events-none font-mono">€</span>
                        <input type="number" [(ngModel)]="investments[ii].cost" [name]="'invCost_' + inv.id"
                               min="0" class="inp inp-prefix font-mono font-semibold text-sm"/>
                      </div>
                    </div>
                    <div>
                      <label class="block text-xs font-semibold text-zinc-500 mb-1 font-body">Mese Acquisto</label>
                      <select [(ngModel)]="investments[ii].purchaseMonth" [name]="'invMonth_' + inv.id" class="inp text-sm">
                        @for (m of months; track m; let mi = $index) {
                          <option [value]="mi + 1">{{ m }}</option>
                        }
                      </select>
                    </div>
                    <div>
                      <label class="block text-xs font-semibold text-zinc-500 mb-1 font-body">Anno</label>
                      <input type="number" [(ngModel)]="investments[ii].purchaseYear" [name]="'invYear_' + inv.id"
                             min="2024" max="2040" class="inp font-mono text-sm"/>
                    </div>
                  </div>

                  @if (investments[ii].cost > 0) {
                    <div class="flex justify-between items-center pt-2 mt-2 border-t border-zinc-100">
                      <span class="text-xs text-zinc-400 font-body">Ammortamento annuo</span>
                      <span class="text-sm font-bold text-amber-600 font-mono">
                        −€{{ formatNum(investments[ii].cost * getAmmRate(investments[ii].category) / 100) }}
                      </span>
                    </div>
                  }
                </div>
              }

              @if (investments.length === 0) {
                <div class="p-4 bg-zinc-50 rounded-2xl border border-dashed border-zinc-200">
                  <p class="text-xs text-zinc-400 font-body text-center">Nessun investimento — aggiungi solo se prevedi acquisti di beni strumentali significativi.</p>
                </div>
              }

              <button type="button" (click)="addCapex()" class="add-btn add-btn-amber">
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/>
                </svg>
                Aggiungi Investimento
              </button>
            </div>
          </div>
        }

        <!-- ── Step 6: Finanziamento ──────────────────────────────────────── -->
        @if (currentStep() === 6) {
          <div [class]="stepClass()">
            <div class="mb-7">
              <span class="inline-flex items-center gap-1.5 px-2.5 py-1 bg-sky-50 text-sky-700 text-xs font-semibold rounded-full font-body mb-3">
                <span class="w-1.5 h-1.5 rounded-full bg-sky-500"></span> Passo 6 di 6 · Finanziamento
              </span>
              <h2 class="text-xl font-bold text-zinc-900 font-display">Fonti di Finanziamento</h2>
              <p class="text-sm text-zinc-500 mt-1 font-body">Equity dei soci e finanziamenti bancari/mutui.</p>
            </div>

            <!-- Sezione A: Equity -->
            <div class="mb-6">
              <div class="flex items-center gap-2 mb-3">
                <div class="w-5 h-5 rounded-md bg-sky-100 flex items-center justify-center">
                  <svg class="w-3 h-3 text-sky-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                </div>
                <p class="text-xs font-bold text-zinc-700 font-body uppercase tracking-wide">Capitale Sociale / Equity</p>
              </div>

              <div class="space-y-3">
                @for (eq of equityInjections; track eq.id; let eqi = $index) {
                  <div class="item-card">
                    @if (equityInjections.length > 1) {
                      <button type="button" (click)="removeEquity(eq.id)" class="remove-btn">
                        <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                      </button>
                    }

                    <p class="text-xs font-bold text-zinc-500 font-body uppercase tracking-wide mb-3">Iniezione {{ eqi + 1 }}</p>
                    <div class="grid grid-cols-3 gap-2">
                      <div>
                        <label class="block text-xs font-semibold text-zinc-500 mb-1 font-body">Importo</label>
                        <div class="relative">
                          <span class="absolute left-3 top-1/2 -translate-y-1/2 text-sky-500 font-bold text-sm pointer-events-none">€</span>
                          <input type="number" [(ngModel)]="equityInjections[eqi].amount" [name]="'eqAmt_' + eq.id"
                                 min="0" class="inp inp-prefix font-mono font-semibold"/>
                        </div>
                      </div>
                      <div>
                        <label class="block text-xs font-semibold text-zinc-500 mb-1 font-body">Mese</label>
                        <select [(ngModel)]="equityInjections[eqi].month" [name]="'eqMonth_' + eq.id" class="inp text-sm">
                          @for (m of months; track m; let mi = $index) {
                            <option [value]="mi + 1">{{ m }}</option>
                          }
                        </select>
                      </div>
                      <div>
                        <label class="block text-xs font-semibold text-zinc-500 mb-1 font-body">Anno</label>
                        <input type="number" [(ngModel)]="equityInjections[eqi].year" [name]="'eqYear_' + eq.id"
                               min="2024" max="2040" class="inp font-mono text-sm"/>
                      </div>
                    </div>
                  </div>
                }

                <button type="button" (click)="addEquity()" class="add-btn add-btn-sky">
                  <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/>
                  </svg>
                  Aggiungi Round Equity
                </button>
              </div>
            </div>

            <!-- Sezione B: Mutui / Finanziamenti -->
            <div>
              <div class="flex items-center gap-2 mb-3">
                <div class="w-5 h-5 rounded-md bg-brand-100 flex items-center justify-center">
                  <svg class="w-3 h-3 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/>
                  </svg>
                </div>
                <p class="text-xs font-bold text-zinc-700 font-body uppercase tracking-wide">Finanziamenti Bancari / Mutui</p>
              </div>

              <div class="space-y-3">
                @for (loan of loans; track loan.id; let li = $index) {
                  <div class="item-card">
                    <button type="button" (click)="removeLoan(loan.id)" class="remove-btn">
                      <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
                      </svg>
                    </button>

                    <p class="text-xs font-bold text-zinc-500 font-body uppercase tracking-wide mb-3">Finanziamento {{ li + 1 }}</p>

                    <div class="grid grid-cols-3 gap-2 mb-3">
                      <div>
                        <label class="block text-xs font-semibold text-zinc-500 mb-1 font-body">Importo Erogato</label>
                        <div class="relative">
                          <span class="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-xs pointer-events-none font-mono">€</span>
                          <input type="number" [(ngModel)]="loans[li].amount" [name]="'lnAmt_' + loan.id"
                                 min="0" class="inp inp-prefix font-mono font-semibold"/>
                        </div>
                      </div>
                      <div>
                        <label class="block text-xs font-semibold text-zinc-500 mb-1 font-body">Mese Stipula</label>
                        <select [(ngModel)]="loans[li].month" [name]="'lnMonth_' + loan.id" class="inp text-sm">
                          @for (m of months; track m; let mi = $index) {
                            <option [value]="mi + 1">{{ m }}</option>
                          }
                        </select>
                      </div>
                      <div>
                        <label class="block text-xs font-semibold text-zinc-500 mb-1 font-body">Anno</label>
                        <input type="number" [(ngModel)]="loans[li].year" [name]="'lnYear_' + loan.id"
                               min="2024" max="2040" class="inp font-mono text-sm"/>
                      </div>
                    </div>

                    <div class="grid grid-cols-3 gap-2 mb-3">
                      <div>
                        <label class="block text-xs font-semibold text-zinc-500 mb-1 font-body">Tasso Annuo</label>
                        <div class="relative">
                          <input type="number" [(ngModel)]="loans[li].interestRate" [name]="'lnRate_' + loan.id"
                                 min="0" max="30" step="0.1" class="inp inp-suffix font-mono text-sm"/>
                          <span class="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 text-xs font-mono pointer-events-none">%</span>
                        </div>
                      </div>
                      <div>
                        <label class="block text-xs font-semibold text-zinc-500 mb-1 font-body">Durata (mesi)</label>
                        <input type="number" [(ngModel)]="loans[li].durationMonths" [name]="'lnDur_' + loan.id"
                               min="1" max="360" class="inp font-mono text-sm"/>
                      </div>
                      <div>
                        <label class="block text-xs font-semibold text-zinc-500 mb-1 font-body">Pre-amm. (mesi)</label>
                        <input type="number" [(ngModel)]="loans[li].preAmortizationMonths" [name]="'lnPre_' + loan.id"
                               min="0" class="inp font-mono text-sm"/>
                      </div>
                    </div>

                    <div class="mb-3">
                      <label class="block text-xs font-semibold text-zinc-500 mb-1 font-body">Prima Rata</label>
                      <div class="grid grid-cols-2 gap-2">
                        <select [(ngModel)]="loans[li].firstPaymentMonth" [name]="'lnFpMonth_' + loan.id" class="inp text-sm">
                          @for (m of months; track m; let mi = $index) {
                            <option [value]="mi + 1">{{ m }}</option>
                          }
                        </select>
                        <input type="number" [(ngModel)]="loans[li].firstPaymentYear" [name]="'lnFpYear_' + loan.id"
                               min="2024" max="2040" class="inp font-mono text-sm"/>
                      </div>
                    </div>

                    @if (loans[li].amount > 0 && loans[li].durationMonths > 0) {
                      <div class="flex items-center justify-between pt-2 border-t border-zinc-100">
                        <span class="text-xs text-zinc-400 font-body">Rata mensile stimata</span>
                        <span class="text-sm font-bold text-brand-600 font-mono">
                          €{{ formatNum(calcMonthlyPayment(loans[li])) }}/mese
                        </span>
                      </div>
                    }
                  </div>
                }

                @if (loans.length === 0) {
                  <div class="p-4 bg-zinc-50 rounded-2xl border border-dashed border-zinc-200">
                    <p class="text-xs text-zinc-400 font-body text-center">Nessun finanziamento — aggiungi mutui o linee di credito se previsti.</p>
                  </div>
                }

                <button type="button" (click)="addLoan()" class="add-btn">
                  <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/>
                  </svg>
                  Aggiungi Finanziamento
                </button>
              </div>
            </div>
          </div>
        }

      </div>

      <!-- ═══ LIVE PREVIEW ══════════════════════════════════════════════════ -->
      <div class="w-72 flex-shrink-0 border-l border-zinc-100 bg-zinc-50/50 overflow-y-auto scrollbar-thin p-5 flex flex-col gap-4">

        <div class="flex items-center gap-2">
          <div class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></div>
          <p class="text-xs font-bold text-zinc-500 uppercase tracking-widest font-body">Live Preview</p>
        </div>

        <!-- Project card -->
        <div class="bg-white rounded-2xl border border-zinc-100 shadow-sm p-4">
          <p class="text-xs text-zinc-400 font-body mb-1">Progetto</p>
          <p class="text-base font-bold text-zinc-900 font-display truncate">{{ config.projectName || 'Il mio Progetto' }}</p>
          <p class="text-xs text-zinc-400 font-body mt-0.5">{{ config.startYear }} · IRES {{ config.iresRate }}% · IRAP {{ config.irapRate }}%</p>
        </div>

        <!-- Revenue -->
        @if (currentStep() >= 2) {
          <div class="bg-white rounded-2xl border border-zinc-100 shadow-sm p-4">
            <p class="text-xs text-emerald-500 font-semibold font-body mb-1.5 flex items-center gap-1.5">
              <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
              </svg>
              Ricavi Anno 1
            </p>
            <p class="text-xl font-bold text-zinc-900 font-mono">€{{ formatNum(totalRevenue) }}</p>
            <p class="text-xs text-zinc-400 font-body mt-0.5">{{ products.length }} linea/e prodotto</p>
          </div>
        }

        <!-- HR + EBITDA -->
        @if (currentStep() >= 3) {
          <div class="bg-white rounded-2xl border border-zinc-100 shadow-sm p-4">
            <p class="text-xs text-zinc-400 font-body mb-2 font-semibold">Struttura Costi</p>
            <div class="space-y-1.5">
              <div class="flex justify-between text-xs font-body">
                <span class="text-zinc-500">Personale</span>
                <span class="text-rose-500 font-mono font-semibold">−€{{ formatNum(totalHRCost) }}</span>
              </div>
              @if (currentStep() >= 4) {
                <div class="flex justify-between text-xs font-body">
                  <span class="text-zinc-500">OPEX Fissi</span>
                  <span class="text-rose-400 font-mono font-semibold">−€{{ formatNum(totalFixedCosts) }}</span>
                </div>
                <div class="flex justify-between text-xs font-body">
                  <span class="text-zinc-500">OPEX Variabili</span>
                  <span class="text-rose-400 font-mono font-semibold">−€{{ formatNum(totalVariableCosts) }}</span>
                </div>
              }
              <div class="border-t border-zinc-100 pt-1.5 flex justify-between items-baseline">
                <span class="text-xs font-semibold text-zinc-600 font-body">EBITDA stimato</span>
                <span class="text-base font-bold font-mono" [ngClass]="estimatedEbitda >= 0 ? 'text-emerald-600' : 'text-rose-500'">
                  {{ estimatedEbitda >= 0 ? '+' : '' }}€{{ formatNum(estimatedEbitda) }}
                </span>
              </div>
            </div>
          </div>
        }

        <!-- CAPEX -->
        @if (currentStep() >= 5 && totalCapex > 0) {
          <div class="bg-white rounded-2xl border border-zinc-100 shadow-sm p-4">
            <p class="text-xs text-amber-600 font-semibold font-body mb-1.5 flex items-center gap-1.5">
              <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5"/>
              </svg>
              Investimenti
            </p>
            <p class="text-xl font-bold text-zinc-800 font-mono">€{{ formatNum(totalCapex) }}</p>
            <p class="text-xs text-zinc-400 font-body mt-0.5">{{ investments.length }} bene/i</p>
          </div>
        }

        <!-- Financing -->
        @if (currentStep() >= 6) {
          <div class="bg-white rounded-2xl border border-zinc-100 shadow-sm p-4">
            <p class="text-xs text-sky-600 font-semibold font-body mb-2">Copertura Finanziaria</p>
            <div class="space-y-1.5">
              <div class="flex justify-between text-xs font-body">
                <span class="text-zinc-500">Equity</span>
                <span class="text-sky-600 font-mono font-semibold">+€{{ formatNum(totalEquity) }}</span>
              </div>
              <div class="flex justify-between text-xs font-body">
                <span class="text-zinc-500">Finanziamenti</span>
                <span class="text-brand-600 font-mono font-semibold">+€{{ formatNum(totalDebt) }}</span>
              </div>
              <div class="border-t border-zinc-100 pt-1.5 flex justify-between text-xs font-body">
                <span class="text-zinc-600 font-semibold">Totale Fonti</span>
                <span class="text-zinc-800 font-mono font-bold">€{{ formatNum(totalEquity + totalDebt) }}</span>
              </div>
            </div>
          </div>
        }

        <!-- Verdict -->
        @if (currentStep() >= 3) {
          <div class="rounded-2xl border p-4 transition-all duration-500"
               [ngClass]="estimatedEbitda >= 0 ? 'bg-emerald-50 border-emerald-100' : 'bg-amber-50 border-amber-100'">
            <p class="text-xs font-bold mb-1 font-body"
               [ngClass]="estimatedEbitda >= 0 ? 'text-emerald-700' : 'text-amber-700'">
              {{ estimatedEbitda >= 0 ? '✅ Piano sostenibile' : '⚠️ Rivedere i costi' }}
            </p>
            <p class="text-xs font-body leading-relaxed"
               [ngClass]="estimatedEbitda >= 0 ? 'text-emerald-600' : 'text-amber-600'">
              {{ estimatedEbitda >= 0
                ? 'EBITDA positivo. Genera il piano per il dettaglio completo.'
                : 'I costi superano i ricavi stimati. Rivedi prezzi, volumi o struttura.' }}
            </p>
          </div>
        }

      </div>
    </div>

    <!-- ═══ FOOTER NAV ══════════════════════════════════════════════════════ -->
    <div class="flex-shrink-0 px-8 py-4 border-t border-zinc-100 bg-white flex items-center justify-between">

      <button (click)="prevStep()" [disabled]="currentStep() === 1"
              [ngClass]="['flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl transition-all duration-200 font-body',
                          currentStep() === 1 ? 'text-zinc-300 cursor-not-allowed' : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100']">
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/>
        </svg>
        Indietro
      </button>

      <div class="flex items-center gap-1.5">
        @for (step of steps; track step.id) {
          <button (click)="jumpToStep(step.id)" [disabled]="step.id > maxReachedStep()"
                  class="transition-all duration-300 rounded-full"
                  [ngClass]="{
                    'w-5 h-2 bg-brand-500 rounded-full': currentStep() === step.id,
                    'w-2 h-2 bg-brand-300': currentStep() > step.id,
                    'w-2 h-2 bg-zinc-200': currentStep() < step.id
                  }">
          </button>
        }
      </div>

      @if (currentStep() < steps.length) {
        <button (click)="nextStep()"
                class="flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-500 text-white
                       text-sm font-semibold rounded-xl transition-all duration-200 font-body
                       hover:-translate-y-0.5 active:translate-y-0 shadow-md shadow-brand-500/30">
          Avanti
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/>
          </svg>
        </button>
      } @else {
        <button (click)="generate()"
                class="flex items-center gap-2 px-5 py-2.5 text-white text-sm font-semibold
                       rounded-xl transition-all duration-200 font-body
                       hover:-translate-y-0.5 active:translate-y-0 shadow-lg"
                style="background: linear-gradient(135deg, #4f46e5, #7c3aed); box-shadow: 0 4px 15px rgba(79,70,229,0.4);">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/>
          </svg>
          Genera Business Plan
        </button>
      }
    </div>
  `,
})
export class WizardFormComponent {
  readonly planGenerated = output<void>();
  Math = Math;

  private readonly planService = inject(BusinessPlanService);

  // ─── Navigation ──────────────────────────────────────────────────────────
  currentStep = signal(1);
  maxReachedStep = signal(1);
  animDir = signal<'fwd' | 'bwd'>('fwd');

  readonly stepClass = computed(() =>
    this.animDir() === 'fwd' ? 'step-fwd' : 'step-bwd'
  );

  readonly trackWidth = computed(() => {
    const pct = ((this.currentStep() - 1) / (this.steps.length - 1)) * 100;
    return `${pct}%`;
  });

  steps = [
    { id: 1, label: 'Setup' },
    { id: 2, label: 'Ricavi' },
    { id: 3, label: 'Team' },
    { id: 4, label: 'Costi' },
    { id: 5, label: 'CAPEX' },
    { id: 6, label: 'Fonti' },
  ];

  // ─── Step 1: Global Config ────────────────────────────────────────────────
  config = {
    projectName:     '',
    startYear:       new Date().getFullYear(),
    iresRate:        24,
    irapRate:        4,
    badDebtPct:      0.1,
    isNewStartup:    true,
    initialCash:     0,
    residualCredits: 0,
    residualDebts:   0,
  };

  // ─── Step 2: Products ─────────────────────────────────────────────────────
  private _id = 1;

  readonly months      = ['Gen','Feb','Mar','Apr','Mag','Giu','Lug','Ago','Set','Ott','Nov','Dic'];
  readonly monthIndices = [0,1,2,3,4,5,6,7,8,9,10,11];

  readonly collectionDelays = [
    { value: 0,  label: 'Immediato' },
    { value: 30, label: '30 gg' },
    { value: 60, label: '60 gg' },
    { value: 90, label: '90 gg' },
  ];

  products: ProductLine[] = [this._newProduct()];

  private _newProduct(): ProductLine {
    return {
      id: this._id++,
      name: '',
      unitPrice: 49,
      volumeMode: 'linear',
      linearStart: 100,
      linearGrowthPct: 10,
      monthlyVolumes: Array(12).fill(0),
      collectionDelay: 30,
    };
  }

  addProduct(): void    { this.products.push(this._newProduct()); }
  removeProduct(id: number): void { this.products = this.products.filter(p => p.id !== id); }

  getLinearPreview(p: ProductLine): { pct: number }[] {
    const vals: number[] = [];
    let vol = p.linearStart;
    for (let m = 0; m < 6; m++) {
      vals.push(vol);
      vol = Math.round(vol * (1 + p.linearGrowthPct / 100));
    }
    const max = Math.max(...vals, 1);
    return vals.map(v => ({ pct: Math.min((v / max) * 100, 100) }));
  }

  // ─── Step 3: HR ───────────────────────────────────────────────────────────
  hrParams = {
    inpsPct:      28.0,
    inailPct:     0.5,
    tfrPct:       7.41,
    salaryMonths: 13,
    showAdvanced: false,
  };

  employees: Employee[] = [this._newEmployee()];

  private _newEmployee(): Employee {
    return {
      id:         this._id++,
      role:       '',
      ral:        30000,
      fte:        1.0,
      startMonth: 1,
      startYear:  this.config.startYear,
    };
  }

  addEmployee(): void   { this.employees.push(this._newEmployee()); }
  removeEmployee(id: number): void { this.employees = this.employees.filter(e => e.id !== id); }

  get hrCostMultiplier(): number {
    return (1 + this.hrParams.inpsPct / 100 + this.hrParams.inailPct / 100 + this.hrParams.tfrPct / 100)
           * (this.hrParams.salaryMonths / 12);
  }

  // ─── Step 4: OPEX ─────────────────────────────────────────────────────────
  readonly fixedCostCategories = [
    { value: 'affitti',        label: '🏠 Affitti' },
    { value: 'spese_generali', label: '⚙️ Spese Generali' },
    { value: 'marketing',      label: '📣 Marketing' },
    { value: 'commerciali',    label: '🤝 Commerciali' },
  ];

  variableCosts: VariableCost[] = [];
  fixedCosts:    FixedCost[]    = [];

  private _newVariableCost(): VariableCost {
    return { id: this._id++, description: '', valueType: 'pct', value: 0, vatRate: 22, paymentDelay: 30 };
  }
  addVariableCost(): void  { this.variableCosts.push(this._newVariableCost()); }
  removeVariableCost(id: number): void { this.variableCosts = this.variableCosts.filter(c => c.id !== id); }

  private _newFixedCost(): FixedCost {
    return { id: this._id++, description: '', category: 'spese_generali', monthlyBudget: 0, vatRate: 22, paymentDelay: 30 };
  }
  addFixedCost(): void  { this.fixedCosts.push(this._newFixedCost()); }
  removeFixedCost(id: number): void { this.fixedCosts = this.fixedCosts.filter(c => c.id !== id); }

  // ─── Step 5: CAPEX ────────────────────────────────────────────────────────
  readonly capexCategories = [
    { value: 'fabbricati',   label: 'Fabbricati',          ammRate: 3  },
    { value: 'impianti',     label: 'Impianti/Macchinari', ammRate: 15 },
    { value: 'attrezzature', label: 'Attrezzature',        ammRate: 25 },
    { value: 'impianto',     label: "Costi d'Impianto",    ammRate: 20 },
    { value: 'rnd',          label: 'R&S',                 ammRate: 20 },
  ];

  investments: CapexItem[] = [];

  getAmmRate(cat: string): number {
    return this.capexCategories.find(c => c.value === cat)?.ammRate ?? 0;
  }

  private _newCapex(): CapexItem {
    return { id: this._id++, description: '', category: 'attrezzature', cost: 0, purchaseMonth: 1, purchaseYear: this.config.startYear };
  }
  addCapex(): void  { this.investments.push(this._newCapex()); }
  removeCapex(id: number): void { this.investments = this.investments.filter(i => i.id !== id); }

  // ─── Step 6: Financing ────────────────────────────────────────────────────
  equityInjections: EquityInjection[] = [this._newEquity()];
  loans:            LoanItem[]        = [];

  private _newEquity(): EquityInjection {
    return { id: this._id++, amount: 0, month: 1, year: this.config.startYear };
  }
  addEquity(): void  { this.equityInjections.push(this._newEquity()); }
  removeEquity(id: number): void { this.equityInjections = this.equityInjections.filter(e => e.id !== id); }

  private _newLoan(): LoanItem {
    return {
      id:                    this._id++,
      amount:                0,
      month:                 1,
      year:                  this.config.startYear,
      interestRate:          4,
      durationMonths:        60,
      preAmortizationMonths: 0,
      firstPaymentMonth:     1,
      firstPaymentYear:      this.config.startYear,
    };
  }
  addLoan(): void  { this.loans.push(this._newLoan()); }
  removeLoan(id: number): void { this.loans = this.loans.filter(l => l.id !== id); }

  calcMonthlyPayment(loan: LoanItem): number {
    const r = loan.interestRate / 100 / 12;
    const n = loan.durationMonths - loan.preAmortizationMonths;
    if (n <= 0) return 0;
    if (r === 0) return Math.round(loan.amount / n);
    return Math.round(loan.amount * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1));
  }

  // ─── KPI getters (zone-based CD recomputes on every input event) ──────────
  get totalRevenue(): number {
    return this.products.reduce((sum, p) => {
      if (p.volumeMode === 'linear') {
        let total = 0;
        let vol   = p.linearStart;
        for (let m = 0; m < 12; m++) {
          total += vol * p.unitPrice;
          vol    = Math.round(vol * (1 + p.linearGrowthPct / 100));
        }
        return sum + total;
      }
      return sum + p.monthlyVolumes.reduce((s, v) => s + v * p.unitPrice, 0);
    }, 0);
  }

  get totalHRCost(): number {
    return this.employees.reduce((sum, e) => sum + e.ral * e.fte * this.hrCostMultiplier, 0);
  }

  get totalFixedCosts(): number {
    return this.fixedCosts.reduce((sum, c) => sum + c.monthlyBudget * 12, 0);
  }

  get totalVariableCosts(): number {
    const rev = this.totalRevenue;
    return this.variableCosts.reduce((sum, c) =>
      sum + (c.valueType === 'pct' ? rev * c.value / 100 : c.value), 0);
  }

  get totalCapex(): number {
    return this.investments.reduce((sum, i) => sum + i.cost, 0);
  }

  get totalEquity(): number {
    return this.equityInjections.reduce((sum, e) => sum + e.amount, 0);
  }

  get totalDebt(): number {
    return this.loans.reduce((sum, l) => sum + l.amount, 0);
  }

  get estimatedEbitda(): number {
    return Math.round(this.totalRevenue - this.totalHRCost - this.totalFixedCosts - this.totalVariableCosts);
  }

  // ─── Navigation ───────────────────────────────────────────────────────────
  nextStep(): void {
    if (this.currentStep() < this.steps.length) {
      this.animDir.set('fwd');
      const next = this.currentStep() + 1;
      this.currentStep.set(next);
      if (next > this.maxReachedStep()) this.maxReachedStep.set(next);
    }
  }

  prevStep(): void {
    if (this.currentStep() > 1) {
      this.animDir.set('bwd');
      this.currentStep.update(s => s - 1);
    }
  }

  jumpToStep(id: number): void {
    if (id > this.maxReachedStep()) return;
    this.animDir.set(id > this.currentStep() ? 'fwd' : 'bwd');
    this.currentStep.set(id);
  }

  generate(): void {
    const input: WizardInput = {
      config: { ...this.config },
      products: this.products.map(p => ({
        name:             p.name,
        unitPrice:        p.unitPrice,
        volumeMode:       p.volumeMode,
        linearStart:      p.linearStart,
        linearGrowthPct:  p.linearGrowthPct,
        monthlyVolumes:   [...p.monthlyVolumes],
        collectionDelay:  p.collectionDelay,
      })),
      employees: this.employees.map(e => ({
        role:        e.role,
        ral:         e.ral,
        fte:         e.fte,
        startMonth:  e.startMonth,
        startYear:   e.startYear,
      })),
      hrParams: {
        inpsPct:      this.hrParams.inpsPct,
        inailPct:     this.hrParams.inailPct,
        tfrPct:       this.hrParams.tfrPct,
        salaryMonths: this.hrParams.salaryMonths,
      },
      variableCosts: this.variableCosts.map(c => ({
        valueType:    c.valueType,
        value:        c.value,
        paymentDelay: c.paymentDelay,
      })),
      fixedCosts: this.fixedCosts.map(c => ({
        category:      c.category,
        monthlyBudget: c.monthlyBudget,
        paymentDelay:  c.paymentDelay,
      })),
      investments: this.investments.map(inv => ({
        category:      inv.category,
        cost:          inv.cost,
        purchaseMonth: inv.purchaseMonth,
        purchaseYear:  inv.purchaseYear,
      })),
      equityInjections: this.equityInjections.map(eq => ({
        amount: eq.amount,
        month:  eq.month,
        year:   eq.year,
      })),
      loans: this.loans.map(l => ({
        amount:                l.amount,
        month:                 l.month,
        year:                  l.year,
        interestRate:          l.interestRate,
        durationMonths:        l.durationMonths,
        preAmortizationMonths: l.preAmortizationMonths,
        firstPaymentMonth:     l.firstPaymentMonth,
        firstPaymentYear:      l.firstPaymentYear,
      })),
    };
    this.planService.computeFromWizard(input);
    this.planGenerated.emit();
  }

  formatNum(value: number): string {
    if (!value || isNaN(value)) return '0';
    const abs = Math.abs(Math.round(value));
    if (abs >= 1_000_000) return (abs / 1_000_000).toFixed(1) + 'M';
    if (abs >= 1_000)     return abs.toLocaleString('it-IT');
    return abs.toString();
  }
}
