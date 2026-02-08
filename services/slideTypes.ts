/**
 * Sistema de Slides, Gráficos e Exportação - Tipos e Temas
 * Baseado no guia técnico rAIz Platform
 */

// ============================================
// SLIDE LAYOUTS
// ============================================

export type SlideLayout =
  | 'title'
  | 'bullets'
  | 'titleContent'
  | 'twoColumn'
  | 'chart'
  | 'kpiCards'
  | 'comparison'
  | 'timeline'
  | 'quote'
  | 'sectionDivider'
  | 'imageContent'
  | 'fullImage';

// ============================================
// SLIDE CONFIG
// ============================================

export interface SlideConfig {
  layout: SlideLayout;
  title?: string;
  subtitle?: string;
  content?: string;
  bullets?: string[];
  notes?: string;
  leftColumn?: string[];
  rightColumn?: string[];
  chartSpec?: SlideChartSpec;
  chartPngBase64?: string;
  chartSvg?: string;
  imageBase64?: string;
  kpiCards?: KpiCardSpec[];
  timelineItems?: TimelineItem[];
  comparison?: ComparisonColumn[];
  quoteText?: string;
  quoteAuthor?: string;
  overlayText?: string;
  disclaimer?: string;
}

export interface SlideChartSpec {
  chartType: 'bar' | 'line' | 'pie' | 'area' | 'grouped_bar' | 'waterfall' | 'composed';
  data: Record<string, unknown>[];
  title?: string;
  options?: Record<string, unknown>;
  isIllustrative?: boolean;
}

export interface KpiCardSpec {
  value: string;
  label: string;
  trend?: 'up' | 'down' | 'neutral';
  change?: string;
}

export interface TimelineItem {
  date: string;
  title: string;
  description?: string;
  status?: 'completed' | 'current' | 'upcoming';
}

export interface ComparisonColumn {
  header: string;
  items: string[];
  highlight?: boolean;
}

// ============================================
// TEMAS
// ============================================

export type ThemeName =
  | 'corporate'
  | 'modern-dark'
  | 'warm-earth'
  | 'tech-gradient'
  | 'minimal-clean'
  | 'educacao'
  | 'financeiro'
  | 'rh'
  | 'marketing';

export interface SlideTheme {
  name: string;
  label: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
    subtitle: string;
    cardBg: string;
    cardBorder: string;
    divider: string;
    sectionBg: string;
    quoteBg: string;
    success: string;
    danger: string;
    warning: string;
  };
  fonts: {
    heading: string;
    body: string;
  };
}

// ============================================
// TEMAS PRÉ-DEFINIDOS
// ============================================

export const SLIDE_THEMES: Record<ThemeName, SlideTheme> = {
  corporate: {
    name: 'corporate',
    label: 'Corporativo',
    colors: {
      primary: '1B75BB',
      secondary: '3B82F6',
      accent: '10B981',
      background: 'FFFFFF',
      text: '1F2937',
      subtitle: '6B7280',
      cardBg: 'F8FAFC',
      cardBorder: 'E2E8F0',
      divider: 'E5E7EB',
      sectionBg: '1B75BB',
      quoteBg: 'F0F9FF',
      success: '10B981',
      danger: 'EF4444',
      warning: 'F59E0B',
    },
    fonts: { heading: 'Calibri', body: 'Calibri' },
  },
  'modern-dark': {
    name: 'modern-dark',
    label: 'Moderno Escuro',
    colors: {
      primary: '6366F1',
      secondary: '818CF8',
      accent: '34D399',
      background: '0F172A',
      text: 'FFFFFF',
      subtitle: '94A3B8',
      cardBg: '1E293B',
      cardBorder: '334155',
      divider: '334155',
      sectionBg: '1E1B4B',
      quoteBg: '1E293B',
      success: '34D399',
      danger: 'F87171',
      warning: 'FBBF24',
    },
    fonts: { heading: 'Calibri', body: 'Calibri' },
  },
  'warm-earth': {
    name: 'warm-earth',
    label: 'Terra Quente',
    colors: {
      primary: '92400E',
      secondary: 'D97706',
      accent: '65A30D',
      background: 'FFFBEB',
      text: '1C1917',
      subtitle: '78716C',
      cardBg: 'FEF3C7',
      cardBorder: 'FDE68A',
      divider: 'D6D3D1',
      sectionBg: '92400E',
      quoteBg: 'FEF3C7',
      success: '65A30D',
      danger: 'DC2626',
      warning: 'D97706',
    },
    fonts: { heading: 'Calibri', body: 'Calibri' },
  },
  'tech-gradient': {
    name: 'tech-gradient',
    label: 'Tech Gradient',
    colors: {
      primary: '7C3AED',
      secondary: 'A78BFA',
      accent: '2DD4BF',
      background: 'FAF5FF',
      text: '1E1B4B',
      subtitle: '6B7280',
      cardBg: 'F5F3FF',
      cardBorder: 'DDD6FE',
      divider: 'E5E7EB',
      sectionBg: '7C3AED',
      quoteBg: 'F5F3FF',
      success: '2DD4BF',
      danger: 'F87171',
      warning: 'FBBF24',
    },
    fonts: { heading: 'Calibri', body: 'Calibri' },
  },
  'minimal-clean': {
    name: 'minimal-clean',
    label: 'Minimalista',
    colors: {
      primary: '374151',
      secondary: '6B7280',
      accent: '3B82F6',
      background: 'FFFFFF',
      text: '111827',
      subtitle: '9CA3AF',
      cardBg: 'F9FAFB',
      cardBorder: 'E5E7EB',
      divider: 'E5E7EB',
      sectionBg: '374151',
      quoteBg: 'F9FAFB',
      success: '10B981',
      danger: 'EF4444',
      warning: 'F59E0B',
    },
    fonts: { heading: 'Calibri', body: 'Calibri' },
  },
  educacao: {
    name: 'educacao',
    label: 'Educação',
    colors: {
      primary: '1E40AF',
      secondary: '3B82F6',
      accent: '10B981',
      background: 'FFFFFF',
      text: '1F2937',
      subtitle: '6B7280',
      cardBg: 'EFF6FF',
      cardBorder: 'BFDBFE',
      divider: 'DBEAFE',
      sectionBg: '1E40AF',
      quoteBg: 'EFF6FF',
      success: '10B981',
      danger: 'EF4444',
      warning: 'F59E0B',
    },
    fonts: { heading: 'Calibri', body: 'Calibri' },
  },
  financeiro: {
    name: 'financeiro',
    label: 'Financeiro',
    colors: {
      primary: '166534',
      secondary: '22C55E',
      accent: '0EA5E9',
      background: 'FFFFFF',
      text: '1F2937',
      subtitle: '6B7280',
      cardBg: 'F0FDF4',
      cardBorder: 'BBF7D0',
      divider: 'DCFCE7',
      sectionBg: '166534',
      quoteBg: 'F0FDF4',
      success: '22C55E',
      danger: 'EF4444',
      warning: 'F59E0B',
    },
    fonts: { heading: 'Calibri', body: 'Calibri' },
  },
  rh: {
    name: 'rh',
    label: 'RH',
    colors: {
      primary: '9333EA',
      secondary: 'A855F7',
      accent: 'F472B6',
      background: 'FFFFFF',
      text: '1F2937',
      subtitle: '6B7280',
      cardBg: 'FAF5FF',
      cardBorder: 'E9D5FF',
      divider: 'F3E8FF',
      sectionBg: '9333EA',
      quoteBg: 'FAF5FF',
      success: '10B981',
      danger: 'EF4444',
      warning: 'F59E0B',
    },
    fonts: { heading: 'Calibri', body: 'Calibri' },
  },
  marketing: {
    name: 'marketing',
    label: 'Marketing',
    colors: {
      primary: 'DC2626',
      secondary: 'F97316',
      accent: 'FBBF24',
      background: 'FFFFFF',
      text: '1F2937',
      subtitle: '6B7280',
      cardBg: 'FEF2F2',
      cardBorder: 'FECACA',
      divider: 'FEE2E2',
      sectionBg: 'DC2626',
      quoteBg: 'FFF7ED',
      success: '10B981',
      danger: 'EF4444',
      warning: 'F59E0B',
    },
    fonts: { heading: 'Calibri', body: 'Calibri' },
  },
};

// ============================================
// REGIONS (posicionamento em polegadas - 10" x 5.625")
// ============================================

export const SLIDE_W = 10;
export const SLIDE_H = 5.625;

export const REGIONS = {
  header: {
    accent: { x: 0, y: 0, w: SLIDE_W, h: 0.06 },
    title: { x: 0.6, y: 0.25, w: 8.8, h: 0.6 },
    line: { x: 0.6, y: 0.9, w: 8.8, h: 0 },
  },
  footer: {
    line: { x: 0.5, y: 5.2, w: 9, h: 0 },
    text: { x: 0.5, y: 5.3, w: 5, h: 0.3 },
    slideNum: { x: 9, y: 5.3, w: 0.5, h: 0.3 },
  },
  disclaimer: { x: 6.5, y: 5.0, w: 3, h: 0.2 },
  title: {
    accentBar: { x: 0, y: 0, w: 0.15, h: SLIDE_H },
    bottomBar: { x: 0, y: 5.2, w: SLIDE_W, h: 0.06 },
    title: { x: 0.8, y: 1.8, w: 8.5, h: 1.2 },
    subtitle: { x: 0.8, y: 3.1, w: 8.5, h: 0.6 },
  },
  bullets: {
    accent: { x: 0.6, y: 1.1, w: 0.04, h: 3.8 },
    text: { x: 0.9, y: 1.1, w: 8.5, h: 3.8 },
  },
  titleContent: {
    content: { x: 0.6, y: 1.1, w: 8.8, h: 3.8 },
    bullets: { x: 0.9, y: 1.1, w: 8.5, h: 3.8 },
  },
  twoColumn: {
    divider: { x: 5, y: 1.2, w: 0, h: 3.5 },
    left: { x: 0.6, y: 1.1, w: 4.2, h: 3.8 },
    right: { x: 5.2, y: 1.1, w: 4.2, h: 3.8 },
  },
  chart: {
    image: { x: 0.8, y: 1.1, w: 8.4, h: 3.7 },
    fallbackBox: { x: 1.5, y: 1.5, w: 7, h: 3 },
    fallbackText: { x: 1.5, y: 2.5, w: 7, h: 1 },
  },
  kpiCards: {
    startX: 0.6,
    startY: 1.5,
    totalWidth: 8.8,
    gap: 0.2,
    cardHeight: 2.2,
  },
  comparison: {
    panelWidth: 4.2,
    panelHeight: 3.5,
    startY: 1.2,
    leftX: 0.6,
    rightX: 5.2,
  },
  timeline: {
    startX: 0.8,
    lineY: 2.8,
    totalWidth: 8.4,
  },
  quote: {
    background: { x: 0, y: 0, w: SLIDE_W, h: SLIDE_H },
    accent: { x: 1.2, y: 1.5, w: 0.06, h: 2.5 },
    mark: { x: 1.0, y: 1.0, w: 1, h: 1 },
    text: { x: 1.5, y: 1.8, w: 7, h: 2 },
    author: { x: 1.5, y: 4.0, w: 7, h: 0.5 },
    title: { x: 0.6, y: 0.3, w: 8.8, h: 0.4 },
  },
  imageContent: {
    image: { x: 0.5, y: 1.1, w: 4.5, h: 3.6 },
    placeholder: { x: 0.5, y: 1.3, w: 4.5, h: 3.2 },
    bullets: { x: 5.3, y: 1.3, w: 4.1, h: 3.6 },
  },
  sectionDivider: {
    background: { x: 0, y: 0, w: SLIDE_W, h: SLIDE_H },
    title: { x: 1, y: 2, w: 8, h: 1.2 },
    subtitle: { x: 1, y: 3.3, w: 8, h: 0.6 },
  },
  fullImage: {
    image: { x: 0, y: 0, w: SLIDE_W, h: SLIDE_H },
    overlay: { x: 0, y: 3.8, w: SLIDE_W, h: 1.825 },
    overlayTitle: { x: 0.5, y: 4.0, w: 9, h: 0.8 },
    overlaySubtitle: { x: 0.5, y: 4.8, w: 9, h: 0.5 },
  },
};

// ============================================
// QUALITY CONFIG
// ============================================

export interface SlidesQualityConfig {
  designRules: string;
  chartStyle: {
    colors: string[];
    fontFamily: string;
    dpi: number;
    figsize: [number, number];
    showGrid: boolean;
    backgroundColor: string;
  };
  fonts: {
    heading: string;
    body: string;
  };
  brandColors: {
    primary: string;
    secondary: string;
    accent: string;
  };
}

export const DEFAULT_QUALITY_CONFIG: SlidesQualityConfig = {
  designRules: `DIRETRIZES DE DESIGN EXECUTIVO (McKinsey/BCG):

PRINCIPIOS FUNDAMENTAIS:
1. PIRAMIDE INVERTIDA: Conclusão primeiro, depois evidências
2. REGRA SO-WHAT: Todo slide deve responder "E daí?" - qual o insight acionável?
3. MECE: Mutuamente Exclusivo, Coletivamente Exaustivo
4. UMA MENSAGEM POR SLIDE: Cada slide = 1 insight claro no título
5. EVIDENCE-BASED: Dados quantitativos suportam cada afirmação

TÍTULOS (estilo insight - OBRIGATÓRIO):
- BOM: "Receita cresceu 23% superando meta de 15%"
- RUIM: "Resultados Financeiros"
- O título DEVE ser a CONCLUSÃO/INSIGHT, nunca o TÓPICO

BULLETS (regra 6x6):
- Max 6 bullets por slide
- Max 6 palavras por bullet
- Cada bullet = 1 fato específico e mensurável
- Iniciar com verbo de ação ou dado numérico

VISUALIZAÇÃO DE DADOS:
- Preferir gráficos a tabelas
- Barras: comparação entre categorias
- Linhas: tendências ao longo do tempo
- Pizza: composição de um total (max 5 fatias)
- KPI cards: números grandes e proeminentes

NARRATIVA (SCR Framework):
- Situação → Complicação → Resolução`,

  chartStyle: {
    colors: ['#1B75BB', '#3B82F6', '#10B981', '#6B7280', '#F44C00', '#7AC5BF', '#F59E0B', '#EF4444'],
    fontFamily: 'Calibri',
    dpi: 150,
    figsize: [12, 5],
    showGrid: false,
    backgroundColor: '#FFFFFF',
  },
  fonts: { heading: 'Calibri', body: 'Calibri' },
  brandColors: { primary: '1B75BB', secondary: '3B82F6', accent: '10B981' },
};

// ============================================
// PRESENTATION OPTIONS
// ============================================

export interface PresentationOptions {
  title?: string;
  author?: string;
  theme?: ThemeName;
  customTheme?: Partial<SlideTheme['colors']>;
  qualityConfig?: Partial<SlidesQualityConfig>;
}

// ============================================
// HELPERS
// ============================================

export function resolveTheme(
  themeName?: ThemeName,
  customColors?: Partial<SlideTheme['colors']>
): SlideTheme {
  const base = SLIDE_THEMES[themeName || 'corporate'];
  if (!customColors) return base;
  return {
    ...base,
    colors: { ...base.colors, ...customColors },
  };
}

export function enforceLayoutDiversity(slides: SlideConfig[]): SlideConfig[] {
  for (let i = 1; i < slides.length; i++) {
    if (slides[i].layout === slides[i - 1].layout && slides[i].layout !== 'title') {
      if (slides[i].layout === 'bullets') {
        slides[i].layout = 'titleContent';
        if (!slides[i].content && slides[i].bullets) {
          slides[i].content = slides[i].bullets!.join('. ').substring(0, 200);
        }
      } else {
        slides[i].layout = 'bullets';
        if (!slides[i].bullets && slides[i].content) {
          slides[i].bullets = slides[i].content!.split('. ').slice(0, 5);
        }
      }
    }
  }
  return slides;
}

export function sanitizeSlideConfig(slide: SlideConfig): SlideConfig {
  return {
    ...slide,
    title: slide.title?.substring(0, 60),
    subtitle: slide.subtitle?.substring(0, 80),
    content: slide.content?.substring(0, 200),
    bullets: slide.bullets?.slice(0, 6).map(b => String(b).substring(0, 80)),
    quoteText: slide.quoteText?.substring(0, 200),
    quoteAuthor: slide.quoteAuthor?.substring(0, 50),
    kpiCards: slide.kpiCards?.slice(0, 4).map(card => ({
      value: String(card.value).substring(0, 15),
      label: String(card.label).substring(0, 25),
      trend: card.trend,
      change: card.change?.substring(0, 15),
    })),
    timelineItems: slide.timelineItems?.slice(0, 6).map(item => ({
      date: String(item.date).substring(0, 20),
      title: String(item.title).substring(0, 40),
      description: item.description?.substring(0, 80),
      status: item.status,
    })),
    comparison: slide.comparison?.slice(0, 3).map(col => ({
      header: String(col.header).substring(0, 30),
      items: col.items.slice(0, 6).map(i => String(i).substring(0, 60)),
      highlight: col.highlight === true,
    })),
    leftColumn: slide.leftColumn?.slice(0, 6).map(i => String(i).substring(0, 80)),
    rightColumn: slide.rightColumn?.slice(0, 6).map(i => String(i).substring(0, 80)),
  };
}
