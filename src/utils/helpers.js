/**
 * Helper Utilities
 */

import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

/**
 * Generate JWT Token
 * @param {Object} payload - Token payload
 * @returns {string} - JWT token
 */
export const generateToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

/**
 * Verify JWT Token
 * @param {string} token - JWT token
 * @returns {Object} - Decoded payload
 */
export const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

/**
 * Hash Password
 * @param {string} password - Plain password
 * @returns {string} - Hashed password
 */
export const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

/**
 * Compare Password
 * @param {string} password - Plain password
 * @param {string} hashedPassword - Hashed password
 * @returns {boolean} - Match result
 */
export const comparePassword = async (password, hashedPassword) => {
  return bcrypt.compare(password, hashedPassword);
};

/**
 * Generate Slug from string
 * @param {string} text - Input text
 * @returns {string} - URL-friendly slug
 */
export const generateSlug = (text) => {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

/**
 * Pagination helper
 * @param {number} page - Current page
 * @param {number} limit - Items per page
 * @returns {Object} - { offset, limit }
 */
export const getPagination = (page = 1, limit = 10) => {
  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
  const offset = (pageNum - 1) * limitNum;
  
  return { offset, limit: limitNum, page: pageNum };
};

/**
 * Format pagination response
 * @param {Array} data - Data array
 * @param {number} total - Total count
 * @param {number} page - Current page
 * @param {number} limit - Items per page
 * @returns {Object} - Formatted pagination response
 */
export const formatPaginationResponse = (data, total, page, limit) => {
  const totalPages = Math.ceil(total / limit);
  
  return {
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1
    }
  };
};

/**
 * Parse JSON safely
 * @param {string|object} jsonString - JSON string or object
 * @param {any} defaultValue - Default value if parse fails
 * @returns {any} - Parsed value or default
 */
export const safeJsonParse = (jsonString, defaultValue = null) => {
  // If already an object, return it
  if (typeof jsonString === 'object' && jsonString !== null) {
    return jsonString;
  }
  // If not a string, return default
  if (typeof jsonString !== 'string') {
    return defaultValue;
  }
  // Try to parse JSON string
  try {
    return JSON.parse(jsonString);
  } catch {
    return defaultValue;
  }
};

export default {
  generateToken,
  verifyToken,
  hashPassword,
  comparePassword,
  generateSlug,
  getPagination,
  formatPaginationResponse,
  safeJsonParse
};