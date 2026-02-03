"use client";

import React, { useEffect, useMemo, useRef } from "react";
import ReactECharts from "echarts-for-react";
import type { ChartDef, DatasetRegistry, CurrencyCode } from "../../types";
import { buildEChartsOption } from "../utils/echartsBuilder";

export interface ChartBlockProps {
  def: ChartDef;
  datasets: DatasetRegistry;
  currency: CurrencyCode;
  height: number;
  onRegister?: (chartId: string, exporter: () => string | null) => () => void;
}

/**
 * ChartBlock - Componente de gráfico reutilizável
 *
 * Renderiza gráficos ECharts com suporte a exportação
 *
 * @example
 * ```tsx
 * const chartRegistry = useChartRegistry();
 *
 * <ChartBlock
 *   def={chartDef}
 *   datasets={context.datasets}
 *   currency={context.currency}
 *   height={400}
 *   onRegister={chartRegistry.register}
 * />
 * ```
 */
export function ChartBlock(props: ChartBlockProps) {
  const ref = useRef<ReactECharts>(null);

  const option = useMemo(
    () => buildEChartsOption({
      def: props.def,
      datasets: props.datasets,
      currency: props.currency
    }),
    [props.def, props.datasets, props.currency]
  );

  useEffect(() => {
    if (!props.onRegister) return;

    const cleanup = props.onRegister(props.def.id, () => {
      const inst = ref.current?.getEchartsInstance();
      if (!inst) return null;

      try {
        return inst.getDataURL({
          type: "png",
          pixelRatio: 2,
          backgroundColor: "#FFFFFF"
        });
      } catch (error) {
        console.error(`Erro ao exportar gráfico ${props.def.id}:`, error);
        return null;
      }
    });

    return cleanup;
  }, [props.onRegister, props.def.id]);

  return (
    <div className="rounded-2xl border bg-white p-3 shadow-sm">
      <ReactECharts
        ref={ref}
        option={option}
        style={{ height: props.height }}
        opts={{ renderer: "canvas" }}
      />
    </div>
  );
}
