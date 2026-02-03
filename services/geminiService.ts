
import { Transaction, SchoolKPIs, IAInsight, AIChartResponse } from "../types";

// API URL - detecta automaticamente produção vs desenvolvimento
const PROXY_URL = import.meta.env.PROD
  ? "/api/anthropic"  // Produção: usa Vercel serverless function
  : "http://localhost:3021/api/anthropic";  // Desenvolvimento: usa proxy local

// Configurações
const ANTHROPIC_MODEL = import.meta.env.VITE_ANTHROPIC_MODEL || "claude-sonnet-4-5-20250929";
const USE_MOCK = import.meta.env.VITE_AI_REPORT_USE_MOCK === "1";

/**
 * Helper function to clean JSON from markdown code blocks
 */
function cleanJsonFromMarkdown(text: string): string {
  // Remove markdown code blocks (```json ... ``` or ``` ... ```)
  let cleaned = text.trim();

  // Remove opening markdown fence
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, '');

  // Remove closing markdown fence
  cleaned = cleaned.replace(/\s*```\s*$/, '');

  return cleaned.trim();
}

/**
 * Helper function to call Anthropic API via proxy
 */
async function callAnthropicAPI(params: {
  system: string;
  messages: Array<{ role: string; content: string }>;
  max_tokens: number;
  temperature: number;
  model?: string;
}): Promise<string> {
  console.log("🔵 Chamando Anthropic API via proxy...", {
    url: PROXY_URL,
    model: params.model || ANTHROPIC_MODEL,
    max_tokens: params.max_tokens,
    use_mock: USE_MOCK
  });

  try {
    const response = await fetch(PROXY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: params.model || ANTHROPIC_MODEL,
        max_tokens: params.max_tokens,
        temperature: params.temperature,
        system: params.system,
        messages: params.messages,
      }),
    });

    console.log("🔵 Status da resposta:", response.status, response.statusText);

    if (!response.ok) {
      const error = await response.text();
      console.error("❌ Anthropic API Error:", error);
      throw new Error(`API Error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    console.log("🔵 Resposta recebida:", data);

    // Extract text from response
    if (data.content && Array.isArray(data.content) && data.content[0]?.type === 'text') {
      console.log("✅ Texto extraído com sucesso");
      return data.content[0].text;
    }

    console.error("❌ Formato de resposta inválido:", data);
    throw new Error("Invalid API response format");
  } catch (error) {
    console.error("❌ Erro ao chamar API:", error);
    throw error;
  }
}

/**
 * getFinancialInsights generates 4 strategic insights using Claude Sonnet 4.5
 */
export const getFinancialInsights = async (transactions: Transaction[], kpis: SchoolKPIs): Promise<IAInsight[]> => {
  const systemInstruction = `Você é o Advisor de Inteligência Financeira da Raiz Educação para a Escola SAP.
Sua missão é analisar os dados financeiros e operacionais (DRE, Alunos, KPIs) e fornecer um Resumo Executivo.
Analise variações de EBITDA, margem e custos por aluno.
Identifique 'Top Drivers' de performance e sugira ações práticas.`;

  const prompt = `Analise os dados consolidados da unidade:
- Receita: R$ ${kpis.totalRevenue.toLocaleString()}
- EBITDA: R$ ${kpis.ebitda.toLocaleString()} (${kpis.netMargin.toFixed(1)}%)
- Alunos Ativos: ${kpis.activeStudents}
- Ticket Médio: R$ ${kpis.revenuePerStudent.toLocaleString()}
- Custo/Aluno: R$ ${kpis.costPerStudent.toLocaleString()}

Responda APENAS com um JSON válido (Array de objetos).
Cada objeto deve ter: title, description, priority ('high', 'medium', 'low') e category ('Driver Positivo', 'Driver Negativo', 'Ação Recomendada').
Gere exatamente 4 insights estratégicos.

Formato de resposta:
[
  {
    "title": "Título do insight",
    "description": "Descrição detalhada",
    "priority": "high",
    "category": "Driver Positivo"
  }
]`;

  try {
    const text = await callAnthropicAPI({
      system: systemInstruction,
      messages: [{ role: "user", content: prompt }],
      max_tokens: 2000,
      temperature: 0.7,
    });

    // Try to parse as object first, then extract array
    try {
      const cleanedText = cleanJsonFromMarkdown(text);
      console.log("🔵 Texto limpo para parse:", cleanedText.substring(0, 200) + "...");

      const parsed = JSON.parse(cleanedText);
      if (Array.isArray(parsed)) {
        return parsed;
      }
      if (parsed.insights && Array.isArray(parsed.insights)) {
        return parsed.insights;
      }
      // If object with keys, try to extract array
      const values = Object.values(parsed);
      if (values.length > 0 && Array.isArray(values[0])) {
        return values[0] as IAInsight[];
      }
    } catch (e) {
      console.error("❌ JSON parse error:", e);
      console.error("❌ Texto recebido:", text);
    }

    // Fallback insights
    return getFallbackInsights(kpis);
  } catch (error) {
    console.error("Erro IA Advisor (Claude):", error);
    return getFallbackInsights(kpis);
  }
};

/**
 * chatWithFinancialData enables conversational analysis with full context and history
 */
export const chatWithFinancialData = async (
  message: string,
  history: { role: 'user' | 'model', content: string }[],
  context: { transactions: Transaction[], kpis: SchoolKPIs }
) => {
  const systemContext = `Você é o "SAP Strategist", um assistente de IA sênior especializado em finanças escolares para a Escola SAP.
Você tem acesso aos KPIs atuais e à lista de transações.
Seu objetivo é ajudar a diretoria a entender os números, encontrar gargalos e sugerir melhorias.

KPIs ATUAIS:
- Receita Total: R$ ${context.kpis.totalRevenue.toLocaleString()}
- EBITDA: R$ ${context.kpis.ebitda.toLocaleString()} (Margem: ${context.kpis.netMargin.toFixed(1)}%)
- Custo por Aluno: R$ ${context.kpis.costPerStudent.toLocaleString()}
- Receita por Aluno: R$ ${context.kpis.revenuePerStudent.toLocaleString()}
- Alunos Ativos: ${context.kpis.activeStudents}
- Meta de Margem Raiz: 25%

Responda de forma executiva, profissional e baseada em dados.
Use **negrito** para destacar informações importantes.`;

  try {
    // Convert history to API format
    const messages: Array<{ role: string; content: string }> = [];

    // Add history
    history.forEach(msg => {
      messages.push({
        role: msg.role === 'model' ? 'assistant' : 'user',
        content: msg.content
      });
    });

    // Add current message
    messages.push({ role: "user", content: message });

    const text = await callAnthropicAPI({
      system: systemContext,
      messages,
      max_tokens: 1500,
      temperature: 0.8,
    });

    return text;
  } catch (error: any) {
    console.error("Erro no Chat IA (Claude):", error);

    if (error?.message?.includes('429') || error?.message?.includes('rate limit')) {
      return "⚠️ **Limite de requisições atingido**\n\nVocê atingiu o limite temporário de requisições da Anthropic. Aguarde alguns segundos e tente novamente.\n\n**Análise Básica dos Dados Atuais:**\n\n- **EBITDA**: R$ " + context.kpis.ebitda.toLocaleString() + " (" + context.kpis.netMargin.toFixed(1) + "%)\n- **Receita/Aluno**: R$ " + context.kpis.revenuePerStudent.toLocaleString() + "\n- **Custo/Aluno**: R$ " + context.kpis.costPerStudent.toLocaleString() + "\n- **Meta de Margem**: 25%";
    }

    return "Desculpe, tive um problema ao analisar seus dados. Verifique se o servidor proxy está rodando (porta 3021) e tente novamente.";
  }
};

/**
 * generateChartWithData enables AI to generate charts alongside text explanations
 */
export const generateChartWithData = async (
  message: string,
  history: { role: 'user' | 'model', content: string }[],
  context: { transactions: Transaction[], kpis: SchoolKPIs }
): Promise<AIChartResponse> => {
  const systemContext = `Você é o "SAP Strategist", um assistente de IA sênior especializado em finanças escolares para a Escola SAP.
Você tem acesso aos KPIs atuais e pode gerar gráficos para ilustrar suas análises.

KPIs ATUAIS:
- Receita Total: R$ ${context.kpis.totalRevenue.toLocaleString()}
- EBITDA: R$ ${context.kpis.ebitda.toLocaleString()} (Margem: ${context.kpis.netMargin.toFixed(1)}%)
- Custo por Aluno: R$ ${context.kpis.costPerStudent.toLocaleString()}
- Receita por Aluno: R$ ${context.kpis.revenuePerStudent.toLocaleString()}
- Alunos Ativos: ${context.kpis.activeStudents}
- Meta de Margem Raiz: 25%

TIPOS DE GRÁFICOS DISPONÍVEIS:
- "line": Evolução temporal de métricas (ex: "evolução do EBITDA mensal")
- "bar": Comparações entre categorias ou filiais (ex: "qual filial tem melhor desempenho")
- "waterfall": Breakdown do EBITDA desde receita até resultado final (ex: "como chegamos no EBITDA")
- "composed": Múltiplas métricas em um gráfico (ex: "compare receita Real vs Orçado")
- "heatmap": Matriz de performance mensal (ex: "mostre padrões mensais")

QUANDO GERAR GRÁFICOS:
- Gere gráficos quando a pergunta pedir visualização de dados, evolução, comparação ou breakdown
- NÃO gere gráficos para perguntas conceituais, de análise qualitativa ou que peçam apenas explicação
- Se gerar gráfico, sempre forneça também uma explicação em texto

FORMATO DE RESPOSTA (JSON válido):
{
  "explanation": "Sua análise em texto com **negrito** para destaques importantes",
  "chartConfig": {
    "type": "line",
    "title": "Título do Gráfico",
    "description": "Descrição curta do que mostra",
    "dataSpec": {
      "aggregation": "monthly",
      "metrics": ["ebitda"],
      "scenarios": ["Real", "Orçado"],
      "timeframe": { "start": 0, "end": 11 }
    }
  }
}

OU, se NÃO for gerar gráfico:
{
  "explanation": "Sua resposta em texto",
  "chartConfig": null
}

MÉTRICAS VÁLIDAS: "ebitda", "revenue", "fixedCosts", "variableCosts", "sgaCosts", "rateioCosts", "costs", "total"
CENÁRIOS VÁLIDOS: "Real", "Orçado", "Ano Anterior"
AGREGAÇÕES: "monthly" (0-11), "category", "filial"

Responda APENAS com JSON válido.`;

  try {
    // Convert history to API format (últimas 4 mensagens para manter contexto)
    const messages: Array<{ role: string; content: string }> = [];
    const recentHistory = history.slice(-4);

    recentHistory.forEach(msg => {
      messages.push({
        role: msg.role === 'model' ? 'assistant' : 'user',
        content: msg.content
      });
    });

    // Add current message
    messages.push({ role: "user", content: message });

    const text = await callAnthropicAPI({
      system: systemContext,
      messages,
      max_tokens: 1500,
      temperature: 0.7,
    });

    try {
      const cleanedText = cleanJsonFromMarkdown(text);
      console.log("🔵 Texto limpo para parse (chart):", cleanedText.substring(0, 200) + "...");

      const parsed = JSON.parse(cleanedText) as AIChartResponse;

      // Validate structure
      if (!parsed.explanation) {
        parsed.explanation = "Não consegui processar sua solicitação corretamente.";
      }

      // Validate chartConfig if present
      if (parsed.chartConfig) {
        const validTypes = ['line', 'bar', 'waterfall', 'composed', 'heatmap'];
        if (!validTypes.includes(parsed.chartConfig.type)) {
          console.warn('Invalid chart type, setting to null');
          parsed.chartConfig = null;
        }
      }

      return parsed;
    } catch (e) {
      console.error("❌ JSON parse error (chart):", e, "Raw text:", text);
      return {
        explanation: "Desculpe, tive um problema ao processar sua solicitação. Tente reformular a pergunta.",
        chartConfig: null
      };
    }
  } catch (error: any) {
    console.error("Erro no generateChartWithData (Claude):", error);

    if (error?.message?.includes('429') || error?.message?.includes('rate limit')) {
      return {
        explanation: "⚠️ **Limite de requisições atingido**\n\nAguarde alguns segundos e tente novamente.\n\n**Análise Básica:**\n- EBITDA: R$ " + context.kpis.ebitda.toLocaleString() + " (" + context.kpis.netMargin.toFixed(1) + "%)\n- Meta: 25%",
        chartConfig: null
      };
    }

    return {
      explanation: "Desculpe, tive um problema ao analisar seus dados. Verifique se o servidor proxy está rodando (porta 3021) e tente novamente.",
      chartConfig: null
    };
  }
};

/**
 * Helper function to generate fallback insights
 */
function getFallbackInsights(kpis: SchoolKPIs): IAInsight[] {
  return [
    {
      title: "Análise de Margem",
      description: `Sua margem atual de ${kpis.netMargin.toFixed(1)}% está ${kpis.netMargin > 25 ? 'acima' : 'abaixo'} da meta institucional da Raiz Educação (25%). ${kpis.netMargin < 25 ? 'Recomenda-se revisar custos variáveis e fixos para otimização.' : 'Excelente performance, manter monitoramento.'}`,
      priority: kpis.netMargin < 20 ? "high" : "medium",
      category: kpis.netMargin < 25 ? "Driver Negativo" : "Driver Positivo"
    },
    {
      title: "EBITDA Atual",
      description: `EBITDA de R$ ${kpis.ebitda.toLocaleString()} representa ${kpis.netMargin.toFixed(1)}% da receita total. ${kpis.ebitda < 0 ? 'Situação crítica: resultado operacional negativo.' : 'Acompanhar tendência mensal para garantir sustentabilidade.'}`,
      priority: kpis.ebitda < 0 ? "high" : "medium",
      category: kpis.ebitda < 0 ? "Ação Recomendada" : "Driver Positivo"
    },
    {
      title: "Custo por Aluno",
      description: `Custo médio de R$ ${kpis.costPerStudent.toLocaleString()} por aluno. Revisar principais centros de custo para identificar oportunidades de otimização sem comprometer qualidade educacional.`,
      priority: "medium",
      category: "Ação Recomendada"
    },
    {
      title: "Receita por Aluno",
      description: `Ticket médio de R$ ${kpis.revenuePerStudent.toLocaleString()}. ${kpis.revenuePerStudent > kpis.costPerStudent * 1.4 ? 'Boa relação receita/custo, indicando operação saudável.' : 'Considerar estratégias de aumento de receita ou revisão de estrutura de custos.'}`,
      priority: "medium",
      category: kpis.revenuePerStudent > kpis.costPerStudent * 1.4 ? "Driver Positivo" : "Ação Recomendada"
    }
  ];
}
