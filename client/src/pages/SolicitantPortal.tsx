import React, { useState, useEffect, useMemo, useRef } from 'react';
import { api } from '../services/api';
import { Ticket, ServiceCategory, TicketType } from '../types';
import { StatusBadge, UrgencyBadge } from '../components/Badge';
import { Modal } from '../components/Modal';
import { FileUploader } from '../components/FileUploader';
import { TicketCreatedSuccessModal, CreatedTicketPayload } from '../components/TicketCreatedSuccessModal';
import { SatisfactionSurveyModal } from '../components/SatisfactionSurveyModal';
import { TechnicianProfileModal } from '../components/TechnicianProfileModal';
import { ServiceRequestModal } from '../components/ServiceRequestModal';
import { WorkOrderModal } from '../components/WorkOrderModal';
import { getServiceIconComponent } from '../components/SvgIconPicker';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { ServiceCatalogSkeleton, TicketListSkeleton } from '../components/Skeleton';
import { SearchableDependenciaSelect } from '../components/SearchableDependenciaSelect';
import { validatePeruvianPhone, handlePhoneInputChange } from '../utils/phoneValidator';

import {
  Search,
  PlusCircle,
  HelpCircle,
  ChevronRight,
  FileText,
  AlertCircle,
  Star,
  RotateCcw,
  Clock,
  Layers,
  Inbox,
  Sparkles,
  ArrowRight,
  Filter,
  Wrench,
  Building2,
  Phone,
  Calendar,
  Truck,
  CheckCircle2,
} from 'lucide-react';

interface SolicitantPortalProps {
  onSelectTicketDetail: (ticketId: number) => void;
  viewMode?: 'all' | 'catalog' | 'my-tickets' | 'pending-surveys';
  onNavigateTab?: (tab: string) => void;
}

const SUGGESTED_SERVICE_TITLES: Record<string, string[]> = {
  // 1. GESTIÓN DE CUENTAS, ACCESOS E IDENTIDAD DIGITAL
  cuentas: [
    'Restablecimiento de Contraseña de Correo',
    'Atención de Problemas de Correo',
    'Reseteo de Clave de Intranet / Portal',
    'Soporte a Software de Firma Digital',
  ],
  // 2. SOPORTE TÉCNICO A EQUIPOS Y HARDWARE
  hardware: [
    'Diagnóstico de Falla de Encendido / Arranque',
    'Reparación y Reemplazo de Componentes',
    'Mantenimiento Preventivo de Hardware',
    'Instalación y Configuración de Impresoras/Escáneres',
    'Atención de Fallas de Impresión o Escaneo',
    'Instalación de Periféricos Especializados',
  ],
  // 3. SOFTWARE, SISTEMAS OPERATIVOS Y OFIMÁTICA
  software: [
    'Instalación de Microsoft Office / Google Workspace',
    'Instalación y Problemas con Antivirus',
    'Configuración de VPN UNALM',
    'Soporte a Herramientas de Videoconferencia',
  ],
  // 4. REDES, CONECTIVIDAD Y TELEFONÍA
  redes: [
    'Soporte de Conexión Wi-Fi Campus',
    'Habilitación / Reparación de Punto de Red (LAN)',
    'Atención por Lentitud o Corte de Internet',
    'Atención de Fallas en Teléfono IP',
  ],
  // 5. AULAS, AUDITORIOS Y EVENTOS MULTIMEDIA
  multimedia: [
    'Atención de Emergencia en Aulas / Laboratorios',
    'Soporte Técnico en Eventos Híbridos / Transmisión',
  ],
  // 6. SERVICIOS WEB, PLATAFORMAS ACADÉMICAS Y E-LEARNING
  sistemas: [
    'Atención de Inconsistencias en Aula Virtual',
    'Reporte de Errores o Caídas en Páginas Web',
  ],
  // 7. SERVICIOS DE SEGURIDAD Y RESPALDO DE INFORMACIÓN
  seguridad: [
    'Asistencia para Copia de Seguridad (Backup)',
    'Reporte de Correo Sospechoso / Phishing',
    'Atención por Infección de Malware / Ransomware',
  ],
  // SERVICIOS GENERALES (MANTENIMIENTO)
  electricidad: [
    'Mantenimiento de luminarias y fluorescentes',
    'Revisión de tomacorrientes sin energía eléctrica',
    'Corte o baja de tensión en oficina / pabellón',
    'Instalación o cambio de interruptor / llave termomagnética',
    'Reparación de tablero eléctrico y cableado',
    'Revisión de ventilador de techo o extractor de aire',
  ],
  gasfitería: [
    'Fuga de agua en servicios higiénicos / lavatorio',
    'Inodoro atorado / Desatoro de tubería y desagüe',
    'Baja presión o corte de suministro de agua potable',
    'Reparación o cambio de grifería y llaves de paso',
    'Mantenimiento de tanque elevado o bomba de agua',
  ],
  carpintería: [
    'Reparación de puerta de madera / ventana',
    'Mantenimiento y encolado de mobiliario / escritorios / sillas',
    'Confección o ajuste de estantes / repisas de madera',
    'Ajuste de bisagras, cerraduras y cajonería de oficinas',
  ],
  cerrajería: [
    'Apertura de puerta por llave trabada o extraviada',
    'Cambio o instalación de chapa / cerradura institucional',
    'Copia y duplicado de llaves de oficinas / laboratorios',
    'Mantenimiento y soldadura de rejas o portones metálicos',
  ],
  'pintura y albañilería': [
    'Resane y pintura de paredes en oficina / aula',
    'Reparación o cambio de baldosas de cielo raso',
    'Reparación de veredas, sardineles o fisuras en pisos',
    'Impermeabilización de techos ante filtraciones de lluvia',
  ],
  'áreas verdes': [
    'Poda y corte de césped en jardines / áreas verdes',
    'Retiro de ramas secas o árboles en riesgo de caída',
    'Riego, abono y fertilización de áreas verdes',
    'Limpieza de maleza y deshierbe en exteriores',
  ],
  'limpieza y saneamiento': [
    'Fumigación y control de plagas en ambientes',
    'Desinfección integral de oficinas / laboratorios',
    'Limpieza profunda y lavado de canaletas / techos',
    'Recojo de desmonte o residuos especiales de campo',
  ],
  'mecánica automotriz': [
    'Mantenimiento preventivo de vehículo institucional',
    'Revisión del sistema de frenos y dirección',
    'Cambio de aceite, filtros y fluidos vehiculares',
  ],
  general: [
    'Mantenimiento preventivo y revisión de operatividad',
    'Reparación por falla o avería imprevista',
    'Solicitud de apoyo logístico para evento académico',
    'Inspección técnica y diagnóstico en ambiente',
  ],
};

export const SolicitantPortal: React.FC<SolicitantPortalProps> = ({
  onSelectTicketDetail,
  viewMode = 'all',
  onNavigateTab,
}) => {
  const { user, updateUser } = useAuth();
  const toast = useToast();
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [myTickets, setMyTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCatalogModule, setActiveCatalogModule] = useState<'ALL' | 'OTIC' | 'SERVICIOS_GENERALES'>('ALL');
  const [activeTicketModule, setActiveTicketModule] = useState<'ALL' | 'OTIC' | 'SERVICIOS_GENERALES'>('ALL');
  const [ticketStatusFilter, setTicketStatusFilter] = useState<'ALL' | 'REPORTADO' | 'OBSERVADO' | 'ASIGNADO' | 'RESUELTO'>('ALL');

  // Modal State for Required Contact Check before Ticket Creation
  const [isRequireContactModalOpen, setIsRequireContactModalOpen] = useState(false);
  const [pendingCategoryForTicket, setPendingCategoryForTicket] = useState<ServiceCategory | null>(null);
  const [contactPhone, setContactPhone] = useState('');
  const [contactAnexo, setContactAnexo] = useState('');
  const [contactDependencia, setContactDependencia] = useState('');
  const [savingContact, setSavingContact] = useState(false);
  const [contactError, setContactError] = useState<string | null>(null);

  const contactPhoneValidation = useMemo(
    () => validatePeruvianPhone(contactPhone, true),
    [contactPhone]
  );

  // Modal State for New Ticket
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<ServiceCategory | null>(null);
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [referenciaUbicacion, setReferenciaUbicacion] = useState('');
  const [tipo, setTipo] = useState<TicketType>('INCIDENTE');
  const [urgencia, setUrgencia] = useState<'BAJA' | 'MEDIA' | 'ALTA' | 'CRITICA'>('MEDIA');
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Campos de campo para Servicios Generales
  const [contactoLocal, setContactoLocal] = useState('');
  const [horarioAcceso, setHorarioAcceso] = useState('');
  const [subtipoIntervencion, setSubtipoIntervencion] = useState('MANTENIMIENTO_CORRECTIVO');
  const [datosVehiculares, setDatosVehiculares] = useState('');
  const [materialesUsados, setMaterialesUsados] = useState('');

  // Modals
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [createdTicketInfo, setCreatedTicketInfo] = useState<CreatedTicketPayload | null>(null);
  const [titleSuggestionsOpen, setTitleSuggestionsOpen] = useState(false);
  const suggestionsBoxRef = useRef<HTMLDivElement>(null);

  // Click outside to close title suggestions
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (suggestionsBoxRef.current && !suggestionsBoxRef.current.contains(e.target as Node)) {
        setTitleSuggestionsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const [serviceRequestModalTicket, setServiceRequestModalTicket] = useState<{ ticket: Ticket; previewImageUrl?: string | null } | null>(null);
  const [workOrderModalTicket, setWorkOrderModalTicket] = useState<Ticket | null>(null);
  const [isSurveyModalOpen, setIsSurveyModalOpen] = useState(false);
  const [surveyTicket, setSurveyTicket] = useState<Ticket | null>(null);
  const [selectedTechForModal, setSelectedTechForModal] = useState<number | null>(null);
  const [reopeningTicketId, setReopeningTicketId] = useState<number | null>(null);

  // Helper to obtain suggestions strictly for current category
  const currentCategorySuggestions = useMemo(() => {
    if (!selectedCategory) return [];
    const catName = selectedCategory.nombre.toLowerCase();
    const catDesc = (selectedCategory.descripcion || '').toLowerCase();
    const catCode = (selectedCategory.codigo || '').toLowerCase();
    const fullText = `${catName} ${catDesc} ${catCode}`;

    let list: string[] = [];

    // Categorías OTIC Oficiales (7 categorías del ROF / Catálogo)
    if (fullText.includes('web') || fullText.includes('académica') || fullText.includes('academica') || fullText.includes('e-learning') || fullText.includes('elearning') || fullText.includes('aula virtual') || fullText.includes('página') || fullText.includes('pagina') || fullText.includes('sistemas') || catCode.includes('sis')) {
      list = [...SUGGESTED_SERVICE_TITLES.sistemas];
    } else if (fullText.includes('cuenta') || fullText.includes('identidad') || fullText.includes('acceso') || fullText.includes('correo') || fullText.includes('clave') || catCode.includes('cue')) {
      list = [...SUGGESTED_SERVICE_TITLES.cuentas];
    } else if (fullText.includes('hardware') || fullText.includes('equipo') || fullText.includes('impresora') || fullText.includes('periféric') || fullText.includes('periferic') || fullText.includes('disco') || fullText.includes('arranque') || catCode.includes('har')) {
      list = [...SUGGESTED_SERVICE_TITLES.hardware];
    } else if (fullText.includes('software') || fullText.includes('operativo') || fullText.includes('ofimática') || fullText.includes('ofimatica') || fullText.includes('office') || fullText.includes('vpn') || fullText.includes('antivirus') || catCode.includes('sof')) {
      list = [...SUGGESTED_SERVICE_TITLES.software];
    } else if (fullText.includes('red') || fullText.includes('conectividad') || fullText.includes('telef') || fullText.includes('wifi') || fullText.includes('internet') || fullText.includes('lan') || catCode.includes('red')) {
      list = [...SUGGESTED_SERVICE_TITLES.redes];
    } else if (fullText.includes('aula') || fullText.includes('auditorio') || fullText.includes('multimedia') || fullText.includes('evento') || fullText.includes('transmisi') || catCode.includes('mul')) {
      list = [...SUGGESTED_SERVICE_TITLES.multimedia];
    } else if (fullText.includes('seguridad') || fullText.includes('respaldo') || fullText.includes('backup') || fullText.includes('phishing') || fullText.includes('malware') || fullText.includes('ransomware') || catCode.includes('seg')) {
      list = [...SUGGESTED_SERVICE_TITLES.seguridad];
    }
    // Categorías Servicios Generales
    else if (fullText.includes('eléctric') || fullText.includes('electric') || fullText.includes('iluminac')) {
      list = [...SUGGESTED_SERVICE_TITLES.electricidad];
    } else if (fullText.includes('sanitari') || fullText.includes('gasfiter') || fullText.includes('agua')) {
      list = [...SUGGESTED_SERVICE_TITLES.gasfitería];
    } else if (fullText.includes('carpinter')) {
      list = [...SUGGESTED_SERVICE_TITLES.carpintería];
    } else if (fullText.includes('cerraj')) {
      list = [...SUGGESTED_SERVICE_TITLES.cerrajería];
    } else if (fullText.includes('civil') || fullText.includes('albañil') || fullText.includes('pintur')) {
      list = [...SUGGESTED_SERVICE_TITLES['pintura y albañilería']];
    } else if (fullText.includes('verde') || fullText.includes('jardín') || fullText.includes('jardin') || fullText.includes('forest')) {
      list = [...SUGGESTED_SERVICE_TITLES['áreas verdes']];
    } else if (fullText.includes('limpieza') || fullText.includes('saneam') || fullText.includes('residu')) {
      list = [...SUGGESTED_SERVICE_TITLES['limpieza y saneamiento']];
    } else if (fullText.includes('transporte') || fullText.includes('mudanza') || fullText.includes('vehicul') || fullText.includes('mecánic') || fullText.includes('mecanic')) {
      list = [...SUGGESTED_SERVICE_TITLES['mecánica automotriz']];
    }

    if (list.length === 0) {
      list = selectedCategory.modulo === 'SERVICIOS_GENERALES'
        ? SUGGESTED_SERVICE_TITLES.general
        : SUGGESTED_SERVICE_TITLES.sistemas;
    }

    list = Array.from(new Set(list));

    if (!titulo.trim()) {
      return list;
    }

    const q = titulo.toLowerCase().trim();
    return list.filter((item) => item.toLowerCase().includes(q));
  }, [selectedCategory, titulo]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [catRes, tickRes] = await Promise.all([
        api.getCategories(),
        api.getTickets(),
      ]);
      if (catRes.success) {
        const sorted = (catRes.data || []).sort((a: ServiceCategory, b: ServiceCategory) => (a.orden ?? 0) - (b.orden ?? 0));
        setCategories(sorted);
      }
      if (tickRes.success) {
        setMyTickets(tickRes.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenCategoryModal = (cat: ServiceCategory) => {
    // Regla: Obligatorio Celular, Anexo y Dependencia válida antes de hacer un ticket
    const isMissingPhone = !user?.telefono || user.telefono.trim().length < 9;
    const isMissingAnexo = !user?.anexo || user.anexo.trim().length === 0;
    const isMissingDep =
      !user?.facultadDependencia ||
      user.facultadDependencia.trim() === '' ||
      user.facultadDependencia.includes('#N/D');

    if (isMissingPhone || isMissingAnexo || isMissingDep) {
      setPendingCategoryForTicket(cat);
      setContactPhone(user?.telefono || '');
      setContactAnexo(user?.anexo || '');
      setContactDependencia(isMissingDep ? '' : user?.facultadDependencia || '');
      setContactError(null);
      setIsRequireContactModalOpen(true);
      return;
    }

    proceedToOpenTicketModal(cat);
  };

  const proceedToOpenTicketModal = (cat: ServiceCategory, customContact?: string) => {
    setSelectedCategory(cat);
    setTitulo('');
    setDescripcion('');
    setReferenciaUbicacion('');
    setContactoLocal(''); // Contacto de referencia extra siempre inicia en blanco como se requiere
    setHorarioAcceso('');
    setSubtipoIntervencion('MANTENIMIENTO_CORRECTIVO');
    setDatosVehiculares('');
    setMaterialesUsados('');
    setTipo(cat.modulo === 'SERVICIOS_GENERALES' ? 'SOLICITUD_SERVICIO' : 'INCIDENTE');
    setUrgencia('MEDIA');
    setFiles([]);
    setFormError(null);
    setTitleSuggestionsOpen(false);
    setIsModalOpen(true);
  };

  const handleSaveRequiredContact = async (e: React.FormEvent) => {
    e.preventDefault();
    setContactError(null);

    const isMissingDep =
      !user?.facultadDependencia ||
      user.facultadDependencia.trim() === '' ||
      user.facultadDependencia.includes('#N/D');

    if (!contactPhoneValidation.isValid) {
      setContactError(`Número de celular no válido: ${contactPhoneValidation.error}`);
      return;
    }

    if (!contactAnexo.trim()) {
      setContactError('Debe ingresar su anexo telefónico o colocar "S/A" si no cuenta con anexo físico.');
      return;
    }

    if (isMissingDep && (!contactDependencia.trim() || contactDependencia.includes('#N/D'))) {
      setContactError('Debe seleccionar su centro de labores, facultad o dependencia UNALM de la lista.');
      return;
    }

    setSavingContact(true);
    try {
      const res = await api.updateUserProfile({
        telefono: contactPhoneValidation.cleanNumber,
        anexo: contactAnexo.trim(),
        facultadDependencia: isMissingDep ? contactDependencia.trim() : undefined,
      });

      if (res.success && res.data) {
        updateUser(res.data);
        toast.success(
          'Sus datos de contacto han sido registrados en su perfil y asociados al ticket.',
          '¡Datos Guardados Exitosamente!'
        );
        setIsRequireContactModalOpen(false);

        if (pendingCategoryForTicket) {
          const contactStr = `${contactPhoneValidation.cleanNumber} / Anexo ${contactAnexo.trim()}`;
          proceedToOpenTicketModal(pendingCategoryForTicket, contactStr);
        }
      } else {
        throw new Error(res.message || 'Error al actualizar perfil');
      }
    } catch (err: any) {
      setContactError(err.message || 'No se pudieron guardar sus datos. Intente nuevamente.');
    } finally {
      setSavingContact(false);
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCategory || !titulo.trim() || !descripcion.trim()) {
      setFormError('Por favor complete los campos obligatorios marcados con (*)');
      return;
    }

    if (!contactoLocal.trim()) {
      setFormError('Por favor ingrese el contacto de referencia (N° de celular) para la atención');
      return;
    }

    if (!horarioAcceso.trim()) {
      setFormError('Por favor ingrese el horario en que el personal técnico puede acercarse a atender el caso');
      return;
    }

    setSubmitting(true);
    setFormError(null);

    try {
      const formData = new FormData();
      formData.append('titulo', titulo.trim());
      formData.append('descripcion', descripcion.trim());
      formData.append('tipo', tipo);
      formData.append('urgencia', urgencia);
      formData.append('categoriaId', String(selectedCategory.id));
      // Ubicación se obtiene automáticamente del perfil del usuario
      formData.append('ubicacionOficina', user?.facultadDependencia || 'Campus Universitario UNALM');
      if (referenciaUbicacion.trim()) {
        formData.append('referenciaUbicacion', referenciaUbicacion.trim());
      }
      if (contactoLocal.trim()) {
        formData.append('contactoLocal', contactoLocal.trim());
      }
      if (user?.telefono) {
        formData.append('telefono', user.telefono);
      }
      if (user?.anexo) {
        formData.append('anexo', user.anexo);
      }
      if (horarioAcceso.trim()) {
        formData.append('horarioAcceso', horarioAcceso.trim());
      }
      if (subtipoIntervencion.trim()) {
        formData.append('subtipoIntervencion', subtipoIntervencion.trim());
      }
      if (datosVehiculares.trim()) {
        formData.append('datosVehiculares', datosVehiculares.trim());
      }
      if (materialesUsados.trim()) {
        formData.append('materialesUsados', materialesUsados.trim());
      }
      if (files.length > 0) {
        files.forEach((f) => {
          formData.append('files', f);
        });
        formData.append('file', files[0]);
      }

      const res = await api.createTicket(formData);
      if (res.success) {
        const firstImg = files.find((f) => f.type.startsWith('image/'));
        const previewUrl = firstImg ? URL.createObjectURL(firstImg) : null;
        setCreatedTicketInfo({
          id: res.data.id,
          codigoCorrelativo: res.data.codigoCorrelativo || res.data.codigo,
          titulo: titulo.trim(),
          descripcion: descripcion.trim(),
          categoriaNombre: selectedCategory.nombre,
          urgencia: urgencia,
          modulo: selectedCategory.modulo,
          solicitanteNombre: user ? `${user.nombres} ${user.apellidos}` : 'Usuario Solicitante',
          solicitanteDependencia: user?.facultadDependencia || 'Campus Universitario UNALM',
          ubicacionOficina: user?.facultadDependencia || 'Campus Universitario UNALM',
          contactoLocal: contactoLocal.trim(),
          horarioAcceso: horarioAcceso.trim(),
          subtipoIntervencion: subtipoIntervencion.trim(),
          datosVehiculares: datosVehiculares.trim(),
          materialesUsados: materialesUsados.trim(),
          fechaApertura: res.data.fechaApertura || new Date().toISOString(),
          fechaLimiteResolucion: res.data.fechaLimiteResolucion,
          previewImageUrl: previewUrl,
        });
        setIsModalOpen(false);
        setIsSuccessModalOpen(true);
        loadData();
      }
    } catch (err: any) {
      setFormError(err.message || 'Error al registrar el requerimiento');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePrintServiceRequestFromCreated = (payload: CreatedTicketPayload) => {
    const simulatedTicket: Ticket = {
      id: payload.id,
      codigo_correlativo: payload.codigoCorrelativo,
      modulo: 'SERVICIOS_GENERALES',
      titulo: payload.titulo,
      descripcion: payload.descripcion || '',
      tipo: 'SOLICITUD_SERVICIO',
      prioridad: 'MEDIA',
      impacto: 'MEDIO',
      urgencia: (payload.urgencia as any) || 'MEDIA',
      estado: 'REPORTADO',
      solicitante_id: user?.id || 0,
      solicitante_nombre: payload.solicitanteNombre || (user ? `${user.nombres} ${user.apellidos}` : 'Usuario Solicitante'),
      solicitante_dependencia: payload.solicitanteDependencia || user?.facultadDependencia || 'Campus Universitario UNALM',
      ubicacion_oficina: payload.ubicacionOficina,
      contacto_local: payload.contactoLocal,
      horario_acceso: payload.horarioAcceso,
      subtipo_intervencion: payload.subtipoIntervencion,
      datos_vehiculares: payload.datosVehiculares,
      materiales_usados: payload.materialesUsados,
      categoria_id: 0,
      categoria_nombre: payload.categoriaNombre,
      canal_origen: 'PORTAL_WEB',
      fecha_apertura: payload.fechaApertura || new Date().toISOString(),
      creado_en: new Date().toISOString(),
      actualizado_en: new Date().toISOString(),
    };
    setServiceRequestModalTicket({ ticket: simulatedTicket, previewImageUrl: payload.previewImageUrl });
  };

  const handlePrintWorkOrderFromCreated = (payload: CreatedTicketPayload) => {
    const simulatedTicket: Ticket = {
      id: payload.id,
      codigo_correlativo: payload.codigoCorrelativo,
      modulo: 'SERVICIOS_GENERALES',
      titulo: payload.titulo,
      descripcion: payload.descripcion || '',
      tipo: 'SOLICITUD_SERVICIO',
      prioridad: 'MEDIA',
      impacto: 'MEDIO',
      urgencia: (payload.urgencia as any) || 'MEDIA',
      estado: 'REPORTADO',
      solicitante_id: user?.id || 0,
      solicitante_nombre: payload.solicitanteNombre || (user ? `${user.nombres} ${user.apellidos}` : 'Usuario Solicitante'),
      solicitante_dependencia: payload.solicitanteDependencia || user?.facultadDependencia || 'Campus Universitario UNALM',
      ubicacion_oficina: payload.ubicacionOficina,
      contacto_local: payload.contactoLocal,
      horario_acceso: payload.horarioAcceso,
      subtipo_intervencion: payload.subtipoIntervencion,
      datos_vehiculares: payload.datosVehiculares,
      materiales_usados: payload.materialesUsados,
      categoria_id: 0,
      categoria_nombre: payload.categoriaNombre,
      canal_origen: 'PORTAL_WEB',
      fecha_apertura: payload.fechaApertura || new Date().toISOString(),
      creado_en: new Date().toISOString(),
      actualizado_en: new Date().toISOString(),
    };
    setWorkOrderModalTicket(simulatedTicket);
  };

  const handleOpenSurvey = (t: Ticket, e: React.MouseEvent) => {
    e.stopPropagation();
    setSurveyTicket(t);
    setIsSurveyModalOpen(true);
  };

  const handleSurveySuccess = () => {
    setIsSurveyModalOpen(false);
    setSurveyTicket(null);
    loadData();
  };

  const handleConfirmReopen = async (ticketId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await api.reopenTicket(ticketId, 'Reapertura solicitada por el usuario desde el portal web');
      if (res.success) {
        setReopeningTicketId(null);
        toast.success('El ticket ha sido reabierto para atención técnica.', 'Reapertura Registrada');
        loadData();
      }
    } catch (err: any) {
      toast.error(err.message || 'Error al reabrir ticket', 'No se pudo reabrir');
    }
  };

  const isEligibleForReopen = (ticket: Ticket): boolean => {
    if (ticket.estado !== 'RESUELTO' || !ticket.fecha_resolucion) return false;
    const diffMs = Date.now() - new Date(ticket.fecha_resolucion).getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    return diffDays <= 5;
  };

  // Filtrado de categorías para el catálogo
  const filteredCategories = categories.filter((cat) => {
    const matchesModule = activeCatalogModule === 'ALL' || cat.modulo === activeCatalogModule;
    const matchesSearch =
      cat.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cat.descripcion.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cat.codigo.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesModule && matchesSearch;
  });

  const countOTICCategories = categories.filter((c) => c.modulo === 'OTIC' || !c.modulo).length;
  const countSGCategories = categories.filter((c) => c.modulo === 'SERVICIOS_GENERALES').length;

  // Filtrado de tickets para mis requerimientos
  const filteredTickets = myTickets.filter((t) => {
    const matchesModule = activeTicketModule === 'ALL' || t.modulo === activeTicketModule;
    const matchesStatus = ticketStatusFilter === 'ALL' || t.estado === ticketStatusFilter;
    return matchesModule && matchesStatus;
  });

  // Contadores por estado
  const countReportados = myTickets.filter((t) => (activeTicketModule === 'ALL' || t.modulo === activeTicketModule) && t.estado === 'REPORTADO').length;
  const countObservados = myTickets.filter((t) => (activeTicketModule === 'ALL' || t.modulo === activeTicketModule) && t.estado === 'OBSERVADO').length;
  const countAsignados = myTickets.filter((t) => (activeTicketModule === 'ALL' || t.modulo === activeTicketModule) && t.estado === 'ASIGNADO').length;
  const countResueltos = myTickets.filter((t) => (activeTicketModule === 'ALL' || t.modulo === activeTicketModule) && t.estado === 'RESUELTO').length;

  // Tickets resueltos pendientes de calificar
  const pendingSurveyTickets = myTickets.filter(
    (t) => t.solicitante_id === user?.id && t.estado === 'RESUELTO' && (!t.encuesta_puntuacion || t.encuesta_puntuacion === 0)
  );

  const showCatalogSection = viewMode === 'catalog' || viewMode === 'all';
  const showTicketsSection = viewMode === 'my-tickets' || viewMode === 'all';
  const showPendingSurveysSection = viewMode === 'pending-surveys';

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 py-6">
      {/* =========================================================================
         SECCIÓN 1: CATÁLOGO DE SERVICIOS
         ========================================================================= */}
      {showCatalogSection && (
        <div className="space-y-6">
          {/* Institutional Banner */}
          <div className="bg-gradient-to-r from-unalm-700 via-slate-800 to-amber-800 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
            <div className="max-w-3xl relative z-10">
              <span className="text-xs font-extrabold uppercase tracking-wider text-amber-300 bg-black/30 px-3 py-1 rounded-full inline-block mb-3 border border-amber-300/30">
                Soporte de servicios tecnológicos y servicios generales y mantenimiento
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                ¿En qué servicio o requerimiento podemos ayudarte hoy?
              </h1>
              <p className="text-sm text-slate-300 mt-2 font-medium">
                Selecciona la categoría correspondiente para registrar una incidencia o solicitar un servicio oficial.
              </p>

              {/* Quick Search */}
              <div className="mt-6 relative">
                <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar servicio (Ej: Wi-Fi, Electricidad, Gasfitería, Correo, SIRA, Pintura, Climatización)..."
                  className="w-full pl-12 pr-4 py-3.5 bg-white text-slate-900 placeholder-slate-400 rounded-2xl shadow-lg focus:outline-none focus:ring-2 focus:ring-amber-300 text-sm font-medium"
                />
              </div>
            </div>
          </div>

          {/* Module Selector Tabs for Catalog */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
            <div className="flex items-center space-x-2 bg-slate-100 p-1.5 rounded-2xl overflow-x-auto">
              <button
                type="button"
                onClick={() => setActiveCatalogModule('ALL')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer ${
                  activeCatalogModule === 'ALL'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>🌐 Todos los Servicios</span>
                <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full font-mono font-bold">
                  {categories.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveCatalogModule('OTIC')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer ${
                  activeCatalogModule === 'OTIC'
                    ? 'bg-unalm-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>💻 Tecnologías de Información (OTIC)</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                  activeCatalogModule === 'OTIC' ? 'bg-unalm-800 text-white' : 'bg-slate-200 text-slate-700'
                }`}>
                  {countOTICCategories}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveCatalogModule('SERVICIOS_GENERALES')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer ${
                  activeCatalogModule === 'SERVICIOS_GENERALES'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>🏗️ Servicios Generales & Mantenimiento</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                  activeCatalogModule === 'SERVICIOS_GENERALES' ? 'bg-amber-800 text-white' : 'bg-slate-200 text-slate-700'
                }`}>
                  {countSGCategories}
                </span>
              </button>
            </div>

            <span className="text-xs text-slate-500 font-bold bg-slate-100 px-3 py-1.5 rounded-xl">
              {filteredCategories.length} Servicios Disponibles
            </span>
          </div>

          {/* Service Catalog Grid */}
          <div>
            {loading ? (
              <ServiceCatalogSkeleton count={6} />
            ) : filteredCategories.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 text-slate-500 space-y-2">
                <Inbox className="w-10 h-10 mx-auto text-slate-300" />
                <p className="font-bold">No se encontraron servicios con el término de búsqueda ingresado.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredCategories.map((cat) => {
                  const IconComp = getServiceIconComponent(cat.icono);
                  const isSG = cat.modulo === 'SERVICIOS_GENERALES';
                  return (
                    <button
                      key={cat.id}
                      onClick={() => handleOpenCategoryModal(cat)}
                      className="flex flex-col text-left p-6 bg-white border border-slate-200 rounded-3xl shadow-xs hover:shadow-lg hover:border-unalm-500 transition-all duration-200 group relative overflow-hidden cursor-pointer"
                    >
                      <div className="flex items-center justify-between w-full mb-3">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors shadow-xs ${
                          isSG
                            ? 'bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white'
                            : 'bg-unalm-50 text-unalm-600 group-hover:bg-unalm-600 group-hover:text-white'
                        }`}>
                          <IconComp className="w-6 h-6" />
                        </div>
                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-lg border ${
                          isSG
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        }`}>
                          {isSG ? '🏗️ Serv. Generales' : '💻 OTIC'}
                        </span>
                      </div>
                      <h3 className="font-extrabold text-slate-900 text-base group-hover:text-unalm-700 transition-colors">
                        {cat.nombre}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed flex-1">
                        {cat.descripcion}
                      </p>
                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-unalm-600 group-hover:text-unalm-700">
                        <span>Registrar Requerimiento</span>
                        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
         SECCIÓN 2: HISTORIAL DE MIS REQUERIMIENTOS
         ========================================================================= */}
      {showTicketsSection && (
        <div className="space-y-6 pt-6 border-t border-slate-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900">
                Mis Requerimientos Registrados
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Consulta el estado y seguimiento de todos tus tickets institucionales.
              </p>
            </div>

            {onNavigateTab && viewMode === 'my-tickets' && (
              <button
                onClick={() => onNavigateTab('catalog')}
                className="px-5 py-2.5 bg-unalm-600 hover:bg-unalm-700 text-white rounded-2xl text-xs font-extrabold shadow-md transition-all flex items-center space-x-2 shrink-0 self-start sm:self-auto cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Registrar Nuevo Requerimiento</span>
              </button>
            )}
          </div>

          {/* Module Filter Tabs for My Tickets */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 md:flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setActiveTicketModule('ALL')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all text-center cursor-pointer ${
                  activeTicketModule === 'ALL'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Todos ({myTickets.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTicketModule('OTIC')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all text-center cursor-pointer ${
                  activeTicketModule === 'OTIC'
                    ? 'bg-unalm-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                💻 OTIC ({myTickets.filter((t) => t.modulo === 'OTIC' || !t.modulo).length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTicketModule('SERVICIOS_GENERALES')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all text-center cursor-pointer ${
                  activeTicketModule === 'SERVICIOS_GENERALES'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                🏗️ Servicios Generales ({myTickets.filter((t) => t.modulo === 'SERVICIOS_GENERALES').length})
              </button>
            </div>

            {/* Status Filter Tabs */}
            <div className="grid grid-cols-2 sm:grid-cols-5 md:flex md:items-center gap-1.5 md:gap-1 bg-slate-100 p-1.5 md:p-1 rounded-2xl md:rounded-xl w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setTicketStatusFilter('ALL')}
                className={`col-span-2 sm:col-span-1 px-3 py-2 md:py-1.5 rounded-lg text-xs font-bold transition-all text-center cursor-pointer ${
                  ticketStatusFilter === 'ALL' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Todos ({myTickets.filter((t) => activeTicketModule === 'ALL' || t.modulo === activeTicketModule).length})
              </button>
              <button
                type="button"
                onClick={() => setTicketStatusFilter('REPORTADO')}
                className={`w-full px-3 py-2 md:py-1.5 rounded-lg text-xs font-bold transition-all text-center cursor-pointer ${
                  ticketStatusFilter === 'REPORTADO' ? 'bg-amber-500 text-slate-950 shadow-xs font-extrabold' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Reportados ({countReportados})
              </button>
              <button
                type="button"
                onClick={() => setTicketStatusFilter('OBSERVADO')}
                className={`w-full px-3 py-2 md:py-1.5 rounded-lg text-xs font-bold transition-all text-center cursor-pointer ${
                  ticketStatusFilter === 'OBSERVADO' ? 'bg-amber-600 text-white shadow-xs font-extrabold' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Observados ({countObservados})
              </button>
              <button
                type="button"
                onClick={() => setTicketStatusFilter('ASIGNADO')}
                className={`w-full px-3 py-2 md:py-1.5 rounded-lg text-xs font-bold transition-all text-center cursor-pointer ${
                  ticketStatusFilter === 'ASIGNADO' ? 'bg-blue-600 text-white shadow-xs font-extrabold' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Asignados ({countAsignados})
              </button>
              <button
                type="button"
                onClick={() => setTicketStatusFilter('RESUELTO')}
                className={`w-full px-3 py-2 md:py-1.5 rounded-lg text-xs font-bold transition-all text-center cursor-pointer ${
                  ticketStatusFilter === 'RESUELTO' ? 'bg-emerald-600 text-white shadow-xs font-extrabold' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Resueltos ({countResueltos})
              </button>
            </div>
          </div>

          {/* Tickets List */}
          {loading ? (
            <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
              <TicketListSkeleton count={4} />
            </div>
          ) : filteredTickets.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 text-slate-500 space-y-2">
              <Inbox className="w-10 h-10 mx-auto text-slate-300" />
              <p className="font-bold">No tienes requerimientos registrados con este filtro.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTickets.map((ticket) => {
                const isSG = ticket.modulo === 'SERVICIOS_GENERALES';
                return (
                  <div
                    key={ticket.id}
                    onClick={() => onSelectTicketDetail(ticket.id)}
                    className="p-5 bg-white border border-slate-200 rounded-3xl shadow-xs hover:shadow-md hover:border-slate-300 transition-all flex flex-col md:flex-row md:items-center md:justify-between gap-4 cursor-pointer group"
                  >
                    <div className="space-y-2 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`font-mono text-xs font-extrabold px-2.5 py-0.5 rounded-lg border ${
                          isSG
                            ? 'bg-amber-50 text-amber-900 border-amber-200'
                            : 'bg-unalm-50 text-unalm-700 border-unalm-200'
                        }`}>
                          {ticket.codigo_correlativo}
                        </span>
                        <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-lg">
                          {ticket.categoria_nombre}
                        </span>
                        <StatusBadge status={ticket.estado} />
                        <UrgencyBadge urgency={ticket.urgencia} />
                      </div>

                      <h3 className="font-bold text-slate-900 text-sm group-hover:text-unalm-700 transition-colors truncate">
                        {ticket.titulo}
                      </h3>

                      <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-500 font-medium">
                        <div className="flex items-center space-x-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>
                            {new Date(ticket.fecha_apertura).toLocaleDateString('es-PE', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>

                        {ticket.ubicacion_oficina && (
                          <div className="flex items-center space-x-1">
                            <Building2 className="w-3.5 h-3.5 text-slate-400" />
                            <span className="truncate max-w-xs">{ticket.ubicacion_oficina}</span>
                          </div>
                        )}

                        {ticket.tecnico_nombre && (
                          <div className="flex items-center space-x-1 text-unalm-700 font-bold flex-wrap">
                            <span>
                              {ticket.tecnicos_adicionales && ticket.tecnicos_adicionales.length > 0
                                ? `Especialistas: ${ticket.tecnico_nombre} (+ ${ticket.tecnicos_adicionales.map((a) => a.nombre_completo || a.nombres).join(', ')})`
                                : `Especialista: ${ticket.tecnico_nombre}`}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0 self-end md:self-center">
                      {ticket.estado === 'RESUELTO' && (!ticket.encuesta_puntuacion || ticket.encuesta_puntuacion === 0) && (
                        <button
                          type="button"
                          onClick={(e) => handleOpenSurvey(ticket, e)}
                          className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center space-x-1 cursor-pointer"
                        >
                          <Star className="w-3.5 h-3.5 fill-slate-950" />
                          <span>Calificar</span>
                        </button>
                      )}

                      {isEligibleForReopen(ticket) && (
                        <button
                          type="button"
                          onClick={(e) => handleConfirmReopen(ticket.id, e)}
                          className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs rounded-xl transition-colors flex items-center space-x-1 cursor-pointer"
                          title="Reabrir ticket dentro de los 5 días posteriores a la resolución"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Reabrir</span>
                        </button>
                      )}

                      <span className="text-xs font-bold text-slate-400 group-hover:text-unalm-600 flex items-center space-x-1">
                        <span>Ver Detalle</span>
                        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
         SECCIÓN 3: CALIFICACIONES PENDIENTES
         ========================================================================= */}
      {showPendingSurveysSection && (
        <div className="space-y-6 pt-2 animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 flex items-center space-x-2.5">
                <Star className="w-6 h-6 fill-amber-400 text-amber-500" />
                <span>Calificaciones Pendientes de Servicio</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Tu opinión es fundamental para evaluar el desempeño y calidad de atención de nuestros técnicos y especialistas.
              </p>
            </div>

            {onNavigateTab && (
              <button
                onClick={() => onNavigateTab('my-tickets')}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 shrink-0 self-start sm:self-auto cursor-pointer"
              >
                <span>Ver Todos Mis Requerimientos</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>

          {pendingSurveyTickets.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 text-slate-500 space-y-3">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <p className="font-extrabold text-slate-800 text-sm">¡Al día! No tienes solicitudes pendientes de calificación</p>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Todos tus requerimientos atendidos han sido calificados. Muchas gracias por contribuir a la mejora continua del servicio.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingSurveyTickets.map((st) => (
                <div
                  key={st.id}
                  className="bg-white p-5 rounded-3xl border-2 border-amber-200 hover:border-amber-400 shadow-xs hover:shadow-md transition-all flex flex-col justify-between gap-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-black px-2.5 py-0.5 rounded-lg bg-amber-50 text-amber-900 border border-amber-200">
                        {st.codigo_correlativo}
                      </span>
                      <span className="text-[11px] font-bold text-slate-400">
                        Resuelto el {st.fecha_resolucion ? new Date(st.fecha_resolucion).toLocaleDateString('es-PE') : 'Recientemente'}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-slate-900 leading-snug">
                      {st.titulo}
                    </h3>

                    <div className="text-xs text-slate-500 space-y-0.5">
                      <p>
                        <strong className="text-slate-700">Categoría:</strong> {st.categoria_nombre}
                      </p>
                      <p>
                        <strong className="text-slate-700">Especialista que atendió:</strong>{' '}
                        <span className="text-unalm-700 font-bold">
                          {st.tecnico_nombre || (st.modulo === 'SERVICIOS_GENERALES' ? 'Especialista Serv. Generales' : 'Especialista OTIC')}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => onSelectTicketDetail(st.id)}
                      className="text-xs font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
                    >
                      Ver Detalle
                    </button>

                    <button
                      type="button"
                      onClick={(e) => handleOpenSurvey(st, e)}
                      className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all flex items-center space-x-1.5 cursor-pointer hover:scale-105"
                    >
                      <Star className="w-4 h-4 fill-slate-950" />
                      <span>Calificar Servicio Ahora</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
         MODAL: REGISTRAR NUEVO REQUERIMIENTO
         ========================================================================= */}
      {selectedCategory && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={`Crear Ticket: ${selectedCategory.nombre}`}
          subtitle="Complete la información del requerimiento técnico"
          maxWidth="xl"
        >
          <form onSubmit={handleCreateTicket} className="space-y-4">
            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-bold flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {/* Módulo Tag */}
            <div className="flex items-center justify-between pb-1 border-b border-slate-100">
              <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-lg border ${
                selectedCategory.modulo === 'SERVICIOS_GENERALES'
                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                  : 'bg-emerald-50 text-emerald-800 border-emerald-200'
              }`}>
                {selectedCategory.modulo === 'SERVICIOS_GENERALES' ? '🏗️ Servicios Generales' : '💻 Tecnologías de Información (OTIC)'}
              </span>

              <span className="text-xs text-slate-500 font-semibold">
                Solicitante: <strong className="text-slate-800">{user?.nombres} {user?.apellidos}</strong>
              </span>
            </div>

            {/* Título del Requerimiento con sugerencias predictivas */}
            <div className="relative" ref={suggestionsBoxRef}>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700">
                  Título del Requerimiento *
                </label>
                {currentCategorySuggestions.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setTitleSuggestionsOpen(!titleSuggestionsOpen)}
                    className="text-[11px] text-unalm-600 hover:text-unalm-800 font-bold flex items-center space-x-1 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>Sugerencias frecuentes</span>
                  </button>
                )}
              </div>

              <input
                type="text"
                required
                value={titulo}
                onChange={(e) => {
                  setTitulo(e.target.value);
                  if (!titleSuggestionsOpen && e.target.value.length > 0) {
                    setTitleSuggestionsOpen(true);
                  }
                }}
                onFocus={() => {
                  if (currentCategorySuggestions.length > 0) {
                    setTitleSuggestionsOpen(true);
                  }
                }}
                placeholder="Escriba libremente el título o el problema que presenta..."
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-unalm-500 focus:outline-none font-medium text-slate-900 placeholder-slate-400"
              />

              {/* Suggestions Dropdown (Only appears if user focuses and matches are found) */}
              {titleSuggestionsOpen && currentCategorySuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 p-2 max-h-52 overflow-y-auto space-y-1 animate-in fade-in slide-in-from-top-1">
                  <div className="px-2 py-1 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center justify-between border-b border-slate-100">
                    <span>Sugerencias rápidas para esta categoría</span>
                    <button
                      type="button"
                      onClick={() => setTitleSuggestionsOpen(false)}
                      className="text-slate-400 hover:text-slate-600 text-xs font-bold"
                    >
                      ✕
                    </button>
                  </div>
                  {currentCategorySuggestions.map((sug, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setTitulo(sug);
                        setTitleSuggestionsOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs font-medium text-slate-700 hover:bg-unalm-50 hover:text-unalm-800 transition-colors flex items-center space-x-2 cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span className="truncate">{sug}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Ubicación institucional y Nivel de Urgencia (Grid 2 columnas) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-start space-x-3 text-xs">
                <Building2 className="w-4 h-4 text-unalm-600 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <span className="text-[11px] text-slate-400 font-bold block">Ubicación Institucional del Solicitante:</span>
                  <span className="font-bold text-slate-800 block truncate">
                    {user?.facultadDependencia || 'Campus Universitario UNALM'}
                  </span>
                  {user?.ubicacionReferencia && (
                    <span className="text-[10px] text-slate-500 font-medium block truncate mt-0.5">
                      📍 Ref: {user.ubicacionReferencia}
                    </span>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nivel de Urgencia *
                </label>
                <select
                  value={urgencia}
                  onChange={(e) => setUrgencia(e.target.value as any)}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-unalm-500 focus:outline-none bg-white shadow-2xs"
                >
                  <option value="BAJA">Baja — Puede esperar atención programada</option>
                  <option value="MEDIA">Media — Afectación parcial de actividades</option>
                  <option value="ALTA">Alta — Afectación total de labores / Urgente</option>
                  <option value="CRITICA">Crítica — Emergencia operativa / Clases / Servidores</option>
                </select>
              </div>
            </div>

            {/* Contacto de Referencia y Horario Preferente para Atención Técnica (Obligatorios) */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center space-x-1.5">
                  <Phone className="w-3.5 h-3.5 text-unalm-600" />
                  <span>Contacto de Referencia & Horario para Atención Técnica *</span>
                </span>
                <span className="text-[10px] text-amber-800 bg-amber-100 border border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800 px-2 py-0.5 rounded-md font-bold">
                  Obligatorio
                </span>
              </div>

              {/* Número de celular del solicitante registrado en su perfil institucional */}
              <div className="p-2.5 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/60 flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-2">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 rounded-lg bg-emerald-600/15 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
                    <Phone className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <span className="text-slate-600 dark:text-slate-300 font-medium mr-1.5">N° de Celular Registrado en su Perfil:</span>
                    <span className="font-extrabold text-slate-900 dark:text-white">
                      {user?.telefono || 'No registrado en perfil'}
                    </span>
                    {user?.anexo && (
                      <span className="text-slate-500 dark:text-slate-400 font-normal ml-1">
                        (Anexo {user.anexo})
                      </span>
                    )}
                  </div>
                </div>
                <span className="text-[10px] text-emerald-700 dark:text-emerald-300 font-bold bg-white/80 dark:bg-slate-800 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-700 self-start sm:self-auto">
                  Registrado en Perfil
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                      Contacto de Referencia (N° de Celular) *
                    </label>
                    <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.2 rounded border border-amber-200 dark:border-amber-800">
                      Contacto Extra
                    </span>
                  </div>
                  <input
                    type="text"
                    required
                    value={contactoLocal}
                    onChange={(e) => setContactoLocal(e.target.value)}
                    placeholder="Ej: 998 877 665 / Celular adicional"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-xs bg-white dark:bg-slate-900 focus:ring-2 focus:ring-unalm-500 focus:outline-none font-medium text-slate-900 dark:text-white shadow-2xs"
                  />
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 block">
                    N° telefónico extra o alternativo de referencia para coordinar la visita técnica.
                  </span>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Horario para que el Técnico se Acerque *
                  </label>
                  <input
                    type="text"
                    required
                    value={horarioAcceso}
                    onChange={(e) => setHorarioAcceso(e.target.value)}
                    placeholder="Ej: Lun-Vie 8:00 AM - 1:00 PM o Hoy desde 2:00 PM"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white focus:ring-2 focus:ring-unalm-500 focus:outline-none font-medium text-slate-900 shadow-2xs"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Horario de disponibilidad en su oficina o ambiente para atender el caso.
                  </span>
                </div>
              </div>
            </div>

            {/* Descripción Detallada */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Descripción Detallada del Requerimiento *
              </label>
              <textarea
                required
                rows={4}
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Describa con precisión la falla técnica o el requerimiento solicitado..."
                className="w-full p-3 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-unalm-500 focus:outline-none font-medium"
              />
            </div>

            {/* Adjuntar Archivos o Evidencias */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Adjuntar Evidencias, Fotos o Documentos (Opcional)
              </label>
              <FileUploader
                files={files}
                onFilesChange={setFiles}
                maxFiles={5}
                maxSizeBytes={10 * 1024 * 1024}
              />
            </div>

            {/* Submit Buttons */}
            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2 bg-gradient-to-r from-unalm-600 to-unalm-700 hover:from-unalm-500 hover:to-unalm-600 text-white text-xs font-extrabold rounded-xl shadow-md transition-all flex items-center space-x-2 disabled:opacity-50 cursor-pointer"
              >
                {submitting ? (
                  <span>Emitiendo Ticket...</span>
                ) : (
                  <>
                    <PlusCircle className="w-4 h-4" />
                    <span>Registrar Ticket Oficial</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Success Notification Modal */}
      {isSuccessModalOpen && createdTicketInfo && (
        <TicketCreatedSuccessModal
          isOpen={isSuccessModalOpen}
          onClose={() => {
            setIsSuccessModalOpen(false);
            setCreatedTicketInfo(null);
          }}
          ticketData={createdTicketInfo}
          onViewTicket={(ticketId) => {
            setIsSuccessModalOpen(false);
            onSelectTicketDetail(ticketId);
          }}
          onPrintServiceRequest={handlePrintServiceRequestFromCreated}
          onPrintWorkOrder={handlePrintWorkOrderFromCreated}
        />
      )}

      {/* Official SG Modals */}
      {serviceRequestModalTicket && (
        <ServiceRequestModal
          isOpen={Boolean(serviceRequestModalTicket)}
          onClose={() => setServiceRequestModalTicket(null)}
          ticket={serviceRequestModalTicket.ticket}
          previewImageUrl={serviceRequestModalTicket.previewImageUrl}
        />
      )}

      {workOrderModalTicket && (
        <WorkOrderModal
          isOpen={Boolean(workOrderModalTicket)}
          onClose={() => setWorkOrderModalTicket(null)}
          ticket={workOrderModalTicket}
        />
      )}

      {/* Satisfaction Survey Modal */}
      {surveyTicket && (
        <SatisfactionSurveyModal
          isOpen={isSurveyModalOpen}
          onClose={() => {
            setIsSurveyModalOpen(false);
            setSurveyTicket(null);
          }}
          ticketId={surveyTicket.id}
          ticketCodigo={surveyTicket.codigo_correlativo}
          tecnicoNombre={surveyTicket.tecnico_nombre || 'Especialista OTIC'}
          tecnicoFoto={surveyTicket.tecnico_foto}
          tecnicoPromedio={5.0}
          onSurveySubmitted={handleSurveySuccess}
        />
      )}

      {/* Technician Profile Modal */}
      {selectedTechForModal && (
        <TechnicianProfileModal
          isOpen={Boolean(selectedTechForModal)}
          onClose={() => setSelectedTechForModal(null)}
          technicianId={selectedTechForModal}
        />
      )}

      {/* Modal Obligatorio de Actualización de Celular, Anexo y Dependencia antes de crear Ticket */}
      <Modal
        isOpen={isRequireContactModalOpen}
        onClose={() => {
          setIsRequireContactModalOpen(false);
          setPendingCategoryForTicket(null);
        }}
        title="Datos de Contacto Requeridos"
        subtitle="Complete sus datos para brindar atención presencial y telefónica a su requerimiento"
        maxWidth="2xl"
      >
        <form onSubmit={handleSaveRequiredContact} className="p-6 sm:p-7 space-y-5">
          <div className="p-4 sm:p-5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start space-x-3.5 text-xs sm:text-sm text-emerald-950 shadow-xs">
            <Phone className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-black text-emerald-950 text-sm sm:text-base mb-1">
                Datos de Comunicación Directa • Registro Obligatorio
              </p>
              <p className="text-xs sm:text-sm text-emerald-800 leading-relaxed font-medium">
                Estimado(a) usuario, para que el personal técnico de OTIC y Servicios Generales pueda comunicarse oportunamente con usted y acudir a su ambiente de trabajo, necesitamos sus datos de contacto. Se registrarán automáticamente en su perfil y en este ticket, por lo que en futuros requerimientos ya no se los volveremos a pedir.
              </p>
            </div>
          </div>

          {contactError && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs sm:text-sm text-rose-700 flex items-center space-x-3 font-semibold">
              <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
              <span>{contactError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs sm:text-sm font-bold text-slate-800">
                  Celular *
                </label>
                <span className="text-xs text-slate-500 font-medium">9 dígitos (MTC)</span>
              </div>
              <div className="relative">
                <input
                  type="tel"
                  required
                  value={contactPhone}
                  onChange={(e) => setContactPhone(handlePhoneInputChange(e.target.value))}
                  placeholder="Ej: 998 877 665"
                  maxLength={11}
                  className={`w-full px-4 py-2.5 pr-10 border rounded-2xl text-sm font-semibold focus:outline-none focus:ring-2 transition-all ${
                    contactPhone.trim().length === 0
                      ? 'border-slate-300 focus:ring-emerald-500'
                      : contactPhoneValidation.isValid
                      ? 'border-emerald-500 bg-emerald-50/20 text-emerald-900'
                      : 'border-rose-400 bg-rose-50/20 text-rose-900'
                  }`}
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  {contactPhone.trim().length > 0 && (
                    contactPhoneValidation.isValid ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-rose-500" />
                    )
                  )}
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Número móvil donde se coordinará la atención técnica.
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs sm:text-sm font-bold text-slate-800">
                  Anexo *
                </label>
                <span className="text-xs text-slate-500 font-medium">Central UNALM</span>
              </div>
              <input
                type="text"
                required
                value={contactAnexo}
                onChange={(e) => setContactAnexo(e.target.value)}
                placeholder="Ej: 234 o 'S/A' si no tiene"
                className="w-full px-4 py-2.5 border border-slate-300 rounded-2xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <p className="text-xs text-slate-500 mt-1">
                Si no cuenta con teléfono fijo en oficina, digite S/A.
              </p>
            </div>
          </div>

          {/* Dependencia Si falta o tiene #N/D */}
          {(!user?.facultadDependencia || user.facultadDependencia.trim() === '' || user.facultadDependencia.includes('#N/D')) && (
            <div className="pt-2">
              <label className="block text-xs sm:text-sm font-bold text-slate-800 mb-1">
                Ubicación de Centro de Labores / Dependencia *
              </label>
              <p className="text-xs sm:text-sm text-slate-600 mb-2">
                Ingrese su ubicación de centro de labores, dependencia, área o facultad en el recuadro interactivo:
              </p>
              <SearchableDependenciaSelect
                value={contactDependencia}
                onChange={(val) => {
                  setContactDependencia(val);
                  if (contactError) setContactError(null);
                }}
                label="Facultad o Dependencia UNALM"
                placeholder="Escriba su facultad, dirección, departamento o área..."
                required={true}
                theme="light"
              />
            </div>
          )}

          <div className="pt-5 flex items-center justify-end space-x-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                setIsRequireContactModalOpen(false);
                setPendingCategoryForTicket(null);
              }}
              className="px-5 py-2.5 text-xs sm:text-sm font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-2xl transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={savingContact}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-black rounded-2xl shadow-md shadow-emerald-700/20 transition-all flex items-center space-x-2.5 disabled:opacity-50 cursor-pointer"
            >
              {savingContact ? (
                <span>Guardando...</span>
              ) : (
                <>
                  <span>Guardar y Continuar con el Ticket</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};