import express from 'express';
import * as stats from '../controllers/statsController';
import { protect, restrictTo } from '../middleware/auth';

const router = express.Router();

router.get('/global', protect, restrictTo('admin'), stats.getGlobalStats);
router.get('/artist', protect, restrictTo('artist'), stats.getArtistStats);
router.get('/fan-totals', protect, restrictTo('fan'), stats.getFanStats);

export default router;
