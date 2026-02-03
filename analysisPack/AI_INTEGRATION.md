# Integração com IA para Geração de AnalysisPack

## 📋 Visão Geral

O sistema agora suporta geração de AnalysisPack usando IA (Gemini ou Claude/Anthropic) para criar narrativas e insights mais ricos e contextualizados.

## 🎯 Duas Abordagens

### 1. **Geração Baseada em Regras** (Atual)
```typescript
import { generateAnalysisPack } from './services/analysisService';

const pack = generateAnalysisPack(transactions, kpis, options);
```

**Vantagens:**
- ✅ Rápido e determinístico
- ✅ Sem custos de API
- ✅ Offline
- ✅ Sempre funciona

**Limitações:**
- ❌ Narrativas mais genéricas
- ❌ Insights limitados a regras predefinidas

### 2. **Geração com IA** (Novo)
```typescript
import { generateAnalysisPackWithAI } from './services/aiAnalysisService';

const context: AnalysisContext = {
  org_name: "RAIZ EDUCAÇÃO",
  currency: "BRL",
  period_label: "Janeiro/2026",
  scope_label: "Consolidado",
  kpis: [...],
  datasets: {...}
};

// Com Gemini
const pack = await generateAnalysisPackWithAI(context, 'gemini');

// Com Claude (Anthropic)
const pack = await generateAnalysisPackWithAI(context, 'anthropic');
```

**Vantagens:**
- ✅ Narrativas ricas e contextualizadas
- ✅ Insights mais profundos
- ✅ Linguagem natural e profissional
- ✅ Análise de correlações complexas

**Requisitos:**
- ⚠️ Chave de API (Gemini ou Anthropic)
- ⚠️ Conexão com internet
- ⚠️ Custo por geração (~$0.01-0.05)

## 🔧 Configuração

### Variáveis de Ambiente

Adicione no arquivo `.env`:

```env
# Para usar Gemini
GEMINI_API_KEY=your_gemini_api_key_here

# Para usar Anthropic (Claude)
ANTHROPIC_API_KEY=your_anthropic_api_key_here
```

### Obter Chaves de API

**Gemini (Google):**
1. Acesse: https://makersuite.google.com/app/apikey
2. Crie um projeto
3. Gere uma API key
4. Copie para `.env`

**Anthropic (Claude):**
1. Acesse: https://console.anthropic.com/
2. Crie uma conta
3. Vá em "API Keys"
4. Gere uma chave
5. Copie para `.env`

## 📊 Como Funciona

### 1. Construção do Context

```typescript
import { buildDatasets, buildKPIs } from './services/analysisService';

const datasets = buildDatasets(transactions);
const kpis = buildKPIs(schoolKPIs, transactions);

const context: AnalysisContext = {
  org_name: "RAIZ EDUCAÇÃO",
  currency: "BRL",
  period_label: "Janeiro/2026",
  scope_label: "Consolidado",
  kpis,
  datasets,
  analysis_rules: {
    prefer_pareto: true,
    highlight_threshold_currency: 100000,
    highlight_threshold_percent: 5
  }
};
```

### 2. Geração com IA

```typescript
import { generateAnalysisPackWithAI } from './services/aiAnalysisService';

try {
  const pack = await generateAnalysisPackWithAI(context, 'gemini');

  console.log('✅ AnalysisPack gerado:', pack.meta);
  console.log('📊 Slides:', pack.slides.length);
  console.log('✅ Ações:', pack.actions.length);
} catch (error) {
  console.error('❌ Erro:', error);
}
```

### 3. Validação Automática

Todo AnalysisPack gerado pela IA é automaticamente validado com Zod:

```typescript
// Dentro de aiAnalysisService.ts
const parsedData = JSON.parse(jsonText);
const validatedPack = validateAnalysisPack(parsedData); // ✅ Valida com Zod
```

Se a IA retornar dados inválidos, um erro será lançado com detalhes.

## 🎨 Prompts Customizáveis

### System Prompt

Define o comportamento da IA:

```typescript
export function buildSystemPrompt() {
  return `
Você é um analista FP&A sênior (estilo CFO). Seu trabalho:
- Explicar performance (Real vs Orçado e vs Prior quando houver)
- Priorizar por Pareto 80/20
- Ser objetivo, acionável, sem floreio
- NÃO recalcular números: use apenas os dados fornecidos
...
`;
}
```

### User Prompt

Fornece o contexto e dados:

```typescript
export function buildUserPrompt(ctx: AnalysisContext) {
  return `
Crie um pacote de análise e slides para:
- Organização: ${ctx.org_name}
- KPIs: ${JSON.stringify(ctx.kpis, null, 2)}
- Datasets: ${JSON.stringify(Object.keys(ctx.datasets), null, 2)}
...
`;
}
```

**Customize conforme necessário** editando `analysisPack/utils/prompts.ts`

## 🧪 Exemplo de Uso em API

```typescript
// api/analysis/generate-ai.ts
import { generateAnalysisPackWithAI } from '@/services/aiAnalysisService';
import { buildDatasets, buildKPIs } from '@/services/analysisService';

export default async function handler(req, res) {
  try {
    const { transactions, schoolKPIs, options } = req.body;

    // Construir context
    const datasets = buildDatasets(transactions);
    const kpis = buildKPIs(schoolKPIs, transactions);

    const context = {
      org_name: options.org_name,
      currency: options.currency || 'BRL',
      period_label: options.period_label,
      scope_label: options.scope_label,
      kpis,
      datasets,
      analysis_rules: options.analysis_rules
    };

    // Gerar com IA
    const pack = await generateAnalysisPackWithAI(context, 'gemini');

    return res.status(200).json({
      success: true,
      data: pack
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
```

## 🔄 Modo Híbrido (Recomendado)

Combine o melhor dos dois mundos:

```typescript
import { generateAnalysisPackWithAI } from './services/aiAnalysisService';
import { generateAnalysisPack } from './services/analysisService';

async function generateWithFallback(transactions, kpis, options) {
  try {
    // Tenta gerar com IA primeiro
    const datasets = buildDatasets(transactions);
    const kpisData = buildKPIs(kpis, transactions);

    const context = {
      org_name: options.org_name,
      currency: options.currency || 'BRL',
      period_label: options.period_label,
      scope_label: options.scope_label,
      kpis: kpisData,
      datasets,
      analysis_rules: options.analysis_rules
    };

    return await generateAnalysisPackWithAI(context, 'gemini');
  } catch (error) {
    console.warn('IA falhou, usando geração baseada em regras:', error);

    // Fallback para geração baseada em regras
    return generateAnalysisPack(transactions, kpis, options);
  }
}
```

## 📈 Comparação de Qualidade

| Aspecto | Baseado em Regras | Com IA |
|---------|-------------------|--------|
| Velocidade | ⚡ Instantâneo | 🕐 2-5 segundos |
| Custo | 💰 Grátis | 💰 ~$0.01-0.05 |
| Offline | ✅ Sim | ❌ Não |
| Insights | 📊 Bons | 🎯 Excelentes |
| Narrativa | 📝 Genérica | ✨ Rica |
| Confiabilidade | 🔒 100% | 🎲 ~95% |

## 🛠️ Troubleshooting

### Erro: "GEMINI_API_KEY not configured"
```bash
# Adicione no .env
GEMINI_API_KEY=sua_chave_aqui
```

### Erro: "Invalid response from AI"
- ✅ Verifique se a chave de API está correta
- ✅ Verifique se há saldo/créditos na conta
- ✅ Tente novamente (pode ser timeout)

### Erro: "Validation failed"
- ✅ A IA retornou JSON inválido
- ✅ Verifique os logs para ver o JSON retornado
- ✅ Ajuste o prompt se necessário

### IA retorna texto ao invés de JSON
- ✅ A função `extractJSON()` tenta extrair automaticamente
- ✅ Se falhar, ajuste o system prompt para ser mais explícito

## 🚀 Próximos Passos

1. **Teste com Gemini**: Adicione chave de API e teste
2. **Compare Resultados**: Gere o mesmo pack com regras e IA
3. **Ajuste Prompts**: Customize para seu caso de uso
4. **Implemente Fallback**: Use modo híbrido em produção
5. **Cache Resultados**: Evite regenerar packs idênticos

## 📚 Recursos

- [Gemini API Documentation](https://ai.google.dev/docs)
- [Anthropic API Documentation](https://docs.anthropic.com/)
- [Zod Validation](https://zod.dev/)

---

**Desenvolvido por:** Claude Code (Anthropic)
**Data:** 30 de Janeiro de 2026
