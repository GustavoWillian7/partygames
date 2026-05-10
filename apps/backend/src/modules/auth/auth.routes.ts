import { Router } from 'express';
import { authController } from './auth.controller';
import { validateRequest } from '../../middleware/validateRequest';
import { registerSchema, loginSchema } from './auth.schema';

const router: Router = Router();

router.post('/register', validateRequest(registerSchema), authController.register);
router.post('/login', validateRequest(loginSchema), authController.login);
router.post('/guest', authController.guest);

export default router;
