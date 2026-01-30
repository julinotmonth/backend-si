/**
 * Contact Routes
 */

import { Router } from 'express';
import { body } from 'express-validator';
import { submitContact } from '../controllers/contactController.js';

const router = Router();

// Validation rules
const contactValidation = [
  body('name').notEmpty().withMessage('Nama harus diisi'),
  body('email').isEmail().withMessage('Email tidak valid'),
  body('subject').notEmpty().withMessage('Subjek harus diisi'),
  body('message').notEmpty().withMessage('Pesan harus diisi')
];

// Public route
router.post('/', contactValidation, submitContact);

export default router;
