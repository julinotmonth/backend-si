/**
 * Auth Routes
 */

import { Router } from 'express';
import { body } from 'express-validator';
import { authenticate } from '../middleware/auth.js';
import {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  forgotPassword
} from '../controllers/authController.js';

const router = Router();

// Validation rules
const registerValidation = [
  body('email').isEmail().withMessage('Email tidak valid'),
  body('password').isLength({ min: 6 }).withMessage('Password minimal 6 karakter'),
  body('username').notEmpty().withMessage('Username harus diisi')
];

const loginValidation = [
  body('email').isEmail().withMessage('Email tidak valid'),
  body('password').notEmpty().withMessage('Password harus diisi')
];

const passwordValidation = [
  body('currentPassword').notEmpty().withMessage('Password saat ini harus diisi'),
  body('newPassword').isLength({ min: 6 }).withMessage('Password baru minimal 6 karakter')
];

// Routes
router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);
router.post('/forgot-password', forgotPassword);

// Protected routes
router.get('/me', authenticate, getProfile);
router.put('/profile', authenticate, updateProfile);
router.put('/password', authenticate, passwordValidation, changePassword);

export default router;