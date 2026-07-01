import express from 'express';
import * as songs from '../controllers/songsController';
import { protect } from '../middleware/auth';

const router = express.Router();

router.get('/', songs.getSongs);
router.get('/:id', songs.getSong);
router.post('/', protect, songs.createSong);
router.put('/:id', protect, songs.updateSong);
router.delete('/:id', protect, songs.deleteSong);
router.post('/:id/play', songs.trackPlay);

export default router;
