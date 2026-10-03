/**
 * Premium Content Gating Middleware
 * 
 * Checks if a user has the required subscription tier to access premium content.
 * Used to protect premium song streaming, downloads, and other paid features.
 */

import { Request, Response, NextFunction } from 'express';
import { hasPremiumAccess } from '../services/subscriptionService';

/**
 * Middleware factory that checks if user has at least the required tier.
 * Tier hierarchy: free < premium < vip
 * 
 * Usage:
 *   router.get('/song/:id/stream', protect, requireTier('premium'), streamSong);
 *   router.get('/song/:id/download', protect, requireTier('vip'), downloadSong);
 */
export function requireTier(minimumTier: 'premium' | 'vip') {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = req.user?.id || req.user?._id;
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required',
                    requiresAuth: true,
                });
            }

            // Admin and artist accounts bypass premium checks
            if (req.user?.type === 'admin' || req.user?.type === 'artist') {
                return next();
            }

            const access = await hasPremiumAccess(userId);

            const tierLevel: Record<string, number> = { free: 0, premium: 1, vip: 2 };
            const userLevel = tierLevel[access.tier] || 0;
            const requiredLevel = tierLevel[minimumTier] || 1;

            if (userLevel >= requiredLevel) {
                // User has sufficient access
                (req as any).premiumAccess = access;
                return next();
            }

            return res.status(403).json({
                success: false,
                message: `This content requires a ${minimumTier} subscription`,
                requiresUpgrade: true,
                currentTier: access.tier,
                requiredTier: minimumTier,
                daysRemaining: access.daysRemaining,
            });
        } catch (err: any) {
            console.error('[PremiumGate] Error:', err.message);
            // Fail open for non-critical errors — don't block the user
            return next();
        }
    };
}

/**
 * Non-blocking middleware that attaches premium access info to the request
 * without blocking access. Useful for conditionally showing content
 * (e.g., 30-second preview vs full song).
 */
export function attachPremiumInfo() {
    return async (req: Request, _res: Response, next: NextFunction) => {
        try {
            const userId = req.user?.id || req.user?._id;
            if (userId) {
                const access = await hasPremiumAccess(userId);
                (req as any).premiumAccess = access;
            } else {
                (req as any).premiumAccess = { hasAccess: false, tier: 'free', subscription: null, daysRemaining: 0 };
            }
        } catch {
            (req as any).premiumAccess = { hasAccess: false, tier: 'free', subscription: null, daysRemaining: 0 };
        }
        next();
    };
}

export default { requireTier, attachPremiumInfo };
