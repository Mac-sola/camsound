import { Request, Response } from 'express';
import Follow from '../models/Follow';
import Artist from '../models/Artist';

const getArtistFollowers = async (artistId: string) => {
    const followers = await Follow.find({ artistId })
        .populate('userId', 'name avatar type')
        .sort({ createdAt: -1 });
    return followers;
};

export const followArtist = async (req: Request, res: Response) => {
    try {
        const artistId = req.params.artistId || req.body.artist_id || req.body.artistId || req.query.artist_id || req.query.artistId;
        if (!artistId) {
            return res.status(400).json({ success: false, message: 'artist_id is required' });
        }

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
        const artistId = req.params.artistId || req.body.artist_id || req.body.artistId || req.query.artist_id || req.query.artistId;
        if (!artistId) {
            return res.status(400).json({ success: false, message: 'artist_id is required' });
        }

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
        const { user_id, artist_id, action } = req.query;
        const currentUserId = req.user?.id;

        if (action === 'followers' && artist_id) {
            const followers = await getArtistFollowers(String(artist_id));
            return res.json({ success: true, data: followers });
        }

        if (action === 'toggle' && artist_id) {
            const artistId = String(artist_id);
            const artist = await Artist.findById(artistId);
            if (!artist) return res.status(404).json({ success: false, message: 'Artist not found' });

            const existing = await Follow.findOne({ userId: currentUserId, artistId });
            if (existing) {
                await existing.deleteOne();
                await Artist.findByIdAndUpdate(artistId, { $inc: { followers: -1 } });
                return res.json({ success: true, message: 'Unfollowed artist', is_following: false });
            }

            await Follow.create({ userId: currentUserId, artistId });
            await Artist.findByIdAndUpdate(artistId, { $inc: { followers: 1 } });
            return res.json({ success: true, message: 'Now following artist', is_following: true });
        }

        if (user_id) {
            if (user_id !== currentUserId && req.user?.type !== 'admin') {
                return res.status(403).json({ success: false, message: 'Forbidden' });
            }
            const follows = await Follow.find({ userId: user_id })
                .populate('artistId', 'name image genre followers bio instagramUrl twitterUrl facebookUrl youtubeUrl')
                .sort({ createdAt: -1 });
            return res.json({ success: true, data: follows.map(f => f.artistId) });
        }

        if (user_id && artist_id) {
            const follow = await Follow.findOne({ userId: user_id, artistId: artist_id });
            return res.json({ success: true, data: { is_following: Boolean(follow) } });
        }

        const follows = await Follow.find({ userId: currentUserId })
            .populate('artistId', 'name image genre followers bio instagramUrl twitterUrl facebookUrl youtubeUrl')
            .sort({ createdAt: -1 });
        res.json({ success: true, data: follows.map(f => f.artistId) });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};
