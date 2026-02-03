/**
 * Exemplo de uso do useChartRegistry para exportar gráficos
 */

import React, { useState } from 'react';
import { ChartRendererECharts } from '../components/ChartRendererECharts';
import { useChartRegistry } from '../hooks/useChartRegistry';
import { getMockContext } from '../mock/mockContext';
import type { ChartDef } from '../../types';

export function ExportChartsExample() {
  const context = getMockContext();
  const chartRegistry = useChartRegistry();
  const [exportedPngs, setExportedPngs] = useState<Record<string, string>>({});
  const [exporting, setExporting] = useState(false);

  // Definir alguns gráficos
  const charts: ChartDef[] = [
    {
      id: 'revenue_chart',
      kind: 'line',
      dataset_key: 'r12',
      title: 'Evolução de Receita e EBITDA',
      series_keys: ['revenue', 'ebitda']
    },
    {
      id: 'waterfall_chart',
      kind: 'waterfall',
      dataset_key: 'ebitda_bridge_vs_plan_ytd',
      title: 'Ponte de EBITDA'
    },
    {
      id: 'pareto_chart',
      kind: 'pareto',
      dataset_key: 'pareto_cost_variance_ytd',
      title: 'Top 10 Variações de Custo',
      top_n: 10
    }
  ];

  const handleExportAll = async () => {
    setExporting(true);
    try {
      const pngs = await chartRegistry.exportAllPngBase64();
      setExportedPngs(pngs);
      console.log('Exported charts:', Object.keys(pngs));
    } catch (error) {
      console.error('Erro ao exportar gráficos:', error);
    } finally {
      setExporting(false);
    }
  };

  const handleDownload = (chartId: string) => {
    const dataURL = exportedPngs[chartId];
    if (!dataURL) return;

    // Criar link temporário e fazer download
    const link = document.createElement('a');
    link.href = dataURL;
    link.download = `${chartId}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadAll = () => {
    Object.entries(exportedPngs).forEach(([chartId]) => {
      setTimeout(() => handleDownload(chartId), 100);
    });
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-black text-gray-900 mb-2">
            Export Charts - Exemplo
          </h1>
          <p className="text-gray-600 mb-4">
            Demonstração de exportação de múltiplos gráficos como PNG
          </p>

          {/* Export Controls */}
          <div className="flex items-center gap-4">
            <button
              onClick={handleExportAll}
              disabled={exporting}
              className="px-6 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {exporting ? 'Exportando...' : '📸 Exportar Todos os Gráficos'}
            </button>

            {Object.keys(exportedPngs).length > 0 && (
              <button
                onClick={handleDownloadAll}
                className="px-6 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700"
              >
                💾 Download Todos ({Object.keys(exportedPngs).length})
              </button>
            )}

            <div className="text-sm text-gray-600">
              Registrados: {chartRegistry.getRegisteredIds().length} gráficos
            </div>
          </div>
        </div>

        {/* Charts */}
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
                chartRegistry={chartRegistry}
              />

              {exportedPngs[chart.id] && (
                <div className="mt-4 flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className="text-green-600 font-bold">✓</span>
                    <span className="text-sm text-green-800">
                      Exportado com sucesso
                    </span>
                  </div>
                  <button
                    onClick={() => handleDownload(chart.id)}
                    className="px-4 py-2 bg-green-600 text-white text-sm font-bold rounded-lg hover:bg-green-700"
                  >
                    💾 Download PNG
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Preview dos PNGs exportados */}
        {Object.keys(exportedPngs).length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-black text-gray-900 mb-6">
              Preview dos Gráficos Exportados
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Object.entries(exportedPngs).map(([chartId, dataURL]) => (
                <div
                  key={chartId}
                  className="bg-white rounded-xl shadow p-4 border border-gray-200"
                >
                  <h3 className="font-bold text-gray-900 mb-2">{chartId}</h3>
                  <img
                    src={dataURL}
                    alt={chartId}
                    className="w-full rounded-lg border border-gray-300"
                  />
                  <div className="mt-2 flex items-center justify-between text-xs text-gray-600">
                    <span>PNG Base64 (Retina 2x)</span>
                    <span>{Math.round(dataURL.length / 1024)} KB</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Info */}
        <div className="mt-12 bg-blue-50 rounded-xl p-6 border border-blue-200">
          <h3 className="font-black text-blue-900 mb-3">💡 Como Funciona</h3>
          <ol className="space-y-2 text-sm text-blue-800">
            <li>
              <strong>1. Registro:</strong> Cada gráfico se registra automaticamente
              no <code className="bg-blue-100 px-2 py-1 rounded">chartRegistry</code> quando montado
            </li>
            <li>
              <strong>2. Exportação:</strong> Ao clicar em "Exportar", o
              <code className="bg-blue-100 px-2 py-1 rounded">exportAllPngBase64()</code> chama
              a função de exportação de cada gráfico
            </li>
            <li>
              <strong>3. PNG Base64:</strong> ECharts gera PNG em base64 com
              <code className="bg-blue-100 px-2 py-1 rounded">getDataURL()</code> (Retina 2x)
            </li>
            <li>
              <strong>4. Download:</strong> Converte dataURL em arquivo para download
            </li>
          </ol>
        </div>

        {/* Code Example */}
        <div className="mt-8 bg-gray-900 rounded-xl p-6 overflow-x-auto">
          <h3 className="text-white font-black mb-4">💻 Código</h3>
          <pre className="text-green-400 text-sm">
{`import { useChartRegistry, ChartRendererECharts } from './analysisPack';

function MyComponent() {
  const chartRegistry = useChartRegistry();

  const handleExport = async () => {
    // Exporta todos os gráficos registrados
    const pngs = await chartRegistry.exportAllPngBase64();

    // pngs = {
    //   'chart_1': 'data:image/png;base64,...',
    //   'chart_2': 'data:image/png;base64,...'
    // }

    // Usar para PPT, enviar para servidor, etc
    console.log('Exported:', Object.keys(pngs));
  };

  return (
    <>
      <ChartRendererECharts
        chart={chartDef}
        context={context}
        chartRegistry={chartRegistry} // Importante!
      />
      <button onClick={handleExport}>Export All</button>
    </>
  );
}`}
          </pre>
        </div>

        {/* Use Cases */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-purple-50 rounded-xl p-6 border border-purple-200">
            <h3 className="font-black text-purple-900 mb-2">📊 PPT Export</h3>
            <p className="text-sm text-purple-800">
              Exportar todos os gráficos para PowerPoint usando pptExportService
            </p>
          </div>

          <div className="bg-orange-50 rounded-xl p-6 border border-orange-200">
            <h3 className="font-black text-orange-900 mb-2">📧 Email Report</h3>
            <p className="text-sm text-orange-800">
              Anexar gráficos em emails de relatório automático
            </p>
          </div>

          <div className="bg-teal-50 rounded-xl p-6 border border-teal-200">
            <h3 className="font-black text-teal-900 mb-2">💾 Save to DB</h3>
            <p className="text-sm text-teal-800">
              Salvar snapshots de gráficos no Supabase para histórico
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ExportChartsExample;
