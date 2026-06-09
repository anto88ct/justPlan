# PWA Setup — Design Spec

**Date:** 2026-06-09  
**Project:** AirPlan (Angular 17 standalone)  
**Objective:** Make the app installable on desktop/mobile as a PWA, with cache-first asset caching.

---

## 1. Packages & Wiring

Install `@angular/service-worker` (same major as Angular 17).

Register in `src/app/app.config.ts`:

```ts
import { provideServiceWorker } from '@angular/service-worker';
import { isDevMode } from '@angular/core';

// add to providers array:
provideServiceWorker('ngsw-worker.js', {
  enabled: !isDevMode(),
  registrationStrategy: 'registerWhenStable:30000',
})
```

Add to `angular.json` under `projects.justplan-app.architect.build.options`:
```json
"serviceWorker": true,
"ngswConfigPath": "ngsw-config.json"
```

Add manifest link to `src/index.html` `<head>`:
```html
<link rel="manifest" href="manifest.webmanifest">
<meta name="theme-color" content="#6366f1">
```

---

## 2. Manifest (`src/manifest.webmanifest`)

```json
{
  "name": "AirPlan",
  "short_name": "AirPlan",
  "description": "Genera il tuo Business Plan con AI in pochi minuti",
  "theme_color": "#6366f1",
  "background_color": "#0f172a",
  "display": "standalone",
  "scope": "/",
  "start_url": "/",
  "icons": [
    {
      "src": "assets/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "assets/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    },
    {
      "src": "assets/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable"
    }
  ]
}
```

Reference in `angular.json` assets array: `"src/manifest.webmanifest"`.

---

## 3. Icon Generation

Source: `src/assets/logo-mark.svg` → generate PNG variants via `sharp` (already in devDependencies).

Script: `scripts/generate-icons.js`

```js
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const src = path.join(__dirname, '../src/assets/logo-mark.svg');
const outDir = path.join(__dirname, '../src/assets/icons');
fs.mkdirSync(outDir, { recursive: true });

const sizes = [192, 512];
Promise.all(
  sizes.map(size =>
    sharp(src)
      .resize(size, size)
      .png()
      .toFile(path.join(outDir, `icon-${size}x${size}.png`))
  )
).then(() => console.log('Icons generated.'));
```

Run once: `node scripts/generate-icons.js`

Add `src/assets/icons/` to `.gitignore` or commit the generated files — either is fine; committing avoids requiring node at CI.

---

## 4. Service Worker Config (`ngsw-config.json`)

```json
{
  "$schema": "./node_modules/@angular/service-worker/config/schema.json",
  "index": "/index.html",
  "assetGroups": [
    {
      "name": "app",
      "installMode": "prefetch",
      "updateMode": "prefetch",
      "resources": {
        "files": [
          "/favicon.ico",
          "/index.html",
          "/manifest.webmanifest",
          "/*.css",
          "/*.js"
        ]
      }
    },
    {
      "name": "assets",
      "installMode": "lazy",
      "updateMode": "prefetch",
      "resources": {
        "files": [
          "/assets/**",
          "/*.(svg|cur|jpg|jpeg|png|apng|webp|avif|gif|otf|ttf|woff|woff2)"
        ]
      }
    }
  ],
  "dataGroups": [
    {
      "name": "api",
      "urls": ["/api/**"],
      "cacheConfig": {
        "maxSize": 100,
        "maxAge": "1d",
        "timeout": "10s",
        "strategy": "freshness"
      }
    }
  ]
}
```

**Strategy rationale:**
- `app` group: prefetch + cache-first — app shell always instant.
- `assets` group: lazy + prefetch on update — i18n JSON, icons, SVG cached on first request.
- `api` data group: freshness (network-first) with 10s timeout fallback — ready for future REST backend.

---

## 5. Update Strategy

Angular's default SW update flow:
1. On app load, SW checks for new version in background.
2. If update found, downloads silently.
3. New version activates on next full navigation (tab close + reopen).

No extra code needed for basic behavior. If we want to prompt the user ("New version available — reload?"), add `SwUpdate` service later as a follow-up.

---

## 6. Testing

PWA features only work on production build + HTTPS (or localhost).

```bash
ng build
npx http-server dist/justplan-app/browser -p 8080
# open http://localhost:8080
```

Check installability via Chrome DevTools → Application → Manifest + Service Workers.

---

## Out of Scope

- Push notifications (no backend yet)
- Background sync
- `SwUpdate` reload prompt (can be added post-launch)
- Maskable icon with safe-zone padding (current icon is square logo; maskable will clip corners — acceptable for now)
