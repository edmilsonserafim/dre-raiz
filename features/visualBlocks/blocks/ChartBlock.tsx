import React from 'react';
import ReactECharts from 'echarts-for-react';
import { ChartBlockProps } from '../types';
import { BlockContainer } from './BlockContainer';
import { Loader2 } from 'lucide-react';

/**
 * ChartBlock - Componente para renderizar gráficos usando ECharts
 */
export const ChartBlock: React.FC<ChartBlockProps> = ({
  title,
  subtitle,
  chartType,
  options,
  height = 400,
  loading = false,
  onChartReady,
  className
}) => {
  if (loading) {
    return (
      <BlockContainer title={title} subtitle={subtitle} className={className}>
        <div
          className="flex items-center justify-center"
          style={{ height: typeof height === 'number' ? `${height}px` : height }}
        >
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="animate-spin text-[#1B75BB]" size={32} />
            <p className="text-sm text-gray-500 font-medium">Carregando gráfico...</p>
          </div>
        </div>
      </BlockContainer>
    );
  }

  return (
    <BlockContainer title={title} subtitle={subtitle} className={className}>
      <ReactECharts
        option={options}
        style={{ height: typeof height === 'number' ? `${height}px` : height }}
        notMerge={true}
        lazyUpdate={true}
        onChartReady={onChartReady}
        opts={{ renderer: 'canvas' }}
      />
    </BlockContainer>
  );
};

/**
 * Hook helper para criar opções de gráfico de linha
 */
export const useLineChartOptions = (data: { name: string; value: number }[]) => {
  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross' }
    },
    xAxis: {
      type: 'category',
      data: data.map(d => d.name),
      axisLine: { lineStyle: { color: '#94a3b8' } }
    },
    yAxis: {
      type: 'value',
      axisLine: { lineStyle: { color: '#94a3b8' } }
    },
    series: [
      {
        data: data.map(d => d.value),
        type: 'line',
        smooth: true,
        lineStyle: { width: 3, color: '#1B75BB' },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(27, 117, 187, 0.3)' },
              { offset: 1, color: 'rgba(27, 117, 187, 0.0)' }
            ]
          }
        }
      }
    ],
    grid: { left: 60, right: 40, top: 40, bottom: 60 }
  };
};

/**
 * Hook helper para criar opções de gráfico de barras
 */
export const useBarChartOptions = (data: { name: string; value: number }[]) => {
  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' }
    },
    xAxis: {
      type: 'category',
      data: data.map(d => d.name),
      axisLine: { lineStyle: { color: '#94a3b8' } }
    },
    yAxis: {
      type: 'value',
      axisLine: { lineStyle: { color: '#94a3b8' } }
    },
    series: [
      {
        data: data.map(d => d.value),
        type: 'bar',
        itemStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: '#1B75BB' },
              { offset: 1, color: '#4AC8F4' }
            ]
          },
          borderRadius: [8, 8, 0, 0]
        }
      }
    ],
    grid: { left: 60, right: 40, top: 40, bottom: 60 }
  };
};
