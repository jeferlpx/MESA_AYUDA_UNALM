export type ModuleArea = 'OTIC' | 'SERVICIOS_GENERALES';

export type RoleCode =
  | 'ADMIN'
  | 'SUPERVISOR'
  | 'SUPERVISOR_SG'
  | 'TECNICO'
  | 'ESPECIALISTA_REDES'
  | 'ESPECIALISTA_DESARROLLO'
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

export interface User {
  id: number;
  nombres: string;
  apellidos: string;
  email: string;
  rol: RoleCode;
  rolNombre: string;
  rolId?: number;
  facultadDependencia: string;
  ubicacionReferencia?: string;
  cargo?: string;
  especialidad?: string;
  telefono?: string;
  anexo?: string;
  fotoPerfil?: string;
  promedioCalificacion?: number;
  totalCalificaciones?: number;
  totalResueltos?: number;
  estado?: 'ACTIVO' | 'INACTIVO' | 'BLOQUEADO';
  debeCambiarPassword?: boolean;
  correoPendiente?: boolean;
  ultimoAcceso?: string;
  creadoEn?: string;
}

export interface UserAdmin extends User {
  rolId: number;
  estado: 'ACTIVO' | 'INACTIVO' | 'BLOQUEADO';
  ultimoAcceso?: string;
  creadoEn: string;
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

export interface Ticket {
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
  es_equipo?: boolean;
  numero_inventario?: string | null;
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

export interface TicketComment {
  id: number;
  ticket_id: number;
  usuario_id: number;
  usuario_nombre: string;
  usuario_rol: RoleCode;
  mensaje: string;
  es_nota_interna: boolean;
  creado_en: string;
}

export interface Attachment {
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

export type TicketAdjunto = Attachment & { ruta_archivo?: string };

export interface TicketHistorial {
  id: number;
  ticket_id: number;
  evento: string;
  detalles?: string;
  usuario_id?: number;
  usuario_nombre?: string;
  creado_en: string;
  accion?: string;
  valor_anterior?: string;
  valor_nuevo?: string;
}

export interface AuditLog {
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
  creado_en?: string;
}

export interface SatisfactionSurvey {
  id?: number;
  ticket_id: number;
  ticket_codigo?: string;
  tecnico_id?: number;
  tecnico_nombre?: string;
  solicitante_id?: number;
  solicitante_nombre?: string;
  puntuacion: number;
  comentario?: string;
  fecha_encuesta?: string;
}

export interface Technician {
  id: number;
  nombres: string;
  apellidos: string;
  email: string;
  facultadDependencia: string;
  telefono?: string;
  fotoPerfil?: string;
  rol: RoleCode;
  especialidad?: string;
  promedioCalificacion?: number;
  totalCalificaciones?: number;
  totalResueltos?: number;
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

export interface InfrastructureInspection {
  id: number;
  codigo: string;
  fecha_registro: string;
  edificio: string;
  area: string;
  inspector_nombre: string;
  responsable_area?: string | null;
  soporte_tecnico?: string | null;
  observaciones_generales?: string | null;
  total_evaluados: number;
  total_criticos: number;
  total_criticos_reales?: number;
  tickets_generados: number;
  tickets_vinculados?: number;
  created_at: string;
}

export interface InspectionFinding {
  id: number;
  inspeccion_id: number;
  categoria_codigo: string;
  categoria_nombre: string;
  item_codigo: string;
  item_nombre: string;
  estado_calificacion: 'CRITICO' | 'MANTENIMIENTO' | 'BUENO' | 'EXCELENTE' | 'NO_APLICA';
  calificacion_num: number;
  observacion?: string | null;
  accion_sugerida?: string | null;
  prioridad: 'BAJA' | 'MEDIA' | 'ALTA' | 'CRITICA';
  categoria_sg_sugerida?: string | null;
  ticket_id?: number | null;
  ticket_codigo?: string | null;
  ticket_estado?: string | null;
  created_at: string;
}

export interface MaterialSG {
  id: number;
  codigo: string;
  nombre: string;
  categoria_taller: string;
  unidad_medida: string;
  stock_actual: number;
  stock_minimo: number;
  ubicacion_almacen?: string;
  precio_unitario_estimado?: number;
  estado_stock: 'DISPONIBLE' | 'STOCK_BAJO' | 'AGOTADO';
  creado_en: string;
  actualizado_en: string;
}

export interface MaterialMovimientoSG {
  id: number;
  material_id: number;
  material_nombre?: string;
  material_codigo?: string;
  categoria_taller?: string;
  unidad_medida?: string;
  tipo_movimiento: 'ENTRADA_COMPRA' | 'ENTRADA_DEVOLUCION' | 'SALIDA_OT' | 'SALIDA_AJUSTE';
  cantidad: number;
  stock_anterior: number;
  stock_nuevo: number;
  ticket_id?: number;
  orden_trabajo_codigo?: string;
  usuario_id: number;
  usuario_nombre?: string;
  motivo?: string;
  observaciones?: string;
  fecha: string;
}

export interface MaterialesMetrics {
  total_materiales: number;
  total_agotados: number;
  total_stock_bajo: number;
  total_disponibles: number;
  total_unidades_fisicas: number;
}
