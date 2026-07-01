import { Request, Response } from 'express';
import Song from '../models/Song';
import Artist from '../models/Artist';
import User from '../models/User';
import Payment from '../models/Payment';
import ListeningHistory from '../models/ListeningHistory';

export const getGlobalStats = async (req: Request, res: Response) => {
    try {
        if (req.user?.type !== 'admin') return res.status(403).json({ success: false, message: 'Forbidden' });

        const [totalUsers, totalArtists, totalSongs] = await Promise.all([
            User.countDocuments(),
            Artist.countDocuments(),
            Song.countDocuments(),
        ]);

        const revenueResult = await Payment.aggregate([
            { $match: { status: 'completed' } },
            { $group: { _id: null, total: { $sum: '$amount' } } },
        ]);
        const totalRevenue = revenueResult[0]?.total || 0;

        const songAggr = await Song.aggregate([
            { $group: { _id: null, plays: { $sum: '$plays' }, likes: { $sum: '$likes' }, downloads: { $sum: '$downloads' } } },
        ]);
        const analytics = songAggr[0] || { plays: 0, likes: 0, downloads: 0 };

        // User growth by month (current year)
        const now = new Date();
        const userGrowth = await User.aggregate([
            { $match: { createdAt: { $gte: new Date(now.getFullYear(), 0, 1) } } },
            { $group: { _id: { $month: '$createdAt' }, count: { $sum: 1 } } },
            { $sort: { '_id': 1 } },
        ]);
        const growthByMonth = Array.from({ length: 12 }, (_, i) => {
            const found = userGrowth.find((g: any) => g._id === i + 1);
            return found ? found.count : 0;
        });

        // Genre distribution
        const genreDist = await Artist.aggregate([
            { $match: { genre: { $nin: [null, ''] } } },
            { $group: { _id: '$genre', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 6 },
        ]);

        res.json({
            success: true,
            data: {
                totalUsers, totalArtists, totalSongs, totalRevenue,
                analytics,
                userGrowth: growthByMonth,
                userGrowthLabels: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
                genreDistribution: genreDist.map((g: any) => ({ label: g._id, count: g.count })),
            },
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getArtistStats = async (req: Request, res: Response) => {
    try {
        const artist = await Artist.findOne({ userId: req.user?.id });
        if (!artist) return res.status(404).json({ success: false, message: 'Artist profile not found' });

        const songs = await Song.find({ artistId: artist._id });
        const totalPlays = songs.reduce((s, song) => s + song.plays, 0);
        const totalLikes = songs.reduce((s, song) => s + song.likes, 0);
        const totalDownloads = songs.reduce((s, song) => s + song.downloads, 0);

        // Top 5 songs by plays
        const topSongs = await Song.find({ artistId: artist._id }).sort({ plays: -1 }).limit(5).select('title plays likes coverArt');

        // Play trend (last 30 days via ListeningHistory)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const songIds = songs.map(s => s._id);
        const playTrend = await ListeningHistory.aggregate([
            { $match: { songId: { $in: songIds }, playedAt: { $gte: thirtyDaysAgo } } },
            { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$playedAt' } }, count: { $sum: 1 } } },
            { $sort: { '_id': 1 } },
        ]);

        res.json({
            success: true,
            data: {
                totalSongs: songs.length,
                totalPlays, totalLikes, totalDownloads,
                followers: artist.followers,
                topSongs,
                playTrend,
            },
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};
