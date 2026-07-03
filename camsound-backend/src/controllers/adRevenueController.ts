import { Request, Response } from 'express';
import AdRevenue from '../models/AdRevenue';

export const getAdRevenue = async (_req: Request, res: Response) => {
    try {
        const revenue = await AdRevenue.find().sort({ date: -1 });
        res.json({ success: true, data: revenue });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const createAdRevenue = async (req: Request, res: Response) => {
    try {
        const item = await AdRevenue.create(req.body);
        res.status(201).json({ success: true, data: item });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateAdRevenue = async (req: Request, res: Response) => {
    try {
        const item = await AdRevenue.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!item) return res.status(404).json({ success: false, message: 'Ad revenue entry not found' });
        res.json({ success: true, data: item });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const deleteAdRevenue = async (req: Request, res: Response) => {
    try {
        await AdRevenue.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Ad revenue entry deleted' });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};
