import express from 'express';
import * as subs from '../controllers/subscriptionsController';
import { protect, restrictTo } from '../middleware/auth';

const router = express.Router();

// Plans (public read, admin write)
router.get('/plans', subs.getPlans);
router.post('/plans', protect, restrictTo('admin'), subs.createPlan);
router.put('/plans/:id', protect, restrictTo('admin'), subs.updatePlan);
router.delete('/plans/:id', protect, restrictTo('admin'), subs.deletePlan);

// User's active subscription & premium status
router.get('/my-active', protect, subs.getMyActiveSubscription);
router.post('/cancel', protect, subs.cancelMySubscription);
router.get('/my-payments', protect, subs.getMyPayments);

// Admin revenue stats
router.get('/revenue-stats', protect, restrictTo('admin'), subs.getRevenueStats);

// Subscriptions CRUD
router.get('/', protect, subs.getSubscriptions);
router.post('/', protect, subs.createSubscription);
router.get('/:id', protect, subs.getSubscription);
router.put('/:id', protect, restrictTo('admin'), subs.updateSubscription);
router.delete('/:id', protect, restrictTo('admin'), subs.deleteSubscription);

export default router;
