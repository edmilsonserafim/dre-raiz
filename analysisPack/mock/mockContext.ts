import type { AnalysisContext } from "../../types";

/**
 * Retorna um contexto de análise mock completo e realista
 * Útil para testes e demonstrações sem precisar processar transações reais
 */
export function getMockContext(): AnalysisContext {
  return {
    org_name: "Raiz Educação (Demo)",
    currency: "BRL",
    period_label: "YTD Jan/2026",
    scope_label: "Consolidado",
    kpis: [
      {
        code: "REVENUE",
        name: "Receita Líquida",
        unit: "currency",
        actual: 125_000_000,
        plan: 128_500_000,
        prior: 119_000_000,
        delta_vs_plan: -3_500_000,
        delta_vs_prior: 6_000_000
      },
      {
        code: "EBITDA",
        name: "EBITDA",
        unit: "currency",
        actual: 18_200_000,
        plan: 20_000_000,
        prior: 16_900_000,
        delta_vs_plan: -1_800_000,
        delta_vs_prior: 1_300_000
      },
      {
        code: "MARGIN",
        name: "Margem EBITDA",
        unit: "percent",
        actual: 0.146,
        plan: 0.156,
        prior: 0.142,
        delta_vs_plan: -0.010,
        delta_vs_prior: 0.004
      },
      {
        code: "OPEX",
        name: "SG&A",
        unit: "currency",
        actual: 28_400_000,
        plan: 27_200_000,
        prior: 27_900_000,
        delta_vs_plan: 1_200_000,
        delta_vs_prior: 500_000
      },
    ],
    datasets: {
      r12: {
        x: ["2025-03", "2025-04", "2025-05", "2025-06", "2025-07", "2025-08", "2025-09", "2025-10", "2025-11", "2025-12", "2026-01", "2026-02"],
        series: [
          {
            key: "rev_actual",
            name: "Receita Real",
            unit: "currency",
            data: [9.8, 10.1, 10.4, 10.0, 10.8, 10.9, 11.0, 10.7, 10.9, 11.1, 11.5, 11.7].map(v => v * 1_000_000)
          },
          {
            key: "rev_plan",
            name: "Receita Orçada",
            unit: "currency",
            data: [10.0, 10.2, 10.6, 10.3, 10.9, 11.0, 11.1, 10.9, 11.0, 11.2, 11.7, 11.9].map(v => v * 1_000_000)
          },
          {
            key: "ebitda_actual",
            name: "EBITDA Real",
            unit: "currency",
            data: [1.2, 1.3, 1.4, 1.1, 1.6, 1.7, 1.6, 1.4, 1.5, 1.7, 1.8, 1.9].map(v => v * 1_000_000)
          },
          {
            key: "ebitda_plan",
            name: "EBITDA Orçado",
            unit: "currency",
            data: [1.3, 1.35, 1.45, 1.25, 1.7, 1.75, 1.65, 1.55, 1.6, 1.8, 1.95, 2.0].map(v => v * 1_000_000)
          },
        ],
      },
      ebitda_bridge_vs_plan_ytd: {
        start_label: "EBITDA Orç",
        end_label: "EBITDA Real",
        start_value: 20_000_000,
        end_value: 18_200_000,
        steps: [
          { label: "Gap Receita", value: -3_500_000 },
          { label: "Custos Variáveis", value: 900_000 },
          { label: "Custos Fixos", value: -650_000 },
          { label: "SG&A", value: -1_200_000 },
          { label: "Outros", value: 650_000 },
        ],
      },
      pareto_cost_variance_ytd: {
        items: [
          { name: "Folha Professores", value: -950_000 },
          { name: "Energia", value: -280_000 },
          { name: "Material Didático", value: -220_000 },
          { name: "Terceiros", value: -180_000 },
          { name: "Manutenção", value: -120_000 },
          { name: "Alimentação", value: -110_000 },
          { name: "Serviços TI", value: -90_000 },
          { name: "Marketing", value: -70_000 },
          { name: "Fretes", value: -55_000 },
          { name: "Outros", value: -40_000 },
        ],
      },
      heatmap_variance: {
        x: ["Receita", "CV", "CF", "SG&A"],
        y: ["Filial A", "Filial B", "Filial C", "Filial D", "Filial E"],
        values: [
          [0, 0, -400000], [1, 0, 120000], [2, 0, -90000], [3, 0, -160000],
          [0, 1, -900000], [1, 1, 200000], [2, 1, -180000], [3, 1, -350000],
          [0, 2, 200000], [1, 2, 50000], [2, 2, -60000], [3, 2, 80000],
          [0, 3, -150000], [1, 3, 70000], [2, 3, -100000], [3, 3, -90000],
          [0, 4, 100000], [1, 4, -20000], [2, 4, 30000], [3, 4, -40000],
        ],
        unit: "currency",
      },
      drivers_table: {
        columns: ["Driver", "Real", "Orçado", "Δ (R-O)"],
        rows: [
          ["Receita Líquida", 125000000, 128500000, -3500000],
          ["SG&A", 28400000, 27200000, 1200000],
          ["Folha Professores", 41200000, 40250000, 950000],
          ["Energia", 1680000, 1400000, 280000],
        ],
      },
    },
    analysis_rules: {
      prefer_pareto: true,
      highlight_threshold_currency: 150000,
      highlight_threshold_percent: 0.03,
    },
  };
}

/**
 * Retorna um contexto simplificado para testes rápidos
 */
export function getSimpleMockContext(): AnalysisContext {
  const full = getMockContext();
  return {
    ...full,
    datasets: {
      r12: full.datasets.r12,
      ebitda_bridge_vs_plan_ytd: full.datasets.ebitda_bridge_vs_plan_ytd,
    }
  };
}
