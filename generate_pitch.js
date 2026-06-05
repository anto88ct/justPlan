/**
 * AirPlan - Pitch Commerciale
 * Genera pitch_clienti.pptx con pptxgenjs
 */
const pptxgen = require("pptxgenjs");
const React = require("react");
const ReactDOMServer = require("react-dom/server");
const sharp = require("sharp");
const {
  FaRocket, FaChartLine, FaUsers, FaBrain, FaFileInvoiceDollar,
  FaCheckCircle, FaClock, FaExclamationTriangle, FaArrowRight,
  FaCog, FaShareAlt, FaClipboardList, FaLightbulb
} = require("react-icons/fa");

// ── Palette ──────────────────────────────────────────────────────────────────
const C = {
  navy:    "0B1E3F",   // primary dark bg
  navyMid: "1A3461",   // secondary dark
  teal:    "0EA5E9",   // sky blue accent
  emerald: "10B981",   // green / growth
  amber:   "F59E0B",   // warning / highlight
  white:   "FFFFFF",
  offWhite:"F1F5F9",
  slate:   "64748B",
  textDark:"1E293B",
  card:    "FFFFFF",
};

// ── Icon utility ──────────────────────────────────────────────────────────────
async function iconPng(IconComponent, color = "#FFFFFF", size = 256) {
  const svg = ReactDOMServer.renderToStaticMarkup(
    React.createElement(IconComponent, { color, size: String(size) })
  );
  const buf = await sharp(Buffer.from(svg)).png().toBuffer();
  return "image/png;base64," + buf.toString("base64");
}

const makeShadow = () => ({
  type: "outer", color: "000000", blur: 8, offset: 3, angle: 135, opacity: 0.18
});

// ── Main ──────────────────────────────────────────────────────────────────────
async function build() {
  const pres = new pptxgen();
  pres.layout = "LAYOUT_16x9";
  pres.author  = "AirPlan";
  pres.title   = "AirPlan – Pitch Commerciale";
  pres.subject = "Presentazione per clienti e investitori";

  // ══════════════════════════════════════════════════════════════════════════
  // SLIDE 1 – TITOLO
  // ══════════════════════════════════════════════════════════════════════════
  {
    const s = pres.addSlide();
    s.background = { color: C.navy };

    // Decorative teal circle top-right
    s.addShape(pres.shapes.OVAL, {
      x: 7.8, y: -1.2, w: 4, h: 4,
      fill: { color: C.teal, transparency: 82 }, line: { color: C.teal, transparency: 82, width: 0 }
    });
    // Decorative emerald circle bottom-left
    s.addShape(pres.shapes.OVAL, {
      x: -1.5, y: 3.5, w: 3.5, h: 3.5,
      fill: { color: C.emerald, transparency: 85 }, line: { color: C.emerald, transparency: 85, width: 0 }
    });

    // Teal accent left bar
    s.addShape(pres.shapes.RECTANGLE, {
      x: 0.55, y: 1.6, w: 0.08, h: 2.4,
      fill: { color: C.teal }, line: { color: C.teal, width: 0 }
    });

    // Product name
    s.addText("AirPlan", {
      x: 0.75, y: 1.55, w: 6, h: 1.2,
      fontSize: 64, bold: true, color: C.white,
      fontFace: "Arial Black", margin: 0, valign: "top"
    });

    // Tagline
    s.addText("Il tuo CFO Virtuale", {
      x: 0.75, y: 2.75, w: 6, h: 0.6,
      fontSize: 22, color: C.teal, fontFace: "Calibri",
      italic: true, margin: 0
    });

    // Sub-description
    s.addText("Dal foglio bianco al piano finanziario triennale\nin meno di 10 minuti.", {
      x: 0.75, y: 3.45, w: 6.5, h: 0.9,
      fontSize: 15, color: "A0B4CC", fontFace: "Calibri", margin: 0
    });

    // Rocket icon
    const rocketIcon = await iconPng(FaRocket, "#0EA5E9", 512);
    s.addImage({ data: rocketIcon, x: 7.6, y: 1.4, w: 1.8, h: 1.8, transparency: 10 });

    // Bottom tagline strip
    s.addShape(pres.shapes.RECTANGLE, {
      x: 0, y: 5.15, w: 10, h: 0.475,
      fill: { color: C.navyMid }, line: { color: C.navyMid, width: 0 }
    });
    s.addText("Piano Starter disponibile · Ideale per startup, PMI e fondatori · 100% Made in Italy", {
      x: 0, y: 5.15, w: 10, h: 0.475,
      fontSize: 11, color: C.teal, fontFace: "Calibri",
      align: "center", valign: "middle", margin: 0
    });
  }

  // ══════════════════════════════════════════════════════════════════════════
  // SLIDE 2 – IL PROBLEMA
  // ══════════════════════════════════════════════════════════════════════════
  {
    const s = pres.addSlide();
    s.background = { color: C.offWhite };

    // Title
    s.addText("Il Problema che Risolviamo", {
      x: 0.5, y: 0.35, w: 9, h: 0.75,
      fontSize: 34, bold: true, color: C.textDark, fontFace: "Arial Black", margin: 0
    });
    s.addText("Costruire un business plan affidabile è costoso, lento e dispersivo.", {
      x: 0.5, y: 1.05, w: 9, h: 0.45,
      fontSize: 15, color: C.slate, fontFace: "Calibri", margin: 0
    });

    // 3 problem cards
    const problems = [
      {
        icon: FaClock,
        iconColor: "#F59E0B",
        bgColor: "FFF8E7",
        borderColor: "F59E0B",
        stat: "40+ ore",
        label: "per un piano\nfinanziario manuale",
        desc: "Fondatori e PMI perdono settimane tra\nfogli Excel, consulenti e riunioni prima\ndi avere un modello affidabile."
      },
      {
        icon: FaExclamationTriangle,
        iconColor: "#EF4444",
        bgColor: "FEF2F2",
        borderColor: "EF4444",
        stat: "72%",
        label: "degli investitori rifiuta\npiani non strutturati",
        desc: "Senza proiezioni coerenti su ricavi,\ncosti e cash flow, il pitch si ferma\nalla prima domanda."
      },
      {
        icon: FaFileInvoiceDollar,
        iconColor: "#8B5CF6",
        bgColor: "F5F3FF",
        borderColor: "8B5CF6",
        stat: "€3.000–€8.000",
        label: "costo medio di un\nCFO freelance",
        desc: "Per startup early-stage o PMI con budget\nlimitato, esternalizzare la pianificazione\nfinanziaria è spesso insostenibile."
      }
    ];

    for (let i = 0; i < problems.length; i++) {
      const p = problems[i];
      const x = 0.35 + i * 3.1;

      // Card
      s.addShape(pres.shapes.RECTANGLE, {
        x, y: 1.7, w: 2.9, h: 3.55,
        fill: { color: p.bgColor },
        line: { color: p.borderColor, width: 1.5 },
        shadow: makeShadow()
      });
      // Top accent
      s.addShape(pres.shapes.RECTANGLE, {
        x, y: 1.7, w: 2.9, h: 0.08,
        fill: { color: p.borderColor }, line: { color: p.borderColor, width: 0 }
      });

      // Icon
      const iconData = await iconPng(p.icon, "#" + p.borderColor, 256);
      s.addImage({ data: iconData, x: x + 0.15, y: 1.88, w: 0.5, h: 0.5 });

      // Stat
      s.addText(p.stat, {
        x, y: 2.48, w: 2.9, h: 0.7,
        fontSize: 30, bold: true, color: p.borderColor,
        fontFace: "Arial Black", align: "center", margin: 0
      });
      // Label
      s.addText(p.label, {
        x, y: 3.18, w: 2.9, h: 0.7,
        fontSize: 12, bold: true, color: C.textDark,
        fontFace: "Calibri", align: "center", margin: 0
      });
      // Description
      s.addText(p.desc, {
        x: x + 0.1, y: 3.88, w: 2.7, h: 1.2,
        fontSize: 10.5, color: C.slate, fontFace: "Calibri",
        align: "left", valign: "top", margin: 0
      });
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // SLIDE 3 – LA SOLUZIONE
  // ══════════════════════════════════════════════════════════════════════════
  {
    const s = pres.addSlide();
    s.background = { color: C.navy };

    // Background accent circle
    s.addShape(pres.shapes.OVAL, {
      x: 6.5, y: -0.5, w: 5, h: 5,
      fill: { color: C.teal, transparency: 90 }, line: { color: C.teal, transparency: 90, width: 0 }
    });

    // Title
    s.addText("La Soluzione: AirPlan", {
      x: 0.5, y: 0.3, w: 9, h: 0.75,
      fontSize: 36, bold: true, color: C.white, fontFace: "Arial Black", margin: 0
    });
    s.addText("Dal caos al piano investibile in 3 passi semplici.", {
      x: 0.5, y: 1.0, w: 9, h: 0.4,
      fontSize: 16, color: C.teal, fontFace: "Calibri", italic: true, margin: 0
    });

    // 3 steps
    const steps = [
      {
        num: "1",
        icon: FaCog,
        title: "Wizard Guidato",
        body: "Inserisci i dati della tua azienda in 6 step intuitivi:\nprodotti, team, costi fissi, variabili e finanziamenti.\nNessuna competenza finanziaria richiesta.",
        color: C.teal
      },
      {
        num: "2",
        icon: FaChartLine,
        title: "Proiezioni Automatiche",
        body: "AirPlan calcola in tempo reale\nricavi, EBITDA, utile netto e cash flow\nper i prossimi 3 anni.",
        color: C.emerald
      },
      {
        num: "3",
        icon: FaBrain,
        title: "AI Copilot & Report",
        body: "Simula scenari what-if con l'AI:\n\"Cosa succede se alzo il prezzo a 59€?\"\nEsporta il report professionale per gli investitori.",
        color: C.amber
      }
    ];

    for (let i = 0; i < steps.length; i++) {
      const st = steps[i];
      const y = 1.6 + i * 1.25;

      // Number circle
      s.addShape(pres.shapes.OVAL, {
        x: 0.5, y: y, w: 0.55, h: 0.55,
        fill: { color: st.color }, line: { color: st.color, width: 0 }
      });
      s.addText(st.num, {
        x: 0.5, y: y, w: 0.55, h: 0.55,
        fontSize: 18, bold: true, color: C.white,
        fontFace: "Arial Black", align: "center", valign: "middle", margin: 0
      });

      // Connector line (except last)
      if (i < 2) {
        s.addShape(pres.shapes.LINE, {
          x: 0.765, y: y + 0.56, w: 0, h: 0.69,
          line: { color: st.color, width: 1.5, dashType: "dot", transparency: 50 }
        });
      }

      // Icon
      const iconData = await iconPng(st.icon, "#" + st.color, 256);
      s.addImage({ data: iconData, x: 1.25, y: y + 0.04, w: 0.45, h: 0.45 });

      // Title
      s.addText(st.title, {
        x: 1.85, y: y, w: 3.5, h: 0.35,
        fontSize: 17, bold: true, color: st.color,
        fontFace: "Calibri", margin: 0
      });
      // Body
      s.addText(st.body, {
        x: 1.85, y: y + 0.33, w: 7.7, h: 0.85,
        fontSize: 12.5, color: "B0C4D8", fontFace: "Calibri", margin: 0
      });
    }

    // Time callout box
    s.addShape(pres.shapes.RECTANGLE, {
      x: 6.6, y: 4.55, w: 3.0, h: 0.8,
      fill: { color: C.teal, transparency: 80 },
      line: { color: C.teal, width: 1 },
      shadow: makeShadow()
    });
    s.addText("⏱  Meno di 10 minuti\ndal foglio bianco al piano completo", {
      x: 6.6, y: 4.55, w: 3.0, h: 0.8,
      fontSize: 11, bold: true, color: C.white,
      fontFace: "Calibri", align: "center", valign: "middle", margin: 4
    });
  }

  // ══════════════════════════════════════════════════════════════════════════
  // SLIDE 4 – FUNZIONALITÀ PRINCIPALI
  // ══════════════════════════════════════════════════════════════════════════
  {
    const s = pres.addSlide();
    s.background = { color: C.offWhite };

    s.addText("Funzionalità Principali", {
      x: 0.5, y: 0.3, w: 9, h: 0.65,
      fontSize: 34, bold: true, color: C.textDark, fontFace: "Arial Black", margin: 0
    });
    s.addText("Tutto ciò che serve per pianificare, analizzare e condividere.", {
      x: 0.5, y: 0.9, w: 9, h: 0.38,
      fontSize: 14, color: C.slate, fontFace: "Calibri", margin: 0
    });

    const features = [
      { icon: FaClipboardList, color: "0EA5E9", title: "Wizard Finanziario", desc: "6 step guidati per inserire ricavi, team, costi e finanziamenti. Nessun Excel richiesto." },
      { icon: FaChartLine,     color: "10B981", title: "Dashboard Cruscotto", desc: "KPI in tempo reale: fatturato, EBITDA, utile netto, cash runway. Conto economico triennale editabile." },
      { icon: FaBrain,         color: "8B5CF6", title: "AI Copilot – What-If", desc: "Simula scenari: prezzi, team, mercati. L'AI risponde in linguaggio naturale con impatto su EBITDA e runway." },
      { icon: FaFileInvoiceDollar, color: "F59E0B", title: "Report Investitori", desc: "Esporta un PDF professionale con proiezioni triennali, KPI e cash flow pronto per il pitch." },
      { icon: FaUsers,         color: "EF4444", title: "Co-Work & Condivisione", desc: "Invita advisor, co-founder o investitori con ruoli Editor/Reader. Link condivisibili con scadenza." },
      { icon: FaLightbulb,     color: "06B6D4", title: "Scenari Predefiniti", desc: "Variazione prezzi, espansione team, riduzione costi, nuovo mercato: 4 template pronti all'uso." },
    ];

    // 2 columns × 3 rows
    for (let i = 0; i < features.length; i++) {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const x = 0.35 + col * 4.85;
      const y = 1.5 + row * 1.32;
      const f = features[i];

      s.addShape(pres.shapes.RECTANGLE, {
        x, y, w: 4.6, h: 1.15,
        fill: { color: C.card },
        line: { color: "E2E8F0", width: 1 },
        shadow: makeShadow()
      });
      // Left color accent
      s.addShape(pres.shapes.RECTANGLE, {
        x, y, w: 0.06, h: 1.15,
        fill: { color: f.color }, line: { color: f.color, width: 0 }
      });

      // Icon circle
      s.addShape(pres.shapes.OVAL, {
        x: x + 0.18, y: y + 0.28, w: 0.55, h: 0.55,
        fill: { color: f.color, transparency: 85 }, line: { color: f.color, transparency: 60, width: 1 }
      });
      const iconData = await iconPng(f.icon, "#" + f.color, 256);
      s.addImage({ data: iconData, x: x + 0.27, y: y + 0.37, w: 0.37, h: 0.37 });

      // Title
      s.addText(f.title, {
        x: x + 0.87, y: y + 0.08, w: 3.6, h: 0.35,
        fontSize: 14, bold: true, color: C.textDark,
        fontFace: "Calibri", margin: 0
      });
      // Description
      s.addText(f.desc, {
        x: x + 0.87, y: y + 0.43, w: 3.6, h: 0.65,
        fontSize: 10.5, color: C.slate, fontFace: "Calibri", margin: 0
      });
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // SLIDE 5 – I NUMERI CHE CONTANO
  // ══════════════════════════════════════════════════════════════════════════
  {
    const s = pres.addSlide();
    s.background = { color: C.navy };

    // Accent circle
    s.addShape(pres.shapes.OVAL, {
      x: -1, y: 3.5, w: 4, h: 4,
      fill: { color: C.emerald, transparency: 90 }, line: { color: C.emerald, transparency: 90, width: 0 }
    });

    s.addText("I Numeri che Contano", {
      x: 0.5, y: 0.3, w: 9, h: 0.65,
      fontSize: 36, bold: true, color: C.white, fontFace: "Arial Black", margin: 0
    });
    s.addText("Un piano realistico generato con AirPlan – dati del piano base incluso.", {
      x: 0.5, y: 0.95, w: 9, h: 0.38,
      fontSize: 14, color: "A0B4CC", fontFace: "Calibri", italic: true, margin: 0
    });

    // Big KPI cards row 1
    const kpis = [
      { val: "€485K",  label: "Fatturato Anno 1",   sub: "Base plan – prodotti e servizi",   color: C.teal },
      { val: "€1.09M", label: "Fatturato Anno 3",    sub: "+125% crescita triennale",          color: C.emerald },
      { val: "€97K",   label: "EBITDA Anno 1",       sub: "Margine operativo lordo",           color: C.amber },
      { val: "14 mesi",label: "Cash Runway",          sub: "Mesi di sostenibilità garantiti",  color: "A78BFA" },
    ];

    for (let i = 0; i < kpis.length; i++) {
      const k = kpis[i];
      const x = 0.35 + i * 2.35;
      s.addShape(pres.shapes.RECTANGLE, {
        x, y: 1.55, w: 2.2, h: 1.8,
        fill: { color: C.navyMid },
        line: { color: k.color, width: 1.5 },
        shadow: makeShadow()
      });
      s.addShape(pres.shapes.RECTANGLE, {
        x, y: 1.55, w: 2.2, h: 0.06,
        fill: { color: k.color }, line: { color: k.color, width: 0 }
      });
      s.addText(k.val, {
        x, y: 1.72, w: 2.2, h: 0.7,
        fontSize: 28, bold: true, color: k.color,
        fontFace: "Arial Black", align: "center", margin: 0
      });
      s.addText(k.label, {
        x, y: 2.42, w: 2.2, h: 0.38,
        fontSize: 12, bold: true, color: C.white,
        fontFace: "Calibri", align: "center", margin: 0
      });
      s.addText(k.sub, {
        x, y: 2.78, w: 2.2, h: 0.45,
        fontSize: 10, color: C.slate,
        fontFace: "Calibri", align: "center", margin: 0
      });
    }

    // Chart: Revenue Growth bar chart
    s.addChart(pres.charts.BAR, [{
      name: "Fatturato",
      labels: ["Anno 1", "Anno 2", "Anno 3"],
      values: [485000, 728000, 1092000]
    }], {
      x: 0.35, y: 3.5, w: 5.5, h: 1.85,
      barDir: "col",
      chartColors: [C.teal, C.teal, C.emerald],
      chartArea: { fill: { color: C.navyMid } },
      catAxisLabelColor: "A0B4CC",
      valAxisLabelColor: "A0B4CC",
      valAxisNumFmt: '€#,##0',
      valGridLine: { color: "2A4A7F", size: 0.5 },
      catGridLine: { style: "none" },
      showValue: true,
      dataLabelColor: C.white,
      showLegend: false,
      showTitle: true,
      title: "Proiezione Fatturato 3 Anni",
      titleColor: "A0B4CC",
      titleFontSize: 12,
    });

    // Impact box AI
    s.addShape(pres.shapes.RECTANGLE, {
      x: 6.0, y: 3.5, w: 3.65, h: 1.85,
      fill: { color: C.navyMid },
      line: { color: C.emerald, width: 1.5 },
      shadow: makeShadow()
    });
    s.addText("Impatto AI Copilot", {
      x: 6.0, y: 3.55, w: 3.65, h: 0.35,
      fontSize: 13, bold: true, color: C.emerald,
      fontFace: "Calibri", align: "center", margin: 0
    });

    const aiImpacts = [
      { label: "Ricavi", delta: "+18%", color: C.teal },
      { label: "EBITDA", delta: "+15%", color: C.emerald },
      { label: "Utile Netto", delta: "+22%", color: C.amber },
      { label: "Cash Runway", delta: "+4 mesi", color: "A78BFA" },
    ];
    for (let i = 0; i < aiImpacts.length; i++) {
      const a = aiImpacts[i];
      const yy = 4.0 + i * 0.32;
      s.addText(a.label, {
        x: 6.1, y: yy, w: 2.2, h: 0.28,
        fontSize: 11, color: "A0B4CC", fontFace: "Calibri", margin: 0
      });
      s.addText(a.delta, {
        x: 8.3, y: yy, w: 1.2, h: 0.28,
        fontSize: 12, bold: true, color: a.color,
        fontFace: "Calibri", align: "right", margin: 0
      });
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // SLIDE 6 – PIANI REALI: CLIENTI CHE USANO AIRPLAN
  // ══════════════════════════════════════════════════════════════════════════
  {
    const s = pres.addSlide();
    s.background = { color: C.offWhite };

    s.addText("Piani Reali, Risultati Reali", {
      x: 0.5, y: 0.3, w: 9, h: 0.65,
      fontSize: 34, bold: true, color: C.textDark, fontFace: "Arial Black", margin: 0
    });
    s.addText("Tre scenari differenti, tutti generati con AirPlan in pochi minuti.", {
      x: 0.5, y: 0.9, w: 9, h: 0.38,
      fontSize: 14, color: C.slate, fontFace: "Calibri", margin: 0
    });

    const plans = [
      {
        name: "TechHub Pro",
        category: "SaaS / Tech Startup",
        color: "0EA5E9",
        status: "Sostenibile",
        statusColor: "10B981",
        revenue: "€892K",
        ebitda: "€267K",
        netIncome: "€198K",
        runway: "22 mesi",
        desc: "Startup tecnologica B2B con\nmodello SaaS. Piano da 3 anni\npronto per round seed."
      },
      {
        name: "FoodieApp",
        category: "Food & Delivery",
        color: "F59E0B",
        status: "Sostenibile",
        statusColor: "10B981",
        revenue: "€320K",
        ebitda: "€45K",
        netIncome: "€22K",
        runway: "9 mesi",
        desc: "App di delivery food in fase\ndi lancio locale. Modello\nfreemium con commissioni."
      },
      {
        name: "EcoStore",
        category: "E-commerce Green",
        color: "10B981",
        status: "Richiede Ottimizzazione",
        statusColor: "EF4444",
        revenue: "€156K",
        ebitda: "–€28K",
        netIncome: "–€42K",
        runway: "6 mesi",
        desc: "E-commerce sostenibile\nin early stage. AirPlan ha\nidentificato la criticità sui costi."
      }
    ];

    for (let i = 0; i < plans.length; i++) {
      const p = plans[i];
      const x = 0.35 + i * 3.1;

      s.addShape(pres.shapes.RECTANGLE, {
        x, y: 1.5, w: 2.9, h: 3.8,
        fill: { color: C.card },
        line: { color: "E2E8F0", width: 1 },
        shadow: makeShadow()
      });
      // Top color band
      s.addShape(pres.shapes.RECTANGLE, {
        x, y: 1.5, w: 2.9, h: 0.55,
        fill: { color: p.color }, line: { color: p.color, width: 0 }
      });

      // Plan name
      s.addText(p.name, {
        x: x + 0.12, y: 1.56, w: 2.66, h: 0.42,
        fontSize: 17, bold: true, color: C.white,
        fontFace: "Arial Black", margin: 0
      });

      // Category
      s.addText(p.category, {
        x: x + 0.12, y: 2.1, w: 2.66, h: 0.3,
        fontSize: 11, color: C.slate, fontFace: "Calibri",
        italic: true, margin: 0
      });

      // Description
      s.addText(p.desc, {
        x: x + 0.12, y: 2.38, w: 2.66, h: 0.75,
        fontSize: 10.5, color: C.slate, fontFace: "Calibri", margin: 0
      });

      // KPIs
      const kpiRows = [
        { label: "Fatturato Y1", val: p.revenue },
        { label: "EBITDA Y1",    val: p.ebitda   },
        { label: "Utile Netto",  val: p.netIncome },
        { label: "Cash Runway",  val: p.runway   },
      ];
      for (let k = 0; k < kpiRows.length; k++) {
        const ky = 3.2 + k * 0.36;
        s.addText(kpiRows[k].label, {
          x: x + 0.12, y: ky, w: 1.6, h: 0.3,
          fontSize: 10.5, color: C.slate, fontFace: "Calibri", margin: 0
        });
        s.addText(kpiRows[k].val, {
          x: x + 1.7, y: ky, w: 1.08, h: 0.3,
          fontSize: 11, bold: true, color: C.textDark,
          fontFace: "Calibri", align: "right", margin: 0
        });
      }

      // Status badge
      s.addShape(pres.shapes.RECTANGLE, {
        x: x + 0.12, y: 4.92, w: 2.66, h: 0.28,
        fill: { color: p.statusColor, transparency: 85 },
        line: { color: p.statusColor, width: 1 }
      });
      s.addText(p.status, {
        x: x + 0.12, y: 4.92, w: 2.66, h: 0.28,
        fontSize: 10, bold: true, color: p.statusColor,
        fontFace: "Calibri", align: "center", valign: "middle", margin: 0
      });
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // SLIDE 7 – CALL TO ACTION
  // ══════════════════════════════════════════════════════════════════════════
  {
    const s = pres.addSlide();
    s.background = { color: C.navy };

    // Large accent circle
    s.addShape(pres.shapes.OVAL, {
      x: 5.5, y: -0.8, w: 6, h: 6,
      fill: { color: C.teal, transparency: 88 }, line: { color: C.teal, transparency: 88, width: 0 }
    });
    s.addShape(pres.shapes.OVAL, {
      x: -2, y: 2.5, w: 5, h: 5,
      fill: { color: C.emerald, transparency: 90 }, line: { color: C.emerald, transparency: 90, width: 0 }
    });

    // Title
    s.addText("Inizia Oggi.", {
      x: 0.5, y: 0.55, w: 9, h: 1.0,
      fontSize: 58, bold: true, color: C.white,
      fontFace: "Arial Black", margin: 0
    });
    s.addText("Il tuo piano finanziario è a 10 minuti di distanza.", {
      x: 0.5, y: 1.55, w: 8, h: 0.5,
      fontSize: 20, color: C.teal, fontFace: "Calibri",
      italic: true, margin: 0
    });

    // 3 CTA bullets
    const bullets = [
      { text: "Piano Starter gratuito per iniziare subito", color: C.teal },
      { text: "Nessuna competenza finanziaria richiesta", color: C.emerald },
      { text: "Report PDF pronto per investitori e banche", color: C.amber },
    ];
    for (let i = 0; i < bullets.length; i++) {
      const b = bullets[i];
      const y = 2.3 + i * 0.55;

      // Check icon circle
      s.addShape(pres.shapes.OVAL, {
        x: 0.5, y: y + 0.04, w: 0.38, h: 0.38,
        fill: { color: b.color, transparency: 75 }, line: { color: b.color, width: 0 }
      });
      const checkIcon = await iconPng(FaCheckCircle, "#" + b.color, 256);
      s.addImage({ data: checkIcon, x: 0.53, y: y + 0.07, w: 0.32, h: 0.32 });

      s.addText(b.text, {
        x: 1.05, y: y, w: 7.5, h: 0.42,
        fontSize: 16, color: C.white, fontFace: "Calibri", margin: 0
      });
    }

    // Main CTA button
    s.addShape(pres.shapes.RECTANGLE, {
      x: 0.5, y: 4.0, w: 3.5, h: 0.75,
      fill: { color: C.teal }, line: { color: C.teal, width: 0 },
      shadow: makeShadow()
    });
    s.addText("Crea il tuo Business Plan →", {
      x: 0.5, y: 4.0, w: 3.5, h: 0.75,
      fontSize: 16, bold: true, color: C.white,
      fontFace: "Calibri", align: "center", valign: "middle", margin: 0
    });

    // Secondary CTA
    s.addShape(pres.shapes.RECTANGLE, {
      x: 4.2, y: 4.0, w: 2.8, h: 0.75,
      fill: { color: C.navy, transparency: 0 },
      line: { color: C.white, width: 1.5 },
    });
    s.addText("Richiedi una Demo", {
      x: 4.2, y: 4.0, w: 2.8, h: 0.75,
      fontSize: 15, bold: false, color: C.white,
      fontFace: "Calibri", align: "center", valign: "middle", margin: 0
    });

    // Contact
    s.addText("airplan.io  ·  antonio.darrigoct@gmail.com  ·  @AirPlan", {
      x: 0.5, y: 5.05, w: 9, h: 0.35,
      fontSize: 11, color: C.slate, fontFace: "Calibri",
      align: "center", margin: 0
    });
  }

  await pres.writeFile({ fileName: "pitch_clienti.pptx" });
  console.log("✅  pitch_clienti.pptx generato con successo!");
}

build().catch(err => { console.error("❌ Errore:", err); process.exit(1); });
