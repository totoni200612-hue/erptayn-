import React, { useState } from 'react';
import {
  Factory,
  ShoppingCart,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Layers,
  ArrowRight,
  TrendingUp,
  BarChart3,
  Sliders,
} from 'lucide-react';
import { ERPDatabase, ProductionOrder, SaleOrder } from '../../types/erp';
import { formatCurrency, formatDate, formatMinutes } from '../../utils/formatters';
import { WorkloadCapacityChart } from '../charts/WorkloadCapacityChart';
import { InteractiveProductionSimulator } from './InteractiveProductionSimulator';

interface DashboardModuleProps {
  data: ERPDatabase;
  onNavigate: (module: any) => void;
  onNewOP: () => void;
  onNewOrder: () => void;
  onConvertSimulationToOP?: (productId: string, quantity: number, daysDeadline: number) => void;
}

export const DashboardModule: React.FC<DashboardModuleProps> = ({
  data,
  onNavigate,
  onNewOP,
  onNewOrder,
  onConvertSimulationToOP,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'simulator' | 'chart'>('overview');

  const activeOps = data.productionOrders.filter(
    (o) => o.status === 'EM_PROCESSO' || o.status === 'AGUARDANDO_INSUMOS' || o.status === 'CONTROLE_QUALIDADE'
  );
  const plannedOps = data.productionOrders.filter((o) => o.status === 'PLANEJADA');
  const completedOps = data.productionOrders.filter((o) => o.status === 'CONCLUIDA');
  const pendingOrders = data.saleOrders.filter((o) => o.status === 'PENDENTE' || o.status === 'EM_PRODUCAO');

  // Low stock raw materials
  const lowStockMaterials = data.rawMaterials.filter((m) => m.currentStock <= m.minStock);

  // Total daily effective minutes available in factory
  const totalDailyEffectiveMinutes = data.workCenters.reduce(
    (sum, wc) => sum + (wc.effectiveDailyMinutes || 0),
    0
  );

  // Total planned minutes in open OPs
  const totalOpenOPMinutes = activeOps.concat(plannedOps).reduce((sum, op) => {
    const stageMinutes = op.stages.reduce((s, st) => s + (st.plannedMinutes || 0), 0);
    return sum + stageMinutes;
  }, 0);

  const handleConvertSimulation = (productId: string, quantity: number, daysDeadline: number) => {
    if (onConvertSimulationToOP) {
      onConvertSimulationToOP(productId, quantity, daysDeadline);
    } else {
      onNavigate('producao');
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Top Welcome & Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Painel de Planejamento &amp; PCP
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Visão integrada da fábrica · Responsável Técnico:{' '}
            <span className="font-medium text-slate-700">
              {data.settings.technicalResponsible.name}
            </span>{' '}
            ({data.settings.technicalResponsible.registration})
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onNewOrder}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
          >
            + Novo Pedido
          </button>
          <button
            onClick={onNewOP}
            className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm flex items-center gap-1.5"
          >
            <Factory className="w-4 h-4" />
            + Emitir Ordem de Produção
          </button>
        </div>
      </div>

      {/* Interactive Tabs Header */}
      <div className="flex border-b border-slate-200 gap-4">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'overview'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          Visão Geral &amp; Indicadores
        </button>
        <button
          onClick={() => setActiveTab('chart')}
          className={`pb-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'chart'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          Gráfico Interativo de Carga Fabril
        </button>
        <button
          onClick={() => setActiveTab('simulator')}
          className={`pb-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'simulator'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Sliders className="w-4 h-4" />
          Simulador Interativo de Produção (PCP)
        </button>
      </div>

      {/* KPI Stat Cards (Always visible for quick glance) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: OPs Ativas */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">OPs em Andamento</span>
            <Factory className="w-4 h-4 text-blue-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900 tabular-nums">
              {activeOps.length}
            </span>
            <span className="text-xs text-slate-500">
              +{plannedOps.length} planejadas
            </span>
          </div>
          <button
            onClick={() => onNavigate('producao')}
            className="mt-4 text-xs font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors"
          >
            Ver produção <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Card 2: Pedidos em Carteira */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Pedidos Ativos</span>
            <ShoppingCart className="w-4 h-4 text-amber-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900 tabular-nums">
              {pendingOrders.length}
            </span>
            <span className="text-xs text-slate-500">
              {formatCurrency(pendingOrders.reduce((sum, o) => sum + o.totalAmount, 0))}
            </span>
          </div>
          <button
            onClick={() => onNavigate('pedidos')}
            className="mt-4 text-xs font-medium text-amber-600 hover:text-amber-800 flex items-center gap-1 transition-colors"
          >
            Ver pedidos <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Card 3: Alertas de Matéria-Prima */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Estoque Crítico</span>
            <AlertTriangle className={`w-4 h-4 ${lowStockMaterials.length > 0 ? 'text-rose-600' : 'text-slate-400'}`} />
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`text-3xl font-bold tabular-nums ${lowStockMaterials.length > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
              {lowStockMaterials.length}
            </span>
            <span className="text-xs text-slate-500">
              {lowStockMaterials.length > 0 ? 'itens abaixo do mínimo' : 'estoque regular'}
            </span>
          </div>
          <button
            onClick={() => onNavigate('materia-prima')}
            className="mt-4 text-xs font-medium text-rose-600 hover:text-rose-800 flex items-center gap-1 transition-colors"
          >
            Almoxarifado <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Card 4: Capacidade Produtiva Alocada */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Carga em Carteira</span>
            <Clock className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900 tabular-nums">
              {formatMinutes(totalOpenOPMinutes)}
            </span>
            <span className="text-xs text-slate-500">
              em {data.workCenters.length} centros
            </span>
          </div>
          <button
            onClick={() => onNavigate('capacidade')}
            className="mt-4 text-xs font-medium text-emerald-600 hover:text-emerald-800 flex items-center gap-1 transition-colors"
          >
            Ver capacidade <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* TAB 1: VISÃO GERAL */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* Workload Capacity Chart directly on Dashboard */}
          <WorkloadCapacityChart
            workCenters={data.workCenters}
            productionOrders={data.productionOrders}
          />

          {/* Interactive Simulator Card on Dashboard */}
          <InteractiveProductionSimulator
            products={data.products}
            rawMaterials={data.rawMaterials}
            workCenters={data.workCenters}
            onConvertSimulationToOP={handleConvertSimulation}
          />

          {/* Main Grid: Active Production + Critical Inventory */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column (2 cols): Active Production Orders */}
            <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-base font-semibold text-slate-900">
                    Ordens de Produção em Andamento
                  </h2>
                  <p className="text-xs text-slate-500">
                    Acompanhamento em tempo real das etapas fabris
                  </p>
                </div>
                <button
                  onClick={() => onNavigate('producao')}
                  className="text-xs font-medium text-blue-600 hover:text-blue-800"
                >
                  Ver todas ({data.productionOrders.length})
                </button>
              </div>

              {activeOps.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  <Factory className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm font-medium">Nenhuma ordem de produção em andamento no momento.</p>
                  <button
                    onClick={onNewOP}
                    className="mt-3 text-xs font-semibold text-blue-600 hover:underline"
                  >
                    Emitir primeira OP
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {activeOps.slice(0, 5).map((op) => {
                    const totalStages = op.stages.length;
                    const completedStages = op.stages.filter((s) => s.status === 'CONCLUIDO').length;
                    const progressPercent = totalStages > 0 ? Math.round((completedStages / totalStages) * 100) : 0;
                    const currentStage = op.stages[op.currentStageIndex] || op.stages[0];

                    return (
                      <div
                        key={op.id}
                        className="p-4 rounded-lg border border-slate-200 hover:border-slate-300 transition-colors bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-slate-900">
                              {op.orderNumber}
                            </span>
                            <span className="text-slate-400">·</span>
                            <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                              {op.status.replace('_', ' ')}
                            </span>
                            {op.saleOrderNumber && (
                              <span className="text-xs text-slate-500">
                                (Pedido: {op.saleOrderNumber})
                              </span>
                            )}
                          </div>
                          <div className="text-sm font-medium text-slate-800">
                            {op.productName}
                          </div>
                          <div className="text-xs text-slate-500 flex items-center gap-2">
                            <span>Lote: {op.quantityPlanned} un</span>
                            <span>·</span>
                            <span>Previsão: {formatDate(op.expectedEndDate)}</span>
                            {currentStage && (
                              <>
                                <span>·</span>
                                <span className="text-slate-700 font-medium">
                                  Etapa: {currentStage.name}
                                </span>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="w-full md:w-48 space-y-1.5 shrink-0">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-500">Progresso</span>
                            <span className="font-mono font-semibold text-slate-700">{progressPercent}%</span>
                          </div>
                          <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                            <div
                              className="bg-blue-600 h-full rounded-full transition-all"
                              style={{ width: `${progressPercent}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right Column: Work Center Capacities & Alerts */}
            <div className="space-y-6">
              {/* Work Centers occupancy */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-semibold text-slate-900">
                    Capacidade Produtiva (Centros)
                  </h3>
                  <button
                    onClick={() => onNavigate('capacidade')}
                    className="text-xs font-medium text-blue-600 hover:text-blue-800"
                  >
                    Detalhar
                  </button>
                </div>

                <div className="space-y-3">
                  {data.workCenters.map((wc) => (
                    <div key={wc.id} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-slate-700 truncate max-w-[160px]">
                          {wc.name}
                        </span>
                        <span className="font-mono text-slate-500">
                          {formatMinutes(wc.effectiveDailyMinutes)} / dia
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500">
                        <span>{wc.operatorsCount} operadores</span>
                        <span>·</span>
                        <span>{wc.efficiencyRate}% eficiência</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Low Stock Alerts */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    Insumos em Atenção
                  </h3>
                  <button
                    onClick={() => onNavigate('materia-prima')}
                    className="text-xs font-medium text-blue-600 hover:text-blue-800"
                  >
                    Almoxarifado
                  </button>
                </div>

                {lowStockMaterials.length === 0 ? (
                  <div className="py-4 text-center text-xs text-emerald-600 flex items-center justify-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    Todas as matérias-primas com estoque acima do mínimo.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {lowStockMaterials.slice(0, 4).map((mat) => (
                      <div
                        key={mat.id}
                        className="p-2.5 rounded-lg border border-rose-100 bg-rose-50/50 flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="font-medium text-slate-900">{mat.name}</div>
                          <div className="text-slate-500">Mínimo: {mat.minStock} {mat.unit}</div>
                        </div>
                        <div className="font-mono font-bold text-rose-600 text-right">
                          {mat.currentStock} {mat.unit}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: GRÁFICO INTERATIVO DE CARGA */}
      {activeTab === 'chart' && (
        <div className="space-y-6">
          <WorkloadCapacityChart
            workCenters={data.workCenters}
            productionOrders={data.productionOrders}
          />
        </div>
      )}

      {/* TAB 3: SIMULADOR INTERATIVO */}
      {activeTab === 'simulator' && (
        <div className="space-y-6">
          <InteractiveProductionSimulator
            products={data.products}
            rawMaterials={data.rawMaterials}
            workCenters={data.workCenters}
            onConvertSimulationToOP={handleConvertSimulation}
          />
        </div>
      )}
    </div>
  );
};

