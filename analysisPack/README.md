# AnalysisPack - Sistema de Análise Financeira

## 📋 Visão Geral

Feature completa de análise financeira para o DRE RAIZ, implementando um sistema de apresentação de análises automáticas baseadas em dados transacionais.

## 🎯 Funcionalidades

- **Sumário Executivo**: Headline, destaques, riscos e oportunidades
- **Plano de Ação**: Lista de ações com responsáveis, prazos e impactos esperados
- **Slides de Análise**: Apresentação visual com múltiplos tipos de blocos
- **Gráficos Interativos**: Line, Waterfall, Pareto e Heatmap
- **KPI Grid**: Cards de indicadores com comparativos
- **Tabelas Dinâmicas**: Dados tabulares formatados

## 📁 Estrutura de Arquivos

```
analysisPack/
├── components/
│   ├── AnalysisPackViewer.tsx    # Componente principal com navegação
│   ├── ExecutiveSummary.tsx      # Sumário executivo
│   ├── ActionsList.tsx            # Lista de ações filtráveis
│   ├── SlideRenderer.tsx          # Renderiza um slide
│   ├── SlideBlockRenderer.tsx     # Renderiza blocos individuais
│   └── ChartRenderer.tsx          # Renderiza gráficos
├── hooks/
│   └── useAnalysisPack.ts         # Hook para integração com API
├── mock/
│   └── mockData.ts                # Dados de exemplo completos
├── types/
│   └── index.ts                   # Tipos específicos da feature
├── index.ts                       # Barrel export
└── README.md                      # Esta documentação
```

## 🔧 Tipos Principais

### AnalysisPack
```typescript
type AnalysisPack = {
  meta: {
    org_name: string;
    period_label: string;
    scope_label: string;
    currency: CurrencyCode;
    generated_at_iso: string;
  };
  executive_summary: {
    headline: string;
    bullets: string[];
    risks: string[];
    opportunities: string[];
  };
  actions: Array<{
    owner: string;
    action: string;
    eta: string;
    expected_impact: string;
  }>;
  charts: ChartDef[];
  slides: Slide[];
};
```

### Slide
```typescript
type Slide = {
  title: string;
  subtitle?: string;
  blocks: SlideBlock[];
};
```

### SlideBlock (Union Type)
```typescript
type SlideBlock =
  | { type: "text"; title?: string; bullets: string[] }
  | { type: "callout"; intent: "positive" | "negative" | "neutral"; title: string; bullets: string[] }
  | { type: "kpi_grid"; title?: string; kpi_codes: string[] }
  | { type: "chart"; chart_id: string; height: "sm" | "md" | "lg"; note?: string }
  | { type: "table"; title?: string; dataset_key: "drivers_table" };
```

## 🚀 Como Usar

### 1. Com Mock Data (Desenvolvimento)

```tsx
import { AnalysisPackViewer } from './analysisPack';
import { mockAnalysisPack } from './analysisPack/mock/mockData';

function App() {
  return <AnalysisPackViewer analysisPack={mockAnalysisPack} />;
}
```

### 2. Com Hook de API (Produção)

```tsx
import { AnalysisPackViewer } from './analysisPack';
import { useAnalysisPack } from './analysisPack/hooks/useAnalysisPack';

function AnalysisView() {
  const { analysisPack, loading, error, generate } = useAnalysisPack();

  const handleGenerate = () => {
    generate({
      org_name: "RAIZ EDUCAÇÃO",
      period_label: "Janeiro/2026",
      scope_label: "Consolidado",
      currency: "BRL",
      filters: {
        brand: "Marca A",
        scenario: "Real"
      }
    });
  };

  if (loading) return <div>Gerando análise...</div>;
  if (error) return <div>Erro: {error}</div>;
  if (!analysisPack) return <button onClick={handleGenerate}>Gerar Análise</button>;

  return <AnalysisPackViewer analysisPack={analysisPack} />;
}
```

### 3. Com analysisService (Backend)

```typescript
import { generateAnalysisPack } from './services/analysisService';

// Em um endpoint de API ou função serverless
const analysisPack = generateAnalysisPack(transactions, kpis, {
  org_name: "RAIZ EDUCAÇÃO",
  period_label: "Janeiro/2026",
  scope_label: "Consolidado",
  currency: "BRL"
});

return Response.json({ success: true, data: analysisPack });
```

## 🎨 Componentes

### AnalysisPackViewer

Componente principal que renderiza toda a análise com navegação por abas.

**Props:**
- `analysisPack: AnalysisPack` - Dados da análise

**Features:**
- 3 abas: Sumário Executivo, Plano de Ação, Slides
- Navegação de slides com indicadores
- Miniaturas de todos os slides
- Botões de impressão e exportação (PPT futuro)

### ExecutiveSummary

Renderiza o sumário executivo em grid de 3 colunas.

**Props:**
- `summary: AnalysisPack['executive_summary']`
- `meta: AnalysisPack['meta']`

**Layout:**
- Headline destacado
- Destaques (azul/verde)
- Riscos (vermelho)
- Oportunidades (verde)

### ActionsList

Lista de ações com filtros e ordenação.

**Props:**
- `actions: AnalysisPack['actions']`

**Features:**
- Filtro por responsável
- Ordenação por prazo ou responsável
- Indicadores de urgência (dias até prazo)
- Destaque para ações atrasadas

### ChartRenderer

Renderiza gráficos usando Recharts.

**Props:**
- `chart: ChartDef` - Definição do gráfico
- `context: AnalysisContext` - Contexto com datasets

**Tipos suportados:**
- **line**: Gráfico de linhas (R12)
- **waterfall**: Gráfico cascata (ponte de EBITDA)
- **pareto**: Gráfico de barras ordenado (top N)
- **heatmap**: Mapa de calor em tabela HTML

## 🔌 Integração com API

### Endpoint Esperado

```
POST /api/analysis/generate
```

**Request Body:**
```json
{
  "org_name": "RAIZ EDUCAÇÃO",
  "period_label": "Janeiro/2026",
  "scope_label": "Consolidado",
  "currency": "BRL",
  "filters": {
    "brand": "Marca A",
    "branch": "Unidade Centro",
    "scenario": "Real"
  },
  "analysis_rules": {
    "prefer_pareto": true,
    "highlight_threshold_currency": 100000,
    "highlight_threshold_percent": 5
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "meta": { ... },
    "executive_summary": { ... },
    "actions": [ ... ],
    "charts": [ ... ],
    "slides": [ ... ]
  }
}
```

## 📊 Datasets

### r12 (Rolling 12 Months)
Série temporal dos últimos 12 meses.

```typescript
{
  x: string[];  // Labels dos meses
  series: Array<{
    key: string;
    name: string;
    data: number[];
    unit: "currency" | "number" | "percent";
  }>;
}
```

### ebitda_bridge_vs_plan_ytd
Ponte de EBITDA (waterfall).

```typescript
{
  start_label: string;
  end_label: string;
  start_value: number;
  end_value: number;
  steps: Array<{ label: string; value: number }>;
}
```

### pareto_cost_variance_ytd
Variações de custo ordenadas.

```typescript
{
  items: Array<{ name: string; value: number }>;
}
```

### heatmap_variance
Mapa de calor de variações.

```typescript
{
  x: string[];  // Eixo X (ex: marcas)
  y: string[];  // Eixo Y (ex: categorias)
  values: Array<[number, number, number]>;  // [xIdx, yIdx, valor]
  unit: "currency" | "number" | "percent";
}
```

### drivers_table
Tabela de indicadores operacionais.

```typescript
{
  columns: string[];
  rows: Array<Array<string | number>>;
}
```

## 🎨 Customização

### Cores do Tema

As cores seguem o padrão do projeto:
- Primary: `#1B75BB` (azul)
- Secondary: `#F44C00` (laranja)
- Accent: `#7AC5BF` (turquesa)

### Tailwind Classes

Todos os componentes usam Tailwind CSS com:
- Border radius: `rounded-[Xrem]`
- Font weight: `font-black` para títulos
- Transições: `transition-all duration-300`

## 🧪 Testes

### Testar com Mock Data

```bash
# Iniciar servidor de desenvolvimento
npm run dev

# Navegar para a view de análise
# Clicar no menu "Análise Financeira"
```

### Testar Geração Dinâmica

```typescript
import { generateAnalysisPack } from './services/analysisService';

// Usar transações reais do sistema
const pack = generateAnalysisPack(transactions, kpis, {
  org_name: "RAIZ EDUCAÇÃO",
  period_label: "Janeiro/2026",
  scope_label: "Consolidado"
});

console.log('Generated pack:', pack);
```

## 📝 Próximos Passos

### Features Planejadas
- [ ] Exportação para PowerPoint (PPT)
- [ ] Salvamento de análises no Supabase
- [ ] Histórico de análises geradas
- [ ] Comentários colaborativos em slides
- [ ] Integração com IA (Gemini/Anthropic) para narrativas
- [ ] Comparação de múltiplos períodos
- [ ] Personalização de templates de slides

### Melhorias de Performance
- [ ] Lazy loading de gráficos
- [ ] Virtualização de lista de slides
- [ ] Cache de análises geradas
- [ ] Streaming de geração (SSE)

## 🐛 Troubleshooting

### Gráficos não aparecem
- Verificar se o dataset está presente em `context.datasets`
- Verificar se o `chart_id` do bloco corresponde a um gráfico em `charts`

### KPIs vazios
- Verificar se os códigos em `kpi_codes` existem em `context.kpis`
- Verificar se os KPIs foram calculados corretamente

### Erro de compilação TypeScript
- Verificar se todos os tipos estão importados de `types.ts`
- Verificar se não há tipos `any` implícitos

## 📚 Referências

- [Recharts Documentation](https://recharts.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [React TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app/)

## 👥 Contribuindo

1. Criar branch: `git checkout -b feature/nova-funcionalidade`
2. Fazer mudanças e commit: `git commit -m "Adiciona nova funcionalidade"`
3. Push: `git push origin feature/nova-funcionalidade`
4. Abrir Pull Request

## 📄 Licença

Propriedade de RAIZ Educação S.A.
