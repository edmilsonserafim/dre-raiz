import type { DatasetRegistry, ChartDef, CurrencyCode } from "../../types";

/**
 * Formata valores monetários de forma compacta (K/M)
 */
function fmtCurrency(v: number, ccy: CurrencyCode): string {
  const sign = v < 0 ? "-" : "";
  const abs = Math.abs(v);
  const short =
    abs >= 1_000_000 ? `${(abs / 1_000_000).toFixed(1)}M` :
    abs >= 1_000 ? `${(abs / 1_000).toFixed(0)}K` :
    `${abs.toFixed(0)}`;
  return `${sign}${ccy} ${short}`;
}

/**
 * Constrói opções de configuração para ECharts baseado no tipo de gráfico
 */
export function buildEChartsOption(args: {
  def: ChartDef;
  datasets: DatasetRegistry;
  currency: CurrencyCode;
}) {
  const { def, datasets, currency } = args;

  // Line Chart - Gráfico de linhas (ex: R12 receita/EBITDA)
  if (def.kind === "line") {
    const ds = datasets.r12!;
    const series = ds.series
      .filter(s => def.series_keys.includes(s.key))
      .map(s => ({
        name: s.name,
        type: "line" as const,
        smooth: true,
        showSymbol: false,
        data: s.data,
      }));

    return {
      title: { text: def.title, left: "center" },
      tooltip: { trigger: "axis" },
      legend: { top: 30 },
      grid: { left: 40, right: 20, top: 80, bottom: 40 },
      xAxis: { type: "category" as const, data: ds.x },
      yAxis: {
        type: "value" as const,
        axisLabel: {
          formatter: (v: number) => fmtCurrency(v, currency),
        },
      },
      series,
    };
  }

  // Waterfall Chart - Gráfico cascata (ex: ponte de EBITDA)
  if (def.kind === "waterfall") {
    const ds = datasets.ebitda_bridge_vs_plan_ytd!;
    const labels = [ds.start_label, ...ds.steps.map(s => s.label), ds.end_label];

    // ECharts waterfall via stacked bar (base + delta)
    const base: number[] = [];
    const delta: number[] = [];
    let acc = ds.start_value;

    // Primeiro item (start)
    base.push(0);
    delta.push(ds.start_value);

    // Steps intermediários
    for (const s of ds.steps) {
      base.push(acc);
      delta.push(s.value);
      acc += s.value;
    }

    // Último item (end)
    base.push(0);
    delta.push(ds.end_value);

    return {
      title: { text: def.title, left: "center" },
      tooltip: {
        trigger: "axis" as const,
        axisPointer: { type: "shadow" as const },
        valueFormatter: (v: any) => fmtCurrency(Number(v), currency),
      },
      grid: { left: 40, right: 20, top: 80, bottom: 40 },
      xAxis: { type: "category" as const, data: labels },
      yAxis: {
        type: "value" as const,
        axisLabel: { formatter: (v: number) => fmtCurrency(v, currency) },
      },
      series: [
        {
          name: "base",
          type: "bar" as const,
          stack: "total",
          itemStyle: { color: "transparent" },
          emphasis: { itemStyle: { color: "transparent" } },
          data: base,
        },
        {
          name: "variação",
          type: "bar" as const,
          stack: "total",
          data: delta,
          label: {
            show: true,
            position: "top" as const,
            formatter: ({ value }: any) => fmtCurrency(Number(value), currency),
          },
        },
      ],
    };
  }

  // Pareto Chart - Gráfico de Pareto (barras + linha acumulada)
  if (def.kind === "pareto") {
    const ds = datasets.pareto_cost_variance_ytd!;
    const items = [...ds.items]
      .sort((a, b) => Math.abs(b.value) - Math.abs(a.value))
      .slice(0, def.top_n);

    const x = items.map(i => i.name);
    const y = items.map(i => i.value);

    // Linha acumulada (% do total absoluto)
    const totalAbs = items.reduce((s, i) => s + Math.abs(i.value), 0) || 1;
    let acc = 0;
    const pct = items.map(i => {
      acc += Math.abs(i.value);
      return acc / totalAbs;
    });

    return {
      title: { text: def.title, left: "center" },
      tooltip: { trigger: "axis" as const },
      legend: { top: 30 },
      grid: { left: 40, right: 60, top: 80, bottom: 80 },
      xAxis: {
        type: "category" as const,
        data: x,
        axisLabel: { rotate: 25 },
      },
      yAxis: [
        {
          type: "value" as const,
          axisLabel: { formatter: (v: number) => fmtCurrency(v, currency) }
        },
        {
          type: "value" as const,
          min: 0,
          max: 1,
          axisLabel: { formatter: (v: number) => `${Math.round(v * 100)}%` }
        },
      ],
      series: [
        {
          name: "Variação",
          type: "bar" as const,
          data: y
        },
        {
          name: "Acumulado",
          type: "line" as const,
          yAxisIndex: 1,
          data: pct,
          smooth: true
        },
      ],
    };
  }

  // Heatmap - Mapa de calor (ex: variações por marca/categoria)
  if (def.kind === "heatmap") {
    const ds = datasets.heatmap_variance!;

    return {
      title: { text: def.title, left: "center" },
      tooltip: {
        position: "top" as const,
        formatter: (p: any) => {
          const [xI, yI, v] = p.data as [number, number, number];
          return `${ds.y[yI]} / ${ds.x[xI]}: ${fmtCurrency(v, currency)}`;
        },
      },
      grid: { left: 120, right: 20, top: 80, bottom: 40 },
      xAxis: {
        type: "category" as const,
        data: ds.x,
        splitArea: { show: true }
      },
      yAxis: {
        type: "category" as const,
        data: ds.y,
        splitArea: { show: true }
      },
      visualMap: {
        min: -1_000_000,
        max: 1_000_000,
        calculable: true,
        orient: "horizontal" as const,
        left: "center",
        bottom: 0,
      },
      series: [
        {
          name: "Variance",
          type: "heatmap" as const,
          data: ds.values,
          label: { show: false },
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowColor: "rgba(0,0,0,0.3)"
            }
          },
        },
      ],
    };
  }

  // Fallback: gráfico vazio com título
  return { title: { text: def.title } };
}
