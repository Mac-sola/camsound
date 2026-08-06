import express from 'express';
import * as authController from '../controllers/authcontroller';
import { protect } from '../middleware/auth';
import { authLimiter } from '../middleware/rateLimiter';

const router = express.Router();

router.post('/signup', authLimiter, authController.signup);
router.post('/login', authLimiter, authController.login);
router.post('/logout', protect, authController.logout);
router.delete('/logout', protect, authController.logout);
router.get('/me', protect, authController.getProfile);
router.get('/session', protect, authController.session);
router.delete('/session', protect, authController.logout);
router.put('/me', protect, authController.updateProfile);
router.put('/change-password', protect, authController.changePassword);

export default router;