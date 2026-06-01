# Dark Mode / Theme Toggle — Design Spec
**Date:** 2026-06-01

## Overview
Add a working theme toggle to the Settings page. Light mode is default and current. Dark mode persists via localStorage.

## Architecture

### ThemeService (`src/app/services/theme.service.ts`)
- Angular `Injectable({ providedIn: 'root' })`
- `dark = signal<boolean>(...)` — reads from `localStorage.getItem('theme') === 'dark'` on init
- `effect()` applies/removes class `dark` on `document.documentElement` and writes to localStorage
- `toggle()` method flips the signal

### Tailwind Config
- Add `darkMode: 'class'` to `tailwind.config.js`

### Settings Wiring (`app-layout.component.ts`)
- Inject `ThemeService`
- Change settings toggle for `key === 'dark'` to call `themeService.toggle()` and read `themeService.dark()` for display
- Init `enabled` value from `themeService.dark()` on component init

### Dark Mode Palette (Tailwind `dark:` variants)

| Element | Light | Dark |
|---|---|---|
| Main area bg | `bg-zinc-50` | `dark:bg-zinc-950` |
| Cards / panels | `bg-white` | `dark:bg-zinc-900` |
| Borders | `border-zinc-100` | `dark:border-zinc-800` |
| Primary text | `text-zinc-900` | `dark:text-zinc-100` |
| Secondary text | `text-zinc-700` | `dark:text-zinc-300` |
| Muted text | `text-zinc-400/500` | stays / shifts one step |
| Hover bg | `hover:bg-zinc-100` | `dark:hover:bg-zinc-800` |
| Toggle off | `bg-zinc-200` | `dark:bg-zinc-700` |
| Brand tint bg | `bg-brand-50` | `dark:bg-brand-950` |
| Topbar | `bg-white border-zinc-100` | `dark:bg-zinc-900 dark:border-zinc-800` |

**Sidebar**: stays `bg-zinc-950` unchanged (already dark).

### Styles.css
- Dark mode scrollbar colors via `@media (prefers-color-scheme)` or CSS `.dark` selector

## Scope
- `tailwind.config.js`
- `src/styles.css`
- `src/app/services/theme.service.ts` (new)
- `src/app/components/app-layout/app-layout.component.ts`

Child components (wizard, dashboard, report, profile) not covered in this iteration.

## Not in scope
- System preference auto-detection (prefers-color-scheme)
- Child component dark mode
- Dark mode for AI chatbot panel internals
