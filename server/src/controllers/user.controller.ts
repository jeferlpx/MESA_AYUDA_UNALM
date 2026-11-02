import { Response } from 'express';
import bcrypt from 'bcryptjs';
import { UserModel } from '../models/user.model';
import { validateUnalmEmail, AuthenticatedRequest } from '../middlewares/auth.middleware';
import { validatePeruvianPhone } from '../utils/phoneValidator';

export class UserController {
  static async getTechnicians(req: AuthenticatedRequest, res: Response) {
    try {
      const { modulo } = req.query;
      const technicians = await UserModel.findAllTechnicians(modulo as any);
      return res.json({
        success: true,
        data: technicians.map((t) => ({
          id: t.id,
          nombres: t.nombres,
          apellidos: t.apellidos,
          email: t.email,
          facultadDependencia: t.facultad_dependencia,
          telefono: t.telefono,
          fotoPerfil: t.foto_perfil,
          rol: t.rol_codigo,
          promedioCalificacion: t.promedio_calificacion ?? 5.0,
          totalCalificaciones: t.total_calificaciones ?? 0,
          totalResueltos: t.total_resueltos ?? 0,
        })),
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Error al listar personal técnico' });
    }
  }

  static async getProfile(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, message: 'No autenticado' });
      }
      const user = await UserModel.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
      }
      return res.json({
        success: true,
        data: {
          id: user.id,
          nombres: user.nombres,
          apellidos: user.apellidos,
          email: user.email,
          rolId: user.rol_id,
          rol: user.rol_codigo,
          rolNombre: user.rol_nombre,
          roles: user.roles || [user.rol_codigo],
          rolesIds: user.roles_ids || [user.rol_id],
          facultadDependencia: user.facultad_dependencia,
          ubicacionReferencia: user.ubicacion_referencia || '',
          telefono: user.telefono,
          anexo: user.anexo,
          fotoPerfil: user.foto_perfil,
          promedioCalificacion: user.promedio_calificacion ?? 5.0,
          totalCalificaciones: user.total_calificaciones ?? 0,
          totalResueltos: user.total_resueltos ?? 0,
        },
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Error al obtener perfil' });
    }
  }

  static async updateProfile(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, message: 'No autenticado' });
      }
      const { telefono, anexo, facultadDependencia, ubicacionReferencia } = req.body;
      
      let cleanTelefono: string | undefined = undefined;
      if (telefono !== undefined && String(telefono).trim() !== '') {
        const phoneVal = validatePeruvianPhone(String(telefono), true);
        if (!phoneVal.isValid) {
          return res.status(400).json({ success: false, message: `Número de celular no válido: ${phoneVal.error}` });
        }
        cleanTelefono = phoneVal.cleanNumber;
      }

      await UserModel.updateProfile(req.user.id, {
        telefono: cleanTelefono,
        anexo: anexo !== undefined ? String(anexo).trim() : undefined,
        facultadDependencia: facultadDependencia !== undefined ? String(facultadDependencia).trim() : undefined,
        ubicacionReferencia: ubicacionReferencia !== undefined ? String(ubicacionReferencia).trim() : undefined,
      });

      const updatedUser = await UserModel.findById(req.user.id);
      if (!updatedUser) {
        return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
      }

      const formattedUser = {
        id: updatedUser.id,
        nombres: updatedUser.nombres,
        apellidos: updatedUser.apellidos,
        email: updatedUser.email,
        rolId: updatedUser.rol_id,
        rol: updatedUser.rol_codigo,
        rolNombre: updatedUser.rol_nombre,
        facultadDependencia: updatedUser.facultad_dependencia,
        ubicacionReferencia: updatedUser.ubicacion_referencia || '',
        telefono: updatedUser.telefono,
        anexo: updatedUser.anexo,
        fotoPerfil: updatedUser.foto_perfil,
        promedioCalificacion: updatedUser.promedio_calificacion ?? 5.0,
        totalCalificaciones: updatedUser.total_calificaciones ?? 0,
        totalResueltos: updatedUser.total_resueltos ?? 0,
        debeCambiarPassword: Boolean(updatedUser.debe_cambiar_password),
        correoPendiente: Boolean(updatedUser.correo_pendiente),
      };

      return res.json({
        success: true,
        message: 'Información de perfil actualizada exitosamente',
        data: formattedUser,
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message || 'Error al actualizar perfil' });
    }
  }

  static async updateProfilePhoto(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, message: 'No autenticado' });
      }

      let fotoUrl: string | undefined;

      if (req.file) {
        fotoUrl = `uploads/${req.file.filename}`;
      } else if (req.body.fotoPerfil) {
        fotoUrl = req.body.fotoPerfil;
      }

      if (!fotoUrl) {
        return res.status(400).json({ success: false, message: 'No se envió ninguna imagen o URL' });
      }

      await UserModel.updateProfilePhoto(req.user.id, fotoUrl);

      return res.json({
        success: true,
        message: 'Foto de perfil actualizada correctamente',
        data: { fotoPerfil: fotoUrl },
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Error al actualizar foto de perfil' });
    }
  }

  static async createUser(req: AuthenticatedRequest, res: Response) {
    try {
      const { nombres, apellidos, email, password, rolId, rolesIds, facultadDependencia, cargo, telefono, anexo, fotoPerfil } = req.body;

      if (!nombres || !apellidos || !email || !password || !rolId || !facultadDependencia) {
        return res.status(400).json({ success: false, message: 'Faltan campos obligatorios para registrar usuario' });
      }

      if (!validateUnalmEmail(email)) {
        return res.status(400).json({ success: false, message: 'El correo debe ser dominio @lamolina.edu.pe' });
      }

      const existingUser = await UserModel.findByEmail(email);
      if (existingUser) {
        return res.status(400).json({ success: false, message: 'El correo electrónico ya se encuentra registrado' });
      }

      if (telefono && String(telefono).trim() !== '') {
        const phoneVal = validatePeruvianPhone(String(telefono), false);
        if (!phoneVal.isValid) {
          return res.status(400).json({ success: false, message: `Número de celular no válido: ${phoneVal.error}` });
        }
      }

      const passwordHash = await bcrypt.hash(password, 10);

      const parsedRolesIds = Array.isArray(rolesIds) ? rolesIds.map((r: any) => parseInt(r, 10)).filter((r: number) => !isNaN(r)) : undefined;

      const userId = await UserModel.createUser({
        nombres,
        apellidos,
        email,
        passwordHash,
        rolId: parseInt(rolId, 10),
        rolesIds: parsedRolesIds,
        facultadDependencia,
        cargo,
        telefono,
        anexo,
        fotoPerfil,
      });

      return res.status(201).json({
        success: true,
        message: 'Usuario registrado exitosamente en el sistema OTIC',
        data: { userId },
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Error al crear usuario' });
    }
  }

  static async getAllUsers(req: AuthenticatedRequest, res: Response) {
    try {
      const { rolId, estado, search } = req.query;
      const users = await UserModel.findAll({
        rolId: rolId ? parseInt(rolId as string, 10) : undefined,
        estado: estado as string,
        search: search as string,
      });

      return res.json({
        success: true,
        data: users.map((u) => ({
          id: u.id,
          nombres: u.nombres,
          apellidos: u.apellidos,
          email: u.email,
          rolId: u.rol_id,
          rol: u.rol_codigo,
          rolNombre: u.rol_nombre,
          roles: u.roles || [u.rol_codigo],
          rolesIds: u.roles_ids || [u.rol_id],
          facultadDependencia: u.facultad_dependencia,
          cargo: u.cargo,
          debeCambiarPassword: Boolean(u.debe_cambiar_password),
          correoPendiente: Boolean(u.correo_pendiente),
          telefono: u.telefono,
          anexo: u.anexo,
          fotoPerfil: u.foto_perfil,
          promedioCalificacion: u.promedio_calificacion ?? 5.0,
          totalCalificaciones: u.total_calificaciones ?? 0,
          totalResueltos: u.total_resueltos ?? 0,
          estado: u.estado,
          ultimoAcceso: u.ultimo_acceso,
          creadoEn: u.creado_en,
        })),
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Error al obtener lista de usuarios' });
    }
  }

  static async getUserById(req: AuthenticatedRequest, res: Response) {
    try {
      const id = parseInt(req.params.id, 10);
      const user = await UserModel.findById(id);
      if (!user) {
        return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
      }
      return res.json({
        success: true,
        data: {
          id: user.id,
          nombres: user.nombres,
          apellidos: user.apellidos,
          email: user.email,
          rolId: user.rol_id,
          rol: user.rol_codigo,
          rolNombre: user.rol_nombre,
          roles: user.roles || [user.rol_codigo],
          rolesIds: user.roles_ids || [user.rol_id],
          facultadDependencia: user.facultad_dependencia,
          cargo: user.cargo,
          debeCambiarPassword: Boolean(user.debe_cambiar_password),
          correoPendiente: Boolean(user.correo_pendiente),
          telefono: user.telefono,
          anexo: user.anexo,
          fotoPerfil: user.foto_perfil,
          promedioCalificacion: user.promedio_calificacion ?? 5.0,
          totalCalificaciones: user.total_calificaciones ?? 0,
          totalResueltos: user.total_resueltos ?? 0,
          estado: user.estado,
          ultimoAcceso: user.ultimo_acceso,
          creadoEn: user.creado_en,
        },
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Error al consultar usuario' });
    }
  }

  static async updateUser(req: AuthenticatedRequest, res: Response) {
    try {
      const id = parseInt(req.params.id, 10);
      const { nombres, apellidos, email, rolId, rolesIds, facultadDependencia, cargo, telefono, anexo, fotoPerfil, estado } = req.body;

      const user = await UserModel.findById(id);
      if (!user) {
        return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
      }

      if (email && !email.toLowerCase().startsWith('sin_correo_') && !validateUnalmEmail(email)) {
        return res.status(400).json({ success: false, message: 'El correo debe ser @lamolina.edu.pe' });
      }

      let cleanTelefono = user.telefono;
      if (telefono !== undefined) {
        if (String(telefono).trim() !== '') {
          const phoneVal = validatePeruvianPhone(String(telefono), false);
          if (!phoneVal.isValid) {
            return res.status(400).json({ success: false, message: `Número de celular no válido: ${phoneVal.error}` });
          }
          cleanTelefono = phoneVal.cleanNumber;
        } else {
          cleanTelefono = undefined;
        }
      }

      const parsedRolesIds = Array.isArray(rolesIds) ? rolesIds.map((r: any) => parseInt(r, 10)).filter((r: number) => !isNaN(r)) : undefined;

      await UserModel.updateUser(id, {
        nombres: nombres || user.nombres,
        apellidos: apellidos || user.apellidos,
        email: email || user.email,
        rolId: rolId ? parseInt(rolId, 10) : user.rol_id,
        rolesIds: parsedRolesIds,
        facultadDependencia: facultadDependencia || user.facultad_dependencia,
        cargo: cargo !== undefined ? cargo : user.cargo,
        telefono: cleanTelefono,
        anexo: anexo !== undefined ? anexo : user.anexo,
        fotoPerfil: fotoPerfil !== undefined ? fotoPerfil : user.foto_perfil,
        estado: estado || user.estado,
      });

      return res.json({
        success: true,
        message: 'Usuario actualizado exitosamente',
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Error al actualizar usuario' });
    }
  }

  static async updatePassword(req: AuthenticatedRequest, res: Response) {
    try {
      const id = parseInt(req.params.id, 10);
      const { password } = req.body;

      if (!password || password.length < 6) {
        return res.status(400).json({ success: false, message: 'La contraseña debe tener al menos 6 caracteres' });
      }

      const passwordHash = await bcrypt.hash(password, 10);
      await UserModel.updatePassword(id, passwordHash);

      return res.json({
        success: true,
        message: 'Contraseña restablecida exitosamente',
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Error al cambiar contraseña' });
    }
  }

  static async deleteUser(req: AuthenticatedRequest, res: Response) {
    try {
      const id = parseInt(req.params.id, 10);
      await UserModel.deleteUser(id);
      return res.json({
        success: true,
        message: 'Usuario desactivado del sistema',
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Error al desactivar usuario' });
    }
  }

  static async updateUserPhotoByAdmin(req: AuthenticatedRequest, res: Response) {
    try {
      const id = parseInt(req.params.id, 10);
      const user = await UserModel.findById(id);
      if (!user) {
        return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
      }

      let fotoUrl: string | null = null;
      if (req.file) {
        fotoUrl = `uploads/${req.file.filename}`;
      } else if (req.body.fotoPerfil !== undefined) {
        fotoUrl = req.body.fotoPerfil || null;
      }

      await UserModel.updateProfilePhoto(id, fotoUrl);

      return res.json({
        success: true,
        message: fotoUrl ? 'Foto de usuario actualizada correctamente' : 'Foto eliminada correctamente',
        data: { fotoPerfil: fotoUrl },
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Error al actualizar foto del usuario' });
    }
  }

  static async getTechnicianHistory(req: AuthenticatedRequest, res: Response) {
    try {
      const id = parseInt(req.params.id, 10);
      const data = await UserModel.getTechnicianHistory(id);
      if (!data) {
        return res.status(404).json({ success: false, message: 'Especialista no encontrado' });
      }
      return res.json({
        success: true,
        data,
      });
    } catch (error) {
      console.error('[getTechnicianHistory error]:', error);
      return res.status(500).json({ success: false, message: 'Error al consultar historial del especialista' });
    }
  }

  static async syncLdapUsers(req: AuthenticatedRequest, res: Response) {
    try {
      const { exec } = require('child_process');
      const util = require('util');
      const execPromise = util.promisify(exec);
      const scriptPath = require('path').join(__dirname, '../../scripts/sync-ldap-users.js');

      const { stdout } = await execPromise(`node "${scriptPath}"`);
      return res.json({
        success: true,
        message: 'Sincronización con Directorio Activo completada con éxito',
        data: { output: stdout },
      });
    } catch (error: any) {
      console.error('[syncLdapUsers error]:', error);
      return res.status(500).json({ success: false, message: error.message || 'Error al sincronizar con Directorio Activo' });
    }
  }
}



