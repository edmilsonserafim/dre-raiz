import React from 'react';
import type { Slide, ChartDef, AnalysisContext } from '../../types';
import { SlideBlockRenderer } from './SlideBlockRenderer';

interface SlideRendererProps {
  slide: Slide;
  slideNumber: number;
  totalSlides: number;
  charts: ChartDef[];
  context: AnalysisContext;
}

export const SlideRenderer: React.FC<SlideRendererProps> = ({
  slide,
  slideNumber,
  totalSlides,
  charts,
  context
}) => {
  return (
    <div className="bg-white rounded-[1rem] shadow-sm border border-gray-200 p-6 mb-6">
      {/* Header do Slide */}
      <div className="mb-6 pb-4 border-b-2 border-gray-200">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#1B75BB] to-[#7AC5BF] flex items-center justify-center">
                <span className="text-white font-black text-lg">{slideNumber}</span>
              </div>
              <h2 className="text-2xl font-black text-gray-900">{slide.title}</h2>
            </div>
            {slide.subtitle && (
              <p className="text-md text-gray-600 ml-13">{slide.subtitle}</p>
            )}
          </div>
          <div className="text-sm text-gray-500 font-medium">
            Slide {slideNumber} de {totalSlides}
          </div>
        </div>
      </div>

      {/* Blocos do Slide */}
      <div className="space-y-4">
        {slide.blocks.map((block, idx) => (
          <SlideBlockRenderer
            key={idx}
            block={block}
            charts={charts}
            context={context}
          />
        ))}
      </div>

      {/* Footer do Slide */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div>{context.org_name} - {context.period_label}</div>
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span>Análise Financeira Automatizada</span>
          </div>
        </div>
      </div>
    </div>
  );
};
