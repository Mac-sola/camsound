import { Router, Request, Response } from 'express';
import { initiatePayment, verifyTransaction, getPhoneFromReq } from '../services/momoService';
import Payment from '../models/Payment';
import { protect } from '../middleware/auth';

const router = Router();

// POST /api/momo/initiate -> create a simulated MoMo payment and return checkout info
router.post('/initiate', protect, async (req: Request, res: Response) => {
    try {
        const { amount } = req.body;
        if (!amount) return res.status(400).json({ success: false, message: 'Amount is required' });

        const phone = getPhoneFromReq(req);
        const tx = `TXN-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

        // Create a pending payment record so we can reconcile later
        const payment = await Payment.create({ userId: req.user?.id, amount, currency: 'XAF', paymentMethod: 'MoMo', transactionId: tx, status: 'pending' });

        const checkout = await initiatePayment(amount, phone, tx);

        res.json({ success: true, message: 'MoMo initiated (simulated)', data: { payment, checkout } });
    } catch (err: any) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// POST /api/momo/webhook -> simulate provider webhook confirming payment
// This endpoint should be protected with a provider secret in real integrations
router.post('/webhook', async (req: Request, res: Response) => {
    try {
        const { transactionId } = req.body;
        if (!transactionId) return res.status(400).json({ success: false, message: 'transactionId is required' });

        const webhookSecret = req.headers['x-momo-webhook-secret'] as string | undefined || req.body.webhookSecret;
        if (process.env.MOMO_WEBHOOK_SECRET && webhookSecret !== process.env.MOMO_WEBHOOK_SECRET) {
            return res.status(403).json({ success: false, message: 'Forbidden: invalid webhook secret' });
        }

        const result = await verifyTransaction(transactionId);

        // Update our payment record accordingly
        const status = result.success ? 'completed' : 'failed';
        const payment = await Payment.findOneAndUpdate({ transactionId }, { status }, { new: true });

        // TODO: emit events/notifications when payment completes

        res.json({ success: true, message: 'Webhook processed (simulated)', data: { result, payment } });
    } catch (err: any) {
        res.status(500).json({ success: false, message: err.message });
    }
});

export default router;
