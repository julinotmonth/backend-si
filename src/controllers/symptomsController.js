/**
 * Symptoms Controller
 * Handles symptom-related operations (PostgreSQL version)
 */

import { validationResult } from 'express-validator';
import db from '../config/database.js';
import { getPagination, formatPaginationResponse } from '../utils/helpers.js';
import { validationErrorHandler } from '../middleware/errorHandler.js';

/**
 * Get all symptoms
 * GET /api/symptoms
 */
export const getSymptoms = async (req, res) => {
  try {
    const { category, search, page = 1, limit = 50 } = req.query;
    const { offset, limit: limitNum, page: pageNum } = getPagination(page, limit);

    let query = 'SELECT * FROM symptoms WHERE 1=1';
    let countQuery = 'SELECT COUNT(*) as total FROM symptoms WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    if (category && category !== 'all') {
      query += ` AND category = $${paramIndex}`;
      countQuery += ` AND category = $${paramIndex}`;
      params.push(category);
      paramIndex++;
    }

    if (search) {
      query += ` AND (name ILIKE $${paramIndex} OR description ILIKE $${paramIndex} OR code ILIKE $${paramIndex})`;
      countQuery += ` AND (name ILIKE $${paramIndex} OR description ILIKE $${paramIndex} OR code ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    // Get total count
    const countResult = await db.getOne(countQuery, params);
    const total = parseInt(countResult.total);

    // Get paginated data
    query += ` ORDER BY code ASC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    const symptoms = await db.getAll(query, [...params, limitNum, offset]);

    res.json({
      success: true,
      ...formatPaginationResponse(symptoms, total, pageNum, limitNum)
    });
  } catch (error) {
    console.error('Get symptoms error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil data gejala'
    });
  }
};

/**
 * Get symptom by ID
 * GET /api/symptoms/:id
 */
export const getSymptomById = async (req, res) => {
  try {
    const { id } = req.params;

    const symptom = await db.getOne('SELECT * FROM symptoms WHERE id = $1', [id]);

    if (!symptom) {
      return res.status(404).json({
        success: false,
        message: 'Gejala tidak ditemukan'
      });
    }

    // Get related diseases
    const relatedDiseases = await db.getAll(`
      SELECT d.* FROM diseases d
      JOIN disease_symptoms ds ON d.id = ds.disease_id
      WHERE ds.symptom_id = $1
    `, [id]);

    res.json({
      success: true,
      data: {
        ...symptom,
        relatedDiseases
      }
    });
  } catch (error) {
    console.error('Get symptom error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil data gejala'
    });
  }
};

/**
 * Create new symptom (Admin only)
 * POST /api/symptoms
 */
export const createSymptom = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: validationErrorHandler(errors)
      });
    }

    const { code, name, description, category, mb, md } = req.body;

    // Check if code already exists
    const existing = await db.getOne('SELECT id FROM symptoms WHERE code = $1', [code]);
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Kode gejala sudah digunakan'
      });
    }

    const id = code;
    await db.query(`
      INSERT INTO symptoms (id, code, name, description, category, mb, md)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [id, code, name, description, category, mb || 0.5, md || 0.1]);

    const symptom = await db.getOne('SELECT * FROM symptoms WHERE id = $1', [id]);

    res.status(201).json({
      success: true,
      message: 'Gejala berhasil ditambahkan',
      data: symptom
    });
  } catch (error) {
    console.error('Create symptom error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat menambahkan gejala'
    });
  }
};

/**
 * Update symptom (Admin only)
 * PUT /api/symptoms/:id
 */
export const updateSymptom = async (req, res) => {
  try {
    const { id } = req.params;
    const { code, name, description, category, mb, md } = req.body;

    const existing = await db.getOne('SELECT id FROM symptoms WHERE id = $1', [id]);
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Gejala tidak ditemukan'
      });
    }

    if (code) {
      const codeConflict = await db.getOne('SELECT id FROM symptoms WHERE code = $1 AND id != $2', [code, id]);
      if (codeConflict) {
        return res.status(400).json({
          success: false,
          message: 'Kode gejala sudah digunakan'
        });
      }
    }

    await db.query(`
      UPDATE symptoms 
      SET code = COALESCE($1, code),
          name = COALESCE($2, name),
          description = COALESCE($3, description),
          category = COALESCE($4, category),
          mb = COALESCE($5, mb),
          md = COALESCE($6, md),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $7
    `, [code, name, description, category, mb, md, id]);

    const symptom = await db.getOne('SELECT * FROM symptoms WHERE id = $1', [id]);

    res.json({
      success: true,
      message: 'Gejala berhasil diperbarui',
      data: symptom
    });
  } catch (error) {
    console.error('Update symptom error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat memperbarui gejala'
    });
  }
};

/**
 * Delete symptom (Admin only)
 * DELETE /api/symptoms/:id
 */
export const deleteSymptom = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await db.getOne('SELECT id FROM symptoms WHERE id = $1', [id]);
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Gejala tidak ditemukan'
      });
    }

    await db.query('DELETE FROM symptoms WHERE id = $1', [id]);

    res.json({
      success: true,
      message: 'Gejala berhasil dihapus'
    });
  } catch (error) {
    console.error('Delete symptom error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat menghapus gejala'
    });
  }
};

/**
 * Get symptom categories
 * GET /api/symptoms/categories
 */
export const getCategories = (req, res) => {
  try {
    const categories = [
      { id: 'all', name: 'Semua Gejala', icon: 'List' },
      { id: 'respiratory', name: 'Pernapasan', icon: 'Wind' },
      { id: 'pain', name: 'Nyeri', icon: 'Zap' },
      { id: 'systemic', name: 'Sistemik', icon: 'Activity' },
      { id: 'cardiovascular', name: 'Kardiovaskular', icon: 'Heart' },
      { id: 'neurological', name: 'Neurologis', icon: 'Brain' },
      { id: 'oral', name: 'Mulut & Tenggorokan', icon: 'MessageCircle' },
      { id: 'reproductive', name: 'Reproduksi', icon: 'Shield' }
    ];

    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan'
    });
  }
};

export default {
  getSymptoms,
  getSymptomById,
  createSymptom,
  updateSymptom,
  deleteSymptom,
  getCategories
};
