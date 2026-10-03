import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { getPaymentGateway } from '../services/gatewayFactory';
import Payment from '../models/Payment';
import Subscription from '../models/Subscription';
import Withdrawal from '../models/Withdrawal';
import User from '../models/User';
import Plan from '../models/Plan';

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

// POST /api/momo/initiate -> create MoMo payment prompt via gateway
router.post('/initiate', async (req: Request, res: Response) => {
    try {
        const user = req.user || await extractUser(req);
        const { amount, planName, reason, currency, phone: bodyPhone } = req.body;
        if (!amount) return res.status(400).json({ success: false, message: 'Amount is required' });

        const phone = bodyPhone || req.body.momoNumber || req.body.phoneNumber || '670000000';
        const gateway = getPaymentGateway();

        // Create a pending payment record first
        const payment = await Payment.create({
            userId: user?._id || user?.id,
            amount: Number(amount),
            currency: currency || 'XAF',
            paymentMethod: `MTN MoMo (${gateway.name})`,
            transactionId: `PENDING-${Date.now()}`,
            phone,
            purpose: planName ? 'subscription' : (reason?.toLowerCase().includes('tip') ? 'tip' : 'other'),
            status: 'pending',
        });

        // Initiate via gateway abstraction
        const checkout = await gateway.initiate({
            amount: Number(amount),
            phone,
            currency: currency || 'XAF',
            reason: reason || `${planName || 'CamSound'} payment`,
            externalReference: payment._id?.toString(),
            metadata: { planName, userId: user?._id?.toString() },
        });

        // Update payment with real transaction ID
        payment.transactionId = checkout.transactionId;
        await payment.save();

        res.json({
            success: true,
            transactionId: checkout.transactionId,
            message: checkout.message,
            data: { transactionId: checkout.transactionId, payment, checkout, planName, reason },
        });
    } catch (err: any) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// POST /api/momo/verify -> verify transaction and activate subscription
router.post('/verify', async (req: Request, res: Response) => {
    try {
        const user = req.user || await extractUser(req);
        const { transactionId, planName, amount } = req.body;
        if (!transactionId) return res.status(400).json({ success: false, message: 'transactionId is required' });

        const gateway = getPaymentGateway();
        const result = await gateway.verify(transactionId);
        const status = result.success ? 'completed' : 'failed';

        // Update payment record
        let payment = await Payment.findOneAndUpdate(
            { transactionId },
            {
                status,
                gatewayTransactionId: result.financialTransactionId,
            },
            { new: true }
        );

        if (!payment && user) {
            payment = await Payment.create({
                userId: user._id || user.id,
                amount: amount || 0,
                currency: 'XAF',
                paymentMethod: `MTN MoMo (${gateway.name})`,
                transactionId,
                gatewayTransactionId: result.financialTransactionId,
                purpose: planName ? 'subscription' : 'other',
                status: 'completed',
            });
        }

        // If subscription plan is provided and payment succeeded, activate subscription
        let subscription = null;
        if (result.success && planName && user) {
            // Look up plan to get proper period duration
            const plan = await Plan.findOne({ name: planName });
            const startDate = new Date();
            const endDate = new Date();

            // Calculate end date based on plan period
            const period = plan?.period?.toLowerCase() || '/month';
            if (period.includes('year') || period.includes('annual')) {
                endDate.setFullYear(endDate.getFullYear() + 1);
            } else if (period.includes('week')) {
                endDate.setDate(endDate.getDate() + 7);
            } else {
                // Default: monthly
                endDate.setMonth(endDate.getMonth() + 1);
            }

            // Expire any existing active subscriptions for this user
            await Subscription.updateMany(
                { userId: user._id || user.id, status: 'active' },
                { status: 'expired' }
            );

            subscription = await Subscription.create({
                userId: user._id || user.id,
                planId: plan?._id,
                planName,
                amount: amount || plan?.price || 0,
                currency: plan?.currency || 'XAF',
                startDate,
                endDate,
                status: 'active',
                paymentTransactionId: transactionId,
                autoRenew: false,
            });

            // Update user's subscription status
            const isVIP = planName.toLowerCase().includes('vip') || planName.toLowerCase().includes('annual');
            await User.findByIdAndUpdate(user._id || user.id, {
                subscriptionStatus: isVIP ? 'vip' : 'premium',
            });
        }

        res.json({
            success: true,
            message: result.success
                ? 'MTN MoMo payment successfully verified and completed!'
                : 'Payment verification failed',
            data: { result, payment, subscription },
        });
    } catch (err: any) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// POST /api/momo/disburse -> artist revenue cashout via MoMo
router.post('/disburse', async (req: Request, res: Response) => {
    try {
        const { amount, phone, withdrawalId } = req.body;
        if (!amount || !phone) {
            return res.status(400).json({ success: false, message: 'Amount and MoMo phone number are required' });
        }

        const gateway = getPaymentGateway();
        const payout = await gateway.disburse({
            amount: Number(amount),
            phone,
            reason: 'Artist revenue cashout',
            externalReference: withdrawalId,
        });

        if (withdrawalId) {
            await Withdrawal.findByIdAndUpdate(withdrawalId, {
                status: 'completed',
                transactionId: payout.transactionId,
                processedAt: new Date(),
            });
        }

        res.json({
            success: true,
            message: `MTN MoMo payout of ${payout.netAmount.toLocaleString()} XAF sent to ${phone}`,
            data: payout,
        });
    } catch (err: any) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// POST /api/momo/webhook -> provider callback/webhook
router.post('/webhook', async (req: Request, res: Response) => {
    try {
        const gateway = getPaymentGateway();

        // Validate webhook signature (important for real gateways)
        if (!gateway.validateWebhook(req.headers as any, req.body)) {
            return res.status(401).json({ success: false, message: 'Invalid webhook signature' });
        }

        const { transactionId } = req.body;
        if (!transactionId) return res.status(400).json({ success: false, message: 'transactionId is required' });

        const result = await gateway.verify(transactionId);
        const status = result.success ? 'completed' : 'failed';
        const payment = await Payment.findOneAndUpdate({ transactionId }, { status }, { new: true });

        // If this payment was for a subscription and it succeeded, activate it
        if (result.success && payment?.purpose === 'subscription') {
            const sub = await Subscription.findOne({ paymentTransactionId: transactionId, status: { $ne: 'active' } });
            if (sub) {
                sub.status = 'active';
                await sub.save();
            }
        }

        res.json({ success: true, message: 'Webhook processed', data: { result, payment } });
    } catch (err: any) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// GET /api/momo/gateway-info -> return current gateway info (for admin/debug)
router.get('/gateway-info', async (_req: Request, res: Response) => {
    const gateway = getPaymentGateway();
    res.json({
        success: true,
        data: {
            name: gateway.name,
            isSimulated: gateway.isSimulated,
        },
    });
});

export default router;
