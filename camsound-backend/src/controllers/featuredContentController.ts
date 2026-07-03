import { Request, Response } from 'express';
import FeaturedContent from '../models/FeaturedContent';

export const getFeaturedContent = async (_req: Request, res: Response) => {
    try {
        const items = await FeaturedContent.find({ isActive: true }).sort({ priority: -1, createdAt: -1 });
        res.json({ success: true, data: items });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const createFeaturedContent = async (req: Request, res: Response) => {
    try {
        const item = await FeaturedContent.create(req.body);
        res.status(201).json({ success: true, data: item });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateFeaturedContent = async (req: Request, res: Response) => {
    try {
        const item = await FeaturedContent.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!item) return res.status(404).json({ success: false, message: 'Featured item not found' });
        res.json({ success: true, data: item });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const deleteFeaturedContent = async (req: Request, res: Response) => {
    try {
        await FeaturedContent.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Featured item deleted' });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};
