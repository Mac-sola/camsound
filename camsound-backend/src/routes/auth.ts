import express from 'express';
import * as authController from '../controllers/authcontroller';
import { protect } from '../middleware/auth';
import { authLimiter } from '../middleware/rateLimiter';

const router = express.Router();

router.post('/signup', authLimiter, authController.signup);
router.post('/login', authLimiter, authController.login);
router.post('/logout', protect, authController.logout);
router.get('/me', protect, authController.getProfile);
router.put('/me', protect, authController.updateProfile);

export default router;