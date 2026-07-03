import express from 'express';
import * as adminLog from '../controllers/adminLogController';
import { protect, restrictTo } from '../middleware/auth';

const router = express.Router();

router.get('/', protect, restrictTo('admin'), adminLog.getAdminLogs);
router.post('/', protect, restrictTo('admin'), adminLog.createAdminLog);

export default router;
