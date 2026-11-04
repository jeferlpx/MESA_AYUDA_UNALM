import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { api } from '../services/api';
import { Ticket } from '../types';
import { useAuth } from '../context/AuthContext';
import { StatusBadge, PriorityBadge, UrgencyBadge } from '../components/Badge';
import { TableSkeleton } from '../components/Skeleton';
import {
  Search,
  CheckCircle2,
  Star,
  Clock,
  User,
  Eye,
  Calendar,
  Layers,
  Award,
  Filter,
  FileCheck2,
  Download,
  Printer,
  FileSpreadsheet,
  Building2,
} from 'lucide-react';

interface TechnicianAttendedTicketsPageProps {
  onSelectTicketDetail: (ticketId: number, ticketCode?: string, ticketStatus?: string) => void;
}

export const TechnicianAttendedTicketsPage: React.FC<TechnicianAttendedTicketsPageProps> = ({
  onSelectTicketDetail,
}) => {
  const { user, hasRole } = useAuth();
  const isTechRole = hasRole('TECNICO', 'ESPECIALISTA_REDES', 'ESPECIALISTA_DESARROLLO', 'TECNICO_SG');
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRating, setFilterRating] = useState<string>('ALL');
  const [showReportModal, setShowReportModal] = useState(false);

  useEffect(() => {
    if (showReportModal) {
      document.body.classList.add('has-attended-report-open');
    } else {
      document.body.classList.remove('has-attended-report-open');
    }
    return () => {
      document.body.classList.remove('has-attended-report-open');
    };
  }, [showReportModal]);

  const loadAttendedTickets = async () => {
    try {
      setLoading(true);
      const isTechRole = Boolean(user?.rol && ['TECNICO', 'ESPECIALISTA_REDES', 'ESPECIALISTA_DESARROLLO', 'TECNICO_SG'].includes(user.rol));
      const res = await api.getTickets({
        estado: 'RESUELTO',
        ...(isTechRole && user?.id ? { tecnicoId: user.id.toString() } : {}),
      });

      if (res.success) {
        // Para técnicos, filtrar estrictamente los que atendió él
        let list: Ticket[] = res.data || [];
        if (isTechRole && user?.id) {
          list = list.filter((t) => t.tecnico_id === user.id);
        }
        setTickets(list);
      }
    } catch (err) {
      console.error('Error al cargar tickets atendidos:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAttendedTickets();
  }, []);

  const filteredTickets = tickets.filter((t) => {
    const matchesSearch =
      t.codigo_correlativo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.titulo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.solicitante_nombre && t.solicitante_nombre.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (t.categoria_nombre && t.categoria_nombre.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (filterRating === 'RATED') {
      return (t.encuesta_puntuacion || 0) > 0;
    }
    if (filterRating === 'UNRATED') {
      return !t.encuesta_puntuacion || t.encuesta_puntuacion === 0;
    }
    if (filterRating === '5_STAR') {
      return t.encuesta_puntuacion === 5;
    }

    return true;
  });

  // Calculate KPIs
  const totalAttended = tickets.length;
  const ratedTickets = tickets.filter((t) => (t.encuesta_puntuacion || 0) > 0);
  const avgRating =
    ratedTickets.length > 0
      ? (ratedTickets.reduce((acc, t) => acc + (t.encuesta_puntuacion || 0), 0) / ratedTickets.length).toFixed(1)
      : '5.0';

  // Exportar Excel (CSV formateado en UTF-8)
  const handleExportCSV = () => {
    if (filteredTickets.length === 0) return;

    const headers = [
      'CÓDIGO',
      'TÍTULO',
      'SERVICIO / CATEGORÍA',
      'SOLICITANTE',
      'DEPENDENCIA',
      'FECHA RESOLUCIÓN',
      'SOLUCIÓN APLICADA',
      ...(!isTechRole ? ['CALIFICACIÓN CSAT (1-5)'] : []),
    ];

    const rows = filteredTickets.map((t) => [
      `"${t.codigo_correlativo}"`,
      `"${(t.titulo || '').replace(/"/g, '""')}"`,
      `"${(t.categoria_nombre || '').replace(/"/g, '""')}"`,
      `"${(t.solicitante_nombre || '').replace(/"/g, '""')}"`,
      `"${(t.solicitante_dependencia || '').replace(/"/g, '""')}"`,
      `"${t.fecha_resolucion ? new Date(t.fecha_resolucion).toLocaleDateString('es-PE') : ''}"`,
      `"${(t.solucion_detalle || '').replace(/"/g, '""')}"`,
      ...(!isTechRole ? [`"${t.encuesta_puntuacion || 'Sin calificar'}"`] : []),
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `reporte_atendidos_${user?.nombres || 'usuario'}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintReport = () => {
    setShowReportModal(true);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 py-6 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-unalm-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center space-x-2 text-emerald-400 font-bold text-xs uppercase tracking-wider mb-1.5">
            <CheckCircle2 className="w-4 h-4" />
            <span>Historial Técnico de Atención Cerrada</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Mis Requerimientos Atendidos
          </h1>
          <p className="mt-1.5 text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
            Consulte el registro histórico de todas las incidencias y solicitudes técnicas resueltas por usted, con sus calificaciones de satisfacción y soluciones aplicadas.
          </p>
        </div>

        {/* Quick KPI stats in banner */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="bg-slate-800/80 border border-slate-700/80 p-4 rounded-2xl text-center min-w-[110px] shadow-md backdrop-blur-xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Total Resueltos
            </span>
            <span className="text-2xl font-black text-white mt-0.5 block">{totalAttended}</span>
          </div>

          {/* CSAT Promedio (Oculto para rol técnico) */}
          {!isTechRole && (
            <div className="bg-slate-800/80 border border-slate-700/80 p-4 rounded-2xl text-center min-w-[110px] shadow-md backdrop-blur-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Promedio CSAT
              </span>
              <div className="flex items-center justify-center space-x-1 mt-0.5 text-amber-400 font-black text-2xl">
                <Star className="w-5 h-5 fill-amber-400" />
                <span>{avgRating}</span>
              </div>
            </div>
          )}

          <div className="bg-slate-800/80 border border-slate-700/80 p-4 rounded-2xl text-center min-w-[110px] shadow-md backdrop-blur-xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Efectividad
            </span>
            <span className="text-2xl font-black text-emerald-400 mt-0.5 block">100%</span>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por código (OTIC-2026-...), título, solicitante o categoría..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-unalm-500 font-medium"
          />
        </div>

        {/* Calificación filter (Oculto para rol técnico) */}
        {!isTechRole && (
          <div className="flex items-center space-x-2 shrink-0">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={filterRating}
              onChange={(e) => setFilterRating(e.target.value)}
              className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-unalm-500"
            >
              <option value="ALL">Todas las Calificaciones</option>
              <option value="5_STAR">⭐ Solo 5 Estrellas (Excelente)</option>
              <option value="RATED">Con Calificación de Usuario</option>
              <option value="UNRATED">Sin Calificar Aún</option>
            </select>
          </div>
        )}

        {/* Botones de Reporte PDF y Excel */}
        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={handleExportCSV}
            title="Exportar listado a Excel (.csv)"
            className="px-3.5 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-2xl text-xs font-bold transition-all shadow-2xs flex items-center space-x-1.5 cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Exportar Excel</span>
          </button>

          <button
            onClick={handlePrintReport}
            title="Imprimir o Guardar en PDF"
            className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 rounded-2xl text-xs font-bold transition-all shadow-2xs flex items-center space-x-1.5 cursor-pointer"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>Reporte PDF</span>
          </button>
        </div>
      </div>

      {/* Attended Tickets Table */}
      <div className="bg-white border border-slate-200 rounded-3xl shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center space-x-2">
            <FileCheck2 className="w-4 h-4 text-emerald-600" />
            <h3 className="text-sm font-extrabold text-slate-800">
              Listado de Requerimientos Atendidos y Cerrados
            </h3>
          </div>
          <span className="text-xs font-bold px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full">
            {filteredTickets.length} tickets encontrados
          </span>
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/80 text-slate-700 font-bold border-b border-slate-200">
                <th className="py-3.5 px-4">CÓDIGO</th>
                <th className="py-3.5 px-4">ASUNTO & SERVICIO</th>
                <th className="py-3.5 px-4">SOLICITANTE</th>
                <th className="py-3.5 px-4">FECHA RESOLUCIÓN</th>
                <th className="py-3.5 px-4">SOLUCIÓN APLICADA</th>
                {!isTechRole && <th className="py-3.5 px-4">CALIFICACIÓN CSAT</th>}
                <th className="py-3.5 px-4 text-right print:hidden">ACCIÓN</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <TableSkeleton rows={5} columns={isTechRole ? 6 : 7} />
              ) : filteredTickets.length === 0 ? (
                <tr>
                  <td colSpan={isTechRole ? 6 : 7} className="py-12 text-center text-slate-400 space-y-2">
                    <CheckCircle2 className="w-10 h-10 mx-auto text-slate-300" />
                    <p className="font-bold text-slate-600">No se encontraron tickets atendidos con los filtros actuales.</p>
                  </td>
                </tr>
              ) : (
                filteredTickets.map((t) => (
                  <tr
                    key={t.id}
                    onClick={() => onSelectTicketDetail(t.id, t.codigo_correlativo, t.estado)}
                    className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-unalm-700 whitespace-nowrap">
                      <div className="flex flex-col space-y-1">
                        <span>{t.codigo_correlativo}</span>
                        {Boolean(t.es_emergencia) && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-black bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-2xs w-fit animate-pulse">
                            🚨 EMERGENCIA
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 max-w-xs">
                      <p className="font-bold text-slate-900 line-clamp-1">{t.titulo}</p>
                      <span className="text-[11px] font-semibold text-slate-400 block mt-0.5">
                        {t.categoria_nombre}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-[10px]">
                          {t.solicitante_nombre?.charAt(0) || 'U'}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">{t.solicitante_nombre}</p>
                          <p className="text-[10px] text-slate-400">{t.solicitante_dependencia}</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-600 font-medium">
                      {t.fecha_resolucion ? (
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{new Date(t.fecha_resolucion).toLocaleDateString('es-PE')}</span>
                        </div>
                      ) : (
                        new Date(t.actualizado_en).toLocaleDateString('es-PE')
                      )}
                    </td>

                    <td className="py-3.5 px-4 max-w-xs truncate text-slate-600 italic">
                      {t.solucion_detalle ? (
                        <span className="truncate block">"{t.solucion_detalle}"</span>
                      ) : (
                        <span className="text-slate-400">Atención satisfactoria</span>
                      )}
                    </td>

                    {!isTechRole && (
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {t.encuesta_puntuacion && t.encuesta_puntuacion > 0 ? (
                          <div className="inline-flex items-center space-x-1 px-2.5 py-1 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 font-extrabold text-xs">
                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                            <span>{t.encuesta_puntuacion}/5</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px] italic">Sin calificar</span>
                        )}
                      </td>
                    )}

                    <td className="py-3.5 px-4 text-right whitespace-nowrap print:hidden">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectTicketDetail(t.id, t.codigo_correlativo, t.estado);
                        }}
                        className="p-2 bg-unalm-50 hover:bg-unalm-100 text-unalm-700 rounded-xl border border-unalm-200 font-bold text-xs transition-colors inline-flex items-center space-x-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Ver Detalle</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Vista en Tarjetas para Móviles (Sin scroll horizontal) */}
        <div className="block md:hidden p-3.5 space-y-3 bg-slate-50/60 dark:bg-slate-950/40">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((n) => (
                <div key={n} className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl animate-pulse space-y-3">
                  <div className="flex justify-between">
                    <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-24" />
                    <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-16" />
                  </div>
                  <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-3/4" />
                </div>
              ))}
            </div>
          ) : filteredTickets.length === 0 ? (
            <div className="py-12 px-4 text-center text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
              <CheckCircle2 className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600" />
              <p className="font-bold text-slate-600 dark:text-slate-400 text-xs">No se encontraron tickets atendidos con los filtros actuales.</p>
            </div>
          ) : (
            filteredTickets.map((t) => (
              <div
                key={t.id}
                onClick={() => onSelectTicketDetail(t.id, t.codigo_correlativo, t.estado)}
                className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs space-y-3 transition-all hover:border-slate-300 dark:hover:border-slate-700 cursor-pointer"
              >
                {/* Encabezado: Código y Calificación CSAT */}
                <div className="flex items-center justify-between gap-2">
                  <span className="px-2.5 py-0.5 rounded-lg border font-mono text-xs font-extrabold bg-unalm-50 dark:bg-emerald-950/40 text-unalm-700 dark:text-emerald-300 border-unalm-200 dark:border-emerald-800">
                    {t.codigo_correlativo}
                  </span>
                  {!isTechRole && t.encuesta_puntuacion && t.encuesta_puntuacion > 0 ? (
                    <div className="inline-flex items-center space-x-1 px-2.5 py-0.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-lg text-amber-900 dark:text-amber-300 font-extrabold text-xs">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                      <span>{t.encuesta_puntuacion}/5</span>
                    </div>
                  ) : null}
                </div>

                {/* Título & Servicio */}
                <div className="space-y-1">
                  <h3 className="font-extrabold text-slate-900 dark:text-white text-sm leading-snug line-clamp-2">
                    {t.titulo}
                  </h3>
                  <div className="flex items-center space-x-1 text-xs text-slate-500 dark:text-slate-400 font-medium">
                    <Layers className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{t.categoria_nombre}</span>
                  </div>
                </div>

                {/* Solicitante y Fecha */}
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800/80 space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                  <div className="flex items-center space-x-1.5">
                    <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                      {t.solicitante_nombre}
                    </span>
                  </div>
                  {t.solicitante_dependencia && (
                    <div className="flex items-center space-x-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                      <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="truncate">{t.solicitante_dependencia}</span>
                    </div>
                  )}
                  <div className="flex items-center space-x-1 text-[11px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>
                      Resuelto el: {t.fecha_resolucion ? new Date(t.fecha_resolucion).toLocaleDateString('es-PE') : new Date(t.actualizado_en).toLocaleDateString('es-PE')}
                    </span>
                  </div>
                </div>

                {/* Solución Aplicada */}
                {t.solucion_detalle && (
                  <div className="text-xs text-slate-600 dark:text-slate-300 italic bg-emerald-50/50 dark:bg-emerald-950/20 p-2 rounded-xl border border-emerald-100 dark:border-emerald-900/40">
                    <span className="font-bold text-emerald-800 dark:text-emerald-300 not-italic block text-[10px] uppercase">Solución registrada:</span>
                    <p className="line-clamp-2 mt-0.5">"{t.solucion_detalle}"</p>
                  </div>
                )}

                {/* Botón Acción */}
                <div className="flex justify-end pt-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectTicketDetail(t.id, t.codigo_correlativo, t.estado);
                    }}
                    className="w-full sm:w-auto px-4 py-2 bg-unalm-50 dark:bg-slate-800 hover:bg-unalm-100 dark:hover:bg-slate-700 text-unalm-700 dark:text-emerald-300 rounded-xl border border-unalm-200 dark:border-slate-700 font-bold text-xs transition-colors flex items-center justify-center space-x-1.5"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Ver Detalle del Ticket</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal de Vista Previa e Impresión Oficial del Reporte */}
      {showReportModal && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-[9999] overflow-y-auto bg-slate-950/85 backdrop-blur-md p-4 sm:p-6 flex flex-col items-center justify-start print:p-0 print:m-0 print:bg-white print:static"
          style={{ margin: 0, top: 0, left: 0, right: 0, bottom: 0, width: '100vw', height: '100vh' }}
        >
          {/* Barra superior no imprimible */}
          <div className="w-full max-w-4xl bg-slate-900 border border-slate-700 p-4 rounded-2xl mb-4 flex items-center justify-between text-white shadow-2xl print:hidden shrink-0">
            <div className="flex items-center space-x-2">
              <Printer className="w-5 h-5 text-emerald-400" />
              <span className="text-sm font-bold">Vista Previa del Reporte Oficial de Atenciones</span>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center space-x-1.5 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir / Guardar en PDF</span>
              </button>
              <button
                onClick={handleExportCSV}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold border border-slate-600 transition-all flex items-center space-x-1.5 cursor-pointer"
              >
                <Download className="w-4 h-4 text-emerald-400" />
                <span>Excel (.csv)</span>
              </button>
              <button
                onClick={() => setShowReportModal(false)}
                className="px-3 py-2 bg-red-600/80 hover:bg-red-600 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                ✕ Cerrar
              </button>
            </div>
          </div>

          {/* Documento A4 Oficial Imprimible */}
          <div className="attended-report-print-document w-full max-w-4xl bg-white text-slate-900 p-8 sm:p-12 rounded-2xl shadow-2xl border border-slate-200 print:shadow-none print:border-none print:p-6 print:m-0 print:max-w-none print:w-full">
            {/* Cabecera Oficial UNALM */}
            <div className="flex items-center justify-between border-b-2 border-slate-900 pb-4">
              <div className="flex items-center space-x-4">
                <img src="./escudo-color.png" alt="UNALM" className="w-16 h-16 object-contain" />
                <div>
                  <h2 className="text-sm font-black tracking-tight text-slate-950 uppercase leading-none">
                    Universidad Nacional Agraria La Molina
                  </h2>
                  <p className="text-xs font-bold text-slate-700 mt-1 uppercase">
                    Oficina de Tecnologías de la Información (OTIC)
                  </p>
                  <p className="text-[11px] font-semibold text-slate-500">
                    Mesa de Ayuda & Soporte Técnico Institucional
                  </p>
                </div>
              </div>
              <div className="text-right text-[11px] text-slate-700 space-y-0.5">
                <span className="font-extrabold px-2 py-0.5 bg-slate-100 rounded border border-slate-300 block text-slate-900">
                  DOCUMENTO OFICIAL
                </span>
                <p><strong>Fecha:</strong> {new Date().toLocaleDateString('es-PE', { timeZone: 'America/Lima' })}</p>
                <p><strong>Hora:</strong> {new Date().toLocaleTimeString('es-PE', { timeZone: 'America/Lima' })}</p>
              </div>
            </div>

            {/* Título del Reporte */}
            <div className="text-center py-6">
              <h1 className="text-lg font-black uppercase tracking-wider text-slate-950">
                INFORME CONSOLIDADO DE REQUERIMIENTOS ATENDIDOS Y RESUELTOS
              </h1>
              <p className="text-xs text-slate-600 mt-1 font-medium">
                Registro pormenorizado de atenciones técnicas ejecutadas conforme a los requerimientos institucionales
              </p>
            </div>

            {/* Ficha Informativa del Responsable */}
            <div className="bg-slate-50 border border-slate-300 rounded-xl p-4 mb-6 text-xs grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <span className="text-slate-500 font-bold block text-[10px] uppercase">Especialista / Técnico:</span>
                <span className="font-extrabold text-slate-950 text-xs block mt-0.5">
                  {user?.nombres} {user?.apellidos}
                </span>
              </div>
              <div>
                <span className="text-slate-500 font-bold block text-[10px] uppercase">Cargo / Rol:</span>
                <span className="font-semibold text-slate-800 text-xs block mt-0.5">
                  {user?.cargo || (isTechRole ? 'Técnico Especialista' : user?.rol)}
                </span>
              </div>
              <div>
                <span className="text-slate-500 font-bold block text-[10px] uppercase">Dependencia:</span>
                <span className="font-semibold text-slate-800 text-xs block mt-0.5">
                  {user?.facultadDependencia || 'Oficina de Tecnologías de la Información'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 font-bold block text-[10px] uppercase">Total Atendidos:</span>
                <span className="font-black text-emerald-800 text-xs block mt-0.5">
                  {filteredTickets.length} Requerimiento{filteredTickets.length !== 1 ? 's' : ''}
                </span>
              </div>
              <div>
                <span className="text-slate-500 font-bold block text-[10px] uppercase">Correo Electrónico:</span>
                <span className="font-medium text-slate-700 text-xs block mt-0.5">
                  {user?.email}
                </span>
              </div>
              <div>
                <span className="text-slate-500 font-bold block text-[10px] uppercase">Estado de Atención:</span>
                <span className="font-extrabold text-slate-900 text-xs block mt-0.5">
                  100% RESUELTO
                </span>
              </div>
            </div>

            {/* Tabla Oficial de Requerimientos */}
            <table className="w-full text-[11px] border-collapse border border-slate-400 mb-8">
              <thead>
                <tr className="bg-slate-100 text-slate-900 font-bold text-left border-b border-slate-400">
                  <th className="border border-slate-300 p-2 w-8 text-center">N°</th>
                  <th className="border border-slate-300 p-2 w-28">CÓDIGO</th>
                  <th className="border border-slate-300 p-2 w-24">FECHA RES.</th>
                  <th className="border border-slate-300 p-2 w-44">SOLICITANTE & ÁREA</th>
                  <th className="border border-slate-300 p-2 w-36">SERVICIO</th>
                  <th className="border border-slate-300 p-2">INFORME TÉCNICO / SOLUCIÓN APLICADA</th>
                </tr>
              </thead>
              <tbody>
                {filteredTickets.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="border border-slate-300 p-6 text-center text-slate-500 italic">
                      No se encontraron requerimientos atendidos bajo los criterios seleccionados.
                    </td>
                  </tr>
                ) : (
                  filteredTickets.map((t, idx) => (
                    <tr key={t.id} className="border-b border-slate-300 align-top">
                      <td className="border border-slate-300 p-2 text-center font-bold text-slate-700">{idx + 1}</td>
                      <td className="border border-slate-300 p-2 font-black text-slate-900 whitespace-nowrap">{t.codigo_correlativo}</td>
                      <td className="border border-slate-300 p-2 whitespace-nowrap text-slate-700">
                        {t.fecha_resolucion
                          ? new Date(t.fecha_resolucion).toLocaleDateString('es-PE', { timeZone: 'America/Lima' })
                          : '-'}
                      </td>
                      <td className="border border-slate-300 p-2">
                        <span className="font-bold text-slate-900 block">{t.solicitante_nombre}</span>
                        <span className="text-[10px] text-slate-600 block">{t.solicitante_dependencia}</span>
                      </td>
                      <td className="border border-slate-300 p-2 font-medium text-slate-800">
                        {t.categoria_nombre || 'Soporte Técnico'}
                      </td>
                      <td className="border border-slate-300 p-2 font-normal text-slate-800">
                        <p className="font-semibold text-slate-900 mb-0.5">{t.titulo}</p>
                        <p className="text-[10.5px] text-slate-700 whitespace-pre-wrap leading-relaxed">
                          {t.solucion_detalle || 'Incidencia solucionada y conformidad técnica otorgada.'}
                        </p>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {/* Bloque de Firmas Institucionales */}
            <div className="grid grid-cols-2 gap-12 pt-16 mt-8 text-center text-xs">
              <div className="border-t border-slate-900 pt-2">
                <p className="font-black text-slate-950 uppercase">{user?.nombres} {user?.apellidos}</p>
                <p className="text-[11px] text-slate-600 font-medium">Firma del Técnico Especialista Responsable</p>
                <p className="text-[10px] text-slate-500 mt-0.5">DNI: _______________________</p>
              </div>
              <div className="border-t border-slate-900 pt-2">
                <p className="font-black text-slate-950 uppercase">V°B° Mesa de Ayuda / Jefatura OTIC</p>
                <p className="text-[11px] text-slate-600 font-medium">Oficina de Tecnologías de la Información</p>
                <p className="text-[10px] text-slate-500 mt-0.5">UNALM - La Molina</p>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
