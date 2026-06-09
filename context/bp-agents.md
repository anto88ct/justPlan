# Agenti AI — Specifica Funzionale

> Documento di specifica per i tre agenti AI della sezione **Agenti** (ex "Scenari") di AirPlan.
> Ogni agente ha un dominio preciso, una personalità distinta e un'interfaccia utente dedicata.

---

## Panoramica

La sezione Agenti sostituisce il vecchio "What-If Simulator" con tre agenti specializzati,
ognuno accessibile tramite il pannello AI Copilot. L'utente sceglie l'agente in base al tipo
di domanda; l'agente risponde con il contesto, i dati e lo stile appropriati al suo ruolo.

| Agente | Dominio | Trigger tipico |
|--------|---------|----------------|
| **Elio** | Previsioni e scenari futuri | "Cosa succede se…" |
| **Argon** | Analisi critica e problemi | "C'è qualcosa che non va…" |
| **Xeno** | Informazioni e approfondimenti | "Cos'è… / Come funziona…" |

---

## Agente 1 — Elio

### Identità

- **Nome**: Elio
- **Colore**: ambra / arancione caldo (`amber-400` → `orange-500`)
- **Metafora visiva**: sistema solare — un sole centrale con pianeti in orbita prospettica 3D
- **Voce**: proattivo, orientato al futuro, ottimista ma preciso

### Dominio funzionale

Elio gestisce le **simulazioni what-if**: scenari futuri basati su modifiche ai parametri del
Business Plan. Quando l'utente descrive un cambiamento in linguaggio naturale, Elio:

1. Interpreta la richiesta e identifica i parametri da modificare nel `WizardInput`
2. Rigenera il piano (oggi: chiama `planService.applyAiScenario()`; futuro: tool-use su `computeFromWizard`)
3. Confronta i nuovi KPI con il baseline originale
4. Risponde con un riepilogo strutturato: delta fatturato, EBITDA, utile netto, runway

### Esempi di query gestite da Elio

- "Cosa succede se alzo il prezzo del Prodotto A a 59€ dal Q2?"
- "Simula 2 dipendenti in più dal terzo mese"
- "Proiezione se taglio il marketing del 20% — quanto migliora il runway?"
- "Cosa succede se entro in un nuovo mercato con volume +30% all'anno 2?"
- "Se riduco il prezzo del 10% ma aumento il volume del 25%, ci guadagno?"

### Comportamento atteso (stato attuale — fake)

- Riceve la query testuale
- Chiama `planService.applyAiScenario()` (multiplier hardcoded)
- Legge i nuovi KPI e genera una risposta formattata con delta (+18% Fatturato, +15% EBITDA, ecc.)
- Mostra il banner "Scenario applicato" con bottone "Ripristina"

### Comportamento futuro (roadmap — Claude API)

```
User query (NL)
  → Claude tool-use: chiama diff_wizard_input({ param: newValue, ... })
  → Applica diff al WizardInput corrente
  → computeFromWizard(updatedInput)
  → Legge nuovo KPI/CE/CF
  → Claude genera risposta narrativa con i numeri reali
```

Strumenti necessari:
- `diff_wizard_input` — applica una patch strutturata ai parametri del wizard
- `get_current_plan` — legge il WizardInput corrente
- `compute_scenario` — ri-esegue il motore con i nuovi parametri

### UX — Schema di risposta di Elio

```
📊 Scenario: [titolo breve]

Modifiche applicate:
  • Prezzo Prodotto A: 45€ → 59€ (dal mese 4)

Impatto sul piano:
  Fatturato Anno 1   +18%   €485K → €572K
  EBITDA             +15%   €97K  → €112K
  Utile Netto        +22%   €64K  → €78K
  Cash Runway        +4 mesi  14 → 18 mesi

[Bottone: Ripristina piano originale]
```

---

## Agente 2 — Argon

### Identità

- **Nome**: Argon
- **Colore**: blu / ciano diagnostico (`blue-500` → `cyan-400`)
- **Metafora visiva**: radar / scanner — anelli concentrici con raggio rotante e nodi anomalia
- **Voce**: analitico, diretto, senza eufemismi

### Dominio funzionale

Argon è il **revisore critico** del Business Plan. Scansiona il piano generato alla ricerca di:

- Incoerenze numeriche (ricavi irrealistici, costi piatti su 3 anni, margini impossibili)
- Falle metodologiche (IRAP su base errata, mancato riporto perdite, IVA ignorata)
- Dati anomali rispetto ai benchmark di settore
- Rischi nascosti (runway insufficiente, fabbisogno finanziario scoperto, crescita non sostenibile)

Argon attinge al documento `business-plan-issue.md` come knowledge base delle falle note
e le confronta con i dati effettivi del piano corrente.

### Esempi di query gestite da Argon

- "Ci sono problemi nel mio Business Plan?"
- "I miei ricavi sono realistici?"
- "Perché il mio EBITDA è così basso?"
- "Quali sono i rischi principali del mio piano?"
- "Ho errori nel calcolo delle imposte?"
- "Il mio cash runway è credibile per un investor deck?"

### Categorie di segnalazione

| Severità | Icona | Esempio |
|----------|-------|---------|
| Critica  | 🔴    | "La crescita del 10% mensile composta porta a volumi irrealistici (×28 in 3 anni)" |
| Alta     | 🟠    | "L'IRAP è calcolata sull'utile: dovrebbe essere sul valore della produzione netta" |
| Media    | 🟡    | "I costi fissi restano invariati per 3 anni — considera almeno un'inflazione del 3%" |

### Comportamento atteso (stato attuale — fake)

- Riceve la query
- Legge i KPI del piano corrente (`planService.kpi()`)
- Genera una risposta hardcoded con 2-3 segnalazioni plausibili basate sui dati
- (Non analisi reale — simulazione narrativa)

### Comportamento futuro (roadmap — Claude API)

```
User query + BusinessPlan data
  → Claude analizza: WizardInput + incomeStatement + cashFlow + kpi
  → Claude confronta con benchmark settore (recuperati da tool)
  → Claude produce lista prioritizzata di issue con severità + spiegazione + fix suggerito
```

Strumenti necessari:
- `get_full_plan_data` — legge WizardInput + CE + CF + KPI
- `get_sector_benchmarks(sector, year)` — recupera mediane settore
- `flag_issue(severity, title, details, suggestion)` — struttura l'output

### UX — Schema di risposta di Argon

```
🔍 Analisi Business Plan — [N] problemi trovati

🔴 CRITICO — Crescita ricavi non realistica
  La modalità "lineare" usa una formula esponenziale composta mensile.
  Con 10% mensile: ×28 di volume in 3 anni. Nessun mercato cresce così.
  → Suggerimento: imposta una curva a S o un tetto di mercato.

🟠 ALTA — IRAP calcolata su base errata
  L'imposta è applicata all'utile (EBT), non al valore della produzione netta.
  → L'IRAP reale ha base più larga: include costo del lavoro e oneri finanziari.

🟡 MEDIA — Cash flow solo per l'Anno 1
  Non è possibile valutare la solidità finanziaria su 3 anni con dati parziali.
```

---

## Agente 3 — Xeno

### Identità

- **Nome**: Xeno
- **Colore**: viola / ametista (`violet-500` → `purple-400`)
- **Metafora visiva**: cristallo di conoscenza — esagoni concentrici rotanti con nodi luminosi
- **Voce**: chiaro, didattico, usa esempi concreti riferiti all'app

### Dominio funzionale

Xeno è il **dizionario vivente** di AirPlan. Risponde a domande su:

- Terminologia finanziaria e fiscale italiana (IRPEF, IRAP, IRES, TFR, INPS, EBITDA, ecc.)
- Spiegazione dei campi del wizard (cosa significa "RAL", "FTE", "dilazione incassi", ecc.)
- Come funzionano i calcoli del motore (come viene calcolato l'EBITDA, il cash runway, ecc.)
- Best practice per startup e PMI italiane (struttura del piano, metriche per investitori)
- Differenze tra concetti simili (Utile Netto vs EBITDA, ricavo vs incasso, competenza vs cassa)

### Esempi di query gestite da Xeno

- "Cos'è l'IRPEF?"
- "Cosa significa RAL?"
- "Come viene calcolato il cash runway in questo app?"
- "Qual è la differenza tra IRES e IRAP?"
- "Cos'è il TFR e perché lo devo inserire?"
- "Come funziona l'ammortamento nel mio business plan?"
- "Cos'è il Gross Margin e perché conta per gli investitori?"
- "Cosa significa FTE 0.5?"

### Comportamento atteso (stato attuale — fake)

- Riceve la query
- Riconosce le parole chiave del dominio finanziario/fiscale
- Genera una risposta educativa con: definizione → formula (se applicabile) → esempio concreto
  riferito all'app AirPlan → rilevanza nel contesto del Business Plan

### Comportamento futuro (roadmap — Claude API)

```
User query
  → Claude identifica il termine/concetto
  → Claude recupera definizione normativa aggiornata (tool: search_fiscal_terms)
  → Claude genera spiegazione con esempio calcolato sui dati reali del piano corrente
     ("Nel tuo piano, l'IRAP stimata è €X calcolata su una base di €Y...")
```

Strumenti necessari:
- `get_current_plan_context` — per personalizzare la risposta con i dati reali
- `search_fiscal_terms(term)` — per terminologia aggiornata (opzionale)

### UX — Schema di risposta di Xeno

**Esempio: "Cos'è l'IRPEF?"**

```
📘 IRPEF — Imposta sul Reddito delle Persone Fisiche

Cos'è:
  Imposta progressiva applicata al reddito dei lavoratori dipendenti e autonomi.
  NON si applica alle società di capitali (S.r.l., S.p.A.): quelle pagano IRES.

In questo app:
  Se sei un lavoratore autonomo o una ditta individuale, l'IRPEF sostituisce l'IRES
  nel calcolo delle imposte. Nel wizard, imposta l'aliquota IRES al 0% e usa una
  percentuale IRPEF equivalente alla tua fascia di reddito.

Aliquote 2024 (scaglioni):
  • fino a €28.000:  23%
  • €28.001–50.000:  35%
  • oltre €50.000:   43%

Nel tuo piano:
  Con un utile stimato di €64.000, l'IRPEF sarebbe circa €20.300
  (23% sui primi €28K + 35% sui restanti €36K).
```

---

## Note di integrazione frontend

### Signal agente attivo

Aggiungere al componente:
```typescript
activeAgent = signal<'elio' | 'argon' | 'xeno' | null>(null);
```

### Apertura chat con contesto agente

```typescript
openAgentChat(agent: 'elio' | 'argon' | 'xeno', query: string): void {
  this.activeAgent.set(agent);
  this.openAiWithScenario(query);
}
```

### Passaggio contesto al chatbot

L'`AiChatbotComponent` dovrà ricevere l'agente attivo come input per:
- Modificare l'intestazione del chat (nome agente)
- Usare il system prompt appropriato
- Colorare la UI con il colore dell'agente

```typescript
// In AiChatbotComponent
@Input() agent: 'elio' | 'argon' | 'xeno' | null = null;
```

### Sistema prompt per agente (futuro)

```typescript
const AGENT_PROMPTS = {
  elio:  `Sei Elio, un agente specializzato in simulazioni what-if di Business Plan...`,
  argon: `Sei Argon, un agente specializzato nell'analisi critica di Business Plan...`,
  xeno:  `Sei Xeno, un agente specializzato in informazioni finanziarie e fiscali...`,
};
```

---

## Roadmap tecnica

| Fase | Descrizione | Dipendenze |
|------|-------------|------------|
| 1 (ora) | UI fake — card animate + apertura AI chat con prompt precompilato | Nessuna |
| 2 | Integrazione Claude API base — risposte NL senza tool use | Chiavi API, backend proxy |
| 3 | Elio con tool use — `diff_wizard_input` + `computeFromWizard` reale | BE con endpoint scenario |
| 4 | Argon con analisi piano reale — confronto KPI + knowledge base issue | BE data API |
| 5 | Xeno con dati piano personalizzati — risposte contestualizzate | Fase 3 completata |
| 6 | Multi-agente — handoff tra agenti nella stessa chat | Architettura agente multi-turn |
