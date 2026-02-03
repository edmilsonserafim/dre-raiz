/**
 * Visual Blocks - Exemplo de Uso
 * Demonstra como usar os blocos de visualização
 */

import React from 'react';
import {
  ChartBlock,
  KpiGridBlock,
  TextBlock,
  TableBlock,
  useLineChartOptions,
  useBarChartOptions
} from './index';
import { Target, Users, TrendingUp, DollarSign } from 'lucide-react';

export const VisualBlocksExample = () => {
  // ============================================
  // 1. KPI Grid Example
  // ============================================
  const kpiData = [
    {
      id: 'revenue',
      label: 'Receita Total',
      value: 1250000,
      format: 'currency' as const,
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
      value: 312500,
      format: 'currency' as const,
      icon: <Target size={20} />,
      color: 'green' as const,
      trend: {
        value: 8.3,
        direction: 'up' as const,
        isPositive: true
      }
    },
    {
      id: 'students',
      label: 'Alunos Ativos',
      value: 450,
      format: 'number' as const,
      icon: <Users size={20} />,
      color: 'purple' as const,
      trend: {
        value: 5.2,
        direction: 'up' as const,
        isPositive: true
      }
    },
    {
      id: 'margin',
      label: 'Margem EBITDA',
      value: 25,
      format: 'percent' as const,
      icon: <TrendingUp size={20} />,
      color: 'yellow' as const,
      trend: {
        value: 2.1,
        direction: 'down' as const,
        isPositive: false
      }
    }
  ];

  // ============================================
  // 2. Chart Examples
  // ============================================
  const lineChartData = [
    { name: 'Jan', value: 100000 },
    { name: 'Fev', value: 120000 },
    { name: 'Mar', value: 115000 },
    { name: 'Abr', value: 135000 },
    { name: 'Mai', value: 150000 },
    { name: 'Jun', value: 145000 }
  ];

  const barChartData = [
    { name: 'Filial A', value: 250000 },
    { name: 'Filial B', value: 180000 },
    { name: 'Filial C', value: 320000 },
    { name: 'Filial D', value: 210000 }
  ];

  // ============================================
  // 3. Table Example
  // ============================================
  const tableColumns = [
    {
      id: 'month',
      header: 'Mês',
      accessor: 'month',
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
    }
  ];

  const tableData = [
    { month: 'Janeiro', revenue: 100000, costs: 75000, ebitda: 25000 },
    { month: 'Fevereiro', revenue: 120000, costs: 85000, ebitda: 35000 },
    { month: 'Março', revenue: 115000, costs: 90000, ebitda: 25000 },
    { month: 'Abril', revenue: 135000, costs: 95000, ebitda: 40000 },
    { month: 'Maio', revenue: 150000, costs: 105000, ebitda: 45000 }
  ];

  return (
    <div className="space-y-6 p-6 bg-gray-50">
      <h1 className="text-3xl font-black text-gray-900">Visual Blocks - Exemplos</h1>

      {/* KPI Grid */}
      <KpiGridBlock
        id="kpi-grid"
        type="kpi"
        title="Indicadores Principais"
        subtitle="Visão geral dos KPIs do período"
        items={kpiData}
        columns={4}
        variant="default"
      />

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartBlock
          id="line-chart"
          type="chart"
          title="Evolução Mensal"
          subtitle="Receita nos últimos 6 meses"
          chartType="line"
          options={useLineChartOptions(lineChartData)}
          height={300}
        />

        <ChartBlock
          id="bar-chart"
          type="chart"
          title="Receita por Filial"
          subtitle="Comparativo de desempenho"
          chartType="bar"
          options={useBarChartOptions(barChartData)}
          height={300}
        />
      </div>

      {/* Text Block */}
      <TextBlock
        id="text-block"
        type="text"
        title="Análise do Período"
        variant="highlight"
        content="**Crescimento de 12.5%** em relação ao mês anterior. Destaque para a *Filial C* que apresentou o melhor desempenho do período."
        markdown={true}
      />

      {/* Table */}
      <TableBlock
        id="table-block"
        type="table"
        title="Detalhamento Mensal"
        subtitle="Receitas, custos e EBITDA por mês"
        columns={tableColumns}
        data={tableData}
        variant="striped"
        sortable={true}
        pagination={{ enabled: false }}
      />
    </div>
  );
};
