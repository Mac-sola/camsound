import { Request, Response } from 'express';
import Artist from '../models/Artist';
import Song from '../models/Song';
import Follow from '../models/Follow';

export const getArtists = async (req: Request, res: Response) => {
    try {
        const { genre, search, page = 1, limit = 20 } = req.query;
        const filter: any = {};
        if (genre) filter.genre = genre;
        if (search) filter.name = { $regex: search, $options: 'i' };

        const artists = await Artist.find(filter)
            .populate('userId', 'name email avatar status')
            .sort({ followers: -1 })
            .skip((+page - 1) * +limit)
            .limit(+limit);

        const total = await Artist.countDocuments(filter);
        res.json({ success: true, data: artists, total, page: +page, pages: Math.ceil(total / +limit) });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getArtist = async (req: Request, res: Response) => {
    try {
        const artist = await Artist.findById(req.params.id).populate('userId', 'name email avatar');
        if (!artist) return res.status(404).json({ success: false, message: 'Artist not found' });

        const songs = await Song.find({ artistId: artist._id, status: 'active', moderationStatus: 'approved' })
            .sort({ createdAt: -1 }).limit(20);

        res.json({ success: true, data: { ...artist.toObject(), songs } });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getArtistMe = async (req: Request, res: Response) => {
    try {
        const artist = await Artist.findOne({ userId: req.user?.id }).populate('userId', 'name email avatar');
        if (!artist) return res.status(404).json({ success: false, message: 'Artist profile not found' });
        res.json({ success: true, data: artist });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateArtist = async (req: Request, res: Response) => {
    try {
        const artist = await Artist.findById(req.params.id);
        if (!artist) return res.status(404).json({ success: false, message: 'Artist not found' });

        const isAdmin = req.user?.type === 'admin';
        const isOwner = artist.userId.toString() === req.user?.id;
        if (!isAdmin && !isOwner) return res.status(403).json({ success: false, message: 'Forbidden' });

        const allowed = ['name', 'realName', 'genre', 'bio', 'location', 'instagramUrl', 'twitterUrl', 'facebookUrl', 'youtubeUrl', 'website'];
        const updates: any = {};
        allowed.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

        // Admin can also update status/verification
        if (isAdmin) {
            if (req.body.status) updates.status = req.body.status;
            if (req.body.verification) updates.verification = req.body.verification;
        }

        const updated = await Artist.findByIdAndUpdate(req.params.id, updates, { new: true });
        res.json({ success: true, message: 'Artist updated', data: updated });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getArtistStats = async (req: Request, res: Response) => {
    try {
        const artist = await Artist.findById(req.params.id);
        if (!artist) return res.status(404).json({ success: false, message: 'Artist not found' });

        const songs = await Song.find({ artistId: artist._id });
        const totalPlays = songs.reduce((sum, s) => sum + s.plays, 0);
        const totalLikes = songs.reduce((sum, s) => sum + s.likes, 0);
        const totalDownloads = songs.reduce((sum, s) => sum + s.downloads, 0);
        const followersCount = await Follow.countDocuments({ artistId: artist._id });

        res.json({
            success: true, data: {
                totalSongs: songs.length, totalPlays, totalLikes, totalDownloads,
                followers: followersCount, songsCount: artist.songsCount,
            },
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const requestVerification = async (req: Request, res: Response) => {
    try {
        const artist = await Artist.findOne({ userId: req.user?.id });
        if (!artist) return res.status(404).json({ success: false, message: 'Artist profile not found' });
        if (artist.verification === 'approved' || artist.status === 'verified') {
            return res.json({ success: true, message: 'Your artist profile is already verified.', data: artist });
        }
        artist.verification = 'pending';
        await artist.save();
        res.json({ success: true, message: 'Verification request submitted! Admin will review your profile.', data: artist });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};


