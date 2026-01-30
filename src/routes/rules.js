/**
 * Rules Routes
 */

import { Router } from 'express';
import { body } from 'express-validator';
import { authenticate, isAdmin } from '../middleware/auth.js';
import {
  getRules,
  getRuleById,
  createRule,
  updateRule,
  deleteRule
} from '../controllers/rulesController.js';

const router = Router();

// Validation rules
const ruleValidation = [
  body('symptomId').notEmpty().withMessage('ID gejala harus diisi'),
  body('diseaseId').notEmpty().withMessage('ID penyakit harus diisi'),
  body('mb').isFloat({ min: 0, max: 1 }).withMessage('MB harus antara 0-1'),
  body('md').isFloat({ min: 0, max: 1 }).withMessage('MD harus antara 0-1'),
  body('weight').optional().isFloat({ min: 0, max: 1 }).withMessage('Weight harus antara 0-1')
];

// Public routes (for viewing rules)
router.get('/', getRules);
router.get('/:id', getRuleById);

// Admin routes
router.post('/', authenticate, isAdmin, ruleValidation, createRule);
router.put('/:id', authenticate, isAdmin, updateRule);
router.delete('/:id', authenticate, isAdmin, deleteRule);

export default router;