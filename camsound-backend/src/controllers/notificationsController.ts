import { Request, Response } from 'express';
import Notification from '../models/Notification';

export const getNotifications = async (req: Request, res: Response) => {
    try {
        const { user_id, unread_only } = req.query;
        let userId = req.user?.id;

        if (user_id && req.user?.type === 'admin') {
            userId = user_id;
        } else if (user_id && user_id !== req.user?.id) {
            return res.status(403).json({ success: false, message: 'Forbidden' });
        }

        const query: any = { userId };
        if (String(unread_only) === 'true') {
            query.isRead = false;
        }

        const notifications = await Notification.find(query).sort({ createdAt: -1 }).limit(50);
        const unreadCount = await Notification.countDocuments({ userId, isRead: false });
        res.json({ success: true, data: notifications, unreadCount });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const createNotification = async (req: Request, res: Response) => {
    try {
        const { user_id, message, type, target_id } = req.body;
        if (!message) {
            return res.status(400).json({ success: false, message: 'message is required' });
        }

        let recipientId = req.user?.id;
        if (user_id && req.user?.type === 'admin') {
            recipientId = user_id;
        }

        const notification = await Notification.create({
            userId: recipientId,
            message,
            type: type || 'system',
            targetId: target_id || req.body.targetId,
            isRead: false,
        });

        res.status(201).json({ success: true, message: 'Notification created successfully', data: { id: notification._id } });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateNotification = async (req: Request, res: Response) => {
    try {
        const notificationId = req.body.id || req.body.notification_id || req.query.id || req.query.notification_id;
        const action = req.body.action;
        const isRead = req.body.is_read;
        const message = req.body.message;

        if (!notificationId && action !== 'mark_all_read') {
            return res.status(400).json({ success: false, message: 'notification_id is required' });
        }

        if (action === 'mark_all_read') {
            await Notification.updateMany({ userId: req.user?.id, isRead: false }, { isRead: true });
            return res.json({ success: true, message: 'All notifications marked as read' });
        }

        const update: any = {};
        if (typeof isRead !== 'undefined') update.isRead = Boolean(isRead);
        if (message && req.user?.type === 'admin') update.message = message;

        if (Object.keys(update).length === 0) {
            return res.status(400).json({ success: false, message: 'No fields to update' });
        }

        const query: any = { _id: notificationId };
        if (req.user?.type !== 'admin') {
            query.userId = req.user?.id;
        }

        const notification = await Notification.findOneAndUpdate(query, update, { new: true });
        if (!notification) {
            return res.status(404).json({ success: false, message: 'Notification not found' });
        }

        res.json({ success: true, message: 'Notification updated successfully', data: notification });
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
        const notificationId = req.params.id || req.query.notification_id || req.body.notification_id;
        if (!notificationId) {
            return res.status(400).json({ success: false, message: 'notification_id is required' });
        }

        const query: any = { _id: notificationId };
        if (req.user?.type !== 'admin') {
            query.userId = req.user?.id;
        }

        const notification = await Notification.findOneAndDelete(query);
        if (!notification) {
            return res.status(404).json({ success: false, message: 'Notification not found' });
        }

        res.json({ success: true, message: 'Notification deleted' });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};
