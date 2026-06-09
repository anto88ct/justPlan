import {
  Component, inject, signal, computed, Input, OnInit,
  ElementRef, ViewChild, AfterViewChecked, HostListener,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { BusinessPlanService } from '../../services/business-plan.service';

export type AgentId = 'elio' | 'argon' | 'xeno';

interface ChatMessage {
  role: 'assistant' | 'user';
  text: string;
  isLoading?: boolean;
  agentId?: AgentId;
}

interface AgentDef {
  id: AgentId;
  name: string;
  gradient: string;
  dotColor: string;
  ringColor: string;
  suggestionKeys: [string, string, string];
}

const AGENTS: AgentDef[] = [
  {
    id: 'xeno',
    name: 'Xeno',
    gradient: 'from-violet-500 to-purple-600',
    dotColor: '#a78bfa',
    ringColor: '#a78bfa',
    suggestionKeys: ['chatbot.xeno.s1', 'chatbot.xeno.s2', 'chatbot.xeno.s3'],
  },
  {
    id: 'elio',
    name: 'Elio',
    gradient: 'from-amber-400 to-orange-500',
    dotColor: '#fbbf24',
    ringColor: '#fbbf24',
    suggestionKeys: ['chatbot.elio.s1', 'chatbot.elio.s2', 'chatbot.elio.s3'],
  },
  {
    id: 'argon',
    name: 'Argon',
    gradient: 'from-blue-500 to-cyan-500',
    dotColor: '#60a5fa',
    ringColor: '#60a5fa',
    suggestionKeys: ['chatbot.argon.s1', 'chatbot.argon.s2', 'chatbot.argon.s3'],
  },
];

@Component({
  selector: 'app-ai-chatbot',
  standalone: true,
  host: { class: 'flex flex-col h-full overflow-hidden' },
  imports: [CommonModule, FormsModule, TranslatePipe],
  styles: [`
    :host { display: flex; flex-direction: column; height: 100%; overflow: hidden; }

    /* Animated transitions */
    .chat-surface { transition: background-color 0.3s cubic-bezier(0.16,1,0.3,1); }
    .agent-icon-wrap { transition: background 0.3s cubic-bezier(0.16,1,0.3,1); }
    .agent-status-dot { transition: background-color 0.3s cubic-bezier(0.16,1,0.3,1); }

    /* Input box ring via CSS variable */
    .input-box {
      transition: box-shadow 0.15s ease, border-color 0.15s ease;
    }
    .input-box:focus-within {
      box-shadow: 0 0 0 2px var(--agent-ring);
      border-color: transparent;
    }

    /* Picker dropdown */
    .picker-panel {
      animation: pickerUp 0.17s cubic-bezier(0.16,1,0.3,1) both;
    }
    @keyframes pickerUp {
      from { opacity: 0; transform: translateY(5px) scale(0.98); }
      to   { opacity: 1; transform: translateY(0) scale(1); }
    }

    /* Message entrance */
    .msg-in {
      animation: msgSlide 0.25s cubic-bezier(0.16,1,0.3,1) both;
    }
    @keyframes msgSlide {
      from { opacity: 0; transform: translateY(8px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    @media (prefers-reduced-motion: reduce) {
      .chat-surface, .agent-icon-wrap, .agent-status-dot, .input-box { transition: none; }
      .picker-panel { animation: none; }
      .msg-in { animation: none; }
    }
  `],
  template: `
    <div class="flex flex-col h-full chat-surface"
         [ngClass]="activeAgent().id === 'elio'
           ? 'bg-amber-50/40  dark:bg-zinc-900'
           : activeAgent().id === 'argon'
             ? 'bg-sky-50/40   dark:bg-zinc-900'
             : 'bg-violet-50/40 dark:bg-zinc-900'">

      <!-- Header -->
      <div class="px-4 py-3.5 border-b border-zinc-100 dark:border-zinc-800 flex-shrink-0
                  bg-white/80 dark:bg-zinc-900/90 backdrop-blur-sm">
        <div class="flex items-center gap-3">
          <!-- Agent icon -->
          <div class="relative flex-shrink-0">
            <div class="agent-icon-wrap w-8 h-8 rounded-xl flex items-center justify-center bg-gradient-to-br"
                 [ngClass]="activeAgent().gradient">
              <!-- Elio: sun + orbit -->
              @if (activeAgent().id === 'elio') {
                <svg width="16" height="16" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                  <ellipse cx="9" cy="9" rx="6.5" ry="2.5" stroke="white" stroke-width="1" stroke-opacity="0.7"/>
                  <circle cx="9" cy="9" r="3" fill="white" fill-opacity="0.9"/>
                  <circle cx="15.5" cy="9" r="1.5" fill="white"/>
                </svg>
              }
              <!-- Argon: radar -->
              @if (activeAgent().id === 'argon') {
                <svg width="16" height="16" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                  <circle cx="9" cy="9" r="6.5" stroke="white" stroke-width="1" stroke-opacity="0.6" stroke-dasharray="4 3"/>
                  <circle cx="9" cy="9" r="3.5" stroke="white" stroke-width="1" stroke-opacity="0.8"/>
                  <line x1="9" y1="9" x2="15.5" y2="9" stroke="white" stroke-width="1.5" stroke-opacity="0.9"/>
                  <circle cx="9" cy="9" r="1.5" fill="white"/>
                </svg>
              }
              <!-- Xeno: hexagon -->
              @if (activeAgent().id === 'xeno') {
                <svg width="16" height="16" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                  <polygon points="9,2 14.2,5 14.2,11 9,14 3.8,11 3.8,5"
                           stroke="white" stroke-width="1.2" stroke-opacity="0.8" fill="none"/>
                  <polygon points="9,5.5 11.6,7 11.6,10 9,11.5 6.4,10 6.4,7"
                           stroke="white" stroke-width="0.8" stroke-opacity="0.6" fill="none"/>
                  <circle cx="9" cy="9" r="1.8" fill="white"/>
                </svg>
              }
            </div>
            <!-- Status dot -->
            <div class="agent-status-dot absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-zinc-900"
                 [style.background-color]="activeAgent().dotColor"></div>
          </div>
          <!-- Name + role -->
          <div class="min-w-0 flex-1">
            <p class="text-sm font-semibold text-zinc-800 dark:text-zinc-100 font-display leading-tight">
              {{ activeAgent().name }}
            </p>
            <p class="text-xs font-body leading-tight"
               [ngClass]="activeAgent().id === 'elio'  ? 'text-amber-600 dark:text-amber-400'  :
                           activeAgent().id === 'argon' ? 'text-blue-600  dark:text-blue-400'   :
                                                          'text-violet-600 dark:text-violet-400'">
              {{ 'chatbot.' + activeAgent().id + '.role' | translate }}
            </p>
          </div>
        </div>
      </div>

      <!-- Suggestions -->
      @if (showSuggestions()) {
        <div class="px-4 pt-3 pb-2 border-b border-zinc-100 dark:border-zinc-800 flex-shrink-0
                    bg-white/70 dark:bg-zinc-900/70">
          <p class="text-xs text-zinc-400 dark:text-zinc-500 font-body mb-2">
            {{ 'chatbot.tryAsk' | translate }}
          </p>
          <div class="space-y-1.5">
            @for (key of activeAgent().suggestionKeys; track key) {
              <button (click)="useSuggestion(t(key))"
                      class="w-full text-left text-xs px-3 py-2 rounded-lg
                             bg-zinc-50 dark:bg-zinc-800
                             hover:bg-zinc-100 dark:hover:bg-zinc-700
                             text-zinc-600 dark:text-zinc-400
                             border border-zinc-100 dark:border-zinc-700
                             transition-colors duration-150 font-body">
                {{ key | translate }}
              </button>
            }
          </div>
        </div>
      }

      <!-- Messages -->
      <div #messageContainer
           class="flex-1 overflow-y-auto scrollbar-thin px-4 py-4 space-y-3.5">
        @for (msg of messages(); track $index) {
          @if (msg.role === 'assistant') {
            <div class="flex gap-2.5 items-start msg-in">
              <!-- Mini agent avatar -->
              <div class="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 bg-gradient-to-br"
                   [ngClass]="agentById(msg.agentId ?? activeAgent().id).gradient">
                <svg class="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                </svg>
              </div>
              <div class="flex-1 min-w-0">
                @if (msg.isLoading) {
                  <div class="inline-flex items-center gap-2 px-3.5 py-2.5
                              bg-white dark:bg-zinc-800
                              border border-zinc-100 dark:border-zinc-700
                              rounded-2xl rounded-tl-sm shadow-sm">
                    <div class="flex gap-1">
                      <div class="w-1.5 h-1.5 rounded-full bg-zinc-300 dark:bg-zinc-500 animate-bounce" style="animation-delay:0ms"></div>
                      <div class="w-1.5 h-1.5 rounded-full bg-zinc-300 dark:bg-zinc-500 animate-bounce" style="animation-delay:150ms"></div>
                      <div class="w-1.5 h-1.5 rounded-full bg-zinc-300 dark:bg-zinc-500 animate-bounce" style="animation-delay:300ms"></div>
                    </div>
                    <span class="text-xs text-zinc-400 dark:text-zinc-500 font-body">
                      {{ agentById(msg.agentId ?? activeAgent().id).name }}
                      {{ 'chatbot.elaborating' | translate }}
                    </span>
                  </div>
                } @else {
                  <div class="px-3.5 py-2.5 bg-white dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 rounded-2xl rounded-tl-sm shadow-sm">
                    <p class="text-sm text-zinc-800 dark:text-zinc-200 leading-relaxed font-body whitespace-pre-wrap">{{ msg.text }}</p>
                  </div>
                }
              </div>
            </div>
          } @else {
            <!-- User message -->
            <div class="flex justify-end msg-in">
              <div class="max-w-[80%] px-3.5 py-2.5 rounded-2xl rounded-tr-sm shadow-sm"
                   [ngClass]="(msg.agentId ?? activeAgent().id) === 'elio'  ? 'bg-amber-500'  :
                               (msg.agentId ?? activeAgent().id) === 'argon' ? 'bg-blue-500'   :
                                                                               'bg-violet-500'">
                <p class="text-sm text-white leading-relaxed font-body">{{ msg.text }}</p>
              </div>
            </div>
          }
        }
      </div>

      <!-- Input area -->
      <div class="px-4 py-3 border-t border-zinc-100 dark:border-zinc-800 flex-shrink-0
                  bg-white/80 dark:bg-zinc-900/90 backdrop-blur-sm"
           #inputArea>

        <!-- Scenario applied banner -->
        @if (planService.isAiUpdated()) {
          <div class="mb-3 flex items-center justify-between px-3 py-2
                      bg-emerald-50 dark:bg-emerald-950/30
                      rounded-xl border border-emerald-100 dark:border-emerald-900/40">
            <div class="flex items-center gap-2">
              <div class="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
              <span class="text-xs text-emerald-700 dark:text-emerald-400 font-body">
                {{ 'chatbot.scenarioApplied' | translate }}
              </span>
            </div>
            <button (click)="resetScenario()"
                    class="text-xs font-medium font-body underline decoration-dotted transition-colors
                           text-emerald-600 hover:text-emerald-800
                           dark:text-emerald-400 dark:hover:text-emerald-200">
              {{ 'chatbot.resetPlan' | translate }}
            </button>
          </div>
        }

        <!-- Unified input box: chip + send floating inside textarea -->
        <div class="input-box relative rounded-2xl border bg-white dark:bg-zinc-800
                    border-zinc-200 dark:border-zinc-700"
             [style.--agent-ring]="activeAgent().ringColor">

          <!-- Agent picker (opens upward, anchored to input-box) -->
          @if (showAgentPicker()) {
            <div class="picker-panel absolute left-0 right-0 bottom-full mb-2 z-20
                        bg-white dark:bg-zinc-900
                        rounded-2xl border border-zinc-150 dark:border-zinc-700
                        shadow-[0_-8px_32px_0_rgb(0_0_0/0.10),0_-2px_8px_0_rgb(0_0_0/0.06)]
                        overflow-hidden">
              @for (agent of agents; track agent.id) {
                <button
                  (click)="selectAgent(agent.id)"
                  class="w-full flex items-center gap-3 px-4 py-3 text-left
                         hover:bg-zinc-50 dark:hover:bg-zinc-800
                         border-b border-zinc-50 dark:border-zinc-800 last:border-0
                         transition-colors duration-100">
                  <!-- Icon -->
                  <div class="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 bg-gradient-to-br"
                       [ngClass]="agent.gradient">
                    @if (agent.id === 'elio') {
                      <svg width="13" height="13" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                        <ellipse cx="9" cy="9" rx="6.5" ry="2.5" stroke="white" stroke-width="1" stroke-opacity="0.7"/>
                        <circle cx="9" cy="9" r="3" fill="white" fill-opacity="0.9"/>
                        <circle cx="15.5" cy="9" r="1.5" fill="white"/>
                      </svg>
                    }
                    @if (agent.id === 'argon') {
                      <svg width="13" height="13" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                        <circle cx="9" cy="9" r="6.5" stroke="white" stroke-width="1" stroke-opacity="0.6" stroke-dasharray="4 3"/>
                        <circle cx="9" cy="9" r="3.5" stroke="white" stroke-width="1" stroke-opacity="0.8"/>
                        <line x1="9" y1="9" x2="15.5" y2="9" stroke="white" stroke-width="1.5" stroke-opacity="0.9"/>
                        <circle cx="9" cy="9" r="1.5" fill="white"/>
                      </svg>
                    }
                    @if (agent.id === 'xeno') {
                      <svg width="13" height="13" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                        <polygon points="9,2 14.2,5 14.2,11 9,14 3.8,11 3.8,5"
                                 stroke="white" stroke-width="1.2" stroke-opacity="0.8" fill="none"/>
                        <polygon points="9,5.5 11.6,7 11.6,10 9,11.5 6.4,10 6.4,7"
                                 stroke="white" stroke-width="0.8" stroke-opacity="0.6" fill="none"/>
                        <circle cx="9" cy="9" r="1.8" fill="white"/>
                      </svg>
                    }
                  </div>
                  <!-- Name + role -->
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-semibold text-zinc-800 dark:text-zinc-100 font-body leading-tight">{{ agent.name }}</p>
                    <p class="text-xs text-zinc-400 dark:text-zinc-500 font-body">{{ 'chatbot.' + agent.id + '.role' | translate }}</p>
                  </div>
                  <!-- Active check -->
                  @if (activeAgentId() === agent.id) {
                    <svg class="w-4 h-4 flex-shrink-0"
                         [ngClass]="agent.id === 'elio'  ? 'text-amber-500'  :
                                     agent.id === 'argon' ? 'text-blue-500'   :
                                                            'text-violet-500'"
                         fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
                    </svg>
                  }
                </button>
              }
            </div>
          }

          <!-- Textarea: bottom padding leaves room for the floating controls -->
          <textarea
            #textarea
            [(ngModel)]="inputText"
            (keydown)="onKeyDown($event)"
            [placeholder]="'chatbot.' + activeAgent().id + '.placeholder' | translate"
            [disabled]="isLoading()"
            rows="3"
            class="w-full bg-transparent resize-none text-sm
                   px-3.5 pt-3 pb-10
                   focus:outline-none
                   text-zinc-800 dark:text-zinc-100
                   placeholder:text-zinc-400 dark:placeholder:text-zinc-500
                   font-body disabled:opacity-60">
          </textarea>

          <!-- Floating bottom row: agent chip (left) + send (right) -->
          <div class="absolute bottom-0 left-0 right-0 flex items-center justify-between px-2.5 pb-2.5 gap-2 pointer-events-none">

            <!-- Agent chip — opens picker upward -->
            <button
              (click)="toggleAgentPicker($event)"
              class="pointer-events-auto flex items-center gap-1.5 pl-2 pr-1.5 py-1 rounded-lg text-xs font-semibold font-body
                     border transition-colors duration-150 flex-shrink-0"
              [ngClass]="activeAgent().id === 'elio'
                ? 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100 dark:bg-amber-950/40 dark:border-amber-800/60 dark:text-amber-300 dark:hover:bg-amber-950/60'
                : activeAgent().id === 'argon'
                  ? 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 dark:bg-blue-950/40 dark:border-blue-800/60 dark:text-blue-300 dark:hover:bg-blue-950/60'
                  : 'bg-violet-50 border-violet-200 text-violet-700 hover:bg-violet-100 dark:bg-violet-950/40 dark:border-violet-800/60 dark:text-violet-300 dark:hover:bg-violet-950/60'"
              [attr.aria-label]="'Agente: ' + activeAgent().name">
              <div class="w-1.5 h-1.5 rounded-full flex-shrink-0"
                   [ngClass]="activeAgent().id === 'elio'  ? 'bg-amber-400'  :
                               activeAgent().id === 'argon' ? 'bg-blue-400'   :
                                                              'bg-violet-400'">
              </div>
              <span>{{ activeAgent().name }}</span>
              <svg class="w-3 h-3 transition-transform duration-150"
                   [ngClass]="showAgentPicker() ? 'rotate-180' : ''"
                   fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/>
              </svg>
            </button>

            <div class="flex-1"></div>

            <!-- Send -->
            <button
              (click)="sendMessage()"
              [disabled]="!inputText.trim() || isLoading()"
              class="pointer-events-auto flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center
                     transition-all duration-150
                     disabled:bg-zinc-200 dark:disabled:bg-zinc-700 disabled:cursor-not-allowed disabled:shadow-none"
              [ngClass]="activeAgent().id === 'elio'
                ? 'bg-amber-500 hover:bg-amber-400 shadow-[0_3px_10px_0_rgba(251,191,36,0.35)] hover:shadow-none'
                : activeAgent().id === 'argon'
                  ? 'bg-blue-500 hover:bg-blue-400 shadow-[0_3px_10px_0_rgba(59,130,246,0.35)] hover:shadow-none'
                  : 'bg-violet-500 hover:bg-violet-400 shadow-[0_3px_10px_0_rgba(139,92,246,0.35)] hover:shadow-none'">
              <svg class="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
              </svg>
            </button>
          </div>
        </div>

      </div><!-- /input area -->
    </div>
  `,
})
export class AiChatbotComponent implements AfterViewChecked, OnInit {
  @ViewChild('messageContainer') private messageContainer!: ElementRef<HTMLDivElement>;
  @ViewChild('inputArea', { read: ElementRef }) private inputAreaRef!: ElementRef<HTMLDivElement>;
  @ViewChild('textarea') private textareaRef!: ElementRef<HTMLTextAreaElement>;

  private readonly translate = inject(TranslateService);
  readonly planService = inject(BusinessPlanService);

  agents = AGENTS;

  activeAgentId = signal<AgentId>('xeno');
  showAgentPicker = signal(false);

  activeAgent = computed(() => AGENTS.find(a => a.id === this.activeAgentId())!);

  inputText = '';
  isLoading = signal(false);
  showSuggestions = signal(true);

  @Input() set agentId(id: AgentId) {
    if (id && id !== this.activeAgentId()) {
      this._applyAgent(id);
    }
  }

  messages = signal<ChatMessage[]>([]);

  ngOnInit(): void {
    const id = this.activeAgentId();
    this.messages.set([{
      role: 'assistant',
      text: this.translate.instant(`chatbot.${id}.welcome`),
      agentId: id,
    }]);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.showAgentPicker()) return;
    const inputEl = this.inputAreaRef?.nativeElement;
    if (inputEl && !inputEl.contains(event.target as Node)) {
      this.showAgentPicker.set(false);
    }
  }

  ngAfterViewChecked(): void {
    this.scrollToBottom();
  }

  t(key: string): string {
    return this.translate.instant(key);
  }

  agentById(id: AgentId): AgentDef {
    return AGENTS.find(a => a.id === id) ?? AGENTS[0];
  }

  toggleAgentPicker(event: Event): void {
    event.stopPropagation();
    this.showAgentPicker.update(v => !v);
  }

  selectAgent(id: AgentId): void {
    this.showAgentPicker.set(false);
    if (id === this.activeAgentId()) return;
    this._applyAgent(id);
  }

  private _applyAgent(id: AgentId): void {
    this.activeAgentId.set(id);
    // Clear chat: reset to welcome message of new agent
    this.messages.set([{
      role: 'assistant',
      text: this.translate.instant(`chatbot.${id}.welcome`),
      agentId: id,
    }]);
    this.showSuggestions.set(true);
    this.planService.reset();
    this.isLoading.set(false);
    this.inputText = '';
  }

  useSuggestion(text: string): void {
    this.inputText = text;
    this.sendMessage();
  }

  onKeyDown(event: Event): void {
    const e = event as KeyboardEvent;
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      this.sendMessage();
    }
  }

  sendMessage(): void {
    const text = this.inputText.trim();
    if (!text || this.isLoading()) return;

    this.showSuggestions.set(false);
    const agentId = this.activeAgentId();
    this.inputText = '';
    this.isLoading.set(true);

    this.messages.update(msgs => [...msgs, { role: 'user', text, agentId }]);
    this.messages.update(msgs => [...msgs, { role: 'assistant', text: '', isLoading: true, agentId }]);

    setTimeout(() => {
      this.planService.applyAiScenario();
      const kpi = this.planService.kpi();
      let replyText: string;

      if (agentId === 'elio') {
        replyText = this.translate.instant('chatbot.elio.mockReply', {
          fatturato: this.formatK(kpi.fatturatoTotale),
          ebitda: this.formatK(kpi.ebitda),
          utileNetto: this.formatK(kpi.utileNetto),
          cashRunway: kpi.cashRunway,
        });
      } else if (agentId === 'argon') {
        replyText = this.translate.instant('chatbot.argon.mockReply');
      } else {
        replyText = this.translate.instant('chatbot.xeno.mockReply', {
          fatturato: this.formatK(kpi.fatturatoTotale),
          ebitda: this.formatK(kpi.ebitda),
        });
      }

      this.messages.update(msgs => {
        const updated = [...msgs];
        updated[updated.length - 1] = { role: 'assistant', text: replyText, agentId };
        return updated;
      });
      this.isLoading.set(false);
    }, 2000);
  }

  resetScenario(): void {
    this.planService.reset();
    this.messages.update(msgs => [
      ...msgs,
      {
        role: 'assistant',
        text: this.translate.instant('chatbot.resetPlan') + ' ↩',
        agentId: this.activeAgentId(),
      },
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
