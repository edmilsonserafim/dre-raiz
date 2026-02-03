// Backend server para APIs do DRE RAIZ
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Carregar variáveis de ambiente
dotenv.config();

const app = express();
const PORT = 3002;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Log de requisições
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// ========================================
// API: Generate AI Analysis
// ========================================
app.post('/api/analysis/generate-ai', async (req, res) => {
  try {
    const { context, type } = req.body;

    // Validar entrada
    if (!context) {
      return res.status(400).json({
        error: 'context obrigatório',
        message: 'O body deve conter um objeto "context" do tipo AnalysisContext'
      });
    }

    console.log(`🤖 Gerando análise ${type || 'full'} para ${context.org_name}...`);

    // Construir prompts (inline, sem imports TS)
    const system = `
Você é um analista FP&A sênior (estilo CFO). Seu trabalho:
- Explicar performance (Real vs Orçado e vs Prior quando houver)
- Priorizar por Pareto 80/20
- Ser objetivo, acionável, sem floreio
- NÃO recalcular números: use apenas os dados fornecidos
- Evite jargão excessivo; use linguagem corporativa clara
- Sempre incluir: headline, principais drivers, riscos, oportunidades e ações recomendadas.

Gere uma estrutura de slides (como uma apresentação pronta) + definições de gráficos.

IMPORTANTE: Retorne APENAS um JSON válido no formato AnalysisPack sem texto adicional.
`;

    const user = `
Crie um pacote de análise e slides para:
- Organização: ${context.org_name}
- Escopo: ${context.scope_label}
- Período: ${context.period_label}
- Moeda: ${context.currency}

KPIs (já calculados):
${JSON.stringify(context.kpis, null, 2)}

Datasets disponíveis (use por referência; não invente chaves):
${JSON.stringify(Object.keys(context.datasets), null, 2)}

Regras:
${JSON.stringify(context.analysis_rules ?? {}, null, 2)}

Instruções:
1) Gere de 5 a 12 slides.
2) Use pelo menos: 1 waterfall/bridge, 1 linha R12 e 1 pareto.
3) Escreva bullets curtos (1 linha) com números quando fizer sentido.
4) Traga ações recomendadas (com dono/ETA/impacto).

Schema JSON esperado:
{
  "meta": {
    "org_name": "${context.org_name}",
    "period_label": "${context.period_label}",
    "scope_label": "${context.scope_label}",
    "currency": "${context.currency}",
    "generated_at_iso": "ISO_DATE_STRING"
  },
  "executive_summary": {
    "headline": "string (frase principal resumindo performance)",
    "bullets": ["3-8 bullets destacando principais achados"],
    "risks": ["1-6 riscos identificados"],
    "opportunities": ["1-6 oportunidades"]
  },
  "actions": [
    {
      "owner": "string (responsável)",
      "action": "string (o que fazer)",
      "eta": "DD/MM/YYYY",
      "expected_impact": "string (impacto esperado)"
    }
  ],
  "charts": [
    {
      "id": "string (unique)",
      "kind": "line" | "waterfall" | "pareto" | "heatmap",
      "dataset_key": "r12" | "ebitda_bridge_vs_plan_ytd" | "pareto_cost_variance_ytd" | "heatmap_variance",
      "title": "string",
      "series_keys": ["array de keys"] // apenas para line charts
      // ou "top_n": number // apenas para pareto
    }
  ],
  "slides": [
    {
      "title": "string",
      "subtitle": "string (opcional)",
      "blocks": [
        {
          "type": "text" | "callout" | "kpi_grid" | "chart" | "table",
          // campos específicos por tipo:
          // text: { title?, bullets: [] }
          // callout: { intent: "positive"|"negative"|"neutral", title, bullets: [] }
          // kpi_grid: { title?, kpi_codes: [] }
          // chart: { chart_id, height: "sm"|"md"|"lg", note? }
          // table: { title?, dataset_key: "drivers_table" }
        }
      ]
    }
  ]
}

Retorne APENAS o JSON válido, sem markdown ou texto adicional.
`;

    // Schema JSON simplificado
    const analysisPackJsonSchema = {
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

    // Chamar Claude API diretamente
    console.log('📡 Chamando Claude API...');

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error("ANTHROPIC_API_KEY não configurado no .env");
    }

    const model = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-5-20250929";

    const claudeResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        max_tokens: 5000,
        system: system,
        messages: [{ role: "user", content: user }],
        output_config: {
          format: { type: "json_schema", schema: analysisPackJsonSchema },
        },
      }),
    });

    if (!claudeResponse.ok) {
      const errorText = await claudeResponse.text();
      throw new Error(`Claude API erro ${claudeResponse.status}: ${errorText}`);
    }

    const claudeData = await claudeResponse.json();
    const textResponse = claudeData?.content?.[0]?.text;
    if (!textResponse) {
      throw new Error("Resposta vazia do Claude");
    }

    console.log('✅ Resposta recebida do Claude');

    // Parse JSON response
    const raw = JSON.parse(textResponse);

    // Validação básica (sem Zod, pois não temos imports TS)
    if (!raw.meta || !raw.executive_summary || !raw.actions || !raw.charts || !raw.slides) {
      console.error('❌ JSON inválido retornado pelo Claude');
      return res.status(422).json({
        error: 'IA retornou JSON inválido',
        message: 'Estrutura do AnalysisPack incompleta'
      });
    }

    console.log('✅ Análise gerada com sucesso!');

    const parsed = { data: raw }; // Emular estrutura do Zod

    // Retornar baseado no tipo solicitado
    if (type === 'summary') {
      return res.status(200).json({
        success: true,
        data: {
          executive_summary: parsed.data.executive_summary,
          meta: parsed.data.meta
        }
      });
    } else if (type === 'actions') {
      return res.status(200).json({
        success: true,
        data: {
          actions: parsed.data.actions
        }
      });
    } else {
      // type === 'full' ou undefined
      return res.status(200).json({
        success: true,
        data: parsed.data
      });
    }

  } catch (error) {
    console.error('❌ Erro ao gerar análise:', error);

    // Erro de API do Claude
    if (error.message?.includes('Claude API erro')) {
      return res.status(502).json({
        error: 'Erro ao comunicar com Claude API',
        message: error.message
      });
    }

    // Erro de chave de API
    if (error.message?.includes('not configured') || error.message?.includes('ANTHROPIC_API_KEY')) {
      return res.status(500).json({
        error: 'API key não configurada',
        message: 'Configure ANTHROPIC_API_KEY no .env'
      });
    }

    // Erro genérico
    return res.status(500).json({
      error: 'Erro interno ao gerar análise',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// ========================================
// API: Sync Conta Contábil (Google Sheets)
// ========================================
app.post('/api/sync/conta-contabil', async (req, res) => {
  try {
    const body = req.body;

    // Validar body
    if (!body || !body.cod_conta) {
      return res.status(400).json({
        error: 'Dados inválidos',
        message: 'cod_conta é obrigatório'
      });
    }

    console.log(`📊 Sincronizando conta: ${body.cod_conta}`);

    // TODO: Implementar integração com Supabase
    // Por enquanto, apenas simular sucesso
    console.log(`✅ Conta ${body.cod_conta} sincronizada (simulado)`);

    return res.status(200).json({
      success: true,
      message: 'Conta sincronizada com sucesso',
      data: {
        cod_conta: body.cod_conta,
        synced_at: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Erro na sincronização:', error);
    return res.status(500).json({
      error: 'Erro interno',
      message: error.message
    });
  }
});

// ========================================
// Health Check
// ========================================
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    anthropic_key: process.env.ANTHROPIC_API_KEY ? '✅ Configurado' : '❌ Não configurado'
  });
});

// ========================================
// Iniciar Servidor
// ========================================
app.listen(PORT, () => {
  console.log('\n' + '='.repeat(60));
  console.log('🚀 DRE RAIZ - Backend Server');
  console.log('='.repeat(60));
  console.log(`✅ Servidor rodando: http://localhost:${PORT}`);
  console.log(`🔑 Anthropic API Key: ${process.env.ANTHROPIC_API_KEY ? '✅ Configurado' : '❌ NÃO CONFIGURADO'}`);
  console.log(`📊 Endpoint disponível: POST http://localhost:${PORT}/api/analysis/generate-ai`);
  console.log(`💚 Health check: GET http://localhost:${PORT}/health`);
  console.log('='.repeat(60) + '\n');
});

// Tratamento de erros não capturados
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled Rejection:', error);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});
