import { Response } from 'express';
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
}
