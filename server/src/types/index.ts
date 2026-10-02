export type ModuleArea = 'OTIC' | 'SERVICIOS_GENERALES';

export type RoleCode =
  | 'ADMIN'
  | 'SUPERVISOR'
  | 'SUPERVISOR_SG'
  | 'TECNICO'
  | 'TECNICO_SG'
  | 'MESA_AYUDA'
  | 'MESA_AYUDA_SG'
  | 'SOLICITANTE';

export type TicketType =
  | 'INCIDENTE'
  | 'SOLICITUD_SERVICIO'
  | 'MANTENIMIENTO_PREVENTIVO'
  | 'MANTENIMIENTO_CORRECTIVO';

export type TicketPriority = 'BAJA' | 'MEDIA' | 'ALTA' | 'CRITICA';

export type TicketImpact = 'BAJO' | 'MEDIO' | 'ALTO';

export type TicketUrgency = 'BAJA' | 'MEDIA' | 'ALTA' | 'CRITICA';

export type TicketComplejidad = 'BAJA' | 'MEDIA' | 'ALTA' | 'COMPLEJA';

export type TicketStatus =
  | 'REPORTADO'
  | 'EVALUACION_INSPECCION'
  | 'ESPERA_MATERIALES'
  | 'ESPERA_MATERIALES_SOLICITANTE'
  | 'ASIGNADO'
  | 'EN_EJECUCION'
  | 'RESUELTO'
  | 'OBSERVADO';

export interface UserTokenPayload {
  id: number;
  email: string;
  nombres: string;
  apellidos: string;
  rol: RoleCode;
  rol_id: number;
  facultad_dependencia: string;
  cargo?: string;
  ubicacion_referencia?: string;
  telefono?: string;
  anexo?: string;
  foto_perfil?: string;
}

export interface UserDB {
  id: number;
  nombres: string;
  apellidos: string;
  email: string;
  password_hash: string;
  rol_id: number;
  rol_codigo: RoleCode;
  rol_nombre: string;
  facultad_dependencia: string;
  cargo?: string;
  debe_cambiar_password?: boolean | number;
  correo_pendiente?: boolean | number;
  ubicacion_referencia?: string;
  telefono?: string;
  anexo?: string;
  foto_perfil?: string;
  estado: 'ACTIVO' | 'INACTIVO' | 'BLOQUEADO';
  ultimo_acceso?: string;
  creado_en: string;
  promedio_calificacion?: number;
  total_calificaciones?: number;
  total_resueltos?: number;
}

export interface ServiceCategory {
  id: number;
  nombre: string;
  codigo: string;
  descripcion: string;
  icono: string;
  orden?: number;
  modulo: ModuleArea;
  sla_horas_respuesta: number;
  sla_horas_resolucion: number;
  tecnico_defecto_id?: number;
  tecnico_defecto_nombre?: string;
  activo: boolean;
}

export interface TicketDB {
  id: number;
  codigo_correlativo: string;
  modulo: ModuleArea;
  titulo: string;
  descripcion: string;
  tipo: TicketType;
  prioridad: TicketPriority;
  impacto: TicketImpact;
  urgencia: TicketUrgency;
  complejidad?: TicketComplejidad;
  estado: TicketStatus;
  solicitante_id: number;
  solicitante_nombre?: string;
  solicitante_email?: string;
  solicitante_dependencia?: string;
  solicitante_telefono?: string;
  solicitante_anexo?: string;
  solicitante_foto?: string;
  tecnico_id?: number;
  tecnico_nombre?: string;
  tecnico_email?: string;
  tecnico_foto?: string;
  tecnico_dependencia?: string;
  tecnico_cargo?: string;
  tecnico_especialidad?: string;
  tecnico_telefono?: string;
  tecnico_promedio_estrellas?: number;
  tecnico_total_calificaciones?: number;
  tecnico_total_resueltos?: number;
  categoria_id: number;
  categoria_nombre?: string;
  ubicacion_oficina?: string;
  referencia_ubicacion?: string;
  contacto_local?: string;
  horario_acceso?: string;
  subtipo_intervencion?: string;
  datos_vehiculares?: string;
  materiales_usados?: string;
  materiales_sobrantes?: string;
  canal_origen: string;
  fecha_apertura: string;
  fecha_primera_respuesta?: string;
  fecha_limite_respuesta?: string;
  fecha_limite_resolucion?: string;
  fecha_resolucion?: string;
  fecha_cierre?: string;
  cumplio_sla_respuesta?: boolean;
  cumplio_sla_resolucion?: boolean;
  solucion_detalle?: string;
  creado_en: string;
  actualizado_en: string;
  encuesta_puntuacion?: number;
  encuesta_comentario?: string;
  tecnicos_asignados?: AssignedTechnician[];
  tecnicos_adicionales?: AssignedTechnician[];
}

export interface AssignedTechnician {
  id: number;
  nombres: string;
  apellidos: string;
  nombre_completo?: string;
  email?: string;
  foto_perfil?: string;
  cargo?: string;
  especialidad?: string;
  telefono?: string;
  rol_asignacion: 'PRINCIPAL' | 'APOYO';
}

export interface TicketCommentDB {
  id: number;
  ticket_id: number;
  usuario_id: number;
  usuario_nombre: string;
  usuario_rol: RoleCode;
  mensaje: string;
  es_nota_interna: boolean;
  creado_en: string;
}

export interface AttachmentDB {
  id: number;
  ticket_id: number;
  comentario_id?: number;
  nombre_original: string;
  nombre_guardado: string;
  ruta_servidor: string;
  tamano_bytes: number;
  mime_type: string;
  subido_por_id: number;
  subido_por_nombre?: string;
  creado_en: string;
}

export interface AuditLogDB {
  id: number;
  ticket_id: number;
  ticket_codigo?: string;
  ticket_titulo?: string;
  usuario_id?: number;
  usuario_nombre?: string;
  usuario_rol?: string;
  accion: string;
  campo_modificado?: string;
  valor_anterior?: string;
  valor_nuevo?: string;
  ip_origen?: string;
  fecha: string;
}

export interface SatisfactionSurveyDB {
  id: number;
  ticket_id: number;
  ticket_codigo?: string;
  tecnico_id?: number;
  tecnico_nombre?: string;
  solicitante_id?: number;
  solicitante_nombre?: string;
  puntuacion: number;
  comentario?: string;
  fecha_encuesta: string;
}

export interface DashboardMetrics {
  totalTickets: number;
  reportados: number;
  asignados: number;
  resueltos: number;
  tiempoPromedioResolucionHoras: number;
  satisfaccionPromedio: number;
  cumplimientoSlaPorcentaje: number;
  cargaPorTecnico: {
    tecnicoId: number;
    tecnicoNombre: string;
    fotoPerfil?: string;
    asignados: number;
    resueltos: number;
    tiempoPromedioHoras: number;
    calificacionPromedio: number;
  }[];
  volumenPorCategoria: {
    categoriaId: number;
    categoriaNombre: string;
    total: number;
  }[];
  volumenPorUrgencia: {
    urgencia: string;
    total: number;
  }[];
}


