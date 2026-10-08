import React, { useState } from 'react';
import {
  ShoppingCart,
  Plus,
  Search,
  Edit2,
  Trash2,
  Factory,
  CheckCircle2,
  Clock,
  AlertCircle,
  X,
  FileText,
} from 'lucide-react';
import { Client, OrderItem, Product, SaleOrder, SaleOrderStatus } from '../../types/erp';
import { formatCurrency, formatDate } from '../../utils/formatters';

interface OrdersModuleProps {
  orders: SaleOrder[];
  clients: Client[];
  products: Product[];
  onSaveOrder: (order: SaleOrder) => Promise<void>;
  onDeleteOrder: (id: string) => Promise<void>;
  onGenerateOP: (order: SaleOrder, item: OrderItem) => void;
}

export const OrdersModule: React.FC<OrdersModuleProps> = ({
  orders,
  clients,
  products,
  onSaveOrder,
  onDeleteOrder,
  onGenerateOP,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<SaleOrder | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [orderNumber, setOrderNumber] = useState('');
  const [clientId, setClientId] = useState('');
  const [issueDate, setIssueDate] = useState('');
  const [deliveryDeadline, setDeliveryDeadline] = useState('');
  const [status, setStatus] = useState<SaleOrderStatus>('PENDENTE');
  const [items, setItems] = useState<OrderItem[]>([]);
  const [notes, setNotes] = useState('');

  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      o.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.clientName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' ? true : o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const openNewModal = () => {
    setSelectedOrder(null);
    const today = new Date().toISOString().split('T')[0];
    const delivery = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    setOrderNumber(`PED-2026-${String(orders.length + 1).padStart(2, '0')}`);
    setClientId(clients[0]?.id || '');
    setIssueDate(today);
    setDeliveryDeadline(delivery);
    setStatus('PENDENTE');
    setNotes('');

    if (products.length > 0) {
      setItems([
        {
          id: `item-${Date.now()}`,
          productId: products[0].id,
          productCode: products[0].code,
          productName: products[0].name,
          quantity: 2,
          unitPrice: products[0].suggestedSalePrice || 0,
          subtotal: 2 * (products[0].suggestedSalePrice || 0),
        },
      ]);
    } else {
      setItems([]);
    }

    setIsModalOpen(true);
  };

  const openEditModal = (order: SaleOrder) => {
    setSelectedOrder(order);
    setOrderNumber(order.orderNumber);
    setClientId(order.clientId);
    setIssueDate(order.issueDate);
    setDeliveryDeadline(order.deliveryDeadline);
    setStatus(order.status);
    setItems(order.items ? JSON.parse(JSON.stringify(order.items)) : []);
    setNotes(order.notes || '');
    setIsModalOpen(true);
  };

  // Item Helpers
  const addItem = () => {
    const defaultProd = products[0];
    if (!defaultProd) return;
    const newItem: OrderItem = {
      id: `item-${Date.now()}`,
      productId: defaultProd.id,
      productCode: defaultProd.code,
      productName: defaultProd.name,
      quantity: 1,
      unitPrice: defaultProd.suggestedSalePrice || 0,
      subtotal: defaultProd.suggestedSalePrice || 0,
    };
    setItems([...items, newItem]);
  };

  const updateItem = (index: number, field: keyof OrderItem, value: any) => {
    const updated = [...items];
    if (field === 'productId') {
      const prod = products.find((p) => p.id === value);
      if (prod) {
        updated[index].productId = prod.id;
        updated[index].productCode = prod.code;
        updated[index].productName = prod.name;
        updated[index].unitPrice = prod.suggestedSalePrice || 0;
        updated[index].subtotal = updated[index].quantity * (prod.suggestedSalePrice || 0);
      }
    } else if (field === 'quantity') {
      const qty = Math.max(1, parseInt(value, 10) || 1);
      updated[index].quantity = qty;
      updated[index].subtotal = qty * updated[index].unitPrice;
    } else if (field === 'unitPrice') {
      const price = parseFloat(value) || 0;
      updated[index].unitPrice = price;
      updated[index].subtotal = updated[index].quantity * price;
    }
    setItems(updated);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const totalAmount = items.reduce((sum, item) => sum + item.subtotal, 0);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      alert('Adicione ao menos um produto no pedido.');
      return;
    }

    setIsSaving(true);
    try {
      const client = clients.find((c) => c.id === clientId);
      const dataToSave: SaleOrder = {
        id: selectedOrder ? selectedOrder.id : '',
        orderNumber: orderNumber.trim(),
        clientId,
        clientName: client ? client.name : 'Cliente Avulso',
        issueDate,
        deliveryDeadline,
        status,
        items,
        totalAmount,
        notes: notes.trim(),
        createdAt: selectedOrder?.createdAt || new Date().toISOString(),
      };

      await onSaveOrder(dataToSave);
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
            Pedidos de Venda
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Gestão de pedidos de clientes com disparo direto para Ordens de Produção (OP)
          </p>
        </div>

        <button
          onClick={openNewModal}
          className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          + Novo Pedido
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-lg border border-slate-200">
        <div className="flex items-center gap-2 w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por número do pedido ou cliente..."
            className="w-full text-xs outline-none text-slate-800 placeholder-slate-400 bg-transparent"
          />
        </div>

        {/* Status Filter segmented */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg text-xs font-medium">
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-1 rounded transition-colors ${
              statusFilter === 'ALL'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Todos ({orders.length})
          </button>
          <button
            onClick={() => setStatusFilter('PENDENTE')}
            className={`px-3 py-1 rounded transition-colors ${
              statusFilter === 'PENDENTE'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Pendentes
          </button>
          <button
            onClick={() => setStatusFilter('EM_PRODUCAO')}
            className={`px-3 py-1 rounded transition-colors ${
              statusFilter === 'EM_PRODUCAO'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Em Produção
          </button>
          <button
            onClick={() => setStatusFilter('CONCLUIDO')}
            className={`px-3 py-1 rounded transition-colors ${
              statusFilter === 'CONCLUIDO'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Concluídos
          </button>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Pedido / Cliente</th>
                <th className="px-4 py-3.5">Emissão</th>
                <th className="px-4 py-3.5">Prazo de Entrega</th>
                <th className="px-4 py-3.5">Itens do Pedido</th>
                <th className="px-4 py-3.5 text-right">Valor Total</th>
                <th className="px-4 py-3.5 text-center">Status</th>
                <th className="px-5 py-3.5 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-slate-400">
                    <ShoppingCart className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    Nenhum pedido cadastrado com os critérios selecionados.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  return (
                    <tr key={order.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-4">
                        <span className="font-mono text-xs font-bold text-slate-900 block">
                          {order.orderNumber}
                        </span>
                        <span className="font-semibold text-slate-900 text-sm">
                          {order.clientName}
                        </span>
                        {order.notes && (
                          <div className="text-[11px] text-slate-400 line-clamp-1">
                            {order.notes}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-4 text-xs font-mono text-slate-600">
                        {formatDate(order.issueDate)}
                      </td>
                      <td className="px-4 py-4 text-xs font-mono font-medium text-slate-800">
                        {formatDate(order.deliveryDeadline)}
                      </td>
                      <td className="px-4 py-4 text-xs">
                        <div className="space-y-1">
                          {order.items.map((item) => (
                            <div key={item.id} className="flex items-center justify-between gap-3">
                              <span className="text-slate-800">
                                <span className="font-mono font-bold text-slate-900">{item.quantity}x</span>{' '}
                                {item.productName}
                              </span>
                              {!item.productionOrderId && order.status !== 'CONCLUIDO' && (
                                <button
                                  onClick={() => onGenerateOP(order, item)}
                                  className="text-[10px] font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded transition-colors flex items-center gap-1 shrink-0"
                                  title="Gerar Ordem de Produção para este item"
                                >
                                  <Factory className="w-3 h-3" />
                                  Emitir OP
                                </button>
                              )}
                              {item.productionOrderId && (
                                <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                                  OP vinculada
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-right font-mono tabular-nums font-bold text-slate-900 text-sm">
                        {formatCurrency(order.totalAmount)}
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span
                          className={`text-xs font-semibold px-2.5 py-1 rounded inline-block ${
                            order.status === 'CONCLUIDO'
                              ? 'bg-emerald-50 text-emerald-700'
                              : order.status === 'EM_PRODUCAO'
                              ? 'bg-blue-50 text-blue-700'
                              : order.status === 'CANCELADO'
                              ? 'bg-slate-100 text-slate-500'
                              : 'bg-amber-50 text-amber-700'
                          }`}
                        >
                          {order.status === 'EM_PRODUCAO'
                            ? 'Em Produção'
                            : order.status === 'CONCLUIDO'
                            ? 'Concluído'
                            : order.status === 'CANCELADO'
                            ? 'Cancelado'
                            : 'Pendente'}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right space-x-1 whitespace-nowrap">
                        <button
                          onClick={() => openEditModal(order)}
                          title="Editar Pedido"
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Excluir o pedido "${order.orderNumber}"?`)) {
                              onDeleteOrder(order.id);
                            }
                          }}
                          title="Excluir Pedido"
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

      {/* Modal Add/Edit Order */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in duration-150">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h2 className="text-base font-bold text-slate-900">
                {selectedOrder ? `Editar Pedido: ${orderNumber}` : 'Novo Pedido de Venda'}
              </h2>
              <button onClick={() => setIsModalOpen(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Número do Pedido *
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
                    Cliente *
                  </label>
                  <select
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value)}
                    required
                    className="w-full text-xs border border-slate-300 rounded p-2"
                  >
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.code} - {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Data de Emissão
                  </label>
                  <input
                    type="date"
                    required
                    value={issueDate}
                    onChange={(e) => setIssueDate(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded p-2 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Prazo de Entrega
                  </label>
                  <input
                    type="date"
                    required
                    value={deliveryDeadline}
                    onChange={(e) => setDeliveryDeadline(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded p-2 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Status do Pedido
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as SaleOrderStatus)}
                    className="w-full text-xs border border-slate-300 rounded p-2 font-semibold"
                  >
                    <option value="PENDENTE">Pendente</option>
                    <option value="EM_PRODUCAO">Em Produção</option>
                    <option value="CONCLUIDO">Concluído</option>
                    <option value="CANCELADO">Cancelado</option>
                  </select>
                </div>
              </div>

              {/* Items Section */}
              <div className="space-y-3 pt-3 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Itens do Pedido ({items.length})
                  </h3>
                  <button
                    type="button"
                    onClick={addItem}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    + Adicionar Produto
                  </button>
                </div>

                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                      <tr>
                        <th className="px-3 py-2">Produto</th>
                        <th className="px-3 py-2 text-center">Quantidade</th>
                        <th className="px-3 py-2 text-right">Preço Unitário (R$)</th>
                        <th className="px-3 py-2 text-right">Subtotal</th>
                        <th className="px-3 py-2 text-right">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {items.map((item, index) => (
                        <tr key={item.id || index}>
                          <td className="px-3 py-2">
                            <select
                              value={item.productId}
                              onChange={(e) => updateItem(index, 'productId', e.target.value)}
                              className="w-full text-xs border border-slate-300 rounded p-1.5"
                            >
                              {products.map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.code} - {p.name}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="px-3 py-2 text-center">
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                              className="w-16 text-center border border-slate-300 rounded p-1 font-mono text-xs"
                            />
                          </td>
                          <td className="px-3 py-2 text-right">
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={item.unitPrice}
                              onChange={(e) => updateItem(index, 'unitPrice', e.target.value)}
                              className="w-24 text-right border border-slate-300 rounded p-1 font-mono text-xs"
                            />
                          </td>
                          <td className="px-3 py-2 text-right font-mono tabular-nums font-bold text-slate-900">
                            {formatCurrency(item.subtotal)}
                          </td>
                          <td className="px-3 py-2 text-right">
                            <button
                              type="button"
                              onClick={() => removeItem(index)}
                              className="text-slate-400 hover:text-rose-600 p-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-slate-50 border-t border-slate-200">
                      <tr>
                        <td colSpan={3} className="px-3 py-2.5 text-right font-bold text-slate-800">
                          Total do Pedido:
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono font-bold text-blue-700 text-sm">
                          {formatCurrency(totalAmount)}
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Observações &amp; Condições Comerciais
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Instruções de entrega, condições de pagamento..."
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
                  {isSaving ? 'Salvando...' : 'Salvar Pedido'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
