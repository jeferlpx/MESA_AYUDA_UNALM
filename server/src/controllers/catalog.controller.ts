import { Response } from 'express';
import { CategoryModel } from '../models/category.model';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';

export class CatalogController {
  static async getCategories(req: AuthenticatedRequest, res: Response) {
    try {
      const { modulo } = req.query;
      const categories = await CategoryModel.findAllActive(modulo as any);
      return res.json({
        success: true,
        data: categories,
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Error al consultar catálogo de servicios' });
    }
  }

  static async getAllCategoriesAdmin(req: AuthenticatedRequest, res: Response) {
    try {
      const { modulo } = req.query;
      const categories = await CategoryModel.findAll(modulo as any);
      return res.json({
        success: true,
        data: categories,
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Error al consultar catálogo de servicios' });
    }
  }

  static async createCategory(req: AuthenticatedRequest, res: Response) {
    try {
      const { nombre, codigo, descripcion, icono, orden, modulo, sla_horas_respuesta, sla_horas_resolucion, tecnico_defecto_id } = req.body;

      if (!nombre || !codigo || !sla_horas_respuesta || !sla_horas_resolucion) {
        return res.status(400).json({ success: false, message: 'Nombre, código y tiempos de SLA son obligatorios' });
      }

      const newId = await CategoryModel.createCategory({
        nombre,
        codigo,
        descripcion,
        icono: icono || 'HelpCircle',
        orden: orden !== undefined ? parseInt(orden, 10) : 0,
        modulo: modulo || 'OTIC',
        sla_horas_respuesta: parseInt(sla_horas_respuesta, 10),
        sla_horas_resolucion: parseInt(sla_horas_resolucion, 10),
        tecnico_defecto_id: tecnico_defecto_id ? parseInt(tecnico_defecto_id, 10) : undefined,
        activo: true,
      });

      return res.status(201).json({
        success: true,
        message: 'Categoría agregada al Catálogo de Servicios',
        data: { id: newId },
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message || 'Error al crear categoría de servicio' });
    }
  }

  static async updateCategory(req: AuthenticatedRequest, res: Response) {
    try {
      const id = parseInt(req.params.id, 10);
      const { nombre, codigo, descripcion, icono, orden, modulo, sla_horas_respuesta, sla_horas_resolucion, tecnico_defecto_id, activo } = req.body;

      const existing = await CategoryModel.findById(id);
      if (!existing) {
        return res.status(404).json({ success: false, message: 'Servicio no encontrado' });
      }

      await CategoryModel.updateCategory(id, {
        nombre,
        codigo,
        descripcion,
        icono,
        orden: orden !== undefined ? parseInt(orden, 10) : undefined,
        modulo: modulo !== undefined ? modulo : undefined,
        sla_horas_respuesta: sla_horas_respuesta !== undefined ? parseInt(sla_horas_respuesta, 10) : undefined,
        sla_horas_resolucion: sla_horas_resolucion !== undefined ? parseInt(sla_horas_resolucion, 10) : undefined,
        tecnico_defecto_id: tecnico_defecto_id !== undefined ? (tecnico_defecto_id ? parseInt(tecnico_defecto_id, 10) : null as any) : undefined,
        activo: activo !== undefined ? Boolean(activo) : undefined,
      });

      return res.json({
        success: true,
        message: 'Servicio del catálogo actualizado exitosamente',
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message || 'Error al actualizar servicio' });
    }
  }

  static async reorderCategories(req: AuthenticatedRequest, res: Response) {
    try {
      const { orders } = req.body;
      if (!Array.isArray(orders)) {
        return res.status(400).json({ success: false, message: 'El payload debe contener un arreglo de órdenes ({ id, orden }[])' });
      }

      await CategoryModel.reorderCategories(orders);
      return res.json({
        success: true,
        message: 'Orden del catálogo de servicios actualizado con éxito',
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message || 'Error al reordenar catálogo' });
    }
  }

  static async deleteCategory(req: AuthenticatedRequest, res: Response) {
    try {
      const id = parseInt(req.params.id, 10);
      await CategoryModel.deleteCategory(id);
      return res.json({
        success: true,
        message: 'Servicio desactivado del catálogo',
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: 'Error al desactivar servicio' });
    }
  }
}

