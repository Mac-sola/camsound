import { Request, Response } from 'express';
import Comment from '../models/Comment';

export const getComments = async (req: Request, res: Response) => {
    try {
        const { songId } = req.params;
        const comments = await Comment.find({ songId, parentId: null })
            .populate('userId', 'name avatar')
            .sort({ isPinned: -1, createdAt: -1 });

        // Attach replies to each top-level comment
        const withReplies = await Promise.all(
            comments.map(async (c) => {
                const replies = await Comment.find({ parentId: c._id }).populate('userId', 'name avatar');
                return { ...c.toObject(), replies };
            })
        );
        res.json({ success: true, data: withReplies });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const createComment = async (req: Request, res: Response) => {
    try {
        const { songId } = req.params;
        const { content, parentId } = req.body;
        if (!content) return res.status(400).json({ success: false, message: 'Content is required' });

        const comment = await Comment.create({ userId: req.user?.id, songId, content, parentId: parentId || null });
        const populated = await comment.populate('userId', 'name avatar');
        res.status(201).json({ success: true, message: 'Comment posted', data: populated });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const deleteComment = async (req: Request, res: Response) => {
    try {
        const comment = await Comment.findById(req.params.commentId);
        if (!comment) return res.status(404).json({ success: false, message: 'Comment not found' });

        const isOwner = comment.userId.toString() === req.user?.id;
        const isAdmin = req.user?.type === 'admin';
        if (!isOwner && !isAdmin) return res.status(403).json({ success: false, message: 'Forbidden' });

        await Comment.findByIdAndDelete(req.params.commentId);
        // Also delete replies
        await Comment.deleteMany({ parentId: req.params.commentId });
        res.json({ success: true, message: 'Comment deleted' });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const pinComment = async (req: Request, res: Response) => {
    try {
        if (req.user?.type !== 'admin') return res.status(403).json({ success: false, message: 'Admin only' });
        const comment = await Comment.findByIdAndUpdate(req.params.commentId, { isPinned: true }, { new: true });
        if (!comment) return res.status(404).json({ success: false, message: 'Comment not found' });
        res.json({ success: true, message: 'Comment pinned', data: comment });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};
