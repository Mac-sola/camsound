import { Request, Response } from 'express';
import AdminLog from '../models/AdminLog';

export const getAdminLogs = async (_req: Request, res: Response) => {
    try {
        const logs = await AdminLog.find().populate('adminId', 'name email').sort({ createdAt: -1 }).limit(200);
        res.json({ success: true, data: logs });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const createAdminLog = async (req: Request, res: Response) => {
    try {
        const log = await AdminLog.create(req.body);
        res.status(201).json({ success: true, data: log });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};
