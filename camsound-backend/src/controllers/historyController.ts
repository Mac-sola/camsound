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

export const addHistory = async (req: Request, res: Response) => {
    try {
        const songId = req.body.song_id || req.body.songId || req.query.song_id || req.query.songId;
        if (!songId) {
            return res.status(400).json({ success: false, message: 'song_id is required' });
        }
        await ListeningHistory.create({ userId: req.user?.id, songId });
        res.status(201).json({ success: true, message: 'Listening history updated' });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const clearHistory = async (req: Request, res: Response) => {
    try {
        const historyId = req.body.history_id || req.body.historyId || req.query.history_id || req.query.historyId;
        const songId = req.body.song_id || req.body.songId || req.query.song_id || req.query.songId;

        if (historyId) {
            await ListeningHistory.deleteOne({ _id: historyId, userId: req.user?.id });
            return res.json({ success: true, message: 'History entry deleted' });
        }

        if (songId) {
            await ListeningHistory.deleteMany({ songId, userId: req.user?.id });
            return res.json({ success: true, message: 'History entries deleted for song' });
        }

        await ListeningHistory.deleteMany({ userId: req.user?.id });
        res.json({ success: true, message: 'History cleared' });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};
