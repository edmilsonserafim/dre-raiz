import React from 'react';
import { KpiGridBlockProps, KpiItem } from '../types';
import { BlockContainer } from './BlockContainer';
import { ArrowUpRight, ArrowDownRight, ArrowRight } from 'lucide-react';

/**
 * KpiGridBlock - Grid de KPIs com suporte a trends e formatação
 */
export const KpiGridBlock: React.FC<KpiGridBlockProps> = ({
  title,
  subtitle,
  items,
  columns = 4,
  variant = 'default',
  className
}) => {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
    5: 'grid-cols-1 md:grid-cols-3 lg:grid-cols-5',
    6: 'grid-cols-1 md:grid-cols-3 lg:grid-cols-6'
  };

  return (
    <BlockContainer title={title} subtitle={subtitle} className={className}>
      <div className={`grid ${gridCols[columns]} gap-4`}>
        {items.map((item) => (
          <KpiCard key={item.id} item={item} variant={variant} />
        ))}
      </div>
    </BlockContainer>
  );
};

/**
 * KpiCard - Card individual de KPI
 */
const KpiCard: React.FC<{ item: KpiItem; variant: 'default' | 'compact' | 'detailed' }> = ({
  item,
  variant
}) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-[#1B75BB] border-blue-100',
    green: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    red: 'bg-red-50 text-red-600 border-red-100',
    yellow: 'bg-amber-50 text-amber-600 border-amber-100',
    purple: 'bg-purple-50 text-purple-600 border-purple-100',
    gray: 'bg-gray-50 text-gray-600 border-gray-100'
  };

  const formatValue = (value: string | number, format?: KpiItem['format']) => {
    if (typeof value === 'string') return value;

    switch (format) {
      case 'currency':
        return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      case 'percent':
        return `${value.toFixed(1)}%`;
      case 'number':
        return value.toLocaleString('pt-BR');
      default:
        return value;
    }
  };

  const TrendIcon = item.trend
    ? item.trend.direction === 'up'
      ? ArrowUpRight
      : item.trend.direction === 'down'
      ? ArrowDownRight
      : ArrowRight
    : null;

  const trendColor = item.trend
    ? item.trend.isPositive
      ? 'text-emerald-600'
      : 'text-red-600'
    : 'text-gray-400';

  if (variant === 'compact') {
    return (
      <div className="bg-white p-3 rounded-lg border border-gray-100 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
            {item.label}
          </span>
          {item.icon && (
            <div className={`p-1 rounded ${colorClasses[item.color || 'gray']}`}>
              {item.icon}
            </div>
          )}
        </div>
        <p className="text-2xl font-black text-gray-900">
          {formatValue(item.value, item.format)}
        </p>
        {item.trend && TrendIcon && (
          <div className={`flex items-center gap-1 mt-1 text-xs font-bold ${trendColor}`}>
            <TrendIcon size={12} />
            {Math.abs(item.trend.value).toFixed(1)}%
          </div>
        )}
      </div>
    );
  }

  if (variant === 'detailed') {
    return (
      <div className="bg-white p-5 rounded-xl border border-gray-100 hover:shadow-lg transition-shadow">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <span className="text-xs font-black text-gray-400 uppercase tracking-widest block mb-1">
              {item.label}
            </span>
            {item.subtitle && (
              <span className="text-xs text-gray-500 font-medium">{item.subtitle}</span>
            )}
          </div>
          {item.icon && (
            <div className={`p-2 rounded-lg ${colorClasses[item.color || 'gray']}`}>
              {item.icon}
            </div>
          )}
        </div>
        <p className="text-3xl font-black text-gray-900 mb-2">
          {formatValue(item.value, item.format)}
        </p>
        {item.trend && TrendIcon && (
          <div className={`flex items-center gap-1.5 text-sm font-bold ${trendColor}`}>
            <TrendIcon size={16} />
            <span>{Math.abs(item.trend.value).toFixed(1)}%</span>
            <span className="text-xs text-gray-400 ml-1">vs anterior</span>
          </div>
        )}
      </div>
    );
  }

  // Default variant
  return (
    <div className="bg-white p-4 rounded-xl border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
          {item.label}
        </span>
        {item.icon && (
          <div className={`p-1.5 rounded-lg ${colorClasses[item.color || 'gray']}`}>
            {item.icon}
          </div>
        )}
      </div>
      <p className="text-2xl font-black text-gray-900 mb-1">
        {formatValue(item.value, item.format)}
      </p>
      {item.subtitle && (
        <p className="text-xs text-gray-500 font-medium mb-2">{item.subtitle}</p>
      )}
      {item.trend && TrendIcon && (
        <div className={`flex items-center gap-1 text-xs font-bold ${trendColor}`}>
          <TrendIcon size={14} />
          {Math.abs(item.trend.value).toFixed(1)}%
        </div>
      )}
    </div>
  );
};
