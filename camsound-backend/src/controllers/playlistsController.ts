import { Request, Response } from 'express';
import Playlist from '../models/Playlist';

export const getPlaylists = async (req: Request, res: Response) => {
    try {
        const playlists = await Playlist.find({ userId: req.user?.id })
            .populate('songs', 'title coverArt duration artistId')
            .sort({ createdAt: -1 });
        res.json({ success: true, data: playlists });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getPlaylist = async (req: Request, res: Response) => {
    try {
        const playlist = await Playlist.findById(req.params.id)
            .populate({ path: 'songs', populate: { path: 'artistId', select: 'name image' } });
        if (!playlist) return res.status(404).json({ success: false, message: 'Playlist not found' });

        const isOwner = playlist.userId.toString() === req.user?.id;
        if (!playlist.isPublic && !isOwner) {
            return res.status(403).json({ success: false, message: 'Forbidden' });
        }
        res.json({ success: true, data: playlist });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const createPlaylist = async (req: Request, res: Response) => {
    try {
        const { name, description, isPublic } = req.body;
        if (!name) return res.status(400).json({ success: false, message: 'Name is required' });
        const playlist = await Playlist.create({ userId: req.user?.id, name, description, isPublic });
        res.status(201).json({ success: true, message: 'Playlist created', data: playlist });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updatePlaylist = async (req: Request, res: Response) => {
    try {
        const playlist = await Playlist.findById(req.params.id);
        if (!playlist) return res.status(404).json({ success: false, message: 'Playlist not found' });
        if (playlist.userId.toString() !== req.user?.id) return res.status(403).json({ success: false, message: 'Forbidden' });

        const { name, description, isPublic } = req.body;
        const updated = await Playlist.findByIdAndUpdate(req.params.id, { name, description, isPublic }, { new: true });
        res.json({ success: true, message: 'Playlist updated', data: updated });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const deletePlaylist = async (req: Request, res: Response) => {
    try {
        const playlist = await Playlist.findById(req.params.id);
        if (!playlist) return res.status(404).json({ success: false, message: 'Playlist not found' });
        if (playlist.userId.toString() !== req.user?.id && req.user?.type !== 'admin') {
            return res.status(403).json({ success: false, message: 'Forbidden' });
        }
        await Playlist.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Playlist deleted' });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const addSongToPlaylist = async (req: Request, res: Response) => {
    try {
        const playlist = await Playlist.findById(req.params.id);
        if (!playlist) return res.status(404).json({ success: false, message: 'Playlist not found' });
        if (playlist.userId.toString() !== req.user?.id) return res.status(403).json({ success: false, message: 'Forbidden' });

        const { songId } = req.body;
        if (!songId) return res.status(400).json({ success: false, message: 'songId required' });
        if (!playlist.songs.includes(songId)) {
            playlist.songs.push(songId);
            await playlist.save();
        }
        res.json({ success: true, message: 'Song added to playlist' });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const removeSongFromPlaylist = async (req: Request, res: Response) => {
    try {
        const playlist = await Playlist.findById(req.params.id);
        if (!playlist) return res.status(404).json({ success: false, message: 'Playlist not found' });
        if (playlist.userId.toString() !== req.user?.id) return res.status(403).json({ success: false, message: 'Forbidden' });

        playlist.songs = playlist.songs.filter(s => s.toString() !== req.params.songId);
        await playlist.save();
        res.json({ success: true, message: 'Song removed from playlist' });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};
