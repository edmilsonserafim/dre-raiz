# Guia de Testes - AnalysisPack

## 📋 Visão Geral

Este guia mostra como testar a geração de AnalysisPack em diferentes cenários.

## 🧪 Tipos de Teste

### 1. Teste com Mock Data (UI)

Testa apenas a visualização com dados pré-prontos.

```typescript
import { AnalysisPackViewer, mockAnalysisPack } from './analysisPack';

function TestMockView() {
  return <AnalysisPackViewer analysisPack={mockAnalysisPack} />;
}
```

**Quando usar:** Desenvolvimento de UI, testes visuais rápidos

### 2. Teste com Mock Context (IA)

Testa geração com IA usando contexto mock (sem processar transactions).

```typescript
import { useAnalysisPackAI, getMockContext } from './analysisPack';

function TestAIWithMockContext() {
  const { analysisPack, loading, error, generate } = useAnalysisPackAI();

  const handleTest = async () => {
    const context = getMockContext();
    await generate(context);
  };

  if (loading) return <div>Gerando com IA...</div>;
  if (error) return <div>Erro: {error}</div>;
  if (!analysisPack) return <button onClick={handleTest}>Testar IA</button>;

  return <AnalysisPackViewer analysisPack={analysisPack} />;
}
```

**Quando usar:** Testar integração com IA sem banco de dados

### 3. Teste com Dados Reais

Testa fluxo completo: transactions → context → IA → AnalysisPack.

```typescript
import { useAnalysisPackAI } from './analysisPack';
import { buildDatasets, buildKPIs } from './services/analysisService';

function TestAIWithRealData() {
  const { analysisPack, loading, error, generate } = useAnalysisPackAI();
  const transactions = useTransactions(); // Seus dados reais
  const kpis = useKPIs(); // Seus KPIs reais

  const handleTest = async () => {
    const datasets = buildDatasets(transactions);
    const kpisData = buildKPIs(kpis, transactions);

    const context = {
      org_name: "RAIZ EDUCAÇÃO",
      currency: "BRL",
      period_label: "Janeiro/2026",
      scope_label: "Consolidado",
      kpis: kpisData,
      datasets,
      analysis_rules: {
        prefer_pareto: true,
        highlight_threshold_currency: 100000
      }
    };

    await generate(context);
  };

  // ... resto do componente
}
```

**Quando usar:** Validação final antes de produção

## 🎯 Cenários de Teste

### Cenário A: Teste Rápido (UI Only)

```typescript
// 1. Abra o navegador em http://localhost:3002/
// 2. Clique em "Análise Financeira" no menu
// 3. Mock data já está carregado automaticamente
// 4. Navegue pelos slides e explore
```

**Tempo:** < 1 minuto
**Custo:** R$ 0
**Valida:** UI, navegação, gráficos

### Cenário B: Teste de Integração IA

```typescript
import { getMockContext } from './analysisPack/mock/mockContext';

// No console do navegador
const context = getMockContext();
console.log('Context:', context);

// Chame a API
fetch('/api/analysis/generate-ai', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ context })
})
  .then(res => res.json())
  .then(data => console.log('AnalysisPack:', data));
```

**Tempo:** 2-5 segundos
**Custo:** ~R$ 0,25
**Valida:** IA, API, validação

### Cenário C: Teste de Carga

```bash
# Instale artillery
npm install -g artillery

# Crie arquivo de teste (load-test.yml)
config:
  target: 'http://localhost:3002'
  phases:
    - duration: 60
      arrivalRate: 5
scenarios:
  - flow:
      - post:
          url: '/api/analysis/generate-ai'
          json:
            context: '{{ $getMockContext }}'

# Execute
artillery run load-test.yml
```

**Tempo:** 1 minuto
**Custo:** ~R$ 15
**Valida:** Performance, rate limiting, concorrência

## 🔍 Checklist de Validação

### ✅ Frontend

- [ ] Mock data carrega corretamente
- [ ] Navegação de slides funciona
- [ ] Filtros de ações funcionam
- [ ] Gráficos renderizam sem erros
- [ ] Responsivo em mobile/desktop
- [ ] Loading states aparecem
- [ ] Error states aparecem corretamente

### ✅ API

- [ ] Endpoint responde em < 5s
- [ ] JSON válido é retornado
- [ ] Erros 400/422/500 tratados
- [ ] CORS configurado corretamente
- [ ] Rate limiting funciona
- [ ] Logs de erro aparecem

### ✅ IA (Claude)

- [ ] API key configurada
- [ ] JSON Schema validado
- [ ] Narrativas fazem sentido
- [ ] KPIs referenciados corretamente
- [ ] Ações são acionáveis
- [ ] Slides seguem estrutura esperada

### ✅ Validação (Zod)

- [ ] AnalysisPack válido passa
- [ ] JSON inválido é rejeitado
- [ ] Erros de validação são claros
- [ ] Types TypeScript corretos

## 🐛 Casos de Teste de Erro

### Teste 1: API Key Inválida

```typescript
// Remova ou corrompa ANTHROPIC_API_KEY no .env
// Esperado: 500 com mensagem "API key não configurada"

const result = await fetch('/api/analysis/generate-ai', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ context: getMockContext() })
});

const error = await result.json();
console.assert(error.error === 'API key não configurada');
```

### Teste 2: Context Inválido

```typescript
// Envie context sem campos obrigatórios
// Esperado: 400 com mensagem "context obrigatório"

const result = await fetch('/api/analysis/generate-ai', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ context: { org_name: "Test" } }) // Incompleto
});

const error = await result.json();
console.assert(result.status === 422); // Zod validation error
```

### Teste 3: Rate Limit

```typescript
// Faça múltiplas requisições rapidamente
// Esperado: 429 após limite

const promises = Array(20).fill(null).map(() =>
  fetch('/api/analysis/generate-ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ context: getMockContext() })
  })
);

const results = await Promise.all(promises);
const rateLimited = results.some(r => r.status === 429);
console.assert(rateLimited); // Pelo menos um deve ser rate limited
```

### Teste 4: Timeout

```typescript
// Simule contexto muito grande
// Esperado: Timeout ou erro controlado

const hugeContext = getMockContext();
hugeContext.datasets.r12.x = Array(1000).fill('2025-01');

// Deve falhar ou timeout
await fetch('/api/analysis/generate-ai', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ context: hugeContext })
});
```

## 📊 Comparação de Qualidade

### Como Comparar Geração com Regras vs IA

```typescript
import { generateAnalysisPack } from './services/analysisService';
import { generateAnalysisPackWithAI } from './services/aiAnalysisService';
import { getMockContext } from './analysisPack/mock/mockContext';

async function compareGenerations() {
  const context = getMockContext();

  // Geração com regras
  console.time('Rules');
  const rulesResult = await generateAnalysisPack(transactions, kpis, {
    org_name: context.org_name,
    period_label: context.period_label,
    scope_label: context.scope_label,
    currency: context.currency
  });
  console.timeEnd('Rules');

  // Geração com IA
  console.time('AI');
  const aiResult = await generateAnalysisPackWithAI(context, 'anthropic');
  console.timeEnd('AI');

  // Comparar
  console.log('Comparação:');
  console.log('Rules - Slides:', rulesResult.slides.length);
  console.log('AI - Slides:', aiResult.slides.length);
  console.log('Rules - Headline:', rulesResult.executive_summary.headline);
  console.log('AI - Headline:', aiResult.executive_summary.headline);
  console.log('Rules - Ações:', rulesResult.actions.length);
  console.log('AI - Ações:', aiResult.actions.length);
}
```

## 🚀 Testes Automatizados

### Jest Test Example

```typescript
// __tests__/analysisPack.test.ts
import { getMockContext } from '../analysisPack/mock/mockContext';
import { validateAnalysisPack } from '../analysisPack/types/schema';

describe('AnalysisPack Generation', () => {
  test('Mock context is valid', () => {
    const context = getMockContext();
    expect(context.org_name).toBe('Raiz Educação (Demo)');
    expect(context.kpis).toHaveLength(4);
    expect(context.datasets.r12).toBeDefined();
  });

  test('Generated pack validates with Zod', async () => {
    // Simule resposta da IA
    const mockPack = {
      meta: { /* ... */ },
      executive_summary: { /* ... */ },
      actions: [],
      charts: [],
      slides: []
    };

    const result = () => validateAnalysisPack(mockPack);
    expect(result).not.toThrow();
  });
});
```

## 📈 Métricas de Sucesso

| Métrica | Target | Como Medir |
|---------|--------|------------|
| Response Time | < 5s | `console.time()` |
| Success Rate | > 95% | Logs de erro |
| Validation Pass | 100% | Zod errors |
| User Satisfaction | > 4/5 | Feedback |
| Cost per Analysis | < R$ 0,30 | Anthropic dashboard |

## 🎓 Próximos Passos

1. **Rode Teste Rápido** (Cenário A)
2. **Configure API Key** no .env
3. **Teste com Mock Context** (Cenário B)
4. **Valide Resultados** (Checklist)
5. **Teste com Dados Reais** (Cenário C)
6. **Ajuste Prompts** se necessário
7. **Deploy para Produção**

---

**Desenvolvido por:** Claude Code (Anthropic)
**Data:** 30 de Janeiro de 2026
