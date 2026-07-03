import express from 'express';
import * as featured from '../controllers/featuredContentController';
import { protect, restrictTo } from '../middleware/auth';

const router = express.Router();

router.get('/', featured.getFeaturedContent);
router.post('/', protect, restrictTo('admin'), featured.createFeaturedContent);
router.put('/:id', protect, restrictTo('admin'), featured.updateFeaturedContent);
router.delete('/:id', protect, restrictTo('admin'), featured.deleteFeaturedContent);

export default router;
