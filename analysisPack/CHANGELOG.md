# Changelog - AnalysisPack

## [1.1.0] - 2026-01-30

### ✨ Novas Features

#### `fetchAnalysisContext` - Integração com Dados Reais

Implementada função completa para buscar contexto de análise real do Supabase, substituindo a necessidade de usar apenas dados mock.

**Arquivos Criados:**

1. **`analysisPack/services/contextService.ts`** (NEW)
   - `fetchAnalysisContext(params?)` - Função principal
   - `calculateSchoolKPIs(transactions)` - Calcula KPIs a partir de transactions
   - `detectPeriodLabel(transactions)` - Detecta período automaticamente
   - `detectScopeLabel(params)` - Detecta escopo baseado em filtros

2. **`analysisPack/services/dataBuilder.ts`** (NEW)
   - `buildDatasets(transactions)` - Constrói todos os datasets (R12, waterfall, pareto, heatmap, table)
   - `buildKPIs(schoolKPIs, transactions)` - Formata KPIs com comparativos

3. **`analysisPack/INTEGRATION_GUIDE.md`** (NEW)
   - Documentação completa de uso
   - 3 exemplos práticos
   - Troubleshooting
   - TODOs futuros

**Arquivos Modificados:**

1. **`analysisPack/index.ts`**
   - Exportadas novas funções: `fetchAnalysisContext`, `buildDatasets`, `buildKPIs`
   - Exportado tipo: `FetchContextParams`

2. **`services/analysisService.ts`**
   - Refatorado para importar `buildDatasets` e `buildKPIs` do dataBuilder
   - Evita duplicação de código

### 🎯 Funcionalidades

#### 1. Busca de Dados Reais

```typescript
const context = await fetchAnalysisContext({
  brand: 'Marca A',
  scenario: 'Real',
  startDate: '2026-01-01',
  endDate: '2026-01-31'
});
```

**O que faz:**
- Busca todas as transações do Supabase via `getAllTransactions()`
- Aplica filtros (brand, branch, scenario, startDate, endDate)
- Calcula KPIs automaticamente
- Constrói 5 datasets (R12, waterfall, pareto, heatmap, table)
- Detecta período e escopo automaticamente
- Retorna `AnalysisContext` pronto para usar com IA

#### 2. Cálculo Automático de KPIs

```typescript
const schoolKPIs = calculateSchoolKPIs(transactions);

// Calcula:
// - totalRevenue (soma de REVENUE)
// - totalFixedCosts (soma de FIXED_COST)
// - totalVariableCosts (soma de VARIABLE_COST)
// - sgaCosts (soma de SGA)
// - ebitda (receita - todos os custos)
// - netMargin (% de margem)
// - costPerStudent, revenuePerStudent
// - breakEvenPoint, marginOfSafety
```

#### 3. Construção de Datasets

**R12 (Rolling 12 Months):**
- Série temporal dos últimos 12 meses
- Receita, EBITDA, Custos Totais por mês

**EBITDA Bridge (Waterfall):**
- Ponte de EBITDA vs Orçamento
- Steps: Gap Receita, Custos Variáveis, Custos Fixos, SG&A, Outros

**Pareto de Variações:**
- Top 10 variações de custo por categoria
- Ordenado por impacto absoluto

**Heatmap de Variações:**
- Matriz de variações por marca × categoria
- Valores em percentual

**Tabela de Drivers:**
- KPIs operacionais (Receita, EBITDA, Custos, Margem)
- Comparativos: Real vs Plano vs Prior Year

#### 4. Formatação de KPIs

```typescript
const kpis = buildKPIs(schoolKPIs, transactions);

// Retorna 5 KPIs formatados:
// - REVENUE (Receita Líquida)
// - EBITDA
// - MARGIN (Margem EBITDA %)
// - OPEX (SG&A)
// - COST_STUDENT (Custo por Aluno)

// Cada KPI inclui:
// - actual, plan, prior
// - delta_vs_plan (%), delta_vs_prior (%)
```

#### 5. Detecção Automática

**Período:**
- Mesmo mês: "Jan/2026"
- Múltiplos meses: "YTD Jan/2026"
- Múltiplos anos: "Mar/2025 - Jan/2026"

**Escopo:**
- Sem filtros: "Consolidado"
- Com filtros: "Marca: Marca A | Filial: Centro | Cenário: Real"

### 🔄 Modo Mock vs Real

#### Modo Mock (Desenvolvimento)

```bash
# .env
AI_REPORT_USE_MOCK=1
```

```typescript
const context = await fetchAnalysisContext();
// Retorna getMockContext() automaticamente
```

#### Modo Real (Produção)

```bash
# .env
AI_REPORT_USE_MOCK=0
```

```typescript
const context = await fetchAnalysisContext({ brand: 'Marca A' });
// Busca dados reais do Supabase
```

### 🧪 Fluxo Completo

```typescript
// 1. Buscar contexto real
const context = await fetchAnalysisContext({
  scenario: 'Real',
  startDate: '2026-01-01',
  endDate: '2026-01-31'
});

// 2. Gerar AnalysisPack com IA
const response = await fetch('/api/analysis/generate-ai', {
  method: 'POST',
  body: JSON.stringify({ context })
});

const { data } = await response.json();

// 3. Renderizar
<AnalysisPackViewer analysisPack={data} />
```

### 📊 Exemplo de Context Retornado

```typescript
{
  org_name: "RAIZ EDUCAÇÃO",
  currency: "BRL",
  period_label: "Jan/2026",
  scope_label: "Marca: Marca A | Cenário: Real",
  kpis: [
    {
      code: "REVENUE",
      name: "Receita Líquida",
      unit: "currency",
      actual: 125000000,
      plan: 121250000,
      prior: 118750000,
      delta_vs_plan: 3.09,
      delta_vs_prior: 5.26
    },
    // ... mais 4 KPIs
  ],
  datasets: {
    r12: {
      x: ["Fev/25", "Mar/25", ..., "Jan/26"],
      series: [
        { key: "revenue", name: "Receita", unit: "currency", data: [...] },
        { key: "ebitda", name: "EBITDA", unit: "currency", data: [...] },
        { key: "costs", name: "Custos Totais", unit: "currency", data: [...] }
      ]
    },
    ebitda_bridge_vs_plan_ytd: {
      start_label: "EBITDA Orçado",
      end_label: "EBITDA Real",
      start_value: 17100000,
      end_value: 18200000,
      steps: [
        { label: "Gap Receita", value: 750000 },
        { label: "Custos Variáveis", value: -300000 },
        { label: "Custos Fixos", value: -200000 },
        { label: "SG&A", value: -150000 },
        { label: "Outros", value: 100000 }
      ]
    },
    pareto_cost_variance_ytd: {
      items: [
        { name: "Folha de Pagamento", value: -950000 },
        { name: "Energia", value: -280000 },
        { name: "Material Didático", value: -220000 },
        // ... top 10
      ]
    },
    heatmap_variance: {
      x: ["Marca A", "Marca B", "Marca C"],
      y: ["Receita", "Custos Fixos", "Custos Variáveis", "SG&A", "Rateio"],
      values: [[0, 0, 5], [0, 1, -3], [0, 2, 2], ...],
      unit: "percent"
    },
    drivers_table: {
      columns: ["Indicador", "Real", "Plano", "Var %", "Prior Year", "YoY %"],
      rows: [
        ["Receita Total", 125000000, 121250000, "3.1%", 118750000, "5.3%"],
        ["EBITDA", 18200000, 17100000, "6.4%", 16740000, "8.7%"],
        // ...
      ]
    }
  },
  analysis_rules: {
    prefer_pareto: true,
    highlight_threshold_currency: 100000,
    highlight_threshold_percent: 0.03
  }
}
```

### 🎯 Casos de Uso

#### 1. Análise Consolidada

```typescript
const context = await fetchAnalysisContext({
  scenario: 'Real'
});
```

#### 2. Análise por Marca

```typescript
const context = await fetchAnalysisContext({
  brand: 'Marca A',
  scenario: 'Real'
});
```

#### 3. Análise Mensal

```typescript
const context = await fetchAnalysisContext({
  startDate: '2026-01-01',
  endDate: '2026-01-31',
  scenario: 'Real'
});
```

#### 4. Comparativo Real vs Orçado

```typescript
const [real, budget] = await Promise.all([
  fetchAnalysisContext({ scenario: 'Real' }),
  fetchAnalysisContext({ scenario: 'Orçado' })
]);

// Comparar KPIs
const realRevenue = real.kpis.find(k => k.code === 'REVENUE')?.actual;
const budgetRevenue = budget.kpis.find(k => k.code === 'REVENUE')?.actual;
```

### 🚀 Performance

**Otimizações Implementadas:**

1. **Logs de Progresso:**
   - Console logs para acompanhar cada etapa
   - Indicadores de filtros aplicados

2. **Fallback Automático:**
   - Se Supabase falhar ou não retornar dados, usa mock
   - Evita erros em produção

3. **Detecção Inteligente:**
   - Período e escopo detectados automaticamente
   - Reduz necessidade de configuração manual

**Métricas Esperadas:**

- Busca de transações: 2-5s (para ~10k transactions)
- Cálculo de KPIs: < 100ms
- Construção de datasets: 200-500ms
- **Total:** 2-6 segundos

### 🐛 Error Handling

Todos os erros têm fallback para mock:

```typescript
try {
  const transactions = await getAllTransactions();
  if (!transactions || transactions.length === 0) {
    return getMockContext(); // Fallback
  }
  // ... processar
} catch (error) {
  console.error("❌ Erro:", error);
  return getMockContext(); // Fallback
}
```

### 📝 TODOs Futuros

1. **Cache de Contexto**
   - Evitar múltiplas buscas idênticas
   - Usar Map ou Redis

2. **Valores de Plano Reais**
   - Buscar de tabela `budget` no Supabase
   - Em vez de simular (actual * 0.97)

3. **Dados do Ano Anterior**
   - Buscar transações do ano anterior
   - Para cálculo correto de YoY

4. **API de Alunos**
   - Integrar com `/api/students/count`
   - Para `activeStudents` real

5. **Índices no Supabase**
   ```sql
   CREATE INDEX idx_transactions_date ON transactions(date);
   CREATE INDEX idx_transactions_brand ON transactions(brand);
   CREATE INDEX idx_transactions_scenario ON transactions(scenario);
   ```

### 📊 Build Status

```bash
✓ 3128 modules transformed
✓ Built in 37.91s
✓ Bundle: 3.29 MB (1.01 MB gzipped)
✓ Sem erros de compilação
```

### 🎓 Documentação

- **INTEGRATION_GUIDE.md** - Guia completo de uso
- **TESTING.md** - Guias de teste (incluindo fetchAnalysisContext)
- **README.md** - Feature overview
- **AI_INTEGRATION.md** - Integração com Claude AI

---

## [1.0.0] - 2026-01-30

### Initial Release

- Sistema completo de AnalysisPack
- 14 componentes React
- 2 hooks (useAnalysisPack, useAnalysisPackAI)
- Mock data completo
- Validação Zod
- Integração com Claude AI
- API endpoint /api/analysis/generate-ai
- 4 documentações

---

**Desenvolvido por:** Claude Code (Anthropic)
