import { z } from "zod";

export const AnalysisPackSchema = z.object({
  meta: z.object({
    org_name: z.string(),
    period_label: z.string(),
    scope_label: z.string(),
    currency: z.enum(["BRL", "USD", "EUR"]),
    generated_at_iso: z.string(),
  }),
  executive_summary: z.object({
    headline: z.string(),
    bullets: z.array(z.string()).min(3).max(8),
    risks: z.array(z.string()).min(1).max(6),
    opportunities: z.array(z.string()).min(1).max(6),
  }),
  actions: z.array(
    z.object({
      owner: z.string(),
      action: z.string(),
      eta: z.string(),
      expected_impact: z.string(),
    })
  ).min(2).max(10),
  charts: z.array(
    z.discriminatedUnion("kind", [
      z.object({ id: z.string(), kind: z.literal("line"), dataset_key: z.literal("r12"), title: z.string(), series_keys: z.array(z.string()).min(1) }),
      z.object({ id: z.string(), kind: z.literal("waterfall"), dataset_key: z.literal("ebitda_bridge_vs_plan_ytd"), title: z.string() }),
      z.object({ id: z.string(), kind: z.literal("pareto"), dataset_key: z.literal("pareto_cost_variance_ytd"), title: z.string(), top_n: z.number().int().min(5).max(20) }),
      z.object({ id: z.string(), kind: z.literal("heatmap"), dataset_key: z.literal("heatmap_variance"), title: z.string() }),
    ])
  ).min(2).max(8),
  slides: z.array(
    z.object({
      title: z.string(),
      subtitle: z.string().optional(),
      blocks: z.array(
        z.discriminatedUnion("type", [
          z.object({ type: z.literal("text"), title: z.string().optional(), bullets: z.array(z.string()).min(1).max(10) }),
          z.object({ type: z.literal("callout"), intent: z.enum(["positive", "negative", "neutral"]), title: z.string(), bullets: z.array(z.string()).min(1).max(6) }),
          z.object({ type: z.literal("kpi_grid"), title: z.string().optional(), kpi_codes: z.array(z.string()).min(3).max(12) }),
          z.object({ type: z.literal("chart"), chart_id: z.string(), height: z.enum(["sm", "md", "lg"]), note: z.string().optional() }),
          z.object({ type: z.literal("table"), title: z.string().optional(), dataset_key: z.literal("drivers_table") }),
        ])
      ).min(2).max(8),
    })
  ).min(5).max(12),
});

export type AnalysisPackZ = z.infer<typeof AnalysisPackSchema>;

// Helper function to validate AnalysisPack
export function validateAnalysisPack(data: unknown): AnalysisPackZ {
  return AnalysisPackSchema.parse(data);
}

// Helper function to safely validate AnalysisPack
export function safeValidateAnalysisPack(data: unknown): {
  success: boolean;
  data?: AnalysisPackZ;
  error?: z.ZodError;
} {
  const result = AnalysisPackSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  } else {
    return { success: false, error: result.error };
  }
}
