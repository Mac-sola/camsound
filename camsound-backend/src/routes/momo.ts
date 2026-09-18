import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { initiatePayment, verifyTransaction, disbursePayment, getPhoneFromReq } from '../services/momoService';
import Payment from '../models/Payment';
import Subscription from '../models/Subscription';
import Withdrawal from '../models/Withdrawal';
import User from '../models/User';

const router = Router();

// Optional token extraction helper
const extractUser = async (req: Request) => {
    try {
        const token = req.headers.authorization?.split(' ')[1] || req.cookies?.token;
        if (!token) return null;
        const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
        return await User.findById(decoded.id);
    } catch {
        return null;
    }
};

// POST /api/momo/initiate -> create simulated MoMo payment prompt
router.post('/initiate', async (req: Request, res: Response) => {
    try {
        const user = req.user || await extractUser(req);
        const { amount, planName, reason, currency } = req.body;
        if (!amount) return res.status(400).json({ success: false, message: 'Amount is required' });

        const phone = getPhoneFromReq(req) || '670000000';
        const tx = `MOMO-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

        // Create a pending payment record
        const payment = await Payment.create({
            userId: user?._id || user?.id,
            amount: Number(amount),
            currency: currency || 'XAF',
            paymentMethod: 'MTN MoMo',
            transactionId: tx,
            status: 'pending',
        });

        const checkout = await initiatePayment(Number(amount), phone, tx);

        res.json({
            success: true,
            message: `MTN MoMo prompt initiated for ${phone}`,
            data: { payment, checkout, planName, reason }
        });
    } catch (err: any) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// POST /api/momo/verify -> verify transaction and activate subscription or record payment
router.post('/verify', async (req: Request, res: Response) => {
    try {
        const user = req.user || await extractUser(req);
        const { transactionId, planName, amount } = req.body;
        if (!transactionId) return res.status(400).json({ success: false, message: 'transactionId is required' });

        const result = await verifyTransaction(transactionId);
        const status = result.success ? 'completed' : 'failed';

        // Update payment record if exists
        let payment = await Payment.findOneAndUpdate({ transactionId }, { status }, { new: true });
        if (!payment && user) {
            payment = await Payment.create({
                userId: user._id || user.id,
                amount: amount || 0,
                currency: 'XAF',
                paymentMethod: 'MTN MoMo',
                transactionId,
                status: 'completed',
            });
        }

        // If subscription plan is provided, activate subscription for user
        let subscription = null;
        if (result.success && planName && user) {
            const startDate = new Date();
            const endDate = new Date();
            endDate.setMonth(endDate.getMonth() + 1);

            subscription = await Subscription.create({
                userId: user._id || user.id,
                planName,
                amount: amount || 0,
                startDate,
                endDate,
                status: 'active',
            });

            // Update user's subscription status
            const subTier = planName.toLowerCase().includes('vip') || planName.toLowerCase().includes('annual') ? 'vip' : 'premium';
            await User.findByIdAndUpdate(user._id || user.id, { subscriptionStatus: subTier });
        }

        res.json({
            success: true,
            message: 'MTN MoMo payment successfully verified and completed!',
            data: { result, payment, subscription }
        });
    } catch (err: any) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// POST /api/momo/disburse -> simulate artist revenue cashout via MoMo
router.post('/disburse', async (req: Request, res: Response) => {
    try {
        const { amount, phone, withdrawalId } = req.body;
        if (!amount || !phone) {
            return res.status(400).json({ success: false, message: 'Amount and MoMo phone number are required' });
        }

        const payout = await disbursePayment(Number(amount), phone, withdrawalId);

        if (withdrawalId) {
            await Withdrawal.findByIdAndUpdate(withdrawalId, {
                status: 'completed',
                transactionId: payout.transactionId,
                processedAt: new Date()
            });
        }

        res.json({
            success: true,
            message: `MTN MoMo payout of ${payout.netAmount.toLocaleString()} XAF sent to ${phone}`,
            data: payout
        });
    } catch (err: any) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// POST /api/momo/webhook -> simulate provider webhook
router.post('/webhook', async (req: Request, res: Response) => {
    try {
        const { transactionId } = req.body;
        if (!transactionId) return res.status(400).json({ success: false, message: 'transactionId is required' });

        const result = await verifyTransaction(transactionId);
        const status = result.success ? 'completed' : 'failed';
        const payment = await Payment.findOneAndUpdate({ transactionId }, { status }, { new: true });

        res.json({ success: true, message: 'Webhook processed (simulated)', data: { result, payment } });
    } catch (err: any) {
        res.status(500).json({ success: false, message: err.message });
    }
});

export default router;

