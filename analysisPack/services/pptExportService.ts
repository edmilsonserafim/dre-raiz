import pptxgen from "pptxgenjs";
import type { AnalysisPack } from "../../types";

/**
 * buildPpt - Gera arquivo PowerPoint com identidade visual do DRE RAIZ
 *
 * @param args.pack - AnalysisPack com slides e blocos
 * @param args.chartImages - Mapa de chartId -> dataURL (PNG base64)
 * @param args.fileName - Nome do arquivo (opcional)
 *
 * Cores do tema:
 * - Azul primário: #1B75BB
 * - Laranja destaque: #F44C00
 * - Verde água: #7AC5BF
 * - Cinza escuro: #1F2937
 * - Cinza médio: #6B7280
 * - Cinza claro: #F3F4F6
 */

// ========================================
// Paleta de Cores (mesmo do site)
// ========================================
const COLORS = {
  primary: "1B75BB",      // Azul
  accent: "F44C00",       // Laranja
  teal: "7AC5BF",         // Verde água
  dark: "1F2937",         // Cinza escuro (textos)
  medium: "6B7280",       // Cinza médio (subtítulos)
  light: "F3F4F6",        // Cinza claro (backgrounds)
  white: "FFFFFF",        // Branco
  success: "10B981",      // Verde (positivo)
  danger: "EF4444",       // Vermelho (negativo)
  warning: "F59E0B",      // Amarelo (atenção)
};

export async function buildPpt(args: {
  pack: AnalysisPack;
  chartImages: Record<string, string>;
  fileName?: string;
}) {
  const pptx = new pptxgen();
  pptx.layout = "LAYOUT_WIDE"; // 13.33 x 7.5 inches
  pptx.author = "DRE RAIZ - Sistema de Análise Financeira";
  pptx.title = args.pack.meta.org_name;
  pptx.subject = `Análise Financeira - ${args.pack.meta.period_label}`;

  // ========================================
  // SLIDE 1: CAPA
  // ========================================
  addCoverSlide(pptx, args.pack);

  // ========================================
  // SLIDE 2: SUMÁRIO EXECUTIVO
  // ========================================
  if (args.pack.executive_summary) {
    addExecutiveSummarySlide(pptx, args.pack);
  }

  // ========================================
  // SLIDES DE CONTEÚDO
  // ========================================
  for (let i = 0; i < args.pack.slides.length; i++) {
    const slideDef = args.pack.slides[i];
    const slideNumber = i + 3; // Capa + Sumário + conteúdo
    addContentSlide(pptx, slideDef, args.chartImages, slideNumber, args.pack);
  }

  // ========================================
  // ÚLTIMO SLIDE: PLANO DE AÇÃO
  // ========================================
  if (args.pack.actions && args.pack.actions.length > 0) {
    addActionsSlide(pptx, args.pack);
  }

  // Download
  await pptx.writeFile({ fileName: args.fileName ?? "Analise-Financeira-RAIZ.pptx" });
}

// ========================================
// SLIDE DE CAPA
// ========================================
function addCoverSlide(pptx: pptxgen, pack: AnalysisPack) {
  const slide = pptx.addSlide();

  // Background degradê (azul para laranja)
  slide.background = { color: COLORS.primary };

  // Barra laranja no topo
  slide.addShape(pptx.ShapeType.rect, {
    x: 0, y: 0, w: 13.33, h: 0.4,
    fill: { color: COLORS.accent }
  });

  // Barra verde água no rodapé
  slide.addShape(pptx.ShapeType.rect, {
    x: 0, y: 7.1, w: 13.33, h: 0.4,
    fill: { color: COLORS.teal }
  });

  // Título principal (branco, bold, grande)
  slide.addText("📊 Análise Financeira", {
    x: 1, y: 2.0, w: 11.33, h: 1.0,
    fontSize: 60,
    bold: true,
    color: COLORS.white,
    align: "center",
    fontFace: "Arial"
  });

  // Organização
  slide.addText(pack.meta.org_name, {
    x: 1, y: 3.2, w: 11.33, h: 0.6,
    fontSize: 32,
    color: COLORS.white,
    align: "center",
    fontFace: "Arial"
  });

  // Período
  slide.addText(pack.meta.period_label, {
    x: 1, y: 4.0, w: 11.33, h: 0.5,
    fontSize: 24,
    color: COLORS.light,
    align: "center",
    fontFace: "Arial"
  });

  // Escopo
  slide.addText(pack.meta.scope_label, {
    x: 1, y: 4.6, w: 11.33, h: 0.4,
    fontSize: 18,
    color: COLORS.light,
    align: "center",
    fontFace: "Arial"
  });

  // Data de geração
  const date = new Date(pack.meta.generated_at_iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
  slide.addText(`Gerado em ${date}`, {
    x: 1, y: 6.2, w: 11.33, h: 0.3,
    fontSize: 12,
    color: COLORS.light,
    align: "center",
    fontFace: "Arial",
    italic: true
  });

  // Powered by
  slide.addText("Powered by IA • DRE RAIZ", {
    x: 1, y: 6.6, w: 11.33, h: 0.3,
    fontSize: 10,
    color: COLORS.light,
    align: "center",
    fontFace: "Arial"
  });
}

// ========================================
// SLIDE DE SUMÁRIO EXECUTIVO
// ========================================
function addExecutiveSummarySlide(pptx: pptxgen, pack: AnalysisPack) {
  const slide = pptx.addSlide();

  // Header com barra azul
  addSlideHeader(slide, "Sumário Executivo", "Principais destaques do período", 2);

  const summary = pack.executive_summary;
  let cursorY = 1.5;

  // Headline (destaque laranja)
  slide.addShape(pptx.ShapeType.rect, {
    x: 0.5, y: cursorY, w: 12.33, h: 0.8,
    fill: { color: COLORS.light }
  });

  slide.addText("📌 " + summary.headline, {
    x: 0.7, y: cursorY + 0.1, w: 11.9, h: 0.6,
    fontSize: 16,
    bold: true,
    color: COLORS.accent,
    fontFace: "Arial"
  });
  cursorY += 1.0;

  // Destaques positivos
  if (summary.bullets && summary.bullets.length > 0) {
    slide.addText("✅ Destaques Positivos", {
      x: 0.7, y: cursorY, w: 5.5, h: 0.4,
      fontSize: 14,
      bold: true,
      color: COLORS.success,
      fontFace: "Arial"
    });
    cursorY += 0.5;

    const bullets = summary.bullets.slice(0, 3).map(b => `• ${b}`).join("\n");
    slide.addText(bullets, {
      x: 0.7, y: cursorY, w: 5.5, h: 1.5,
      fontSize: 11,
      color: COLORS.dark,
      fontFace: "Arial",
      valign: "top"
    });
  }

  // Riscos (coluna direita)
  cursorY = 2.5;
  if (summary.risks && summary.risks.length > 0) {
    slide.addText("⚠️ Riscos e Atenções", {
      x: 6.8, y: cursorY, w: 5.5, h: 0.4,
      fontSize: 14,
      bold: true,
      color: COLORS.danger,
      fontFace: "Arial"
    });
    cursorY += 0.5;

    const risks = summary.risks.slice(0, 3).map(r => `• ${r}`).join("\n");
    slide.addText(risks, {
      x: 6.8, y: cursorY, w: 5.5, h: 1.5,
      fontSize: 11,
      color: COLORS.dark,
      fontFace: "Arial",
      valign: "top"
    });
  }

  // Oportunidades (parte inferior)
  cursorY = 4.6;
  if (summary.opportunities && summary.opportunities.length > 0) {
    slide.addText("💡 Oportunidades", {
      x: 0.7, y: cursorY, w: 11.9, h: 0.4,
      fontSize: 14,
      bold: true,
      color: COLORS.primary,
      fontFace: "Arial"
    });
    cursorY += 0.5;

    const opps = summary.opportunities.slice(0, 3).map(o => `• ${o}`).join("\n");
    slide.addText(opps, {
      x: 0.7, y: cursorY, w: 11.9, h: 1.2,
      fontSize: 11,
      color: COLORS.dark,
      fontFace: "Arial",
      valign: "top"
    });
  }

  // Footer
  addSlideFooter(slide, pack);
}

// ========================================
// SLIDE DE CONTEÚDO
// ========================================
function addContentSlide(
  pptx: pptxgen,
  slideDef: any,
  chartImages: Record<string, string>,
  slideNumber: number,
  pack: AnalysisPack
) {
  const slide = pptx.addSlide();

  // Header
  addSlideHeader(slide, slideDef.title, slideDef.subtitle, slideNumber);

  let cursorY = 1.5;

  for (const block of slideDef.blocks) {
    // TEXT BLOCK
    if (block.type === "text") {
      if (block.title) {
        slide.addText(block.title, {
          x: 0.7, y: cursorY, w: 11.9, h: 0.3,
          fontSize: 14,
          bold: true,
          color: COLORS.primary,
          fontFace: "Arial"
        });
        cursorY += 0.4;
      }

      const bullets = block.bullets.map((b: string) => `• ${b}`).join("\n");
      slide.addText(bullets, {
        x: 0.9, y: cursorY, w: 11.7, h: 1.0,
        fontSize: 11,
        color: COLORS.dark,
        fontFace: "Arial"
      });
      cursorY += 1.2;
    }

    // CALLOUT BLOCK
    else if (block.type === "callout") {
      const intent = block.intent || "neutral";
      let bgColor = COLORS.light;
      let iconColor = COLORS.medium;
      let icon = "ℹ️";

      if (intent === "positive") {
        bgColor = "D1FAE5"; // verde claro
        iconColor = COLORS.success;
        icon = "✅";
      } else if (intent === "negative") {
        bgColor = "FEE2E2"; // vermelho claro
        iconColor = COLORS.danger;
        icon = "⚠️";
      } else if (intent === "neutral") {
        bgColor = "DBEAFE"; // azul claro
        iconColor = COLORS.primary;
        icon = "💡";
      }

      // Box com fundo colorido
      slide.addShape(pptx.ShapeType.rect, {
        x: 0.7, y: cursorY, w: 11.9, h: 1.0,
        fill: { color: bgColor },
        line: { color: iconColor, width: 2 }
      });

      // Título do callout
      slide.addText(`${icon} ${block.title}`, {
        x: 0.9, y: cursorY + 0.1, w: 11.5, h: 0.3,
        fontSize: 12,
        bold: true,
        color: iconColor,
        fontFace: "Arial"
      });

      // Bullets do callout
      const bullets = block.bullets.map((b: string) => `• ${b}`).join("\n");
      slide.addText(bullets, {
        x: 0.9, y: cursorY + 0.45, w: 11.5, h: 0.5,
        fontSize: 10,
        color: COLORS.dark,
        fontFace: "Arial"
      });

      cursorY += 1.2;
    }

    // CHART BLOCK
    else if (block.type === "chart") {
      const img = chartImages[block.chart_id];
      if (img) {
        const h = block.height === "lg" ? 4.0 : block.height === "md" ? 3.0 : 2.2;

        // Borda ao redor do gráfico
        slide.addShape(pptx.ShapeType.rect, {
          x: 0.6, y: cursorY - 0.05, w: 12.1, h: h + 0.1,
          fill: { color: COLORS.white },
          line: { color: COLORS.light, width: 2 }
        });

        slide.addImage({
          data: img,
          x: 0.7, y: cursorY, w: 11.9, h: h
        });

        // Nota do gráfico (se houver)
        if (block.note) {
          slide.addText(block.note, {
            x: 0.7, y: cursorY + h + 0.05, w: 11.9, h: 0.3,
            fontSize: 9,
            color: COLORS.medium,
            fontFace: "Arial",
            italic: true
          });
          cursorY += h + 0.4;
        } else {
          cursorY += h + 0.2;
        }
      }
    }

    // KPI GRID BLOCK
    else if (block.type === "kpi_grid") {
      if (block.title) {
        slide.addText(block.title, {
          x: 0.7, y: cursorY, w: 11.9, h: 0.3,
          fontSize: 14,
          bold: true,
          color: COLORS.primary,
          fontFace: "Arial"
        });
        cursorY += 0.4;
      }

      slide.addText("📊 KPIs principais exibidos no dashboard", {
        x: 0.9, y: cursorY, w: 11.7, h: 0.4,
        fontSize: 11,
        color: COLORS.medium,
        fontFace: "Arial",
        italic: true
      });
      cursorY += 0.6;
    }

    // TABLE BLOCK
    else if (block.type === "table") {
      if (block.title) {
        slide.addText(block.title, {
          x: 0.7, y: cursorY, w: 11.9, h: 0.3,
          fontSize: 14,
          bold: true,
          color: COLORS.primary,
          fontFace: "Arial"
        });
        cursorY += 0.4;
      }

      slide.addText("📋 Tabela de dados disponível no sistema", {
        x: 0.9, y: cursorY, w: 11.7, h: 0.4,
        fontSize: 11,
        color: COLORS.medium,
        fontFace: "Arial",
        italic: true
      });
      cursorY += 0.6;
    }
  }

  // Footer
  addSlideFooter(slide, pack);
}

// ========================================
// SLIDE DE AÇÕES
// ========================================
function addActionsSlide(pptx: pptxgen, pack: AnalysisPack) {
  const slide = pptx.addSlide();

  // Header
  addSlideHeader(slide, "Plano de Ação", "Próximos passos recomendados", 99);

  let cursorY = 1.5;

  for (let i = 0; i < Math.min(pack.actions.length, 5); i++) {
    const action = pack.actions[i];

    // Box da ação
    slide.addShape(pptx.ShapeType.rect, {
      x: 0.5, y: cursorY, w: 12.33, h: 0.9,
      fill: { color: i % 2 === 0 ? COLORS.light : COLORS.white },
      line: { color: COLORS.primary, width: 1 }
    });

    // Número da ação
    slide.addText(`${i + 1}`, {
      x: 0.7, y: cursorY + 0.15, w: 0.5, h: 0.6,
      fontSize: 20,
      bold: true,
      color: COLORS.primary,
      fontFace: "Arial",
      align: "center"
    });

    // Ação
    slide.addText(action.action, {
      x: 1.4, y: cursorY + 0.1, w: 7.0, h: 0.35,
      fontSize: 11,
      bold: true,
      color: COLORS.dark,
      fontFace: "Arial"
    });

    // Responsável e prazo
    slide.addText(`👤 ${action.owner}  •  📅 ${action.eta}`, {
      x: 1.4, y: cursorY + 0.5, w: 7.0, h: 0.3,
      fontSize: 9,
      color: COLORS.medium,
      fontFace: "Arial"
    });

    // Impacto esperado
    slide.addText(`💰 ${action.expected_impact}`, {
      x: 8.6, y: cursorY + 0.25, w: 3.8, h: 0.4,
      fontSize: 10,
      color: COLORS.accent,
      fontFace: "Arial",
      align: "right",
      bold: true
    });

    cursorY += 1.05;
  }

  // Footer
  addSlideFooter(slide, pack);
}

// ========================================
// HELPER: HEADER DO SLIDE
// ========================================
function addSlideHeader(slide: any, title: string, subtitle?: string, slideNumber?: number) {
  // Barra superior laranja
  slide.addShape(slide.ShapeType?.rect || "rect", {
    x: 0, y: 0, w: 13.33, h: 0.15,
    fill: { color: COLORS.accent }
  });

  // Barra azul abaixo
  slide.addShape(slide.ShapeType?.rect || "rect", {
    x: 0, y: 0.15, w: 13.33, h: 0.7,
    fill: { color: COLORS.primary }
  });

  // Título
  slide.addText(title, {
    x: 0.5, y: 0.25, w: 11.0, h: 0.5,
    fontSize: 24,
    bold: true,
    color: COLORS.white,
    fontFace: "Arial"
  });

  // Número do slide (canto direito)
  if (slideNumber) {
    slide.addText(`${slideNumber}`, {
      x: 12.0, y: 0.3, w: 0.8, h: 0.4,
      fontSize: 18,
      color: COLORS.white,
      fontFace: "Arial",
      align: "center"
    });
  }

  // Subtítulo (se houver)
  if (subtitle) {
    slide.addText(subtitle, {
      x: 0.7, y: 1.0, w: 11.9, h: 0.3,
      fontSize: 12,
      color: COLORS.medium,
      fontFace: "Arial",
      italic: true
    });
  }
}

// ========================================
// HELPER: FOOTER DO SLIDE
// ========================================
function addSlideFooter(slide: any, pack: AnalysisPack) {
  // Linha separadora
  slide.addShape(slide.ShapeType?.rect || "rect", {
    x: 0.5, y: 6.9, w: 12.33, h: 0.02,
    fill: { color: COLORS.light }
  });

  // Texto do footer
  const footerText = `${pack.meta.org_name} • ${pack.meta.period_label} • ${pack.meta.scope_label}`;
  slide.addText(footerText, {
    x: 0.5, y: 7.0, w: 10.0, h: 0.3,
    fontSize: 9,
    color: COLORS.medium,
    fontFace: "Arial"
  });

  // Logo/marca (direita)
  slide.addText("DRE RAIZ", {
    x: 11.5, y: 7.0, w: 1.5, h: 0.3,
    fontSize: 9,
    color: COLORS.primary,
    fontFace: "Arial",
    align: "right",
    bold: true
  });
}
