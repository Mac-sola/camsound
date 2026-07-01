import { Request, Response } from 'express';
import ListeningHistory from '../models/ListeningHistory';

export const getHistory = async (req: Request, res: Response) => {
    try {
        const { page = 1, limit = 50 } = req.query;
        const history = await ListeningHistory.find({ userId: req.user?.id })
            .populate({ path: 'songId', populate: { path: 'artistId', select: 'name image' } })
            .sort({ playedAt: -1 })
            .skip((+page - 1) * +limit)
            .limit(+limit);
        res.json({ success: true, data: history });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const clearHistory = async (req: Request, res: Response) => {
    try {
        await ListeningHistory.deleteMany({ userId: req.user?.id });
        res.json({ success: true, message: 'History cleared' });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};
