import express from 'express';
import * as userReports from '../controllers/userReportController';
import { protect } from '../middleware/auth';

const router = express.Router();

router.get('/', protect, userReports.getMyReports);
router.post('/', protect, userReports.submitReport);

export default router;
