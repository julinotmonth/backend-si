/**
 * Admin Controller
 * Handles admin-specific operations (PostgreSQL version)
 */

import db from '../config/database.js';
import { getPagination, formatPaginationResponse } from '../utils/helpers.js';

/**
 * Get admin dashboard statistics
 * GET /api/admin/dashboard
 */
export const getDashboard = async (req, res) => {
  try {
    // User statistics
    const userStats = await db.getOne(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) as admins,
        SUM(CASE WHEN role = 'user' THEN 1 ELSE 0 END) as users,
        SUM(CASE WHEN DATE(created_at) = CURRENT_DATE THEN 1 ELSE 0 END) as today
      FROM users
    `);

    // Diagnosis statistics
    const diagnosisStats = await db.getOne(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN DATE(created_at) = CURRENT_DATE THEN 1 ELSE 0 END) as today,
        SUM(CASE WHEN DATE(created_at) >= CURRENT_DATE - INTERVAL '7 days' THEN 1 ELSE 0 END) as "thisWeek",
        SUM(CASE WHEN DATE(created_at) >= CURRENT_DATE - INTERVAL '30 days' THEN 1 ELSE 0 END) as "thisMonth"
      FROM diagnoses
    `);

    // Content counts
    const symptomsCount = await db.getOne('SELECT COUNT(*) as count FROM symptoms');
    const diseasesCount = await db.getOne('SELECT COUNT(*) as count FROM diseases');
    const rulesCount = await db.getOne('SELECT COUNT(*) as count FROM rules');
    const educationCount = await db.getOne('SELECT COUNT(*) as count FROM education');

    const contentStats = {
      symptoms: parseInt(symptomsCount.count),
      diseases: parseInt(diseasesCount.count),
      rules: parseInt(rulesCount.count),
      education: parseInt(educationCount.count)
    };

    // Recent diagnoses
    const recentDiagnoses = await db.getAll(`
      SELECT d.id, d.user_data, d.summary, d.created_at, u.username
      FROM diagnoses d
      JOIN users u ON d.user_id = u.id
      ORDER BY d.created_at DESC
      LIMIT 5
    `);

    const formattedRecentDiagnoses = recentDiagnoses.map(d => ({
      id: d.id,
      userData: d.user_data || {},
      summary: d.summary || {},
      username: d.username,
      createdAt: d.created_at
    }));

    // Recent users
    const recentUsers = await db.getAll(`
      SELECT id, username, email, role, created_at
      FROM users
      ORDER BY created_at DESC
      LIMIT 5
    `);

    // Disease distribution (from last 30 days)
    const diagnoses = await db.getAll(`
      SELECT summary FROM diagnoses 
      WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
    `);

    const diseaseCount = {};
    diagnoses.forEach(d => {
      const summary = d.summary || {};
      const primaryDisease = summary.primaryDiagnosis?.disease?.name;
      if (primaryDisease) {
        diseaseCount[primaryDisease] = (diseaseCount[primaryDisease] || 0) + 1;
      }
    });

    const diseaseDistribution = Object.entries(diseaseCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    res.json({
      success: true,
      data: {
        users: {
          total: parseInt(userStats.total) || 0,
          admins: parseInt(userStats.admins) || 0,
          users: parseInt(userStats.users) || 0,
          today: parseInt(userStats.today) || 0
        },
        diagnoses: {
          total: parseInt(diagnosisStats.total) || 0,
          today: parseInt(diagnosisStats.today) || 0,
          thisWeek: parseInt(diagnosisStats.thisWeek) || 0,
          thisMonth: parseInt(diagnosisStats.thisMonth) || 0
        },
        content: contentStats,
        recentDiagnoses: formattedRecentDiagnoses,
        recentUsers,
        diseaseDistribution
      }
    });
  } catch (error) {
    console.error('Get dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil data dashboard'
    });
  }
};

/**
 * Get all users (Admin only)
 * GET /api/admin/users
 */
export const getUsers = async (req, res) => {
  try {
    const { role, search, page = 1, limit = 20 } = req.query;
    const { offset, limit: limitNum, page: pageNum } = getPagination(page, limit);

    let query = 'SELECT id, email, username, role, age, gender, created_at, updated_at FROM users WHERE 1=1';
    let countQuery = 'SELECT COUNT(*) as total FROM users WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    if (role) {
      query += ` AND role = $${paramIndex}`;
      countQuery += ` AND role = $${paramIndex}`;
      params.push(role);
      paramIndex++;
    }

    if (search) {
      query += ` AND (username ILIKE $${paramIndex} OR email ILIKE $${paramIndex})`;
      countQuery += ` AND (username ILIKE $${paramIndex} OR email ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    const countResult = await db.getOne(countQuery, params);
    const total = parseInt(countResult.total);

    query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    const users = await db.getAll(query, [...params, limitNum, offset]);

    // Get diagnosis count for each user
    const usersWithStats = await Promise.all(users.map(async (user) => {
      const countResult = await db.getOne(
        'SELECT COUNT(*) as count FROM diagnoses WHERE user_id = $1',
        [user.id]
      );
      return { ...user, diagnosisCount: parseInt(countResult.count) };
    }));

    res.json({
      success: true,
      ...formatPaginationResponse(usersWithStats, total, pageNum, limitNum)
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil data users'
    });
  }
};

/**
 * Update user role (Admin only)
 * PUT /api/admin/users/:id/role
 */
export const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Role tidak valid'
      });
    }

    // Prevent self-demotion
    if (id === req.user.id && role !== 'admin') {
      return res.status(400).json({
        success: false,
        message: 'Tidak dapat mengubah role diri sendiri'
      });
    }

    const existing = await db.getOne('SELECT id FROM users WHERE id = $1', [id]);
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'User tidak ditemukan'
      });
    }

    await db.query('UPDATE users SET role = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [role, id]);

    const user = await db.getOne(
      'SELECT id, email, username, role, created_at, updated_at FROM users WHERE id = $1',
      [id]
    );

    res.json({
      success: true,
      message: 'Role user berhasil diperbarui',
      data: user
    });
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat memperbarui role'
    });
  }
};

/**
 * Delete user (Admin only)
 * DELETE /api/admin/users/:id
 */
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent self-deletion
    if (id === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Tidak dapat menghapus akun sendiri'
      });
    }

    const existing = await db.getOne('SELECT id FROM users WHERE id = $1', [id]);
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'User tidak ditemukan'
      });
    }

    await db.query('DELETE FROM users WHERE id = $1', [id]);

    res.json({
      success: true,
      message: 'User berhasil dihapus'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat menghapus user'
    });
  }
};

/**
 * Get contact messages (Admin only)
 * GET /api/admin/messages
 */
export const getMessages = async (req, res) => {
  try {
    const { isRead, page = 1, limit = 20 } = req.query;
    const { offset, limit: limitNum, page: pageNum } = getPagination(page, limit);

    let query = 'SELECT * FROM contact_messages WHERE 1=1';
    let countQuery = 'SELECT COUNT(*) as total FROM contact_messages WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    if (isRead !== undefined) {
      query += ` AND is_read = $${paramIndex}`;
      countQuery += ` AND is_read = $${paramIndex}`;
      params.push(isRead === 'true');
      paramIndex++;
    }

    const countResult = await db.getOne(countQuery, params);
    const total = parseInt(countResult.total);

    query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    const messages = await db.getAll(query, [...params, limitNum, offset]);

    // Get unread count
    const unreadResult = await db.getOne('SELECT COUNT(*) as unread FROM contact_messages WHERE is_read = false');

    res.json({
      success: true,
      unreadCount: parseInt(unreadResult.unread),
      ...formatPaginationResponse(messages, total, pageNum, limitNum)
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil pesan'
    });
  }
};

/**
 * Mark message as read (Admin only)
 * PUT /api/admin/messages/:id/read
 */
export const markMessageRead = async (req, res) => {
  try {
    const { id } = req.params;

    await db.query('UPDATE contact_messages SET is_read = true WHERE id = $1', [id]);

    res.json({
      success: true,
      message: 'Pesan ditandai sudah dibaca'
    });
  } catch (error) {
    console.error('Mark message read error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan'
    });
  }
};

/**
 * Delete message (Admin only)
 * DELETE /api/admin/messages/:id
 */
export const deleteMessage = async (req, res) => {
  try {
    const { id } = req.params;

    await db.query('DELETE FROM contact_messages WHERE id = $1', [id]);

    res.json({
      success: true,
      message: 'Pesan berhasil dihapus'
    });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat menghapus pesan'
    });
  }
};

/**
 * Get all diagnoses (Admin only)
 * GET /api/admin/diagnoses
 */
export const getDiagnoses = async (req, res) => {
  try {
    const { page = 1, limit = 50, search } = req.query;
    const { offset, limit: limitNum, page: pageNum } = getPagination(page, limit);

    // Get total count first
    const countResult = await db.getOne('SELECT COUNT(*) as total FROM diagnoses');
    const total = parseInt(countResult?.total || 0);

    // Get diagnoses with user info
    let diagnoses;
    if (search) {
      diagnoses = await db.getAll(`
        SELECT d.*, u.username, u.email 
        FROM diagnoses d
        LEFT JOIN users u ON d.user_id = u.id
        WHERE d.user_data::text ILIKE $1 OR u.username ILIKE $1
        ORDER BY d.created_at DESC 
        LIMIT $2 OFFSET $3
      `, [`%${search}%`, limitNum, offset]);
    } else {
      diagnoses = await db.getAll(`
        SELECT d.*, u.username, u.email 
        FROM diagnoses d
        LEFT JOIN users u ON d.user_id = u.id
        ORDER BY d.created_at DESC 
        LIMIT $1 OFFSET $2
      `, [limitNum, offset]);
    }

    // Format JSON fields (PostgreSQL JSONB returns as object already)
    const formattedDiagnoses = diagnoses.map(d => ({
      id: d.id,
      userId: d.user_id,
      username: d.username || null,
      email: d.email || null,
      userData: d.user_data || {},
      selectedSymptoms: d.selected_symptoms || [],
      results: d.results || [],
      summary: d.summary || {},
      createdAt: d.created_at
    }));

    res.json({
      success: true,
      ...formatPaginationResponse(formattedDiagnoses, total, pageNum, limitNum)
    });
  } catch (error) {
    console.error('Get diagnoses error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil data diagnosis'
    });
  }
};

export default {
  getDashboard,
  getUsers,
  updateUserRole,
  deleteUser,
  getMessages,
  markMessageRead,
  deleteMessage,
  getDiagnoses
};
