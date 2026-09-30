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
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange }) => {
  const { user } = useAuth();
  const [pendingSurveysCount, setPendingSurveysCount] = useState<number>(0);

  useEffect(() => {
    let isMounted = true;
    const checkPendingSurveys = async () => {
      try {
        const res = await api.getTickets();
        if (res.success && Array.isArray(res.data) && isMounted) {
          const pending = res.data.filter(
            (t: any) => t.solicitante_id === user?.id && t.estado === 'RESUELTO' && (!t.encuesta_puntuacion || t.encuesta_puntuacion === 0)
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
  const isSpecialist = user?.rol && ['ADMIN', 'SUPERVISOR', 'SUPERVISOR_SG', 'TECNICO', 'TECNICO_SG', 'MESA_AYUDA', 'MESA_AYUDA_SG'].includes(user.rol);
  const isAdmin = user?.rol && ['ADMIN', 'SUPERVISOR', 'SUPERVISOR_SG'].includes(user.rol);
  const isMesaAyuda = user?.rol === 'MESA_AYUDA';
  const isMesaAyudaSG = user?.rol === 'MESA_AYUDA_SG';
  const isSGUser = user?.rol && ['MESA_AYUDA_SG', 'TECNICO_SG', 'SUPERVISOR_SG'].includes(user.rol);
  // Acceso exclusivo a Matriz OCI e Inventario de Materiales: Admin General y Mesa de Ayuda SG
  const canAccessSGManagement = user?.rol && ['ADMIN', 'MESA_AYUDA_SG'].includes(user.rol);

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 min-h-[calc(100vh-4rem)] p-4 flex flex-col justify-between border-r border-slate-800 shrink-0 select-none print:hidden">
      <div className="space-y-6">
        {/* Module title */}
        <div className="px-3 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
          <span>Módulos del Sistema</span>
          {isSGUser && (
            <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-mono font-bold">
              SERV. GEN.
            </span>
          )}
        </div>

        <nav className="space-y-1.5">
          {/* 1. Dashboard Directivo OTIC (Admin General / Supervisor) */}
          {isAdmin && (
            <button
              onClick={() => onTabChange('admin-dashboard')}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                activeTab === 'admin-dashboard'
                  ? 'bg-unalm-600 text-white shadow-md font-bold'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Activity className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Dashboard OTIC (General)</span>
            </button>
          )}

          {/* 1.1 Dashboard Especializado Servicios Generales (Mesa de Ayuda SG & Admin) */}
          {canAccessSGManagement && (
            <button
              onClick={() => onTabChange('sg-dashboard')}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                activeTab === 'sg-dashboard'
                  ? 'bg-amber-600 text-white shadow-md font-bold'
                  : 'text-amber-200 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Activity className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Dashboard Serv. Generales</span>
            </button>
          )}

          {/* 2. Cola de Tickets / Triage de Mesa de Ayuda (Especialistas / Técnicos) */}
          {isSpecialist && (
            <button
              onClick={() => onTabChange('specialist')}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                activeTab === 'specialist'
                  ? 'bg-unalm-600 text-white shadow-md font-bold'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
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
              onClick={() => onTabChange('tech-attended')}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                activeTab === 'tech-attended'
                  ? 'bg-unalm-600 text-white shadow-md font-bold'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Mis Atendidos (Historial)</span>
            </button>
          )}

          {/* 4. Catálogo de Servicios (Nuevo Requerimiento) */}
          <button
            onClick={() => onTabChange('catalog')}
            className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              activeTab === 'catalog'
                ? 'bg-unalm-600 text-white shadow-md font-bold'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <PlusCircle className="w-4 h-4 text-unalm-400 shrink-0" />
            <span>Catálogo de Servicios</span>
          </button>

          {/* 5. Mis Requerimientos Registrados (Historial propio de tickets solicitados) */}
          <button
            onClick={() => onTabChange('my-tickets')}
            className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              activeTab === 'my-tickets'
                ? 'bg-unalm-600 text-white shadow-md font-bold'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Mis Solicitudes Registradas</span>
          </button>

          {/* 5.1 Calificaciones Pendientes (con animación parpadeante / pulse si hay encuestas pendientes) */}
          <button
            onClick={() => onTabChange('pending-surveys')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              activeTab === 'pending-surveys'
                ? 'bg-amber-600 text-white shadow-md font-bold'
                : pendingSurveysCount > 0
                  ? 'bg-amber-950/40 text-amber-300 border border-amber-500/40 hover:bg-amber-900/50'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <div className="flex items-center space-x-3">
              <Star className={`w-4 h-4 shrink-0 ${pendingSurveysCount > 0 ? 'fill-amber-400 text-amber-400 animate-pulse' : 'text-amber-400'}`} />
              <span className={pendingSurveysCount > 0 ? 'font-bold text-amber-200' : ''}>Calificaciones Pendientes</span>
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
              onClick={() => onTabChange('sg-work-orders')}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                activeTab === 'sg-work-orders'
                  ? 'bg-amber-600 text-white shadow-md font-bold'
                  : 'text-amber-200 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <ClipboardCheck className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Matriz y Control OCI (SG)</span>
            </button>
          )}

          {/* 7. Módulo de Inventario de Materiales e Insumos de Talleres SG (Exclusivo ADMIN y MESA_AYUDA_SG) */}
          {canAccessSGManagement && (
            <button
              onClick={() => onTabChange('sg-inventory')}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                activeTab === 'sg-inventory'
                  ? 'bg-amber-600 text-white shadow-md font-bold'
                  : 'text-amber-200 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Package className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Inventario de Materiales (SG)</span>
            </button>
          )}

          {/* 8. Módulo de Inspecciones Preventivas SIGI (Servicios Generales & Directivos) */}
          {(isSGUser || isAdmin) && (
            <button
              onClick={() => onTabChange('infrastructure-inspections')}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                activeTab === 'infrastructure-inspections'
                  ? 'bg-amber-600 text-white shadow-md font-bold'
                  : 'text-amber-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <ClipboardList className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Inspecciones SIGI</span>
            </button>
          )}

          {/* 7. Gestión de Usuarios (CRUD - Admin) */}
          {isAdmin && (
            <button
              onClick={() => onTabChange('admin-users')}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                activeTab === 'admin-users'
                  ? 'bg-unalm-600 text-white shadow-md font-bold'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Users className="w-4 h-4 text-purple-400 shrink-0" />
              <span>Usuarios y Especialistas</span>
            </button>
          )}

          {/* 8. Catálogo & Matriz SLA (Admin) */}
          {isAdmin && (
            <button
              onClick={() => onTabChange('admin-catalog')}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                activeTab === 'admin-catalog'
                  ? 'bg-unalm-600 text-white shadow-md font-bold'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Layers className="w-4 h-4 text-indigo-400 shrink-0" />
              <span>Catálogo de Servicios</span>
            </button>
          )}
        </nav>
      </div>

      {/* Footer info in sidebar */}
      <div className="p-3 bg-slate-950/60 rounded-2xl border border-slate-800 text-xs text-slate-400 space-y-1">
        <div className="flex items-center space-x-2 text-unalm-400 font-bold text-[11px]">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>{isSGUser ? 'Servicios Generales UNALM' : 'Mesa de Ayuda UNALM'}</span>
        </div>
        <p className="text-[10px] text-slate-500 font-medium">ROF UNALM • ITIL v4</p>
      </div>
    </aside>
  );
};
