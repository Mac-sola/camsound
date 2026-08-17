import { Request, Response } from 'express';
import NotificationSetting from '../models/NotificationSetting';

export const getNotificationSettings = async (req: Request, res: Response) => {
    try {
        const settings = await NotificationSetting.findOne({ userId: req.user?.id });
        if (!settings) {
            const defaultSettings = await NotificationSetting.create({ userId: req.user?.id, emailNotifications: true, smsNotifications: false, pushNotifications: true, newReleaseNotifications: true });
            return res.json({ success: true, data: defaultSettings });
        }
        res.json({ success: true, data: settings });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateNotificationSettings = async (req: Request, res: Response) => {
    try {
        const updates = req.body;
        const settings = await NotificationSetting.findOneAndUpdate(
            { userId: req.user?.id },
            updates,
            { upsert: true, new: true }
        );
        res.json({ success: true, data: settings });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

