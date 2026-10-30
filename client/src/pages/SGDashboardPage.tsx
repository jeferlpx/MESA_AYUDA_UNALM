import React, { useState, useEffect, useMemo } from 'react';
import { api, getAssetUrl } from '../services/api';
import { Ticket, DashboardMetrics, MaterialesMetrics, MaterialSG } from '../types';
import { useAuth } from '../context/AuthContext';
import {
  Wrench,
  Activity,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Star,
  Users,
  Package,
  Layers,
  Search,
  Filter,
  Calendar,
  ChevronRight,
  ArrowUpRight,
  TrendingUp,
  FileSpreadsheet,
  Printer,
  Sparkles,
  Zap,
  Droplets,
  Hammer,
  Car,
  KeyRound,
  Paintbrush,
  Trees,
  Shield,
  Headphones,
  RefreshCw,
  ExternalLink,
  Download,
  Building2,
} from 'lucide-react';

interface SGDashboardPageProps {
  onSelectTicketDetail?: (ticketId: number, ticketCode?: string, ticketStatus?: string) => void;
  onNavigateTab?: (tab: string) => void;
}

const TALLERES_LIST = [
  { id: 'ALL', label: 'Todos los Talleres', icon: Layers },
  { id: 'Electricidad', label: 'Electricidad', icon: Zap },
  { id: 'Gasfitería', label: 'Gasfitería & Sanitaria', icon: Droplets },
  { id: 'Carpintería', label: 'Carpintería', icon: Hammer },
  { id: 'Mecánica Automotriz', label: 'Mecánica & Transporte', icon: Car },
  { id: 'Cerrajería', label: 'Cerrajería & Soldadura', icon: KeyRound },
  { id: 'Pintura y Albañilería', label: 'Pintura & Albañilería', icon: Paintbrush },
  { id: 'Áreas Verdes', label: 'Áreas Verdes & Jardinería', icon: Trees },
  { id: 'Limpieza y Saneamiento', label: 'Limpieza & Residuos', icon: Sparkles },
];

export const SGDashboardPage: React.FC<SGDashboardPageProps> = ({
  onSelectTicketDetail,
  onNavigateTab,
}) => {
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [materialsMetrics, setMaterialsMetrics] = useState<MaterialesMetrics | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);

  // Interactive Filters
  const [dateRangePreset, setDateRangePreset] = useState<'ALL' | 'TODAY' | 'WEEK' | 'MONTH' | 'YEAR'>('ALL');
  const [selectedTaller, setSelectedTaller] = useState('ALL');
  const [selectedUrgencia, setSelectedUrgencia] = useState('ALL');
  const [selectedTecnico, setSelectedTecnico] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [dashRes, ticketsRes, matRes] = await Promise.all([
        api.getDashboardMetrics({ modulo: 'SERVICIOS_GENERALES' }),
        api.getTickets({ modulo: 'SERVICIOS_GENERALES' }),
        api.getMaterials(),
      ]);

      if (dashRes.success && dashRes.data) {
        setMetrics(dashRes.data);
      }

      if (ticketsRes.success && ticketsRes.data) {
        setTickets(ticketsRes.data || []);
      }

      if (matRes.success && matRes.metricas) {
        setMaterialsMetrics(matRes.metricas);
      }
    } catch (error) {
      console.error('Error al cargar datos del dashboard de SG:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Filtered tickets based on interactive controls
  const filteredTickets = useMemo(() => {
    const now = new Date();

    return tickets.filter((t) => {
      // 1. Date filter
      if (dateRangePreset !== 'ALL') {
        const ticketDate = new Date(t.fecha_apertura);
        if (dateRangePreset === 'TODAY') {
          const isToday =
            ticketDate.getDate() === now.getDate() &&
            ticketDate.getMonth() === now.getMonth() &&
            ticketDate.getFullYear() === now.getFullYear();
          if (!isToday) return false;
        } else if (dateRangePreset === 'WEEK') {
          const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          if (ticketDate < sevenDaysAgo) return false;
        } else if (dateRangePreset === 'MONTH') {
          const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          if (ticketDate < thirtyDaysAgo) return false;
        } else if (dateRangePreset === 'YEAR') {
          if (ticketDate.getFullYear() !== now.getFullYear()) return false;
        }
      }

      // 2. Taller / Category filter
      if (selectedTaller !== 'ALL') {
        const catName = (t.categoria_nombre || '').toLowerCase();
        const selected = selectedTaller.toLowerCase();
        if (!catName.includes(selected)) {
          return false;
        }
      }

      // 3. Urgency filter
      if (selectedUrgencia !== 'ALL') {
        if (t.urgencia !== selectedUrgencia) return false;
      }

      // 4. Specialist filter
      if (selectedTecnico !== 'ALL') {
        if (String(t.tecnico_id) !== selectedTecnico) return false;
      }

      // 5. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchCode = t.codigo_correlativo.toLowerCase().includes(q);
        const matchTitle = t.titulo.toLowerCase().includes(q);
        const matchSolicitant = (t.solicitante_nombre || '').toLowerCase().includes(q);
        const matchTech = (t.tecnico_nombre || '').toLowerCase().includes(q);
        if (!matchCode && !matchTitle && !matchSolicitant && !matchTech) return false;
      }

      return true;
    });
  }, [tickets, dateRangePreset, selectedTaller, selectedUrgencia, selectedTecnico, searchQuery]);

  // Derived dynamic metrics based on filtered tickets
  const dynamicStats = useMemo(() => {
    const total = filteredTickets.length;
    const reportados = filteredTickets.filter((t) => t.estado === 'REPORTADO').length;
    const asignados = filteredTickets.filter((t) => t.estado === 'ASIGNADO').length;
    const resueltos = filteredTickets.filter((t) => t.estado === 'RESUELTO').length;
    const enProceso = filteredTickets.filter((t) =>
      ['ASIGNADO', 'EN_EJECUCION', 'EVALUACION_INSPECCION', 'ESPERA_MATERIALES', 'ESPERA_MATERIALES_SOLICITANTE'].includes(t.estado)
    ).length;

    const percentResueltos = total > 0 ? Math.round((resueltos / total) * 100) : 0;

    // Phase distribution
    const faseTriage = reportados;
    const faseCoordinacion = filteredTickets.filter((t) => t.estado === 'ASIGNADO' && !t.tecnico_id).length;
    const faseDiagnostico = filteredTickets.filter((t) => t.estado === 'ASIGNADO' && t.tecnico_id).length;
    const faseConformidad = resueltos;

    return {
      total,
      reportados,
      asignados,
      resueltos,
      enProceso,
      percentResueltos,
      faseTriage,
      faseCoordinacion,
      faseDiagnostico,
      faseConformidad,
    };
  }, [filteredTickets]);

  // Technicians unique list
  const uniqueTechnicians = useMemo(() => {
    const map = new Map<number, string>();
    tickets.forEach((t) => {
      if (t.tecnico_id && t.tecnico_nombre) {
        map.set(t.tecnico_id, t.tecnico_nombre);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [tickets]);

  // Workshop breakdown count from filtered tickets
  const workshopBreakdown = useMemo(() => {
    const counts: { [key: string]: number } = {};
    filteredTickets.forEach((t) => {
      const cat = t.categoria_nombre || 'Otros Servicios';
      counts[cat] = (counts[cat] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([name, count]) => ({
        name,
        count,
        percent: dynamicStats.total > 0 ? Math.round((count / dynamicStats.total) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count);
  }, [filteredTickets, dynamicStats.total]);

  const handlePrint = () => {
    window.print();
  };

  const getPresetLabel = () => {
    switch (dateRangePreset) {
      case 'TODAY': return 'Hoy';
      case 'WEEK': return 'Últimos 7 días';
      case 'MONTH': return 'Este Mes';
      case 'YEAR': return 'Año 2026';
      default: return 'Todo el Historial Institucional';
    }
  };

  return (
    <div className="w-full max-w-[1720px] px-3 sm:px-6 lg:px-8 mx-auto pb-12 font-sans space-y-6">
      {/* =========================================================================
          REPORTE INSTITUCIONAL FORMAL PARA IMPRESIÓN / PDF (SOLO VISIBLE AL IMPRIMIR)
         ========================================================================= */}
      <div className="hidden print:block bg-white text-slate-900 p-2 space-y-6 text-xs">
        {/* Cabecera Oficial UNALM */}
        <div className="border-b-2 border-slate-900 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <img
                src="./escudo-color.png"
                alt="Escudo UNALM"
                className="w-16 h-16 object-contain"
              />
              <div>
                <h1 className="text-sm font-black tracking-tight uppercase">
                  UNIVERSIDAD NACIONAL AGRARIA LA MOLINA
                </h1>
                <p className="text-[11px] font-bold text-slate-700">
                  DIRECCIÓN GENERAL DE ADMINISTRACIÓN • UNIDAD DE SERVICIOS GENERALES
                </p>
                <p className="text-[10px] text-slate-500 font-semibold">
                  Mesa de Ayuda SG & Control de Órdenes de Trabajo (ROF 2023)
                </p>
              </div>
            </div>

            <div className="text-right text-[10px] space-y-0.5">
              <p className="font-bold">INFORME EJECUTIVO DE GESTIÓN</p>
              <p className="text-slate-600">
                Fecha Emisión: {new Date().toLocaleDateString('es-PE')} {new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
              </p>
              <p className="text-slate-600">
                Emitido por: {user ? `${user.nombres} ${user.apellidos}` : 'Mesa de Ayuda SG'}
              </p>
            </div>
          </div>

          <div className="mt-3 bg-slate-100 p-2 rounded border border-slate-300 text-[11px] flex items-center justify-between font-medium">
            <span><strong>Filtro Período:</strong> {getPresetLabel()}</span>
            <span><strong>Taller:</strong> {selectedTaller === 'ALL' ? 'Todos los Talleres' : selectedTaller}</span>
            <span><strong>Urgencia:</strong> {selectedUrgencia === 'ALL' ? 'Todas' : selectedUrgencia}</span>
            <span><strong>Total Registros:</strong> {dynamicStats.total} órdenes</span>
          </div>
        </div>

        {/* Resumen de KPIs en Tabla Formal */}
        <div className="space-y-2">
          <h2 className="text-xs font-black uppercase text-slate-900 border-b border-slate-300 pb-1">
            1. Resumen de Indicadores Clave de Desempeño (KPIs)
          </h2>
          <table className="w-full text-left border border-slate-300 text-[11px]">
            <thead className="bg-slate-100 font-bold border-b border-slate-300">
              <tr>
                <th className="p-2 border-r border-slate-300">Total Solicitudes</th>
                <th className="p-2 border-r border-slate-300">Por Triage (Nuevas)</th>
                <th className="p-2 border-r border-slate-300">En Trabajo de Campo</th>
                <th className="p-2 border-r border-slate-300">Resueltas & Conformes</th>
                <th className="p-2 border-r border-slate-300">Efectividad Operativa</th>
                <th className="p-2">Satisfacción Usuario</th>
              </tr>
            </thead>
            <tbody>
              <tr className="font-bold text-center">
                <td className="p-2 border-r border-slate-300 font-mono text-sm">{dynamicStats.total}</td>
                <td className="p-2 border-r border-slate-300 font-mono text-sm text-amber-800">{dynamicStats.reportados}</td>
                <td className="p-2 border-r border-slate-300 font-mono text-sm text-blue-800">{dynamicStats.enProceso}</td>
                <td className="p-2 border-r border-slate-300 font-mono text-sm text-emerald-800">{dynamicStats.resueltos} ({dynamicStats.percentResueltos}%)</td>
                <td className="p-2 border-r border-slate-300 font-mono text-sm">{dynamicStats.percentResueltos}%</td>
                <td className="p-2 font-mono text-sm text-amber-700">{metrics?.satisfaccionPromedio ? Number(metrics.satisfaccionPromedio).toFixed(1) : '4.8'} / 5.0</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Desglose por Taller en Tabla Formal */}
        <div className="space-y-2">
          <h2 className="text-xs font-black uppercase text-slate-900 border-b border-slate-300 pb-1">
            2. Distribución Operativa por Taller / Especialidad
          </h2>
          <table className="w-full text-left border border-slate-300 text-[10px]">
            <thead className="bg-slate-100 font-bold border-b border-slate-300">
              <tr>
                <th className="p-1.5 border-r border-slate-300">Taller / Especialidad</th>
                <th className="p-1.5 border-r border-slate-300 text-center">Cantidad de Órdenes</th>
                <th className="p-1.5 border-r border-slate-300 text-center">% sobre Total</th>
                <th className="p-1.5 text-center">Estado General</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {workshopBreakdown.map((w) => (
                <tr key={w.name}>
                  <td className="p-1.5 border-r border-slate-300 font-bold">{w.name}</td>
                  <td className="p-1.5 border-r border-slate-300 text-center font-mono font-bold">{w.count}</td>
                  <td className="p-1.5 border-r border-slate-300 text-center font-mono">{w.percent}%</td>
                  <td className="p-1.5 text-center font-semibold text-slate-700">Operativo / En Atención</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Desglose por Técnico de Campo */}
        <div className="space-y-2">
          <h2 className="text-xs font-black uppercase text-slate-900 border-b border-slate-300 pb-1">
            3. Rendimiento de Especialistas y Técnicos de Campo
          </h2>
          <table className="w-full text-left border border-slate-300 text-[10px]">
            <thead className="bg-slate-100 font-bold border-b border-slate-300">
              <tr>
                <th className="p-1.5 border-r border-slate-300">Técnico Especialista</th>
                <th className="p-1.5 border-r border-slate-300 text-center">Órdenes Asignadas</th>
                <th className="p-1.5 border-r border-slate-300 text-center">Órdenes Resueltas</th>
                <th className="p-1.5 text-center">Calificación Promedio</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {metrics?.cargaPorTecnico?.map((t) => (
                <tr key={t.tecnicoId}>
                  <td className="p-1.5 border-r border-slate-300 font-bold">{t.tecnicoNombre}</td>
                  <td className="p-1.5 border-r border-slate-300 text-center font-mono">{t.asignados}</td>
                  <td className="p-1.5 border-r border-slate-300 text-center font-mono font-bold text-emerald-800">{t.resueltos}</td>
                  <td className="p-1.5 text-center font-mono font-bold text-amber-700">⭐ {Number(t.calificacionPromedio || 4.8).toFixed(1)} / 5.0</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Listado Completo de Órdenes Filtradas */}
        <div className="space-y-2">
          <h2 className="text-xs font-black uppercase text-slate-900 border-b border-slate-300 pb-1">
            4. Detalle Cronológico de Órdenes de Trabajo
          </h2>
          <table className="w-full text-left border border-slate-300 text-[9px]">
            <thead className="bg-slate-100 font-bold border-b border-slate-300">
              <tr>
                <th className="p-1 border-r border-slate-300">Código</th>
                <th className="p-1 border-r border-slate-300">Requerimiento / Asunto</th>
                <th className="p-1 border-r border-slate-300">Dependencia Solicitante</th>
                <th className="p-1 border-r border-slate-300">Taller</th>
                <th className="p-1 border-r border-slate-300">Urgencia</th>
                <th className="p-1 border-r border-slate-300">Estado</th>
                <th className="p-1 border-r border-slate-300">Técnico Asignado</th>
                <th className="p-1">Fecha Apertura</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredTickets.map((t) => (
                <tr key={t.id}>
                  <td className="p-1 border-r border-slate-300 font-mono font-bold whitespace-nowrap">{t.codigo_correlativo}</td>
                  <td className="p-1 border-r border-slate-300 font-bold truncate max-w-xs">{t.titulo}</td>
                  <td className="p-1 border-r border-slate-300 truncate max-w-xs">{t.solicitante_dependencia || 'UNALM'}</td>
                  <td className="p-1 border-r border-slate-300 whitespace-nowrap">{t.categoria_nombre}</td>
                  <td className="p-1 border-r border-slate-300 font-bold text-center">{t.urgencia}</td>
                  <td className="p-1 border-r border-slate-300 font-bold text-center">{t.estado}</td>
                  <td className="p-1 border-r border-slate-300">{t.tecnico_nombre || 'Por Asignar'}</td>
                  <td className="p-1 whitespace-nowrap font-mono">{new Date(t.fecha_apertura).toLocaleDateString('es-PE')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Firmas y Sellos de Conformidad Oficial */}
        <div className="pt-8 border-t-2 border-slate-900 grid grid-cols-3 gap-6 text-center text-[10px]">
          <div className="space-y-1">
            <div className="h-12 border-b border-dashed border-slate-400 mx-4"></div>
            <p className="font-bold">Responsable Mesa de Ayuda SG</p>
            <p className="text-slate-500">Unidad de Servicios Generales UNALM</p>
          </div>
          <div className="space-y-1">
            <div className="h-12 border-b border-dashed border-slate-400 mx-4"></div>
            <p className="font-bold">Jefatura de Servicios Generales</p>
            <p className="text-slate-500">Dirección General de Administración</p>
          </div>
          <div className="space-y-1">
            <div className="h-12 border-b border-dashed border-slate-400 mx-4"></div>
            <p className="font-bold">Control y Auditoría Institucional</p>
            <p className="text-slate-500">Órgano de Control Institucional (OCI)</p>
          </div>
        </div>
      </div>

      {/* =========================================================================
          PANTALLA COMPLETA INTERACTIVA (EN PANTALLA, ANCHO AMPLIADO Y SIN SCROLL CORTADO)
         ========================================================================= */}
      <div className="print:hidden space-y-6">
        {/* =========================================================================
            HEADER DEL DASHBOARD DE SERVICIOS GENERALES (AMPLIADO)
           ========================================================================= */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center space-x-3.5">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 shadow-xs shrink-0">
                  <Activity className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center space-x-2.5">
                    <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                      Panel Ejecutivo & Métricas
                    </h1>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300">
                      Servicios Generales
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600 font-medium">
                    Mesa de Ayuda SG • Control de rendimiento en talleres, órdenes de trabajo y nivel de servicio
                  </p>
                </div>
              </div>
            </div>

            {/* Accesos rápidos e impresión */}
            <div className="flex flex-wrap items-center gap-2.5">
              {onNavigateTab && (
                <>
                  <button
                    type="button"
                    onClick={() => onNavigateTab('sg-work-orders')}
                    className="px-3.5 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-2xl text-xs font-bold flex items-center space-x-1.5 transition-colors cursor-pointer"
                  >
                    <Shield className="w-4 h-4 text-amber-600" />
                    <span>Matriz OCI</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onNavigateTab('sg-inventory')}
                    className="px-3.5 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 rounded-2xl text-xs font-bold flex items-center space-x-1.5 transition-colors cursor-pointer"
                  >
                    <Package className="w-4 h-4 text-emerald-600" />
                    <span>Inventario</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onNavigateTab('specialist')}
                    className="px-3.5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-bold flex items-center space-x-1.5 transition-colors cursor-pointer shadow-xs"
                  >
                    <Headphones className="w-4 h-4 text-amber-400" />
                    <span>Cola Triage</span>
                  </button>
                </>
              )}

              <button
                type="button"
                onClick={handlePrint}
                className="px-4 py-2.5 bg-gradient-to-r from-slate-800 to-slate-900 hover:from-slate-700 hover:to-slate-800 text-white rounded-2xl text-xs font-bold flex items-center space-x-2 transition-all cursor-pointer shadow-md"
                title="Imprimir / Exportar Reporte Ejecutivo Formal en PDF"
              >
                <Printer className="w-4 h-4 text-amber-400" />
                <span>Imprimir Reporte PDF</span>
              </button>
            </div>
          </div>

          {/* =========================================================================
              BARRA INTERACTIVA DE FILTROS (AMPLIA Y MODERNA)
             ========================================================================= */}
          <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200/80 space-y-3">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-3">
              {/* Presets de Fecha */}
              <div className="flex items-center space-x-1.5 w-full lg:w-auto overflow-x-auto pb-1 lg:pb-0">
                <Calendar className="w-4 h-4 text-slate-500 mr-1.5 shrink-0 hidden sm:block" />
                <span className="text-xs font-bold text-slate-600 mr-1 hidden sm:inline">Período:</span>

                {[
                  { id: 'ALL', label: 'Todo el Historial' },
                  { id: 'TODAY', label: 'Hoy' },
                  { id: 'WEEK', label: 'Últimos 7 días' },
                  { id: 'MONTH', label: 'Este Mes' },
                  { id: 'YEAR', label: 'Año 2026' },
                ].map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setDateRangePreset(p.id as any)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                      dateRangePreset === p.id
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              {/* Buscador Rápido */}
              <div className="relative w-full lg:w-80">
                <Search className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar ticket, técnico, problema..."
                  className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                />
              </div>
            </div>

            {/* Filtros secundarios: Urgencia y Especialista */}
            <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-slate-200">
              <span className="text-[11px] font-bold text-slate-500">Filtrar por:</span>

              {/* Urgencia */}
              <select
                value={selectedUrgencia}
                onChange={(e) => setSelectedUrgencia(e.target.value)}
                className="px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-xl font-bold text-slate-700 outline-none"
              >
                <option value="ALL">Todas las Urgencias</option>
                <option value="CRITICA">🔴 Urgencia Crítica</option>
                <option value="ALTA">🟠 Urgencia Alta</option>
                <option value="MEDIA">🟡 Urgencia Media</option>
                <option value="BAJA">🟢 Urgencia Baja</option>
              </select>

              {/* Especialista */}
              <select
                value={selectedTecnico}
                onChange={(e) => setSelectedTecnico(e.target.value)}
                className="px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-xl font-bold text-slate-700 outline-none max-w-xs truncate"
              >
                <option value="ALL">Todos los Técnicos SG</option>
                {uniqueTechnicians.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>

              {(selectedUrgencia !== 'ALL' || selectedTecnico !== 'ALL' || selectedTaller !== 'ALL' || dateRangePreset !== 'ALL' || searchQuery) && (
                <button
                  type="button"
                  onClick={() => {
                    setDateRangePreset('ALL');
                    setSelectedTaller('ALL');
                    setSelectedUrgencia('ALL');
                    setSelectedTecnico('ALL');
                    setSearchQuery('');
                  }}
                  className="text-[11px] font-bold text-amber-700 hover:text-amber-900 underline ml-auto cursor-pointer"
                >
                  Limpiar Filtros
                </button>
              )}
            </div>
          </div>

          {/* Pestañas de Talleres */}
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 no-scrollbar">
            {TALLERES_LIST.map((t) => {
              const Icon = t.icon;
              const isSelected = selectedTaller === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setSelectedTaller(t.id)}
                  className={`px-3.5 py-2 rounded-2xl text-xs font-bold flex items-center space-x-1.5 whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                    isSelected
                      ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* =========================================================================
            TARJETAS KPI PRINCIPALES (AMPLIADAS Y DINÁMICAS)
           ========================================================================= */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
          {/* 1. Total Solicitudes */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black text-slate-500 uppercase tracking-wider">
                Solicitudes SG
              </span>
              <Layers className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-3xl sm:text-4xl font-black text-slate-900">
              {dynamicStats.total}
            </div>
            <div className="text-xs text-slate-500 font-medium">
              {dynamicStats.percentResueltos}% tasa de resolución
            </div>
          </div>

          {/* 2. En Triage (Por Asignar) */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black text-amber-700 uppercase tracking-wider">
                Por Triage
              </span>
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
            </div>
            <div className="text-3xl sm:text-4xl font-black text-amber-600">
              {dynamicStats.reportados}
            </div>
            <div className="text-xs text-amber-800 font-semibold">
              Nuevas por derivar
            </div>
          </div>

          {/* 3. En Trabajo de Campo */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black text-blue-700 uppercase tracking-wider">
                En Trabajo Campo
              </span>
              <Wrench className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-3xl sm:text-4xl font-black text-blue-700">
              {dynamicStats.enProceso}
            </div>
            <div className="text-xs text-blue-800 font-medium">
              Técnicos desplegados
            </div>
          </div>

          {/* 4. Resueltos & Conformes */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black text-emerald-700 uppercase tracking-wider">
                Resueltos / Conformes
              </span>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-3xl sm:text-4xl font-black text-emerald-700">
              {dynamicStats.resueltos}
            </div>
            <div className="text-xs text-emerald-800 font-semibold">
              Con firma OCI
            </div>
          </div>

          {/* 5. Efectividad Operativa */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black text-indigo-700 uppercase tracking-wider">
                Efectividad Operativa
              </span>
              <CheckCircle2 className="w-4 h-4 text-indigo-500" />
            </div>
            <div className="text-3xl sm:text-4xl font-black text-indigo-700">
              {dynamicStats.percentResueltos}%
            </div>
            <div className="text-xs text-indigo-800 font-semibold">
              Requerimientos concluidos con conformidad
            </div>
          </div>

          {/* 6. Satisfacción de Usuarios */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black text-amber-800 uppercase tracking-wider">
                Satisfacción SG
              </span>
              <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
            </div>
            <div className="text-3xl sm:text-4xl font-black text-amber-600 flex items-baseline space-x-1">
              <span>{metrics?.satisfaccionPromedio ? Number(metrics.satisfaccionPromedio).toFixed(1) : '4.8'}</span>
              <span className="text-xs text-slate-400 font-bold">/ 5.0</span>
            </div>
            <div className="text-xs text-slate-500 font-medium">
              Calidad de atención
            </div>
          </div>
        </div>

        {/* =========================================================================
            BLOQUE CENTRAL: DISTRIBUCIÓN POR TALLER & CICLO DE FASES EN CAMPO (AMPLIADO)
           ========================================================================= */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Columna Izquierda (2/3): Desglose por Taller / Especialidad */}
          <div className="xl:col-span-2 bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-slate-900 tracking-tight">
                  Carga Operativa por Taller / Especialidad
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  Distribución de requerimientos registrados en el período seleccionado
                </p>
              </div>
              <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-xl">
                {workshopBreakdown.length} talleres con órdenes activas
              </span>
            </div>

            <div className="space-y-3 pt-2">
              {workshopBreakdown.length === 0 ? (
                <div className="p-12 text-center text-xs text-slate-400">
                  No hay requerimientos para los filtros aplicados.
                </div>
              ) : (
                workshopBreakdown.map((w) => (
                  <div
                    key={w.name}
                    onClick={() => setSelectedTaller(w.name)}
                    className="space-y-1.5 p-3 rounded-2xl hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-slate-900 font-extrabold text-sm">{w.name}</span>
                      <div className="flex items-center space-x-2.5">
                        <span className="text-slate-900 font-black font-mono text-sm">{w.count} órdenes</span>
                        <span className="text-xs text-slate-500 font-bold">({w.percent}%)</span>
                      </div>
                    </div>
                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-amber-500 to-amber-600 rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(w.percent, 4)}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Columna Derecha (1/3): Fases del Ciclo SG & Estado de Inventario */}
          <div className="space-y-6">
            {/* Fases Operativas SG */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs space-y-4">
              <h2 className="text-lg font-black text-slate-900 tracking-tight">
                Flujo de Fases de Campo
              </h2>

              <div className="space-y-3 text-xs">
                <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200 flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <span className="font-bold text-amber-950 text-xs sm:text-sm">Fase 1: Triage y Evaluación</span>
                  </div>
                  <span className="font-mono font-black text-amber-900 text-sm">{dynamicStats.faseTriage}</span>
                </div>

                <div className="p-3.5 bg-blue-50 rounded-2xl border border-blue-200 flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                    <span className="font-bold text-blue-950 text-xs sm:text-sm">Fase 2-4: Diagnóstico y Campo</span>
                  </div>
                  <span className="font-mono font-black text-blue-900 text-sm">{dynamicStats.enProceso}</span>
                </div>

                <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span className="font-bold text-emerald-950 text-xs sm:text-sm">Fase 5: Cierre & Conformidad</span>
                  </div>
                  <span className="font-mono font-black text-emerald-900 text-sm">{dynamicStats.resueltos}</span>
                </div>
              </div>
            </div>

            {/* Alerta de Inventario de Talleres */}
            {materialsMetrics && (
              <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-7 shadow-xl space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <Package className="w-5 h-5 text-amber-400" />
                    <h3 className="text-base font-black tracking-tight">Almacén de Insumos SG</h3>
                  </div>
                  {onNavigateTab && (
                    <button
                      type="button"
                      onClick={() => onNavigateTab('sg-inventory')}
                      className="text-xs font-bold text-amber-400 hover:text-amber-300 underline cursor-pointer"
                    >
                      Ir al Inventario →
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs pt-1">
                  <div className="p-3 bg-slate-800 rounded-2xl border border-slate-700">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Disponibles</span>
                    <span className="text-xl font-black text-emerald-400">{materialsMetrics.total_disponibles}</span>
                  </div>
                  <div className="p-3 bg-slate-800 rounded-2xl border border-slate-700">
                    <span className="text-[10px] text-amber-400 font-bold block uppercase">⚠️ Stock Bajo</span>
                    <span className="text-xl font-black text-amber-400">{materialsMetrics.total_stock_bajo}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* =========================================================================
            CARGA DE TRABAJO POR TÉCNICO / ESPECIALISTA SG (AMPLIADO)
           ========================================================================= */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight">
                Técnicos y Especialistas de Campo (Servicios Generales)
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Carga actual de asignaciones y tiempo promedio de respuesta en talleres
              </p>
            </div>
            <Users className="w-5 h-5 text-slate-400" />
          </div>

          {metrics?.cargaPorTecnico && metrics.cargaPorTecnico.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-4 pt-1">
              {metrics.cargaPorTecnico.map((t) => (
                <div
                  key={t.tecnicoId}
                  onClick={() => setSelectedTecnico(String(t.tecnicoId))}
                  className="p-5 bg-slate-50 hover:bg-slate-100/80 rounded-2xl border border-slate-200 transition-all cursor-pointer space-y-3.5"
                >
                  <div className="flex items-center space-x-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-amber-600 text-white flex items-center justify-center font-black text-sm shrink-0 shadow-xs">
                      {t.fotoPerfil ? (
                        <img
                          src={getAssetUrl(t.fotoPerfil)}
                          alt={t.tecnicoNombre}
                          className="w-full h-full object-cover rounded-2xl"
                        />
                      ) : (
                        t.tecnicoNombre.slice(0, 2).toUpperCase()
                      )}
                    </div>
                    <div className="truncate">
                      <span className="font-extrabold text-sm text-slate-900 block truncate">
                        {t.tecnicoNombre}
                      </span>
                      <span className="text-[11px] text-slate-500 font-medium">
                        Especialista de Campo SG
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-center text-xs pt-1 border-t border-slate-200">
                    <div className="bg-white p-2 rounded-xl border border-slate-200">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">En Curso</span>
                      <span className="font-black text-amber-700 text-base">{t.asignados}</span>
                    </div>
                    <div className="bg-white p-2 rounded-xl border border-slate-200">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Resueltos</span>
                      <span className="font-black text-emerald-700 text-base">{t.resueltos}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center text-xs text-slate-400">
              No se registran datos de técnicos en este momento.
            </div>
          )}
        </div>

        {/* =========================================================================
            TABLA RÁPIDA: ÚLTIMAS SOLICITUDES / ÓRDENES DE TRABAJO (AMPLIA Y SIN CORTE)
           ========================================================================= */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-6 sm:p-7 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight">
                Solicitudes Recientes en Servicios Generales
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Listado en tiempo real con prioridad y técnico de campo asignado
              </p>
            </div>
            <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-xl">
              Mostrando {filteredTickets.slice(0, 10).length} de {filteredTickets.length} órdenes
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white text-[11px] uppercase tracking-wider font-extrabold">
                  <th className="py-3.5 px-4">Código</th>
                  <th className="py-3.5 px-4">Título / Problema</th>
                  <th className="py-3.5 px-4">Dependencia Solicitante</th>
                  <th className="py-3.5 px-4">Taller / Especialidad</th>
                  <th className="py-3.5 px-4 text-center">Urgencia</th>
                  <th className="py-3.5 px-4 text-center">Estado</th>
                  <th className="py-3.5 px-4">Técnico Asignado</th>
                  <th className="py-3.5 px-4 text-center">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTickets.slice(0, 10).map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-black text-amber-900 whitespace-nowrap">
                      {t.codigo_correlativo}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-extrabold text-slate-900 block">
                        {t.titulo}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-600">
                      {t.solicitante_dependencia || 'UNALM'}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="px-2.5 py-1 rounded-xl text-xs font-bold bg-slate-100 text-slate-800 border border-slate-200">
                        {t.categoria_nombre}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <span
                        className={`px-2.5 py-1 rounded-xl text-[11px] font-black uppercase ${
                          t.urgencia === 'CRITICA'
                            ? 'bg-rose-100 text-rose-800 border border-rose-200'
                            : t.urgencia === 'ALTA'
                            ? 'bg-orange-100 text-orange-800 border border-orange-200'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {t.urgencia}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-extrabold ${
                          t.estado === 'RESUELTO'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : t.estado === 'ASIGNADO'
                            ? 'bg-blue-100 text-blue-800 border border-blue-300'
                            : 'bg-amber-100 text-amber-800 border border-amber-300'
                        }`}
                      >
                        {t.estado}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-700 whitespace-nowrap">
                      {t.tecnico_nombre
                        ? t.tecnico_nombre
                        : <span className="text-amber-600 font-bold">Por Asignar</span>}
                    </td>
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      {onSelectTicketDetail && (
                        <button
                          type="button"
                          onClick={() => onSelectTicketDetail(t.id, t.codigo_correlativo, t.estado)}
                          className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors cursor-pointer inline-flex items-center space-x-1 shadow-xs"
                        >
                          <span>Ver Detalle</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
