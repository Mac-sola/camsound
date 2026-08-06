import express from 'express';
import * as notif from '../controllers/notificationsController';
import { protect } from '../middleware/auth';

const router = express.Router();

router.get('/', protect, notif.getNotifications);
router.post('/', protect, notif.createNotification);
router.put('/', protect, notif.updateNotification);
router.put('/read-all', protect, notif.markAllRead);
router.put('/:id/read', protect, notif.markRead);
router.delete('/', protect, notif.deleteNotification);
router.delete('/:id', protect, notif.deleteNotification);

export default router;
