import { Request, Response } from 'express';
import Subscription from '../models/Subscription';
import Plan from '../models/Plan';
import Payment from '../models/Payment';
import User from '../models/User';
import { cancelSubscription, getActiveSubscription, hasPremiumAccess } from '../services/subscriptionService';

// --- Plans ---
export const getPlans = async (_req: Request, res: Response) => {
    try {
        const plans = await Plan.find().sort({ price: 1 });
        res.json({ success: true, data: plans });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const createPlan = async (req: Request, res: Response) => {
    try {
        const plan = await Plan.create(req.body);
        res.status(201).json({ success: true, data: plan });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updatePlan = async (req: Request, res: Response) => {
    try {
        const plan = await Plan.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!plan) return res.status(404).json({ success: false, message: 'Plan not found' });
        res.json({ success: true, data: plan });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const deletePlan = async (req: Request, res: Response) => {
    try {
        await Plan.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Plan deleted' });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// --- Subscriptions ---
export const getSubscriptions = async (req: Request, res: Response) => {
    try {
        const isAdmin = req.user?.type === 'admin';
        const filter = isAdmin ? {} : { userId: req.user?.id };
        const subs = await Subscription.find(filter)
            .populate('userId', 'name email')
            .sort({ createdAt: -1 });
        res.json({ success: true, data: subs });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getSubscription = async (req: Request, res: Response) => {
    try {
        const sub = await Subscription.findById(req.params.id).populate('userId', 'name email');
        if (!sub) return res.status(404).json({ success: false, message: 'Subscription not found' });
        const isOwner = sub.userId.toString() === req.user?.id;
        if (!isOwner && req.user?.type !== 'admin') return res.status(403).json({ success: false, message: 'Forbidden' });
        res.json({ success: true, data: sub });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const createSubscription = async (req: Request, res: Response) => {
    try {
        const isAdmin = req.user?.type === 'admin';
        const userId = isAdmin ? (req.body.userId || req.user?.id) : req.user?.id;
        const { planName, amount, startDate, endDate, status } = req.body;

        if (!planName || !amount || !startDate || !endDate) {
            return res.status(400).json({ success: false, message: 'planName, amount, startDate, endDate are required' });
        }
        const sub = await Subscription.create({
            userId,
            planName,
            amount,
            startDate,
            endDate,
            status: isAdmin ? (status || 'active') : 'active',
        });
        res.status(201).json({ success: true, message: 'Subscription created', data: sub });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateSubscription = async (req: Request, res: Response) => {
    try {
        const sub = await Subscription.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!sub) return res.status(404).json({ success: false, message: 'Subscription not found' });
        res.json({ success: true, data: sub });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const deleteSubscription = async (req: Request, res: Response) => {
    try {
        await Subscription.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Subscription deleted' });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// --- Active Subscription & Premium Status ---

/** GET /api/subscriptions/my-active — get current user's active subscription */
export const getMyActiveSubscription = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ success: false, message: 'Auth required' });

        const access = await hasPremiumAccess(userId);
        const activeSub = await getActiveSubscription(userId);

        res.json({
            success: true,
            data: {
                hasAccess: access.hasAccess,
                tier: access.tier,
                daysRemaining: access.daysRemaining,
                subscription: activeSub,
            },
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/** POST /api/subscriptions/cancel — cancel current user's active subscription */
export const cancelMySubscription = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ success: false, message: 'Auth required' });

        const activeSub = await getActiveSubscription(userId);
        if (!activeSub) {
            return res.status(404).json({ success: false, message: 'No active subscription to cancel' });
        }

        const success = await cancelSubscription(activeSub._id as string, userId, req.body.reason);
        if (!success) {
            return res.status(400).json({ success: false, message: 'Failed to cancel subscription' });
        }

        res.json({ success: true, message: 'Subscription cancelled successfully' });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/** GET /api/subscriptions/my-payments — get current user's payment history */
export const getMyPayments = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ success: false, message: 'Auth required' });

        const payments = await Payment.find({ userId })
            .sort({ createdAt: -1 })
            .limit(50);

        res.json({ success: true, data: payments });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/** GET /api/subscriptions/revenue-stats — admin revenue overview */
export const getRevenueStats = async (req: Request, res: Response) => {
    try {
        if (req.user?.type !== 'admin') {
            return res.status(403).json({ success: false, message: 'Admin only' });
        }

        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        // Revenue aggregations
        const [allTime, monthly, weekly, daily] = await Promise.all([
            Payment.aggregate([
                { $match: { status: 'completed' } },
                { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
            ]),
            Payment.aggregate([
                { $match: { status: 'completed', createdAt: { $gte: startOfMonth } } },
                { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
            ]),
            Payment.aggregate([
                { $match: { status: 'completed', createdAt: { $gte: startOfWeek } } },
                { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
            ]),
            Payment.aggregate([
                { $match: { status: 'completed', createdAt: { $gte: startOfDay } } },
                { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
            ]),
        ]);

        // Revenue by purpose
        const byPurpose = await Payment.aggregate([
            { $match: { status: 'completed' } },
            { $group: { _id: '$purpose', total: { $sum: '$amount' }, count: { $sum: 1 } } },
        ]);

        // Active subscriptions by plan
        const activeSubsByPlan = await Subscription.aggregate([
            { $match: { status: 'active' } },
            { $group: { _id: '$planName', count: { $sum: 1 }, revenue: { $sum: '$amount' } } },
        ]);

        // Subscription status counts
        const subStatusCounts = await Subscription.aggregate([
            { $group: { _id: '$status', count: { $sum: 1 } } },
        ]);

        // Recent transactions (last 20)
        const recentTransactions = await Payment.find({ status: 'completed' })
            .populate('userId', 'name email')
            .sort({ createdAt: -1 })
            .limit(20);

        // Failed payments (last 10)
        const failedPayments = await Payment.find({ status: 'failed' })
            .populate('userId', 'name email')
            .sort({ createdAt: -1 })
            .limit(10);

        res.json({
            success: true,
            data: {
                revenue: {
                    allTime: allTime[0] || { total: 0, count: 0 },
                    monthly: monthly[0] || { total: 0, count: 0 },
                    weekly: weekly[0] || { total: 0, count: 0 },
                    daily: daily[0] || { total: 0, count: 0 },
                },
                byPurpose,
                activeSubsByPlan,
                subStatusCounts,
                recentTransactions,
                failedPayments,
            },
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};
