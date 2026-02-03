// Componentes
export { AnalysisPackViewer } from './components/AnalysisPackViewer';
export { ExecutiveSummary } from './components/ExecutiveSummary';
export { ActionsList } from './components/ActionsList';
export { SlideRenderer } from './components/SlideRenderer';
export { SlideBlockRenderer } from './components/SlideBlockRenderer';
export { ChartRenderer } from './components/ChartRenderer';
export { ChartRendererECharts } from './components/ChartRendererECharts';
export { ChartBlock, type ChartBlockProps } from './components/ChartBlock';
export { SlideDeck, type SlideDeckProps } from './components/SlideDeck';

// Blocks
export { TextBlock, type TextBlockProps } from './components/blocks/TextBlock';
export { KpiGridBlock, type KpiGridBlockProps } from './components/blocks/KpiGridBlock';
export { TableBlock, type TableBlockProps } from './components/blocks/TableBlock';

// Hooks
export { useAnalysisPack } from './hooks/useAnalysisPack';
export { useAnalysisPackAI } from './hooks/useAnalysisPackAI';
export { useChartRegistry, type UseChartRegistryReturn, type ChartRegistry } from './hooks/useChartRegistry';

// Services
export { fetchAnalysisContext, type FetchContextParams } from './services/contextService';
export { buildDatasets, buildKPIs } from './services/dataBuilder';
export { buildPpt } from './services/pptExportService';

// Mock data
export { mockAnalysisPack, mockKPIs } from './mock/mockData';
export { getMockContext, getSimpleMockContext } from './mock/mockContext';

// Schema e validação
export {
  AnalysisPackSchema,
  validateAnalysisPack,
  safeValidateAnalysisPack,
  type AnalysisPackZ
} from './types/schema';

// Prompts para IA
export {
  buildSystemPrompt,
  buildUserPrompt,
  extractJSON
} from './utils/prompts';

// JSON Schema para Claude
export { AnalysisPackJSONSchema } from './utils/jsonSchema';

// ECharts utils
export { buildEChartsOption } from './utils/echartsBuilder';
