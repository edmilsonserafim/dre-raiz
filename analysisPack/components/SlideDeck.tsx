"use client";

import type { AnalysisPack, AnalysisContext } from "../../types";
import { ChartBlock } from "./ChartBlock";
import { KpiGridBlock } from "./blocks/KpiGridBlock";
import { TextBlock } from "./blocks/TextBlock";
import { TableBlock } from "./blocks/TableBlock";

export interface SlideDeckProps {
  pack: AnalysisPack;
  ctx: AnalysisContext;
  onRegisterChart?: (chartId: string, exporter: () => string | null) => () => void;
}

/**
 * SlideDeck - Renderiza todos os slides de um AnalysisPack
 *
 * Componente principal que orquestra a renderização de todos os tipos de blocos:
 * - text/callout: Texto e destaques
 * - kpi_grid: Grid de KPIs
 * - table: Tabelas de dados
 * - chart: Gráficos ECharts
 *
 * @example
 * ```tsx
 * const chartRegistry = useChartRegistry();
 *
 * <SlideDeck
 *   pack={analysisPack}
 *   ctx={analysisContext}
 *   onRegisterChart={chartRegistry.register}
 * />
 * ```
 */
export function SlideDeck(props: SlideDeckProps) {
  const chartMap = new Map(props.pack.charts.map(c => [c.id, c]));

  const heightMap = { sm: 260, md: 360, lg: 460 } as const;

  return (
    <div className="space-y-6">
      {props.pack.slides.map((s, idx) => (
        <section key={idx} className="rounded-2xl border bg-neutral-50 p-5">
          {/* Slide Header */}
          <div className="mb-3">
            <div className="text-xl font-semibold">{s.title}</div>
            {s.subtitle && <div className="text-sm text-neutral-600">{s.subtitle}</div>}
          </div>

          {/* Slide Blocks */}
          <div className="grid gap-4">
            {s.blocks.map((b, i) => {
              // Text or Callout block
              if (b.type === "text" || b.type === "callout") {
                return <TextBlock key={i} block={b} />;
              }

              // KPI Grid block
              if (b.type === "kpi_grid") {
                return <KpiGridBlock key={i} block={b} kpis={props.ctx.kpis} />;
              }

              // Table block
              if (b.type === "table") {
                return (
                  <TableBlock
                    key={i}
                    title={b.title}
                    ds={props.ctx.datasets[b.dataset_key]}
                  />
                );
              }

              // Chart block
              if (b.type === "chart") {
                const def = chartMap.get(b.chart_id);
                if (!def) {
                  console.warn(`Chart not found: ${b.chart_id}`);
                  return null;
                }

                return (
                  <div key={i}>
                    <ChartBlock
                      def={def}
                      datasets={props.ctx.datasets}
                      currency={props.ctx.currency}
                      height={heightMap[b.height]}
                      onRegister={props.onRegisterChart}
                    />
                    {b.note && (
                      <div className="mt-2 text-xs text-neutral-600">{b.note}</div>
                    )}
                  </div>
                );
              }

              return null;
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
