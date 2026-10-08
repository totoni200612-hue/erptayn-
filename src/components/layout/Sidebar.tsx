import React from 'react';
import {
  LayoutDashboard,
  Factory,
  ShoppingCart,
  Layers,
  Boxes,
  Gauge,
  Users,
  FileText,
  Settings,
} from 'lucide-react';

export type NavigationModule =
  | 'dashboard'
  | 'producao'
  | 'pedidos'
  | 'produtos'
  | 'materia-prima'
  | 'capacidade'
  | 'parceiros'
  | 'relatorios'
  | 'configuracoes';

interface SidebarProps {
  activeModule: NavigationModule;
  onSelectModule: (module: NavigationModule) => void;
  activeOpsCount: number;
  pendingOrdersCount: number;
  lowStockCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeModule,
  onSelectModule,
  activeOpsCount,
  pendingOrdersCount,
  lowStockCount,
}) => {
  const navItems = [
    {
      id: 'dashboard' as NavigationModule,
      label: 'Visão Geral',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'producao' as NavigationModule,
      label: 'Ordens de Produção',
      icon: Factory,
      badge: activeOpsCount > 0 ? activeOpsCount : null,
      badgeColor: 'bg-blue-100 text-blue-700',
    },
    {
      id: 'pedidos' as NavigationModule,
      label: 'Pedidos de Venda',
      icon: ShoppingCart,
      badge: pendingOrdersCount > 0 ? pendingOrdersCount : null,
      badgeColor: 'bg-amber-100 text-amber-700',
    },
    {
      id: 'produtos' as NavigationModule,
      label: 'Fichas Técnicas (BOM)',
      icon: Layers,
      badge: null,
    },
    {
      id: 'materia-prima' as NavigationModule,
      label: 'Matéria-Prima',
      icon: Boxes,
      badge: lowStockCount > 0 ? `${lowStockCount} alertas` : null,
      badgeColor: 'bg-rose-100 text-rose-700',
    },
    {
      id: 'capacidade' as NavigationModule,
      label: 'Capacidade Produtiva',
      icon: Gauge,
      badge: null,
    },
    {
      id: 'parceiros' as NavigationModule,
      label: 'Clientes & Fornecedores',
      icon: Users,
      badge: null,
    },
    {
      id: 'relatorios' as NavigationModule,
      label: 'Relatórios & Emissão',
      icon: FileText,
      badge: null,
    },
    {
      id: 'configuracoes' as NavigationModule,
      label: 'Configurações & Resp. Técnico',
      icon: Settings,
      badge: null,
    },
  ];

  return (
    <aside className="no-print w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0 min-h-[calc(100vh-4rem)] border-r border-slate-800">
      <div className="p-4 border-b border-slate-800">
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Módulos do Sistema
        </div>
      </div>

      <nav className="p-3 space-y-1 flex-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeModule === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onSelectModule(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span className="truncate">{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                    isActive ? 'bg-white/20 text-white' : item.badgeColor || 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800 text-xs text-slate-400 space-y-1">
        <div className="font-medium text-slate-300">PCP Industrial v1.0</div>
        <div>Persistência em Tempo Real</div>
      </div>
    </aside>
  );
};
