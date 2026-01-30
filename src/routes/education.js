/**
 * Education Routes
 */

import { Router } from 'express';
import { body } from 'express-validator';
import { authenticate, isAdmin } from '../middleware/auth.js';
import {
  getEducation,
  getEducationByIdOrSlug,
  createEducation,
  updateEducation,
  deleteEducation,
  getCategories
} from '../controllers/educationController.js';

const router = Router();

// Validation rules
const educationValidation = [
  body('title').notEmpty().withMessage('Judul harus diisi'),
  body('category').notEmpty().withMessage('Kategori harus diisi'),
  body('content').notEmpty().withMessage('Konten harus diisi')
];

// Public routes
router.get('/', getEducation);
router.get('/categories', getCategories);
router.get('/:idOrSlug', getEducationByIdOrSlug);

// Admin routes
router.post('/', authenticate, isAdmin, educationValidation, createEducation);
router.put('/:id', authenticate, isAdmin, updateEducation);
router.delete('/:id', authenticate, isAdmin, deleteEducation);

export default router;
