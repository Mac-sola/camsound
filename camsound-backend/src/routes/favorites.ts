import express from 'express';
import * as favorites from '../controllers/favoritesController';
import { protect } from '../middleware/auth';

const router = express.Router();

router.get('/', protect, favorites.getFavorites);
router.post('/:songId', protect, favorites.likeSong);
router.delete('/:songId', protect, favorites.unlikeSong);

export default router;
