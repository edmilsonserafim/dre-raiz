import React from 'react';
import type { AnalysisPack } from '../../types';

interface ExecutiveSummaryProps {
  summary: AnalysisPack['executive_summary'];
  meta: AnalysisPack['meta'];
}

export const ExecutiveSummary: React.FC<ExecutiveSummaryProps> = ({ summary, meta }) => {
  return (
    <div className="bg-white rounded-[1rem] p-6 shadow-sm border border-gray-200 mb-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-full bg-[#1B75BB] flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <h2 className="text-2xl font-black text-gray-900">Sumário Executivo</h2>
            <p className="text-sm text-gray-600">{meta.period_label} • {meta.scope_label}</p>
          </div>
        </div>
      </div>

      {/* Headline */}
      <div className="bg-gradient-to-r from-[#1B75BB]/10 to-[#7AC5BF]/10 rounded-[0.75rem] p-5 mb-6 border-l-4 border-[#1B75BB]">
        <p className="text-lg font-bold text-gray-900 leading-relaxed">
          {summary.headline}
        </p>
      </div>

      {/* Grid de Destaques */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Highlights */}
        <div className="bg-gray-50 rounded-[0.75rem] p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-[#7AC5BF] flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <h3 className="text-lg font-black text-gray-900">Destaques</h3>
          </div>
          <ul className="space-y-3">
            {summary.bullets.map((bullet, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                <span className="text-[#7AC5BF] mt-1">•</span>
                <span>{bullet}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Riscos */}
        <div className="bg-red-50 rounded-[0.75rem] p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-[#F44C00] flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-lg font-black text-gray-900">Riscos</h3>
          </div>
          <ul className="space-y-3">
            {summary.risks.map((risk, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                <span className="text-[#F44C00] mt-1">⚠</span>
                <span>{risk}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Oportunidades */}
        <div className="bg-green-50 rounded-[0.75rem] p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-green-600 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h3 className="text-lg font-black text-gray-900">Oportunidades</h3>
          </div>
          <ul className="space-y-3">
            {summary.opportunities.map((opportunity, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                <span className="text-green-600 mt-1">💡</span>
                <span>{opportunity}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
