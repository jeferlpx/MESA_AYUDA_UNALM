import React, { useState, useEffect, useRef } from 'react';
import { Modal } from './Modal';
import { api } from '../services/api';
import { ServiceCategory, Technician, User, TicketUrgency, TicketImpact } from '../types';
import {
  AlertOctagon,
  Search,
  User as UserIcon,
  CheckCircle2,
  Building2,
  Phone,
  Mail,
  FileText,
  AlertTriangle,
  Upload,
  X,
  PhoneCall,
  Loader2,
  Laptop,
} from 'lucide-react';

interface EmergencyTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: ServiceCategory[];
  technicians: Technician[];
  onTicketCreated: (createdTicket: any) => void;
}

export const EmergencyTicketModal: React.FC<EmergencyTicketModalProps> = ({
  isOpen,
  onClose,
  categories,
  technicians,
  onTicketCreated,
}) => {
  // Solicitante Search States
  const [solicitantQuery, setSolicitantQuery] = useState('');
  const [solicitantResults, setSolicitantResults] = useState<User[]>([]);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);
  const [selectedSolicitant, setSelectedSolicitant] = useState<User | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchTimeoutRef = useRef<any>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  // Form Fields
  const [categoriaId, setCategoriaId] = useState<number | ''>('');
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [justificacionEmergencia, setJustificacionEmergencia] = useState('');
  const [canalOrigen, setCanalOrigen] = useState<'TELEFONO' | 'PRESENCIAL' | 'CORREO' | 'WHATSAPP'>('TELEFONO');
  const [urgencia, setUrgencia] = useState<TicketUrgency>('ALTA');
  const [impacto, setImpacto] = useState<TicketImpact>('MEDIO');
  const [tecnicoId, setTecnicoId] = useState<number | ''>('');
  const [esEquipo, setEsEquipo] = useState(false);
  const [numeroInventario, setNumeroInventario] = useState('');
  const [files, setFiles] = useState<File[]>([]);

  // Submission States
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Filtrar categorías que pertenezcan a OTIC (o activas)
  const oticCategories = categories.filter((c) => !c.modulo || c.modulo === 'OTIC');
  const oticTechnicians = technicians.filter(
    (t) => ['TECNICO', 'ESPECIALISTA_REDES', 'ESPECIALISTA_DESARROLLO', 'SUPERVISOR', 'MESA_AYUDA'].includes(t.rol)
  );

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setSolicitantQuery('');
      setSolicitantResults([]);
      setSelectedSolicitant(null);
      setShowDropdown(false);
      setCategoriaId(oticCategories.length > 0 ? oticCategories[0].id : '');
      setTitulo('');
      setDescripcion('');
      setJustificacionEmergencia('');
      setCanalOrigen('TELEFONO');
      setUrgencia('ALTA');
      setImpacto('MEDIO');
      setTecnicoId('');
      setEsEquipo(false);
      setNumeroInventario('');
      setFiles([]);
      setFormError(null);
    }
  }, [isOpen]);

  // Click outside dropdown handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Debounced search for Active Directory solicitants (Admin is already filtered on backend)
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSolicitantQuery(val);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (val.trim().length >= 2) {
      setIsSearchingUsers(true);
      setShowDropdown(true);
      searchTimeoutRef.current = setTimeout(async () => {
        try {
          const res = await api.getSolicitants({ search: val.trim(), limit: 30 });
          if (res.success && Array.isArray(res.data)) {
            setSolicitantResults(res.data);
          } else {
            setSolicitantResults([]);
          }
        } catch (err) {
          console.error('[Search solicitants error]:', err);
          setSolicitantResults([]);
        } finally {
          setIsSearchingUsers(false);
        }
      }, 300);
    } else {
      setSolicitantResults([]);
      setIsSearchingUsers(false);
      setShowDropdown(false);
    }
  };

  const handleSelectSolicitant = (user: User) => {
    setSelectedSolicitant(user);
    setSolicitantQuery('');
    setSolicitantResults([]);
    setShowDropdown(false);
    setFormError(null);
  };

  const handleClearSolicitant = () => {
    setSelectedSolicitant(null);
    setSolicitantQuery('');
    setSolicitantResults([]);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selected = Array.from(e.target.files);
      const combined = [...files, ...selected].slice(0, 5);
      setFiles(combined);
    }
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!selectedSolicitant) {
      setFormError('Debe buscar y seleccionar al usuario solicitante del Directorio Activo.');
      return;
    }

    if (!categoriaId) {
      setFormError('Debe seleccionar la categoría de servicio OTIC.');
      return;
    }

    if (!titulo.trim()) {
      setFormError('Debe ingresar el asunto o título del requerimiento de emergencia.');
      return;
    }

    if (!descripcion.trim()) {
      setFormError('Debe ingresar la descripción detallada del problema.');
      return;
    }

    if (!justificacionEmergencia.trim() || justificacionEmergencia.trim().length < 5) {
      setFormError('La justificación de la emergencia / regularización es obligatoria (mínimo 5 caracteres).');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('solicitanteId', String(selectedSolicitant.id));
      formData.append('categoriaId', String(categoriaId));
      formData.append('titulo', titulo.trim());
      formData.append('descripcion', descripcion.trim());
      formData.append('tipo', 'INCIDENTE');
      formData.append('canalOrigen', canalOrigen);
      formData.append('urgencia', urgencia);
      formData.append('impacto', impacto);
      formData.append('esEmergencia', 'true');
      formData.append('justificacionEmergencia', justificacionEmergencia.trim());

      if (tecnicoId) {
        formData.append('tecnicoId', String(tecnicoId));
      }

      if (esEquipo && numeroInventario.trim()) {
        formData.append('esEquipo', 'true');
        formData.append('numeroInventario', numeroInventario.trim());
      }

      if (files.length > 0) {
        files.forEach((f) => formData.append('files', f));
        formData.append('file', files[0]);
      }

      const res = await api.createTicket(formData);
      if (res.success) {
        onTicketCreated(res.data);
        onClose();
      } else {
        setFormError(res.message || 'Error al generar el ticket de emergencia.');
      }
    } catch (err: any) {
      console.error('[Emergency Ticket error]:', err);
      setFormError(err.message || 'Error al procesar el registro de emergencia.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="" maxWidth="3xl">
      <div className="space-y-6">
        {/* Header Alert Banner */}
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-lg relative overflow-hidden">
          <div className="relative z-10 flex items-start space-x-3.5">
            <div className="p-3 bg-white/20 rounded-xl shrink-0 backdrop-blur-xs">
              <AlertOctagon className="w-6 h-6 text-white animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 bg-black/30 rounded-md text-[10px] font-black uppercase tracking-wider">
                  Mesa de Ayuda OTIC
                </span>
                <span className="text-[11px] font-semibold text-red-100">
                  Canal de Atención Inmediata & Regularización
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-black tracking-tight mt-1">
                Registrar Ticket de Emergencia / Regularización
              </h2>
              <p className="text-xs text-red-100/90 mt-1 max-w-2xl leading-relaxed">
                Permite registrar atenciones urgentes recibidas por llamada telefónica o de forma presencial.
                El ticket ingresará con distintivo de emergencia y seguirá el flujo oficial de asignación y cierre técnico.
              </p>
            </div>
          </div>
          <div className="absolute -right-6 -bottom-8 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        </div>

        {/* Error Alert */}
        {formError && (
          <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-300 text-xs font-semibold flex items-center space-x-2 animate-in fade-in">
            <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* 1. SELECCIÓN DEL SOLICITANTE (DIRECTORIO ACTIVO) */}
          <div className="bg-slate-50 dark:bg-slate-800/50 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-200 flex items-center space-x-1.5">
                <UserIcon className="w-4 h-4 text-unalm-600 dark:text-emerald-400" />
                <span>1. Usuario Solicitante del Directorio Activo *</span>
              </label>
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                Filtro automático: Excluye Administrador General
              </span>
            </div>

            {!selectedSolicitant ? (
              <div className="relative" ref={dropdownRef}>
                <div className="relative">
                  <input
                    type="text"
                    value={solicitantQuery}
                    onChange={handleSearchChange}
                    onFocus={() => {
                      if (solicitantResults.length > 0) setShowDropdown(true);
                    }}
                    placeholder="Escriba nombres, apellidos o correo para buscar en el Directorio Activo..."
                    className="w-full pl-10 pr-10 py-2.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-red-500 dark:focus:ring-red-400 text-slate-900 dark:text-white placeholder-slate-400 font-medium transition-all"
                  />
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  {isSearchingUsers && (
                    <Loader2 className="w-4 h-4 text-red-500 animate-spin absolute right-3.5 top-3" />
                  )}
                </div>

                {/* Dropdown de resultados */}
                {showDropdown && (
                  <div className="absolute z-50 left-0 right-0 mt-1.5 max-h-64 overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl divide-y divide-slate-100 dark:divide-slate-800">
                    {solicitantResults.length === 0 ? (
                      <div className="p-4 text-center text-xs text-slate-400">
                        {isSearchingUsers
                          ? 'Buscando en Directorio Activo...'
                          : 'No se encontraron usuarios coincidentes.'}
                      </div>
                    ) : (
                      solicitantResults.map((u) => (
                        <button
                          key={u.id}
                          type="button"
                          onClick={() => handleSelectSolicitant(u)}
                          className="w-full text-left p-3 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-between transition-colors cursor-pointer"
                        >
                          <div className="flex items-center space-x-3 min-w-0">
                            <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-between shrink-0 overflow-hidden text-[11px] font-black text-slate-700 dark:text-slate-200 uppercase items-center justify-center">
                              {u.nombres?.charAt(0)}
                              {u.apellidos?.charAt(0)}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                {u.nombres} {u.apellidos}
                              </p>
                              <div className="flex items-center space-x-2 text-[10px] text-slate-500 dark:text-slate-400 truncate">
                                <span className="truncate">{u.email}</span>
                                {u.facultadDependencia && (
                                  <>
                                    <span>•</span>
                                    <span className="truncate">{u.facultadDependencia}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 shrink-0 ml-2">
                            Seleccionar
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            ) : (
              /* Tarjeta de Solicitante Seleccionado */
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in">
                <div className="flex items-center space-x-3.5">
                  <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-black text-xs shrink-0 shadow-sm">
                    {selectedSolicitant.nombres?.charAt(0)}
                    {selectedSolicitant.apellidos?.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="text-xs font-black text-slate-900 dark:text-white">
                        {selectedSolicitant.nombres} {selectedSolicitant.apellidos}
                      </h4>
                      <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-emerald-200/80 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 text-[10px] font-extrabold">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Solicitante Confirmado</span>
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-600 dark:text-slate-300 mt-1">
                      <span className="flex items-center space-x-1">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        <span>{selectedSolicitant.email}</span>
                      </span>
                      {selectedSolicitant.facultadDependencia && (
                        <span className="flex items-center space-x-1">
                          <Building2 className="w-3.5 h-3.5 text-slate-400" />
                          <span>{selectedSolicitant.facultadDependencia}</span>
                        </span>
                      )}
                      {(selectedSolicitant.telefono || selectedSolicitant.anexo) && (
                        <span className="flex items-center space-x-1">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          <span>
                            {selectedSolicitant.telefono || 'Sin cel'}
                            {selectedSolicitant.anexo ? ` (Anexo ${selectedSolicitant.anexo})` : ''}
                          </span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleClearSolicitant}
                  className="px-3 py-1.5 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-lg border border-slate-300 dark:border-slate-700 transition-colors shrink-0 cursor-pointer flex items-center justify-center space-x-1"
                >
                  <X className="w-3.5 h-3.5 text-red-500" />
                  <span>Cambiar Usuario</span>
                </button>
              </div>
            )}
          </div>

          {/* 2. JUSTIFICACIÓN OBLIGATORIA DEL TICKET DE EMERGENCIA */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-950/30 dark:to-rose-950/30 border border-red-300 dark:border-red-900/70 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black uppercase tracking-wider text-red-800 dark:text-red-300 flex items-center space-x-1.5">
                <AlertOctagon className="w-4 h-4 text-red-600 dark:text-red-400" />
                <span>2. Justificación de la Emergencia o Regularización (Obligatorio) *</span>
              </label>
              <span className="text-[10px] font-bold text-red-600 dark:text-red-400">
                Auditoría obligatoria ITIL
              </span>
            </div>
            <textarea
              rows={2}
              required
              value={justificacionEmergencia}
              onChange={(e) => setJustificacionEmergencia(e.target.value)}
              placeholder="Indique con claridad el motivo por el cual se regulariza este ticket de emergencia (ej: 'Requerimiento urgente recibido por llamada telefónica de Decanatura por caída de red durante evento oficial en auditorio')..."
              className="w-full p-3 text-xs bg-white dark:bg-slate-900 border border-red-300 dark:border-red-800 rounded-xl focus:ring-2 focus:ring-red-500 text-slate-900 dark:text-white placeholder-slate-400 font-medium transition-all"
            />
            <p className="text-[11px] text-red-700/80 dark:text-red-300/80 leading-normal">
              Este motivo quedará visible permanentemente en la trazabilidad del ticket para conocimiento del personal técnico y supervisor.
            </p>
          </div>

          {/* 3. PARÁMETROS BÁSICOS DEL REQUERIMIENTO */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Categoría OTIC */}
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-200 block mb-1">
                Categoría de Servicio OTIC *
              </label>
              <select
                value={categoriaId}
                onChange={(e) => setCategoriaId(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-red-500 text-slate-900 dark:text-white font-medium"
              >
                {oticCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
              </select>
            </div>

            {/* Canal de Origen */}
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-200 block mb-1">
                Vía de Recepción *
              </label>
              <div className="relative">
                <select
                  value={canalOrigen}
                  onChange={(e) => setCanalOrigen(e.target.value as any)}
                  className="w-full pl-8 pr-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-red-500 text-slate-900 dark:text-white font-medium"
                >
                  <option value="TELEFONO">Llamada Telefónica / Anexo</option>
                  <option value="PRESENCIAL">Atención Presencial Inmediata</option>
                  <option value="WHATSAPP">WhatsApp Institucional</option>
                  <option value="CORREO">Correo Electrónico Urgente</option>
                </select>
                <PhoneCall className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              </div>
            </div>

            {/* Nivel de Urgencia */}
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-200 block mb-1">
                Nivel de Urgencia *
              </label>
              <select
                value={urgencia}
                onChange={(e) => setUrgencia(e.target.value as TicketUrgency)}
                className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-red-500 text-slate-900 dark:text-white font-bold"
              >
                <option value="CRITICA">CRÍTICA - Interrupción total de servicio</option>
                <option value="ALTA">ALTA - Afectación severa o urgente</option>
                <option value="MEDIA">MEDIA - Regularización ordinaria</option>
                <option value="BAJA">BAJA - Falla menor</option>
              </select>
            </div>
          </div>

          {/* 4. TÍTULO Y DESCRIPCIÓN DEL REQUERIMIENTO */}
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-200 block mb-1">
                Título o Asunto del Requerimiento *
              </label>
              <input
                type="text"
                required
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Ej: Falla intempestiva de conexión Wi-Fi en Edificio Central..."
                className="w-full px-3.5 py-2.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-red-500 text-slate-900 dark:text-white placeholder-slate-400 font-semibold"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-200 block mb-1">
                Descripción Detallada del Problema / Falla Reportada *
              </label>
              <textarea
                rows={3}
                required
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Describa de forma precisa el problema técnico ocurrido, ambiente o equipo afectado..."
                className="w-full p-3 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-red-500 text-slate-900 dark:text-white placeholder-slate-400 font-medium"
              />
            </div>
          </div>

          {/* 5. ASIGNACIÓN INMEDIATA (OPCIONAL) Y DATOS DE BIEN INSTITUCIONAL */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/60">
            {/* Asignación directa */}
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-200 block mb-1">
                Asignación de Técnico (Opcional)
              </label>
              <select
                value={tecnicoId}
                onChange={(e) => setTecnicoId(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-red-500 text-slate-900 dark:text-white font-medium"
              >
                <option value="">Dejar en cola REPORTADO (Para asignación posterior)</option>
                {oticTechnicians.map((tec) => (
                  <option key={tec.id} value={tec.id}>
                    {tec.nombres} {tec.apellidos} ({tec.rol})
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                Si selecciona un técnico, el ticket pasará directamente a estado <strong className="font-bold">ASIGNADO</strong>.
              </p>
            </div>

            {/* Bien Institucional */}
            <div className="space-y-2">
              <label className="flex items-center space-x-2 text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={esEquipo}
                  onChange={(e) => setEsEquipo(e.target.checked)}
                  className="rounded text-red-600 focus:ring-red-500 w-4 h-4"
                />
                <span className="flex items-center space-x-1.5">
                  <Laptop className="w-4 h-4 text-slate-400" />
                  <span>¿Es un equipo o bien de la institución?</span>
                </span>
              </label>

              {esEquipo && (
                <input
                  type="text"
                  value={numeroInventario}
                  onChange={(e) => setNumeroInventario(e.target.value)}
                  placeholder="Ingrese Código Patrimonial / N° de Inventario"
                  className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-red-500 text-slate-900 dark:text-white font-mono font-bold animate-in fade-in"
                />
              )}
            </div>
          </div>

          {/* 6. ADJUNTAR ARCHIVOS / EVIDENCIAS (OPCIONAL) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center space-x-1.5">
                <Upload className="w-3.5 h-3.5 text-slate-400" />
                <span>Adjuntar Evidencias, Fotos o Documentos (Opcional)</span>
              </label>
              <span className="text-[10px] text-slate-400">Máx. 5 archivos (10MB c/u)</span>
            </div>

            <div className="flex items-center space-x-3">
              <label className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 cursor-pointer flex items-center space-x-1.5 transition-all">
                <Upload className="w-3.5 h-3.5" />
                <span>Examinar archivos</span>
                <input
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                  accept="image/*,.pdf,.doc,.docx"
                />
              </label>
              {files.length > 0 && (
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  {files.length} archivo(s) seleccionado(s)
                </span>
              )}
            </div>

            {files.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {files.map((f, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-[11px] font-medium text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                  >
                    <FileText className="w-3 h-3 text-slate-400" />
                    <span className="max-w-[150px] truncate">{f.name}</span>
                    <button
                      type="button"
                      onClick={() => removeFile(i)}
                      className="text-slate-400 hover:text-red-500 ml-1 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Form Actions Footer */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-xl text-xs font-black text-white bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 shadow-md shadow-red-500/25 active:scale-95 transition-all cursor-pointer flex items-center space-x-2 disabled:opacity-50 disabled:pointer-events-none"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Registrando Emergencia...</span>
                </>
              ) : (
                <>
                  <AlertOctagon className="w-4 h-4" />
                  <span>Registrar Ticket de Emergencia</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
};
