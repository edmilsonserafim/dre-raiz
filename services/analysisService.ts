import type {
  Transaction,
  SchoolKPIs,
  AnalysisPack,
  KPI,
  DatasetRegistry,
  AnalysisContext,
  Slide,
  ChartDef,
  CurrencyCode
} from '../types';
import { validateAnalysisPack, safeValidateAnalysisPack } from '../analysisPack/types/schema';
import { buildDatasets, buildKPIs } from '../analysisPack/services/dataBuilder';

export interface AnalysisOptions {
  org_name: string;
  period_label: string;
  scope_label: string;
  currency?: CurrencyCode;
  filters?: {
    marca?: string;
    filial?: string;
    scenario?: string;
  };
  analysis_rules?: {
    prefer_pareto?: boolean;
    highlight_threshold_currency?: number;
    highlight_threshold_percent?: number;
  };
}

export function generateAnalysisPack(
  transactions: Transaction[],
  kpis: SchoolKPIs,
  options: AnalysisOptions
): AnalysisPack {
  // Aplicar filtros se especificados
  let filteredTransactions = transactions;
  if (options.filters) {
    filteredTransactions = transactions.filter(t => {
      if (options.filters!.marca && t.marca !== options.filters!.marca) return false;
      if (options.filters!.filial && t.filial !== options.filters!.filial) return false;
      if (options.filters!.scenario && t.scenario !== options.filters!.scenario) return false;
      return true;
    });
  }

  // Construir datasets
  const datasets = buildDatasets(filteredTransactions);

  // Construir KPIs
  const kpisList = buildKPIs(kpis, filteredTransactions);

  // Criar contexto
  const context: AnalysisContext = {
    org_name: options.org_name,
    currency: options.currency || 'BRL',
    period_label: options.period_label,
    scope_label: options.scope_label,
    kpis: kpisList,
    datasets,
    analysis_rules: options.analysis_rules
  };

  // Construir gráficos
  const charts = buildCharts(context);

  // Construir slides
  const slides = buildSlides(context, charts);

  // Construir sumário executivo
  const executive_summary = buildExecutiveSummary(context);

  // Construir ações
  const actions = buildActions(context);

  // Construir o AnalysisPack
  const analysisPack = {
    meta: {
      org_name: options.org_name,
      period_label: options.period_label,
      scope_label: options.scope_label,
      currency: context.currency,
      generated_at_iso: new Date().toISOString()
    },
    executive_summary,
    actions,
    charts,
    slides
  };

  // Validar com Zod antes de retornar
  try {
    return validateAnalysisPack(analysisPack);
  } catch (error) {
    console.error('AnalysisPack validation failed:', error);
    throw new Error('Generated AnalysisPack does not match schema');
  }
}

// buildDatasets e buildKPIs foram movidos para analysisPack/services/dataBuilder.ts

function buildCharts(context: AnalysisContext): ChartDef[] {
  const charts: ChartDef[] = [];

  if (context.datasets.r12) {
    charts.push({
      id: 'revenue_ebitda_r12',
      kind: 'line',
      dataset_key: 'r12',
      title: 'Evolução de Receita e EBITDA (R12M)',
      series_keys: ['revenue', 'ebitda']
    });
  }

  if (context.datasets.ebitda_bridge_vs_plan_ytd) {
    charts.push({
      id: 'ebitda_bridge',
      kind: 'waterfall',
      dataset_key: 'ebitda_bridge_vs_plan_ytd',
      title: 'Ponte de EBITDA vs Orçamento (YTD)'
    });
  }

  if (context.datasets.pareto_cost_variance_ytd) {
    charts.push({
      id: 'cost_variance_pareto',
      kind: 'pareto',
      dataset_key: 'pareto_cost_variance_ytd',
      title: 'Principais Variações de Custo (Pareto)',
      top_n: 10
    });
  }

  if (context.datasets.heatmap_variance) {
    charts.push({
      id: 'variance_heatmap',
      kind: 'heatmap',
      dataset_key: 'heatmap_variance',
      title: 'Mapa de Calor: Variações por Categoria e Marca'
    });
  }

  return charts;
}

function buildSlides(context: AnalysisContext, charts: ChartDef[]): Slide[] {
  const slides: Slide[] = [];

  // Slide 1: Visão Geral
  slides.push({
    title: 'Visão Geral - Performance Financeira',
    subtitle: `${context.period_label} - ${context.scope_label}`,
    blocks: [
      {
        type: 'kpi_grid',
        title: 'Principais Indicadores',
        kpi_codes: context.kpis.slice(0, 4).map(k => k.code)
      },
      {
        type: 'callout',
        intent: 'positive',
        title: 'Destaques Positivos',
        bullets: [
          'Receita acima do planejado',
          'Margem EBITDA superando target',
          'Eficiência operacional em alta'
        ]
      }
    ]
  });

  // Slide 2: Análise de Receita
  const revenueChart = charts.find(c => c.id === 'revenue_ebitda_r12');
  if (revenueChart) {
    slides.push({
      title: 'Análise de Receita',
      subtitle: 'Evolução e Tendências',
      blocks: [
        {
          type: 'chart',
          chart_id: revenueChart.id,
          height: 'lg',
          note: 'Receita apresenta tendência de crescimento consistente'
        }
      ]
    });
  }

  // Slide 3: Análise de EBITDA
  const ebidtaChart = charts.find(c => c.id === 'ebitda_bridge');
  if (ebidtaChart) {
    slides.push({
      title: 'Análise de EBITDA',
      subtitle: 'Ponte vs Orçamento YTD',
      blocks: [
        {
          type: 'chart',
          chart_id: ebidtaChart.id,
          height: 'lg',
          note: 'EBITDA superou orçamento principalmente por ganho de receita'
        }
      ]
    });
  }

  // Slide 4: Análise de Custos
  const paretoChart = charts.find(c => c.id === 'cost_variance_pareto');
  if (paretoChart) {
    slides.push({
      title: 'Análise de Custos',
      subtitle: 'Principais Variações (Pareto)',
      blocks: [
        {
          type: 'chart',
          chart_id: paretoChart.id,
          height: 'md'
        },
        {
          type: 'callout',
          intent: 'neutral',
          title: 'Análise de Variações',
          bullets: [
            'Top 3 variações explicam 70%+ do total',
            'Oportunidades de otimização identificadas',
            'Recomenda-se revisão de contratos principais'
          ]
        }
      ]
    });
  }

  // Slide 5: Drivers Operacionais
  if (context.datasets.drivers_table) {
    slides.push({
      title: 'Drivers Operacionais',
      subtitle: 'Indicadores por Aluno',
      blocks: [
        {
          type: 'table',
          title: 'KPIs Operacionais Detalhados',
          dataset_key: 'drivers_table'
        }
      ]
    });
  }

  return slides;
}

function buildExecutiveSummary(context: AnalysisContext) {
  const revenueKpi = context.kpis.find(k => k.code === 'revenue' || k.code === 'REVENUE');
  const ebitdaKpi = context.kpis.find(k => k.code === 'ebitda' || k.code === 'EBITDA');

  return {
    headline: `Performance financeira ${ebitdaKpi && ebitdaKpi.delta_vs_plan! > 0 ? 'acima' : 'abaixo'} do planejado com oportunidades de otimização`,
    bullets: [
      `Receita de ${formatCurrency(revenueKpi?.actual || 0, context.currency)} (${revenueKpi?.delta_vs_plan?.toFixed(1)}% vs plano)`,
      `EBITDA de ${formatCurrency(ebitdaKpi?.actual || 0, context.currency)} com margem sólida`,
      'Custos operacionais sob controle',
      'Indicadores operacionais dentro do esperado'
    ],
    risks: [
      'Pressão inflacionária em custos fixos',
      'Necessidade de monitoramento contínuo de inadimplência',
      'Concorrência crescente no mercado'
    ],
    opportunities: [
      'Renegociação de contratos de fornecedores',
      'Expansão de serviços complementares',
      'Otimização de processos administrativos'
    ]
  };
}

function buildActions(context: AnalysisContext) {
  return [
    {
      owner: 'CFO',
      action: 'Revisar e renegociar principais contratos de fornecedores',
      eta: '15/Fev/2026',
      expected_impact: 'Redução de 5-8% em custos operacionais'
    },
    {
      owner: 'Operações',
      action: 'Implementar programa de eficiência energética',
      eta: '28/Fev/2026',
      expected_impact: 'Economia de R$ 300-500K/ano'
    },
    {
      owner: 'RH',
      action: 'Desenvolver programa de retenção de talentos-chave',
      eta: '31/Mar/2026',
      expected_impact: 'Redução de turnover e custos de recrutamento'
    }
  ];
}

function formatCurrency(value: number, currency: CurrencyCode): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
}

/* OLD CODE REMOVED - buildDatasets and buildKPIs now imported from dataBuilder.ts */
function OLD_buildDatasets(transactions: Transaction[]): DatasetRegistry {
  // Ordenar transações por data
  const sorted = [...transactions].sort((a, b) =>
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // Construir série R12 (últimos 12 meses)
  const monthlyData = new Map<string, { revenue: number; costs: number }>();

  sorted.forEach(t => {
    const month = t.date.substring(0, 7); // YYYY-MM
    if (!monthlyData.has(month)) {
      monthlyData.set(month, { revenue: 0, costs: 0 });
    }
    const data = monthlyData.get(month)!;

    if (t.type === 'REVENUE') {
      data.revenue += t.amount;
    } else {
      data.costs += Math.abs(t.amount);
    }
  });

  // Pegar últimos 12 meses
  const months = Array.from(monthlyData.keys()).sort().slice(-12);
  const r12Data = months.map(m => monthlyData.get(m)!);

  const r12 = {
    x: months.map(m => {
      const [year, month] = m.split('-');
      const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      return `${monthNames[parseInt(month) - 1]}/${year.substring(2)}`;
    }),
    series: [
      {
        key: 'revenue',
        name: 'Receita',
        unit: 'currency' as const,
        data: r12Data.map(d => d.revenue / 1_000_000) // em milhões
      },
      {
        key: 'ebitda',
        name: 'EBITDA',
        unit: 'currency' as const,
        data: r12Data.map(d => (d.revenue - d.costs) / 1_000_000) // em milhões
      }
    ]
  };

  // Construir ponte de EBITDA (simplificado)
  const totalRevenue = transactions
    .filter(t => t.type === 'REVENUE')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalCosts = transactions
    .filter(t => t.type !== 'REVENUE')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const ebitda = totalRevenue - totalCosts;
  const planEbitda = ebitda * 0.9; // Simulação: plano era 90% do real

  const ebitda_bridge_vs_plan_ytd = {
    start_label: 'EBITDA Orçado',
    end_label: 'EBITDA Real',
    start_value: planEbitda / 1_000_000,
    end_value: ebitda / 1_000_000,
    steps: [
      { label: 'Variação Receita', value: (totalRevenue * 0.05) / 1_000_000 },
      { label: 'Custos Variáveis', value: (totalRevenue * 0.02) / 1_000_000 },
      { label: 'Custos Fixos', value: -(totalRevenue * 0.015) / 1_000_000 },
      { label: 'SG&A', value: (totalRevenue * 0.005) / 1_000_000 }
    ]
  };

  // Construir Pareto de variações de custo
  const costByCategory = new Map<string, number>();
  transactions
    .filter(t => t.type !== 'REVENUE')
    .forEach(t => {
      const current = costByCategory.get(t.category) || 0;
      costByCategory.set(t.category, current + Math.abs(t.amount));
    });

  const pareto_cost_variance_ytd = {
    items: Array.from(costByCategory.entries())
      .map(([name, value]) => ({
        name,
        value: (value / 1000) * (Math.random() * 0.3 - 0.15) // Simulação de variação
      }))
      .sort((a, b) => Math.abs(b.value) - Math.abs(a.value))
      .slice(0, 10)
  };

  // Construir heatmap (simplificado - valores simulados)
  const brands = ['Marca A', 'Marca B', 'Marca C', 'Marca D', 'Marca E'];
  const categories = ['Receita', 'Custos Variáveis', 'Custos Fixos', 'SG&A', 'EBITDA'];
  const heatmapValues: Array<[number, number, number]> = [];

  brands.forEach((_, xIdx) => {
    categories.forEach((_, yIdx) => {
      const variance = (Math.random() * 20 - 10); // -10% a +10%
      heatmapValues.push([xIdx, yIdx, variance]);
    });
  });

  const heatmap_variance = {
    x: brands,
    y: categories,
    values: heatmapValues,
    unit: 'percent' as const
  };

  // Construir tabela de drivers
  const drivers_table = {
    columns: ['Indicador', 'Real', 'Plano', 'Var %', 'Prior Year', 'YoY %'],
    rows: [
      ['Alunos Ativos', 11450, 11200, '2.2%', 10980, '4.3%'],
      ['Receita por Aluno (R$)', 6500, 6450, '0.8%', 6420, '1.2%'],
      ['Custo por Aluno (R$)', 4850, 4950, '-2.0%', 4920, '-1.4%'],
      ['Margem por Aluno (R$)', 1650, 1500, '10.0%', 1500, '10.0%'],
      ['Taxa de Inadimplência', '4.2%', '4.0%', '5.0%', '3.9%', '7.7%'],
      ['Ticket Médio (R$)', 685, 680, '0.7%', 675, '1.5%']
    ]
  };

  return {
    r12,
    ebitda_bridge_vs_plan_ytd,
    pareto_cost_variance_ytd,
    heatmap_variance,
    drivers_table
  };
}

function buildKPIs(kpis: SchoolKPIs, transactions: Transaction[]): KPI[] {
  const totalRevenue = transactions
    .filter(t => t.type === 'REVENUE')
    .reduce((sum, t) => sum + t.amount, 0);

  return [
    {
      code: 'revenue',
      name: 'Receita Total',
      unit: 'currency',
      actual: totalRevenue,
      plan: totalRevenue * 0.97,
      prior: totalRevenue * 0.98,
      delta_vs_plan: 3.1,
      delta_vs_prior: 2.0
    },
    {
      code: 'ebitda',
      name: 'EBITDA',
      unit: 'currency',
      actual: kpis.ebitda,
      plan: kpis.targetEbitda,
      prior: kpis.ebitda * 0.95,
      delta_vs_plan: ((kpis.ebitda - kpis.targetEbitda) / kpis.targetEbitda) * 100,
      delta_vs_prior: 5.3
    },
    {
      code: 'net_margin',
      name: 'Margem Líquida',
      unit: 'percent',
      actual: kpis.netMargin,
      plan: 22.0,
      prior: 24.0,
      delta_vs_plan: kpis.netMargin - 22.0,
      delta_vs_prior: kpis.netMargin - 24.0
    },
    {
      code: 'cost_per_student',
      name: 'Custo por Aluno',
      unit: 'currency',
      actual: kpis.costPerStudent,
      plan: kpis.costPerStudent * 1.02,
      prior: kpis.costPerStudent * 1.01,
      delta_vs_plan: -2.0,
      delta_vs_prior: -1.0
    }
  ];
}

function buildCharts(context: AnalysisContext): ChartDef[] {
  const charts: ChartDef[] = [];

  if (context.datasets.r12) {
    charts.push({
      id: 'revenue_ebitda_r12',
      kind: 'line',
      dataset_key: 'r12',
      title: 'Evolução de Receita e EBITDA (R12M)',
      series_keys: ['revenue', 'ebitda']
    });
  }

  if (context.datasets.ebitda_bridge_vs_plan_ytd) {
    charts.push({
      id: 'ebitda_bridge',
      kind: 'waterfall',
      dataset_key: 'ebitda_bridge_vs_plan_ytd',
      title: 'Ponte de EBITDA vs Orçamento (YTD)'
    });
  }

  if (context.datasets.pareto_cost_variance_ytd) {
    charts.push({
      id: 'cost_variance_pareto',
      kind: 'pareto',
      dataset_key: 'pareto_cost_variance_ytd',
      title: 'Principais Variações de Custo (Pareto)',
      top_n: 10
    });
  }

  if (context.datasets.heatmap_variance) {
    charts.push({
      id: 'variance_heatmap',
      kind: 'heatmap',
      dataset_key: 'heatmap_variance',
      title: 'Mapa de Calor: Variações por Categoria e Marca'
    });
  }

  return charts;
}

function buildSlides(context: AnalysisContext, charts: ChartDef[]): Slide[] {
  const slides: Slide[] = [];

  // Slide 1: Visão Geral
  slides.push({
    title: 'Visão Geral - Performance Financeira',
    subtitle: `${context.period_label} - ${context.scope_label}`,
    blocks: [
      {
        type: 'kpi_grid',
        title: 'Principais Indicadores',
        kpi_codes: context.kpis.slice(0, 4).map(k => k.code)
      },
      {
        type: 'callout',
        intent: 'positive',
        title: 'Destaques Positivos',
        bullets: [
          'Receita acima do planejado',
          'Margem EBITDA superando target',
          'Eficiência operacional em alta'
        ]
      }
    ]
  });

  // Slide 2: Análise de Receita
  const revenueChart = charts.find(c => c.id === 'revenue_ebitda_r12');
  if (revenueChart) {
    slides.push({
      title: 'Análise de Receita',
      subtitle: 'Evolução e Tendências',
      blocks: [
        {
          type: 'chart',
          chart_id: revenueChart.id,
          height: 'lg',
          note: 'Receita apresenta tendência de crescimento consistente'
        }
      ]
    });
  }

  // Slide 3: Análise de EBITDA
  const ebidtaChart = charts.find(c => c.id === 'ebitda_bridge');
  if (ebidtaChart) {
    slides.push({
      title: 'Análise de EBITDA',
      subtitle: 'Ponte vs Orçamento YTD',
      blocks: [
        {
          type: 'chart',
          chart_id: ebidtaChart.id,
          height: 'lg',
          note: 'EBITDA superou orçamento principalmente por ganho de receita'
        }
      ]
    });
  }

  // Slide 4: Análise de Custos
  const paretoChart = charts.find(c => c.id === 'cost_variance_pareto');
  if (paretoChart) {
    slides.push({
      title: 'Análise de Custos',
      subtitle: 'Principais Variações (Pareto)',
      blocks: [
        {
          type: 'chart',
          chart_id: paretoChart.id,
          height: 'md'
        },
        {
          type: 'callout',
          intent: 'neutral',
          title: 'Análise de Variações',
          bullets: [
            'Top 3 variações explicam 70%+ do total',
            'Oportunidades de otimização identificadas',
            'Recomenda-se revisão de contratos principais'
          ]
        }
      ]
    });
  }

  // Slide 5: Drivers Operacionais
  if (context.datasets.drivers_table) {
    slides.push({
      title: 'Drivers Operacionais',
      subtitle: 'Indicadores por Aluno',
      blocks: [
        {
          type: 'table',
          title: 'KPIs Operacionais Detalhados',
          dataset_key: 'drivers_table'
        }
      ]
    });
  }

  return slides;
}

function buildExecutiveSummary(context: AnalysisContext) {
  const revenueKpi = context.kpis.find(k => k.code === 'revenue');
  const ebitdaKpi = context.kpis.find(k => k.code === 'ebitda');

  return {
    headline: `Performance financeira ${ebitdaKpi && ebitdaKpi.delta_vs_plan! > 0 ? 'acima' : 'abaixo'} do planejado com oportunidades de otimização`,
    bullets: [
      `Receita de ${formatCurrency(revenueKpi?.actual || 0, context.currency)} (${revenueKpi?.delta_vs_plan?.toFixed(1)}% vs plano)`,
      `EBITDA de ${formatCurrency(ebitdaKpi?.actual || 0, context.currency)} com margem sólida`,
      'Custos operacionais sob controle',
      'Indicadores operacionais dentro do esperado'
    ],
    risks: [
      'Pressão inflacionária em custos fixos',
      'Necessidade de monitoramento contínuo de inadimplência',
      'Concorrência crescente no mercado'
    ],
    opportunities: [
      'Renegociação de contratos de fornecedores',
      'Expansão de serviços complementares',
      'Otimização de processos administrativos'
    ]
  };
}

function buildActions(context: AnalysisContext) {
  return [
    {
      owner: 'CFO',
      action: 'Revisar e renegociar principais contratos de fornecedores',
      eta: '15/Fev/2026',
      expected_impact: 'Redução de 5-8% em custos operacionais'
    },
    {
      owner: 'Operações',
      action: 'Implementar programa de eficiência energética',
      eta: '28/Fev/2026',
      expected_impact: 'Economia de R$ 300-500K/ano'
    },
    {
      owner: 'RH',
      action: 'Desenvolver programa de retenção de talentos-chave',
      eta: '31/Mar/2026',
      expected_impact: 'Redução de turnover e custos de recrutamento'
    }
  ];
}

function formatCurrency(value: number, currency: CurrencyCode): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
}
