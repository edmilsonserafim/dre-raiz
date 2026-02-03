# Guia de Integração - fetchAnalysisContext

## 📋 Visão Geral

A função `fetchAnalysisContext` é a ponte entre seus dados reais (Supabase) e o sistema de análise com IA. Ela busca transações, calcula KPIs e constrói os datasets automaticamente.

---

## 🚀 Como Usar

### 1. Modo Mock (Desenvolvimento)

```typescript
import { fetchAnalysisContext } from './analysisPack';

// Com variável de ambiente AI_REPORT_USE_MOCK=1
const context = await fetchAnalysisContext();

// Retorna getMockContext() automaticamente
console.log(context);
```

### 2. Modo Real (Produção)

```typescript
import { fetchAnalysisContext } from './analysisPack';

// Busca dados reais do Supabase
const context = await fetchAnalysisContext({
  brand: 'Marca A',
  branch: 'Unidade Centro',
  scenario: 'Real',
  startDate: '2026-01-01',
  endDate: '2026-01-31',
  currency: 'BRL',
  org_name: 'RAIZ EDUCAÇÃO'
});

console.log('KPIs:', context.kpis);
console.log('Datasets:', Object.keys(context.datasets));
```

### 3. Integração com Hook de IA

```typescript
import { useAnalysisPackAI, fetchAnalysisContext } from './analysisPack';

function AnalysisView() {
  const { analysisPack, loading, error, generate } = useAnalysisPackAI();

  const handleGenerate = async () => {
    // Buscar contexto real do Supabase
    const context = await fetchAnalysisContext({
      brand: selectedBrand,
      scenario: 'Real',
      startDate: '2026-01-01',
      endDate: '2026-01-31'
    });

    // Gerar análise com IA
    await generate(context);
  };

  if (loading) return <div>Gerando análise...</div>;
  if (error) return <div>Erro: {error}</div>;
  if (!analysisPack) return <button onClick={handleGenerate}>Gerar Análise</button>;

  return <AnalysisPackViewer analysisPack={analysisPack} />;
}
```

---

## 🔧 Parâmetros

### FetchContextParams

```typescript
interface FetchContextParams {
  periodId?: string;        // ID do período (ex: '2026-01')
  scopeId?: string;         // ID do escopo
  brand?: string;           // Filtro por marca
  branch?: string;          // Filtro por filial
  scenario?: string;        // 'Real', 'Orçado', 'Projetado'
  startDate?: string;       // Data inicial 'YYYY-MM-DD'
  endDate?: string;         // Data final 'YYYY-MM-DD'
  currency?: CurrencyCode;  // 'BRL', 'USD', 'EUR'
  org_name?: string;        // Nome da organização
}
```

---

## 📊 O que a Função Faz

### 1. Busca Transações do Supabase

```typescript
// Busca TODAS as transações
const allTransactions = await getAllTransactions();
// Output: ~10.000+ transações
```

### 2. Aplica Filtros

```typescript
// Se params.brand fornecido:
filteredTransactions = transactions.filter(t => t.brand === params.brand);

// Se params.scenario fornecido:
filteredTransactions = transactions.filter(t => t.scenario === params.scenario);

// Se startDate/endDate fornecidos:
filteredTransactions = transactions.filter(t =>
  t.date >= params.startDate && t.date <= params.endDate
);
```

### 3. Calcula SchoolKPIs

```typescript
const schoolKPIs = calculateSchoolKPIs(filteredTransactions);

// Calcula:
// - totalRevenue (soma de REVENUE)
// - totalFixedCosts (soma de FIXED_COST)
// - totalVariableCosts (soma de VARIABLE_COST)
// - sgaCosts (soma de SGA)
// - ebitda (receita - custos)
// - netMargin (ebitda / receita * 100)
// - costPerStudent, revenuePerStudent, etc.
```

### 4. Constrói Datasets

```typescript
const datasets = buildDatasets(filteredTransactions);

// Gera:
// - r12: série temporal dos últimos 12 meses
// - ebitda_bridge_vs_plan_ytd: ponte de EBITDA
// - pareto_cost_variance_ytd: top 10 variações de custo
// - heatmap_variance: mapa de calor por marca/categoria
// - drivers_table: tabela de indicadores operacionais
```

### 5. Formata KPIs

```typescript
const kpis = buildKPIs(schoolKPIs, filteredTransactions);

// Retorna array de KPI:
// - REVENUE (com plan, prior, deltas)
// - EBITDA (com comparativos)
// - MARGIN (percentual)
// - OPEX (SG&A)
// - COST_STUDENT (custo por aluno)
```

### 6. Detecta Período e Escopo

```typescript
// Período automaticamente detectado:
const period_label = detectPeriodLabel(filteredTransactions);
// "Jan/2026", "YTD Jan/2026", "Mar/2025 - Jan/2026"

// Escopo baseado em filtros:
const scope_label = detectScopeLabel(params);
// "Consolidado", "Marca: Marca A", "Marca: Marca A | Filial: Centro"
```

### 7. Retorna AnalysisContext

```typescript
return {
  org_name: "RAIZ EDUCAÇÃO",
  currency: "BRL",
  period_label: "YTD Jan/2026",
  scope_label: "Marca: Marca A | Cenário: Real",
  kpis: [/* 5 KPIs */],
  datasets: {
    r12: {/* série R12 */},
    ebitda_bridge_vs_plan_ytd: {/* waterfall */},
    pareto_cost_variance_ytd: {/* top 10 */},
    heatmap_variance: {/* heatmap */},
    drivers_table: {/* tabela */}
  },
  analysis_rules: {
    prefer_pareto: true,
    highlight_threshold_currency: 100000,
    highlight_threshold_percent: 0.03
  }
};
```

---

## 🧪 Testes

### Teste 1: Modo Mock

```bash
# .env
AI_REPORT_USE_MOCK=1
```

```typescript
const context = await fetchAnalysisContext();
console.log('Modo:', context.org_name); // "Raiz Educação (Demo)"
```

### Teste 2: Todas as Transações

```typescript
const context = await fetchAnalysisContext({
  scenario: 'Real'
});

console.log('Total KPIs:', context.kpis.length); // 5
console.log('Datasets:', Object.keys(context.datasets)); // ['r12', 'ebitda_bridge_vs_plan_ytd', ...]
```

### Teste 3: Filtro por Marca

```typescript
const context = await fetchAnalysisContext({
  brand: 'Marca A',
  startDate: '2026-01-01',
  endDate: '2026-01-31'
});

console.log('Scope:', context.scope_label); // "Marca: Marca A"
console.log('Período:', context.period_label); // "Jan/2026"
```

### Teste 4: Integração Completa (Mock → IA)

```typescript
import { fetchAnalysisContext } from './analysisPack';
import { useAnalysisPackAI } from './analysisPack';

async function testCompleteFlow() {
  // 1. Buscar contexto mock
  const context = await fetchAnalysisContext();

  // 2. Gerar AnalysisPack com IA
  const response = await fetch('/api/analysis/generate-ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ context })
  });

  const { data } = await response.json();
  console.log('AnalysisPack gerado:', data);

  // 3. Renderizar
  return <AnalysisPackViewer analysisPack={data} />;
}
```

---

## 🔍 Troubleshooting

### Erro: "Nenhuma transação encontrada"

```typescript
// Fallback automático para mock
console.warn("⚠️ Nenhuma transação encontrada, usando mock como fallback");
return getMockContext();
```

**Solução:**
- Verificar se Supabase está populado
- Verificar filtros (brand, scenario, dates)
- Conferir VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY

### Erro: "Cannot read property 'length' of undefined"

**Causa:** `getAllTransactions()` retornou `undefined`

**Solução:**
```typescript
// Adicionar tratamento de erro
try {
  const transactions = await getAllTransactions();
  if (!transactions || transactions.length === 0) {
    return getMockContext();
  }
} catch (error) {
  console.error("Erro ao buscar transações:", error);
  return getMockContext();
}
```

### Performance: Busca demora muito

**Causa:** Muitas transações (>50k) sem índices

**Soluções:**
1. Adicionar índices no Supabase:
```sql
CREATE INDEX idx_transactions_date ON transactions(date);
CREATE INDEX idx_transactions_brand ON transactions(brand);
CREATE INDEX idx_transactions_scenario ON transactions(scenario);
```

2. Usar paginação:
```typescript
// Limitarúltimos 12 meses
const startDate = new Date();
startDate.setMonth(startDate.getMonth() - 12);

const context = await fetchAnalysisContext({
  startDate: startDate.toISOString().substring(0, 10)
});
```

---

## 📝 Próximos Passos

### TODO: Implementações Futuras

1. **Cache de Contexto**
```typescript
// Cache em memória para evitar múltiplas buscas
const contextCache = new Map<string, AnalysisContext>();

export async function fetchAnalysisContextCached(params: FetchContextParams) {
  const cacheKey = JSON.stringify(params);
  if (contextCache.has(cacheKey)) {
    return contextCache.get(cacheKey)!;
  }

  const context = await fetchAnalysisContext(params);
  contextCache.set(cacheKey, context);
  return context;
}
```

2. **Buscar Valores de Plano Reais**
```typescript
// Em vez de simular (actual * 0.97), buscar de tabela 'budget'
const budgetData = await supabase
  .from('budget')
  .select('*')
  .eq('period', params.periodId);

const revenuePlan = budgetData.find(b => b.category === 'REVENUE')?.amount || 0;
```

3. **Buscar Dados do Ano Anterior**
```typescript
// Para calcular YoY correto
const priorYearStart = new Date(params.startDate);
priorYearStart.setFullYear(priorYearStart.getFullYear() - 1);

const priorTransactions = await getAllTransactions(); // Filtrar por prior year
const priorKPIs = calculateSchoolKPIs(priorTransactions);
```

4. **Integração com API de Alunos**
```typescript
// Buscar número real de alunos ativos
const studentsData = await fetch('/api/students/count').then(r => r.json());
const activeStudents = studentsData.active;

// Usar em calculateSchoolKPIs
const costPerStudent = totalCosts / activeStudents;
```

---

## 🎓 Exemplos Avançados

### Exemplo 1: Comparar Múltiplas Marcas

```typescript
const brands = ['Marca A', 'Marca B', 'Marca C'];

const contexts = await Promise.all(
  brands.map(brand => fetchAnalysisContext({ brand, scenario: 'Real' }))
);

contexts.forEach((ctx, idx) => {
  const revenueKpi = ctx.kpis.find(k => k.code === 'REVENUE');
  console.log(`${brands[idx]}: R$ ${revenueKpi?.actual.toLocaleString()}`);
});
```

### Exemplo 2: Análise Trimestral

```typescript
const quarters = [
  { start: '2026-01-01', end: '2026-03-31', label: 'Q1' },
  { start: '2026-04-01', end: '2026-06-30', label: 'Q2' },
  { start: '2026-07-01', end: '2026-09-30', label: 'Q3' },
  { start: '2026-10-01', end: '2026-12-31', label: 'Q4' }
];

const quarterlyContexts = await Promise.all(
  quarters.map(q => fetchAnalysisContext({
    startDate: q.start,
    endDate: q.end,
    periodId: q.label
  }))
);

// Comparar EBITDA por trimestre
quarterlyContexts.forEach((ctx, idx) => {
  const ebitda = ctx.kpis.find(k => k.code === 'EBITDA');
  console.log(`${quarters[idx].label}: R$ ${ebitda?.actual.toLocaleString()}`);
});
```

### Exemplo 3: Real vs Orçado

```typescript
const [realContext, budgetContext] = await Promise.all([
  fetchAnalysisContext({ scenario: 'Real' }),
  fetchAnalysisContext({ scenario: 'Orçado' })
]);

const realRevenue = realContext.kpis.find(k => k.code === 'REVENUE')?.actual || 0;
const budgetRevenue = budgetContext.kpis.find(k => k.code === 'REVENUE')?.actual || 0;
const variance = ((realRevenue - budgetRevenue) / budgetRevenue) * 100;

console.log(`Variação vs Orçado: ${variance.toFixed(1)}%`);
```

---

## 📚 Referências

- `analysisPack/services/contextService.ts` - Implementação
- `analysisPack/services/dataBuilder.ts` - Construção de datasets
- `services/supabaseService.ts` - Busca de transações
- `analysisPack/mock/mockContext.ts` - Dados de exemplo

---

**Desenvolvido por:** Claude Code (Anthropic)
**Data:** 30 de Janeiro de 2026
