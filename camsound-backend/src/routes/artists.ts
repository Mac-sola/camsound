import express from 'express';
import * as artists from '../controllers/artistsController';
import { protect } from '../middleware/auth';

const router = express.Router();

router.get('/', artists.getArtists);
router.get('/me', protect, artists.getArtistMe);
router.get('/:id', artists.getArtist);
router.put('/:id', protect, artists.updateArtist);
router.get('/:id/stats', protect, artists.getArtistStats);

export default router;
