import { dbPool } from '../config/db';

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

export class MaterialModel {
  /**
   * Obtener todos los materiales con filtros y estado de stock calculado
   */
  static async getAll(filters?: { search?: string; categoria?: string; estadoStock?: string }) {
    let sql = `
      SELECT 
        id,
        codigo,
        nombre,
        categoria_taller,
        unidad_medida,
        (stock_actual + 0) as stock_actual,
        (stock_minimo + 0) as stock_minimo,
        ubicacion_almacen,
        (precio_unitario_estimado + 0) as precio_unitario_estimado,
        CASE
          WHEN stock_actual <= 0 THEN 'AGOTADO'
          WHEN stock_actual <= stock_minimo THEN 'STOCK_BAJO'
          ELSE 'DISPONIBLE'
        END AS estado_stock,
        creado_en,
        actualizado_en
      FROM materiales_inventario_sg
      WHERE 1=1
    `;
    const params: any[] = [];

    if (filters?.search && filters.search !== 'undefined' && filters.search.trim() !== '') {
      sql += ` AND (nombre LIKE ? OR codigo LIKE ? OR ubicacion_almacen LIKE ?)`;
      const term = `%${filters.search.trim()}%`;
      params.push(term, term, term);
    }

    if (filters?.categoria && filters.categoria !== 'undefined' && filters.categoria !== 'ALL') {
      sql += ` AND categoria_taller = ?`;
      params.push(filters.categoria);
    }

    if (filters?.estadoStock && filters.estadoStock !== 'undefined' && filters.estadoStock !== 'ALL') {
      if (filters.estadoStock === 'AGOTADO') {
        sql += ` AND stock_actual <= 0`;
      } else if (filters.estadoStock === 'STOCK_BAJO') {
        sql += ` AND stock_actual > 0 AND stock_actual <= stock_minimo`;
      } else if (filters.estadoStock === 'DISPONIBLE') {
        sql += ` AND stock_actual > stock_minimo`;
      }
    }

    sql += ` ORDER BY categoria_taller ASC, nombre ASC`;

    const [rows]: any = await dbPool.query(sql, params);

    const mappedMaterials: MaterialSG[] = (rows as any[]).map((r) => ({
      id: Number(r.id),
      codigo: r.codigo,
      nombre: r.nombre,
      categoria_taller: r.categoria_taller,
      unidad_medida: r.unidad_medida,
      stock_actual: Number(r.stock_actual) || 0,
      stock_minimo: Number(r.stock_minimo) || 0,
      ubicacion_almacen: r.ubicacion_almacen,
      precio_unitario_estimado: r.precio_unitario_estimado != null ? Number(r.precio_unitario_estimado) : 0,
      estado_stock: r.estado_stock,
      creado_en: r.creado_en,
      actualizado_en: r.actualizado_en,
    }));

    // Calcular métricas de resumen
    const [metricsRows]: any = await dbPool.query(`
      SELECT
        COUNT(*) as total_materiales,
        SUM(CASE WHEN stock_actual <= 0 THEN 1 ELSE 0 END) as total_agotados,
        SUM(CASE WHEN stock_actual > 0 AND stock_actual <= stock_minimo THEN 1 ELSE 0 END) as total_stock_bajo,
        SUM(CASE WHEN stock_actual > stock_minimo THEN 1 ELSE 0 END) as total_disponibles,
        COALESCE(SUM(stock_actual), 0) as total_unidades_fisicas
      FROM materiales_inventario_sg
    `);

    const metrics = metricsRows[0] || {
      total_materiales: 0,
      total_agotados: 0,
      total_stock_bajo: 0,
      total_disponibles: 0,
      total_unidades_fisicas: 0,
    };

    return {
      materiales: mappedMaterials,
      metricas: {
        total_materiales: Number(metrics.total_materiales) || 0,
        total_agotados: Number(metrics.total_agotados) || 0,
        total_stock_bajo: Number(metrics.total_stock_bajo) || 0,
        total_disponibles: Number(metrics.total_disponibles) || 0,
        total_unidades_fisicas: Number(metrics.total_unidades_fisicas) || 0,
      },
    };
  }

  /**
   * Obtener material por ID
   */
  static async getById(id: number) {
    const [rows]: any = await dbPool.query(
      `
      SELECT 
        id,
        codigo,
        nombre,
        categoria_taller,
        unidad_medida,
        (stock_actual + 0) as stock_actual,
        (stock_minimo + 0) as stock_minimo,
        ubicacion_almacen,
        (precio_unitario_estimado + 0) as precio_unitario_estimado,
        CASE
          WHEN stock_actual <= 0 THEN 'AGOTADO'
          WHEN stock_actual <= stock_minimo THEN 'STOCK_BAJO'
          ELSE 'DISPONIBLE'
        END AS estado_stock,
        creado_en,
        actualizado_en
      FROM materiales_inventario_sg
      WHERE id = ?
    `,
      [id]
    );

    if (!rows[0]) return null;
    const r = rows[0];
    return {
      ...r,
      stock_actual: Number(r.stock_actual) || 0,
      stock_minimo: Number(r.stock_minimo) || 0,
      precio_unitario_estimado: r.precio_unitario_estimado != null ? Number(r.precio_unitario_estimado) : 0,
    } as MaterialSG;
  }

  /**
   * Crear nuevo material en inventario
   */
  static async create(data: {
    codigo?: string;
    nombre: string;
    categoriaTaller: string;
    unidadMedida?: string;
    stockInicial?: number;
    stockMinimo?: number;
    ubicacionAlmacen?: string;
    precioEstimado?: number;
    usuarioId: number;
    usuarioNombre: string;
  }) {
    let codigo = data.codigo?.trim();
    if (!codigo) {
      // Generar correlativo automático por taller
      const prefix = data.categoriaTaller.substring(0, 4).toUpperCase();
      const randomNum = Math.floor(100 + Math.random() * 900);
      codigo = `MAT-${prefix}-${randomNum}`;
    }

    const stockInicial = Number(data.stockInicial) || 0;
    const stockMinimo = Number(data.stockMinimo) || 5;

    const [result]: any = await dbPool.query(
      `
      INSERT INTO materiales_inventario_sg
      (codigo, nombre, categoria_taller, unidad_medida, stock_actual, stock_minimo, ubicacion_almacen, precio_unitario_estimado)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,
      [
        codigo,
        data.nombre.trim(),
        data.categoriaTaller.trim(),
        data.unidadMedida?.trim() || 'Unidad (und)',
        stockInicial,
        stockMinimo,
        data.ubicacionAlmacen?.trim() || 'Almacén Central SG',
        Number(data.precioEstimado) || 0,
      ]
    );

    const materialId = result.insertId;

    // Si tiene stock inicial > 0, registrar movimiento de apertura
    if (stockInicial > 0) {
      await dbPool.query(
        `
        INSERT INTO materiales_movimientos_sg
        (material_id, tipo_movimiento, cantidad, stock_anterior, stock_nuevo, usuario_id, usuario_nombre, motivo, observaciones)
        VALUES (?, 'ENTRADA_COMPRA', ?, 0, ?, ?, ?, 'Inventario Inicial / Alta de Material', 'Registro inicial en sistema')
      `,
        [materialId, stockInicial, stockInicial, data.usuarioId, data.usuarioNombre]
      );
    }

    return { id: materialId, codigo };
  }

  /**
   * Actualizar material
   */
  static async update(
    id: number,
    data: {
      nombre?: string;
      categoriaTaller?: string;
      unidadMedida?: string;
      stockMinimo?: number;
      ubicacionAlmacen?: string;
      precioEstimado?: number;
    }
  ) {
    await dbPool.query(
      `
      UPDATE materiales_inventario_sg
      SET 
        nombre = COALESCE(?, nombre),
        categoria_taller = COALESCE(?, categoria_taller),
        unidad_medida = COALESCE(?, unidad_medida),
        stock_minimo = COALESCE(?, stock_minimo),
        ubicacion_almacen = COALESCE(?, ubicacion_almacen),
        precio_unitario_estimado = COALESCE(?, precio_unitario_estimado)
      WHERE id = ?
    `,
      [
        data.nombre?.trim(),
        data.categoriaTaller?.trim(),
        data.unidadMedida?.trim(),
        data.stockMinimo !== undefined ? Number(data.stockMinimo) : undefined,
        data.ubicacionAlmacen?.trim(),
        data.precioEstimado !== undefined ? Number(data.precioEstimado) : undefined,
        id,
      ]
    );
  }

  /**
   * Eliminar material
   */
  static async delete(id: number) {
    await dbPool.query(`DELETE FROM materiales_inventario_sg WHERE id = ?`, [id]);
  }

  /**
   * Registrar movimiento de Entrada (+) o Salida (-) de stock
   */
  static async registerMovement(data: {
    materialId: number;
    tipoMovimiento: 'ENTRADA_COMPRA' | 'ENTRADA_DEVOLUCION' | 'SALIDA_OT' | 'SALIDA_AJUSTE';
    cantidad: number;
    ticketId?: number;
    ordenTrabajoCodigo?: string;
    usuarioId: number;
    usuarioNombre: string;
    motivo?: string;
    observaciones?: string;
  }) {
    const connection = await dbPool.getConnection();
    try {
      await connection.beginTransaction();

      // 1. Obtener stock actual con lock
      const [rows]: any = await connection.query(
        `SELECT id, nombre, stock_actual, stock_minimo FROM materiales_inventario_sg WHERE id = ? FOR UPDATE`,
        [data.materialId]
      );

      if (rows.length === 0) {
        throw new Error('El material no existe en el inventario');
      }

      const material = rows[0];
      const stockAnterior = Number(material.stock_actual);
      const cantidad = Number(data.cantidad);

      if (cantidad <= 0) {
        throw new Error('La cantidad debe ser mayor a 0');
      }

      let stockNuevo = stockAnterior;
      const esEntrada =
        data.tipoMovimiento === 'ENTRADA_COMPRA' || data.tipoMovimiento === 'ENTRADA_DEVOLUCION';

      if (esEntrada) {
        stockNuevo = stockAnterior + cantidad;
      } else {
        if (stockAnterior < cantidad) {
          throw new Error(
            `Stock insuficiente para "${material.nombre}". Stock disponible: ${stockAnterior}, requerido: ${cantidad}`
          );
        }
        stockNuevo = stockAnterior - cantidad;
      }

      // 2. Actualizar stock en tabla principal
      await connection.query(
        `UPDATE materiales_inventario_sg SET stock_actual = ? WHERE id = ?`,
        [stockNuevo, data.materialId]
      );

      // 3. Registrar en kardex / movimientos
      await connection.query(
        `
        INSERT INTO materiales_movimientos_sg
        (material_id, tipo_movimiento, cantidad, stock_anterior, stock_nuevo, ticket_id, orden_trabajo_codigo, usuario_id, usuario_nombre, motivo, observaciones)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
        [
          data.materialId,
          data.tipoMovimiento,
          cantidad,
          stockAnterior,
          stockNuevo,
          data.ticketId || null,
          data.ordenTrabajoCodigo?.trim() || null,
          data.usuarioId,
          data.usuarioNombre,
          data.motivo?.trim() || null,
          data.observaciones?.trim() || null,
        ]
      );

      await connection.commit();
      return { success: true, stockAnterior, stockNuevo };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Obtener historial de movimientos / kardex
   */
  static async getMovements(filters?: { materialId?: number; limit?: number }) {
    let sql = `
      SELECT 
        m.id,
        m.material_id,
        mat.codigo as material_codigo,
        mat.nombre as material_nombre,
        mat.categoria_taller,
        mat.unidad_medida,
        m.tipo_movimiento,
        (m.cantidad + 0) as cantidad,
        (m.stock_anterior + 0) as stock_anterior,
        (m.stock_nuevo + 0) as stock_nuevo,
        m.ticket_id,
        m.orden_trabajo_codigo,
        m.usuario_id,
        m.usuario_nombre,
        m.motivo,
        m.observaciones,
        m.fecha
      FROM materiales_movimientos_sg m
      JOIN materiales_inventario_sg mat ON m.material_id = mat.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (filters?.materialId) {
      sql += ` AND m.material_id = ?`;
      params.push(filters.materialId);
    }

    sql += ` ORDER BY m.fecha DESC LIMIT ?`;
    params.push(Number(filters?.limit) || 100);

    const [rows]: any = await dbPool.query(sql, params);
    return rows as MaterialMovimientoSG[];
  }
}
