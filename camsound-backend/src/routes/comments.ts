import express from 'express';
import * as comments from '../controllers/commentsController';
import { protect } from '../middleware/auth';

const router = express.Router({ mergeParams: true });

router.get('/', comments.getComments);
router.post('/', protect, comments.createComment);
router.delete('/:commentId', protect, comments.deleteComment);
router.put('/:commentId/pin', protect, comments.pinComment);

export default router;
