import { dbPool } from '../config/db';
import { RowDataPacket } from 'mysql2';

export class ConfigModel {
  static async get(key: string, defaultValue: string = ''): Promise<string> {
    try {
      const [rows] = await dbPool.query<RowDataPacket[]>(
        `SELECT valor FROM configuracion_sistema WHERE clave = ?`,
        [key]
      );
      if (rows.length === 0) return defaultValue;
      return rows[0].valor;
    } catch (e) {
      return defaultValue;
    }
  }

  static async isAutoAssignEnabled(): Promise<boolean> {
    const val = await this.get('asignacion_automatica_inmediata', 'false');
    return val === 'true' || val === '1';
  }

  static async set(key: string, value: string, descripcion?: string): Promise<void> {
    await dbPool.query(
      `INSERT INTO configuracion_sistema (clave, valor, descripcion)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE valor = VALUES(valor), descripcion = IFNULL(VALUES(descripcion), descripcion)`,
      [key, value, descripcion || null]
    );
  }

  static async getAll(): Promise<Record<string, string>> {
    try {
      const [rows] = await dbPool.query<RowDataPacket[]>(
        `SELECT clave, valor FROM configuracion_sistema`
      );
      const result: Record<string, string> = {};
      for (const row of rows) {
        result[row.clave] = row.valor;
      }
      return result;
    } catch (e) {
      return {};
    }
  }
}
