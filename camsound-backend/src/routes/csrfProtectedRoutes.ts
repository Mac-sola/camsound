import express from 'express';
import { verifyCsrf } from '../middleware/csrf';

const router = express.Router();

// This file exists purely to demonstrate module export of CSRF middleware.
// Protected routes can import verifyCsrf directly where needed.

export default router;
