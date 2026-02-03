# 🤖 AI Report Page - Guia de Uso

Documentação da página `/ai-report` que integra o sistema completo AnalysisPack.

---

## 📍 Localização

```
app/
└── ai-report/
    ├── page.tsx              # Next.js App Router page
    └── AIReportClient.tsx    # Client component principal
```

**URL:** `http://localhost:3000/ai-report`

---

## 🎯 Funcionalidades

### 1. **Gerar Relatório**
- Toggle entre dados **Mock** (desenvolvimento) ou **Real** (Supabase)
- Busca contexto do Supabase (se Real)
- Gera AnalysisPack com IA (Claude)
- Renderiza com SlideDeck

### 2. **Exportar PNGs**
- Exporta todos os gráficos como PNG base64
- Download automático de cada imagem
- Qualidade Retina (2x)

### 3. **Exportar PowerPoint**
- Gera apresentação .pptx completa
- Inclui todos os slides, textos e gráficos
- Download automático do arquivo

---

## 🖥️ Interface

### Header
```
┌─────────────────────────────────────────────────────────┐
│ 🤖 Análise Financeira com IA                           │
│ RAIZ • Jan/2026 • Consolidado                          │
│                                                         │
│ [x] Usar dados mock   [🔄 Gerar]  [📸]  [📊]          │
└─────────────────────────────────────────────────────────┘
```

### Controles

| Botão | Ação | Cor |
|-------|------|-----|
| **🔄 Gerar Relatório** | Busca dados e gera análise | Azul |
| **📸 PNGs** | Exporta gráficos como PNG | Cinza |
| **📊 PowerPoint** | Exporta apresentação | Verde |
| **☑️ Usar dados mock** | Toggle mock/real | - |

### Loading State
```
┌─────────────────────────────────────────────────────────┐
│                         ⏳                              │
│                  Gerando análise...                     │
│        Processando dados e gerando insights com IA      │
└─────────────────────────────────────────────────────────┘
```

### Footer
```
┌─────────────────────────────────────────────────────────┐
│ 💡 5 slides • 4 gráficos • 8 KPIs                      │
│                   Desenvolvido com Claude Code          │
└─────────────────────────────────────────────────────────┘
```

---

## 💻 Código do Componente

### AIReportClient.tsx

```typescript
"use client";

import { useState } from "react";
import {
  SlideDeck,
  useChartRegistry,
  buildPpt,
  getMockContext,
  mockAnalysisPack,
  fetchAnalysisContext,
} from "@/analysisPack";

export default function AIReportClient() {
  const [pack, setPack] = useState(mockAnalysisPack);
  const [context, setContext] = useState(getMockContext());
  const [loading, setLoading] = useState(false);
  const [useMock, setUseMock] = useState(true);
  const chartRegistry = useChartRegistry();

  const handleGenerateReport = async () => {
    if (useMock) {
      // Usar dados mock
      setPack(mockAnalysisPack);
      setContext(getMockContext());
    } else {
      // Buscar dados reais e gerar com IA
      const ctx = await fetchAnalysisContext({ scenario: "Real" });
      const response = await fetch("/api/analysis/generate-ai", {
        method: "POST",
        body: JSON.stringify({ context: ctx }),
      });
      const { data } = await response.json();
      setPack(data);
      setContext(ctx);
    }
  };

  const handleExportPpt = async () => {
    const pngs = await chartRegistry.exportAllPngBase64();
    await buildPpt({
      pack,
      chartImages: pngs,
      fileName: `Analise-${context.period_label}.pptx`,
    });
  };

  return (
    <div>
      {/* Header com controles */}
      <header>...</header>

      {/* SlideDeck */}
      <main>
        <SlideDeck
          pack={pack}
          ctx={context}
          onRegisterChart={chartRegistry.register}
        />
      </main>

      {/* Footer com estatísticas */}
      <footer>...</footer>
    </div>
  );
}
```

---

## 🔄 Fluxo de Dados

### Modo Mock (Desenvolvimento)

```
┌──────────────┐
│ Usuário      │
│ clica em     │  ✅ Usar dados mock
│ "Gerar"      │
└──────┬───────┘
       │
       v
┌──────────────────┐
│ mockAnalysisPack │ ← Dados fixos
│ getMockContext() │
└──────┬───────────┘
       │
       v
┌──────────────┐
│ SlideDeck    │ → Renderiza slides
└──────────────┘
```

### Modo Real (Produção)

```
┌──────────────┐
│ Usuário      │
│ clica em     │  ❌ Usar dados mock
│ "Gerar"      │
└──────┬───────┘
       │
       v
┌──────────────────────┐
│ fetchAnalysisContext │ → Supabase
│ (scenario: "Real")   │   (transactions)
└──────┬───────────────┘
       │
       v
┌──────────────────────┐
│ /api/analysis/       │ → Claude AI
│ generate-ai          │   (gera AnalysisPack)
└──────┬───────────────┘
       │
       v
┌──────────────┐
│ SlideDeck    │ → Renderiza slides
└──────────────┘
```

### Exportação

```
┌──────────────┐
│ SlideDeck    │
│ (renderizado)│
└──────┬───────┘
       │
       v
┌──────────────────────┐
│ chartRegistry        │
│ .exportAllPngBase64()│ → { chartId: dataURL }
└──────┬───────────────┘
       │
       v
┌──────────────┐
│ buildPpt()   │ → Download .pptx
└──────────────┘
```

---

## 🚀 Como Usar

### 1. **Acessar a Página**

```bash
npm run dev
# Abrir: http://localhost:3000/ai-report
```

### 2. **Modo Desenvolvimento (Mock)**

```
1. ✅ Marcar "Usar dados mock"
2. Clicar "🔄 Gerar Relatório"
3. Ver análise renderizada instantaneamente
4. Clicar "📊 PowerPoint" para exportar
```

**Vantagens:**
- ⚡ Instantâneo (sem API calls)
- 🎯 Dados previsíveis
- 🔧 Ideal para desenvolvimento UI

### 3. **Modo Produção (Real)**

```
1. ❌ Desmarcar "Usar dados mock"
2. Clicar "🔄 Gerar Relatório"
3. Aguardar busca do Supabase (~2-3s)
4. Aguardar geração IA (~5-10s)
5. Ver análise real renderizada
6. Clicar "📊 PowerPoint" para exportar
```

**Vantagens:**
- 📊 Dados reais do banco
- 🤖 Análise customizada por IA
- 🎯 Insights precisos

### 4. **Exportar Gráficos**

```typescript
// PNG Individual
Clicar "📸 PNGs"
→ Baixa todos os gráficos como PNG

// PowerPoint Completo
Clicar "📊 PowerPoint"
→ Baixa apresentação com todos os slides
```

---

## 🔧 Customização

### Adicionar Filtros

```typescript
const [filters, setFilters] = useState({
  brand: "Marca A",
  branch: "Filial 01",
  scenario: "Real",
  startDate: "2026-01-01",
  endDate: "2026-01-31",
});

const handleGenerateReport = async () => {
  const ctx = await fetchAnalysisContext(filters);
  // ...
};
```

### Adicionar Indicador de Progresso

```typescript
const [progress, setProgress] = useState<string>("");

const handleGenerateReport = async () => {
  setProgress("Buscando transações...");
  const ctx = await fetchAnalysisContext({ scenario: "Real" });

  setProgress("Gerando análise com IA...");
  const response = await fetch("/api/analysis/generate-ai", {
    method: "POST",
    body: JSON.stringify({ context: ctx }),
  });

  setProgress("Renderizando...");
  const { data } = await response.json();
  setPack(data);
  setProgress("");
};
```

### Adicionar Error Handling

```typescript
const [error, setError] = useState<string | null>(null);

const handleGenerateReport = async () => {
  setError(null);
  try {
    // ... lógica de geração
  } catch (err) {
    setError(err.message);
    // Fallback para mock
    setPack(mockAnalysisPack);
    setContext(getMockContext());
  }
};

// No render:
{error && (
  <div className="rounded-lg bg-red-50 border border-red-200 p-4">
    <div className="font-semibold text-red-800">Erro</div>
    <div className="text-sm text-red-700">{error}</div>
  </div>
)}
```

---

## 📊 Métricas e Performance

### Tempos Esperados

| Operação | Tempo (Mock) | Tempo (Real) |
|----------|--------------|--------------|
| **Gerar Relatório** | < 100ms | 5-10s |
| **Buscar Contexto** | - | 2-3s |
| **Gerar com IA** | - | 3-7s |
| **Renderizar** | < 500ms | < 500ms |
| **Exportar PNGs** | 1-2s | 1-2s |
| **Exportar PowerPoint** | 2-3s | 2-3s |

### Otimizações

```typescript
// 1. Memoizar contexto
const memoizedContext = useMemo(() => context, [context.period_label]);

// 2. Lazy load buildPpt
const handleExportPpt = async () => {
  const { buildPpt } = await import("@/analysisPack/services/pptExportService");
  // ...
};

// 3. Debounce para gerar
const debouncedGenerate = useMemo(
  () => debounce(handleGenerateReport, 500),
  []
);
```

---

## 🐛 Troubleshooting

### 1. "Erro ao gerar relatório"

**Causa:** API `/api/analysis/generate-ai` não encontrada ou falhou

**Solução:**
```typescript
// Verificar se API existe
// Verificar se contexto está correto
// Usar modo mock para testar
```

### 2. Gráficos não aparecem no PowerPoint

**Causa:** `onRegisterChart` não foi passado

**Solução:**
```typescript
<SlideDeck
  pack={pack}
  ctx={context}
  onRegisterChart={chartRegistry.register}  // ← Não esquecer!
/>
```

### 3. Loading infinito

**Causa:** API não retornou ou erro não tratado

**Solução:**
```typescript
// Adicionar timeout
const timeout = setTimeout(() => {
  setLoading(false);
  setError("Timeout ao gerar análise");
}, 30000); // 30s

// No finally:
clearTimeout(timeout);
```

---

## 🎯 Próximos Passos

### Features Sugeridas

1. **Histórico de Análises**
   - Salvar no Supabase
   - Listar análises anteriores
   - Comparar períodos

2. **Filtros Avançados**
   - Seletor de marca/filial
   - Date range picker
   - Cenário (Real/Plan)

3. **Compartilhamento**
   - Gerar link público
   - Enviar por email
   - Agendar geração recorrente

4. **Customização**
   - Escolher quais KPIs exibir
   - Reordenar slides
   - Adicionar notas pessoais

---

## 📚 Recursos

- **AnalysisPack:** `@/analysisPack`
- **Supabase:** `@/services/supabaseClient`
- **API:** `/api/analysis/generate-ai`
- **Docs:** `analysisPack/FINAL_SUMMARY.md`

---

**Status:** ✅ Funcional e pronto para uso
**Desenvolvido por:** Claude Code (Anthropic)
**Data:** 30 de Janeiro de 2026
