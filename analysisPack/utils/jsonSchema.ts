/**
 * JSON Schema para AnalysisPack
 * Usado pela API do Claude para garantir estrutura correta
 */
export const AnalysisPackJSONSchema = {
  type: "object",
  required: ["meta", "executive_summary", "actions", "charts", "slides"],
  properties: {
    meta: {
      type: "object",
      required: ["org_name", "period_label", "scope_label", "currency", "generated_at_iso"],
      properties: {
        org_name: { type: "string" },
        period_label: { type: "string" },
        scope_label: { type: "string" },
        currency: { type: "string", enum: ["BRL", "USD", "EUR"] },
        generated_at_iso: { type: "string" }
      }
    },
    executive_summary: {
      type: "object",
      required: ["headline", "bullets", "risks", "opportunities"],
      properties: {
        headline: { type: "string" },
        bullets: {
          type: "array",
          items: { type: "string" },
          minItems: 3,
          maxItems: 8
        },
        risks: {
          type: "array",
          items: { type: "string" },
          minItems: 1,
          maxItems: 6
        },
        opportunities: {
          type: "array",
          items: { type: "string" },
          minItems: 1,
          maxItems: 6
        }
      }
    },
    actions: {
      type: "array",
      items: {
        type: "object",
        required: ["owner", "action", "eta", "expected_impact"],
        properties: {
          owner: { type: "string" },
          action: { type: "string" },
          eta: { type: "string" },
          expected_impact: { type: "string" }
        }
      },
      minItems: 2,
      maxItems: 10
    },
    charts: {
      type: "array",
      items: {
        type: "object",
        required: ["id", "kind", "dataset_key", "title"],
        properties: {
          id: { type: "string" },
          kind: { type: "string", enum: ["line", "waterfall", "pareto", "heatmap"] },
          dataset_key: { type: "string" },
          title: { type: "string" },
          series_keys: {
            type: "array",
            items: { type: "string" }
          },
          top_n: { type: "number" }
        }
      },
      minItems: 2,
      maxItems: 8
    },
    slides: {
      type: "array",
      items: {
        type: "object",
        required: ["title", "blocks"],
        properties: {
          title: { type: "string" },
          subtitle: { type: "string" },
          blocks: {
            type: "array",
            items: {
              type: "object",
              required: ["type"],
              properties: {
                type: { type: "string", enum: ["text", "callout", "kpi_grid", "chart", "table"] },
                title: { type: "string" },
                bullets: {
                  type: "array",
                  items: { type: "string" }
                },
                intent: { type: "string", enum: ["positive", "negative", "neutral"] },
                kpi_codes: {
                  type: "array",
                  items: { type: "string" }
                },
                chart_id: { type: "string" },
                height: { type: "string", enum: ["sm", "md", "lg"] },
                note: { type: "string" },
                dataset_key: { type: "string" }
              }
            },
            minItems: 2,
            maxItems: 8
          }
        }
      },
      minItems: 5,
      maxItems: 12
    }
  }
};
