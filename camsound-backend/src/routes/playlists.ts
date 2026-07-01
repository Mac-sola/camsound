import express from 'express';
import * as playlists from '../controllers/playlistsController';
import { protect } from '../middleware/auth';

const router = express.Router();

router.get('/', protect, playlists.getPlaylists);
router.get('/:id', protect, playlists.getPlaylist);
router.post('/', protect, playlists.createPlaylist);
router.put('/:id', protect, playlists.updatePlaylist);
router.delete('/:id', protect, playlists.deletePlaylist);
router.post('/:id/songs', protect, playlists.addSongToPlaylist);
router.delete('/:id/songs/:songId', protect, playlists.removeSongFromPlaylist);

export default router;
