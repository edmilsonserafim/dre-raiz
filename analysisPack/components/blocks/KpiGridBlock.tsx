"use client";

import type { KPI } from "../../../types";

export interface KpiGridBlockProps {
  block: any;
  kpis: KPI[];
}

function fmt(v: number, unit: KPI["unit"]) {
  if (unit === "percent") return `${(v * 100).toFixed(1)}%`;
  return v.toLocaleString("pt-BR", { maximumFractionDigits: 0 });
}

/**
 * KpiGridBlock - Renderiza grid de KPIs
 *
 * Versão simplificada que mostra:
 * - Nome e valor atual
 * - Delta vs plano (se disponível)
 */
export function KpiGridBlock({ block, kpis }: KpiGridBlockProps) {
  const set = new Map(kpis.map(k => [k.code, k]));
  const items = block.kpi_codes.map((c: string) => set.get(c)).filter(Boolean) as KPI[];

  return (
    <div className="rounded-2xl border bg-white p-4">
      {block.title && <div className="mb-3 font-semibold">{block.title}</div>}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {items.map((k) => (
          <div key={k.code} className="rounded-xl border p-3">
            <div className="text-xs text-neutral-600">{k.name}</div>
            <div className="text-lg font-semibold">{fmt(k.actual, k.unit)}</div>
            <div className="mt-1 text-xs text-neutral-600">
              {k.delta_vs_plan != null ? `Δ vs Orç: ${fmt(k.delta_vs_plan, k.unit)}` : "—"}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
