import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authenticateJWT } from '../middlewares/auth.middleware';

const router = Router();

router.post('/login', AuthController.login);
router.post('/register', AuthController.register);
router.get('/me', authenticateJWT, AuthController.me);
router.post('/complete-first-login', authenticateJWT, AuthController.completeFirstLogin);

export default router;
