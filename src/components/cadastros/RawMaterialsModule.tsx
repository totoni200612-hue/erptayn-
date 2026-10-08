import React, { useState } from 'react';
import {
  Boxes,
  Plus,
  Search,
  Edit2,
  Trash2,
  AlertTriangle,
  ArrowUpDown,
  FileSpreadsheet,
  X,
  History,
  CheckCircle,
} from 'lucide-react';
import { RawMaterial, StockMovement, Supplier } from '../../types/erp';
import { formatCurrency, formatDateTime } from '../../utils/formatters';

interface RawMaterialsModuleProps {
  rawMaterials: RawMaterial[];
  suppliers: Supplier[];
  stockMovements: StockMovement[];
  onSaveRawMaterial: (material: RawMaterial) => Promise<any>;
  onDeleteRawMaterial: (id: string) => Promise<void>;
  onAdjustStock: (id: string, newStock: number, notes?: string) => Promise<void>;
}

export const RawMaterialsModule: React.FC<RawMaterialsModuleProps> = ({
  rawMaterials,
  suppliers,
  stockMovements,
  onSaveRawMaterial,
  onDeleteRawMaterial,
  onAdjustStock,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLowStock, setFilterLowStock] = useState(false);
  const [activeTab, setActiveTab] = useState<'inventory' | 'movements'>('inventory');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<RawMaterial | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [unit, setUnit] = useState('un');
  const [currentStock, setCurrentStock] = useState<number>(0);
  const [minStock, setMinStock] = useState<number>(0);
  const [unitCost, setUnitCost] = useState<number>(0);
  const [preferredSupplierId, setPreferredSupplierId] = useState('');
  const [location, setLocation] = useState('');

  // Quick Adjust Modal
  const [adjustMaterial, setAdjustMaterial] = useState<RawMaterial | null>(null);
  const [adjustQty, setAdjustQty] = useState<number>(0);
  const [adjustNotes, setAdjustNotes] = useState('');

  const filteredMaterials = rawMaterials.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.location?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLow = filterLowStock ? m.currentStock <= m.minStock : true;
    return matchesSearch && matchesLow;
  });

  const lowStockCount = rawMaterials.filter((m) => m.currentStock <= m.minStock).length;
  const totalInventoryValue = rawMaterials.reduce(
    (sum, m) => sum + (Number(m.currentStock) || 0) * (Number(m.unitCost) || 0),
    0
  );

  const openNewModal = () => {
    setSelectedMaterial(null);
    setCode(`MP-${Math.floor(100 + Math.random() * 900)}`);
    setName('');
    setUnit('un');
    setCurrentStock(0);
    setMinStock(10);
    setUnitCost(0);
    setPreferredSupplierId(suppliers[0]?.id || '');
    setLocation('');
    setIsModalOpen(true);
  };

  const openEditModal = (material: RawMaterial) => {
    setSelectedMaterial(material);
    setCode(material.code);
    setName(material.name);
    setUnit(material.unit);
    setCurrentStock(material.currentStock);
    setMinStock(material.minStock);
    setUnitCost(material.unitCost);
    setPreferredSupplierId(material.preferredSupplierId || '');
    setLocation(material.location || '');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSaving(true);
    try {
      const supplier = suppliers.find((s) => s.id === preferredSupplierId);
      const dataToSave: RawMaterial = {
        id: selectedMaterial ? selectedMaterial.id : '',
        code: code.trim(),
        name: name.trim(),
        unit,
        currentStock: Number(currentStock) || 0,
        minStock: Number(minStock) || 0,
        unitCost: Number(unitCost) || 0,
        preferredSupplierId,
        preferredSupplierName: supplier ? supplier.name : '',
        location: location.trim(),
        updatedAt: new Date().toISOString(),
      };

      await onSaveRawMaterial(dataToSave);
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleQuickAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustMaterial) return;
    try {
      await onAdjustStock(adjustMaterial.id, adjustQty, adjustNotes);
      setAdjustMaterial(null);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Almoxarifado &amp; Matéria-Prima
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Controle de estoque de insumos, estoque mínimo e histórico de baixas fabris
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={openNewModal}
            className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            + Nova Matéria-Prima
          </button>
        </div>
      </div>

      {/* Metric summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs text-slate-500">Total de Itens Cadastrados</div>
          <div className="text-2xl font-bold text-slate-900 font-mono mt-1">
            {rawMaterials.length}
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs text-slate-500">Valor Imobilizado em Insumos</div>
          <div className="text-2xl font-bold text-slate-900 font-mono mt-1">
            {formatCurrency(totalInventoryValue)}
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs text-slate-500">Itens em Ponto de Reposição</div>
          <div className={`text-2xl font-bold font-mono mt-1 ${lowStockCount > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
            {lowStockCount} {lowStockCount === 1 ? 'item' : 'itens'}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-6">
        <button
          onClick={() => setActiveTab('inventory')}
          className={`pb-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'inventory'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Boxes className="w-4 h-4" />
          Estoque Atual ({rawMaterials.length})
        </button>
        <button
          onClick={() => setActiveTab('movements')}
          className={`pb-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'movements'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <History className="w-4 h-4" />
          Histórico de Movimentações &amp; Baixas de OPs ({stockMovements.length})
        </button>
      </div>

      {activeTab === 'inventory' && (
        <div className="space-y-4">
          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-lg border border-slate-200">
            <div className="flex items-center gap-2 w-full sm:w-96">
              <Search className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por código, nome, localização..."
                className="w-full text-xs outline-none text-slate-800 placeholder-slate-400 bg-transparent"
              />
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button
                onClick={() => setFilterLowStock(!filterLowStock)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors flex items-center gap-1.5 ${
                  filterLowStock
                    ? 'bg-rose-50 text-rose-700 border-rose-300'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                Apenas estoque baixo ({lowStockCount})
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-700">
                <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-3.5">Código / Descrição</th>
                    <th className="px-4 py-3.5 text-center">Unidade</th>
                    <th className="px-4 py-3.5 text-right">Estoque Atual</th>
                    <th className="px-4 py-3.5 text-right">Estoque Mínimo</th>
                    <th className="px-4 py-3.5 text-right">Custo Unitário</th>
                    <th className="px-4 py-3.5 text-right">Valor Total</th>
                    <th className="px-4 py-3.5">Fornecedor / Local</th>
                    <th className="px-5 py-3.5 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredMaterials.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-5 py-10 text-center text-slate-400">
                        <Boxes className="w-8 h-8 mx-auto mb-2 opacity-40" />
                        Nenhuma matéria-prima encontrada com os filtros atuais.
                      </td>
                    </tr>
                  ) : (
                    filteredMaterials.map((mat) => {
                      const isLow = mat.currentStock <= mat.minStock;
                      const totalVal = (Number(mat.currentStock) || 0) * (Number(mat.unitCost) || 0);

                      return (
                        <tr
                          key={mat.id}
                          className={`hover:bg-slate-50/80 transition-colors ${
                            isLow ? 'bg-rose-50/20' : ''
                          }`}
                        >
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-bold text-slate-900">
                                {mat.code}
                              </span>
                              {isLow && (
                                <span className="text-[10px] font-semibold text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded flex items-center gap-1">
                                  <AlertTriangle className="w-3 h-3" />
                                  Reposição
                                </span>
                              )}
                            </div>
                            <div className="font-semibold text-slate-900 text-sm">
                              {mat.name}
                            </div>
                          </td>
                          <td className="px-4 py-4 text-center font-mono text-xs text-slate-600">
                            {mat.unit}
                          </td>
                          <td className="px-4 py-4 text-right">
                            <div
                              className={`font-mono tabular-nums font-bold text-sm ${
                                isLow ? 'text-rose-600' : 'text-slate-900'
                              }`}
                            >
                              {mat.currentStock}
                            </div>
                          </td>
                          <td className="px-4 py-4 text-right font-mono tabular-nums text-slate-500 text-xs">
                            {mat.minStock}
                          </td>
                          <td className="px-4 py-4 text-right font-mono tabular-nums text-slate-700 text-xs">
                            {formatCurrency(mat.unitCost)}
                          </td>
                          <td className="px-4 py-4 text-right font-mono tabular-nums font-semibold text-slate-900 text-xs">
                            {formatCurrency(totalVal)}
                          </td>
                          <td className="px-4 py-4 text-xs text-slate-500">
                            <div className="font-medium text-slate-800 truncate max-w-[180px]">
                              {mat.preferredSupplierName || '-'}
                            </div>
                            {mat.location && (
                              <div className="text-[11px] text-slate-400">
                                Local: {mat.location}
                              </div>
                            )}
                          </td>
                          <td className="px-5 py-4 text-right space-x-1 whitespace-nowrap">
                            <button
                              onClick={() => {
                                setAdjustMaterial(mat);
                                setAdjustQty(mat.currentStock);
                                setAdjustNotes('Ajuste de inventário');
                              }}
                              title="Ajuste rápido de estoque"
                              className="px-2 py-1 text-[11px] font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded transition-colors"
                            >
                              Ajustar
                            </button>
                            <button
                              onClick={() => openEditModal(mat)}
                              title="Editar Matéria-Prima"
                              className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Excluir a matéria-prima "${mat.name}"?`)) {
                                  onDeleteRawMaterial(mat.id);
                                }
                              }}
                              title="Excluir Matéria-Prima"
                              className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Movements Tab */}
      {activeTab === 'movements' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900">
              Movimentações e Baixas Fabris de Matéria-Prima
            </h3>
            <span className="text-xs text-slate-500">
              Rastreabilidade de consumo por Ordem de Produção
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3">Data / Hora</th>
                  <th className="px-4 py-3">Tipo</th>
                  <th className="px-4 py-3">Matéria-Prima</th>
                  <th className="px-4 py-3 text-right">Quantidade</th>
                  <th className="px-4 py-3">Documento Ref.</th>
                  <th className="px-4 py-3">Responsável</th>
                  <th className="px-5 py-3">Observações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stockMovements.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-8 text-center text-slate-400">
                      Nenhuma movimentação registrada até o momento.
                    </td>
                  </tr>
                ) : (
                  stockMovements.map((mov) => (
                    <tr key={mov.id} className="hover:bg-slate-50">
                      <td className="px-5 py-3 font-mono text-slate-600">
                        {formatDateTime(mov.date)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`font-semibold px-2 py-0.5 rounded text-[10px] ${
                            mov.type === 'SAIDA_OP'
                              ? 'bg-rose-50 text-rose-700'
                              : mov.type === 'ENTRADA'
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {mov.type === 'SAIDA_OP'
                            ? 'BAIXA PRODUÇÃO'
                            : mov.type === 'ENTRADA'
                            ? 'ENTRADA COMPRA'
                            : 'AJUSTE'}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-900">
                        {mov.rawMaterialName}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-semibold tabular-nums">
                        {mov.type === 'SAIDA_OP' ? '-' : '+'}
                        {mov.quantity}
                      </td>
                      <td className="px-4 py-3 font-mono font-bold text-slate-800">
                        {mov.referenceDoc}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {mov.responsibleName || 'Sistema'}
                      </td>
                      <td className="px-5 py-3 text-slate-500">
                        {mov.notes || '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Cadastro/Edição de Matéria-Prima */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-xl overflow-hidden animate-in fade-in duration-150">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h2 className="text-base font-bold text-slate-900">
                {selectedMaterial ? 'Editar Matéria-Prima' : 'Nova Matéria-Prima'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Código / SKU *
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
                    Unidade de Medida *
                  </label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded p-2"
                  >
                    <option value="un">un (Unidade)</option>
                    <option value="kg">kg (Quilograma)</option>
                    <option value="m">m (Metro Linear)</option>
                    <option value="m²">m² (Metro Quadrado)</option>
                    <option value="litro">litro (Litro)</option>
                    <option value="pacote">pacote (Pacote/Caixa)</option>
                    <option value="rolo">rolo (Rolo)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nome / Descrição da Matéria-Prima *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Chapa MDF 18mm Carvalho Hanover"
                  className="w-full text-xs border border-slate-300 rounded p-2"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Estoque Inicial
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={currentStock}
                    onChange={(e) => setCurrentStock(parseFloat(e.target.value) || 0)}
                    className="w-full text-xs border border-slate-300 rounded p-2 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Estoque Mínimo (Alerta)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={minStock}
                    onChange={(e) => setMinStock(parseFloat(e.target.value) || 0)}
                    className="w-full text-xs border border-slate-300 rounded p-2 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Custo Unitário (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={unitCost}
                    onChange={(e) => setUnitCost(parseFloat(e.target.value) || 0)}
                    className="w-full text-xs border border-slate-300 rounded p-2 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Fornecedor Preferencial
                  </label>
                  <select
                    value={preferredSupplierId}
                    onChange={(e) => setPreferredSupplierId(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded p-2"
                  >
                    <option value="">Selecione um fornecedor...</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Localização no Almoxarifado
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Ex: Rack A-02 / Prateleira 4"
                    className="w-full text-xs border border-slate-300 rounded p-2"
                  />
                </div>
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
                  {isSaving ? 'Salvando...' : 'Salvar Matéria-Prima'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Adjust Modal */}
      {adjustMaterial && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-sm font-bold text-slate-900">
                Ajuste de Estoque: {adjustMaterial.name}
              </h3>
              <button onClick={() => setAdjustMaterial(null)}>
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleQuickAdjustSubmit} className="space-y-4">
              <div className="text-xs text-slate-500">
                Estoque atual registrado:{' '}
                <span className="font-mono font-bold text-slate-900">
                  {adjustMaterial.currentStock} {adjustMaterial.unit}
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Novo Saldo de Estoque ({adjustMaterial.unit})
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(parseFloat(e.target.value) || 0)}
                  className="w-full text-sm border border-slate-300 rounded p-2 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Motivo / Observação do Ajuste
                </label>
                <input
                  type="text"
                  value={adjustNotes}
                  onChange={(e) => setAdjustNotes(e.target.value)}
                  placeholder="Ex: Contagem de inventário físico, refugo, compra..."
                  className="w-full text-xs border border-slate-300 rounded p-2"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setAdjustMaterial(null)}
                  className="px-3 py-1.5 text-xs text-slate-600"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                >
                  Confirmar Novo Saldo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
