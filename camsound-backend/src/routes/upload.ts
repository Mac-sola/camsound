import express from 'express';
import * as upload from '../controllers/uploadController';
import { protect } from '../middleware/auth';

const router = express.Router();

router.post('/song', protect, ...(upload.uploadSong as any[]));
router.post('/avatar', protect, ...(upload.uploadAvatar as any[]));
router.post('/artwork', protect, ...(upload.uploadArtwork as any[]));

export default router;
