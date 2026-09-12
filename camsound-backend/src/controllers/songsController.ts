import { Request, Response } from 'express';
import Song from '../models/Song';
import Artist from '../models/Artist';
import ListeningHistory from '../models/ListeningHistory';

export const getSongs = async (req: Request, res: Response) => {
    try {
        const { genre, search, sort = 'date', artistId, page = 1, limit = 20 } = req.query;
        const isAdmin = req.user?.type === 'admin';
        const filter: any = isAdmin ? {} : { status: 'active', moderationStatus: 'approved' };
        
        if (genre) filter.genre = genre;
        if (search) filter.title = { $regex: search, $options: 'i' };

        if (artistId === 'me' && req.user?.type === 'artist') {
            const artist = await Artist.findOne({ userId: req.user.id });
            if (artist) filter.artistId = artist._id;
        } else if (artistId && artistId !== 'me') {
            filter.artistId = artistId;
        }

        let sortOption: any = { createdAt: -1 };
        if (sort === 'plays') {
            sortOption = { plays: -1, createdAt: -1 };
        } else if (sort === 'likes') {
            sortOption = { likes: -1, createdAt: -1 };
        } else if (sort === 'date') {
            sortOption = { createdAt: -1 };
        }

        const songs = await Song.find(filter)
            .populate('artistId', 'name image genre instagramUrl twitterUrl facebookUrl youtubeUrl')
            .sort(sortOption)
            .skip((+page - 1) * +limit)
            .limit(+limit);

        const total = await Song.countDocuments(filter);
        res.json({ success: true, data: songs, total, page: +page, pages: Math.ceil(total / +limit) });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getSong = async (req: Request, res: Response) => {
    try {
        const song = await Song.findById(req.params.id)
            .populate('artistId', 'name image genre instagramUrl twitterUrl facebookUrl youtubeUrl');
        if (!song) return res.status(404).json({ success: false, message: 'Song not found' });
        res.json({ success: true, data: song });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const createSong = async (req: Request, res: Response) => {
    try {
        if (req.user?.type !== 'artist') {
            return res.status(403).json({ success: false, message: 'Only artist accounts can create songs' });
        }
        const artist = await Artist.findOne({ userId: req.user.id });
        if (!artist) return res.status(404).json({ success: false, message: 'Artist profile not found' });

        const { title, genre, duration, filePath, coverArt, description } = req.body;
        if (!title || !genre) {
            return res.status(400).json({ success: false, message: 'Title and genre are required' });
        }
        const song = await Song.create({ title, artistId: artist._id, genre, duration, filePath, coverArt, description });
        await Artist.findByIdAndUpdate(artist._id, { $inc: { songsCount: 1 } });
        res.status(201).json({ success: true, message: 'Song created', data: song });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateSong = async (req: Request, res: Response) => {
    try {
        const song = await Song.findById(req.params.id).populate('artistId');
        if (!song) return res.status(404).json({ success: false, message: 'Song not found' });

        const isAdmin = req.user?.type === 'admin';
        const artist = song.artistId as any;
        const isOwner = req.user?.type === 'artist' && artist.userId?.toString() === req.user.id;

        if (!isAdmin && !isOwner) {
            return res.status(403).json({ success: false, message: 'Forbidden' });
        }
        const { title, genre, duration } = req.body;
        const updated = await Song.findByIdAndUpdate(req.params.id, { title, genre, duration }, { new: true });
        res.json({ success: true, message: 'Song updated', data: updated });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const deleteSong = async (req: Request, res: Response) => {
    try {
        const song = await Song.findById(req.params.id).populate('artistId');
        if (!song) return res.status(404).json({ success: false, message: 'Song not found' });

        const isAdmin = req.user?.type === 'admin';
        const artist = song.artistId as any;
        const isOwner = req.user?.type === 'artist' && artist.userId?.toString() === req.user.id;

        if (!isAdmin && !isOwner) {
            return res.status(403).json({ success: false, message: 'Forbidden' });
        }
        await Song.findByIdAndDelete(req.params.id);
        await Artist.findByIdAndUpdate(song.artistId, { $inc: { songsCount: -1 } });
        res.json({ success: true, message: 'Song deleted' });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const trackPlay = async (req: Request, res: Response) => {
    try {
        const song = await Song.findByIdAndUpdate(req.params.id, { $inc: { plays: 1 } }, { new: true });
        if (!song) return res.status(404).json({ success: false, message: 'Song not found' });

        // Log to listening history if user is authenticated
        if (req.user?.id) {
            await ListeningHistory.create({ userId: req.user.id, songId: song._id });
        }
        res.json({ success: true, plays: song.plays });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};
