import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
  FolderKanban,
  HelpCircle,
  Layers,
  Users,
  PlusCircle,
  Activity,
  Headphones,
  CheckCircle2,
  FileText,
  BookmarkCheck,
  ClipboardList,
  ClipboardCheck,
  Package,
  Star,
  Laptop,
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onCloseMobile?: () => void;
  isMobileDrawer?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  onCloseMobile,
  isMobileDrawer = false,
}) => {
  const { user, hasRole } = useAuth();
  const [pendingSurveysCount, setPendingSurveysCount] = useState<number>(0);

  const handleTabClick = (tab: string) => {
    onTabChange(tab);
    if (onCloseMobile) onCloseMobile();
  };

  useEffect(() => {
    let isMounted = true;
    const checkPendingSurveys = async () => {
      try {
        const res = await api.getTickets();
        if (res.success && Array.isArray(res.data) && isMounted) {
          const pending = res.data.filter(
            (t: any) =>
              t.solicitante_id === user?.id &&
              t.estado === 'RESUELTO' &&
              (!t.encuesta_puntuacion || t.encuesta_puntuacion === 0)
          );
          setPendingSurveysCount(pending.length);
        }
      } catch {
        // Silently catch
      }
    };

    if (user?.id) {
      checkPendingSurveys();
      const timer = setInterval(checkPendingSurveys, 15000);
      return () => {
        isMounted = false;
        clearInterval(timer);
      };
    }
  }, [user?.id, activeTab]);

  const isSpecialist = hasRole(
    'ADMIN',
    'SUPERVISOR',
    'SUPERVISOR_SG',
    'TECNICO',
    'ESPECIALISTA_REDES',
    'ESPECIALISTA_DESARROLLO',
    'TECNICO_SG',
    'MESA_AYUDA',
    'MESA_AYUDA_SG'
  );
  const isAdmin = hasRole('ADMIN', 'SUPERVISOR', 'SUPERVISOR_SG');
  const isMesaAyuda = hasRole('MESA_AYUDA');
  const isMesaAyudaSG = hasRole('MESA_AYUDA_SG');
  const isSGUser = hasRole('MESA_AYUDA_SG', 'TECNICO_SG', 'SUPERVISOR_SG');
  // Acceso exclusivo a Matriz OCI e Inventario de Materiales: Admin General y Mesa de Ayuda SG
  const canAccessSGManagement = hasRole('ADMIN', 'MESA_AYUDA_SG');

  return (
    <aside
      className={`${
        isMobileDrawer ? 'w-full min-h-full' : 'w-64 min-h-[calc(100vh-4rem)]'
      } bg-slate-900/95 backdrop-blur-md text-slate-300 p-4 flex flex-col justify-between border-r border-slate-800/80 shrink-0 select-none print:hidden`}
    >
      <div className="space-y-6">
        {/* Module title */}
        <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between border-b border-slate-800/60 pb-2">
          <span>Módulos del Sistema</span>
          {isSGUser && (
            <span className="text-[9px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full font-mono font-extrabold border border-amber-500/30">
              SERV. GEN.
            </span>
          )}
        </div>

        <nav className="space-y-1">
          {/* 1. Dashboard Directivo OTIC (Admin General / Supervisor) */}
          {isAdmin && (
            <button
              onClick={() => handleTabClick('admin-dashboard')}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-150 cursor-pointer active:scale-[0.98] ${
                activeTab === 'admin-dashboard'
                  ? 'bg-gradient-to-r from-unalm-600 to-unalm-700 text-white shadow-md shadow-emerald-950/40 font-bold ring-1 ring-white/10'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white hover:translate-x-0.5'
              }`}
            >
              <Activity className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Dashboard OTIC (General)</span>
            </button>
          )}

          {/* 1.1 Dashboard Especializado Servicios Generales (Mesa de Ayuda SG & Admin) */}
          {canAccessSGManagement && (
            <button
              onClick={() => handleTabClick('sg-dashboard')}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-150 cursor-pointer active:scale-[0.98] ${
                activeTab === 'sg-dashboard'
                  ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-white shadow-md shadow-amber-950/40 font-bold ring-1 ring-white/10'
                  : 'text-amber-200/90 hover:bg-slate-800/80 hover:text-white hover:translate-x-0.5'
              }`}
            >
              <Activity className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Dashboard Serv. Generales</span>
            </button>
          )}

          {/* 2. Cola de Tickets / Triage de Mesa de Ayuda (Especialistas / Técnicos) */}
          {isSpecialist && (
            <button
              onClick={() => handleTabClick('specialist')}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-150 cursor-pointer active:scale-[0.98] ${
                activeTab === 'specialist'
                  ? 'bg-gradient-to-r from-unalm-600 to-unalm-700 text-white shadow-md shadow-emerald-950/40 font-bold ring-1 ring-white/10'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white hover:translate-x-0.5'
              }`}
            >
              {isMesaAyudaSG ? (
                <>
                  <Headphones className="w-4 h-4 text-amber-300 shrink-0" />
                  <span>Mesa de Ayuda SG (Triage)</span>
                </>
              ) : isMesaAyuda ? (
                <>
                  <Headphones className="w-4 h-4 text-amber-300 shrink-0" />
                  <span>Mesa de Ayuda OTIC (Triage)</span>
                </>
              ) : isSGUser ? (
                <>
                  <FolderKanban className="w-4 h-4 text-amber-300 shrink-0" />
                  <span>Cola Serv. Generales</span>
                </>
              ) : (
                <>
                  <FolderKanban className="w-4 h-4 text-unalm-300 shrink-0" />
                  <span>Cola de Tickets OTIC</span>
                </>
              )}
            </button>
          )}

          {/* 3. Módulo para Técnicos / Especialistas: Mis Requerimientos Atendidos */}
          {isSpecialist && (
            <button
              onClick={() => handleTabClick('tech-attended')}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-150 cursor-pointer active:scale-[0.98] ${
                activeTab === 'tech-attended'
                  ? 'bg-gradient-to-r from-unalm-600 to-unalm-700 text-white shadow-md shadow-emerald-950/40 font-bold ring-1 ring-white/10'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white hover:translate-x-0.5'
              }`}
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Mis Atendidos (Historial)</span>
            </button>
          )}

          {/* 4. Catálogo de Servicios (Nuevo Requerimiento) */}
          <button
            onClick={() => handleTabClick('catalog')}
            className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-150 cursor-pointer active:scale-[0.98] ${
              activeTab === 'catalog'
                ? 'bg-gradient-to-r from-unalm-600 to-unalm-700 text-white shadow-md shadow-emerald-950/40 font-bold ring-1 ring-white/10'
                : 'text-slate-300 hover:bg-slate-800/80 hover:text-white hover:translate-x-0.5'
            }`}
          >
            <PlusCircle className="w-4 h-4 text-unalm-400 shrink-0" />
            <span>Catálogo de Servicios</span>
          </button>

          {/* 5. Mis Requerimientos Registrados (Historial propio de tickets solicitados) */}
          <button
            onClick={() => handleTabClick('my-tickets')}
            className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-150 cursor-pointer active:scale-[0.98] ${
              activeTab === 'my-tickets'
                ? 'bg-gradient-to-r from-unalm-600 to-unalm-700 text-white shadow-md shadow-emerald-950/40 font-bold ring-1 ring-white/10'
                : 'text-slate-300 hover:bg-slate-800/80 hover:text-white hover:translate-x-0.5'
            }`}
          >
            <FileText className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Mis Solicitudes Registradas</span>
          </button>

          {/* 5.1 Calificaciones Pendientes (con animación parpadeante / pulse si hay encuestas pendientes) */}
          <button
            onClick={() => handleTabClick('pending-surveys')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-150 cursor-pointer active:scale-[0.98] ${
              activeTab === 'pending-surveys'
                ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-white shadow-md shadow-amber-950/40 font-bold ring-1 ring-white/10'
                : pendingSurveysCount > 0
                ? 'bg-amber-950/50 text-amber-300 border border-amber-500/50 hover:bg-amber-900/60 shadow-xs'
                : 'text-slate-300 hover:bg-slate-800/80 hover:text-white hover:translate-x-0.5'
            }`}
          >
            <div className="flex items-center space-x-3">
              <Star
                className={`w-4 h-4 shrink-0 ${
                  pendingSurveysCount > 0
                    ? 'fill-amber-400 text-amber-400 animate-pulse'
                    : 'text-amber-400'
                }`}
              />
              <span className={pendingSurveysCount > 0 ? 'font-bold text-amber-200' : ''}>
                Calificaciones Pendientes
              </span>
            </div>
            {pendingSurveysCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-slate-950 animate-pulse shadow-xs">
                {pendingSurveysCount}
              </span>
            )}
          </button>

          {/* 6. Matriz de Control y Seguimiento de Órdenes de Trabajo (Historial OCI SG - Exclusivo ADMIN y MESA_AYUDA_SG) */}
          {canAccessSGManagement && (
            <button
              onClick={() => handleTabClick('sg-work-orders')}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-150 cursor-pointer active:scale-[0.98] ${
                activeTab === 'sg-work-orders'
                  ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-white shadow-md shadow-amber-950/40 font-bold ring-1 ring-white/10'
                  : 'text-amber-200/90 hover:bg-slate-800/80 hover:text-white hover:translate-x-0.5'
              }`}
            >
              <ClipboardCheck className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Matriz y Control OCI (SG)</span>
            </button>
          )}

          {/* 7. Módulo de Inventario de Materiales e Insumos de Talleres SG (Exclusivo ADMIN y MESA_AYUDA_SG) */}
          {canAccessSGManagement && (
            <button
              onClick={() => handleTabClick('sg-inventory')}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-150 cursor-pointer active:scale-[0.98] ${
                activeTab === 'sg-inventory'
                  ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-white shadow-md shadow-amber-950/40 font-bold ring-1 ring-white/10'
                  : 'text-amber-200/90 hover:bg-slate-800/80 hover:text-white hover:translate-x-0.5'
              }`}
            >
              <Package className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Inventario de Materiales (SG)</span>
            </button>
          )}

          {/* 8. Módulo de Inspecciones Preventivas SIGI (Servicios Generales & Directivos) */}
          {(isSGUser || isAdmin) && (
            <button
              onClick={() => handleTabClick('infrastructure-inspections')}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-150 cursor-pointer active:scale-[0.98] ${
                activeTab === 'infrastructure-inspections'
                  ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-white shadow-md shadow-amber-950/40 font-bold ring-1 ring-white/10'
                  : 'text-amber-300/90 hover:bg-slate-800/80 hover:text-white hover:translate-x-0.5'
              }`}
            >
              <ClipboardList className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Inspecciones SIGI</span>
            </button>
          )}

          {/* 9. Gestión de Usuarios (CRUD - Admin) */}
          {isAdmin && (
            <button
              onClick={() => handleTabClick('admin-users')}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-150 cursor-pointer active:scale-[0.98] ${
                activeTab === 'admin-users'
                  ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-md shadow-purple-950/40 font-bold ring-1 ring-white/10'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white hover:translate-x-0.5'
              }`}
            >
              <Users className="w-4 h-4 text-purple-400 shrink-0" />
              <span>Usuarios y Especialistas</span>
            </button>
          )}

          {/* 10. Catálogo & Matriz SLA (Admin) */}
          {isAdmin && (
            <button
              onClick={() => handleTabClick('admin-catalog')}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-150 cursor-pointer active:scale-[0.98] ${
                activeTab === 'admin-catalog'
                  ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md shadow-indigo-950/40 font-bold ring-1 ring-white/10'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white hover:translate-x-0.5'
              }`}
            >
              <Layers className="w-4 h-4 text-indigo-400 shrink-0" />
              <span>Catálogo de Servicios</span>
            </button>
          )}

          {/* 11. Módulo de Bienes y Equipos Institucionales (Admin & Supervisores) */}
          {isAdmin && (
            <button
              onClick={() => handleTabClick('admin-equipment')}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-150 cursor-pointer active:scale-[0.98] ${
                activeTab === 'admin-equipment'
                  ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md shadow-blue-950/40 font-bold ring-1 ring-white/10'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white hover:translate-x-0.5'
              }`}
            >
              <Laptop className="w-4 h-4 text-blue-400 shrink-0" />
              <span>Bienes Institucionales</span>
            </button>
          )}
        </nav>
      </div>

      {/* Footer info in sidebar */}
      <div className="p-3 bg-slate-950/70 rounded-2xl border border-slate-800/90 text-xs text-slate-400 space-y-1 shadow-inner">
        <div className="flex items-center space-x-2 text-unalm-400 font-bold text-[11px]">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-xs shadow-emerald-400/50" />
          <span>{isSGUser ? 'Servicios Generales UNALM' : 'Mesa de Ayuda UNALM'}</span>
        </div>
        <p className="text-[10px] text-slate-500 font-medium tracking-wide">ROF UNALM • ITIL v4</p>
      </div>
    </aside>
  );
};
