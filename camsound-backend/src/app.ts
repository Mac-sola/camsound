import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';

// Routes
import authRoutes from './routes/auth';
import songsRoutes from './routes/songs';
import uploadRoutes from './routes/upload';
import artistsRoutes from './routes/artists';
import playlistsRoutes from './routes/playlists';
import favoritesRoutes from './routes/favorites';
import followsRoutes from './routes/follows';
import historyRoutes from './routes/history';
import commentsRoutes from './routes/comments';
import notificationsRoutes from './routes/notifications';
import subscriptionsRoutes from './routes/subscriptions';
import paymentsRoutes from './routes/payments';
import momoRoutes from './routes/momo';
import withdrawalsRoutes from './routes/withdrawals';
import royaltiesRoutes from './routes/royalties';
import statsRoutes from './routes/stats';
import adminRoutes from './routes/admin';
import categoriesRoutes from './routes/categories';
import featuredRoutes from './routes/featured';
import adRevenueRoutes from './routes/adrevenue';
import notificationSettingsRoutes from './routes/notificationSettings';
import adminLogsRoutes from './routes/adminLogs';
import reportsRoutes from './routes/reports';
import * as commentsController from './controllers/commentsController';
import { verifyCsrf } from './middleware/csrf';

// Middleware
import { apiLimiter } from './middleware/rateLimiter';

dotenv.config();

const app = express();

const allowedOrigins = [
    process.env.FRONTEND_URL,
    'http://localhost:5173',
    'http://localhost:5174',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174',
].filter(Boolean);

// ── CORS ──────────────────────────────────────────────────────────────────────
app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
        if (process.env.NODE_ENV !== 'production' && /^https?:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)) {
            return callback(null, true);
        }
        return callback(new Error(`CORS blocked origin: ${origin}`));
    },
    credentials: true,
}));

// ── Body Parsers ──────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/media', express.static(path.resolve(__dirname, '../public/uploads')));

// ── Rate Limiting (general) ───────────────────────────────────────────────────
app.use('/api', apiLimiter);

// ── CSRF Protection ───────────────────────────────────────────────────────────
app.use('/api', verifyCsrf);

// ── Database Connection ───────────────────────────────────────────────────────
mongoose.connect(process.env.MONGODB_URI!)
    .then(() => console.log('✅ MongoDB Connected'))
    .catch(err => console.error('❌ MongoDB Error:', err));

// ── API Routes ────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/songs', songsRoutes);
// Nested comments under songs: /api/songs/:songId/comments
app.use('/api/songs/:songId/comments', commentsRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/artists', artistsRoutes);
app.use('/api/playlists', playlistsRoutes);
app.use('/api/favorites', favoritesRoutes);
app.use('/api/follows', followsRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/featured', featuredRoutes);
app.use('/api/subscriptions', subscriptionsRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/momo', momoRoutes);
app.use('/api/withdrawals', withdrawalsRoutes);
app.use('/api/royalties', royaltiesRoutes);
app.use('/api/ad-revenue', adRevenueRoutes);
app.use('/api/notification-settings', notificationSettingsRoutes);
app.use('/api/admin-logs', adminLogsRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/admin', adminRoutes);

// Community global routes
app.get('/api/community/comments', commentsController.getRecentComments);
app.get('/api/comments/trending', commentsController.getTrendingComments);

// ── Health Check ──────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
    res.json({ status: 'OK', message: 'CamSound API is running 🎵', version: '2.0.0' });
});

// ── 404 Handler ───────────────────────────────────────────────────────────────
app.use((_req, res) => {
    res.status(404).json({ success: false, message: 'Route not found' });
});

// ── Global Error Handler ──────────────────────────────────────────────────────
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error(err);
    const responseError = process.env.NODE_ENV === 'production' ? undefined : err.message;
    res.status(500).json({ success: false, message: 'Internal server error', ...(responseError ? { error: responseError } : {}) });
});

// ── Start Server ──────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🎵 CamSound API v2.0 running on http://localhost:${PORT}`);
    
    // Environment validation checks
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'camsound_super_secret_key_2026') {
        console.warn('⚠️ WARNING: Using weak default JWT_SECRET. Please set a strong JWT_SECRET in production.');
    }
    if (!process.env.CLOUDINARY_NAME || process.env.CLOUDINARY_NAME.includes('your_cloudinary')) {
        console.warn('⚠️ WARNING: Cloudinary credentials appear to be placeholder values. File uploads may fail.');
    }
});

export default app;
