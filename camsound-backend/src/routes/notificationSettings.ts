import express from 'express';
import * as notificationSettings from '../controllers/notificationSettingsController';
import { protect } from '../middleware/auth';

const router = express.Router();

router.get('/', protect, notificationSettings.getNotificationSettings);
router.put('/', protect, notificationSettings.updateNotificationSettings);

export default router;
