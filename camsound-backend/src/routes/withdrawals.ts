import express from 'express';
import * as withdrawals from '../controllers/withdrawalsController';
import { protect, restrictTo } from '../middleware/auth';

const router = express.Router();

router.get('/', protect, withdrawals.getWithdrawals);
router.post('/', protect, restrictTo('artist'), withdrawals.requestWithdrawal);
router.put('/:id', protect, restrictTo('admin'), withdrawals.updateWithdrawal);

export default router;
