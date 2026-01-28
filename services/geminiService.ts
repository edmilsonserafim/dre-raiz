
import { GoogleGenAI, Type } from "@google/genai";
import { Transaction, SchoolKPIs, IAInsight } from "../types";

// Always initialize GoogleGenAI with a named parameter using import.meta.env
const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY || "temporario-sem-ia" });

/**
 * getFinancialInsights generates 4 strategic insights using gemini-3-pro-preview
 */
export const getFinancialInsights = async (transactions: Transaction[], kpis: SchoolKPIs): Promise<IAInsight[]> => {
  const systemInstruction = `
    Você é o Advisor de Inteligência Financeira da Raiz Educação para a Escola SAP.
    Sua missão é analisar os dados financeiros e operacionais (DRE, Alunos, KPIs) e fornecer um Resumo Executivo.
    Analise variações de EBITDA, margem e custos por aluno.
    Identifique 'Top Drivers' de performance e sugira ações práticas.
  `;

  const prompt = `
    Analise os dados consolidados da unidade:
    - Receita: R$ ${kpis.totalRevenue.toLocaleString()}
    - EBITDA: R$ ${kpis.ebitda.toLocaleString()} (${kpis.netMargin.toFixed(1)}%)
    - Alunos Ativos: ${kpis.activeStudents}
    - Ticket Médio: R$ ${kpis.revenuePerStudent.toLocaleString()}
    - Custo/Aluno: R$ ${kpis.costPerStudent.toLocaleString()}
    
    Responda em formato JSON (Array de objetos IAInsight). 
    Cada objeto deve ter: title, description, priority ('high', 'medium', 'low') e category ('Driver Positivo', 'Driver Negativo', 'Ação Recomendada').
    Gere exatamente 4 insights estratégicos.
  `;

  try {
    // Using gemini-3-pro-preview for advanced reasoning on financial data
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              priority: { type: Type.STRING },
              category: { type: Type.STRING }
            },
            required: ["title", "description", "priority", "category"]
          }
        }
      }
    });

    // Directly access the .text property of GenerateContentResponse
    return JSON.parse(response.text || "[]");
  } catch (error) {
    console.error("Erro IA Advisor:", error);
    return [
      {
        title: "Destaque de Margem",
        description: `Sua margem atual de ${kpis.netMargin.toFixed(1)}% está ${kpis.netMargin > 25 ? 'acima' : 'abaixo'} da meta institucional da Raiz Educação (25%).`,
        priority: "medium",
        category: "Driver Negativo"
      }
    ];
  }
};

/**
 * chatWithFinancialData enables conversational analysis with full context and history
 */
export const chatWithFinancialData = async (
  message: string, 
  history: { role: 'user' | 'model', parts: { text: string }[] }[], 
  context: { transactions: Transaction[], kpis: SchoolKPIs }
) => {
  const systemInstruction = `
    Você é o "SAP Strategist", um assistente de IA sênior especializado em finanças escolares para a Escola SAP.
    Você tem acesso aos KPIs atuais e à lista de transações.
    Seu objetivo é ajudar a diretoria a entender os números, encontrar gargalos e sugerir melhorias.
    
    KPIs ATUAIS:
    - Receita Total: R$ ${context.kpis.totalRevenue}
    - EBITDA: R$ ${context.kpis.ebitda} (Margem: ${context.kpis.netMargin.toFixed(1)}%)
    - Custo por Aluno: R$ ${context.kpis.costPerStudent}
    - Receita por Aluno: R$ ${context.kpis.revenuePerStudent}
    - Meta de Margem Raiz: 25%
    
    Responda de forma executiva, profissional e baseada em dados. 
    Use Markdown para formatar suas respostas.
  `;

  try {
    // Create chat with gemini-3-pro-preview for complex reasoning and maintain history
    const chat = ai.chats.create({
      model: 'gemini-3-pro-preview',
      history: history,
      config: { systemInstruction }
    });
    
    // Call chat.sendMessage with the message parameter
    const response = await chat.sendMessage({ message });
    // Directly access the .text property
    return response.text;
  } catch (error) {
    console.error("Erro no Chat IA:", error);
    return "Desculpe, tive um problema ao analisar seus dados. Pode repetir a pergunta?";
  }
};
