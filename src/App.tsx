import React, { useEffect, useState } from 'react';
import { initialData } from './data/initialData';
import { ERPDatabase, OrderItem, Product, ProductionOrder, RawMaterial, SaleOrder, Supplier, SystemSettings, WorkCenter, Client } from './types/erp';
import { api } from './services/api';
import { Navbar } from './components/layout/Navbar';
import { NavigationModule, Sidebar } from './components/layout/Sidebar';
import { DashboardModule } from './components/dashboard/DashboardModule';
import { ProductsModule } from './components/cadastros/ProductsModule';
import { RawMaterialsModule } from './components/cadastros/RawMaterialsModule';
import { CapacityModule } from './components/cadastros/CapacityModule';
import { PartnersModule } from './components/cadastros/PartnersModule';
import { OrdersModule } from './components/pedidos/OrdersModule';
import { ProductionModule } from './components/producao/ProductionModule';
import { ReportsModule } from './components/relatorios/ReportsModule';
import { SettingsModule } from './components/config/SettingsModule';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

export default function App() {
  const [data, setData] = useState<ERPDatabase>(initialData);
  const [activeModule, setActiveModule] = useState<NavigationModule>('dashboard');
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Load database on start
  const loadDatabase = async () => {
    setIsSyncing(true);
    try {
      const db = await api.getDatabase();
      if (!db.settings.technicalResponsible?.name || !db.settings.technicalResponsible.name.includes('Tayná')) {
        db.settings.technicalResponsible = initialData.settings.technicalResponsible;
      }
      setData(db);
    } catch (err) {
      console.warn('Using local database state:', err);
    } finally {
      setIsLoading(false);
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    loadDatabase();
  }, []);

  // Sync handler
  const handleSync = async () => {
    await loadDatabase();
    showNotification('Dados sincronizados com o servidor!');
  };

  // ================= PRODUCTS =================
  const handleSaveProduct = async (product: Product) => {
    try {
      let saved: Product;
      if (product.id && data.products.some((p) => p.id === product.id)) {
        saved = await api.updateProduct(product.id, product);
        setData((prev) => ({
          ...prev,
          products: prev.products.map((p) => (p.id === saved.id ? saved : p)),
        }));
        showNotification(`Produto "${saved.name}" atualizado!`);
      } else {
        saved = await api.createProduct(product);
        setData((prev) => ({
          ...prev,
          products: [saved, ...prev.products],
        }));
        showNotification(`Ficha Técnica "${saved.name}" cadastrada com sucesso!`);
      }
    } catch (err: any) {
      showNotification(`Erro ao salvar produto: ${err.message}`, 'error');
    }
  };

  const handleDeleteProduct = async (id: string) => {
    try {
      await api.deleteProduct(id);
      setData((prev) => ({
        ...prev,
        products: prev.products.filter((p) => p.id !== id),
      }));
      showNotification('Produto excluído com sucesso.');
    } catch (err: any) {
      showNotification(`Erro ao excluir: ${err.message}`, 'error');
    }
  };

  // ================= RAW MATERIALS =================
  const handleSaveRawMaterial = async (material: RawMaterial): Promise<RawMaterial | undefined> => {
    try {
      let saved: RawMaterial;
      if (material.id && data.rawMaterials.some((m) => m.id === material.id)) {
        saved = await api.updateRawMaterial(material.id, material);
        setData((prev) => ({
          ...prev,
          rawMaterials: prev.rawMaterials.map((m) => (m.id === saved.id ? saved : m)),
        }));
        showNotification(`Matéria-prima "${saved.name}" atualizada!`);
      } else {
        saved = await api.createRawMaterial(material);
        setData((prev) => ({
          ...prev,
          rawMaterials: [saved, ...prev.rawMaterials],
        }));
        showNotification(`Matéria-prima "${saved.name}" cadastrada!`);
      }
      return saved;
    } catch (err: any) {
      showNotification(`Erro ao salvar matéria-prima: ${err.message}`, 'error');
    }
  };

  const handleDeleteRawMaterial = async (id: string) => {
    try {
      await api.deleteRawMaterial(id);
      setData((prev) => ({
        ...prev,
        rawMaterials: prev.rawMaterials.filter((m) => m.id !== id),
      }));
      showNotification('Matéria-prima excluída com sucesso.');
    } catch (err: any) {
      showNotification(`Erro ao excluir: ${err.message}`, 'error');
    }
  };

  const handleAdjustStock = async (id: string, newStock: number, notes?: string) => {
    const mat = data.rawMaterials.find((m) => m.id === id);
    if (!mat) return;
    const updated: RawMaterial = { ...mat, currentStock: newStock, updatedAt: new Date().toISOString() };
    await handleSaveRawMaterial(updated);
  };

  // ================= CLIENTS =================
  const handleSaveClient = async (client: Client) => {
    try {
      let saved: Client;
      if (client.id && data.clients.some((c) => c.id === client.id)) {
        saved = await api.updateClient(client.id, client);
        setData((prev) => ({
          ...prev,
          clients: prev.clients.map((c) => (c.id === saved.id ? saved : c)),
        }));
        showNotification(`Cliente "${saved.name}" atualizado!`);
      } else {
        saved = await api.createClient(client);
        setData((prev) => ({
          ...prev,
          clients: [saved, ...prev.clients],
        }));
        showNotification(`Cliente "${saved.name}" cadastrado!`);
      }
    } catch (err: any) {
      showNotification(`Erro ao salvar cliente: ${err.message}`, 'error');
    }
  };

  const handleDeleteClient = async (id: string) => {
    try {
      await api.deleteClient(id);
      setData((prev) => ({
        ...prev,
        clients: prev.clients.filter((c) => c.id !== id),
      }));
      showNotification('Cliente excluído.');
    } catch (err: any) {
      showNotification(`Erro: ${err.message}`, 'error');
    }
  };

  // ================= SUPPLIERS =================
  const handleSaveSupplier = async (supplier: Supplier) => {
    try {
      let saved: Supplier;
      if (supplier.id && data.suppliers.some((s) => s.id === supplier.id)) {
        saved = await api.updateSupplier(supplier.id, supplier);
        setData((prev) => ({
          ...prev,
          suppliers: prev.suppliers.map((s) => (s.id === saved.id ? saved : s)),
        }));
        showNotification(`Fornecedor "${saved.name}" atualizado!`);
      } else {
        saved = await api.createSupplier(supplier);
        setData((prev) => ({
          ...prev,
          suppliers: [saved, ...prev.suppliers],
        }));
        showNotification(`Fornecedor "${saved.name}" cadastrado!`);
      }
    } catch (err: any) {
      showNotification(`Erro ao salvar fornecedor: ${err.message}`, 'error');
    }
  };

  const handleDeleteSupplier = async (id: string) => {
    try {
      await api.deleteSupplier(id);
      setData((prev) => ({
        ...prev,
        suppliers: prev.suppliers.filter((s) => s.id !== id),
      }));
      showNotification('Fornecedor excluído.');
    } catch (err: any) {
      showNotification(`Erro: ${err.message}`, 'error');
    }
  };

  // ================= WORK CENTERS =================
  const handleSaveWorkCenter = async (wc: WorkCenter) => {
    try {
      let saved: WorkCenter;
      if (wc.id && data.workCenters.some((w) => w.id === wc.id)) {
        saved = await api.updateWorkCenter(wc.id, wc);
        setData((prev) => ({
          ...prev,
          workCenters: prev.workCenters.map((w) => (w.id === saved.id ? saved : w)),
        }));
        showNotification(`Centro de trabalho "${saved.name}" atualizado!`);
      } else {
        saved = await api.createWorkCenter(wc);
        setData((prev) => ({
          ...prev,
          workCenters: [...prev.workCenters, saved],
        }));
        showNotification(`Centro de trabalho "${saved.name}" criado!`);
      }
    } catch (err: any) {
      showNotification(`Erro: ${err.message}`, 'error');
    }
  };

  const handleDeleteWorkCenter = async (id: string) => {
    try {
      await api.deleteWorkCenter(id);
      setData((prev) => ({
        ...prev,
        workCenters: prev.workCenters.filter((w) => w.id !== id),
      }));
      showNotification('Centro de trabalho excluído.');
    } catch (err: any) {
      showNotification(`Erro: ${err.message}`, 'error');
    }
  };

  // ================= ORDERS =================
  const handleSaveOrder = async (order: SaleOrder) => {
    try {
      let saved: SaleOrder;
      if (order.id && data.saleOrders.some((o) => o.id === order.id)) {
        saved = await api.updateSaleOrder(order.id, order);
        setData((prev) => ({
          ...prev,
          saleOrders: prev.saleOrders.map((o) => (o.id === saved.id ? saved : o)),
        }));
        showNotification(`Pedido "${saved.orderNumber}" atualizado!`);
      } else {
        saved = await api.createSaleOrder(order);
        setData((prev) => ({
          ...prev,
          saleOrders: [saved, ...prev.saleOrders],
        }));
        showNotification(`Pedido "${saved.orderNumber}" emitido com sucesso!`);
      }
    } catch (err: any) {
      showNotification(`Erro: ${err.message}`, 'error');
    }
  };

  const handleDeleteOrder = async (id: string) => {
    try {
      await api.deleteSaleOrder(id);
      setData((prev) => ({
        ...prev,
        saleOrders: prev.saleOrders.filter((o) => o.id !== id),
      }));
      showNotification('Pedido excluído.');
    } catch (err: any) {
      showNotification(`Erro: ${err.message}`, 'error');
    }
  };

  // Generate OP directly from an order item
  const handleGenerateOPFromOrderItem = async (order: SaleOrder, item: OrderItem) => {
    const product = data.products.find((p) => p.id === item.productId);
    if (!product) {
      showNotification('Ficha técnica do produto não encontrada.', 'error');
      return;
    }

    const nextSeq = String(data.productionOrders.length + 1).padStart(3, '0');
    const today = new Date().toISOString().split('T')[0];
    const delivery = order.deliveryDeadline || new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Compute required materials
    const requiredMaterials = (product.bom || []).map((b) => {
      const mat = data.rawMaterials.find((m) => m.id === b.rawMaterialId);
      const scrapFactor = 1 + (Number(b.scrapPercentage) || 0) / 100;
      const requiredQuantity = Math.round(b.quantityPerUnit * item.quantity * scrapFactor * 100) / 100;
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
    });

    const allSufficient = requiredMaterials.every((m) => m.isSufficient);

    const stages = (product.processStages || []).map((ps, idx) => ({
      id: `ops-${Date.now()}-${idx}`,
      name: ps.name,
      workCenterId: ps.workCenterId,
      workCenterName: ps.workCenterName,
      plannedMinutes: (ps.timeMinutes || 15) * item.quantity,
      status: 'PENDENTE' as const,
    }));

    const newOP: ProductionOrder = {
      id: `op-${Date.now()}`,
      orderNumber: `OP-2026-${nextSeq}`,
      saleOrderId: order.id,
      saleOrderNumber: order.orderNumber,
      clientName: order.clientName,
      productId: product.id,
      productCode: product.code,
      productName: product.name,
      quantityPlanned: item.quantity,
      quantityProduced: 0,
      startDate: today,
      expectedEndDate: delivery,
      status: allSufficient ? 'PLANEJADA' : 'AGUARDANDO_INSUMOS',
      priority: 'ALTA',
      stages,
      currentStageIndex: 0,
      requiredMaterials,
      notes: `OP gerada automaticamente a partir do pedido ${order.orderNumber} (${order.clientName}).`,
      stockDeducted: false,
      technicalResponsible: {
        name: data.settings.technicalResponsible.name,
        registration: data.settings.technicalResponsible.registration,
        role: data.settings.technicalResponsible.role,
        email: data.settings.technicalResponsible.email,
        phone: data.settings.technicalResponsible.phone,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      const savedOP = await api.createProductionOrder(newOP);

      // Update item in order with OP id and set order to EM_PRODUCAO
      const updatedItems = order.items.map((i) =>
        i.id === item.id ? { ...i, productionOrderId: savedOP.id } : i
      );
      const updatedOrder: SaleOrder = {
        ...order,
        status: 'EM_PRODUCAO',
        items: updatedItems,
      };
      await api.updateSaleOrder(order.id, updatedOrder);

      // Refresh DB
      const refreshed = await api.getDatabase();
      setData(refreshed);
      setActiveModule('producao');
      showNotification(`Ordem de Produção ${savedOP.orderNumber} emitida para o pedido ${order.orderNumber}!`);
    } catch (err: any) {
      showNotification(`Erro ao emitir OP: ${err.message}`, 'error');
    }
  };

  // Convert Interactive Simulation to real Production Order
  const handleConvertSimulationToOP = async (productId: string, quantity: number, daysDeadline: number) => {
    const product = data.products.find((p) => p.id === productId);
    if (!product) return;

    const nextSeq = String(data.productionOrders.length + 1).padStart(3, '0');
    const today = new Date().toISOString().split('T')[0];
    const delivery = new Date(Date.now() + daysDeadline * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const requiredMaterials = (product.bom || []).map((b) => {
      const mat = data.rawMaterials.find((m) => m.id === b.rawMaterialId);
      const scrapFactor = 1 + (Number(b.scrapPercentage) || 0) / 100;
      const requiredQuantity = Math.round(b.quantityPerUnit * quantity * scrapFactor * 100) / 100;
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
    });

    const allSufficient = requiredMaterials.every((m) => m.isSufficient);

    const stages = (product.processStages || []).map((ps, idx) => ({
      id: `ops-${Date.now()}-${idx}`,
      name: ps.name,
      workCenterId: ps.workCenterId,
      workCenterName: ps.workCenterName,
      plannedMinutes: (ps.timeMinutes || 15) * quantity,
      status: 'PENDENTE' as const,
    }));

    const newOP: ProductionOrder = {
      id: `op-${Date.now()}`,
      orderNumber: `OP-2026-${nextSeq}`,
      productId: product.id,
      productCode: product.code,
      productName: product.name,
      quantityPlanned: quantity,
      quantityProduced: 0,
      startDate: today,
      expectedEndDate: delivery,
      status: allSufficient ? 'PLANEJADA' : 'AGUARDANDO_INSUMOS',
      priority: 'ALTA',
      stages,
      currentStageIndex: 0,
      requiredMaterials,
      notes: `OP gerada a partir do Simulador Interativo (Lote: ${quantity} un, Prazo: ${daysDeadline} dias).`,
      stockDeducted: false,
      technicalResponsible: {
        name: data.settings.technicalResponsible.name,
        registration: data.settings.technicalResponsible.registration,
        role: data.settings.technicalResponsible.role,
        email: data.settings.technicalResponsible.email,
        phone: data.settings.technicalResponsible.phone,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      const savedOP = await api.createProductionOrder(newOP);
      const refreshed = await api.getDatabase();
      setData(refreshed);
      setActiveModule('producao');
      showNotification(`OP ${savedOP.orderNumber} emitida com sucesso a partir da simulação!`);
    } catch (err: any) {
      showNotification(`Erro ao converter simulação: ${err.message}`, 'error');
    }
  };

  // ================= PRODUCTION ORDERS =================
  const handleSaveOP = async (op: ProductionOrder) => {
    try {
      let saved: ProductionOrder;
      if (op.id && data.productionOrders.some((o) => o.id === op.id)) {
        saved = await api.updateProductionOrder(op.id, op);
        setData((prev) => ({
          ...prev,
          productionOrders: prev.productionOrders.map((o) => (o.id === saved.id ? saved : o)),
        }));
        showNotification(`Ordem de Produção "${saved.orderNumber}" atualizada!`);
      } else {
        saved = await api.createProductionOrder(op);
        setData((prev) => ({
          ...prev,
          productionOrders: [saved, ...prev.productionOrders],
        }));
        showNotification(`Ordem de Produção "${saved.orderNumber}" emitida com sucesso!`);
      }
    } catch (err: any) {
      showNotification(`Erro ao salvar OP: ${err.message}`, 'error');
    }
  };

  // BAIXA DA ORDEM DE PRODUÇÃO
  const handleCompleteOP = async (
    id: string,
    payload: {
      quantityProduced?: number;
      actualTotalMinutes?: number;
      completionNotes?: string;
      responsibleName?: string;
      responsibleRegistration?: string;
    }
  ) => {
    try {
      const result = await api.completeProductionOrder(id, payload);
      // Reload fresh database to reflect deducted raw materials and incremented products
      const freshDb = await api.getDatabase();
      setData(freshDb);
      showNotification(result.message || `OP baixada com sucesso! Estoque atualizado.`);
    } catch (err: any) {
      showNotification(`Erro ao dar baixa na OP: ${err.message}`, 'error');
      throw err;
    }
  };

  const handleDeleteOP = async (id: string) => {
    try {
      await api.deleteProductionOrder(id);
      setData((prev) => ({
        ...prev,
        productionOrders: prev.productionOrders.filter((o) => o.id !== id),
      }));
      showNotification('Ordem de Produção excluída.');
    } catch (err: any) {
      showNotification(`Erro: ${err.message}`, 'error');
    }
  };

  // ================= SETTINGS =================
  const handleSaveSettings = async (settings: SystemSettings) => {
    try {
      const updated = await api.updateSettings(settings);
      setData((prev) => ({ ...prev, settings: updated }));
      showNotification('Configurações salvas e aplicadas em todo o sistema!');
    } catch (err: any) {
      showNotification(`Erro ao salvar configurações: ${err.message}`, 'error');
    }
  };

  const handleResetDemo = async () => {
    try {
      const reset = await api.resetDemo();
      setData(reset);
      showNotification('Dados de demonstração industriais recarregados!');
    } catch (err: any) {
      showNotification(`Erro: ${err.message}`, 'error');
    }
  };

  const handleRestoreDatabase = async (db: ERPDatabase) => {
    try {
      await api.restoreDatabase(db);
      setData(db);
      showNotification('Banco de dados restaurado com sucesso!');
    } catch (err: any) {
      showNotification(`Erro ao restaurar: ${err.message}`, 'error');
    }
  };

  // Compute active counts for badges
  const activeOpsCount = data.productionOrders.filter(
    (o) => o.status === 'EM_PROCESSO' || o.status === 'AGUARDANDO_INSUMOS' || o.status === 'CONTROLE_QUALIDADE'
  ).length;
  const pendingOrdersCount = data.saleOrders.filter((o) => o.status === 'PENDENTE').length;
  const lowStockCount = data.rawMaterials.filter((m) => m.currentStock <= m.minStock).length;

  const getModuleTitle = () => {
    switch (activeModule) {
      case 'dashboard':
        return 'Visão Geral & PCP';
      case 'producao':
        return 'Ordens de Produção';
      case 'pedidos':
        return 'Pedidos de Venda';
      case 'produtos':
        return 'Fichas Técnicas (BOM)';
      case 'materia-prima':
        return 'Almoxarifado & Insumos';
      case 'capacidade':
        return 'Capacidade Produtiva';
      case 'parceiros':
        return 'Clientes & Fornecedores';
      case 'relatorios':
        return 'Relatórios & Emissão';
      case 'configuracoes':
        return 'Configurações & Resp. Técnico';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-blue-100 selection:text-blue-900">
      {/* Top Navbar */}
      <Navbar
        settings={data.settings}
        onOpenSettings={() => setActiveModule('configuracoes')}
        onSync={handleSync}
        isSyncing={isSyncing}
        activeModuleTitle={getModuleTitle()}
      />

      {/* Floating Notification */}
      {notification && (
        <div className="no-print fixed bottom-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-xs font-semibold animate-in slide-in-from-bottom duration-200 bg-white border border-slate-200">
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span className="text-slate-800">{notification.message}</span>
        </div>
      )}

      {/* Main Layout Area */}
      <div className="flex-1 flex">
        {/* Sidebar */}
        <Sidebar
          activeModule={activeModule}
          onSelectModule={setActiveModule}
          activeOpsCount={activeOpsCount}
          pendingOrdersCount={pendingOrdersCount}
          lowStockCount={lowStockCount}
        />

        {/* Dynamic Content Viewport */}
        <main className="flex-1 overflow-x-hidden min-h-[calc(100vh-4rem)]">
          {activeModule === 'dashboard' && (
            <DashboardModule
              data={data}
              onNavigate={setActiveModule}
              onNewOP={() => setActiveModule('producao')}
              onNewOrder={() => setActiveModule('pedidos')}
              onConvertSimulationToOP={handleConvertSimulationToOP}
            />
          )}

          {activeModule === 'producao' && (
            <ProductionModule
              productionOrders={data.productionOrders}
              products={data.products}
              rawMaterials={data.rawMaterials}
              workCenters={data.workCenters}
              saleOrders={data.saleOrders}
              settings={data.settings}
              onSaveOP={handleSaveOP}
              onCompleteOP={handleCompleteOP}
              onDeleteOP={handleDeleteOP}
            />
          )}

          {activeModule === 'pedidos' && (
            <OrdersModule
              orders={data.saleOrders}
              clients={data.clients}
              products={data.products}
              onSaveOrder={handleSaveOrder}
              onDeleteOrder={handleDeleteOrder}
              onGenerateOP={handleGenerateOPFromOrderItem}
            />
          )}

          {activeModule === 'produtos' && (
            <ProductsModule
              products={data.products}
              rawMaterials={data.rawMaterials}
              workCenters={data.workCenters}
              suppliers={data.suppliers}
              onSaveProduct={handleSaveProduct}
              onDeleteProduct={handleDeleteProduct}
              onSaveRawMaterial={handleSaveRawMaterial}
            />
          )}

          {activeModule === 'materia-prima' && (
            <RawMaterialsModule
              rawMaterials={data.rawMaterials}
              suppliers={data.suppliers}
              stockMovements={data.stockMovements || []}
              onSaveRawMaterial={handleSaveRawMaterial}
              onDeleteRawMaterial={handleDeleteRawMaterial}
              onAdjustStock={handleAdjustStock}
            />
          )}

          {activeModule === 'capacidade' && (
            <CapacityModule
              workCenters={data.workCenters}
              productionOrders={data.productionOrders}
              onSaveWorkCenter={handleSaveWorkCenter}
              onDeleteWorkCenter={handleDeleteWorkCenter}
            />
          )}

          {activeModule === 'parceiros' && (
            <PartnersModule
              clients={data.clients}
              suppliers={data.suppliers}
              onSaveClient={handleSaveClient}
              onDeleteClient={handleDeleteClient}
              onSaveSupplier={handleSaveSupplier}
              onDeleteSupplier={handleDeleteSupplier}
            />
          )}

          {activeModule === 'relatorios' && (
            <ReportsModule data={data} />
          )}

          {activeModule === 'configuracoes' && (
            <SettingsModule
              settings={data.settings}
              data={data}
              onSaveSettings={handleSaveSettings}
              onResetDemo={handleResetDemo}
              onRestoreDatabase={handleRestoreDatabase}
            />
          )}
        </main>
      </div>
    </div>
  );
}
