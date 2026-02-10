/**
 * DOCX Export Service
 * Gera documentos Word a partir de dados financeiros DRE
 * Usa biblioteca docx para geração client-side
 */

import {
  Document,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  BorderStyle,
  ShadingType,
  HeadingLevel,
  Packer,
  PageBreak,
  TabStopPosition,
  TabStopType,
} from 'docx';
import { saveAs } from 'file-saver';
import { SchoolKPIs, Transaction } from '../types';
import { BRANCHES } from '../constants';

// ============================================
// COLORS (hex sem #)
// ============================================

const COLORS = {
  primary: '1B75BB',
  accent: 'F44C00',
  teal: '7AC5BF',
  dark: '1F2937',
  medium: '6B7280',
  light: 'F3F4F6',
  white: 'FFFFFF',
  success: '10B981',
  danger: 'EF4444',
  warning: 'F59E0B',
  headerBg: '1B75BB',
  altRow: 'F8FAFC',
  border: 'E5E7EB',
};

// ============================================
// INTERFACES
// ============================================

export interface DOCXExportOptions {
  includeKPIs?: boolean;
  includeMonthly?: boolean;
  includeBranches?: boolean;
  includeInsights?: boolean;
  title?: string;
  period?: string;
}

export interface DOCXExportData {
  kpis: SchoolKPIs;
  transactions: Transaction[];
  selectedBrand?: string;
  selectedBranch?: string;
}

// ============================================
// HELPERS
// ============================================

function fmtCurrency(value: number): string {
  return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`;
}

function fmtCurrencyK(value: number): string {
  return `R$ ${(value / 1000).toFixed(0)}K`;
}

function createTableBorders() {
  const border = {
    style: BorderStyle.SINGLE,
    size: 1,
    color: COLORS.border,
  };
  return {
    top: border,
    bottom: border,
    left: border,
    right: border,
  };
}

function headerCell(text: string, width?: number): TableCell {
  return new TableCell({
    children: [
      new Paragraph({
        children: [
          new TextRun({
            text,
            bold: true,
            color: COLORS.white,
            size: 20,
            font: 'Calibri',
          }),
        ],
        alignment: AlignmentType.LEFT,
      }),
    ],
    shading: { type: ShadingType.SOLID, color: COLORS.headerBg },
    width: width ? { size: width, type: WidthType.PERCENTAGE } : undefined,
    borders: createTableBorders(),
  });
}

function dataCell(text: string, options?: {
  alignment?: (typeof AlignmentType)[keyof typeof AlignmentType];
  color?: string;
  bold?: boolean;
  shading?: string;
}): TableCell {
  return new TableCell({
    children: [
      new Paragraph({
        children: [
          new TextRun({
            text,
            color: options?.color || COLORS.dark,
            bold: options?.bold || false,
            size: 20,
            font: 'Calibri',
          }),
        ],
        alignment: options?.alignment || AlignmentType.LEFT,
      }),
    ],
    shading: options?.shading
      ? { type: ShadingType.SOLID, color: options.shading }
      : undefined,
    borders: createTableBorders(),
  });
}

// ============================================
// MAIN EXPORT FUNCTION
// ============================================

export async function exportDashboardToDOCX(
  data: DOCXExportData,
  options: DOCXExportOptions = {}
): Promise<void> {
  const {
    includeKPIs = true,
    includeMonthly = true,
    includeBranches = true,
    includeInsights = true,
    title = 'Relatório Executivo DRE',
    period,
  } = options;

  const sections: Paragraph[] = [];
  const tables: (Paragraph | Table)[] = [];

  // ---- TÍTULO ----
  sections.push(
    new Paragraph({
      children: [
        new TextRun({
          text: title,
          bold: true,
          color: COLORS.primary,
          size: 48,
          font: 'Calibri',
        }),
      ],
      heading: HeadingLevel.TITLE,
      spacing: { after: 100 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: period || `Raiz Educação S.A. • ${new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}`,
          color: COLORS.medium,
          size: 24,
          font: 'Calibri',
        }),
      ],
      spacing: { after: 300 },
    }),
  );

  // ---- KPIs ----
  if (includeKPIs) {
    sections.push(
      new Paragraph({
        children: [
          new TextRun({
            text: 'Indicadores Principais',
            bold: true,
            color: COLORS.primary,
            size: 32,
            font: 'Calibri',
          }),
        ],
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 300, after: 150 },
      }),
    );

    const kpiList = [
      { label: 'Receita Líquida', value: fmtCurrency(data.kpis.totalRevenue) },
      { label: 'EBITDA', value: fmtCurrency(data.kpis.ebitda) },
      { label: 'Margem EBITDA', value: `${data.kpis.netMargin.toFixed(1)}%` },
      { label: 'Alunos Ativos', value: data.kpis.activeStudents.toLocaleString('pt-BR') },
      { label: 'Receita/Aluno', value: fmtCurrency(data.kpis.revenuePerStudent) },
      { label: 'Custo/Aluno', value: fmtCurrency(data.kpis.costPerStudent) },
    ];

    const kpiTable = new Table({
      rows: [
        new TableRow({
          children: [
            headerCell('Indicador', 50),
            headerCell('Valor', 50),
          ],
        }),
        ...kpiList.map((kpi, idx) =>
          new TableRow({
            children: [
              dataCell(kpi.label, { shading: idx % 2 === 0 ? COLORS.altRow : COLORS.white }),
              dataCell(kpi.value, {
                alignment: AlignmentType.RIGHT,
                bold: true,
                shading: idx % 2 === 0 ? COLORS.altRow : COLORS.white,
              }),
            ],
          }),
        ),
      ],
      width: { size: 100, type: WidthType.PERCENTAGE },
    });

    tables.push(kpiTable);
    tables.push(new Paragraph({ spacing: { after: 200 } }));
  }

  // ---- EVOLUÇÃO MENSAL ----
  if (includeMonthly) {
    const months = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
    const realTrans = data.transactions.filter(t => t.scenario === 'Real');

    const monthlyData = months.map((month, index) => {
      const monthTrans = realTrans.filter(t => parseInt(t.date.substring(5, 7), 10) - 1 === index);
      const revenue = monthTrans.filter(t => t.type === 'REVENUE').reduce((acc, t) => acc + t.amount, 0);
      const costs = monthTrans.filter(t => t.type !== 'REVENUE').reduce((acc, t) => acc + t.amount, 0);
      const ebitda = revenue - costs;
      return { month, revenue, costs, ebitda };
    }).filter(d => d.revenue !== 0 || d.costs !== 0);

    if (monthlyData.length > 0) {
      tables.push(
        new Paragraph({
          children: [
            new TextRun({
              text: 'Evolução Mensal',
              bold: true,
              color: COLORS.primary,
              size: 32,
              font: 'Calibri',
            }),
          ],
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 300, after: 150 },
        }),
      );

      const monthlyTable = new Table({
        rows: [
          new TableRow({
            children: [
              headerCell('Mês', 20),
              headerCell('Receita', 27),
              headerCell('Custos', 27),
              headerCell('EBITDA', 26),
            ],
          }),
          ...monthlyData.map((d, idx) =>
            new TableRow({
              children: [
                dataCell(d.month, { shading: idx % 2 === 0 ? COLORS.altRow : COLORS.white }),
                dataCell(fmtCurrencyK(d.revenue), {
                  alignment: AlignmentType.RIGHT,
                  shading: idx % 2 === 0 ? COLORS.altRow : COLORS.white,
                }),
                dataCell(fmtCurrencyK(d.costs), {
                  alignment: AlignmentType.RIGHT,
                  shading: idx % 2 === 0 ? COLORS.altRow : COLORS.white,
                }),
                dataCell(fmtCurrencyK(d.ebitda), {
                  alignment: AlignmentType.RIGHT,
                  bold: true,
                  color: d.ebitda >= 0 ? COLORS.success : COLORS.danger,
                  shading: idx % 2 === 0 ? COLORS.altRow : COLORS.white,
                }),
              ],
            }),
          ),
        ],
        width: { size: 100, type: WidthType.PERCENTAGE },
      });

      tables.push(monthlyTable);
      tables.push(new Paragraph({ spacing: { after: 200 } }));
    }
  }

  // ---- DESEMPENHO POR UNIDADE ----
  if (includeBranches) {
    const branchData = BRANCHES.map(branch => {
      const branchTrans = data.transactions.filter(t => t.filial === branch && t.scenario === 'Real');
      const revenue = branchTrans.filter(t => t.type === 'REVENUE').reduce((acc, t) => acc + t.amount, 0);
      const costs = branchTrans.filter(t => t.type !== 'REVENUE').reduce((acc, t) => acc + t.amount, 0);
      const ebitda = revenue - costs;
      const margin = revenue > 0 ? (ebitda / revenue) * 100 : 0;
      return { branch, revenue, costs, ebitda, margin };
    })
      .filter(b => b.revenue !== 0 || b.costs !== 0)
      .sort((a, b) => b.revenue - a.revenue);

    if (branchData.length > 0) {
      tables.push(
        new Paragraph({
          children: [
            new TextRun({
              text: 'Desempenho por Unidade',
              bold: true,
              color: COLORS.primary,
              size: 32,
              font: 'Calibri',
            }),
          ],
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 300, after: 150 },
        }),
      );

      const branchTable = new Table({
        rows: [
          new TableRow({
            children: [
              headerCell('Unidade', 25),
              headerCell('Receita', 20),
              headerCell('Custos', 20),
              headerCell('EBITDA', 20),
              headerCell('Margem', 15),
            ],
          }),
          ...branchData.map((b, idx) =>
            new TableRow({
              children: [
                dataCell(b.branch, { shading: idx % 2 === 0 ? COLORS.altRow : COLORS.white }),
                dataCell(fmtCurrency(b.revenue), {
                  alignment: AlignmentType.RIGHT,
                  shading: idx % 2 === 0 ? COLORS.altRow : COLORS.white,
                }),
                dataCell(fmtCurrency(b.costs), {
                  alignment: AlignmentType.RIGHT,
                  shading: idx % 2 === 0 ? COLORS.altRow : COLORS.white,
                }),
                dataCell(fmtCurrency(b.ebitda), {
                  alignment: AlignmentType.RIGHT,
                  bold: true,
                  color: b.ebitda >= 0 ? COLORS.success : COLORS.danger,
                  shading: idx % 2 === 0 ? COLORS.altRow : COLORS.white,
                }),
                dataCell(`${b.margin.toFixed(1)}%`, {
                  alignment: AlignmentType.RIGHT,
                  bold: true,
                  color: b.margin >= 25 ? COLORS.success : b.margin >= 15 ? COLORS.warning : COLORS.danger,
                  shading: idx % 2 === 0 ? COLORS.altRow : COLORS.white,
                }),
              ],
            }),
          ),
        ],
        width: { size: 100, type: WidthType.PERCENTAGE },
      });

      tables.push(branchTable);
      tables.push(new Paragraph({ spacing: { after: 200 } }));
    }
  }

  // ---- INSIGHTS ----
  if (includeInsights) {
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

    const totalRevenue = branchData.reduce((acc, b) => acc + b.revenue, 0);
    const totalEbitda = branchData.reduce((acc, b) => acc + b.ebitda, 0);
    const avgMargin = totalRevenue > 0 ? (totalEbitda / totalRevenue) * 100 : 0;

    tables.push(
      new Paragraph({
        children: [
          new TextRun({
            text: 'Insights e Recomendações',
            bold: true,
            color: COLORS.primary,
            size: 32,
            font: 'Calibri',
          }),
        ],
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 300, after: 150 },
      }),
    );

    const insights = [
      branchData[0] ? `A ${branchData[0].branch} lidera com ${fmtCurrency(branchData[0].revenue)} em receita (${(branchData[0].revenue / totalRevenue * 100).toFixed(0)}% do total).` : '',
      `Margem EBITDA consolidada: ${avgMargin.toFixed(1)}% ${avgMargin >= 25 ? '(acima da meta de 25%)' : '(abaixo da meta de 25%)'}`,
      `${branchData.filter(b => b.margin >= 25).length} unidade(s) com margem acima da meta de 25%`,
      `Receita por aluno: ${fmtCurrency(data.kpis.revenuePerStudent)} | Custo por aluno: ${fmtCurrency(data.kpis.costPerStudent)}`,
    ].filter(Boolean);

    insights.forEach(insight => {
      tables.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `• ${insight}`,
              size: 22,
              font: 'Calibri',
              color: COLORS.dark,
            }),
          ],
          spacing: { after: 80 },
        }),
      );
    });
  }

  // ---- BUILD DOCUMENT ----
  const doc = new Document({
    creator: 'DRE RAIZ - Raiz Educação',
    title,
    description: 'Relatório Financeiro - DRE RAIZ',
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1440,
              right: 1440,
              bottom: 1440,
              left: 1440,
            },
          },
        },
        children: [...sections, ...tables],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `Relatorio_DRE_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.docx`);
}

// ============================================
// EXPORT TRANSACTIONS TO DOCX
// ============================================

export async function exportTransactionsToDOCX(
  transactions: Transaction[],
  options?: { title?: string; period?: string }
): Promise<void> {
  const title = options?.title || 'Relatório de Lançamentos';
  const maxRows = 500;
  const limitedTrans = transactions.slice(0, maxRows);

  const doc = new Document({
    creator: 'DRE RAIZ - Raiz Educação',
    title,
    sections: [
      {
        properties: {
          page: {
            size: { orientation: 'landscape' },
            margin: { top: 720, right: 720, bottom: 720, left: 720 },
          },
        },
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: title,
                bold: true,
                color: COLORS.primary,
                size: 40,
                font: 'Calibri',
              }),
            ],
            spacing: { after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `Total: ${transactions.length} lançamentos ${transactions.length > maxRows ? `(mostrando ${maxRows})` : ''}`,
                color: COLORS.medium,
                size: 20,
                font: 'Calibri',
              }),
            ],
            spacing: { after: 200 },
          }),
          new Table({
            rows: [
              new TableRow({
                children: [
                  headerCell('Data', 12),
                  headerCell('Descrição', 35),
                  headerCell('Valor', 15),
                  headerCell('Filial', 15),
                  headerCell('Conta', 13),
                  headerCell('Tipo', 10),
                ],
              }),
              ...limitedTrans.map((t, idx) =>
                new TableRow({
                  children: [
                    dataCell(new Date(t.date).toLocaleDateString('pt-BR'), {
                      shading: idx % 2 === 0 ? COLORS.altRow : COLORS.white,
                    }),
                    dataCell((t.description || '').substring(0, 60), {
                      shading: idx % 2 === 0 ? COLORS.altRow : COLORS.white,
                    }),
                    dataCell(`R$ ${t.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, {
                      alignment: AlignmentType.RIGHT,
                      shading: idx % 2 === 0 ? COLORS.altRow : COLORS.white,
                    }),
                    dataCell(t.filial || '', {
                      shading: idx % 2 === 0 ? COLORS.altRow : COLORS.white,
                    }),
                    dataCell(t.conta_contabil || '', {
                      shading: idx % 2 === 0 ? COLORS.altRow : COLORS.white,
                    }),
                    dataCell(t.type || '', {
                      shading: idx % 2 === 0 ? COLORS.altRow : COLORS.white,
                    }),
                  ],
                }),
              ),
            ],
            width: { size: 100, type: WidthType.PERCENTAGE },
          }),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `Lancamentos_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.docx`);
}
