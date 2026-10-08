import React, { useState } from 'react';
import {
  Gauge,
  Plus,
  Edit2,
  Trash2,
  Users,
  Clock,
  Zap,
  X,
  Layers,
} from 'lucide-react';
import { ProductionOrder, WorkCenter } from '../../types/erp';
import { formatMinutes } from '../../utils/formatters';
import { WorkloadCapacityChart } from '../charts/WorkloadCapacityChart';

interface CapacityModuleProps {
  workCenters: WorkCenter[];
  productionOrders: ProductionOrder[];
  onSaveWorkCenter: (wc: WorkCenter) => Promise<void>;
  onDeleteWorkCenter: (id: string) => Promise<void>;
}

export const CapacityModule: React.FC<CapacityModuleProps> = ({
  workCenters,
  productionOrders,
  onSaveWorkCenter,
  onDeleteWorkCenter,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedWc, setSelectedWc] = useState<WorkCenter | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [operatorsCount, setOperatorsCount] = useState<number>(2);
  const [dailyHoursPerOperator, setDailyHoursPerOperator] = useState<number>(8);
  const [workDaysPerWeek, setWorkDaysPerWeek] = useState<number>(5);
  const [efficiencyRate, setEfficiencyRate] = useState<number>(85);
  const [notes, setNotes] = useState('');

  // Calculate allocated minutes from open/active production orders for each work center
  const openOrders = productionOrders.filter(
    (op) => op.status !== 'CONCLUIDA' && op.status !== 'CANCELADA'
  );

  const getCenterLoadMinutes = (wcId: string): number => {
    let minutes = 0;
    for (const op of openOrders) {
      for (const stage of op.stages) {
        if (stage.workCenterId === wcId && stage.status !== 'CONCLUIDO') {
          minutes += stage.plannedMinutes || 0;
        }
      }
    }
    return minutes;
  };

  const totalEffectiveMinutesDaily = workCenters.reduce(
    (sum, wc) => sum + (wc.effectiveDailyMinutes || 0),
    0
  );

  const totalOperators = workCenters.reduce((sum, wc) => sum + (wc.operatorsCount || 0), 0);

  const openNewModal = () => {
    setSelectedWc(null);
    setCode(`CT-0${workCenters.length + 1}`);
    setName('');
    setOperatorsCount(2);
    setDailyHoursPerOperator(8);
    setWorkDaysPerWeek(5);
    setEfficiencyRate(85);
    setNotes('');
    setIsModalOpen(true);
  };

  const openEditModal = (wc: WorkCenter) => {
    setSelectedWc(wc);
    setCode(wc.code);
    setName(wc.name);
    setOperatorsCount(wc.operatorsCount);
    setDailyHoursPerOperator(wc.dailyHoursPerOperator);
    setWorkDaysPerWeek(wc.workDaysPerWeek);
    setEfficiencyRate(wc.efficiencyRate);
    setNotes(wc.notes || '');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSaving(true);
    try {
      const nominal = operatorsCount * dailyHoursPerOperator * 60;
      const effective = Math.round(nominal * (efficiencyRate / 100));

      const dataToSave: WorkCenter = {
        id: selectedWc ? selectedWc.id : '',
        code: code.trim(),
        name: name.trim(),
        operatorsCount: Number(operatorsCount) || 1,
        dailyHoursPerOperator: Number(dailyHoursPerOperator) || 8,
        workDaysPerWeek: Number(workDaysPerWeek) || 5,
        efficiencyRate: Number(efficiencyRate) || 85,
        nominalDailyMinutes: nominal,
        effectiveDailyMinutes: effective,
        notes: notes.trim(),
      };

      await onSaveWorkCenter(dataToSave);
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Capacidade Produtiva &amp; Centros de Trabalho
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Dimensionamento de horas disponíveis, postos fabris, eficiência e balanço de carga
          </p>
        </div>

        <button
          onClick={openNewModal}
          className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          + Novo Centro de Trabalho
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Centros Ativos</span>
            <Gauge className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-3xl font-bold text-slate-900 font-mono">
            {workCenters.length}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Postos de manufatura configurados
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Operadores Alocados</span>
            <Users className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-3xl font-bold text-slate-900 font-mono">
            {totalOperators}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Trabalhadores fabris distribuídos
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Capacidade Efetiva Diária</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-3xl font-bold text-slate-900 font-mono">
            {formatMinutes(totalEffectiveMinutesDaily)}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Considerando índices de eficiência
          </div>
        </div>
      </div>

      {/* Interactive Workload vs Capacity Chart */}
      <WorkloadCapacityChart
        workCenters={workCenters}
        productionOrders={productionOrders}
      />

      {/* Work Centers Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {workCenters.map((wc) => {
          const loadMinutes = getCenterLoadMinutes(wc.id);
          const dailyEffective = wc.effectiveDailyMinutes || 1;
          const weeklyEffective = dailyEffective * (wc.workDaysPerWeek || 5);
          // Days of backlog in this work center
          const daysOfWork = Math.round((loadMinutes / dailyEffective) * 10) / 10;
          const percentOfWeekly = Math.min(100, Math.round((loadMinutes / weeklyEffective) * 100));

          return (
            <div
              key={wc.id}
              className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4 hover:border-slate-300 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                      {wc.code}
                    </span>
                    <span className="text-xs text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded flex items-center gap-1">
                      <Zap className="w-3 h-3" />
                      {wc.efficiencyRate}% Eficiência
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mt-1.5">
                    {wc.name}
                  </h3>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditModal(wc)}
                    className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                    title="Editar Centro"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Excluir o centro de trabalho "${wc.name}"?`)) {
                        onDeleteWorkCenter(wc.id);
                      }
                    }}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                    title="Excluir Centro"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {wc.notes && (
                <p className="text-xs text-slate-500 italic">
                  {wc.notes}
                </p>
              )}

              {/* Specs Grid */}
              <div className="grid grid-cols-3 gap-3 p-3 bg-slate-50 rounded-lg text-xs">
                <div>
                  <div className="text-slate-400">Operadores</div>
                  <div className="font-semibold text-slate-800 font-mono mt-0.5">
                    {wc.operatorsCount} pessoas
                  </div>
                </div>
                <div>
                  <div className="text-slate-400">Jornada Diária</div>
                  <div className="font-semibold text-slate-800 font-mono mt-0.5">
                    {wc.dailyHoursPerOperator}h/dia ({wc.workDaysPerWeek}d/sem)
                  </div>
                </div>
                <div>
                  <div className="text-slate-400">Capac. Efetiva/Dia</div>
                  <div className="font-semibold text-slate-800 font-mono mt-0.5">
                    {formatMinutes(wc.effectiveDailyMinutes)}
                  </div>
                </div>
              </div>

              {/* Production Load in Progress */}
              <div className="space-y-1.5 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-700">
                    Carga Alocada em OPs Abertas:
                  </span>
                  <span className="font-mono font-bold text-slate-900">
                    {formatMinutes(loadMinutes)} ({daysOfWork} dias de produção)
                  </span>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      percentOfWeekly > 80 ? 'bg-amber-500' : 'bg-blue-600'
                    }`}
                    style={{ width: `${Math.max(5, percentOfWeekly)}%` }}
                  />
                </div>
                <div className="text-[11px] text-slate-400 flex justify-between">
                  <span>Ocupação sobre capacidade semanal</span>
                  <span className="font-mono font-medium">{percentOfWeekly}%</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Add/Edit Work Center */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in duration-150">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h2 className="text-base font-bold text-slate-900">
                {selectedWc ? 'Editar Centro de Trabalho' : 'Novo Centro de Trabalho'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Código *
                  </label>
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded p-2 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Operadores Alocados *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={operatorsCount}
                    onChange={(e) => setOperatorsCount(parseInt(e.target.value, 10) || 1)}
                    className="w-full text-xs border border-slate-300 rounded p-2 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nome do Centro de Trabalho / Linha *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Usinagem & Furação CNC"
                  className="w-full text-xs border border-slate-300 rounded p-2"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Horas / Dia (Op.)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="24"
                    value={dailyHoursPerOperator}
                    onChange={(e) => setDailyHoursPerOperator(parseFloat(e.target.value) || 8)}
                    className="w-full text-xs border border-slate-300 rounded p-2 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Dias / Semana
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="7"
                    value={workDaysPerWeek}
                    onChange={(e) => setWorkDaysPerWeek(parseInt(e.target.value, 10) || 5)}
                    className="w-full text-xs border border-slate-300 rounded p-2 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Eficiência (%)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={efficiencyRate}
                    onChange={(e) => setEfficiencyRate(parseFloat(e.target.value) || 85)}
                    className="w-full text-xs border border-slate-300 rounded p-2 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Observações &amp; Equipamentos
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Máquinas alocadas, capacidade máxima e detalhes..."
                  className="w-full text-xs border border-slate-300 rounded p-2"
                />
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm"
                >
                  {isSaving ? 'Salvando...' : 'Salvar Centro de Trabalho'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
