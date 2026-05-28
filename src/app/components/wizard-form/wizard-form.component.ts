import { Component, output, signal, computed, NgZone, inject, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-wizard-form',
  standalone: true,
  host: { class: 'flex flex-col h-full overflow-hidden bg-white' },
  imports: [CommonModule, NgClass, FormsModule],
  styles: [`
    :host { display: flex; flex-direction: column; height: 100%; overflow: hidden; }

    /* Stepper track */
    .step-track-fill {
      transition: width 0.6s cubic-bezier(0.65, 0, 0.35, 1);
    }

    /* Step enter animations */
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

    /* Custom range slider */
    input[type=range] {
      -webkit-appearance: none;
      height: 4px;
      border-radius: 2px;
      outline: none;
      cursor: pointer;
    }
    input[type=range]::-webkit-slider-thumb {
      -webkit-appearance: none;
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background: #4f46e5;
      border: 2px solid white;
      box-shadow: 0 1px 4px rgba(79,70,229,0.4);
      cursor: pointer;
      transition: transform 0.15s;
    }
    input[type=range]::-webkit-slider-thumb:hover { transform: scale(1.15); }

    /* Floating input label */
    .field-wrap { position: relative; }
    .field-wrap input:focus + .field-floating-label,
    .field-wrap input:not(:placeholder-shown) + .field-floating-label {
      top: -8px; font-size: 11px; color: #4f46e5; background: white; padding: 0 4px;
    }
    .field-floating-label {
      position: absolute; left: 12px; top: 50%; transform: translateY(-50%);
      font-size: 13px; color: #a1a1aa; pointer-events: none;
      transition: top 0.2s, font-size 0.2s, color 0.2s;
      background: transparent;
    }

    /* Number pulse on change */
    @keyframes numPop {
      0%   { transform: scale(1); }
      40%  { transform: scale(1.06); }
      100% { transform: scale(1); }
    }
    .num-pop { animation: numPop 0.25s ease-out; }

    /* Generate button shimmer */
    @keyframes shimmerBtn {
      0%   { background-position: -200% center; }
      100% { background-position: 200% center; }
    }
    .btn-shimmer {
      background-size: 200% auto;
      animation: shimmerBtn 2s linear infinite;
    }

    /* Preview card pulse on update */
    @keyframes previewUpdate {
      0%   { box-shadow: 0 0 0 0 rgba(79,70,229,0.3); }
      70%  { box-shadow: 0 0 0 8px rgba(79,70,229,0); }
      100% { box-shadow: 0 0 0 0 rgba(79,70,229,0); }
    }
    .preview-pulse { animation: previewUpdate 0.5s ease-out; }

    /* Input base style */
    .inp {
      width: 100%;
      padding: 10px 12px;
      font-size: 14px;
      color: #18181b;
      background: #fafafa;
      border: 1.5px solid #e4e4e7;
      border-radius: 10px;
      outline: none;
      transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
      font-family: 'Outfit', sans-serif;
    }
    .inp:focus {
      border-color: #6366f1;
      background: white;
      box-shadow: 0 0 0 3px rgba(99,102,241,0.12);
    }
    .inp::placeholder { color: #a1a1aa; }
    .inp-prefix { padding-left: 32px; }
    .inp-suffix { padding-right: 40px; }

    /* Hide native number spinners — custom controls used instead */
    input[type=number]::-webkit-inner-spin-button,
    input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
    input[type=number] { -moz-appearance: textfield; }
  `],
  template: `
    <!-- ═══ STEPPER ══════════════════════════════════════════════════════════ -->
    <div class="flex-shrink-0 px-8 pt-6 pb-0 bg-white">

      <!-- Progress track -->
      <div class="relative flex items-center justify-between mb-1">
        <!-- Background track -->
        <div class="absolute top-4 left-0 right-0 h-0.5 bg-zinc-100"></div>
        <!-- Animated fill -->
        <div class="absolute top-4 left-0 h-0.5 bg-brand-500 step-track-fill"
             [style.width]="trackWidth()"></div>

        <!-- Step bubbles -->
        @for (step of steps; track step.id) {
          <button (click)="jumpToStep(step.id)"
                  [disabled]="step.id > maxReachedStep()"
                  class="relative z-10 flex flex-col items-center gap-1.5 group"
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
                  }">
              {{ step.label }}
            </span>
          </button>
        }
      </div>

      <div class="h-px bg-zinc-100 mt-5"></div>
    </div>

    <!-- ═══ BODY: FORM + PREVIEW ══════════════════════════════════════════ -->
    <div class="flex-1 flex overflow-hidden min-h-0">

      <!-- FORM COLUMN -->
      <div class="flex-1 overflow-y-auto scrollbar-thin px-8 py-7 min-w-0">

        <!-- ── Step 1: Setup ──────────────────────────────────────── -->
        @if (currentStep() === 1) {
          <div [class]="stepClass()">
            <div class="mb-7">
              <span class="inline-flex items-center gap-1.5 px-2.5 py-1 bg-brand-50 text-brand-700 text-xs font-semibold rounded-full font-body mb-3">
                <span class="w-1.5 h-1.5 rounded-full bg-brand-500"></span> Passo 1 di 3
              </span>
              <h2 class="text-xl font-bold text-zinc-900 font-display">Informazioni base</h2>
              <p class="text-sm text-zinc-500 mt-1 font-body">Fondamenta del tuo piano finanziario.</p>
            </div>

            <div class="space-y-4">
              <!-- Project name -->
              <div>
                <label class="block text-xs font-semibold text-zinc-600 mb-1.5 font-body uppercase tracking-wide">Nome Progetto</label>
                <input type="text" [(ngModel)]="data.projectName" name="projectName"
                       placeholder="es. MyStartup SaaS"
                       class="inp"/>
              </div>

              <!-- Year + tax grid -->
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs font-semibold text-zinc-600 mb-1.5 font-body uppercase tracking-wide">Anno Inizio</label>
                  <div class="relative">
                    <input type="number" [(ngModel)]="data.startYear" name="startYear"
                           min="2024" max="2035"
                           class="inp text-center font-mono font-semibold"/>
                    <div class="absolute inset-y-0 right-0 flex flex-col border-l border-zinc-200">
                      <button (click)="data.startYear = data.startYear + 1"
                              class="flex-1 px-2 hover:bg-zinc-100 rounded-tr-lg text-zinc-400 hover:text-zinc-700 transition-colors text-xs">▲</button>
                      <button (click)="data.startYear = data.startYear - 1"
                              class="flex-1 px-2 hover:bg-zinc-100 rounded-br-lg text-zinc-400 hover:text-zinc-700 transition-colors border-t border-zinc-200 text-xs">▼</button>
                    </div>
                  </div>
                </div>

                <div>
                  <label class="block text-xs font-semibold text-zinc-600 mb-1.5 font-body uppercase tracking-wide">
                    Aliquota Fiscale — <span class="text-brand-600 font-bold normal-case">{{ data.taxRate }}%</span>
                  </label>
                  <input type="range" [(ngModel)]="data.taxRate" name="taxRate"
                         min="0" max="50" step="1"
                         class="w-full mt-2.5"
                         [style.background]="'linear-gradient(to right, #4f46e5 ' + (data.taxRate/50*100) + '%, #e4e4e7 ' + (data.taxRate/50*100) + '%)'"/>
                  <div class="flex justify-between text-xs text-zinc-400 font-body mt-1">
                    <span>0%</span><span class="text-brand-600 font-semibold">IRES: 24%</span><span>50%</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Hint -->
            <div class="mt-6 flex gap-3 p-3.5 bg-brand-50 rounded-xl border border-brand-100/80">
              <div class="w-7 h-7 rounded-lg bg-brand-100 flex items-center justify-center flex-shrink-0">
                <svg class="w-3.5 h-3.5 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
              <p class="text-xs text-brand-700 font-body leading-relaxed">
                <strong>Consiglio:</strong> L'IRES standard è 24%. Se sei una startup innovativa potresti avere agevolazioni fiscali.
              </p>
            </div>
          </div>
        }

        <!-- ── Step 2: Revenue ──────────────────────────────────── -->
        @if (currentStep() === 2) {
          <div [class]="stepClass()">
            <div class="mb-7">
              <span class="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-full font-body mb-3">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Passo 2 di 3
              </span>
              <h2 class="text-xl font-bold text-zinc-900 font-display">Ricavi</h2>
              <p class="text-sm text-zinc-500 mt-1 font-body">Prodotto principale e proiezioni di vendita.</p>
            </div>

            <div class="space-y-4">
              <div>
                <label class="block text-xs font-semibold text-zinc-600 mb-1.5 font-body uppercase tracking-wide">Prodotto / Servizio</label>
                <input type="text" [(ngModel)]="data.productName" name="productName"
                       placeholder="es. Piano SaaS Pro"
                       class="inp"/>
              </div>

              <div>
                <label class="block text-xs font-semibold text-zinc-600 mb-1.5 font-body uppercase tracking-wide">Prezzo Unitario</label>
                <div class="relative">
                  <span class="absolute left-3 top-1/2 -translate-y-1/2 text-brand-500 font-bold text-sm pointer-events-none">€</span>
                  <input type="number" [(ngModel)]="data.productPrice" name="productPrice"
                         min="0" placeholder="49"
                         class="inp inp-prefix font-mono font-semibold text-lg"/>
                </div>
              </div>

              <!-- Volume slider + input -->
              <div>
                <div class="flex items-center justify-between mb-1.5">
                  <label class="text-xs font-semibold text-zinc-600 font-body uppercase tracking-wide">Volume Mensile</label>
                  <span class="text-xs text-zinc-500 font-body">unità/mese</span>
                </div>
                <div class="flex items-center gap-2">
                  <button (click)="data.monthlyVolume = Math.max(1, data.monthlyVolume - 10)"
                          class="w-9 h-9 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 flex items-center justify-center
                                 text-zinc-500 hover:text-zinc-800 transition-all font-mono text-lg flex-shrink-0">−</button>
                  <input type="number" [(ngModel)]="data.monthlyVolume" name="monthlyVolume"
                         min="1" placeholder="100"
                         class="inp text-center font-mono font-bold text-base"/>
                  <button (click)="data.monthlyVolume = data.monthlyVolume + 10"
                          class="w-9 h-9 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 flex items-center justify-center
                                 text-zinc-500 hover:text-zinc-800 transition-all font-mono text-lg flex-shrink-0">+</button>
                </div>
                <input type="range" [(ngModel)]="data.monthlyVolume" name="monthlyVolumeRange"
                       min="1" max="10000" step="10"
                       class="w-full mt-2.5"
                       [style.background]="'linear-gradient(to right, #10b981 ' + (Math.min(data.monthlyVolume,10000)/10000*100) + '%, #e4e4e7 ' + (Math.min(data.monthlyVolume,10000)/10000*100) + '%)'"/>
              </div>
            </div>
          </div>
        }

        <!-- ── Step 3: Costs ──────────────────────────────────── -->
        @if (currentStep() === 3) {
          <div [class]="stepClass()">
            <div class="mb-7">
              <span class="inline-flex items-center gap-1.5 px-2.5 py-1 bg-violet-50 text-violet-700 text-xs font-semibold rounded-full font-body mb-3">
                <span class="w-1.5 h-1.5 rounded-full bg-violet-500"></span> Passo 3 di 3
              </span>
              <h2 class="text-xl font-bold text-zinc-900 font-display">Costi & Team</h2>
              <p class="text-sm text-zinc-500 mt-1 font-body">Struttura dei costi fissi e variabili.</p>
            </div>

            <div class="space-y-5">
              <!-- Personnel section -->
              <div class="bg-zinc-50 rounded-2xl p-4 border border-zinc-100">
                <div class="flex items-center gap-2 mb-4">
                  <div class="w-6 h-6 rounded-lg bg-violet-100 flex items-center justify-center">
                    <svg class="w-3.5 h-3.5 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
                    </svg>
                  </div>
                  <p class="text-xs font-bold text-zinc-700 font-body uppercase tracking-wide">Personale</p>
                </div>

                <div class="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label class="block text-xs font-semibold text-zinc-500 mb-1.5 font-body">N° Dipendenti</label>
                    <div class="flex items-center gap-1.5">
                      <button (click)="data.numEmployees = Math.max(0, data.numEmployees - 1)"
                              class="w-8 h-8 rounded-lg bg-white border border-zinc-200 hover:bg-zinc-100
                                     flex items-center justify-center text-zinc-500 transition-all font-mono">−</button>
                      <input type="number" [(ngModel)]="data.numEmployees" name="numEmployees"
                             min="0"
                             class="inp text-center font-mono font-bold"/>
                      <button (click)="data.numEmployees = data.numEmployees + 1"
                              class="w-8 h-8 rounded-lg bg-white border border-zinc-200 hover:bg-zinc-100
                                     flex items-center justify-center text-zinc-500 transition-all font-mono">+</button>
                    </div>
                  </div>
                  <div>
                    <label class="block text-xs font-semibold text-zinc-500 mb-1.5 font-body">RAL Media</label>
                    <div class="relative">
                      <span class="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-xs pointer-events-none font-mono">€</span>
                      <input type="number" [(ngModel)]="data.avgSalary" name="avgSalary"
                             min="0"
                             class="inp inp-prefix font-mono text-sm"/>
                    </div>
                  </div>
                </div>

                <div class="flex items-center justify-between pt-3 border-t border-zinc-200">
                  <span class="text-xs text-zinc-500 font-body">Costo totale/anno</span>
                  <span class="text-sm font-bold text-zinc-800 font-mono">€{{ formatNum(data.numEmployees * data.avgSalary * 1.35) }}</span>
                </div>
                <p class="text-xs text-zinc-400 font-body mt-0.5">incl. contributi previdenziali ~35%</p>
              </div>

              <!-- Marketing budget -->
              <div>
                <div class="flex items-center justify-between mb-1.5">
                  <label class="text-xs font-semibold text-zinc-600 font-body uppercase tracking-wide">Budget Marketing/Anno</label>
                  <span class="text-xs text-zinc-400 font-body">
                    {{ data.monthlyVolume > 0 && data.productPrice > 0
                      ? (data.marketingBudget / (data.productPrice * data.monthlyVolume * 12) * 100).toFixed(0)
                      : '—' }}% del fatturato
                  </span>
                </div>
                <div class="relative">
                  <span class="absolute left-3 top-1/2 -translate-y-1/2 text-brand-500 font-bold text-sm pointer-events-none">€</span>
                  <input type="number" [(ngModel)]="data.marketingBudget" name="marketingBudget"
                         min="0"
                         class="inp inp-prefix font-mono font-semibold"/>
                </div>
                <p class="text-xs text-zinc-400 font-body mt-1.5">Best practice: 10–15% del fatturato annuo atteso.</p>
              </div>
            </div>
          </div>
        }

      </div>

      <!-- LIVE PREVIEW COLUMN -->
      <div class="w-80 flex-shrink-0 border-l border-zinc-100 bg-zinc-50/50 overflow-y-auto scrollbar-thin p-5 flex flex-col gap-4">

        <!-- Preview header -->
        <div class="flex items-center gap-2">
          <div class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></div>
          <p class="text-xs font-bold text-zinc-500 uppercase tracking-widest font-body">Live Preview</p>
        </div>

        <!-- Project card (always visible) -->
        <div class="bg-white rounded-2xl border border-zinc-100 shadow-card p-4">
          <p class="text-xs text-zinc-400 font-body mb-1">Progetto</p>
          <p class="text-base font-bold text-zinc-900 font-display truncate">
            {{ data.projectName || 'Il mio Progetto' }}
          </p>
          <p class="text-xs text-zinc-400 font-body mt-0.5">Avvio {{ data.startYear }} · Tasse {{ data.taxRate }}%</p>
        </div>

        <!-- Revenue preview (step 2+) -->
        @if (currentStep() >= 2) {
          <div class="bg-white rounded-2xl border border-zinc-100 shadow-card p-4 transition-all duration-300">
            <p class="text-xs text-zinc-400 font-body mb-3 flex items-center gap-1.5">
              <svg class="w-3 h-3 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
              </svg>
              Ricavi Attesi
            </p>

            <div class="space-y-2.5">
              <div class="flex justify-between items-baseline">
                <span class="text-xs text-zinc-500 font-body">Mensile</span>
                <span class="text-base font-bold text-zinc-800 font-mono number-highlight transition-all duration-300">
                  €{{ formatNum(data.productPrice * data.monthlyVolume) }}
                </span>
              </div>
              <div class="flex justify-between items-baseline">
                <span class="text-xs text-zinc-500 font-body">Anno 1</span>
                <span class="text-lg font-bold text-emerald-600 font-mono number-highlight transition-all duration-300">
                  €{{ formatNum(data.productPrice * data.monthlyVolume * 12) }}
                </span>
              </div>
              <div class="flex justify-between items-baseline border-t border-zinc-50 pt-2">
                <span class="text-xs text-zinc-500 font-body">Anno 2 (est.)</span>
                <span class="text-sm font-semibold text-zinc-500 font-mono">
                  €{{ formatNum(data.productPrice * data.monthlyVolume * 12 * 1.5) }}
                </span>
              </div>
            </div>

            <!-- Visual bar -->
            <div class="mt-3 space-y-1">
              @for (bar of revenueBars(); track bar.label) {
                <div>
                  <div class="flex justify-between text-xs text-zinc-400 font-body mb-0.5">
                    <span>{{ bar.label }}</span>
                  </div>
                  <div class="h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                    <div class="h-full rounded-full transition-all duration-700 ease-out" [class]="bar.color"
                         [style.width]="bar.pct + '%'"></div>
                  </div>
                </div>
              }
            </div>
          </div>
        }

        <!-- Costs preview (step 3) -->
        @if (currentStep() === 3) {
          <div class="bg-white rounded-2xl border border-zinc-100 shadow-card p-4 transition-all duration-300">
            <p class="text-xs text-zinc-400 font-body mb-3 flex items-center gap-1.5">
              <svg class="w-3 h-3 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"/>
              </svg>
              Costi Annuali
            </p>

            <div class="space-y-2">
              <div class="flex justify-between items-baseline text-xs">
                <span class="text-zinc-500 font-body">Personale</span>
                <span class="font-mono font-semibold text-rose-500">−€{{ formatNum(data.numEmployees * data.avgSalary * 1.35) }}</span>
              </div>
              <div class="flex justify-between items-baseline text-xs">
                <span class="text-zinc-500 font-body">Marketing</span>
                <span class="font-mono font-semibold text-rose-500">−€{{ formatNum(data.marketingBudget) }}</span>
              </div>
              <div class="border-t border-zinc-100 pt-2 flex justify-between items-baseline">
                <span class="text-xs text-zinc-600 font-semibold font-body">EBITDA stimato</span>
                <span [ngClass]="[
                  'font-mono font-bold text-sm',
                  estimatedEbitda() >= 0 ? 'text-emerald-600' : 'text-rose-500'
                ]">
                  {{ estimatedEbitda() >= 0 ? '+' : '' }}€{{ formatNum(estimatedEbitda()) }}
                </span>
              </div>
            </div>
          </div>

          <!-- Quick verdict -->
          <div [ngClass]="[
            'rounded-2xl border p-4 transition-all duration-500',
            estimatedEbitda() >= 0
              ? 'bg-emerald-50 border-emerald-100'
              : 'bg-amber-50 border-amber-100'
          ]">
            <p class="text-xs font-bold mb-1 font-body"
               [class]="estimatedEbitda() >= 0 ? 'text-emerald-700' : 'text-amber-700'">
              {{ estimatedEbitda() >= 0 ? '✅ Piano sostenibile' : '⚠️ Rivedere i costi' }}
            </p>
            <p class="text-xs font-body leading-relaxed"
               [class]="estimatedEbitda() >= 0 ? 'text-emerald-600' : 'text-amber-600'">
              {{ estimatedEbitda() >= 0
                ? 'Il tuo piano mostra un EBITDA positivo. Genera il piano per il dettaglio completo.'
                : 'I costi superano i ricavi stimati. Considera di aumentare il prezzo o il volume.' }}
            </p>
          </div>
        }

      </div>

    </div>

    <!-- ═══ FOOTER NAV ══════════════════════════════════════════════════════ -->
    <div class="flex-shrink-0 px-8 py-4 border-t border-zinc-100 bg-white flex items-center justify-between">

      <button (click)="prevStep()"
              [disabled]="currentStep() === 1"
              [ngClass]="[
                'flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl transition-all duration-200 font-body',
                currentStep() === 1
                  ? 'text-zinc-300 cursor-not-allowed'
                  : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
              ]">
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/>
        </svg>
        Indietro
      </button>

      <!-- Step dots -->
      <div class="flex items-center gap-2">
        @for (step of steps; track step.id) {
          <button (click)="jumpToStep(step.id)"
                  [disabled]="step.id > maxReachedStep()"
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

  currentStep = signal(1);
  maxReachedStep = signal(1);
  animDir = signal<'fwd' | 'bwd'>('fwd');

  readonly stepClass = computed(() =>
    this.animDir() === 'fwd' ? 'step-fwd' : 'step-bwd'
  );

  steps = [
    { id: 1, label: 'Setup' },
    { id: 2, label: 'Ricavi' },
    { id: 3, label: 'Costi' },
  ];

  data = {
    projectName:     '',
    startYear:       2025,
    taxRate:         24,
    productName:     '',
    productPrice:    49,
    monthlyVolume:   100,
    numEmployees:    3,
    avgSalary:       40000,
    marketingBudget: 24000,
  };

  readonly trackWidth = computed(() => {
    const pct = ((this.currentStep() - 1) / (this.steps.length - 1)) * 100;
    return `${pct}%`;
  });

  readonly estimatedEbitda = computed(() => {
    const revenue   = this.data.productPrice * this.data.monthlyVolume * 12;
    const personnel = this.data.numEmployees * this.data.avgSalary * 1.35;
    const cogs      = revenue * 0.4;
    return Math.round(revenue - cogs - personnel - this.data.marketingBudget);
  });

  readonly revenueBars = computed(() => {
    const m   = this.data.productPrice * this.data.monthlyVolume;
    const y1  = m * 12;
    const y2  = m * 12 * 1.5;
    const max = y2 || 1;
    return [
      { label: 'Mese',   pct: Math.min((m  / max) * 100, 100), color: 'bg-zinc-300' },
      { label: 'Anno 1', pct: Math.min((y1 / max) * 100, 100), color: 'bg-emerald-400' },
      { label: 'Anno 2', pct: Math.min((y2 / max) * 100, 100), color: 'bg-brand-400' },
    ];
  });

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
