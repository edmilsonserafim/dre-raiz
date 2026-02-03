import type { AnalysisPack, AnalysisContext } from '../types';
import { buildSystemPrompt, buildUserPrompt } from '../analysisPack/utils/prompts';
import { validateAnalysisPack } from '../analysisPack/types/schema';
import { callClaudeJSON } from './claudeService';
import { AnalysisPackJSONSchema } from '../analysisPack/utils/jsonSchema';

/**
 * Gera AnalysisPack usando IA (Gemini ou Anthropic)
 */
export async function generateAnalysisPackWithAI(
  context: AnalysisContext,
  aiProvider: 'gemini' | 'anthropic' = 'gemini'
): Promise<AnalysisPack> {
  const systemPrompt = buildSystemPrompt();
  const userPrompt = buildUserPrompt(context);

  let responseText: string;

  try {
    if (aiProvider === 'gemini') {
      responseText = await callGemini(systemPrompt, userPrompt);
      // Gemini pode retornar markdown, então precisamos extrair JSON
      const { extractJSON } = await import('../analysisPack/utils/prompts');
      const jsonText = extractJSON(responseText);
      const parsedData = JSON.parse(jsonText);

      // Validar com Zod
      return validateAnalysisPack(parsedData);
    } else {
      // Claude com JSON Schema nativo já retorna JSON estruturado
      responseText = await callAnthropic(systemPrompt, userPrompt);
      const parsedData = JSON.parse(responseText);

      // Validar com Zod (redundante mas garante type safety)
      return validateAnalysisPack(parsedData);
    }
  } catch (error) {
    console.error('Error generating AnalysisPack with AI:', error);
    throw new Error('Failed to generate AnalysisPack with AI: ' + (error as Error).message);
  }
}

/**
 * Chama Gemini API
 */
async function callGemini(systemPrompt: string, userPrompt: string): Promise<string> {
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY not configured');
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [
              { text: systemPrompt + '\n\n' + userPrompt }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 8192,
          topP: 0.95,
          topK: 40
        }
      })
    }
  );

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.statusText}`);
  }

  const data = await response.json();

  if (!data.candidates || !data.candidates[0]?.content?.parts?.[0]?.text) {
    throw new Error('Invalid response from Gemini API');
  }

  return data.candidates[0].content.parts[0].text;
}

/**
 * Chama Anthropic API (Claude) com JSON Schema nativo
 */
async function callAnthropic(systemPrompt: string, userPrompt: string): Promise<string> {
  // Usa a função callClaudeJSON que garante retorno JSON estruturado
  const result = await callClaudeJSON<AnalysisPack>({
    system: systemPrompt,
    user: userPrompt,
    jsonSchema: AnalysisPackJSONSchema,
    maxTokens: 8192
  });

  // callClaudeJSON já retorna o objeto parseado, precisamos converter para string
  // para manter compatibilidade com o fluxo existente
  return JSON.stringify(result);
}

/**
 * Gera AnalysisPack híbrido: dados calculados + narrativa com IA
 */
export async function generateHybridAnalysisPack(
  context: AnalysisContext,
  aiProvider: 'gemini' | 'anthropic' = 'gemini'
): Promise<AnalysisPack> {
  try {
    // Tentar gerar com IA
    return await generateAnalysisPackWithAI(context, aiProvider);
  } catch (error) {
    console.warn('AI generation failed, falling back to rule-based:', error);

    // Fallback: importar o service tradicional
    const { generateAnalysisPack } = await import('./analysisService');

    // Como não temos transactions e kpis aqui, vamos criar um pack básico
    // Nota: em produção, você passaria esses dados
    throw new Error('Hybrid generation requires transactions and kpis - use generateAnalysisPack directly');
  }
}
