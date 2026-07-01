import { Request, Response } from 'express';
import Follow from '../models/Follow';
import Artist from '../models/Artist';

export const followArtist = async (req: Request, res: Response) => {
    try {
        const { artistId } = req.params;
        const artist = await Artist.findById(artistId);
        if (!artist) return res.status(404).json({ success: false, message: 'Artist not found' });

        const existing = await Follow.findOne({ userId: req.user?.id, artistId });
        if (existing) return res.status(400).json({ success: false, message: 'Already following' });

        await Follow.create({ userId: req.user?.id, artistId });
        await Artist.findByIdAndUpdate(artistId, { $inc: { followers: 1 } });
        res.json({ success: true, message: 'Now following artist' });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const unfollowArtist = async (req: Request, res: Response) => {
    try {
        const { artistId } = req.params;
        const follow = await Follow.findOneAndDelete({ userId: req.user?.id, artistId });
        if (!follow) return res.status(404).json({ success: false, message: 'Not following this artist' });

        await Artist.findByIdAndUpdate(artistId, { $inc: { followers: -1 } });
        res.json({ success: true, message: 'Unfollowed artist' });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getFollowing = async (req: Request, res: Response) => {
    try {
        const follows = await Follow.find({ userId: req.user?.id })
            .populate('artistId', 'name image genre followers')
            .sort({ createdAt: -1 });
        res.json({ success: true, data: follows.map(f => f.artistId) });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};
