/**
 * Dashboard Enhanced - Versão aprimorada com blocos visuais integrados
 * Combina o Dashboard original com novos componentes de visualização
 */

import React, { useMemo } from 'react';
import Dashboard from './Dashboard';
import {
  ChartBlock,
  TextBlock,
  TableBlock
} from '../features/visualBlocks';
import { SchoolKPIs, Transaction } from '../types';
import { BRANCHES, RECEITA_LIQUIDA_TAGS_SET } from '../constants';
import { EChartsOption } from 'echarts';
import { useBranchData } from '../hooks/useBranchData';

interface DashboardEnhancedProps {
  kpis: SchoolKPIs;
  transactions: Transaction[];
  selectedMarca: string[];
  selectedFilial: string[];
  uniqueBrands: string[];
  availableBranches: string[];
  onMarcaChange: (brands: string[]) => void;
  onFilialChange: (branches: string[]) => void;
}

export const DashboardEnhanced: React.FC<DashboardEnhancedProps> = (props) => {
  const { transactions, kpis, selectedMarca, selectedFilial } = props;

  // 🔍 DEBUG: Verificar dados recebidos
  React.useEffect(() => {
    console.log('📊 DashboardEnhanced - Debug de Dados:');
    console.log('  Total transactions:', transactions.length);
    console.log('  Transactions Real:', transactions.filter(t => t.scenario === 'Real').length);
    console.log('  Transactions Orçado:', transactions.filter(t => t.scenario === 'Orçado').length);
    console.log('  KPIs:', {
      totalRevenue: kpis.totalRevenue,
      ebitda: kpis.ebitda,
      activeStudents: kpis.activeStudents,
      netMargin: kpis.netMargin
    });
    console.log('  Filtros:', {
      selectedMarca,
      selectedFilial
    });

    if (transactions.length === 0) {
      console.warn('⚠️ NENHUMA TRANSACTION CARREGADA! Verifique:');
      console.warn('  1. Se o banco de dados tem dados');
      console.warn('  2. Se os filtros de período não estão muito restritivos');
      console.warn('  3. Se há erro no console de rede (F12 → Network)');
    } else if (transactions.filter(t => t.scenario === 'Real').length === 0) {
      console.warn('⚠️ NÃO HÁ TRANSACTIONS COM SCENARIO="Real"!');
      console.warn('  Verifique se os dados no banco têm o campo scenario preenchido corretamente');
    }
  }, [transactions, kpis, selectedMarca, selectedFilial]);

  // State para capturar os filtros de mês do Dashboard filho
  const [monthRange, setMonthRange] = React.useState({ start: 0, end: 11 });

  // State para capturar o modo de comparação do Dashboard
  const [comparisonMode, setComparisonMode] = React.useState<'budget' | 'prevYear'>('budget');

  // State para controlar a aba ativa do gráfico de Desempenho por Unidade
  const [branchMetric, setBranchMetric] = React.useState<'revenue' | 'fixedCosts' | 'variableCosts' | 'sga' | 'ebitda'>('revenue');

  // State para controlar drill-down (CIA ou Filial)
  const [drillLevel, setDrillLevel] = React.useState<'cia' | 'filial'>('cia');

  // Listener para evento de mudança de range de meses
  React.useEffect(() => {
    const handleMonthRangeChange = (event: any) => {
      if (event.detail) {
        console.log('📅 DashboardEnhanced: ✅ EVENTO RECEBIDO!', event.detail);
        console.log('   Atualizando monthRange de', monthRange, 'para', event.detail);
        setMonthRange({ start: event.detail.start, end: event.detail.end });
      }
    };
    window.addEventListener('monthRangeChange', handleMonthRangeChange);
    return () => window.removeEventListener('monthRangeChange', handleMonthRangeChange);
  }, []);

  // Listener para evento de mudança de modo de comparação
  React.useEffect(() => {
    const handleComparisonModeChange = (event: any) => {
      if (event.detail) {
        setComparisonMode(event.detail.mode);
      }
    };
    window.addEventListener('comparisonModeChange', handleComparisonModeChange);
    return () => window.removeEventListener('comparisonModeChange', handleComparisonModeChange);
  }, []);

  // Auto drill-down: Quando marca filtrada, mostra visão Filial automaticamente
  React.useEffect(() => {
    if (selectedMarca.length > 0) {
      setDrillLevel('filial');
    } else {
      setDrillLevel('cia');
    }
  }, [selectedMarca]);

  // ============================================
  // DADOS: DESEMPENHO POR UNIDADE (com Drill-Down CIA/Filial)
  // ⚡ OTIMIZAÇÃO #5: Hook compartilhado para cálculo de branchData
  // Elimina duplicação de cálculo entre Dashboard e DashboardEnhanced (-50% computação duplicada)
  const branchData = useBranchData({
    transactions,
    monthRange,
    selectedMarca,
    selectedFilial,
    drillLevel,
    comparisonMode,
    activeStudents: kpis.activeStudents
  }).sort((a, b) => b.revenue - a.revenue);

  // Gráfico de Barras por Unidade - Dinâmico baseado na métrica selecionada
  const branchChartOptions: EChartsOption = React.useMemo(() => {
    // Helper para formatar números com separador de milhares
    const formatCurrency = (value: number) => {
      const valueInK = value / 1000;
      return `R$ ${valueInK.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}k`;
    };

    const getMetricData = () => {
      switch (branchMetric) {
        case 'revenue':
          return {
            data: branchData.map(d => d.revenue),
            variations: branchData.map(d => d.revenueVariation),
            label: 'Receita',
            formatter: formatCurrency,
            tooltipFormatter: (value: number) => `Receita: R$ ${value.toLocaleString('pt-BR')}`
          };
        case 'fixedCosts':
          return {
            data: branchData.map(d => d.fixedCosts),
            variations: branchData.map(d => d.fixedCostsVariation),
            label: 'Custos Fixos',
            formatter: formatCurrency,
            tooltipFormatter: (value: number) => `Custos Fixos: R$ ${value.toLocaleString('pt-BR')}`
          };
        case 'variableCosts':
          return {
            data: branchData.map(d => d.variableCosts),
            variations: branchData.map(d => d.variableCostsVariation),
            label: 'Custos Variáveis',
            formatter: formatCurrency,
            tooltipFormatter: (value: number) => `Custos Variáveis: R$ ${value.toLocaleString('pt-BR')}`
          };
        case 'sga':
          return {
            data: branchData.map(d => d.sga),
            variations: branchData.map(d => d.sgaVariation),
            label: 'SG&A',
            formatter: formatCurrency,
            tooltipFormatter: (value: number) => `SG&A: R$ ${value.toLocaleString('pt-BR')}`
          };
        case 'ebitda':
          return {
            data: branchData.map(d => d.ebitda),
            variations: branchData.map(d => d.ebitdaVariation),
            label: 'EBITDA',
            formatter: formatCurrency,
            tooltipFormatter: (value: number) => `EBITDA: R$ ${value.toLocaleString('pt-BR')}`
          };
      }
    };

    const metricData = getMetricData();
    const compLabel = comparisonMode === 'budget' ? 'Orçado' : 'A-1';

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params: any) => {
          const item = params[0];
          const idx = params[0].dataIndex;
          const variation = metricData.variations[idx];
          const variationText = variation >= 0 ? `+${variation.toFixed(1)}%` : `${variation.toFixed(1)}%`;
          const variationColor = variation >= 0 ? '#10B981' : '#EF4444';
          return `<strong>${item.name}</strong><br/>
                  ${metricData.tooltipFormatter(item.value)}<br/>
                  <span style="color: ${variationColor}; font-weight: bold;">
                    vs ${compLabel}: ${variationText}
                  </span>`;
        }
      },
      xAxis: {
        type: 'category',
        data: branchData.map(d => d.branch),
        axisLine: { lineStyle: { color: '#94a3b8' } },
        axisLabel: { fontSize: 10, fontWeight: 'bold', rotate: 20 }
      },
      yAxis: {
        type: 'value',
        axisLine: { lineStyle: { color: '#94a3b8' } },
        axisLabel: {
          fontSize: 11,
          formatter: metricData.formatter
        }
      },
      series: [
        {
          type: 'bar',
          data: branchData.map((d, idx) => ({
            value: metricData.data[idx],
            itemStyle: {
              color: d.margin >= 25 ? '#10B981' : d.margin >= 20 ? '#F59E0B' : '#EF4444'
            }
          })),
          barWidth: '60%',
          itemStyle: { borderRadius: [8, 8, 0, 0] },
          label: {
            show: true,
            position: 'top',
            formatter: (params: any) => {
              const idx = params.dataIndex;
              const value = metricData.data[idx];
              const variation = metricData.variations[idx];
              const variationText = variation >= 0 ? `↗ +${variation.toFixed(1)}%` : `↘ ${variation.toFixed(1)}%`;

              // Formatar valor principal
              let valueText = '';
              if (branchMetric === 'margin') {
                valueText = `${value.toFixed(1)}%`;
              } else {
                // Formatar com separador de milhares
                const valueInK = value / 1000;
                valueText = `R$ ${valueInK.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}k`;
              }

              // Usar rich text style diferente baseado na variação
              const variationStyle = variation >= 0 ? 'positive' : 'negative';
              return `{value|${valueText}}\n{${variationStyle}|${variationText}}`;
            },
            rich: {
              value: {
                fontSize: 11,
                fontWeight: 'bold',
                color: '#374151',
                lineHeight: 16
              },
              positive: {
                fontSize: 9,
                fontWeight: 'bold',
                color: '#10B981',
                lineHeight: 14
              },
              negative: {
                fontSize: 9,
                fontWeight: 'bold',
                color: '#EF4444',
                lineHeight: 14
              }
            }
          }
        }
      ],
      grid: { left: '3%', right: '3%', top: 60, bottom: 80 }
    };
  }, [branchData, branchMetric, comparisonMode]);

  // ============================================
  // TABELA: DETALHAMENTO POR UNIDADE
  // ============================================
  const tableColumns = [
    {
      id: 'branch',
      header: 'Unidade',
      accessor: 'branch',
      sortable: true
    },
    {
      id: 'students',
      header: 'Alunos',
      accessor: 'students',
      align: 'center' as const,
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
      id: 'fixedCosts',
      header: 'Custos Fixos',
      accessor: 'fixedCosts',
      align: 'right' as const,
      sortable: true,
      format: (value: number) => `R$ ${value.toLocaleString('pt-BR')}`
    },
    {
      id: 'variableCosts',
      header: 'Custos Variáveis',
      accessor: 'variableCosts',
      align: 'right' as const,
      sortable: true,
      format: (value: number) => `R$ ${value.toLocaleString('pt-BR')}`
    },
    {
      id: 'sga',
      header: 'SG&A',
      accessor: 'sga',
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
        <span className={value >= 25 ? 'text-emerald-600 font-bold' : value >= 20 ? 'text-amber-600 font-bold' : 'text-red-600 font-bold'}>
          {value.toFixed(1)}%
        </span>
      )
    }
  ];

  // ============================================
  // RESUMO EXECUTIVO
  // ============================================
  const topBranch = branchData[0] || { branch: 'N/A', revenue: 0 };
  const totalBranchRevenue = branchData.reduce((acc, b) => acc + b.revenue, 0);
  const topBranchPercentage = totalBranchRevenue > 0 ? (topBranch.revenue / totalBranchRevenue) * 100 : 0;
  const branchesAboveTarget = branchData.filter(b => b.margin >= 25).length;

  const executiveSummary = `
**Destaques do Período:**${selectedMarca.length > 0 ? ` (Filtro: ${selectedMarca.join(', ')})` : ''}${selectedFilial.length > 0 ? ` (Unidade: ${selectedFilial.join(', ')})` : ''}

${branchData.length > 0 ? `- A **${topBranch.branch}** lidera com ${topBranchPercentage.toFixed(1)}% da receita total (R$ ${topBranch.revenue.toLocaleString('pt-BR')})
- **${branchesAboveTarget} de ${branchData.length} unidades** atingiram a meta de margem de 25%` : '- Nenhuma unidade encontrada com os filtros selecionados'}
- Receita consolidada de **R$ ${kpis.totalRevenue.toLocaleString('pt-BR')}**
- EBITDA total de **R$ ${kpis.ebitda.toLocaleString('pt-BR')}** (margem de ${kpis.netMargin.toFixed(1)}%)
- Base de **${kpis.activeStudents} alunos ativos** com ticket médio de **R$ ${kpis.revenuePerStudent.toLocaleString('pt-BR')}**

*Recomendação: ${branchesAboveTarget < branchData.length ? 'Revisar estrutura de custos das unidades abaixo da meta' : 'Manter estratégia atual e replicar melhores práticas'}*
  `.trim();


  return (
    <div className="space-y-6">
      {/* Dashboard Original */}
      <Dashboard {...props} />

      {/* Desempenho por Unidade - Full Width */}
      <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
        {/* Header com Abas */}
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-base font-black text-gray-900 uppercase tracking-tighter flex items-center gap-2">
              Desempenho por {drillLevel === 'cia' ? 'CIA' : 'Unidade'}
              <button
                onClick={() => setDrillLevel(drillLevel === 'cia' ? 'filial' : 'cia')}
                className="px-3 py-1 bg-gradient-to-r from-[#1B75BB] to-[#1557BB] text-white rounded-lg text-[10px] font-bold uppercase tracking-tight hover:shadow-lg transition-all flex items-center gap-1"
                title={drillLevel === 'cia' ? 'Expandir para Filial' : 'Voltar para CIA'}
              >
                {drillLevel === 'cia' ? '⬇ Abrir Filial' : '⬆ Voltar CIA'}
              </button>
              <span className="px-2 py-1 bg-amber-100 text-amber-800 text-[9px] font-bold rounded">
                DEBUG: Range={monthRange.start}-{monthRange.end}
              </span>
            </h3>
            <p className="text-[9px] text-gray-400 font-bold uppercase mt-0.5">
              {branchMetric === 'revenue' && `Receita por ${drillLevel === 'cia' ? 'CIA' : 'filial'} (cores indicam margem)`}
              {branchMetric === 'fixedCosts' && `Custos Fixos por ${drillLevel === 'cia' ? 'CIA' : 'filial'} (cores indicam margem)`}
              {branchMetric === 'variableCosts' && `Custos Variáveis por ${drillLevel === 'cia' ? 'CIA' : 'filial'} (cores indicam margem)`}
              {branchMetric === 'sga' && `SG&A por ${drillLevel === 'cia' ? 'CIA' : 'filial'} (cores indicam margem)`}
              {branchMetric === 'ebitda' && `EBITDA por ${drillLevel === 'cia' ? 'CIA' : 'filial'} (cores indicam margem)`}
            </p>
          </div>
        </div>

        {/* Abas de Navegação */}
        <div className="flex gap-2 mb-4 bg-gray-100 p-1 rounded-lg w-fit">
          <button
            onClick={() => setBranchMetric('revenue')}
            className={`px-3 py-2 rounded-lg text-xs font-black uppercase tracking-tight transition-all ${
              branchMetric === 'revenue'
                ? 'bg-[#1B75BB] text-white shadow-md'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Receita
          </button>
          <button
            onClick={() => setBranchMetric('fixedCosts')}
            className={`px-3 py-2 rounded-lg text-xs font-black uppercase tracking-tight transition-all ${
              branchMetric === 'fixedCosts'
                ? 'bg-[#EF4444] text-white shadow-md'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Custos Fixos
          </button>
          <button
            onClick={() => setBranchMetric('variableCosts')}
            className={`px-3 py-2 rounded-lg text-xs font-black uppercase tracking-tight transition-all ${
              branchMetric === 'variableCosts'
                ? 'bg-[#F59E0B] text-white shadow-md'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Custos Variáveis
          </button>
          <button
            onClick={() => setBranchMetric('sga')}
            className={`px-3 py-2 rounded-lg text-xs font-black uppercase tracking-tight transition-all ${
              branchMetric === 'sga'
                ? 'bg-[#8B5CF6] text-white shadow-md'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            SG&A
          </button>
          <button
            onClick={() => setBranchMetric('ebitda')}
            className={`px-3 py-2 rounded-lg text-xs font-black uppercase tracking-tight transition-all ${
              branchMetric === 'ebitda'
                ? 'bg-[#10B981] text-white shadow-md'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            EBITDA
          </button>
        </div>

        {/* Gráfico */}
        <ChartBlock
          id="branch-performance"
          type="chart"
          title=""
          subtitle=""
          chartType="bar"
          options={branchChartOptions}
          height={400}
        />
      </div>

      {/* Resumo Executivo */}
      <TextBlock
        id="executive-summary"
        type="text"
        title="Resumo Executivo"
        subtitle="Análise consolidada do período"
        variant="highlight"
        content={executiveSummary}
        markdown={true}
      />

      {/* Detalhamento por Unidade */}
      <TableBlock
        id="branch-details"
        type="table"
        title="Detalhamento por Unidade"
        subtitle="Performance completa de todas as filiais"
        columns={tableColumns}
        data={branchData}
        variant="striped"
        sortable={true}
        pagination={{ enabled: false }}
        footer={
          <div className="flex justify-between items-center text-sm">
            <span className="font-bold text-gray-700">Total Consolidado:</span>
            <div className="flex gap-8">
              <span>Receita: <strong className="text-[#1B75BB]">R$ {totalBranchRevenue.toLocaleString('pt-BR')}</strong></span>
              <span>EBITDA: <strong className="text-[#7AC5BF]">R$ {kpis.ebitda.toLocaleString('pt-BR')}</strong></span>
              <span>Margem: <strong className={kpis.netMargin >= 25 ? 'text-emerald-600' : 'text-amber-600'}>{kpis.netMargin.toFixed(1)}%</strong></span>
            </div>
          </div>
        }
      />
    </div>
  );
};
