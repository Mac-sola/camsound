import express from 'express';
import * as payments from '../controllers/paymentsController';
import { protect, restrictTo } from '../middleware/auth';

const router = express.Router();

router.get('/', protect, payments.getPayments);
router.post('/', protect, payments.createPayment);
router.put('/:id/status', protect, restrictTo('admin'), payments.updatePaymentStatus);

export default router;
