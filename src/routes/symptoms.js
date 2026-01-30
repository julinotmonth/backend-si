/**
 * Symptoms Routes
 */

import { Router } from 'express';
import { body } from 'express-validator';
import { authenticate, isAdmin } from '../middleware/auth.js';
import {
  getSymptoms,
  getSymptomById,
  createSymptom,
  updateSymptom,
  deleteSymptom,
  getCategories
} from '../controllers/symptomsController.js';

const router = Router();

// Validation rules
const symptomValidation = [
  body('code').notEmpty().withMessage('Kode gejala harus diisi'),
  body('name').notEmpty().withMessage('Nama gejala harus diisi'),
  body('category').notEmpty().withMessage('Kategori harus diisi'),
  body('mb').optional().isFloat({ min: 0, max: 1 }).withMessage('MB harus antara 0-1'),
  body('md').optional().isFloat({ min: 0, max: 1 }).withMessage('MD harus antara 0-1')
];

// Public routes
router.get('/', getSymptoms);
router.get('/categories', getCategories);
router.get('/:id', getSymptomById);

// Admin routes
router.post('/', authenticate, isAdmin, symptomValidation, createSymptom);
router.put('/:id', authenticate, isAdmin, updateSymptom);
router.delete('/:id', authenticate, isAdmin, deleteSymptom);

export default router;
