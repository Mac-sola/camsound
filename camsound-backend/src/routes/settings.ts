import express from 'express';
import * as adminController from '../controllers/adminController';

const router = express.Router();

// Public platform settings - no auth required
router.get('/', adminController.getSettings);

export default router;
