import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { UserTokenPayload, RoleCode } from '../types';
import { UserModel } from '../models/user.model';

export interface AuthenticatedRequest extends Request {
  user?: UserTokenPayload;
}

export async function authenticateJWT(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Acceso denegado: Token de autenticación no proporcionado',
    });
  }

  const token = authHeader.split(' ')[1];

  let decoded: UserTokenPayload;
  try {
    decoded = jwt.verify(token, env.JWT_SECRET) as UserTokenPayload;
  } catch (jwtError: any) {
    return res.status(401).json({
      success: false,
      message: 'Acceso denegado: Token inválido o expirado',
    });
  }

  try {
    // Obtener el rol actualizado en tiempo real desde la Base de Datos
    const freshUser = await UserModel.findById(decoded.id);
    if (!freshUser) {
      return res.status(401).json({
        success: false,
        message: 'Acceso denegado: Usuario no encontrado en el sistema',
      });
    }

    if (freshUser.estado === 'BLOQUEADO' || freshUser.estado === 'INACTIVO') {
      return res.status(401).json({
        success: false,
        message: 'Usuario no activo o deshabilitado',
      });
    }

    req.user = {
      ...decoded,
      rol: freshUser.rol_codigo,
      rol_id: freshUser.rol_id,
      nombres: freshUser.nombres,
      apellidos: freshUser.apellidos,
      facultad_dependencia: freshUser.facultad_dependencia,
    };

    next();
  } catch (dbError: any) {
    console.error('[authenticateJWT DB query error]:', dbError);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor al validar credenciales de usuario',
    });
  }
}

export function authorizeRoles(...allowedRoles: RoleCode[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'No autenticado',
      });
    }

    if (!allowedRoles.includes(req.user.rol)) {
      return res.status(403).json({
        success: false,
        message: `Acceso restringido: Se requiere rol [${allowedRoles.join(', ')}]. Su rol actual es [${req.user.rol}]`,
      });
    }

    next();
  };
}

export function validateUnalmEmail(email: string): boolean {
  const unalmDomainRegex = /^[a-zA-Z0-9._%+-]+@lamolina\.edu\.pe$/i;
  return unalmDomainRegex.test(email);
}
