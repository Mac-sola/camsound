import express from 'express';
import songController from '../controllers/SongController';
import { protect } from '../middleware/auth';

const router = express.Router();

router.get('/', songController.getSongs);
router.get('/:id', songController.getSong);
router.post('/', protect, songController.createSong);
router.put('/:id', protect, songController.updateSong);
router.delete('/:id', protect, songController.deleteSong);
router.post('/:id/play', songController.trackPlay);

export default router;
