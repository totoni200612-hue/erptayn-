import React, { useState } from 'react';
import {
  Users,
  Building2,
  Plus,
  Search,
  Edit2,
  Trash2,
  Mail,
  Phone,
  MapPin,
  Clock,
  X,
} from 'lucide-react';
import { Client, Supplier } from '../../types/erp';

interface PartnersModuleProps {
  clients: Client[];
  suppliers: Supplier[];
  onSaveClient: (client: Client) => Promise<void>;
  onDeleteClient: (id: string) => Promise<void>;
  onSaveSupplier: (supplier: Supplier) => Promise<void>;
  onDeleteSupplier: (id: string) => Promise<void>;
}

export const PartnersModule: React.FC<PartnersModuleProps> = ({
  clients,
  suppliers,
  onSaveClient,
  onDeleteClient,
  onSaveSupplier,
  onDeleteSupplier,
}) => {
  const [activeTab, setActiveTab] = useState<'clients' | 'suppliers'>('clients');
  const [searchTerm, setSearchTerm] = useState('');

  // Client Modal State
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clientForm, setClientForm] = useState<Partial<Client>>({});

  // Supplier Modal State
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [supplierForm, setSupplierForm] = useState<Partial<Supplier>>({});

  // Filtered
  const filteredClients = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.document.includes(searchTerm) ||
      c.city?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredSuppliers = suppliers.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.document.includes(searchTerm) ||
      s.suppliedMaterials?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Client Helpers
  const openNewClient = () => {
    setSelectedClient(null);
    setClientForm({
      code: `CLI-${Math.floor(100 + Math.random() * 900)}`,
      name: '',
      document: '',
      contactName: '',
      email: '',
      phone: '',
      street: '',
      number: '',
      neighborhood: '',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '',
      notes: '',
    });
    setIsClientModalOpen(true);
  };

  const openEditClient = (c: Client) => {
    setSelectedClient(c);
    setClientForm({ ...c });
    setIsClientModalOpen(true);
  };

  const handleSaveClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientForm.name?.trim()) return;

    const data: Client = {
      id: selectedClient ? selectedClient.id : '',
      code: clientForm.code || `CLI-${Date.now()}`,
      name: clientForm.name.trim(),
      document: clientForm.document || '',
      contactName: clientForm.contactName || '',
      email: clientForm.email || '',
      phone: clientForm.phone || '',
      street: clientForm.street || '',
      number: clientForm.number || '',
      neighborhood: clientForm.neighborhood || '',
      city: clientForm.city || '',
      state: clientForm.state || '',
      zipCode: clientForm.zipCode || '',
      notes: clientForm.notes || '',
      createdAt: selectedClient?.createdAt || new Date().toISOString(),
    };

    await onSaveClient(data);
    setIsClientModalOpen(false);
  };

  // Supplier Helpers
  const openNewSupplier = () => {
    setSelectedSupplier(null);
    setSupplierForm({
      code: `FOR-${Math.floor(100 + Math.random() * 900)}`,
      name: '',
      document: '',
      contactName: '',
      email: '',
      phone: '',
      city: 'São Paulo',
      state: 'SP',
      suppliedMaterials: '',
      leadTimeDays: 3,
    });
    setIsSupplierModalOpen(true);
  };

  const openEditSupplier = (s: Supplier) => {
    setSelectedSupplier(s);
    setSupplierForm({ ...s });
    setIsSupplierModalOpen(true);
  };

  const handleSaveSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierForm.name?.trim()) return;

    const data: Supplier = {
      id: selectedSupplier ? selectedSupplier.id : '',
      code: supplierForm.code || `FOR-${Date.now()}`,
      name: supplierForm.name.trim(),
      document: supplierForm.document || '',
      contactName: supplierForm.contactName || '',
      email: supplierForm.email || '',
      phone: supplierForm.phone || '',
      city: supplierForm.city || '',
      state: supplierForm.state || '',
      suppliedMaterials: supplierForm.suppliedMaterials || '',
      leadTimeDays: Number(supplierForm.leadTimeDays) || 3,
      createdAt: selectedSupplier?.createdAt || new Date().toISOString(),
    };

    await onSaveSupplier(data);
    setIsSupplierModalOpen(false);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Parceiros Comerciais: Clientes &amp; Fornecedores
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Cadastros com persistência de dados para emissão de pedidos e ordens de compras
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'clients' ? (
            <button
              onClick={openNewClient}
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              + Novo Cliente
            </button>
          ) : (
            <button
              onClick={openNewSupplier}
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              + Novo Fornecedor
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-6">
        <button
          onClick={() => {
            setActiveTab('clients');
            setSearchTerm('');
          }}
          className={`pb-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'clients'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          Clientes ({clients.length})
        </button>
        <button
          onClick={() => {
            setActiveTab('suppliers');
            setSearchTerm('');
          }}
          className={`pb-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'suppliers'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Building2 className="w-4 h-4" />
          Fornecedores ({suppliers.length})
        </button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 bg-white p-3 rounded-lg border border-slate-200 max-w-md">
        <Search className="w-4 h-4 text-slate-400 shrink-0" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={`Buscar ${activeTab === 'clients' ? 'clientes' : 'fornecedores'}...`}
          className="w-full text-xs outline-none text-slate-800 placeholder-slate-400 bg-transparent"
        />
      </div>

      {/* CLIENTS TAB */}
      {activeTab === 'clients' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Código / Cliente</th>
                  <th className="px-4 py-3.5">Documento (CPF/CNPJ)</th>
                  <th className="px-4 py-3.5">Contato / E-mail</th>
                  <th className="px-4 py-3.5">Telefone</th>
                  <th className="px-4 py-3.5">Localização</th>
                  <th className="px-5 py-3.5 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredClients.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-8 text-center text-slate-400">
                      Nenhum cliente encontrado.
                    </td>
                  </tr>
                ) : (
                  filteredClients.map((client) => (
                    <tr key={client.id} className="hover:bg-slate-50">
                      <td className="px-5 py-4">
                        <span className="font-mono text-xs font-bold text-slate-900 block">
                          {client.code}
                        </span>
                        <span className="font-semibold text-slate-900 text-sm">
                          {client.name}
                        </span>
                      </td>
                      <td className="px-4 py-4 font-mono text-xs text-slate-600">
                        {client.document || '-'}
                      </td>
                      <td className="px-4 py-4 text-xs">
                        <div className="text-slate-800 font-medium">{client.contactName || '-'}</div>
                        <div className="text-slate-500 flex items-center gap-1 mt-0.5">
                          <Mail className="w-3 h-3 text-slate-400" />
                          {client.email || '-'}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-xs font-mono text-slate-600">
                        {client.phone || '-'}
                      </td>
                      <td className="px-4 py-4 text-xs text-slate-500">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>
                            {client.city ? `${client.city}/${client.state}` : '-'}
                          </span>
                        </div>
                        {client.street && (
                          <div className="text-[11px] text-slate-400 truncate max-w-[200px]">
                            {client.street}, {client.number}
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-4 text-right space-x-1">
                        <button
                          onClick={() => openEditClient(client)}
                          title="Editar Cliente"
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Excluir o cliente "${client.name}"?`)) {
                              onDeleteClient(client.id);
                            }
                          }}
                          title="Excluir Cliente"
                          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUPPLIERS TAB */}
      {activeTab === 'suppliers' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Código / Razão Social</th>
                  <th className="px-4 py-3.5">CNPJ</th>
                  <th className="px-4 py-3.5">Materiais Fornecidos</th>
                  <th className="px-4 py-3.5">Contato / E-mail</th>
                  <th className="px-4 py-3.5 text-center">Prazo Médio</th>
                  <th className="px-5 py-3.5 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSuppliers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-8 text-center text-slate-400">
                      Nenhum fornecedor encontrado.
                    </td>
                  </tr>
                ) : (
                  filteredSuppliers.map((supplier) => (
                    <tr key={supplier.id} className="hover:bg-slate-50">
                      <td className="px-5 py-4">
                        <span className="font-mono text-xs font-bold text-slate-900 block">
                          {supplier.code}
                        </span>
                        <span className="font-semibold text-slate-900 text-sm">
                          {supplier.name}
                        </span>
                        <div className="text-[11px] text-slate-400">
                          {supplier.city}/{supplier.state}
                        </div>
                      </td>
                      <td className="px-4 py-4 font-mono text-xs text-slate-600">
                        {supplier.document || '-'}
                      </td>
                      <td className="px-4 py-4 text-xs font-medium text-slate-700 max-w-xs">
                        {supplier.suppliedMaterials || '-'}
                      </td>
                      <td className="px-4 py-4 text-xs">
                        <div className="text-slate-800 font-medium">{supplier.contactName || '-'}</div>
                        <div className="text-slate-500">{supplier.email || supplier.phone}</div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className="inline-flex items-center gap-1 font-mono text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                          <Clock className="w-3 h-3 text-slate-500" />
                          {supplier.leadTimeDays || 3} dias
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right space-x-1">
                        <button
                          onClick={() => openEditSupplier(supplier)}
                          title="Editar Fornecedor"
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Excluir o fornecedor "${supplier.name}"?`)) {
                              onDeleteSupplier(supplier.id);
                            }
                          }}
                          title="Excluir Fornecedor"
                          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Client */}
      {isClientModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-xl overflow-hidden animate-in fade-in duration-150">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h2 className="text-base font-bold text-slate-900">
                {selectedClient ? 'Editar Cliente' : 'Novo Cliente'}
              </h2>
              <button onClick={() => setIsClientModalOpen(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleSaveClient} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Código *
                  </label>
                  <input
                    type="text"
                    required
                    value={clientForm.code || ''}
                    onChange={(e) => setClientForm({ ...clientForm, code: e.target.value })}
                    className="w-full text-xs border border-slate-300 rounded p-2 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    CPF ou CNPJ
                  </label>
                  <input
                    type="text"
                    value={clientForm.document || ''}
                    onChange={(e) => setClientForm({ ...clientForm, document: e.target.value })}
                    placeholder="00.000.000/0001-00"
                    className="w-full text-xs border border-slate-300 rounded p-2 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nome / Razão Social *
                </label>
                <input
                  type="text"
                  required
                  value={clientForm.name || ''}
                  onChange={(e) => setClientForm({ ...clientForm, name: e.target.value })}
                  placeholder="Nome do cliente ou empresa"
                  className="w-full text-xs border border-slate-300 rounded p-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nome do Contato / Responsável
                  </label>
                  <input
                    type="text"
                    value={clientForm.contactName || ''}
                    onChange={(e) => setClientForm({ ...clientForm, contactName: e.target.value })}
                    className="w-full text-xs border border-slate-300 rounded p-2"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Telefone / WhatsApp
                  </label>
                  <input
                    type="text"
                    value={clientForm.phone || ''}
                    onChange={(e) => setClientForm({ ...clientForm, phone: e.target.value })}
                    placeholder="(11) 98765-4321"
                    className="w-full text-xs border border-slate-300 rounded p-2"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  E-mail
                </label>
                <input
                  type="email"
                  value={clientForm.email || ''}
                  onChange={(e) => setClientForm({ ...clientForm, email: e.target.value })}
                  className="w-full text-xs border border-slate-300 rounded p-2"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Logradouro / Rua
                  </label>
                  <input
                    type="text"
                    value={clientForm.street || ''}
                    onChange={(e) => setClientForm({ ...clientForm, street: e.target.value })}
                    className="w-full text-xs border border-slate-300 rounded p-2"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Número
                  </label>
                  <input
                    type="text"
                    value={clientForm.number || ''}
                    onChange={(e) => setClientForm({ ...clientForm, number: e.target.value })}
                    className="w-full text-xs border border-slate-300 rounded p-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Cidade
                  </label>
                  <input
                    type="text"
                    value={clientForm.city || ''}
                    onChange={(e) => setClientForm({ ...clientForm, city: e.target.value })}
                    className="w-full text-xs border border-slate-300 rounded p-2"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    UF (Estado)
                  </label>
                  <input
                    type="text"
                    maxLength={2}
                    value={clientForm.state || ''}
                    onChange={(e) => setClientForm({ ...clientForm, state: e.target.value.toUpperCase() })}
                    className="w-full text-xs border border-slate-300 rounded p-2 uppercase"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsClientModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm"
                >
                  Salvar Cliente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Supplier */}
      {isSupplierModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-xl overflow-hidden animate-in fade-in duration-150">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h2 className="text-base font-bold text-slate-900">
                {selectedSupplier ? 'Editar Fornecedor' : 'Novo Fornecedor'}
              </h2>
              <button onClick={() => setIsSupplierModalOpen(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleSaveSupplier} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Código *
                  </label>
                  <input
                    type="text"
                    required
                    value={supplierForm.code || ''}
                    onChange={(e) => setSupplierForm({ ...supplierForm, code: e.target.value })}
                    className="w-full text-xs border border-slate-300 rounded p-2 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    CNPJ
                  </label>
                  <input
                    type="text"
                    value={supplierForm.document || ''}
                    onChange={(e) => setSupplierForm({ ...supplierForm, document: e.target.value })}
                    placeholder="00.000.000/0001-00"
                    className="w-full text-xs border border-slate-300 rounded p-2 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Razão Social / Nome Fantasia *
                </label>
                <input
                  type="text"
                  required
                  value={supplierForm.name || ''}
                  onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })}
                  placeholder="Nome do fornecedor"
                  className="w-full text-xs border border-slate-300 rounded p-2"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Materiais Fornecidos
                </label>
                <input
                  type="text"
                  value={supplierForm.suppliedMaterials || ''}
                  onChange={(e) => setSupplierForm({ ...supplierForm, suppliedMaterials: e.target.value })}
                  placeholder="Ex: Chapas MDF, Tubos de Aço, Ferragens..."
                  className="w-full text-xs border border-slate-300 rounded p-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Contato Comercial
                  </label>
                  <input
                    type="text"
                    value={supplierForm.contactName || ''}
                    onChange={(e) => setSupplierForm({ ...supplierForm, contactName: e.target.value })}
                    className="w-full text-xs border border-slate-300 rounded p-2"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Prazo Médio de Entrega (dias)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={supplierForm.leadTimeDays || 3}
                    onChange={(e) => setSupplierForm({ ...supplierForm, leadTimeDays: parseInt(e.target.value, 10) || 1 })}
                    className="w-full text-xs border border-slate-300 rounded p-2 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Telefone
                  </label>
                  <input
                    type="text"
                    value={supplierForm.phone || ''}
                    onChange={(e) => setSupplierForm({ ...supplierForm, phone: e.target.value })}
                    className="w-full text-xs border border-slate-300 rounded p-2"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    E-mail
                  </label>
                  <input
                    type="email"
                    value={supplierForm.email || ''}
                    onChange={(e) => setSupplierForm({ ...supplierForm, email: e.target.value })}
                    className="w-full text-xs border border-slate-300 rounded p-2"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsSupplierModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm"
                >
                  Salvar Fornecedor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
