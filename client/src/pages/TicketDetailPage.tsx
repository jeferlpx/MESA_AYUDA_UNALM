import React, { useState, useEffect, useMemo } from 'react';
import { api, getAssetUrl } from '../services/api';
import { Ticket, TicketAdjunto, TicketHistorial, TicketComment, Technician, TicketComplejidad } from '../types';
import { StatusBadge, UrgencyBadge, ComplexityBadge } from '../components/Badge';
import { TicketTimeline } from '../components/TicketTimeline';
import { TechnicianProfileModal } from '../components/TechnicianProfileModal';
import { ServiceRequestModal } from '../components/ServiceRequestModal';
import { WorkOrderModal } from '../components/WorkOrderModal';
import { SGFieldTimelineTracker } from '../components/SGFieldTimelineTracker';
import { Modal } from '../components/Modal';
import { WhatsAppButton } from '../components/WhatsAppButton';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';

import {
  ArrowLeft,
  Clock,
  User,
  Building2,
  Phone,
  Mail,
  FileText,
  CheckCircle2,
  AlertCircle,
  Wrench,
  Paperclip,
  Download,
  Eye,
  Upload,
  Printer,
  Star,
  RotateCcw,
  ShieldAlert,
  Sparkles,
  X,
  PhoneCall,
  MapPin,
  Send,
  AlertTriangle,
  UserCheck,
  MessageSquare,
  RefreshCw,
  Users,
  Laptop,
  History,
} from 'lucide-react';
import { EquipmentHistoryModal } from '../components/EquipmentHistoryModal';

interface TicketDetailPageProps {
  ticketId: number;
  onBack: () => void;
  onTicketLoaded?: (ticket: Ticket) => void;
}

export const TicketDetailPage: React.FC<TicketDetailPageProps> = ({ ticketId, onBack, onTicketLoaded }) => {
  const { user } = useAuth();
  const toast = useToast();

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [adjuntos, setAdjuntos] = useState<TicketAdjunto[]>([]);
  const [historial, setHistorial] = useState<TicketHistorial[]>([]);
  const [comments, setComments] = useState<TicketComment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Observation Chat State
  const [nuevoMensajeChat, setNuevoMensajeChat] = useState<string>('');
  const [archivoChat, setArchivoChat] = useState<File | null>(null);
  const [archivoChatPreview, setArchivoChatPreview] = useState<string | null>(null);
  const [enviandoChat, setEnviandoChat] = useState<boolean>(false);

  // Assignment Modal State (For Mesa de Ayuda in observation panel)
  const [isAssignModalOpen, setIsAssignModalOpen] = useState<boolean>(false);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [selectedTechId, setSelectedTechId] = useState<number | ''>('');
  const [selectedComplexity, setSelectedComplexity] = useState<TicketComplejidad>('BAJA');
  const [additionalTechIds, setAdditionalTechIds] = useState<number[]>([]);
  const [submittingAssign, setSubmittingAssign] = useState<boolean>(false);

  // Resolution Modal State (For assigned technician)
  const [isResolveModalOpen, setIsResolveModalOpen] = useState(false);
  const [solucionDetalle, setSolucionDetalle] = useState('');
  const [materialesUsados, setMaterialesUsados] = useState('');
  const [materialesSobrantes, setMaterialesSobrantes] = useState('');
  const [resolucionArchivo, setResolucionArchivo] = useState<File | null>(null);
  const [submittingResolution, setSubmittingResolution] = useState(false);

  // Solicitant Reopen Modal State
  const [isReopenModalOpen, setIsReopenModalOpen] = useState(false);
  const [motivoReapertura, setMotivoReapertura] = useState('');
  const [submittingReopen, setSubmittingReopen] = useState(false);
  const [reopenError, setReopenError] = useState<string | null>(null);

  // Upload more attachments
  const [uploadingFiles, setUploadingFiles] = useState(false);

  // Equipment History Modal State
  const [isEquipmentHistoryModalOpen, setIsEquipmentHistoryModalOpen] = useState(false);

  // Lightbox modal for image attachments
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Technician profile modal
  const [selectedTechProfileId, setSelectedTechProfileId] = useState<number | null>(null);

  // Official SG Modals
  const [showServiceRequestModal, setShowServiceRequestModal] = useState(false);
  const [showWorkOrderModal, setShowWorkOrderModal] = useState(false);

  // Deduplicate attachments by name + size
  const uniqueAdjuntos = useMemo(() => {
    const seen = new Set<string>();
    return adjuntos.filter((a) => {
      const key = `${a.nombre_original}_${a.tamano_bytes}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [adjuntos]);

  const loadTicketData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getTicketById(ticketId);
      if (res.success && res.data) {
        setTicket(res.data.ticket);
        if (onTicketLoaded) onTicketLoaded(res.data.ticket);
        setComments(res.data.comments || []);
        const rawAdjuntos = res.data.adjuntos || res.data.attachments || [];
        setAdjuntos(
          rawAdjuntos.map((a: any) => {
            let cleanPath = (a.nombre_guardado ? `uploads/${a.nombre_guardado}` : (a.ruta_servidor || a.ruta_archivo || '')).replace(/\\/g, '/');
            const idx = cleanPath.indexOf('uploads/');
            if (idx !== -1) cleanPath = cleanPath.substring(idx);
            return {
              ...a,
              ruta_servidor: cleanPath,
              ruta_archivo: cleanPath,
            };
          })
        );
        const rawHistorial = res.data.historial || res.data.auditLogs || [];
        setHistorial(
          rawHistorial.map((ev: any, idx: number) => ({
            id: ev.id || idx + 1,
            ticket_id: ev.ticket_id || ticketId,
            evento: ev.evento || ev.accion || 'Actualización de Requerimiento',
            detalles: ev.detalles || ev.valor_nuevo || '',
            usuario_nombre: ev.usuario_nombre || 'Sistema',
            creado_en: ev.creado_en || ev.fecha || new Date().toISOString(),
          }))
        );

        // Si el usuario es Mesa de Ayuda o Admin, cargar especialistas técnicos disponibles
        if (['MESA_AYUDA', 'MESA_AYUDA_SG', 'ADMIN', 'SUPERVISOR', 'SUPERVISOR_SG'].includes(user?.rol || '')) {
          api.getTechnicians(res.data.ticket?.modulo ? { modulo: res.data.ticket.modulo } : undefined)
            .then((techRes) => {
              if (techRes.success) setTechnicians(techRes.data);
            })
            .catch(() => {});
        }
      } else {
        setError('No se pudo cargar la información del requerimiento');
      }
    } catch (err: any) {
      setError(err.message || 'Error al obtener detalle del requerimiento');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (ticketId) {
      loadTicketData();

      // Auto-actualizar mensajes del chat en tiempo real cada 6 segundos
      const interval = setInterval(() => {
        api.getTicketById(ticketId).then((res) => {
          if (res.success && res.data) {
            if (res.data.comments) setComments(res.data.comments);
            if (res.data.ticket) setTicket(res.data.ticket);
          }
        }).catch(() => {});
      }, 6000);

      return () => clearInterval(interval);
    }
  }, [ticketId]);

  const handleEnviarMensajeChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoMensajeChat.trim()) return;

    setEnviandoChat(true);
    try {
      const formData = new FormData();
      formData.append('mensaje', nuevoMensajeChat.trim());
      // No enviar esNotaInterna para que el backend lo guarde siempre como comentario público (es_nota_interna = 0)
      if (archivoChat) {
        formData.append('file', archivoChat);
      }

      const res = await api.addComment(ticketId, formData);
      if (res.success) {
        setNuevoMensajeChat('');
        setArchivoChat(null);
        setArchivoChatPreview(null);
        toast.success('Mensaje registrado en la observación.');
        await loadTicketData();
      }
    } catch (err: any) {
      toast.error(err.message || 'Error al enviar mensaje');
    } finally {
      setEnviandoChat(false);
    }
  };

  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTechId) return;

    setSubmittingAssign(true);
    try {
      const additionalToAssign =
        ticket?.modulo === 'OTIC' && selectedComplexity === 'COMPLEJA'
          ? additionalTechIds
          : [];
      const res = await api.assignTechnician(
        ticketId,
        Number(selectedTechId),
        selectedComplexity,
        additionalToAssign
      );
      if (res.success) {
        toast.success('Técnico especialista asignado exitosamente.', 'Ticket Asignado');
        setIsAssignModalOpen(false);
        await loadTicketData();
      }
    } catch (err: any) {
      toast.error(err.message || 'Error al asignar especialista');
    } finally {
      setSubmittingAssign(false);
    }
  };

  const handleResolveTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!solucionDetalle.trim()) {
      toast.error('Debe ingresar el informe o descripción de la solución técnica aplicada.');
      return;
    }

    setSubmittingResolution(true);
    try {
      const res = await api.updateTicketStatus(ticketId, {
        estado: 'RESUELTO',
        solucionDetalle: solucionDetalle.trim(),
        materialesUsados: materialesUsados.trim() || undefined,
        materialesSobrantes: materialesSobrantes.trim() || undefined,
        archivo: resolucionArchivo,
      });

      if (res.success) {
        toast.success('El ticket ha sido marcado como RESUELTO exitosamente.', 'Atención Concluida');
        setIsResolveModalOpen(false);
        setSolucionDetalle('');
        setResolucionArchivo(null);
        await loadTicketData();
      }
    } catch (err: any) {
      toast.error(err.message || 'Error al registrar la resolución técnica');
    } finally {
      setSubmittingResolution(false);
    }
  };

  const handleReopenTicketDetail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticket) return;
    if (!motivoReapertura.trim()) {
      setReopenError('Por favor ingrese el motivo de la reapertura del ticket.');
      return;
    }
    if (motivoReapertura.trim().length < 5) {
      setReopenError('Por favor detalle un poco más el motivo (mínimo 5 caracteres).');
      return;
    }

    setSubmittingReopen(true);
    setReopenError(null);
    try {
      const res = await api.reopenTicket(ticket.id, motivoReapertura.trim());
      if (res.success) {
        toast.success('El ticket ha sido reaperturado exitosamente para continuar su atención técnica.', 'Reapertura Registrada');
        setIsReopenModalOpen(false);
        setMotivoReapertura('');
        await loadTicketData();
      }
    } catch (err: any) {
      setReopenError(err.message || 'Error al reabrir ticket');
    } finally {
      setSubmittingReopen(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const files = Array.from(e.target.files);

    const formData = new FormData();
    files.forEach((f) => formData.append('files', f));
    formData.append('file', files[0]);

    setUploadingFiles(true);
    try {
      const res = await api.uploadTicketAttachments(ticketId, formData);
      if (res.success) {
        toast.success('Archivos adjuntos subidos correctamente.');
        await loadTicketData();
      }
    } catch (err: any) {
      toast.error(err.message || 'Error al subir archivos adjuntos');
    } finally {
      setUploadingFiles(false);
      e.target.value = '';
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6 animate-pulse">
        <div className="h-10 bg-slate-200 rounded-2xl w-1/4" />
        <div className="h-44 bg-slate-200 rounded-3xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 h-96 bg-slate-200 rounded-3xl" />
          <div className="h-96 bg-slate-200 rounded-3xl" />
        </div>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-extrabold text-slate-900">Requerimiento no encontrado</h2>
        <p className="text-xs text-slate-500">{error || 'El ticket solicitado no existe o fue eliminado.'}</p>
        <button
          onClick={onBack}
          className="px-5 py-2.5 bg-slate-800 text-white rounded-xl text-xs font-bold hover:bg-slate-900 transition-colors inline-flex items-center space-x-2 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver al Listado</span>
        </button>
      </div>
    );
  }

  const isSG = ticket.modulo === 'SERVICIOS_GENERALES';
  const isAssignedTech = Boolean(
    user && (ticket.tecnico_id === user.id || (ticket.tecnicos_adicionales && ticket.tecnicos_adicionales.some((a) => a.id === user.id)))
  );
  const canResolve = Boolean(user?.rol && ['TECNICO', 'ESPECIALISTA_REDES', 'ESPECIALISTA_DESARROLLO', 'TECNICO_SG'].includes(user.rol)) && isAssignedTech && ticket.estado !== 'RESUELTO';
  const isObservado = Boolean(
    ticket && (ticket.estado === 'OBSERVADO' || comments.some((c) => c.mensaje.includes('[OBSERVACIÓN') || c.mensaje.includes('[OBSERVACION')))
  );
  const isMesaAyudaOrAdmin = Boolean(
    user?.rol && ['MESA_AYUDA', 'MESA_AYUDA_SG', 'ADMIN', 'SUPERVISOR', 'SUPERVISOR_SG'].includes(user.rol)
  );
  const isOwnerSolicitante = Boolean(user && (user.id === ticket.solicitante_id || user.rol === 'SOLICITANTE'));
  const canReopenDetail = Boolean(
    ticket &&
    ticket.estado === 'RESUELTO' &&
    ticket.fecha_resolucion &&
    isOwnerSolicitante &&
    ((Date.now() - new Date(ticket.fecha_resolucion).getTime()) / (1000 * 60 * 60 * 24)) <= 5
  );

  const backButtonLabel = isOwnerSolicitante ? 'Volver a Mis Requerimientos' : 'Volver al Listado de Tickets';

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      {/* Top Navigation & Breadcrumb */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center space-x-2.5 px-4 py-2 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700/80 text-xs font-bold transition-all shadow-xs hover:shadow-md cursor-pointer group active:scale-95"
          title="Regresar al listado anterior"
        >
          <ArrowLeft className="w-4 h-4 text-slate-500 dark:text-slate-400 group-hover:-translate-x-1 transition-transform" />
          <span>← {backButtonLabel}</span>
        </button>

        <div className="flex items-center space-x-2">
          {/* Documentos oficiales para Servicios Generales */}
          {isSG && (
            <>
              <button
                type="button"
                onClick={() => setShowServiceRequestModal(true)}
                className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer"
                title="Generar Formato de Solicitud de Servicio (SG)"
              >
                <Printer className="w-3.5 h-3.5 text-amber-700" />
                <span>Solicitud SG</span>
              </button>

              <button
                type="button"
                onClick={() => setShowWorkOrderModal(true)}
                className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all flex items-center space-x-1.5 shadow-2xs cursor-pointer"
                title="Generar Orden de Trabajo Oficial (SG)"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Orden de Trabajo</span>
              </button>
            </>
          )}

          {/* Botón Resolver para el técnico asignado */}
          {canResolve && (
            <button
              onClick={() => setIsResolveModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold shadow-md transition-all flex items-center space-x-2 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Resolver y Cerrar Atención</span>
            </button>
          )}

          {/* Botón Reabrir para el solicitante si está resuelto y dentro de 5 días */}
          {canReopenDetail && (
            <button
              type="button"
              onClick={() => {
                setIsReopenModalOpen(true);
                setMotivoReapertura('');
                setReopenError(null);
              }}
              className="px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 text-xs font-extrabold transition-all flex items-center space-x-1.5 shadow-2xs cursor-pointer"
              title="Reabrir ticket dentro de los 5 días posteriores a la resolución"
            >
              <RotateCcw className="w-4 h-4 text-rose-600" />
              <span>Reabrir Ticket</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Ticket Banner Header */}
      <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-6 sm:p-7 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`font-mono text-sm font-black px-3 py-1 rounded-xl border ${
              isSG ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-900 dark:text-amber-200 border-amber-300 dark:border-amber-700' : 'bg-unalm-50 dark:bg-emerald-950/50 text-unalm-700 dark:text-emerald-300 border-unalm-300 dark:border-emerald-700'
            }`}>
              {ticket.codigo_correlativo}
            </span>
            <StatusBadge status={ticket.estado} />
            <UrgencyBadge urgency={ticket.urgencia} />
            <ComplexityBadge complexity={ticket.complejidad || 'BAJA'} />
            <span className="text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-xl">
              {ticket.categoria_nombre}
            </span>
            <span className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-lg border ${
              isSG ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800' : 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
            }`}>
              {isSG ? '🏗️ Servicios Generales' : '💻 Tecnologías de Información (OTIC)'}
            </span>
          </div>

          <div className="flex items-center space-x-2 text-xs text-slate-500 dark:text-slate-400 font-medium">
            <Clock className="w-4 h-4 text-slate-400" />
            <span>
              Registrado el {new Date(ticket.fecha_apertura).toLocaleDateString('es-PE', {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
        </div>

        <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-snug">
          {ticket.titulo}
        </h1>

        {/* Bien / Equipo Patrimonial Vinculado */}
        {ticket.numero_inventario && (
          <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/60 rounded-2xl">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs shrink-0">
                <Laptop className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-700 dark:text-blue-300 block">
                  Equipo / Bien Institucional Vinculado
                </span>
                <span className="font-mono font-extrabold text-sm text-slate-900 dark:text-white">
                  N° de Inventario: {ticket.numero_inventario}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsEquipmentHistoryModalOpen(true)}
              className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs hover:shadow-md cursor-pointer active:scale-95"
              title="Consultar historial técnico y atenciones previas de este bien"
            >
              <History className="w-3.5 h-3.5" />
              <span>Ver Historial del Bien</span>
            </button>
          </div>
        )}

        {/* SLA Timeline representation */}
        <div className="pt-2 border-t border-slate-100">
          <TicketTimeline
            status={ticket.estado}
            fechaApertura={ticket.fecha_apertura}
            fechaPrimeraRespuesta={ticket.fecha_primera_respuesta}
            fechaResolucion={ticket.fecha_resolucion}
          />
        </div>
      </div>

      {/* Panel Exclusivo: Chat / Hilo de Observación y Aclaración (Solo si fue observado) */}
      {isObservado && (
        <div className="bg-gradient-to-br from-amber-500/10 via-amber-50/40 to-orange-50/20 border-2 border-amber-300 rounded-3xl p-6 sm:p-7 shadow-xs space-y-4 animate-in fade-in duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-amber-200/80 pb-4">
            <div className="flex items-center space-x-3.5">
              <div className="w-11 h-11 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-md shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="text-base sm:text-lg font-black text-amber-950">
                    Hilo de Observación & Aclaración con Mesa de Ayuda
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-white shadow-2xs">
                    {ticket.estado === 'OBSERVADO' ? 'ACLARACIÓN PENDIENTE' : 'OBSERVADO'}
                  </span>
                </div>
                <p className="text-xs text-amber-800 mt-0.5 leading-relaxed">
                  Canal directo entre la Mesa de Ayuda y el Solicitante para resolver consultas e información previa a la asignación técnica.
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2 self-start sm:self-auto shrink-0">
              <button
                type="button"
                onClick={loadTicketData}
                className="px-3 py-2 bg-amber-100/80 hover:bg-amber-200 text-amber-900 text-xs font-bold rounded-xl border border-amber-300 transition-all flex items-center space-x-1.5 cursor-pointer shadow-2xs"
                title="Actualizar mensajes del chat"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>Actualizar</span>
              </button>

              {/* Si es Mesa de Ayuda o Admin, botón para asignar especialista (solo si NO está en OBSERVADO) */}
              {isMesaAyudaOrAdmin && ticket.estado !== 'OBSERVADO' && (
                <button
                  type="button"
                  onClick={() => setIsAssignModalOpen(true)}
                  className="px-4 py-2 bg-unalm-600 hover:bg-unalm-700 text-white text-xs font-black rounded-xl shadow-md transition-all flex items-center space-x-2 shrink-0 cursor-pointer"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>Asignar Especialista Técnico</span>
                </button>
              )}
            </div>
          </div>

          {/* Hilo de Mensajes */}
          <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1 scrollbar-thin">
            {comments.length === 0 ? (
              <div className="p-6 text-center text-xs text-amber-800 italic bg-white/70 rounded-2xl border border-amber-200">
                No se registran mensajes en el hilo de observación.
              </div>
            ) : (
              comments.map((comm) => {
                const isHelpdesk = ['MESA_AYUDA', 'MESA_AYUDA_SG', 'ADMIN', 'SUPERVISOR', 'SUPERVISOR_SG'].includes(comm.usuario_rol);
                const isMe = user?.id === comm.usuario_id;
                const commentAdjuntos = uniqueAdjuntos.filter((a) => a.comentario_id === comm.id);

                return (
                  <div
                    key={comm.id}
                    className={`flex flex-col space-y-1.5 p-4 rounded-2xl border shadow-2xs transition-all ${
                      isHelpdesk
                        ? 'bg-amber-50/90 border-amber-200 text-amber-950'
                        : 'bg-white border-slate-200 text-slate-900'
                    } ${isMe ? 'ring-1 ring-amber-400/60' : ''}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black shadow-2xs ${
                          isHelpdesk ? 'bg-amber-600 text-white' : 'bg-slate-700 text-white'
                        }`}>
                          {comm.usuario_nombre.slice(0, 2).toUpperCase()}
                        </span>
                        <span className="font-extrabold text-xs">
                          {comm.usuario_nombre}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isHelpdesk
                            ? 'bg-amber-200/80 text-amber-900 border border-amber-300'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}>
                          {isHelpdesk ? 'Mesa de Ayuda' : 'Solicitante'}
                        </span>
                      </div>

                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(comm.creado_en).toLocaleString('es-PE', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    <div className="text-xs leading-relaxed whitespace-pre-wrap pl-8">
                      {comm.mensaje}
                    </div>

                    {/* Adjuntos vinculados al comentario */}
                    {commentAdjuntos.length > 0 && (
                      <div className="pl-8 pt-2 flex flex-wrap gap-2">
                        {commentAdjuntos.map((adj) => {
                          const isImg = Boolean(adj.mime_type && adj.mime_type.startsWith('image/')) || /\.(jpg|jpeg|png|webp|gif)$/i.test(adj.ruta_archivo || adj.ruta_servidor || '');
                          const url = getAssetUrl(adj.ruta_archivo || adj.ruta_servidor);
                          return (
                            <div
                              key={adj.id}
                              className="flex items-center space-x-2 bg-white/95 p-2 rounded-xl border border-slate-200 text-xs shadow-2xs"
                            >
                              {isImg ? (
                                <img
                                  src={url}
                                  alt={adj.nombre_original}
                                  onClick={() => setPreviewImage(url)}
                                  className="w-8 h-8 rounded-lg object-cover cursor-pointer border border-slate-200"
                                  title="Clic para ampliar imagen"
                                />
                              ) : (
                                <FileText className="w-5 h-5 text-slate-500" />
                              )}
                              <span className="font-semibold text-slate-800 truncate max-w-[160px]" title={adj.nombre_original}>
                                {adj.nombre_original}
                              </span>
                              <a
                                href={url}
                                download={adj.nombre_original}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1 hover:bg-slate-100 rounded text-unalm-600"
                                title="Descargar"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </a>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Formulario para Enviar Respuesta / Aclaración */}
          <form onSubmit={handleEnviarMensajeChat} className="space-y-3 pt-3 border-t border-amber-200">
            <div className="relative">
              <textarea
                rows={3}
                required
                value={nuevoMensajeChat}
                onChange={(e) => setNuevoMensajeChat(e.target.value)}
                placeholder={
                  user?.rol === 'SOLICITANTE'
                    ? 'Escribe tu respuesta o aclaración a la observación de Mesa de Ayuda aquí...'
                    : 'Escribe tu consulta o aclaración al usuario solicitante...'
                }
                className="w-full p-3.5 bg-white border border-amber-300 rounded-2xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium placeholder:text-slate-400 shadow-2xs"
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center space-x-2">
                <label className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold border border-slate-200 shadow-2xs flex items-center space-x-1.5 cursor-pointer transition-colors">
                  <Paperclip className="w-3.5 h-3.5 text-amber-600" />
                  <span>{archivoChat ? 'Cambiar archivo' : 'Adjuntar foto o evidencia'}</span>
                  <input
                    type="file"
                    accept="image/*,.pdf,.doc,.docx"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        const file = e.target.files[0];
                        setArchivoChat(file);
                        if (file.type.startsWith('image/')) {
                          setArchivoChatPreview(URL.createObjectURL(file));
                        } else {
                          setArchivoChatPreview(null);
                        }
                      }
                    }}
                    className="hidden"
                  />
                </label>

                {archivoChat && (
                  <div className="flex items-center space-x-1.5 bg-white px-2.5 py-1 rounded-xl border border-slate-200 text-xs text-slate-700">
                    <span className="font-medium truncate max-w-[140px]">{archivoChat.name}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setArchivoChat(null);
                        setArchivoChatPreview(null);
                      }}
                      className="text-rose-500 hover:text-rose-700 p-0.5"
                      title="Quitar"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}

                {archivoChatPreview && (
                  <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-slate-300 shrink-0">
                    <img src={archivoChatPreview} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={enviandoChat || !nuevoMensajeChat.trim()}
                className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-extrabold shadow-md transition-all flex items-center space-x-1.5 disabled:opacity-50 cursor-pointer"
              >
                {enviandoChat ? (
                  <span>Enviando...</span>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Enviar Respuesta</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Grid: 2 Columns Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left / Main Column: Details, Description, Attachments, Resolution */}
        <div className="lg:col-span-2 space-y-6">
          {/* Solicitante Card */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-3">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center space-x-2 border-b border-slate-100 pb-2">
              <User className="w-4 h-4 text-unalm-600" />
              <span>Datos del Usuario Solicitante</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-400 font-bold block text-[11px]">Nombres & Apellidos:</span>
                <span className="font-bold text-slate-900 text-sm">{ticket.solicitante_nombre}</span>
              </div>

              <div>
                <span className="text-slate-400 font-bold block text-[11px]">Dependencia / Facultad:</span>
                <span className="font-bold text-slate-800">{ticket.solicitante_dependencia || 'Campus Universitario UNALM'}</span>
              </div>

              <div>
                <span className="text-slate-400 font-bold block text-[11px]">Correo Institucional:</span>
                <span className="font-semibold text-slate-700">{ticket.solicitante_email || 'No registrado'}</span>
              </div>

              <div>
                <span className="text-slate-400 font-bold block text-[11px]">Celular & Anexo del Solicitante:</span>
                <div className="flex flex-wrap items-center gap-2 mt-0.5">
                  <span className="font-bold text-slate-900">
                    {ticket.solicitante_telefono || 'Sin celular registrado'}
                    {ticket.solicitante_anexo ? ` (Anexo: ${ticket.solicitante_anexo})` : ''}
                  </span>
                  <WhatsAppButton
                    phone={ticket.solicitante_telefono}
                    label="Contactar por WhatsApp"
                    defaultMessage={`Hola ${ticket.solicitante_nombre}, le escribimos de la Mesa de Ayuda UNALM respecto a su ticket ${ticket.codigo_correlativo}: "${ticket.titulo}".`}
                  />
                </div>
              </div>

              {ticket.contacto_local && (
                <div>
                  <span className="text-slate-400 font-bold block text-[11px]">Contacto de Referencia:</span>
                  <div className="flex flex-wrap items-center gap-2 mt-0.5">
                    <span className="font-bold text-slate-900">{ticket.contacto_local}</span>
                    <WhatsAppButton
                      phone={ticket.contacto_local}
                      label="Contactar por WhatsApp"
                      defaultMessage={`Hola, le escribimos de la Mesa de Ayuda UNALM respecto al requerimiento ${ticket.codigo_correlativo}: "${ticket.titulo}".`}
                    />
                  </div>
                </div>
              )}

              {ticket.horario_acceso && (
                <div>
                  <span className="text-slate-400 font-bold block text-[11px]">Horario Preferente de Atención:</span>
                  <div className="flex items-center space-x-1.5 mt-0.5">
                    <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span className="font-bold text-slate-900">{ticket.horario_acceso}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Description and Location Details */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center space-x-2 border-b border-slate-100 pb-2">
              <FileText className="w-4 h-4 text-unalm-600" />
              <span>Detalle del Requerimiento & Ubicación</span>
            </h3>

            <div className="space-y-3">
              <div>
                <span className="text-slate-400 font-bold block text-[11px] mb-1">Descripción:</span>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-800 font-medium leading-relaxed whitespace-pre-line">
                  {ticket.descripcion}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-400 font-bold block text-[11px]">Ubicación Institucional:</span>
                  <div className="flex items-center space-x-1.5 mt-0.5">
                    <Building2 className="w-3.5 h-3.5 text-unalm-600 shrink-0" />
                    <span className="font-bold text-slate-800">{ticket.ubicacion_oficina || ticket.solicitante_dependencia || 'Campus Universitario UNALM'}</span>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-400 font-bold block text-[11px]">Referencia de Ubicación del Incidente:</span>
                  <div className="flex items-center space-x-1.5 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-unalm-600 shrink-0" />
                    <span className="font-bold text-slate-800">{ticket.referencia_ubicacion || 'No especificada'}</span>
                  </div>
                </div>
              </div>

              {/* SG Field Details (If SG) */}
              {isSG && (
                <div className="mt-3 p-4 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-3">
                  <span className="text-xs font-black text-amber-900 uppercase tracking-wider block">
                    🏗️ Logística Operativa en Terreno (Servicios Generales)
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-slate-500 font-bold block text-[11px]">Contacto en Ambiente:</span>
                      <span className="font-bold text-slate-800">{ticket.contacto_local || 'Mismo solicitante'}</span>
                    </div>

                    <div>
                      <span className="text-slate-500 font-bold block text-[11px]">Horario de Acceso:</span>
                      <span className="font-bold text-slate-800">{ticket.horario_acceso || 'Horario regular de oficina'}</span>
                    </div>

                    {ticket.subtipo_intervencion && (
                      <div>
                        <span className="text-slate-500 font-bold block text-[11px]">Subtipo de Intervención:</span>
                        <span className="font-bold text-slate-800">{ticket.subtipo_intervencion}</span>
                      </div>
                    )}

                    {ticket.materiales_usados && (
                      <div className="sm:col-span-2">
                        <span className="text-slate-500 font-bold block text-[11px]">Materiales / Repuestos Utilizados:</span>
                        <span className="font-semibold text-slate-800">{ticket.materiales_usados}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Solution Report Card (If RESUELTO) */}
          {ticket.estado === 'RESUELTO' && (
            <div className="bg-emerald-50 border border-emerald-200 p-6 rounded-3xl shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-emerald-900 uppercase tracking-wider flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Informe de Solución Técnica Concluida</span>
                </h3>
                {ticket.fecha_resolucion && (
                  <span className="text-[11px] text-emerald-800 font-mono font-bold">
                    {new Date(ticket.fecha_resolucion).toLocaleString('es-PE')}
                  </span>
                )}
              </div>

              {ticket.solucion_detalle ? (
                <p className="text-xs text-emerald-950 font-medium leading-relaxed whitespace-pre-line bg-white/80 p-4 rounded-2xl border border-emerald-200">
                  {ticket.solucion_detalle}
                </p>
              ) : (
                <p className="text-xs text-emerald-800 italic bg-white/60 p-3 rounded-2xl border border-emerald-200">
                  Atención técnica completada satisfactoriamente.
                </p>
              )}

              {ticket.materiales_usados && (
                <div className="text-xs text-emerald-900">
                  <strong className="font-bold">Materiales / Repuestos Aplicados: </strong>
                  <span>{ticket.materiales_usados}</span>
                </div>
              )}

              {canReopenDetail && (
                <div className="pt-3 border-t border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="text-xs text-emerald-900 font-medium">
                    ¿El inconveniente técnico persiste o requiere atención adicional?
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setIsReopenModalOpen(true);
                      setMotivoReapertura('');
                      setReopenError(null);
                    }}
                    className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 font-bold text-xs rounded-xl shadow-2xs transition-all flex items-center space-x-1.5 cursor-pointer self-start sm:self-auto"
                    title="Reabrir ticket dentro de los 5 días posteriores a la resolución"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
                    <span>Reaperturar Ticket</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Attachments & Evidences */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center space-x-2">
                <Paperclip className="w-4 h-4 text-unalm-600" />
                <span>Archivos Adjuntos & Evidencias ({uniqueAdjuntos.length})</span>
              </h3>

              <label className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors flex items-center space-x-1.5 cursor-pointer">
                <Upload className="w-3.5 h-3.5 text-unalm-600" />
                <span>{uploadingFiles ? 'Subiendo...' : '+ Adjuntar archivos'}</span>
                <input
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  disabled={uploadingFiles}
                  className="hidden"
                />
              </label>
            </div>

            {uniqueAdjuntos.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-3 text-center">
                No se adjuntaron archivos a este requerimiento. Puede agregar fotos o documentos usando el botón "+ Adjuntar archivos".
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {uniqueAdjuntos.map((adj) => {
                  const isImage = Boolean(adj.mime_type && adj.mime_type.startsWith('image/')) || /\.(jpg|jpeg|png|webp|gif)$/i.test(adj.ruta_archivo || adj.ruta_servidor || '');
                  const fullUrl = getAssetUrl(adj.ruta_archivo || adj.ruta_servidor);
                  return (
                    <div
                      key={adj.id}
                      className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between gap-3 group hover:bg-slate-100 transition-colors"
                    >
                      <div className="flex items-center space-x-2.5 truncate">
                        {isImage ? (
                          <div
                            onClick={() => setPreviewImage(fullUrl)}
                            className="w-10 h-10 rounded-xl overflow-hidden bg-slate-200 shrink-0 cursor-pointer border border-slate-300"
                            title="Ver imagen completa"
                          >
                            <img src={fullUrl} alt={adj.nombre_original} className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-slate-200 flex items-center justify-center shrink-0 text-slate-600">
                            <FileText className="w-5 h-5" />
                          </div>
                        )}

                        <div className="truncate">
                          <p className="text-xs font-bold text-slate-800 truncate" title={adj.nombre_original}>
                            {adj.nombre_original}
                          </p>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {(adj.tamano_bytes / 1024).toFixed(1)} KB
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-1 shrink-0">
                        {isImage && (
                          <button
                            type="button"
                            onClick={() => setPreviewImage(fullUrl)}
                            className="p-1.5 hover:bg-white rounded-lg text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                            title="Vista previa"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        )}
                        <a
                          href={fullUrl}
                          download={adj.nombre_original}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 hover:bg-white rounded-lg text-unalm-600 hover:text-unalm-800 transition-colors cursor-pointer"
                          title="Descargar archivo"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Técnico Asignado & Trazabilidad / Historial */}
        <div className="space-y-6">
          {/* Técnico Especialista Card */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center space-x-2 border-b border-slate-100 pb-2">
              <Wrench className="w-4 h-4 text-unalm-600" />
              <span>Especialista Asignado</span>
            </h3>

            {ticket.tecnico_id && ticket.tecnico_nombre ? (
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  {ticket.tecnico_foto ? (
                    <img
                      src={getAssetUrl(ticket.tecnico_foto)}
                      alt={ticket.tecnico_nombre}
                      className="w-12 h-12 rounded-full object-cover border-2 border-amber-300 shadow-xs"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-unalm-600 text-white font-black text-sm flex items-center justify-center shadow-xs">
                      {ticket.tecnico_nombre.slice(0, 2).toUpperCase()}
                    </div>
                  )}

                  <div>
                    <h4 className="font-extrabold text-slate-900 text-sm">{ticket.tecnico_nombre}</h4>
                    <span className="text-[10px] font-extrabold text-unalm-700 bg-unalm-50 border border-unalm-200 px-2 py-0.5 rounded-full inline-block mt-0.5">
                      {isSG ? 'Especialista Serv. Generales' : 'Técnico Especialista OTIC'}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 text-xs text-slate-600 space-y-1.5 font-medium">
                  {ticket.tecnico_email && (
                    <div className="flex items-center space-x-2 truncate">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{ticket.tecnico_email}</span>
                    </div>
                  )}
                  {ticket.tecnico_telefono && (
                    <div className="flex items-center justify-between gap-2 pt-0.5">
                      <div className="flex items-center space-x-2">
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="font-semibold text-slate-800">{ticket.tecnico_telefono}</span>
                      </div>
                      <WhatsAppButton
                        phone={ticket.tecnico_telefono}
                        label="WhatsApp"
                        defaultMessage={`Hola ${ticket.tecnico_nombre}, le escribo respecto al ticket ${ticket.codigo_correlativo}: "${ticket.titulo}".`}
                      />
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedTechProfileId(ticket.tecnico_id!)}
                  className="w-full mt-2 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold border border-slate-200 transition-colors flex items-center justify-center space-x-1.5 cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5 text-unalm-600" />
                  <span>Ver Récord del Especialista Principal</span>
                </button>

                {/* EQUIPO DE APOYO TÉCNICO ASIGNADO (COMPLEJIDAD CRÍTICA) */}
                {ticket.tecnicos_adicionales && ticket.tecnicos_adicionales.length > 0 && (
                  <div className="pt-3 border-t border-slate-100 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-amber-900 flex items-center space-x-1">
                        <Users className="w-3.5 h-3.5 text-amber-600" />
                        <span>Equipo de Apoyo Técnico</span>
                      </span>
                      <span className="text-[10px] font-extrabold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded-md border border-amber-300">
                        +{ticket.tecnicos_adicionales.length} colaborador{ticket.tecnicos_adicionales.length > 1 ? 'es' : ''}
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      {ticket.tecnicos_adicionales.map((coTec) => (
                        <div
                          key={coTec.id}
                          className="flex items-center justify-between p-2 rounded-xl bg-amber-50/60 hover:bg-amber-100/60 border border-amber-200 transition-colors group"
                        >
                          <div
                            onClick={() => setSelectedTechProfileId(coTec.id)}
                            className="flex items-center space-x-2 truncate cursor-pointer flex-1"
                            title="Ver récord del especialista"
                          >
                            {coTec.foto_perfil ? (
                              <img
                                src={getAssetUrl(coTec.foto_perfil)}
                                alt={coTec.nombres}
                                className="w-6 h-6 rounded-full object-cover border border-amber-300 shrink-0"
                              />
                            ) : (
                              <div className="w-6 h-6 rounded-full bg-amber-600 text-white font-bold text-[9px] flex items-center justify-center shrink-0">
                                {coTec.nombres.slice(0, 2).toUpperCase()}
                              </div>
                            )}
                            <div className="truncate">
                              <span className="text-xs font-bold text-slate-800 truncate block group-hover:text-amber-900">
                                {coTec.nombre_completo || `${coTec.nombres} ${coTec.apellidos}`}
                              </span>
                              {coTec.especialidad && (
                                <span className="text-[10px] text-amber-800 block truncate">
                                  {coTec.especialidad}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-1.5 shrink-0 ml-2">
                            {coTec.telefono && (
                              <WhatsAppButton
                                phone={coTec.telefono}
                                compact={true}
                                defaultMessage={`Hola ${coTec.nombres}, le escribo respecto al ticket ${ticket.codigo_correlativo}: "${ticket.titulo}".`}
                              />
                            )}
                            <button
                              type="button"
                              onClick={() => setSelectedTechProfileId(coTec.id)}
                              className="p-1 text-amber-700 hover:text-amber-900 rounded"
                              title="Ver perfil"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : ticket.estado === 'OBSERVADO' ? (
              <div className="p-5 bg-gradient-to-br from-amber-50 to-orange-50/60 rounded-2xl border-2 border-amber-300 text-center space-y-2 shadow-xs animate-in fade-in">
                <AlertTriangle className="w-8 h-8 text-amber-600 mx-auto" />
                <p className="text-xs font-black text-amber-950 uppercase tracking-wide">
                  Ticket en Observación por Mesa de Ayuda
                </p>
                <p className="text-[11px] text-amber-900 leading-relaxed font-medium">
                  La Mesa de Ayuda ha observado su requerimiento y solicita aclaraciones o evidencias adicionales para proceder con la asignación técnica. Por favor responda en el recuadro de aclaración a la izquierda.
                </p>
              </div>
            ) : (
              <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-center space-y-2">
                <Clock className="w-8 h-8 text-amber-500 mx-auto" />
                <p className="text-xs font-bold text-amber-900">Pendiente de Asignación</p>
                <p className="text-[11px] text-amber-700">
                  La Mesa de Ayuda asignará un especialista técnico en breve según disponibilidad.
                </p>
              </div>
            )}
          </div>

          {/* Historial / Trazabilidad & Línea de Vida */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center space-x-2 border-b border-slate-100 pb-2">
              <Clock className="w-4 h-4 text-unalm-600" />
              <span>Trazabilidad & Línea de Vida</span>
            </h3>

            {historial.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-2 text-center">
                Apertura inicial del requerimiento registrada en el sistema.
              </p>
            ) : (
              <div className="space-y-4 relative before:absolute before:top-2 before:bottom-2 before:left-3 before:w-0.5 before:bg-slate-200">
                {historial.map((ev) => {
                  const isReopen = ev.accion === 'REAPERTURA_TICKET' || ev.evento?.toLowerCase().includes('reapertura');
                  const isResolution = ev.evento?.toLowerCase().includes('resolución') || ev.detalles?.includes('RESUELTO') || ev.valor_nuevo?.includes('RESUELTO');

                  if (isReopen) {
                    const rawMotivo = ev.detalles || ev.valor_nuevo || '';
                    const motivoText = rawMotivo.replace(/^(ASIGNADO\s*-\s*)?Motivo:\s*/i, '').trim();

                    return (
                      <div key={ev.id} className="relative pl-7 text-xs space-y-1.5 animate-in fade-in">
                        <div className="absolute left-1 top-1 w-4 h-4 rounded-full bg-rose-600 border-2 border-white shadow-sm ring-2 ring-rose-200 flex items-center justify-center">
                          <RotateCcw className="w-2.5 h-2.5 text-white" />
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className="font-extrabold text-rose-950 text-xs flex items-center space-x-1">
                              <span>Reapertura del Requerimiento</span>
                            </span>
                            <span className="px-2 py-0.5 text-[9px] font-black uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-300 rounded-md">
                              Reaperturado
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {new Date(ev.creado_en).toLocaleDateString('es-PE', {
                              day: '2-digit',
                              month: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        {ev.usuario_nombre && (
                          <p className="text-[11px] text-slate-500 font-medium">
                            Por: <strong className="text-slate-800">{ev.usuario_nombre}</strong>
                          </p>
                        )}
                        <div className="p-3 bg-rose-50/80 border border-rose-200 rounded-2xl text-xs space-y-1 shadow-2xs">
                          <span className="text-[11px] font-extrabold text-rose-900 flex items-center space-x-1">
                            <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                            <span>Motivo de la Reapertura registrado por el usuario:</span>
                          </span>
                          <p className="text-xs font-semibold text-rose-950 bg-white/95 p-2.5 rounded-xl border border-rose-200/80 leading-relaxed italic">
                            "{motivoText || 'Reapertura registrada por el usuario'}"
                          </p>
                        </div>
                      </div>
                    );
                  }

                  if (isResolution) {
                    let transitionText = 'ASIGNADO → RESUELTO';
                    let informeTecnicoText = '';

                    if (ev.detalles) {
                      const parts = ev.detalles.split(/(?:-|\n)\s*Informe Técnico:\s*/i);
                      if (parts.length > 1) {
                        transitionText = parts[0].trim();
                        informeTecnicoText = parts[1].trim();
                      } else {
                        transitionText = ev.detalles;
                      }
                    }
                    if (!informeTecnicoText && ticket.solucion_detalle) {
                      informeTecnicoText = ticket.solucion_detalle;
                    }

                    return (
                      <div key={ev.id} className="relative pl-7 text-xs space-y-1.5 animate-in fade-in">
                        <div className="absolute left-1 top-1 w-4 h-4 rounded-full bg-emerald-600 border-2 border-white shadow-sm ring-2 ring-emerald-200 flex items-center justify-center">
                          <CheckCircle2 className="w-2.5 h-2.5 text-white" />
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className="font-extrabold text-emerald-950 text-xs flex items-center space-x-1">
                              <span>Resolución del Requerimiento</span>
                            </span>
                            <span className="px-2 py-0.5 text-[9px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-md">
                              Resuelto
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {new Date(ev.creado_en).toLocaleDateString('es-PE', {
                              day: '2-digit',
                              month: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        {ev.usuario_nombre && (
                          <p className="text-[11px] text-slate-500 font-medium">
                            Por: <strong className="text-slate-800">{ev.usuario_nombre}</strong>
                          </p>
                        )}
                        <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-2xl text-xs space-y-2 shadow-2xs">
                          <div className="flex items-center justify-between">
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded text-[10px] font-black font-mono">
                              {transitionText || 'ASIGNADO → RESUELTO'}
                            </span>
                            <span className="text-[10px] font-bold text-emerald-700">Atención Técnica Concluida</span>
                          </div>
                          {informeTecnicoText ? (
                            <div className="space-y-1 pt-1.5 border-t border-emerald-200/60">
                              <span className="text-[11px] font-extrabold text-emerald-900 flex items-center space-x-1">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Informe Técnico / Trabajo Finalizado por el Especialista:</span>
                              </span>
                              <p className="text-xs font-medium text-emerald-950 bg-white/95 p-2.5 rounded-xl border border-emerald-200/80 leading-relaxed whitespace-pre-line">
                                {informeTecnicoText}
                              </p>
                            </div>
                          ) : (
                            <p className="text-xs text-slate-500 italic">Atención completada satisfactoriamente.</p>
                          )}
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div key={ev.id} className="relative pl-7 text-xs space-y-1">
                      <div className="absolute left-1.5 top-1 w-3.5 h-3.5 rounded-full bg-unalm-600 border-2 border-white shadow-2xs" />
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800">{ev.evento}</span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(ev.creado_en).toLocaleDateString('es-PE', {
                            day: '2-digit',
                            month: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      {ev.usuario_nombre && (
                        <p className="text-[11px] text-slate-500 font-medium">
                          Por: {ev.usuario_nombre}
                        </p>
                      )}
                      {ev.detalles && (
                        <p className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded-xl border border-slate-200 leading-relaxed">
                          {ev.detalles}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal: Resolver Ticket (Solo para técnico asignado) */}
      {isResolveModalOpen && (
        <Modal
          isOpen={isResolveModalOpen}
          onClose={() => setIsResolveModalOpen(false)}
          title="Resolución Técnica del Requerimiento"
          subtitle="Registre el informe técnico del trabajo realizado para dar por concluido el ticket."
          maxWidth="lg"
        >
          <form onSubmit={handleResolveTicket} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Informe de Solución Técnica / Trabajo Realizado *
              </label>
              <textarea
                required
                rows={4}
                value={solucionDetalle}
                onChange={(e) => setSolucionDetalle(e.target.value)}
                placeholder="Describa en detalle las acciones técnicas ejecutadas, diagnósticos, pruebas o repuestos instalados..."
                className="w-full p-3 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none font-medium"
              />
            </div>

            {isSG && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Materiales / Insumos Utilizados (Opcional)
                  </label>
                  <input
                    type="text"
                    value={materialesUsados}
                    onChange={(e) => setMaterialesUsados(e.target.value)}
                    placeholder="Ej: 2 tubos fluorescentes, 5m cable"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Materiales Sobrantes / Devueltos (Opcional)
                  </label>
                  <input
                    type="text"
                    value={materialesSobrantes}
                    onChange={(e) => setMaterialesSobrantes(e.target.value)}
                    placeholder="Ej: 1m cable sobrante"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs"
                  />
                </div>
              </div>
            )}

            {/* ADJUNTAR INFORME TÉCNICO O DOCUMENTO OPCIONAL (NUEVO REQUERIMIENTO) */}
            <div className="pt-2 border-t border-slate-200 space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                  <Paperclip className="w-4 h-4 text-emerald-600" />
                  <span>Añadir Informe Técnico o Documento</span>
                </label>
                <span className="text-[10px] font-bold uppercase text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Opcional
                </span>
              </div>
              <p className="text-[11px] text-slate-500 leading-tight">
                Adjunte un informe técnico firmado, reporte en PDF, Word, Excel o imágenes que respalden el cierre técnico del requerimiento.
              </p>

              {resolucionArchivo ? (
                <div className="flex items-center justify-between p-2.5 bg-slate-50 border border-emerald-300 rounded-xl text-xs">
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
                <label className="flex items-center justify-center space-x-2 p-2.5 bg-slate-50 hover:bg-emerald-50/50 border border-dashed border-slate-300 hover:border-emerald-400 rounded-xl text-xs text-slate-700 font-semibold cursor-pointer transition-colors">
                  <Upload className="w-4 h-4 text-emerald-600" />
                  <span>Seleccionar informe o documento adjunto...</span>
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

            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setIsResolveModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={submittingResolution}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold rounded-xl shadow-md transition-all flex items-center space-x-1.5 disabled:opacity-50 cursor-pointer"
              >
                {submittingResolution ? (
                  <span>Guardando resolución...</span>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confirmar y Resolver Ticket</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Lightbox Preview Modal for Images */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-3 right-3 p-2 bg-black/60 hover:bg-black/80 text-white rounded-full transition-colors cursor-pointer z-10"
              title="Cerrar (X)"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={previewImage}
              alt="Evidencia ampliada"
              className="max-h-[85vh] max-w-full rounded-2xl object-contain shadow-2xl border border-white/20"
            />
          </div>
        </div>
      )}

      {/* Official SG Modals */}
      {showServiceRequestModal && (
        <ServiceRequestModal
          isOpen={showServiceRequestModal}
          onClose={() => setShowServiceRequestModal(false)}
          ticket={ticket}
        />
      )}

      {showWorkOrderModal && (
        <WorkOrderModal
          isOpen={showWorkOrderModal}
          onClose={() => setShowWorkOrderModal(false)}
          ticket={ticket}
        />
      )}

      {/* Technician Profile Modal */}
      {selectedTechProfileId && (
        <TechnicianProfileModal
          isOpen={Boolean(selectedTechProfileId)}
          onClose={() => setSelectedTechProfileId(null)}
          technicianId={selectedTechProfileId}
        />
      )}

      {/* Modal: Asignar Especialista Técnico (Mesa de Ayuda) */}
      {isAssignModalOpen && (
        <Modal
          isOpen={isAssignModalOpen}
          onClose={() => setIsAssignModalOpen(false)}
          title={`Asignar Especialista: ${ticket.codigo_correlativo}`}
          subtitle="Seleccione el técnico especialista y el nivel de complejidad para iniciar la atención técnica."
          maxWidth="md"
        >
          <form onSubmit={handleAssignSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {ticket.modulo === 'OTIC' && selectedComplexity === 'COMPLEJA'
                  ? 'Técnico Especialista Principal / Responsable *'
                  : 'Técnico Especialista Destinado *'}
              </label>
              <select
                required
                value={selectedTechId}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setSelectedTechId(val);
                  if (val) {
                    setAdditionalTechIds((prev) => prev.filter((aid) => aid !== val));
                  }
                }}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white text-slate-800 font-semibold"
              >
                <option value="">-- Seleccione un especialista --</option>
                {technicians.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nombres} {t.apellidos} {t.especialidad ? `(${t.especialidad})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nivel de Complejidad Técnica (*)
              </label>
              <select
                value={selectedComplexity}
                onChange={(e) => {
                  const newComp = e.target.value as TicketComplejidad;
                  setSelectedComplexity(newComp);
                  if (newComp !== 'COMPLEJA') {
                    setAdditionalTechIds([]);
                  }
                }}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white text-slate-800 font-semibold"
              >
                <option value="BAJA">Baja — Estándar</option>
                <option value="MEDIA">Media — Mayor Dificultad</option>
                <option value="ALTA">Alta — Complejo</option>
                <option value="COMPLEJA">Crítica / Muy Compleja — Especializada</option>
              </select>
            </div>

            {/* ASIGNACIÓN MÚLTIPLE DE TÉCNICOS: SOLO MESA DE AYUDA OTIC (NO SERVICIOS GENERALES) Y COMPLEJIDAD CRÍTICA */}
            {ticket.modulo === 'OTIC' && selectedComplexity === 'COMPLEJA' && (
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
                  Por ser un caso de complejidad <strong>Crítica / Muy Compleja</strong> en OTIC, puede designar más técnicos para la atención conjunta.
                </p>

                {/* Chips de técnicos seleccionados */}
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

                {/* Selector para añadir otro técnico de apoyo */}
                {technicians.filter((t) => t.id !== selectedTechId && !additionalTechIds.includes(t.id)).length > 0 && (
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
                      {technicians
                        .filter((t) => t.id !== selectedTechId && !additionalTechIds.includes(t.id))
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

            <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsAssignModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={submittingAssign || !selectedTechId}
                className="px-5 py-2 bg-unalm-600 hover:bg-unalm-700 text-white text-xs font-extrabold rounded-xl shadow-md transition-all flex items-center space-x-1.5 disabled:opacity-50 cursor-pointer"
              >
                {submittingAssign ? (
                  <span>Asignando...</span>
                ) : (
                  <>
                    <UserCheck className="w-4 h-4" />
                    <span>Confirmar Asignación</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal: Reapertura de Ticket por el Solicitante */}
      {isReopenModalOpen && ticket && (
        <Modal
          isOpen={isReopenModalOpen}
          onClose={() => {
            if (!submittingReopen) {
              setIsReopenModalOpen(false);
              setMotivoReapertura('');
              setReopenError(null);
            }
          }}
          title="Reapertura del Ticket / Requerimiento"
          subtitle={`Ticket: ${ticket.codigo_correlativo} — ${ticket.titulo}`}
          maxWidth="md"
        >
          <form onSubmit={handleReopenTicketDetail} className="space-y-4">
            {reopenError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-bold flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{reopenError}</span>
              </div>
            )}

            <div className="p-3.5 bg-rose-50/70 border border-rose-200 rounded-2xl text-xs text-rose-950 space-y-1">
              <div className="font-extrabold flex items-center space-x-1.5 text-rose-900">
                <RotateCcw className="w-4 h-4 text-rose-600 shrink-0" />
                <span>Indique el Motivo de Reapertura</span>
              </div>
              <p className="text-[11px] text-rose-800 leading-relaxed">
                Por favor, describa con claridad la razón por la cual requiere reabrir este caso (por ejemplo: la falla continúa, el problema no quedó solucionado o fallaron las pruebas). Esta información se notificará al técnico y quedará registrada en la trazabilidad del ticket.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Motivo de la Reapertura *
              </label>
              <textarea
                required
                rows={4}
                value={motivoReapertura}
                onChange={(e) => setMotivoReapertura(e.target.value)}
                placeholder="Describa detalladamente el motivo de la reapertura (ej: El equipo sigue sin conexión a red tras el reinicio / Persiste la falla técnica reportada...)"
                className="w-full p-3 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none font-medium text-slate-900 placeholder-slate-400"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Mínimo 5 caracteres explicando la persistencia del requerimiento.
              </span>
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                disabled={submittingReopen}
                onClick={() => {
                  setIsReopenModalOpen(false);
                  setMotivoReapertura('');
                  setReopenError(null);
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={submittingReopen || !motivoReapertura.trim()}
                className="px-5 py-2 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white text-xs font-extrabold rounded-xl shadow-md transition-all flex items-center space-x-1.5 disabled:opacity-50 cursor-pointer"
              >
                {submittingReopen ? (
                  <span>Reaperturando...</span>
                ) : (
                  <>
                    <RotateCcw className="w-4 h-4" />
                    <span>Confirmar Reapertura</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal: Historial de Atenciones del Bien Patrimonial */}
      {isEquipmentHistoryModalOpen && ticket?.numero_inventario && (
        <EquipmentHistoryModal
          isOpen={isEquipmentHistoryModalOpen}
          onClose={() => setIsEquipmentHistoryModalOpen(false)}
          numeroInventario={ticket.numero_inventario}
          currentTicketId={ticket.id}
        />
      )}
    </div>
  );
};
