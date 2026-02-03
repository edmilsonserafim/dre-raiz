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
import { BRANCHES } from '../constants';
import { EChartsOption } from 'echarts';
import { Download, FileText } from 'lucide-react';
import { exportDashboardToPPT } from '../services/pptExportService';

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

  // State para capturar os filtros de mês do Dashboard filho
  const [monthRange, setMonthRange] = React.useState({ start: 0, end: 11 });

  // State para capturar o modo de comparação do Dashboard
  const [comparisonMode, setComparisonMode] = React.useState<'budget' | 'prevYear'>('budget');

  // State para controlar a aba ativa do gráfico de Desempenho por Unidade
  const [branchMetric, setBranchMetric] = React.useState<'revenue' | 'margin' | 'ebitda'>('revenue');

  // Listener para evento de mudança de range de meses
  React.useEffect(() => {
    const handleMonthRangeChange = (event: any) => {
      if (event.detail) {
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

  // ============================================
  // DADOS: EVOLUÇÃO MENSAL
  // ============================================
  const monthlyData = useMemo(() => {
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

    // Filtrar por cenário, marca e unidade
    let filteredTrans = transactions.filter(t => t.scenario === 'Real');
    if (selectedMarca.length > 0) {
      filteredTrans = filteredTrans.filter(t => selectedMarca.includes(t.marca || ''));
    }
    if (selectedFilial.length > 0) {
      filteredTrans = filteredTrans.filter(t => selectedFilial.includes(t.filial || ''));
    }

    return months.map((month, index) => {
      // Aplicar filtro de mês do Dashboard
      if (index < monthRange.start || index > monthRange.end) {
        return { name: month, revenue: 0, ebitda: 0, costs: 0 };
      }

      const monthTrans = filteredTrans.filter(t => new Date(t.date).getMonth() === index);
      const revenue = monthTrans.filter(t => t.type === 'REVENUE').reduce((acc, t) => acc + t.amount, 0);
      const costs = monthTrans.filter(t => t.type !== 'REVENUE').reduce((acc, t) => acc + t.amount, 0);
      const ebitda = revenue - costs;

      return { name: month, revenue, ebitda, costs };
    });
  }, [transactions, selectedMarca, selectedFilial, monthRange]);

  // Gráfico de Evolução Mensal (Receita + EBITDA)
  const monthlyChartOptions: EChartsOption = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross' },
      formatter: (params: any) => {
        let result = `<strong>${params[0].name}</strong><br/>`;
        params.forEach((item: any) => {
          result += `${item.marker} ${item.seriesName}: R$ ${item.value.toLocaleString('pt-BR')}<br/>`;
        });
        return result;
      }
    },
    legend: {
      data: ['Receita', 'EBITDA'],
      top: 10,
      textStyle: { fontSize: 12, fontWeight: 'bold' }
    },
    xAxis: {
      type: 'category',
      data: monthlyData.map(d => d.name),
      axisLine: { lineStyle: { color: '#94a3b8' } },
      axisLabel: { fontSize: 11, fontWeight: 'bold' }
    },
    yAxis: {
      type: 'value',
      axisLine: { lineStyle: { color: '#94a3b8' } },
      axisLabel: {
        fontSize: 11,
        formatter: (value: number) => `R$ ${(value / 1000).toFixed(0)}k`
      }
    },
    series: [
      {
        name: 'Receita',
        type: 'bar',
        data: monthlyData.map(d => d.revenue),
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
        },
        barWidth: '40%'
      },
      {
        name: 'EBITDA',
        type: 'line',
        data: monthlyData.map(d => d.ebitda),
        smooth: true,
        lineStyle: { width: 3, color: '#7AC5BF' },
        itemStyle: { color: '#7AC5BF' },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(122, 197, 191, 0.3)' },
              { offset: 1, color: 'rgba(122, 197, 191, 0.0)' }
            ]
          }
        }
      }
    ],
    grid: { left: 70, right: 40, top: 60, bottom: 50 }
  };

  // ============================================
  // DADOS: DESEMPENHO POR UNIDADE
  // ============================================
  const branchData = useMemo(() => {
    // Filtrar por cenário Real, marca e mês
    let filteredTrans = transactions.filter(t => {
      const month = new Date(t.date).getMonth();
      return t.scenario === 'Real' && month >= monthRange.start && month <= monthRange.end;
    });
    if (selectedMarca.length > 0) {
      filteredTrans = filteredTrans.filter(t => selectedMarca.includes(t.marca || ''));
    }

    // Filtrar transações de comparação (Orçado ou A-1)
    const comparisonScenario = comparisonMode === 'budget' ? 'Orçado' : 'A-1';
    let comparisonTrans = transactions.filter(t => {
      const month = new Date(t.date).getMonth();
      return t.scenario === comparisonScenario && month >= monthRange.start && month <= monthRange.end;
    });
    if (selectedMarca.length > 0) {
      comparisonTrans = comparisonTrans.filter(t => selectedMarca.includes(t.marca || ''));
    }

    // Determinar quais branches mostrar baseado nas transações filtradas
    let branchesToShow: string[];
    if (selectedFilial.length > 0) {
      // Se filiais específicas foram selecionadas, usar apenas essas
      branchesToShow = selectedFilial;
    } else {
      // Se nenhuma filial foi selecionada, pegar apenas as branches que existem nas transações filtradas
      const branchesInFilteredData = new Set(filteredTrans.map(t => t.filial).filter(Boolean));
      branchesToShow = Array.from(branchesInFilteredData).sort();

      // Se não há marcas selecionadas e não há transações filtradas, usar todas as branches
      if (branchesToShow.length === 0 && selectedMarca.length === 0) {
        branchesToShow = BRANCHES;
      }
    }

    return branchesToShow.map(branch => {
      // Dados reais
      const branchTrans = filteredTrans.filter(t => t.filial === branch);
      const revenue = branchTrans.filter(t => t.type === 'REVENUE').reduce((acc, t) => acc + t.amount, 0);
      const costs = branchTrans.filter(t => t.type !== 'REVENUE').reduce((acc, t) => acc + t.amount, 0);
      const ebitda = revenue - costs;
      const margin = revenue > 0 ? (ebitda / revenue) * 100 : 0;

      // Dados de comparação
      const compBranchTrans = comparisonTrans.filter(t => t.filial === branch);
      const compRevenue = compBranchTrans.filter(t => t.type === 'REVENUE').reduce((acc, t) => acc + t.amount, 0);
      const compCosts = compBranchTrans.filter(t => t.type !== 'REVENUE').reduce((acc, t) => acc + t.amount, 0);
      const compEbitda = compRevenue - compCosts;
      const compMargin = compRevenue > 0 ? (compEbitda / compRevenue) * 100 : 0;

      // Calcular variações
      const revenueVariation = compRevenue !== 0 ? ((revenue - compRevenue) / compRevenue) * 100 : 0;
      const ebitdaVariation = compEbitda !== 0 ? ((ebitda - compEbitda) / Math.abs(compEbitda)) * 100 : 0;
      const marginVariation = margin - compMargin;

      // Calcular número de alunos estimado (proporcionalmente)
      const totalRevenue = filteredTrans.filter(t => t.type === 'REVENUE').reduce((acc, t) => acc + t.amount, 0);
      const branchStudents = totalRevenue > 0 ? Math.round(kpis.activeStudents * (revenue / totalRevenue)) : 0;

      return {
        branch,
        revenue,
        costs,
        ebitda,
        margin,
        students: branchStudents,
        revenueVariation,
        ebitdaVariation,
        marginVariation
      };
    }).sort((a, b) => b.revenue - a.revenue);
  }, [transactions, kpis, selectedMarca, selectedFilial, monthRange, comparisonMode]);

  // Gráfico de Barras por Unidade - Dinâmico baseado na métrica selecionada
  const branchChartOptions: EChartsOption = React.useMemo(() => {
    const getMetricData = () => {
      switch (branchMetric) {
        case 'revenue':
          return {
            data: branchData.map(d => d.revenue),
            variations: branchData.map(d => d.revenueVariation),
            label: 'Receita',
            formatter: (value: number) => `R$ ${(value / 1000).toFixed(0)}k`,
            tooltipFormatter: (value: number) => `Receita: R$ ${value.toLocaleString('pt-BR')}`
          };
        case 'margin':
          return {
            data: branchData.map(d => d.margin),
            variations: branchData.map(d => d.marginVariation),
            label: 'Margem %',
            formatter: (value: number) => `${value.toFixed(1)}%`,
            tooltipFormatter: (value: number) => `Margem: ${value.toFixed(2)}%`
          };
        case 'ebitda':
          return {
            data: branchData.map(d => d.ebitda),
            variations: branchData.map(d => d.ebitdaVariation),
            label: 'EBITDA',
            formatter: (value: number) => `R$ ${(value / 1000).toFixed(0)}k`,
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
                valueText = `R$ ${(value / 1000).toFixed(0)}k`;
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
      grid: { left: 70, right: 40, top: 60, bottom: 80 }
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

  // ============================================
  // FUNÇÃO DE EXPORT
  // ============================================
  const handleExportPPT = async () => {
    try {
      // Filtrar transações para export
      let exportTrans = transactions.filter(t => t.scenario === 'Real');
      if (selectedMarca.length > 0) {
        exportTrans = exportTrans.filter(t => selectedMarca.includes(t.marca || ''));
      }
      if (selectedFilial.length > 0) {
        exportTrans = exportTrans.filter(t => selectedFilial.includes(t.filial || ''));
      }

      await exportDashboardToPPT({
        kpis,
        transactions: exportTrans,
        selectedBrand: selectedMarca,
        selectedBranch: selectedFilial
      });

      alert('✅ Apresentação exportada com sucesso!');
    } catch (error) {
      console.error('Erro ao exportar PPT:', error);
      alert('❌ Erro ao exportar apresentação. Verifique o console.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Dashboard Original */}
      <Dashboard {...props} />

      {/* Botão de Export (fixo no topo dos novos componentes) */}
      <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-200">
        <div>
          <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight flex items-center gap-2">
            <FileText size={18} className="text-[#1B75BB]" />
            Análises Avançadas
          </h3>
          <p className="text-xs text-gray-500 font-medium mt-0.5">
            Visualizações detalhadas e resumo executivo
          </p>
        </div>
        <button
          onClick={handleExportPPT}
          className="flex items-center gap-2 px-4 py-2 bg-[#F44C00] text-white rounded-lg font-bold text-sm hover:bg-[#d43d00] transition-all shadow-lg"
        >
          <Download size={16} />
          Exportar PPT
        </button>
      </div>

      {/* Novos Componentes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Evolução Mensal */}
        <ChartBlock
          id="monthly-evolution"
          type="chart"
          title="Evolução Mensal"
          subtitle="Receita e EBITDA consolidados"
          chartType="bar"
          options={monthlyChartOptions}
          height={350}
        />

        {/* Desempenho por Unidade */}
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
          {/* Header com Abas */}
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-base font-black text-gray-900 uppercase tracking-tighter">
                Desempenho por Unidade
              </h3>
              <p className="text-[9px] text-gray-400 font-bold uppercase mt-0.5">
                {branchMetric === 'revenue' && 'Receita por filial (cores indicam margem)'}
                {branchMetric === 'margin' && 'Margem de Contribuição por filial'}
                {branchMetric === 'ebitda' && 'EBITDA por filial (cores indicam margem)'}
              </p>
            </div>
          </div>

          {/* Abas de Navegação */}
          <div className="flex gap-2 mb-4 bg-gray-100 p-1 rounded-lg w-fit">
            <button
              onClick={() => setBranchMetric('revenue')}
              className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-tight transition-all ${
                branchMetric === 'revenue'
                  ? 'bg-[#1B75BB] text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Receita
            </button>
            <button
              onClick={() => setBranchMetric('margin')}
              className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-tight transition-all ${
                branchMetric === 'margin'
                  ? 'bg-[#7AC5BF] text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Margem %
            </button>
            <button
              onClick={() => setBranchMetric('ebitda')}
              className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-tight transition-all ${
                branchMetric === 'ebitda'
                  ? 'bg-[#F44C00] text-white shadow-md'
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
            height={350}
          />
        </div>
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
