import React, { useMemo } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { Transaction, SchoolKPIs, ChartConfig } from '../types';
import {
  aggregateByMonth,
  aggregateByCategory,
  aggregateByBranch,
  buildWaterfallData,
  buildTimeSeries,
  buildHeatmapData
} from '../utils/chartDataTransformer';

interface DynamicChartRendererProps {
  config: ChartConfig;
  transactions: Transaction[];
  kpis: SchoolKPIs;
}

const DynamicChartRenderer: React.FC<DynamicChartRendererProps> = ({ config, transactions, kpis }) => {
  const chartData = useMemo(() => {
    const { type, dataSpec } = config;

    switch (type) {
      case 'line':
      case 'composed':
        if (dataSpec.aggregation === 'monthly') {
          return buildTimeSeries(
            transactions,
            dataSpec.metrics,
            dataSpec.scenarios,
            dataSpec.timeframe
          );
        }
        return [];

      case 'bar':
        if (dataSpec.aggregation === 'branch') {
          return aggregateByBranch(transactions, dataSpec.metrics, dataSpec.scenarios);
        } else if (dataSpec.aggregation === 'category') {
          return aggregateByCategory(transactions, dataSpec.metrics, dataSpec.scenarios);
        } else if (dataSpec.aggregation === 'monthly') {
          return aggregateByMonth(
            transactions,
            dataSpec.metrics,
            dataSpec.scenarios,
            dataSpec.timeframe
          );
        }
        return [];

      case 'waterfall':
        return buildWaterfallData(transactions, dataSpec.scenarios[0] || 'Real');

      case 'heatmap':
        return buildHeatmapData(transactions, dataSpec.timeframe);

      default:
        return [];
    }
  }, [config, transactions]);

  // Color mapping for metrics and scenarios
  const getColor = (key: string): string => {
    if (key.includes('Real')) return '#1B75BB';
    if (key.includes('Orçado')) return '#10b981';
    if (key.includes('Anterior')) return '#F97316';
    if (key.includes('ebitda')) return '#7AC5BF';
    if (key.includes('revenue')) return '#1B75BB';
    if (key.includes('costs')) return '#F44C00';
    return '#6B7280';
  };

  // Custom tooltip formatter
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload) return null;

    return (
      <div className="bg-white p-4 rounded-xl shadow-lg border border-gray-100">
        <p className="font-black text-xs text-gray-900 mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-xs font-medium" style={{ color: entry.color }}>
            {entry.name}: R$ {Math.abs(entry.value).toLocaleString('pt-BR')}
          </p>
        ))}
      </div>
    );
  };

  const renderChart = () => {
    const { type, dataSpec } = config;

    // Build keys for data rendering
    const dataKeys = dataSpec.scenarios.flatMap(scenario =>
      dataSpec.metrics.map(metric => `${metric}_${scenario}`)
    );

    switch (type) {
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData as any[]}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 12, fontWeight: 600 }}
                stroke="#6B7280"
              />
              <YAxis
                tick={{ fontSize: 12, fontWeight: 600 }}
                stroke="#6B7280"
                tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: 12, fontWeight: 600 }}
                iconType="line"
              />
              {dataKeys.map((key, idx) => (
                <Line
                  key={key}
                  type="monotone"
                  dataKey={key}
                  name={key.replace('_', ' ')}
                  stroke={getColor(key)}
                  strokeWidth={3}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        );

      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData as any[]}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 12, fontWeight: 600 }}
                stroke="#6B7280"
              />
              <YAxis
                tick={{ fontSize: 12, fontWeight: 600 }}
                stroke="#6B7280"
                tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12, fontWeight: 600 }} />
              {dataKeys.map((key, idx) => (
                <Bar
                  key={key}
                  dataKey={key}
                  name={key.replace('_', ' ')}
                  fill={getColor(key)}
                  radius={[8, 8, 0, 0]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        );

      case 'composed':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <ComposedChart data={chartData as any[]}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 12, fontWeight: 600 }}
                stroke="#6B7280"
              />
              <YAxis
                tick={{ fontSize: 12, fontWeight: 600 }}
                stroke="#6B7280"
                tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12, fontWeight: 600 }} />
              {dataKeys.map((key, idx) => {
                if (key.includes('Real')) {
                  return (
                    <Line
                      key={key}
                      type="monotone"
                      dataKey={key}
                      name={key.replace('_', ' ')}
                      stroke={getColor(key)}
                      strokeWidth={3}
                      dot={{ r: 4 }}
                    />
                  );
                } else {
                  return (
                    <Bar
                      key={key}
                      dataKey={key}
                      name={key.replace('_', ' ')}
                      fill={getColor(key)}
                      radius={[8, 8, 0, 0]}
                      opacity={0.7}
                    />
                  );
                }
              })}
            </ComposedChart>
          </ResponsiveContainer>
        );

      case 'waterfall':
        const waterfallData = chartData as any[];
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={waterfallData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 12, fontWeight: 600 }}
                stroke="#6B7280"
              />
              <YAxis
                tick={{ fontSize: 12, fontWeight: 600 }}
                stroke="#6B7280"
                tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="start" stackId="a" fill="transparent" />
              <Bar dataKey="displayValue" stackId="a" radius={[8, 8, 8, 8]}>
                {waterfallData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        );

      case 'heatmap':
        const heatmapData = chartData as { metrics: string[]; monthsData: any[] };
        return (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="p-3 text-left font-black text-xs text-gray-900 border-b-2 border-gray-200">
                    Mês
                  </th>
                  {heatmapData.metrics.map((metric) => (
                    <th
                      key={metric}
                      className="p-3 text-center font-black text-xs text-gray-900 border-b-2 border-gray-200"
                    >
                      {metric}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {heatmapData.monthsData.map((row, rowIdx) => (
                  <tr key={rowIdx}>
                    <td className="p-3 font-bold text-xs text-gray-700 border-b border-gray-100">
                      {row.month}
                    </td>
                    {heatmapData.metrics.map((metric) => {
                      const score = row.scores[metric] || 0;
                      const bgColor =
                        score >= 70
                          ? 'bg-emerald-100 text-emerald-800'
                          : score >= 40
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800';
                      return (
                        <td
                          key={metric}
                          className={`p-3 text-center font-bold text-xs border-b border-gray-100 ${bgColor}`}
                        >
                          {row[metric]}k
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      default:
        return <div className="text-gray-500 text-sm">Tipo de gráfico não suportado</div>;
    }
  };

  return (
    <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-6">
      <div className="mb-4">
        <h4 className="text-lg font-black text-gray-900">{config.title}</h4>
        <p className="text-xs font-medium text-gray-500 mt-1">{config.description}</p>
      </div>
      {renderChart()}
    </div>
  );
};

export default DynamicChartRenderer;
