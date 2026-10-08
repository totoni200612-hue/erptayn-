import React from 'react';
import { UserCheck, Shield, RefreshCw } from 'lucide-react';
import { SystemSettings } from '../../types/erp';

interface NavbarProps {
  settings: SystemSettings | null;
  onOpenSettings: () => void;
  onSync: () => void;
  isSyncing: boolean;
  activeModuleTitle: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  settings,
  onOpenSettings,
  onSync,
  isSyncing,
  activeModuleTitle,
}) => {
  const tech = settings?.technicalResponsible;

  return (
    <header className="no-print h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-20">
      {/* Zone 1: Single text element wordmark */}
      <div className="flex items-center gap-6">
        <a href="#" className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          <span>PlanoERP</span>
          <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">PCP & Gestão</span>
        </a>

        <div className="hidden md:flex items-center text-sm text-slate-500">
          <span>{settings?.tradeName || 'Indústria & Manufatura'}</span>
          <span className="mx-2 text-slate-300">/</span>
          <span className="font-medium text-slate-800">{activeModuleTitle}</span>
        </div>
      </div>

      {/* Zone 3: Responsible Technician Identity & Actions */}
      <div className="flex items-center gap-3">
        <button
          onClick={onSync}
          disabled={isSyncing}
          title="Sincronizar dados"
          className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin text-blue-600' : ''}`} />
        </button>

        {/* Technical Responsible User Display */}
        <button
          onClick={onOpenSettings}
          className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors text-left"
          title="Clique para configurar o Responsável Técnico e dados da empresa"
        >
          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-semibold text-xs shrink-0">
            {tech?.name ? tech.name.slice(0, 2).toUpperCase() : 'RT'}
          </div>
          <div className="text-xs leading-tight">
            <div className="font-semibold text-slate-800 flex items-center gap-1">
              <span>{tech?.name || 'Responsável Técnico'}</span>
              <Shield className="w-3 h-3 text-blue-600" />
            </div>
            <div className="text-slate-500 text-[11px] truncate max-w-[180px]">
              {tech?.registration || 'CREA / Registro'} · {tech?.role || 'PCP'}
            </div>
          </div>
        </button>
      </div>
    </header>
  );
};
