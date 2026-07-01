import { Request, Response } from 'express';
import Royalty from '../models/Royalty';
import Artist from '../models/Artist';
import Song from '../models/Song';

export const getRoyalties = async (req: Request, res: Response) => {
    try {
        const isAdmin = req.user?.type === 'admin';
        const isArtist = req.user?.type === 'artist';

        const filter: any = {};
        if (isArtist) {
            const artist = await Artist.findOne({ userId: req.user?.id });
            if (!artist) return res.status(404).json({ success: false, message: 'Artist profile not found' });
            filter.artistId = artist._id;
        }

        if (!isAdmin && !isArtist) {
            return res.status(403).json({ success: false, message: 'Forbidden' });
        }

        const royalties = await Royalty.find(filter)
            .populate('artistId', 'name image')
            .populate('songId', 'title');

        res.json({ success: true, data: royalties });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getRoyalty = async (req: Request, res: Response) => {
    try {
        const royalty = await Royalty.findById(req.params.id)
            .populate('artistId', 'name image')
            .populate('songId', 'title');
        if (!royalty) return res.status(404).json({ success: false, message: 'Royalty record not found' });

        const isAdmin = req.user?.type === 'admin';
        if (!isAdmin) {
            const artist = await Artist.findOne({ userId: req.user?.id });
            if (!artist || royalty.artistId.toString() !== artist._id.toString()) {
                return res.status(403).json({ success: false, message: 'Forbidden' });
            }
        }

        res.json({ success: true, data: royalty });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const createRoyalty = async (req: Request, res: Response) => {
    try {
        const { artistId, songId, amount, periodStart, periodEnd, playsCount, status } = req.body;
        if (!artistId || !songId || amount === undefined) {
            return res.status(400).json({ success: false, message: 'artistId, songId and amount are required' });
        }

        const song = await Song.findById(songId);
        if (!song) return res.status(404).json({ success: false, message: 'Song not found' });

        const royalty = await Royalty.create({
            artistId,
            songId,
            amount,
            periodStart,
            periodEnd,
            playsCount,
            status: status || 'pending',
        });

        res.status(201).json({ success: true, message: 'Royalty record created', data: royalty });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateRoyalty = async (req: Request, res: Response) => {
    try {
        const updates: any = {};
        const { amount, status, paidAt, periodStart, periodEnd, playsCount } = req.body;

        if (amount !== undefined) updates.amount = amount;
        if (status) updates.status = status;
        if (paidAt) updates.paidAt = paidAt;
        if (periodStart) updates.periodStart = periodStart;
        if (periodEnd) updates.periodEnd = periodEnd;
        if (playsCount !== undefined) updates.playsCount = playsCount;

        const royalty = await Royalty.findByIdAndUpdate(req.params.id, updates, { new: true });
        if (!royalty) return res.status(404).json({ success: false, message: 'Royalty record not found' });

        res.json({ success: true, message: 'Royalty updated', data: royalty });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};
