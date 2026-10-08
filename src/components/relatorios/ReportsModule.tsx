import React, { useState } from 'react';
import {
  FileText,
  Printer,
  Calendar,
  CheckCircle2,
  Clock,
  TrendingUp,
  Boxes,
  Shield,
  Layers,
  BarChart3,
} from 'lucide-react';
import { ERPDatabase, ProductionOrder, RawMaterial } from '../../types/erp';
import { formatCurrency, formatDate, formatDateTime, formatMinutes } from '../../utils/formatters';
import { ProductionEfficiencyChart } from '../charts/ProductionEfficiencyChart';

interface ReportsModuleProps {
  data: ERPDatabase;
}

export const ReportsModule: React.FC<ReportsModuleProps> = ({ data }) => {
  const [selectedReport, setSelectedReport] = useState<'ops' | 'materials' | 'capacity'>('ops');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'CONCLUIDA' | 'ATIVAS'>('ALL');

  const { productionOrders, rawMaterials, workCenters, settings, stockMovements } = data;
  const tech = settings.technicalResponsible;

  // Filtered OPs for the report
  const reportOPs = productionOrders.filter((op) => {
    if (statusFilter === 'CONCLUIDA') return op.status === 'CONCLUIDA';
    if (statusFilter === 'ATIVAS') return op.status !== 'CONCLUIDA' && op.status !== 'CANCELADA';
    return true;
  });

  // Calculate efficiency metrics
  const completedWithTime = productionOrders.filter(
    (op) => op.status === 'CONCLUIDA' && op.actualTotalMinutes && op.actualTotalMinutes > 0
  );

  const totalPlannedCompleted = completedWithTime.reduce((sum, op) => {
    const planned = op.stages.reduce((s, st) => s + (st.plannedMinutes || 0), 0);
    return sum + planned;
  }, 0);

  const totalActualCompleted = completedWithTime.reduce(
    (sum, op) => sum + (op.actualTotalMinutes || 0),
    0
  );

  const overallEfficiency =
    totalActualCompleted > 0
      ? Math.round((totalPlannedCompleted / totalActualCompleted) * 100)
      : 100;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header (Hidden in Print) */}
      <div className="no-print flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Relatórios Gerenciais &amp; Acompanhamento da Produção
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Indicadores de eficiência fabril, consumo de insumos e laudo técnico para auditoria
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handlePrint}
            className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors shadow-sm flex items-center gap-1.5"
          >
            <Printer className="w-4 h-4" />
            Imprimir Relatório Oficial
          </button>
        </div>
      </div>

      {/* Report Selection Tabs (Hidden in Print) */}
      <div className="no-print flex border-b border-slate-200 gap-6">
        <button
          onClick={() => setSelectedReport('ops')}
          className={`pb-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
            selectedReport === 'ops'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Clock className="w-4 h-4" />
          Acompanhamento de Ordens de Produção &amp; Tempos
        </button>
        <button
          onClick={() => setSelectedReport('materials')}
          className={`pb-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
            selectedReport === 'materials'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Boxes className="w-4 h-4" />
          Consumo &amp; Baixas de Matéria-Prima
        </button>
        <button
          onClick={() => setSelectedReport('capacity')}
          className={`pb-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
            selectedReport === 'capacity'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          Balanço de Carga &amp; Ocupação de Capacidade
        </button>
      </div>

      {/* PRINTABLE REPORT DOCUMENT CONTAINER */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 space-y-6 printable-area">
        {/* Formal Company Header */}
        <div className="border-b-2 border-slate-900 pb-4 flex items-start justify-between">
          <div className="space-y-1">
            <h2 className="text-xl font-black uppercase text-slate-900">
              {settings.companyName}
            </h2>
            <div className="text-xs text-slate-600">
              CNPJ: {settings.cnpj} · {settings.address}
            </div>
            <div className="text-xs text-slate-600">
              Contato: {settings.phone} · {settings.email}
            </div>
          </div>

          <div className="text-right border-l-2 border-slate-200 pl-4 space-y-1">
            <span className="text-[11px] uppercase font-bold text-slate-500 block">
              Relatório de Acompanhamento Fabril
            </span>
            <div className="text-sm font-black text-slate-900">
              {selectedReport === 'ops'
                ? 'DESEMPENHO DE ORDENS DE PRODUÇÃO'
                : selectedReport === 'materials'
                ? 'CONSUMO DE MATÉRIAS-PRIMAS'
                : 'BALANÇO DE CAPACIDADE PRODUTIVA'}
            </div>
            <div className="text-[11px] font-mono text-slate-500">
              Emissão: {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR')}
            </div>
          </div>
        </div>

        {/* Technical Responsible Formal Identification Banner */}
        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-blue-600 shrink-0" />
            <div>
              <span className="text-xs text-slate-500">Responsável Técnico pelo Laudo / PCP:</span>
              <div className="text-sm font-bold text-slate-900">{tech.name}</div>
            </div>
          </div>
          <div className="text-right text-xs">
            <span className="font-mono font-semibold text-slate-800">{tech.registration}</span>
            <div className="text-slate-500">{tech.role}</div>
          </div>
        </div>

        {/* ================= REPORT 1: ORDENS DE PRODUÇÃO ================= */}
        {selectedReport === 'ops' && (
          <div className="space-y-6">
            {/* Quick KPI Overview */}
            <div className="grid grid-cols-4 gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200 text-center">
              <div>
                <span className="text-xs text-slate-500 block">Total de OPs</span>
                <span className="text-2xl font-bold font-mono text-slate-900">
                  {productionOrders.length}
                </span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block">Concluídas &amp; Baixadas</span>
                <span className="text-2xl font-bold font-mono text-emerald-600">
                  {productionOrders.filter((o) => o.status === 'CONCLUIDA').length}
                </span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block">Em Andamento</span>
                <span className="text-2xl font-bold font-mono text-blue-600">
                  {productionOrders.filter((o) => o.status === 'EM_PROCESSO' || o.status === 'CONTROLE_QUALIDADE').length}
                </span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block">Eficiência Geral</span>
                <span className="text-2xl font-bold font-mono text-slate-900">
                  {overallEfficiency}%
                </span>
              </div>
            </div>

            {/* Interactive Efficiency Chart */}
            <ProductionEfficiencyChart productionOrders={productionOrders} />

            {/* Table of Orders */}
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-100 border-b border-slate-200 font-bold uppercase text-slate-600">
                  <tr>
                    <th className="p-3">OP Nº</th>
                    <th className="p-3">Produto / Pedido</th>
                    <th className="p-3 text-center">Lote</th>
                    <th className="p-3 text-right">Tempo Plan.</th>
                    <th className="p-3 text-right">Tempo Real</th>
                    <th className="p-3 text-center">Variação</th>
                    <th className="p-3">Início / Conclusão</th>
                    <th className="p-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {reportOPs.map((op) => {
                    const plannedMin = op.stages.reduce((s, st) => s + (st.plannedMinutes || 0), 0);
                    const actualMin = op.actualTotalMinutes || 0;
                    const diff = actualMin > 0 ? actualMin - plannedMin : 0;

                    return (
                      <tr key={op.id} className="hover:bg-slate-50 print-avoid-break">
                        <td className="p-3 font-mono font-bold text-slate-900">
                          {op.orderNumber}
                        </td>
                        <td className="p-3">
                          <div className="font-semibold text-slate-900">{op.productName}</div>
                          {op.saleOrderNumber && (
                            <div className="text-[11px] text-slate-500 font-mono">
                              Pedido: {op.saleOrderNumber} {op.clientName && `· ${op.clientName}`}
                            </div>
                          )}
                        </td>
                        <td className="p-3 text-center font-mono font-bold text-slate-800">
                          {op.quantityProduced > 0 ? op.quantityProduced : op.quantityPlanned} un
                        </td>
                        <td className="p-3 text-right font-mono text-slate-700">
                          {formatMinutes(plannedMin)}
                        </td>
                        <td className="p-3 text-right font-mono font-semibold text-slate-900">
                          {actualMin > 0 ? formatMinutes(actualMin) : '-'}
                        </td>
                        <td className="p-3 text-center font-mono">
                          {actualMin > 0 ? (
                            <span
                              className={`font-semibold ${
                                diff <= 0 ? 'text-emerald-700' : 'text-rose-600'
                              }`}
                            >
                              {diff <= 0 ? `${diff}m` : `+${diff}m`}
                            </span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="p-3 text-slate-600">
                          <div>Início: {formatDate(op.startDate)}</div>
                          <div>Fim: {op.completedAt ? formatDateTime(op.completedAt) : formatDate(op.expectedEndDate)}</div>
                        </td>
                        <td className="p-3 text-center">
                          <span
                            className={`font-semibold px-2 py-0.5 rounded text-[10px] ${
                              op.status === 'CONCLUIDA'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {op.status.replace('_', ' ')}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ================= REPORT 2: CONSUMO DE MATÉRIAS-PRIMAS ================= */}
        {selectedReport === 'materials' && (
          <div className="space-y-6">
            <p className="text-xs text-slate-600">
              Extrato consolidado das matérias-primas cadastradas, nível atual de estoque e movimentações fabris.
            </p>

            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-100 border-b border-slate-200 font-bold uppercase text-slate-600">
                  <tr>
                    <th className="p-3">Código</th>
                    <th className="p-3">Matéria-Prima</th>
                    <th className="p-3 text-center">Unidade</th>
                    <th className="p-3 text-right">Estoque Atual</th>
                    <th className="p-3 text-right">Estoque Mínimo</th>
                    <th className="p-3 text-right">Custo Unitário</th>
                    <th className="p-3 text-right">Valor Total Imobilizado</th>
                    <th className="p-3">Localização</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rawMaterials.map((mat) => {
                    const totalVal = (Number(mat.currentStock) || 0) * (Number(mat.unitCost) || 0);
                    const isLow = mat.currentStock <= mat.minStock;

                    return (
                      <tr key={mat.id} className="hover:bg-slate-50 print-avoid-break">
                        <td className="p-3 font-mono font-bold text-slate-900">{mat.code}</td>
                        <td className="p-3 font-medium text-slate-900">{mat.name}</td>
                        <td className="p-3 text-center font-mono">{mat.unit}</td>
                        <td className={`p-3 text-right font-mono font-bold ${isLow ? 'text-rose-600' : 'text-slate-900'}`}>
                          {mat.currentStock}
                        </td>
                        <td className="p-3 text-right font-mono text-slate-500">{mat.minStock}</td>
                        <td className="p-3 text-right font-mono">{formatCurrency(mat.unitCost)}</td>
                        <td className="p-3 text-right font-mono font-bold text-slate-900">
                          {formatCurrency(totalVal)}
                        </td>
                        <td className="p-3 text-slate-500">{mat.location || '-'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ================= REPORT 3: CAPACIDADE PRODUTIVA ================= */}
        {selectedReport === 'capacity' && (
          <div className="space-y-6">
            <p className="text-xs text-slate-600">
              Dimensionamento e capacidade de produção por centros de trabalho e máquinas da fábrica.
            </p>

            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-100 border-b border-slate-200 font-bold uppercase text-slate-600">
                  <tr>
                    <th className="p-3">Código</th>
                    <th className="p-3">Centro de Trabalho / Máquina</th>
                    <th className="p-3 text-center">Operadores</th>
                    <th className="p-3 text-center">Horas/Dia</th>
                    <th className="p-3 text-center">Eficiência (%)</th>
                    <th className="p-3 text-right">Capacidade Nominal/Dia</th>
                    <th className="p-3 text-right">Capacidade Efetiva/Dia</th>
                    <th className="p-3 text-right">Capacidade Semanal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {workCenters.map((wc) => {
                    const weeklyEffective = (wc.effectiveDailyMinutes || 0) * (wc.workDaysPerWeek || 5);

                    return (
                      <tr key={wc.id} className="hover:bg-slate-50 print-avoid-break">
                        <td className="p-3 font-mono font-bold text-slate-900">{wc.code}</td>
                        <td className="p-3 font-semibold text-slate-900">{wc.name}</td>
                        <td className="p-3 text-center font-mono">{wc.operatorsCount}</td>
                        <td className="p-3 text-center font-mono">{wc.dailyHoursPerOperator}h</td>
                        <td className="p-3 text-center font-mono font-bold text-emerald-700">
                          {wc.efficiencyRate}%
                        </td>
                        <td className="p-3 text-right font-mono text-slate-600">
                          {formatMinutes(wc.nominalDailyMinutes)}
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-slate-900">
                          {formatMinutes(wc.effectiveDailyMinutes)}
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-blue-700">
                          {formatMinutes(weeklyEffective)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Formal Technical Signature Block */}
        <div className="pt-8 border-t border-slate-300 grid grid-cols-2 gap-8 text-center print-avoid-break">
          <div>
            <div className="border-b border-slate-400 pb-1 font-mono text-xs text-slate-400">
              &nbsp;
            </div>
            <div className="mt-1 font-semibold text-slate-800 text-xs">
              Diretoria Industrial / Gerência Fabril
            </div>
            <div className="text-[10px] text-slate-500">Aprovação Executiva</div>
          </div>

          <div>
            <div className="border-b border-slate-400 pb-1 font-semibold text-slate-900 text-xs">
              {tech.name}
            </div>
            <div className="mt-1 font-bold text-slate-900 text-xs">
              Responsável Técnico · {tech.registration}
            </div>
            <div className="text-[10px] text-slate-500">{tech.role}</div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-200 text-center text-[10px] text-slate-400 font-mono">
          Documento emitido pelo PlanoERP para fins de controle de produção, auditoria e rastreabilidade técnica.
        </div>
      </div>
    </div>
  );
};
