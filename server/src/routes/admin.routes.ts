import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller';
import { authenticateJWT, authorizeRoles } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticateJWT);

router.get(
  '/dashboard',
  authorizeRoles('ADMIN', 'SUPERVISOR', 'SUPERVISOR_SG', 'MESA_AYUDA', 'MESA_AYUDA_SG'),
  AdminController.getDashboard
);

router.get(
  '/audit-logs',
  authorizeRoles('ADMIN', 'SUPERVISOR', 'SUPERVISOR_SG'),
  AdminController.getAuditLogs
);

router.get(
  '/config',
  authorizeRoles('ADMIN', 'SUPERVISOR', 'SUPERVISOR_SG'),
  AdminController.getConfig
);

router.post(
  '/config',
  authorizeRoles('ADMIN', 'SUPERVISOR', 'SUPERVISOR_SG'),
  AdminController.updateConfig
);

export default router;
