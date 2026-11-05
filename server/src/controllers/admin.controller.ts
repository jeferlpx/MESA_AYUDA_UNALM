import { Response } from 'express';
import { dbPool } from '../config/db';
import { RowDataPacket } from 'mysql2';
import { TicketModel } from '../models/ticket.model';
import { ConfigModel } from '../models/config.model';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';

export class AdminController {
  static async getDashboard(req: AuthenticatedRequest, res: Response) {
    try {
      const { modulo } = req.query;
      const metrics = await TicketModel.getDashboardMetrics(modulo as any);
      return res.json({
        success: true,
        data: metrics,
      });
    } catch (error: any) {
      console.error('[getDashboard Error]:', error);
      return res.status(500).json({ success: false, message: 'Error al calcular métricas del dashboard' });
    }
  }

  static async getAuditLogs(req: AuthenticatedRequest, res: Response) {
    try {
      const { search, accion, limite } = req.query;
      const logs = await TicketModel.getAuditLogsGlobal({
        search: search as string,
        accion: accion as string,
        limite: limite ? parseInt(limite as string, 10) : 150,
      });

      return res.json({
        success: true,
        data: logs,
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: 'Error al consultar logs de auditoría' });
    }
  }

  static async getConfig(_req: AuthenticatedRequest, res: Response) {
    try {
      const configs = await ConfigModel.getAll();
      return res.json({
        success: true,
        data: configs,
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: 'Error al obtener configuración' });
    }
  }

  static async updateConfig(req: AuthenticatedRequest, res: Response) {
    try {
      const { clave, valor, descripcion } = req.body;
      if (!clave || valor === undefined) {
        return res.status(400).json({ success: false, message: 'Clave y valor requeridos' });
      }

      await ConfigModel.set(clave, String(valor), descripcion);

      return res.json({
        success: true,
        message: `Configuración [${clave}] actualizada exitosamente`,
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: 'Error al actualizar configuración' });
    }
  }

  static async getADRequests(req: AuthenticatedRequest, res: Response) {
    try {
      const { search, estado } = req.query;
      let sql = `SELECT * FROM solicitudes_cuenta_ad WHERE 1=1`;
      const params: any[] = [];

      if (estado && estado !== 'TODOS') {
        sql += ` AND estado = ?`;
        params.push(estado);
      }

      if (search && typeof search === 'string' && search.trim()) {
        sql += ` AND (nombre_completo LIKE ? OR dni LIKE ? OR email LIKE ? OR facultad_dependencia LIKE ? OR celular LIKE ?)`;
        const q = `%${search.trim()}%`;
        params.push(q, q, q, q, q);
      }

      sql += ` ORDER BY id DESC LIMIT 500`;

      const [rows] = await dbPool.query<RowDataPacket[]>(sql, params);
      return res.json({
        success: true,
        data: rows,
      });
    } catch (error: any) {
      console.error('[getADRequests Error]:', error);
      return res.status(500).json({ success: false, message: 'Error al consultar solicitudes de cuenta en Directorio Activo' });
    }
  }

  static async updateADRequestStatus(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const { estado, observacion } = req.body;
      const adminName = req.user
        ? `${req.user.nombres} ${req.user.apellidos}`.trim()
        : 'Administrador General';

      if (!['PENDIENTE', 'CREADO', 'RECHAZADO'].includes(estado)) {
        return res.status(400).json({
          success: false,
          message: 'Estado no válido. Opciones permitidas: PENDIENTE, CREADO, RECHAZADO',
        });
      }

      await dbPool.query(
        `UPDATE solicitudes_cuenta_ad 
         SET estado = ?,
             observacion = ?,
             procesado_en = NOW(),
             procesado_por = ?
         WHERE id = ?`,
        [estado, observacion ? String(observacion).trim() : null, adminName, id]
      );

      return res.json({
        success: true,
        message: `Solicitud #${id} actualizada a estado: ${estado}`,
      });
    } catch (error: any) {
      console.error('[updateADRequestStatus Error]:', error);
      return res.status(500).json({ success: false, message: 'Error al actualizar estado de la solicitud' });
    }
  }
}
