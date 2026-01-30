/**
 * Auth Controller
 * Handles authentication operations (PostgreSQL version)
 */

import { v4 as uuidv4 } from 'uuid';
import { validationResult } from 'express-validator';
import db from '../config/database.js';
import { generateToken, hashPassword, comparePassword } from '../utils/helpers.js';
import { validationErrorHandler } from '../middleware/errorHandler.js';

/**
 * Register new user
 * POST /api/auth/register
 */
export const register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: validationErrorHandler(errors)
      });
    }

    const { email, password, username, age, gender } = req.body;

    // Check if email already exists
    const existingUser = await db.getOne('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email sudah terdaftar'
      });
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const userId = uuidv4();
    await db.query(`
      INSERT INTO users (id, email, password, username, age, gender, role)
      VALUES ($1, $2, $3, $4, $5, $6, 'user')
    `, [userId, email, hashedPassword, username, age || null, gender || null]);

    // Generate token
    const token = generateToken({ id: userId, email, role: 'user' });

    res.status(201).json({
      success: true,
      message: 'Registrasi berhasil!',
      data: {
        user: {
          id: userId,
          email,
          username,
          role: 'user',
          age,
          gender
        },
        token
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat registrasi'
    });
  }
};

/**
 * Login user
 * POST /api/auth/login
 */
export const login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: validationErrorHandler(errors)
      });
    }

    const { email, password } = req.body;

    // Find user
    const user = await db.getOne('SELECT * FROM users WHERE email = $1', [email]);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Email atau password salah'
      });
    }

    // Check password
    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Email atau password salah'
      });
    }

    // Generate token
    const token = generateToken({ id: user.id, email: user.email, role: user.role });

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      success: true,
      message: 'Login berhasil!',
      data: {
        user: userWithoutPassword,
        token
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat login'
    });
  }
};

/**
 * Get current user profile
 * GET /api/auth/me
 */
export const getProfile = async (req, res) => {
  try {
    const user = await db.getOne(`
      SELECT id, email, username, role, age, gender, created_at, updated_at
      FROM users WHERE id = $1
    `, [req.user.id]);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User tidak ditemukan'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil profil'
    });
  }
};

/**
 * Update user profile
 * PUT /api/auth/profile
 */
export const updateProfile = async (req, res) => {
  try {
    const { username, age, gender } = req.body;

    await db.query(`
      UPDATE users 
      SET username = COALESCE($1, username),
          age = COALESCE($2, age),
          gender = COALESCE($3, gender),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
    `, [username, age, gender, req.user.id]);

    const updatedUser = await db.getOne(`
      SELECT id, email, username, role, age, gender, created_at, updated_at
      FROM users WHERE id = $1
    `, [req.user.id]);

    res.json({
      success: true,
      message: 'Profil berhasil diperbarui',
      data: updatedUser
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat memperbarui profil'
    });
  }
};

/**
 * Change password
 * PUT /api/auth/password
 */
export const changePassword = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: validationErrorHandler(errors)
      });
    }

    const { currentPassword, newPassword } = req.body;

    // Get user with password
    const user = await db.getOne('SELECT password FROM users WHERE id = $1', [req.user.id]);

    // Verify current password
    const isMatch = await comparePassword(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Password saat ini salah'
      });
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Update password
    await db.query(`
      UPDATE users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2
    `, [hashedPassword, req.user.id]);

    res.json({
      success: true,
      message: 'Password berhasil diubah'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengubah password'
    });
  }
};

/**
 * Forgot password (send reset link)
 * POST /api/auth/forgot-password
 */
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await db.getOne('SELECT id, email FROM users WHERE email = $1', [email]);
    
    // Always return success to prevent email enumeration
    res.json({
      success: true,
      message: 'Jika email terdaftar, link reset password akan dikirim'
    });

    // In production, send email here
    if (user) {
      console.log(`Password reset requested for: ${email}`);
      // TODO: Implement email sending
    }
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan'
    });
  }
};

export default {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  forgotPassword
};
