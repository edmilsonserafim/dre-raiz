
import { Transaction, SchoolKPIs, IAInsight, AIChartResponse } from "../types";

// Use proxy server during development, Vercel API route in production
const ANTHROPIC_API_URL = import.meta.env.DEV
  ? "http://localhost:3021/api/anthropic"  // Development proxy
  : "/api/anthropic";  // Production Vercel function

/**
 * getFinancialInsights generates 4 strategic insights using Claude (Anthropic)
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
    const response = await fetch(ANTHROPIC_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "claude-3-opus-20240229",
        max_tokens: 2000,
        system: systemInstruction,
        messages: [
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("❌ Anthropic API error:", response.status, response.statusText, errorBody);
      throw new Error(`Anthropic API error: ${response.status} ${response.statusText} - ${errorBody}`);
    }

    const data = await response.json();
    const text = data.content[0]?.text || "{}";

    // Try to parse as JSON
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/```\s*([\s\S]*?)\s*```/);
      const jsonText = jsonMatch ? jsonMatch[1] : text;

      const parsed = JSON.parse(jsonText);
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
      console.error("JSON parse error:", e);
    }

    // Fallback insights
    return getFallbackInsights(kpis);
  } catch (error) {
    console.error("Erro IA Advisor (Anthropic):", error);
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
    // Convert history to Anthropic format
    const messages: any[] = [];

    // Add history
    history.forEach(msg => {
      messages.push({
        role: msg.role === 'model' ? 'assistant' : 'user',
        content: msg.content
      });
    });

    // Add current message
    messages.push({
      role: "user",
      content: message
    });

    const response = await fetch(ANTHROPIC_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "claude-3-opus-20240229",
        max_tokens: 1500,
        system: systemContext,
        messages: messages,
        temperature: 0.8
      })
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("❌ Chat - Anthropic API error:", response.status, response.statusText, errorBody);

      if (response.status === 429) {
        return "⚠️ **Limite de requisições atingido**\n\nVocê atingiu o limite temporário de requisições da API. Aguarde alguns segundos e tente novamente.\n\n**Análise Básica dos Dados Atuais:**\n\n- **EBITDA**: R$ " + context.kpis.ebitda.toLocaleString() + " (" + context.kpis.netMargin.toFixed(1) + "%)\n- **Receita/Aluno**: R$ " + context.kpis.revenuePerStudent.toLocaleString() + "\n- **Custo/Aluno**: R$ " + context.kpis.costPerStudent.toLocaleString() + "\n- **Meta de Margem**: 25%";
      }

      throw new Error(`Anthropic API error: ${response.status} ${response.statusText} - ${errorBody}`);
    }

    const data = await response.json();
    return data.content[0]?.text || "Desculpe, não consegui processar sua pergunta.";
  } catch (error: any) {
    console.error("Erro no Chat IA (Anthropic):", error);

    if (error?.message?.includes('429') || error?.message?.includes('rate limit')) {
      return "⚠️ **Limite de requisições atingido**\n\nVocê atingiu o limite temporário de requisições do Claude. Aguarde alguns segundos e tente novamente.\n\n**Análise Básica dos Dados Atuais:**\n\n- **EBITDA**: R$ " + context.kpis.ebitda.toLocaleString() + " (" + context.kpis.netMargin.toFixed(1) + "%)\n- **Receita/Aluno**: R$ " + context.kpis.revenuePerStudent.toLocaleString() + "\n- **Custo/Aluno**: R$ " + context.kpis.costPerStudent.toLocaleString() + "\n- **Meta de Margem**: 25%";
    }

    return "Desculpe, tive um problema ao analisar seus dados. Verifique sua conexão e tente novamente.";
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
    // Convert history to Anthropic format (últimas 4 mensagens)
    const messages: any[] = [];
    const recentHistory = history.slice(-4);

    recentHistory.forEach(msg => {
      messages.push({
        role: msg.role === 'model' ? 'assistant' : 'user',
        content: msg.content
      });
    });

    // Add current message
    messages.push({
      role: "user",
      content: message
    });

    const response = await fetch(ANTHROPIC_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "claude-3-opus-20240229",
        max_tokens: 1500,
        system: systemContext,
        messages: messages,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("❌ generateChartWithData - Anthropic API error:", response.status, response.statusText, errorBody);

      if (response.status === 429) {
        return {
          explanation: "⚠️ **Limite de requisições atingido**\n\nAguarde alguns segundos e tente novamente.\n\n**Análise Básica:**\n- EBITDA: R$ " + context.kpis.ebitda.toLocaleString() + " (" + context.kpis.netMargin.toFixed(1) + "%)\n- Meta: 25%",
          chartConfig: null
        };
      }

      throw new Error(`Anthropic API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const text = data.content[0]?.text || '{}';

    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/```\s*([\s\S]*?)\s*```/);
      const jsonText = jsonMatch ? jsonMatch[1] : text;

      const parsed = JSON.parse(jsonText) as AIChartResponse;

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
      console.error("JSON parse error:", e, "Raw text:", text);
      return {
        explanation: text || "Desculpe, tive um problema ao processar sua solicitação. Tente reformular a pergunta.",
        chartConfig: null
      };
    }
  } catch (error: any) {
    console.error("Erro no generateChartWithData (Anthropic):", error);

    if (error?.message?.includes('429') || error?.message?.includes('rate limit')) {
      return {
        explanation: "⚠️ **Limite de requisições atingido**\n\nAguarde alguns segundos e tente novamente.\n\n**Análise Básica:**\n- EBITDA: R$ " + context.kpis.ebitda.toLocaleString() + " (" + context.kpis.netMargin.toFixed(1) + "%)\n- Meta: 25%",
        chartConfig: null
      };
    }

    return {
      explanation: "Desculpe, tive um problema ao analisar seus dados. Verifique sua conexão e tente novamente.",
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
