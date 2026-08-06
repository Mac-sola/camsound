import express from 'express';
import * as history from '../controllers/historyController';
import { protect } from '../middleware/auth';

const router = express.Router();

router.get('/', protect, history.getHistory);
router.post('/', protect, history.addHistory);
router.delete('/', protect, history.clearHistory);

export default router;
