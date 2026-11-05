import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { api, getAssetUrl } from '../services/api';
import { DashboardMetrics, AuditLog } from '../types';
import { TechnicianProfileModal } from '../components/TechnicianProfileModal';
import {

  LayoutDashboard,
  Clock,
  CheckCircle2,
  Users,
  Star,
  FileSpreadsheet,
  FileText,
  History,
  TrendingUp,
  Search,
  RefreshCw,
  Printer,
  ShieldCheck,
  Zap,
  Activity,
  Layers,
  AlertCircle,
  X,
  Award,
  Building2,
  Calendar,
} from 'lucide-react';

export const AdminDashboardPage: React.FC = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState<'metrics' | 'audit'>('metrics');
  const [activeModuleFilter, setActiveModuleFilter] = useState<'ALL' | 'OTIC' | 'SERVICIOS_GENERALES'>('ALL');

  // Executive Report Modal State
  const [showExecutiveReportModal, setShowExecutiveReportModal] = useState(false);
  const [selectedTechIdForHistory, setSelectedTechIdForHistory] = useState<number | null>(null);

  // Audit filters

  const [auditSearch, setAuditSearch] = useState('');
  const [auditActionFilter, setAuditActionFilter] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const queryParams = activeModuleFilter !== 'ALL' ? { modulo: activeModuleFilter } : undefined;
      const [dashRes, logsRes] = await Promise.all([
        api.getDashboardMetrics(queryParams),
        api.getAuditLogsGlobal({ search: auditSearch, accion: auditActionFilter }),
      ]);

      if (dashRes.success) setMetrics(dashRes.data);
      if (logsRes.success) setAuditLogs(logsRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [auditActionFilter, activeModuleFilter]);

  const handleExportExcel = () => {
    if (!metrics) return;

    const moduleTitle =
      activeModuleFilter === 'SERVICIOS_GENERALES'
        ? 'SERVICIOS GENERALES E INFRAESTRUCTURA (ROF 2023)'
        : activeModuleFilter === 'OTIC'
        ? 'OFICINA DE TECNOLOGIAS DE LA INFORMACION Y COMUNICACIONES (OTIC)'
        : 'CONSOLIDADO INSTITUCIONAL UNALM (OTIC & SERVICIOS GENERALES)';

    // Generar CSV estructurado para Excel con BOM UTF-8 y múltiples secciones ejecutivas
    let csvContent = '\uFEFF';
    csvContent += '=========================================================================\n';
    csvContent += 'UNIVERSIDAD NACIONAL AGRARIA LA MOLINA\n';
    csvContent += `INFORME EJECUTIVO DE GESTION Y ATENCION DE MESA DE AYUDA: ${moduleTitle}\n`;
    csvContent += `Fecha de Generacion: ${new Date().toLocaleString('es-PE')}\n`;
    csvContent += '=========================================================================\n\n';

    csvContent += '1. RESUMEN EJECUTIVO DE INDICADORES CLAVE (KPIs)\n';
    csvContent += 'Indicador,Valor,Descripcion\n';
    csvContent += `Total de Requerimientos Registrados,${metrics.totalTickets},Volumen historico total\n`;
    csvContent += `Tickets en Cola (REPORTADO),${metrics.reportados},Pendientes de atencion\n`;
    csvContent += `Tickets en Atencion (ASIGNADO),${metrics.asignados},En proceso por especialistas\n`;
    csvContent += `Tickets Solucionados (RESUELTO),${metrics.resueltos},Solucionados satisfactoriamente\n`;
    csvContent += `Tiempo Promedio de Solucion (MTTR),${metrics.tiempoPromedioResolucionHoras} horas,Mean Time to Resolution\n`;
    csvContent += `Efectividad de Atención Operativa,${metrics.cumplimientoSlaPorcentaje}%,Porcentaje de atención técnica resuelta\n`;
    csvContent += `Indice de Calidad y Satisfaccion (CSAT),${metrics.satisfaccionPromedio} / 5.0,Promedio de calificacion de usuarios\n\n`;

    csvContent += '2. CARGA DE TRABAJO, RENDIMIENTO Y CSAT POR TECNICO ESPECIALISTA\n';
    csvContent += 'Especialista,Tickets Asignados,Tickets Resueltos,Tasa Resolucion (%),Tiempo Medio (Horas),Calificacion CSAT (1-5★)\n';
    metrics.cargaPorTecnico.forEach((t) => {
      const tasa = t.asignados > 0 ? ((t.resueltos / t.asignados) * 100).toFixed(1) : '100.0';
      csvContent += `"${t.tecnicoNombre}",${t.asignados},${t.resueltos},${tasa}%,${t.tiempoPromedioHoras}h,${t.calificacionPromedio || '5.0'}\n`;
    });
    csvContent += '\n';

    csvContent += '3. DEMANDA Y VOLUMEN POR SERVICIO\n';
    csvContent += 'Servicio / Especialidad,Total Requerimientos,Porcentaje del Total\n';
    metrics.volumenPorCategoria.forEach((c) => {
      const pct = metrics.totalTickets > 0 ? ((c.total / metrics.totalTickets) * 100).toFixed(1) : '0.0';
      csvContent += `"${c.categoriaNombre}",${c.total},${pct}%\n`;
    });
    csvContent += '\n';

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Reporte_Ejecutivo_UNALM_${activeModuleFilter}_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  const handleOpenExecutiveReport = () => {
    setShowExecutiveReportModal(true);
  };

  const handlePrintDocument = () => {
    window.print();
  };

  return (
    <div className="space-y-6 w-full max-w-[1720px] min-w-0 overflow-hidden mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-xs print:hidden">
        <div>
          <div className="flex items-center space-x-2 text-unalm-600 font-bold text-xs uppercase tracking-wider mb-1">
            <Activity className="w-4 h-4" />
            <span>Monitoreo en Tiempo Real (ITIL v4 & ROF UNALM 2023)</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Dashboard Directivo & Trazabilidad
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Métricas de solución, rendimiento de especialistas, registro de auditoría y reportes directivos institucionales.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={loadData}
            className="p-2.5 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-300 transition-colors"
            title="Refrescar métricas en tiempo real"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={handleExportExcel}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold shadow-md transition-all flex items-center space-x-2"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Exportar Excel</span>
          </button>

          <button
            onClick={handleOpenExecutiveReport}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-extrabold shadow-md transition-all flex items-center space-x-2"
          >
            <Printer className="w-4 h-4" />
            <span>Generar Reporte Ejecutivo PDF</span>
          </button>
        </div>
      </div>

      {/* Module Scope Tabs */}
      <div className="flex items-center space-x-2 bg-slate-100 p-1.5 rounded-2xl overflow-x-auto print:hidden">
        <button
          type="button"
          onClick={() => setActiveModuleFilter('ALL')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeModuleFilter === 'ALL'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          🌐 Consolidado UNALM Integral
        </button>
        <button
          type="button"
          onClick={() => setActiveModuleFilter('OTIC')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeModuleFilter === 'OTIC'
              ? 'bg-unalm-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          💻 Tecnologías de Información (OTIC)
        </button>
        <button
          type="button"
          onClick={() => setActiveModuleFilter('SERVICIOS_GENERALES')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeModuleFilter === 'SERVICIOS_GENERALES'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          🏗️ Servicios Generales & Infraestructura
        </button>
      </div>

      {/* Subtabs for Metrics vs Audit Logs */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-2 print:hidden">
        <button
          onClick={() => setActiveSubTab('metrics')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center space-x-2 ${
            activeSubTab === 'metrics'
              ? 'bg-unalm-600 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Métricas y Rendimiento</span>
        </button>

        <button
          onClick={() => setActiveSubTab('audit')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center space-x-2 ${
            activeSubTab === 'audit'
              ? 'bg-unalm-600 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Historial de Auditoría & Trazabilidad ({auditLogs.length})</span>
        </button>
      </div>

      {activeSubTab === 'metrics' && (
        <div className="space-y-6 print:hidden">
          {/* Top KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Tickets */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs relative overflow-hidden card-hover-effect">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Total Requerimientos
                </span>
                <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <LayoutDashboard className="w-5 h-5" />
                </div>
              </div>
              <p className="text-3xl font-extrabold text-slate-900 dark:text-white mt-2">
                {metrics?.totalTickets || 0}
              </p>
              <div className="flex items-center space-x-2 text-[11px] text-slate-500 dark:text-slate-400 mt-2 font-medium">
                <span className="text-amber-600 dark:text-amber-400 font-bold">{metrics?.reportados || 0} Pendientes</span>
                <span>•</span>
                <span className="text-blue-600 dark:text-blue-400 font-bold">{metrics?.asignados || 0} En Atención</span>
              </div>
            </div>

            {/* MTTR Tiempo Promedio */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs relative overflow-hidden card-hover-effect">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Tiempo Promedio Solución
                </span>
                <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <Clock className="w-5 h-5" />
                </div>
              </div>
              <p className="text-3xl font-extrabold text-slate-900 dark:text-white mt-2">
                {metrics?.tiempoPromedioResolucionHoras || 0} <span className="text-base font-semibold text-slate-500">horas</span>
              </p>
              <p className="text-[11px] text-slate-400 mt-2">
                MTTR (Mean Time to Resolution) ITIL v4
              </p>
            </div>

            {/* Efectividad Operativa */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs relative overflow-hidden card-hover-effect">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Efectividad Operativa
                </span>
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
              </div>
              <p className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-2">
                {metrics?.cumplimientoSlaPorcentaje || 100}%
              </p>
              <p className="text-[11px] text-emerald-700 dark:text-emerald-300 mt-2 font-semibold">
                Requerimientos atendidos y resueltos con éxito
              </p>
            </div>

            {/* Satisfacción Promedio CSAT */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs relative overflow-hidden card-hover-effect">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Satisfacción CSAT
                </span>
                <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-500 flex items-center justify-center">
                  <Star className="w-5 h-5 fill-amber-400" />
                </div>
              </div>
              <div className="flex items-baseline space-x-2 mt-2">
                <p className="text-3xl font-extrabold text-slate-900 dark:text-white">
                  {metrics?.satisfaccionPromedio || 0}
                </p>
                <span className="text-xs text-amber-600 dark:text-amber-400 font-bold">/ 5.0 Estrellas</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-2">
                Calificación promedio de usuarios finales
              </p>
            </div>
          </div>

          {/* Technician Workload Table & Volume Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Carga por Técnico */}
            <div className="lg:col-span-2 bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                  <Users className="w-5 h-5 text-unalm-600" />
                  <span>Carga de Trabajo y Rendimiento por Técnico</span>
                </h3>
                <span className="text-xs font-semibold text-slate-400">
                  {metrics?.cargaPorTecnico.length || 0} Especialistas
                </span>
              </div>

              {/* Vista en Tabla para Desktop */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                      <th className="py-3 px-3">TÉCNICO ESPECIALISTA</th>
                      <th className="py-3 px-3 text-center">ASIGNADOS</th>
                      <th className="py-3 px-3 text-center">RESUELTOS</th>
                      <th className="py-3 px-3 text-center">TIEMPO MEDIO</th>
                      <th className="py-3 px-3 text-center">CSAT (1-5★)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {metrics?.cargaPorTecnico.map((tec) => (
                      <tr key={tec.tecnicoId} className="hover:bg-slate-50 transition-colors">
                        <td
                          className="py-3 px-3 font-bold text-slate-800 flex items-center space-x-2.5 cursor-pointer group"
                          onClick={() => setSelectedTechIdForHistory(tec.tecnicoId)}
                          title="Clic para ver récord de atenciones y reseñas"
                        >
                          {tec.fotoPerfil ? (
                            <img
                              src={getAssetUrl(tec.fotoPerfil)}
                              alt={tec.tecnicoNombre}
                              className="w-7 h-7 rounded-full object-cover border border-amber-300 shadow-2xs group-hover:ring-2 group-hover:ring-amber-300 transition-all"
                            />
                          ) : (
                            <span className="w-7 h-7 rounded-full bg-unalm-100 text-unalm-700 font-extrabold flex items-center justify-center text-[10px] group-hover:bg-amber-100">
                              {tec.tecnicoNombre.slice(0, 2).toUpperCase()}
                            </span>
                          )}
                          <span className="group-hover:text-unalm-700 transition-colors">{tec.tecnicoNombre}</span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold border border-blue-200">
                            {tec.asignados}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                            {tec.resueltos}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center font-semibold text-slate-600">
                          {tec.tiempoPromedioHoras > 0 ? `${tec.tiempoPromedioHoras}h` : '-'}
                        </td>
                        <td className="py-3 px-3 text-center">
                          {tec.calificacionPromedio > 0 ? (
                            <span className="inline-flex items-center text-amber-700 font-bold space-x-1">
                              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                              <span>{tec.calificacionPromedio}</span>
                            </span>
                          ) : (
                            <span className="text-slate-400 italic text-[11px]">Sin calificaciones</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Vista en Tarjetas para Móviles (sin scroll horizontal) */}
              <div className="block sm:hidden space-y-2.5">
                {metrics?.cargaPorTecnico.map((tec) => (
                  <div
                    key={tec.tecnicoId}
                    className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5 cursor-pointer hover:border-slate-300 transition-all"
                    onClick={() => setSelectedTechIdForHistory(tec.tecnicoId)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2.5">
                        {tec.fotoPerfil ? (
                          <img
                            src={getAssetUrl(tec.fotoPerfil)}
                            alt={tec.tecnicoNombre}
                            className="w-8 h-8 rounded-full object-cover border border-amber-300 shadow-2xs"
                          />
                        ) : (
                          <span className="w-8 h-8 rounded-full bg-unalm-100 text-unalm-700 font-extrabold flex items-center justify-center text-xs">
                            {tec.tecnicoNombre.slice(0, 2).toUpperCase()}
                          </span>
                        )}
                        <span className="font-bold text-slate-900 text-xs">{tec.tecnicoNombre}</span>
                      </div>
                      {tec.calificacionPromedio > 0 ? (
                        <span className="inline-flex items-center text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full font-bold text-xs space-x-1">
                          <Star className="w-3 h-3 fill-amber-400 text-amber-500" />
                          <span>{tec.calificacionPromedio}</span>
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[10px]">Sin CSAT</span>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-200/80 text-center">
                      <div className="bg-white p-2 rounded-xl border border-slate-200">
                        <span className="text-[10px] text-slate-400 block">Asignados</span>
                        <span className="text-xs font-black text-blue-700">{tec.asignados}</span>
                      </div>
                      <div className="bg-white p-2 rounded-xl border border-slate-200">
                        <span className="text-[10px] text-slate-400 block">Resueltos</span>
                        <span className="text-xs font-black text-emerald-700">{tec.resueltos}</span>
                      </div>
                      <div className="bg-white p-2 rounded-xl border border-slate-200">
                        <span className="text-[10px] text-slate-400 block">T. Medio</span>
                        <span className="text-xs font-black text-slate-700">{tec.tiempoPromedioHoras > 0 ? `${tec.tiempoPromedioHoras}h` : '-'}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Distribución por Categoría & Urgencia */}
            <div className="space-y-6">
              {/* Categorías */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center space-x-2">
                  <Layers className="w-4 h-4 text-purple-600" />
                  <span>Volumen por Servicio</span>
                </h3>

                <div className="space-y-3">
                  {metrics?.volumenPorCategoria.map((cat) => (
                    <div key={cat.categoriaId} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-700 truncate max-w-[180px]">
                          {cat.categoriaNombre}
                        </span>
                        <span className="font-bold text-slate-900">{cat.total}</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-unalm-600 h-full rounded-full transition-all"
                          style={{
                            width: `${metrics.totalTickets > 0 ? (cat.total / metrics.totalTickets) * 100 : 0}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Urgencias */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-rose-600" />
                  <span>Volumen por Urgencia</span>
                </h3>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  {metrics?.volumenPorUrgencia.map((urg) => (
                    <div
                      key={urg.urgencia}
                      className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col justify-between"
                    >
                      <span className="text-[11px] font-semibold text-slate-500">{urg.urgencia}</span>
                      <span className="text-lg font-extrabold text-slate-900 mt-1">{urg.total}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Historial de Auditoría & Trazabilidad */}
      {activeSubTab === 'audit' && (
        <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-xs space-y-4 print:hidden">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <History className="w-5 h-5 text-unalm-600" />
                <span>Logs de Auditoría y Trazabilidad del Sistema</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Registro inmutable de cambios realizados en cada ticket: quién modificó, qué cambió, valor anterior y fecha/hora exacta.
              </p>
            </div>

            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={auditSearch}
                  onChange={(e) => setAuditSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && loadData()}
                  placeholder="Buscar por código, usuario..."
                  className="w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded-xl text-xs bg-white"
                />
              </div>

              <select
                value={auditActionFilter}
                onChange={(e) => setAuditActionFilter(e.target.value)}
                className="px-3 py-1.5 border border-slate-300 rounded-xl text-xs bg-white text-slate-700 font-medium"
              >
                <option value="">Todas las acciones</option>
                <option value="CREACION_TICKET">CREACION_TICKET</option>
                <option value="ASIGNACION_TECNICO">ASIGNACION_TECNICO</option>
                <option value="DERIVACION_TICKET">DERIVACION_TICKET</option>
                <option value="CAMBIO_ESTADO">CAMBIO_ESTADO</option>
                <option value="REAPERTURA_TICKET">REAPERTURA_TICKET</option>
                <option value="ENCUESTA_SATISFACCION">ENCUESTA_SATISFACCION</option>
              </select>
            </div>
          </div>

          {/* Vista en Tabla para Desktop */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <th className="py-3 px-3">FECHA & HORA</th>
                  <th className="py-3 px-3">TICKET</th>
                  <th className="py-3 px-3">USUARIO RESPONSABLE</th>
                  <th className="py-3 px-3">ACCIÓN</th>
                  <th className="py-3 px-3">CAMPO MODIFICADO</th>
                  <th className="py-3 px-3">VALOR ANTERIOR</th>
                  <th className="py-3 px-3">VALOR NUEVO</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      No hay registros de auditoría que coincidan con la búsqueda.
                    </td>
                  </tr>
                ) : (
                  auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 text-slate-500 whitespace-nowrap font-mono text-[11px]">
                        {new Date(log.fecha).toLocaleString('es-PE')}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-unalm-700 whitespace-nowrap">
                        {log.ticket_codigo || `ID #${log.ticket_id}`}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span className="font-semibold text-slate-800">{log.usuario_nombre || 'Sistema'}</span>
                        {log.usuario_rol && (
                          <span className="text-[10px] text-slate-400 ml-1.5 font-normal">
                            ({log.usuario_rol})
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 font-bold text-slate-700 text-[10px] border border-slate-200">
                          {log.accion}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 font-mono text-[11px]">
                        {log.campo_modificado || '-'}
                      </td>
                      <td className="py-2.5 px-3 text-slate-400 max-w-xs truncate">
                        {log.valor_anterior || '-'}
                      </td>
                      <td className="py-2.5 px-3 text-slate-800 font-semibold max-w-xs truncate">
                        {log.valor_nuevo || '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Vista en Tarjetas para Móviles (sin scroll horizontal) */}
          <div className="block md:hidden space-y-2.5">
            {auditLogs.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                No hay registros de auditoría que coincidan con la búsqueda.
              </div>
            ) : (
              auditLogs.map((log) => (
                <div key={log.id} className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-unalm-700 text-xs">
                      {log.ticket_codigo || `ID #${log.ticket_id}`}
                    </span>
                    <span className="text-slate-400 font-mono text-[10px]">
                      {new Date(log.fecha).toLocaleString('es-PE')}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-800">
                      {log.usuario_nombre || 'Sistema'}
                      {log.usuario_rol && <span className="text-[10px] text-slate-400 ml-1 font-normal">({log.usuario_rol})</span>}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-white font-bold text-slate-700 text-[10px] border border-slate-200">
                      {log.accion}
                    </span>
                  </div>

                  {(log.campo_modificado || log.valor_nuevo) && (
                    <div className="bg-white p-2 rounded-xl border border-slate-100 text-[11px] space-y-1">
                      {log.campo_modificado && (
                        <div className="text-slate-500">
                          <span className="text-slate-400 font-medium">Campo: </span>
                          <span className="font-mono text-slate-700">{log.campo_modificado}</span>
                        </div>
                      )}
                      {log.valor_anterior && (
                        <div className="text-slate-400 truncate">
                          <span className="font-medium">Ant: </span>{log.valor_anterior}
                        </div>
                      )}
                      {log.valor_nuevo && (
                        <div className="text-slate-800 font-medium truncate">
                          <span className="text-slate-400 font-medium">Nuevo: </span>{log.valor_nuevo}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* DEDICATED OFFICIAL EXECUTIVE REPORT MODAL & PRINTABLE VIEW */}
      {showExecutiveReportModal && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-[9999] overflow-y-auto bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 print:p-0 print:bg-white print:static print:block printable-report-wrapper"
          style={{ margin: 0, top: 0, left: 0, right: 0, bottom: 0, width: '100vw', height: '100vh' }}
        >
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-5xl overflow-hidden print:border-none print:shadow-none print:max-w-none print:w-full printable-report-card">
            {/* Top Toolbar in Modal (hidden when printing) */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between print:hidden">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-unalm-600/30 flex items-center justify-center border border-unalm-500/30">
                  <FileText className="w-4 h-4 text-unalm-300" />
                </div>
                <div>
                  <span className="font-extrabold text-sm block leading-tight">Vista Previa de Informe Ejecutivo Oficial</span>
                  <span className="text-[10px] text-slate-400">Listo para imprimir o guardar directamente como PDF A4</span>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <button
                  onClick={handlePrintDocument}
                  className="px-4 py-2 bg-unalm-600 hover:bg-unalm-500 text-white rounded-xl text-xs font-extrabold shadow-md transition-all flex items-center space-x-2 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Imprimir / Guardar como PDF</span>
                </button>

                <button
                  onClick={() => setShowExecutiveReportModal(false)}
                  className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
                  title="Cerrar vista previa"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Official Report Document Page Body */}
            <div className="p-8 sm:p-12 space-y-7 bg-white text-slate-900 text-xs leading-relaxed max-h-[85vh] overflow-y-auto print:max-h-none print:p-0 print:overflow-visible print:w-full">
              {/* Header Institution */}
              <div className="border-b-2 border-slate-900 pb-5 flex items-center justify-between gap-6 avoid-page-break">
                <div className="flex items-center space-x-4">
                  <img
                    src="./escudo-color.png"
                    alt="UNALM"
                    className="w-16 h-16 object-contain shrink-0"
                  />
                  <div>
                    <h2 className="text-sm font-black tracking-wide text-slate-900 uppercase">
                      Universidad Nacional Agraria La Molina
                    </h2>
                    <h3 className="text-xs font-bold text-slate-700 uppercase">
                      Oficina de Tecnologías de la Información y Comunicaciones (OTIC)
                    </h3>
                    <p className="text-[11px] text-slate-500 font-semibold mt-0.5">
                      Sistema Integrado de Mesa de Ayuda, Gestión de Incidentes & Requerimientos (ITIL v4)
                    </p>
                  </div>
                </div>

                <div className="text-right border-l-2 border-slate-200 pl-6 shrink-0">
                  <span className="text-[10px] font-extrabold text-unalm-800 bg-unalm-50 px-2.5 py-1 rounded border border-unalm-300 block uppercase mb-1">
                    Informe Ejecutivo Directivo
                  </span>
                  <p className="text-[11px] text-slate-700 font-mono">
                    <strong>Folio:</strong> INF-OTIC-{new Date().getFullYear()}-{String(new Date().getMonth() + 1).padStart(2, '0')}
                  </p>
                  <p className="text-[11px] text-slate-600 font-mono">
                    <strong>Fecha:</strong> {new Date().toLocaleDateString('es-PE')}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    <strong>Hora:</strong> {new Date().toLocaleTimeString('es-PE')}
                  </p>
                </div>
              </div>

              {/* Title & Scope */}
              <div className="text-center space-y-1 pt-1 avoid-page-break">
                <h1 className="text-lg sm:text-xl font-black text-slate-900 uppercase tracking-tight">
                  Informe de Rendimiento Operativo y Calidad de Servicio
                </h1>
                <p className="text-xs text-slate-600 font-medium">
                  Consolidado oficial de tickets atendidos, productividad del personal técnico y nivel de satisfacción de los usuarios
                </p>
              </div>

              {/* Section 1: KPIs Summary */}
              <div className="space-y-2.5 avoid-page-break">
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider border-b border-slate-300 pb-1.5 flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 bg-unalm-600 rounded-full inline-block" />
                  <span>1. Resumen General de Indicadores Clave de Gestión (KPIs)</span>
                </h4>

                <div className="grid grid-cols-4 gap-3">
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-300 text-center">
                    <span className="text-[10px] font-bold text-slate-600 uppercase block tracking-wider">Total Requerimientos</span>
                    <span className="text-2xl font-black text-slate-900 mt-1 block">{metrics?.totalTickets || 0}</span>
                    <span className="text-[10px] text-slate-500 font-medium block mt-1">
                      {metrics?.resueltos || 0} resueltos • {(metrics?.reportados || 0) + (metrics?.asignados || 0)} activos
                    </span>
                  </div>
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-300 text-center">
                    <span className="text-[10px] font-bold text-slate-600 uppercase block tracking-wider">Tiempo Medio (MTTR)</span>
                    <span className="text-2xl font-black text-slate-900 mt-1 block">{metrics?.tiempoPromedioResolucionHoras || 0}h</span>
                    <span className="text-[10px] text-slate-500 font-medium block mt-1">
                      Promedio de resolución
                    </span>
                  </div>
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-300 text-center">
                    <span className="text-[10px] font-bold text-slate-600 uppercase block tracking-wider">Efectividad Operativa</span>
                    <span className="text-2xl font-black text-emerald-700 mt-1 block">{metrics?.cumplimientoSlaPorcentaje || 100}%</span>
                    <span className="text-[10px] text-emerald-700 font-bold block mt-1">
                      Atención conforme
                    </span>
                  </div>
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-300 text-center">
                    <span className="text-[10px] font-bold text-slate-600 uppercase block tracking-wider">Satisfacción CSAT</span>
                    <span className="text-2xl font-black text-amber-600 mt-1 block">⭐ {metrics?.satisfaccionPromedio || 5.0}</span>
                    <span className="text-[10px] text-amber-700 font-bold block mt-1">
                      Escala de 1 a 5 estrellas
                    </span>
                  </div>
                </div>
              </div>

              {/* Section 2: Technician Performance Table */}
              <div className="space-y-2.5 avoid-page-break">
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider border-b border-slate-300 pb-1.5 flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 bg-unalm-600 rounded-full inline-block" />
                  <span>2. Productividad, Rendimiento y Calidad por Especialista Técnico</span>
                </h4>

                <table className="w-full text-left text-xs border border-slate-300 border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-900 font-black border-b border-slate-300 text-[11px]">
                      <th className="py-2.5 px-3 border-r border-slate-300">TÉCNICO ESPECIALISTA</th>
                      <th className="py-2.5 px-3 text-center border-r border-slate-300">ASIGNADOS</th>
                      <th className="py-2.5 px-3 text-center border-r border-slate-300">RESUELTOS</th>
                      <th className="py-2.5 px-3 text-center border-r border-slate-300">EFICACIA (%)</th>
                      <th className="py-2.5 px-3 text-center border-r border-slate-300">TIEMPO MEDIO</th>
                      <th className="py-2.5 px-3 text-center">CSAT (1-5★)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {metrics?.cargaPorTecnico.map((tec) => {
                      const eficacia = tec.asignados > 0 ? ((tec.resueltos / tec.asignados) * 100).toFixed(0) : '100';
                      return (
                        <tr key={tec.tecnicoId} className="even:bg-slate-50">
                          <td className="py-2 px-3 font-bold text-slate-900 border-r border-slate-200">
                            {tec.tecnicoNombre}
                          </td>
                          <td className="py-2 px-3 text-center border-r border-slate-200 font-semibold">{tec.asignados}</td>
                          <td className="py-2 px-3 text-center font-bold text-emerald-800 border-r border-slate-200">{tec.resueltos}</td>
                          <td className="py-2 px-3 text-center font-bold border-r border-slate-200">{eficacia}%</td>
                          <td className="py-2 px-3 text-center border-r border-slate-200">{tec.tiempoPromedioHoras > 0 ? `${tec.tiempoPromedioHoras}h` : '-'}</td>
                          <td className="py-2 px-3 text-center font-bold text-amber-700">
                            {tec.calificacionPromedio > 0 ? `⭐ ${tec.calificacionPromedio}` : '5.0'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Section 3: Distribution by Category & Urgency */}
              <div className="grid grid-cols-2 gap-6 avoid-page-break">
                <div className="space-y-2">
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider border-b border-slate-300 pb-1 flex items-center space-x-1.5">
                    <span className="w-2.5 h-2.5 bg-unalm-600 rounded-full inline-block" />
                    <span>3. Demanda por Servicio OTIC</span>
                  </h4>
                  <table className="w-full text-left text-xs border border-slate-300 border-collapse">
                    <thead>
                      <tr className="bg-slate-100 text-slate-900 font-bold border-b border-slate-300 text-[11px]">
                        <th className="py-2 px-3 border-r border-slate-300">SERVICIO TÉCNICO</th>
                        <th className="py-2 px-3 text-right">TOTAL</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {metrics?.volumenPorCategoria.map((cat) => (
                        <tr key={cat.categoriaId} className="even:bg-slate-50">
                          <td className="py-1.5 px-3 font-medium border-r border-slate-200">{cat.categoriaNombre}</td>
                          <td className="py-1.5 px-3 text-right font-bold text-slate-900">{cat.total}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider border-b border-slate-300 pb-1 flex items-center space-x-1.5">
                    <span className="w-2.5 h-2.5 bg-unalm-600 rounded-full inline-block" />
                    <span>4. Demanda por Nivel de Urgencia</span>
                  </h4>
                  <table className="w-full text-left text-xs border border-slate-300 border-collapse">
                    <thead>
                      <tr className="bg-slate-100 text-slate-900 font-bold border-b border-slate-300 text-[11px]">
                        <th className="py-2 px-3 border-r border-slate-300">NIVEL DE URGENCIA</th>
                        <th className="py-2 px-3 text-right">TOTAL</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {metrics?.volumenPorUrgencia.map((urg) => (
                        <tr key={urg.urgencia} className="even:bg-slate-50">
                          <td className="py-1.5 px-3 font-medium border-r border-slate-200">{urg.urgencia}</td>
                          <td className="py-1.5 px-3 text-right font-bold text-slate-900">{urg.total}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Signatures & Certification block */}
              <div className="pt-12 mt-6 border-t-2 border-slate-300 grid grid-cols-2 gap-12 text-center text-xs avoid-page-break">
                <div className="space-y-1.5">
                  <div className="w-48 border-b-2 border-slate-900 mx-auto mb-2" />
                  <p className="font-extrabold text-slate-900 tracking-wide uppercase">Jefatura / Mesa de Ayuda</p>
                  <p className="text-[11px] text-slate-600">Oficina de Tecnologías de la Información y Comunicaciones</p>
                  <p className="text-[10px] text-slate-400 font-semibold">UNALM</p>
                </div>

                <div className="space-y-1.5">
                  <div className="w-48 border-b-2 border-slate-900 mx-auto mb-2" />
                  <p className="font-extrabold text-slate-900 tracking-wide uppercase">Dirección General de Administración</p>
                  <p className="text-[11px] text-slate-600">Supervisión y Control Directivo</p>
                  <p className="text-[10px] text-slate-400 font-semibold">UNALM</p>
                </div>
              </div>

              {/* Document footer notice */}
              <div className="pt-4 border-t border-slate-200 text-center text-[10px] text-slate-400 font-mono avoid-page-break">
                Documento generado automáticamente por el Sistema de Mesa de Ayuda OTIC - UNALM • Conforme a las directivas ITIL v4 de Gestión del Servicio
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Technician History Modal */}
      <TechnicianProfileModal
        isOpen={!!selectedTechIdForHistory}
        onClose={() => setSelectedTechIdForHistory(null)}
        technicianId={selectedTechIdForHistory}
      />
    </div>
  );
};

