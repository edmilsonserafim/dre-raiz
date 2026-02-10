/**
 * PDF Export Service
 * Gera documentos PDF a partir de dados financeiros DRE
 * Usa pdfmake para geração client-side
 */

import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import type { TDocumentDefinitions, Content, StyleDictionary } from 'pdfmake/interfaces';
import { SchoolKPIs, Transaction } from '../types';
import { BRANCHES } from '../constants';

// Register fonts
pdfMake.vfs = pdfFonts.pdfMake ? pdfFonts.pdfMake.vfs : pdfFonts.vfs;

// ============================================
// COLORS
// ============================================

const COLORS = {
  primary: '#1B75BB',
  accent: '#F44C00',
  teal: '#7AC5BF',
  dark: '#1F2937',
  medium: '#6B7280',
  light: '#F3F4F6',
  white: '#FFFFFF',
  success: '#10B981',
  danger: '#EF4444',
  warning: '#F59E0B',
  headerBg: '#1B75BB',
  altRow: '#F8FAFC',
  border: '#E5E7EB',
};

// ============================================
// STYLES
// ============================================

const PDF_STYLES: StyleDictionary = {
  title: { fontSize: 24, bold: true, color: COLORS.primary, margin: [0, 0, 0, 10] },
  subtitle: { fontSize: 14, color: COLORS.medium, margin: [0, 0, 0, 20] },
  sectionTitle: { fontSize: 16, bold: true, color: COLORS.primary, margin: [0, 20, 0, 8] },
  body: { fontSize: 11, color: COLORS.dark, lineHeight: 1.4 },
  kpiValue: { fontSize: 20, bold: true, color: COLORS.primary },
  kpiLabel: { fontSize: 10, color: COLORS.medium },
  tableHeader: { fontSize: 10, bold: true, color: COLORS.white, fillColor: COLORS.primary },
  tableCell: { fontSize: 10, color: COLORS.dark },
  footer: { fontSize: 8, color: COLORS.medium, alignment: 'center' as const },
  insight: { fontSize: 11, color: COLORS.dark, margin: [0, 2, 0, 4] },
  positive: { fontSize: 11, color: COLORS.success, bold: true },
  negative: { fontSize: 11, color: COLORS.danger, bold: true },
};

// ============================================
// INTERFACES
// ============================================

export interface PDFExportOptions {
  includeKPIs?: boolean;
  includeMonthly?: boolean;
  includeBranches?: boolean;
  includeInsights?: boolean;
  title?: string;
  period?: string;
}

export interface PDFExportData {
  kpis: SchoolKPIs;
  transactions: Transaction[];
  selectedBrand?: string;
  selectedBranch?: string;
}

// ============================================
// MAIN EXPORT FUNCTION
// ============================================

export async function exportDashboardToPDF(
  data: PDFExportData,
  options: PDFExportOptions = {}
): Promise<void> {
  const {
    includeKPIs = true,
    includeMonthly = true,
    includeBranches = true,
    includeInsights = true,
    title = 'Relatório Executivo DRE',
    period,
  } = options;

  const content: Content[] = [];

  // ---- HEADER / CAPA ----
  content.push(buildCoverSection(title, period, data));

  // ---- KPIs ----
  if (includeKPIs) {
    content.push(buildKPIsSection(data.kpis));
  }

  // ---- EVOLUÇÃO MENSAL ----
  if (includeMonthly) {
    content.push(buildMonthlySection(data.transactions));
  }

  // ---- DESEMPENHO POR UNIDADE ----
  if (includeBranches) {
    content.push(buildBranchesSection(data.transactions));
  }

  // ---- INSIGHTS ----
  if (includeInsights) {
    content.push(buildInsightsSection(data));
  }

  // ---- DOCUMENT DEFINITION ----
  const docDefinition: TDocumentDefinitions = {
    pageSize: 'A4',
    pageMargins: [40, 60, 40, 60],
    content,
    styles: PDF_STYLES,
    defaultStyle: {
      fontSize: 11,
      color: COLORS.dark,
    },
    header: (currentPage: number) => {
      if (currentPage === 1) return null;
      return {
        columns: [
          { text: 'DRE RAIZ', style: 'footer', margin: [40, 20, 0, 0], color: COLORS.primary, bold: true },
          { text: title, style: 'footer', margin: [0, 20, 40, 0], alignment: 'right' as const },
        ],
      };
    },
    footer: (currentPage: number, pageCount: number) => ({
      columns: [
        { text: `Gerado em ${new Date().toLocaleDateString('pt-BR')}`, style: 'footer', margin: [40, 0, 0, 0], alignment: 'left' as const },
        { text: `Página ${currentPage} de ${pageCount}`, style: 'footer', margin: [0, 0, 40, 0], alignment: 'right' as const },
      ],
    }),
    info: {
      title,
      author: 'DRE RAIZ - Raiz Educação',
      subject: 'Relatório Financeiro',
      creator: 'Sistema DRE RAIZ',
    },
  };

  const pdf = pdfMake.createPdf(docDefinition);
  pdf.download(`Relatorio_DRE_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.pdf`);
}

// ============================================
// SEÇÕES DO PDF
// ============================================

function buildCoverSection(title: string, period?: string, data?: PDFExportData): Content {
  const dateStr = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  return [
    {
      canvas: [
        { type: 'rect', x: 0, y: 0, w: 515, h: 4, color: COLORS.primary },
      ],
      margin: [0, 0, 0, 20] as [number, number, number, number],
    },
    { text: title, style: 'title' },
    { text: period || `Raiz Educação S.A. • ${dateStr}`, style: 'subtitle' },
    {
      canvas: [
        { type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1, lineColor: COLORS.border },
      ],
      margin: [0, 0, 0, 15] as [number, number, number, number],
    },
  ];
}

function buildKPIsSection(kpis: SchoolKPIs): Content {
  const fmt = (v: number) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`;

  const kpiList = [
    { label: 'Receita Líquida', value: fmt(kpis.totalRevenue), trend: 'neutral' },
    { label: 'EBITDA', value: fmt(kpis.ebitda), trend: kpis.ebitda >= 0 ? 'positive' : 'negative' },
    { label: 'Margem EBITDA', value: `${kpis.netMargin.toFixed(1)}%`, trend: kpis.netMargin >= 25 ? 'positive' : 'negative' },
    { label: 'Alunos Ativos', value: kpis.activeStudents.toLocaleString('pt-BR'), trend: 'neutral' },
    { label: 'Receita/Aluno', value: fmt(kpis.revenuePerStudent), trend: 'neutral' },
    { label: 'Custo/Aluno', value: fmt(kpis.costPerStudent), trend: 'neutral' },
  ];

  return [
    { text: 'Indicadores Principais', style: 'sectionTitle' },
    {
      table: {
        headerRows: 1,
        widths: ['*', 'auto', 'auto'],
        body: [
          [
            { text: 'Indicador', style: 'tableHeader' },
            { text: 'Valor', style: 'tableHeader', alignment: 'right' as const },
            { text: 'Status', style: 'tableHeader', alignment: 'center' as const },
          ],
          ...kpiList.map((kpi, idx) => [
            { text: kpi.label, style: 'tableCell', fillColor: idx % 2 === 0 ? COLORS.altRow : COLORS.white },
            { text: kpi.value, style: 'tableCell', alignment: 'right' as const, bold: true, fillColor: idx % 2 === 0 ? COLORS.altRow : COLORS.white },
            {
              text: kpi.trend === 'positive' ? '●' : kpi.trend === 'negative' ? '●' : '●',
              alignment: 'center' as const,
              color: kpi.trend === 'positive' ? COLORS.success : kpi.trend === 'negative' ? COLORS.danger : COLORS.medium,
              fontSize: 14,
              fillColor: idx % 2 === 0 ? COLORS.altRow : COLORS.white,
            },
          ]),
        ],
      },
      layout: {
        hLineWidth: () => 0.5,
        vLineWidth: () => 0.5,
        hLineColor: () => COLORS.border,
        vLineColor: () => COLORS.border,
        paddingLeft: () => 8,
        paddingRight: () => 8,
        paddingTop: () => 5,
        paddingBottom: () => 5,
      },
      margin: [0, 0, 0, 15] as [number, number, number, number],
    },
  ];
}

function buildMonthlySection(transactions: Transaction[]): Content {
  const months = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
  const realTrans = transactions.filter(t => t.scenario === 'Real');

  const monthlyData = months.map((month, index) => {
    const monthTrans = realTrans.filter(t => parseInt(t.date.substring(5, 7), 10) - 1 === index);
    const revenue = monthTrans.filter(t => t.type === 'REVENUE').reduce((acc, t) => acc + t.amount, 0);
    const costs = monthTrans.filter(t => t.type !== 'REVENUE').reduce((acc, t) => acc + t.amount, 0);
    const ebitda = revenue - costs;
    return { month, revenue, costs, ebitda };
  }).filter(d => d.revenue !== 0 || d.costs !== 0);

  if (monthlyData.length === 0) {
    return { text: '' };
  }

  const fmt = (v: number) => `R$ ${(v / 1000).toFixed(0)}K`;

  return [
    { text: 'Evolução Mensal', style: 'sectionTitle' },
    {
      table: {
        headerRows: 1,
        widths: ['auto', '*', '*', '*'],
        body: [
          [
            { text: 'Mês', style: 'tableHeader' },
            { text: 'Receita', style: 'tableHeader', alignment: 'right' as const },
            { text: 'Custos', style: 'tableHeader', alignment: 'right' as const },
            { text: 'EBITDA', style: 'tableHeader', alignment: 'right' as const },
          ],
          ...monthlyData.map((d, idx) => [
            { text: d.month, style: 'tableCell', fillColor: idx % 2 === 0 ? COLORS.altRow : COLORS.white },
            { text: fmt(d.revenue), style: 'tableCell', alignment: 'right' as const, fillColor: idx % 2 === 0 ? COLORS.altRow : COLORS.white },
            { text: fmt(d.costs), style: 'tableCell', alignment: 'right' as const, fillColor: idx % 2 === 0 ? COLORS.altRow : COLORS.white },
            {
              text: fmt(d.ebitda),
              style: 'tableCell',
              alignment: 'right' as const,
              color: d.ebitda >= 0 ? COLORS.success : COLORS.danger,
              bold: true,
              fillColor: idx % 2 === 0 ? COLORS.altRow : COLORS.white,
            },
          ]),
        ],
      },
      layout: {
        hLineWidth: () => 0.5,
        vLineWidth: () => 0.5,
        hLineColor: () => COLORS.border,
        vLineColor: () => COLORS.border,
        paddingLeft: () => 8,
        paddingRight: () => 8,
        paddingTop: () => 4,
        paddingBottom: () => 4,
      },
      margin: [0, 0, 0, 15] as [number, number, number, number],
    },
  ];
}

function buildBranchesSection(transactions: Transaction[]): Content {
  const branchData = BRANCHES.map(branch => {
    const branchTrans = transactions.filter(t => t.filial === branch && t.scenario === 'Real');
    const revenue = branchTrans.filter(t => t.type === 'REVENUE').reduce((acc, t) => acc + t.amount, 0);
    const costs = branchTrans.filter(t => t.type !== 'REVENUE').reduce((acc, t) => acc + t.amount, 0);
    const ebitda = revenue - costs;
    const margin = revenue > 0 ? (ebitda / revenue) * 100 : 0;
    return { branch, revenue, costs, ebitda, margin };
  })
    .filter(b => b.revenue !== 0 || b.costs !== 0)
    .sort((a, b) => b.revenue - a.revenue);

  if (branchData.length === 0) {
    return { text: '' };
  }

  const fmt = (v: number) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`;

  return [
    { text: 'Desempenho por Unidade', style: 'sectionTitle' },
    {
      table: {
        headerRows: 1,
        widths: ['*', 'auto', 'auto', 'auto', 'auto'],
        body: [
          [
            { text: 'Unidade', style: 'tableHeader' },
            { text: 'Receita', style: 'tableHeader', alignment: 'right' as const },
            { text: 'Custos', style: 'tableHeader', alignment: 'right' as const },
            { text: 'EBITDA', style: 'tableHeader', alignment: 'right' as const },
            { text: 'Margem', style: 'tableHeader', alignment: 'right' as const },
          ],
          ...branchData.map((b, idx) => [
            { text: b.branch, style: 'tableCell', fillColor: idx % 2 === 0 ? COLORS.altRow : COLORS.white },
            { text: fmt(b.revenue), style: 'tableCell', alignment: 'right' as const, fillColor: idx % 2 === 0 ? COLORS.altRow : COLORS.white },
            { text: fmt(b.costs), style: 'tableCell', alignment: 'right' as const, fillColor: idx % 2 === 0 ? COLORS.altRow : COLORS.white },
            {
              text: fmt(b.ebitda),
              style: 'tableCell',
              alignment: 'right' as const,
              color: b.ebitda >= 0 ? COLORS.success : COLORS.danger,
              bold: true,
              fillColor: idx % 2 === 0 ? COLORS.altRow : COLORS.white,
            },
            {
              text: `${b.margin.toFixed(1)}%`,
              style: 'tableCell',
              alignment: 'right' as const,
              color: b.margin >= 25 ? COLORS.success : b.margin >= 15 ? COLORS.warning : COLORS.danger,
              bold: true,
              fillColor: idx % 2 === 0 ? COLORS.altRow : COLORS.white,
            },
          ]),
        ],
      },
      layout: {
        hLineWidth: () => 0.5,
        vLineWidth: () => 0.5,
        hLineColor: () => COLORS.border,
        vLineColor: () => COLORS.border,
        paddingLeft: () => 6,
        paddingRight: () => 6,
        paddingTop: () => 4,
        paddingBottom: () => 4,
      },
      margin: [0, 0, 0, 15] as [number, number, number, number],
    },
  ];
}

function buildInsightsSection(data: PDFExportData): Content {
  const branchData = BRANCHES.map(branch => {
    const branchTrans = data.transactions.filter(t => t.filial === branch && t.scenario === 'Real');
    const revenue = branchTrans.filter(t => t.type === 'REVENUE').reduce((acc, t) => acc + t.amount, 0);
    const costs = branchTrans.filter(t => t.type !== 'REVENUE').reduce((acc, t) => acc + t.amount, 0);
    const ebitda = revenue - costs;
    const margin = revenue > 0 ? (ebitda / revenue) * 100 : 0;
    return { branch, revenue, ebitda, margin };
  })
    .filter(b => b.revenue !== 0)
    .sort((a, b) => b.revenue - a.revenue);

  const topBranch = branchData[0];
  const totalRevenue = branchData.reduce((acc, b) => acc + b.revenue, 0);
  const totalEbitda = branchData.reduce((acc, b) => acc + b.ebitda, 0);
  const avgMargin = totalRevenue > 0 ? (totalEbitda / totalRevenue) * 100 : 0;

  const insights: Content[] = [];

  if (topBranch) {
    insights.push({
      text: `A ${topBranch.branch} lidera com R$ ${topBranch.revenue.toLocaleString('pt-BR')} em receita (${(topBranch.revenue / totalRevenue * 100).toFixed(0)}% do total).`,
      style: 'insight',
    });
  }

  insights.push({
    text: `Margem EBITDA consolidada: ${avgMargin.toFixed(1)}% ${avgMargin >= 25 ? '(acima da meta de 25%)' : '(abaixo da meta de 25%)'}`,
    style: avgMargin >= 25 ? 'positive' : 'negative',
    margin: [0, 2, 0, 4] as [number, number, number, number],
  });

  const aboveMeta = branchData.filter(b => b.margin >= 25);
  const belowMeta = branchData.filter(b => b.margin < 25 && b.margin > 0);

  if (aboveMeta.length > 0) {
    insights.push({
      text: `${aboveMeta.length} unidade(s) com margem acima de 25%: ${aboveMeta.map(b => b.branch).join(', ')}`,
      style: 'insight',
    });
  }

  if (belowMeta.length > 0) {
    insights.push({
      text: `${belowMeta.length} unidade(s) necessitam atenção (margem < 25%): ${belowMeta.map(b => `${b.branch} (${b.margin.toFixed(1)}%)`).join(', ')}`,
      style: 'insight',
    });
  }

  insights.push({
    text: `Receita por aluno: R$ ${data.kpis.revenuePerStudent.toLocaleString('pt-BR')} | Custo por aluno: R$ ${data.kpis.costPerStudent.toLocaleString('pt-BR')}`,
    style: 'insight',
  });

  return [
    { text: 'Insights e Recomendações', style: 'sectionTitle' },
    ...insights,
  ];
}

// ============================================
// EXPORT TRANSACTIONS TABLE TO PDF
// ============================================

export async function exportTransactionsToPDF(
  transactions: Transaction[],
  options?: { title?: string; period?: string }
): Promise<void> {
  const title = options?.title || 'Relatório de Lançamentos';
  const fmt = (v: number) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

  const content: Content[] = [
    ...buildCoverSection(title, options?.period) as Content[],
    {
      text: `Total de ${transactions.length} lançamentos`,
      style: 'body',
      margin: [0, 0, 0, 10] as [number, number, number, number],
    },
    {
      table: {
        headerRows: 1,
        widths: ['auto', '*', 'auto', 'auto', 'auto'],
        body: [
          [
            { text: 'Data', style: 'tableHeader' },
            { text: 'Descrição', style: 'tableHeader' },
            { text: 'Valor', style: 'tableHeader', alignment: 'right' as const },
            { text: 'Filial', style: 'tableHeader' },
            { text: 'Tipo', style: 'tableHeader' },
          ],
          ...transactions.slice(0, 500).map((t, idx) => [
            {
              text: new Date(t.date).toLocaleDateString('pt-BR'),
              style: 'tableCell',
              fillColor: idx % 2 === 0 ? COLORS.altRow : COLORS.white,
            },
            {
              text: (t.description || '').substring(0, 50),
              style: 'tableCell',
              fillColor: idx % 2 === 0 ? COLORS.altRow : COLORS.white,
            },
            {
              text: fmt(t.amount),
              style: 'tableCell',
              alignment: 'right' as const,
              fillColor: idx % 2 === 0 ? COLORS.altRow : COLORS.white,
            },
            {
              text: t.filial || '',
              style: 'tableCell',
              fillColor: idx % 2 === 0 ? COLORS.altRow : COLORS.white,
            },
            {
              text: t.type || '',
              style: 'tableCell',
              fontSize: 8,
              fillColor: idx % 2 === 0 ? COLORS.altRow : COLORS.white,
            },
          ]),
        ],
      },
      layout: {
        hLineWidth: () => 0.5,
        vLineWidth: () => 0.5,
        hLineColor: () => COLORS.border,
        vLineColor: () => COLORS.border,
        paddingLeft: () => 4,
        paddingRight: () => 4,
        paddingTop: () => 3,
        paddingBottom: () => 3,
      },
    },
  ];

  if (transactions.length > 500) {
    content.push({
      text: `Mostrando 500 de ${transactions.length} lançamentos. Para todos os dados, use exportação XLSX.`,
      style: 'footer',
      margin: [0, 10, 0, 0] as [number, number, number, number],
    });
  }

  const docDefinition: TDocumentDefinitions = {
    pageSize: 'A4',
    pageOrientation: 'landscape',
    pageMargins: [30, 50, 30, 50],
    content,
    styles: PDF_STYLES,
    defaultStyle: { fontSize: 10, color: COLORS.dark },
    footer: (currentPage: number, pageCount: number) => ({
      columns: [
        { text: 'DRE RAIZ', style: 'footer', margin: [30, 0, 0, 0], alignment: 'left' as const, color: COLORS.primary, bold: true },
        { text: `Página ${currentPage} de ${pageCount}`, style: 'footer', margin: [0, 0, 30, 0], alignment: 'right' as const },
      ],
    }),
  };

  const pdf = pdfMake.createPdf(docDefinition);
  pdf.download(`Lancamentos_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.pdf`);
}
