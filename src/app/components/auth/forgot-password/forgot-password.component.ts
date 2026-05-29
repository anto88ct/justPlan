import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  styles: [`
    :host { display: block; min-height: 100vh; }

    @keyframes authEnter {
      from { opacity: 0; transform: translateY(20px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes floatOrb {
      0%, 100% { transform: translateY(0px); }
      50%      { transform: translateY(-16px); }
    }
    @keyframes successPop {
      0%   { opacity: 0; transform: scale(0.85) translateY(12px); }
      60%  { transform: scale(1.03) translateY(-2px); }
      100% { opacity: 1; transform: scale(1) translateY(0); }
    }

    .auth-enter    { animation: authEnter 0.55s cubic-bezier(0.16,1,0.3,1) both; }
    .auth-enter-d1 { animation: authEnter 0.55s 0.08s cubic-bezier(0.16,1,0.3,1) both; }
    .auth-enter-d2 { animation: authEnter 0.55s 0.16s cubic-bezier(0.16,1,0.3,1) both; }
    .auth-enter-d3 { animation: authEnter 0.55s 0.24s cubic-bezier(0.16,1,0.3,1) both; }

    .orb-1 { animation: floatOrb 7s ease-in-out infinite; }
    .orb-2 { animation: floatOrb 10s ease-in-out 3s infinite; }

    .success-pop { animation: successPop 0.55s cubic-bezier(0.16,1,0.3,1) both; }

    .field-input { transition: border-color 0.2s, box-shadow 0.2s; min-height: 48px; }
    .field-input:focus {
      border-color: #6366f1;
      box-shadow: 0 0 0 3px rgba(99,102,241,0.18);
      outline: none;
    }

    .btn-primary { transition: transform 0.15s, box-shadow 0.15s; min-height: 48px; }
    .btn-primary:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 8px 24px rgba(99,102,241,0.45);
    }
  `],
  template: `
    <div class="min-h-screen w-full flex items-center justify-center bg-zinc-950 relative overflow-hidden">

      <!-- Background orbs -->
      <div class="absolute top-[-100px] left-[-80px] w-[500px] h-[500px] rounded-full pointer-events-none orb-1"
           style="background: radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 60%);"></div>
      <div class="absolute bottom-[-120px] right-[-60px] w-[420px] h-[420px] rounded-full pointer-events-none orb-2"
           style="background: radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 58%);"></div>

      <!-- Grid -->
      <div class="absolute inset-0 pointer-events-none opacity-[0.03]"
           style="background-image: linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px),
                                    linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px);
                  background-size: 48px 48px;"></div>

      <!-- Card -->
      <div class="relative z-10 w-full max-w-[400px] px-5 py-8 md:py-10 md:px-0">

        <!-- Logo -->
        <div class="flex justify-center mb-10 auth-enter">
          <a routerLink="/login" class="inline-flex items-center gap-3 group">
            <div class="w-11 h-11 rounded-2xl flex items-center justify-center"
                 style="background: linear-gradient(135deg, #6366f1, #8b5cf6); box-shadow: 0 4px 18px rgba(99,102,241,0.5);">
              <svg class="w-5.5 h-5.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
              </svg>
            </div>
            <span class="text-xl font-bold text-white tracking-tight font-display">AirPlan</span>
          </a>
        </div>

        @if (!sent()) {
          <!-- Form state -->
          <div>
            <div class="text-center mb-8 auth-enter-d1">
              <!-- Icon -->
              <div class="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
                   style="background: linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.2));
                          border: 1px solid rgba(99,102,241,0.3);">
                <svg class="w-8 h-8 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.7">
                  <path stroke-linecap="round" stroke-linejoin="round"
                        d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/>
                </svg>
              </div>
              <h2 class="text-2xl font-bold text-white font-display mb-2">Password dimenticata?</h2>
              <p class="text-sm text-zinc-500 font-body leading-relaxed max-w-xs mx-auto">
                Inserisci la tua email. Ti invieremo un link per reimpostare la password.
              </p>
            </div>

            <form (ngSubmit)="onSubmit()" class="space-y-4">
              <div class="auth-enter-d2">
                <label class="block text-xs font-semibold text-zinc-400 font-body mb-1.5 uppercase tracking-wide">
                  Indirizzo email
                </label>
                <input type="email" [(ngModel)]="email" name="email"
                       placeholder="nome@azienda.com" autocomplete="email" required
                       class="field-input w-full px-4 py-3 rounded-xl text-sm font-body text-white placeholder-zinc-600
                              border border-zinc-800 bg-zinc-900" />
              </div>

              <div class="auth-enter-d3">
                <button type="submit"
                        [disabled]="loading()"
                        class="btn-primary w-full py-3 px-4 rounded-xl text-sm font-bold font-body text-white
                               disabled:opacity-60 disabled:cursor-not-allowed"
                        style="background: linear-gradient(135deg, #6366f1, #7c3aed);">
                  @if (loading()) {
                    <span class="flex items-center justify-center gap-2">
                      <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                      </svg>
                      Invio in corso…
                    </span>
                  } @else {
                    Invia link di recupero
                  }
                </button>
              </div>
            </form>

            <div class="mt-6 text-center auth-enter-d3">
              <a routerLink="/login"
                 class="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-300 font-body transition-colors">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
                </svg>
                Torna al login
              </a>
            </div>
          </div>

        } @else {
          <!-- Success state -->
          <div class="text-center success-pop">
            <div class="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6"
                 style="background: linear-gradient(135deg, rgba(34,197,94,0.2), rgba(16,185,129,0.15));
                        border: 1px solid rgba(34,197,94,0.35);">
              <svg class="w-10 h-10 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
              </svg>
            </div>

            <h2 class="text-2xl font-bold text-white font-display mb-2">Email inviata!</h2>
            <p class="text-sm text-zinc-500 font-body leading-relaxed mb-2">
              Abbiamo inviato un link di recupero a
            </p>
            <p class="text-sm font-semibold text-indigo-300 font-body mb-8">{{ email }}</p>

            <div class="p-4 rounded-2xl border border-zinc-800 bg-zinc-900/50 text-left mb-8">
              <p class="text-xs text-zinc-500 font-body leading-relaxed">
                Controlla la cartella spam se non trovi l'email.
                Il link scade dopo <span class="text-zinc-300 font-semibold">30 minuti</span>.
              </p>
            </div>

            <div class="flex flex-col gap-3">
              <button (click)="reset()"
                      class="w-full py-3 px-4 rounded-xl text-sm font-semibold font-body text-zinc-400
                             border border-zinc-800 hover:border-zinc-600 hover:text-zinc-200 transition-all">
                Reinvia email
              </button>
              <a routerLink="/login"
                 class="w-full py-3 px-4 rounded-xl text-sm font-bold font-body text-white text-center block
                        transition-all hover:-translate-y-0.5"
                 style="background: linear-gradient(135deg, #6366f1, #7c3aed);">
                Torna al login
              </a>
            </div>
          </div>
        }
      </div>
    </div>
  `,
})
export class ForgotPasswordComponent {
  email = '';
  loading = signal(false);
  sent = signal(false);

  onSubmit(): void {
    if (!this.email) return;
    this.loading.set(true);
    console.log('Recupero password per:', this.email);
    // TODO: chiamata API per invio email di recupero → replace setTimeout con HTTP call
    setTimeout(() => {
      this.loading.set(false);
      this.sent.set(true);
    }, 1000);
  }

  reset(): void {
    this.sent.set(false);
    console.log('Reinvio link per:', this.email);
    this.onSubmit();
  }
}
