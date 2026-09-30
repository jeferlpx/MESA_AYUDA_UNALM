import { Response } from 'express';
import { InspectionModel } from '../models/inspection.model';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';

export class InspectionController {
  static async listInspections(req: AuthenticatedRequest, res: Response) {
    try {
      const { search, edificio } = req.query;
      const inspections = await InspectionModel.listInspections({
        search: search as string,
        edificio: edificio as string,
      });

      return res.json({
        success: true,
        data: inspections,
      });
    } catch (error: any) {
      console.error('[listInspections Error]:', error);
      return res.status(500).json({ success: false, message: 'Error al listar inspecciones preventivas' });
    }
  }

  static async getInspectionDetail(req: AuthenticatedRequest, res: Response) {
    try {
      const id = parseInt(req.params.id, 10);
      const inspection = await InspectionModel.findById(id);

      if (!inspection) {
        return res.status(404).json({ success: false, message: 'Inspección no encontrada' });
      }

      const findings = await InspectionModel.getFindingsByInspectionId(id);

      return res.json({
        success: true,
        data: {
          inspection,
          findings,
        },
      });
    } catch (error: any) {
      console.error('[getInspectionDetail Error]:', error);
      return res.status(500).json({ success: false, message: 'Error al obtener detalle de la inspección' });
    }
  }

  static async generateTicketsForInspection(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, message: 'No autenticado' });
      }

      const id = parseInt(req.params.id, 10);
      const result = await InspectionModel.createTicketsForCriticalFindings(id, req.user.id);

      return res.json({
        success: true,
        message: result.generatedCount > 0 
          ? `Se generaron exitosamente ${result.generatedCount} tickets de atención para los hallazgos críticos de la inspección.`
          : 'Todos los hallazgos críticos de esta inspección ya cuentan con tickets generados.',
        data: result,
      });
    } catch (error: any) {
      console.error('[generateTicketsForInspection Error]:', error);
      return res.status(500).json({ success: false, message: error.message || 'Error al generar tickets para la inspección' });
    }
  }

  static async createTicketForFinding(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, message: 'No autenticado' });
      }

      const findingId = parseInt(req.params.findingId, 10);
      const result = await InspectionModel.createTicketForFinding(findingId, req.user.id);

      return res.json({
        success: true,
        message: `Ticket [${result.ticketCodigo}] creado exitosamente para el hallazgo crítico.`,
        data: result,
      });
    } catch (error: any) {
      console.error('[createTicketForFinding Error]:', error);
      return res.status(500).json({ success: false, message: error.message || 'Error al generar ticket del hallazgo' });
    }
  }

  static async generateAllCriticalTickets(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, message: 'No autenticado' });
      }

      const result = await InspectionModel.generateAllPendingCriticalTickets(req.user.id);

      return res.json({
        success: true,
        message: result.totalGenerated > 0
          ? `Se crearon exitosamente ${result.totalGenerated} tickets para todos los hallazgos críticos pendientes en el campus.`
          : 'No hay hallazgos críticos pendientes de generar ticket.',
        data: result,
      });
    } catch (error: any) {
      console.error('[generateAllCriticalTickets Error]:', error);
      return res.status(500).json({ success: false, message: error.message || 'Error al procesar tickets críticos' });
    }
  }
}
