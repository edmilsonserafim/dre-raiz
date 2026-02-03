/**
 * Exemplo de uso do SlideDeck
 */

import React from 'react';
import { SlideDeck } from '../components/SlideDeck';
import { useChartRegistry } from '../hooks/useChartRegistry';
import { getMockContext } from '../mock/mockContext';
import { mockAnalysisPack } from '../mock/mockData';

export function SlideDeckExample() {
  const chartRegistry = useChartRegistry();
  const context = getMockContext();

  const handleExportPngs = async () => {
    const pngs = await chartRegistry.exportAllPngBase64();
    console.log('Exported charts:', Object.keys(pngs));

    // Exemplo: Download todos
    Object.entries(pngs).forEach(([chartId, dataURL]) => {
      const link = document.createElement('a');
      link.href = dataURL;
      link.download = `${chartId}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
  };

  const handleExportPpt = async () => {
    const { buildPpt } = await import('../services/pptExportService');
    const pngs = await chartRegistry.exportAllPngBase64();

    await buildPpt({
      pack: mockAnalysisPack,
      chartImages: pngs,
      fileName: 'Analise-Financeira.pptx'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-black text-gray-900 mb-2">
            SlideDeck - Renderizador de Slides
          </h1>
          <p className="text-gray-600 mb-4">
            Componente completo que renderiza todos os slides de um AnalysisPack
          </p>

          <div className="flex gap-3">
            <button
              onClick={handleExportPngs}
              className="px-6 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700"
            >
              📸 Exportar PNGs
            </button>
            <button
              onClick={handleExportPpt}
              className="px-6 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700"
            >
              📊 Exportar PowerPoint
            </button>
          </div>
        </div>

        {/* SlideDeck */}
        <SlideDeck
          pack={mockAnalysisPack}
          ctx={context}
          onRegisterChart={chartRegistry.register}
        />

        {/* Info */}
        <div className="mt-12 bg-white rounded-xl p-6 border border-gray-200">
          <h3 className="font-black text-gray-900 mb-4">💡 Sobre o SlideDeck</h3>

          <div className="space-y-4 text-sm text-gray-700">
            <div>
              <strong>Slides:</strong> {mockAnalysisPack.slides.length} slides renderizados
            </div>

            <div>
              <strong>Gráficos:</strong> {mockAnalysisPack.charts.length} gráficos
            </div>

            <div>
              <strong>KPIs:</strong> {context.kpis.length} KPIs disponíveis
            </div>

            <div>
              <strong>Tipos de Blocos Suportados:</strong>
              <ul className="ml-4 mt-2 space-y-1">
                <li>• <code className="bg-gray-100 px-2 py-1 rounded">text</code> - Texto simples com bullets</li>
                <li>• <code className="bg-gray-100 px-2 py-1 rounded">callout</code> - Destaques coloridos (positive/negative/neutral)</li>
                <li>• <code className="bg-gray-100 px-2 py-1 rounded">kpi_grid</code> - Grid de KPIs com deltas</li>
                <li>• <code className="bg-gray-100 px-2 py-1 rounded">chart</code> - Gráficos ECharts (line/waterfall/pareto/heatmap)</li>
                <li>• <code className="bg-gray-100 px-2 py-1 rounded">table</code> - Tabelas de dados</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Code Example */}
        <div className="mt-8 bg-gray-900 rounded-xl p-6">
          <h3 className="text-white font-black mb-4">💻 Código</h3>
          <pre className="text-green-400 text-sm overflow-x-auto">
{`import { SlideDeck, useChartRegistry, buildPpt } from './analysisPack';

function MyReport() {
  const chartRegistry = useChartRegistry();
  const context = getMockContext();

  const handleExportPpt = async () => {
    const pngs = await chartRegistry.exportAllPngBase64();
    await buildPpt({
      pack: analysisPack,
      chartImages: pngs,
      fileName: 'Relatorio.pptx'
    });
  };

  return (
    <>
      <SlideDeck
        pack={analysisPack}
        ctx={context}
        onRegisterChart={chartRegistry.register}
      />
      <button onClick={handleExportPpt}>Export PowerPoint</button>
    </>
  );
}`}
          </pre>
        </div>

        {/* Architecture */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
            <h3 className="font-black text-blue-900 mb-3">🏗️ Arquitetura</h3>
            <div className="space-y-2 text-sm text-blue-800">
              <div><strong>SlideDeck</strong> → Orquestra tudo</div>
              <div className="ml-4">↳ <strong>TextBlock</strong> → text/callout</div>
              <div className="ml-4">↳ <strong>KpiGridBlock</strong> → kpi_grid</div>
              <div className="ml-4">↳ <strong>TableBlock</strong> → table</div>
              <div className="ml-4">↳ <strong>ChartBlock</strong> → chart</div>
              <div className="ml-8">↳ <strong>ECharts</strong> → renderização</div>
            </div>
          </div>

          <div className="bg-green-50 rounded-xl p-6 border border-green-200">
            <h3 className="font-black text-green-900 mb-3">✅ Features</h3>
            <ul className="space-y-2 text-sm text-green-800">
              <li>✓ Renderização automática de todos os blocos</li>
              <li>✓ Exportação de gráficos via onRegisterChart</li>
              <li>✓ Lookup rápido de charts via Map</li>
              <li>✓ Height mapping (sm/md/lg)</li>
              <li>✓ Suporte a notas em gráficos</li>
              <li>✓ Styling consistente</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SlideDeckExample;
