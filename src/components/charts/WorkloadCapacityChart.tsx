import React, { useState } from 'react';
import { ProductionOrder, WorkCenter } from '../../types/erp';
import { formatMinutes } from '../../utils/formatters';
import { BarChart3, Info, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface WorkloadCapacityChartProps {
  workCenters: WorkCenter[];
  productionOrders: ProductionOrder[];
}

export const WorkloadCapacityChart: React.FC<WorkloadCapacityChartProps> = ({
  workCenters,
  productionOrders,
}) => {
  const [timeframe, setTimeframe] = useState<'daily' | 'weekly'>('weekly');
  const [hoveredCenterId, setHoveredCenterId] = useState<string | null>(null);

  // Active / open orders
  const openOrders = productionOrders.filter(
    (op) => op.status !== 'CONCLUIDA' && op.status !== 'CANCELADA'
  );

  // Calculate allocated minutes per center and collect which OPs are running on it
  const centerData = workCenters.map((wc) => {
    let allocatedMinutes = 0;
    const relatedOPs: { orderNumber: string; productName: string; minutes: number }[] = [];

    for (const op of openOrders) {
      for (const stage of op.stages) {
        if (stage.workCenterId === wc.id && stage.status !== 'CONCLUIDO') {
          const mins = stage.plannedMinutes || 0;
          allocatedMinutes += mins;
          relatedOPs.push({
            orderNumber: op.orderNumber,
            productName: op.productName,
            minutes: mins,
          });
        }
      }
    }

    const availableMinutes =
      timeframe === 'daily'
        ? wc.effectiveDailyMinutes || 1
        : (wc.effectiveDailyMinutes || 1) * (wc.workDaysPerWeek || 5);

    const occupancyRate = Math.round((allocatedMinutes / availableMinutes) * 100);

    return {
      wc,
      allocatedMinutes,
      availableMinutes,
      occupancyRate,
      relatedOPs,
    };
  });

  const hoveredData = centerData.find((d) => d.wc.id === hoveredCenterId);

  // Max scale calculation for bar rendering
  const maxMinutes = Math.max(
    ...centerData.map((d) => Math.max(d.allocatedMinutes, d.availableMinutes)),
    600
  );

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-5">
      {/* Chart Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            <h3 className="text-base font-bold text-slate-900">
              Gráfico Interativo de Carga vs. Capacidade Fabril
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Compare as horas disponíveis da fábrica com a demanda alocada pelas OPs em andamento
          </p>
        </div>

        {/* Interactive Controls */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium">Período:</span>
          <div className="inline-flex bg-slate-100 p-1 rounded-lg text-xs font-semibold">
            <button
              onClick={() => setTimeframe('daily')}
              className={`px-3 py-1 rounded transition-colors ${
                timeframe === 'daily' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Visão Diária
            </button>
            <button
              onClick={() => setTimeframe('weekly')}
              className={`px-3 py-1 rounded transition-colors ${
                timeframe === 'weekly' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Visão Semanal
            </button>
          </div>
        </div>
      </div>

      {/* Legend & Summary */}
      <div className="flex flex-wrap items-center justify-between text-xs gap-3">
        <div className="flex items-center gap-4 text-slate-600">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-xs bg-slate-200 border border-slate-300" />
            <span>Capacidade Efetiva Disponível</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-xs bg-blue-600" />
            <span>Carga Atual Alocada (&le; 85%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-xs bg-amber-500" />
            <span>Atenção (86% - 100%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-xs bg-rose-600" />
            <span>Sobrecarga / Gargalo (&gt; 100%)</span>
          </div>
        </div>

        <div className="text-[11px] text-slate-400 italic">
          * Passe o mouse ou clique sobre as barras para inspecionar as OPs alocadas
        </div>
      </div>

      {/* Interactive Bar Chart Graphic */}
      <div className="space-y-4 pt-2">
        {centerData.map(({ wc, allocatedMinutes, availableMinutes, occupancyRate }) => {
          const isHovered = hoveredCenterId === wc.id;
          const allocatedWidth = Math.min(100, Math.round((allocatedMinutes / maxMinutes) * 100));
          const availableWidth = Math.min(100, Math.round((availableMinutes / maxMinutes) * 100));

          let barColor = 'bg-blue-600';
          let textColor = 'text-blue-700';
          if (occupancyRate > 100) {
            barColor = 'bg-rose-600';
            textColor = 'text-rose-700';
          } else if (occupancyRate > 85) {
            barColor = 'bg-amber-500';
            textColor = 'text-amber-700';
          }

          return (
            <div
              key={wc.id}
              onMouseEnter={() => setHoveredCenterId(wc.id)}
              onMouseLeave={() => setHoveredCenterId(null)}
              onClick={() => setHoveredCenterId(hoveredCenterId === wc.id ? null : wc.id)}
              className={`p-3 rounded-lg border transition-all cursor-pointer ${
                isHovered
                  ? 'border-blue-400 bg-blue-50/40 shadow-xs'
                  : 'border-slate-100 bg-slate-50/50 hover:bg-slate-50'
              }`}
            >
              {/* Row Label */}
              <div className="flex items-center justify-between text-xs mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-slate-800 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                    {wc.code}
                  </span>
                  <span className="font-semibold text-slate-900">{wc.name}</span>
                  <span className="text-slate-400 text-[11px]">
                    ({wc.operatorsCount} op · {wc.efficiencyRate}% efic.)
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-slate-500">
                    Carga: <strong className="text-slate-800 font-mono">{formatMinutes(allocatedMinutes)}</strong> /{' '}
                    <span className="font-mono">{formatMinutes(availableMinutes)}</span>
                  </span>
                  <span
                    className={`font-mono font-bold px-2 py-0.5 rounded text-xs ${
                      occupancyRate > 100
                        ? 'bg-rose-100 text-rose-800'
                        : occupancyRate > 85
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {occupancyRate}%
                  </span>
                </div>
              </div>

              {/* Comparative Dual Bar */}
              <div className="space-y-1">
                {/* Available Capacity (Reference Track) */}
                <div className="relative w-full bg-slate-200/80 h-3 rounded-full overflow-hidden">
                  {/* Capacity Cap Marker */}
                  <div
                    className="bg-slate-300 h-full rounded-full"
                    style={{ width: `${availableWidth}%` }}
                    title={`Capacidade total: ${formatMinutes(availableMinutes)}`}
                  />
                  {/* Active Allocated Load */}
                  <div
                    className={`absolute top-0 left-0 h-full rounded-full transition-all duration-300 ${barColor}`}
                    style={{ width: `${allocatedWidth}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Interactive Tooltip Inspector Panel */}
      {hoveredData && (
        <div className="p-4 rounded-lg bg-slate-900 text-white text-xs animate-in fade-in duration-150 space-y-2">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-blue-400">
                {hoveredData.wc.code} - {hoveredData.wc.name}
              </span>
              <span className="text-slate-400">|</span>
              <span className="text-slate-300">
                Ocupação: <strong className="text-white">{hoveredData.occupancyRate}%</strong>
              </span>
            </div>

            {hoveredData.occupancyRate > 100 ? (
              <span className="text-rose-400 font-semibold flex items-center gap-1 text-[11px]">
                <AlertTriangle className="w-3.5 h-3.5" />
                Gargalo identificado! Considere horas extras ou remanejamento.
              </span>
            ) : (
              <span className="text-emerald-400 font-semibold flex items-center gap-1 text-[11px]">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Capacidade regular
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div>
              <span className="text-slate-400 block text-[11px]">Ordens de Produção Ativas nesta Estação:</span>
              {hoveredData.relatedOPs.length === 0 ? (
                <div className="text-slate-500 italic mt-1">Nenhuma OP aguardando processamento neste centro.</div>
              ) : (
                <div className="space-y-1 mt-1 max-h-24 overflow-y-auto">
                  {hoveredData.relatedOPs.map((rop, idx) => (
                    <div key={idx} className="flex justify-between items-center text-[11px] text-slate-300">
                      <span>
                        <strong className="text-white font-mono">{rop.orderNumber}</strong> ({rop.productName})
                      </span>
                      <span className="font-mono text-blue-300">{formatMinutes(rop.minutes)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-1 border-t sm:border-t-0 sm:border-l border-slate-800 sm:pl-4">
              <span className="text-slate-400 block text-[11px]">Métricas do Centro:</span>
              <div className="text-[11px] text-slate-300">
                Operadores alocados: <strong className="text-white">{hoveredData.wc.operatorsCount}</strong>
              </div>
              <div className="text-[11px] text-slate-300">
                Jornada: <strong className="text-white">{hoveredData.wc.dailyHoursPerOperator}h/dia ({hoveredData.wc.workDaysPerWeek} dias/semana)</strong>
              </div>
              <div className="text-[11px] text-slate-300">
                Eficiência técnica: <strong className="text-emerald-400">{hoveredData.wc.efficiencyRate}%</strong>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
