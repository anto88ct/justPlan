import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-profile',
  standalone: true,
  host: { class: 'flex flex-col h-full overflow-hidden' },
  imports: [CommonModule, NgClass, FormsModule],
  styles: [`
    @keyframes profileEnter {
      from { opacity: 0; transform: translateY(10px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .pe-1 { animation: profileEnter 0.35s 0.04s cubic-bezier(0.16,1,0.3,1) both; }
    .pe-2 { animation: profileEnter 0.35s 0.10s cubic-bezier(0.16,1,0.3,1) both; }
    .pe-3 { animation: profileEnter 0.35s 0.17s cubic-bezier(0.16,1,0.3,1) both; }
    .pe-4 { animation: profileEnter 0.35s 0.24s cubic-bezier(0.16,1,0.3,1) both; }

    .avatar-overlay {
      opacity: 0;
      transition: opacity 0.18s;
      cursor: pointer;
    }
    .avatar-wrap:hover .avatar-overlay { opacity: 1; }

    .profile-input {
      transition: border-color 0.18s, box-shadow 0.18s;
    }
    .profile-input:focus {
      outline: none;
      border-color: #6366f1;
      box-shadow: 0 0 0 3px rgba(99,102,241,0.12);
    }

    @keyframes savePop {
      0%   { transform: scale(1); }
      40%  { transform: scale(1.06); }
      100% { transform: scale(1); }
    }
    .save-pop { animation: savePop 0.3s ease; }

    .contrib-cell {
      width: 11px;
      height: 11px;
      border-radius: 3px;
      transition: transform 0.12s ease, box-shadow 0.12s ease;
    }
    .contrib-cell:hover {
      transform: scale(1.25);
      box-shadow: 0 0 0 1px rgba(63,63,70,0.25);
      cursor: default;
    }
    .contrib-cell[data-level="0"] { background: #f1f1f3; }
    .contrib-cell[data-level="1"] { background: #d6d4fb; }
    .contrib-cell[data-level="2"] { background: #a5a0f5; }
    .contrib-cell[data-level="3"] { background: #7c75ee; }
    .contrib-cell[data-level="4"] { background: #6366f1; }

    :host-context(.dark) .contrib-cell[data-level="0"] { background: #27272a; }
    :host-context(.dark) .contrib-cell[data-level="1"] { background: #3730a3; }
    :host-context(.dark) .contrib-cell[data-level="2"] { background: #4338ca; }
    :host-context(.dark) .contrib-cell[data-level="3"] { background: #6366f1; }
    :host-context(.dark) .contrib-cell[data-level="4"] { background: #818cf8; }
  `],
  template: `
    <div class="flex flex-col h-full overflow-y-auto scrollbar-thin">
      <div class="px-4 md:px-8 pt-5 md:pt-8 pb-10 max-w-2xl mx-auto w-full space-y-5">

        <!-- Page header -->
        <div class="pe-1">
          <p class="text-xs font-medium text-brand-600 uppercase tracking-widest mb-1 font-body">Account</p>
          <h1 class="text-2xl font-bold text-zinc-900 dark:text-zinc-100 font-display">Il tuo Profilo</h1>
        </div>

        <!-- Hidden file input -->
        <input type="file" id="photo-upload" accept="image/*" class="hidden"
               (change)="onPhotoSelect($event)"/>

        <!-- Avatar card -->
        <div class="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-700 shadow-card p-6 pe-2">
          <div class="flex items-center gap-5">
            <!-- Avatar with upload overlay -->
            <div class="avatar-wrap relative flex-shrink-0 w-20 h-20">
              <div class="w-20 h-20 rounded-2xl overflow-hidden flex items-center justify-center"
                   style="background: linear-gradient(135deg, #6366f1, #8b5cf6);">
                @if (photoUrl()) {
                  <img [src]="photoUrl()" class="w-full h-full object-cover" alt="Avatar"/>
                } @else {
                  <span class="text-3xl font-bold text-white font-display">{{ initial() }}</span>
                }
              </div>
              <label for="photo-upload"
                     class="avatar-overlay absolute inset-0 rounded-2xl flex items-center justify-center"
                     style="background: rgba(0,0,0,0.42);">
                <svg class="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round"
                        d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>
              </label>
            </div>

            <!-- Meta -->
            <div class="flex-1 min-w-0">
              <p class="text-lg font-bold text-zinc-900 dark:text-zinc-100 font-display truncate">
                {{ name() || 'Il tuo nome' }}
              </p>
              <p class="text-sm text-zinc-500 dark:text-zinc-400 font-body truncate">{{ email() || 'La tua email' }}</p>
              @if (company()) {
                <p class="text-xs text-zinc-400 dark:text-zinc-500 font-body mt-0.5 truncate">{{ company() }}</p>
              }
              <label for="photo-upload"
                     class="mt-2 inline-flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700
                            font-semibold font-body cursor-pointer transition-colors">
                <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                  <path stroke-linecap="round" stroke-linejoin="round"
                        d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>
                Cambia foto
              </label>
            </div>
          </div>
        </div>

        <!-- Personal info -->
        <div class="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-700 shadow-card p-6 pe-3">
          <p class="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest font-body mb-5">
            Informazioni Personali
          </p>
          <div class="space-y-4">

            <div>
              <label class="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 font-body mb-1.5">Nome completo</label>
              <input type="text" [ngModel]="name()" (ngModelChange)="name.set($event)"
                     placeholder="Mario Rossi" autocomplete="name"
                     class="profile-input w-full px-4 py-2.5 rounded-xl text-sm font-body text-zinc-900 dark:text-zinc-100
                            border border-zinc-200 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-800
                            placeholder:text-zinc-400 dark:placeholder:text-zinc-500"/>
            </div>

            <div>
              <label class="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 font-body mb-1.5">Email</label>
              <input type="email" [ngModel]="email()" (ngModelChange)="email.set($event)"
                     placeholder="mario@startup.it" autocomplete="email"
                     class="profile-input w-full px-4 py-2.5 rounded-xl text-sm font-body text-zinc-900 dark:text-zinc-100
                            border border-zinc-200 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-800
                            placeholder:text-zinc-400 dark:placeholder:text-zinc-500"/>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 font-body mb-1.5">
                  Nome azienda
                  <span class="text-zinc-400 dark:text-zinc-500 font-normal ml-1">(opzionale)</span>
                </label>
                <input type="text" [ngModel]="company()" (ngModelChange)="company.set($event)"
                       placeholder="La tua startup"
                       class="profile-input w-full px-4 py-2.5 rounded-xl text-sm font-body text-zinc-900 dark:text-zinc-100
                              border border-zinc-200 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-800
                              placeholder:text-zinc-400 dark:placeholder:text-zinc-500"/>
              </div>
              <div>
                <label class="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 font-body mb-1.5">
                  Ruolo
                  <span class="text-zinc-400 dark:text-zinc-500 font-normal ml-1">(opzionale)</span>
                </label>
                <input type="text" [ngModel]="role()" (ngModelChange)="role.set($event)"
                       placeholder="CEO / Founder"
                       class="profile-input w-full px-4 py-2.5 rounded-xl text-sm font-body text-zinc-900 dark:text-zinc-100
                              border border-zinc-200 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-800
                              placeholder:text-zinc-400 dark:placeholder:text-zinc-500"/>
              </div>
            </div>

          </div>
        </div>

        <!-- Activity / contribution graph -->
        <div class="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-700 shadow-card p-6 pe-3">
          <div class="flex items-center justify-between mb-5">
            <div>
              <p class="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest font-body">Attività</p>
              <p class="text-sm text-zinc-600 dark:text-zinc-400 font-body mt-1">
                {{ totalContributions() }} aggiornamenti al piano negli ultimi 12 mesi
              </p>
            </div>
          </div>

          <div class="overflow-x-auto scrollbar-thin -mx-1 px-1">
            <div class="inline-flex flex-col gap-2 min-w-max">
              <div class="flex gap-[3px]">
                @for (week of contributionWeeks(); track $index) {
                  <div class="flex flex-col gap-[3px]">
                    @for (day of week; track $index) {
                      <div class="contrib-cell"
                           [attr.data-level]="day.level"
                           [title]="day.label"></div>
                    }
                  </div>
                }
              </div>

              <div class="flex items-center justify-end gap-1.5 pt-1">
                <span class="text-xs text-zinc-400 dark:text-zinc-500 font-body">Meno</span>
                <div class="contrib-cell" data-level="0"></div>
                <div class="contrib-cell" data-level="1"></div>
                <div class="contrib-cell" data-level="2"></div>
                <div class="contrib-cell" data-level="3"></div>
                <div class="contrib-cell" data-level="4"></div>
                <span class="text-xs text-zinc-400 dark:text-zinc-500 font-body">Più</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Security -->
        <div class="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-700 shadow-card overflow-hidden pe-4">
          <button type="button"
                  (click)="togglePasswordSection()"
                  class="w-full flex items-center justify-between px-6 py-4 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                <svg class="w-4 h-4 text-zinc-600 dark:text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round"
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                </svg>
              </div>
              <div class="text-left">
                <p class="text-sm font-semibold text-zinc-800 dark:text-zinc-200 font-body">Modifica password</p>
                <p class="text-xs text-zinc-400 dark:text-zinc-500 font-body">Aggiorna le credenziali di accesso</p>
              </div>
            </div>
            <svg class="w-4 h-4 text-zinc-400 dark:text-zinc-500 transition-transform duration-200"
                 [class.rotate-180]="showPasswordSection()"
                 fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/>
            </svg>
          </button>

          @if (showPasswordSection()) {
            <div class="px-6 pt-4 pb-5 border-t border-zinc-100 dark:border-zinc-700 space-y-4">
              <div>
                <label class="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 font-body mb-1.5">Password attuale</label>
                <input type="password" [(ngModel)]="currentPassword" name="currentPw"
                       placeholder="••••••••"
                       class="profile-input w-full px-4 py-2.5 rounded-xl text-sm font-body text-zinc-900 dark:text-zinc-100
                              border border-zinc-200 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-800
                              placeholder:text-zinc-400 dark:placeholder:text-zinc-500"/>
              </div>
              <div>
                <label class="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 font-body mb-1.5">Nuova password</label>
                <input [type]="showNewPw() ? 'text' : 'password'" [(ngModel)]="newPassword" name="newPw"
                       placeholder="Min. 8 caratteri"
                       class="profile-input w-full px-4 py-2.5 rounded-xl text-sm font-body text-zinc-900 dark:text-zinc-100
                              border border-zinc-200 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-800
                              placeholder:text-zinc-400 dark:placeholder:text-zinc-500"/>
              </div>
              <div>
                <label class="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 font-body mb-1.5">Conferma nuova password</label>
                <input [type]="showNewPw() ? 'text' : 'password'" [(ngModel)]="confirmNewPassword" name="confirmNewPw"
                       placeholder="Ripeti la password"
                       [ngClass]="[
                         'profile-input w-full px-4 py-2.5 rounded-xl text-sm font-body text-zinc-900 dark:text-zinc-100 bg-zinc-50 dark:bg-zinc-800 placeholder:text-zinc-400 dark:placeholder:text-zinc-500',
                         confirmNewPassword && newPassword !== confirmNewPassword
                           ? 'border-rose-400'
                           : 'border border-zinc-200 dark:border-zinc-600'
                       ]"/>
                @if (confirmNewPassword && newPassword !== confirmNewPassword) {
                  <p class="text-xs text-rose-500 font-body mt-1">Le password non coincidono</p>
                }
              </div>
              <label class="inline-flex items-center gap-2 cursor-pointer">
                <input type="checkbox" [checked]="showNewPw()" (change)="toggleShowNewPw()"
                       class="rounded border-zinc-300 dark:border-zinc-600 text-brand-600 focus:ring-brand-500"/>
                <span class="text-xs text-zinc-500 dark:text-zinc-400 font-body">Mostra password</span>
              </label>
            </div>
          }
        </div>

        <!-- Logout -->
        <div class="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-700 shadow-card px-6 py-4 flex items-center justify-between pe-4">
          <div>
            <p class="text-sm font-semibold text-zinc-800 dark:text-zinc-200 font-body">Esci dall'account</p>
            <p class="text-xs text-zinc-400 dark:text-zinc-500 font-body mt-0.5">Verrai reindirizzato alla pagina di login</p>
          </div>
          <button type="button" (click)="logout()"
                  class="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold font-body
                         border border-rose-200 text-rose-600 hover:bg-rose-50 hover:border-rose-300
                         transition-all duration-150">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round"
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
            </svg>
            Log out
          </button>
        </div>

        <!-- Actions -->
        <div class="flex items-center justify-between pt-1">
          <p class="text-xs text-zinc-400 dark:text-zinc-500 font-body">Modifiche salvate localmente</p>
          <button type="button" (click)="save()"
                  [ngClass]="[
                    'flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold font-body transition-all duration-200',
                    saveSuccess()
                      ? 'bg-emerald-500 text-white save-pop'
                      : 'bg-brand-600 hover:bg-brand-500 text-white shadow-sm hover:-translate-y-0.5'
                  ]">
            @if (saveSuccess()) {
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
              </svg>
              Salvato!
            } @else {
              Salva modifiche
            }
          </button>
        </div>

      </div>
    </div>
  `,
})
export class ProfileComponent {
  private readonly router = inject(Router);

  name          = signal('Founder');
  email         = signal('');
  company       = signal('');
  role          = signal('');
  photoUrl      = signal('');

  showPasswordSection = signal(false);
  showNewPw           = signal(false);
  saveSuccess         = signal(false);

  currentPassword    = '';
  newPassword        = '';
  confirmNewPassword = '';

  readonly initial = computed(() => (this.name() || 'F').charAt(0).toUpperCase());

  private readonly contributionDays = this.generateFakeContributions();

  readonly contributionWeeks = computed(() => {
    const days = this.contributionDays;
    const weeks: { level: number; label: string }[][] = [];
    for (let i = 0; i < days.length; i += 7) {
      weeks.push(days.slice(i, i + 7));
    }
    return weeks;
  });

  readonly totalContributions = computed(() =>
    this.contributionDays.reduce((sum, d) => sum + d.count, 0)
  );

  private generateFakeContributions(): { count: number; level: number; label: string }[] {
    const days: { count: number; level: number; label: string }[] = [];
    const today = new Date();
    const totalDays = 53 * 7;
    let seed = 1234;
    const rand = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };

    for (let i = totalDays - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const r = rand();
      const count = r > 0.55 ? Math.floor(rand() * 9) : 0;
      const level = count === 0 ? 0 : count <= 2 ? 1 : count <= 4 ? 2 : count <= 6 ? 3 : 4;
      const dateLabel = date.toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' });
      const label = count === 0
        ? `Nessun aggiornamento il ${dateLabel}`
        : `${count} aggiornament${count === 1 ? 'o' : 'i'} il ${dateLabel}`;
      days.push({ count, level, label });
    }
    return days;
  }

  togglePasswordSection(): void { this.showPasswordSection.update(v => !v); }
  toggleShowNewPw(): void { this.showNewPw.update(v => !v); }

  onPhotoSelect(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => this.photoUrl.set(e.target!.result as string);
    reader.readAsDataURL(file);
  }

  save(): void {
    this.saveSuccess.set(true);
    setTimeout(() => this.saveSuccess.set(false), 2400);
  }

  logout(): void {
    this.router.navigate(['/login']);
  }
}
