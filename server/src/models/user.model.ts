import { dbPool } from '../config/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { UserDB, RoleCode, ModuleArea } from '../types';

export class UserModel {
  static async findByEmail(email: string): Promise<UserDB | null> {
    const cleanEmail = email.toLowerCase().trim();
    const candidateEmails = [cleanEmail];
    if (cleanEmail === 'admin@lamolina.edu.pe') candidateEmails.push('admin.otic@lamolina.edu.pe');
    if (cleanEmail === 'admin.otic@lamolina.edu.pe') candidateEmails.push('admin@lamolina.edu.pe');
    if (cleanEmail === 'supervisor@lamolina.edu.pe') candidateEmails.push('supervisor.otic@lamolina.edu.pe');
    if (cleanEmail === 'supervisor.otic@lamolina.edu.pe') candidateEmails.push('supervisor@lamolina.edu.pe');
    if (cleanEmail === 'soporte@lamolina.edu.pe') candidateEmails.push('mesa.ayuda@lamolina.edu.pe', 'mesa@lamolina.edu.pe');
    if (cleanEmail === 'mesa.ayuda@lamolina.edu.pe') candidateEmails.push('soporte@lamolina.edu.pe', 'mesa@lamolina.edu.pe');
    if (cleanEmail === 'mesa.sg@lamolina.edu.pe') candidateEmails.push('mesasg@lamolina.edu.pe');
    if (cleanEmail === 'solicitante@lamolina.edu.pe') candidateEmails.push('20220145@lamolina.edu.pe');

    const [rows] = await dbPool.query<RowDataPacket[]>(
      `SELECT u.*, r.codigo as rol_codigo, r.nombre as rol_nombre
       FROM usuarios u
       INNER JOIN roles r ON u.rol_id = r.id
       WHERE (u.email IN (?) OR LOWER(TRIM(CONCAT(u.nombres, ' ', u.apellidos))) = ? OR LOWER(TRIM(u.nombres)) = ?) 
         AND u.estado != 'BLOQUEADO'
       ORDER BY u.id ASC LIMIT 1`,
      [candidateEmails, cleanEmail, cleanEmail]
    );

    if (rows.length === 0) return null;
    return rows[0] as UserDB;
  }

  static async findById(id: number): Promise<UserDB | null> {
    const [rows] = await dbPool.query<RowDataPacket[]>(
      `SELECT u.id, u.nombres, u.apellidos, u.email, u.rol_id, u.cargo, u.debe_cambiar_password, u.correo_pendiente,
              u.facultad_dependencia, u.ubicacion_referencia, u.telefono, u.anexo, u.foto_perfil, u.estado, u.ultimo_acceso, u.creado_en,
              r.codigo as rol_codigo, r.nombre as rol_nombre,
              COALESCE((SELECT ROUND(AVG(e.puntuacion), 1) FROM encuestas_satisfaccion e JOIN tickets t ON e.ticket_id = t.id WHERE t.tecnico_id = u.id), 5.0) as promedio_calificacion,
              (SELECT COUNT(e.id) FROM encuestas_satisfaccion e JOIN tickets t ON e.ticket_id = t.id WHERE t.tecnico_id = u.id) as total_calificaciones,
              (SELECT COUNT(t.id) FROM tickets t WHERE t.tecnico_id = u.id AND t.estado = 'RESUELTO') as total_resueltos
       FROM usuarios u
       INNER JOIN roles r ON u.rol_id = r.id
       WHERE u.id = ?`,
      [id]
    );

    if (rows.length === 0) return null;
    const row = rows[0];
    return {
      ...row,
      promedio_calificacion: row.promedio_calificacion !== null ? Number(row.promedio_calificacion) : 5.0,
      total_calificaciones: Number(row.total_calificaciones || 0),
      total_resueltos: Number(row.total_resueltos || 0),
    } as UserDB;
  }

  static async findAllTechnicians(modulo?: ModuleArea): Promise<UserDB[]> {
    let rolesCondition = `('TECNICO', 'ESPECIALISTA_REDES', 'ESPECIALISTA_DESARROLLO', 'TECNICO_SG', 'SUPERVISOR', 'SUPERVISOR_SG', 'ADMIN', 'MESA_AYUDA', 'MESA_AYUDA_SG')`;
    if (modulo === 'SERVICIOS_GENERALES') {
      rolesCondition = `('TECNICO_SG', 'SUPERVISOR_SG', 'MESA_AYUDA_SG')`;
    } else if (modulo === 'OTIC') {
      rolesCondition = `('TECNICO', 'ESPECIALISTA_REDES', 'ESPECIALISTA_DESARROLLO', 'SUPERVISOR', 'MESA_AYUDA')`;
    }

    const [rows] = await dbPool.query<RowDataPacket[]>(
      `SELECT u.id, u.nombres, u.apellidos, u.email, u.facultad_dependencia, u.cargo, u.telefono, u.anexo, u.foto_perfil, r.codigo as rol_codigo, r.nombre as rol_nombre,
              COALESCE((SELECT ROUND(AVG(e.puntuacion), 1) FROM encuestas_satisfaccion e JOIN tickets t ON e.ticket_id = t.id WHERE t.tecnico_id = u.id), 5.0) as promedio_calificacion,
              (SELECT COUNT(e.id) FROM encuestas_satisfaccion e JOIN tickets t ON e.ticket_id = t.id WHERE t.tecnico_id = u.id) as total_calificaciones,
              (SELECT COUNT(t.id) FROM tickets t WHERE t.tecnico_id = u.id AND t.estado = 'RESUELTO') as total_resueltos
       FROM usuarios u
       INNER JOIN roles r ON u.rol_id = r.id
       WHERE r.codigo IN ${rolesCondition} AND u.estado = 'ACTIVO'
       ORDER BY u.nombres ASC`
    );
    return rows.map((r) => ({
      ...r,
      promedio_calificacion: r.promedio_calificacion !== null ? Number(r.promedio_calificacion) : 5.0,
      total_calificaciones: Number(r.total_calificaciones || 0),
      total_resueltos: Number(r.total_resueltos || 0),
    })) as UserDB[];
  }

  static async updateLastLogin(userId: number): Promise<void> {
    await dbPool.query(`UPDATE usuarios SET ultimo_acceso = NOW() WHERE id = ?`, [userId]);
  }

  static async updateProfilePhoto(userId: number, fotoPerfil: string | null): Promise<void> {
    await dbPool.query(`UPDATE usuarios SET foto_perfil = ? WHERE id = ?`, [fotoPerfil, userId]);
  }

  static async updateProfile(userId: number, data: { telefono?: string; anexo?: string; facultadDependencia?: string; ubicacionReferencia?: string }): Promise<void> {
    const updates: string[] = [];
    const params: any[] = [];
    if (data.telefono !== undefined) {
      updates.push('telefono = ?');
      params.push(data.telefono);
    }
    if (data.anexo !== undefined) {
      updates.push('anexo = ?');
      params.push(data.anexo);
    }
    if (data.facultadDependencia !== undefined) {
      updates.push('facultad_dependencia = ?');
      params.push(data.facultadDependencia);
    }
    if (data.ubicacionReferencia !== undefined) {
      updates.push('ubicacion_referencia = ?');
      params.push(data.ubicacionReferencia);
    }
    if (updates.length > 0) {
      params.push(userId);
      await dbPool.query(`UPDATE usuarios SET ${updates.join(', ')} WHERE id = ?`, params);
    }
  }

  static async createUser(data: {
    nombres: string;
    apellidos: string;
    email: string;
    passwordHash: string;
    rolId: number;
    facultadDependencia: string;
    cargo?: string;
    telefono?: string;
    anexo?: string;
    fotoPerfil?: string;
  }): Promise<number> {
    const [result] = await dbPool.query<ResultSetHeader>(
      `INSERT INTO usuarios (nombres, apellidos, email, password_hash, rol_id, facultad_dependencia, cargo, telefono, anexo, foto_perfil)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.nombres,
        data.apellidos,
        data.email.toLowerCase().trim(),
        data.passwordHash,
        data.rolId,
        data.facultadDependencia,
        data.cargo || null,
        data.telefono || null,
        data.anexo || null,
        data.fotoPerfil || null,
      ]
    );
    return result.insertId;
  }

  static async findAll(filters?: {
    rolId?: number;
    estado?: string;
    search?: string;
  }): Promise<UserDB[]> {
    let sql = `
      SELECT u.id, u.nombres, u.apellidos, u.email, u.rol_id, u.cargo, u.debe_cambiar_password, u.correo_pendiente,
             u.facultad_dependencia, u.telefono, u.anexo, u.foto_perfil, u.estado, u.ultimo_acceso, u.creado_en,
             r.codigo as rol_codigo, r.nombre as rol_nombre,
             COALESCE((SELECT ROUND(AVG(e.puntuacion), 1) FROM encuestas_satisfaccion e JOIN tickets t ON e.ticket_id = t.id WHERE t.tecnico_id = u.id), 5.0) as promedio_calificacion,
             (SELECT COUNT(e.id) FROM encuestas_satisfaccion e JOIN tickets t ON e.ticket_id = t.id WHERE t.tecnico_id = u.id) as total_calificaciones,
             (SELECT COUNT(t.id) FROM tickets t WHERE t.tecnico_id = u.id AND t.estado = 'RESUELTO') as total_resueltos
      FROM usuarios u
      INNER JOIN roles r ON u.rol_id = r.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (filters?.rolId) {
      sql += ` AND u.rol_id = ?`;
      params.push(filters.rolId);
    }

    if (filters?.estado) {
      sql += ` AND u.estado = ?`;
      params.push(filters.estado);
    }

    if (filters?.search) {
      sql += ` AND (u.nombres LIKE ? OR u.apellidos LIKE ? OR u.email LIKE ? OR u.facultad_dependencia LIKE ? OR u.cargo LIKE ?)`;
      const q = `%${filters.search}%`;
      params.push(q, q, q, q, q);
    }

    sql += ` ORDER BY u.id DESC`;

    const [rows] = await dbPool.query<RowDataPacket[]>(sql, params);
    return rows.map((r) => ({
      ...r,
      promedio_calificacion: r.promedio_calificacion !== null ? Number(r.promedio_calificacion) : 5.0,
      total_calificaciones: Number(r.total_calificaciones || 0),
      total_resueltos: Number(r.total_resueltos || 0),
    })) as UserDB[];
  }

  static async updateUser(id: number, data: {
    nombres: string;
    apellidos: string;
    email: string;
    rolId: number;
    facultadDependencia: string;
    cargo?: string;
    telefono?: string;
    anexo?: string;
    fotoPerfil?: string | null;
    estado: 'ACTIVO' | 'INACTIVO' | 'BLOQUEADO';
  }): Promise<void> {
    const isNewEmailValid = data.email && !data.email.toLowerCase().startsWith('sin_correo_') && data.email.toLowerCase().endsWith('@lamolina.edu.pe');
    await dbPool.query(
      `UPDATE usuarios 
       SET nombres = ?, apellidos = ?, email = ?, rol_id = ?, facultad_dependencia = ?, cargo = ?, telefono = ?, anexo = ?, foto_perfil = ?, estado = ?
           ${isNewEmailValid ? ', correo_pendiente = 0' : ''}
       WHERE id = ?`,
      [
        data.nombres,
        data.apellidos,
        data.email.toLowerCase().trim(),
        data.rolId,
        data.facultadDependencia,
        data.cargo || null,
        data.telefono || null,
        data.anexo || null,
        data.fotoPerfil !== undefined ? data.fotoPerfil : null,
        data.estado,
        id,
      ]
    );
  }

  static async updatePassword(id: number, passwordHash: string): Promise<void> {
    await dbPool.query(`UPDATE usuarios SET password_hash = ?, debe_cambiar_password = 0 WHERE id = ?`, [passwordHash, id]);
  }

  static async completeFirstLogin(userId: number, data: {
    passwordHash?: string;
    newEmail?: string;
    facultadDependencia?: string;
    telefono?: string;
    anexo?: string;
  }): Promise<void> {
    const updates: string[] = [];
    const params: any[] = [];

    if (data.passwordHash) {
      updates.push('password_hash = ?', 'debe_cambiar_password = 0');
      params.push(data.passwordHash);
    }
    if (data.newEmail && data.newEmail.trim() !== '') {
      updates.push('email = ?', 'correo_pendiente = 0');
      params.push(data.newEmail.toLowerCase().trim());
    }
    if (data.facultadDependencia !== undefined && data.facultadDependencia.trim() !== '') {
      updates.push('facultad_dependencia = ?');
      params.push(data.facultadDependencia.trim());
    }
    if (data.telefono !== undefined) {
      updates.push('telefono = ?');
      params.push(data.telefono.trim() || null);
    }
    if (data.anexo !== undefined) {
      updates.push('anexo = ?');
      params.push(data.anexo.trim() || null);
    }

    if (updates.length > 0) {
      params.push(userId);
      await dbPool.query(`UPDATE usuarios SET ${updates.join(', ')} WHERE id = ?`, params);
    }
  }

  static async deleteUser(id: number): Promise<void> {
    await dbPool.query(`UPDATE usuarios SET estado = 'INACTIVO' WHERE id = ?`, [id]);
  }

  static async getTechnicianHistory(technicianId: number) {
    const user = await this.findById(technicianId);
    if (!user) return null;

    const [tickets] = await dbPool.query<RowDataPacket[]>(
      `SELECT t.id, t.codigo_correlativo, t.titulo, t.descripcion, t.estado, t.prioridad, t.urgencia, t.complejidad,
              t.fecha_apertura, t.fecha_resolucion, t.solucion_detalle,
              cat.nombre as categoria_nombre,
              CONCAT(sol.nombres, ' ', sol.apellidos) as solicitante_nombre,
              sol.email as solicitante_email,
              sol.facultad_dependencia as solicitante_dependencia,
              es.puntuacion as encuesta_puntuacion,
              es.comentario as encuesta_comentario,
              es.fecha_encuesta as fecha_encuesta
       FROM tickets t
       INNER JOIN categorias_servicio cat ON t.categoria_id = cat.id
       INNER JOIN usuarios sol ON t.solicitante_id = sol.id
       LEFT JOIN encuestas_satisfaccion es ON t.id = es.ticket_id
       WHERE t.tecnico_id = ?
       ORDER BY t.id DESC`,
      [technicianId]
    );

    return {
      technician: {
        id: user.id,
        nombres: user.nombres,
        apellidos: user.apellidos,
        email: user.email,
        facultadDependencia: user.facultad_dependencia,
        telefono: user.telefono,
        fotoPerfil: user.foto_perfil,
        rol: user.rol_codigo,
        rolNombre: user.rol_nombre,
        promedioCalificacion: user.promedio_calificacion ?? 5.0,
        totalCalificaciones: user.total_calificaciones ?? 0,
        totalResueltos: user.total_resueltos ?? 0,
      },
      history: tickets,
    };
  }
}
