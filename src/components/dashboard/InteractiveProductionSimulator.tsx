import React, { useState } from 'react';
import {
  Sparkles,
  Sliders,
  Boxes,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Factory,
  ArrowRight,
  TrendingUp,
  DollarSign,
} from 'lucide-react';
import { Product, RawMaterial, WorkCenter } from '../../types/erp';
import { formatCurrency, formatMinutes } from '../../utils/formatters';

interface InteractiveProductionSimulatorProps {
  products: Product[];
  rawMaterials: RawMaterial[];
  workCenters: WorkCenter[];
  onConvertSimulationToOP: (productId: string, quantity: number, daysDeadline: number) => void;
}

export const InteractiveProductionSimulator: React.FC<InteractiveProductionSimulatorProps> = ({
  products,
  rawMaterials,
  workCenters,
  onConvertSimulationToOP,
}) => {
  const [selectedProductId, setSelectedProductId] = useState<string>(products[0]?.id || '');
  const [batchQuantity, setBatchQuantity] = useState<number>(10);
  const [targetDays, setTargetDays] = useState<number>(7);

  const product = products.find((p) => p.id === selectedProductId) || products[0];

  if (!product) return null;

  // Real-time calculation of material requirements
  const simulatedMaterials = (product.bom || []).map((b) => {
    const mat = rawMaterials.find((m) => m.id === b.rawMaterialId);
    const scrapFactor = 1 + (Number(b.scrapPercentage) || 0) / 100;
    const requiredQty = Math.round(b.quantityPerUnit * batchQuantity * scrapFactor * 100) / 100;
    const currentStock = mat ? mat.currentStock : 0;
    const isSufficient = currentStock >= requiredQty;
    const missingQty = isSufficient ? 0 : Math.round((requiredQty - currentStock) * 100) / 100;
    const missingCost = missingQty * (b.unitCost || 0);

    return {
      ...b,
      requiredQty,
      currentStock,
      isSufficient,
      missingQty,
      missingCost,
    };
  });

  const totalMissingCost = simulatedMaterials.reduce((sum, m) => sum + m.missingCost, 0);
  const allMaterialsAvailable = simulatedMaterials.every((m) => m.isSufficient);

  // Real-time workload per work center for this batch
  const stageWorkloads = (product.processStages || []).map((stage) => {
    const totalMinutes = (stage.timeMinutes || 0) * batchQuantity;
    const wc = workCenters.find((w) => w.id === stage.workCenterId);
    const dailyCapacity = wc ? wc.effectiveDailyMinutes : 480;
    const daysRequired = Math.round((totalMinutes / dailyCapacity) * 10) / 10;

    return {
      stageName: stage.name,
      workCenterName: stage.workCenterName,
      totalMinutes,
      daysRequired,
      isBottleneck: daysRequired > targetDays,
    };
  });

  const totalBatchMinutes = stageWorkloads.reduce((sum, s) => sum + s.totalMinutes, 0);
  const estimatedRevenue = (product.suggestedSalePrice || 0) * batchQuantity;
  const estimatedBOMCost = (product.calculatedMaterialCost || 0) * batchQuantity;
  const estimatedGrossProfit = estimatedRevenue - estimatedBOMCost;

  return (
    <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-xl shadow-lg p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-700/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400">
              <Sliders className="w-5 h-5" />
            </span>
            <h3 className="text-base font-bold text-white">
              Simulador Interativo de Planejamento de Lotes (PCP)
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Ajuste os parâmetros do lote em tempo real e teste a viabilidade de estoque, capacidade e gargalos
          </p>
        </div>

        <button
          onClick={() => onConvertSimulationToOP(product.id, batchQuantity, targetDays)}
          className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors shadow-sm flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Factory className="w-4 h-4" />
          Converter em OP Oficial &rarr;
        </button>
      </div>

      {/* Interactive Controls Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
        {/* Product selector */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            1. Selecione o Produto
          </label>
          <select
            value={selectedProductId}
            onChange={(e) => setSelectedProductId(e.target.value)}
            className="w-full text-xs bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white outline-none focus:border-blue-500"
          >
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.code} - {p.name}
              </option>
            ))}
          </select>
        </div>

        {/* Batch Quantity Slider */}
        <div>
          <div className="flex items-center justify-between text-xs font-semibold text-slate-300 mb-1.5">
            <span>2. Tamanho do Lote a Produzir:</span>
            <span className="font-mono text-base text-blue-400 font-bold tabular-nums">
              {batchQuantity} unidades
            </span>
          </div>
          <input
            type="range"
            min="1"
            max="50"
            value={batchQuantity}
            onChange={(e) => setBatchQuantity(parseInt(e.target.value, 10))}
            className="w-full accent-blue-500 cursor-pointer h-2 bg-slate-700 rounded-lg"
          />
          <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
            <span>1 un</span>
            <span>25 un</span>
            <span>50 un</span>
          </div>
        </div>

        {/* Target Deadline Days Slider */}
        <div>
          <div className="flex items-center justify-between text-xs font-semibold text-slate-300 mb-1.5">
            <span>3. Meta de Prazo de Entrega:</span>
            <span className="font-mono text-base text-emerald-400 font-bold tabular-nums">
              {targetDays} dias úteis
            </span>
          </div>
          <input
            type="range"
            min="2"
            max="30"
            value={targetDays}
            onChange={(e) => setTargetDays(parseInt(e.target.value, 10))}
            className="w-full accent-emerald-500 cursor-pointer h-2 bg-slate-700 rounded-lg"
          />
          <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
            <span>2 dias</span>
            <span>15 dias</span>
            <span>30 dias</span>
          </div>
        </div>
      </div>

      {/* Dynamic Results Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Col 1: Material Availability Status */}
        <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-700/80 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-700 pb-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-white">
              <Boxes className="w-4 h-4 text-blue-400" />
              <span>Viabilidade de Matérias-Primas</span>
            </div>
            {allMaterialsAvailable ? (
              <span className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Estoque 100% OK
              </span>
            ) : (
              <span className="text-[11px] font-semibold text-rose-400 flex items-center gap-1 bg-rose-950/60 px-2 py-0.5 rounded border border-rose-800">
                <AlertTriangle className="w-3.5 h-3.5" />
                Falta Estoque
              </span>
            )}
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {simulatedMaterials.map((mat) => (
              <div
                key={mat.rawMaterialId}
                className="p-2 rounded-lg bg-slate-900/60 border border-slate-800 text-xs flex items-center justify-between"
              >
                <div>
                  <div className="font-medium text-slate-200 truncate max-w-[170px]">
                    {mat.rawMaterialName}
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono">
                    Necessário: {mat.requiredQty} {mat.unit} · Estoque: {mat.currentStock}
                  </div>
                </div>

                <div className="text-right">
                  {mat.isSufficient ? (
                    <span className="text-emerald-400 font-mono text-[11px] font-bold">
                      Disponível
                    </span>
                  ) : (
                    <div>
                      <span className="text-rose-400 font-mono text-[11px] font-bold block">
                        Falta {mat.missingQty} {mat.unit}
                      </span>
                      <span className="text-slate-400 text-[10px] font-mono">
                        ~{formatCurrency(mat.missingCost)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {!allMaterialsAvailable && (
            <div className="p-2.5 rounded-lg bg-rose-900/20 border border-rose-800/60 text-xs text-rose-300 flex items-center justify-between">
              <span>Custo est. para compra do déficit:</span>
              <span className="font-mono font-bold text-rose-400">
                {formatCurrency(totalMissingCost)}
              </span>
            </div>
          )}
        </div>

        {/* Col 2: Workload Breakdown & Bottlenecks */}
        <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-700/80 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-700 pb-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-white">
              <Clock className="w-4 h-4 text-emerald-400" />
              <span>Carga por Posto Fabril</span>
            </div>
            <span className="text-xs font-mono font-bold text-slate-300">
              Total: {formatMinutes(totalBatchMinutes)}
            </span>
          </div>

          <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
            {stageWorkloads.map((st, idx) => (
              <div key={idx} className="space-y-1 text-xs">
                <div className="flex justify-between text-slate-300">
                  <span className="truncate max-w-[180px]">{st.stageName}</span>
                  <span className="font-mono text-emerald-300 font-bold">
                    {formatMinutes(st.totalMinutes)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        st.isBottleneck ? 'bg-rose-500' : 'bg-emerald-500'
                      }`}
                      style={{
                        width: `${Math.min(
                          100,
                          Math.max(10, Math.round((st.totalMinutes / totalBatchMinutes) * 100))
                        )}%`,
                      }}
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                    {st.daysRequired}d
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-700/60 flex items-center justify-between">
            <span>Ritmo diário necessário:</span>
            <span className="font-mono font-bold text-slate-200">
              ~{Math.round(totalBatchMinutes / targetDays)} min/dia
            </span>
          </div>
        </div>

        {/* Col 3: Economic Viability Summary */}
        <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-700/80 flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-white border-b border-slate-700 pb-2">
              <DollarSign className="w-4 h-4 text-amber-400" />
              <span>Balanço Financeiro do Lote ({batchQuantity} un)</span>
            </div>

            <div className="space-y-2.5 pt-3 text-xs">
              <div className="flex justify-between items-center text-slate-300">
                <span>Faturamento Projetado:</span>
                <span className="font-mono font-bold text-white">
                  {formatCurrency(estimatedRevenue)}
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-300">
                <span>Custo de Insumos (BOM):</span>
                <span className="font-mono text-slate-400">
                  - {formatCurrency(estimatedBOMCost)}
                </span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-slate-700 font-semibold">
                <span className="text-emerald-300">Margem Bruta Projetada:</span>
                <span className="font-mono font-bold text-emerald-400 text-sm">
                  {formatCurrency(estimatedGrossProfit)}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() => onConvertSimulationToOP(product.id, batchQuantity, targetDays)}
            className="w-full py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors shadow-md flex items-center justify-center gap-1.5"
          >
            <span>Gerar OP deste Lote</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
