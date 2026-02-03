/**
 * Exemplo de uso do ChartRendererECharts
 *
 * Este exemplo mostra como usar os gráficos ECharts com o AnalysisPack
 */

import React from 'react';
import { ChartRendererECharts } from '../components/ChartRendererECharts';
import { getMockContext } from '../mock/mockContext';
import type { ChartDef } from '../../types';

export function EChartsExample() {
  const context = getMockContext();

  // Definições de gráficos para testar todos os tipos
  const charts: ChartDef[] = [
    {
      id: 'line_example',
      kind: 'line',
      dataset_key: 'r12',
      title: 'Evolução de Receita e EBITDA (R12M)',
      series_keys: ['revenue', 'ebitda']
    },
    {
      id: 'waterfall_example',
      kind: 'waterfall',
      dataset_key: 'ebitda_bridge_vs_plan_ytd',
      title: 'Ponte de EBITDA vs Orçamento (YTD)'
    },
    {
      id: 'pareto_example',
      kind: 'pareto',
      dataset_key: 'pareto_cost_variance_ytd',
      title: 'Principais Variações de Custo (Pareto)',
      top_n: 10
    },
    {
      id: 'heatmap_example',
      kind: 'heatmap',
      dataset_key: 'heatmap_variance',
      title: 'Mapa de Calor: Variações por Categoria e Marca'
    }
  ];

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-black text-gray-900 mb-2">
          ECharts Integration - Exemplos
        </h1>
        <p className="text-gray-600 mb-8">
          Demonstração dos 4 tipos de gráficos suportados: Line, Waterfall, Pareto e Heatmap
        </p>

        <div className="space-y-8">
          {charts.map((chart) => (
            <div
              key={chart.id}
              className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200"
            >
              <ChartRendererECharts
                chart={chart}
                context={context}
                height={400}
              />
            </div>
          ))}
        </div>

        {/* Comparação lado a lado */}
        <div className="mt-12">
          <h2 className="text-2xl font-black text-gray-900 mb-6">
            Comparação: Recharts vs ECharts
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recharts */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
              <div className="mb-4">
                <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 text-sm font-bold rounded-full">
                  Recharts
                </span>
                <p className="text-xs text-gray-600 mt-2">
                  Biblioteca React-first, mais simples mas menos features
                </p>
              </div>
              {/* Aqui você pode adicionar ChartRenderer (Recharts) para comparação */}
              <div className="h-80 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg">
                <p className="text-gray-500">ChartRenderer (Recharts)</p>
              </div>
            </div>

            {/* ECharts */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
              <div className="mb-4">
                <span className="inline-block px-3 py-1 bg-green-100 text-green-800 text-sm font-bold rounded-full">
                  ECharts
                </span>
                <p className="text-xs text-gray-600 mt-2">
                  Biblioteca mais robusta com waterfall, pareto e heatmap nativos
                </p>
              </div>
              <ChartRendererECharts
                chart={charts[0]} // Line chart
                context={context}
                height={320}
              />
            </div>
          </div>
        </div>

        {/* Info Cards */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
            <h3 className="font-black text-blue-900 mb-2">📈 Line Chart</h3>
            <p className="text-sm text-blue-800">
              Séries temporais com smooth curves. Ideal para R12, tendências, comparações ao longo do tempo.
            </p>
          </div>

          <div className="bg-green-50 rounded-xl p-6 border border-green-200">
            <h3 className="font-black text-green-900 mb-2">🌊 Waterfall</h3>
            <p className="text-sm text-green-800">
              Ponte de valores com steps positivos/negativos. Perfeito para análise de variações (EBITDA, receita).
            </p>
          </div>

          <div className="bg-purple-50 rounded-xl p-6 border border-purple-200">
            <h3 className="font-black text-purple-900 mb-2">📊 Pareto</h3>
            <p className="text-sm text-purple-800">
              Top N itens com linha de acumulado. Mostra concentração (80/20) de custos, variações, etc.
            </p>
          </div>

          <div className="bg-orange-50 rounded-xl p-6 border border-orange-200">
            <h3 className="font-black text-orange-900 mb-2">🔥 Heatmap</h3>
            <p className="text-sm text-orange-800">
              Matriz de valores com escala de cores. Ideal para variações por marca/categoria, performance.
            </p>
          </div>

          <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
            <h3 className="font-black text-gray-900 mb-2">⚡ Performance</h3>
            <p className="text-sm text-gray-800">
              Bundle: +300KB (ECharts completo). Considere tree-shaking ou lazy loading para produção.
            </p>
          </div>

          <div className="bg-yellow-50 rounded-xl p-6 border border-yellow-200">
            <h3 className="font-black text-yellow-900 mb-2">🎨 Customização</h3>
            <p className="text-sm text-yellow-800">
              Use buildEChartsOption() diretamente para customizar cores, temas, animações, etc.
            </p>
          </div>
        </div>

        {/* Code Example */}
        <div className="mt-12 bg-gray-900 rounded-xl p-6 overflow-x-auto">
          <h3 className="text-white font-black mb-4">💻 Exemplo de Código</h3>
          <pre className="text-green-400 text-sm">
{`import { ChartRendererECharts, getMockContext } from './analysisPack';

function MyChart() {
  const context = getMockContext();

  const chartDef = {
    id: 'revenue_chart',
    kind: 'line',
    dataset_key: 'r12',
    title: 'Receita R12M',
    series_keys: ['revenue', 'ebitda']
  };

  return (
    <ChartRendererECharts
      chart={chartDef}
      context={context}
      height={400}
    />
  );
}`}
          </pre>
        </div>
      </div>
    </div>
  );
}

export default EChartsExample;
