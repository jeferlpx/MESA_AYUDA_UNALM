import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { authenticateJWT, authorizeRoles } from '../middlewares/auth.middleware';
import { uploadMiddleware } from '../middlewares/upload.middleware';

const router = Router();

router.use(authenticateJWT);

// Rutas de perfil personal (accesible para cualquier usuario autenticado)
router.get('/profile', UserController.getProfile);
router.put('/profile', UserController.updateProfile);
router.post('/profile/photo', uploadMiddleware.single('file'), UserController.updateProfilePhoto);

// Técnicos disponibles con foto y estrellas (disponible para todos los roles para mostrar tarjetas tipo Rappi)
router.get('/technicians', UserController.getTechnicians);
router.get('/technicians/:id/history', UserController.getTechnicianHistory);

// Búsqueda de solicitantes del Directorio Activo (excluyendo Administrador General) para Mesa de Ayuda
router.get('/solicitants', authorizeRoles('ADMIN', 'SUPERVISOR', 'SUPERVISOR_SG', 'MESA_AYUDA', 'MESA_AYUDA_SG'), UserController.getSolicitants);

// Rutas de administración de usuarios
router.get('/', authorizeRoles('ADMIN', 'SUPERVISOR'), UserController.getAllUsers);
router.get('/:id', authorizeRoles('ADMIN', 'SUPERVISOR'), UserController.getUserById);
router.post('/register', authorizeRoles('ADMIN'), UserController.createUser);
router.post('/sync-ldap', authorizeRoles('ADMIN', 'SUPERVISOR'), UserController.syncLdapUsers);
router.put('/:id', authorizeRoles('ADMIN'), UserController.updateUser);
router.post('/:id/photo', authorizeRoles('ADMIN'), uploadMiddleware.single('file'), UserController.updateUserPhotoByAdmin);
router.put('/:id/password', authorizeRoles('ADMIN'), UserController.updatePassword);
router.delete('/:id', authorizeRoles('ADMIN'), UserController.deleteUser);

export default router;

