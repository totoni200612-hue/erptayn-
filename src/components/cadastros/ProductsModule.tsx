import React, { useState } from 'react';
import {
  Layers,
  Plus,
  Search,
  Edit2,
  Trash2,
  Clock,
  Boxes,
  DollarSign,
  X,
  PlusCircle,
  AlertCircle,
  PackagePlus,
  Check,
} from 'lucide-react';
import { BomItem, ProcessStage, Product, RawMaterial, Supplier, WorkCenter } from '../../types/erp';
import { formatCurrency, formatMinutes } from '../../utils/formatters';

interface ProductsModuleProps {
  products: Product[];
  rawMaterials: RawMaterial[];
  workCenters: WorkCenter[];
  suppliers?: Supplier[];
  onSaveProduct: (product: Product) => Promise<void>;
  onDeleteProduct: (id: string) => Promise<void>;
  onSaveRawMaterial?: (material: RawMaterial) => Promise<RawMaterial | undefined | void>;
}

export const ProductsModule: React.FC<ProductsModuleProps> = ({
  products,
  rawMaterials,
  workCenters,
  suppliers = [],
  onSaveProduct,
  onDeleteProduct,
  onSaveRawMaterial,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [activeTab, setActiveTab] = useState<'info' | 'stages' | 'bom'>('info');
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [unit, setUnit] = useState('un');
  const [suggestedSalePrice, setSuggestedSalePrice] = useState<number>(0);
  const [currentStock, setCurrentStock] = useState<number>(0);
  const [processStages, setProcessStages] = useState<ProcessStage[]>([]);
  const [bom, setBom] = useState<BomItem[]>([]);

  // Quick Raw Material Creation State (inside Ficha Técnica)
  const [isQuickMaterialOpen, setIsQuickMaterialOpen] = useState(false);
  const [quickMatCode, setQuickMatCode] = useState('');
  const [quickMatName, setQuickMatName] = useState('');
  const [quickMatUnit, setQuickMatUnit] = useState('un');
  const [quickMatCost, setQuickMatCost] = useState<number>(0);
  const [quickMatStock, setQuickMatStock] = useState<number>(10);
  const [quickMatMinStock, setQuickMatMinStock] = useState<number>(5);
  const [quickMatQtyInBOM, setQuickMatQtyInBOM] = useState<number>(1);
  const [quickMatScrap, setQuickMatScrap] = useState<number>(5);
  const [quickMatSupplierId, setQuickMatSupplierId] = useState('');
  const [isSavingQuickMat, setIsSavingQuickMat] = useState(false);

  const openQuickMaterial = () => {
    const nextSeq = Math.floor(100 + Math.random() * 900);
    setQuickMatCode(`MP-${nextSeq}`);
    setQuickMatName('');
    setQuickMatUnit('un');
    setQuickMatCost(0);
    setQuickMatStock(10);
    setQuickMatMinStock(5);
    setQuickMatQtyInBOM(1);
    setQuickMatScrap(5);
    setQuickMatSupplierId(suppliers[0]?.id || '');
    setIsQuickMaterialOpen(true);
  };

  const handleSaveQuickMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickMatName.trim()) return;

    setIsSavingQuickMat(true);
    try {
      const newId = `mat-${Date.now()}`;
      const supplier = suppliers.find((s) => s.id === quickMatSupplierId);
      const newMaterial: RawMaterial = {
        id: newId,
        code: quickMatCode.trim(),
        name: quickMatName.trim(),
        unit: quickMatUnit,
        currentStock: Number(quickMatStock) || 0,
        minStock: Number(quickMatMinStock) || 0,
        unitCost: Number(quickMatCost) || 0,
        preferredSupplierId: quickMatSupplierId,
        preferredSupplierName: supplier ? supplier.name : '',
        location: 'Almoxarifado Principal',
        updatedAt: new Date().toISOString(),
      };

      let resolvedId = newId;
      if (onSaveRawMaterial) {
        const saved = await onSaveRawMaterial(newMaterial);
        if (saved && saved.id) {
          resolvedId = saved.id;
        }
      }

      // Add directly to current BOM
      const newBomItem: BomItem = {
        rawMaterialId: resolvedId,
        rawMaterialCode: newMaterial.code,
        rawMaterialName: newMaterial.name,
        unit: newMaterial.unit,
        quantityPerUnit: Number(quickMatQtyInBOM) || 1,
        scrapPercentage: Number(quickMatScrap) || 0,
        unitCost: newMaterial.unitCost,
      };

      setBom((prev) => [...prev, newBomItem]);
      setIsQuickMaterialOpen(false);
    } catch (err) {
      console.error('Erro ao cadastrar matéria-prima rápida:', err);
    } finally {
      setIsSavingQuickMat(false);
    }
  };

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openNewModal = () => {
    setSelectedProduct(null);
    setCode(`PRD-${Math.floor(100 + Math.random() * 900)}`);
    setName('');
    setDescription('');
    setUnit('un');
    setSuggestedSalePrice(0);
    setCurrentStock(0);
    setProcessStages([
      {
        id: `ps-${Date.now()}-1`,
        name: 'Corte e Preparação',
        workCenterId: workCenters[0]?.id || '',
        workCenterName: workCenters[0]?.name || 'Centro Padrão',
        timeMinutes: 20,
        order: 1,
      },
      {
        id: `ps-${Date.now()}-2`,
        name: 'Montagem e Acabamento',
        workCenterId: workCenters[workCenters.length - 1]?.id || '',
        workCenterName: workCenters[workCenters.length - 1]?.name || 'Montagem',
        timeMinutes: 30,
        order: 2,
      },
    ]);
    setBom([]);
    setActiveTab('info');
    setIsModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    setSelectedProduct(product);
    setCode(product.code);
    setName(product.name);
    setDescription(product.description || '');
    setUnit(product.unit || 'un');
    setSuggestedSalePrice(product.suggestedSalePrice || 0);
    setCurrentStock(product.currentStock || 0);
    setProcessStages(product.processStages ? JSON.parse(JSON.stringify(product.processStages)) : []);
    setBom(product.bom ? JSON.parse(JSON.stringify(product.bom)) : []);
    setActiveTab('info');
    setIsModalOpen(true);
  };

  // Stage Helpers
  const addStage = () => {
    const firstWc = workCenters[0];
    const newStage: ProcessStage = {
      id: `ps-${Date.now()}`,
      name: `Nova Etapa ${processStages.length + 1}`,
      workCenterId: firstWc?.id || '',
      workCenterName: firstWc?.name || 'Centro',
      timeMinutes: 15,
      order: processStages.length + 1,
    };
    setProcessStages([...processStages, newStage]);
  };

  const updateStage = (index: number, field: keyof ProcessStage, value: any) => {
    const updated = [...processStages];
    if (field === 'workCenterId') {
      const wc = workCenters.find((w) => w.id === value);
      updated[index].workCenterId = value;
      updated[index].workCenterName = wc ? wc.name : '';
    } else {
      (updated[index] as any)[field] = value;
    }
    setProcessStages(updated);
  };

  const removeStage = (index: number) => {
    const updated = processStages.filter((_, i) => i !== index);
    setProcessStages(updated.map((s, idx) => ({ ...s, order: idx + 1 })));
  };

  // BOM Helpers
  const addBomItem = (rawMaterialId: string) => {
    const mat = rawMaterials.find((m) => m.id === rawMaterialId);
    if (!mat) return;
    if (bom.some((b) => b.rawMaterialId === rawMaterialId)) return;

    const newItem: BomItem = {
      rawMaterialId: mat.id,
      rawMaterialCode: mat.code,
      rawMaterialName: mat.name,
      unit: mat.unit,
      quantityPerUnit: 1,
      scrapPercentage: 5,
      unitCost: mat.unitCost,
    };
    setBom([...bom, newItem]);
  };

  const updateBomItem = (index: number, field: keyof BomItem, value: any) => {
    const updated = [...bom];
    (updated[index] as any)[field] = value;
    setBom(updated);
  };

  const removeBomItem = (index: number) => {
    setBom(bom.filter((_, i) => i !== index));
  };

  // Calculated totals
  const totalProcessMinutes = processStages.reduce(
    (sum, stage) => sum + (Number(stage.timeMinutes) || 0),
    0
  );

  const calculatedBomCost = bom.reduce((sum, item) => {
    const scrapMultiplier = 1 + (Number(item.scrapPercentage) || 0) / 100;
    return sum + (Number(item.quantityPerUnit) || 0) * (Number(item.unitCost) || 0) * scrapMultiplier;
  }, 0);

  const profitMarginPercent =
    suggestedSalePrice > 0
      ? Math.round(((suggestedSalePrice - calculatedBomCost) / suggestedSalePrice) * 100)
      : 0;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSaving(true);
    try {
      const productData: Product = {
        id: selectedProduct ? selectedProduct.id : '',
        code: code.trim(),
        name: name.trim(),
        description: description.trim(),
        unit,
        suggestedSalePrice: Number(suggestedSalePrice) || 0,
        currentStock: Number(currentStock) || 0,
        totalProcessTimeMinutes: totalProcessMinutes,
        processStages,
        bom,
        calculatedMaterialCost: Math.round(calculatedBomCost * 100) / 100,
        createdAt: selectedProduct?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await onSaveProduct(productData);
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Module Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Fichas Técnicas dos Produtos (BOM)
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Definição de tempos de processo, etapas de produção e estrutura de matérias-primas
          </p>
        </div>

        <button
          onClick={openNewModal}
          className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm flex items-center gap-1.5 self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          + Nova Ficha Técnica
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-3 bg-white p-3 rounded-lg border border-slate-200">
        <Search className="w-4 h-4 text-slate-400 shrink-0" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar produto por nome, código ou descrição..."
          className="w-full text-sm outline-none text-slate-800 placeholder-slate-400 bg-transparent"
        />
        {searchTerm && (
          <button onClick={() => setSearchTerm('')} className="text-xs text-slate-400 hover:text-slate-600">
            Limpar
          </button>
        )}
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Código / Produto</th>
                <th className="px-4 py-3.5 text-center">Tempo de Processo</th>
                <th className="px-4 py-3.5 text-center">Insumos (BOM)</th>
                <th className="px-4 py-3.5 text-right">Custo Insumos</th>
                <th className="px-4 py-3.5 text-right">Preço de Venda</th>
                <th className="px-4 py-3.5 text-center">Estoque Acabado</th>
                <th className="px-5 py-3.5 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-slate-400">
                    <Layers className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    Nenhum produto cadastrado com os critérios de busca.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => {
                  return (
                    <tr key={product.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-5 py-4">
                        <div className="font-mono text-xs font-bold text-slate-900">
                          {product.code}
                        </div>
                        <div className="font-semibold text-slate-900 text-sm">
                          {product.name}
                        </div>
                        {product.description && (
                          <div className="text-xs text-slate-500 line-clamp-1 max-w-sm">
                            {product.description}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-4 text-center">
                        <div className="inline-flex items-center gap-1.5 text-slate-800 font-mono font-medium text-xs bg-slate-100 px-2.5 py-1 rounded">
                          <Clock className="w-3.5 h-3.5 text-slate-500" />
                          <span>{formatMinutes(product.totalProcessTimeMinutes)}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {product.processStages?.length || 0} etapas
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className="font-mono text-xs text-slate-700">
                          {product.bom?.length || 0} itens
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right font-mono tabular-nums font-semibold text-slate-700">
                        {formatCurrency(product.calculatedMaterialCost)}
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="font-mono tabular-nums font-bold text-slate-900">
                          {formatCurrency(product.suggestedSalePrice)}
                        </div>
                        {product.suggestedSalePrice > 0 && product.calculatedMaterialCost > 0 && (
                          <div className="text-[11px] text-emerald-600 font-medium">
                            Margem:{' '}
                            {Math.round(
                              ((product.suggestedSalePrice - product.calculatedMaterialCost) /
                                product.suggestedSalePrice) *
                                100
                            )}
                            %
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-4 text-center font-mono tabular-nums font-semibold text-slate-800">
                        {product.currentStock} {product.unit}
                      </td>
                      <td className="px-5 py-4 text-right space-x-2">
                        <button
                          onClick={() => openEditModal(product)}
                          title="Editar Ficha Técnica"
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Excluir o produto "${product.name}"?`)) {
                              onDeleteProduct(product.id);
                            }
                          }}
                          title="Excluir Produto"
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

      {/* Modal Cadastro/Edição de Ficha Técnica */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  {selectedProduct ? `Editar Ficha Técnica: ${name}` : 'Nova Ficha Técnica de Produto'}
                </h2>
                <p className="text-xs text-slate-500">
                  Definição dos tempos de processo e lista de materiais (BOM)
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="px-6 border-b border-slate-200 flex gap-4 bg-white">
              <button
                type="button"
                onClick={() => setActiveTab('info')}
                className={`py-3 text-xs font-semibold border-b-2 transition-colors ${
                  activeTab === 'info'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                1. Dados Gerais &amp; Preço
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('stages')}
                className={`py-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
                  activeTab === 'stages'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                2. Tempos de Processo ({formatMinutes(totalProcessMinutes)})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('bom')}
                className={`py-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
                  activeTab === 'bom'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Boxes className="w-3.5 h-3.5" />
                3. Matérias-Primas (BOM - {bom.length} itens)
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* TAB 1: DADOS GERAIS */}
              {activeTab === 'info' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Código / SKU *
                    </label>
                    <input
                      type="text"
                      required
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      className="w-full text-sm border border-slate-300 rounded-lg p-2.5 outline-none focus:border-blue-600 font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Unidade de Medida
                    </label>
                    <select
                      value={unit}
                      onChange={(e) => setUnit(e.target.value)}
                      className="w-full text-sm border border-slate-300 rounded-lg p-2.5 outline-none focus:border-blue-600"
                    >
                      <option value="un">un (Unidade)</option>
                      <option value="conjunto">conjunto (Conjunto)</option>
                      <option value="metro">metro (Metro Linear)</option>
                      <option value="m²">m² (Metro Quadrado)</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Nome do Produto *
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ex: Mesa de Jantar Industrial Loft 1,60m"
                      className="w-full text-sm border border-slate-300 rounded-lg p-2.5 outline-none focus:border-blue-600"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Descrição &amp; Especificação Técnica
                    </label>
                    <textarea
                      rows={3}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Detalhes construtivos, acabamentos e especificações..."
                      className="w-full text-sm border border-slate-300 rounded-lg p-2.5 outline-none focus:border-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Preço de Venda Sugerido (R$)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={suggestedSalePrice}
                      onChange={(e) => setSuggestedSalePrice(parseFloat(e.target.value) || 0)}
                      className="w-full text-sm border border-slate-300 rounded-lg p-2.5 outline-none focus:border-blue-600 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Estoque Atual de Produto Acabado
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={currentStock}
                      onChange={(e) => setCurrentStock(parseInt(e.target.value, 10) || 0)}
                      className="w-full text-sm border border-slate-300 rounded-lg p-2.5 outline-none focus:border-blue-600 font-mono"
                    />
                  </div>

                  {/* Summary Box */}
                  <div className="md:col-span-2 p-4 rounded-lg bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <div className="text-xs text-slate-500">Custo Total em Matéria-Prima (BOM)</div>
                      <div className="text-lg font-bold font-mono text-slate-900">
                        {formatCurrency(calculatedBomCost)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500">Tempo Total de Processo Fabricação</div>
                      <div className="text-lg font-bold font-mono text-slate-900">
                        {formatMinutes(totalProcessMinutes)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500">Margem Bruta Estimada</div>
                      <div className="text-lg font-bold font-mono text-emerald-600">
                        {profitMarginPercent}%
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: TEMPOS DE PROCESSO & ETAPAS */}
              {activeTab === 'stages' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900">
                        Roteiro de Fabricação &amp; Tempos por Unidade
                      </h3>
                      <p className="text-xs text-slate-500">
                        Tempo total calculado:{' '}
                        <span className="font-mono font-bold text-slate-900">
                          {formatMinutes(totalProcessMinutes)}
                        </span>{' '}
                        ({totalProcessMinutes} minutos por unidade produzida)
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={addStage}
                      className="px-3 py-1.5 text-xs font-semibold text-blue-600 border border-blue-200 hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Adicionar Etapa
                    </button>
                  </div>

                  {processStages.length === 0 ? (
                    <div className="p-6 text-center text-slate-400 border border-dashed border-slate-300 rounded-lg">
                      Nenhuma etapa de processo configurada. Clique em "Adicionar Etapa".
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {processStages.map((stage, index) => (
                        <div
                          key={stage.id || index}
                          className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/70 flex flex-col md:flex-row md:items-center gap-3"
                        >
                          <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0">
                            {index + 1}
                          </div>

                          <div className="flex-1">
                            <label className="block text-[11px] font-semibold text-slate-500 mb-0.5">
                              Nome da Etapa
                            </label>
                            <input
                              type="text"
                              value={stage.name}
                              onChange={(e) => updateStage(index, 'name', e.target.value)}
                              placeholder="Ex: Corte de Perfis"
                              className="w-full text-xs border border-slate-300 rounded p-2 bg-white"
                            />
                          </div>

                          <div className="w-full md:w-56">
                            <label className="block text-[11px] font-semibold text-slate-500 mb-0.5">
                              Centro de Trabalho / Máquina
                            </label>
                            <select
                              value={stage.workCenterId}
                              onChange={(e) => updateStage(index, 'workCenterId', e.target.value)}
                              className="w-full text-xs border border-slate-300 rounded p-2 bg-white"
                            >
                              {workCenters.map((wc) => (
                                <option key={wc.id} value={wc.id}>
                                  {wc.name}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="w-full md:w-36">
                            <label className="block text-[11px] font-semibold text-slate-500 mb-0.5">
                              Tempo (minutos/un)
                            </label>
                            <input
                              type="number"
                              min="1"
                              value={stage.timeMinutes}
                              onChange={(e) =>
                                updateStage(index, 'timeMinutes', parseInt(e.target.value, 10) || 0)
                              }
                              className="w-full text-xs border border-slate-300 rounded p-2 bg-white font-mono"
                            />
                          </div>

                          <button
                            type="button"
                            onClick={() => removeStage(index)}
                            className="p-2 text-slate-400 hover:text-rose-600 transition-colors self-end md:self-center"
                            title="Remover Etapa"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: MATÉRIAS-PRIMAS (BOM) */}
              {activeTab === 'bom' && (
                <div className="space-y-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900">
                        Estrutura do Produto (Bill of Materials)
                      </h3>
                      <p className="text-xs text-slate-500">
                        Custo total de insumos por unidade:{' '}
                        <span className="font-mono font-bold text-slate-900">
                          {formatCurrency(calculatedBomCost)}
                        </span>
                      </p>
                    </div>

                    {/* Actions: Add Existing or Register New Material */}
                    <div className="flex flex-wrap items-center gap-2">
                      <select
                        id="rawMaterialSelect"
                        className="text-xs border border-slate-300 rounded-lg p-2 bg-white"
                        defaultValue=""
                        onChange={(e) => {
                          if (e.target.value) {
                            addBomItem(e.target.value);
                            e.target.value = '';
                          }
                        }}
                      >
                        <option value="" disabled>
                          + Adicionar Insumo do Almoxarifado...
                        </option>
                        {rawMaterials.map((mat) => (
                          <option key={mat.id} value={mat.id}>
                            {mat.code} - {mat.name} ({mat.unit})
                          </option>
                        ))}
                      </select>

                      <button
                        type="button"
                        onClick={openQuickMaterial}
                        className="px-3 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
                      >
                        <PackagePlus className="w-3.5 h-3.5" />
                        + Cadastrar Nova Matéria-Prima
                      </button>
                    </div>
                  </div>

                  {/* Quick Material Creation Card (Inline in Ficha Técnica) */}
                  {isQuickMaterialOpen && (
                    <div className="p-4 rounded-xl border border-emerald-300 bg-emerald-50/60 shadow-sm space-y-3 animate-in fade-in duration-150">
                      <div className="flex items-center justify-between border-b border-emerald-200/70 pb-2">
                        <div className="flex items-center gap-2">
                          <PackagePlus className="w-4 h-4 text-emerald-700" />
                          <h4 className="text-xs font-bold text-emerald-950 uppercase tracking-wide">
                            Cadastro de Nova Matéria-Prima (Salva no Almoxarifado e Insere no Produto)
                          </h4>
                        </div>
                        <button
                          type="button"
                          onClick={() => setIsQuickMaterialOpen(false)}
                          className="text-emerald-700 hover:text-emerald-900"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                            Código / SKU *
                          </label>
                          <input
                            type="text"
                            required
                            value={quickMatCode}
                            onChange={(e) => setQuickMatCode(e.target.value)}
                            className="w-full text-xs border border-slate-300 rounded p-1.5 bg-white font-mono font-bold"
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                            Nome da Matéria-Prima *
                          </label>
                          <input
                            type="text"
                            required
                            value={quickMatName}
                            onChange={(e) => setQuickMatName(e.target.value)}
                            placeholder="Ex: Espuma D33 5cm, Parafuso Allen M6..."
                            className="w-full text-xs border border-slate-300 rounded p-1.5 bg-white"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                            Unidade de Medida
                          </label>
                          <select
                            value={quickMatUnit}
                            onChange={(e) => setQuickMatUnit(e.target.value)}
                            className="w-full text-xs border border-slate-300 rounded p-1.5 bg-white"
                          >
                            <option value="un">un (Unidade)</option>
                            <option value="kg">kg (Quilograma)</option>
                            <option value="m">m (Metro)</option>
                            <option value="m²">m² (Metro Quadrado)</option>
                            <option value="litro">litro (Litro)</option>
                            <option value="pacote">pacote (Pacote)</option>
                            <option value="rolo">rolo (Rolo)</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                            Custo Unitário (R$) *
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            required
                            value={quickMatCost}
                            onChange={(e) => setQuickMatCost(parseFloat(e.target.value) || 0)}
                            className="w-full text-xs border border-slate-300 rounded p-1.5 bg-white font-mono font-semibold"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                            Estoque Inicial
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={quickMatStock}
                            onChange={(e) => setQuickMatStock(parseFloat(e.target.value) || 0)}
                            className="w-full text-xs border border-slate-300 rounded p-1.5 bg-white font-mono"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                            Qtd. por 1 un do Produto *
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            min="0.01"
                            required
                            value={quickMatQtyInBOM}
                            onChange={(e) => setQuickMatQtyInBOM(parseFloat(e.target.value) || 1)}
                            className="w-full text-xs border border-slate-300 rounded p-1.5 bg-white font-mono font-bold text-blue-700"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                            Perda / Refugo (%)
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={quickMatScrap}
                            onChange={(e) => setQuickMatScrap(parseFloat(e.target.value) || 0)}
                            className="w-full text-xs border border-slate-300 rounded p-1.5 bg-white font-mono"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-2 border-t border-emerald-200/60">
                        <button
                          type="button"
                          onClick={() => setIsQuickMaterialOpen(false)}
                          className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800"
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                          disabled={isSavingQuickMat || !quickMatName.trim()}
                          onClick={handleSaveQuickMaterial}
                          className="px-4 py-1.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-sm transition-colors flex items-center gap-1.5 disabled:opacity-50"
                        >
                          <Check className="w-3.5 h-3.5" />
                          {isSavingQuickMat ? 'Salvando...' : 'Salvar no Almoxarifado e Incluir na Ficha'}
                        </button>
                      </div>
                    </div>
                  )}

                  {bom.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 border border-dashed border-slate-300 rounded-lg">
                      <Boxes className="w-8 h-8 mx-auto mb-2 opacity-40" />
                      Nenhuma matéria-prima associada à ficha técnica ainda.
                      <p className="text-xs mt-1">
                        Selecione um insumo existente no menu ou clique em <strong>"+ Cadastrar Nova Matéria-Prima"</strong> para criar um insumo novo.
                      </p>
                    </div>
                  ) : (
                    <div className="border border-slate-200 rounded-lg overflow-hidden">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-600">
                          <tr>
                            <th className="px-3 py-2.5">Matéria-Prima</th>
                            <th className="px-3 py-2.5 text-center">Unidade</th>
                            <th className="px-3 py-2.5 text-center">Qtd / Unidade</th>
                            <th className="px-3 py-2.5 text-center">Perda %</th>
                            <th className="px-3 py-2.5 text-right">Custo Unitário</th>
                            <th className="px-3 py-2.5 text-right">Subtotal</th>
                            <th className="px-3 py-2.5 text-right">Ação</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {bom.map((item, index) => {
                            const scrapMultiplier = 1 + (Number(item.scrapPercentage) || 0) / 100;
                            const subtotal =
                              (Number(item.quantityPerUnit) || 0) *
                              (Number(item.unitCost) || 0) *
                              scrapMultiplier;

                            return (
                              <tr key={item.rawMaterialId || index} className="hover:bg-slate-50">
                                <td className="px-3 py-2.5">
                                  <div className="font-mono font-semibold text-slate-800">
                                    {item.rawMaterialCode}
                                  </div>
                                  <div className="text-slate-600">{item.rawMaterialName}</div>
                                </td>
                                <td className="px-3 py-2.5 text-center font-mono text-slate-600">
                                  {item.unit}
                                </td>
                                <td className="px-3 py-2.5 text-center">
                                  <input
                                    type="number"
                                    step="0.01"
                                    min="0.001"
                                    value={item.quantityPerUnit}
                                    onChange={(e) =>
                                      updateBomItem(
                                        index,
                                        'quantityPerUnit',
                                        parseFloat(e.target.value) || 0
                                      )
                                    }
                                    className="w-20 text-center border border-slate-300 rounded p-1 font-mono text-xs"
                                  />
                                </td>
                                <td className="px-3 py-2.5 text-center">
                                  <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={item.scrapPercentage}
                                    onChange={(e) =>
                                      updateBomItem(
                                        index,
                                        'scrapPercentage',
                                        parseFloat(e.target.value) || 0
                                      )
                                    }
                                    className="w-16 text-center border border-slate-300 rounded p-1 font-mono text-xs"
                                  />
                                </td>
                                <td className="px-3 py-2.5 text-right font-mono tabular-nums text-slate-600">
                                  {formatCurrency(item.unitCost)}
                                </td>
                                <td className="px-3 py-2.5 text-right font-mono tabular-nums font-semibold text-slate-900">
                                  {formatCurrency(subtotal)}
                                </td>
                                <td className="px-3 py-2.5 text-right">
                                  <button
                                    type="button"
                                    onClick={() => removeBomItem(index)}
                                    className="text-slate-400 hover:text-rose-600 p-1"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                        <tfoot className="bg-slate-50 border-t border-slate-200 font-semibold text-slate-800">
                          <tr>
                            <td colSpan={5} className="px-3 py-2.5 text-right">
                              Custo Total dos Insumos por Unidade:
                            </td>
                            <td className="px-3 py-2.5 text-right font-mono tabular-nums text-blue-700 font-bold">
                              {formatCurrency(calculatedBomCost)}
                            </td>
                            <td></td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Modal Actions */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
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
                  className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm disabled:opacity-50"
                >
                  {isSaving ? 'Salvando...' : 'Salvar Ficha Técnica'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
