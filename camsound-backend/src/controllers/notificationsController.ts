import { Request, Response } from 'express';
import Notification from '../models/Notification';

export const getNotifications = async (req: Request, res: Response) => {
    try {
        const notifications = await Notification.find({ userId: req.user?.id })
            .sort({ createdAt: -1 }).limit(50);
        const unreadCount = await Notification.countDocuments({ userId: req.user?.id, isRead: false });
        res.json({ success: true, data: notifications, unreadCount });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const markRead = async (req: Request, res: Response) => {
    try {
        await Notification.findOneAndUpdate(
            { _id: req.params.id, userId: req.user?.id },
            { isRead: true }
        );
        res.json({ success: true, message: 'Notification marked as read' });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const markAllRead = async (req: Request, res: Response) => {
    try {
        await Notification.updateMany({ userId: req.user?.id, isRead: false }, { isRead: true });
        res.json({ success: true, message: 'All notifications marked as read' });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const deleteNotification = async (req: Request, res: Response) => {
    try {
        await Notification.findOneAndDelete({ _id: req.params.id, userId: req.user?.id });
        res.json({ success: true, message: 'Notification deleted' });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};
