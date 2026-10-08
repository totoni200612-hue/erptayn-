import React, { useState } from 'react';
import {
  Factory,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Printer,
  AlertTriangle,
  Play,
  Check,
  ChevronRight,
  Shield,
  Layers,
  ArrowRight,
  X,
  FileCheck2,
  RotateCcw,
} from 'lucide-react';
import {
  OPRequiredMaterial,
  OPStage,
  Product,
  ProductionOrder,
  ProductionOrderStatus,
  ProductionPriority,
  RawMaterial,
  SaleOrder,
  SystemSettings,
  WorkCenter,
} from '../../types/erp';
import { formatDate, formatDateTime, formatMinutes } from '../../utils/formatters';
import { ProductionOrderPrintModal } from './ProductionOrderPrintModal';

interface ProductionModuleProps {
  productionOrders: ProductionOrder[];
  products: Product[];
  rawMaterials: RawMaterial[];
  workCenters: WorkCenter[];
  saleOrders: SaleOrder[];
  settings: SystemSettings;
  onSaveOP: (op: ProductionOrder) => Promise<void>;
  onCompleteOP: (
    id: string,
    payload: {
      quantityProduced?: number;
      actualTotalMinutes?: number;
      completionNotes?: string;
      responsibleName?: string;
      responsibleRegistration?: string;
    }
  ) => Promise<void>;
  onDeleteOP: (id: string) => Promise<void>;
}

export const ProductionModule: React.FC<ProductionModuleProps> = ({
  productionOrders,
  products,
  rawMaterials,
  workCenters,
  saleOrders,
  settings,
  onSaveOP,
  onCompleteOP,
  onDeleteOP,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');

  // Print Modal
  const [printOP, setPrintOP] = useState<ProductionOrder | null>(null);

  // New OP Modal
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // New OP Form state
  const [orderNumber, setOrderNumber] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantityPlanned, setQuantityPlanned] = useState<number>(5);
  const [selectedSaleOrderId, setSelectedSaleOrderId] = useState('');
  const [priority, setPriority] = useState<ProductionPriority>('MEDIA');
  const [startDate, setStartDate] = useState('');
  const [expectedEndDate, setExpectedEndDate] = useState('');
  const [opNotes, setOpNotes] = useState('');

  // Baixa / Completion Modal State
  const [completingOP, setCompletingOP] = useState<ProductionOrder | null>(null);
  const [producedQty, setProducedQty] = useState<number>(0);
  const [actualMinutes, setActualMinutes] = useState<number>(0);
  const [completionNotes, setCompletionNotes] = useState('');
  const [isCompleting, setIsCompleting] = useState(false);

  // Filtered orders
  const filteredOPs = productionOrders.filter((op) => {
    const matchesSearch =
      op.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      op.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (op.clientName && op.clientName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (op.saleOrderNumber && op.saleOrderNumber.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'ALL' ? true : op.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Calculate BOM & Availability for selected product in modal
  const selectedProduct = products.find((p) => p.id === selectedProductId) || products[0];

  const previewMaterials: OPRequiredMaterial[] = selectedProduct && selectedProduct.bom
    ? selectedProduct.bom.map((b) => {
        const mat = rawMaterials.find((m) => m.id === b.rawMaterialId);
        const scrapFactor = 1 + (Number(b.scrapPercentage) || 0) / 100;
        const requiredQuantity = Math.round(b.quantityPerUnit * quantityPlanned * scrapFactor * 100) / 100;
        const currentStock = mat ? mat.currentStock : 0;
        return {
          rawMaterialId: b.rawMaterialId,
          rawMaterialCode: b.rawMaterialCode,
          rawMaterialName: b.rawMaterialName,
          unit: b.unit,
          requiredQuantity,
          currentStock,
          isSufficient: currentStock >= requiredQuantity,
        };
      })
    : [];

  const allMaterialsAvailable = previewMaterials.every((m) => m.isSufficient);

  // Open New Modal
  const openNewOPModal = () => {
    const today = new Date().toISOString().split('T')[0];
    const nextWeek = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const nextSeq = String(productionOrders.length + 1).padStart(3, '0');

    setOrderNumber(`OP-2026-${nextSeq}`);
    setSelectedProductId(products[0]?.id || '');
    setQuantityPlanned(5);
    setSelectedSaleOrderId('');
    setPriority('MEDIA');
    setStartDate(today);
    setExpectedEndDate(nextWeek);
    setOpNotes('');
    setIsNewModalOpen(true);
  };

  const handleCreateOP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    setIsSaving(true);
    try {
      const saleOrder = saleOrders.find((s) => s.id === selectedSaleOrderId);

      // Create stages from product template
      const stages: OPStage[] = (selectedProduct.processStages || []).map((ps, idx) => ({
        id: `ops-${Date.now()}-${idx}`,
        name: ps.name,
        workCenterId: ps.workCenterId,
        workCenterName: ps.workCenterName,
        plannedMinutes: (ps.timeMinutes || 10) * quantityPlanned,
        status: 'PENDENTE',
      }));

      // Initial status: if materials lack, AGUARDANDO_INSUMOS, otherwise PLANEJADA
      const initialStatus: ProductionOrderStatus = allMaterialsAvailable ? 'PLANEJADA' : 'AGUARDANDO_INSUMOS';

      const newOP: ProductionOrder = {
        id: `op-${Date.now()}`,
        orderNumber: orderNumber.trim(),
        saleOrderId: saleOrder ? saleOrder.id : undefined,
        saleOrderNumber: saleOrder ? saleOrder.orderNumber : undefined,
        clientName: saleOrder ? saleOrder.clientName : undefined,
        productId: selectedProduct.id,
        productCode: selectedProduct.code,
        productName: selectedProduct.name,
        quantityPlanned: Number(quantityPlanned) || 1,
        quantityProduced: 0,
        startDate,
        expectedEndDate,
        status: initialStatus,
        priority,
        stages,
        currentStageIndex: 0,
        requiredMaterials: previewMaterials,
        notes: opNotes.trim(),
        stockDeducted: false,
        technicalResponsible: {
          name: settings.technicalResponsible.name,
          registration: settings.technicalResponsible.registration,
          role: settings.technicalResponsible.role,
          email: settings.technicalResponsible.email,
          phone: settings.technicalResponsible.phone,
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await onSaveOP(newOP);
      setIsNewModalOpen(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  // Stage progression helper
  const handleAdvanceStage = async (op: ProductionOrder) => {
    const nextStages = [...op.stages];
    const currentIndex = op.currentStageIndex;

    if (currentIndex < nextStages.length) {
      nextStages[currentIndex] = {
        ...nextStages[currentIndex],
        status: 'CONCLUIDO',
        finishedAt: new Date().toISOString(),
      };
    }

    const nextIndex = currentIndex + 1;
    let nextStatus: ProductionOrderStatus = op.status;

    if (nextIndex < nextStages.length) {
      nextStages[nextIndex] = {
        ...nextStages[nextIndex],
        status: 'EM_ANDAMENTO',
      };
      nextStatus = 'EM_PROCESSO';
    } else {
      // Reached final stage inspection
      nextStatus = 'CONTROLE_QUALIDADE';
    }

    const updatedOP: ProductionOrder = {
      ...op,
      stages: nextStages,
      currentStageIndex: Math.min(nextIndex, nextStages.length - 1),
      status: nextStatus,
      updatedAt: new Date().toISOString(),
    };

    await onSaveOP(updatedOP);
  };

  // Open Baixa Modal
  const openCompleteModal = (op: ProductionOrder) => {
    setCompletingOP(op);
    setProducedQty(op.quantityPlanned);
    const plannedTotal = op.stages.reduce((s, st) => s + (st.plannedMinutes || 0), 0);
    setActualMinutes(plannedTotal);
    setCompletionNotes('Produção inspecionada e liberada pelo controle de qualidade.');
  };

  const handleConfirmCompletion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!completingOP) return;

    setIsCompleting(true);
    try {
      await onCompleteOP(completingOP.id, {
        quantityProduced: producedQty,
        actualTotalMinutes: actualMinutes,
        completionNotes,
        responsibleName: settings.technicalResponsible.name,
        responsibleRegistration: settings.technicalResponsible.registration,
      });
      setCompletingOP(null);
    } catch (err: any) {
      alert(`Erro ao dar baixa na OP: ${err.message}`);
    } finally {
      setIsCompleting(false);
    }
  };

  // Kanban Columns
  const kanbanColumns: { status: ProductionOrderStatus; label: string; color: string }[] = [
    { status: 'PLANEJADA', label: 'Planejada', color: 'border-slate-300' },
    { status: 'AGUARDANDO_INSUMOS', label: 'Aguardando Insumos', color: 'border-amber-400' },
    { status: 'EM_PROCESSO', label: 'Em Processo Fabril', color: 'border-blue-500' },
    { status: 'CONTROLE_QUALIDADE', label: 'Controle de Qualidade', color: 'border-purple-500' },
    { status: 'CONCLUIDA', label: 'Concluída (Baixada)', color: 'border-emerald-500' },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Module Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Ordens de Produção (PCP)
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Emissão de OPs, cálculo de insumos, acompanhamento de etapas e baixa oficial com baixa de estoque
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* View toggle */}
          <div className="flex items-center bg-slate-100 p-1 rounded-lg text-xs font-semibold">
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1 rounded transition-colors ${
                viewMode === 'list' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
              }`}
            >
              Lista
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`px-3 py-1 rounded transition-colors ${
                viewMode === 'kanban' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
              }`}
            >
              Kanban
            </button>
          </div>

          <button
            onClick={openNewOPModal}
            className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            + Emitir Nova OP
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-lg border border-slate-200">
        <div className="flex items-center gap-2 w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por número da OP, produto ou cliente..."
            className="w-full text-xs outline-none text-slate-800 placeholder-slate-400 bg-transparent"
          />
        </div>

        <div className="flex items-center gap-1 overflow-x-auto text-xs font-medium">
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-2.5 py-1 rounded transition-colors ${
              statusFilter === 'ALL'
                ? 'bg-slate-900 text-white font-semibold'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Todas ({productionOrders.length})
          </button>
          <button
            onClick={() => setStatusFilter('PLANEJADA')}
            className={`px-2.5 py-1 rounded transition-colors ${
              statusFilter === 'PLANEJADA'
                ? 'bg-slate-900 text-white font-semibold'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Planejadas
          </button>
          <button
            onClick={() => setStatusFilter('EM_PROCESSO')}
            className={`px-2.5 py-1 rounded transition-colors ${
              statusFilter === 'EM_PROCESSO'
                ? 'bg-slate-900 text-white font-semibold'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Em Processo
          </button>
          <button
            onClick={() => setStatusFilter('CONCLUIDA')}
            className={`px-2.5 py-1 rounded transition-colors ${
              statusFilter === 'CONCLUIDA'
                ? 'bg-slate-900 text-white font-semibold'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Concluídas
          </button>
        </div>
      </div>

      {/* VIEW MODE 1: LIST / TABLE */}
      {viewMode === 'list' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Ordem de Produção</th>
                  <th className="px-4 py-3.5">Produto &amp; Lote</th>
                  <th className="px-4 py-3.5">Cronograma</th>
                  <th className="px-4 py-3.5">Etapa / Progresso</th>
                  <th className="px-4 py-3.5 text-center">Status</th>
                  <th className="px-5 py-3.5 text-right">Ações Operacionais</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOPs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-10 text-center text-slate-400">
                      <Factory className="w-8 h-8 mx-auto mb-2 opacity-40" />
                      Nenhuma ordem de produção encontrada com os critérios informados.
                    </td>
                  </tr>
                ) : (
                  filteredOPs.map((op) => {
                    const totalStages = op.stages.length;
                    const completedStages = op.stages.filter((s) => s.status === 'CONCLUIDO').length;
                    const progressPercent = totalStages > 0 ? Math.round((completedStages / totalStages) * 100) : 0;
                    const currentStage = op.stages[op.currentStageIndex];

                    return (
                      <tr key={op.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-slate-900">
                              {op.orderNumber}
                            </span>
                            <span
                              className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                op.priority === 'URGENTE'
                                  ? 'bg-rose-100 text-rose-800'
                                  : op.priority === 'ALTA'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {op.priority}
                            </span>
                          </div>
                          {op.saleOrderNumber && (
                            <div className="text-xs text-slate-500 mt-0.5">
                              Pedido: <span className="font-medium text-slate-700">{op.saleOrderNumber}</span>
                              {op.clientName && ` · ${op.clientName}`}
                            </div>
                          )}
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            RT: {op.technicalResponsible?.name || settings.technicalResponsible.name}
                          </div>
                        </td>

                        <td className="px-4 py-4">
                          <div className="font-semibold text-slate-900 text-sm">
                            {op.productName}
                          </div>
                          <div className="text-xs text-slate-500 font-mono">
                            Código: {op.productCode} · Lote:{' '}
                            <span className="font-bold text-slate-900">{op.quantityPlanned} un</span>
                          </div>
                        </td>

                        <td className="px-4 py-4 text-xs">
                          <div className="text-slate-600">
                            Início: <span className="font-mono">{formatDate(op.startDate)}</span>
                          </div>
                          <div className="text-slate-800 font-medium">
                            Entrega: <span className="font-mono">{formatDate(op.expectedEndDate)}</span>
                          </div>
                          {op.completedAt && (
                            <div className="text-emerald-700 text-[11px] font-semibold mt-0.5">
                              Baixada em: {formatDateTime(op.completedAt)}
                            </div>
                          )}
                        </td>

                        <td className="px-4 py-4">
                          <div className="w-44 space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-slate-500 truncate max-w-[120px]">
                                {currentStage ? currentStage.name : 'Finalizado'}
                              </span>
                              <span className="font-mono font-semibold text-slate-700">
                                {progressPercent}%
                              </span>
                            </div>
                            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  op.status === 'CONCLUIDA' ? 'bg-emerald-600' : 'bg-blue-600'
                                }`}
                                style={{ width: `${progressPercent}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-4 text-center">
                          <span
                            className={`text-xs font-semibold px-2.5 py-1 rounded inline-block ${
                              op.status === 'CONCLUIDA'
                                ? 'bg-emerald-50 text-emerald-700'
                                : op.status === 'EM_PROCESSO'
                                ? 'bg-blue-50 text-blue-700'
                                : op.status === 'AGUARDANDO_INSUMOS'
                                ? 'bg-amber-50 text-amber-700'
                                : op.status === 'CONTROLE_QUALIDADE'
                                ? 'bg-purple-50 text-purple-700'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {op.status.replace('_', ' ')}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-right space-x-1.5 whitespace-nowrap">
                          {/* Print OP */}
                          <button
                            onClick={() => setPrintOP(op)}
                            title="Visualizar e Imprimir Ordem de Produção"
                            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors inline-flex items-center gap-1 text-xs font-semibold border border-slate-200"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            Imprimir
                          </button>

                          {/* Advance Stage button if in process */}
                          {op.status !== 'CONCLUIDA' && op.status !== 'CANCELADA' && (
                            <button
                              onClick={() => handleAdvanceStage(op)}
                              title="Avançar para a próxima etapa fabril"
                              className="p-1.5 text-blue-700 hover:bg-blue-50 rounded transition-colors inline-flex items-center gap-1 text-xs font-semibold border border-blue-200"
                            >
                              <Play className="w-3 h-3 fill-current" />
                              Avançar Etapa
                            </button>
                          )}

                          {/* Dar Baixa (Conclusão) Button */}
                          {op.status !== 'CONCLUIDA' && (
                            <button
                              onClick={() => openCompleteModal(op)}
                              className="px-2.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded transition-colors inline-flex items-center gap-1 shadow-sm"
                              title="Dar Baixa na Ordem de Produção (Consome insumos e dá entrada no produto acabado)"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Dar Baixa
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW MODE 2: KANBAN DE CHÃO DE FÁBRICA */}
      {viewMode === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 overflow-x-auto min-h-[500px]">
          {kanbanColumns.map((col) => {
            const colOps = filteredOPs.filter((op) => op.status === col.status);

            return (
              <div
                key={col.status}
                className="bg-slate-100/70 rounded-xl p-3 border border-slate-200 flex flex-col min-w-[240px]"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200 font-semibold text-xs text-slate-800">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${col.color.replace('border-', 'bg-')}`} />
                    <span>{col.label}</span>
                  </div>
                  <span className="font-mono text-slate-500 bg-white px-2 py-0.5 rounded shadow-xs">
                    {colOps.length}
                  </span>
                </div>

                {/* Cards */}
                <div className="space-y-3 flex-1 overflow-y-auto">
                  {colOps.map((op) => {
                    const currentStage = op.stages[op.currentStageIndex];

                    return (
                      <div
                        key={op.id}
                        className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-sm space-y-2.5 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs font-bold text-slate-900">
                            {op.orderNumber}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                              op.priority === 'URGENTE'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {op.priority}
                          </span>
                        </div>

                        <div>
                          <div className="font-semibold text-xs text-slate-900 line-clamp-1">
                            {op.productName}
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                            Lote: {op.quantityPlanned} unidades
                          </div>
                        </div>

                        {currentStage && op.status !== 'CONCLUIDA' && (
                          <div className="text-[11px] p-1.5 bg-slate-50 rounded border border-slate-100 text-slate-700">
                            <span className="text-slate-400 block text-[10px]">Etapa atual:</span>
                            <span className="font-medium">{currentStage.name}</span>
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                          <button
                            onClick={() => setPrintOP(op)}
                            className="text-slate-500 hover:text-slate-800 flex items-center gap-1 text-[11px]"
                          >
                            <Printer className="w-3 h-3" />
                            Imprimir
                          </button>

                          {op.status !== 'CONCLUIDA' ? (
                            <button
                              onClick={() => openCompleteModal(op)}
                              className="text-emerald-700 font-semibold hover:underline text-[11px] flex items-center gap-0.5"
                            >
                              Baixar OP &rarr;
                            </button>
                          ) : (
                            <span className="text-emerald-600 font-semibold text-[11px] flex items-center gap-1">
                              <Check className="w-3 h-3" /> Concluída
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL 1: EMISSÃO DE NOVA ORDEM DE PRODUÇÃO */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in duration-150">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Emitir Nova Ordem de Produção (OP)
                </h2>
                <p className="text-xs text-slate-500">
                  Cálculo automático de matérias-primas e tempo de fabricação
                </p>
              </div>
              <button onClick={() => setIsNewModalOpen(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleCreateOP} className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Technical Responsible Reminder Banner */}
              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-lg flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-blue-900">
                  <Shield className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>
                    Responsável Técnico da Emissão:{' '}
                    <strong className="font-semibold">{settings.technicalResponsible.name}</strong> (
                    {settings.technicalResponsible.registration})
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Número da OP *
                  </label>
                  <input
                    type="text"
                    required
                    value={orderNumber}
                    onChange={(e) => setOrderNumber(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded p-2 font-mono font-bold"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Produto a Fabricar (Ficha Técnica) *
                  </label>
                  <select
                    value={selectedProductId}
                    onChange={(e) => setSelectedProductId(e.target.value)}
                    required
                    className="w-full text-xs border border-slate-300 rounded p-2 font-medium"
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.code} - {p.name} ({formatMinutes(p.totalProcessTimeMinutes)} / un)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Quantidade a Produzir (Lote) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={quantityPlanned}
                    onChange={(e) => setQuantityPlanned(parseInt(e.target.value, 10) || 1)}
                    className="w-full text-xs border border-slate-300 rounded p-2 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Vínculo com Pedido de Venda
                  </label>
                  <select
                    value={selectedSaleOrderId}
                    onChange={(e) => setSelectedSaleOrderId(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded p-2"
                  >
                    <option value="">Nenhum (Produção para Estoque)</option>
                    {saleOrders
                      .filter((s) => s.status !== 'CONCLUIDO')
                      .map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.orderNumber} - {s.clientName}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Prioridade
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as ProductionPriority)}
                    className="w-full text-xs border border-slate-300 rounded p-2 font-semibold"
                  >
                    <option value="BAIXA">Baixa</option>
                    <option value="MEDIA">Média</option>
                    <option value="ALTA">Alta</option>
                    <option value="URGENTE">Urgente</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Data de Início Prevista
                  </label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded p-2 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Previsão de Término
                  </label>
                  <input
                    type="date"
                    required
                    value={expectedEndDate}
                    onChange={(e) => setExpectedEndDate(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded p-2 font-mono"
                  />
                </div>
              </div>

              {/* Real-time BOM Requirement & Stock Check */}
              <div className="space-y-2 pt-2 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-blue-600" />
                    Cálculo Automático de Insumos para este Lote ({quantityPlanned} un)
                  </h3>
                  {allMaterialsAvailable ? (
                    <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Estoque 100% Disponível
                    </span>
                  ) : (
                    <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      Insumos Faltantes no Almoxarifado
                    </span>
                  )}
                </div>

                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                      <tr>
                        <th className="px-3 py-2">Matéria-Prima</th>
                        <th className="px-3 py-2 text-center">Unidade</th>
                        <th className="px-3 py-2 text-right">Qtd. Necessária</th>
                        <th className="px-3 py-2 text-right">Estoque Atual</th>
                        <th className="px-3 py-2 text-center">Disponibilidade</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {previewMaterials.map((mat) => (
                        <tr key={mat.rawMaterialId} className={!mat.isSufficient ? 'bg-amber-50/50' : ''}>
                          <td className="px-3 py-2 font-medium text-slate-800">
                            {mat.rawMaterialCode} - {mat.rawMaterialName}
                          </td>
                          <td className="px-3 py-2 text-center font-mono text-slate-600">
                            {mat.unit}
                          </td>
                          <td className="px-3 py-2 text-right font-mono font-bold text-slate-900">
                            {mat.requiredQuantity}
                          </td>
                          <td className="px-3 py-2 text-right font-mono text-slate-700">
                            {mat.currentStock}
                          </td>
                          <td className="px-3 py-2 text-center">
                            {mat.isSufficient ? (
                              <span className="text-emerald-700 font-semibold text-[11px]">
                                Suficiente
                              </span>
                            ) : (
                              <span className="text-rose-600 font-semibold text-[11px] flex items-center justify-center gap-1">
                                <AlertTriangle className="w-3 h-3" />
                                Falta {(mat.requiredQuantity - mat.currentStock).toFixed(1)} {mat.unit}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Instruções e Observações para o Chão de Fábrica
                </label>
                <textarea
                  rows={2}
                  value={opNotes}
                  onChange={(e) => setOpNotes(e.target.value)}
                  placeholder="Orientações técnicas, tolerâncias ou cuidados..."
                  className="w-full text-xs border border-slate-300 rounded p-2"
                />
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm"
                >
                  {isSaving ? 'Emitindo...' : 'Emitir Ordem de Produção'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: BAIXA (CONCLUSÃO) DA ORDEM DE PRODUÇÃO */}
      {completingOP && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in duration-150">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-emerald-50">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Baixa de Produção: {completingOP.orderNumber}
                  </h2>
                  <p className="text-xs text-slate-600">
                    Conclusão do lote e atualização automática do estoque
                  </p>
                </div>
              </div>
              <button onClick={() => setCompletingOP(null)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleConfirmCompletion} className="p-6 space-y-4">
              {/* Product Info */}
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1">
                <div>
                  <span className="text-slate-500">Produto:</span>{' '}
                  <strong className="text-slate-900">{completingOP.productName}</strong>
                </div>
                <div>
                  <span className="text-slate-500">Lote Planejado:</span>{' '}
                  <span className="font-mono font-bold text-slate-900">
                    {completingOP.quantityPlanned} unidades
                  </span>
                </div>
              </div>

              {/* Responsible Tech Badge */}
              <div className="p-2.5 rounded-lg border border-blue-200 bg-blue-50/70 text-xs flex items-center justify-between">
                <div>
                  <span className="text-slate-500 text-[10px] uppercase font-semibold block">
                    Responsável Técnico da Baixa
                  </span>
                  <span className="font-bold text-slate-900">
                    {settings.technicalResponsible.name}
                  </span>
                </div>
                <span className="font-mono text-slate-700 font-semibold text-[11px]">
                  {settings.technicalResponsible.registration}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Qtd. Efetivamente Produzida *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={producedQty}
                    onChange={(e) => setProducedQty(parseInt(e.target.value, 10) || 1)}
                    className="w-full text-xs border border-slate-300 rounded p-2 font-mono font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tempo Real Total Gasto (minutos)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={actualMinutes}
                    onChange={(e) => setActualMinutes(parseInt(e.target.value, 10) || 0)}
                    className="w-full text-xs border border-slate-300 rounded p-2 font-mono"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Equivalente a {formatMinutes(actualMinutes)}
                  </span>
                </div>
              </div>

              {/* Notice of automatic stock deduction */}
              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-900 space-y-1">
                <div className="font-semibold flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  Operações que serão executadas ao confirmar:
                </div>
                <ul className="list-disc list-inside text-[11px] space-y-0.5 text-amber-800">
                  <li>Baixa automática das matérias-primas da Ficha Técnica do estoque</li>
                  <li>Incremento de +{producedQty} un no estoque de produto acabado</li>
                  <li>Registro de log de movimentação de insumos para rastreabilidade</li>
                  <li>Encerramento formal da OP com data e carimbo do Responsável Técnico</li>
                </ul>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Parecer do Controle de Qualidade / Observações de Fechamento
                </label>
                <textarea
                  rows={2}
                  value={completionNotes}
                  onChange={(e) => setCompletionNotes(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded p-2"
                />
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setCompletingOP(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isCompleting}
                  className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm flex items-center gap-1.5"
                >
                  <FileCheck2 className="w-4 h-4" />
                  {isCompleting ? 'Baixando...' : 'Confirmar Baixa da Produção'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: IMPRESSÃO FORMAL DA ORDEM DE PRODUÇÃO */}
      {printOP && (
        <ProductionOrderPrintModal
          op={printOP}
          settings={settings}
          onClose={() => setPrintOP(null)}
        />
      )}
    </div>
  );
};
