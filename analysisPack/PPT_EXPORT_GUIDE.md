# 📊 PowerPoint Export Guide

Guia completo para exportar AnalysisPack como PowerPoint (.pptx) usando `buildPpt`.

---

## 📦 Visão Geral

A função `buildPpt` usa a biblioteca [PptxGenJS](https://gitbrent.github.io/PptxGenJS/) para gerar apresentações PowerPoint diretamente no browser a partir de um `AnalysisPack` e imagens dos gráficos.

**Formato de saída:**
- Layout: 16:9 (LAYOUT_WIDE - 13.33" x 7.5")
- Um slide por `Slide` do AnalysisPack
- Blocos text/callout → Texto com bullets
- Blocos chart → Imagens PNG
- Título e subtítulo em cada slide

---

## 🚀 Uso Básico

### 1. Workflow Completo

```typescript
import {
  SlideDeck,
  useChartRegistry,
  buildPpt,
  getMockContext,
  mockAnalysisPack
} from './analysisPack';

function AnalysisReport() {
  const chartRegistry = useChartRegistry();
  const context = getMockContext();

  const handleExportPpt = async () => {
    // 1. Exportar gráficos como PNG base64
    const chartImages = await chartRegistry.exportAllPngBase64();

    // 2. Gerar e baixar PowerPoint
    await buildPpt({
      pack: mockAnalysisPack,
      chartImages,
      fileName: 'Analise-Financeira.pptx'
    });
  };

  return (
    <>
      <SlideDeck
        pack={mockAnalysisPack}
        ctx={context}
        onRegisterChart={chartRegistry.register}
      />
      <button onClick={handleExportPpt}>
        📊 Exportar PowerPoint
      </button>
    </>
  );
}
```

---

## 📐 API Reference

### `buildPpt(args)`

```typescript
async function buildPpt(args: {
  pack: AnalysisPack;
  chartImages: Record<string, string>;
  fileName?: string;
}): Promise<void>
```

**Parâmetros:**

| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `pack` | `AnalysisPack` | Pack com slides e blocos |
| `chartImages` | `Record<string, string>` | Mapa de `chartId` → dataURL (PNG base64) |
| `fileName` | `string?` | Nome do arquivo (default: "AI-Resumo-Financeiro.pptx") |

**Retorno:** `Promise<void>` - Faz download automático do arquivo

---

## 🎨 Blocos Suportados

### ✅ Blocos Implementados

| Tipo | Como é Renderizado |
|------|---------------------|
| **text** | Texto com bullets (• Item 1, • Item 2) |
| **callout** | Mesmo que text (bullets) |
| **chart** | Imagem PNG (do chartImages) |

### ⚠️ Blocos Não Implementados (Futuro)

| Tipo | Status |
|------|--------|
| **kpi_grid** | ❌ Precisa renderização manual (pode usar addTable) |
| **table** | ❌ Precisa renderização manual (pode usar addTable) |

---

## 📊 Layout e Estilos

### Configurações Padrão

```typescript
// Layout
pptx.layout = "LAYOUT_WIDE"; // 13.33" x 7.5" (16:9)

// Título
x: 0.6, y: 0.3, w: 12.1, h: 0.6
fontFace: "Arial", fontSize: 24, bold: true

// Subtítulo
x: 0.6, y: 0.95, w: 12.1, h: 0.4
fontFace: "Arial", fontSize: 12, color: "666666"

// Texto/Bullets
x: 0.8, y: [dinâmico], w: 12.0, h: 1.2
fontFace: "Arial", fontSize: 12, color: "333333"

// Gráficos (height)
sm: 2.0"
md: 2.8"
lg: 3.6"
```

### Cursor Vertical

- Inicia em `y = 1.5`
- Após texto: `+1.3`
- Após gráfico: `+height + 0.3`

---

## 💡 Exemplos Avançados

### Exemplo 1: Com Dados Reais do Supabase

```typescript
import { fetchAnalysisContext, buildPpt } from './analysisPack';

async function exportRealData() {
  // 1. Buscar contexto real
  const context = await fetchAnalysisContext({
    brand: 'Marca A',
    scenario: 'Real',
    startDate: '2026-01-01',
    endDate: '2026-01-31'
  });

  // 2. Gerar AnalysisPack com IA
  const response = await fetch('/api/analysis/generate-ai', {
    method: 'POST',
    body: JSON.stringify({ context })
  });
  const { data: pack } = await response.json();

  // 3. Exportar gráficos
  const chartImages = await chartRegistry.exportAllPngBase64();

  // 4. Gerar PowerPoint
  await buildPpt({
    pack,
    chartImages,
    fileName: `Analise-${context.period_label}.pptx`
  });
}
```

### Exemplo 2: Enviar por Email (Backend)

```typescript
// Frontend
const pngs = await chartRegistry.exportAllPngBase64();

const response = await fetch('/api/reports/email', {
  method: 'POST',
  body: JSON.stringify({
    pack: analysisPack,
    chartImages: pngs,
    recipientEmail: 'gestor@empresa.com'
  })
});

// Backend (api/reports/email.ts)
import { buildPpt } from '@/analysisPack';
import nodemailer from 'nodemailer';

export async function POST(req: Request) {
  const { pack, chartImages, recipientEmail } = await req.json();

  // Gerar PPTX como buffer (Node.js)
  const pptx = /* ... criar pptx ... */;
  const buffer = await pptx.write({ outputType: 'nodebuffer' });

  // Enviar por email
  const transporter = nodemailer.createTransport(/* ... */);
  await transporter.sendMail({
    to: recipientEmail,
    subject: 'Análise Financeira',
    attachments: [{
      filename: 'Analise.pptx',
      content: buffer
    }]
  });

  return Response.json({ success: true });
}
```

### Exemplo 3: Salvar no Supabase

```typescript
import { supabase } from '@/services/supabaseClient';

async function saveToDatabase() {
  const pngs = await chartRegistry.exportAllPngBase64();

  // Salvar chartImages como JSON
  const { data, error } = await supabase
    .from('analysis_reports')
    .insert({
      pack: analysisPack,
      chart_images: pngs,
      created_at: new Date().toISOString()
    });

  // Mais tarde, recuperar e gerar PPT
  const { data: report } = await supabase
    .from('analysis_reports')
    .select('*')
    .eq('id', reportId)
    .single();

  await buildPpt({
    pack: report.pack,
    chartImages: report.chart_images,
    fileName: `Report-${reportId}.pptx`
  });
}
```

---

## 🔧 Troubleshooting

### 1. Gráfico não aparece no PowerPoint

**Problema:** Chart block não renderiza imagem.

**Solução:**
```typescript
// ✅ Verificar se chartId está correto
const chartImages = await chartRegistry.exportAllPngBase64();
console.log('Chart IDs:', Object.keys(chartImages));
console.log('Pack chart IDs:', pack.charts.map(c => c.id));

// ✅ Verificar se onRegisterChart foi passado
<SlideDeck
  pack={pack}
  ctx={context}
  onRegisterChart={chartRegistry.register}  // ← Não esquecer!
/>
```

### 2. Download não inicia

**Problema:** `pptx.writeFile()` não funciona.

**Solução:**
```typescript
// ✅ Usar await
await buildPpt({ pack, chartImages });

// ✅ Verificar se está no browser (não Node.js)
// Para Node.js, usar:
const buffer = await pptx.write({ outputType: 'nodebuffer' });
```

### 3. Imagens aparecem distorcidas

**Problema:** Aspect ratio incorreto.

**Solução:**
```typescript
// ✅ Ajustar height no buildPpt
const h = b.height === "lg" ? 4.0 : b.height === "md" ? 3.0 : 2.2;
s.addImage({ data: img, x: 0.8, y: cursorY, w: 12.0, h });
```

---

## 🎯 Casos de Uso

### 1. Download Imediato
```typescript
await buildPpt({ pack, chartImages, fileName: 'Report.pptx' });
// ✅ Baixa automaticamente
```

### 2. Gerar Blob (para upload)
```typescript
// Modificar buildPpt para retornar blob:
const blob = await pptx.write({ outputType: 'blob' });
const formData = new FormData();
formData.append('file', blob, 'Report.pptx');
await fetch('/api/upload', { method: 'POST', body: formData });
```

### 3. Preview antes de baixar
```typescript
// Mostrar contagem de slides
alert(`Gerando PowerPoint com ${pack.slides.length} slides...`);
await buildPpt({ pack, chartImages });
```

---

## 📚 Recursos

- **PptxGenJS Docs:** https://gitbrent.github.io/PptxGenJS/docs/usage-saving.html
- **Demos:** https://gitbrent.github.io/PptxGenJS/demo/
- **GitHub:** https://github.com/gitbrent/PptxGenJS

---

## 🚀 Próximos Passos

1. **Implementar KPI Grid:** Adicionar `addTable()` para renderizar kpi_grid
2. **Implementar Table:** Adicionar `addTable()` para renderizar tabelas
3. **Temas customizáveis:** Cores, fontes, layout
4. **Capa e conclusão:** Slides adicionais automáticos
5. **Melhorar layout:** Ajustar espaçamento e positioning

---

**Status:** ✅ Funcional (text, callout, chart)
**Desenvolvido por:** Claude Code (Anthropic)
**Data:** 30 de Janeiro de 2026
