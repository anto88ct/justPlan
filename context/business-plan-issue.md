# Business Plan — Analisi Falle e Soluzioni

> Documento tecnico-finanziario. Mappa tutti i problemi del motore di Business Plan
> e le relative soluzioni. Pensato per essere consumato da un agente AI che dovrà
> risolvere questi problemi in futuro.

## File coinvolti

| File | Ruolo |
|------|-------|
| `src/app/services/business-plan.service.ts` | Motore finanziario (`computeFromWizard`), stato, scenario AI |
| `src/app/components/wizard-form/wizard-form.component.ts` | Wizard 6 step di input |
| `src/app/components/ai-chatbot/ai-chatbot.component.ts` | Chatbot "CFO virtuale" (attualmente mock) |
| `src/app/components/report/report.component.ts` | Output prospetti |
| `src/app/components/dashboard-cruscotto/dashboard-cruscotto.component.ts` | KPI dashboard |

## Sintesi del verdetto

Il motore produce un **conto economico semplificato + cash flow parziale (solo Anno 1)**.
NON è un business plan completo: manca lo Stato Patrimoniale, il Rendiconto Finanziario
pluriennale e le metriche richieste da banche/investitori. L'integrazione AI è
**attualmente finta** (moltiplicatori hardcoded, nessuna chiamata LLM).

Severità: 🔴 critica · 🟠 alta · 🟡 media

---

## FASE 1 — Setup fiscale

### 1.1 🔴 IRAP calcolata su base errata
- **Dove:** `business-plan.service.ts:454`, `:467`
- **Problema:** `_taxRate = (config.iresRate + config.irapRate) / 100` e poi applicato a `Math.max(0, EBT)`. IRES e IRAP vengono sommate e applicate alla stessa base (EBT/utile). È sbagliato: l'IRAP colpisce il **valore della produzione netta**, base da cui il costo del personale (salvo deduzioni) e gli oneri finanziari NON sono deducibili. Lo stesso tooltip in `wizard-form.component.ts:476` lo afferma ("si calcola sul valore della produzione netta, non sull'utile"), ma il codice lo ignora. L'IRAP reale ha tipicamente base più larga dell'IRES.
- **Soluzione:**
  - Separare le due imposte. Calcolare `baseIRES` (reddito imponibile) e `baseIRAP` (valore della produzione netta) distintamente.
  - `baseIRAP ≈ Ricavi − Costi produzione (materie, servizi, godimento beni terzi, ammortamenti, oneri diversi)`, **escludendo** il costo del personale (salvo deduzioni cuneo fiscale) e gli oneri finanziari.
  - `IRAP = baseIRAP * irapRate`; `IRES = baseIRES_imponibile * iresRate`.

### 1.2 🔴 Nessun riporto delle perdite (loss carryforward)
- **Dove:** `business-plan.service.ts:467` — `annualTax = -round(max(0, annualEBT[y]) * taxRate)` per anno indipendente.
- **Problema:** Ogni anno è tassato isolatamente. Una perdita nell'Anno 1 non riduce l'imponibile dell'Anno 2. La normativa italiana consente il riporto delle perdite (art. 84 TUIR: limite 80% del reddito; startup/primi 3 esercizi: utilizzo integrale). Risultato: imposte sovrastimate, utile netto sottostimato per i piani realistici (perdita iniziale → profitto).
- **Soluzione:** Introdurre uno stato `lossCarryforward`. Ogni anno: se EBT < 0 accumula la perdita; se EBT > 0 compensa fino all'80% (o 100% per startup nei primi esercizi) prima di applicare l'aliquota.

### 1.3 🟠 IRES applicata all'utile civilistico, non al reddito imponibile
- **Dove:** `business-plan.service.ts:466-467`
- **Problema:** L'imponibile IRES parte dall'utile civilistico ma va rettificato per variazioni in aumento/diminuzione (costi indeducibili o parzialmente deducibili: auto, telefonia, rappresentanza, interessi passivi oltre ROL, ecc.) e agevolazioni (ACE).
- **Soluzione:** Aggiungere almeno una percentuale parametrica di "costi indeducibili" e supporto opzionale ad ACE. Anche un singolo campo "rettifiche fiscali %" migliorerebbe la fedeltà.

### 1.4 🟠 Accantonamento rischi crediti (bad debt) fantasma
- **Dove:** `business-plan.service.ts:338-339` — `badDebtFactor` riduce solo `cashRevenue`.
- **Problema:** `badDebtPct` taglia silenziosamente gli incassi ma non compare mai nel Conto Economico come svalutazione crediti. Il tooltip (`wizard-form.component.ts:489`) dichiara "deduce dall'utile imponibile": falso, non tocca il CE. Incoerenza tra cassa e CE → utile gonfiato.
- **Soluzione:** Aggiungere una riga "Svalutazione Crediti" al CE pari a `Ricavi * badDebtPct`, dedotta dall'EBT (e dal valore della produzione ai fini IRAP secondo le regole). Mantenere coerenza con l'effetto cassa.

---

## FASE 2 — Ricavi

### 2.1 🔴 La "crescita lineare" è in realtà composta mensile
- **Dove:** `business-plan.service.ts:328` — `vol = round(linearStart * pow(1 + growthPct/100, m))` con `m` fino a 35.
- **Problema:** L'etichetta UI dice "Crescita Lineare" ma la formula è esponenziale composta mensile. Con il 10% "mensile", `1.1^35 ≈ 28×` in 3 anni. Nessun tetto, nessuna curva a S, nessuna saturazione del mercato (TAM/SAM/SOM). Genera ricavi irrealistici.
- **Soluzione:**
  - Rinominare correttamente o offrire entrambe le modalità: crescita **lineare vera** (`linearStart + k*m`) e crescita **composta** (esplicitamente etichettata, annua o mensile).
  - Introdurre un tetto di mercato (saturazione tramite curva logistica/S-curve).
  - Avvisare l'utente quando il tasso implica una crescita annua fuori scala.

### 2.2 🟠 Nessun modello di churn / ricavo ricorrente
- **Dove:** intero blocco revenue `business-plan.service.ts:319-339`
- **Problema:** Per SaaS/abbonamenti non esiste abbandono clienti. I ricavi ricorrenti sono cumulati senza decadimento. MRR/ARR e retention non sono modellati.
- **Soluzione:** Aggiungere parametro churn mensile per prodotto ricorrente. Distinguere ricavi one-shot vs ricorrenti. Calcolare base clienti attiva = nuovi − abbandonati, derivare MRR/ARR.

### 2.3 🟠 Modalità "mese per mese" piatta sui 3 anni
- **Dove:** `business-plan.service.ts:330` — `vol = monthlyVolumes[m % 12]`
- **Problema:** Il pattern dei 12 volumi inseriti viene ripetuto identico per Anno 2 e Anno 3 (`m % 12`). Nessuna crescita anno su anno. Probabile bug.
- **Soluzione:** Applicare un fattore di crescita annuo ai volumi mensili oppure permettere l'inserimento dei 36 mesi.

### 2.4 🟡 Ricavi a CE pieni mentre bad debt solo su cassa
- Vedi 1.4. Il CE registra ricavo lordo, nessun accantonamento → margini gonfiati.

---

## FASE 3 — Personale (HR)

### 3.1 🟠 13ª/14ª spalmate uniformemente sui mesi
- **Dove:** `business-plan.service.ts:342-352` — `monthlyCost = (ral * fte * hrMult) / 12` costante.
- **Problema:** Le mensilità aggiuntive (13ª a dicembre, 14ª a giugno) vengono distribuite uniformemente. Il cash flow mensile non riflette i picchi reali di uscita di cassa nei mesi di erogazione.
- **Soluzione:** Modellare le mensilità aggiuntive come uscite di cassa concentrate nei mesi corretti, mantenendo la competenza economica spalmata nel CE.

### 3.2 🟠 Nessun adeguamento retributivo pluriennale
- **Problema:** L'organico costa identico per 3 anni mentre i ricavi possono crescere enormemente. Nessun aumento RAL, nessuna assunzione/uscita programmata oltre la data d'ingresso.
- **Soluzione:** Parametro di crescita salariale annua e possibilità di data di uscita / variazioni FTE nel tempo.

### 3.3 🟡 TFR come percentuale libera
- **Dove:** `wizard-form.component.ts` (campo `tfrPct`)
- **Problema:** Il TFR reale ≈ RAL / 13.5 (≈ 7.4%). Esporlo come percentuale arbitraria può portare a valori errati.
- **Soluzione:** Default coerente (≈6.91% della retribuzione) con possibilità di override, oppure calcolo automatico.

---

## FASE 4 — Costi operativi (OPEX)

### 4.1 🔴 IVA raccolta ma completamente ignorata
- **Dove:** campi `vatRate`/`vcVat`/`fcVat` nel wizard (`wizard-form.component.ts:928`, `:1011`); nel motore **non usati**.
- **Problema:** L'IVA viene chiesta all'utente ma non entra mai nel calcolo. L'IVA ha impatto enorme sul timing di cassa (liquidazione periodica IVA: debito su vendite − credito su acquisti, versata mensile/trimestrale). Assente del tutto.
- **Soluzione:** Implementare la gestione IVA in cassa:
  - IVA a debito su ricavi, IVA a credito su costi/CAPEX.
  - Saldo IVA versato/recuperato secondo cadenza (mensile/trimestrale).
  - L'IVA non tocca il CE (è partita di giro) ma è cruciale nel cash flow.

### 4.2 🟠 Tutti i costi variabili classificati come "Costo del Venduto"
- **Dove:** `business-plan.service.ts:457` — `annualCogs = -sum(varCosts)`
- **Problema:** Qualunque costo variabile (commissioni, hosting, costi di erogazione) finisce nel COGS, falsando il Gross Profit / gross margin. Non tutti i costi variabili sono COGS.
- **Soluzione:** Aggiungere al `WizardVariableCost` un campo di classificazione (COGS vs Opex variabile sotto la linea) e aggregare di conseguenza.

### 4.3 🟠 Costi fissi e variabili-assoluti piatti sui 3 anni
- **Dove:** `business-plan.service.ts:361` (`vc.value/12`), `:375` (`fc.monthlyBudget` costante 36 mesi).
- **Problema:** Nessuna crescita né step-cost. Marketing/affitti restano fermi mentre i ricavi crescono. Ratio costi/ricavi irrealistici.
- **Soluzione:** Parametro di crescita annua per categoria di costo e/o costi a scalini (step) legati a soglie di fatturato o headcount.

---

## FASE 5 — Investimenti (CAPEX)

### 5.1 🟠 Ammortamento senza aliquota dimezzata il primo anno
- **Dove:** `business-plan.service.ts:395-398`
- **Problema:** La norma fiscale italiana prevede l'aliquota dimezzata nel primo esercizio. Il codice applica l'aliquota piena dal mese di acquisto, sovrastimando l'ammortamento dell'Anno 1.
- **Soluzione:** Applicare metà aliquota nel primo esercizio di entrata in funzione del bene.

### 5.2 🟠 Default silenzioso a 0 per categorie non mappate + chiavi confuse
- **Dove:** `business-plan.service.ts:122-128` (`AMMO_RATES`), `:395` (`?? 0`).
- **Problema:** Se la categoria non è nella mappa, l'ammortamento è 0 senza alcun avviso. Le chiavi sono incoerenti: `impianti: 15` vs `impianto: 20`, `rnd: 20` duplicato/ambiguo. Rischio di ammortamento nullo silenzioso.
- **Soluzione:** Allineare le chiavi della mappa con i `value` delle categorie del wizard (`capexCategories`). Lanciare warning o usare un default esplicito (mai 0 silenzioso). Tabella aliquote centralizzata e verificata.

### 5.3 🟡 Nessun incentivo fiscale (super/iper-ammortamento, crediti d'imposta)
- **Problema:** Per startup/PMI italiane mancano credito d'imposta beni strumentali (Industria 4.0/Transizione 5.0) e super/iper-ammortamento. Sono leve rilevanti in un BP credibile.
- **Soluzione:** Parametri opzionali per maggiorazione ammortamento e crediti d'imposta su CAPEX qualificato.

### 5.4 🟡 IVA su CAPEX non gestita; nessun valore residuo/dismissione
- **Soluzione:** Includere IVA su acquisto cespiti nel cash flow (vedi 4.1); opzionale: valore residuo e plus/minusvalenze da dismissione.

---

## FASE 6 — Finanziamento

### 6.1 ✅ Ammortamento mutui corretto
- **Dove:** `business-plan.service.ts:407-443`
- L'ammortamento alla francese (rata costante) con periodo di pre-ammortamento (solo interessi) è implementato correttamente. Mantenere.

### 6.2 🟠 Nessun fido/scoperto automatico di copertura
- **Problema:** Se la cassa va negativa, il runway si ferma ma non viene simulata alcuna fonte di copertura (fido bancario, scoperto). In un BP reale serve evidenziare il fabbisogno finanziario residuo.
- **Soluzione:** Calcolare il **fabbisogno finanziario** (massimo scoperto cumulato) e, opzionalmente, simulare una linea di credito revolving con relativi interessi.

### 6.3 🟡 Equity solo come entrata di cassa
- **Problema:** Le iniezioni di equity entrano in cassa ma non si traducono in patrimonio netto tracciato; nessuna gestione dividendi/distribuzioni.
- **Soluzione:** Tracciare il patrimonio netto (capitale + riserve + utili a nuovo) — collegato allo Stato Patrimoniale (vedi 7.1).

---

## PROBLEMI STRUTTURALI (trasversali)

### 7.1 🔴 Manca lo Stato Patrimoniale
- **Problema:** Un business plan completo richiede 3 prospetti: Conto Economico, **Stato Patrimoniale**, Rendiconto Finanziario. Attualmente esistono solo CE + cash flow parziale. La modalità non-startup raccoglie cassa/crediti/debiti iniziali (`config.initialCash/residualCredits/residualDebts`) ma li netta soltanto nella cassa di apertura (`business-plan.service.ts:490`): nessun bilancio costruito. Banche e investitori rifiutano un BP senza SP.
- **Soluzione:** Costruire lo Stato Patrimoniale pluriennale:
  - **Attivo:** immobilizzazioni (CAPEX − fondo ammortamento), crediti v/clienti (da dilazione incassi), cassa, credito IVA.
  - **Passivo:** patrimonio netto (capitale + utili/perdite a nuovo), debiti finanziari (residuo mutui), debiti v/fornitori (da dilazione pagamenti), TFR accantonato, debiti tributari/IVA.
  - Verificare la quadratura Attivo = Passivo ogni periodo.

### 7.2 🔴 Cash flow solo per l'Anno 1
- **Dove:** `business-plan.service.ts:493-503` (12 punti); il runway scorre 36 mesi (`:509-519`) ma il grafico mostra solo 12.
- **Soluzione:** Estendere il cash flow visualizzato a 36 mesi (o aggregato trimestrale/annuale per 3 anni), con Rendiconto Finanziario per competenza (flussi operativi, di investimento, di finanziamento).

### 7.3 🟠 Mancano le metriche chiave per investitori
- **Problema:** Assenti: Break-Even Point (BEP), margine di contribuzione, NPV/IRR/DCF, payback period, burn rate esplicito, CAC/LTV, EBITDA margin %, gross margin %.
- **Soluzione:** Aggiungere un livello di KPI derivati:
  - Break-even (in volumi e in fatturato), margine di contribuzione.
  - DCF: NPV e IRR su flussi di cassa scontati (parametro WACC/tasso di sconto), payback.
  - Burn rate mensile e runway già presente; aggiungere gross margin %, EBITDA %.
  - Per startup: CAC, LTV, LTV/CAC, MRR/ARR, churn (collegato a 2.2).

### 7.4 🟡 Arrotondamenti a metà calcolo
- **Dove:** `Math.round` diffuso nei passaggi intermedi (`business-plan.service.ts` passim).
- **Problema:** Arrotondare risultati intermedi accumula drift sugli aggregati.
- **Soluzione:** Mantenere la precisione piena nei calcoli interni e arrotondare solo in presentazione.

---

## INTEGRAZIONE AI — stato attuale e roadmap

### 8.1 🔴 L'AI è attualmente finta (mock)
- **Dove:**
  - `business-plan.service.ts:572-595` `applyAiScenario()` usa moltiplicatori **hardcoded** (`*1.18`, `*1.15`, `*1.22`, `*1.3`), ciechi rispetto al modello reale.
  - `business-plan.service.ts:182-185` `kpiDelta` ritorna stringhe fisse (`'+18%'`, ecc.).
  - `ai-chatbot.component.ts:192-213` ignora completamente il testo dell'utente, usa `setTimeout(2000)` per simulare un calcolo e restituisce una risposta hardcoded identica per qualsiasi domanda.
- **Conclusione:** Nessuna chiamata LLM, nessuna API. È una demo simulata.

### 8.2 Roadmap per un'AI reale

1. **NL → parametri strutturati (priorità massima).**
   - Usare la Claude API con **tool use**: definire uno schema-strumento corrispondente a `WizardInput` (o a un "diff" di parametri).
   - Flusso: messaggio utente ("alza il prezzo del Prodotto X a 50€ dal Q3") → Claude produce una patch strutturata dei parametri → si applica la patch all'`WizardInput` → si ri-esegue `computeFromWizard()` reale.
   - Eliminare i moltiplicatori hardcoded; gli scenari devono passare per il motore vero.

2. **Forecasting e sensitivity.**
   - Simulazione Monte Carlo sui driver chiave (volume, prezzo, churn, dilazioni) → bande P10/P50/P90 invece di valori puntuali.
   - Analisi di sensitività (tornado chart) sulle variabili a maggior impatto.

3. **Benchmark di settore.**
   - L'AI confronta i ratio del piano (gross margin, CAC/LTV, crescita, EBITDA%) con mediane di settore e segnala valori fuori scala (es. la crescita `1.1^35` del punto 2.1).

4. **Generazione narrativa.**
   - Executive summary e analisi rischi generati **dai numeri reali**, non testo fisso.

5. **Anomaly detection.**
   - L'AI individua e segnala le falle di questo documento: crescita irrealistica, mancato riporto perdite, IRAP errata, IVA assente, classificazione COGS impropria, ammortamento primo anno.

---

## Priorità di intervento (per impatto)

| # | Intervento | Severità | Riferimento |
|---|-----------|----------|-------------|
| 1 | Aggiungere Stato Patrimoniale + cash flow a 36 mesi | 🔴 | 7.1, 7.2 |
| 2 | Correggere IRAP (base corretta) + riporto perdite | 🔴 | 1.1, 1.2 |
| 3 | Implementare gestione IVA in cassa | 🔴 | 4.1 |
| 4 | Tetto/curva sulla crescita ricavi + churn | 🔴/🟠 | 2.1, 2.2 |
| 5 | AI reale (tool use → rerun del motore); rimuovere moltiplicatori | 🔴 | 8.1, 8.2 |
| 6 | Metriche investitore: BEP, margine contribuzione, EBITDA%/gross%, DCF | 🟠 | 7.3 |
| 7 | Bad debt nel CE; classificazione COGS; costi non piatti | 🟠 | 1.4, 4.2, 4.3 |
| 8 | Ammortamento primo anno dimezzato; chiavi AMMO_RATES allineate | 🟠 | 5.1, 5.2 |
| 9 | 13ª/14ª su cassa nei mesi corretti; adeguamenti salariali | 🟠 | 3.1, 3.2 |
| 10 | Fabbisogno finanziario / fido di copertura | 🟠 | 6.2 |
