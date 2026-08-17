import { Request, Response } from 'express';
import Artist from '../models/Artist';
import Comment from '../models/Comment';
import Song from '../models/Song';

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

        const song = await Song.findById(comment.songId);
        const artist = song ? await Artist.findById(song.artistId).populate('userId', '_id') : null;
        const artistUserId = (artist?.userId as any)?._id?.toString() ?? artist?.userId?.toString();

        const isOwner = comment.userId.toString() === req.user?.id;
        const isArtist = artistUserId === req.user?.id;
        const isAdmin = req.user?.type === 'admin';
        if (!isOwner && !isArtist && !isAdmin) return res.status(403).json({ success: false, message: 'Forbidden' });

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
        const comment = await Comment.findById(req.params.commentId);
        if (!comment) return res.status(404).json({ success: false, message: 'Comment not found' });

        const song = await Song.findById(comment.songId);
        const artist = song ? await Artist.findById(song.artistId).populate('userId', '_id') : null;
        const artistUserId = (artist?.userId as any)?._id?.toString() ?? artist?.userId?.toString();

        const isArtist = artistUserId === req.user?.id;
        const isAdmin = req.user?.type === 'admin';
        if (!isArtist && !isAdmin) return res.status(403).json({ success: false, message: 'Only the artist or admin can pin/unpin comments' });

        const pin = req.body.pin ?? true;
        const updatedComment = await Comment.findByIdAndUpdate(req.params.commentId, { isPinned: pin }, { new: true });
        await updatedComment?.populate('userId', 'name avatar');

        res.json({ success: true, message: pin ? 'Comment pinned' : 'Comment unpinned', data: updatedComment });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getRecentComments = async (req: Request, res: Response) => {
    try {
        const comments = await Comment.find({ parentId: null })
            .populate('userId', 'name avatar')
            .populate('songId', 'title artistId coverArt')
            .sort({ createdAt: -1 })
            .limit(20);

        res.json({ success: true, data: comments });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getTrendingComments = async (req: Request, res: Response) => {
    try {
        // Get trending topics (songs with the most discussion/comments)
        const trendingTopics = await Comment.aggregate([
            { $match: { parentId: null } }, // Only top-level comments
            { $group: {
                _id: '$songId',
                discussionVolume: { $sum: 1 }, // Count of comments per song
                recentActivity: { $max: '$createdAt' }, // Most recent comment on this song
            }},
            { $sort: { discussionVolume: -1, recentActivity: -1 } },
            { $limit: 10 },
            { $lookup: {
                from: 'songs',
                localField: '_id',
                foreignField: '_id',
                as: 'song'
            }},
            { $unwind: '$song' },
            { $project: {
                _id: 0,
                songId: '$_id',
                title: '$song.title',
                coverArt: '$song.coverArt',
                discussionVolume: 1,
                recentActivity: 1,
            }},
        ]);

        res.json({ success: true, data: trendingTopics });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};
