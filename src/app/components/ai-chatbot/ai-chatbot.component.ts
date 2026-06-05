import { Component, inject, signal, ElementRef, ViewChild, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BusinessPlanService } from '../../services/business-plan.service';

interface ChatMessage {
  role: 'assistant' | 'user';
  text: string;
  isLoading?: boolean;
}

@Component({
  selector: 'app-ai-chatbot',
  standalone: true,
  host: { class: 'flex flex-col h-full overflow-hidden' },
  imports: [CommonModule, FormsModule],
  template: `
    <div class="flex flex-col h-full bg-white dark:bg-zinc-900">

      <!-- Panel header -->
      <div class="px-4 py-4 border-b border-zinc-100 dark:border-zinc-800 flex-shrink-0">
        <div class="flex items-center gap-3">
          <div class="relative">
            <div class="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-violet-600 flex items-center justify-center">
              <svg class="w-4.5 h-4.5 text-white" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
              </svg>
            </div>
            <div class="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-white dark:border-zinc-900"></div>
          </div>
          <div>
            <p class="text-sm font-semibold text-zinc-800 dark:text-zinc-200 font-display">AI Copilot</p>
            <p class="text-xs text-emerald-600 font-body">CFO Virtuale — Online</p>
          </div>
        </div>
      </div>

      <!-- Suggested prompts (shown before first user message) -->
      @if (showSuggestions()) {
        <div class="px-4 py-3 border-b border-zinc-50 dark:border-zinc-800 flex-shrink-0">
          <p class="text-xs text-zinc-400 dark:text-zinc-500 font-body mb-2">Prova a chiedermi:</p>
          <div class="space-y-1.5">
            @for (s of suggestions; track s) {
              <button (click)="useSuggestion(s)"
                      class="w-full text-left text-xs px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-800 hover:bg-brand-50 dark:hover:bg-brand-950/40 hover:text-brand-700 dark:hover:text-brand-400 text-zinc-600 dark:text-zinc-400 transition-colors font-body border border-zinc-100 dark:border-zinc-700 hover:border-brand-200 dark:hover:border-brand-800">
                {{ s }}
              </button>
            }
          </div>
        </div>
      }

      <!-- Messages -->
      <div #messageContainer class="flex-1 overflow-y-auto scrollbar-thin px-4 py-4 space-y-4">
        @for (msg of messages(); track $index) {
          <div class="animate-slide-up" [class.flex-row-reverse]="false">
            @if (msg.role === 'assistant') {
              <div class="flex gap-2.5 items-start">
                <div class="w-6 h-6 rounded-lg bg-gradient-to-br from-brand-500 to-violet-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg class="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                  </svg>
                </div>
                <div class="flex-1 min-w-0">
                  @if (msg.isLoading) {
                    <div class="inline-flex items-center gap-2 px-4 py-3 bg-zinc-100 dark:bg-zinc-800 rounded-2xl rounded-tl-sm">
                      <div class="flex gap-1">
                        <div class="w-1.5 h-1.5 rounded-full bg-zinc-400 dark:bg-zinc-500 animate-bounce" style="animation-delay: 0ms"></div>
                        <div class="w-1.5 h-1.5 rounded-full bg-zinc-400 dark:bg-zinc-500 animate-bounce" style="animation-delay: 150ms"></div>
                        <div class="w-1.5 h-1.5 rounded-full bg-zinc-400 dark:bg-zinc-500 animate-bounce" style="animation-delay: 300ms"></div>
                      </div>
                      <span class="text-xs text-zinc-500 dark:text-zinc-400 font-body">L'AI sta ricalcolando...</span>
                    </div>
                  } @else {
                    <div class="px-4 py-3 bg-zinc-100 dark:bg-zinc-800 rounded-2xl rounded-tl-sm">
                      <p class="text-sm text-zinc-800 dark:text-zinc-200 leading-relaxed font-body whitespace-pre-wrap">{{ msg.text }}</p>
                    </div>
                  }
                </div>
              </div>
            } @else {
              <div class="flex justify-end">
                <div class="max-w-[80%] px-4 py-3 bg-brand-600 rounded-2xl rounded-tr-sm">
                  <p class="text-sm text-white leading-relaxed font-body">{{ msg.text }}</p>
                </div>
              </div>
            }
          </div>
        }
      </div>

      <!-- Input area -->
      <div class="px-4 py-4 border-t border-zinc-100 dark:border-zinc-800 flex-shrink-0">
        @if (planService.isAiUpdated()) {
          <div class="mb-3 flex items-center justify-between px-3 py-2 bg-emerald-50 rounded-xl border border-emerald-100">
            <div class="flex items-center gap-2">
              <div class="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
              <span class="text-xs text-emerald-700 font-body">Scenario applicato</span>
            </div>
            <button (click)="resetScenario()"
                    class="text-xs text-emerald-600 hover:text-emerald-800 font-medium font-body underline decoration-dotted">
              Ripristina
            </button>
          </div>
        }
        <div class="flex gap-2 items-end">
          <textarea [(ngModel)]="inputText"
                    (keydown.enter)="onEnterKey($event)"
                    placeholder="Chiedi uno scenario 'What-If'..."
                    rows="2"
                    class="flex-1 resize-none text-sm px-3 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl
                           focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent
                           placeholder:text-zinc-400 dark:placeholder:text-zinc-600 font-body text-zinc-800 dark:text-zinc-200 transition-all"
                    [disabled]="isLoading()">
          </textarea>
          <button (click)="sendMessage()"
                  [disabled]="!inputText.trim() || isLoading()"
                  class="flex-shrink-0 w-10 h-10 rounded-xl bg-brand-600 hover:bg-brand-700
                         disabled:bg-zinc-200 dark:disabled:bg-zinc-700 disabled:cursor-not-allowed
                         flex items-center justify-center transition-all duration-200 shadow-brand hover:shadow-none">
            <svg class="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
            </svg>
          </button>
        </div>
        <p class="mt-2 text-xs text-zinc-400 dark:text-zinc-500 text-center font-body">
          Premi <kbd class="px-1 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded text-zinc-500 dark:text-zinc-400 font-mono text-xs">Enter</kbd> per inviare
        </p>
      </div>

    </div>
  `,
})
export class AiChatbotComponent implements AfterViewChecked {
  @ViewChild('messageContainer') private messageContainer!: ElementRef<HTMLDivElement>;

  readonly planService = inject(BusinessPlanService);

  inputText = '';
  isLoading = signal(false);
  showSuggestions = signal(true);
  private userHasMessaged = false;

  messages = signal<ChatMessage[]>([
    {
      role: 'assistant',
      text: 'Ciao Founder! 👋 Sono il tuo CFO virtuale.\n\nChiedimi di simulare scenari, ad esempio:\n"Mostrami il prospetto economico se modifico il prezzo del Prodotto X a 50€ dal secondo anno".',
    },
  ]);

  suggestions = [
    'Cosa succede se alzo il prezzo a 50€?',
    'Simula 2 dipendenti in più dal Q3',
    'Quanto runway guadagno riducendo i costi del 10%?',
  ];

  ngAfterViewChecked(): void {
    this.scrollToBottom();
  }

  useSuggestion(text: string): void {
    this.inputText = text;
    this.sendMessage();
  }

  onEnterKey(event: Event): void {
    const e = event as KeyboardEvent;
    if (!e.shiftKey) {
      e.preventDefault();
      this.sendMessage();
    }
  }

  sendMessage(): void {
    const text = this.inputText.trim();
    if (!text || this.isLoading()) return;

    if (!this.userHasMessaged) {
      this.userHasMessaged = true;
      this.showSuggestions.set(false);
    }

    this.inputText = '';
    this.isLoading.set(true);

    this.messages.update(msgs => [...msgs, { role: 'user', text }]);

    const loadingMsg: ChatMessage = { role: 'assistant', text: '', isLoading: true };
    this.messages.update(msgs => [...msgs, loadingMsg]);

    setTimeout(() => {
      this.planService.applyAiScenario();

      const kpi = this.planService.kpi();
      const replyText =
        `Ho aggiornato il Business Plan. 📊\n\n` +
        `Aumentando il prezzo, il tuo EBITDA migliora del 15% e guadagni 4 mesi di Runway.\n\n` +
        `• Fatturato → €${this.formatK(kpi.fatturatoTotale)} (+18%)\n` +
        `• EBITDA → €${this.formatK(kpi.ebitda)} (+15%)\n` +
        `• Utile Netto → €${this.formatK(kpi.utileNetto)} (+22%)\n` +
        `• Cash Runway → ${kpi.cashRunway} mesi (+4)\n\n` +
        `Il grafico è ora aggiornato in verde. Vuoi esplorare altri scenari?`;

      this.messages.update(msgs => {
        const updated = [...msgs];
        updated[updated.length - 1] = { role: 'assistant', text: replyText };
        return updated;
      });

      this.isLoading.set(false);
    }, 2000);
  }

  resetScenario(): void {
    this.planService.reset();
    this.messages.update(msgs => [
      ...msgs,
      { role: 'assistant', text: 'Piano ripristinato ai valori originali. Chiedimi un nuovo scenario quando vuoi! 🔄' },
    ]);
  }

  private scrollToBottom(): void {
    try {
      const el = this.messageContainer?.nativeElement;
      if (el) el.scrollTop = el.scrollHeight;
    } catch {}
  }

  private formatK(value: number): string {
    if (value >= 1_000_000) return (value / 1_000_000).toFixed(2) + 'M';
    if (value >= 1_000) return Math.round(value / 1000) + 'K';
    return value.toString();
  }
}
