import React, { useMemo, useState } from 'react';
import { Transaction } from '../types';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine, Area, AreaChart, ComposedChart } from 'recharts';
import { TrendingUp, Calendar, Target, Brain, AlertCircle, CheckCircle2, BarChart3, Activity, Zap, Info, ChevronDown, ChevronUp } from 'lucide-react';
import { filterTransactionsByPermissions } from '../services/permissionsService';

interface ForecastingViewProps {
  transactions: Transaction[];
  // ✅ RLS: Permissões do usuário
  allowedMarcas?: string[];
  allowedFiliais?: string[];
  allowedCategories?: string[];
}

type ForecastMethod = 'movingAverage' | 'linearTrend' | 'seasonal' | 'hybrid';

const ForecastingView: React.FC<ForecastingViewProps> = ({ transactions }) => {
  const [selectedMethod, setSelectedMethod] = useState<ForecastMethod>('hybrid');
  const [forecastMonths, setForecastMonths] = useState<number>(6);
  const [showConfidenceInterval, setShowConfidenceInterval] = useState<boolean>(true);
  const [selectedMetric, setSelectedMetric] = useState<'revenue' | 'ebitda' | 'margin'>('ebitda');

  // Alavancas de simulação
  const [revenueIncrease, setRevenueIncrease] = useState<number>(0);
  const [variableCostReduction, setVariableCostReduction] = useState<number>(0);
  const [fixedCostReduction, setFixedCostReduction] = useState<number>(0);
  const [sgaReduction, setSgaReduction] = useState<number>(0);

  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

  // 🔒 RLS: Filtrar transações por permissões do usuário
  const permissionFilteredTransactions = useMemo(() => {
    console.log('🔒 ForecastingView: Aplicando permissões RLS nas transações...');
    const filtered = filterTransactionsByPermissions(transactions);
    console.log(`🔒 ForecastingView: ${transactions.length} → ${filtered.length} transações após RLS`);
    return filtered;
  }, [transactions]);

  // Processar dados históricos reais
  const historicalData = useMemo(() => {
    const monthlyData = new Array(12).fill(0).map(() => ({
      revenue: 0,
      costs: 0,
      ebitda: 0,
      count: 0
    }));

    // Agregar transações do cenário "Real"
    permissionFilteredTransactions
      .filter(t => t.scenario === 'Real')
      .forEach(t => {
        const monthIdx = parseInt(t.date.substring(5, 7), 10) - 1;
        if (t.type === 'REVENUE') {
          monthlyData[monthIdx].revenue += t.amount;
        } else {
          monthlyData[monthIdx].costs += t.amount;
        }
        monthlyData[monthIdx].count++;
      });

    // Calcular EBITDA e margem
    return monthlyData.map((data, idx) => {
      const ebitda = data.revenue - data.costs;
      const margin = data.revenue > 0 ? (ebitda / data.revenue) * 100 : 0;
      return {
        month: months[idx],
        monthIdx: idx,
        revenue: data.revenue,
        costs: data.costs,
        ebitda,
        margin,
        hasData: data.count > 0
      };
    });
  }, [permissionFilteredTransactions]);

  // Identificar último mês com dados
  const lastDataMonth = useMemo(() => {
    for (let i = historicalData.length - 1; i >= 0; i--) {
      if (historicalData[i].hasData) return i;
    }
    return -1;
  }, [historicalData]);

  // Calcular previsões usando diferentes métodos
  const forecastData = useMemo(() => {
    if (lastDataMonth < 0) return [];

    const dataPoints = historicalData.slice(0, lastDataMonth + 1);
    const metric = selectedMetric === 'revenue' ? 'revenue' :
                   selectedMetric === 'margin' ? 'margin' : 'ebitda';

    // Método 1: Média Móvel (últimos 3 meses)
    const calculateMovingAverage = () => {
      const window = Math.min(3, dataPoints.length);
      const recentData = dataPoints.slice(-window);
      return recentData.reduce((sum, d) => sum + d[metric], 0) / window;
    };

    // Método 2: Tendência Linear
    const calculateLinearTrend = (monthsAhead: number) => {
      const n = dataPoints.length;
      const sumX = dataPoints.reduce((sum, _, idx) => sum + idx, 0);
      const sumY = dataPoints.reduce((sum, d) => sum + d[metric], 0);
      const sumXY = dataPoints.reduce((sum, d, idx) => sum + idx * d[metric], 0);
      const sumX2 = dataPoints.reduce((sum, _, idx) => sum + idx * idx, 0);

      const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
      const intercept = (sumY - slope * sumX) / n;

      return intercept + slope * (n + monthsAhead);
    };

    // Método 3: Análise de Sazonalidade
    const calculateSeasonal = (targetMonth: number) => {
      // Calcular índice de sazonalidade baseado em dados históricos
      const avgOverall = dataPoints.reduce((sum, d) => sum + d[metric], 0) / dataPoints.length;

      // Encontrar meses similares (mesmo mês em anos diferentes)
      const similarMonths = dataPoints.filter((_, idx) =>
        historicalData[idx].month === months[targetMonth % 12]
      );

      if (similarMonths.length > 0) {
        const avgSimilar = similarMonths.reduce((sum, d) => sum + d[metric], 0) / similarMonths.length;
        const seasonalIndex = avgOverall > 0 ? avgSimilar / avgOverall : 1;
        return avgOverall * seasonalIndex;
      }

      return avgOverall;
    };

    // Método 4: Híbrido (combina todos os métodos)
    const calculateHybrid = (monthsAhead: number, targetMonth: number) => {
      const ma = calculateMovingAverage();
      const lt = calculateLinearTrend(monthsAhead);
      const seasonal = calculateSeasonal(targetMonth);

      // Pesos: 30% MA, 40% LT, 30% Seasonal
      return ma * 0.3 + lt * 0.4 + seasonal * 0.3;
    };

    // Calcular desvio padrão para intervalo de confiança
    const stdDev = Math.sqrt(
      dataPoints.reduce((sum, d) => {
        const avg = dataPoints.reduce((s, d2) => s + d2[metric], 0) / dataPoints.length;
        return sum + Math.pow(d[metric] - avg, 2);
      }, 0) / dataPoints.length
    );

    // Gerar previsões
    const forecasts = [];
    for (let i = 1; i <= forecastMonths; i++) {
      const targetMonthIdx = (lastDataMonth + i) % 12;
      let forecast = 0;

      switch (selectedMethod) {
        case 'movingAverage':
          forecast = calculateMovingAverage();
          break;
        case 'linearTrend':
          forecast = calculateLinearTrend(i);
          break;
        case 'seasonal':
          forecast = calculateSeasonal(lastDataMonth + i);
          break;
        case 'hybrid':
          forecast = calculateHybrid(i, lastDataMonth + i);
          break;
      }

      // Aplicar simulações apenas para EBITDA
      if (selectedMetric === 'ebitda') {
        // Buscar dados base do mês projetado para aplicar ajustes
        const avgRevenue = dataPoints.reduce((sum, d) => sum + d.revenue, 0) / dataPoints.length;
        const avgCosts = dataPoints.reduce((sum, d) => sum + d.costs, 0) / dataPoints.length;

        // Estimar proporção de custos (aprox. 40% var, 35% fix, 25% sga)
        const varCostRatio = 0.4;
        const fixCostRatio = 0.35;
        const sgaRatio = 0.25;

        const estimatedRevenue = avgRevenue * (1 + revenueIncrease / 100);
        const estimatedVarCost = (avgCosts * varCostRatio) * (1 - variableCostReduction / 100);
        const estimatedFixCost = (avgCosts * fixCostRatio) * (1 - fixedCostReduction / 100);
        const estimatedSga = (avgCosts * sgaRatio) * (1 - sgaReduction / 100);

        forecast = estimatedRevenue - (estimatedVarCost + estimatedFixCost + estimatedSga);
      } else if (selectedMetric === 'revenue') {
        // Aplicar aumento de receita
        forecast = forecast * (1 + revenueIncrease / 100);
      }

      // Intervalo de confiança (95%)
      const confidenceMultiplier = 1.96;
      const upperBound = forecast + (confidenceMultiplier * stdDev);
      const lowerBound = Math.max(0, forecast - (confidenceMultiplier * stdDev));

      forecasts.push({
        month: months[targetMonthIdx],
        monthIdx: targetMonthIdx,
        forecast: Math.round(forecast),
        upperBound: Math.round(upperBound),
        lowerBound: Math.round(lowerBound),
        isForecast: true
      });
    }

    return forecasts;
  }, [historicalData, lastDataMonth, selectedMethod, forecastMonths, selectedMetric, revenueIncrease, variableCostReduction, fixedCostReduction, sgaReduction]);

  // Combinar dados históricos e previsões para o gráfico - LINHA ÚNICA CONECTADA
  const chartData = useMemo(() => {
    const metric = selectedMetric === 'revenue' ? 'revenue' :
                   selectedMetric === 'margin' ? 'margin' : 'ebitda';

    // Dados históricos
    const historicalChartData = historicalData.slice(0, lastDataMonth + 1).map((d, idx) => ({
      name: d.month,
      value: d[metric],
      upperBound: null,
      lowerBound: null,
      isReal: true,
      monthIndex: idx
    }));

    // Dados de previsão
    const forecastChartData = forecastData.map((f, idx) => ({
      name: f.month,
      value: f.forecast,
      upperBound: showConfidenceInterval ? f.upperBound : null,
      lowerBound: showConfidenceInterval ? f.lowerBound : null,
      isReal: false,
      monthIndex: lastDataMonth + 1 + idx
    }));

    // Combinar com conexão
    return [...historicalChartData, ...forecastChartData];
  }, [historicalData, forecastData, lastDataMonth, selectedMetric, showConfidenceInterval]);

  // Calcular métricas de acurácia (usando últimos 3 meses como teste)
  const accuracyMetrics = useMemo(() => {
    if (lastDataMonth < 3) return null;

    const metric = selectedMetric === 'revenue' ? 'revenue' :
                   selectedMetric === 'margin' ? 'margin' : 'ebitda';

    const testMonths = 3;
    const trainData = historicalData.slice(0, lastDataMonth - testMonths + 1);
    const testData = historicalData.slice(lastDataMonth - testMonths + 1, lastDataMonth + 1);

    // Calcular previsões para os meses de teste
    const predictions = testData.map((_, idx) => {
      const avgRecent = trainData.slice(-3).reduce((sum, d) => sum + d[metric], 0) / Math.min(3, trainData.length);
      return avgRecent;
    });

    // Calcular MAPE (Mean Absolute Percentage Error)
    const mape = testData.reduce((sum, d, idx) => {
      const actual = d[metric];
      const predicted = predictions[idx];
      return sum + (actual !== 0 ? Math.abs((actual - predicted) / actual) : 0);
    }, 0) / testData.length * 100;

    // Calcular RMSE (Root Mean Square Error)
    const rmse = Math.sqrt(
      testData.reduce((sum, d, idx) => {
        return sum + Math.pow(d[metric] - predictions[idx], 2);
      }, 0) / testData.length
    );

    return {
      mape: mape.toFixed(1),
      rmse: Math.round(rmse),
      accuracy: (100 - mape).toFixed(1)
    };
  }, [historicalData, lastDataMonth, selectedMetric]);

  // Calcular totais de EBITDA
  const ebitdaTotals = useMemo(() => {
    // EBITDA Orçado (do cenário "Orçado")
    const budgetTransactions = permissionFilteredTransactions.filter(t => t.scenario === 'Orçado');
    const budgetRevenue = budgetTransactions
      .filter(t => t.type === 'REVENUE')
      .reduce((sum, t) => sum + t.amount, 0);
    const budgetCosts = budgetTransactions
      .filter(t => t.type !== 'REVENUE')
      .reduce((sum, t) => sum + t.amount, 0);
    const budgetEbitda = budgetRevenue - budgetCosts;

    // EBITDA Previsto (soma das previsões)
    const forecastEbitda = forecastData.reduce((sum, f) => sum + f.forecast, 0);

    // EBITDA Real acumulado
    const realEbitda = historicalData
      .slice(0, lastDataMonth + 1)
      .reduce((sum, d) => sum + d.ebitda, 0);

    // Total projetado (Real + Forecast)
    const totalProjected = realEbitda + forecastEbitda;

    return {
      budget: budgetEbitda,
      forecast: totalProjected,
      real: realEbitda,
      forecastOnly: forecastEbitda,
      variance: totalProjected - budgetEbitda,
      variancePercent: budgetEbitda !== 0 ? ((totalProjected - budgetEbitda) / budgetEbitda) * 100 : 0
    };
  }, [permissionFilteredTransactions, forecastData, historicalData, lastDataMonth]);

  // Calcular insights e recomendações
  const insights = useMemo(() => {
    const metric = selectedMetric === 'revenue' ? 'revenue' :
                   selectedMetric === 'margin' ? 'margin' : 'ebitda';

    const recentData = historicalData.slice(Math.max(0, lastDataMonth - 2), lastDataMonth + 1);
    const avgRecent = recentData.reduce((sum, d) => sum + d[metric], 0) / recentData.length;
    const avgForecast = forecastData.reduce((sum, f) => sum + f.forecast, 0) / forecastData.length;

    const growth = avgRecent > 0 ? ((avgForecast - avgRecent) / avgRecent) * 100 : 0;

    const insights = [];

    if (growth > 5) {
      insights.push({
        type: 'positive',
        title: 'Tendência de Crescimento',
        description: `Previsão indica crescimento de ${growth.toFixed(1)}% nos próximos meses.`
      });
    } else if (growth < -5) {
      insights.push({
        type: 'warning',
        title: 'Tendência de Queda',
        description: `Previsão indica queda de ${Math.abs(growth).toFixed(1)}% nos próximos meses.`
      });
    } else {
      insights.push({
        type: 'neutral',
        title: 'Tendência Estável',
        description: 'Previsão indica manutenção dos níveis atuais.'
      });
    }

    // Análise de sazonalidade
    const hasSeasonality = historicalData.some((d, idx) => {
      if (idx === 0 || !d.hasData) return false;
      const prevMonth = historicalData[idx - 1];
      if (!prevMonth.hasData) return false;
      const variation = Math.abs((d[metric] - prevMonth[metric]) / prevMonth[metric]) * 100;
      return variation > 20;
    });

    if (hasSeasonality) {
      insights.push({
        type: 'info',
        title: 'Padrão Sazonal Detectado',
        description: 'Dados mostram variações sazonais significativas.'
      });
    }

    return insights;
  }, [historicalData, forecastData, lastDataMonth, selectedMetric]);

  const metricInfo = {
    revenue: { label: 'Receita', format: (v: number) => `R$ ${(v / 1000).toFixed(0)}k`, color: '#1B75BB' },
    ebitda: { label: 'EBITDA', format: (v: number) => `R$ ${(v / 1000).toFixed(0)}k`, color: '#7AC5BF' },
    margin: { label: 'Margem %', format: (v: number) => `${v.toFixed(1)}%`, color: '#F44C00' }
  };

  const currentMetric = metricInfo[selectedMetric];

  return (
    <div className="space-y-4 animate-in fade-in duration-500 pb-10">
      {/* Header Compacto */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-br from-[#1B75BB] to-[#4AC8F4] rounded-lg">
              <Brain size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-black text-gray-900">Forecasting Avançado</h2>
              <p className="text-xs text-gray-500 font-medium">
                Previsões baseadas em dados reais com múltiplos métodos estatísticos
              </p>
            </div>
          </div>
        </div>

        {/* Controles */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Métrica */}
          <div>
            <label className="text-[10px] font-bold text-gray-600 uppercase tracking-wide mb-1 block">
              Métrica
            </label>
            <select
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value as any)}
              className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs font-bold bg-white focus:border-[#1B75BB] focus:ring-1 focus:ring-[#1B75BB]/20 outline-none"
            >
              <option value="revenue">Receita</option>
              <option value="ebitda">EBITDA</option>
              <option value="margin">Margem %</option>
            </select>
          </div>

          {/* Método */}
          <div>
            <label className="text-[10px] font-bold text-gray-600 uppercase tracking-wide mb-1 block">
              Método de Previsão
            </label>
            <select
              value={selectedMethod}
              onChange={(e) => setSelectedMethod(e.target.value as ForecastMethod)}
              className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs font-bold bg-white focus:border-[#1B75BB] focus:ring-1 focus:ring-[#1B75BB]/20 outline-none"
            >
              <option value="hybrid">Híbrido</option>
              <option value="movingAverage">Média Móvel</option>
              <option value="linearTrend">Tendência Linear</option>
              <option value="seasonal">Sazonal</option>
            </select>
          </div>

          {/* Período */}
          <div>
            <label className="text-[10px] font-bold text-gray-600 uppercase tracking-wide mb-1 block">
              Meses a Prever
            </label>
            <select
              value={forecastMonths}
              onChange={(e) => setForecastMonths(Number(e.target.value))}
              className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs font-bold bg-white focus:border-[#1B75BB] focus:ring-1 focus:ring-[#1B75BB]/20 outline-none"
            >
              <option value="3">3 meses</option>
              <option value="6">6 meses</option>
              <option value="9">9 meses</option>
              <option value="12">12 meses</option>
            </select>
          </div>

          {/* Intervalo de Confiança */}
          <div>
            <label className="text-[10px] font-bold text-gray-600 uppercase tracking-wide mb-1 block">
              IC 95%
            </label>
            <button
              onClick={() => setShowConfidenceInterval(!showConfidenceInterval)}
              className={`w-full px-2 py-1.5 border-2 rounded-lg text-xs font-bold transition-all ${
                showConfidenceInterval
                  ? 'bg-[#1B75BB] text-white border-[#1B75BB]'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-[#1B75BB]'
              }`}
            >
              {showConfidenceInterval ? 'Ativado' : 'Desativado'}
            </button>
          </div>
        </div>
      </div>

      {/* Card de Comparação EBITDA */}
      <div className="bg-gradient-to-br from-[#1B75BB] to-[#4AC8F4] p-5 rounded-xl shadow-lg text-white">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-[10px] font-black text-white/70 uppercase tracking-wider mb-1">EBITDA Orçado (Anual)</p>
            <p className="text-3xl font-black mb-1">R$ {(ebitdaTotals.budget / 1000).toFixed(0)}k</p>
            <p className="text-xs text-white/80 font-medium">Meta estabelecida no orçamento</p>
          </div>

          <div className="w-px h-16 bg-white/20 mx-4"></div>

          <div className="flex-1">
            <p className="text-[10px] font-black text-white/70 uppercase tracking-wider mb-1">EBITDA Previsto (Real + Forecast)</p>
            <p className="text-3xl font-black mb-1">R$ {(ebitdaTotals.forecast / 1000).toFixed(0)}k</p>
            <p className="text-xs text-white/80 font-medium">
              Real: R$ {(ebitdaTotals.real / 1000).toFixed(0)}k + Prev: R$ {(ebitdaTotals.forecastOnly / 1000).toFixed(0)}k
            </p>
          </div>

          <div className="w-px h-16 bg-white/20 mx-4"></div>

          <div className="flex-1">
            <p className="text-[10px] font-black text-white/70 uppercase tracking-wider mb-1">Variação vs Orçado</p>
            <p className={`text-3xl font-black mb-1 ${ebitdaTotals.variance >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
              {ebitdaTotals.variance >= 0 ? '+' : ''}{(ebitdaTotals.variance / 1000).toFixed(0)}k
            </p>
            <p className={`text-xs font-bold ${ebitdaTotals.variance >= 0 ? 'text-emerald-200' : 'text-rose-200'}`}>
              {ebitdaTotals.variance >= 0 ? '↗' : '↘'} {ebitdaTotals.variancePercent.toFixed(1)}% vs orçamento
            </p>
          </div>
        </div>
      </div>

      {/* Simulação de Cenários */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Target size={16} className="text-[#F44C00]" />
            <h3 className="text-sm font-black text-gray-900">Simulador de Cenários</h3>
          </div>
          <button
            onClick={() => {
              setRevenueIncrease(0);
              setVariableCostReduction(0);
              setFixedCostReduction(0);
              setSgaReduction(0);
            }}
            className="px-3 py-1 text-[10px] font-bold text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-all"
          >
            Resetar
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Aumento de Receita */}
          <div className="p-3 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between mb-2">
              <label className="text-[10px] font-black text-blue-900 uppercase tracking-wide flex items-center gap-1">
                <TrendingUp size={12} />
                Receita
              </label>
              <span className="text-base font-black text-blue-600">{revenueIncrease}%</span>
            </div>
            <input
              type="range"
              min="-20"
              max="20"
              step="1"
              value={revenueIncrease}
              onChange={(e) => setRevenueIncrease(Number(e.target.value))}
              className="w-full h-1.5 bg-blue-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div className="flex justify-between text-[9px] font-bold text-blue-700 mt-1">
              <span>-20%</span>
              <span>+20%</span>
            </div>
          </div>

          {/* Redução de Custos Variáveis */}
          <div className="p-3 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-lg border border-emerald-200">
            <div className="flex items-center justify-between mb-2">
              <label className="text-[10px] font-black text-emerald-900 uppercase tracking-wide flex items-center gap-1">
                <Activity size={12} />
                Custos Var
              </label>
              <span className="text-base font-black text-emerald-600">-{variableCostReduction}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="30"
              step="1"
              value={variableCostReduction}
              onChange={(e) => setVariableCostReduction(Number(e.target.value))}
              className="w-full h-1.5 bg-emerald-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
            />
            <div className="flex justify-between text-[9px] font-bold text-emerald-700 mt-1">
              <span>0%</span>
              <span>-30%</span>
            </div>
          </div>

          {/* Redução de Custos Fixos */}
          <div className="p-3 bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg border border-amber-200">
            <div className="flex items-center justify-between mb-2">
              <label className="text-[10px] font-black text-amber-900 uppercase tracking-wide flex items-center gap-1">
                <Zap size={12} />
                Custos Fix
              </label>
              <span className="text-base font-black text-amber-600">-{fixedCostReduction}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="25"
              step="1"
              value={fixedCostReduction}
              onChange={(e) => setFixedCostReduction(Number(e.target.value))}
              className="w-full h-1.5 bg-amber-200 rounded-lg appearance-none cursor-pointer accent-amber-600"
            />
            <div className="flex justify-between text-[9px] font-bold text-amber-700 mt-1">
              <span>0%</span>
              <span>-25%</span>
            </div>
          </div>

          {/* Redução de SG&A */}
          <div className="p-3 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200">
            <div className="flex items-center justify-between mb-2">
              <label className="text-[10px] font-black text-purple-900 uppercase tracking-wide flex items-center gap-1">
                <BarChart3 size={12} />
                SG&A
              </label>
              <span className="text-base font-black text-purple-600">-{sgaReduction}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="25"
              step="1"
              value={sgaReduction}
              onChange={(e) => setSgaReduction(Number(e.target.value))}
              className="w-full h-1.5 bg-purple-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
            />
            <div className="flex justify-between text-[9px] font-bold text-purple-700 mt-1">
              <span>0%</span>
              <span>-25%</span>
            </div>
          </div>
        </div>

        {/* Resumo do Impacto - Compacto */}
        {(revenueIncrease !== 0 || variableCostReduction !== 0 || fixedCostReduction !== 0 || sgaReduction !== 0) && (
          <div className="mt-3 p-2 bg-gradient-to-r from-[#1B75BB] to-[#4AC8F4] rounded-lg text-white">
            <p className="text-[9px] font-black uppercase tracking-wide mb-1">Simulações Ativas:</p>
            <div className="flex flex-wrap gap-2 text-[10px]">
              {revenueIncrease !== 0 && (
                <span className="px-2 py-0.5 bg-white/20 rounded font-bold">
                  Receita: {revenueIncrease > 0 ? '+' : ''}{revenueIncrease}%
                </span>
              )}
              {variableCostReduction !== 0 && (
                <span className="px-2 py-0.5 bg-white/20 rounded font-bold">
                  Var: -{variableCostReduction}%
                </span>
              )}
              {fixedCostReduction !== 0 && (
                <span className="px-2 py-0.5 bg-white/20 rounded font-bold">
                  Fix: -{fixedCostReduction}%
                </span>
              )}
              {sgaReduction !== 0 && (
                <span className="px-2 py-0.5 bg-white/20 rounded font-bold">
                  SG&A: -{sgaReduction}%
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Métricas de Acurácia - Compacto */}
      {accuracyMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-3 rounded-lg border border-emerald-200">
            <div className="flex items-center gap-1.5 mb-1">
              <CheckCircle2 size={14} className="text-emerald-600" />
              <span className="text-[10px] font-bold text-emerald-900 uppercase tracking-wide">
                Acurácia
              </span>
            </div>
            <p className="text-2xl font-black text-emerald-600">{accuracyMetrics.accuracy}%</p>
            <p className="text-[9px] text-emerald-700 font-medium mt-0.5">
              Últimos 3 meses
            </p>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-3 rounded-lg border border-blue-200">
            <div className="flex items-center gap-1.5 mb-1">
              <Activity size={14} className="text-blue-600" />
              <span className="text-[10px] font-bold text-blue-900 uppercase tracking-wide">
                MAPE
              </span>
            </div>
            <p className="text-2xl font-black text-blue-600">{accuracyMetrics.mape}%</p>
            <p className="text-[9px] text-blue-700 font-medium mt-0.5">
              Erro % Médio
            </p>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-3 rounded-lg border border-purple-200">
            <div className="flex items-center gap-1.5 mb-1">
              <BarChart3 size={14} className="text-purple-600" />
              <span className="text-[10px] font-bold text-purple-900 uppercase tracking-wide">
                RMSE
              </span>
            </div>
            <p className="text-2xl font-black text-purple-600">
              {currentMetric.format(accuracyMetrics.rmse)}
            </p>
            <p className="text-[9px] text-purple-700 font-medium mt-0.5">
              Erro Quadrático
            </p>
          </div>
        </div>
      )}

      {/* Gráfico Principal - Compacto */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-black text-gray-900 flex items-center gap-2">
            <TrendingUp size={16} className="text-[#1B75BB]" />
            Previsão de {currentMetric.label}
          </h3>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-12 h-1 bg-gradient-to-r from-[#1B75BB] to-[#F44C00] rounded"></div>
              <span className="font-bold text-gray-600">Real → Previsão</span>
            </div>
            {showConfidenceInterval && (
              <div className="flex items-center gap-2">
                <div className="w-12 h-1 bg-gray-300 rounded"></div>
                <span className="font-bold text-gray-600">IC 95%</span>
              </div>
            )}
          </div>
        </div>

        <div className="h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData}>
              <defs>
                {/* Gradiente de cor de azul para laranja */}
                <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#1B75BB" />
                  <stop offset={`${((lastDataMonth + 1) / chartData.length) * 100}%`} stopColor="#1B75BB" />
                  <stop offset={`${((lastDataMonth + 1) / chartData.length) * 100}%`} stopColor="#F44C00" />
                  <stop offset="100%" stopColor="#F44C00" />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fontWeight: 'bold', fill: '#666' }}
                axisLine={{ stroke: '#e0e0e0' }}
              />
              <YAxis
                tick={{ fontSize: 11, fontWeight: 'bold', fill: '#666' }}
                axisLine={{ stroke: '#e0e0e0' }}
                tickFormatter={currentMetric.format}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '2px solid #e0e0e0',
                  borderRadius: '12px',
                  padding: '12px'
                }}
                formatter={(value: any) => [currentMetric.format(value), '']}
                labelStyle={{ fontWeight: 'bold', marginBottom: '8px' }}
              />

              {/* Área de confiança */}
              {showConfidenceInterval && (
                <>
                  <Area
                    type="monotone"
                    dataKey="upperBound"
                    stroke="none"
                    fill="#fecaca"
                    fillOpacity={0.2}
                    name="IC Superior"
                  />
                  <Area
                    type="monotone"
                    dataKey="lowerBound"
                    stroke="none"
                    fill="#fecaca"
                    fillOpacity={0.2}
                    name="IC Inferior"
                  />
                </>
              )}

              {/* Linha única conectada com gradiente de cor */}
              <Line
                type="monotone"
                dataKey="value"
                stroke="url(#lineGradient)"
                strokeWidth={4}
                dot={(props: any) => {
                  const { cx, cy, payload } = props;
                  const isTransition = payload.monthIndex === lastDataMonth;
                  return (
                    <circle
                      cx={cx}
                      cy={cy}
                      r={isTransition ? 7 : 5}
                      fill={payload.isReal ? '#1B75BB' : '#F44C00'}
                      stroke="white"
                      strokeWidth={2}
                    />
                  );
                }}
                name="Valor"
                connectNulls={false}
              />

              {/* Linha separadora */}
              {lastDataMonth >= 0 && (
                <ReferenceLine
                  x={months[lastDataMonth]}
                  stroke="#94a3b8"
                  strokeWidth={2}
                  strokeDasharray="3 3"
                  label={{
                    value: 'Último Dado Real',
                    position: 'top',
                    fill: '#94a3b8',
                    fontSize: 10,
                    fontWeight: 'bold'
                  }}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Insights e Recomendações - Compacto */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Insights */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-sm font-black text-gray-900 flex items-center gap-2 mb-3">
            <Zap size={16} className="text-[#F44C00]" />
            Insights Automáticos
          </h3>
          <div className="space-y-2">
            {insights.map((insight, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-lg border ${
                  insight.type === 'positive'
                    ? 'bg-emerald-50 border-emerald-200'
                    : insight.type === 'warning'
                    ? 'bg-amber-50 border-amber-200'
                    : 'bg-blue-50 border-blue-200'
                }`}
              >
                <div className="flex items-start gap-2">
                  {insight.type === 'positive' ? (
                    <CheckCircle2 size={16} className="text-emerald-600 flex-shrink-0 mt-0.5" />
                  ) : insight.type === 'warning' ? (
                    <AlertCircle size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
                  ) : (
                    <Info size={16} className="text-blue-600 flex-shrink-0 mt-0.5" />
                  )}
                  <div>
                    <h4 className="font-black text-xs text-gray-900 mb-0.5">{insight.title}</h4>
                    <p className="text-[10px] text-gray-600 font-medium">{insight.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tabela de Previsões - Compacto */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-sm font-black text-gray-900 flex items-center gap-2 mb-3">
            <Calendar size={16} className="text-[#1B75BB]" />
            Previsões Detalhadas
          </h3>
          <div className="space-y-1.5 max-h-[250px] overflow-y-auto">
            {forecastData.map((forecast, idx) => (
              <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <span className="font-black text-xs text-gray-900">{forecast.month}</span>
                <div className="text-right">
                  <p className="font-black text-xs text-[#F44C00]">
                    {currentMetric.format(forecast.forecast)}
                  </p>
                  {showConfidenceInterval && (
                    <p className="text-[9px] text-gray-500 font-medium">
                      {currentMetric.format(forecast.lowerBound)} - {currentMetric.format(forecast.upperBound)}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Informações sobre Métodos - Compacto */}
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-3 rounded-xl border border-gray-200">
        <h3 className="text-xs font-black text-gray-900 mb-2 flex items-center gap-1.5">
          <Info size={14} className="text-[#1B75BB]" />
          Sobre os Métodos de Previsão
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-[10px]">
          <div>
            <h4 className="font-black text-gray-900 mb-0.5">Híbrido</h4>
            <p className="text-gray-600 font-medium">
              Combina 3 métodos (30% MA + 40% LT + 30% Sazonal) para maior precisão.
            </p>
          </div>
          <div>
            <h4 className="font-black text-gray-900 mb-0.5">Média Móvel</h4>
            <p className="text-gray-600 font-medium">
              Média dos últimos 3 meses. Simples e estável.
            </p>
          </div>
          <div>
            <h4 className="font-black text-gray-900 mb-0.5">Tendência Linear</h4>
            <p className="text-gray-600 font-medium">
              Linha de tendência histórica. Identifica crescimento/queda.
            </p>
          </div>
          <div>
            <h4 className="font-black text-gray-900 mb-0.5">Análise Sazonal</h4>
            <p className="text-gray-600 font-medium">
              Identifica padrões repetitivos e aplica sazonalidade.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForecastingView;
