import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { InfrastructureInspection, InspectionFinding } from '../types';
import { Modal } from '../components/Modal';
import { PriorityBadge } from '../components/Badge';
import { useToast } from '../components/Toast';
import {
  Building2,
  Search,
  RefreshCw,
  Eye,
  AlertTriangle,
  Zap,
  CheckCircle2,
  Calendar,
  User,
  ShieldAlert,
  ArrowRight,
  ClipboardList,
  Wrench,
  Sparkles,
  ExternalLink,
  Layers,
  MapPin,
  Check,
} from 'lucide-react';

interface InfrastructureInspectionsPageProps {
  onSelectTicketDetail?: (ticketId: number, ticketCode?: string, ticketStatus?: string) => void;
}

export const InfrastructureInspectionsPage: React.FC<InfrastructureInspectionsPageProps> = ({
  onSelectTicketDetail,
}) => {
  const toast = useToast();
  const [inspections, setInspections] = useState<InfrastructureInspection[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedEdificio, setSelectedEdificio] = useState('');

  // Inspection Detail Modal state
  const [selectedInspection, setSelectedInspection] = useState<InfrastructureInspection | null>(null);
  const [findings, setFindings] = useState<InspectionFinding[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [findingFilter, setFindingFilter] = useState<'ALL' | 'CRITICO' | 'MANTENIMIENTO' | 'BUENO'>('ALL');

  // Processing state
  const [generatingAll, setGeneratingAll] = useState(false);
  const [generatingInspectionId, setGeneratingInspectionId] = useState<number | null>(null);
  const [generatingFindingId, setGeneratingFindingId] = useState<number | null>(null);

  const loadInspections = async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {};
      if (search) params.search = search;
      if (selectedEdificio) params.edificio = selectedEdificio;

      const res = await api.getInspections(params);
      if (res.success) {
        setInspections(res.data);
      }
    } catch (err: any) {
      console.error(err);
      toast.error('Error al cargar historial de inspecciones preventivas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInspections();
  }, [selectedEdificio]);

  const handleOpenDetail = async (insp: InfrastructureInspection) => {
    setSelectedInspection(insp);
    setIsDetailModalOpen(true);
    setFindingFilter('ALL');
    try {
      setLoadingDetail(true);
      const res = await api.getInspectionDetail(insp.id);
      if (res.success) {
        setFindings(res.data.findings || []);
      }
    } catch (err: any) {
      toast.error(err.message || 'Error al cargar detalle de inspección');
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleGenerateAllCritical = async () => {
    try {
      setGeneratingAll(true);
      const res = await api.generateAllCriticalTickets();
      if (res.success) {
        toast.success(res.message, 'Sincronización SIGI Exitosa');
        await loadInspections();
        if (selectedInspection) {
          const detailRes = await api.getInspectionDetail(selectedInspection.id);
          if (detailRes.success) setFindings(detailRes.data.findings || []);
        }
      }
    } catch (err: any) {
      toast.error(err.message || 'Error al generar tickets automáticos');
    } finally {
      setGeneratingAll(false);
    }
  };

  const handleGenerateTicketsForInspection = async (inspId: number) => {
    try {
      setGeneratingInspectionId(inspId);
      const res = await api.generateTicketsFromInspection(inspId);
      if (res.success) {
        toast.success(res.message, 'Tickets Generados');
        await loadInspections();
        if (selectedInspection && selectedInspection.id === inspId) {
          const detailRes = await api.getInspectionDetail(inspId);
          if (detailRes.success) setFindings(detailRes.data.findings || []);
        }
      }
    } catch (err: any) {
      toast.error(err.message || 'Error al generar tickets para la inspección');
    } finally {
      setGeneratingInspectionId(null);
    }
  };

  const handleCreateTicketForFinding = async (findingId: number) => {
    try {
      setGeneratingFindingId(findingId);
      const res = await api.generateTicketFromFinding(findingId);
      if (res.success) {
        toast.success(res.message, 'Ticket Creado');
        if (selectedInspection) {
          const detailRes = await api.getInspectionDetail(selectedInspection.id);
          if (detailRes.success) setFindings(detailRes.data.findings || []);
        }
        await loadInspections();
      }
    } catch (err: any) {
      toast.error(err.message || 'Error al crear ticket del hallazgo');
    } finally {
      setGeneratingFindingId(null);
    }
  };

  // Filtro de hallazgos en el modal
  const filteredFindings = findings.filter((f) => {
    if (findingFilter === 'ALL') return true;
    return f.estado_calificacion === findingFilter;
  });

  const totalCriticosModal = findings.filter((f) => f.estado_calificacion === 'CRITICO').length;
  const totalMantenimientoModal = findings.filter((f) => f.estado_calificacion === 'MANTENIMIENTO').length;
  const totalBuenosModal = findings.filter((f) => f.estado_calificacion === 'BUENO' || f.estado_calificacion === 'EXCELENTE').length;

  const edificiosUnicos = Array.from(new Set(inspections.map((i) => i.edificio)));

  return (
    <div className="space-y-6 w-full max-w-[1700px] mx-auto px-4 sm:px-6 py-6">
      {/* Top Banner Card */}
      <div className="bg-gradient-to-r from-amber-900 via-slate-900 to-amber-950 p-6 sm:p-8 rounded-3xl text-white shadow-xl border border-amber-800/40 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="relative z-10 max-w-3xl">
          <div className="flex items-center space-x-2 mb-2">
            <span className="text-[11px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40 px-3 py-0.5 rounded-full inline-flex items-center space-x-1.5">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>SIGI UNALM • Módulo de Mantenimiento Preventivo</span>
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center space-x-2.5">
            <ClipboardList className="w-7 h-7 text-amber-400" />
            <span>Inspecciones Preventivas de Infraestructura</span>
          </h1>
          <p className="text-xs text-amber-100/90 mt-1.5 leading-relaxed">
            Historial y buscador de reportes preventivos de infraestructura. Identifique hallazgos en estado crítico recopilados en campo y genere automáticamente tickets de atención técnica en la cola de Servicios Generales.
          </p>
        </div>

        <div className="relative z-10 shrink-0 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <button
            onClick={handleGenerateAllCritical}
            disabled={generatingAll}
            className="px-5 py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 rounded-2xl text-xs font-black shadow-lg shadow-amber-950/50 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            {generatingAll ? (
              <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Zap className="w-4 h-4 fill-slate-950" />
            )}
            <span>⚡ Generar Tickets de Hallazgos Críticos</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative sm:col-span-2">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && loadInspections()}
            placeholder="Buscar por código (INSP-...), edificio, área o inspector..."
            className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none font-medium"
          />
        </div>

        <select
          value={selectedEdificio}
          onChange={(e) => setSelectedEdificio(e.target.value)}
          className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-xs bg-white text-slate-700 font-bold focus:ring-2 focus:ring-amber-500 focus:outline-none"
        >
          <option value="">Todos los Edificios / Pabellones</option>
          {edificiosUnicos.map((ed) => (
            <option key={ed} value={ed}>
              {ed}
            </option>
          ))}
        </select>

        <div className="flex space-x-2">
          <button
            onClick={loadInspections}
            className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-extrabold transition-colors shadow-xs"
          >
            Buscar
          </button>
          <button
            onClick={loadInspections}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl border border-slate-300 transition-colors"
            title="Refrescar lista"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Inspections Table */}
      <div className="bg-white border border-slate-200 rounded-3xl shadow-xs overflow-hidden">
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[980px]">
            <thead>
              <tr className="bg-slate-100/80 text-slate-700 font-bold border-b border-slate-200">
                <th className="py-3.5 px-4 w-[16%]">CÓDIGO</th>
                <th className="py-3.5 px-4 w-[14%]">FECHA</th>
                <th className="py-3.5 px-4 w-[20%]">EDIFICIO</th>
                <th className="py-3.5 px-4 w-[18%]">ÁREA / AMBIENTE</th>
                <th className="py-3.5 px-4 w-[16%]">INSPECTOR</th>
                <th className="py-3.5 px-4 w-[16%] text-center">HALLAZGOS CRÍTICOS</th>
                <th className="py-3.5 px-4 w-[14%] text-right sticky right-0 bg-slate-100/90 backdrop-blur-xs shadow-[-6px_0_10px_-4px_rgba(0,0,0,0.05)]">
                  ACCIONES
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <div className="w-7 h-7 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Cargando reportes preventivos de infraestructura...
                  </td>
                </tr>
              ) : inspections.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 space-y-2">
                    <ClipboardList className="w-10 h-10 mx-auto text-slate-300" />
                    <p className="font-bold text-slate-600 text-sm">No se encontraron reportes de inspección registrados.</p>
                  </td>
                </tr>
              ) : (
                inspections.map((insp) => {
                  const tieneCriticosPendientes = (insp.total_criticos || 0) > (insp.tickets_generados || 0);
                  const isProcessing = generatingInspectionId === insp.id;

                  return (
                    <tr key={insp.id} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="py-3.5 px-4 font-mono font-black text-slate-900 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-xl text-[11px] bg-amber-50 text-amber-900 border border-amber-300 font-mono font-black shadow-2xs">
                          {insp.codigo}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap text-[11px] font-medium">
                        <div className="flex items-center space-x-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{new Date(insp.fecha_registro).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        <div className="flex items-center space-x-2">
                          <Building2 className="w-4 h-4 text-amber-600 shrink-0" />
                          <span className="truncate max-w-[200px]">{insp.edificio}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-slate-600 truncate max-w-[180px]">
                        <div className="flex items-center space-x-1.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{insp.area}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-slate-700 text-[11px] font-semibold truncate max-w-[160px]">
                        <div className="flex items-center space-x-1.5">
                          <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{insp.inspector_nombre}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {insp.total_criticos > 0 ? (
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-extrabold border ${
                              tieneCriticosPendientes
                                ? 'bg-rose-100 text-rose-800 border-rose-300 shadow-2xs animate-pulse'
                                : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                            }`}
                          >
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            {insp.total_criticos} Críticos ({insp.tickets_generados} con Ticket)
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                            Sin Críticos
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right space-x-2 whitespace-nowrap sticky right-0 bg-white group-hover:bg-slate-50 transition-colors shadow-[-6px_0_10px_-4px_rgba(0,0,0,0.05)]">
                        <button
                          onClick={() => handleOpenDetail(insp)}
                          className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-[11px] border border-slate-200 transition-colors inline-flex items-center space-x-1.5"
                          title="Ver detalle del reporte y checklist"
                        >
                          <Eye className="w-3.5 h-3.5 text-slate-500" />
                          <span>Ver Detalle</span>
                        </button>

                        {tieneCriticosPendientes && (
                          <button
                            onClick={() => handleGenerateTicketsForInspection(insp.id)}
                            disabled={isProcessing}
                            className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-[11px] border border-amber-600 transition-colors inline-flex items-center space-x-1 shadow-xs disabled:opacity-50"
                            title="Generar tickets automáticos para todos los hallazgos críticos"
                          >
                            {isProcessing ? (
                              <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <Zap className="w-3.5 h-3.5 fill-slate-950" />
                            )}
                            <span>Crear Tickets</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards View (eliminates horizontal scrolling on mobile) */}
        <div className="block md:hidden p-3.5 space-y-3 bg-slate-50/60">
          {loading ? (
            <div className="py-8 text-center text-slate-400 text-xs">
              <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              Cargando reportes preventivos...
            </div>
          ) : inspections.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs space-y-1">
              <ClipboardList className="w-8 h-8 mx-auto text-slate-300" />
              <p>No se encontraron inspecciones preventivas registradas.</p>
            </div>
          ) : (
            inspections.map((insp) => {
              const tieneCriticosPendientes = (insp.total_criticos || 0) > (insp.tickets_generados || 0);
              const isProcessing = generatingInspectionId === insp.id;

              return (
                <div key={insp.id} className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-lg bg-amber-50 text-amber-900 border border-amber-200 font-mono font-extrabold text-xs">
                      {insp.codigo}
                    </span>
                    <span className="text-slate-500 text-xs flex items-center space-x-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>
                        {new Date(insp.fecha_registro).toLocaleDateString('es-PE', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                        })}
                      </span>
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center space-x-1.5 text-sm font-bold text-slate-900">
                      <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
                      <span className="truncate">{insp.edificio}</span>
                    </div>
                    <div className="flex items-center space-x-1.5 text-xs text-slate-600">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{insp.area}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                    <div className="flex items-center space-x-1.5 text-slate-600">
                      <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{insp.inspector_nombre}</span>
                    </div>
                    {(insp.total_criticos || 0) > 0 ? (
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${
                          tieneCriticosPendientes
                            ? 'bg-rose-100 text-rose-800 border-rose-300'
                            : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                        }`}
                      >
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        {insp.total_criticos} Críticos
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                        Sin Críticos
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100">
                    <button
                      onClick={() => handleOpenDetail(insp)}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs border border-slate-200 transition-colors inline-flex items-center space-x-1.5 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5 text-slate-500" />
                      <span>Ver Detalle</span>
                    </button>
                    {tieneCriticosPendientes && (
                      <button
                        onClick={() => handleGenerateTicketsForInspection(insp.id)}
                        disabled={isProcessing}
                        className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs border border-amber-600 transition-colors inline-flex items-center space-x-1 shadow-xs disabled:opacity-50 cursor-pointer"
                      >
                        {isProcessing ? (
                          <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Zap className="w-3.5 h-3.5 fill-slate-950" />
                        )}
                        <span>Crear Tickets</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* =========================================================================
          MODAL: DETALLE DE INSPECCIÓN PREVENTIVA Y CHECKLIST
         ========================================================================= */}
      {selectedInspection && (
        <Modal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          title={`Reporte de Inspección: ${selectedInspection.codigo}`}
          subtitle={`${selectedInspection.edificio} • ${selectedInspection.area}`}
          maxWidth="4xl"
        >
          <div className="space-y-6">
            {/* Header info cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Inspector Encargado</span>
                <span className="font-extrabold text-slate-800 mt-0.5 block">{selectedInspection.inspector_nombre}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Fecha de Registro</span>
                <span className="font-semibold text-slate-700 mt-0.5 block">
                  {new Date(selectedInspection.fecha_registro).toLocaleString('es-PE')}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Responsable de Área</span>
                <span className="font-semibold text-slate-700 mt-0.5 block">{selectedInspection.responsable_area || 'No especificado'}</span>
              </div>
            </div>

            {selectedInspection.observaciones_generales && (
              <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-2xl text-xs text-amber-900">
                <span className="font-bold block mb-1">📝 Observaciones Generales del Inspector:</span>
                <p className="leading-relaxed">{selectedInspection.observaciones_generales}</p>
              </div>
            )}

            {/* Tabs de Filtro de Hallazgos */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setFindingFilter('ALL')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-colors ${
                    findingFilter === 'ALL'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Todos ({findings.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFindingFilter('CRITICO')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-colors flex items-center space-x-1 ${
                    findingFilter === 'CRITICO'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                  }`}
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Críticos ({totalCriticosModal})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFindingFilter('MANTENIMIENTO')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-colors ${
                    findingFilter === 'MANTENIMIENTO'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
                  }`}
                >
                  Mantenimiento ({totalMantenimientoModal})
                </button>
                <button
                  type="button"
                  onClick={() => setFindingFilter('BUENO')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-colors ${
                    findingFilter === 'BUENO'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                  }`}
                >
                  Bueno ({totalBuenosModal})
                </button>
              </div>

              {totalCriticosModal > 0 && (
                <button
                  onClick={() => handleGenerateTicketsForInspection(selectedInspection.id)}
                  disabled={generatingInspectionId === selectedInspection.id}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-black shadow-xs transition-colors flex items-center space-x-1.5 disabled:opacity-50"
                >
                  <Zap className="w-3.5 h-3.5 fill-slate-950" />
                  <span>Generar Tickets de Críticos</span>
                </button>
              )}
            </div>

            {/* Lista de Hallazgos y Checklist */}
            <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
              {loadingDetail ? (
                <div className="py-12 text-center text-slate-400 font-semibold">Cargando elementos evaluados...</div>
              ) : filteredFindings.length === 0 ? (
                <div className="py-8 text-center text-slate-400 font-medium">No se encontraron elementos en esta categoría.</div>
              ) : (
                filteredFindings.map((f) => {
                  const isCritico = f.estado_calificacion === 'CRITICO';
                  const isMantenimiento = f.estado_calificacion === 'MANTENIMIENTO';
                  const isGenerating = generatingFindingId === f.id;

                  return (
                    <div
                      key={f.id}
                      className={`p-4 rounded-2xl border transition-all ${
                        isCritico
                          ? 'bg-rose-50/70 border-rose-200 text-rose-950'
                          : isMantenimiento
                          ? 'bg-amber-50/70 border-amber-200 text-amber-950'
                          : 'bg-slate-50/70 border-slate-200 text-slate-800'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div className="space-y-1 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="px-2.5 py-0.5 rounded-lg font-mono font-black text-xs bg-white border border-slate-300 shadow-2xs">
                              {f.item_codigo}
                            </span>
                            <h4 className="font-extrabold text-sm text-slate-900">{f.item_nombre}</h4>
                            <span className="text-[10px] font-bold text-slate-500 bg-slate-200/80 px-2 py-0.5 rounded-md">
                              {f.categoria_nombre}
                            </span>
                            <PriorityBadge priority={f.prioridad} />
                          </div>

                          {f.observacion && (
                            <p className="text-xs text-slate-700 leading-relaxed pt-1">
                              <strong className="font-bold text-slate-900">Diagnóstico:</strong> {f.observacion}
                            </p>
                          )}

                          {f.accion_sugerida && (
                            <p className="text-xs text-slate-700 leading-relaxed">
                              <strong className="font-bold text-slate-900">Acción Sugerida:</strong> {f.accion_sugerida}
                            </p>
                          )}
                        </div>

                        {/* Estado y Botón de Ticket */}
                        <div className="shrink-0 flex flex-col sm:items-end space-y-2">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black border ${
                              isCritico
                                ? 'bg-rose-600 text-white border-rose-700 shadow-xs'
                                : isMantenimiento
                                ? 'bg-amber-500 text-slate-950 border-amber-600 font-extrabold'
                                : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                            }`}
                          >
                            {isCritico ? '🚨 CRÍTICO (1)' : isMantenimiento ? '⚠️ MANTENIMIENTO (2)' : '✅ BUENO (3)'}
                          </span>

                          {f.ticket_id ? (
                            <div className="flex items-center space-x-1.5">
                              <span className="inline-flex items-center px-2.5 py-1 rounded-xl text-[11px] font-mono font-black bg-emerald-50 text-emerald-900 border border-emerald-300">
                                <Check className="w-3.5 h-3.5 text-emerald-600 mr-1" />
                                {f.ticket_codigo || `Ticket #${f.ticket_id}`}
                              </span>
                              {onSelectTicketDetail && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setIsDetailModalOpen(false);
                                    onSelectTicketDetail(f.ticket_id!, f.ticket_codigo || undefined);
                                  }}
                                  className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors"
                                  title="Ver Ticket en Mesa de Ayuda"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          ) : isCritico ? (
                            <button
                              type="button"
                              onClick={() => handleCreateTicketForFinding(f.id)}
                              disabled={isGenerating}
                              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-black shadow-xs transition-colors flex items-center space-x-1 disabled:opacity-50"
                            >
                              {isGenerating ? (
                                <div className="w-3 h-3 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <Zap className="w-3 h-3 fill-slate-950" />
                              )}
                              <span>Crear Ticket SG</span>
                            </button>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsDetailModalOpen(false)}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
