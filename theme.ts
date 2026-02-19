/**
 * DESIGN SYSTEM - RAIZ EDUCAÇÃO
 *
 * Sistema de tokens de design baseado no guia oficial da Raiz Educação.
 * Use estes tokens em vez de valores hardcoded para garantir consistência visual.
 *
 * Extraído de: DESIGN_SYSTEM.md
 * Versão: 1.0
 * Data: 2026-02-14
 */

// ========================================
// CORES
// ========================================

export const colors = {
  // Cores Primárias (Laranja) - Energia, criatividade, aprendizado ativo
  primary: {
    50: '#FFF4E6',
    100: '#FFE8CC',
    200: '#FFD199',
    300: '#FFBA66',
    400: '#FFA333',
    500: '#F08700', // COR PRINCIPAL - Botões, CTAs, links ativos
    600: '#CC7300',
    700: '#A35C00',
    800: '#7A4500',
    900: '#522E00',
  },

  // Cores Secundárias (Turquesa) - Equilíbrio, tranquilidade, frescor
  secondary: {
    50: '#F0FFFE',
    100: '#E1FFFC',
    200: '#C3FFF9',
    300: '#A5FFF6',
    400: '#8CEEF3',
    500: '#7AC5BF', // COR SECUNDÁRIA - Botões secundários, navegação ativa
    600: '#5FA39E',
    700: '#47817D',
    800: '#305F5C',
    900: '#1A3D3B',
  },

  // Cores Neutras (Grays)
  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#374151',
    700: '#1F2937',
    800: '#111827', // Headings principais
    900: '#0A0A0A',
  },

  // Cores de Status (Semânticas)
  success: {
    50: '#F0FDF4',
    500: '#10B981',
    700: '#047857',
  },
  error: {
    50: '#FEE2E2',
    500: '#EF4444',
    700: '#991B1B',
  },
  warning: {
    50: '#FEF3C7',
    500: '#F59E0B',
    700: '#78350F',
  },
  info: {
    50: '#EFF6FF',
    500: '#3B82F6',
    700: '#1E40AF',
  },

  // Cores de Gamificação
  gold: '#F59E0B',
  silver: '#9CA3AF',
  bronze: '#D97706',

  // Cores Base
  white: '#FFFFFF',
  black: '#000000',
};

// Gradientes
export const gradients = {
  primary: 'linear-gradient(to right, #F08700, #7AC5BF)',
  secondary: 'linear-gradient(to right, #7AC5BF, #F08700)',
  gold: 'linear-gradient(135deg, #F59E0B, #FBBF24)',
  silver: 'linear-gradient(135deg, #9CA3AF, #D1D5DB)',
  bronze: 'linear-gradient(135deg, #D97706, #F59E0B)',
};

// ========================================
// TIPOGRAFIA
// ========================================

export const typography = {
  // Famílias
  fontFamily: {
    body: 'Arial, Helvetica, sans-serif',
    heading: 'Arial, Helvetica, sans-serif',
    mono: "'Courier New', Courier, monospace",
  },

  // Tamanhos (em pixels)
  fontSize: {
    xs: '11px',   // Badges, meta info
    sm: '12px',   // Captions, timestamps
    base: '13px', // Labels de formulário
    md: '14px',   // Corpo de texto padrão, botões
    lg: '16px',   // Subtítulos, textos de destaque
    xl: '20px',   // Títulos de seções
    '2xl': '22px', // Títulos de cards (mobile)
    '3xl': '28px', // Títulos principais de página
    '4xl': '32px', // Headings hero (raro)
  },

  // Pesos
  fontWeight: {
    light: 300,
    regular: 400,
    medium: 500,
    semibold: 600, // Botões, tabs, títulos de cards
    bold: 700,     // Headings, valores numéricos
  },

  // Line Heights
  lineHeight: {
    tight: 1.2,
    snug: 1.3,
    normal: 1.4,
    relaxed: 1.5,
    loose: 1.6,
  },
};

// ========================================
// ESPAÇAMENTO (Sistema 4-point grid)
// ========================================

export const spacing = {
  0: '0px',
  1: '4px',    // Gaps mínimos
  2: '8px',    // Padding de botões pequenos, gaps
  3: '12px',   // Padding padrão de botões, badges
  4: '16px',   // Padding de cards, gaps entre items
  5: '20px',   // Padding de containers médios
  6: '24px',   // Margens entre seções
  8: '32px',   // Padding de páginas, espaçamento macro
  10: '40px',  // Padding de modais
  12: '48px',  // Espaçamento de hero sections
  16: '64px',  // Espaçamento extra-largo
  20: '80px',  // Espaçamento de seções grandes
};

// ========================================
// BORDAS E SOMBRAS
// ========================================

export const borderRadius = {
  none: '0px',
  sm: '4px',      // Badges, tags pequenas
  md: '6px',      // Botões pequenos, inputs
  DEFAULT: '8px', // Botões, cards, inputs padrão
  lg: '12px',     // Cards principais, modais
  xl: '16px',     // Containers grandes
  full: '9999px', // Avatares, pills, badges circulares
};

export const borderWidth = {
  DEFAULT: '1px',
  2: '2px', // Bordas de destaque, sidebar, active
  3: '3px', // Bordas de foco
  4: '4px', // Bordas de avatar no perfil
};

export const boxShadow = {
  none: 'none',
  sm: '0 1px 3px rgba(0,0,0,0.1)',           // Cards padrão
  md: '0 4px 12px rgba(0,0,0,0.15)',         // Cards hover, dropdowns
  lg: '0 8px 24px rgba(0,0,0,0.2)',          // Modais, elementos elevados
  xl: '0 20px 60px rgba(0,0,0,0.3)',         // Modais principais
  // Sombras coloridas
  primarySm: '0 2px 8px rgba(240,135,0,0.2)',
  primaryMd: '0 4px 12px rgba(240,135,0,0.3)',
  secondarySm: '0 2px 8px rgba(122,197,191,0.2)',
  secondaryMd: '0 4px 12px rgba(122,197,191,0.4)',
};

// ========================================
// ANIMAÇÕES E TRANSIÇÕES
// ========================================

export const transitions = {
  duration: {
    fast: '0.15s',   // Hover states
    normal: '0.2s',  // Transições padrão
    slow: '0.3s',    // Modais, sidebars
    slower: '0.6s',  // Barras de progresso
  },

  easing: {
    default: 'ease',
    in: 'cubic-bezier(0.4, 0, 1, 1)',
    out: 'cubic-bezier(0, 0, 0.2, 1)',         // Preferido para hover
    inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',     // Transições bidirecionais
  },

  // Atalhos comuns
  all: 'all 0.2s ease',
  colors: 'color 0.2s ease, background-color 0.2s ease, border-color 0.2s ease',
  transform: 'transform 0.2s ease',
  opacity: 'opacity 0.2s ease',
};

// ========================================
// BREAKPOINTS RESPONSIVOS
// ========================================

export const breakpoints = {
  mobile: '0px',
  sm: '640px',   // Tablet pequeno
  md: '768px',   // Tablet
  lg: '1024px',  // Desktop (sidebar fixa)
  xl: '1280px',  // Desktop amplo
};

// ========================================
// Z-INDEX (Hierarquia de camadas)
// ========================================

export const zIndex = {
  base: 0,
  dropdown: 10,
  sticky: 20,
  fixed: 30,
  drawerBackdrop: 60,
  drawer: 70,
  modal: 999,
  modalBackdrop: 998,
  tooltip: 9999,
};

// ========================================
// OPACIDADES
// ========================================

export const opacity = {
  0: '0',
  10: '0.1',
  20: '0.2',
  30: '0.3',
  50: '0.5',  // Overlays de modal
  60: '0.6',
  70: '0.7',
  80: '0.8',
  90: '0.9',
  100: '1',
};

// ========================================
// EXPORT DEFAULT (Token completo)
// ========================================

const theme = {
  colors,
  gradients,
  typography,
  spacing,
  borderRadius,
  borderWidth,
  boxShadow,
  transitions,
  breakpoints,
  zIndex,
  opacity,
};

export default theme;

// ========================================
// HELPERS (Funções utilitárias)
// ========================================

/**
 * Gera uma string de transition CSS com múltiplas propriedades
 * @example getTransition(['color', 'background'], 0.2, 'ease')
 */
export const getTransition = (
  properties: string[],
  duration: string = transitions.duration.normal,
  easing: string = transitions.easing.default
): string => {
  return properties.map(prop => `${prop} ${duration} ${easing}`).join(', ');
};

/**
 * Gera uma media query responsiva
 * @example mediaQuery('lg') => '@media (min-width: 1024px)'
 */
export const mediaQuery = (breakpoint: keyof typeof breakpoints): string => {
  return `@media (min-width: ${breakpoints[breakpoint]})`;
};

/**
 * Converte opacity numérica (0-100) para CSS
 * @example getOpacity(50) => '0.5'
 */
export const getOpacity = (value: number): string => {
  return (value / 100).toString();
};
