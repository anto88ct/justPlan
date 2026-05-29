import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-login',
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
    @keyframes glowPulse {
      0%, 100% { opacity: 0.35; }
      50%      { opacity: 0.65; }
    }

    .auth-enter { animation: authEnter 0.55s cubic-bezier(0.16,1,0.3,1) both; }
    .auth-enter-delay-1 { animation: authEnter 0.55s 0.07s cubic-bezier(0.16,1,0.3,1) both; }
    .auth-enter-delay-2 { animation: authEnter 0.55s 0.14s cubic-bezier(0.16,1,0.3,1) both; }
    .auth-enter-delay-3 { animation: authEnter 0.55s 0.21s cubic-bezier(0.16,1,0.3,1) both; }
    .auth-enter-delay-4 { animation: authEnter 0.55s 0.28s cubic-bezier(0.16,1,0.3,1) both; }
    .auth-enter-delay-5 { animation: authEnter 0.55s 0.35s cubic-bezier(0.16,1,0.3,1) both; }

    .orb-1 { animation: floatOrb 6s ease-in-out infinite; }
    .orb-2 { animation: floatOrb 8s ease-in-out 1.5s infinite; }
    .orb-3 { animation: floatOrb 5s ease-in-out 3s infinite; }
    .glow-pulse { animation: glowPulse 4s ease-in-out infinite; }

    .field-input {
      transition: border-color 0.2s, box-shadow 0.2s;
    }
    .field-input:focus {
      border-color: #6366f1;
      box-shadow: 0 0 0 3px rgba(99,102,241,0.18);
      outline: none;
    }

    .btn-primary {
      transition: transform 0.15s, box-shadow 0.15s, background-color 0.15s;
    }
    .btn-primary:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 8px 24px rgba(99,102,241,0.45);
    }
    .btn-primary:active:not(:disabled) {
      transform: translateY(0);
    }

    .google-btn {
      transition: transform 0.15s, background-color 0.15s, box-shadow 0.15s;
    }
    .google-btn:hover {
      transform: translateY(-1px);
      background-color: #f8fafc;
      box-shadow: 0 4px 12px rgba(0,0,0,0.12);
    }

    .testimonial-wrap {
      transition: opacity 0.4s cubic-bezier(0.4,0,0.2,1), transform 0.4s cubic-bezier(0.4,0,0.2,1);
    }
    .testimonial-wrap.fading {
      opacity: 0;
      transform: translateY(-10px);
    }

    .dot {
      transition: width 0.4s cubic-bezier(0.4,0,0.2,1), background-color 0.4s ease;
    }

    @keyframes progressBar {
      from { width: 0%; }
      to   { width: 100%; }
    }
    .progress-fill {
      animation: progressBar 4s linear forwards;
    }
  `],
  template: `
    <div class="min-h-screen w-full flex bg-zinc-950 overflow-hidden">

      <!-- ══ LEFT PANEL — Branding ══ -->
      <div class="hidden lg:flex lg:w-[52%] xl:w-[55%] relative flex-col justify-between p-12 overflow-hidden flex-shrink-0">

        <!-- Background layers -->
        <div class="absolute inset-0"
             style="background: linear-gradient(135deg, #0f0e1a 0%, #14123a 45%, #1a1060 100%);"></div>

        <!-- Ambient orbs -->
        <div class="absolute top-[-80px] left-[-60px] w-[420px] h-[420px] rounded-full pointer-events-none orb-1 glow-pulse"
             style="background: radial-gradient(circle, rgba(99,102,241,0.28) 0%, transparent 65%);"></div>
        <div class="absolute bottom-[-120px] right-[-80px] w-[500px] h-[500px] rounded-full pointer-events-none orb-2"
             style="background: radial-gradient(circle, rgba(139,92,246,0.22) 0%, transparent 60%);"></div>
        <div class="absolute top-[40%] right-[10%] w-64 h-64 rounded-full pointer-events-none orb-3"
             style="background: radial-gradient(circle, rgba(79,70,229,0.18) 0%, transparent 65%);"></div>

        <!-- Grid pattern -->
        <div class="absolute inset-0 pointer-events-none opacity-[0.04]"
             style="background-image: linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px),
                                      linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px);
                    background-size: 48px 48px;"></div>

        <!-- Top logo -->
        <div class="relative z-10">
          <a routerLink="/" class="inline-flex items-center gap-3 group">
            <div class="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
                 style="background: linear-gradient(135deg, #6366f1, #8b5cf6); box-shadow: 0 4px 18px rgba(99,102,241,0.5);">
              <svg class="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
              </svg>
            </div>
            <span class="text-xl font-bold text-white tracking-tight font-display">AirPlan</span>
          </a>
        </div>

        <!-- Central hero copy -->
        <div class="relative z-10 max-w-md">
          <div class="inline-flex items-center gap-2 mb-6 px-3 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10">
            <div class="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse"></div>
            <span class="text-xs font-semibold text-indigo-300 font-body tracking-wide">Business Planning con AI</span>
          </div>

          <h1 class="text-4xl xl:text-5xl font-bold text-white font-display leading-[1.12] mb-5">
            Il tuo Business<br>Plan,&nbsp;
            <span style="background: linear-gradient(90deg, #a5b4fc, #c084fc);
                         -webkit-background-clip: text; -webkit-text-fill-color: transparent;
                         background-clip: text;">senza limiti.</span>
          </h1>

          <p class="text-zinc-400 font-body text-base leading-relaxed mb-10 max-w-sm">
            Tre minuti per inserire i dati. L'AI CFO genera proiezioni finanziarie, analisi di scenario e report professionali.
          </p>

          <!-- Feature list -->
          <div class="space-y-3.5">
            @for (f of features; track f.label) {
              <div class="flex items-center gap-3">
                <div class="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                     style="background: rgba(99,102,241,0.18); border: 1px solid rgba(99,102,241,0.3);">
                  <svg class="w-3.5 h-3.5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
                  </svg>
                </div>
                <span class="text-sm text-zinc-300 font-body">{{ f.label }}</span>
              </div>
            }
          </div>
        </div>

        <!-- Animated testimonials carousel -->
        <div class="relative z-10">

          <!-- Card -->
          <div class="testimonial-wrap p-5 rounded-2xl border border-white/8"
               [class.fading]="isFading()"
               style="background: rgba(255,255,255,0.04); backdrop-filter: blur(12px);">

            <!-- Stars -->
            <div class="flex gap-0.5 mb-3">
              @for (s of [1,2,3,4,5]; track s) {
                <svg class="w-3.5 h-3.5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                </svg>
              }
            </div>

            <!-- Quote -->
            <p class="text-sm text-zinc-200 font-body leading-relaxed italic mb-4">
              "{{ testimonials[activeIdx()].quote }}"
            </p>

            <!-- Author -->
            <div class="flex items-center gap-3">
              <div class="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-xs font-bold text-white font-display"
                   [style.background]="testimonials[activeIdx()].gradient">
                {{ testimonials[activeIdx()].initial }}
              </div>
              <div>
                <p class="text-xs font-semibold text-zinc-200 font-body">{{ testimonials[activeIdx()].name }}</p>
                <p class="text-xs text-zinc-600 font-body">{{ testimonials[activeIdx()].role }}</p>
              </div>
            </div>
          </div>

          <!-- Progress bar + dots -->
          <div class="mt-3 flex items-center gap-3">

            <!-- Dots -->
            <div class="flex items-center gap-1.5 flex-1">
              @for (t of testimonials; track t.name; let i = $index) {
                <button (click)="goTo(i)"
                        class="dot h-1.5 rounded-full"
                        [style.width]="activeIdx() === i ? '24px' : '6px'"
                        [style.background-color]="activeIdx() === i ? '#818cf8' : 'rgba(255,255,255,0.15)'">
                </button>
              }
            </div>

            <!-- Progress bar (recreated each slide to restart animation) -->
            <div class="flex-1 h-[2px] rounded-full overflow-hidden bg-white/10">
              @for (k of [progressKey()]; track k) {
                <div class="progress-fill h-full rounded-full bg-indigo-400/70"></div>
              }
            </div>

          </div>
        </div>
      </div>

      <!-- ══ RIGHT PANEL — Form ══ -->
      <div class="flex-1 flex flex-col justify-center items-center px-6 py-10 relative overflow-y-auto"
           style="background: #0b0b14;">

        <!-- Mobile logo -->
        <div class="lg:hidden mb-8 flex items-center gap-2.5 auth-enter">
          <div class="w-9 h-9 rounded-xl flex items-center justify-center"
               style="background: linear-gradient(135deg, #6366f1, #8b5cf6);">
            <svg class="w-4.5 h-4.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
            </svg>
          </div>
          <span class="text-lg font-bold text-white font-display">AirPlan</span>
        </div>

        <div class="w-full max-w-[380px]">

          <!-- Header -->
          <div class="mb-8 auth-enter">
            <h2 class="text-2xl font-bold text-white font-display mb-1.5">Bentornato</h2>
            <p class="text-sm text-zinc-500 font-body">
              Nessun account?
              <a routerLink="/register"
                 class="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors ml-1">
                Registrati gratis
              </a>
            </p>
          </div>

          <!-- Google OAuth -->
          <div class="auth-enter-delay-1">
            <button (click)="onGoogleLogin()"
                    class="google-btn w-full flex items-center justify-center gap-3 px-4 py-3
                           bg-white rounded-xl border border-zinc-200 text-zinc-700
                           text-sm font-semibold font-body shadow-sm">
              <svg class="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Accedi con Google
            </button>
          </div>

          <!-- Divider -->
          <div class="flex items-center gap-3 my-6 auth-enter-delay-2">
            <div class="flex-1 h-px bg-zinc-800"></div>
            <span class="text-xs text-zinc-600 font-body">oppure</span>
            <div class="flex-1 h-px bg-zinc-800"></div>
          </div>

          <!-- Form -->
          <form (ngSubmit)="onSubmit()" class="space-y-4">

            <!-- Email -->
            <div class="auth-enter-delay-2">
              <label class="block text-xs font-semibold text-zinc-400 font-body mb-1.5 uppercase tracking-wide">
                Email
              </label>
              <input
                type="email"
                [(ngModel)]="email"
                name="email"
                placeholder="nome@azienda.com"
                autocomplete="email"
                required
                class="field-input w-full px-4 py-3 rounded-xl text-sm font-body text-white placeholder-zinc-600
                       border border-zinc-800 bg-zinc-900"
              />
            </div>

            <!-- Password -->
            <div class="auth-enter-delay-3">
              <label class="block text-xs font-semibold text-zinc-400 font-body mb-1.5 uppercase tracking-wide">
                Password
              </label>
              <div class="relative">
                <input
                  [type]="showPassword() ? 'text' : 'password'"
                  [(ngModel)]="password"
                  name="password"
                  placeholder="••••••••"
                  autocomplete="current-password"
                  required
                  class="field-input w-full px-4 py-3 pr-11 rounded-xl text-sm font-body text-white placeholder-zinc-600
                         border border-zinc-800 bg-zinc-900"
                />
                <button type="button"
                        (click)="togglePassword()"
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
            </div>

            <!-- Remember + Forgot -->
            <div class="flex items-center justify-between auth-enter-delay-4">
              <label class="flex items-center gap-2 cursor-pointer group">
                <input type="checkbox" [(ngModel)]="rememberMe" name="rememberMe"
                       class="w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-brand-600
                              accent-indigo-500 cursor-pointer" />
                <span class="text-xs text-zinc-500 font-body group-hover:text-zinc-300 transition-colors">
                  Ricordami
                </span>
              </label>
              <a routerLink="/forgot-password"
                 class="text-xs text-indigo-400 hover:text-indigo-300 font-semibold font-body transition-colors">
                Password dimenticata?
              </a>
            </div>

            <!-- Submit -->
            <div class="pt-2 auth-enter-delay-5">
              <button
                type="submit"
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
                    Accesso in corso…
                  </span>
                } @else {
                  Accedi
                }
              </button>
            </div>

          </form>

          <!-- Footer note -->
          <p class="mt-8 text-xs text-zinc-700 font-body text-center auth-enter-delay-5">
            Accedendo accetti i nostri
            <a href="#" class="text-zinc-500 hover:text-zinc-300 underline transition-colors">Termini</a>
            e la
            <a href="#" class="text-zinc-500 hover:text-zinc-300 underline transition-colors">Privacy Policy</a>
          </p>

        </div>
      </div>
    </div>
  `,
})
export class LoginComponent implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private intervalId: ReturnType<typeof setInterval> | null = null;

  email = '';
  password = '';
  rememberMe = false;

  showPassword = signal(false);
  loading = signal(false);
  activeIdx = signal(0);
  isFading = signal(false);
  progressKey = signal(0);

  testimonials = [
    {
      quote: 'Ho creato un business plan completo in meno di 10 minuti. Incredibile.',
      name: 'Giulia M.',
      role: 'CEO — TechFlow',
      initial: 'G',
      gradient: 'linear-gradient(135deg, #f59e0b, #ef4444)',
    },
    {
      quote: 'Finalmente uno strumento che parla la lingua di chi fa impresa. Le proiezioni sono puntuali.',
      name: 'Marco R.',
      role: 'Co-founder — DataBridge',
      initial: 'M',
      gradient: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    },
    {
      quote: 'Ho presentato il piano agli investitori e li ha impressionati. Tutto generato in pochi minuti.',
      name: 'Sara P.',
      role: 'CFO — NovaMed',
      initial: 'S',
      gradient: 'linear-gradient(135deg, #10b981, #06b6d4)',
    },
    {
      quote: 'L\'AI Copilot mi ha aiutato a capire dove tagliare i costi e aumentare il runway di 4 mesi.',
      name: 'Luca T.',
      role: 'Founder — GreenLoop',
      initial: 'L',
      gradient: 'linear-gradient(135deg, #f97316, #ec4899)',
    },
    {
      quote: 'Usare AirPlan è stato più veloce di qualsiasi consulente. Risultati professionali al primo tentativo.',
      name: 'Elena B.',
      role: 'Product Manager — CloudSphere',
      initial: 'E',
      gradient: 'linear-gradient(135deg, #8b5cf6, #d946ef)',
    },
  ];

  features = [
    { label: 'Wizard guidato in 3 minuti' },
    { label: 'Dashboard KPI in tempo reale' },
    { label: 'AI Copilot per scenari What-If' },
    { label: 'Export PDF professionale' },
  ];

  ngOnInit(): void {
    this.intervalId = setInterval(() => this.advance(), 4000);
  }

  ngOnDestroy(): void {
    if (this.intervalId) clearInterval(this.intervalId);
  }

  advance(): void {
    this.isFading.set(true);
    setTimeout(() => {
      this.activeIdx.set((this.activeIdx() + 1) % this.testimonials.length);
      this.progressKey.update(k => k + 1);
      this.isFading.set(false);
    }, 400);
  }

  goTo(idx: number): void {
    if (idx === this.activeIdx()) return;
    if (this.intervalId) clearInterval(this.intervalId);
    this.isFading.set(true);
    setTimeout(() => {
      this.activeIdx.set(idx);
      this.progressKey.update(k => k + 1);
      this.isFading.set(false);
      this.intervalId = setInterval(() => this.advance(), 4000);
    }, 400);
  }

  togglePassword(): void {
    this.showPassword.set(!this.showPassword());
  }

  onSubmit(): void {
    if (!this.email || !this.password) return;
    this.loading.set(true);
    console.log('Login effettuato con:', this.email, this.password, { rememberMe: this.rememberMe });
    // TODO: chiamata API di autenticazione → replace setTimeout con HTTP call
    setTimeout(() => {
      this.loading.set(false);
      this.router.navigate(['/app']);
    }, 1000);
  }

  onGoogleLogin(): void {
    console.log('Login con Google avviato');
    // TODO: integrare Google OAuth provider
    this.router.navigate(['/app']);
  }
}
