import type { Transaction, SchoolKPIs, KPI, DatasetRegistry, CurrencyCode } from "../../types";

/**
 * Constrói todos os datasets a partir de transações
 */
export function buildDatasets(transactions: Transaction[]): DatasetRegistry {
  // Ordenar transações por data
  const sorted = [...transactions].sort((a, b) =>
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // Construir série R12 (últimos 12 meses)
  const monthlyData = new Map<string, { revenue: number; costs: number; ebitda: number }>();

  sorted.forEach(t => {
    const month = t.date.substring(0, 7); // YYYY-MM
    if (!monthlyData.has(month)) {
      monthlyData.set(month, { revenue: 0, costs: 0, ebitda: 0 });
    }
    const data = monthlyData.get(month)!;

    if (t.type === 'REVENUE') {
      data.revenue += t.amount;
    } else {
      data.costs += Math.abs(t.amount);
    }
    data.ebitda = data.revenue - data.costs;
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
        data: r12Data.map(d => d.revenue)
      },
      {
        key: 'ebitda',
        name: 'EBITDA',
        unit: 'currency' as const,
        data: r12Data.map(d => d.ebitda)
      },
      {
        key: 'costs',
        name: 'Custos Totais',
        unit: 'currency' as const,
        data: r12Data.map(d => d.costs)
      }
    ]
  };

  // Construir ponte de EBITDA
  const totalRevenue = transactions
    .filter(t => t.type === 'REVENUE')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalFixedCosts = transactions
    .filter(t => t.type === 'FIXED_COST')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const totalVariableCosts = transactions
    .filter(t => t.type === 'VARIABLE_COST')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const sgaCosts = transactions
    .filter(t => t.type === 'SGA')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const rateioCosts = transactions
    .filter(t => t.type === 'RATEIO')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const ebitdaReal = totalRevenue - totalFixedCosts - totalVariableCosts - sgaCosts - rateioCosts;

  // Simulação: plano era 95% do real (ajuste conforme sua lógica de orçamento)
  const ebitdaPlano = ebitdaReal * 0.95;
  const revenueGap = totalRevenue * 0.05;

  const ebitda_bridge_vs_plan_ytd = {
    start_label: 'EBITDA Orçado',
    end_label: 'EBITDA Real',
    start_value: ebitdaPlano,
    end_value: ebitdaReal,
    steps: [
      { label: 'Gap Receita', value: revenueGap * 0.15 },
      { label: 'Custos Variáveis', value: -totalVariableCosts * 0.05 },
      { label: 'Custos Fixos', value: -totalFixedCosts * 0.03 },
      { label: 'SG&A', value: -sgaCosts * 0.08 },
      { label: 'Outros', value: (ebitdaReal - ebitdaPlano) - (revenueGap * 0.15 - totalVariableCosts * 0.05 - totalFixedCosts * 0.03 - sgaCosts * 0.08) }
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

  // Simulação de variações (você pode substituir por lógica real de comparação com orçamento)
  const pareto_cost_variance_ytd = {
    items: Array.from(costByCategory.entries())
      .map(([name, value]) => ({
        name,
        value: value * (Math.random() * 0.15 - 0.05) // Simulação: -5% a +10% de variação
      }))
      .sort((a, b) => Math.abs(b.value) - Math.abs(a.value))
      .slice(0, 10)
  };

  // Construir heatmap de variações por marca/categoria
  const brands = Array.from(new Set(transactions.map(t => t.marca).filter(b => b)));
  const categories = ['REVENUE', 'FIXED_COST', 'VARIABLE_COST', 'SGA', 'RATEIO'];
  const heatmapValues: Array<[number, number, number]> = [];

  brands.forEach((brand, xIdx) => {
    categories.forEach((category, yIdx) => {
      const categoryTransactions = transactions.filter(
        t => t.marca === brand && (t.type === category || (category === 'REVENUE' && t.type === 'REVENUE'))
      );
      const total = categoryTransactions.reduce((sum, t) => sum + (t.type === 'REVENUE' ? t.amount : Math.abs(t.amount)), 0);

      // Simulação de variação % vs orçamento
      const variance = (Math.random() * 20 - 10); // -10% a +10%
      heatmapValues.push([xIdx, yIdx, variance]);
    });
  });

  const heatmap_variance = {
    x: brands.length > 0 ? brands : ['Marca A', 'Marca B', 'Marca C'],
    y: ['Receita', 'Custos Fixos', 'Custos Variáveis', 'SG&A', 'Rateio'],
    values: heatmapValues.length > 0 ? heatmapValues : [
      [0, 0, 5], [0, 1, -3], [0, 2, 2], [0, 3, -1], [0, 4, 0],
      [1, 0, -2], [1, 1, 4], [1, 2, -5], [1, 3, 1], [1, 4, 0],
      [2, 0, 3], [2, 1, -1], [2, 2, 0], [2, 3, -2], [2, 4, 1]
    ],
    unit: 'percent' as const
  };

  // Construir tabela de drivers
  const drivers_table = {
    columns: ['Indicador', 'Real', 'Plano', 'Var %', 'Prior Year', 'YoY %'],
    rows: [
      ['Receita Total', totalRevenue, totalRevenue * 0.97, '3.1%', totalRevenue * 0.95, '5.3%'],
      ['EBITDA', ebitdaReal, ebitdaPlano, ((ebitdaReal - ebitdaPlano) / ebitdaPlano * 100).toFixed(1) + '%', ebitdaReal * 0.92, '8.7%'],
      ['Custos Fixos', totalFixedCosts, totalFixedCosts * 1.02, '-2.0%', totalFixedCosts * 0.98, '2.0%'],
      ['Custos Variáveis', totalVariableCosts, totalVariableCosts * 1.03, '-2.9%', totalVariableCosts * 0.97, '3.1%'],
      ['SG&A', sgaCosts, sgaCosts * 1.05, '-4.8%', sgaCosts * 0.95, '5.3%'],
      ['Margem EBITDA %', ((ebitdaReal / totalRevenue) * 100).toFixed(1) + '%', '15.0%', '2.3pp', '14.2%', '1.1pp']
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

/**
 * Constrói lista de KPIs formatados
 */
export function buildKPIs(kpis: SchoolKPIs, transactions: Transaction[]): KPI[] {
  const totalRevenue = transactions
    .filter(t => t.type === 'REVENUE')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalCosts = transactions
    .filter(t => t.type !== 'REVENUE')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  // Simulação de valores de plano e prior (ajuste conforme sua lógica)
  const revenuePlan = totalRevenue * 0.97;
  const revenuePrior = totalRevenue * 0.95;
  const ebitdaPlan = kpis.targetEbitda;
  const ebitdaPrior = kpis.ebitda * 0.92;

  return [
    {
      code: 'REVENUE',
      name: 'Receita Líquida',
      unit: 'currency',
      actual: totalRevenue,
      plan: revenuePlan,
      prior: revenuePrior,
      delta_vs_plan: ((totalRevenue - revenuePlan) / revenuePlan) * 100,
      delta_vs_prior: ((totalRevenue - revenuePrior) / revenuePrior) * 100
    },
    {
      code: 'EBITDA',
      name: 'EBITDA',
      unit: 'currency',
      actual: kpis.ebitda,
      plan: ebitdaPlan,
      prior: ebitdaPrior,
      delta_vs_plan: ((kpis.ebitda - ebitdaPlan) / ebitdaPlan) * 100,
      delta_vs_prior: ((kpis.ebitda - ebitdaPrior) / ebitdaPrior) * 100
    },
    {
      code: 'MARGIN',
      name: 'Margem EBITDA',
      unit: 'percent',
      actual: kpis.netMargin / 100,
      plan: 0.15,
      prior: 0.142,
      delta_vs_plan: (kpis.netMargin / 100) - 0.15,
      delta_vs_prior: (kpis.netMargin / 100) - 0.142
    },
    {
      code: 'OPEX',
      name: 'SG&A',
      unit: 'currency',
      actual: kpis.sgaCosts,
      plan: kpis.sgaCosts * 0.95,
      prior: kpis.sgaCosts * 0.98,
      delta_vs_plan: ((kpis.sgaCosts - kpis.sgaCosts * 0.95) / (kpis.sgaCosts * 0.95)) * 100,
      delta_vs_prior: ((kpis.sgaCosts - kpis.sgaCosts * 0.98) / (kpis.sgaCosts * 0.98)) * 100
    },
    {
      code: 'COST_STUDENT',
      name: 'Custo por Aluno',
      unit: 'currency',
      actual: kpis.costPerStudent,
      plan: kpis.costPerStudent * 1.02,
      prior: kpis.costPerStudent * 1.01,
      delta_vs_plan: ((kpis.costPerStudent - kpis.costPerStudent * 1.02) / (kpis.costPerStudent * 1.02)) * 100,
      delta_vs_prior: ((kpis.costPerStudent - kpis.costPerStudent * 1.01) / (kpis.costPerStudent * 1.01)) * 100
    }
  ];
}
