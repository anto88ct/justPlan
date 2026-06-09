import { Component, signal, computed, ElementRef, ViewChild } from '@angular/core';
import { CommonModule, NgClass } from '@angular/common';
import { trigger, transition, style, animate } from '@angular/animations';

type FileFormat = 'pdf' | 'docx' | 'doc' | 'bxp';
type UploadPhase = 'idle' | 'uploading' | 'converting' | 'done' | 'error';

interface UploadedFile {
  id: string;
  originalName: string;
  originalFormat: FileFormat;
  convertedName: string;
  sizeKb: number;
  uploadedAt: Date;
}

function getFormat(filename: string): FileFormat | null {
  const ext = filename.split('.').pop()?.toLowerCase();
  if (ext === 'pdf') return 'pdf';
  if (ext === 'docx') return 'docx';
  if (ext === 'doc') return 'doc';
  if (ext === 'bxp') return 'bxp';
  return null;
}

@Component({
  selector: 'app-upload-business-plan',
  standalone: true,
  host: { class: 'flex flex-col h-full overflow-hidden' },
  imports: [CommonModule, NgClass],
  animations: [
    trigger('fadeSlide', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(12px)' }),
        animate('360ms cubic-bezier(0.16,1,0.3,1)', style({ opacity: 1, transform: 'translateY(0)' })),
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ opacity: 0, transform: 'translateY(-8px)' })),
      ]),
    ]),
    trigger('listItem', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateX(-16px)' }),
        animate('380ms cubic-bezier(0.16,1,0.3,1)', style({ opacity: 1, transform: 'translateX(0)' })),
      ]),
    ]),
  ],
  styles: [`
    :host { display: flex; flex-direction: column; height: 100%; overflow: hidden; }

    /* ── Drop zone ── */
    .drop-zone {
      border: 2px dashed #e4e4e7;
      border-radius: 20px;
      transition: border-color 0.2s, background 0.2s;
    }
    .drop-zone.drag-over {
      border-color: #6366f1;
      background: #eef2ff;
    }
    .drop-zone:focus-visible { outline: 2px solid #6366f1; outline-offset: 2px; }

    /* ── Circular progress ring ── */
    .progress-ring { transform: rotate(-90deg); }
    .progress-ring-track { fill: none; stroke: #e4e4e7; stroke-width: 6; }
    .progress-ring-bar   { fill: none; stroke: #6366f1; stroke-width: 6;
                           stroke-linecap: round; transition: stroke-dashoffset 0.1s linear; }

    /* ── Conversion step icons ── */
    @keyframes convPulse {
      0%, 100% { transform: scale(1); opacity: 1; }
      50%       { transform: scale(1.08); opacity: 0.85; }
    }
    @keyframes arrowSlide {
      0%   { transform: translateX(-6px); opacity: 0.3; }
      50%  { transform: translateX(0);    opacity: 1; }
      100% { transform: translateX(6px);  opacity: 0.3; }
    }
    @keyframes spinOnce {
      from { transform: rotate(0deg); }
      to   { transform: rotate(360deg); }
    }
    @keyframes checkPop {
      0%   { transform: scale(0) rotate(-15deg); opacity: 0; }
      70%  { transform: scale(1.2) rotate(4deg); opacity: 1; }
      100% { transform: scale(1) rotate(0deg); opacity: 1; }
    }
    @keyframes shimmerCard {
      0%   { background-position: 200% center; }
      100% { background-position: -200% center; }
    }

    .conv-pulse { animation: convPulse 1.4s ease-in-out infinite; }
    .arrow-slide { animation: arrowSlide 1s ease-in-out infinite; }
    .spin-once   { animation: spinOnce 0.8s cubic-bezier(0.16,1,0.3,1) both; }
    .check-pop   { animation: checkPop 0.55s cubic-bezier(0.34,1.56,0.64,1) both; }

    /* ── File card micro-shimmer on hover ── */
    .file-card {
      background: white;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .file-card:hover { transform: translateY(-2px); }

    /* ── Reduced motion ── */
    @media (prefers-reduced-motion: reduce) {
      .conv-pulse, .arrow-slide, .spin-once, .check-pop { animation: none !important; }
      .progress-ring-bar { transition: none; }
    }
  `],
  template: `
    <div class="flex flex-col h-full overflow-y-auto scrollbar-thin">

      <!-- ══ PAGE HEADER ══ -->
      <div class="px-4 md:px-8 pt-5 md:pt-7 pb-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between gap-3 flex-shrink-0">
        <div>
          <p class="text-[10px] font-semibold text-brand-500 uppercase tracking-[0.18em] mb-1 font-body">Importa</p>
          <h1 class="text-xl md:text-2xl font-bold text-zinc-900 dark:text-zinc-100 font-display tracking-tight">
            Carica Business Plan
          </h1>
        </div>
        <div class="flex items-center gap-2 text-[11px] font-body text-zinc-400 dark:text-zinc-500">
          <span class="hidden sm:inline">Formati accettati:</span>
          @for (fmt of acceptedFormats; track fmt.ext) {
            <span class="px-2 py-0.5 rounded-full border font-semibold"
                  [ngClass]="fmt.pill">{{ fmt.ext }}</span>
          }
        </div>
      </div>

      <!-- ══ MAIN CONTENT ══ -->
      <div class="flex-1 px-4 md:px-8 py-5 md:py-6 space-y-6 max-w-3xl mx-auto w-full min-w-0">

        <!-- ─── UPLOAD ZONE ─── -->
        @if (phase() === 'idle' || phase() === 'error') {
          <div @fadeSlide>

            <!-- Drop target -->
            <div
              class="drop-zone relative flex flex-col items-center justify-center text-center p-8 md:p-12 cursor-pointer select-none"
              [ngClass]="{ 'drag-over': isDragOver() }"
              (click)="fileInput.click()"
              (dragover)="onDragOver($event)"
              (dragleave)="isDragOver.set(false)"
              (drop)="onDrop($event)"
              role="button"
              tabindex="0"
              (keydown.enter)="fileInput.click()"
              aria-label="Carica file business plan">

              <!-- Upload icon -->
              <div class="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-all duration-200"
                   [ngClass]="isDragOver() ? 'bg-brand-100 scale-110' : 'bg-zinc-100 dark:bg-zinc-800'">
                <svg class="w-7 h-7 transition-colors duration-200"
                     [ngClass]="isDragOver() ? 'text-brand-600' : 'text-zinc-400 dark:text-zinc-400'"
                     fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                  <path stroke-linecap="round" stroke-linejoin="round"
                        d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"/>
                </svg>
              </div>

              <p class="text-base font-semibold text-zinc-800 dark:text-zinc-200 font-display mb-1">
                {{ isDragOver() ? 'Rilascia il file qui' : 'Trascina il file o clicca per selezionare' }}
              </p>
              <p class="text-[12px] text-zinc-400 dark:text-zinc-500 font-body">
                PDF, Word (.docx, .doc) o formato proprietario .bxp — max 50 MB
              </p>

              @if (phase() === 'error') {
                <div class="mt-4 flex items-center gap-2 px-4 py-2 bg-rose-50 dark:bg-rose-950/30 rounded-xl border border-rose-100 dark:border-rose-900/40">
                  <svg class="w-4 h-4 text-rose-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/>
                  </svg>
                  <span class="text-xs text-rose-600 dark:text-rose-400 font-body font-medium">{{ errorMessage() }}</span>
                </div>
              }

              <!-- Hidden input -->
              <input #fileInput type="file" class="hidden"
                     accept=".pdf,.doc,.docx,.bxp"
                     (change)="onFileSelected($event)"/>
            </div>

            <!-- Format legend -->
            <div class="mt-4 grid grid-cols-3 gap-3">
              @for (fmt of acceptedFormats; track fmt.ext) {
                <div class="flex items-center gap-3 p-3 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                  <div class="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" [ngClass]="fmt.iconBg">
                    <svg class="w-4 h-4" [ngClass]="fmt.iconColor" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                      <path stroke-linecap="round" stroke-linejoin="round" [attr.d]="fmt.iconPath"/>
                    </svg>
                  </div>
                  <div class="min-w-0">
                    <p class="text-[12px] font-bold text-zinc-800 dark:text-zinc-200 font-body">.{{ fmt.ext }}</p>
                    <p class="text-[10px] text-zinc-400 dark:text-zinc-500 font-body truncate">{{ fmt.desc }}</p>
                  </div>
                </div>
              }
            </div>
          </div>
        }

        <!-- ─── UPLOADING PHASE ─── -->
        @if (phase() === 'uploading') {
          <div @fadeSlide class="flex flex-col items-center py-10 md:py-14">

            <!-- Circular progress ring -->
            <div class="relative w-28 h-28 mb-5">
              <svg class="progress-ring w-28 h-28" viewBox="0 0 100 100">
                <circle class="progress-ring-track" cx="50" cy="50" r="42"/>
                <circle class="progress-ring-bar" cx="50" cy="50" r="42"
                        [attr.stroke-dasharray]="circumference"
                        [attr.stroke-dashoffset]="dashOffset()"/>
              </svg>
              <div class="absolute inset-0 flex flex-col items-center justify-center">
                <span class="text-xl font-bold font-mono text-zinc-900 dark:text-zinc-100">{{ uploadProgress() }}%</span>
                <span class="text-[10px] text-zinc-400 font-body">upload</span>
              </div>
            </div>

            <!-- Filename -->
            <p class="text-sm font-semibold text-zinc-800 dark:text-zinc-200 font-display mb-1 text-center px-4 max-w-xs truncate">
              {{ uploadingFile()?.name }}
            </p>
            <p class="text-[11px] text-zinc-400 font-body mb-6">{{ formatSize(uploadingFile()?.size ?? 0) }}</p>

            <!-- Linear progress bar -->
            <div class="w-full max-w-sm h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
              <div class="h-full bg-brand-500 rounded-full transition-all duration-100 ease-linear"
                   [style.width.%]="uploadProgress()"></div>
            </div>
          </div>
        }

        <!-- ─── CONVERTING PHASE ─── -->
        @if (phase() === 'converting') {
          <div @fadeSlide class="flex flex-col items-center py-8 md:py-12">

            <!-- Conversion visualization -->
            <div class="flex items-center gap-4 md:gap-8 mb-8">

              <!-- Source format -->
              <div class="flex flex-col items-center gap-2">
                <div class="w-16 h-16 rounded-2xl flex items-center justify-center shadow-card conv-pulse"
                     [ngClass]="formatStyle(convertingFromFormat()).iconBg">
                  <svg class="w-8 h-8" [ngClass]="formatStyle(convertingFromFormat()).iconColor"
                       fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                    <path stroke-linecap="round" stroke-linejoin="round"
                          d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"/>
                  </svg>
                </div>
                <span class="text-[11px] font-bold font-body uppercase tracking-wide"
                      [ngClass]="formatStyle(convertingFromFormat()).textColor">
                  .{{ convertingFromFormat() }}
                </span>
              </div>

              <!-- Animated arrow -->
              <div class="flex items-center gap-1 arrow-slide">
                @for (d of [0,1,2]; track d) {
                  <svg class="w-4 h-4 text-brand-400" [style.opacity]="0.4 + d * 0.3"
                       fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/>
                  </svg>
                }
              </div>

              <!-- Target format (BXP) -->
              <div class="flex flex-col items-center gap-2">
                <div class="w-16 h-16 rounded-2xl bg-brand-100 dark:bg-brand-900/40 flex items-center justify-center shadow-card conv-pulse"
                     style="animation-delay: 0.4s">
                  <svg class="w-8 h-8 text-brand-600 dark:text-brand-400"
                       fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                    <path stroke-linecap="round" stroke-linejoin="round"
                          d="M9 3.75H6.912a2.25 2.25 0 00-2.15 1.588L2.35 13.177a2.25 2.25 0 00-.1.661V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18v-4.162c0-.224-.034-.447-.1-.661L19.24 5.338a2.25 2.25 0 00-2.15-1.588H15M2.25 13.5h3.86a2.25 2.25 0 012.012 1.244l.256.512a2.25 2.25 0 002.013 1.244h3.218a2.25 2.25 0 002.013-1.244l.256-.512a2.25 2.25 0 012.013-1.244h3.859M12 3v8.25m0 0l-3-3m3 3l3-3"/>
                  </svg>
                </div>
                <span class="text-[11px] font-bold font-body text-brand-600 dark:text-brand-400 uppercase tracking-wide">.bxp</span>
              </div>
            </div>

            <!-- Steps -->
            <div class="w-full max-w-sm space-y-2 mb-6">
              @for (step of conversionSteps; track step.id; let i = $index) {
                <div class="flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-300"
                     [ngClass]="conversionStepState(i) === 'done'
                       ? 'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/40'
                       : conversionStepState(i) === 'active'
                         ? 'bg-brand-50 dark:bg-brand-900/20 border border-brand-100 dark:border-brand-800/40'
                         : 'bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-700/40'">

                  <!-- Step indicator -->
                  @if (conversionStepState(i) === 'done') {
                    <div class="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-800/50 flex items-center justify-center flex-shrink-0 check-pop">
                      <svg class="w-3 h-3 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
                      </svg>
                    </div>
                  } @else if (conversionStepState(i) === 'active') {
                    <div class="w-5 h-5 flex-shrink-0">
                      <svg class="w-5 h-5 text-brand-500 spin-once" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2.5" stroke-dasharray="42 14" opacity="0.25"/>
                        <path d="M12 3a9 9 0 019 9" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
                      </svg>
                    </div>
                  } @else {
                    <div class="w-5 h-5 rounded-full border-2 border-zinc-200 dark:border-zinc-600 flex-shrink-0"></div>
                  }

                  <span class="text-[12px] font-medium font-body transition-colors duration-300"
                        [ngClass]="conversionStepState(i) === 'done'
                          ? 'text-emerald-700 dark:text-emerald-400'
                          : conversionStepState(i) === 'active'
                            ? 'text-brand-700 dark:text-brand-300'
                            : 'text-zinc-400 dark:text-zinc-500'">
                    {{ step.label }}
                  </span>
                </div>
              }
            </div>

            <!-- File name -->
            <p class="text-[11px] text-zinc-400 font-body text-center">
              Conversione di <span class="font-semibold text-zinc-600 dark:text-zinc-300">{{ uploadingFile()?.name }}</span>
            </p>
          </div>
        }

        <!-- ─── DONE FEEDBACK ─── -->
        @if (phase() === 'done') {
          <div @fadeSlide class="flex flex-col items-center py-8">
            <div class="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-4 check-pop">
              <svg class="w-8 h-8 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <p class="text-base font-bold text-zinc-900 dark:text-zinc-100 font-display mb-1">Piano importato con successo</p>
            <p class="text-[12px] text-zinc-400 font-body mb-5">Il file è ora disponibile nella sezione Caricamenti</p>
            <button (click)="phase.set('idle')"
                    class="flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-500
                           text-white text-sm font-semibold rounded-xl transition-all font-body
                           hover:-translate-y-0.5 shadow-md shadow-brand-500/25 active:scale-[0.98]">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/>
              </svg>
              Carica un altro file
            </button>
          </div>
        }

        <!-- ─── CARICAMENTI LIST ─── -->
        @if (uploadedFiles().length > 0) {
          <div>
            <!-- Section header -->
            <div class="flex items-center justify-between mb-3">
              <div>
                <h2 class="text-sm font-bold text-zinc-800 dark:text-zinc-200 font-display">Caricamenti</h2>
                <p class="text-[11px] text-zinc-400 dark:text-zinc-500 font-body mt-0.5">
                  {{ uploadedFiles().length }} {{ uploadedFiles().length === 1 ? 'file importato' : 'file importati' }}
                </p>
              </div>
              @if (uploadedFiles().length > 0) {
                <button (click)="clearAll()"
                        class="text-[11px] text-zinc-400 hover:text-rose-500 dark:hover:text-rose-400 font-body transition-colors px-2 py-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30">
                  Rimuovi tutti
                </button>
              }
            </div>

            <!-- File cards -->
            <div class="space-y-2">
              @for (file of uploadedFiles(); track file.id; let i = $index) {
                <div @listItem
                     class="file-card rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-card
                            flex items-center gap-4 px-4 py-3.5 md:px-5 md:py-4"
                     [style.animation-delay]="(i * 50) + 'ms'">

                  <!-- Format icon -->
                  <div class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                       [ngClass]="formatStyle(file.originalFormat).iconBg">
                    <svg class="w-5 h-5" [ngClass]="formatStyle(file.originalFormat).iconColor"
                         fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                      <path stroke-linecap="round" stroke-linejoin="round"
                            d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"/>
                    </svg>
                  </div>

                  <!-- File info -->
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2 flex-wrap">
                      <p class="text-sm font-semibold text-zinc-800 dark:text-zinc-200 font-body truncate max-w-[200px] md:max-w-xs">
                        {{ file.convertedName }}
                      </p>
                      <!-- Converted badge (only if original was not .bxp) -->
                      @if (file.originalFormat !== 'bxp') {
                        <span class="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full
                                     bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400
                                     border border-brand-100 dark:border-brand-800/40 flex-shrink-0">
                          <svg class="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
                          </svg>
                          Convertito da .{{ file.originalFormat }}
                        </span>
                      } @else {
                        <span class="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full
                                     bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400
                                     border border-zinc-200 dark:border-zinc-700 flex-shrink-0">
                          Nativo .bxp
                        </span>
                      }
                    </div>
                    <div class="flex items-center gap-3 mt-0.5">
                      <span class="text-[11px] text-zinc-400 dark:text-zinc-500 font-body">{{ formatSize(file.sizeKb * 1024) }}</span>
                      <span class="text-zinc-200 dark:text-zinc-700">·</span>
                      <span class="text-[11px] text-zinc-400 dark:text-zinc-500 font-body">{{ formatDate(file.uploadedAt) }}</span>
                    </div>
                  </div>

                  <!-- Actions -->
                  <div class="flex items-center gap-1 flex-shrink-0">
                    <!-- Download -->
                    <button (click)="downloadFile(file)"
                            class="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-400 dark:text-zinc-500
                                   hover:text-brand-600 dark:hover:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-900/30 transition-all"
                            [attr.aria-label]="'Scarica ' + file.convertedName">
                      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"/>
                      </svg>
                    </button>
                    <!-- Delete -->
                    <button (click)="removeFile(file.id)"
                            class="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-300 dark:text-zinc-600
                                   hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all"
                            [attr.aria-label]="'Rimuovi ' + file.convertedName">
                      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
                      </svg>
                    </button>
                  </div>
                </div>
              }
            </div>
          </div>
        }

        <!-- Empty state (no uploads yet, idle) -->
        @if (uploadedFiles().length === 0 && phase() === 'idle') {
          <div class="flex flex-col items-center py-8 text-center">
            <div class="w-12 h-12 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-3">
              <svg class="w-6 h-6 text-zinc-300 dark:text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z"/>
              </svg>
            </div>
            <p class="text-sm font-semibold text-zinc-500 dark:text-zinc-400 font-display mb-0.5">Nessun file ancora caricato</p>
            <p class="text-[11px] text-zinc-400 dark:text-zinc-500 font-body">I piani importati appariranno qui</p>
          </div>
        }

      </div>
    </div>
  `,
})
export class UploadBusinessPlanComponent {
  @ViewChild('fileInput') fileInputRef!: ElementRef<HTMLInputElement>;

  phase           = signal<UploadPhase>('idle');
  isDragOver      = signal(false);
  uploadProgress  = signal(0);
  uploadingFile   = signal<File | null>(null);
  errorMessage    = signal('');
  conversionStep  = signal(0);
  convertingFromFormat = signal<FileFormat>('pdf');
  uploadedFiles   = signal<UploadedFile[]>([]);

  readonly circumference = 2 * Math.PI * 42;

  readonly dashOffset = computed(() =>
    this.circumference * (1 - this.uploadProgress() / 100)
  );

  readonly acceptedFormats = [
    {
      ext: 'PDF',
      desc: 'Adobe PDF',
      pill: 'border-rose-200 bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-800/40',
      iconBg: 'bg-rose-50 dark:bg-rose-950/30',
      iconColor: 'text-rose-500 dark:text-rose-400',
      iconPath: 'M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z',
    },
    {
      ext: 'DOCX',
      desc: 'Microsoft Word',
      pill: 'border-blue-200 bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800/40',
      iconBg: 'bg-blue-50 dark:bg-blue-950/30',
      iconColor: 'text-blue-500 dark:text-blue-400',
      iconPath: 'M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z',
    },
    {
      ext: 'BXP',
      desc: 'Formato Businext Plan',
      pill: 'border-brand-200 bg-brand-50 text-brand-600 dark:bg-brand-950/40 dark:text-brand-400 dark:border-brand-800/40',
      iconBg: 'bg-brand-50 dark:bg-brand-900/30',
      iconColor: 'text-brand-600 dark:text-brand-400',
      iconPath: 'M9 3.75H6.912a2.25 2.25 0 00-2.15 1.588L2.35 13.177a2.25 2.25 0 00-.1.661V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18v-4.162c0-.224-.034-.447-.1-.661L19.24 5.338a2.25 2.25 0 00-2.15-1.588H15M2.25 13.5h3.86a2.25 2.25 0 012.012 1.244l.256.512a2.25 2.25 0 002.013 1.244h3.218a2.25 2.25 0 002.013-1.244l.256-.512a2.25 2.25 0 012.013-1.244h3.859M12 3v8.25m0 0l-3-3m3 3l3-3',
    },
  ];

  readonly conversionSteps = [
    { id: 'parse',   label: 'Analisi struttura documento' },
    { id: 'extract', label: 'Estrazione dati finanziari' },
    { id: 'convert', label: 'Conversione in formato .bxp' },
    { id: 'verify',  label: 'Verifica integrità dati' },
  ];

  conversionStepState(index: number): 'done' | 'active' | 'pending' {
    const step = this.conversionStep();
    if (index < step) return 'done';
    if (index === step) return 'active';
    return 'pending';
  }

  formatStyle(fmt: FileFormat): { iconBg: string; iconColor: string; textColor: string } {
    switch (fmt) {
      case 'pdf':  return { iconBg: 'bg-rose-50 dark:bg-rose-950/30',   iconColor: 'text-rose-500 dark:text-rose-400',   textColor: 'text-rose-600 dark:text-rose-400' };
      case 'docx':
      case 'doc':  return { iconBg: 'bg-blue-50 dark:bg-blue-950/30',   iconColor: 'text-blue-500 dark:text-blue-400',   textColor: 'text-blue-600 dark:text-blue-400' };
      case 'bxp':  return { iconBg: 'bg-brand-50 dark:bg-brand-900/30', iconColor: 'text-brand-600 dark:text-brand-400', textColor: 'text-brand-600 dark:text-brand-400' };
    }
  }

  formatSize(bytes: number): string {
    if (bytes >= 1_048_576) return `${(bytes / 1_048_576).toFixed(1)} MB`;
    if (bytes >= 1_024)     return `${Math.round(bytes / 1024)} KB`;
    return `${bytes} B`;
  }

  formatDate(date: Date): string {
    return new Intl.DateTimeFormat('it-IT', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(date);
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(true);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(false);
    const file = event.dataTransfer?.files[0];
    if (file) this.processFile(file);
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) this.processFile(file);
    input.value = '';
  }

  private processFile(file: File): void {
    const fmt = getFormat(file.name);
    if (!fmt) {
      this.errorMessage.set('Formato non supportato. Carica un file .pdf, .doc, .docx o .bxp.');
      this.phase.set('error');
      return;
    }
    if (file.size > 50 * 1_048_576) {
      this.errorMessage.set('File troppo grande. Il limite è 50 MB.');
      this.phase.set('error');
      return;
    }

    this.uploadingFile.set(file);
    this.convertingFromFormat.set(fmt);
    this.uploadProgress.set(0);
    this.phase.set('uploading');

    this.simulateUpload(file, fmt);
  }

  private simulateUpload(file: File, fmt: FileFormat): void {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 12 + 4;
      if (progress >= 100) {
        progress = 100;
        this.uploadProgress.set(100);
        clearInterval(interval);
        setTimeout(() => {
          if (fmt === 'bxp') {
            this.finalize(file, fmt);
          } else {
            this.simulateConversion(file, fmt);
          }
        }, 400);
      } else {
        this.uploadProgress.set(Math.round(progress));
      }
    }, 80);
  }

  private simulateConversion(file: File, fmt: FileFormat): void {
    this.conversionStep.set(0);
    this.phase.set('converting');

    const stepDelays = [900, 1200, 1000, 700];
    let cumulative = 0;

    stepDelays.forEach((delay, i) => {
      cumulative += delay;
      setTimeout(() => {
        this.conversionStep.set(i + 1);
        if (i === stepDelays.length - 1) {
          setTimeout(() => this.finalize(file, fmt), 400);
        }
      }, cumulative);
    });
  }

  private finalize(file: File, fmt: FileFormat): void {
    const baseName = file.name.replace(/\.[^.]+$/, '');
    const converted: UploadedFile = {
      id: crypto.randomUUID(),
      originalName: file.name,
      originalFormat: fmt,
      convertedName: `${baseName}.bxp`,
      sizeKb: Math.round(file.size / 1024),
      uploadedAt: new Date(),
    };
    this.uploadedFiles.update(list => [converted, ...list]);
    this.phase.set('done');
  }

  removeFile(id: string): void {
    this.uploadedFiles.update(list => list.filter(f => f.id !== id));
  }

  clearAll(): void {
    this.uploadedFiles.set([]);
  }

  downloadFile(file: UploadedFile): void {
    const blob = new Blob([`[Businext Plan BXP] ${file.convertedName}`], { type: 'application/octet-stream' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = file.convertedName;
    a.click();
    URL.revokeObjectURL(url);
  }
}
