import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  styles: [`
    :host { display: block; min-height: 100vh; }

    @keyframes authEnter {
      from { opacity: 0; transform: translateY(20px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes floatOrb {
      0%, 100% { transform: translateY(0px) scale(1); }
      50%      { transform: translateY(-18px) scale(1.04); }
    }

    .auth-enter   { animation: authEnter 0.55s cubic-bezier(0.16,1,0.3,1) both; }
    .auth-enter-d1 { animation: authEnter 0.55s 0.07s cubic-bezier(0.16,1,0.3,1) both; }
    .auth-enter-d2 { animation: authEnter 0.55s 0.14s cubic-bezier(0.16,1,0.3,1) both; }
    .auth-enter-d3 { animation: authEnter 0.55s 0.21s cubic-bezier(0.16,1,0.3,1) both; }
    .auth-enter-d4 { animation: authEnter 0.55s 0.28s cubic-bezier(0.16,1,0.3,1) both; }
    .auth-enter-d5 { animation: authEnter 0.55s 0.35s cubic-bezier(0.16,1,0.3,1) both; }
    .auth-enter-d6 { animation: authEnter 0.55s 0.42s cubic-bezier(0.16,1,0.3,1) both; }
    .auth-enter-d7 { animation: authEnter 0.55s 0.49s cubic-bezier(0.16,1,0.3,1) both; }

    .orb-1 { animation: floatOrb 7s ease-in-out infinite; }
    .orb-2 { animation: floatOrb 9s ease-in-out 2s infinite; }

    .field-input { transition: border-color 0.2s, box-shadow 0.2s; min-height: 48px; }
    .field-input:focus {
      border-color: #6366f1;
      box-shadow: 0 0 0 3px rgba(99,102,241,0.18);
      outline: none;
    }

    .btn-primary { transition: transform 0.15s, box-shadow 0.15s; }
    .btn-primary:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 8px 24px rgba(99,102,241,0.45);
    }
    .btn-primary:active:not(:disabled) { transform: translateY(0); }

    .strength-bar { transition: width 0.35s cubic-bezier(0.16,1,0.3,1), background-color 0.35s; }

    .google-btn { transition: transform 0.15s, background-color 0.15s, box-shadow 0.15s; min-height: 48px; }
    .google-btn:hover {
      transform: translateY(-1px);
      background-color: #f8fafc;
      box-shadow: 0 4px 12px rgba(0,0,0,0.12);
    }
  `],
  template: `
    <div class="min-h-screen w-full flex bg-zinc-950 overflow-hidden">

      <!-- LEFT PANEL -->
      <div class="hidden lg:flex lg:w-[45%] xl:w-[48%] relative flex-col justify-between p-12 overflow-hidden flex-shrink-0">
        <div class="absolute inset-0"
             style="background: linear-gradient(145deg, #0c0b1e 0%, #13113a 50%, #1a0f50 100%);"></div>

        <div class="absolute top-[-60px] right-[-80px] w-[380px] h-[380px] rounded-full pointer-events-none orb-1"
             style="background: radial-gradient(circle, rgba(139,92,246,0.30) 0%, transparent 60%);"></div>
        <div class="absolute bottom-[-100px] left-[-40px] w-[420px] h-[420px] rounded-full pointer-events-none orb-2"
             style="background: radial-gradient(circle, rgba(99,102,241,0.22) 0%, transparent 58%);"></div>

        <!-- Dots pattern -->
        <div class="absolute inset-0 pointer-events-none opacity-[0.06]"
             style="background-image: radial-gradient(rgba(255,255,255,0.7) 1px, transparent 1px);
                    background-size: 28px 28px;"></div>

        <!-- Logo -->
        <div class="relative z-10">
          <a routerLink="/" class="inline-flex items-center gap-3">
            <div class="w-10 h-10 rounded-2xl flex items-center justify-center"
                 style="background: linear-gradient(135deg, #6366f1, #8b5cf6); box-shadow: 0 4px 18px rgba(99,102,241,0.5);">
              <svg class="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
              </svg>
            </div>
            <span class="text-xl font-bold text-white tracking-tight font-display">Businext Plan</span>
          </a>
        </div>

        <!-- Hero -->
        <div class="relative z-10 max-w-sm">
          <p class="text-xs font-semibold text-violet-400 uppercase tracking-widest font-body mb-4">
            Unisciti a 2.400+ fondatori
          </p>
          <h1 class="text-4xl xl:text-5xl font-bold text-white font-display leading-[1.12] mb-5">
            Dai vita<br>alla tua
            <span style="background: linear-gradient(90deg, #c084fc, #f0abfc);
                         -webkit-background-clip: text; -webkit-text-fill-color: transparent;
                         background-clip: text;"> idea.</span>
          </h1>
          <p class="text-zinc-400 font-body text-sm leading-relaxed mb-10">
            Crea il tuo account gratuito e inizia a costruire business plan professionali con il supporto dell'AI.
          </p>

          <!-- Steps -->
          <div class="space-y-4">
            @for (step of steps; track step.n) {
              <div class="flex items-center gap-4">
                <div class="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-xs font-bold font-mono text-white"
                     style="background: linear-gradient(135deg, #6366f1, #8b5cf6);">
                  {{ step.n }}
                </div>
                <div>
                  <p class="text-sm font-semibold text-zinc-200 font-body">{{ step.title }}</p>
                  <p class="text-xs text-zinc-600 font-body">{{ step.desc }}</p>
                </div>
              </div>
            }
          </div>
        </div>

        <!-- Bottom badges -->
        <div class="relative z-10 flex items-center gap-3">
          <div class="flex items-center gap-2 px-3 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10">
            <div class="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
            <span class="text-xs text-emerald-400 font-body font-semibold">Gratuito</span>
          </div>
          <div class="flex items-center gap-2 px-3 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10">
            <div class="w-1.5 h-1.5 rounded-full bg-indigo-400"></div>
            <span class="text-xs text-indigo-300 font-body font-semibold">Nessuna carta</span>
          </div>
        </div>
      </div>

      <!-- RIGHT PANEL — Register Form -->
      <div class="flex-1 flex flex-col justify-center items-center px-5 py-8 md:py-10 relative overflow-y-auto"
           style="background: #0b0b14;">

        <!-- Mobile logo -->
        <div class="lg:hidden mb-8 flex items-center gap-2.5 auth-enter">
          <div class="w-9 h-9 rounded-xl flex items-center justify-center"
               style="background: linear-gradient(135deg, #6366f1, #8b5cf6);">
            <svg class="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
            </svg>
          </div>
          <span class="text-lg font-bold text-white font-display">Businext Plan</span>
        </div>

        <div class="w-full max-w-[380px] mx-auto">

          <!-- Header -->
          <div class="mb-7 auth-enter">
            <h2 class="text-2xl font-bold text-white font-display mb-1.5">Crea account</h2>
            <p class="text-sm text-zinc-500 font-body">
              Hai già un account?
              <a routerLink="/login" class="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors ml-1">
                Accedi
              </a>
            </p>
          </div>

          <!-- Google -->
          <div class="auth-enter-d1">
            <button (click)="onGoogleRegister()"
                    class="google-btn w-full flex items-center justify-center gap-3 px-4 py-3
                           bg-white rounded-xl border border-zinc-200 text-zinc-700 text-sm font-semibold font-body shadow-sm">
              <svg class="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Registrati con Google
            </button>
          </div>

          <!-- Divider -->
          <div class="flex items-center gap-3 my-5 auth-enter-d2">
            <div class="flex-1 h-px bg-zinc-800"></div>
            <span class="text-xs text-zinc-600 font-body">oppure</span>
            <div class="flex-1 h-px bg-zinc-800"></div>
          </div>

          <!-- Form -->
          <form (ngSubmit)="onSubmit()" class="space-y-4">

            <!-- Nome -->
            <div class="auth-enter-d2">
              <label class="block text-xs font-semibold text-zinc-400 font-body mb-1.5 uppercase tracking-wide">
                Nome completo
              </label>
              <input type="text" [(ngModel)]="name" name="name"
                     placeholder="Mario Rossi" autocomplete="name" required
                     class="field-input w-full px-4 py-3 rounded-xl text-sm font-body text-white placeholder-zinc-600
                            border border-zinc-800 bg-zinc-900" />
            </div>

            <!-- Nome azienda (opzionale) -->
            <div class="auth-enter-d3">
              <label class="block text-xs font-semibold text-zinc-400 font-body mb-1.5 uppercase tracking-wide">
                Nome azienda <span class="text-zinc-600 font-normal normal-case">(opzionale)</span>
              </label>
              <input type="text" [(ngModel)]="companyName" name="companyName"
                     placeholder="La tua startup"
                     class="field-input w-full px-4 py-3 rounded-xl text-sm font-body text-white placeholder-zinc-600
                            border border-zinc-800 bg-zinc-900" />
            </div>

            <!-- Email -->
            <div class="auth-enter-d4">
              <label class="block text-xs font-semibold text-zinc-400 font-body mb-1.5 uppercase tracking-wide">
                Email
              </label>
              <input type="email" [(ngModel)]="email" name="email"
                     placeholder="mario@startup.it" autocomplete="email" required
                     class="field-input w-full px-4 py-3 rounded-xl text-sm font-body text-white placeholder-zinc-600
                            border border-zinc-800 bg-zinc-900" />
            </div>

            <!-- Password -->
            <div class="auth-enter-d5">
              <label class="block text-xs font-semibold text-zinc-400 font-body mb-1.5 uppercase tracking-wide">
                Password
              </label>
              <div class="relative">
                <input [type]="showPassword() ? 'text' : 'password'"
                       [(ngModel)]="password" name="password"
                       placeholder="Min. 8 caratteri" autocomplete="new-password" required
                       (input)="calcStrength()"
                       class="field-input w-full px-4 py-3 pr-11 rounded-xl text-sm font-body text-white placeholder-zinc-600
                              border border-zinc-800 bg-zinc-900" />
                <button type="button" (click)="togglePassword()"
                        class="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-300 transition-colors p-1">
                  @if (showPassword()) {
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/>
                    </svg>
                  } @else {
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                      <path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                    </svg>
                  }
                </button>
              </div>

              <!-- Strength meter -->
              @if (password.length > 0) {
                <div class="mt-2">
                  <div class="h-1 w-full bg-zinc-800 rounded-full overflow-hidden">
                    <div class="h-full rounded-full strength-bar"
                         [style.width]="strengthPercent() + '%'"
                         [style.background-color]="strengthColor()"></div>
                  </div>
                  <p class="text-xs mt-1 font-body" [style.color]="strengthColor()">
                    {{ strengthLabel() }}
                  </p>
                </div>
              }
            </div>

            <!-- Confirm Password -->
            <div class="auth-enter-d6">
              <label class="block text-xs font-semibold text-zinc-400 font-body mb-1.5 uppercase tracking-wide">
                Conferma password
              </label>
              <input [type]="showPassword() ? 'text' : 'password'"
                     [(ngModel)]="confirmPassword" name="confirmPassword"
                     placeholder="Ripeti la password" autocomplete="new-password" required
                     class="field-input w-full px-4 py-3 rounded-xl text-sm font-body placeholder-zinc-600
                            border bg-zinc-900"
                     [class.text-white]="!confirmPassword || password === confirmPassword"
                     [class.text-rose-400]="confirmPassword && password !== confirmPassword"
                     [class.border-zinc-800]="!confirmPassword || password === confirmPassword"
                     [class.border-rose-500]="confirmPassword && password !== confirmPassword" />
              @if (confirmPassword && password !== confirmPassword) {
                <p class="text-xs text-rose-400 font-body mt-1">Le password non coincidono</p>
              }
            </div>

            <!-- Submit -->
            <div class="pt-2 auth-enter-d7">
              <button type="submit"
                      [disabled]="loading() || (!!confirmPassword && password !== confirmPassword)"
                      class="btn-primary w-full py-3 px-4 rounded-xl text-sm font-bold font-body text-white
                             disabled:opacity-60 disabled:cursor-not-allowed"
                      style="background: linear-gradient(135deg, #6366f1, #7c3aed);">
                @if (loading()) {
                  <span class="flex items-center justify-center gap-2">
                    <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                    Creazione account…
                  </span>
                } @else {
                  Crea account gratuito
                }
              </button>
            </div>
          </form>

          <p class="mt-6 text-xs text-zinc-700 font-body text-center auth-enter-d7">
            Creando un account accetti i nostri
            <a href="#" class="text-zinc-500 hover:text-zinc-300 underline transition-colors">Termini di servizio</a>
            e la
            <a href="#" class="text-zinc-500 hover:text-zinc-300 underline transition-colors">Privacy Policy</a>
          </p>
        </div>
      </div>
    </div>
  `,
})
export class RegisterComponent {
  private readonly router = inject(Router);

  name = '';
  email = '';
  companyName = '';
  password = '';
  confirmPassword = '';

  showPassword = signal(false);
  loading = signal(false);

  private _strengthScore = 0;

  steps = [
    { n: '1', title: 'Crea il tuo account', desc: 'Gratis, nessuna carta richiesta' },
    { n: '2', title: 'Inserisci i dati aziendali', desc: 'Wizard guidato in 3 minuti' },
    { n: '3', title: 'Ottieni il tuo Business Plan', desc: "L'AI genera tutto in secondi" },
  ];

  togglePassword(): void {
    this.showPassword.set(!this.showPassword());
  }

  calcStrength(): void {
    const p = this.password;
    let score = 0;
    if (p.length >= 8)  score++;
    if (p.length >= 12) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[0-9]/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;
    this._strengthScore = score;
  }

  strengthPercent(): number {
    return Math.min(100, (this._strengthScore / 5) * 100);
  }

  strengthColor(): string {
    if (this._strengthScore <= 1) return '#ef4444';
    if (this._strengthScore <= 2) return '#f97316';
    if (this._strengthScore <= 3) return '#eab308';
    return '#22c55e';
  }

  strengthLabel(): string {
    if (this._strengthScore <= 1) return 'Debole';
    if (this._strengthScore <= 2) return 'Discreta';
    if (this._strengthScore <= 3) return 'Buona';
    return 'Sicura';
  }

  onSubmit(): void {
    if (!this.name || !this.email || !this.password) return;
    if (this.password !== this.confirmPassword) return;
    this.loading.set(true);
    console.log('Registrazione con:', this.name, this.email, this.password);
    // TODO: chiamata API di registrazione → replace setTimeout con HTTP call
    setTimeout(() => {
      this.loading.set(false);
      this.router.navigate(['/app']);
    }, 1000);
  }

  onGoogleRegister(): void {
    console.log('Registrazione con Google avviata');
    // TODO: integrare Google OAuth provider
    this.router.navigate(['/app']);
  }
}
