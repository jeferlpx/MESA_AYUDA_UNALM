import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { dbPool } from '../config/db';
import { generateTicketCode } from '../utils/ticketCode';
import { calculateSLADeadlines } from '../utils/sla';
import { CategoryModel } from './category.model';
import { TicketModel } from './ticket.model';

export interface InspectionDB extends RowDataPacket {
  id: number;
  codigo: string;
  fecha_registro: string;
  edificio: string;
  area: string;
  inspector_nombre: string;
  responsable_area: string | null;
  soporte_tecnico: string | null;
  observaciones_generales: string | null;
  total_evaluados: number;
  total_criticos: number;
  tickets_generados: number;
  created_at: string;
}

export interface FindingDB extends RowDataPacket {
  id: number;
  inspeccion_id: number;
  categoria_codigo: string;
  categoria_nombre: string;
  item_codigo: string;
  item_nombre: string;
  estado_calificacion: 'CRITICO' | 'MANTENIMIENTO' | 'BUENO' | 'EXCELENTE' | 'NO_APLICA';
  calificacion_num: number;
  observacion: string | null;
  accion_sugerida: string | null;
  prioridad: 'BAJA' | 'MEDIA' | 'ALTA' | 'CRITICA';
  categoria_sg_sugerida: string | null;
  ticket_id: number | null;
  ticket_codigo?: string | null;
  ticket_estado?: string | null;
  created_at: string;
}

export class InspectionModel {
  static async listInspections(filters?: {
    search?: string;
    edificio?: string;
  }): Promise<InspectionDB[]> {
    let sql = `
      SELECT 
        i.*,
        (SELECT COUNT(*) FROM hallazgos_inspeccion h WHERE h.inspeccion_id = i.id AND h.estado_calificacion = 'CRITICO') as total_criticos_reales,
        (SELECT COUNT(*) FROM hallazgos_inspeccion h WHERE h.inspeccion_id = i.id AND h.ticket_id IS NOT NULL) as tickets_vinculados
      FROM inspecciones_infraestructura i
      WHERE 1=1
    `;
    const params: any[] = [];

    if (filters?.search) {
      sql += ` AND (i.codigo LIKE ? OR i.edificio LIKE ? OR i.area LIKE ? OR i.inspector_nombre LIKE ?)`;
      const term = `%${filters.search}%`;
      params.push(term, term, term, term);
    }

    if (filters?.edificio) {
      sql += ` AND i.edificio = ?`;
      params.push(filters.edificio);
    }

    sql += ` ORDER BY i.fecha_registro DESC, i.id DESC`;

    const [rows] = await dbPool.query<InspectionDB[]>(sql, params);
    return rows;
  }

  static async findById(id: number): Promise<InspectionDB | null> {
    const [rows] = await dbPool.query<InspectionDB[]>(
      'SELECT * FROM inspecciones_infraestructura WHERE id = ?',
      [id]
    );
    return rows[0] || null;
  }

  static async getFindingsByInspectionId(inspeccionId: number): Promise<FindingDB[]> {
    const sql = `
      SELECT 
        h.*,
        t.codigo_correlativo as ticket_codigo,
        t.estado as ticket_estado
      FROM hallazgos_inspeccion h
      LEFT JOIN tickets t ON h.ticket_id = t.id
      WHERE h.inspeccion_id = ?
      ORDER BY 
        CASE h.estado_calificacion 
          WHEN 'CRITICO' THEN 1 
          WHEN 'MANTENIMIENTO' THEN 2 
          WHEN 'BUENO' THEN 3 
          ELSE 4 
        END ASC,
        h.id ASC
    `;
    const [rows] = await dbPool.query<FindingDB[]>(sql, [inspeccionId]);
    return rows;
  }

  static async findFindingById(findingId: number): Promise<FindingDB | null> {
    const sql = `
      SELECT h.*, i.codigo as insp_codigo, i.edificio, i.area, i.inspector_nombre
      FROM hallazgos_inspeccion h
      JOIN inspecciones_infraestructura i ON h.inspeccion_id = i.id
      WHERE h.id = ?
    `;
    const [rows] = await dbPool.query<FindingDB[]>(sql, [findingId]);
    return rows[0] || null;
  }

  /**
   * Crea un Ticket de Servicios Generales para un hallazgo crítico específico
   */
  static async createTicketForFinding(findingId: number, createdByUserId: number): Promise<{ ticketId: number; ticketCodigo: string }> {
    const finding = await this.findFindingById(findingId);
    if (!finding) {
      throw new Error('Hallazgo de inspección no encontrado');
    }

    if (finding.ticket_id) {
      const existingTicket = await TicketModel.findById(finding.ticket_id);
      if (existingTicket) {
        return { ticketId: existingTicket.id, ticketCodigo: existingTicket.codigo_correlativo };
      }
    }

    const inspection = await this.findById(finding.inspeccion_id);
    if (!inspection) {
      throw new Error('Inspección de origen no encontrada');
    }

    // Resolver la categoría de Servicios Generales
    let targetCatCode = finding.categoria_sg_sugerida || 'SG_INFRA';
    const allCategories = await CategoryModel.findAll('SERVICIOS_GENERALES');
    let category = allCategories.find((c) => c.codigo === targetCatCode) || allCategories[0];

    const prioridad = finding.prioridad || 'MEDIA';
    const { fechaLimiteRespuesta, fechaLimiteResolucion } = calculateSLADeadlines(
      category.sla_horas_respuesta,
      category.sla_horas_resolucion,
      prioridad
    );

    const ticketCodigo = await generateTicketCode('SERVICIOS_GENERALES');
    const titulo = `[HALLAZGO CRÍTICO SIGI] ${finding.item_nombre} - ${inspection.edificio} (${inspection.area})`;
    const descripcion = 
`REPORTE DE INSPECCIÓN PREVENTIVA SIGI UNALM
--------------------------------------------------
• Código de Inspección: ${inspection.codigo}
• Fecha de Levantamiento: ${new Date(inspection.fecha_registro).toLocaleString('es-PE')}
• Ubicación / Edificio: ${inspection.edificio}
• Área / Ambiente: ${inspection.area}
• Inspector Responsable: ${inspection.inspector_nombre}
• Responsable del Área: ${inspection.responsable_area || 'No especificado'}

DETALLE DEL HALLAZGO TÉCNICO:
• Elemento Evaluado: [${finding.item_codigo}] ${finding.item_nombre} (${finding.categoria_nombre})
• Calificación en Campo: CRÍTICO (1)
• Diagnóstico / Observación: ${finding.observacion || 'Requiere intervención correctiva inmediata.'}
• Acción Correctiva Sugerida: ${finding.accion_sugerida || 'Atención por personal técnico especialista.'}
• Prioridad Requerida: ${prioridad}`;

    const [res]: any = await dbPool.query<ResultSetHeader>(`
      INSERT INTO tickets 
      (codigo_correlativo, modulo, titulo, descripcion, tipo, prioridad, impacto, urgencia, complejidad, estado, solicitante_id, categoria_id, ubicacion_oficina, canal_origen, fecha_limite_respuesta, fecha_limite_resolucion, inspeccion_id, hallazgo_id)
      VALUES (?, 'SERVICIOS_GENERALES', ?, ?, 'INCIDENTE', ?, 'ALTO', 'ALTA', 'MEDIA', 'REPORTADO', ?, ?, ?, 'INSPECCION_SIGI', ?, ?, ?, ?)
    `, [
      ticketCodigo,
      titulo,
      descripcion,
      prioridad,
      createdByUserId,
      category.id,
      `${inspection.edificio} - ${inspection.area}`,
      fechaLimiteRespuesta,
      fechaLimiteResolucion,
      inspection.id,
      finding.id,
    ]);

    const newTicketId = res.insertId;

    // Vincular el ticket creado al hallazgo
    await dbPool.query('UPDATE hallazgos_inspeccion SET ticket_id = ? WHERE id = ?', [newTicketId, finding.id]);

    // Actualizar conteo en la inspección
    await dbPool.query(`
      UPDATE inspecciones_infraestructura 
      SET tickets_generados = (SELECT COUNT(*) FROM hallazgos_inspeccion WHERE inspeccion_id = ? AND ticket_id IS NOT NULL)
      WHERE id = ?
    `, [inspection.id, inspection.id]);

    // Log de auditoría
    await TicketModel.logAudit({
      ticketId: newTicketId,
      usuarioId: createdByUserId,
      accion: 'CREACION_TICKET_INSPECCION_SIGI',
      valorNuevo: `Generado automáticamente desde Inspección ${inspection.codigo} (Hallazgo ${finding.item_codigo})`,
      ipOrigen: 'SIGI_SYSTEM_BRIDGE',
    });

    return { ticketId: newTicketId, ticketCodigo };
  }

  /**
   * Genera tickets automáticos para todos los hallazgos críticos de una inspección
   */
  static async createTicketsForCriticalFindings(inspeccionId: number, createdByUserId: number): Promise<{ generatedCount: number; tickets: { findingId: number; ticketCodigo: string }[] }> {
    const findings = await this.getFindingsByInspectionId(inspeccionId);
    const criticalPending = findings.filter((f) => f.estado_calificacion === 'CRITICO' && !f.ticket_id);

    const generatedTickets: { findingId: number; ticketCodigo: string }[] = [];

    for (const f of criticalPending) {
      const res = await this.createTicketForFinding(f.id, createdByUserId);
      generatedTickets.push({ findingId: f.id, ticketCodigo: res.ticketCodigo });
    }

    return {
      generatedCount: generatedTickets.length,
      tickets: generatedTickets,
    };
  }

  /**
   * Escanea y genera tickets para todos los hallazgos críticos pendientes de todo el sistema
   */
  static async generateAllPendingCriticalTickets(createdByUserId: number): Promise<{ totalGenerated: number; tickets: { findingId: number; ticketCodigo: string }[] }> {
    const [criticalFindings] = await dbPool.query<FindingDB[]>(`
      SELECT h.* FROM hallazgos_inspeccion h
      WHERE h.estado_calificacion = 'CRITICO' AND h.ticket_id IS NULL
    `);

    const generatedTickets: { findingId: number; ticketCodigo: string }[] = [];

    for (const f of criticalFindings) {
      const res = await this.createTicketForFinding(f.id, createdByUserId);
      generatedTickets.push({ findingId: f.id, ticketCodigo: res.ticketCodigo });
    }

    return {
      totalGenerated: generatedTickets.length,
      tickets: generatedTickets,
    };
  }
}
