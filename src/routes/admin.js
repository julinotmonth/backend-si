/**
 * Admin Routes
 */

import { Router } from 'express';
import { authenticate, isAdmin } from '../middleware/auth.js';
import {
  getDashboard,
  getUsers,
  updateUserRole,
  deleteUser,
  getMessages,
  markMessageRead,
  deleteMessage,
  getDiagnoses
} from '../controllers/adminController.js';

const router = Router();

// All admin routes require authentication and admin role
router.use(authenticate, isAdmin);

// Dashboard
router.get('/dashboard', getDashboard);

// User management
router.get('/users', getUsers);
router.put('/users/:id/role', updateUserRole);
router.delete('/users/:id', deleteUser);

// Diagnoses
router.get('/diagnoses', getDiagnoses);

// Messages
router.get('/messages', getMessages);
router.put('/messages/:id/read', markMessageRead);
router.delete('/messages/:id', deleteMessage);

export default router;