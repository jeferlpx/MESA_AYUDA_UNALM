import { Router } from 'express';
import { MaterialController } from '../controllers/material.controller';
import { authenticateJWT, authorizeRoles } from '../middlewares/auth.middleware';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticateJWT);

// Rutas de Inventario
router.get('/', MaterialController.listMaterials);
router.get('/movimientos', MaterialController.listMovements);
router.get('/:id', MaterialController.getMaterial);

// Modificación y registro de stock (Mesa de ayuda, supervisores, técnicos SG y admin)
router.post(
  '/',
  authorizeRoles('ADMIN', 'SUPERVISOR', 'SUPERVISOR_SG', 'MESA_AYUDA', 'MESA_AYUDA_SG', 'TECNICO_SG'),
  MaterialController.createMaterial
);

router.put(
  '/:id',
  authorizeRoles('ADMIN', 'SUPERVISOR', 'SUPERVISOR_SG', 'MESA_AYUDA', 'MESA_AYUDA_SG', 'TECNICO_SG'),
  MaterialController.updateMaterial
);

router.delete(
  '/:id',
  authorizeRoles('ADMIN', 'SUPERVISOR', 'SUPERVISOR_SG', 'MESA_AYUDA_SG'),
  MaterialController.deleteMaterial
);

router.post(
  '/movimientos',
  authorizeRoles('ADMIN', 'SUPERVISOR', 'SUPERVISOR_SG', 'MESA_AYUDA', 'MESA_AYUDA_SG', 'TECNICO_SG', 'TECNICO', 'ESPECIALISTA_REDES', 'ESPECIALISTA_DESARROLLO'),
  MaterialController.registerMovement
);

export default router;
