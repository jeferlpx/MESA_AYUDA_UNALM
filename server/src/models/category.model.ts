import { dbPool } from '../config/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { ServiceCategory, ModuleArea } from '../types';

export class CategoryModel {
  static async findAllActive(modulo?: ModuleArea): Promise<ServiceCategory[]> {
    let sql = `
      SELECT c.*, CONCAT(u.nombres, ' ', u.apellidos) as tecnico_defecto_nombre
      FROM categorias_servicio c
      LEFT JOIN usuarios u ON c.tecnico_defecto_id = u.id
      WHERE c.activo = TRUE
    `;
    const params: any[] = [];
    if (modulo) {
      sql += ` AND c.modulo = ?`;
      params.push(modulo);
    }
    sql += ` ORDER BY c.orden ASC, c.id ASC`;

    const [rows] = await dbPool.query<RowDataPacket[]>(sql, params);
    return rows as ServiceCategory[];
  }

  static async findAll(modulo?: ModuleArea): Promise<ServiceCategory[]> {
    let sql = `
      SELECT c.*, CONCAT(u.nombres, ' ', u.apellidos) as tecnico_defecto_nombre
      FROM categorias_servicio c
      LEFT JOIN usuarios u ON c.tecnico_defecto_id = u.id
    `;
    const params: any[] = [];
    if (modulo) {
      sql += ` WHERE c.modulo = ?`;
      params.push(modulo);
    }
    sql += ` ORDER BY c.orden ASC, c.id ASC`;

    const [rows] = await dbPool.query<RowDataPacket[]>(sql, params);
    return rows as ServiceCategory[];
  }

  static async findById(id: number): Promise<ServiceCategory | null> {
    const [rows] = await dbPool.query<RowDataPacket[]>(
      `SELECT c.*, CONCAT(u.nombres, ' ', u.apellidos) as tecnico_defecto_nombre
       FROM categorias_servicio c
       LEFT JOIN usuarios u ON c.tecnico_defecto_id = u.id
       WHERE c.id = ?`,
      [id]
    );

    if (rows.length === 0) return null;
    return rows[0] as ServiceCategory;
  }

  static async createCategory(data: Omit<ServiceCategory, 'id' | 'tecnico_defecto_nombre'>): Promise<number> {
    const [result] = await dbPool.query<ResultSetHeader>(
      `INSERT INTO categorias_servicio (nombre, codigo, descripcion, icono, orden, modulo, sla_horas_respuesta, sla_horas_resolucion, tecnico_defecto_id, activo)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.nombre,
        data.codigo.toUpperCase().trim(),
        data.descripcion,
        data.icono || 'HelpCircle',
        data.orden ?? 0,
        data.modulo || 'OTIC',
        data.sla_horas_respuesta,
        data.sla_horas_resolucion,
        data.tecnico_defecto_id || null,
        data.activo ?? true,
      ]
    );
    return result.insertId;
  }

  static async updateCategory(id: number, data: Partial<Omit<ServiceCategory, 'id' | 'tecnico_defecto_nombre'>>): Promise<void> {
    const updates: string[] = [];
    const params: any[] = [];

    if (data.nombre !== undefined) {
      updates.push('nombre = ?');
      params.push(data.nombre);
    }
    if (data.codigo !== undefined) {
      updates.push('codigo = ?');
      params.push(data.codigo.toUpperCase().trim());
    }
    if (data.descripcion !== undefined) {
      updates.push('descripcion = ?');
      params.push(data.descripcion);
    }
    if (data.icono !== undefined) {
      updates.push('icono = ?');
      params.push(data.icono);
    }
    if (data.orden !== undefined) {
      updates.push('orden = ?');
      params.push(data.orden);
    }
    if (data.modulo !== undefined) {
      updates.push('modulo = ?');
      params.push(data.modulo);
    }
    if (data.sla_horas_respuesta !== undefined) {
      updates.push('sla_horas_respuesta = ?');
      params.push(data.sla_horas_respuesta);
    }
    if (data.sla_horas_resolucion !== undefined) {
      updates.push('sla_horas_resolucion = ?');
      params.push(data.sla_horas_resolucion);
    }
    if (data.tecnico_defecto_id !== undefined) {
      updates.push('tecnico_defecto_id = ?');
      params.push(data.tecnico_defecto_id || null);
    }
    if (data.activo !== undefined) {
      updates.push('activo = ?');
      params.push(data.activo);
    }

    if (updates.length === 0) return;

    params.push(id);
    await dbPool.query(`UPDATE categorias_servicio SET ${updates.join(', ')} WHERE id = ?`, params);
  }

  static async reorderCategories(orders: { id: number; orden: number }[]): Promise<void> {
    const connection = await dbPool.getConnection();
    try {
      await connection.beginTransaction();
      for (const item of orders) {
        await connection.query('UPDATE categorias_servicio SET orden = ? WHERE id = ?', [item.orden, item.id]);
      }
      await connection.commit();
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  }

  static async deleteCategory(id: number): Promise<void> {
    // Soft delete para no romper historial de tickets
    await dbPool.query(`UPDATE categorias_servicio SET activo = FALSE WHERE id = ?`, [id]);
  }
}

