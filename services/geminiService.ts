
import Groq from "groq-sdk";
import { Transaction, SchoolKPIs, IAInsight } from "../types";

// Initialize Groq with API Key
const groq = new Groq({
  apiKey: import.meta.env.VITE_GROQ_API_KEY || "",
  dangerouslyAllowBrowser: true // Allow browser usage for development
});

/**
 * getFinancialInsights generates 4 strategic insights using Groq (Llama 3.3 70B)
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
    const completion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: systemInstruction },
        { role: "user", content: prompt }
      ],
      model: "llama-3.3-70b-versatile", // Most powerful model for analysis
      temperature: 0.7,
      max_tokens: 2000,
      response_format: { type: "json_object" }
    });

    const text = completion.choices[0]?.message?.content || "{}";

    // Try to parse as object first, then extract array
    try {
      const parsed = JSON.parse(text);
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
    console.error("Erro IA Advisor (Groq):", error);
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
    // Convert history to Groq format
    const messages: any[] = [
      { role: "system", content: systemContext }
    ];

    // Add history
    history.forEach(msg => {
      messages.push({
        role: msg.role === 'model' ? 'assistant' : 'user',
        content: msg.content
      });
    });

    // Add current message
    messages.push({ role: "user", content: message });

    const completion = await groq.chat.completions.create({
      messages,
      model: "llama-3.1-8b-instant", // Fast model for interactive chat
      temperature: 0.8,
      max_tokens: 1500
    });

    return completion.choices[0]?.message?.content || "Desculpe, não consegui processar sua pergunta.";
  } catch (error: any) {
    console.error("Erro no Chat IA (Groq):", error);

    if (error?.status === 429 || error?.message?.includes('rate limit')) {
      return "⚠️ **Limite de requisições atingido**\n\nVocê atingiu o limite temporário de requisições do Groq. Aguarde alguns segundos e tente novamente.\n\n**Análise Básica dos Dados Atuais:**\n\n- **EBITDA**: R$ " + context.kpis.ebitda.toLocaleString() + " (" + context.kpis.netMargin.toFixed(1) + "%)\n- **Receita/Aluno**: R$ " + context.kpis.revenuePerStudent.toLocaleString() + "\n- **Custo/Aluno**: R$ " + context.kpis.costPerStudent.toLocaleString() + "\n- **Meta de Margem**: 25%";
    }

    return "Desculpe, tive um problema ao analisar seus dados. Verifique sua conexão e tente novamente.";
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
