import express from 'express';
import * as categories from '../controllers/categoryController';
import { protect, restrictTo } from '../middleware/auth';

const router = express.Router();

router.get('/', categories.getCategories);
router.get('/:id', categories.getCategory);
router.post('/', protect, restrictTo('admin'), categories.createCategory);
router.put('/:id', protect, restrictTo('admin'), categories.updateCategory);
router.delete('/:id', protect, restrictTo('admin'), categories.deleteCategory);

export default router;
