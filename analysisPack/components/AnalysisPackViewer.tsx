import React, { useState } from 'react';
import type { AnalysisPack, AnalysisContext } from '../../types';
import { ExecutiveSummary } from './ExecutiveSummary';
import { ActionsList } from './ActionsList';
import { SlideRenderer } from './SlideRenderer';

interface AnalysisPackViewerProps {
  analysisPack: AnalysisPack;
}

export const AnalysisPackViewer: React.FC<AnalysisPackViewerProps> = ({ analysisPack }) => {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [view, setView] = useState<'summary' | 'actions' | 'slides'>('summary');

  // Criar context para os slides
  const context: AnalysisContext = {
    org_name: analysisPack.meta.org_name,
    currency: analysisPack.meta.currency,
    period_label: analysisPack.meta.period_label,
    scope_label: analysisPack.meta.scope_label,
    kpis: analysisPack.datasets ? [] : [], // KPIs são derivados dos datasets no mock
    datasets: analysisPack.datasets || {}
  };

  // Adicionar KPIs do mock ao context
  if (analysisPack.datasets) {
    // Construir KPIs a partir dos dados do mock
    context.kpis = [
      {
        code: "revenue",
        name: "Receita Total",
        unit: "currency" as const,
        actual: 74500000,
        plan: 72200000,
        prior: 73200000,
        delta_vs_plan: 3.18,
        delta_vs_prior: 1.78
      },
      {
        code: "ebitda",
        name: "EBITDA",
        unit: "currency" as const,
        actual: 18500000,
        plan: 16300000,
        prior: 17800000,
        delta_vs_plan: 13.50,
        delta_vs_prior: 3.93
      },
      {
        code: "net_margin",
        name: "Margem Líquida",
        unit: "percent" as const,
        actual: 25.3,
        plan: 22.0,
        prior: 24.3,
        delta_vs_plan: 3.3,
        delta_vs_prior: 1.0
      },
      {
        code: "cost_per_student",
        name: "Custo por Aluno",
        unit: "currency" as const,
        actual: 4850,
        plan: 4950,
        prior: 4920,
        delta_vs_plan: -2.02,
        delta_vs_prior: -1.42
      }
    ];
  }

  const handlePrevSlide = () => {
    setCurrentSlideIndex(prev => Math.max(0, prev - 1));
  };

  const handleNextSlide = () => {
    setCurrentSlideIndex(prev => Math.min(analysisPack.slides.length - 1, prev + 1));
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header Principal */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="bg-gradient-to-r from-[#1B75BB] to-[#7AC5BF] rounded-[1rem] p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-black mb-2">Análise Financeira</h1>
              <div className="flex items-center gap-4 text-sm">
                <span className="font-bold">{analysisPack.meta.org_name}</span>
                <span>•</span>
                <span>{analysisPack.meta.period_label}</span>
                <span>•</span>
                <span>{analysisPack.meta.scope_label}</span>
                <span>•</span>
                <span>Gerado em {new Date(analysisPack.meta.generated_at_iso).toLocaleDateString('pt-BR')}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                className="px-4 py-2 bg-white text-[#1B75BB] rounded-lg font-bold hover:bg-gray-100 transition-colors flex items-center gap-2"
                onClick={() => window.print()}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Imprimir
              </button>
              <button
                className="px-4 py-2 bg-white text-[#1B75BB] rounded-lg font-bold hover:bg-gray-100 transition-colors flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Exportar PPT
              </button>
            </div>
          </div>
        </div>

        {/* Navegação de Abas */}
        <div className="bg-white rounded-[1rem] shadow-sm border border-gray-200 mt-4 p-2 flex gap-2">
          <button
            onClick={() => setView('summary')}
            className={`flex-1 py-3 px-4 rounded-lg font-bold transition-colors ${
              view === 'summary'
                ? 'bg-[#1B75BB] text-white'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            Sumário Executivo
          </button>
          <button
            onClick={() => setView('actions')}
            className={`flex-1 py-3 px-4 rounded-lg font-bold transition-colors ${
              view === 'actions'
                ? 'bg-[#F44C00] text-white'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            Plano de Ação ({analysisPack.actions.length})
          </button>
          <button
            onClick={() => setView('slides')}
            className={`flex-1 py-3 px-4 rounded-lg font-bold transition-colors ${
              view === 'slides'
                ? 'bg-[#7AC5BF] text-white'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            Slides de Análise ({analysisPack.slides.length})
          </button>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="max-w-7xl mx-auto">
        {view === 'summary' && (
          <ExecutiveSummary summary={analysisPack.executive_summary} meta={analysisPack.meta} />
        )}

        {view === 'actions' && (
          <ActionsList actions={analysisPack.actions} />
        )}

        {view === 'slides' && (
          <>
            {/* Navegação de Slides */}
            <div className="bg-white rounded-[1rem] shadow-sm border border-gray-200 p-4 mb-4">
              <div className="flex items-center justify-between">
                <button
                  onClick={handlePrevSlide}
                  disabled={currentSlideIndex === 0}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-bold hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Anterior
                </button>

                <div className="flex items-center gap-2">
                  {analysisPack.slides.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentSlideIndex(idx)}
                      className={`w-3 h-3 rounded-full transition-colors ${
                        idx === currentSlideIndex
                          ? 'bg-[#1B75BB]'
                          : 'bg-gray-300 hover:bg-gray-400'
                      }`}
                      title={`Slide ${idx + 1}`}
                    />
                  ))}
                </div>

                <button
                  onClick={handleNextSlide}
                  disabled={currentSlideIndex === analysisPack.slides.length - 1}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-bold hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Próximo
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Slide Atual */}
            <SlideRenderer
              slide={analysisPack.slides[currentSlideIndex]}
              slideNumber={currentSlideIndex + 1}
              totalSlides={analysisPack.slides.length}
              charts={analysisPack.charts}
              context={context}
            />

            {/* Miniatura de todos os slides */}
            <div className="bg-white rounded-[1rem] shadow-sm border border-gray-200 p-6 mt-4">
              <h3 className="text-lg font-black text-gray-900 mb-4">Todos os Slides</h3>
              <div className="grid md:grid-cols-3 gap-4">
                {analysisPack.slides.map((slide, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentSlideIndex(idx)}
                    className={`text-left p-4 rounded-lg border-2 transition-all ${
                      idx === currentSlideIndex
                        ? 'border-[#1B75BB] bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-black ${
                        idx === currentSlideIndex
                          ? 'bg-[#1B75BB] text-white'
                          : 'bg-gray-200 text-gray-700'
                      }`}>
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-sm text-gray-900 mb-1 truncate">
                          {slide.title}
                        </div>
                        {slide.subtitle && (
                          <div className="text-xs text-gray-600 truncate">
                            {slide.subtitle}
                          </div>
                        )}
                        <div className="text-xs text-gray-500 mt-1">
                          {slide.blocks.length} bloco{slide.blocks.length !== 1 ? 's' : ''}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
