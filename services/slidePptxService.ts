/**
 * Serviço de Geração PPTX Completo
 * Suporta 12 layouts, 9 temas, KPI cards, timelines, comparisons, etc.
 * Baseado no guia técnico rAIz Platform
 */

import pptxgen from 'pptxgenjs';
import {
  SlideConfig,
  SlideTheme,
  PresentationOptions,
  ThemeName,
  SLIDE_THEMES,
  REGIONS,
  SLIDE_W,
  SLIDE_H,
  resolveTheme,
  enforceLayoutDiversity,
  sanitizeSlideConfig,
} from './slideTypes';

// ============================================
// MAIN EXPORT FUNCTION
// ============================================

export async function generatePresentation(
  slides: SlideConfig[],
  options: PresentationOptions = {}
): Promise<void> {
  const theme = resolveTheme(options.theme, options.customTheme);
  const processedSlides = enforceLayoutDiversity(slides.map(sanitizeSlideConfig));

  const pptx = new pptxgen();
  pptx.author = options.author || 'DRE RAIZ';
  pptx.company = 'Raiz Educação S.A.';
  pptx.title = options.title || 'Apresentação Executiva';
  pptx.subject = 'Gerado pelo Sistema DRE RAIZ';
  pptx.layout = 'LAYOUT_16x9';

  for (let i = 0; i < processedSlides.length; i++) {
    const slideConfig = processedSlides[i];
    const slide = pptx.addSlide();

    // Background
    slide.background = { color: getSlideBackground(slideConfig, theme) };

    // Render pelo tipo de layout
    renderSlide(pptx, slide, slideConfig, theme, i + 1, processedSlides.length);
  }

  const sanitizedTitle = (options.title || 'apresentacao')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 50);
  const filename = `${sanitizedTitle}-${Date.now()}.pptx`;

  await pptx.writeFile({ fileName: filename });
}

// ============================================
// BACKGROUND POR LAYOUT
// ============================================

function getSlideBackground(config: SlideConfig, theme: SlideTheme): string {
  switch (config.layout) {
    case 'title':
    case 'sectionDivider':
      return theme.colors.sectionBg;
    case 'quote':
      return theme.colors.quoteBg;
    default:
      return theme.colors.background;
  }
}

// ============================================
// RENDER DISPATCHER
// ============================================

function renderSlide(
  pptx: pptxgen,
  slide: pptxgen.Slide,
  config: SlideConfig,
  theme: SlideTheme,
  slideNum: number,
  totalSlides: number
) {
  switch (config.layout) {
    case 'title':
      renderTitleSlide(pptx, slide, config, theme);
      break;
    case 'bullets':
      renderBulletsSlide(pptx, slide, config, theme, slideNum, totalSlides);
      break;
    case 'titleContent':
      renderTitleContentSlide(pptx, slide, config, theme, slideNum, totalSlides);
      break;
    case 'twoColumn':
      renderTwoColumnSlide(pptx, slide, config, theme, slideNum, totalSlides);
      break;
    case 'chart':
      renderChartSlide(pptx, slide, config, theme, slideNum, totalSlides);
      break;
    case 'kpiCards':
      renderKpiCardsSlide(pptx, slide, config, theme, slideNum, totalSlides);
      break;
    case 'comparison':
      renderComparisonSlide(pptx, slide, config, theme, slideNum, totalSlides);
      break;
    case 'timeline':
      renderTimelineSlide(pptx, slide, config, theme, slideNum, totalSlides);
      break;
    case 'quote':
      renderQuoteSlide(pptx, slide, config, theme, slideNum, totalSlides);
      break;
    case 'sectionDivider':
      renderSectionDividerSlide(pptx, slide, config, theme);
      break;
    case 'imageContent':
      renderImageContentSlide(pptx, slide, config, theme, slideNum, totalSlides);
      break;
    case 'fullImage':
      renderFullImageSlide(pptx, slide, config, theme);
      break;
    default:
      renderBulletsSlide(pptx, slide, config, theme, slideNum, totalSlides);
  }
}

// ============================================
// SHARED ELEMENTS
// ============================================

function addHeader(
  pptx: pptxgen,
  slide: pptxgen.Slide,
  title: string,
  theme: SlideTheme
) {
  const r = REGIONS.header;

  // Accent line (barra fina colorida no topo)
  slide.addShape(pptx.ShapeType.rect, {
    x: r.accent.x,
    y: r.accent.y,
    w: r.accent.w,
    h: r.accent.h,
    fill: { color: theme.colors.primary },
  });

  // Title
  slide.addText(title, {
    x: r.title.x,
    y: r.title.y,
    w: r.title.w,
    h: r.title.h,
    fontSize: 22,
    bold: true,
    color: theme.colors.text,
    fontFace: theme.fonts.heading,
    align: 'left',
  });

  // Separator line
  slide.addShape(pptx.ShapeType.line, {
    x: r.line.x,
    y: r.line.y,
    w: r.line.w,
    h: 0,
    line: { color: theme.colors.divider, width: 1 },
  });
}

function addFooter(
  pptx: pptxgen,
  slide: pptxgen.Slide,
  slideNum: number,
  totalSlides: number,
  theme: SlideTheme
) {
  const r = REGIONS.footer;

  // Separator line
  slide.addShape(pptx.ShapeType.line, {
    x: r.line.x,
    y: r.line.y,
    w: r.line.w,
    h: 0,
    line: { color: theme.colors.divider, width: 0.5 },
  });

  // Footer text
  slide.addText('DRE RAIZ • Raiz Educação', {
    x: r.text.x,
    y: r.text.y,
    w: r.text.w,
    h: r.text.h,
    fontSize: 8,
    color: theme.colors.subtitle,
    fontFace: theme.fonts.body,
  });

  // Slide number
  slide.addText(`${slideNum}/${totalSlides}`, {
    x: r.slideNum.x,
    y: r.slideNum.y,
    w: r.slideNum.w,
    h: r.slideNum.h,
    fontSize: 8,
    color: theme.colors.subtitle,
    fontFace: theme.fonts.body,
    align: 'right',
  });
}

function addDisclaimer(
  slide: pptxgen.Slide,
  text: string,
  theme: SlideTheme
) {
  const r = REGIONS.disclaimer;
  slide.addText(text, {
    x: r.x,
    y: r.y,
    w: r.w,
    h: r.h,
    fontSize: 7,
    color: theme.colors.subtitle,
    fontFace: theme.fonts.body,
    italic: true,
    align: 'right',
  });
}

// ============================================
// LAYOUT 1: TITLE (Abertura)
// ============================================

function renderTitleSlide(
  pptx: pptxgen,
  slide: pptxgen.Slide,
  config: SlideConfig,
  theme: SlideTheme
) {
  const r = REGIONS.title;

  // Accent bar (vertical esquerda)
  slide.addShape(pptx.ShapeType.rect, {
    x: r.accentBar.x,
    y: r.accentBar.y,
    w: r.accentBar.w,
    h: r.accentBar.h,
    fill: { color: theme.colors.accent },
  });

  // Bottom bar
  slide.addShape(pptx.ShapeType.rect, {
    x: r.bottomBar.x,
    y: r.bottomBar.y,
    w: r.bottomBar.w,
    h: r.bottomBar.h,
    fill: { color: theme.colors.accent },
  });

  // Title
  slide.addText(config.title || '', {
    x: r.title.x,
    y: r.title.y,
    w: r.title.w,
    h: r.title.h,
    fontSize: 38,
    bold: true,
    color: theme.colors.background === '0F172A' ? 'FFFFFF' : 'FFFFFF',
    fontFace: theme.fonts.heading,
    align: 'left',
  });

  // Subtitle
  if (config.subtitle) {
    slide.addText(config.subtitle, {
      x: r.subtitle.x,
      y: r.subtitle.y,
      w: r.subtitle.w,
      h: r.subtitle.h,
      fontSize: 16,
      color: theme.colors.background === '0F172A' ? '94A3B8' : 'D1D5DB',
      fontFace: theme.fonts.body,
      align: 'left',
    });
  }

  // Date
  const dateStr = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
  slide.addText(dateStr, {
    x: r.subtitle.x,
    y: 4.5,
    w: r.subtitle.w,
    h: 0.4,
    fontSize: 11,
    color: 'D1D5DB',
    fontFace: theme.fonts.body,
    italic: true,
  });
}

// ============================================
// LAYOUT 2: BULLETS
// ============================================

function renderBulletsSlide(
  pptx: pptxgen,
  slide: pptxgen.Slide,
  config: SlideConfig,
  theme: SlideTheme,
  slideNum: number,
  totalSlides: number
) {
  addHeader(pptx, slide, config.title || '', theme);

  const r = REGIONS.bullets;

  // Accent bar vertical
  slide.addShape(pptx.ShapeType.rect, {
    x: r.accent.x,
    y: r.accent.y,
    w: r.accent.w,
    h: r.accent.h,
    fill: { color: theme.colors.primary },
  });

  // Bullets
  if (config.bullets && config.bullets.length > 0) {
    const textObjects = config.bullets.map((bullet, idx) => ({
      text: bullet,
      options: {
        fontSize: 15,
        color: theme.colors.text,
        fontFace: theme.fonts.body,
        bullet: { type: 'number' as const, startAt: idx + 1 },
        paraSpaceAfter: 8,
      },
    }));

    slide.addText(textObjects, {
      x: r.text.x,
      y: r.text.y,
      w: r.text.w,
      h: r.text.h,
      valign: 'top',
    });
  }

  addFooter(pptx, slide, slideNum, totalSlides, theme);
  if (config.disclaimer) addDisclaimer(slide, config.disclaimer, theme);
}

// ============================================
// LAYOUT 3: TITLE + CONTENT
// ============================================

function renderTitleContentSlide(
  pptx: pptxgen,
  slide: pptxgen.Slide,
  config: SlideConfig,
  theme: SlideTheme,
  slideNum: number,
  totalSlides: number
) {
  addHeader(pptx, slide, config.title || '', theme);

  const r = REGIONS.titleContent;

  if (config.content) {
    slide.addText(config.content, {
      x: r.content.x,
      y: r.content.y,
      w: r.content.w,
      h: r.content.h,
      fontSize: 14,
      color: theme.colors.text,
      fontFace: theme.fonts.body,
      valign: 'top',
      lineSpacingMultiple: 1.3,
    });
  } else if (config.bullets) {
    const textObjects = config.bullets.map(bullet => ({
      text: bullet,
      options: {
        fontSize: 14,
        color: theme.colors.text,
        fontFace: theme.fonts.body,
        bullet: true,
        paraSpaceAfter: 6,
      },
    }));

    slide.addText(textObjects, {
      x: r.bullets.x,
      y: r.bullets.y,
      w: r.bullets.w,
      h: r.bullets.h,
      valign: 'top',
    });
  }

  addFooter(pptx, slide, slideNum, totalSlides, theme);
}

// ============================================
// LAYOUT 4: TWO COLUMN
// ============================================

function renderTwoColumnSlide(
  pptx: pptxgen,
  slide: pptxgen.Slide,
  config: SlideConfig,
  theme: SlideTheme,
  slideNum: number,
  totalSlides: number
) {
  addHeader(pptx, slide, config.title || '', theme);

  const r = REGIONS.twoColumn;

  // Divider line
  slide.addShape(pptx.ShapeType.line, {
    x: r.divider.x,
    y: r.divider.y,
    w: 0,
    h: r.divider.h,
    line: { color: theme.colors.divider, width: 1 },
  });

  // Left column
  if (config.leftColumn && config.leftColumn.length > 0) {
    const leftText = config.leftColumn.map(item => ({
      text: item,
      options: {
        fontSize: 13,
        color: theme.colors.text,
        fontFace: theme.fonts.body,
        bullet: true,
        paraSpaceAfter: 6,
      },
    }));

    slide.addText(leftText, {
      x: r.left.x,
      y: r.left.y,
      w: r.left.w,
      h: r.left.h,
      valign: 'top',
    });
  }

  // Right column
  if (config.rightColumn && config.rightColumn.length > 0) {
    const rightText = config.rightColumn.map(item => ({
      text: item,
      options: {
        fontSize: 13,
        color: theme.colors.text,
        fontFace: theme.fonts.body,
        bullet: true,
        paraSpaceAfter: 6,
      },
    }));

    slide.addText(rightText, {
      x: r.right.x,
      y: r.right.y,
      w: r.right.w,
      h: r.right.h,
      valign: 'top',
    });
  }

  addFooter(pptx, slide, slideNum, totalSlides, theme);
}

// ============================================
// LAYOUT 5: CHART
// ============================================

function renderChartSlide(
  pptx: pptxgen,
  slide: pptxgen.Slide,
  config: SlideConfig,
  theme: SlideTheme,
  slideNum: number,
  totalSlides: number
) {
  addHeader(pptx, slide, config.title || '', theme);

  const r = REGIONS.chart;

  if (config.chartPngBase64) {
    // Imagem do gráfico
    slide.addImage({
      data: config.chartPngBase64.startsWith('data:')
        ? config.chartPngBase64
        : `data:image/png;base64,${config.chartPngBase64}`,
      x: r.image.x,
      y: r.image.y,
      w: r.image.w,
      h: r.image.h,
    });
  } else if (config.chartSpec) {
    // Tentar renderizar como gráfico nativo pptxgenjs
    renderNativeChart(pptx, slide, config.chartSpec, theme, r.image);
  } else {
    // Fallback: placeholder
    slide.addShape(pptx.ShapeType.roundRect, {
      x: r.fallbackBox.x,
      y: r.fallbackBox.y,
      w: r.fallbackBox.w,
      h: r.fallbackBox.h,
      fill: { color: theme.colors.cardBg },
      line: { color: theme.colors.cardBorder, width: 1 },
      rectRadius: 0.05,
    });

    slide.addText(`[Gráfico: ${config.chartSpec?.chartType || 'chart'}]`, {
      x: r.fallbackText.x,
      y: r.fallbackText.y,
      w: r.fallbackText.w,
      h: r.fallbackText.h,
      fontSize: 14,
      color: theme.colors.subtitle,
      italic: true,
      align: 'center',
      fontFace: theme.fonts.body,
    });
  }

  if (config.disclaimer) addDisclaimer(slide, config.disclaimer, theme);
  addFooter(pptx, slide, slideNum, totalSlides, theme);
}

function renderNativeChart(
  pptx: pptxgen,
  slide: pptxgen.Slide,
  chartSpec: NonNullable<SlideConfig['chartSpec']>,
  theme: SlideTheme,
  position: { x: number; y: number; w: number; h: number }
) {
  if (!chartSpec.data || chartSpec.data.length === 0) return;

  const data = chartSpec.data;
  const keys = Object.keys(data[0]).filter(k => k !== 'name' && k !== 'mes' && k !== 'label' && k !== 'categoria');
  const labelKey = Object.keys(data[0]).find(k => ['name', 'mes', 'label', 'categoria'].includes(k)) || Object.keys(data[0])[0];
  const numericKeys = keys.filter(k => typeof data[0][k] === 'number');

  if (numericKeys.length === 0) return;

  const chartColors = [theme.colors.primary, theme.colors.secondary, theme.colors.accent, theme.colors.warning];

  const chartType = chartSpec.chartType;
  if (chartType === 'pie') {
    const chartData = [{
      name: numericKeys[0],
      labels: data.map(d => String(d[labelKey])),
      values: data.map(d => Number(d[numericKeys[0]] || 0)),
    }];

    slide.addChart(pptx.ChartType.pie, chartData, {
      x: position.x,
      y: position.y,
      w: position.w,
      h: position.h,
      showTitle: false,
      showLegend: true,
      legendPos: 'b',
      legendFontSize: 10,
      chartColors: chartColors,
      dataLabelPosition: 'outEnd',
      showPercent: true,
    });
  } else if (chartType === 'line') {
    const chartData = numericKeys.map((key, idx) => ({
      name: key,
      labels: data.map(d => String(d[labelKey])),
      values: data.map(d => Number(d[key] || 0)),
    }));

    slide.addChart(pptx.ChartType.line, chartData, {
      x: position.x,
      y: position.y,
      w: position.w,
      h: position.h,
      showTitle: false,
      showLegend: numericKeys.length > 1,
      legendPos: 'b',
      chartColors: chartColors.slice(0, numericKeys.length),
      lineSmooth: true,
      lineDataSymbolSize: 6,
      catAxisLabelFontSize: 10,
      valAxisLabelFontSize: 10,
    });
  } else {
    // Default: bar chart
    const chartData = numericKeys.map((key) => ({
      name: key,
      labels: data.map(d => String(d[labelKey])),
      values: data.map(d => Number(d[key] || 0)),
    }));

    slide.addChart(pptx.ChartType.bar, chartData, {
      x: position.x,
      y: position.y,
      w: position.w,
      h: position.h,
      showTitle: false,
      showLegend: numericKeys.length > 1,
      legendPos: 'b',
      barDir: 'col',
      barGrouping: chartType === 'grouped_bar' ? 'clustered' : 'clustered',
      chartColors: chartColors.slice(0, numericKeys.length),
      catAxisLabelFontSize: 10,
      valAxisLabelFontSize: 10,
    });
  }
}

// ============================================
// LAYOUT 6: KPI CARDS
// ============================================

function renderKpiCardsSlide(
  pptx: pptxgen,
  slide: pptxgen.Slide,
  config: SlideConfig,
  theme: SlideTheme,
  slideNum: number,
  totalSlides: number
) {
  addHeader(pptx, slide, config.title || '', theme);

  const r = REGIONS.kpiCards;
  const cards = config.kpiCards || [];
  const count = Math.min(cards.length, 4);
  if (count === 0) {
    addFooter(pptx, slide, slideNum, totalSlides, theme);
    return;
  }

  const cardWidth = (r.totalWidth - r.gap * (count - 1)) / count;

  cards.slice(0, 4).forEach((card, idx) => {
    const x = r.startX + idx * (cardWidth + r.gap);
    const y = r.startY;

    // Card background
    slide.addShape(pptx.ShapeType.roundRect, {
      x,
      y,
      w: cardWidth,
      h: r.cardHeight,
      fill: { color: theme.colors.cardBg },
      line: { color: theme.colors.cardBorder, width: 1 },
      rectRadius: 0.08,
    });

    // Value (grande)
    slide.addText(card.value, {
      x,
      y: y + 0.3,
      w: cardWidth,
      h: 0.8,
      fontSize: 28,
      bold: true,
      color: theme.colors.primary,
      fontFace: theme.fonts.heading,
      align: 'center',
    });

    // Label
    slide.addText(card.label, {
      x,
      y: y + 1.1,
      w: cardWidth,
      h: 0.4,
      fontSize: 11,
      color: theme.colors.subtitle,
      fontFace: theme.fonts.body,
      align: 'center',
    });

    // Trend indicator
    if (card.trend && card.change) {
      const trendColor =
        card.trend === 'up' ? theme.colors.success :
        card.trend === 'down' ? theme.colors.danger :
        theme.colors.subtitle;
      const arrow = card.trend === 'up' ? '▲' : card.trend === 'down' ? '▼' : '●';

      slide.addText(`${arrow} ${card.change}`, {
        x,
        y: y + 1.6,
        w: cardWidth,
        h: 0.4,
        fontSize: 11,
        bold: true,
        color: trendColor,
        fontFace: theme.fonts.body,
        align: 'center',
      });
    }
  });

  addFooter(pptx, slide, slideNum, totalSlides, theme);
}

// ============================================
// LAYOUT 7: COMPARISON
// ============================================

function renderComparisonSlide(
  pptx: pptxgen,
  slide: pptxgen.Slide,
  config: SlideConfig,
  theme: SlideTheme,
  slideNum: number,
  totalSlides: number
) {
  addHeader(pptx, slide, config.title || '', theme);

  const r = REGIONS.comparison;
  const columns = config.comparison || [];

  columns.slice(0, 2).forEach((col, idx) => {
    const x = idx === 0 ? r.leftX : r.rightX;
    const isHighlight = col.highlight === true;

    // Panel background
    slide.addShape(pptx.ShapeType.roundRect, {
      x,
      y: r.startY,
      w: r.panelWidth,
      h: r.panelHeight,
      fill: { color: isHighlight ? theme.colors.cardBg : theme.colors.background },
      line: {
        color: isHighlight ? theme.colors.primary : theme.colors.cardBorder,
        width: isHighlight ? 2 : 1,
      },
      rectRadius: 0.08,
    });

    // Header
    slide.addShape(pptx.ShapeType.rect, {
      x: x + 0.01,
      y: r.startY + 0.01,
      w: r.panelWidth - 0.02,
      h: 0.6,
      fill: { color: isHighlight ? theme.colors.primary : theme.colors.subtitle },
    });

    slide.addText(col.header, {
      x,
      y: r.startY + 0.05,
      w: r.panelWidth,
      h: 0.5,
      fontSize: 16,
      bold: true,
      color: 'FFFFFF',
      fontFace: theme.fonts.heading,
      align: 'center',
    });

    // Items
    if (col.items && col.items.length > 0) {
      const itemTexts = col.items.map(item => ({
        text: item,
        options: {
          fontSize: 12,
          color: theme.colors.text,
          fontFace: theme.fonts.body,
          bullet: true,
          paraSpaceAfter: 6,
        },
      }));

      slide.addText(itemTexts, {
        x: x + 0.3,
        y: r.startY + 0.8,
        w: r.panelWidth - 0.6,
        h: r.panelHeight - 1.0,
        valign: 'top',
      });
    }
  });

  addFooter(pptx, slide, slideNum, totalSlides, theme);
}

// ============================================
// LAYOUT 8: TIMELINE
// ============================================

function renderTimelineSlide(
  pptx: pptxgen,
  slide: pptxgen.Slide,
  config: SlideConfig,
  theme: SlideTheme,
  slideNum: number,
  totalSlides: number
) {
  addHeader(pptx, slide, config.title || '', theme);

  const r = REGIONS.timeline;
  const items = config.timelineItems || [];
  const count = Math.min(items.length, 6);
  if (count === 0) {
    addFooter(pptx, slide, slideNum, totalSlides, theme);
    return;
  }

  const spacing = r.totalWidth / count;

  // Main timeline line
  slide.addShape(pptx.ShapeType.line, {
    x: r.startX,
    y: r.lineY,
    w: r.totalWidth,
    h: 0,
    line: { color: theme.colors.primary, width: 2 },
  });

  items.slice(0, 6).forEach((item, idx) => {
    const cx = r.startX + idx * spacing + spacing / 2;

    // Status colors
    const dotColor =
      item.status === 'completed' ? theme.colors.success :
      item.status === 'current' ? theme.colors.primary :
      theme.colors.subtitle;

    // Dot on the line
    slide.addShape(pptx.ShapeType.ellipse, {
      x: cx - 0.12,
      y: r.lineY - 0.12,
      w: 0.24,
      h: 0.24,
      fill: { color: dotColor },
      line: { color: 'FFFFFF', width: 2 },
    });

    // Date (above line)
    slide.addText(item.date, {
      x: cx - spacing / 2 + 0.1,
      y: r.lineY - 0.7,
      w: spacing - 0.2,
      h: 0.4,
      fontSize: 9,
      bold: true,
      color: dotColor,
      fontFace: theme.fonts.body,
      align: 'center',
    });

    // Title (below line)
    slide.addText(item.title, {
      x: cx - spacing / 2 + 0.1,
      y: r.lineY + 0.3,
      w: spacing - 0.2,
      h: 0.5,
      fontSize: 10,
      bold: true,
      color: theme.colors.text,
      fontFace: theme.fonts.body,
      align: 'center',
    });

    // Description
    if (item.description) {
      slide.addText(item.description, {
        x: cx - spacing / 2 + 0.1,
        y: r.lineY + 0.8,
        w: spacing - 0.2,
        h: 0.6,
        fontSize: 8,
        color: theme.colors.subtitle,
        fontFace: theme.fonts.body,
        align: 'center',
      });
    }
  });

  addFooter(pptx, slide, slideNum, totalSlides, theme);
}

// ============================================
// LAYOUT 9: QUOTE
// ============================================

function renderQuoteSlide(
  pptx: pptxgen,
  slide: pptxgen.Slide,
  config: SlideConfig,
  theme: SlideTheme,
  slideNum: number,
  totalSlides: number
) {
  const r = REGIONS.quote;

  // Title (se houver)
  if (config.title) {
    slide.addText(config.title, {
      x: r.title.x,
      y: r.title.y,
      w: r.title.w,
      h: r.title.h,
      fontSize: 14,
      bold: true,
      color: theme.colors.primary,
      fontFace: theme.fonts.heading,
    });
  }

  // Accent bar vertical
  slide.addShape(pptx.ShapeType.rect, {
    x: r.accent.x,
    y: r.accent.y,
    w: r.accent.w,
    h: r.accent.h,
    fill: { color: theme.colors.primary },
  });

  // Quote mark
  slide.addText('"', {
    x: r.mark.x,
    y: r.mark.y,
    w: r.mark.w,
    h: r.mark.h,
    fontSize: 60,
    color: theme.colors.primary,
    fontFace: 'Georgia',
    bold: true,
  });

  // Quote text
  if (config.quoteText) {
    slide.addText(config.quoteText, {
      x: r.text.x,
      y: r.text.y,
      w: r.text.w,
      h: r.text.h,
      fontSize: 20,
      italic: true,
      color: theme.colors.text,
      fontFace: theme.fonts.body,
      align: 'left',
      valign: 'middle',
    });
  }

  // Author
  if (config.quoteAuthor) {
    slide.addText(`— ${config.quoteAuthor}`, {
      x: r.author.x,
      y: r.author.y,
      w: r.author.w,
      h: r.author.h,
      fontSize: 12,
      color: theme.colors.subtitle,
      fontFace: theme.fonts.body,
    });
  }

  addFooter(pptx, slide, slideNum, totalSlides, theme);
}

// ============================================
// LAYOUT 10: SECTION DIVIDER
// ============================================

function renderSectionDividerSlide(
  pptx: pptxgen,
  slide: pptxgen.Slide,
  config: SlideConfig,
  theme: SlideTheme
) {
  const r = REGIONS.sectionDivider;

  // Title
  slide.addText(config.title || '', {
    x: r.title.x,
    y: r.title.y,
    w: r.title.w,
    h: r.title.h,
    fontSize: 34,
    bold: true,
    color: 'FFFFFF',
    fontFace: theme.fonts.heading,
    align: 'center',
  });

  // Subtitle
  if (config.subtitle) {
    slide.addText(config.subtitle, {
      x: r.subtitle.x,
      y: r.subtitle.y,
      w: r.subtitle.w,
      h: r.subtitle.h,
      fontSize: 16,
      color: 'D1D5DB',
      fontFace: theme.fonts.body,
      align: 'center',
    });
  }
}

// ============================================
// LAYOUT 11: IMAGE + CONTENT
// ============================================

function renderImageContentSlide(
  pptx: pptxgen,
  slide: pptxgen.Slide,
  config: SlideConfig,
  theme: SlideTheme,
  slideNum: number,
  totalSlides: number
) {
  addHeader(pptx, slide, config.title || '', theme);

  const r = REGIONS.imageContent;

  // Left side: chart/image
  if (config.chartPngBase64) {
    slide.addImage({
      data: config.chartPngBase64.startsWith('data:')
        ? config.chartPngBase64
        : `data:image/png;base64,${config.chartPngBase64}`,
      x: r.image.x,
      y: r.image.y,
      w: r.image.w,
      h: r.image.h,
    });
  } else if (config.chartSpec) {
    renderNativeChart(pptx, slide, config.chartSpec, theme, r.image);
  } else {
    // Placeholder
    slide.addShape(pptx.ShapeType.roundRect, {
      x: r.placeholder.x,
      y: r.placeholder.y,
      w: r.placeholder.w,
      h: r.placeholder.h,
      fill: { color: theme.colors.cardBg },
      line: { color: theme.colors.cardBorder, width: 1 },
      rectRadius: 0.05,
    });
    slide.addText('[Gráfico]', {
      x: r.placeholder.x,
      y: r.placeholder.y + 1.2,
      w: r.placeholder.w,
      h: 0.6,
      fontSize: 14,
      color: theme.colors.subtitle,
      italic: true,
      align: 'center',
    });
  }

  // Right side: bullets
  if (config.bullets && config.bullets.length > 0) {
    const textObjects = config.bullets.map(bullet => ({
      text: bullet,
      options: {
        fontSize: 13,
        color: theme.colors.text,
        fontFace: theme.fonts.body,
        bullet: true,
        paraSpaceAfter: 6,
      },
    }));

    slide.addText(textObjects, {
      x: r.bullets.x,
      y: r.bullets.y,
      w: r.bullets.w,
      h: r.bullets.h,
      valign: 'top',
    });
  }

  addFooter(pptx, slide, slideNum, totalSlides, theme);
  if (config.disclaimer) addDisclaimer(slide, config.disclaimer, theme);
}

// ============================================
// LAYOUT 12: FULL IMAGE
// ============================================

function renderFullImageSlide(
  pptx: pptxgen,
  slide: pptxgen.Slide,
  config: SlideConfig,
  theme: SlideTheme
) {
  const r = REGIONS.fullImage;

  // Full-bleed image
  if (config.chartPngBase64 || config.imageBase64) {
    const imgData = config.chartPngBase64 || config.imageBase64 || '';
    slide.addImage({
      data: imgData.startsWith('data:') ? imgData : `data:image/png;base64,${imgData}`,
      x: r.image.x,
      y: r.image.y,
      w: r.image.w,
      h: r.image.h,
    });
  }

  // Overlay escuro na parte inferior
  slide.addShape(pptx.ShapeType.rect, {
    x: r.overlay.x,
    y: r.overlay.y,
    w: r.overlay.w,
    h: r.overlay.h,
    fill: { color: '000000', transparency: 40 },
  });

  // Title overlay
  if (config.title) {
    slide.addText(config.title, {
      x: r.overlayTitle.x,
      y: r.overlayTitle.y,
      w: r.overlayTitle.w,
      h: r.overlayTitle.h,
      fontSize: 24,
      bold: true,
      color: 'FFFFFF',
      fontFace: theme.fonts.heading,
    });
  }

  // Subtitle overlay
  if (config.subtitle) {
    slide.addText(config.subtitle, {
      x: r.overlaySubtitle.x,
      y: r.overlaySubtitle.y,
      w: r.overlaySubtitle.w,
      h: r.overlaySubtitle.h,
      fontSize: 14,
      color: 'D1D5DB',
      fontFace: theme.fonts.body,
    });
  }
}

// ============================================
// CONVENIENCE: Gerar apresentação DRE completa
// ============================================

export function createDRESlides(
  kpis: {
    receita: number;
    ebitda: number;
    margem: number;
    alunos: number;
    receitaPorAluno: number;
  },
  branchData: Array<{
    branch: string;
    revenue: number;
    costs: number;
    ebitda: number;
    margin: number;
  }>,
  monthlyData: Array<{
    month: string;
    revenue: number;
    ebitda: number;
  }>,
  options?: { title?: string; period?: string }
): SlideConfig[] {
  const topBranch = branchData[0];
  const totalRevenue = branchData.reduce((acc, b) => acc + b.revenue, 0);
  const avgMargin = totalRevenue > 0
    ? (branchData.reduce((acc, b) => acc + b.ebitda, 0) / totalRevenue) * 100
    : 0;

  const fmt = (v: number) => `R$ ${(v / 1000000).toFixed(1)}M`;
  const fmtK = (v: number) => `R$ ${(v / 1000).toFixed(0)}K`;

  return [
    // Slide 1: Title
    {
      layout: 'title',
      title: options?.title || 'Relatório Executivo DRE',
      subtitle: options?.period || `Análise Financeira - ${new Date().getFullYear()}`,
    },

    // Slide 2: KPI Cards
    {
      layout: 'kpiCards',
      title: `Receita de ${fmt(kpis.receita)} com margem EBITDA de ${kpis.margem.toFixed(1)}%`,
      kpiCards: [
        { value: fmt(kpis.receita), label: 'Receita Líquida', trend: 'up', change: '+12%' },
        { value: fmt(kpis.ebitda), label: 'EBITDA', trend: kpis.ebitda > 0 ? 'up' : 'down', change: kpis.ebitda > 0 ? '+8%' : '-5%' },
        { value: `${kpis.margem.toFixed(1)}%`, label: 'Margem EBITDA', trend: kpis.margem >= 25 ? 'up' : 'down', change: kpis.margem >= 25 ? 'Meta atingida' : 'Abaixo da meta' },
        { value: String(kpis.alunos), label: 'Alunos Ativos', trend: 'neutral', change: fmtK(kpis.receitaPorAluno) + '/aluno' },
      ],
    },

    // Slide 3: Monthly Evolution Chart
    {
      layout: 'chart',
      title: 'Evolução mensal mostra tendência de crescimento',
      chartSpec: {
        chartType: 'bar',
        data: monthlyData.map(d => ({
          mes: d.month,
          receita: d.revenue / 1000,
          ebitda: d.ebitda / 1000,
        })),
        isIllustrative: false,
      },
    },

    // Slide 4: Top Branches Comparison
    {
      layout: 'comparison',
      title: `${topBranch.branch} lidera com ${(topBranch.revenue / totalRevenue * 100).toFixed(0)}% da receita total`,
      comparison: [
        {
          header: topBranch.branch,
          items: [
            `Receita: ${fmt(topBranch.revenue)}`,
            `EBITDA: ${fmt(topBranch.ebitda)}`,
            `Margem: ${topBranch.margin.toFixed(1)}%`,
          ],
          highlight: true,
        },
        {
          header: 'Demais Unidades',
          items: branchData.slice(1, 4).map(b =>
            `${b.branch}: ${fmt(b.revenue)} (${b.margin.toFixed(0)}%)`
          ),
        },
      ],
    },

    // Slide 5: Branch Performance (bullets)
    {
      layout: 'bullets',
      title: `${branchData.filter(b => b.margin >= 25).length} unidades atingiram meta de margem de 25%`,
      bullets: branchData.slice(0, 6).map(b =>
        `${b.branch}: ${fmt(b.revenue)} | Margem ${b.margin.toFixed(1)}%`
      ),
    },

    // Slide 6: Insights
    {
      layout: 'titleContent',
      title: 'Análise executiva aponta oportunidades de otimização',
      content: `A receita total consolidada de ${fmt(kpis.receita)} reflete o desempenho das ${branchData.length} unidades. A margem EBITDA média de ${avgMargin.toFixed(1)}% indica ${avgMargin >= 25 ? 'operação saudável com espaço para crescimento' : 'necessidade de revisão de custos operacionais'}. A receita por aluno de ${fmtK(kpis.receitaPorAluno)} está ${kpis.receitaPorAluno >= 15000 ? 'acima' : 'abaixo'} do benchmark setorial.`,
    },

    // Slide 7: Timeline (próximos passos)
    {
      layout: 'timeline',
      title: 'Roadmap de ações para o próximo trimestre',
      timelineItems: [
        { date: 'Semana 1', title: 'Revisão de custos', description: 'Análise detalhada por centro de custo', status: 'current' as const },
        { date: 'Semana 2-3', title: 'Plano de otimização', description: 'Definir metas por unidade', status: 'upcoming' as const },
        { date: 'Mês 2', title: 'Implementação', description: 'Executar quick wins', status: 'upcoming' as const },
        { date: 'Mês 3', title: 'Avaliação', description: 'Medir impacto das ações', status: 'upcoming' as const },
      ],
    },

    // Slide 8: Quote / Conclusão
    {
      layout: 'quote',
      title: 'Conclusão',
      quoteText: kpis.margem >= 25
        ? 'O grupo apresenta resultados sólidos com margem acima da meta. O foco deve ser na expansão sustentável.'
        : 'Existe oportunidade significativa de melhoria de margem através de otimização de custos e revisão de pricing.',
      quoteAuthor: 'Análise DRE RAIZ',
    },
  ];
}
