import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../services/api';
import { SolicitudCuentaAD } from '../types';
import { useToast } from '../components/Toast';
import { Modal } from '../components/Modal';
import {
  UserPlus,
  Search,
  Filter,
  RefreshCw,
  Download,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  Mail,
  Phone,
  Building,
  ShieldCheck,
  AlertTriangle,
  Copy,
  ExternalLink,
  Calendar,
  FileText,
  Loader2,
  Check,
} from 'lucide-react';

export const AdminADRequestsPage: React.FC = () => {
  const toast = useToast();
  const [requests, setRequests] = useState<SolicitudCuentaAD[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'TODOS' | 'PENDIENTE' | 'CREADO' | 'RECHAZADO'>('TODOS');

  // Detail Modal
  const [selectedRequest, setSelectedRequest] = useState<SolicitudCuentaAD | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  // Status Change Modal
  const [isStatusModalOpen, setIsStatusModalOpen] = useState<boolean>(false);
  const [targetStatus, setTargetStatus] = useState<'PENDIENTE' | 'CREADO' | 'RECHAZADO'>('CREADO');
  const [observacion, setObservacion] = useState<string>('');
  const [submittingStatus, setSubmittingStatus] = useState<boolean>(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await api.getADRequests({
        search: search.trim() || undefined,
        estado: statusFilter,
      });
      if (res.success && res.data) {
        setRequests(res.data);
      }
    } catch (err: any) {
      toast.error('Error al cargar las solicitudes de cuenta en Directorio Activo');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  // Handle Search submit
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  // KPIs
  const stats = useMemo(() => {
    const total = requests.length;
    const pendientes = requests.filter((r) => r.estado === 'PENDIENTE').length;
    const creados = requests.filter((r) => r.estado === 'CREADO').length;
    const rechazados = requests.filter((r) => r.estado === 'RECHAZADO').length;
    return { total, pendientes, creados, rechazados };
  }, [requests]);

  // Export to CSV
  const handleExportCSV = () => {
    if (requests.length === 0) {
      toast.error('No hay datos para exportar.');
      return;
    }

    const headers = [
      'ID',
      'Nombres y Apellidos',
      'DNI',
      'Condición',
      'Correo de Contacto',
      'Facultad / Dependencia',
      'Celular',
      'Anexo',
      'Estado',
      'Observación / Motivo',
      'Fecha y Hora Registro',
      'Fecha Procesado',
      'Procesado Por',
    ];

    const rows = requests.map((r) => [
      r.id,
      `"${(r.nombre_completo || '').replace(/"/g, '""')}"`,
      `"${r.dni || ''}"`,
      `"${(r.condicion || '').replace(/"/g, '""')}"`,
      `"${r.email || ''}"`,
      `"${(r.facultad_dependencia || '').replace(/"/g, '""')}"`,
      `"${r.celular || ''}"`,
      `"${r.anexo || ''}"`,
      `"${r.estado}"`,
      `"${(r.observacion || '').replace(/"/g, '""')}"`,
      `"${new Date(r.creado_en).toLocaleString('es-PE')}"`,
      `"${r.procesado_en ? new Date(r.procesado_en).toLocaleString('es-PE') : ''}"`,
      `"${(r.procesado_por || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Solicitudes_Directorio_Activo_UNALM_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Reporte exportado exitosamente en formato CSV.');
  };

  // Open Status Change Modal
  const handleOpenStatusModal = (req: SolicitudCuentaAD, defaultStatus: 'PENDIENTE' | 'CREADO' | 'RECHAZADO') => {
    setSelectedRequest(req);
    setTargetStatus(defaultStatus);
    setObservacion(req.observacion || '');
    setIsStatusModalOpen(true);
  };

  const handleSubmitStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest) return;

    try {
      setSubmittingStatus(true);
      const res = await api.updateADRequestStatus(selectedRequest.id, targetStatus, observacion);
      if (res.success) {
        toast.success(res.message || 'Estado actualizado correctamente');
        setIsStatusModalOpen(false);
        if (isDetailModalOpen) {
          setIsDetailModalOpen(false);
        }
        loadData();
      } else {
        toast.error(res.message || 'Error al actualizar el estado');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error al actualizar la solicitud');
    } finally {
      setSubmittingStatus(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Información copiada al portapapeles');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl shadow-xs border border-slate-200/80 dark:border-slate-800">
        <div className="flex items-center space-x-3.5">
          <div className="p-3 bg-gradient-to-tr from-teal-600 to-emerald-600 text-white rounded-2xl shadow-md shadow-teal-950/20">
            <UserPlus className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Solicitudes de Cuenta en Directorio Activo
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Control, auditoría y trazabilidad de registros institucionales solicitados desde la pantalla de login.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-all cursor-pointer active:scale-95"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Actualizar</span>
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/50 hover:bg-teal-100 dark:hover:bg-teal-900/50 border border-teal-200 dark:border-teal-800/80 transition-all cursor-pointer active:scale-95"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exportar CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Total Solicitudes</span>
            <span className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl">
              <FileText className="w-4 h-4" />
            </span>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-2">{stats.total}</p>
          <span className="text-[11px] text-slate-400 font-medium">Registradas desde el portal</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-amber-200 dark:border-amber-900/50 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-700 dark:text-amber-400">Pendientes</span>
            <span className="p-2 bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-300 rounded-xl">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-2">{stats.pendientes}</p>
          <span className="text-[11px] text-amber-700/80 dark:text-amber-400/80 font-medium">Por procesar en Redes</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-emerald-200 dark:border-emerald-900/50 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">Cuentas Creadas</span>
            <span className="p-2 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-300 rounded-xl">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-2">{stats.creados}</p>
          <span className="text-[11px] text-emerald-700/80 dark:text-emerald-400/80 font-medium">Activadas en el Directorio</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-rose-200 dark:border-rose-900/50 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-700 dark:text-rose-400">Rechazadas</span>
            <span className="p-2 bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-300 rounded-xl">
              <XCircle className="w-4 h-4" />
            </span>
          </div>
          <p className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-2">{stats.rechazados}</p>
          <span className="text-[11px] text-rose-700/80 dark:text-rose-400/80 font-medium">Desestimadas o no conformes</span>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Form */}
          <form onSubmit={handleSearchSubmit} className="flex-1 max-w-lg relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre, DNI, correo, facultad o celular..."
              className="w-full pl-9 pr-20 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            <button
              type="submit"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold cursor-pointer transition-colors"
            >
              Buscar
            </button>
          </form>

          {/* Estado Selector Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            {(['TODOS', 'PENDIENTE', 'CREADO', 'RECHAZADO'] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                  statusFilter === st
                    ? st === 'PENDIENTE'
                      ? 'bg-amber-600 text-white shadow-2xs'
                      : st === 'CREADO'
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : st === 'RECHAZADO'
                      ? 'bg-rose-600 text-white shadow-2xs'
                      : 'bg-teal-600 text-white shadow-2xs'
                    : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                {st === 'TODOS'
                  ? `Todos (${stats.total})`
                  : st === 'PENDIENTE'
                  ? `Pendientes (${stats.pendientes})`
                  : st === 'CREADO'
                  ? `Creadas (${stats.creados})`
                  : `Rechazadas (${stats.rechazados})`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-3 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
            <p className="text-xs font-medium">Cargando registros de Directorio Activo...</p>
          </div>
        ) : requests.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-3 text-slate-400">
            <UserPlus className="w-12 h-12 text-slate-300 dark:text-slate-600" />
            <p className="text-sm font-bold text-slate-600 dark:text-slate-300">
              No se encontraron solicitudes de cuenta
            </p>
            <p className="text-xs text-slate-400">
              {search ? 'Intente con otros términos de búsqueda.' : 'No hay registros en este estado actualmente.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100/90 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-black border-b border-slate-200 dark:border-slate-700 select-none">
                  <th className="py-3 px-4 w-[60px]">#</th>
                  <th className="py-3 px-4">Solicitante</th>
                  <th className="py-3 px-4">DNI</th>
                  <th className="py-3 px-4">Condición</th>
                  <th className="py-3 px-4">Correo Contacto</th>
                  <th className="py-3 px-4">Facultad / Dependencia</th>
                  <th className="py-3 px-4">Celular / Anexo</th>
                  <th className="py-3 px-4">Fecha y Hora</th>
                  <th className="py-3 px-4 text-center">Estado</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {requests.map((r) => (
                  <tr
                    key={r.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-400">{r.id}</td>

                    <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white">
                      <div className="flex items-center space-x-2.5">
                        <div className="w-7 h-7 rounded-full bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 flex items-center justify-center font-black text-xs shrink-0">
                          {r.nombre_completo.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-bold">{r.nombre_completo}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-slate-700 dark:text-slate-300">
                      {r.dni}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="inline-block px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-[11px] border border-slate-200/80 dark:border-slate-700">
                        {r.condicion}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-medium text-slate-600 dark:text-slate-300">
                      <a
                        href={`mailto:${r.email}`}
                        className="text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1"
                      >
                        <Mail className="w-3 h-3 shrink-0" />
                        <span className="truncate max-w-[180px]">{r.email}</span>
                      </a>
                    </td>

                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                      <div className="flex items-center gap-1 max-w-[200px] truncate" title={r.facultad_dependencia}>
                        <Building className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate">{r.facultad_dependencia}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-slate-700 dark:text-slate-300 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>{r.celular}</span>
                        {r.anexo && <span className="text-slate-400 text-[10px]">(Anx: {r.anexo})</span>}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-600 dark:text-slate-400 font-medium text-[11px]">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>
                          {new Date(r.creado_en).toLocaleString('es-PE', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          })}
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          r.estado === 'PENDIENTE'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300/80 animate-pulse'
                            : r.estado === 'CREADO'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300/80'
                            : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300/80'
                        }`}
                      >
                        {r.estado === 'PENDIENTE' && <Clock className="w-3 h-3 mr-1" />}
                        {r.estado === 'CREADO' && <CheckCircle2 className="w-3 h-3 mr-1" />}
                        {r.estado === 'RECHAZADO' && <XCircle className="w-3 h-3 mr-1" />}
                        <span>{r.estado}</span>
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedRequest(r);
                            setIsDetailModalOpen(true);
                          }}
                          className="px-2.5 py-1 text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                        >
                          Ver Ficha
                        </button>

                        {r.estado === 'PENDIENTE' && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleOpenStatusModal(r, 'CREADO')}
                              title="Marcar como cuenta creada en AD"
                              className="p-1 text-emerald-700 dark:text-emerald-300 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/50 rounded-lg transition-colors cursor-pointer"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenStatusModal(r, 'RECHAZADO')}
                              title="Desestimar o rechazar solicitud"
                              className="p-1 text-rose-700 dark:text-rose-300 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 dark:hover:bg-rose-900/50 rounded-lg transition-colors cursor-pointer"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Ficha Detallada de la Solicitud */}
      {isDetailModalOpen && selectedRequest && (
        <Modal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          title={`Ficha de Solicitud #${selectedRequest.id}: ${selectedRequest.nombre_completo}`}
          maxWidth="2xl"
        >
          <div className="space-y-5">
            {/* Cabecera Solicitante */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-start justify-between gap-4">
              <div className="flex items-center space-x-3.5">
                <div className="w-12 h-12 rounded-2xl bg-teal-600 text-white flex items-center justify-center font-black text-lg shadow-md">
                  {selectedRequest.nombre_completo.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    {selectedRequest.nombre_completo}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    DNI: <strong className="font-mono text-slate-800 dark:text-slate-200">{selectedRequest.dni}</strong> • Condición: {selectedRequest.condicion}
                  </p>
                </div>
              </div>

              <span
                className={`px-3 py-1 rounded-full text-xs font-black uppercase ${
                  selectedRequest.estado === 'PENDIENTE'
                    ? 'bg-amber-100 text-amber-800 border border-amber-300'
                    : selectedRequest.estado === 'CREADO'
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-rose-100 text-rose-800 border border-rose-300'
                }`}
              >
                {selectedRequest.estado}
              </span>
            </div>

            {/* Grid de Datos */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
              <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-1">
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  Correo Electrónico de Contacto
                </span>
                <p className="font-bold text-slate-900 dark:text-white break-all flex items-center justify-between">
                  <span>{selectedRequest.email}</span>
                  <a
                    href={`mailto:${selectedRequest.email}`}
                    className="text-teal-600 hover:text-teal-700"
                    title="Enviar correo"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </p>
              </div>

              <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-1">
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  Celular & Anexo Institucional
                </span>
                <p className="font-bold text-slate-900 dark:text-white">
                  {selectedRequest.celular}{' '}
                  {selectedRequest.anexo ? `(Anexo: ${selectedRequest.anexo})` : '(Sin anexo)'}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-1 sm:col-span-2">
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  Facultad / Dependencia / Unidad Orgánica
                </span>
                <p className="font-bold text-slate-900 dark:text-white">
                  {selectedRequest.facultad_dependencia}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-1 sm:col-span-2">
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  Fecha y Hora de Envío desde Login
                </span>
                <p className="font-mono font-bold text-slate-800 dark:text-slate-200">
                  {new Date(selectedRequest.creado_en).toLocaleString('es-PE', {
                    dateStyle: 'full',
                    timeStyle: 'medium',
                  })}
                </p>
              </div>

              {selectedRequest.procesado_en && (
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1 sm:col-span-2">
                  <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                    Atención / Procesamiento
                  </span>
                  <p className="text-slate-700 dark:text-slate-300">
                    Procesado por <strong>{selectedRequest.procesado_por || 'Administrador'}</strong> el{' '}
                    {new Date(selectedRequest.procesado_en).toLocaleString('es-PE')}
                  </p>
                  {selectedRequest.observacion && (
                    <p className="text-slate-600 dark:text-slate-400 italic pt-1">
                      "{selectedRequest.observacion}"
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Acciones del Modal */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between flex-wrap gap-2">
              <button
                type="button"
                onClick={() =>
                  copyToClipboard(
                    `SOLICITUD ALTA CUENTA AD UNALM\nNombre: ${selectedRequest.nombre_completo}\nDNI: ${selectedRequest.dni}\nCondición: ${selectedRequest.condicion}\nEmail: ${selectedRequest.email}\nDependencia: ${selectedRequest.facultad_dependencia}\nCelular: ${selectedRequest.celular}\nAnexo: ${selectedRequest.anexo || 'N/A'}`
                  )
                }
                className="px-3 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center space-x-1.5 transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? '¡Copiado!' : 'Copiar Ficha a Portapapeles'}</span>
              </button>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => handleOpenStatusModal(selectedRequest, 'CREADO')}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 flex items-center space-x-1.5 cursor-pointer shadow-xs transition-colors"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Marcar Creado en AD</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenStatusModal(selectedRequest, 'RECHAZADO')}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold text-rose-700 dark:text-rose-300 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 flex items-center space-x-1.5 cursor-pointer border border-rose-200 dark:border-rose-800 transition-colors"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Rechazar</span>
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal: Cambiar Estado y Registrar Observación */}
      {isStatusModalOpen && selectedRequest && (
        <Modal
          isOpen={isStatusModalOpen}
          onClose={() => setIsStatusModalOpen(false)}
          title={`Actualizar Solicitud #${selectedRequest.id}`}
          maxWidth="md"
        >
          <form onSubmit={handleSubmitStatus} className="space-y-4">
            <div className="text-xs text-slate-600 dark:text-slate-300">
              Usuario: <strong className="text-slate-900 dark:text-white">{selectedRequest.nombre_completo}</strong>
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Nuevo Estado *
              </label>
              <select
                value={targetStatus}
                onChange={(e) => setTargetStatus(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-teal-500"
              >
                <option value="CREADO">✅ CREADO (Cuenta habilitada en Directorio Activo)</option>
                <option value="RECHAZADO">❌ RECHAZADO (Solicitud desestimada / incompleta)</option>
                <option value="PENDIENTE">⏳ PENDIENTE (En revisión por Redes)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Observación o Comentario de Atención
              </label>
              <textarea
                rows={3}
                value={observacion}
                onChange={(e) => setObservacion(e.target.value)}
                placeholder="Ej: Cuenta institucional creada bajo el usuario xxxx@lamolina.edu.pe y comunicada por correo..."
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={() => setIsStatusModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={submittingStatus}
                className="px-5 py-2 rounded-xl text-xs font-black text-white bg-teal-600 hover:bg-teal-700 transition-colors flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
              >
                {submittingStatus ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Guardando...</span>
                  </>
                ) : (
                  <span>Guardar Estado</span>
                )}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
