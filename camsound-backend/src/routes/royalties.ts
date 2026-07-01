import express from 'express';
import * as royalties from '../controllers/royaltiesController';
import { protect, restrictTo } from '../middleware/auth';

const router = express.Router();

router.get('/', protect, royalties.getRoyalties);
router.get('/:id', protect, royalties.getRoyalty);
router.post('/', protect, restrictTo('admin'), royalties.createRoyalty);
router.put('/:id', protect, restrictTo('admin'), royalties.updateRoyalty);

export default router;
