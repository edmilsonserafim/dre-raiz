/**
 * PPT Export Service
 * Gera apresentações PowerPoint a partir dos dados do dashboard
 */

import pptxgen from 'pptxgenjs';
import { SchoolKPIs, Transaction } from '../types';
import { BRANCHES } from '../constants';

interface ExportData {
  kpis: SchoolKPIs;
  transactions: Transaction[];
  selectedBrand?: string;
  selectedBranch?: string;
}

/**
 * Gera dados mensais agregados
 */
const getMonthlyData = (transactions: Transaction[]) => {
  const months = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
  const realTrans = transactions.filter(t => t.scenario === 'Real');

  return months.map((month, index) => {
    const monthTrans = realTrans.filter(t => new Date(t.date).getMonth() === index);
    const revenue = monthTrans.filter(t => t.type === 'REVENUE').reduce((acc, t) => acc + t.amount, 0);
    const costs = monthTrans.filter(t => t.type !== 'REVENUE').reduce((acc, t) => acc + t.amount, 0);
    const ebitda = revenue - costs;

    return {
      month,
      revenue,
      ebitda,
      costs
    };
  });
};

/**
 * Gera dados por unidade
 */
const getBranchData = (transactions: Transaction[]) => {
  return BRANCHES.map(branch => {
    const branchTrans = transactions.filter(t => t.filial === branch && t.scenario === 'Real');
    const revenue = branchTrans.filter(t => t.type === 'REVENUE').reduce((acc, t) => acc + t.amount, 0);
    const costs = branchTrans.filter(t => t.type !== 'REVENUE').reduce((acc, t) => acc + t.amount, 0);
    const ebitda = revenue - costs;
    const margin = revenue > 0 ? (ebitda / revenue) * 100 : 0;

    return {
      branch,
      revenue,
      costs,
      ebitda,
      margin
    };
  }).sort((a, b) => b.revenue - a.revenue);
};

/**
 * Exporta Dashboard para PowerPoint
 */
export const exportDashboardToPPT = async (data: ExportData): Promise<void> => {
  const pptx = new pptxgen();

  // Configurações globais
  pptx.author = 'RAIZ Educação';
  pptx.company = 'Raiz Educação S.A.';
  pptx.subject = 'Dashboard Financeiro DRE';
  pptx.title = 'Relatório Executivo - DRE RAIZ';

  // Cores do tema
  const colors = {
    primary: '1B75BB',
    secondary: 'F44C00',
    accent: '7AC5BF',
    gray: '6B7280',
    light: 'F3F4F6',
    white: 'FFFFFF'
  };

  // ============================================
  // SLIDE 1: CAPA
  // ============================================
  const slide1 = pptx.addSlide();
  slide1.background = { color: colors.primary };

  slide1.addText('Dashboard Executivo', {
    x: 0.5,
    y: 2.0,
    w: 9,
    h: 1.5,
    fontSize: 48,
    bold: true,
    color: colors.white,
    align: 'center'
  });

  slide1.addText('DRE - RAIZ Educação', {
    x: 0.5,
    y: 3.5,
    w: 9,
    h: 0.8,
    fontSize: 28,
    color: colors.accent,
    align: 'center'
  });

  slide1.addText(new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  }), {
    x: 0.5,
    y: 5.0,
    w: 9,
    h: 0.5,
    fontSize: 16,
    color: colors.white,
    align: 'center'
  });

  // ============================================
  // SLIDE 2: KPIs PRINCIPAIS
  // ============================================
  const slide2 = pptx.addSlide();
  slide2.background = { color: colors.white };

  // Título
  slide2.addText('Indicadores Principais', {
    x: 0.5,
    y: 0.3,
    w: 9,
    h: 0.6,
    fontSize: 32,
    bold: true,
    color: colors.primary
  });

  // KPIs em cards
  const kpiData = [
    { label: 'Receita Líquida', value: data.kpis.totalRevenue, format: 'currency' },
    { label: 'EBITDA', value: data.kpis.ebitda, format: 'currency' },
    { label: 'Margem EBITDA', value: data.kpis.netMargin, format: 'percent' },
    { label: 'Alunos Ativos', value: data.kpis.activeStudents, format: 'number' }
  ];

  kpiData.forEach((kpi, index) => {
    const x = 0.5 + (index % 2) * 4.75;
    const y = 1.2 + Math.floor(index / 2) * 2;

    // Card background
    slide2.addShape(pptx.ShapeType.rect, {
      x,
      y,
      w: 4.25,
      h: 1.5,
      fill: { color: colors.light },
      line: { color: colors.gray, width: 1 }
    });

    // Label
    slide2.addText(kpi.label, {
      x,
      y: y + 0.2,
      w: 4.25,
      h: 0.4,
      fontSize: 14,
      bold: true,
      color: colors.gray,
      align: 'center'
    });

    // Value
    const formattedValue =
      kpi.format === 'currency'
        ? `R$ ${kpi.value.toLocaleString('pt-BR')}`
        : kpi.format === 'percent'
        ? `${kpi.value.toFixed(1)}%`
        : kpi.value.toLocaleString('pt-BR');

    slide2.addText(formattedValue, {
      x,
      y: y + 0.7,
      w: 4.25,
      h: 0.6,
      fontSize: 24,
      bold: true,
      color: colors.primary,
      align: 'center'
    });
  });

  // ============================================
  // SLIDE 3: EVOLUÇÃO MENSAL
  // ============================================
  const slide3 = pptx.addSlide();
  slide3.background = { color: colors.white };

  slide3.addText('Evolução Mensal', {
    x: 0.5,
    y: 0.3,
    w: 9,
    h: 0.6,
    fontSize: 32,
    bold: true,
    color: colors.primary
  });

  const monthlyData = getMonthlyData(data.transactions);

  // Dados para o gráfico
  const chartData = monthlyData.map(d => ({
    name: d.month,
    labels: [d.month],
    values: [d.revenue / 1000] // Em milhares
  }));

  slide3.addChart(pptx.ChartType.bar, chartData, {
    x: 0.5,
    y: 1.2,
    w: 9,
    h: 4,
    showTitle: false,
    showLegend: false,
    barDir: 'col',
    catAxisLabelColor: colors.gray,
    catAxisLabelFontSize: 10,
    valAxisLabelColor: colors.gray,
    valAxisLabelFontSize: 10,
    valAxisTitle: 'Receita (R$ mil)',
    chartColors: [colors.primary]
  });

  // ============================================
  // SLIDE 4: DESEMPENHO POR UNIDADE
  // ============================================
  const slide4 = pptx.addSlide();
  slide4.background = { color: colors.white };

  slide4.addText('Desempenho por Unidade', {
    x: 0.5,
    y: 0.3,
    w: 9,
    h: 0.6,
    fontSize: 32,
    bold: true,
    color: colors.primary
  });

  const branchData = getBranchData(data.transactions);

  // Tabela
  const tableData = [
    // Header
    [
      { text: 'Unidade', options: { bold: true, color: colors.white, fill: colors.primary } },
      { text: 'Receita', options: { bold: true, color: colors.white, fill: colors.primary, align: 'right' } },
      { text: 'Custos', options: { bold: true, color: colors.white, fill: colors.primary, align: 'right' } },
      { text: 'EBITDA', options: { bold: true, color: colors.white, fill: colors.primary, align: 'right' } },
      { text: 'Margem %', options: { bold: true, color: colors.white, fill: colors.primary, align: 'right' } }
    ],
    // Dados
    ...branchData.map((b, index) => [
      { text: b.branch, options: { fill: index % 2 === 0 ? colors.light : colors.white } },
      {
        text: `R$ ${b.revenue.toLocaleString('pt-BR')}`,
        options: { align: 'right', fill: index % 2 === 0 ? colors.light : colors.white }
      },
      {
        text: `R$ ${b.costs.toLocaleString('pt-BR')}`,
        options: { align: 'right', fill: index % 2 === 0 ? colors.light : colors.white }
      },
      {
        text: `R$ ${b.ebitda.toLocaleString('pt-BR')}`,
        options: {
          align: 'right',
          color: b.ebitda >= 0 ? '10B981' : 'EF4444',
          bold: true,
          fill: index % 2 === 0 ? colors.light : colors.white
        }
      },
      {
        text: `${b.margin.toFixed(1)}%`,
        options: {
          align: 'right',
          color: b.margin >= 25 ? '10B981' : 'F59E0B',
          bold: true,
          fill: index % 2 === 0 ? colors.light : colors.white
        }
      }
    ])
  ];

  slide4.addTable(tableData, {
    x: 0.5,
    y: 1.2,
    w: 9,
    h: 4,
    fontSize: 12,
    border: { pt: 1, color: colors.gray }
  });

  // ============================================
  // SLIDE 5: RESUMO EXECUTIVO
  // ============================================
  const slide5 = pptx.addSlide();
  slide5.background = { color: colors.white };

  slide5.addText('Resumo Executivo', {
    x: 0.5,
    y: 0.3,
    w: 9,
    h: 0.6,
    fontSize: 32,
    bold: true,
    color: colors.primary
  });

  // Calcular insights
  const topBranch = branchData[0];
  const totalRevenue = branchData.reduce((acc, b) => acc + b.revenue, 0);
  const totalEbitda = branchData.reduce((acc, b) => acc + b.ebitda, 0);
  const avgMargin = (totalEbitda / totalRevenue) * 100;

  const insights = [
    `• A ${topBranch.branch} lidera com R$ ${topBranch.revenue.toLocaleString('pt-BR')} em receita`,
    `• Margem EBITDA consolidada de ${avgMargin.toFixed(1)}%`,
    `• Total de ${data.kpis.activeStudents} alunos ativos`,
    `• Receita por aluno de R$ ${data.kpis.revenuePerStudent.toLocaleString('pt-BR')}`,
    `• Meta de margem: ${data.kpis.netMargin >= 25 ? '✓ Atingida' : '✗ Não atingida'} (25%)`
  ];

  insights.forEach((insight, index) => {
    slide5.addText(insight, {
      x: 1,
      y: 1.5 + index * 0.6,
      w: 8,
      h: 0.5,
      fontSize: 16,
      color: colors.gray,
      bullet: false
    });
  });

  // Adicionar nota de rodapé
  slide5.addText('Gerado automaticamente pelo Sistema DRE - RAIZ', {
    x: 0.5,
    y: 5.2,
    w: 9,
    h: 0.3,
    fontSize: 10,
    color: colors.gray,
    align: 'center',
    italic: true
  });

  // ============================================
  // SALVAR ARQUIVO
  // ============================================
  const fileName = `Dashboard_DRE_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.pptx`;
  await pptx.writeFile({ fileName });

  console.log(`✅ Apresentação exportada: ${fileName}`);
};

/**
 * Exporta apenas KPIs para PPT (versão simplificada)
 */
export const exportKPIsToPPT = async (kpis: SchoolKPIs): Promise<void> => {
  const pptx = new pptxgen();

  pptx.author = 'RAIZ Educação';
  pptx.title = 'KPIs - DRE RAIZ';

  const slide = pptx.addSlide();
  slide.background = { color: 'F3F4F6' };

  slide.addText('KPIs Principais', {
    x: 0.5,
    y: 0.5,
    w: 9,
    h: 0.8,
    fontSize: 36,
    bold: true,
    color: '1B75BB'
  });

  const kpiList = [
    `Receita: R$ ${kpis.totalRevenue.toLocaleString('pt-BR')}`,
    `EBITDA: R$ ${kpis.ebitda.toLocaleString('pt-BR')}`,
    `Margem: ${kpis.netMargin.toFixed(1)}%`,
    `Alunos: ${kpis.activeStudents}`
  ];

  kpiList.forEach((kpi, index) => {
    slide.addText(kpi, {
      x: 1,
      y: 2 + index * 0.7,
      w: 8,
      h: 0.6,
      fontSize: 24,
      color: '374151'
    });
  });

  const fileName = `KPIs_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.pptx`;
  await pptx.writeFile({ fileName });
};
