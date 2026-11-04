import { Router, Request, Response, NextFunction } from 'express';
import { TicketController } from '../controllers/ticket.controller';
import { authenticateJWT, authorizeRoles } from '../middlewares/auth.middleware';
import { uploadMiddleware } from '../middlewares/upload.middleware';

const router = Router();

router.use(authenticateJWT);

const handleFlexibleUpload = (req: Request, res: Response, next: NextFunction) => {
  uploadMiddleware.any()(req, res, (err: any) => {
    if (err) {
      return res.status(400).json({ success: false, message: err.message || 'Error al procesar archivo adjunto' });
    }
    if (req.files && Array.isArray(req.files) && req.files.length > 0) {
      req.file = req.files[0];
    }
    next();
  });
};

router.get('/', TicketController.listTickets);
router.get('/equipment/summary', TicketController.getEquipmentSummary);
router.get('/inventory/:inventoryNumber', TicketController.getEquipmentHistory);
router.post('/purge', authorizeRoles('ADMIN'), TicketController.purgeTickets);
router.get('/:id', TicketController.getTicketDetail);
router.post('/', handleFlexibleUpload, TicketController.createTicket);
router.put('/:id/status', authorizeRoles('ADMIN', 'SUPERVISOR', 'SUPERVISOR_SG', 'TECNICO', 'ESPECIALISTA_REDES', 'ESPECIALISTA_DESARROLLO', 'TECNICO_SG', 'MESA_AYUDA', 'MESA_AYUDA_SG', 'SOLICITANTE'), handleFlexibleUpload, TicketController.changeStatus);
router.put('/:id/assign', authorizeRoles('ADMIN', 'SUPERVISOR', 'SUPERVISOR_SG', 'MESA_AYUDA', 'MESA_AYUDA_SG'), TicketController.assignTicket);
router.put('/:id/observe', authorizeRoles('ADMIN', 'SUPERVISOR', 'SUPERVISOR_SG', 'MESA_AYUDA', 'MESA_AYUDA_SG'), handleFlexibleUpload, TicketController.observeTicket);
router.put('/:id/derive', authorizeRoles('ADMIN', 'SUPERVISOR', 'SUPERVISOR_SG', 'MESA_AYUDA', 'MESA_AYUDA_SG', 'TECNICO', 'ESPECIALISTA_REDES', 'ESPECIALISTA_DESARROLLO', 'TECNICO_SG'), TicketController.deriveTicket);
router.put('/:id/reopen', authorizeRoles('ADMIN', 'SUPERVISOR', 'SUPERVISOR_SG', 'MESA_AYUDA', 'MESA_AYUDA_SG', 'SOLICITANTE'), TicketController.reopenTicket);
router.post('/:id/survey', authorizeRoles('ADMIN', 'SUPERVISOR', 'SUPERVISOR_SG', 'SOLICITANTE'), TicketController.submitSurvey);
router.post('/:id/comments', handleFlexibleUpload, TicketController.addComment);
router.post('/:id/attachments', handleFlexibleUpload, TicketController.addAttachments);

export default router;

