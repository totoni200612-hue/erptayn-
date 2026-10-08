import React, { useState } from 'react';
import { ProductionOrder } from '../../types/erp';
import { formatMinutes } from '../../utils/formatters';
import { TrendingUp, Clock, Award, Filter } from 'lucide-react';

interface ProductionEfficiencyChartProps {
  productionOrders: ProductionOrder[];
}

export const ProductionEfficiencyChart: React.FC<ProductionEfficiencyChartProps> = ({
  productionOrders,
}) => {
  const [selectedOPId, setSelectedOPId] = useState<string | null>(null);

  // Orders that have stages with planned time
  const ordersWithMetrics = productionOrders.slice(0, 8);

  const selectedOP = ordersWithMetrics.find((o) => o.id === selectedOPId) || ordersWithMetrics[0];

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-600" />
            <h3 className="text-base font-bold text-slate-900">
              Gráfico de Eficiência: Tempo Planejado vs. Tempo Real
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Avalie o desvio de tempo de processo por lote produzido e a aderência das fichas técnicas
          </p>
        </div>

        {selectedOP && (
          <div className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-lg">
            Selecionada: {selectedOP.orderNumber} ({selectedOP.productName})
          </div>
        )}
      </div>

      {/* Interactive Bar Chart Comparing Planned vs Actual */}
      <div className="space-y-3">
        {ordersWithMetrics.map((op) => {
          const plannedMins = op.stages.reduce((sum, s) => sum + (s.plannedMinutes || 0), 0);
          const actualMins = op.actualTotalMinutes || (op.status === 'CONCLUIDA' ? plannedMins : 0);
          const isSelected = selectedOP?.id === op.id;

          const maxScale = Math.max(plannedMins, actualMins, 120);
          const plannedPercent = Math.min(100, Math.round((plannedMins / maxScale) * 100));
          const actualPercent = Math.min(100, Math.round((actualMins / maxScale) * 100));

          const efficiencyPercent =
            actualMins > 0 ? Math.round((plannedMins / actualMins) * 100) : 100;

          return (
            <div
              key={op.id}
              onClick={() => setSelectedOPId(op.id)}
              className={`p-3 rounded-lg border transition-all cursor-pointer ${
                isSelected
                  ? 'border-emerald-400 bg-emerald-50/30 shadow-xs'
                  : 'border-slate-100 bg-slate-50/60 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between text-xs mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                    {op.orderNumber}
                  </span>
                  <span className="font-semibold text-slate-800 truncate max-w-[200px]">
                    {op.productName}
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">({op.quantityPlanned} un)</span>
                </div>

                <div className="flex items-center gap-4">
                  <span className="text-slate-500">
                    Planejado: <strong className="text-slate-800 font-mono">{formatMinutes(plannedMins)}</strong>
                  </span>
                  {actualMins > 0 ? (
                    <span className="text-slate-500">
                      Real: <strong className="text-emerald-700 font-mono">{formatMinutes(actualMins)}</strong>
                    </span>
                  ) : (
                    <span className="text-slate-400 italic">Em andamento</span>
                  )}
                  {actualMins > 0 && (
                    <span
                      className={`font-mono font-bold text-xs px-2 py-0.5 rounded ${
                        efficiencyPercent >= 100
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {efficiencyPercent}% Efic.
                    </span>
                  )}
                </div>
              </div>

              {/* Dual Visual Bar */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-400 w-16 text-right">Planejado:</span>
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-blue-600 h-full rounded-full transition-all duration-300"
                      style={{ width: `${plannedPercent}%` }}
                    />
                  </div>
                </div>

                {actualMins > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-400 w-16 text-right">Real Gasto:</span>
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-600 h-full rounded-full transition-all duration-300"
                        style={{ width: `${actualPercent}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected OP Breakdown Detail */}
      {selectedOP && (
        <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-2 text-xs">
          <div className="font-bold text-slate-900 flex items-center justify-between">
            <span>Detalhamento por Etapa da {selectedOP.orderNumber}:</span>
            <span className="font-mono text-slate-500">Lote: {selectedOP.quantityPlanned} un</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-1">
            {selectedOP.stages.map((st, idx) => (
              <div key={idx} className="p-2.5 bg-white rounded border border-slate-200 space-y-1">
                <div className="font-semibold text-slate-800">{st.name}</div>
                <div className="text-[11px] text-slate-500">{st.workCenterName}</div>
                <div className="flex justify-between items-center pt-1 font-mono text-[11px]">
                  <span className="text-slate-400">Tempo:</span>
                  <span className="font-bold text-blue-700">{formatMinutes(st.plannedMinutes)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
