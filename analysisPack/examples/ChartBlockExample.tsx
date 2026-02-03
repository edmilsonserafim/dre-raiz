/**
 * Exemplo de uso do ChartBlock com onRegister pattern
 */

import React, { useState } from 'react';
import { ChartBlock } from '../components/ChartBlock';
import { useChartRegistry } from '../hooks/useChartRegistry';
import { getMockContext } from '../mock/mockContext';
import type { ChartDef } from '../../types';

export function ChartBlockExample() {
  const context = getMockContext();
  const chartRegistry = useChartRegistry();
  const [exportedPngs, setExportedPngs] = useState<Record<string, string>>({});

  const charts: ChartDef[] = [
    {
      id: 'revenue_line',
      kind: 'line',
      dataset_key: 'r12',
      title: 'Receita e EBITDA (R12M)',
      series_keys: ['revenue', 'ebitda']
    },
    {
      id: 'ebitda_waterfall',
      kind: 'waterfall',
      dataset_key: 'ebitda_bridge_vs_plan_ytd',
      title: 'Ponte de EBITDA'
    },
    {
      id: 'cost_pareto',
      kind: 'pareto',
      dataset_key: 'pareto_cost_variance_ytd',
      title: 'Pareto de Variações',
      top_n: 10
    }
  ];

  const handleExport = async () => {
    const pngs = await chartRegistry.exportAllPngBase64();
    setExportedPngs(pngs);
    console.log('Exported charts:', Object.keys(pngs));
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-black text-gray-900 mb-2">
          ChartBlock - Padrão onRegister
        </h1>
        <p className="text-gray-600 mb-6">
          Componente reutilizável com exportação via callback
        </p>

        {/* Controls */}
        <div className="flex gap-4 mb-8">
          <button
            onClick={handleExport}
            className="px-6 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700"
          >
            📸 Exportar Todos
          </button>

          {Object.keys(exportedPngs).length > 0 && (
            <div className="px-4 py-3 bg-green-100 text-green-800 font-bold rounded-lg">
              ✓ {Object.keys(exportedPngs).length} gráficos exportados
            </div>
          )}
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {charts.map((chart) => (
            <ChartBlock
              key={chart.id}
              def={chart}
              datasets={context.datasets}
              currency={context.currency}
              height={400}
              onRegister={chartRegistry.register}
            />
          ))}
        </div>

        {/* Code Example */}
        <div className="mt-12 bg-gray-900 rounded-xl p-6">
          <h3 className="text-white font-black mb-4">💻 Uso do ChartBlock</h3>
          <pre className="text-green-400 text-sm overflow-x-auto">
{`import { ChartBlock, useChartRegistry } from './analysisPack';

function MyComponent() {
  const chartRegistry = useChartRegistry();
  const context = getMockContext();

  const handleExport = async () => {
    const pngs = await chartRegistry.exportAllPngBase64();
    console.log('Exported:', Object.keys(pngs));
  };

  return (
    <>
      <ChartBlock
        def={chartDef}
        datasets={context.datasets}
        currency={context.currency}
        height={400}
        onRegister={chartRegistry.register}  // ← Callback pattern
      />
      <button onClick={handleExport}>Export</button>
    </>
  );
}`}
          </pre>
        </div>

        {/* Comparison */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <h3 className="font-black text-gray-900 mb-3">
              ✅ ChartBlock (Recomendado)
            </h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li>✓ Usa <code className="bg-gray-100 px-2 py-1 rounded">echarts-for-react</code></li>
              <li>✓ Callback pattern (<code className="bg-gray-100 px-2 py-1 rounded">onRegister</code>)</li>
              <li>✓ Props separadas (def, datasets, currency)</li>
              <li>✓ Memoização automática</li>
              <li>✓ Estilo consistente (border, shadow, padding)</li>
            </ul>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <h3 className="font-black text-gray-900 mb-3">
              ⚡ ChartRendererECharts (Alternativa)
            </h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li>✓ Também usa <code className="bg-gray-100 px-2 py-1 rounded">echarts-for-react</code></li>
              <li>✓ Mesmo callback pattern</li>
              <li>✓ Props agregadas (chart, context)</li>
              <li>✓ Compatível com AnalysisPack types</li>
              <li>✓ Mais alto nível (menos props)</li>
            </ul>
          </div>
        </div>

        {/* Exported Previews */}
        {Object.keys(exportedPngs).length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-black text-gray-900 mb-6">
              Preview dos PNGs Exportados
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {Object.entries(exportedPngs).map(([chartId, dataURL]) => (
                <div key={chartId} className="bg-white rounded-xl p-4 border border-gray-200">
                  <h3 className="font-bold text-sm text-gray-900 mb-2">{chartId}</h3>
                  <img
                    src={dataURL}
                    alt={chartId}
                    className="w-full rounded-lg border border-gray-300"
                  />
                  <p className="text-xs text-gray-600 mt-2">
                    PNG @ 2x (Retina) - {Math.round(dataURL.length / 1024)} KB
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ChartBlockExample;
