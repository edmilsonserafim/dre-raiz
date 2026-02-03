# Guia de Uso - ECharts Integration

## 📋 Visão Geral

O sistema AnalysisPack agora suporta renderização de gráficos usando **Apache ECharts**, uma biblioteca mais poderosa e customizável que Recharts.

---

## 🎨 Componentes Disponíveis

### 1. ChartRenderer (Recharts) - Original

Usa Recharts para renderização simples e rápida.

```tsx
import { ChartRenderer } from './analysisPack';

<ChartRenderer chart={chartDef} context={analysisContext} />
```

### 2. ChartRendererECharts (NEW) - Avançado

Usa Apache ECharts para gráficos mais sofisticados.

```tsx
import { ChartRendererECharts } from './analysisPack';

<ChartRendererECharts
  chart={chartDef}
  context={analysisContext}
  height={400}
/>
```

---

## 🔧 buildEChartsOption

Função utilitária que constrói opções de configuração para ECharts.

### Importação

```typescript
import { buildEChartsOption } from './analysisPack';
```

### Uso Direto

```typescript
import * as echarts from 'echarts';

const option = buildEChartsOption({
  def: chartDef,
  datasets: context.datasets,
  currency: context.currency
});

const chart = echarts.init(document.getElementById('chart')!);
chart.setOption(option);
```

---

## 📊 Tipos de Gráficos Suportados

### 1. Line Chart - Gráfico de Linhas

**Usado para:** Séries temporais (ex: R12 receita/EBITDA)

**Exemplo:**
```typescript
const chartDef: ChartDef = {
  id: 'revenue_ebitda_r12',
  kind: 'line',
  dataset_key: 'r12',
  title: 'Evolução de Receita e EBITDA (R12M)',
  series_keys: ['revenue', 'ebitda']
};
```

**Features:**
- Múltiplas séries
- Smooth curves
- Formatação automática de currency/percent/number
- Tooltip interativo
- Legend

---

### 2. Waterfall Chart - Gráfico Cascata

**Usado para:** Ponte de EBITDA, variações acumuladas

**Exemplo:**
```typescript
const chartDef: ChartDef = {
  id: 'ebitda_bridge',
  kind: 'waterfall',
  dataset_key: 'ebitda_bridge_vs_plan_ytd',
  title: 'Ponte de EBITDA vs Orçamento (YTD)'
};
```

**Features:**
- Start e end values destacados
- Steps coloridos (positivo/negativo)
- Labels automáticos em formato compacto (K/M)
- Tooltip com formatação de currency

**Como funciona:**
```typescript
// Dataset esperado
{
  start_label: "EBITDA Orçado",
  end_label: "EBITDA Real",
  start_value: 17_000_000,
  end_value: 18_200_000,
  steps: [
    { label: "Gap Receita", value: 750_000 },
    { label: "Custos Variáveis", value: -300_000 },
    { label: "Custos Fixos", value: -200_000 },
    { label: "SG&A", value: -150_000 },
    { label: "Outros", value: 100_000 }
  ]
}
```

---

### 3. Pareto Chart - Gráfico de Pareto

**Usado para:** Top N variações, análise 80/20

**Exemplo:**
```typescript
const chartDef: ChartDef = {
  id: 'cost_variance_pareto',
  kind: 'pareto',
  dataset_key: 'pareto_cost_variance_ytd',
  title: 'Principais Variações de Custo (Pareto)',
  top_n: 10
};
```

**Features:**
- Barras ordenadas por impacto absoluto
- Linha de acumulado percentual (0-100%)
- Dual Y-axis (valores absolutos + percentual)
- Automaticamente pega top N itens

**Como funciona:**
```typescript
// Dataset esperado
{
  items: [
    { name: "Folha de Pagamento", value: -950_000 },
    { name: "Energia", value: -280_000 },
    { name: "Material Didático", value: -220_000 },
    // ... mais itens
  ]
}

// Gráfico mostra:
// - Barras: valores de cada item
// - Linha: % acumulado (ex: 70% do total nos primeiros 3 itens)
```

---

### 4. Heatmap - Mapa de Calor

**Usado para:** Variações por marca/categoria, matriz de performance

**Exemplo:**
```typescript
const chartDef: ChartDef = {
  id: 'variance_heatmap',
  kind: 'heatmap',
  dataset_key: 'heatmap_variance',
  title: 'Mapa de Calor: Variações por Categoria e Marca'
};
```

**Features:**
- Escala de cores automática baseada em min/max
- Tooltip customizado com labels de X e Y
- Visual map interativo
- Suporta currency, percent, number

**Como funciona:**
```typescript
// Dataset esperado
{
  x: ["Marca A", "Marca B", "Marca C"],
  y: ["Receita", "Custos Fixos", "Custos Variáveis", "SG&A"],
  values: [
    [0, 0, 50000],    // [xIdx, yIdx, valor]
    [0, 1, -30000],
    [0, 2, 20000],
    [1, 0, -20000],
    // ...
  ],
  unit: "currency"  // ou "percent" ou "number"
}
```

---

## 🎨 Formatação de Valores

### fmtCurrency()

Formata valores em formato compacto (K/M).

```typescript
fmtCurrency(1_500_000, 'BRL')    // "BRL 1.5M"
fmtCurrency(50_000, 'BRL')       // "BRL 50K"
fmtCurrency(500, 'BRL')          // "BRL 500"
fmtCurrency(-2_300_000, 'USD')   // "-USD 2.3M"
```

**Lógica:**
- `>= 1M`: divide por 1.000.000, adiciona "M"
- `>= 1K`: divide por 1.000, adiciona "K"
- `< 1K`: mostra valor inteiro
- Adiciona sinal "-" para negativos

---

## 🔄 Comparação: Recharts vs ECharts

| Feature | Recharts | ECharts |
|---------|----------|---------|
| Instalação | ✅ Simples | ✅ Simples |
| Bundle Size | 🟢 Pequeno (~100KB) | 🟡 Médio (~300KB) |
| Line Chart | ✅ | ✅ |
| Bar Chart | ✅ | ✅ |
| Waterfall | ⚠️ Complexo | ✅ Nativo |
| Pareto | ❌ Manual | ✅ Fácil |
| Heatmap | ❌ | ✅ Nativo |
| Customização | 🟡 Limitada | 🟢 Completa |
| Performance | 🟢 Boa | 🟢 Excelente |
| Mobile | ✅ | ✅ |
| SSR | ⚠️ Precisa de workarounds | ✅ |

**Recomendação:**
- **Recharts**: Para gráficos simples (line, bar) e protótipos rápidos
- **ECharts**: Para gráficos avançados (waterfall, pareto, heatmap) e produção

---

## 🚀 Migração de Recharts para ECharts

### Antes (Recharts):

```tsx
import { ChartRenderer } from './analysisPack';

<ChartRenderer chart={chartDef} context={context} />
```

### Depois (ECharts):

```tsx
import { ChartRendererECharts } from './analysisPack';

<ChartRendererECharts chart={chartDef} context={context} height={400} />
```

**Nenhuma mudança nos dados necessária!** Os `ChartDef` e `DatasetRegistry` são os mesmos.

---

## 🎯 Casos de Uso

### Caso 1: Usar ECharts em Todos os Gráficos

```tsx
import { ChartRendererECharts as ChartRenderer } from './analysisPack';

// Usar normalmente
<ChartRenderer chart={chartDef} context={context} />
```

### Caso 2: Mesclar Recharts e ECharts

```tsx
import { ChartRenderer, ChartRendererECharts } from './analysisPack';

// Usar Recharts para line charts simples
{chart.kind === 'line' && <ChartRenderer chart={chart} context={context} />}

// Usar ECharts para waterfall/pareto/heatmap
{['waterfall', 'pareto', 'heatmap'].includes(chart.kind) && (
  <ChartRendererECharts chart={chart} context={context} />
)}
```

### Caso 3: Renderização Manual

```tsx
import { useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import { buildEChartsOption } from './analysisPack';

function CustomChart({ chartDef, context }) {
  const chartRef = useRef(null);

  useEffect(() => {
    const chart = echarts.init(chartRef.current);
    const option = buildEChartsOption({
      def: chartDef,
      datasets: context.datasets,
      currency: context.currency
    });

    // Customizar opção se necessário
    option.backgroundColor = '#f5f5f5';
    option.title.textStyle = { fontSize: 18, fontWeight: 'bold' };

    chart.setOption(option);

    return () => chart.dispose();
  }, [chartDef, context]);

  return <div ref={chartRef} style={{ width: '100%', height: '500px' }} />;
}
```

---

## 🐛 Troubleshooting

### Erro: "Cannot read property 'init' of undefined"

**Causa:** ECharts não está instalado ou não foi importado corretamente.

**Solução:**
```bash
npm install echarts
```

### Gráfico não aparece

**Causas possíveis:**
1. Container sem altura definida
2. Dados do dataset ausentes
3. chart.kind não corresponde ao dataset_key

**Solução:**
```tsx
// 1. Sempre definir altura
<ChartRendererECharts chart={chart} context={context} height={400} />

// 2. Verificar datasets
console.log('Datasets:', context.datasets);

// 3. Validar chartDef
console.log('Chart:', chart);
console.log('Dataset exists:', !!context.datasets[chart.dataset_key]);
```

### Formatação de currency incorreta

**Causa:** `fmtCurrency()` usa formato compacto (K/M) por padrão.

**Solução customizada:**
```typescript
// Em echartsBuilder.ts, modifique fmtCurrency:
function fmtCurrency(v: number, ccy: CurrencyCode): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: ccy,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(v);
}
```

### Waterfall com valores negativos estranhos

**Causa:** Dataset com steps acumulados em vez de deltas.

**Correção:**
```typescript
// Dataset correto (deltas):
steps: [
  { label: "Gap Receita", value: 750_000 },      // +750K do start
  { label: "Custos", value: -300_000 }            // -300K do step anterior
]

// Dataset errado (valores absolutos):
steps: [
  { label: "Gap Receita", value: 17_750_000 },   // ❌ Valor absoluto
  { label: "Custos", value: 17_450_000 }          // ❌ Valor absoluto
]
```

---

## 📚 Referências

- **ECharts Official**: https://echarts.apache.org/
- **ECharts Handbook**: https://echarts.apache.org/handbook/en/get-started/
- **ECharts Examples**: https://echarts.apache.org/examples/
- **Waterfall Tutorial**: https://echarts.apache.org/examples/en/editor.html?c=bar-waterfall

---

## 🎓 Próximos Passos

1. **Testar ChartRendererECharts** com mock data
2. **Comparar visual** entre Recharts e ECharts
3. **Escolher biblioteca padrão** para produção
4. **Adicionar mais customizações** (cores, temas, animations)
5. **Otimizar bundle** com tree-shaking se necessário

---

**Desenvolvido por:** Claude Code (Anthropic)
**Data:** 30 de Janeiro de 2026
