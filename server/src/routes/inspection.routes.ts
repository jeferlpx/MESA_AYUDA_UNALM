import { Router } from 'express';
import { InspectionController } from '../controllers/inspection.controller';
import { authenticateJWT, authorizeRoles } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticateJWT);
router.use(authorizeRoles('ADMIN', 'SUPERVISOR', 'SUPERVISOR_SG', 'MESA_AYUDA_SG', 'TECNICO_SG'));

router.get('/', InspectionController.listInspections);
router.get('/:id', InspectionController.getInspectionDetail);
router.post('/:id/generate-tickets', InspectionController.generateTicketsForInspection);
router.post('/findings/:findingId/create-ticket', InspectionController.createTicketForFinding);
router.post('/generate-all-critical', InspectionController.generateAllCriticalTickets);

export default router;
