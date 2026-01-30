/**
 * Rules Controller
 * Handles rule-related operations for Certainty Factor (PostgreSQL version)
 */

import { validationResult } from 'express-validator';
import db from '../config/database.js';
import { getPagination, formatPaginationResponse } from '../utils/helpers.js';
import { validationErrorHandler } from '../middleware/errorHandler.js';

/**
 * Get all rules
 * GET /api/rules
 */
export const getRules = async (req, res) => {
  try {
    const { diseaseId, symptomId, page = 1, limit = 100 } = req.query;
    const { offset, limit: limitNum, page: pageNum } = getPagination(page, limit);

    let query = `
      SELECT r.*, 
             s.name as symptom_name, s.code as symptom_code,
             d.name as disease_name, d.code as disease_code
      FROM rules r
      JOIN symptoms s ON r.symptom_id = s.id
      JOIN diseases d ON r.disease_id = d.id
      WHERE 1=1
    `;
    let countQuery = 'SELECT COUNT(*) as total FROM rules WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    if (diseaseId) {
      query += ` AND r.disease_id = $${paramIndex}`;
      countQuery += ` AND disease_id = $${paramIndex}`;
      params.push(diseaseId);
      paramIndex++;
    }

    if (symptomId) {
      query += ` AND r.symptom_id = $${paramIndex}`;
      countQuery += ` AND symptom_id = $${paramIndex}`;
      params.push(symptomId);
      paramIndex++;
    }

    const countResult = await db.getOne(countQuery, params);
    const total = parseInt(countResult.total);

    query += ` ORDER BY r.id ASC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    const rules = await db.getAll(query, [...params, limitNum, offset]);

    res.json({
      success: true,
      ...formatPaginationResponse(rules, total, pageNum, limitNum)
    });
  } catch (error) {
    console.error('Get rules error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil data rules'
    });
  }
};

/**
 * Get rule by ID
 * GET /api/rules/:id
 */
export const getRuleById = async (req, res) => {
  try {
    const { id } = req.params;

    const rule = await db.getOne(`
      SELECT r.*, 
             s.name as symptom_name, s.code as symptom_code,
             d.name as disease_name, d.code as disease_code
      FROM rules r
      JOIN symptoms s ON r.symptom_id = s.id
      JOIN diseases d ON r.disease_id = d.id
      WHERE r.id = $1
    `, [id]);

    if (!rule) {
      return res.status(404).json({
        success: false,
        message: 'Rule tidak ditemukan'
      });
    }

    res.json({
      success: true,
      data: rule
    });
  } catch (error) {
    console.error('Get rule error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil data rule'
    });
  }
};

/**
 * Create new rule (Admin only)
 * POST /api/rules
 */
export const createRule = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: validationErrorHandler(errors)
      });
    }

    const { id, symptomId, diseaseId, mb, md, weight } = req.body;

    // Check if rule already exists for this symptom-disease pair
    const existing = await db.getOne('SELECT id FROM rules WHERE symptom_id = $1 AND disease_id = $2', [symptomId, diseaseId]);
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Rule untuk kombinasi gejala dan penyakit ini sudah ada'
      });
    }

    // Verify symptom exists
    const symptom = await db.getOne('SELECT id FROM symptoms WHERE id = $1', [symptomId]);
    if (!symptom) {
      return res.status(400).json({
        success: false,
        message: 'Gejala tidak ditemukan'
      });
    }

    // Verify disease exists
    const disease = await db.getOne('SELECT id FROM diseases WHERE id = $1', [diseaseId]);
    if (!disease) {
      return res.status(400).json({
        success: false,
        message: 'Penyakit tidak ditemukan'
      });
    }

    // Generate sequential ID (R57, R58, etc.)
    let ruleId = id;
    if (!ruleId) {
      // Get the highest rule number using PostgreSQL syntax
      const lastRule = await db.getOne(`
        SELECT id FROM rules 
        WHERE id ~ '^R[0-9]+$' 
        ORDER BY CAST(SUBSTRING(id FROM 2) AS INTEGER) DESC 
        LIMIT 1
      `);
      
      let nextNum = 1;
      if (lastRule && lastRule.id) {
        const match = lastRule.id.match(/R(\d+)/);
        if (match) {
          nextNum = parseInt(match[1], 10) + 1;
        }
      }
      ruleId = `R${nextNum.toString().padStart(2, '0')}`;
    }
    
    await db.query(`
      INSERT INTO rules (id, symptom_id, disease_id, mb, md, weight)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [ruleId, symptomId, diseaseId, mb, md, weight || 1.0]);

    const rule = await db.getOne(`
      SELECT r.*, 
             s.name as symptom_name, s.code as symptom_code,
             d.name as disease_name, d.code as disease_code
      FROM rules r
      JOIN symptoms s ON r.symptom_id = s.id
      JOIN diseases d ON r.disease_id = d.id
      WHERE r.id = $1
    `, [ruleId]);

    res.status(201).json({
      success: true,
      message: 'Rule berhasil ditambahkan',
      data: rule
    });
  } catch (error) {
    console.error('Create rule error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat menambahkan rule'
    });
  }
};

/**
 * Update rule (Admin only)
 * PUT /api/rules/:id
 */
export const updateRule = async (req, res) => {
  try {
    const { id } = req.params;
    const { mb, md, weight } = req.body;

    const existing = await db.getOne('SELECT id FROM rules WHERE id = $1', [id]);
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Rule tidak ditemukan'
      });
    }

    await db.query(`
      UPDATE rules 
      SET mb = COALESCE($1, mb),
          md = COALESCE($2, md),
          weight = COALESCE($3, weight),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
    `, [mb, md, weight, id]);

    const rule = await db.getOne(`
      SELECT r.*, 
             s.name as symptom_name, s.code as symptom_code,
             d.name as disease_name, d.code as disease_code
      FROM rules r
      JOIN symptoms s ON r.symptom_id = s.id
      JOIN diseases d ON r.disease_id = d.id
      WHERE r.id = $1
    `, [id]);

    res.json({
      success: true,
      message: 'Rule berhasil diperbarui',
      data: rule
    });
  } catch (error) {
    console.error('Update rule error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat memperbarui rule'
    });
  }
};

/**
 * Delete rule (Admin only)
 * DELETE /api/rules/:id
 */
export const deleteRule = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await db.getOne('SELECT id FROM rules WHERE id = $1', [id]);
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Rule tidak ditemukan'
      });
    }

    await db.query('DELETE FROM rules WHERE id = $1', [id]);

    res.json({
      success: true,
      message: 'Rule berhasil dihapus'
    });
  } catch (error) {
    console.error('Delete rule error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat menghapus rule'
    });
  }
};

export default {
  getRules,
  getRuleById,
  createRule,
  updateRule,
  deleteRule
};
