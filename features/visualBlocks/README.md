# 📊 Visual Blocks

Sistema modular de componentes de visualização reutilizáveis para dashboards e relatórios.

## 🎯 Componentes

### 1. **ChartBlock** - Gráficos (ECharts)
Renderiza gráficos interativos usando ECharts.

```tsx
import { ChartBlock, useLineChartOptions } from '@/features/visualBlocks';

<ChartBlock
  id="revenue-chart"
  type="chart"
  title="Evolução da Receita"
  subtitle="Últimos 6 meses"
  chartType="line"
  options={useLineChartOptions(data)}
  height={400}
  loading={false}
/>
```

**Tipos suportados:** `line`, `bar`, `pie`, `scatter`, `radar`, `gauge`, `funnel`, `waterfall`

**Helpers disponíveis:**
- `useLineChartOptions(data)` - Gráfico de linha
- `useBarChartOptions(data)` - Gráfico de barras

---

### 2. **KpiGridBlock** - Grid de KPIs
Exibe indicadores com trends e formatação automática.

```tsx
import { KpiGridBlock } from '@/features/visualBlocks';

<KpiGridBlock
  id="main-kpis"
  type="kpi"
  title="Indicadores Principais"
  items={[
    {
      id: 'revenue',
      label: 'Receita',
      value: 1250000,
      format: 'currency',
      color: 'blue',
      trend: { value: 12.5, direction: 'up', isPositive: true }
    }
  ]}
  columns={4}
  variant="default"
/>
```

**Variantes:** `default`, `compact`, `detailed`

**Formatos:** `currency`, `percent`, `number`, `text`

**Cores:** `blue`, `green`, `red`, `yellow`, `purple`, `gray`

---

### 3. **TextBlock** - Blocos de Texto
Texto formatado com suporte a markdown e variantes.

```tsx
import { TextBlock } from '@/features/visualBlocks';

<TextBlock
  id="analysis"
  type="text"
  title="Análise"
  content="**Crescimento** de *12.5%* no período."
  variant="highlight"
  markdown={true}
  align="left"
/>
```

**Variantes:** `default`, `highlight`, `quote`, `alert`, `success`, `warning`, `error`

---

### 4. **TableBlock** - Tabelas de Dados
Tabelas com sorting, paginação e formatação customizada.

```tsx
import { TableBlock } from '@/features/visualBlocks';

<TableBlock
  id="monthly-data"
  type="table"
  title="Dados Mensais"
  columns={[
    { id: 'month', header: 'Mês', accessor: 'month', sortable: true },
    {
      id: 'revenue',
      header: 'Receita',
      accessor: 'revenue',
      align: 'right',
      format: (val) => `R$ ${val.toLocaleString()}`
    }
  ]}
  data={monthlyData}
  variant="striped"
  sortable={true}
  pagination={{ enabled: true, pageSize: 10 }}
/>
```

**Variantes:** `default`, `striped`, `bordered`, `compact`

---

## 🛠️ Estrutura de Arquivos

```
features/visualBlocks/
├── index.ts                    # Exports principais
├── EXAMPLE.tsx                 # Exemplos de uso
├── README.md                   # Esta documentação
├── types/
│   └── index.ts               # Definições TypeScript
└── blocks/
    ├── BlockContainer.tsx     # Container compartilhado
    ├── ChartBlock.tsx         # Gráficos
    ├── KpiGridBlock.tsx       # KPIs
    ├── TextBlock.tsx          # Texto
    └── TableBlock.tsx         # Tabelas
```

---

## 📦 Dependências

- **echarts** - Biblioteca de gráficos
- **echarts-for-react** - Wrapper React
- **lucide-react** - Ícones
- **TypeScript** - Tipagem

---

## 🚀 Uso Rápido

### 1. Importar componentes:
```tsx
import {
  ChartBlock,
  KpiGridBlock,
  TextBlock,
  TableBlock
} from '@/features/visualBlocks';
```

### 2. Usar no JSX:
```tsx
<div className="space-y-6">
  <KpiGridBlock {...kpiProps} />
  <ChartBlock {...chartProps} />
  <TableBlock {...tableProps} />
</div>
```

### 3. Estilizar (opcional):
Todos os componentes aceitam `className` para customização adicional.

---

## 💡 Exemplos Completos

Veja `EXAMPLE.tsx` para exemplos completos de cada componente.

---

## 🎨 Customização

### Cores do Tema
As cores seguem a paleta do projeto:
- **Blue**: `#1B75BB` - Principal
- **Orange**: `#F44C00` - Secundária
- **Teal**: `#7AC5BF` - Sucesso

### Tipografia
- **Font Black**: Títulos e valores importantes
- **Font Bold**: Labels e subtítulos
- **Font Medium**: Texto padrão

---

## 📄 Licença

Parte do projeto DRE - RAIZ 2.0
