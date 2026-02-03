import React from 'react';
import type { SlideBlock, ChartDef, AnalysisContext } from '../../types';
import { ChartRenderer } from './ChartRenderer';

interface SlideBlockRendererProps {
  block: SlideBlock;
  charts: ChartDef[];
  context: AnalysisContext;
}

export const SlideBlockRenderer: React.FC<SlideBlockRendererProps> = ({ block, charts, context }) => {
  // Renderizar bloco de texto
  if (block.type === 'text') {
    return (
      <div className="bg-white rounded-[0.75rem] p-5 border border-gray-200">
        {block.title && (
          <h4 className="text-lg font-black text-gray-900 mb-3">{block.title}</h4>
        )}
        <ul className="space-y-2">
          {block.bullets.map((bullet, idx) => (
            <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
              <span className="text-[#1B75BB] mt-1 font-bold">•</span>
              <span>{bullet}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  // Renderizar callout (destaque)
  if (block.type === 'callout') {
    const intentStyles = {
      positive: {
        bg: 'bg-green-50',
        border: 'border-green-500',
        icon: 'text-green-600',
        iconBg: 'bg-green-100'
      },
      negative: {
        bg: 'bg-red-50',
        border: 'border-red-500',
        icon: 'text-red-600',
        iconBg: 'bg-red-100'
      },
      neutral: {
        bg: 'bg-blue-50',
        border: 'border-blue-500',
        icon: 'text-blue-600',
        iconBg: 'bg-blue-100'
      }
    };

    const style = intentStyles[block.intent];

    const icons = {
      positive: (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      ),
      negative: (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      ),
      neutral: (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      )
    };

    return (
      <div className={`${style.bg} rounded-[0.75rem] p-5 border-l-4 ${style.border}`}>
        <div className="flex items-start gap-3">
          <div className={`${style.iconBg} rounded-lg p-2 mt-0.5`}>
            <svg className={`w-5 h-5 ${style.icon}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {icons[block.intent]}
            </svg>
          </div>
          <div className="flex-1">
            <h4 className="text-lg font-black text-gray-900 mb-3">{block.title}</h4>
            <ul className="space-y-2">
              {block.bullets.map((bullet, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                  <span className={`${style.icon} mt-1 font-bold`}>•</span>
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    );
  }

  // Renderizar grid de KPIs
  if (block.type === 'kpi_grid') {
    const kpis = block.kpi_codes
      .map(code => context.kpis.find(k => k.code === code))
      .filter(Boolean) as typeof context.kpis;

    const formatValue = (value: number, unit: string) => {
      if (unit === 'currency') {
        return new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: context.currency,
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        }).format(value);
      }
      if (unit === 'percent') {
        return `${value.toFixed(1)}%`;
      }
      return new Intl.NumberFormat('pt-BR').format(value);
    };

    const formatDelta = (delta: number | null | undefined) => {
      if (delta == null) return null;
      const sign = delta >= 0 ? '+' : '';
      return `${sign}${delta.toFixed(1)}%`;
    };

    return (
      <div className="bg-white rounded-[0.75rem] p-5 border border-gray-200">
        {block.title && (
          <h4 className="text-lg font-black text-gray-900 mb-4">{block.title}</h4>
        )}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map((kpi) => (
            <div key={kpi.code} className="bg-gray-50 rounded-lg p-4">
              <div className="text-xs text-gray-600 font-medium uppercase tracking-wide mb-1">
                {kpi.name}
              </div>
              <div className="text-2xl font-black text-gray-900 mb-2">
                {formatValue(kpi.actual, kpi.unit)}
              </div>
              <div className="flex items-center gap-3 text-xs">
                {kpi.delta_vs_plan != null && (
                  <div className="flex items-center gap-1">
                    <span className="text-gray-600">vs Plano:</span>
                    <span className={`font-bold ${kpi.delta_vs_plan >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatDelta(kpi.delta_vs_plan)}
                    </span>
                  </div>
                )}
                {kpi.delta_vs_prior != null && (
                  <div className="flex items-center gap-1">
                    <span className="text-gray-600">vs Ano Ant:</span>
                    <span className={`font-bold ${kpi.delta_vs_prior >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatDelta(kpi.delta_vs_prior)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Renderizar gráfico
  if (block.type === 'chart') {
    const chart = charts.find(c => c.id === block.chart_id);
    if (!chart) {
      return <div className="text-red-600 p-4">Gráfico não encontrado: {block.chart_id}</div>;
    }

    const heightClasses = {
      sm: 'h-64',
      md: 'h-96',
      lg: 'h-[32rem]'
    };

    return (
      <div className="bg-white rounded-[0.75rem] p-5 border border-gray-200">
        <div className={heightClasses[block.height]}>
          <ChartRenderer chart={chart} context={context} />
        </div>
        {block.note && (
          <p className="text-sm text-gray-600 mt-3 italic">{block.note}</p>
        )}
      </div>
    );
  }

  // Renderizar tabela
  if (block.type === 'table') {
    const dataset = context.datasets.drivers_table;
    if (!dataset) {
      return <div className="text-red-600 p-4">Dataset não encontrado: drivers_table</div>;
    }

    return (
      <div className="bg-white rounded-[0.75rem] p-5 border border-gray-200 overflow-x-auto">
        {block.title && (
          <h4 className="text-lg font-black text-gray-900 mb-4">{block.title}</h4>
        )}
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-gray-200">
              {dataset.columns.map((col, idx) => (
                <th
                  key={idx}
                  className="text-left py-3 px-4 text-sm font-black text-gray-700 uppercase tracking-wider"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {dataset.rows.map((row, rowIdx) => (
              <tr key={rowIdx} className="border-b border-gray-100 hover:bg-gray-50">
                {row.map((cell, cellIdx) => (
                  <td
                    key={cellIdx}
                    className={`py-3 px-4 text-sm ${
                      cellIdx === 0 ? 'font-bold text-gray-900' : 'text-gray-700'
                    }`}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return <div className="text-red-600 p-4">Tipo de bloco não suportado: {(block as any).type}</div>;
};
