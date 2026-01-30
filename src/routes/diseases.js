/**
 * Diseases Routes
 */

import { Router } from 'express';
import { body } from 'express-validator';
import { authenticate, isAdmin } from '../middleware/auth.js';
import {
  getDiseases,
  getDiseaseById,
  createDisease,
  updateDisease,
  deleteDisease
} from '../controllers/diseasesController.js';

const router = Router();

// Validation rules
const diseaseValidation = [
  body('code').notEmpty().withMessage('Kode penyakit harus diisi'),
  body('name').notEmpty().withMessage('Nama penyakit harus diisi'),
  body('description').notEmpty().withMessage('Deskripsi harus diisi'),
  body('severity').optional().isIn(['critical', 'high', 'moderate', 'low']).withMessage('Severity tidak valid')
];

// Public routes
router.get('/', getDiseases);
router.get('/:id', getDiseaseById);

// Admin routes
router.post('/', authenticate, isAdmin, diseaseValidation, createDisease);
router.put('/:id', authenticate, isAdmin, updateDisease);
router.delete('/:id', authenticate, isAdmin, deleteDisease);

export default router;
