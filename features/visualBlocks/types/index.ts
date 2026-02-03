/**
 * Visual Blocks - Type Definitions
 * Tipos reutilizáveis para componentes de visualização
 */

import { EChartsOption } from 'echarts';

// ============================================
// Base Types
// ============================================

export type BlockType = 'chart' | 'kpi' | 'text' | 'table';

export interface BaseBlock {
  id: string;
  type: BlockType;
  title?: string;
  subtitle?: string;
  className?: string;
}

// ============================================
// Chart Block
// ============================================

export interface ChartBlockProps extends BaseBlock {
  type: 'chart';
  chartType: 'line' | 'bar' | 'pie' | 'scatter' | 'radar' | 'gauge' | 'funnel' | 'waterfall';
  options: EChartsOption;
  height?: number | string;
  loading?: boolean;
  onChartReady?: (chart: any) => void;
}

// ============================================
// KPI Block
// ============================================

export interface KpiItem {
  id: string;
  label: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    value: number;
    direction: 'up' | 'down' | 'neutral';
    isPositive?: boolean;
  };
  icon?: React.ReactNode;
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'purple' | 'gray';
  format?: 'currency' | 'percent' | 'number' | 'text';
}

export interface KpiGridBlockProps extends BaseBlock {
  type: 'kpi';
  items: KpiItem[];
  columns?: 1 | 2 | 3 | 4 | 5 | 6;
  variant?: 'default' | 'compact' | 'detailed';
}

// ============================================
// Text Block
// ============================================

export interface TextBlockProps extends BaseBlock {
  type: 'text';
  content: string | React.ReactNode;
  variant?: 'default' | 'highlight' | 'quote' | 'alert' | 'success' | 'warning' | 'error';
  markdown?: boolean;
  align?: 'left' | 'center' | 'right';
}

// ============================================
// Table Block
// ============================================

export interface TableColumn {
  id: string;
  header: string;
  accessor: string | ((row: any) => any);
  align?: 'left' | 'center' | 'right';
  width?: number | string;
  sortable?: boolean;
  format?: (value: any) => string | React.ReactNode;
}

export interface TableBlockProps extends BaseBlock {
  type: 'table';
  columns: TableColumn[];
  data: any[];
  variant?: 'default' | 'striped' | 'bordered' | 'compact';
  sortable?: boolean;
  pagination?: {
    enabled: boolean;
    pageSize?: number;
  };
  footer?: React.ReactNode;
}

// ============================================
// Union Types
// ============================================

export type VisualBlock = ChartBlockProps | KpiGridBlockProps | TextBlockProps | TableBlockProps;

// ============================================
// Helper Types
// ============================================

export interface BlockContainerProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  className?: string;
  actions?: React.ReactNode;
}
