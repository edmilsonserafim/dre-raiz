/**
 * Executive Dashboard - Exemplo Completo
 * Dashboard executivo usando todos os Visual Blocks
 */

import React, { useState, useMemo } from 'react';
import {
  ChartBlock,
  KpiGridBlock,
  TextBlock,
  TableBlock,
  useLineChartOptions,
  useBarChartOptions,
  AlertBlock
} from '../features/visualBlocks';
import {
  DollarSign,
  Target,
  Users,
  TrendingUp,
  Building2,
  Percent,
  Calendar,
  Download
} from 'lucide-react';
import { EChartsOption } from 'echarts';
import { Transaction, SchoolKPIs } from '../types';
import { buildWaterfallData } from '../utils/chartDataTransformer';

interface ExecutiveDashboardProps {
  transactions: Transaction[];
  kpis: SchoolKPIs;
}

export const ExecutiveDashboard: React.FC<ExecutiveDashboardProps> = ({ transactions, kpis }) => {
  const [selectedPeriod, setSelectedPeriod] = useState<'month' | 'quarter' | 'year'>('month');

  // Debug: Verificar dados recebidos
  React.useEffect(() => {
    console.log('📊 ExecutiveDashboard - Debug:');
    console.log('  Total transactions:', transactions.length);
    console.log('  Transactions Real:', transactions.filter(t => t.scenario === 'Real').length);
    console.log('  KPIs activeStudents:', kpis.activeStudents);
    console.log('  KPIs totalRevenue:', kpis.totalRevenue);
  }, [transactions, kpis]);

  // ============================================
  // CÁLCULOS DINÂMICOS BASEADOS NOS DADOS REAIS
  // ============================================
  const calculatedData = useMemo(() => {
    const real = transactions.filter(t => t.scenario === 'Real');
    const revenue = real.filter(t => t.type === 'REVENUE').reduce((acc, t) => acc + t.amount, 0);
    const fixedCosts = real.filter(t => t.type === 'FIXED_COST').reduce((acc, t) => acc + t.amount, 0);
    const variableCosts = real.filter(t => t.type === 'VARIABLE_COST').reduce((acc, t) => acc + t.amount, 0);
    const sgaCosts = real.filter(t => t.type === 'SGA').reduce((acc, t) => acc + t.amount, 0);
    const rateioCosts = real.filter(t => t.type === 'RATEIO').reduce((acc, t) => acc + t.amount, 0);
    const ebitda = revenue - fixedCosts - variableCosts - sgaCosts - rateioCosts;
    const margin = revenue > 0 ? (ebitda / revenue) * 100 : 0;

    return { revenue, fixedCosts, variableCosts, sgaCosts, rateioCosts, ebitda, margin };
  }, [transactions]);

  // ============================================
  // KPIs PRINCIPAIS
  // ============================================
  const mainKpis = [
    {
      id: 'revenue',
      label: 'Receita Líquida',
      value: calculatedData.revenue,
      format: 'currency' as const,
      subtitle: 'Total do período',
      icon: <DollarSign size={20} />,
      color: 'blue' as const,
      trend: {
        value: 12.5,
        direction: 'up' as const,
        isPositive: true
      }
    },
    {
      id: 'ebitda',
      label: 'EBITDA',
      value: calculatedData.ebitda,
      format: 'currency' as const,
      subtitle: 'Resultado operacional',
      icon: <Target size={20} />,
      color: calculatedData.ebitda >= 0 ? 'green' as const : 'red' as const,
      trend: {
        value: 8.3,
        direction: 'up' as const,
        isPositive: true
      }
    },
    {
      id: 'margin',
      label: 'Margem EBITDA',
      value: calculatedData.margin,
      format: 'percent' as const,
      subtitle: 'Meta: 25%',
      icon: <Percent size={20} />,
      color: calculatedData.margin >= 25 ? 'green' as const : calculatedData.margin >= 15 ? 'yellow' as const : 'red' as const,
      trend: {
        value: 2.1,
        direction: calculatedData.margin >= 25 ? 'up' as const : 'down' as const,
        isPositive: calculatedData.margin >= 25
      }
    },
    {
      id: 'students',
      label: 'Alunos Ativos',
      value: kpis.activeStudents,
      format: 'number' as const,
      subtitle: 'Todas as unidades',
      icon: <Users size={20} />,
      color: 'purple' as const,
      trend: {
        value: 5.2,
        direction: 'up' as const,
        isPositive: true
      }
    }
  ];

  // ============================================
  // KPIs SECUNDÁRIOS (Unit Economics)
  // ============================================
  const unitEconomicsKpis = [
    {
      id: 'revenue-per-student',
      label: 'Receita / Aluno',
      value: kpis.activeStudents > 0 ? calculatedData.revenue / kpis.activeStudents : 0,
      format: 'currency' as const,
      color: 'blue' as const,
      trend: { value: 3.2, direction: 'up' as const, isPositive: true }
    },
    {
      id: 'cost-per-student',
      label: 'Custo / Aluno',
      value: kpis.activeStudents > 0 ? (calculatedData.fixedCosts + calculatedData.variableCosts + calculatedData.sgaCosts + calculatedData.rateioCosts) / kpis.activeStudents : 0,
      format: 'currency' as const,
      color: 'red' as const,
      trend: { value: 1.5, direction: 'down' as const, isPositive: true }
    },
    {
      id: 'contribution-margin',
      label: 'Margem de Contribuição',
      value: kpis.activeStudents > 0 ? calculatedData.ebitda / kpis.activeStudents : 0,
      format: 'currency' as const,
      color: 'green' as const,
      trend: { value: 8.7, direction: 'up' as const, isPositive: true }
    }
  ];

  // ============================================
  // GRÁFICO DE EVOLUÇÃO MENSAL (DADOS REAIS)
  // ============================================
  const monthlyData = useMemo(() => {
    const months = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
    const real = transactions.filter(t => t.scenario === 'Real');

    return months.map((month, idx) => {
      const monthTrans = real.filter(t => parseInt(t.date.substring(5, 7), 10) - 1 === idx);
      const revenue = monthTrans.filter(t => t.type === 'REVENUE').reduce((acc, t) => acc + t.amount, 0);
      const costs = monthTrans.filter(t => t.type !== 'REVENUE').reduce((acc, t) => acc + t.amount, 0);
      const ebitda = revenue - costs;

      return {
        name: month,
        revenue,
        ebitda
      };
    }).filter(m => m.revenue > 0 || m.ebitda !== 0); // Mostrar apenas meses com dados
  }, [transactions]);

  const monthlyRevenueData = monthlyData.map(m => ({ name: m.name, value: m.revenue }));
  const monthlyEbitdaData = monthlyData.map(m => ({ name: m.name, value: m.ebitda }));

  // Gráfico Composto (Receita + EBITDA)
  const composedChartOptions: EChartsOption = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross' }
    },
    legend: {
      data: ['Receita', 'EBITDA'],
      top: 0
    },
    xAxis: {
      type: 'category',
      data: monthlyRevenueData.map(d => d.name),
      axisLine: { lineStyle: { color: '#94a3b8' } }
    },
    yAxis: {
      type: 'value',
      axisLine: { lineStyle: { color: '#94a3b8' } },
      axisLabel: {
        formatter: (value: number) => `R$ ${(value / 1000).toFixed(0)}k`
      }
    },
    series: [
      {
        name: 'Receita',
        type: 'bar',
        data: monthlyRevenueData.map(d => d.value),
        itemStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: '#1B75BB' },
              { offset: 1, color: '#4AC8F4' }
            ]
          },
          borderRadius: [8, 8, 0, 0]
        }
      },
      {
        name: 'EBITDA',
        type: 'line',
        data: monthlyEbitdaData.map(d => d.value),
        smooth: true,
        lineStyle: { width: 3, color: '#7AC5BF' },
        itemStyle: { color: '#7AC5BF' }
      }
    ],
    grid: { left: 80, right: 40, top: 60, bottom: 60 }
  };

  // ============================================
  // GRÁFICO DE DESEMPENHO POR FILIAL (DADOS REAIS)
  // ============================================
  const branchData = useMemo(() => {
    const real = transactions.filter(t => t.scenario === 'Real');
    const filiais = [...new Set(real.map(t => t.filial))];

    return filiais.map(filial => {
      const filialTrans = real.filter(t => t.filial === filial);
      const revenue = filialTrans.filter(t => t.type === 'REVENUE').reduce((acc, t) => acc + t.amount, 0);
      return { name: filial, value: revenue };
    }).filter(b => b.value > 0).sort((a, b) => b.value - a.value);
  }, [transactions]);

  // ============================================
  // GRÁFICO WATERFALL (DRE) - DADOS REAIS
  // ============================================
  const waterfallDataRaw = useMemo(() => {
    return buildWaterfallData(transactions, 'Real');
  }, [transactions]);

  // Transformar para formato compatível com o gráfico atual
  const waterfallData = useMemo(() => {
    return waterfallDataRaw.map(item => ({
      name: item.name,
      value: item.name === 'EBITDA' ? item.displayValue :
             (item.name === 'Receita' ? item.displayValue : -item.displayValue)
    }));
  }, [waterfallDataRaw]);

  const waterfallOptions: EChartsOption = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (params: any) => {
        const data = params[0];
        return `${data.name}<br/>R$ ${Math.abs(data.value).toLocaleString('pt-BR')}`;
      }
    },
    xAxis: {
      type: 'category',
      data: waterfallData.map(d => d.name),
      axisLine: { lineStyle: { color: '#94a3b8' } },
      axisLabel: { fontSize: 10, rotate: 45 }
    },
    yAxis: {
      type: 'value',
      axisLine: { lineStyle: { color: '#94a3b8' } },
      axisLabel: {
        formatter: (value: number) => `R$ ${(value / 1000).toFixed(0)}k`
      }
    },
    series: [
      {
        type: 'bar',
        data: waterfallData.map((d, i) => ({
          value: Math.abs(d.value),
          itemStyle: {
            color: d.value >= 0 ? '#7AC5BF' : '#F44C00',
            borderRadius: i === 0 || i === waterfallData.length - 1 ? [8, 8, 8, 8] : [8, 8, 0, 0]
          }
        })),
        barWidth: '50%'
      }
    ],
    grid: { left: 80, right: 40, top: 40, bottom: 100 }
  };

  // ============================================
  // GRÁFICO DE PIZZA (Custos por Categoria) - DADOS REAIS
  // ============================================
  const costBreakdownData = useMemo(() => {
    const real = transactions.filter(t => t.scenario === 'Real');

    return [
      {
        value: real.filter(t => t.type === 'VARIABLE_COST').reduce((acc, t) => acc + t.amount, 0),
        name: 'Custos Variáveis',
        itemStyle: { color: '#F97316' }
      },
      {
        value: real.filter(t => t.type === 'FIXED_COST').reduce((acc, t) => acc + t.amount, 0),
        name: 'Custos Fixos',
        itemStyle: { color: '#F44C00' }
      },
      {
        value: real.filter(t => t.type === 'SGA').reduce((acc, t) => acc + t.amount, 0),
        name: 'SG&A',
        itemStyle: { color: '#FB923C' }
      },
      {
        value: real.filter(t => t.type === 'RATEIO').reduce((acc, t) => acc + t.amount, 0),
        name: 'Rateio',
        itemStyle: { color: '#FDBA74' }
      }
    ].filter(item => item.value > 0); // Remover zeros
  }, [transactions]);

  const costBreakdownOptions: EChartsOption = {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: R$ {c}<br/>({d}%)'
    },
    legend: {
      orient: 'vertical',
      right: 10,
      top: 'center',
      textStyle: { fontSize: 11 }
    },
    series: [
      {
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: true,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: true,
          fontSize: 11,
          fontWeight: 'bold'
        },
        data: costBreakdownData
      }
    ]
  };

  // ============================================
  // TABELA DE DETALHAMENTO
  // ============================================
  const tableColumns = [
    {
      id: 'filial',
      header: 'Unidade',
      accessor: 'filial',
      sortable: true
    },
    {
      id: 'revenue',
      header: 'Receita',
      accessor: 'revenue',
      align: 'right' as const,
      sortable: true,
      format: (value: number) => `R$ ${value.toLocaleString('pt-BR')}`
    },
    {
      id: 'costs',
      header: 'Custos',
      accessor: 'costs',
      align: 'right' as const,
      sortable: true,
      format: (value: number) => `R$ ${value.toLocaleString('pt-BR')}`
    },
    {
      id: 'ebitda',
      header: 'EBITDA',
      accessor: 'ebitda',
      align: 'right' as const,
      sortable: true,
      format: (value: number) => (
        <span className={value >= 0 ? 'text-emerald-600 font-bold' : 'text-red-600 font-bold'}>
          R$ {value.toLocaleString('pt-BR')}
        </span>
      )
    },
    {
      id: 'margin',
      header: 'Margem %',
      accessor: 'margin',
      align: 'right' as const,
      sortable: true,
      format: (value: number) => (
        <span className={value >= 25 ? 'text-emerald-600 font-bold' : 'text-amber-600 font-bold'}>
          {value.toFixed(1)}%
        </span>
      )
    },
    {
      id: 'students',
      header: 'Alunos',
      accessor: 'students',
      align: 'center' as const,
      sortable: true
    }
  ];

  // ============================================
  // TABELA DE FILIAIS - DADOS REAIS
  // ============================================
  const tableData = useMemo(() => {
    const real = transactions.filter(t => t.scenario === 'Real');
    const filiais = [...new Set(real.map(t => t.filial).filter(Boolean))];

    const rows = filiais.map(filial => {
      const filialTrans = real.filter(t => t.filial === filial);

      const revenue = filialTrans
        .filter(t => t.type === 'REVENUE')
        .reduce((acc, t) => acc + t.amount, 0);

      const costs = filialTrans
        .filter(t => t.type !== 'REVENUE')
        .reduce((acc, t) => acc + t.amount, 0);

      const ebitda = revenue - costs;
      const margin = revenue > 0 ? (ebitda / revenue) * 100 : 0;

      // Estimar alunos proporcionalmente à receita
      const totalRevenue = real.filter(t => t.type === 'REVENUE').reduce((acc, t) => acc + t.amount, 0);
      const students = totalRevenue > 0 ? Math.round((revenue / totalRevenue) * kpis.activeStudents) : 0;

      return { filial, revenue, costs, ebitda, margin, students };
    });

    return rows.sort((a, b) => b.revenue - a.revenue); // TOP filiais por receita
  }, [transactions, kpis.activeStudents]);

  // Calcular totais da tabela
  const tableTotals = useMemo(() => {
    const totalRevenue = tableData.reduce((acc, row) => acc + row.revenue, 0);
    const totalCosts = tableData.reduce((acc, row) => acc + row.costs, 0);
    const totalEbitda = tableData.reduce((acc, row) => acc + row.ebitda, 0);
    const totalMargin = totalRevenue > 0 ? (totalEbitda / totalRevenue) * 100 : 0;

    return { totalRevenue, totalCosts, totalEbitda, totalMargin };
  }, [tableData]);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-black text-gray-900 flex items-center gap-3">
              <div className="h-8 w-1.5 bg-[#F44C00] rounded-full"></div>
              Dashboard Executivo - DRE RAIZ
            </h1>
            <p className="text-sm text-gray-500 font-medium mt-1 ml-5">
              Visão consolidada de performance financeira e operacional
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Filtro de Período */}
            <div className="flex bg-white rounded-lg border border-gray-200 p-1">
              {(['month', 'quarter', 'year'] as const).map((period) => (
                <button
                  key={period}
                  onClick={() => setSelectedPeriod(period)}
                  className={`px-4 py-2 text-xs font-bold uppercase rounded-lg transition-all ${
                    selectedPeriod === period
                      ? 'bg-[#1B75BB] text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {period === 'month' ? 'Mês' : period === 'quarter' ? 'Trimestre' : 'Ano'}
                </button>
              ))}
            </div>
            {/* Botão Export */}
            <button className="flex items-center gap-2 px-4 py-2 bg-[#1B75BB] text-white rounded-lg font-bold text-sm hover:bg-[#145a94] transition-all">
              <Download size={16} />
              Exportar
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* KPIs Principais */}
        <KpiGridBlock
          id="main-kpis"
          type="kpi"
          title="Indicadores Principais"
          subtitle={`Desempenho consolidado - ${selectedPeriod === 'month' ? 'Junho/2026' : selectedPeriod === 'quarter' ? '2º Trimestre/2026' : 'Ano 2026'}`}
          items={mainKpis}
          columns={4}
          variant="detailed"
        />

        {/* Alerta de Performance - DINÂMICO */}
        <AlertBlock
          {...useMemo(() => {
            const { margin } = calculatedData;

            if (margin >= 25) {
              return {
                type: 'success' as const,
                title: 'Meta Atingida! 🎉',
                message: `Parabéns! A margem EBITDA de ${margin.toFixed(1)}% superou a meta de 25%.`
              };
            } else if (margin >= 15) {
              return {
                type: 'warning' as const,
                title: 'Atenção: Margem Abaixo da Meta ⚠️',
                message: `A margem EBITDA atual é ${margin.toFixed(1)}%. Faltam ${(25 - margin).toFixed(1)} pontos para a meta.`
              };
            } else {
              return {
                type: 'error' as const,
                title: 'Alerta Crítico: Margem Baixa 🚨',
                message: `A margem EBITDA está em ${margin.toFixed(1)}%, muito abaixo da meta de 25%. Ação imediata necessária.`
              };
            }
          }, [calculatedData])}
        />

        {/* Unit Economics */}
        <KpiGridBlock
          id="unit-economics"
          type="kpi"
          title="Unit Economics"
          subtitle="Economia por aluno"
          items={unitEconomicsKpis}
          columns={3}
          variant="compact"
        />

        {/* Gráficos - Linha 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartBlock
            id="revenue-ebitda-chart"
            type="chart"
            title="Evolução Mensal"
            subtitle="Receita e EBITDA nos últimos 6 meses"
            chartType="bar"
            options={composedChartOptions}
            height={350}
          />

          <ChartBlock
            id="branch-performance"
            type="chart"
            title="Desempenho por Unidade"
            subtitle="Receita por filial no período"
            chartType="bar"
            options={useBarChartOptions(branchData)}
            height={350}
          />
        </div>

        {/* Gráficos - Linha 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <ChartBlock
              id="waterfall-dre"
              type="chart"
              title="Formação do EBITDA (Waterfall)"
              subtitle="Da receita até o resultado operacional"
              chartType="waterfall"
              options={waterfallOptions}
              height={400}
            />
          </div>

          <div className="lg:col-span-1">
            <ChartBlock
              id="cost-breakdown"
              type="chart"
              title="Breakdown de Custos"
              subtitle="Distribuição por categoria"
              chartType="pie"
              options={costBreakdownOptions}
              height={400}
            />
          </div>
        </div>

        {/* Texto Analítico - DINÂMICO */}
        <TextBlock
          id="executive-summary"
          type="text"
          title="Resumo Executivo"
          variant="highlight"
          content={useMemo(() => {
            const topBranch = tableData[0];
            const { revenue, margin } = calculatedData;
            const studentCount = kpis.activeStudents;

            return `
**Destaques do Período:**

- A **${topBranch?.filial || 'unidade líder'}** mantém liderança com R$ ${((topBranch?.revenue || 0) / 1000).toFixed(0)} mil em receita e ${topBranch?.students || 0} alunos ativos
- Receita consolidada: **R$ ${(revenue / 1000).toFixed(0)} mil** no período
- Margem EBITDA de **${margin.toFixed(1)}%** ${margin >= 25 ? '✅ META ATINGIDA' : '⚠️ abaixo da meta'}
- Total de **${studentCount} alunos** ativos em todas as unidades
- ${margin >= 20 ? '*Recomendação*: Manter estratégia atual e replicar modelo da unidade líder' : '*Recomendação*: Revisar estrutura de custos e otimizar operações'}
            `.trim();
          }, [tableData, calculatedData, kpis])}
          markdown={true}
        />

        {/* Tabela Detalhada */}
        <TableBlock
          id="branch-details"
          type="table"
          title="Detalhamento por Unidade"
          subtitle="Performance completa de todas as filiais"
          columns={tableColumns}
          data={tableData}
          variant="striped"
          sortable={true}
          pagination={{ enabled: false }}
          footer={
            <div className="flex justify-between items-center text-sm">
              <span className="font-bold text-gray-700">Total Consolidado:</span>
              <div className="flex gap-8">
                <span>Receita: <strong className="text-[#1B75BB]">R$ {tableTotals.totalRevenue.toLocaleString('pt-BR')}</strong></span>
                <span>Custos: <strong className="text-[#F44C00]">R$ {tableTotals.totalCosts.toLocaleString('pt-BR')}</strong></span>
                <span>EBITDA: <strong className="text-[#7AC5BF]">R$ {tableTotals.totalEbitda.toLocaleString('pt-BR')}</strong></span>
                <span>Margem: <strong className={tableTotals.totalMargin >= 25 ? 'text-emerald-600' : 'text-amber-600'}>{tableTotals.totalMargin.toFixed(1)}%</strong></span>
              </div>
            </div>
          }
        />
      </div>
    </div>
  );
};
