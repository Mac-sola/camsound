import express from 'express';
import * as adRevenue from '../controllers/adRevenueController';
import { protect, restrictTo } from '../middleware/auth';

const router = express.Router();

router.get('/', protect, restrictTo('admin'), adRevenue.getAdRevenue);
router.post('/', protect, restrictTo('admin'), adRevenue.createAdRevenue);
router.put('/:id', protect, restrictTo('admin'), adRevenue.updateAdRevenue);
router.delete('/:id', protect, restrictTo('admin'), adRevenue.deleteAdRevenue);

export default router;
