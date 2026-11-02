import React, { useState, useEffect, useMemo } from 'react';
import { api, getAssetUrl } from '../services/api';
import { Ticket, TicketStatus, Technician, ServiceCategory, TicketComplejidad } from '../types';
import { StatusBadge, PriorityBadge, UrgencyBadge, ComplexityBadge } from '../components/Badge';
import { Drawer } from '../components/Drawer';
import { TechnicianProfileModal } from '../components/TechnicianProfileModal';
import { ServiceRequestModal } from '../components/ServiceRequestModal';
import { WorkOrderModal } from '../components/WorkOrderModal';
import { SGFieldTimelineTracker } from '../components/SGFieldTimelineTracker';
import { SearchableTechnicianSelect } from '../components/SearchableTechnicianSelect';
import { WhatsAppButton } from '../components/WhatsAppButton';
import { useAuth } from '../context/AuthContext';
import { TableSkeleton } from '../components/Skeleton';

import { Modal } from '../components/Modal';

import {
  Filter,
  Search,
  UserCheck,
  User,
  Phone,
  Clock,
  Send,
  AlertTriangle,
  RefreshCw,
  Eye,
  Lock,
  Layers,
  ArrowRightLeft,
  RotateCcw,
  CheckCircle2,
  Inbox,
  UserPlus,
  Zap,
  ShieldAlert,
  FileText,
  Wrench,
  Package,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  Paperclip,
  MessageSquare,
  X,
  Users,
  Upload,
  CheckCircle,
  Building2,
  Laptop,
} from 'lucide-react';
import { EquipmentHistoryModal } from '../components/EquipmentHistoryModal';

interface SpecialistDashboardProps {
  onSelectTicketDetail: (ticketId: number, ticketCode?: string, ticketStatus?: string) => void;
}

export const SpecialistDashboard: React.FC<SpecialistDashboardProps> = ({ onSelectTicketDetail }) => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEquipmentCode, setSelectedEquipmentCode] = useState<string | null>(null);

  const isSGUser = Boolean(user?.rol && ['MESA_AYUDA_SG', 'TECNICO_SG', 'SUPERVISOR_SG'].includes(user.rol));
  const isMesaAyudaOrAdmin = Boolean(user?.rol && ['MESA_AYUDA', 'MESA_AYUDA_SG', 'ADMIN', 'SUPERVISOR', 'SUPERVISOR_SG'].includes(user.rol));
  const isTechnicianOnly = Boolean(user?.rol && ['TECNICO', 'ESPECIALISTA_REDES', 'ESPECIALISTA_DESARROLLO', 'TECNICO_SG'].includes(user.rol));

  const userModule = isSGUser
    ? 'SERVICIOS_GENERALES'
    : (user?.rol && ['MESA_AYUDA', 'TECNICO', 'ESPECIALISTA_REDES', 'ESPECIALISTA_DESARROLLO', 'SUPERVISOR'].includes(user.rol) ? 'OTIC' : undefined);

  // Queue Tabs: 'ALL', 'REPORTADO', 'ASIGNADO', 'RESUELTO', 'SIGI_PREVENTIVA'
  const [activeQueueTab, setActiveQueueTab] = useState<string>(isTechnicianOnly ? 'ASIGNADO' : 'REPORTADO');

  // Search & Filter
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [filterTechnician, setFilterTechnician] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Drawer Triage & Actions
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [drawerAction, setDrawerAction] = useState<'assign' | 'status' | 'derive' | 'reopen'>('assign');

  // Form states in Drawer
  const [targetTechId, setTargetTechId] = useState<number | ''>('');
  const [targetComplexity, setTargetComplexity] = useState<TicketComplejidad>('BAJA');
  const [additionalTechIds, setAdditionalTechIds] = useState<number[]>([]);
  const [resolucionArchivo, setResolucionArchivo] = useState<File | null>(null);
  const [targetStatus, setTargetStatus] = useState<TicketStatus>('ASIGNADO');
  const [solucionDetalle, setSolucionDetalle] = useState<string>('');
  const [materialesUsadosDrawer, setMaterialesUsadosDrawer] = useState<string>('');
  const [materialesSobrantesDrawer, setMaterialesSobrantesDrawer] = useState<string>('');
  const [targetCategoryId, setTargetCategoryId] = useState<number | ''>('');
  const [motivoDerivacion, setMotivoDerivacion] = useState<string>('');
  const [motivoReapertura, setMotivoReapertura] = useState<string>('');
  const [submittingAction, setSubmittingAction] = useState<boolean>(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [selectedTechProfileId, setSelectedTechProfileId] = useState<number | null>(null);

  // Observar Ticket Modal State
  const [isObserveModalOpen, setIsObserveModalOpen] = useState<boolean>(false);
  const [observingTicket, setObservingTicket] = useState<Ticket | null>(null);
  const [observacionJustificacion, setObservacionJustificacion] = useState<string>('');
  const [observacionFoto, setObservacionFoto] = useState<File | null>(null);
  const [observacionFotoPreview, setObservacionFotoPreview] = useState<string | null>(null);
  const [submittingObservacion, setSubmittingObservacion] = useState<boolean>(false);
  const [observacionError, setObservacionError] = useState<string | null>(null);

  // Formato Días / Horas sin atender para ASIGNADOS
  const formatSinAtender = (fechaApertura: string | Date) => {
    const ms = Date.now() - new Date(fechaApertura).getTime();
    if (isNaN(ms) || ms < 0) return '0h 0m';
    const totalMinutes = Math.floor(ms / (1000 * 60));
    const totalHours = Math.floor(totalMinutes / 60);
    const days = Math.floor(totalHours / 24);
    const hours = totalHours % 24;
    const minutes = totalMinutes % 60;
    if (days > 0) {
      return `${days}d ${hours}h`;
    }
    return `${hours}h ${minutes}m`;
  };

  // Official SG Documents Modal States
  const [sgServiceRequestTicket, setSgServiceRequestTicket] = useState<Ticket | null>(null);
  const [sgWorkOrderTicket, setSgWorkOrderTicket] = useState<Ticket | null>(null);

  // Sorting state for ticket table
  type SortField = 'codigo' | 'titulo' | 'categoria' | 'urgencia' | 'estado' | 'tecnico' | 'fecha' | null;
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Overall counts for badges
  const [counts, setCounts] = useState<{
    reportados: number;
    observados: number;
    asignados: number;
    resueltos: number;
    sigiPreventiva: number;
    total: number;
  }>({
    reportados: 0,
    observados: 0,
    asignados: 0,
    resueltos: 0,
    sigiPreventiva: 0,
    total: 0,
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {};

      if (activeQueueTab === 'SIGI_PREVENTIVA') {
        params.canal_origen = 'INSPECCION_SIGI';
        params.estado = 'REPORTADO';
      } else if (activeQueueTab === 'REPORTADO') {
        params.estado = 'REPORTADO';
        params.excluir_canal_origen = 'INSPECCION_SIGI';
      } else if (activeQueueTab === 'OBSERVADO') {
        params.estado = 'OBSERVADO';
      } else if (activeQueueTab !== 'ALL') {
        params.estado = activeQueueTab;
      }

      if (filterCategory) params.categoriaId = filterCategory;
      // En colas de no asignados los tickets no tienen técnico asignado
      if (filterTechnician && activeQueueTab !== 'REPORTADO' && activeQueueTab !== 'OBSERVADO' && activeQueueTab !== 'SIGI_PREVENTIVA') {
        params.tecnicoId = filterTechnician;
      }
      if (searchQuery) params.search = searchQuery;

      const [tickRes, techRes, catRes, allTicketsRes] = await Promise.all([
        api.getTickets(params),
        api.getTechnicians(userModule ? { modulo: userModule } : undefined),
        api.getCategories(userModule ? { modulo: userModule } : undefined),
        api.getTickets(), // Para calcular los contadores globales de las pestañas
      ]);

      if (tickRes.success) setTickets(tickRes.data);
      if (techRes.success) setTechnicians(techRes.data);
      if (catRes.success) setCategories(catRes.data);
      if (allTicketsRes.success) {
        const allList: Ticket[] = allTicketsRes.data || [];
        setCounts({
          reportados: allList.filter((t) => t.estado === 'REPORTADO' && t.canal_origen !== 'INSPECCION_SIGI').length,
          observados: allList.filter((t) => t.estado === 'OBSERVADO').length,
          sigiPreventiva: allList.filter((t) => t.canal_origen === 'INSPECCION_SIGI' && t.estado === 'REPORTADO').length,
          asignados: allList.filter((t) => t.estado === 'ASIGNADO').length,
          resueltos: allList.filter((t) => t.estado === 'RESUELTO').length,
          total: allList.length,
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeQueueTab, filterCategory, filterTechnician]);

  // Tickets sorted according to column clicks
  const sortedTickets = useMemo(() => {
    if (!sortField) return tickets;

    const urgencyWeights: Record<string, number> = {
      BAJA: 1,
      MEDIA: 2,
      ALTA: 3,
      CRITICA: 4,
    };

    return [...tickets].sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'codigo':
          comparison = a.codigo_correlativo.localeCompare(b.codigo_correlativo);
          break;
        case 'titulo': {
          const textA = `${a.titulo} ${a.solicitante_nombre || ''}`;
          const textB = `${b.titulo} ${b.solicitante_nombre || ''}`;
          comparison = textA.localeCompare(textB);
          break;
        }
        case 'categoria':
          comparison = (a.categoria_nombre || '').localeCompare(b.categoria_nombre || '');
          break;
        case 'urgencia':
          comparison = (urgencyWeights[a.urgencia] || 0) - (urgencyWeights[b.urgencia] || 0);
          break;
        case 'estado':
          comparison = a.estado.localeCompare(b.estado);
          break;
        case 'tecnico':
          comparison = (a.tecnico_nombre || '').localeCompare(b.tecnico_nombre || '');
          break;
        case 'fecha': {
          const dateA = new Date(a.fecha_apertura).getTime();
          const dateB = new Date(b.fecha_apertura).getTime();
          comparison = dateA - dateB;
          break;
        }
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [tickets, sortField, sortDirection]);


  const handleOpenDrawer = (ticket: Ticket, defaultAction: 'assign' | 'status' | 'derive' | 'reopen' = 'assign') => {
    setSelectedTicket(ticket);
    setDrawerAction(defaultAction);
    setTargetTechId(ticket.tecnico_id || '');
    setTargetComplexity(ticket.complejidad || 'BAJA');
    setAdditionalTechIds(
      ticket.tecnicos_adicionales && ticket.tecnicos_adicionales.length > 0
        ? ticket.tecnicos_adicionales.map((t) => t.id)
        : []
    );
    setResolucionArchivo(null);
    if (defaultAction === 'status' && isTechnicianOnly) {
      setTargetStatus('RESUELTO');
    } else {
      setTargetStatus(ticket.estado);
    }
    setSolucionDetalle(ticket.solucion_detalle || '');
    setMaterialesUsadosDrawer(ticket.materiales_usados || '');
    setMaterialesSobrantesDrawer(ticket.materiales_sobrantes || '');
    setTargetCategoryId(ticket.categoria_id);
    setMotivoDerivacion('');
    setMotivoReapertura('');
    setActionError(null);
    setIsDrawerOpen(true);
  };

  const handleAssignTechnician = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !targetTechId) return;

    setSubmittingAction(true);
    setActionError(null);
    try {
      const additionalToAssign =
        selectedTicket.modulo === 'OTIC' && targetComplexity === 'COMPLEJA'
          ? additionalTechIds
          : [];
      const res = await api.assignTechnician(
        selectedTicket.id,
        Number(targetTechId),
        targetComplexity,
        additionalToAssign
      );
      if (res.success) {
        setIsDrawerOpen(false);
        await loadData();
      }
    } catch (err: any) {
      setActionError(err.message || 'Error al asignar especialista');
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket) return;

    // Si es técnico resolviendo, el estado final siempre es RESUELTO
    const finalStatus: TicketStatus = isTechnicianOnly ? 'RESUELTO' : (targetStatus || selectedTicket.estado);

    setSubmittingAction(true);
    setActionError(null);
    try {
      const res = await api.updateStatus(
        selectedTicket.id,
        finalStatus,
        solucionDetalle,
        undefined,
        materialesUsadosDrawer,
        materialesSobrantesDrawer,
        resolucionArchivo
      );
      if (res.success) {
        setIsDrawerOpen(false);
        setResolucionArchivo(null);
        await loadData();
      }
    } catch (err: any) {
      setActionError(err.message || 'Error al actualizar estado');
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleDeriveTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !targetTechId) return;

    setSubmittingAction(true);
    setActionError(null);
    try {
      const res = await api.deriveTicket(
        selectedTicket.id,
        Number(targetTechId),
        targetCategoryId ? Number(targetCategoryId) : undefined,
        targetComplexity,
        motivoDerivacion
      );
      if (res.success) {
        setIsDrawerOpen(false);
        await loadData();
      }
    } catch (err: any) {
      setActionError(err.message || 'Error al derivar ticket');
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleReopenTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket) return;

    setSubmittingAction(true);
    setActionError(null);
    try {
      const res = await api.reopenTicket(selectedTicket.id, motivoReapertura);
      if (res.success) {
        setIsDrawerOpen(false);
        await loadData();
      }
    } catch (err: any) {
      setActionError(err.message || 'Error al reabrir ticket');
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleConfirmObservacion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!observingTicket || !observacionJustificacion.trim()) return;

    setSubmittingObservacion(true);
    setObservacionError(null);
    try {
      const formData = new FormData();
      formData.append('justificacion', observacionJustificacion.trim());
      if (observacionFoto) {
        formData.append('file', observacionFoto);
      }

      const res = await api.observeTicket(observingTicket.id, formData);
      if (res.success) {
        setIsObserveModalOpen(false);
        setObservingTicket(null);
        setObservacionJustificacion('');
        setObservacionFoto(null);
        setObservacionFotoPreview(null);
        await loadData();
      }
    } catch (err: any) {
      setObservacionError(err.message || 'Error al observar el ticket');
    } finally {
      setSubmittingObservacion(false);
    }
  };

  const columnCount = useMemo(() => {
    let count = 6; // codigo, titulo, categoria, fecha, urgencia, acciones
    if (activeQueueTab === 'ASIGNADO') count += 1; // dias/horas sin atender
    if (activeQueueTab !== 'REPORTADO') count += 1; // estado
    if (!isTechnicianOnly && activeQueueTab !== 'REPORTADO') count += 1; // tecnico
    return count;
  }, [activeQueueTab, isTechnicianOnly]);

  const pendingCount = tickets.filter((t) => t.estado === 'REPORTADO').length;

  const availableTechs = technicians.filter((tec) => {
    if (!selectedTicket?.modulo) return true;
    if (selectedTicket.modulo === 'SERVICIOS_GENERALES') {
      return tec.rol === 'TECNICO_SG' || tec.rol === 'SUPERVISOR_SG';
    }
    return ['TECNICO', 'ESPECIALISTA_REDES', 'ESPECIALISTA_DESARROLLO', 'SUPERVISOR'].includes(tec.rol);
  });

  const availableCategories = categories.filter((c) => {
    if (!selectedTicket?.modulo) return true;
    return c.modulo === selectedTicket.modulo;
  });

  return (
    <div className="space-y-6 max-w-[1700px] w-full mx-auto px-4 sm:px-6 py-6 animate-in fade-in duration-300">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-6 sm:p-7 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center space-x-2 text-unalm-600 dark:text-emerald-400 font-bold text-xs uppercase tracking-wider mb-1">
            <Zap className="w-4 h-4" />
            <span>
              {user?.rol === 'MESA_AYUDA_SG'
                ? 'Mesa de Ayuda Servicios Generales e Infraestructura'
                : user?.rol === 'MESA_AYUDA'
                  ? 'Mesa de Ayuda OTIC & Triage'
                  : isSGUser
                    ? 'Bandeja de Especialista - Servicios Generales (ROF 2023)'
                    : isMesaAyudaOrAdmin
                      ? 'Mesa de Ayuda & Triage OTIC'
                      : 'Bandeja Personal de Especialista OTIC'}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            {isMesaAyudaOrAdmin
              ? `Cola de Requerimientos & Asignación (${isSGUser ? 'Servicios Generales' : 'OTIC'})`
              : `Mis Tickets Asignados (${user?.nombres})`}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {isMesaAyudaOrAdmin
              ? 'Gestión de colas REPORTADO, asignación de especialistas y seguimiento de SLAs.'
              : 'Atención directa de los tickets asignados a su persona.'}
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={loadData}
            className="p-2.5 bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl text-slate-600 dark:text-slate-300 transition-all border border-slate-200 dark:border-slate-700 shadow-2xs cursor-pointer active:scale-95"
            title="Refrescar lista"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-unalm-600 dark:text-emerald-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Queue Tabs Bar - Rejilla responsiva en móviles (sin scroll horizontal) y fila flex en desktop */}
      <div className="grid grid-cols-2 md:flex md:items-center md:space-x-2 gap-2 md:gap-0 pb-1">
        {isMesaAyudaOrAdmin && (
          <button
            onClick={() => setActiveQueueTab('REPORTADO')}
            className={`w-full md:w-auto px-3 sm:px-4 py-2.5 md:py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-between md:justify-start space-x-2 shrink-0 ${activeQueueTab === 'REPORTADO'
              ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold ring-1 ring-amber-400'
              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
              }`}
          >
            <div className="flex items-center space-x-2 min-w-0">
              <Inbox className="w-4 h-4 shrink-0 text-amber-950 dark:text-amber-400" />
              <span className="truncate">Reportados <span className="hidden sm:inline">(sin asignar)</span></span>
            </div>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-black shrink-0 ${activeQueueTab === 'REPORTADO'
                ? 'bg-slate-950 text-amber-400'
                : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                }`}
            >
              {counts.reportados}
            </span>
          </button>
        )}

        {/* Pestaña OBSERVADOS */}
        {isMesaAyudaOrAdmin && (
          <button
            onClick={() => setActiveQueueTab('OBSERVADO')}
            className={`w-full md:w-auto px-3 sm:px-4 py-2.5 md:py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-between md:justify-start space-x-2 shrink-0 ${activeQueueTab === 'OBSERVADO'
              ? 'bg-amber-600 text-white shadow-md font-extrabold ring-1 ring-amber-400'
              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
              }`}
          >
            <div className="flex items-center space-x-2 min-w-0">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="truncate">OBSERVADOS</span>
            </div>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-black shrink-0 ${activeQueueTab === 'OBSERVADO'
                ? 'bg-white text-amber-900'
                : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                }`}
            >
              {counts.observados}
            </span>
          </button>
        )}

        {/* Pestaña Exclusiva: Reportes desde Inspecciones Preventivas SIGI (Solo SG) */}
        {(isSGUser || user?.rol === 'MESA_AYUDA_SG') && (
          <button
            onClick={() => setActiveQueueTab('SIGI_PREVENTIVA')}
            className={`w-full md:w-auto px-3 sm:px-4 py-2.5 md:py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-between md:justify-start space-x-2 shrink-0 ${activeQueueTab === 'SIGI_PREVENTIVA'
              ? 'bg-rose-600 text-white shadow-md font-black ring-1 ring-rose-400'
              : 'bg-white dark:bg-slate-900 text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50'
              }`}
          >
            <div className="flex items-center space-x-2 min-w-0">
              <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0" />
              <span className="truncate">SIGI Preventiva</span>
            </div>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-black shrink-0 ${activeQueueTab === 'SIGI_PREVENTIVA'
                ? 'bg-white text-rose-950 font-black'
                : 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300'
                }`}
            >
              {counts.sigiPreventiva}
            </span>
          </button>
        )}

        <button
          onClick={() => setActiveQueueTab('ASIGNADO')}
          className={`w-full md:w-auto px-3 sm:px-4 py-2.5 md:py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-between md:justify-start space-x-2 shrink-0 ${activeQueueTab === 'ASIGNADO'
            ? 'bg-blue-600 text-white shadow-md font-extrabold ring-1 ring-blue-400'
            : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
            }`}
        >
          <div className="flex items-center space-x-2 min-w-0">
            <UserCheck className="w-4 h-4 shrink-0 text-blue-400" />
            <span className="truncate">
              {isTechnicianOnly ? 'Mis Tickets' : 'ASIGNADOS'}
              <span className="hidden sm:inline"> {isTechnicianOnly ? 'en Atención' : '(En Atención)'}</span>
            </span>
          </div>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-black shrink-0 ${activeQueueTab === 'ASIGNADO'
              ? 'bg-white text-blue-800'
              : 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300'
              }`}
          >
            {counts.asignados}
          </span>
        </button>

        <button
          onClick={() => setActiveQueueTab('RESUELTO')}
          className={`w-full md:w-auto px-3 sm:px-4 py-2.5 md:py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-between md:justify-start space-x-2 shrink-0 ${activeQueueTab === 'RESUELTO'
            ? 'bg-emerald-600 text-white shadow-md font-extrabold ring-1 ring-emerald-400'
            : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
            }`}
        >
          <div className="flex items-center space-x-2 min-w-0">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span className="truncate">RESUELTOS <span className="hidden sm:inline">(Solucionados)</span></span>
          </div>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-black shrink-0 ${activeQueueTab === 'RESUELTO'
              ? 'bg-white text-emerald-800'
              : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
              }`}
          >
            {counts.resueltos}
          </span>
        </button>

        <button
          onClick={() => setActiveQueueTab('ALL')}
          className={`w-full md:w-auto px-3 sm:px-4 py-2.5 md:py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-between md:justify-start space-x-2 shrink-0 ${
            !isSGUser && user?.rol !== 'MESA_AYUDA_SG' ? 'col-span-2 md:col-span-1' : ''
          } ${activeQueueTab === 'ALL'
            ? 'bg-slate-800 text-white shadow-md font-extrabold ring-1 ring-slate-700'
            : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
            }`}
        >
          <div className="flex items-center space-x-2 min-w-0">
            <Layers className="w-4 h-4 shrink-0 text-slate-400" />
            <span className="truncate">Todos los Tickets</span>
          </div>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-black shrink-0 ${activeQueueTab === 'ALL'
              ? 'bg-white text-slate-900'
              : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}
          >
            {counts.total}
          </span>
        </button>
      </div>

      {/* Filter Control Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && loadData()}
            placeholder="Buscar por código, título, solicitante..."
            className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-unalm-500 focus:outline-none"
          />
        </div>

        {/* Filter Category */}
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white text-slate-700 font-medium"
        >
          <option value="">Todas las Especialidades</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id.toString()}>
              {c.nombre}
            </option>
          ))}
        </select>

        {/* Filter Technician (For Mesa de Ayuda / Admin) */}
        {isMesaAyudaOrAdmin ? (
          <select
            value={filterTechnician}
            onChange={(e) => setFilterTechnician(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white text-slate-700 font-medium"
          >
            <option value="">Todos los Especialistas</option>
            {technicians.map((t) => (
              <option key={t.id} value={t.id.toString()}>
                {t.nombres} {t.apellidos}
              </option>
            ))}
          </select>
        ) : (
          <div className="flex items-center px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 font-semibold">
            <UserCheck className="w-4 h-4 text-unalm-600 mr-2" />
            <span>Filtrado a mis asignados</span>
          </div>
        )}

        <button
          onClick={loadData}
          className="w-full py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold transition-colors"
        >
          Aplicar Filtros
        </button>
      </div>

      {/* Ticket Table / Cards Container */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xs overflow-hidden">
        {/* Vista en Tabla para Computadoras / Pantallas Medianas y Grandes */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[980px]">
            <thead>
              <tr className="bg-slate-100/80 text-slate-700 font-bold border-b border-slate-200 select-none">
                <th
                  onClick={() => handleSort('codigo')}
                  className="py-3.5 px-4 w-[13%] cursor-pointer hover:bg-slate-200/60 transition-colors"
                  title="Ordenar por Código"
                >
                  <div className="flex items-center space-x-1">
                    <span>CÓDIGO</span>
                    {sortField === 'codigo' ? (
                      sortDirection === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-unalm-600" /> : <ArrowDown className="w-3.5 h-3.5 text-unalm-600" />
                    ) : (
                      <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 opacity-60" />
                    )}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('titulo')}
                  className="py-3.5 px-4 w-[28%] cursor-pointer hover:bg-slate-200/60 transition-colors"
                  title="Ordenar por Título & Solicitante"
                >
                  <div className="flex items-center space-x-1">
                    <span>TÍTULO & SOLICITANTE</span>
                    {sortField === 'titulo' ? (
                      sortDirection === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-unalm-600" /> : <ArrowDown className="w-3.5 h-3.5 text-unalm-600" />
                    ) : (
                      <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 opacity-60" />
                    )}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('categoria')}
                  className="py-3.5 px-4 w-[17%] cursor-pointer hover:bg-slate-200/60 transition-colors"
                  title="Ordenar por Servicio / Área"
                >
                  <div className="flex items-center space-x-1">
                    <span>SERVICIO / ÁREA</span>
                    {sortField === 'categoria' ? (
                      sortDirection === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-unalm-600" /> : <ArrowDown className="w-3.5 h-3.5 text-unalm-600" />
                    ) : (
                      <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 opacity-60" />
                    )}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('fecha')}
                  className="py-3.5 px-4 w-[11%] cursor-pointer hover:bg-slate-200/60 transition-colors"
                  title="Ordenar por Fecha de Reporte"
                >
                  <div className="flex items-center space-x-1">
                    <span>FECHA</span>
                    {sortField === 'fecha' ? (
                      sortDirection === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-unalm-600" /> : <ArrowDown className="w-3.5 h-3.5 text-unalm-600" />
                    ) : (
                      <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 opacity-60" />
                    )}
                  </div>
                </th>
                {activeQueueTab === 'ASIGNADO' && (
                  <th className="py-3.5 px-4 w-[14%] whitespace-nowrap select-none">
                    <div className="flex items-center space-x-1 text-slate-700">
                      <Clock className="w-3.5 h-3.5 text-amber-600" />
                      <span>DÍAS / HORAS SIN ATENDER</span>
                    </div>
                  </th>
                )}
                <th
                  onClick={() => handleSort('urgencia')}
                  className="py-3.5 px-4 w-[9%] cursor-pointer hover:bg-slate-200/60 transition-colors"
                  title="Ordenar por Urgencia"
                >
                  <div className="flex items-center space-x-1">
                    <span>URGENCIA</span>
                    {sortField === 'urgencia' ? (
                      sortDirection === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-unalm-600" /> : <ArrowDown className="w-3.5 h-3.5 text-unalm-600" />
                    ) : (
                      <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 opacity-60" />
                    )}
                  </div>
                </th>
                {activeQueueTab !== 'REPORTADO' && (
                  <th
                    onClick={() => handleSort('estado')}
                    className="py-3.5 px-4 w-[12%] cursor-pointer hover:bg-slate-200/60 transition-colors"
                    title="Ordenar por Estado"
                  >
                    <div className="flex items-center space-x-1">
                      <span>ESTADO</span>
                      {sortField === 'estado' ? (
                        sortDirection === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-unalm-600" /> : <ArrowDown className="w-3.5 h-3.5 text-unalm-600" />
                      ) : (
                        <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 opacity-60" />
                      )}
                    </div>
                  </th>
                )}
                {!isTechnicianOnly && activeQueueTab !== 'REPORTADO' && (
                  <th
                    onClick={() => handleSort('tecnico')}
                    className="py-3.5 px-4 w-[18%] cursor-pointer hover:bg-slate-200/60 transition-colors"
                    title="Ordenar por Especialista Asignado"
                  >
                    <div className="flex items-center space-x-1">
                      <span>ESPECIALISTA ASIGNADO</span>
                      {sortField === 'tecnico' ? (
                        sortDirection === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-unalm-600" /> : <ArrowDown className="w-3.5 h-3.5 text-unalm-600" />
                      ) : (
                        <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 opacity-60" />
                      )}
                    </div>
                  </th>
                )}
                <th className="py-3.5 px-4 text-right sticky right-0 bg-slate-100/90 backdrop-blur-xs shadow-[-6px_0_10px_-4px_rgba(0,0,0,0.05)]">
                  ACCIONES
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <TableSkeleton rows={6} columns={columnCount} />
              ) : sortedTickets.length === 0 ? (
                <tr>
                  <td colSpan={columnCount} className="py-8 text-center text-slate-400">
                    No se encontraron tickets en esta cola.
                  </td>
                </tr>
              ) : (
                sortedTickets.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="py-3 px-4 font-mono font-bold whitespace-nowrap">
                      <div className="flex flex-col space-y-1">
                        <span className={`px-2 py-0.5 rounded-lg border font-mono ${t.modulo === 'SERVICIOS_GENERALES'
                          ? 'bg-amber-50 text-amber-900 border-amber-200'
                          : 'bg-unalm-50 text-unalm-700 border-unalm-200'
                          }`}>
                          {t.codigo_correlativo}
                        </span>
                        {t.canal_origen === 'INSPECCION_SIGI' && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-black bg-rose-600 text-white shadow-2xs w-fit">
                            🚨 SIGI PREVENTIVA
                          </span>
                        )}
                        {t.numero_inventario && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedEquipmentCode(t.numero_inventario!);
                            }}
                            className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition-colors cursor-pointer w-fit"
                            title="Ver historial de atenciones de este equipo"
                          >
                            <Laptop className="w-3 h-3 text-blue-600" />
                            <span>#{t.numero_inventario}</span>
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 max-w-xs">
                      <p className="font-bold text-slate-900 truncate">{t.titulo}</p>
                      <p className="text-[11px] text-slate-500 truncate">
                        {t.canal_origen === 'INSPECCION_SIGI' ? (
                          <span className="text-amber-800 font-bold">🔍 Reporte de Inspección Preventiva</span>
                        ) : (
                          `${t.solicitante_nombre} (${t.solicitante_dependencia})`
                        )}
                      </p>
                    </td>
                    <td className="py-3 px-4 text-slate-700 whitespace-nowrap">
                      <div className="flex items-center space-x-1.5">
                        <span className="font-medium">{t.categoria_nombre}</span>
                        {t.modulo === 'SERVICIOS_GENERALES' && (
                          <span className="text-[9px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-bold">
                            SG
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-800">
                          {new Date(t.fecha_apertura).toLocaleDateString('es-PE', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                          })}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(t.fecha_apertura).toLocaleTimeString('es-PE', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </td>
                    {activeQueueTab === 'ASIGNADO' && (
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center space-x-1.5 font-mono text-xs">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-amber-50 text-amber-900 border border-amber-300 font-bold shadow-2xs">
                            <Clock className="w-3 h-3 mr-1.5 text-amber-600" />
                            {formatSinAtender(t.fecha_apertura)}
                          </span>
                        </div>
                      </td>
                    )}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <UrgencyBadge urgency={t.urgencia} />
                    </td>
                    {activeQueueTab !== 'REPORTADO' && (
                      <td className="py-3 px-4 whitespace-nowrap">
                        <StatusBadge status={t.estado} />
                      </td>
                    )}
                    {!isTechnicianOnly && activeQueueTab !== 'REPORTADO' && (
                      <td className="py-3 px-4 text-slate-700 whitespace-nowrap">
                        {t.tecnico_nombre ? (
                          <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                            <div
                              className="flex items-center space-x-2 cursor-pointer group/tech"
                              onClick={() => {
                                if (t.tecnico_id) setSelectedTechProfileId(t.tecnico_id);
                              }}
                              title="Clic para ver récord de atenciones y reseñas del especialista principal"
                            >
                              {t.tecnico_foto ? (
                                <img
                                  src={getAssetUrl(t.tecnico_foto)}
                                  alt={t.tecnico_nombre}
                                  className="w-6 h-6 rounded-full object-cover border border-amber-300 shadow-2xs group-hover/tech:ring-2 group-hover/tech:ring-amber-300 transition-all"
                                />
                              ) : (
                                <span className="w-6 h-6 rounded-full bg-unalm-100 text-unalm-700 font-extrabold flex items-center justify-center text-[9px] group-hover/tech:bg-amber-100">
                                  {t.tecnico_nombre.slice(0, 2).toUpperCase()}
                                </span>
                              )}
                              <span className="font-semibold text-slate-800 group-hover/tech:text-unalm-700 transition-colors">
                                {t.tecnico_nombre}
                              </span>
                            </div>
                            {t.tecnicos_adicionales && t.tecnicos_adicionales.length > 0 && (
                              <span
                                className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs cursor-help"
                                title={`Equipo de apoyo técnico: ${t.tecnicos_adicionales.map((a) => a.nombre_completo || `${a.nombres} ${a.apellidos}`).join(', ')}`}
                              >
                                +{t.tecnicos_adicionales.length} apoyo{t.tecnicos_adicionales.length > 1 ? 's' : ''}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-amber-700 font-extrabold bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-300 inline-block animate-pulse">
                            Sin Asignar
                          </span>
                        )}
                      </td>
                    )}

                    <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap sticky right-0 bg-white group-hover:bg-slate-50 transition-colors shadow-[-6px_0_10px_-4px_rgba(0,0,0,0.05)]">
                      {isMesaAyudaOrAdmin && (
                        <>
                          {/* En tickets resueltos: Reabrir Ticket (se retira botón derivar) */}
                          {t.estado === 'RESUELTO' || activeQueueTab === 'RESUELTO' ? (
                            <button
                              onClick={() => handleOpenDrawer(t, 'reopen')}
                              className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg font-bold border border-rose-200 transition-colors cursor-pointer inline-flex items-center space-x-1"
                              title="Reabrir ticket para continuar atención"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>Reabrir Ticket</span>
                            </button>
                          ) : t.estado === 'OBSERVADO' || activeQueueTab === 'OBSERVADO' ? (
                            /* En tickets OBSERVADOS: No permitir asignar hasta que el solicitante responda */
                            <span className="text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-1 rounded-lg">
                              Aclaración pendiente
                            </span>
                          ) : !t.tecnico_id && t.estado !== 'ASIGNADO' ? (
                            /* En tickets REPORTADOS sin asignar: Asignar y botón OBSERVAR */
                            <>
                              <button
                                onClick={() => handleOpenDrawer(t, 'assign')}
                                className="px-2.5 py-1 bg-unalm-50 hover:bg-unalm-100 text-unalm-700 rounded-lg font-bold border border-unalm-200 transition-colors cursor-pointer"
                              >
                                Asignar
                              </button>
                              <button
                                onClick={() => {
                                  setObservingTicket(t);
                                  setObservacionJustificacion('');
                                  setObservacionFoto(null);
                                  setObservacionFotoPreview(null);
                                  setObservacionError(null);
                                  setIsObserveModalOpen(true);
                                }}
                                className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg font-bold border border-amber-300 transition-colors cursor-pointer inline-flex items-center space-x-1"
                                title="Observar requerimiento y solicitar aclaración al solicitante"
                              >
                                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                                <span>Observar</span>
                              </button>
                            </>
                          ) : (
                            /* En tickets asignados en curso: Reasignar / Derivar técnico */
                            <button
                              onClick={() => handleOpenDrawer(t, 'assign')}
                              className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg font-bold border border-purple-200 transition-colors cursor-pointer"
                              title="Reasignar a otro técnico especialista"
                            >
                              Derivar
                            </button>
                          )}
                        </>
                      )}

                      {/* Solo el técnico asignado (principal o apoyo) puede resolver su propio ticket */}
                      {isTechnicianOnly && t.estado !== 'RESUELTO' && (t.tecnico_id === user?.id || (t.tecnicos_adicionales && t.tecnicos_adicionales.some((a) => a.id === user?.id))) && (
                        <button
                          onClick={() => {
                            setTargetStatus('RESUELTO');
                            handleOpenDrawer(t, 'status');
                          }}
                          className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg font-bold border border-emerald-200 transition-colors cursor-pointer"
                        >
                          Resolver
                        </button>
                      )}

                      <button
                        onClick={() => onSelectTicketDetail(t.id, t.codigo_correlativo, t.estado)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold border border-slate-300 transition-colors"
                      >
                        Ver Detalle
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Vista en Tarjetas para Teléfonos Móviles (Full Responsivo y sin scroll horizontal) */}
        <div className="block md:hidden p-3.5 space-y-3 bg-slate-50/60 dark:bg-slate-950/40">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl animate-pulse space-y-3">
                  <div className="flex justify-between">
                    <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded w-24" />
                    <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded w-16" />
                  </div>
                  <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-3/4" />
                  <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : sortedTickets.length === 0 ? (
            <div className="py-12 px-4 text-center text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
              <Inbox className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600" />
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400">No se encontraron tickets en esta cola.</p>
            </div>
          ) : (
            sortedTickets.map((t) => {
              const isSG = t.modulo === 'SERVICIOS_GENERALES';
              return (
                <div
                  key={t.id}
                  className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs space-y-3 transition-all hover:border-slate-300 dark:hover:border-slate-700"
                >
                  {/* Encabezado: Código, Módulo, Urgencia y Estado */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                      <span className={`px-2 py-0.5 rounded-lg border font-mono text-xs font-extrabold ${
                        isSG
                          ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                          : 'bg-unalm-50 dark:bg-unalm-950/40 text-unalm-700 dark:text-emerald-300 border-unalm-200 dark:border-emerald-800'
                      }`}>
                        {t.codigo_correlativo}
                      </span>
                      {t.canal_origen === 'INSPECCION_SIGI' && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-black bg-rose-600 text-white shadow-2xs">
                          🚨 SIGI
                        </span>
                      )}
                      {isSG && (
                        <span className="text-[9px] bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 px-1.5 py-0.5 rounded font-bold">
                          SG
                        </span>
                      )}
                      {t.numero_inventario && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedEquipmentCode(t.numero_inventario!);
                          }}
                          className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                        >
                          <Laptop className="w-3 h-3 text-blue-500" />
                          <span>#{t.numero_inventario}</span>
                        </button>
                      )}
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <UrgencyBadge urgency={t.urgencia} />
                      {activeQueueTab !== 'REPORTADO' && <StatusBadge status={t.estado} />}
                    </div>
                  </div>

                  {/* Título & Servicio */}
                  <div
                    className="space-y-1 cursor-pointer"
                    onClick={() => onSelectTicketDetail(t.id, t.codigo_correlativo, t.estado)}
                  >
                    <h3 className="font-extrabold text-slate-900 dark:text-white text-sm leading-snug line-clamp-2 hover:text-unalm-600 dark:hover:text-emerald-400 transition-colors">
                      {t.titulo}
                    </h3>
                    <div className="flex items-center space-x-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
                      <Layers className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{t.categoria_nombre}</span>
                    </div>
                  </div>

                  {/* Solicitante, Dependencia y Fecha */}
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800/80 space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                    <div className="flex items-center space-x-1.5">
                      <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                        {t.canal_origen === 'INSPECCION_SIGI' ? 'Inspección Preventiva' : t.solicitante_nombre}
                      </span>
                    </div>

                    {t.solicitante_dependencia && t.canal_origen !== 'INSPECCION_SIGI' && (
                      <div className="flex items-center space-x-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                        <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate">{t.solicitante_dependencia}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                      <div className="flex items-center space-x-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>
                          {new Date(t.fecha_apertura).toLocaleDateString('es-PE', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      {activeQueueTab === 'ASIGNADO' && (
                        <span className="inline-flex items-center font-mono font-bold text-[10px] text-amber-700 dark:text-amber-400">
                          {formatSinAtender(t.fecha_apertura)}
                        </span>
                      )}
                    </div>

                    {!isTechnicianOnly && activeQueueTab !== 'REPORTADO' && (
                      <div className="pt-1 text-[11px] flex items-center justify-between">
                        <span className="text-slate-400">Especialista:</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                          {t.tecnico_nombre || 'Sin Asignar'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Barra de Acciones Táctiles */}
                  <div className="flex items-center justify-end gap-2 pt-1 flex-wrap">
                    {(t.contacto_local || t.solicitante_telefono) && (
                      <WhatsAppButton
                        phone={t.contacto_local || t.solicitante_telefono}
                        defaultMessage={`Hola, me comunico de la Mesa de Ayuda UNALM respecto a su ticket ${t.codigo_correlativo}: ${t.titulo}`}
                        compact
                        label="WhatsApp"
                      />
                    )}

                    {isMesaAyudaOrAdmin && (
                      <>
                        {t.estado === 'RESUELTO' || activeQueueTab === 'RESUELTO' ? (
                          <button
                            onClick={() => handleOpenDrawer(t, 'reopen')}
                            className="px-3 py-1.5 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-700 dark:text-rose-300 rounded-xl text-xs font-bold border border-rose-200 dark:border-rose-800 transition-colors cursor-pointer inline-flex items-center space-x-1"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Reabrir</span>
                          </button>
                        ) : t.estado === 'OBSERVADO' || activeQueueTab === 'OBSERVADO' ? (
                          <span className="text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-xl">
                            Observado
                          </span>
                        ) : !t.tecnico_id && t.estado !== 'ASIGNADO' ? (
                          <>
                            <button
                              onClick={() => handleOpenDrawer(t, 'assign')}
                              className="px-3 py-1.5 bg-unalm-50 dark:bg-emerald-950/40 hover:bg-unalm-100 text-unalm-700 dark:text-emerald-300 rounded-xl text-xs font-bold border border-unalm-200 dark:border-emerald-800 transition-colors cursor-pointer"
                            >
                              Asignar
                            </button>
                            <button
                              onClick={() => {
                                setObservingTicket(t);
                                setObservacionJustificacion('');
                                setObservacionFoto(null);
                                setObservacionFotoPreview(null);
                                setObservacionError(null);
                                setIsObserveModalOpen(true);
                              }}
                              className="px-3 py-1.5 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 text-amber-800 dark:text-amber-300 rounded-xl text-xs font-bold border border-amber-300 dark:border-amber-800 transition-colors cursor-pointer inline-flex items-center space-x-1"
                            >
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                              <span>Observar</span>
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => handleOpenDrawer(t, 'assign')}
                            className="px-3 py-1.5 bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-100 text-purple-700 dark:text-purple-300 rounded-xl text-xs font-bold border border-purple-200 dark:border-purple-800 transition-colors cursor-pointer"
                          >
                            Derivar
                          </button>
                        )}
                      </>
                    )}

                    {isTechnicianOnly && t.estado !== 'RESUELTO' && (t.tecnico_id === user?.id || (t.tecnicos_adicionales && t.tecnicos_adicionales.some((a) => a.id === user?.id))) && (
                      <button
                        onClick={() => {
                          setTargetStatus('RESUELTO');
                          handleOpenDrawer(t, 'status');
                        }}
                        className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs font-bold border border-emerald-200 dark:border-emerald-800 transition-colors cursor-pointer inline-flex items-center space-x-1"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Resolver</span>
                      </button>
                    )}

                    <button
                      onClick={() => onSelectTicketDetail(t.id)}
                      className="px-3.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-white rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-700 transition-colors flex items-center space-x-1 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Ver Detalle</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Drawer Side Panel Triage & Actions */}
      {selectedTicket && (
        <Drawer
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          title={`Gestión de Ticket: ${selectedTicket.codigo_correlativo}`}
          subtitle={`${selectedTicket.modulo === 'SERVICIOS_GENERALES' ? '🏗️ Servicios Generales' : '💻 OTIC'} — ${selectedTicket.titulo}`}
        >
          <div className="space-y-4">
            {/* Tarjeta de Contacto Rápido del Solicitante & WhatsApp */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-700 flex items-center space-x-1.5">
                  <User className="w-3.5 h-3.5 text-unalm-600" />
                  <span>Contacto del Solicitante</span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setIsDrawerOpen(false);
                    onSelectTicketDetail(selectedTicket.id, selectedTicket.codigo_correlativo, selectedTicket.estado);
                  }}
                  className="text-[11px] font-bold text-unalm-700 hover:text-unalm-900 flex items-center space-x-1 cursor-pointer bg-white px-2 py-0.5 rounded-lg border border-slate-200 shadow-2xs hover:bg-slate-50 transition-colors"
                >
                  <Eye className="w-3 h-3 text-unalm-600" />
                  <span>Ver Detalle Completo</span>
                </button>
              </div>

              <div className="text-xs space-y-1.5 pt-1 border-t border-slate-200/60">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Solicitante:</span>
                  <span className="font-bold text-slate-900">{selectedTicket.solicitante_nombre}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Dependencia:</span>
                  <span className="font-semibold text-slate-800 text-[11px] truncate max-w-[200px]">
                    {selectedTicket.ubicacion_oficina || selectedTicket.solicitante_dependencia || 'Campus Universitario UNALM'}
                  </span>
                </div>

                {selectedTicket.solicitante_telefono && (
                  <div className="flex items-center justify-between gap-2 pt-0.5">
                    <span className="text-slate-500 font-medium">Celular Solicitante:</span>
                    <div className="flex items-center space-x-1.5">
                      <span className="font-bold text-slate-900">{selectedTicket.solicitante_telefono}</span>
                      <WhatsAppButton
                        phone={selectedTicket.solicitante_telefono}
                        label="WhatsApp"
                        defaultMessage={`Hola ${selectedTicket.solicitante_nombre}, le escribimos de la Mesa de Ayuda UNALM respecto a su ticket ${selectedTicket.codigo_correlativo}: "${selectedTicket.titulo}".`}
                      />
                    </div>
                  </div>
                )}

                {selectedTicket.contacto_local && (
                  <div className="flex items-center justify-between gap-2 pt-0.5">
                    <span className="text-slate-500 font-medium">Ref. Contacto:</span>
                    <div className="flex items-center space-x-1.5">
                      <span className="font-bold text-slate-900">{selectedTicket.contacto_local}</span>
                      <WhatsAppButton
                        phone={selectedTicket.contacto_local}
                        label="WhatsApp"
                        defaultMessage={`Hola, le escribimos de la Mesa de Ayuda UNALM respecto al requerimiento ${selectedTicket.codigo_correlativo}: "${selectedTicket.titulo}".`}
                      />
                    </div>
                  </div>
                )}

                {selectedTicket.horario_acceso && (
                  <div className="flex items-center justify-between pt-0.5">
                    <span className="text-slate-500 font-medium">Horario Atención:</span>
                    <span className="font-bold text-amber-900 flex items-center space-x-1 text-[11px]">
                      <Clock className="w-3 h-3 text-amber-600" />
                      <span>{selectedTicket.horario_acceso}</span>
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Action Selector Tabs (Ocultar pestañas no permitidas) */}
            {!isTechnicianOnly && (
              <div className="flex items-center space-x-1.5 border-b border-slate-200 pb-2">
                {isMesaAyudaOrAdmin && (
                  <>
                    {/* Asignar / Reasignar Especialista: Solo disponible si NO está en OBSERVADO */}
                    {selectedTicket.estado !== 'OBSERVADO' && (
                      <button
                        onClick={() => setDrawerAction('assign')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${drawerAction === 'assign'
                          ? 'bg-unalm-600 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                      >
                        {selectedTicket.estado === 'ASIGNADO' ? 'Reasignar Especialista' : 'Asignar Especialista'}
                      </button>
                    )}

                    {/* Quitar 'Derivar Ticket' desde ASIGNADOS y OBSERVADOS según requerimiento */}
                    {selectedTicket.estado !== 'ASIGNADO' && selectedTicket.estado !== 'OBSERVADO' && (
                      <button
                        onClick={() => setDrawerAction('derive')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${drawerAction === 'derive'
                          ? 'bg-purple-600 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                      >
                        Derivar Ticket
                      </button>
                    )}
                  </>
                )}

                {/* Quitar 'Cambiar Estado' desde ASIGNADOS y OBSERVADOS según requerimiento */}
                {selectedTicket.estado !== 'ASIGNADO' && selectedTicket.estado !== 'OBSERVADO' && (
                  <button
                    onClick={() => setDrawerAction('status')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${drawerAction === 'status'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                  >
                    Cambiar Estado
                  </button>
                )}

                {isMesaAyudaOrAdmin && selectedTicket.estado === 'RESUELTO' && (
                  <button
                    onClick={() => setDrawerAction('reopen')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${drawerAction === 'reopen'
                      ? 'bg-amber-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                  >
                    Reabrir Ticket
                  </button>
                )}
              </div>
            )}

            {/* Documentos Oficiales de Servicios Generales en Drawer */}
            {selectedTicket.modulo === 'SERVICIOS_GENERALES' && (
              <div className="space-y-3">
                <SGFieldTimelineTracker
                  status={selectedTicket.estado}
                  fechaApertura={selectedTicket.fecha_apertura}
                  fechaPrimeraRespuesta={selectedTicket.fecha_primera_respuesta}
                  fechaResolucion={selectedTicket.fecha_resolucion}
                  tecnicoNombre={selectedTicket.tecnico_nombre}
                  contactoLocal={selectedTicket.contacto_local}
                  ubicacionOficina={selectedTicket.ubicacion_oficina}
                  materialesUsados={selectedTicket.materiales_usados}
                />

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                    Formatos Oficiales de Servicios Generales
                  </span>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => setSgServiceRequestTicket(selectedTicket)}
                      className="flex-1 px-3 py-1.5 bg-white hover:bg-emerald-50 text-emerald-800 border border-slate-200 hover:border-emerald-400 rounded-lg text-xs font-bold flex items-center justify-center space-x-1.5 transition-colors cursor-pointer shadow-2xs"
                    >
                      <FileText className="w-3.5 h-3.5 text-emerald-600" />
                      <span>📄 Solicitud Área Usuaria</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSgWorkOrderTicket(selectedTicket)}
                      className="flex-1 px-3 py-1.5 bg-white hover:bg-amber-50 text-amber-900 border border-slate-200 hover:border-amber-400 rounded-lg text-xs font-bold flex items-center justify-center space-x-1.5 transition-colors cursor-pointer shadow-2xs"
                    >
                      <Wrench className="w-3.5 h-3.5 text-amber-600" />
                      <span>📋 Orden de Trabajo SG</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {actionError && (
              <p className="text-xs text-rose-600 bg-rose-50 p-2.5 rounded-xl border border-rose-200 font-semibold">
                {actionError}
              </p>
            )}

            {/* ACTION 1: ASIGNAR TÉCNICO & COMPLEJIDAD (Mesa de Ayuda) */}
            {drawerAction === 'assign' && (
              <form onSubmit={handleAssignTechnician} className="space-y-4 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="space-y-1">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Designación de Técnico & Nivel de Complejidad
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Seleccione el técnico asignado y el nivel de dificultad técnica del requerimiento.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {selectedTicket?.modulo === 'OTIC' && targetComplexity === 'COMPLEJA'
                      ? 'Técnico Especialista Principal / Responsable (*)'
                      : 'Seleccionar Técnico Especialista (*)'}
                  </label>
                  <SearchableTechnicianSelect
                    technicians={availableTechs as any}
                    selectedTechId={targetTechId}
                    onSelect={(id) => {
                      setTargetTechId(id);
                      if (id) {
                        setAdditionalTechIds((prev) => prev.filter((aid) => aid !== id));
                      }
                    }}
                    placeholder="Buscar especialista por nombre, taller, cargo o DNI..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nivel de Complejidad Técnica (*)
                  </label>
                  <select
                    value={targetComplexity}
                    onChange={(e) => {
                      const newComp = e.target.value as TicketComplejidad;
                      setTargetComplexity(newComp);
                      if (newComp !== 'COMPLEJA') {
                        setAdditionalTechIds([]);
                      }
                    }}
                    className="w-full p-2.5 border border-slate-300 rounded-xl text-xs bg-white font-bold text-slate-800"
                  >
                    <option value="BAJA">Baja — Estándar</option>
                    <option value="MEDIA">Media — Mayor Dificultad</option>
                    <option value="ALTA">Alta — Complejo</option>
                    <option value="COMPLEJA">Crítica / Muy Compleja — Especializada</option>
                  </select>
                </div>

                {/* ASIGNACIÓN MÚLTIPLE DE TÉCNICOS: SOLO MESA DE AYUDA OTIC (NO SERVICIOS GENERALES) Y COMPLEJIDAD CRÍTICA */}
                {selectedTicket?.modulo === 'OTIC' && targetComplexity === 'COMPLEJA' && (
                  <div className="p-3.5 bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-300 rounded-2xl space-y-2.5 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-amber-950 flex items-center space-x-1.5">
                        <Users className="w-4 h-4 text-amber-700" />
                        <span>Designar Técnicos de Apoyo / Colaboradores</span>
                      </label>
                      <span className="text-[10px] uppercase font-extrabold bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full border border-amber-300">
                        Equipo Multidisciplinario
                      </span>
                    </div>
                    <p className="text-[11px] text-amber-800 leading-tight">
                      Por ser un caso de complejidad <strong>Crítica / Muy Compleja</strong> en OTIC, puede designar más técnicos para la atención técnica conjunta.
                    </p>

                    {/* Chips de técnicos de apoyo seleccionados */}
                    {additionalTechIds.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {additionalTechIds.map((techId) => {
                          const tec = technicians.find((t) => t.id === techId);
                          if (!tec) return null;
                          return (
                            <span
                              key={techId}
                              className="inline-flex items-center space-x-1.5 px-2.5 py-1 bg-white border border-amber-300 text-slate-800 rounded-xl text-xs font-semibold shadow-2xs"
                            >
                              <span>{tec.nombres} {tec.apellidos}</span>
                              <button
                                type="button"
                                onClick={() => setAdditionalTechIds((prev) => prev.filter((id) => id !== techId))}
                                className="text-slate-400 hover:text-rose-600 font-bold ml-1 cursor-pointer"
                                title="Quitar técnico colaborador"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </span>
                          );
                        })}
                      </div>
                    )}

                    {/* Selector para añadir un nuevo técnico de apoyo */}
                    {availableTechs.filter((t) => t.id !== targetTechId && !additionalTechIds.includes(t.id)).length > 0 && (
                      <div>
                        <select
                          value=""
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            if (val && !additionalTechIds.includes(val)) {
                              setAdditionalTechIds((prev) => [...prev, val]);
                            }
                          }}
                          className="w-full p-2 border border-amber-300 rounded-xl text-xs bg-white text-slate-700 font-medium cursor-pointer"
                        >
                          <option value="">+ Agregar especialista técnico al equipo...</option>
                          {availableTechs
                            .filter((t) => t.id !== targetTechId && !additionalTechIds.includes(t.id))
                            .map((t) => (
                              <option key={t.id} value={t.id}>
                                {t.nombres} {t.apellidos} {t.especialidad ? `— ${t.especialidad}` : ''}
                              </option>
                            ))}
                        </select>
                      </div>
                    )}
                  </div>
                )}

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={submittingAction || !targetTechId}
                    className="w-full py-2.5 bg-unalm-600 hover:bg-unalm-700 text-white rounded-xl text-xs font-bold shadow-md transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {submittingAction ? 'Asignando...' : 'Asignar Técnico y Pasar a [ASIGNADO]'}
                  </button>
                </div>
              </form>
            )}

            {/* ACTION 2: DERIVAR TICKET (Mesa de Ayuda) */}
            {drawerAction === 'derive' && (
              <form onSubmit={handleDeriveTicket} className="space-y-4 p-4 bg-purple-50/50 rounded-2xl border border-purple-200">
                <div className="space-y-1">
                  <h3 className="text-xs font-bold text-purple-900 uppercase tracking-wider flex items-center space-x-1.5">
                    <ArrowRightLeft className="w-4 h-4 text-purple-600" />
                    <span>Derivar Ticket a Otro Especialista</span>
                  </h3>
                  <p className="text-[11px] text-purple-700">
                    Reasigna el ticket a otro especialista o área técnica manteniendo la trazabilidad histórica.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nuevo Técnico Especialista de Destino (*)
                  </label>
                  <SearchableTechnicianSelect
                    technicians={availableTechs as any}
                    selectedTechId={targetTechId}
                    onSelect={(id) => setTargetTechId(id)}
                    placeholder="Buscar nuevo especialista..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Cambiar Categoría / Especialidad (Opcional)
                  </label>
                  <select
                    value={targetCategoryId}
                    onChange={(e) => setTargetCategoryId(e.target.value ? Number(e.target.value) : '')}
                    className="w-full p-2.5 border border-slate-300 rounded-xl text-xs bg-white font-semibold"
                  >
                    <option value="">Mantener categoría actual</option>
                    {availableCategories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Motivo de la Derivación
                  </label>
                  <textarea
                    rows={2}
                    value={motivoDerivacion}
                    onChange={(e) => setMotivoDerivacion(e.target.value)}
                    placeholder="Indique el motivo de la derivación o traslado de área..."
                    className="w-full p-2.5 border border-slate-300 rounded-xl text-xs"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={submittingAction || !targetTechId}
                    className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-md transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {submittingAction ? 'Derivando...' : 'Confirmar Derivación'}
                  </button>
                </div>
              </form>
            )}

            {/* ACTION 3: RESOLUCIÓN O CAMBIO DE ESTADO */}
            {drawerAction === 'status' && (
              <form onSubmit={handleUpdateStatus} className="space-y-4 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="space-y-1">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    {isTechnicianOnly
                      ? 'Resolución Técnica del Requerimiento'
                      : selectedTicket.modulo === 'SERVICIOS_GENERALES'
                        ? 'Actualizar Fase Operativa en Campo (Servicios Generales)'
                        : 'Actualizar Estado ITIL del Ticket'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {isTechnicianOnly
                      ? 'Registre el informe técnico o solución aplicada para dar por concluido el requerimiento asignado.'
                      : selectedTicket.modulo === 'SERVICIOS_GENERALES'
                        ? 'Gestione el avance de campo, cubicación, espera de materiales o conclusión técnica.'
                        : 'Estados oficiales vigentes: REPORTADO, ASIGNADO y RESUELTO.'}
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nuevo Estado</label>
                  {isTechnicianOnly ? (
                    <div className="w-full p-2.5 bg-emerald-50 border border-emerald-300 rounded-xl text-xs font-black text-emerald-900 flex items-center justify-between">
                      <span>RESUELTO (Incidencia Solucionada / OT Concluida)</span>
                      <span className="text-[10px] bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-md uppercase font-bold">
                        Listo para cierre
                      </span>
                    </div>
                  ) : (
                    <select
                      value={targetStatus}
                      onChange={(e) => setTargetStatus(e.target.value as TicketStatus)}
                      className="w-full p-2.5 border border-slate-300 rounded-xl text-xs bg-white font-bold text-slate-800"
                    >
                      {selectedTicket.modulo === 'SERVICIOS_GENERALES' ? (
                        <>
                          <option value="REPORTADO">1. REPORTADO (Solicitud del Área Usuaria)</option>
                          <option value="EVALUACION_INSPECCION">2. INSPECCIÓN / EVALUACIÓN (Cubicación in situ)</option>
                          <option value="ESPERA_MATERIALES">3. ESPERA DE MATERIALES (Almacén Central / Logística)</option>
                          <option value="ESPERA_MATERIALES_SOLICITANTE">3.1 ESPERA DE MATERIALES (Usuario Solicitante - 15 Días)</option>
                          <option value="ASIGNADO">4. ASIGNADO / OT EMITIDA (Despachado a Campo)</option>
                          <option value="EN_EJECUCION">5. EN EJECUCIÓN (Trabajos en Taller / Aula)</option>
                          {!isMesaAyudaOrAdmin && (
                            <option value="RESUELTO">6. CONCLUIDO / RESUELTO (Solución & Recepción)</option>
                          )}
                        </>
                      ) : (
                        <>
                          <option value="REPORTADO">REPORTADO (Cola inicial sin atender)</option>
                          <option value="ASIGNADO">ASIGNADO (En atención por especialista)</option>
                          {!isMesaAyudaOrAdmin && (
                            <option value="RESUELTO">RESUELTO (Incidencia solucionada)</option>
                          )}
                        </>
                      )}
                    </select>
                  )}
                </div>

                {/* Banner Informativo para Espera de Materiales del Solicitante */}
                {targetStatus === 'ESPERA_MATERIALES_SOLICITANTE' && (
                  <div className="p-3 bg-amber-100/90 rounded-xl border border-amber-300 flex items-start space-x-2 text-amber-950 animate-in fade-in">
                    <Clock className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                    <div className="text-[11px] leading-relaxed">
                      <span className="font-extrabold block">⏳ Plazo Institucional: 15 Días Calendario</span>
                      <span>Se otorga un plazo de 15 días calendario para que el usuario solicitante adquiera y provea los materiales necesarios para ejecutar el servicio.</span>
                    </div>
                  </div>
                )}

                {/* Campos de materiales e insumos para Servicios Generales */}
                {selectedTicket.modulo === 'SERVICIOS_GENERALES' && (
                  <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-200 space-y-3">
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-900 block">
                      Control de Materiales & Insumos de la Orden de Trabajo
                    </span>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Materiales y Aditivos Utilizados en Campo
                      </label>
                      <input
                        type="text"
                        value={materialesUsadosDrawer}
                        onChange={(e) => setMaterialesUsadosDrawer(e.target.value)}
                        placeholder="Ej: 01 AFLOJATODO, TRAPO INDUSTRIAL, 02 TANQUES DE AIRE"
                        className="w-full p-2 border border-slate-300 rounded-lg text-xs bg-white uppercase font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Devolución de Materiales Sobrantes (Taller / Almacén)
                      </label>
                      <input
                        type="text"
                        value={materialesSobrantesDrawer}
                        onChange={(e) => setMaterialesSobrantesDrawer(e.target.value)}
                        placeholder="Ej: 1/2 galón de pintura devuelto, retazos de cable"
                        className="w-full p-2 border border-slate-300 rounded-lg text-xs bg-white uppercase"
                      />
                    </div>
                  </div>
                )}

                {/* Cuadro de texto para informe técnico / solución del trabajo finalizado */}
                {(targetStatus === 'RESUELTO' || isTechnicianOnly) && (
                  <div className="space-y-3 p-3.5 bg-emerald-50/60 rounded-2xl border border-emerald-200">
                    <div>
                      <label className="block text-xs font-black text-emerald-950 uppercase tracking-wide flex items-center space-x-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>
                          {selectedTicket.modulo === 'SERVICIOS_GENERALES'
                            ? 'Informe Técnico sobre la Ejecución de la Orden (*)'
                            : 'Informe Técnico / Trabajo Finalizado (*)'}
                        </span>
                      </label>
                      <p className="text-[11px] text-emerald-800 leading-relaxed mb-1.5">
                        Registre con claridad las acciones técnicas aplicadas, pruebas realizadas o trabajo finalizado para dar por resuelto este ticket.
                      </p>
                      <textarea
                        rows={4}
                        required
                        value={solucionDetalle}
                        onChange={(e) => setSolucionDetalle(e.target.value)}
                        placeholder="Ej: Se procedió a reemplazar el conector dañado, verificación de conectividad Gigabit 1000 Mbps y pruebas con el usuario conformes..."
                        className="w-full p-3 border border-emerald-300 rounded-xl text-xs bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium uppercase shadow-2xs"
                      />
                    </div>

                    {/* ADJUNTAR INFORME TÉCNICO O DOCUMENTO OPCIONAL (NUEVO REQUERIMIENTO) */}
                    <div className="pt-2 border-t border-emerald-200/80 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-emerald-950 flex items-center space-x-1.5">
                          <Paperclip className="w-4 h-4 text-emerald-700" />
                          <span>Añadir Informe Técnico o Documento</span>
                        </label>
                        <span className="text-[10px] font-bold uppercase text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full border border-emerald-300">
                          Opcional
                        </span>
                      </div>
                      <p className="text-[11px] text-emerald-800 leading-tight">
                        Adjunte un reporte técnico firmado, acta de conformidad, documento de diagnóstico o evidencia (PDF, Word, Excel o imágenes).
                      </p>

                      {resolucionArchivo ? (
                        <div className="flex items-center justify-between p-2.5 bg-white border border-emerald-300 rounded-xl text-xs shadow-2xs">
                          <div className="flex items-center space-x-2 truncate">
                            <FileText className="w-4 h-4 text-emerald-600 shrink-0" />
                            <div className="truncate">
                              <span className="font-bold text-slate-800 truncate block">{resolucionArchivo.name}</span>
                              <span className="text-[10px] text-slate-500">{(resolucionArchivo.size / 1024).toFixed(1)} KB</span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setResolucionArchivo(null)}
                            className="p-1 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                            title="Quitar archivo"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <label className="flex items-center justify-center space-x-2 p-2.5 bg-white hover:bg-emerald-100/50 border border-dashed border-emerald-400 rounded-xl text-xs text-emerald-800 font-semibold cursor-pointer transition-colors shadow-2xs">
                          <Upload className="w-4 h-4 text-emerald-600" />
                          <span>Seleccionar informe o documento técnico...</span>
                          <input
                            type="file"
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                setResolucionArchivo(e.target.files[0]);
                              }
                            }}
                            className="hidden"
                            accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.zip,.rar"
                          />
                        </label>
                      )}
                    </div>
                  </div>
                )}

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={submittingAction}
                    className="w-full py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold shadow-md transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {submittingAction
                      ? 'Guardando...'
                      : isTechnicianOnly
                        ? 'Confirmar y Resolver Ticket'
                        : `Guardar como [${targetStatus}]`}
                  </button>
                </div>
              </form>
            )}

            {/* ACTION 4: REABRIR TICKET */}
            {drawerAction === 'reopen' && (
              <form onSubmit={handleReopenTicket} className="space-y-4 p-4 bg-rose-50/50 rounded-2xl border border-rose-200">
                <div className="space-y-1">
                  <h3 className="text-xs font-bold text-rose-900 uppercase tracking-wider flex items-center space-x-1.5">
                    <RotateCcw className="w-4 h-4 text-rose-600" />
                    <span>Reapertura de Ticket</span>
                  </h3>
                  <p className="text-[11px] text-rose-700">
                    Reabre el ticket para que vuelva a estado ASIGNADO si el inconveniente persiste.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Motivo de Reapertura
                  </label>
                  <textarea
                    rows={3}
                    value={motivoReapertura}
                    onChange={(e) => setMotivoReapertura(e.target.value)}
                    placeholder="Indique por qué se reabre la solicitud..."
                    className="w-full p-2.5 border border-slate-300 rounded-xl text-xs"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={submittingAction}
                    className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md transition-all disabled:opacity-50"
                  >
                    {submittingAction ? 'Reabriendo...' : 'Confirmar Reapertura'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </Drawer>
      )}

      {/* Technician History & Reviews Modal */}
      <TechnicianProfileModal
        isOpen={!!selectedTechProfileId}
        onClose={() => setSelectedTechProfileId(null)}
        technicianId={selectedTechProfileId}
      />

      {/* Official Service Request Modal (Servicios Generales) */}
      {sgServiceRequestTicket && (
        <ServiceRequestModal
          isOpen={!!sgServiceRequestTicket}
          onClose={() => setSgServiceRequestTicket(null)}
          ticket={sgServiceRequestTicket}
        />
      )}

      {/* Official Work Order Modal (Servicios Generales) */}
      {sgWorkOrderTicket && (
        <WorkOrderModal
          isOpen={!!sgWorkOrderTicket}
          onClose={() => setSgWorkOrderTicket(null)}
          ticket={sgWorkOrderTicket}
        />
      )}

      {/* Modal: Observar Ticket */}
      {isObserveModalOpen && observingTicket && (
        <Modal
          isOpen={isObserveModalOpen}
          onClose={() => {
            setIsObserveModalOpen(false);
            setObservingTicket(null);
            setObservacionJustificacion('');
            setObservacionFoto(null);
            setObservacionFotoPreview(null);
            setObservacionError(null);
          }}
          title={`Observar Requerimiento: ${observingTicket.codigo_correlativo}`}
          subtitle="Mesa de Ayuda OTIC • Solicitud de Información / Aclaración al Solicitante"
          maxWidth="lg"
        >
          <form onSubmit={handleConfirmObservacion} className="space-y-4">
            <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200 text-amber-900 text-xs flex items-start space-x-2.5">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-bold block">Aclaración previa a la asignación técnica</span>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  Al registrar esta observación, el ticket pasará al estado <strong>OBSERVADO</strong>, se enviará una notificación por correo al solicitante (<strong>{observingTicket.solicitante_email || 'correo institucional'}</strong>) y se habilitará un canal de comunicación directo en el detalle del ticket para que el solicitante pueda responder y adjuntar la información necesaria antes de asignar al técnico especialista.
                </p>
              </div>
            </div>

            {observacionError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium">
                {observacionError}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Motivo o Justificación de la Observación *
              </label>
              <textarea
                required
                rows={4}
                value={observacionJustificacion}
                onChange={(e) => setObservacionJustificacion(e.target.value)}
                placeholder="Indique con claridad qué información, aclaración o evidencia necesita que el solicitante proporcione para poder atender y asignar su requerimiento..."
                className="w-full p-3 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Fotografía / Evidencia de Referencia (Opcional)
              </label>
              <div className="flex items-center space-x-3">
                <label className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors flex items-center space-x-2 cursor-pointer border border-slate-200">
                  <Paperclip className="w-4 h-4 text-slate-500" />
                  <span>{observacionFoto ? 'Cambiar archivo' : 'Adjuntar foto o documento'}</span>
                  <input
                    type="file"
                    accept="image/*,.pdf,.doc,.docx"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        const file = e.target.files[0];
                        setObservacionFoto(file);
                        if (file.type.startsWith('image/')) {
                          setObservacionFotoPreview(URL.createObjectURL(file));
                        } else {
                          setObservacionFotoPreview(null);
                        }
                      }
                    }}
                    className="hidden"
                  />
                </label>
                {observacionFoto && (
                  <div className="flex items-center space-x-2 text-xs text-slate-700 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                    <span className="truncate max-w-[200px] font-medium">{observacionFoto.name}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setObservacionFoto(null);
                        setObservacionFotoPreview(null);
                      }}
                      className="text-rose-500 hover:text-rose-700 p-0.5"
                      title="Quitar archivo"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {observacionFotoPreview && (
                <div className="mt-2 relative w-32 h-24 rounded-xl overflow-hidden border border-slate-200">
                  <img src={observacionFotoPreview} alt="Vista previa" className="w-full h-full object-cover" />
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setIsObserveModalOpen(false);
                  setObservingTicket(null);
                  setObservacionJustificacion('');
                  setObservacionFoto(null);
                  setObservacionFotoPreview(null);
                  setObservacionError(null);
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={submittingObservacion || !observacionJustificacion.trim()}
                className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-extrabold rounded-xl shadow-md transition-all flex items-center space-x-1.5 disabled:opacity-50 cursor-pointer"
              >
                {submittingObservacion ? (
                  <span>Registrando observación...</span>
                ) : (
                  <>
                    <AlertTriangle className="w-4 h-4 text-amber-200" />
                    <span>Confirmar Observación</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal: Historial de Atenciones del Bien */}
      {selectedEquipmentCode && (
        <EquipmentHistoryModal
          isOpen={Boolean(selectedEquipmentCode)}
          onClose={() => setSelectedEquipmentCode(null)}
          numeroInventario={selectedEquipmentCode}
          onSelectTicketDetail={onSelectTicketDetail}
        />
      )}
    </div>
  );
};

