/**
 * Subscription Lifecycle Service
 * 
 * Handles subscription expiry checking, user downgrade on expiry,
 * grace periods, and expiry warning notifications.
 * 
 * Called on app startup and can be run periodically via cron.
 */

import Subscription from '../models/Subscription';
import User from '../models/User';
import Notification from '../models/Notification';

const GRACE_PERIOD_DAYS = 3; // Allow 3 days after expiry before downgrading

/**
 * Check all active subscriptions and expire those past their endDate + grace period.
 * Downgrades user subscriptionStatus to 'free' when their last active sub expires.
 */
export async function checkExpiredSubscriptions(): Promise<{ expired: number; warned: number }> {
    const now = new Date();
    let expiredCount = 0;
    let warnedCount = 0;

    try {
        // Find subscriptions that are active but past endDate + grace period
        const graceDate = new Date(now);
        graceDate.setDate(graceDate.getDate() - GRACE_PERIOD_DAYS);

        const expiredSubs = await Subscription.find({
            status: 'active',
            endDate: { $lt: graceDate },
        });

        for (const sub of expiredSubs) {
            sub.status = 'expired';
            await sub.save();
            expiredCount++;

            // Check if user has any other active subscriptions
            const otherActive = await Subscription.findOne({
                userId: sub.userId,
                status: 'active',
                _id: { $ne: sub._id },
            });

            if (!otherActive) {
                // No more active subs — downgrade user to free
                await User.findByIdAndUpdate(sub.userId, { subscriptionStatus: 'free' });

                // Send expiry notification
                try {
                    await Notification.create({
                        userId: sub.userId,
                        type: 'subscription',
                        title: 'Subscription Expired',
                        message: `Your ${sub.planName} subscription has expired. Upgrade again to continue enjoying premium features!`,
                        read: false,
                    });
                } catch {
                    // Notification creation is non-critical
                }
            }
        }

        // Send warning notifications for subscriptions expiring within 7 days
        const warningDate = new Date(now);
        warningDate.setDate(warningDate.getDate() + 7);

        const expiringSoon = await Subscription.find({
            status: 'active',
            endDate: { $gte: now, $lte: warningDate },
        });

        for (const sub of expiringSoon) {
            const daysLeft = Math.ceil((sub.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

            // Only warn at 7, 3, and 1 day marks
            if ([7, 3, 1].includes(daysLeft)) {
                try {
                    // Avoid duplicate notifications
                    const existing = await Notification.findOne({
                        userId: sub.userId,
                        type: 'subscription',
                        title: { $regex: `expires in ${daysLeft}` },
                        createdAt: { $gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) },
                    });

                    if (!existing) {
                        await Notification.create({
                            userId: sub.userId,
                            type: 'subscription',
                            title: `Subscription expires in ${daysLeft} day${daysLeft > 1 ? 's' : ''}`,
                            message: `Your ${sub.planName} plan expires ${daysLeft === 1 ? 'tomorrow' : `in ${daysLeft} days`}. Renew now to keep your premium access!`,
                            read: false,
                        });
                        warnedCount++;
                    }
                } catch {
                    // Non-critical
                }
            }
        }

        if (expiredCount > 0 || warnedCount > 0) {
            console.log(`[SubscriptionService] Expired: ${expiredCount}, Warned: ${warnedCount}`);
        }
    } catch (err) {
        console.error('[SubscriptionService] Error checking subscriptions:', err);
    }

    return { expired: expiredCount, warned: warnedCount };
}

/**
 * Cancel a user's active subscription
 */
export async function cancelSubscription(
    subscriptionId: string,
    userId: string,
    reason?: string
): Promise<boolean> {
    const sub = await Subscription.findOne({ _id: subscriptionId, userId, status: 'active' });
    if (!sub) return false;

    sub.status = 'cancelled';
    sub.cancelledAt = new Date();
    sub.cancelReason = reason || 'User requested cancellation';
    await sub.save();

    // Check if user has other active subscriptions
    const otherActive = await Subscription.findOne({
        userId,
        status: 'active',
        _id: { $ne: sub._id },
    });

    if (!otherActive) {
        await User.findByIdAndUpdate(userId, { subscriptionStatus: 'free' });
    }

    return true;
}

/**
 * Get user's current active subscription (if any)
 */
export async function getActiveSubscription(userId: string) {
    return Subscription.findOne({ userId, status: 'active' }).sort({ createdAt: -1 });
}

/**
 * Check if a user has premium access (active subscription or specific tier)
 */
export async function hasPremiumAccess(userId: string): Promise<{
    hasAccess: boolean;
    tier: 'free' | 'premium' | 'vip';
    subscription: any | null;
    daysRemaining: number;
}> {
    const user = await User.findById(userId);
    if (!user) return { hasAccess: false, tier: 'free', subscription: null, daysRemaining: 0 };

    const sub = await getActiveSubscription(userId);
    if (!sub || sub.status !== 'active') {
        // User might have been manually set to premium by admin
        if (user.subscriptionStatus === 'premium' || user.subscriptionStatus === 'vip') {
            return { hasAccess: true, tier: user.subscriptionStatus as any, subscription: null, daysRemaining: 999 };
        }
        return { hasAccess: false, tier: 'free', subscription: null, daysRemaining: 0 };
    }

    const now = new Date();
    const daysRemaining = Math.max(0, Math.ceil((sub.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
    const tier = sub.planName.toLowerCase().includes('vip') || sub.planName.toLowerCase().includes('annual') ? 'vip' : 'premium';

    return { hasAccess: true, tier, subscription: sub, daysRemaining };
}

/**
 * Start the periodic subscription checker (runs every hour)
 */
export function startSubscriptionChecker(intervalMs: number = 60 * 60 * 1000): NodeJS.Timeout {
    console.log('[SubscriptionService] Starting periodic subscription checker');
    // Run immediately on startup
    checkExpiredSubscriptions();
    // Then run periodically
    return setInterval(() => checkExpiredSubscriptions(), intervalMs);
}

export default {
    checkExpiredSubscriptions,
    cancelSubscription,
    getActiveSubscription,
    hasPremiumAccess,
    startSubscriptionChecker,
};
