import React from 'react';
import { ArrowLeft, Home, ChevronRight, FileText, PlusCircle, Star, Search, Laptop } from 'lucide-react';
import { StatusBadge } from './Badge';

interface TopNavigationBarProps {
  userRole?: string;
  activeTab: string;
  selectedTicketId: number | null;
  selectedTicketCode?: string | null;
  selectedTicketStatus?: string | null;
  onNavigateTab: (tab: string) => void;
  onBack: () => void;
  pendingSurveysCount?: number;
  onOpenEquipmentLookup?: () => void;
}

export const TopNavigationBar: React.FC<TopNavigationBarProps> = ({
  userRole,
  activeTab,
  selectedTicketId,
  selectedTicketCode,
  selectedTicketStatus,
  onNavigateTab,
  onBack,
  pendingSurveysCount = 0,
  onOpenEquipmentLookup,
}) => {
  const isSolicitant = !userRole || userRole === 'SOLICITANTE';
  const isSpecialistOrAdmin = Boolean(
    userRole &&
      [
        'ADMIN',
        'SUPERVISOR',
        'SUPERVISOR_SG',
        'MESA_AYUDA',
        'MESA_AYUDA_SG',
        'TECNICO',
        'ESPECIALISTA_REDES',
        'ESPECIALISTA_DESARROLLO',
        'TECNICO_SG',
      ].includes(userRole)
  );

  const getTabLabel = (tab: string) => {
    switch (tab) {
      case 'catalog':
        return 'Catálogo de Servicios';
      case 'my-tickets':
        return 'Mis Solicitudes';
      case 'pending-surveys':
        return 'Calificaciones Pendientes';
      case 'specialist':
        return 'Bandeja de Atención';
      case 'tech-attended':
        return 'Mis Atendidos';
      case 'admin-dashboard':
        return 'Dashboard OTIC';
      case 'sg-dashboard':
        return 'Dashboard Serv. Generales';
      case 'admin-users':
        return 'Gestión de Usuarios';
      case 'admin-catalog':
        return 'Gestión de Catálogo';
      case 'sg-work-orders':
        return 'Órdenes de Trabajo';
      case 'sg-inventory':
        return 'Inventario de Materiales';
      case 'infrastructure-inspections':
        return 'Inspecciones SIGI';
      default:
        return 'Mesa de Ayuda';
    }
  };

  const getBackButtonLabel = () => {
    if (isSolicitant) return 'Volver a Mis Solicitudes';
    if (activeTab === 'tech-attended') return 'Volver a Mis Atendidos';
    if (activeTab === 'sg-work-orders') return 'Volver a Órdenes de Trabajo';
    if (activeTab === 'infrastructure-inspections') return 'Volver a Inspecciones';
    return 'Volver al Listado';
  };

  return (
    <nav
      aria-label="Barra de Navegación Contextual"
      className="relative shrink-0 w-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 z-20 shadow-2xs print:hidden transition-colors duration-200"
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2.5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Left section: Back button & Breadcrumb Trail */}
          <div className="flex items-center space-x-2 sm:space-x-3 overflow-x-auto py-0.5 no-scrollbar min-w-0">
            {selectedTicketId ? (
              <button
                type="button"
                onClick={onBack}
                title="Regresar a la vista anterior"
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/90 dark:bg-slate-800 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-200 border border-slate-200/90 dark:border-slate-700 text-xs font-bold transition-all shadow-2xs hover:shadow-xs cursor-pointer shrink-0 active:scale-95 group"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 group-hover:-translate-x-1 transition-transform duration-200" />
                <span>{getBackButtonLabel()}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onNavigateTab(isSolicitant ? 'catalog' : 'specialist')}
                className="p-1.5 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all shrink-0 cursor-pointer active:scale-95"
                title="Ir al inicio"
              >
                <Home className="w-4 h-4" />
              </button>
            )}

            {/* Breadcrumb Trail */}
            <div className="flex items-center space-x-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 shrink-0">
              <button
                type="button"
                onClick={() => {
                  if (selectedTicketId) onBack();
                  else onNavigateTab(isSolicitant ? 'catalog' : 'specialist');
                }}
                className="hidden sm:inline hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer"
              >
                Mesa de Ayuda
              </button>
              <ChevronRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 hidden sm:inline" />

              <button
                type="button"
                onClick={() => {
                  if (selectedTicketId) onBack();
                }}
                className={`transition-colors cursor-pointer font-semibold ${
                  selectedTicketId
                    ? 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                    : 'text-unalm-700 dark:text-emerald-400 font-extrabold'
                }`}
              >
                {getTabLabel(activeTab)}
              </button>

              {selectedTicketId && (
                <>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600" />
                  <div className="flex items-center space-x-1.5">
                    <span className="font-mono font-extrabold text-[12px] text-unalm-900 dark:text-emerald-300 bg-unalm-50/90 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-lg border border-unalm-300/70 dark:border-emerald-800/80 shadow-2xs">
                      {selectedTicketCode || `Ticket #${selectedTicketId}`}
                    </span>
                    {selectedTicketStatus && (
                      <span className="hidden md:inline-block">
                        <StatusBadge status={selectedTicketStatus as any} />
                      </span>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Right section: Contextual Actions */}
          <div className="flex items-center space-x-2 shrink-0">
            {/* Quick Equipment History Lookup habilitado para todos los usuarios */}
            {onOpenEquipmentLookup && (
              <button
                type="button"
                onClick={onOpenEquipmentLookup}
                title="Consultar Historial de Bien Institucional • Módulo de consulta rápida de hoja de vida y atenciones técnicas por código patrimonial"
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-blue-50/90 hover:bg-blue-100/90 dark:bg-blue-950/40 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 border border-blue-200/90 dark:border-blue-800/70 text-xs font-bold transition-all shadow-2xs hover:shadow-xs cursor-pointer active:scale-95"
              >
                <Laptop className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span className="hidden sm:inline">Consultar Historial de Bien</span>
                <span className="sm:hidden">Bien</span>
              </button>
            )}

            {/* Solicitant Navigation Pills */}
            {isSolicitant && !selectedTicketId && (
              <div className="flex items-center space-x-1 bg-slate-100/90 dark:bg-slate-800/90 p-1 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shrink-0">
                <button
                  type="button"
                  onClick={() => onNavigateTab('catalog')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer active:scale-95 ${
                    activeTab === 'catalog'
                      ? 'bg-white dark:bg-slate-900 text-unalm-700 dark:text-emerald-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Catálogo</span>
                </button>

                <button
                  type="button"
                  onClick={() => onNavigateTab('my-tickets')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer active:scale-95 ${
                    activeTab === 'my-tickets'
                      ? 'bg-white dark:bg-slate-900 text-unalm-700 dark:text-emerald-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Mis Solicitudes</span>
                </button>

                {pendingSurveysCount > 0 && (
                  <button
                    type="button"
                    onClick={() => onNavigateTab('pending-surveys')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center space-x-1 cursor-pointer active:scale-95 ${
                      activeTab === 'pending-surveys'
                        ? 'bg-amber-500 text-slate-950 shadow-xs'
                        : 'text-amber-600 dark:text-amber-400 hover:bg-amber-100/50 dark:hover:bg-amber-950/40'
                    }`}
                    title="Tienes calificaciones pendientes"
                  >
                    <Star className="w-3 h-3 fill-current" />
                    <span className="font-mono text-[11px]">{pendingSurveysCount}</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
