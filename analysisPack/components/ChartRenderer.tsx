import React, { useMemo } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { ChartDef, AnalysisContext } from '../../types';

interface ChartRendererProps {
  chart: ChartDef;
  context: AnalysisContext;
}

export const ChartRenderer: React.FC<ChartRendererProps> = ({ chart, context }) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: context.currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 1
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('pt-BR').format(value);
  };

  // Renderizar gráfico de linha (R12)
  if (chart.kind === 'line') {
    const dataset = context.datasets.r12;
    if (!dataset) return <div className="text-red-600">Dataset não encontrado: r12</div>;

    const data = dataset.x.map((label, idx) => {
      const point: any = { month: label };
      chart.series_keys.forEach(key => {
        const series = dataset.series.find(s => s.key === key);
        if (series) {
          point[series.name] = series.data[idx];
        }
      });
      return point;
    });

    const series = chart.series_keys
      .map(key => dataset.series.find(s => s.key === key))
      .filter(Boolean);

    const colors = ['#1B75BB', '#F44C00', '#7AC5BF', '#FF9933', '#9B59B6'];

    return (
      <div className="w-full h-full">
        <h3 className="text-lg font-black text-gray-900 mb-4">{chart.title}</h3>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="month" stroke="#6b7280" style={{ fontSize: '12px' }} />
            <YAxis
              stroke="#6b7280"
              style={{ fontSize: '12px' }}
              tickFormatter={(value) => {
                const unit = series[0]?.unit;
                if (unit === 'currency') return formatCurrency(value);
                if (unit === 'percent') return formatPercent(value);
                return formatNumber(value);
              }}
            />
            <Tooltip
              contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '0.5rem' }}
              formatter={(value: any) => {
                const unit = series[0]?.unit;
                if (unit === 'currency') return formatCurrency(value);
                if (unit === 'percent') return formatPercent(value);
                return formatNumber(value);
              }}
            />
            <Legend wrapperStyle={{ fontSize: '14px', fontWeight: 'bold' }} />
            {series.map((s, idx) => (
              <Line
                key={s!.key}
                type="monotone"
                dataKey={s!.name}
                stroke={colors[idx % colors.length]}
                strokeWidth={3}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  }

  // Renderizar gráfico waterfall
  if (chart.kind === 'waterfall') {
    const dataset = context.datasets.ebitda_bridge_vs_plan_ytd;
    if (!dataset) return <div className="text-red-600">Dataset não encontrado: ebitda_bridge_vs_plan_ytd</div>;

    const data = [
      { name: dataset.start_label, value: dataset.start_value, type: 'start' },
      ...dataset.steps.map(step => ({
        name: step.label,
        value: step.value,
        type: step.value >= 0 ? 'positive' : 'negative'
      })),
      { name: dataset.end_label, value: dataset.end_value, type: 'end' }
    ];

    return (
      <div className="w-full h-full">
        <h3 className="text-lg font-black text-gray-900 mb-4">{chart.title}</h3>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="name" stroke="#6b7280" style={{ fontSize: '12px' }} angle={-15} textAnchor="end" height={80} />
            <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} tickFormatter={formatCurrency} />
            <Tooltip
              contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '0.5rem' }}
              formatter={(value: any) => formatCurrency(value)}
            />
            <Bar dataKey="value" radius={[8, 8, 0, 0]}>
              {data.map((entry, index) => {
                let fill = '#6b7280';
                if (entry.type === 'start' || entry.type === 'end') fill = '#1B75BB';
                else if (entry.type === 'positive') fill = '#10b981';
                else if (entry.type === 'negative') fill = '#F44C00';

                return <rect key={`cell-${index}`} fill={fill} />;
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }

  // Renderizar gráfico Pareto
  if (chart.kind === 'pareto') {
    const dataset = context.datasets.pareto_cost_variance_ytd;
    if (!dataset) return <div className="text-red-600">Dataset não encontrado: pareto_cost_variance_ytd</div>;

    // Ordenar por valor absoluto e pegar top N
    const sortedItems = [...dataset.items]
      .sort((a, b) => Math.abs(b.value) - Math.abs(a.value))
      .slice(0, chart.top_n);

    const data = sortedItems.map(item => ({
      name: item.name,
      value: item.value,
      absValue: Math.abs(item.value)
    }));

    return (
      <div className="w-full h-full">
        <h3 className="text-lg font-black text-gray-900 mb-4">{chart.title}</h3>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="name" stroke="#6b7280" style={{ fontSize: '11px' }} angle={-15} textAnchor="end" height={100} />
            <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} tickFormatter={(v) => formatCurrency(v / 1000) + 'K'} />
            <Tooltip
              contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '0.5rem' }}
              formatter={(value: any) => formatCurrency(value * 1000)}
            />
            <Legend wrapperStyle={{ fontSize: '14px', fontWeight: 'bold' }} />
            <Bar dataKey="value" name="Variação" radius={[8, 8, 0, 0]}>
              {data.map((entry, index) => (
                <rect key={`cell-${index}`} fill={entry.value >= 0 ? '#F44C00' : '#10b981'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <p className="text-sm text-gray-600 mt-2 text-center">
          Valores positivos indicam custos acima do orçado, valores negativos indicam economia
        </p>
      </div>
    );
  }

  // Renderizar heatmap
  if (chart.kind === 'heatmap') {
    const dataset = context.datasets.heatmap_variance;
    if (!dataset) return <div className="text-red-600">Dataset não encontrado: heatmap_variance</div>;

    // Criar matriz para o heatmap
    const matrix: { [key: string]: { [key: string]: number } } = {};
    dataset.values.forEach(([xIdx, yIdx, value]) => {
      const xLabel = dataset.x[xIdx];
      const yLabel = dataset.y[yIdx];
      if (!matrix[yLabel]) matrix[yLabel] = {};
      matrix[yLabel][xLabel] = value;
    });

    // Encontrar min e max para escala de cores
    const allValues = dataset.values.map(v => v[2]);
    const maxAbs = Math.max(...allValues.map(Math.abs));

    const getColor = (value: number) => {
      if (value === 0) return '#f3f4f6';
      const intensity = Math.abs(value) / maxAbs;
      if (value > 0) {
        // Vermelho para valores positivos (ruins)
        const red = Math.floor(244 + (255 - 244) * intensity);
        const green = Math.floor(76 - 76 * intensity);
        return `rgb(${red}, ${green}, 0)`;
      } else {
        // Verde para valores negativos (bons)
        const green = Math.floor(181 + (74 - 181) * intensity);
        return `rgb(16, ${green}, 129)`;
      }
    };

    return (
      <div className="w-full h-full">
        <h3 className="text-lg font-black text-gray-900 mb-4">{chart.title}</h3>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="border border-gray-300 p-2 bg-gray-100 text-sm font-black"></th>
                {dataset.x.map(label => (
                  <th key={label} className="border border-gray-300 p-2 bg-gray-100 text-sm font-black">
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {dataset.y.map(yLabel => (
                <tr key={yLabel}>
                  <td className="border border-gray-300 p-2 bg-gray-100 text-sm font-black">
                    {yLabel}
                  </td>
                  {dataset.x.map(xLabel => {
                    const value = matrix[yLabel]?.[xLabel] ?? 0;
                    const formatter = dataset.unit === 'currency' ? formatCurrency :
                                    dataset.unit === 'percent' ? formatPercent :
                                    formatNumber;

                    return (
                      <td
                        key={xLabel}
                        className="border border-gray-300 p-2 text-center text-sm font-bold"
                        style={{ backgroundColor: getColor(value) }}
                      >
                        <span className={value === 0 ? 'text-gray-600' : Math.abs(value) > maxAbs * 0.5 ? 'text-white' : 'text-gray-900'}>
                          {formatter(value)}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-center gap-6 mt-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#10b581' }}></div>
            <span className="text-xs text-gray-600">Abaixo do orçado (economia)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#f3f4f6' }}></div>
            <span className="text-xs text-gray-600">Dentro do orçado</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#F44C00' }}></div>
            <span className="text-xs text-gray-600">Acima do orçado</span>
          </div>
        </div>
      </div>
    );
  }

  return <div className="text-red-600">Tipo de gráfico não suportado: {(chart as any).kind}</div>;
};
