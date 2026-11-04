import { dbPool } from '../config/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import fs from 'fs';
import {
  TicketDB,
  TicketStatus,
  RoleCode,
  ModuleArea,
  TicketCommentDB,
  AttachmentDB,
  AuditLogDB,
  TicketComplejidad,
  DashboardMetrics,
  AssignedTechnician,
} from '../types';
import { calculateSLADeadlines } from '../utils/sla';

export class TicketModel {
  static async findById(id: number): Promise<TicketDB | null> {
    const [rows] = await dbPool.query<RowDataPacket[]>(
      `SELECT t.*,
              CONCAT(sol.nombres, ' ', sol.apellidos) as solicitante_nombre,
              sol.email as solicitante_email,
              sol.facultad_dependencia as solicitante_dependencia,
              sol.telefono as solicitante_telefono,
              sol.anexo as solicitante_anexo,
              sol.foto_perfil as solicitante_foto,
              CONCAT(tec.nombres, ' ', tec.apellidos) as tecnico_nombre,
              tec.email as tecnico_email,
              tec.foto_perfil as tecnico_foto,
              tec.facultad_dependencia as tecnico_dependencia,
              tec.cargo as tecnico_cargo,
              tec.especialidad as tecnico_especialidad,
              tec.telefono as tecnico_telefono,
              (SELECT ROUND(COALESCE(AVG(puntuacion), 5.0), 1) FROM encuestas_satisfaccion WHERE tecnico_id = tec.id) as tecnico_promedio_estrellas,
              (SELECT COUNT(id) FROM encuestas_satisfaccion WHERE tecnico_id = tec.id) as tecnico_total_calificaciones,
              (SELECT COUNT(id) FROM tickets WHERE tecnico_id = tec.id AND estado = 'RESUELTO') as tecnico_total_resueltos,
              cat.nombre as categoria_nombre,
              cat.sla_horas_respuesta as categoria_sla_respuesta,
              cat.sla_horas_resolucion as categoria_sla_resolucion,
              CONCAT(creator.nombres, ' ', creator.apellidos) as creado_por_nombre,
              creator.email as creado_por_email,
              es.puntuacion as encuesta_puntuacion,
              es.comentario as encuesta_comentario
       FROM tickets t
       INNER JOIN usuarios sol ON t.solicitante_id = sol.id
       LEFT JOIN usuarios tec ON t.tecnico_id = tec.id
       LEFT JOIN usuarios creator ON t.creado_por_id = creator.id
       INNER JOIN categorias_servicio cat ON t.categoria_id = cat.id
       LEFT JOIN encuestas_satisfaccion es ON t.id = es.ticket_id
       WHERE t.id = ?`,
      [id]
    );

    if (rows.length === 0) return null;
    const ticket = rows[0] as TicketDB;

    // Obtener equipo de técnicos asignados
    const [tecRows] = await dbPool.query<RowDataPacket[]>(
      `SELECT tt.id as asignacion_id, tt.rol_asignacion, u.id, u.nombres, u.apellidos,
              CONCAT(u.nombres, ' ', u.apellidos) as nombre_completo,
              u.email, u.foto_perfil, u.cargo, u.especialidad, u.telefono
       FROM ticket_tecnicos tt
       JOIN usuarios u ON tt.tecnico_id = u.id
       WHERE tt.ticket_id = ?
       ORDER BY FIELD(tt.rol_asignacion, 'PRINCIPAL', 'APOYO'), tt.id ASC`,
      [ticket.id]
    );

    const allTecs: AssignedTechnician[] = (tecRows as any[]).map((r) => ({
      id: r.id,
      nombres: r.nombres,
      apellidos: r.apellidos,
      nombre_completo: r.nombre_completo,
      email: r.email,
      foto_perfil: r.foto_perfil,
      cargo: r.cargo,
      especialidad: r.especialidad,
      telefono: r.telefono,
      rol_asignacion: r.rol_asignacion,
    }));

    ticket.tecnicos_asignados = allTecs;
    ticket.tecnicos_adicionales = allTecs.filter((t) => t.rol_asignacion === 'APOYO');

    return ticket;
  }

  static async findByCode(code: string): Promise<TicketDB | null> {
    const [rows] = await dbPool.query<RowDataPacket[]>(
      `SELECT t.*,
              CONCAT(sol.nombres, ' ', sol.apellidos) as solicitante_nombre,
              sol.email as solicitante_email,
              sol.facultad_dependencia as solicitante_dependencia,
              sol.telefono as solicitante_telefono,
              sol.anexo as solicitante_anexo,
              sol.foto_perfil as solicitante_foto,
              CONCAT(tec.nombres, ' ', tec.apellidos) as tecnico_nombre,
              tec.email as tecnico_email,
              tec.foto_perfil as tecnico_foto,
              tec.facultad_dependencia as tecnico_dependencia,
              tec.cargo as tecnico_cargo,
              tec.especialidad as tecnico_especialidad,
              tec.telefono as tecnico_telefono,
              (SELECT ROUND(COALESCE(AVG(puntuacion), 5.0), 1) FROM encuestas_satisfaccion WHERE tecnico_id = tec.id) as tecnico_promedio_estrellas,
              (SELECT COUNT(id) FROM encuestas_satisfaccion WHERE tecnico_id = tec.id) as tecnico_total_calificaciones,
              (SELECT COUNT(id) FROM tickets WHERE tecnico_id = tec.id AND estado = 'RESUELTO') as tecnico_total_resueltos,
              cat.nombre as categoria_nombre,
              CONCAT(creator.nombres, ' ', creator.apellidos) as creado_por_nombre,
              creator.email as creado_por_email,
              es.puntuacion as encuesta_puntuacion,
              es.comentario as encuesta_comentario
       FROM tickets t
       INNER JOIN usuarios sol ON t.solicitante_id = sol.id
       LEFT JOIN usuarios tec ON t.tecnico_id = tec.id
       LEFT JOIN usuarios creator ON t.creado_por_id = creator.id
       INNER JOIN categorias_servicio cat ON t.categoria_id = cat.id
       LEFT JOIN encuestas_satisfaccion es ON t.id = es.ticket_id
       WHERE t.codigo_correlativo = ?`,
      [code]
    );

    if (rows.length === 0) return null;
    const ticket = rows[0] as TicketDB;

    // Obtener equipo de técnicos asignados
    const [tecRows] = await dbPool.query<RowDataPacket[]>(
      `SELECT tt.id as asignacion_id, tt.rol_asignacion, u.id, u.nombres, u.apellidos,
              CONCAT(u.nombres, ' ', u.apellidos) as nombre_completo,
              u.email, u.foto_perfil, u.cargo, u.especialidad, u.telefono
       FROM ticket_tecnicos tt
       JOIN usuarios u ON tt.tecnico_id = u.id
       WHERE tt.ticket_id = ?
       ORDER BY FIELD(tt.rol_asignacion, 'PRINCIPAL', 'APOYO'), tt.id ASC`,
      [ticket.id]
    );

    const allTecs: AssignedTechnician[] = (tecRows as any[]).map((r) => ({
      id: r.id,
      nombres: r.nombres,
      apellidos: r.apellidos,
      nombre_completo: r.nombre_completo,
      email: r.email,
      foto_perfil: r.foto_perfil,
      cargo: r.cargo,
      especialidad: r.especialidad,
      telefono: r.telefono,
      rol_asignacion: r.rol_asignacion,
    }));

    ticket.tecnicos_asignados = allTecs;
    ticket.tecnicos_adicionales = allTecs.filter((t) => t.rol_asignacion === 'APOYO');

    return ticket;
  }

  static async searchTickets(filters: {
    userRole: RoleCode;
    userId: number;
    modulo?: ModuleArea;
    estado?: TicketStatus;
    categoriaId?: number;
    tecnicoId?: number;
    searchQuery?: string;
    prioridad?: string;
    canalOrigen?: string;
    excluirCanalOrigen?: string;
  }): Promise<TicketDB[]> {
    let sql = `
      SELECT t.*,
             CONCAT(sol.nombres, ' ', sol.apellidos) as solicitante_nombre,
             sol.email as solicitante_email,
             sol.facultad_dependencia as solicitante_dependencia,
             sol.telefono as solicitante_telefono,
             sol.anexo as solicitante_anexo,
             sol.foto_perfil as solicitante_foto,
             CONCAT(tec.nombres, ' ', tec.apellidos) as tecnico_nombre,
             tec.email as tecnico_email,
             tec.foto_perfil as tecnico_foto,
             tec.facultad_dependencia as tecnico_dependencia,
             tec.cargo as tecnico_cargo,
             tec.especialidad as tecnico_especialidad,
             tec.telefono as tecnico_telefono,
             (SELECT ROUND(COALESCE(AVG(puntuacion), 5.0), 1) FROM encuestas_satisfaccion WHERE tecnico_id = tec.id) as tecnico_promedio_estrellas,
             (SELECT COUNT(id) FROM encuestas_satisfaccion WHERE tecnico_id = tec.id) as tecnico_total_calificaciones,
             (SELECT COUNT(id) FROM tickets WHERE tecnico_id = tec.id AND estado = 'RESUELTO') as tecnico_total_resueltos,
             cat.nombre as categoria_nombre,
             CONCAT(creator.nombres, ' ', creator.apellidos) as creado_por_nombre,
             es.puntuacion as encuesta_puntuacion,
             es.comentario as encuesta_comentario
      FROM tickets t
      INNER JOIN usuarios sol ON t.solicitante_id = sol.id
      LEFT JOIN usuarios tec ON t.tecnico_id = tec.id
      LEFT JOIN usuarios creator ON t.creado_por_id = creator.id
      INNER JOIN categorias_servicio cat ON t.categoria_id = cat.id
      LEFT JOIN encuestas_satisfaccion es ON t.id = es.ticket_id
      WHERE 1=1
    `;

    const params: any[] = [];

    // REGLA CLAVE DE AISLAMIENTO POR ROL Y MÓDULO (OTIC vs SERVICIOS GENERALES)
    if (['TECNICO', 'ESPECIALISTA_REDES', 'ESPECIALISTA_DESARROLLO'].includes(filters.userRole)) {
      sql += ` AND (t.tecnico_id = ? OR EXISTS (SELECT 1 FROM ticket_tecnicos tt WHERE tt.ticket_id = t.id AND tt.tecnico_id = ?)) AND t.modulo = 'OTIC'`;
      params.push(filters.userId, filters.userId);
    } else if (filters.userRole === 'TECNICO_SG') {
      sql += ` AND t.tecnico_id = ? AND t.modulo = 'SERVICIOS_GENERALES'`;
      params.push(filters.userId);
    } else if (filters.userRole === 'MESA_AYUDA' || filters.userRole === 'SUPERVISOR') {
      sql += ` AND t.modulo = 'OTIC'`;
    } else if (filters.userRole === 'MESA_AYUDA_SG' || filters.userRole === 'SUPERVISOR_SG') {
      sql += ` AND t.modulo = 'SERVICIOS_GENERALES'`;
    } else if (filters.userRole === 'SOLICITANTE') {
      sql += ` AND t.solicitante_id = ?`;
      params.push(filters.userId);
      if (filters.modulo) {
        sql += ` AND t.modulo = ?`;
        params.push(filters.modulo);
      }
    } else if (filters.userRole === 'ADMIN') {
      if (filters.modulo) {
        sql += ` AND t.modulo = ?`;
        params.push(filters.modulo);
      }
    }

    if (filters.estado) {
      sql += ` AND t.estado = ?`;
      params.push(filters.estado);
    }

    if (filters.canalOrigen) {
      sql += ` AND t.canal_origen = ?`;
      params.push(filters.canalOrigen);
    }

    if (filters.excluirCanalOrigen) {
      sql += ` AND (t.canal_origen != ? OR t.canal_origen IS NULL)`;
      params.push(filters.excluirCanalOrigen);
    }

    if (filters.categoriaId) {
      sql += ` AND t.categoria_id = ?`;
      params.push(filters.categoriaId);
    }

    if (filters.tecnicoId && !['TECNICO', 'ESPECIALISTA_REDES', 'ESPECIALISTA_DESARROLLO', 'TECNICO_SG'].includes(filters.userRole)) {
      sql += ` AND (t.tecnico_id = ? OR EXISTS (SELECT 1 FROM ticket_tecnicos tt WHERE tt.ticket_id = t.id AND tt.tecnico_id = ?))`;
      params.push(filters.tecnicoId, filters.tecnicoId);
    }

    if (filters.prioridad) {
      sql += ` AND t.prioridad = ?`;
      params.push(filters.prioridad);
    }

    if (filters.searchQuery) {
      sql += ` AND (t.codigo_correlativo LIKE ? OR t.titulo LIKE ? OR t.descripcion LIKE ? OR sol.nombres LIKE ? OR sol.apellidos LIKE ?)`;
      const q = `%${filters.searchQuery}%`;
      params.push(q, q, q, q, q);
    }

    sql += ` ORDER BY t.id DESC LIMIT 300`;

    const [rows] = await dbPool.query<RowDataPacket[]>(sql, params);
    const tickets = rows as TicketDB[];

    if (tickets.length > 0) {
      const ticketIds = tickets.map((t) => t.id);
      const [tecRows] = await dbPool.query<RowDataPacket[]>(
        `SELECT tt.ticket_id, tt.rol_asignacion, u.id, u.nombres, u.apellidos,
                CONCAT(u.nombres, ' ', u.apellidos) as nombre_completo,
                u.email, u.foto_perfil, u.cargo, u.especialidad, u.telefono
         FROM ticket_tecnicos tt
         JOIN usuarios u ON tt.tecnico_id = u.id
         WHERE tt.ticket_id IN (?)
         ORDER BY FIELD(tt.rol_asignacion, 'PRINCIPAL', 'APOYO'), tt.id ASC`,
        [ticketIds]
      );

      const map = new Map<number, AssignedTechnician[]>();
      for (const r of tecRows as any[]) {
        if (!map.has(r.ticket_id)) map.set(r.ticket_id, []);
        map.get(r.ticket_id)!.push({
          id: r.id,
          nombres: r.nombres,
          apellidos: r.apellidos,
          nombre_completo: r.nombre_completo,
          email: r.email,
          foto_perfil: r.foto_perfil,
          cargo: r.cargo,
          especialidad: r.especialidad,
          telefono: r.telefono,
          rol_asignacion: r.rol_asignacion,
        });
      }

      for (const t of tickets) {
        const all = map.get(t.id) || [];
        t.tecnicos_asignados = all;
        t.tecnicos_adicionales = all.filter((a) => a.rol_asignacion === 'APOYO');
      }
    }

    return tickets;
  }

  static async createTicket(data: {
    codigoCorrelativo: string;
    modulo?: ModuleArea;
    titulo: string;
    descripcion: string;
    tipo: string;
    prioridad: string;
    impacto: string;
    urgencia: string;
    complejidad?: string;
    solicitanteId: number;
    tecnicoId?: number | null;
    categoriaId: number;
    ubicacionOficina?: string;
    referenciaUbicacion?: string;
    contactoLocal?: string;
    horarioAcceso?: string;
    subtipoIntervencion?: string;
    datosVehiculares?: string;
    materialesUsados?: string;
    canalOrigen?: string;
    fechaLimiteRespuesta?: Date | null;
    fechaLimiteResolucion?: Date | null;
    esEquipo?: boolean;
    numeroInventario?: string | null;
    esEmergencia?: boolean | number;
    justificacionEmergencia?: string | null;
    creadoPorId?: number | null;
  }): Promise<number> {
    const estadoInicial = data.tecnicoId ? 'ASIGNADO' : 'REPORTADO';

    const [result] = await dbPool.query<ResultSetHeader>(
      `INSERT INTO tickets (
        codigo_correlativo, modulo, titulo, descripcion, tipo, prioridad, impacto, urgencia, complejidad, estado,
        solicitante_id, tecnico_id, categoria_id, ubicacion_oficina, referencia_ubicacion, contacto_local, horario_acceso,
        subtipo_intervencion, datos_vehiculares, materiales_usados, canal_origen,
        fecha_limite_respuesta, fecha_limite_resolucion, es_equipo, numero_inventario,
        es_emergencia, justificacion_emergencia, creado_por_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.codigoCorrelativo,
        data.modulo || 'OTIC',
        data.titulo,
        data.descripcion,
        data.tipo,
        data.prioridad,
        data.impacto,
        data.urgencia,
        data.complejidad || 'BAJA',
        estadoInicial,
        data.solicitanteId,
        data.tecnicoId || null,
        data.categoriaId,
        data.ubicacionOficina || null,
        data.referenciaUbicacion || null,
        data.contactoLocal || null,
        data.horarioAcceso || null,
        data.subtipoIntervencion || null,
        data.datosVehiculares || null,
        data.materialesUsados || null,
        data.canalOrigen || 'PORTAL_WEB',
        data.fechaLimiteRespuesta || null,
        data.fechaLimiteResolucion || null,
        data.esEquipo ? 1 : 0,
        data.numeroInventario ? data.numeroInventario.trim() : null,
        data.esEmergencia ? 1 : 0,
        data.justificacionEmergencia ? data.justificacionEmergencia.trim() : null,
        data.creadoPorId || null,
      ]
    );

    return result.insertId;
  }

  static async getHistoryByEquipment(numeroInventario: string): Promise<TicketDB[]> {
    const cleaned = numeroInventario?.trim();
    if (!cleaned) return [];

    const [rows] = await dbPool.query<RowDataPacket[]>(
      `SELECT t.*,
              CONCAT(sol.nombres, ' ', sol.apellidos) as solicitante_nombre,
              sol.email as solicitante_email,
              sol.facultad_dependencia as solicitante_dependencia,
              CONCAT(tec.nombres, ' ', tec.apellidos) as tecnico_nombre,
              tec.email as tecnico_email,
              cat.nombre as categoria_nombre
       FROM tickets t
       INNER JOIN usuarios sol ON t.solicitante_id = sol.id
       LEFT JOIN usuarios tec ON t.tecnico_id = tec.id
       INNER JOIN categorias_servicio cat ON t.categoria_id = cat.id
       WHERE LOWER(t.numero_inventario) = LOWER(?)
       ORDER BY t.fecha_apertura DESC`,
      [cleaned]
    );

    return rows as TicketDB[];
  }

  static async getEquipmentSummary(filters?: { search?: string; modulo?: string; estado?: string }): Promise<any[]> {
    let sql = `
      SELECT 
        t.numero_inventario,
        COUNT(t.id) as total_tickets,
        SUM(CASE WHEN t.estado IN ('RESUELTO', 'CERRADO') THEN 1 ELSE 0 END) as tickets_resueltos,
        SUM(CASE WHEN t.estado IN ('REPORTADO', 'ASIGNADO', 'EN_PROCESO', 'OBSERVADO') THEN 1 ELSE 0 END) as tickets_activos,
        MAX(t.fecha_apertura) as ultima_atencion,
        SUBSTRING_INDEX(GROUP_CONCAT(t.codigo_correlativo ORDER BY t.fecha_apertura DESC), ',', 1) as ultimo_ticket_codigo,
        CAST(SUBSTRING_INDEX(GROUP_CONCAT(t.id ORDER BY t.fecha_apertura DESC), ',', 1) AS UNSIGNED) as ultimo_ticket_id,
        SUBSTRING_INDEX(GROUP_CONCAT(t.estado ORDER BY t.fecha_apertura DESC), ',', 1) as ultimo_ticket_estado,
        SUBSTRING_INDEX(GROUP_CONCAT(t.titulo ORDER BY t.fecha_apertura DESC SEPARATOR ' || '), ' || ', 1) as ultimo_ticket_titulo,
        SUBSTRING_INDEX(GROUP_CONCAT(sol.facultad_dependencia ORDER BY t.fecha_apertura DESC SEPARATOR ' || '), ' || ', 1) as ultima_dependencia,
        SUBSTRING_INDEX(GROUP_CONCAT(CONCAT(sol.nombres, ' ', sol.apellidos) ORDER BY t.fecha_apertura DESC SEPARATOR ' || '), ' || ', 1) as ultimo_solicitante,
        SUBSTRING_INDEX(GROUP_CONCAT(COALESCE(CONCAT(tec.nombres, ' ', tec.apellidos), 'Sin asignar') ORDER BY t.fecha_apertura DESC SEPARATOR ' || '), ' || ', 1) as ultimo_tecnico,
        SUBSTRING_INDEX(GROUP_CONCAT(cat.nombre ORDER BY t.fecha_apertura DESC SEPARATOR ' || '), ' || ', 1) as ultima_categoria,
        SUBSTRING_INDEX(GROUP_CONCAT(t.modulo ORDER BY t.fecha_apertura DESC), ',', 1) as ultimo_modulo
      FROM tickets t
      INNER JOIN usuarios sol ON t.solicitante_id = sol.id
      LEFT JOIN usuarios tec ON t.tecnico_id = tec.id
      INNER JOIN categorias_servicio cat ON t.categoria_id = cat.id
      WHERE t.numero_inventario IS NOT NULL AND TRIM(t.numero_inventario) != ''
    `;

    const params: any[] = [];

    if (filters?.modulo && filters.modulo !== 'ALL') {
      sql += ` AND t.modulo = ?`;
      params.push(filters.modulo);
    }

    if (filters?.search && filters.search.trim() !== '') {
      const q = `%${filters.search.trim()}%`;
      sql += ` AND (t.numero_inventario LIKE ? OR t.titulo LIKE ? OR sol.facultad_dependencia LIKE ? OR sol.nombres LIKE ? OR sol.apellidos LIKE ? OR cat.nombre LIKE ?)`;
      params.push(q, q, q, q, q, q);
    }

    sql += ` GROUP BY t.numero_inventario ORDER BY ultima_atencion DESC`;

    const [rows] = await dbPool.query<RowDataPacket[]>(sql, params);

    if (filters?.estado && filters.estado !== 'ALL') {
      if (filters.estado === 'ACTIVO') {
        return (rows as any[]).filter(r => Number(r.tickets_activos) > 0);
      } else if (filters.estado === 'RESUELTO') {
        return (rows as any[]).filter(r => Number(r.tickets_activos) === 0);
      }
    }

    return rows as any[];
  }

  static async updateTicketStatus(
    ticketId: number,
    nuevoEstado: TicketStatus,
    solucionDetalle?: string,
    tecnicoIdAsignado?: number,
    materialesUsados?: string,
    materialesSobrantes?: string
  ): Promise<void> {
    const updates: string[] = ['estado = ?'];
    const params: any[] = [nuevoEstado];

    if (nuevoEstado === 'ASIGNADO' || nuevoEstado === 'EN_EJECUCION') {
      updates.push(`fecha_primera_respuesta = IFNULL(fecha_primera_respuesta, ?)`);
      params.push(new Date());
    }

    if (nuevoEstado === 'RESUELTO') {
      updates.push(`fecha_resolucion = ?`);
      params.push(new Date());
    }

    if (solucionDetalle !== undefined) {
      updates.push(`solucion_detalle = ?`);
      params.push(solucionDetalle);
    }

    if (materialesUsados !== undefined) {
      updates.push(`materiales_usados = ?`);
      params.push(materialesUsados);
    }

    if (materialesSobrantes !== undefined) {
      updates.push(`materiales_sobrantes = ?`);
      params.push(materialesSobrantes);
    }

    if (tecnicoIdAsignado) {
      updates.push(`tecnico_id = ?`);
      params.push(tecnicoIdAsignado);
    }

    params.push(ticketId);

    const sql = `UPDATE tickets SET ${updates.join(', ')} WHERE id = ?`;
    await dbPool.query(sql, params);
  }

  static async assignTechnicianWithComplexity(
    ticketId: number,
    tecnicoId: number,
    complejidad: TicketComplejidad = 'BAJA',
    tecnicosAdicionalesIds: number[] = []
  ): Promise<void> {
    // Obtener datos del ticket y categoría para recalcular SLA
    const [tRows] = await dbPool.query<RowDataPacket[]>(
      `SELECT t.*, cat.sla_horas_respuesta, cat.sla_horas_resolucion
       FROM tickets t
       INNER JOIN categorias_servicio cat ON t.categoria_id = cat.id
       WHERE t.id = ?`,
      [ticketId]
    );

    if (tRows.length === 0) return;
    const ticket = tRows[0];

    const { fechaLimiteResolucion } = calculateSLADeadlines(
      ticket.sla_horas_respuesta || 4,
      ticket.sla_horas_resolucion || 24,
      ticket.prioridad || 'MEDIA',
      complejidad
    );

    await dbPool.query(
      `UPDATE tickets 
       SET tecnico_id = ?, 
           complejidad = ?,
           fecha_limite_resolucion = ?,
           estado = 'ASIGNADO',
           fecha_primera_respuesta = IFNULL(fecha_primera_respuesta, NOW())
       WHERE id = ?`,
      [tecnicoId, complejidad, fechaLimiteResolucion, ticketId]
    );

    // Actualizar equipo de técnicos en tabla ticket_tecnicos
    await dbPool.query(`DELETE FROM ticket_tecnicos WHERE ticket_id = ?`, [ticketId]);
    await dbPool.query(
      `INSERT INTO ticket_tecnicos (ticket_id, tecnico_id, rol_asignacion) VALUES (?, ?, 'PRINCIPAL')`,
      [ticketId, tecnicoId]
    );

    // Si es OTIC y la complejidad es COMPLEJA (Crítica / Muy Compleja), guardar técnicos de apoyo
    if (ticket.modulo === 'OTIC' && complejidad === 'COMPLEJA' && Array.isArray(tecnicosAdicionalesIds) && tecnicosAdicionalesIds.length > 0) {
      for (const addId of tecnicosAdicionalesIds) {
        if (addId && addId !== tecnicoId) {
          await dbPool.query(
            `INSERT IGNORE INTO ticket_tecnicos (ticket_id, tecnico_id, rol_asignacion) VALUES (?, ?, 'APOYO')`,
            [ticketId, addId]
          );
        }
      }
    }
  }

  static async deriveTicket(
    ticketId: number,
    nuevoTecnicoId: number,
    nuevaCategoriaId?: number,
    nuevaComplejidad?: TicketComplejidad,
    nuevosTecnicosAdicionalesIds?: number[]
  ): Promise<void> {
    const updates: string[] = ['tecnico_id = ?', `estado = 'ASIGNADO'`];
    const params: any[] = [nuevoTecnicoId];

    if (nuevaCategoriaId) {
      updates.push('categoria_id = ?');
      params.push(nuevaCategoriaId);
    }

    if (nuevaComplejidad) {
      updates.push('complejidad = ?');
      params.push(nuevaComplejidad);
    }

    params.push(ticketId);
    await dbPool.query(`UPDATE tickets SET ${updates.join(', ')} WHERE id = ?`, params);

    // Actualizar asignación en ticket_tecnicos
    await dbPool.query(`DELETE FROM ticket_tecnicos WHERE ticket_id = ?`, [ticketId]);
    await dbPool.query(
      `INSERT INTO ticket_tecnicos (ticket_id, tecnico_id, rol_asignacion) VALUES (?, ?, 'PRINCIPAL')`,
      [ticketId, nuevoTecnicoId]
    );

    if (nuevaComplejidad === 'COMPLEJA' && Array.isArray(nuevosTecnicosAdicionalesIds) && nuevosTecnicosAdicionalesIds.length > 0) {
      for (const addId of nuevosTecnicosAdicionalesIds) {
        if (addId && addId !== nuevoTecnicoId) {
          await dbPool.query(
            `INSERT IGNORE INTO ticket_tecnicos (ticket_id, tecnico_id, rol_asignacion) VALUES (?, ?, 'APOYO')`,
            [ticketId, addId]
          );
        }
      }
    }
  }

  static async reopenTicket(ticketId: number, motivo?: string, usuarioId?: number): Promise<void> {
    await dbPool.query(
      `UPDATE tickets 
       SET estado = 'ASIGNADO',
           fecha_resolucion = NULL,
           solucion_detalle = NULL
       WHERE id = ?`,
      [ticketId]
    );

    const motivoLimpio = motivo?.trim() || 'Reapertura de ticket por solicitud usuaria';

    // Registrar reapertura en auditoría
    await this.logAudit({
      ticketId,
      usuarioId: usuarioId || undefined,
      accion: 'REAPERTURA_TICKET',
      campoModificado: 'estado',
      valorAnterior: 'RESUELTO',
      valorNuevo: `Motivo: ${motivoLimpio}`,
    });
  }

  static async submitSatisfactionSurvey(data: {
    ticketId: number;
    tecnicoId?: number;
    solicitanteId?: number;
    puntuacion: number;
    comentario?: string;
  }): Promise<void> {
    await dbPool.query(
      `INSERT INTO encuestas_satisfaccion (ticket_id, tecnico_id, solicitante_id, puntuacion, comentario)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE 
         puntuacion = VALUES(puntuacion),
         comentario = VALUES(comentario),
         fecha_encuesta = NOW()`,
      [
        data.ticketId,
        data.tecnicoId || null,
        data.solicitanteId || null,
        data.puntuacion,
        data.comentario || null,
      ]
    );
  }

  static async getComments(ticketId: number, userRole: RoleCode): Promise<TicketCommentDB[]> {
    let sql = `
      SELECT c.*,
             CONCAT(u.nombres, ' ', u.apellidos) as usuario_nombre,
             r.codigo as usuario_rol
      FROM comentarios_ticket c
      INNER JOIN usuarios u ON c.usuario_id = u.id
      INNER JOIN roles r ON u.rol_id = r.id
      WHERE c.ticket_id = ?
    `;

    if (userRole === 'SOLICITANTE') {
      sql += ` AND c.es_nota_interna = FALSE`;
    }

    sql += ` ORDER BY c.id ASC`;

    const [rows] = await dbPool.query<RowDataPacket[]>(sql, [ticketId]);
    return rows as TicketCommentDB[];
  }

  static async addComment(data: {
    ticketId: number;
    usuarioId: number;
    mensaje: string;
    esNotaInterna: boolean;
  }): Promise<number> {
    const [result] = await dbPool.query<ResultSetHeader>(
      `INSERT INTO comentarios_ticket (ticket_id, usuario_id, mensaje, es_nota_interna)
       VALUES (?, ?, ?, ?)`,
      [data.ticketId, data.usuarioId, data.mensaje, data.esNotaInterna]
    );
    return result.insertId;
  }

  static async addAttachment(data: {
    ticketId: number;
    comentarioId?: number;
    nombreOriginal: string;
    nombreGuardado: string;
    rutaServidor: string;
    tamanoBytes: number;
    mimeType: string;
    subidoPorId: number;
  }): Promise<number> {
    const [result] = await dbPool.query<ResultSetHeader>(
      `INSERT INTO adjuntos (ticket_id, comentario_id, nombre_original, nombre_guardado, ruta_servidor, tamano_bytes, mime_type, subido_por_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.ticketId,
        data.comentarioId || null,
        data.nombreOriginal,
        data.nombreGuardado,
        data.rutaServidor,
        data.tamanoBytes,
        data.mimeType,
        data.subidoPorId,
      ]
    );
    return result.insertId;
  }

  static async getAttachments(ticketId: number): Promise<AttachmentDB[]> {
    const [rows] = await dbPool.query<RowDataPacket[]>(
      `SELECT a.*, CONCAT(u.nombres, ' ', u.apellidos) as subido_por_nombre
       FROM adjuntos a
       INNER JOIN usuarios u ON a.subido_por_id = u.id
       WHERE a.ticket_id = ?
       ORDER BY a.id ASC`,
      [ticketId]
    );
    return rows as AttachmentDB[];
  }

  static async logAudit(data: {
    ticketId: number;
    usuarioId?: number;
    accion: string;
    campoModificado?: string;
    valorAnterior?: string;
    valorNuevo?: string;
    ipOrigen?: string;
    fecha?: Date;
  }): Promise<void> {
    const ahora = data.fecha || new Date();
    await dbPool.query(
      `INSERT INTO logs_auditoria (ticket_id, usuario_id, accion, campo_modificado, valor_anterior, valor_nuevo, ip_origen, fecha)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.ticketId,
        data.usuarioId || null,
        data.accion,
        data.campoModificado || null,
        data.valorAnterior || null,
        data.valorNuevo || null,
        data.ipOrigen || null,
        ahora,
      ]
    );
  }

  static async getAuditLogs(ticketId: number): Promise<AuditLogDB[]> {
    const [rows] = await dbPool.query<RowDataPacket[]>(
      `SELECT l.*, 
              CONCAT(u.nombres, ' ', u.apellidos) as usuario_nombre,
              r.codigo as usuario_rol,
              t.codigo_correlativo as ticket_codigo
       FROM logs_auditoria l
       LEFT JOIN usuarios u ON l.usuario_id = u.id
       LEFT JOIN roles r ON u.rol_id = r.id
       LEFT JOIN tickets t ON l.ticket_id = t.id
       WHERE l.ticket_id = ?
       ORDER BY l.id ASC`,
      [ticketId]
    );
    return rows as AuditLogDB[];
  }

  static async getAuditLogsGlobal(filters?: {
    search?: string;
    accion?: string;
    limite?: number;
  }): Promise<AuditLogDB[]> {
    let sql = `
      SELECT l.*, 
             CONCAT(u.nombres, ' ', u.apellidos) as usuario_nombre,
             r.nombre as usuario_rol,
             t.codigo_correlativo as ticket_codigo,
             t.titulo as ticket_titulo
      FROM logs_auditoria l
      LEFT JOIN usuarios u ON l.usuario_id = u.id
      LEFT JOIN roles r ON u.rol_id = r.id
      LEFT JOIN tickets t ON l.ticket_id = t.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (filters?.accion) {
      sql += ` AND l.accion = ?`;
      params.push(filters.accion);
    }

    if (filters?.search) {
      sql += ` AND (t.codigo_correlativo LIKE ? OR u.nombres LIKE ? OR u.apellidos LIKE ? OR l.valor_nuevo LIKE ?)`;
      const q = `%${filters.search}%`;
      params.push(q, q, q, q);
    }

    sql += ` ORDER BY l.id DESC LIMIT ?`;
    params.push(filters?.limite || 100);

    const [rows] = await dbPool.query<RowDataPacket[]>(sql, params);
    return rows as AuditLogDB[];
  }

  static async getDashboardMetrics(modulo?: ModuleArea): Promise<DashboardMetrics> {
    const whereModulo = modulo ? `WHERE modulo = ?` : '';
    const moduloParams = modulo ? [modulo] : [];

    // 1. Conteo total y por estado
    const [totalRows] = await dbPool.query<RowDataPacket[]>(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN estado = 'REPORTADO' THEN 1 ELSE 0 END) as reportados,
        SUM(CASE WHEN estado = 'ASIGNADO' THEN 1 ELSE 0 END) as asignados,
        SUM(CASE WHEN estado = 'RESUELTO' THEN 1 ELSE 0 END) as resueltos,
        AVG(CASE WHEN estado = 'RESUELTO' AND fecha_resolucion IS NOT NULL 
            THEN TIMESTAMPDIFF(MINUTE, fecha_apertura, fecha_resolucion) / 60.0 ELSE NULL END) as avg_resolution_hours
      FROM tickets
      ${whereModulo}
    `, moduloParams);

    const metricsData = totalRows[0] || {};

    // 2. Satisfacción promedio
    const [surveyRows] = await dbPool.query<RowDataPacket[]>(`
      SELECT AVG(es.puntuacion) as avg_score 
      FROM encuestas_satisfaccion es
      JOIN tickets t ON es.ticket_id = t.id
      ${whereModulo.replace('modulo', 't.modulo')}
    `, moduloParams);
    const avgScore = Number(surveyRows[0]?.avg_score || 0);

    // 3. Cumplimiento SLA
    const [slaRows] = await dbPool.query<RowDataPacket[]>(`
      SELECT 
        COUNT(*) as total_resueltos,
        SUM(CASE WHEN fecha_resolucion <= fecha_limite_resolucion THEN 1 ELSE 0 END) as cumplen_sla
      FROM tickets
      WHERE estado = 'RESUELTO' AND fecha_resolucion IS NOT NULL AND fecha_limite_resolucion IS NOT NULL
      ${modulo ? 'AND modulo = ?' : ''}
    `, moduloParams);
    const totalSla = Number(slaRows[0]?.total_resueltos || 0);
    const cumplenSla = Number(slaRows[0]?.cumplen_sla || 0);
    const slaPercent = totalSla > 0 ? Math.round((cumplenSla / totalSla) * 100) : 100;

    // 4. Carga por técnico
    let techRoles = `('TECNICO', 'ESPECIALISTA_REDES', 'ESPECIALISTA_DESARROLLO', 'TECNICO_SG', 'SUPERVISOR', 'SUPERVISOR_SG', 'ADMIN')`;
    if (modulo === 'SERVICIOS_GENERALES') {
      techRoles = `('TECNICO_SG', 'SUPERVISOR_SG')`;
    } else if (modulo === 'OTIC') {
      techRoles = `('TECNICO', 'ESPECIALISTA_REDES', 'ESPECIALISTA_DESARROLLO', 'SUPERVISOR')`;
    }

    const [techRows] = await dbPool.query<RowDataPacket[]>(`
      SELECT 
        u.id as tecnicoId,
        CONCAT(u.nombres, ' ', u.apellidos) as tecnicoNombre,
        u.foto_perfil as fotoPerfil,
        SUM(CASE WHEN t.estado = 'ASIGNADO' THEN 1 ELSE 0 END) as asignados,
        SUM(CASE WHEN t.estado = 'RESUELTO' THEN 1 ELSE 0 END) as resueltos,
        AVG(CASE WHEN t.estado = 'RESUELTO' AND t.fecha_resolucion IS NOT NULL 
            THEN TIMESTAMPDIFF(MINUTE, t.fecha_apertura, t.fecha_resolucion) / 60.0 ELSE NULL END) as tiempoPromedioHoras,
        (SELECT AVG(es.puntuacion) FROM encuestas_satisfaccion es WHERE es.tecnico_id = u.id) as calificacionPromedio
      FROM usuarios u
      INNER JOIN roles r ON u.rol_id = r.id
      LEFT JOIN tickets t ON u.id = t.tecnico_id ${modulo ? 'AND t.modulo = ?' : ''}
      WHERE r.codigo IN ${techRoles} AND u.estado = 'ACTIVO'
      GROUP BY u.id, u.nombres, u.apellidos, u.foto_perfil
      ORDER BY asignados DESC, resueltos DESC
    `, moduloParams);

    // 5. Volumen por categoría
    const [catRows] = await dbPool.query<RowDataPacket[]>(`
      SELECT 
        c.id as categoriaId,
        c.nombre as categoriaNombre,
        COUNT(t.id) as total
      FROM categorias_servicio c
      LEFT JOIN tickets t ON c.id = t.categoria_id
      ${modulo ? 'WHERE c.modulo = ?' : ''}
      GROUP BY c.id, c.nombre
      ORDER BY total DESC
    `, moduloParams);

    // 6. Volumen por urgencia
    const [urgRows] = await dbPool.query<RowDataPacket[]>(`
      SELECT 
        urgencia,
        COUNT(*) as total
      FROM tickets
      ${whereModulo}
      GROUP BY urgencia
    `, moduloParams);

    return {
      totalTickets: Number(metricsData.total || 0),
      reportados: Number(metricsData.reportados || 0),
      asignados: Number(metricsData.asignados || 0),
      resueltos: Number(metricsData.resueltos || 0),
      tiempoPromedioResolucionHoras: Number((Number(metricsData.avg_resolution_hours) || 0).toFixed(1)),
      satisfaccionPromedio: Number(avgScore.toFixed(1)),
      cumplimientoSlaPorcentaje: slaPercent,
      cargaPorTecnico: techRows.map((tr) => ({
        tecnicoId: tr.tecnicoId,
        tecnicoNombre: tr.tecnicoNombre,
        fotoPerfil: tr.fotoPerfil,
        asignados: Number(tr.asignados || 0),
        resueltos: Number(tr.resueltos || 0),
        tiempoPromedioHoras: Number((Number(tr.tiempoPromedioHoras) || 0).toFixed(1)),
        calificacionPromedio: Number((Number(tr.calificacionPromedio) || 0).toFixed(1)),
      })),
      volumenPorCategoria: catRows.map((cr) => ({
        categoriaId: cr.categoriaId,
        categoriaNombre: cr.categoriaNombre,
        total: Number(cr.total || 0),
      })),
      volumenPorUrgencia: urgRows.map((ur) => ({
        urgencia: ur.urgencia,
        total: Number(ur.total || 0),
      })),
    };
  }

  static async deleteTicketsByIds(ids: number[]): Promise<number> {
    if (!ids || ids.length === 0) return 0;
    const conn = await dbPool.getConnection();
    try {
      await conn.beginTransaction();

      // 1. Desvincular hallazgos de inspección
      await conn.query('UPDATE hallazgos_inspeccion SET ticket_id = NULL WHERE ticket_id IN (?)', [ids]);

      // 2. Desvincular movimientos de materiales SG
      await conn.query('UPDATE materiales_movimientos_sg SET ticket_id = NULL WHERE ticket_id IN (?)', [ids]);

      // 3. Eliminar archivos físicos adjuntos si existen
      try {
        const [attRows] = await conn.query<RowDataPacket[]>('SELECT ruta_servidor FROM adjuntos WHERE ticket_id IN (?)', [ids]);
        for (const a of attRows as any[]) {
          if (a.ruta_servidor && fs.existsSync(a.ruta_servidor)) {
            try {
              fs.unlinkSync(a.ruta_servidor);
            } catch (_) {}
          }
        }
      } catch (_) {}

      // 4. Eliminar los tickets (cascada automática en DB a adjuntos, comentarios, encuestas, auditoría, asignaciones)
      const [result] = await conn.query<ResultSetHeader>('DELETE FROM tickets WHERE id IN (?)', [ids]);

      await conn.commit();
      return result.affectedRows;
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }

  static async purgeAllTickets(modulo?: string): Promise<number> {
    const conn = await dbPool.getConnection();
    try {
      await conn.beginTransaction();

      let targetIds: number[] = [];
      if (modulo && (modulo === 'OTIC' || modulo === 'SERVICIOS_GENERALES')) {
        const [rows] = await conn.query<RowDataPacket[]>('SELECT id FROM tickets WHERE modulo = ?', [modulo]);
        targetIds = (rows as any[]).map((r) => r.id);
      } else {
        const [rows] = await conn.query<RowDataPacket[]>('SELECT id FROM tickets');
        targetIds = (rows as any[]).map((r) => r.id);
      }

      if (targetIds.length === 0) {
        await conn.commit();
        return 0;
      }

      // 1. Desvincular hallazgos y movimientos
      await conn.query('UPDATE hallazgos_inspeccion SET ticket_id = NULL WHERE ticket_id IN (?)', [targetIds]);
      await conn.query('UPDATE materiales_movimientos_sg SET ticket_id = NULL WHERE ticket_id IN (?)', [targetIds]);

      // 2. Eliminar archivos adjuntos en disco
      try {
        const [attRows] = await conn.query<RowDataPacket[]>('SELECT ruta_servidor FROM adjuntos WHERE ticket_id IN (?)', [targetIds]);
        for (const a of attRows as any[]) {
          if (a.ruta_servidor && fs.existsSync(a.ruta_servidor)) {
            try {
              fs.unlinkSync(a.ruta_servidor);
            } catch (_) {}
          }
        }
      } catch (_) {}

      // 3. Eliminar tickets
      const [result] = await conn.query<ResultSetHeader>('DELETE FROM tickets WHERE id IN (?)', [targetIds]);

      await conn.commit();
      return result.affectedRows;
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }
}

