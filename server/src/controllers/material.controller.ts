import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { MaterialModel } from '../models/material.model';

export class MaterialController {
  /**
   * Listar materiales de inventario
   */
  static async listMaterials(req: AuthenticatedRequest, res: Response) {
    try {
      const { search, categoria, estadoStock } = req.query;
      const result = await MaterialModel.getAll({
        search: search as string,
        categoria: categoria as string,
        estadoStock: estadoStock as string,
      });

      return res.json({
        success: true,
        data: result.materiales,
        metricas: result.metricas,
      });
    } catch (error: any) {
      console.error('Error in listMaterials:', error);
      return res.status(500).json({ success: false, message: error.message || 'Error al listar materiales' });
    }
  }

  /**
   * Obtener detalle de material por ID
   */
  static async getMaterial(req: AuthenticatedRequest, res: Response) {
    try {
      const id = parseInt(req.params.id, 10);
      const material = await MaterialModel.getById(id);

      if (!material) {
        return res.status(404).json({ success: false, message: 'Material no encontrado' });
      }

      const movimientos = await MaterialModel.getMovements({ materialId: id, limit: 20 });

      return res.json({
        success: true,
        data: {
          ...material,
          movimientos,
        },
      });
    } catch (error: any) {
      console.error('Error in getMaterial:', error);
      return res.status(500).json({ success: false, message: error.message || 'Error al obtener material' });
    }
  }

  /**
   * Crear nuevo material
   */
  static async createMaterial(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, message: 'No autenticado' });
      }

      const {
        codigo,
        nombre,
        categoriaTaller,
        unidadMedida,
        stockInicial,
        stockMinimo,
        ubicacionAlmacen,
        precioEstimado,
      } = req.body;

      if (!nombre || !categoriaTaller) {
        return res.status(400).json({
          success: false,
          message: 'El nombre del material y la categoría del taller son obligatorios',
        });
      }

      const result = await MaterialModel.create({
        codigo,
        nombre,
        categoriaTaller,
        unidadMedida,
        stockInicial,
        stockMinimo,
        ubicacionAlmacen,
        precioEstimado,
        usuarioId: req.user.id,
        usuarioNombre: `${req.user.nombres} ${req.user.apellidos}`,
      });

      return res.status(201).json({
        success: true,
        message: 'Material registrado correctamente en el inventario',
        data: result,
      });
    } catch (error: any) {
      console.error('Error in createMaterial:', error);
      return res.status(500).json({ success: false, message: error.message || 'Error al registrar material' });
    }
  }

  /**
   * Actualizar material
   */
  static async updateMaterial(req: AuthenticatedRequest, res: Response) {
    try {
      const id = parseInt(req.params.id, 10);
      const {
        nombre,
        categoriaTaller,
        unidadMedida,
        stockMinimo,
        ubicacionAlmacen,
        precioEstimado,
      } = req.body;

      await MaterialModel.update(id, {
        nombre,
        categoriaTaller,
        unidadMedida,
        stockMinimo,
        ubicacionAlmacen,
        precioEstimado,
      });

      return res.json({
        success: true,
        message: 'Material actualizado correctamente',
      });
    } catch (error: any) {
      console.error('Error in updateMaterial:', error);
      return res.status(500).json({ success: false, message: error.message || 'Error al actualizar material' });
    }
  }

  /**
   * Eliminar material
   */
  static async deleteMaterial(req: AuthenticatedRequest, res: Response) {
    try {
      const id = parseInt(req.params.id, 10);
      await MaterialModel.delete(id);

      return res.json({
        success: true,
        message: 'Material eliminado del inventario',
      });
    } catch (error: any) {
      console.error('Error in deleteMaterial:', error);
      return res.status(500).json({ success: false, message: error.message || 'Error al eliminar material' });
    }
  }

  /**
   * Registrar movimiento de Entrada (+) o Salida (-)
   */
  static async registerMovement(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, message: 'No autenticado' });
      }

      const {
        materialId,
        tipoMovimiento,
        cantidad,
        ticketId,
        ordenTrabajoCodigo,
        motivo,
        observaciones,
      } = req.body;

      if (!materialId || !tipoMovimiento || !cantidad) {
        return res.status(400).json({
          success: false,
          message: 'Debe especificar el material, tipo de movimiento y cantidad',
        });
      }

      const result = await MaterialModel.registerMovement({
        materialId: Number(materialId),
        tipoMovimiento,
        cantidad: Number(cantidad),
        ticketId: ticketId ? Number(ticketId) : undefined,
        ordenTrabajoCodigo,
        usuarioId: req.user.id,
        usuarioNombre: `${req.user.nombres} ${req.user.apellidos}`,
        motivo,
        observaciones,
      });

      return res.json({
        success: true,
        message:
          tipoMovimiento.startsWith('ENTRADA')
            ? `¡Ingreso de stock registrado con éxito! Nuevo stock: ${result.stockNuevo}`
            : `¡Salida de stock registrada con éxito! Nuevo stock: ${result.stockNuevo}`,
        data: result,
      });
    } catch (error: any) {
      console.error('Error in registerMovement:', error);
      return res.status(400).json({ success: false, message: error.message || 'Error al procesar movimiento' });
    }
  }

  /**
   * Listar historial de movimientos / kardex
   */
  static async listMovements(req: AuthenticatedRequest, res: Response) {
    try {
      const { materialId, limit } = req.query;
      const movimientos = await MaterialModel.getMovements({
        materialId: materialId ? Number(materialId) : undefined,
        limit: limit ? Number(limit) : 100,
      });

      return res.json({
        success: true,
        data: movimientos,
      });
    } catch (error: any) {
      console.error('Error in listMovements:', error);
      return res.status(500).json({ success: false, message: error.message || 'Error al listar movimientos' });
    }
  }
}
