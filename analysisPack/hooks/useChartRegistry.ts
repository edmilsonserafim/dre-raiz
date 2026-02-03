"use client";

import { useRef } from "react";

export type ChartRegistry = Map<string, () => string | null>;

/**
 * Hook para gerenciar registro de gráficos e exportação em massa
 *
 * Permite que múltiplos gráficos se registrem com uma função de exportação
 * e depois sejam exportados todos de uma vez como PNG base64
 *
 * @example
 * ```tsx
 * function AnalysisView() {
 *   const chartRegistry = useChartRegistry();
 *
 *   const handleExportAll = async () => {
 *     const pngs = await chartRegistry.exportAllPngBase64();
 *     console.log('Exported charts:', Object.keys(pngs));
 *   };
 *
 *   return (
 *     <div>
 *       <ChartRendererECharts
 *         chart={chart1}
 *         context={context}
 *         chartRegistry={chartRegistry}
 *       />
 *       <button onClick={handleExportAll}>Export All</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useChartRegistry() {
  const reg = useRef<ChartRegistry>(new Map());

  /**
   * Registra um gráfico com uma função de exportação
   *
   * @param chartId - ID único do gráfico
   * @param exporter - Função que retorna PNG em base64 (dataURL)
   * @returns Função de cleanup para desregistrar
   */
  function register(chartId: string, exporter: () => string | null) {
    reg.current.set(chartId, exporter);
    return () => reg.current.delete(chartId);
  }

  /**
   * Exporta todos os gráficos registrados como PNG base64
   *
   * @returns Objeto mapeando chartId => base64 dataURL
   */
  async function exportAllPngBase64(): Promise<Record<string, string>> {
    const out: Record<string, string> = {};
    for (const [id, fn] of reg.current.entries()) {
      const b64 = fn();
      if (b64) {
        out[id] = b64; // dataURL base64
      }
    }
    return out;
  }

  /**
   * Retorna a lista de IDs de gráficos registrados
   */
  function getRegisteredIds(): string[] {
    return Array.from(reg.current.keys());
  }

  /**
   * Limpa todos os registros
   */
  function clear() {
    reg.current.clear();
  }

  return {
    register,
    exportAllPngBase64,
    getRegisteredIds,
    clear
  };
}

export type UseChartRegistryReturn = ReturnType<typeof useChartRegistry>;
