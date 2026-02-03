# Guia de Exportação de Gráficos

## 📋 Visão Geral

Sistema de exportação em massa de gráficos ECharts como PNG base64, ideal para:
- Exportação para PowerPoint
- Envio em emails de relatório
- Salvamento de snapshots no banco de dados
- Download manual de gráficos

---

## 🔧 useChartRegistry Hook

Hook que gerencia o registro de gráficos e permite exportação em massa.

### Importação

```typescript
import { useChartRegistry } from './analysisPack';
```

### API

```typescript
const chartRegistry = useChartRegistry();

// Métodos disponíveis:
chartRegistry.register(chartId, exporterFn)      // Registra um gráfico
chartRegistry.exportAllPngBase64()               // Exporta todos como PNG base64
chartRegistry.getRegisteredIds()                 // Lista IDs registrados
chartRegistry.clear()                            // Limpa todos os registros
```

---

## 🚀 Uso Básico

### 1. Criar Registry

```tsx
import { useChartRegistry, ChartRendererECharts } from './analysisPack';

function AnalysisView() {
  const chartRegistry = useChartRegistry();
  const context = getMockContext();

  // ...
}
```

### 2. Passar para Gráficos

```tsx
<ChartRendererECharts
  chart={chartDef}
  context={context}
  chartRegistry={chartRegistry}  // ← Importante!
/>
```

**Nota:** Os gráficos se registram automaticamente quando montados!

### 3. Exportar Todos

```tsx
const handleExport = async () => {
  const pngs = await chartRegistry.exportAllPngBase64();

  // pngs = {
  //   'revenue_chart': 'data:image/png;base64,iVBORw0KGgoAAAANSUh...',
  //   'waterfall_chart': 'data:image/png;base64,iVBORw0KGgoAAAANSUh...',
  //   'pareto_chart': 'data:image/png;base64,iVBORw0KGgoAAAANSUh...'
  // }

  console.log('Exported charts:', Object.keys(pngs));
};
```

---

## 📊 Casos de Uso

### Caso 1: Download Manual

```tsx
function DownloadButton({ chartRegistry }) {
  const handleDownload = async (chartId: string) => {
    const pngs = await chartRegistry.exportAllPngBase64();
    const dataURL = pngs[chartId];

    if (!dataURL) {
      console.error('Chart not found:', chartId);
      return;
    }

    // Criar link temporário e fazer download
    const link = document.createElement('a');
    link.href = dataURL;
    link.download = `${chartId}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <button onClick={() => handleDownload('revenue_chart')}>
      💾 Download Gráfico
    </button>
  );
}
```

### Caso 2: Exportar para PowerPoint

```tsx
import { pptExportService } from './services/pptExportService';

async function exportToPPT(analysisPack: AnalysisPack, chartRegistry) {
  // 1. Exportar todos os gráficos
  const chartImages = await chartRegistry.exportAllPngBase64();

  // 2. Usar pptExportService (assumindo que existe)
  const ppt = await pptExportService.createPresentation({
    analysisPack,
    chartImages  // Passar PNG base64
  });

  // 3. Download
  ppt.download('analysis-report.pptx');
}
```

### Caso 3: Enviar por Email

```tsx
async function sendEmailReport(chartRegistry) {
  // 1. Exportar gráficos
  const chartImages = await chartRegistry.exportAllPngBase64();

  // 2. Converter base64 para Blob
  const attachments = Object.entries(chartImages).map(([id, dataURL]) => {
    const base64 = dataURL.split(',')[1];
    const blob = base64ToBlob(base64, 'image/png');

    return {
      filename: `${id}.png`,
      content: blob
    };
  });

  // 3. Enviar email
  await fetch('/api/send-email', {
    method: 'POST',
    body: JSON.stringify({
      to: 'cfo@company.com',
      subject: 'Relatório Financeiro',
      attachments
    })
  });
}

function base64ToBlob(base64: string, type: string) {
  const binary = atob(base64);
  const array = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    array[i] = binary.charCodeAt(i);
  }
  return new Blob([array], { type });
}
```

### Caso 4: Salvar no Supabase

```tsx
async function saveChartsToDatabase(analysisPack: AnalysisPack, chartRegistry) {
  // 1. Exportar gráficos
  const chartImages = await chartRegistry.exportAllPngBase64();

  // 2. Salvar no Supabase
  const { data, error } = await supabase
    .from('analysis_snapshots')
    .insert({
      analysis_pack_id: analysisPack.meta.generated_at_iso,
      chart_images: chartImages,  // JSON com base64
      created_at: new Date().toISOString()
    });

  if (error) {
    console.error('Erro ao salvar:', error);
    return;
  }

  console.log('Snapshot salvo:', data);
}
```

### Caso 5: Upload para Cloud Storage

```tsx
async function uploadToS3(chartRegistry) {
  const chartImages = await chartRegistry.exportAllPngBase64();

  for (const [chartId, dataURL] of Object.entries(chartImages)) {
    // Converter base64 para Blob
    const base64 = dataURL.split(',')[1];
    const blob = base64ToBlob(base64, 'image/png');

    // Upload para S3
    const formData = new FormData();
    formData.append('file', blob, `${chartId}.png`);

    await fetch('/api/upload-to-s3', {
      method: 'POST',
      body: formData
    });
  }
}
```

---

## 🎨 Opções de Exportação

### Customizar Qualidade

O `ChartRendererECharts` usa por padrão:

```typescript
chartInstance.getDataURL({
  type: 'png',
  pixelRatio: 2,        // Retina-ready (2x)
  backgroundColor: '#fff'
});
```

Para customizar, modifique em `ChartRendererECharts.tsx`:

```typescript
const dataURL = chartInstance.current.getDataURL({
  type: 'png',
  pixelRatio: 3,              // 3x para qualidade ultra-alta
  backgroundColor: '#ffffff',
  excludeComponents: ['toolbox', 'dataZoom']  // Remover controles
});
```

### Exportar como JPEG

```typescript
const dataURL = chartInstance.current.getDataURL({
  type: 'jpeg',
  pixelRatio: 2,
  backgroundColor: '#fff'
});
```

### Exportar com Dimensões Específicas

```typescript
// Antes de exportar, ajustar tamanho
chartInstance.current.resize({
  width: 1920,
  height: 1080
});

const dataURL = chartInstance.current.getDataURL({ ... });
```

---

## 🧪 Testando

### Teste 1: Console do Navegador

```javascript
// 1. Montar componente com chartRegistry
// 2. Abrir DevTools (F12)
// 3. Executar:

const registry = window.__chartRegistry;  // Se exposto globalmente
const pngs = await registry.exportAllPngBase64();

console.log('Exported:', Object.keys(pngs));
console.log('Sizes:', Object.entries(pngs).map(([id, url]) =>
  [id, Math.round(url.length / 1024) + ' KB']
));
```

### Teste 2: Botão de Teste

```tsx
import { ExportChartsExample } from './analysisPack/examples/ExportChartsExample';

// Renderizar exemplo completo
<ExportChartsExample />
```

### Teste 3: Validar PNG

```typescript
const pngs = await chartRegistry.exportAllPngBase64();

// Verificar se é dataURL válido
const isValid = (dataURL: string) =>
  dataURL.startsWith('data:image/png;base64,');

Object.entries(pngs).forEach(([id, dataURL]) => {
  console.log(`${id}:`, isValid(dataURL) ? '✓ Valid' : '✗ Invalid');
});
```

---

## ⚡ Performance

### Tamanho dos PNGs

| Resolução | Tamanho Típico |
|-----------|----------------|
| 800x400 @ 1x | ~50-100 KB |
| 800x400 @ 2x | ~150-300 KB |
| 1920x1080 @ 2x | ~500-800 KB |

### Otimizações

#### 1. Exportar Apenas Visíveis

```tsx
const [visibleCharts, setVisibleCharts] = useState<string[]>([]);

// Ao exportar, filtrar apenas visíveis
const pngs = await chartRegistry.exportAllPngBase64();
const filtered = Object.fromEntries(
  Object.entries(pngs).filter(([id]) => visibleCharts.includes(id))
);
```

#### 2. Lazy Export

```tsx
// Não exportar todos de uma vez, exportar sob demanda
async function exportChart(chartId: string) {
  const ids = chartRegistry.getRegisteredIds();
  if (!ids.includes(chartId)) {
    console.error('Chart not registered:', chartId);
    return null;
  }

  const pngs = await chartRegistry.exportAllPngBase64();
  return pngs[chartId];
}
```

#### 3. Comprimir Base64

```typescript
import pako from 'pako';

function compressBase64(dataURL: string): string {
  const base64 = dataURL.split(',')[1];
  const binary = atob(base64);
  const compressed = pako.deflate(binary);
  return btoa(String.fromCharCode(...compressed));
}

function decompressBase64(compressed: string): string {
  const binary = atob(compressed);
  const array = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    array[i] = binary.charCodeAt(i);
  }
  const decompressed = pako.inflate(array);
  return `data:image/png;base64,${btoa(String.fromCharCode(...decompressed))}`;
}
```

---

## 🐛 Troubleshooting

### Erro: "getDataURL is not a function"

**Causa:** Chart instance não foi inicializado

**Solução:**
```typescript
if (!chartInstance.current) {
  console.error('Chart not initialized');
  return null;
}

const dataURL = chartInstance.current.getDataURL({ ... });
```

### Erro: PNG vazio ou corrupto

**Causa:** Chart ainda está renderizando

**Solução:** Adicionar delay antes de exportar
```typescript
await new Promise(resolve => setTimeout(resolve, 500));  // 500ms delay
const pngs = await chartRegistry.exportAllPngBase64();
```

### Erro: "Out of memory"

**Causa:** Muitos gráficos ou alta resolução

**Soluções:**
1. Reduzir pixelRatio de 2 para 1
2. Exportar em lotes menores
3. Limpar registry após exportação

```typescript
// Exportar em lotes de 5
const ids = chartRegistry.getRegisteredIds();
const batches = [];
for (let i = 0; i < ids.length; i += 5) {
  batches.push(ids.slice(i, i + 5));
}

for (const batch of batches) {
  const pngs = await chartRegistry.exportAllPngBase64();
  const batchPngs = Object.fromEntries(
    Object.entries(pngs).filter(([id]) => batch.includes(id))
  );
  await processB atch(batchPngs);
}
```

### Gráfico não se registra

**Causa:** `chartRegistry` não foi passado como prop

**Solução:**
```tsx
// ✗ Errado
<ChartRendererECharts chart={chart} context={context} />

// ✓ Correto
<ChartRendererECharts
  chart={chart}
  context={context}
  chartRegistry={chartRegistry}  // ← Importante!
/>
```

---

## 📚 Referências

- **ECharts getDataURL**: https://echarts.apache.org/en/api.html#echartsInstance.getDataURL
- **Canvas toDataURL**: https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toDataURL
- **File API**: https://developer.mozilla.org/en-US/docs/Web/API/File_API

---

## 🎯 Próximos Passos

1. **Testar exportação** com exemplo `ExportChartsExample.tsx`
2. **Integrar com PPT** via `pptExportService`
3. **Adicionar UI** para exportação em `AnalysisPackViewer`
4. **Implementar cache** para evitar re-exportação
5. **Adicionar progresso** visual durante exportação

---

**Desenvolvido por:** Claude Code (Anthropic)
**Data:** 30 de Janeiro de 2026
