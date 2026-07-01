import express from 'express';
import * as follows from '../controllers/followsController';
import { protect } from '../middleware/auth';

const router = express.Router();

router.get('/', protect, follows.getFollowing);
router.post('/:artistId', protect, follows.followArtist);
router.delete('/:artistId', protect, follows.unfollowArtist);

export default router;
