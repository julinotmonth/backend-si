/**
 * Authentication Middleware
 */

import { verifyToken } from '../utils/helpers.js';
import db from '../config/database.js';

/**
 * Authenticate JWT Token
 */
export const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Token tidak ditemukan. Silakan login terlebih dahulu.'
      });
    }
    
    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    
    // Get user from database
    const user = db.prepare('SELECT id, email, username, role FROM users WHERE id = ?').get(decoded.id);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User tidak ditemukan.'
      });
    }
    
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token sudah kadaluarsa. Silakan login kembali.'
      });
    }
    
    return res.status(401).json({
      success: false,
      message: 'Token tidak valid.'
    });
  }
};

/**
 * Check if user is admin
 */
export const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({
      success: false,
      message: 'Akses ditolak. Hanya admin yang dapat mengakses.'
    });
  }
};

/**
 * Optional authentication (doesn't fail if no token)
 */
export const optionalAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = verifyToken(token);
      
      const user = db.prepare('SELECT id, email, username, role FROM users WHERE id = ?').get(decoded.id);
      
      if (user) {
        req.user = user;
      }
    }
    
    next();
  } catch {
    // Continue without user
    next();
  }
};

export default {
  authenticate,
  isAdmin,
  optionalAuth
};