import React, { useState } from 'react';
import {
  Settings,
  Shield,
  Building2,
  Database,
  Download,
  Upload,
  RotateCcw,
  CheckCircle,
  HelpCircle,
  FileCode,
} from 'lucide-react';
import { ERPDatabase, SystemSettings } from '../../types/erp';

interface SettingsModuleProps {
  settings: SystemSettings;
  data: ERPDatabase;
  onSaveSettings: (settings: SystemSettings) => Promise<void>;
  onResetDemo: () => Promise<void>;
  onRestoreDatabase: (db: ERPDatabase) => Promise<void>;
}

export const SettingsModule: React.FC<SettingsModuleProps> = ({
  settings,
  data,
  onSaveSettings,
  onResetDemo,
  onRestoreDatabase,
}) => {
  const [form, setForm] = useState<SystemSettings>(JSON.parse(JSON.stringify(settings)));
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      await onSaveSettings(form);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownloadBackup = () => {
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `planoerp_backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const content = evt.target?.result as string;
        const parsed = JSON.parse(content);
        if (confirm('Restaurar este banco de dados? Os dados atuais serão substituídos pelo backup.')) {
          await onRestoreDatabase(parsed);
          alert('Banco de dados restaurado com sucesso!');
        }
      } catch (err: any) {
        alert(`Arquivo de backup inválido: ${err.message}`);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleResetDemoClick = async () => {
    if (confirm('Deseja recarregar os dados de demonstração iniciais da fábrica? Todas as alterações serão restauradas para o estado padrão.')) {
      setIsResetting(true);
      try {
        await onResetDemo();
        alert('Dados de demonstração restaurados com sucesso!');
      } finally {
        setIsResetting(false);
      }
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="border-b border-slate-200 pb-5">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Configurações do Sistema &amp; Responsável Técnico
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Identificação técnica para emissão de Ordens de Produção e laudos, dados da empresa e backup
        </p>
      </div>

      {saveSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs font-semibold flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          Configurações salvas e aplicadas em todos os documentos e relatórios!
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 1: Responsável Técnico */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Shield className="w-5 h-5 text-blue-600" />
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Identificação do Responsável Técnico (PCP / Engenharia)
              </h2>
              <p className="text-xs text-slate-500">
                Este profissional é impresso em todas as Ordens de Produção e relatórios de acompanhamento fabril
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nome do Responsável Técnico *
              </label>
              <input
                type="text"
                required
                value={form.technicalResponsible.name}
                onChange={(e) =>
                  setForm({
                    ...form,
                    technicalResponsible: { ...form.technicalResponsible, name: e.target.value },
                  })
                }
                placeholder="Ex: Engª. Tayná Otoni"
                className="w-full text-xs border border-slate-300 rounded p-2.5 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Registro Profissional (CREA / CRQ / Matrícula) *
              </label>
              <input
                type="text"
                required
                value={form.technicalResponsible.registration}
                onChange={(e) =>
                  setForm({
                    ...form,
                    technicalResponsible: {
                      ...form.technicalResponsible,
                      registration: e.target.value,
                    },
                  })
                }
                placeholder="Ex: CREA-SP 50628394-1"
                className="w-full text-xs border border-slate-300 rounded p-2.5 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Cargo / Função
              </label>
              <input
                type="text"
                value={form.technicalResponsible.role}
                onChange={(e) =>
                  setForm({
                    ...form,
                    technicalResponsible: { ...form.technicalResponsible, role: e.target.value },
                  })
                }
                placeholder="Ex: Responsável Técnico de Produção & PCP"
                className="w-full text-xs border border-slate-300 rounded p-2.5"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                E-mail Profissional
              </label>
              <input
                type="email"
                value={form.technicalResponsible.email || ''}
                onChange={(e) =>
                  setForm({
                    ...form,
                    technicalResponsible: { ...form.technicalResponsible, email: e.target.value },
                  })
                }
                className="w-full text-xs border border-slate-300 rounded p-2.5"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Dados da Empresa */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Building2 className="w-5 h-5 text-slate-700" />
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Dados da Empresa / Fábrica
              </h2>
              <p className="text-xs text-slate-500">
                Informações impressas no cabeçalho das Ordens de Produção e documentos oficiais
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Razão Social
              </label>
              <input
                type="text"
                value={form.companyName}
                onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                className="w-full text-xs border border-slate-300 rounded p-2.5"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nome Fantasia
              </label>
              <input
                type="text"
                value={form.tradeName}
                onChange={(e) => setForm({ ...form, tradeName: e.target.value })}
                className="w-full text-xs border border-slate-300 rounded p-2.5"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                CNPJ
              </label>
              <input
                type="text"
                value={form.cnpj}
                onChange={(e) => setForm({ ...form, cnpj: e.target.value })}
                className="w-full text-xs border border-slate-300 rounded p-2.5 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Telefone / Contato
              </label>
              <input
                type="text"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full text-xs border border-slate-300 rounded p-2.5"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Endereço da Planta Fabril
              </label>
              <input
                type="text"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="w-full text-xs border border-slate-300 rounded p-2.5"
              />
            </div>
          </div>

          <div className="pt-3 flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors"
            >
              {isSaving ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </div>
      </form>

      {/* Section 3: Banco de Dados, Persistência e Backup */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <Database className="w-5 h-5 text-emerald-600" />
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Persistência de Dados &amp; Backup
            </h2>
            <p className="text-xs text-slate-500">
              O banco de dados é gravado em tempo real em disco e pode ser exportado ou restaurado
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 border border-slate-200 rounded-lg bg-slate-50 flex flex-col justify-between space-y-3">
            <div>
              <div className="font-semibold text-xs text-slate-900 flex items-center gap-1.5">
                <Download className="w-4 h-4 text-blue-600" />
                Exportar Backup JSON
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Download completo de todos os cadastros, produtos, OPs e pedidos em formato JSON.
              </p>
            </div>
            <button
              type="button"
              onClick={handleDownloadBackup}
              className="w-full py-2 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 rounded-lg transition-colors text-center"
            >
              Baixar Backup (.json)
            </button>
          </div>

          <div className="p-4 border border-slate-200 rounded-lg bg-slate-50 flex flex-col justify-between space-y-3">
            <div>
              <div className="font-semibold text-xs text-slate-900 flex items-center gap-1.5">
                <Upload className="w-4 h-4 text-emerald-600" />
                Restaurar Backup
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Carregar um arquivo JSON de backup para restaurar todo o banco de dados.
              </p>
            </div>
            <label className="w-full py-2 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 rounded-lg transition-colors text-center cursor-pointer">
              Carregar Arquivo JSON
              <input
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>

          <div className="p-4 border border-slate-200 rounded-lg bg-slate-50 flex flex-col justify-between space-y-3">
            <div>
              <div className="font-semibold text-xs text-slate-900 flex items-center gap-1.5">
                <RotateCcw className="w-4 h-4 text-amber-600" />
                Dados de Demonstração
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Recarrega o catálogo industrial modelo com matérias-primas, produtos e OPs pré-configurados.
              </p>
            </div>
            <button
              type="button"
              disabled={isResetting}
              onClick={handleResetDemoClick}
              className="w-full py-2 text-xs font-semibold text-amber-800 bg-amber-50 border border-amber-200 hover:bg-amber-100 rounded-lg transition-colors text-center disabled:opacity-50"
            >
              {isResetting ? 'Restaurando...' : 'Restaurar Dados Demo'}
            </button>
          </div>
        </div>
      </div>

      {/* Section 4: Instruções de Execução Local */}
      <div className="bg-slate-900 text-slate-200 rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
          <FileCode className="w-5 h-5 text-blue-400" />
          <h3 className="text-sm font-bold text-white">
            Instruções de Execução Local do Projeto
          </h3>
        </div>

        <p className="text-xs text-slate-400">
          Este ERP full-stack foi desenvolvido com React 19 + TypeScript + Tailwind CSS no frontend e Node.js + Express com persistência em banco de dados JSON no backend.
        </p>

        <div className="space-y-2 text-xs font-mono bg-slate-950 p-4 rounded-lg text-slate-300">
          <div className="text-slate-500"># 1. Instalar dependências</div>
          <div className="text-emerald-400">npm install</div>
          <div className="text-slate-500 mt-2"># 2. Executar o servidor de desenvolvimento (Frontend + API Express)</div>
          <div className="text-emerald-400">npm run dev</div>
          <div className="text-slate-500 mt-2"># 3. Build de produção</div>
          <div className="text-emerald-400">npm run build</div>
          <div className="text-slate-500 mt-2"># O banco de dados fica armazenado automaticamente em:</div>
          <div className="text-blue-400">/data/erp_database.json</div>
        </div>
      </div>
    </div>
  );
};
