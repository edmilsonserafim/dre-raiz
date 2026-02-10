import { Transaction, SchoolKPIs } from '../types';

// Months array for reference
const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

/**
 * Aggregate transactions by month
 */
export const aggregateByMonth = (
  transactions: Transaction[],
  metrics: string[],
  scenarios: string[],
  timeframe: { start: number; end: number }
) => {
  const data = [];

  for (let monthIdx = timeframe.start; monthIdx <= timeframe.end; monthIdx++) {
    const monthData: any = {
      name: MONTHS[monthIdx],
      month: monthIdx
    };

    scenarios.forEach(scenario => {
      const monthTransactions = transactions.filter(
        t => parseInt(t.date.substring(5, 7), 10) - 1 === monthIdx && t.scenario === scenario
      );

      metrics.forEach(metric => {
        const key = `${metric}_${scenario}`;

        if (metric === 'ebitda') {
          const revenue = monthTransactions.filter(t => t.type === 'REVENUE').reduce((acc, t) => acc + t.amount, 0);
          const fixedCosts = monthTransactions.filter(t => t.type === 'FIXED_COST').reduce((acc, t) => acc + t.amount, 0);
          const variableCosts = monthTransactions.filter(t => t.type === 'VARIABLE_COST').reduce((acc, t) => acc + t.amount, 0);
          const sgaCosts = monthTransactions.filter(t => t.type === 'SGA').reduce((acc, t) => acc + t.amount, 0);
          const rateioCosts = monthTransactions.filter(t => t.type === 'RATEIO').reduce((acc, t) => acc + t.amount, 0);
          monthData[key] = revenue - fixedCosts - variableCosts - sgaCosts - rateioCosts;
        } else if (metric === 'revenue') {
          monthData[key] = monthTransactions.filter(t => t.type === 'REVENUE').reduce((acc, t) => acc + t.amount, 0);
        } else if (metric === 'fixedCosts') {
          monthData[key] = monthTransactions.filter(t => t.type === 'FIXED_COST').reduce((acc, t) => acc + t.amount, 0);
        } else if (metric === 'variableCosts') {
          monthData[key] = monthTransactions.filter(t => t.type === 'VARIABLE_COST').reduce((acc, t) => acc + t.amount, 0);
        } else if (metric === 'sgaCosts') {
          monthData[key] = monthTransactions.filter(t => t.type === 'SGA').reduce((acc, t) => acc + t.amount, 0);
        } else if (metric === 'rateioCosts') {
          monthData[key] = monthTransactions.filter(t => t.type === 'RATEIO').reduce((acc, t) => acc + t.amount, 0);
        }
      });
    });

    data.push(monthData);
  }

  return data;
};

/**
 * Aggregate transactions by category
 */
export const aggregateByCategory = (
  transactions: Transaction[],
  metrics: string[],
  scenarios: string[]
) => {
  const categories = Array.from(new Set(transactions.map(t => t.category)));
  const data = [];

  categories.forEach(category => {
    const categoryData: any = {
      name: category
    };

    scenarios.forEach(scenario => {
      const categoryTransactions = transactions.filter(
        t => t.category === category && t.scenario === scenario
      );

      metrics.forEach(metric => {
        const key = `${metric}_${scenario}`;

        if (metric === 'total') {
          categoryData[key] = categoryTransactions.reduce((acc, t) => acc + t.amount, 0);
        } else if (metric === 'ebitda') {
          const revenue = categoryTransactions.filter(t => t.type === 'REVENUE').reduce((acc, t) => acc + t.amount, 0);
          const costs = categoryTransactions.filter(t => t.type !== 'REVENUE').reduce((acc, t) => acc + t.amount, 0);
          categoryData[key] = revenue - costs;
        }
      });
    });

    data.push(categoryData);
  });

  // Sort by total amount (descending)
  return data.sort((a, b) => {
    const aTotal = Object.keys(a).filter(k => k !== 'name').reduce((sum, k) => sum + Math.abs(a[k]), 0);
    const bTotal = Object.keys(b).filter(k => k !== 'name').reduce((sum, k) => sum + Math.abs(b[k]), 0);
    return bTotal - aTotal;
  });
};

/**
 * Aggregate transactions by filial
 */
export const aggregateByFilial = (
  transactions: Transaction[],
  metrics: string[],
  scenarios: string[]
) => {
  const filiais = Array.from(new Set(transactions.map(t => t.filial)));
  const data = [];

  filiais.forEach(filial => {
    const filialData: any = {
      name: filial
    };

    scenarios.forEach(scenario => {
      const filialTransactions = transactions.filter(
        t => t.filial === filial && t.scenario === scenario
      );

      metrics.forEach(metric => {
        const key = `${metric}_${scenario}`;

        if (metric === 'ebitda') {
          const revenue = filialTransactions.filter(t => t.type === 'REVENUE').reduce((acc, t) => acc + t.amount, 0);
          const fixedCosts = filialTransactions.filter(t => t.type === 'FIXED_COST').reduce((acc, t) => acc + t.amount, 0);
          const variableCosts = filialTransactions.filter(t => t.type === 'VARIABLE_COST').reduce((acc, t) => acc + t.amount, 0);
          const sgaCosts = filialTransactions.filter(t => t.type === 'SGA').reduce((acc, t) => acc + t.amount, 0);
          const rateioCosts = filialTransactions.filter(t => t.type === 'RATEIO').reduce((acc, t) => acc + t.amount, 0);
          filialData[key] = revenue - fixedCosts - variableCosts - sgaCosts - rateioCosts;
        } else if (metric === 'revenue') {
          filialData[key] = filialTransactions.filter(t => t.type === 'REVENUE').reduce((acc, t) => acc + t.amount, 0);
        } else if (metric === 'costs') {
          filialData[key] = filialTransactions.filter(t => t.type !== 'REVENUE').reduce((acc, t) => acc + t.amount, 0);
        }
      });
    });

    data.push(filialData);
  });

  // Sort by EBITDA (descending)
  return data.sort((a, b) => {
    const aEbitda = Object.keys(a).filter(k => k.includes('ebitda')).reduce((sum, k) => sum + a[k], 0);
    const bEbitda = Object.keys(b).filter(k => k.includes('ebitda')).reduce((sum, k) => sum + b[k], 0);
    return bEbitda - aEbitda;
  });
};

/**
 * Build waterfall chart data (from Revenue to EBITDA)
 * Follows the pattern from Dashboard.tsx lines 216-304
 */
export const buildWaterfallData = (
  transactions: Transaction[],
  scenario: string = 'Real'
) => {
  const filtered = transactions.filter(t => t.scenario === scenario);

  const revenue = filtered.filter(t => t.type === 'REVENUE').reduce((acc, t) => acc + t.amount, 0);
  const fixedCosts = filtered.filter(t => t.type === 'FIXED_COST').reduce((acc, t) => acc + t.amount, 0);
  const variableCosts = filtered.filter(t => t.type === 'VARIABLE_COST').reduce((acc, t) => acc + t.amount, 0);
  const sgaCosts = filtered.filter(t => t.type === 'SGA').reduce((acc, t) => acc + t.amount, 0);
  const rateioCosts = filtered.filter(t => t.type === 'RATEIO').reduce((acc, t) => acc + t.amount, 0);
  const ebitda = revenue - fixedCosts - variableCosts - sgaCosts - rateioCosts;

  return [
    {
      name: 'Receita',
      start: 0,
      value: revenue,
      end: revenue,
      color: '#1B75BB',
      displayValue: revenue
    },
    {
      name: 'Custos Variáveis',
      start: revenue,
      value: variableCosts,
      end: revenue - variableCosts,
      color: '#F97316',
      displayValue: variableCosts
    },
    {
      name: 'Custos Fixos',
      start: revenue - variableCosts,
      value: fixedCosts,
      end: revenue - variableCosts - fixedCosts,
      color: '#F44C00',
      displayValue: fixedCosts
    },
    {
      name: 'SG&A',
      start: revenue - variableCosts - fixedCosts,
      value: sgaCosts,
      end: revenue - variableCosts - fixedCosts - sgaCosts,
      color: '#FB923C',
      displayValue: sgaCosts
    },
    {
      name: 'Rateio',
      start: revenue - variableCosts - fixedCosts - sgaCosts,
      value: rateioCosts,
      end: revenue - variableCosts - fixedCosts - sgaCosts - rateioCosts,
      color: '#FDBA74',
      displayValue: rateioCosts
    },
    {
      name: 'EBITDA',
      start: 0,
      value: ebitda,
      end: ebitda,
      color: ebitda >= 0 ? '#7AC5BF' : '#EF4444',
      displayValue: Math.abs(ebitda),
      isNegative: ebitda < 0
    }
  ];
};

/**
 * Build time series data for line/composed charts
 */
export const buildTimeSeries = (
  transactions: Transaction[],
  metrics: string[],
  scenarios: string[],
  timeframe: { start: number; end: number }
) => {
  return aggregateByMonth(transactions, metrics, scenarios, timeframe);
};

/**
 * Build heatmap data
 * Follows the pattern from Dashboard.tsx lines 307-341
 */
export const buildHeatmapData = (
  transactions: Transaction[],
  timeframe: { start: number; end: number }
) => {
  const metrics = ['Receita', 'Custos Variáveis', 'Custos Fixos', 'SG&A', 'Rateio', 'EBITDA'];
  const monthsData = [];

  for (let monthIdx = timeframe.start; monthIdx <= timeframe.end; monthIdx++) {
    const monthTransactions = transactions.filter(
      t => parseInt(t.date.substring(5, 7), 10) - 1 === monthIdx && t.scenario === 'Real'
    );

    const revenue = monthTransactions.filter(t => t.type === 'REVENUE').reduce((acc, t) => acc + t.amount, 0);
    const variableCosts = monthTransactions.filter(t => t.type === 'VARIABLE_COST').reduce((acc, t) => acc + t.amount, 0);
    const fixedCosts = monthTransactions.filter(t => t.type === 'FIXED_COST').reduce((acc, t) => acc + t.amount, 0);
    const sgaCosts = monthTransactions.filter(t => t.type === 'SGA').reduce((acc, t) => acc + t.amount, 0);
    const rateioCosts = monthTransactions.filter(t => t.type === 'RATEIO').reduce((acc, t) => acc + t.amount, 0);
    const ebitda = revenue - variableCosts - fixedCosts - sgaCosts - rateioCosts;

    monthsData.push({
      month: MONTHS[monthIdx],
      monthIndex: monthIdx,
      Receita: revenue > 0 ? (revenue / 1000).toFixed(0) : '0',
      'Custos Variáveis': variableCosts > 0 ? (variableCosts / 1000).toFixed(0) : '0',
      'Custos Fixos': fixedCosts > 0 ? (fixedCosts / 1000).toFixed(0) : '0',
      'SG&A': sgaCosts > 0 ? (sgaCosts / 1000).toFixed(0) : '0',
      'Rateio': rateioCosts > 0 ? (rateioCosts / 1000).toFixed(0) : '0',
      'EBITDA': ebitda !== 0 ? (ebitda / 1000).toFixed(0) : '0',
      scores: {
        Receita: revenue > 0 ? Math.min(100, (revenue / 150000) * 100) : 0,
        'Custos Variáveis': variableCosts > 0 ? Math.min(100, 100 - (variableCosts / 80000) * 100) : 100,
        'Custos Fixos': fixedCosts > 0 ? Math.min(100, 100 - (fixedCosts / 60000) * 100) : 100,
        'SG&A': sgaCosts > 0 ? Math.min(100, 100 - (sgaCosts / 30000) * 100) : 100,
        'Rateio': rateioCosts > 0 ? Math.min(100, 100 - (rateioCosts / 20000) * 100) : 100,
        'EBITDA': ebitda > 0 ? Math.min(100, (ebitda / 40000) * 100) : 0
      }
    });
  }

  return { metrics, monthsData };
};
