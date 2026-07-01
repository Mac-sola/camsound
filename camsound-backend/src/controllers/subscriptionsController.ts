import { Request, Response } from 'express';
import Subscription from '../models/Subscription';
import Plan from '../models/Plan';

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
