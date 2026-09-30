import { Router } from 'express';
import { CatalogController } from '../controllers/catalog.controller';
import { authenticateJWT, authorizeRoles } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticateJWT);

router.get('/categories', CatalogController.getCategories);
router.get('/categories/all', authorizeRoles('ADMIN', 'SUPERVISOR', 'SUPERVISOR_SG'), CatalogController.getAllCategoriesAdmin);
router.put('/categories/reorder', authorizeRoles('ADMIN', 'SUPERVISOR', 'SUPERVISOR_SG'), CatalogController.reorderCategories);
router.post('/categories', authorizeRoles('ADMIN', 'SUPERVISOR', 'SUPERVISOR_SG'), CatalogController.createCategory);
router.put('/categories/:id', authorizeRoles('ADMIN', 'SUPERVISOR', 'SUPERVISOR_SG'), CatalogController.updateCategory);
router.delete('/categories/:id', authorizeRoles('ADMIN', 'SUPERVISOR', 'SUPERVISOR_SG'), CatalogController.deleteCategory);

export default router;

