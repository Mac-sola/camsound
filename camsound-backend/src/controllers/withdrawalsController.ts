import { Request, Response } from 'express';
import Withdrawal from '../models/Withdrawal';
import Artist from '../models/Artist';

export const getWithdrawals = async (req: Request, res: Response) => {
    try {
        const isAdmin = req.user?.type === 'admin';
        let filter: any = {};
        if (!isAdmin) {
            const artist = await Artist.findOne({ userId: req.user?.id });
            if (!artist) return res.status(404).json({ success: false, message: 'Artist profile not found' });
            filter = { artistId: artist._id };
        }
        const withdrawals = await Withdrawal.find(filter)
            .populate('artistId', 'name image')
            .sort({ createdAt: -1 });
        res.json({ success: true, data: withdrawals });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const requestWithdrawal = async (req: Request, res: Response) => {
    try {
        if (req.user?.type !== 'artist') {
            return res.status(403).json({ success: false, message: 'Only artists can request withdrawals' });
        }
        const artist = await Artist.findOne({ userId: req.user.id });
        if (!artist) return res.status(404).json({ success: false, message: 'Artist profile not found' });

        const { amount, momoNumber } = req.body;
        if (!amount || !momoNumber) {
            return res.status(400).json({ success: false, message: 'Amount and momoNumber are required' });
        }
        const withdrawal = await Withdrawal.create({ artistId: artist._id, amount, momoNumber });
        res.status(201).json({ success: true, message: 'Withdrawal request submitted', data: withdrawal });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateWithdrawal = async (req: Request, res: Response) => {
    try {
        const { status, transactionId } = req.body;
        const updates: any = { status };
        if (status === 'completed') updates.processedAt = new Date();
        if (transactionId) updates.transactionId = transactionId;

        const withdrawal = await Withdrawal.findByIdAndUpdate(req.params.id, updates, { new: true });
        if (!withdrawal) return res.status(404).json({ success: false, message: 'Withdrawal not found' });
        res.json({ success: true, data: withdrawal });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};
