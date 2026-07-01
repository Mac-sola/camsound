import { Request, Response } from 'express';
import User from '../models/User';
import Artist from '../models/Artist';
import Song from '../models/Song';
import Report from '../models/Report';
import Setting from '../models/Setting';
import ActivityLog from '../models/ActivityLog';

// --- Users ---
export const getUsers = async (req: Request, res: Response) => {
    try {
        const { page = 1, limit = 20, type, status, search } = req.query;
        const filter: any = {};
        if (type) filter.type = type;
        if (status) filter.status = status;
        if (search) filter.$or = [{ name: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }];

        const users = await User.find(filter).select('-password')
            .sort({ createdAt: -1 })
            .skip((+page - 1) * +limit)
            .limit(+limit);
        const total = await User.countDocuments(filter);
        res.json({ success: true, data: users, total, page: +page, pages: Math.ceil(total / +limit) });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateUserStatus = async (req: Request, res: Response) => {
    try {
        const { status } = req.body;
        const allowed = ['active', 'pending', 'blocked'];
        if (!allowed.includes(status)) return res.status(400).json({ success: false, message: 'Invalid status' });

        const user = await User.findByIdAndUpdate(req.params.id, { status }, { new: true }).select('-password');
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        await ActivityLog.create({ userId: req.user?.id, action: `admin_set_user_status`, details: `User ${user.email} -> ${status}`, ipAddress: req.ip });
        res.json({ success: true, message: `User ${status}`, data: user });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateUserRole = async (req: Request, res: Response) => {
    try {
        const { type } = req.body;
        const allowed = ['fan', 'artist', 'admin'];
        if (!allowed.includes(type)) return res.status(400).json({ success: false, message: 'Invalid role' });

        const user = await User.findByIdAndUpdate(req.params.id, { type }, { new: true }).select('-password');
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        res.json({ success: true, message: 'Role updated', data: user });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const deleteUser = async (req: Request, res: Response) => {
    try {
        if (req.params.id === req.user?.id) return res.status(400).json({ success: false, message: 'Cannot delete yourself' });
        await User.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'User deleted' });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// --- Song Moderation ---
export const getSongsAdmin = async (req: Request, res: Response) => {
    try {
        const { page = 1, limit = 20, status, moderationStatus } = req.query;
        const filter: any = {};
        if (status) filter.status = status;
        if (moderationStatus) filter.moderationStatus = moderationStatus;

        const songs = await Song.find(filter)
            .populate('artistId', 'name image')
            .sort({ createdAt: -1 })
            .skip((+page - 1) * +limit)
            .limit(+limit);
        const total = await Song.countDocuments(filter);
        res.json({ success: true, data: songs, total });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const moderateSong = async (req: Request, res: Response) => {
    try {
        const { moderationStatus, moderationNotes, status } = req.body;
        const allowed = ['pending', 'approved', 'rejected'];
        if (moderationStatus && !allowed.includes(moderationStatus)) {
            return res.status(400).json({ success: false, message: 'Invalid moderation status' });
        }
        const updates: any = { moderatedBy: req.user?.id, moderatedAt: new Date() };
        if (moderationStatus) updates.moderationStatus = moderationStatus;
        if (moderationNotes) updates.moderationNotes = moderationNotes;
        if (status) updates.status = status;

        const song = await Song.findByIdAndUpdate(req.params.id, updates, { new: true });
        if (!song) return res.status(404).json({ success: false, message: 'Song not found' });
        res.json({ success: true, message: 'Song moderated', data: song });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// --- Reports ---
export const getReports = async (req: Request, res: Response) => {
    try {
        const reports = await Report.find()
            .populate('reporterId', 'name email')
            .populate('reportedUserId', 'name email')
            .populate('reportedSongId', 'title')
            .sort({ createdAt: -1 });
        res.json({ success: true, data: reports });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateReport = async (req: Request, res: Response) => {
    try {
        const { status } = req.body;
        const report = await Report.findByIdAndUpdate(
            req.params.id,
            { status, reviewedBy: req.user?.id, reviewedAt: new Date() },
            { new: true }
        );
        if (!report) return res.status(404).json({ success: false, message: 'Report not found' });
        res.json({ success: true, data: report });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// --- Settings ---
export const getSettings = async (_req: Request, res: Response) => {
    try {
        const settings = await Setting.find();
        const map: Record<string, string> = {};
        settings.forEach(s => { map[s.key] = s.value; });
        res.json({ success: true, data: map });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateSettings = async (req: Request, res: Response) => {
    try {
        const updates = req.body as Record<string, string>;
        const ops = Object.entries(updates).map(([key, value]) =>
            Setting.findOneAndUpdate({ key }, { value }, { upsert: true, new: true })
        );
        await Promise.all(ops);
        res.json({ success: true, message: 'Settings saved' });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};
