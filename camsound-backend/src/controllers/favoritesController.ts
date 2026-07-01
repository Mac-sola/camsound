import { Request, Response } from 'express';
import UserLike from '../models/UserLike';
import Song from '../models/Song';

export const likeSong = async (req: Request, res: Response) => {
    try {
        const { songId } = req.params;
        const song = await Song.findById(songId);
        if (!song) return res.status(404).json({ success: false, message: 'Song not found' });

        const existing = await UserLike.findOne({ userId: req.user?.id, songId });
        if (existing) return res.status(400).json({ success: false, message: 'Already liked' });

        await UserLike.create({ userId: req.user?.id, songId });
        await Song.findByIdAndUpdate(songId, { $inc: { likes: 1 } });
        res.json({ success: true, message: 'Song liked' });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const unlikeSong = async (req: Request, res: Response) => {
    try {
        const { songId } = req.params;
        const like = await UserLike.findOneAndDelete({ userId: req.user?.id, songId });
        if (!like) return res.status(404).json({ success: false, message: 'Like not found' });

        await Song.findByIdAndUpdate(songId, { $inc: { likes: -1 } });
        res.json({ success: true, message: 'Song unliked' });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getFavorites = async (req: Request, res: Response) => {
    try {
        const likes = await UserLike.find({ userId: req.user?.id })
            .populate({ path: 'songId', populate: { path: 'artistId', select: 'name image' } })
            .sort({ createdAt: -1 });
        res.json({ success: true, data: likes.map(l => l.songId) });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};
