/**
 * Diagnosis Routes
 */

import { Router } from 'express';
import { body } from 'express-validator';
import { authenticate, isAdmin, optionalAuth } from '../middleware/auth.js';
import {
  processDiagnosis,
  getHistory,
  getDiagnosisById,
  deleteDiagnosis,
  getStatistics,
  getAllDiagnoses
} from '../controllers/diagnosisController.js';

const router = Router();

// Validation rules
const diagnosisValidation = [
  body('userData').isObject().withMessage('Data user harus berupa object'),
  body('userData.name').notEmpty().withMessage('Nama harus diisi'),
  body('userData.age').notEmpty().withMessage('Usia harus diisi'),
  body('selectedSymptoms').isArray({ min: 1 }).withMessage('Minimal pilih satu gejala'),
  body('selectedSymptoms.*.symptomId').notEmpty().withMessage('ID gejala harus diisi'),
  body('selectedSymptoms.*.certainty').isFloat({ min: 0.2, max: 1 }).withMessage('Certainty harus antara 0.2-1')
];

// Process diagnosis (optional auth - saves to history if logged in)
router.post('/', optionalAuth, diagnosisValidation, processDiagnosis);

// User routes (requires authentication)
router.get('/history', authenticate, getHistory);
router.get('/history/:id', authenticate, getDiagnosisById);
router.delete('/history/:id', authenticate, deleteDiagnosis);

// Admin routes
router.get('/statistics', authenticate, isAdmin, getStatistics);
router.get('/all', authenticate, isAdmin, getAllDiagnoses);

export default router;
