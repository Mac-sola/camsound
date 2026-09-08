import express from 'express';
import * as admin from '../controllers/adminController';
import { protect, restrictTo } from '../middleware/auth';

const router = express.Router();

// All admin routes require authentication + admin role
router.use(protect, restrictTo('admin'));

// Users
router.get('/users', admin.getUsers);
router.post('/users', admin.createUser);
router.put('/users/:id/status', admin.updateUserStatus);
router.put('/users/:id/role', admin.updateUserRole);
router.put('/users/:id/reset-password', admin.resetUserPassword);
router.delete('/users/:id', admin.deleteUser);

// Song moderation
router.get('/songs', admin.getSongsAdmin);
router.put('/songs/:id', admin.updateSongAdmin);
router.delete('/songs/:id', admin.deleteSongAdmin);
router.put('/songs/:id/moderate', admin.moderateSong);

// Reports
router.get('/reports', admin.getReports);
router.put('/reports/:id', admin.updateReport);

// Platform settings
router.get('/settings', admin.getSettings);
router.put('/settings', admin.updateSettings);

export default router;
