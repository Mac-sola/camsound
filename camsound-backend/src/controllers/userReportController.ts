import { Request, Response } from 'express';
import Report from '../models/Report';

export const submitReport = async (req: Request, res: Response) => {
    try {
        const { reportedUserId, reportedSongId, type, reason } = req.body;
        if (!type) return res.status(400).json({ success: false, message: 'Report type is required' });

        const report = await Report.create({
            reporterId: req.user?.id,
            reportedUserId,
            reportedSongId,
            type,
            reason,
            status: 'pending',
        });
        res.status(201).json({ success: true, data: report });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getMyReports = async (req: Request, res: Response) => {
    try {
        const reports = await Report.find({ reporterId: req.user?.id }).sort({ createdAt: -1 });
        res.json({ success: true, data: reports });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};
