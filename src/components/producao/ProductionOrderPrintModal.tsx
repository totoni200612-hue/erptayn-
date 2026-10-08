import React from 'react';
import { Printer, X, Shield, CheckSquare, Factory, Calendar, Clock } from 'lucide-react';
import { ProductionOrder, SystemSettings } from '../../types/erp';
import { formatDate, formatMinutes } from '../../utils/formatters';

interface ProductionOrderPrintModalProps {
  op: ProductionOrder | null;
  settings: SystemSettings;
  onClose: () => void;
}

export const ProductionOrderPrintModal: React.FC<ProductionOrderPrintModalProps> = ({
  op,
  settings,
  onClose,
}) => {
  if (!op) return null;

  const handlePrint = () => {
    window.print();
  };

  const totalPlannedMinutes = op.stages.reduce((sum, s) => sum + (s.plannedMinutes || 0), 0);
  const techResponsible = op.technicalResponsible?.name
    ? op.technicalResponsible
    : settings.technicalResponsible;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto">
      {/* Container - on print this becomes .printable-area */}
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden printable-area">
        {/* Modal Controls (Hidden in Print) */}
        <div className="no-print px-6 py-3.5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Factory className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-semibold">
              Visualização para Impressão - Ordem de Produção {op.orderNumber}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Printer className="w-4 h-4" />
              Imprimir Documento / PDF
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PRINTABLE SHEET (A4 Standard Format) */}
        <div className="p-8 overflow-y-auto space-y-6 text-slate-900 text-xs bg-white font-sans">
          {/* Header */}
          <div className="border-b-2 border-slate-900 pb-4 flex items-start justify-between">
            <div className="space-y-1">
              <h1 className="text-xl font-bold tracking-tight text-slate-900 uppercase">
                {settings.companyName || 'Alfa Soluções Industriais'}
              </h1>
              <p className="text-[11px] text-slate-600">
                CNPJ: {settings.cnpj || '28.491.802/0001-44'} · {settings.address || 'Distrito Industrial'}
              </p>
              <p className="text-[11px] text-slate-600">
                Telefone: {settings.phone} · E-mail: {settings.email}
              </p>
            </div>

            <div className="text-right border-l-2 border-slate-200 pl-4 space-y-0.5">
              <div className="text-xs uppercase font-semibold text-slate-500">
                Documento Fabril Oficial
              </div>
              <div className="text-2xl font-black font-mono tracking-tight text-slate-900">
                {op.orderNumber}
              </div>
              <div className="text-[11px] text-slate-500 font-mono">
                Emissão: {formatDate(op.createdAt)}
              </div>
            </div>
          </div>

          {/* Technical Responsible Banner */}
          <div className="p-3 bg-slate-100 rounded-lg border border-slate-300 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-blue-700 shrink-0" />
              <div>
                <span className="font-bold text-slate-900">Responsável Técnico Habilitado:</span>{' '}
                <span className="text-slate-800">{techResponsible.name}</span>
              </div>
            </div>
            <div className="text-slate-700 font-mono font-semibold">
              {techResponsible.registration} · {techResponsible.role}
            </div>
          </div>

          {/* Product & Order Information Block */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 border border-slate-200 rounded-lg bg-slate-50">
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-semibold">
                Produto / Código
              </span>
              <span className="font-mono font-bold text-slate-900 text-xs">
                {op.productCode}
              </span>
              <div className="font-semibold text-slate-900 text-xs mt-0.5">
                {op.productName}
              </div>
            </div>

            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-semibold">
                Lote Planejado
              </span>
              <span className="font-mono text-base font-black text-slate-900">
                {op.quantityPlanned} unidades
              </span>
              {op.status === 'CONCLUIDA' && (
                <div className="text-emerald-700 font-bold text-[11px]">
                  Produzido: {op.quantityProduced} un
                </div>
              )}
            </div>

            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-semibold">
                Datas da Produção
              </span>
              <div className="text-slate-800">
                Início: <span className="font-mono font-medium">{formatDate(op.startDate)}</span>
              </div>
              <div className="text-slate-800">
                Previsão Término: <span className="font-mono font-medium">{formatDate(op.expectedEndDate)}</span>
              </div>
            </div>

            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-semibold">
                Vinculação / Prioridade
              </span>
              <div className="font-mono font-medium text-slate-900">
                {op.saleOrderNumber ? `Pedido: ${op.saleOrderNumber}` : 'Produção para Estoque'}
              </div>
              {op.clientName && (
                <div className="text-[11px] text-slate-600 truncate">
                  Cliente: {op.clientName}
                </div>
              )}
              <div className="text-xs font-bold text-slate-700 uppercase mt-0.5">
                Prioridade: {op.priority}
              </div>
            </div>
          </div>

          {/* Raw Materials Picking List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between border-b border-slate-300 pb-1">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                <CheckSquare className="w-3.5 h-3.5 text-blue-700" />
                1. Separação de Matérias-Primas (Almoxarifado)
              </h2>
              <span className="text-[11px] text-slate-500 italic">
                Conferência e liberação para o chão de fábrica
              </span>
            </div>

            <table className="w-full text-left border border-slate-300">
              <thead className="bg-slate-100 text-[10px] font-bold uppercase text-slate-700 border-b border-slate-300">
                <tr>
                  <th className="p-2 w-8 text-center">[ X ]</th>
                  <th className="p-2">Código / Insumo</th>
                  <th className="p-2 text-center">Unidade</th>
                  <th className="p-2 text-right">Qtd. Necessária</th>
                  <th className="p-2 text-right">Estoque Momento</th>
                  <th className="p-2 w-32">Visto Almoxarifado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {op.requiredMaterials.map((mat) => (
                  <tr key={mat.rawMaterialId} className="print-avoid-break">
                    <td className="p-2 text-center font-mono text-slate-400">
                      [ &nbsp; ]
                    </td>
                    <td className="p-2 font-medium">
                      <span className="font-mono font-bold text-slate-900 mr-2">
                        {mat.rawMaterialCode}
                      </span>
                      {mat.rawMaterialName}
                    </td>
                    <td className="p-2 text-center font-mono text-slate-600">
                      {mat.unit}
                    </td>
                    <td className="p-2 text-right font-mono font-bold text-slate-900">
                      {mat.requiredQuantity}
                    </td>
                    <td className="p-2 text-right font-mono text-slate-600">
                      {mat.currentStock}
                    </td>
                    <td className="p-2 border-l border-slate-200 text-center font-mono text-slate-300">
                      _________________
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Operational Manufacturing Routing (Etapas e Tempos de Processo) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between border-b border-slate-300 pb-1">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-blue-700" />
                2. Roteiro Operacional &amp; Tempos de Processo
              </h2>
              <span className="text-[11px] text-slate-700 font-mono font-bold">
                Tempo Total Planejado: {formatMinutes(totalPlannedMinutes)}
              </span>
            </div>

            <table className="w-full text-left border border-slate-300">
              <thead className="bg-slate-100 text-[10px] font-bold uppercase text-slate-700 border-b border-slate-300">
                <tr>
                  <th className="p-2 w-8 text-center">Etapa</th>
                  <th className="p-2">Descrição da Operação</th>
                  <th className="p-2">Centro de Trabalho / Máquina</th>
                  <th className="p-2 text-right">Tempo Plan.</th>
                  <th className="p-2 text-center w-28">Início</th>
                  <th className="p-2 text-center w-28">Término</th>
                  <th className="p-2 text-center w-24">Visto Op.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {op.stages.map((stage, idx) => (
                  <tr key={stage.id} className="print-avoid-break">
                    <td className="p-2 text-center font-mono font-bold text-slate-700">
                      {idx + 1}
                    </td>
                    <td className="p-2 font-medium text-slate-900">
                      {stage.name}
                      {stage.notes && (
                        <div className="text-[10px] text-slate-500 italic">{stage.notes}</div>
                      )}
                    </td>
                    <td className="p-2 text-slate-700">
                      {stage.workCenterName}
                    </td>
                    <td className="p-2 text-right font-mono font-semibold text-slate-900">
                      {formatMinutes(stage.plannedMinutes)}
                    </td>
                    <td className="p-2 border-l border-slate-200 text-center font-mono text-slate-400">
                      ___/___ ___:___
                    </td>
                    <td className="p-2 border-l border-slate-200 text-center font-mono text-slate-400">
                      ___/___ ___:___
                    </td>
                    <td className="p-2 border-l border-slate-200 text-center font-mono text-slate-300">
                      __________
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Notes & Quality Control Section */}
          <div className="grid grid-cols-2 gap-4 print-avoid-break">
            <div className="p-3 border border-slate-300 rounded-lg">
              <div className="text-[10px] uppercase font-bold text-slate-600 mb-1">
                Instruções do PCP / Observações
              </div>
              <p className="text-[11px] text-slate-700 italic min-h-[40px]">
                {op.notes || 'Executar conforme desenho técnico e tolerâncias de montagem padrão.'}
              </p>
            </div>

            <div className="p-3 border border-slate-300 rounded-lg">
              <div className="text-[10px] uppercase font-bold text-slate-600 mb-1">
                Controle de Qualidade &amp; Inspeção Final
              </div>
              <div className="text-[11px] text-slate-700 space-y-1">
                <div>[ &nbsp; ] Dimensional e esquadro conforme projeto</div>
                <div>[ &nbsp; ] Acabamento superficial e pintura isento de avarias</div>
                <div>[ &nbsp; ] Embalagem e identificação de lote adequadas</div>
              </div>
            </div>
          </div>

          {/* Signatures & Formal Responsible Identification */}
          <div className="pt-6 border-t border-slate-300 grid grid-cols-2 gap-8 text-center print-avoid-break">
            <div>
              <div className="border-b border-slate-400 pb-1 font-mono text-xs text-slate-400">
                &nbsp;
              </div>
              <div className="mt-1 font-semibold text-slate-800 text-xs">
                Operador Líder / Chão de Fábrica
              </div>
              <div className="text-[10px] text-slate-500">Execução e Apontamento Fabril</div>
            </div>

            <div>
              <div className="border-b border-slate-400 pb-1 font-semibold text-slate-900 text-xs">
                {techResponsible.name}
              </div>
              <div className="mt-1 font-bold text-slate-900 text-xs">
                Responsável Técnico · {techResponsible.registration}
              </div>
              <div className="text-[10px] text-slate-500">{techResponsible.role}</div>
            </div>
          </div>

          {/* Footer Note */}
          <div className="pt-3 border-t border-slate-200 text-center text-[10px] text-slate-400 font-mono">
            Documento gerado pelo PlanoERP em {new Date().toLocaleDateString('pt-BR')} às{' '}
            {new Date().toLocaleTimeString('pt-BR')} · Responsabilidade Técnica:{' '}
            {techResponsible.name} ({techResponsible.registration})
          </div>
        </div>
      </div>
    </div>
  );
};
