import { callClaudeJSON } from '../../services/claudeService';
import { buildSystemPrompt, buildUserPrompt } from '../../analysisPack/utils/prompts';
import { AnalysisPackSchema } from '../../analysisPack/types/schema';
import type { AnalysisContext } from '../../types';

/**
 * Schema JSON "enxuto" para não estourar complexidade da API do Claude.
 * A validação real e completa acontece via Zod (AnalysisPackSchema).
 */
function analysisPackJsonSchema() {
  return {
    type: "object",
    additionalProperties: false,
    properties: {
      meta: {
        type: "object",
        additionalProperties: false,
        properties: {
          org_name: { type: "string" },
          period_label: { type: "string" },
          scope_label: { type: "string" },
          currency: { type: "string", enum: ["BRL", "USD", "EUR"] },
          generated_at_iso: { type: "string" },
        },
        required: ["org_name", "period_label", "scope_label", "currency", "generated_at_iso"],
      },
      executive_summary: {
        type: "object",
        additionalProperties: false,
        properties: {
          headline: { type: "string" },
          bullets: { type: "array", items: { type: "string" } },
          risks: { type: "array", items: { type: "string" } },
          opportunities: { type: "array", items: { type: "string" } },
        },
        required: ["headline", "bullets", "risks", "opportunities"],
      },
      actions: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            owner: { type: "string" },
            action: { type: "string" },
            eta: { type: "string" },
            expected_impact: { type: "string" },
          },
          required: ["owner", "action", "eta", "expected_impact"],
        },
      },
      charts: { type: "array", items: { type: "object" } },
      slides: { type: "array", items: { type: "object" } },
    },
    required: ["meta", "executive_summary", "actions", "charts", "slides"],
  };
}

/**
 * Handler para requisições POST /api/analysis/generate-ai
 */
export async function handler(req: any, res: any) {
  // Validar método
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = req.body as { context: AnalysisContext };

    // Validar body
    if (!body?.context) {
      return res.status(400).json({
        error: 'context obrigatório',
        message: 'O body deve conter um objeto "context" do tipo AnalysisContext'
      });
    }

    // Construir prompts
    const system = buildSystemPrompt();
    const user = buildUserPrompt(body.context);

    // Chamar Claude com JSON Schema
    const raw = await callClaudeJSON({
      system,
      user,
      jsonSchema: analysisPackJsonSchema(),
      maxTokens: 5000,
    });

    // Validar com Zod
    const parsed = AnalysisPackSchema.safeParse(raw);
    if (!parsed.success) {
      return res.status(422).json({
        error: 'IA retornou JSON inválido (Zod)',
        issues: parsed.error.issues
      });
    }

    // Retornar sucesso
    return res.status(200).json({
      success: true,
      data: parsed.data
    });

  } catch (error: any) {
    console.error('Error generating AnalysisPack with AI:', error);

    // Erro de API do Claude
    if (error.message?.includes('Claude API erro')) {
      return res.status(502).json({
        error: 'Erro ao comunicar com Claude API',
        message: error.message
      });
    }

    // Erro de chave de API
    if (error.message?.includes('not configured')) {
      return res.status(500).json({
        error: 'API key não configurada',
        message: 'Configure ANTHROPIC_API_KEY no .env'
      });
    }

    // Erro genérico
    return res.status(500).json({
      error: 'Erro interno ao gerar análise',
      message: error.message
    });
  }
}

// Para frameworks como Express
export default handler;
