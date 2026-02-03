"use client";

import React, { useEffect, useMemo, useRef } from "react";
import ReactECharts from "echarts-for-react";
import type { ChartDef, AnalysisContext } from "../../types";
import { buildEChartsOption } from "../utils/echartsBuilder";

interface ChartRendererEChartsProps {
  chart: ChartDef;
  context: AnalysisContext;
  height?: number;
  onRegister?: (chartId: string, exporter: () => string | null) => () => void;
}

/**
 * Renderiza gráficos usando Apache ECharts (via echarts-for-react)
 * Suporta: line, waterfall, pareto, heatmap
 *
 * Com suporte opcional a exportação via onRegister callback
 *
 * @example
 * ```tsx
 * const chartRegistry = useChartRegistry();
 *
 * <ChartRendererECharts
 *   chart={chartDef}
 *   context={context}
 *   height={400}
 *   onRegister={chartRegistry.register}
 * />
 * ```
 */
export const ChartRendererECharts: React.FC<ChartRendererEChartsProps> = ({
  chart,
  context,
  height = 400,
  onRegister
}) => {
  const ref = useRef<ReactECharts>(null);

  // Memoizar opções do gráfico para evitar re-renders desnecessários
  const option = useMemo(
    () => buildEChartsOption({
      def: chart,
      datasets: context.datasets,
      currency: context.currency
    }),
    [chart, context.datasets, context.currency]
  );

  // Registrar função de exportação
  useEffect(() => {
    if (!onRegister) return;

    const cleanup = onRegister(chart.id, () => {
      const inst = ref.current?.getEchartsInstance();
      if (!inst) return null;

      try {
        return inst.getDataURL({
          type: "png",
          pixelRatio: 2,
          backgroundColor: "#FFFFFF"
        });
      } catch (error) {
        console.error(`Erro ao exportar gráfico ${chart.id}:`, error);
        return null;
      }
    });

    return cleanup;
  }, [onRegister, chart.id]);

  return (
    <div className="w-full rounded-2xl border bg-white p-3 shadow-sm">
      <ReactECharts
        ref={ref}
        option={option}
        style={{ height: `${height}px`, width: "100%" }}
        opts={{ renderer: "canvas" }}
      />
    </div>
  );
};
