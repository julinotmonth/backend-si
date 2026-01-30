/**
 * Diseases Controller
 * Handles disease-related operations (PostgreSQL version)
 */

import { validationResult } from 'express-validator';
import db from '../config/database.js';
import { getPagination, formatPaginationResponse } from '../utils/helpers.js';
import { validationErrorHandler } from '../middleware/errorHandler.js';

/**
 * Get all diseases
 * GET /api/diseases
 */
export const getDiseases = async (req, res) => {
  try {
    const { severity, search, page = 1, limit = 20 } = req.query;
    const { offset, limit: limitNum, page: pageNum } = getPagination(page, limit);

    let query = 'SELECT * FROM diseases WHERE 1=1';
    let countQuery = 'SELECT COUNT(*) as total FROM diseases WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    if (severity) {
      query += ` AND severity = $${paramIndex}`;
      countQuery += ` AND severity = $${paramIndex}`;
      params.push(severity);
      paramIndex++;
    }

    if (search) {
      query += ` AND (name ILIKE $${paramIndex} OR description ILIKE $${paramIndex} OR code ILIKE $${paramIndex})`;
      countQuery += ` AND (name ILIKE $${paramIndex} OR description ILIKE $${paramIndex} OR code ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    const countResult = await db.getOne(countQuery, params);
    const total = parseInt(countResult.total);

    query += ` ORDER BY code ASC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    const diseases = await db.getAll(query, [...params, limitNum, offset]);

    // Parse JSON fields (PostgreSQL JSONB returns as object already)
    const parsedDiseases = diseases.map(d => ({
      ...d,
      prevention: d.prevention || [],
      treatment: d.treatment || [],
      statistics: d.statistics || {}
    }));

    res.json({
      success: true,
      ...formatPaginationResponse(parsedDiseases, total, pageNum, limitNum)
    });
  } catch (error) {
    console.error('Get diseases error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil data penyakit'
    });
  }
};

/**
 * Get disease by ID
 * GET /api/diseases/:id
 */
export const getDiseaseById = async (req, res) => {
  try {
    const { id } = req.params;

    const disease = await db.getOne('SELECT * FROM diseases WHERE id = $1', [id]);

    if (!disease) {
      return res.status(404).json({
        success: false,
        message: 'Penyakit tidak ditemukan'
      });
    }

    // Get associated symptoms
    const symptoms = await db.getAll(`
      SELECT s.*, ds.is_main_symptom 
      FROM symptoms s
      JOIN disease_symptoms ds ON s.id = ds.symptom_id
      WHERE ds.disease_id = $1
      ORDER BY ds.is_main_symptom DESC, s.code ASC
    `, [id]);

    // Get rules for this disease
    const rules = await db.getAll(`
      SELECT r.*, s.name as symptom_name, s.code as symptom_code
      FROM rules r
      JOIN symptoms s ON r.symptom_id = s.id
      WHERE r.disease_id = $1
    `, [id]);

    res.json({
      success: true,
      data: {
        ...disease,
        prevention: disease.prevention || [],
        treatment: disease.treatment || [],
        statistics: disease.statistics || {},
        symptoms,
        rules
      }
    });
  } catch (error) {
    console.error('Get disease error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil data penyakit'
    });
  }
};

/**
 * Create new disease (Admin only)
 * POST /api/diseases
 */
export const createDisease = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: validationErrorHandler(errors)
      });
    }

    const { code, name, description, probability, severity, prevention, treatment, statistics, image, symptoms } = req.body;

    // Check if code already exists
    const existing = await db.getOne('SELECT id FROM diseases WHERE code = $1', [code]);
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Kode penyakit sudah digunakan'
      });
    }

    const id = code;
    
    // Insert disease using transaction
    await db.transaction(async (client) => {
      await client.query(`
        INSERT INTO diseases (id, code, name, description, probability, severity, prevention, treatment, statistics, image)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `, [
        id, 
        code, 
        name, 
        description || '', 
        probability || 0.5, 
        severity || 'moderate',
        JSON.stringify(prevention || []),
        JSON.stringify(treatment || []),
        JSON.stringify(statistics || {}),
        image || null
      ]);

      // Add symptom relationships if provided
      if (symptoms && symptoms.length > 0) {
        for (const sym of symptoms) {
          await client.query(`
            INSERT INTO disease_symptoms (disease_id, symptom_id, is_main_symptom)
            VALUES ($1, $2, $3)
            ON CONFLICT (disease_id, symptom_id) DO NOTHING
          `, [id, sym.id, sym.isMain || false]);
        }
      }
    });

    const disease = await db.getOne('SELECT * FROM diseases WHERE id = $1', [id]);

    res.status(201).json({
      success: true,
      message: 'Penyakit berhasil ditambahkan',
      data: {
        ...disease,
        prevention: disease.prevention || [],
        treatment: disease.treatment || [],
        statistics: disease.statistics || {}
      }
    });
  } catch (error) {
    console.error('Create disease error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat menambahkan penyakit'
    });
  }
};

/**
 * Update disease (Admin only)
 * PUT /api/diseases/:id
 */
export const updateDisease = async (req, res) => {
  try {
    const { id } = req.params;
    const { code, name, description, probability, severity, prevention, treatment, statistics, image, symptoms } = req.body;

    const existing = await db.getOne('SELECT id FROM diseases WHERE id = $1', [id]);
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Penyakit tidak ditemukan'
      });
    }

    if (code) {
      const codeConflict = await db.getOne('SELECT id FROM diseases WHERE code = $1 AND id != $2', [code, id]);
      if (codeConflict) {
        return res.status(400).json({
          success: false,
          message: 'Kode penyakit sudah digunakan'
        });
      }
    }

    await db.transaction(async (client) => {
      await client.query(`
        UPDATE diseases 
        SET code = COALESCE($1, code),
            name = COALESCE($2, name),
            description = COALESCE($3, description),
            probability = COALESCE($4, probability),
            severity = COALESCE($5, severity),
            prevention = COALESCE($6, prevention),
            treatment = COALESCE($7, treatment),
            statistics = COALESCE($8, statistics),
            image = COALESCE($9, image),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $10
      `, [
        code || null, 
        name || null, 
        description || null, 
        probability !== undefined ? probability : null, 
        severity || null,
        prevention ? JSON.stringify(prevention) : null,
        treatment ? JSON.stringify(treatment) : null,
        statistics ? JSON.stringify(statistics) : null,
        image || null, 
        id
      ]);

      // Update symptom relationships if provided
      if (symptoms) {
        // Remove existing relationships
        await client.query('DELETE FROM disease_symptoms WHERE disease_id = $1', [id]);
        
        // Add new relationships
        for (const sym of symptoms) {
          await client.query(`
            INSERT INTO disease_symptoms (disease_id, symptom_id, is_main_symptom)
            VALUES ($1, $2, $3)
          `, [id, sym.id, sym.isMain || false]);
        }
      }
    });

    const disease = await db.getOne('SELECT * FROM diseases WHERE id = $1', [id]);

    res.json({
      success: true,
      message: 'Penyakit berhasil diperbarui',
      data: {
        ...disease,
        prevention: disease.prevention || [],
        treatment: disease.treatment || [],
        statistics: disease.statistics || {}
      }
    });
  } catch (error) {
    console.error('Update disease error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat memperbarui penyakit'
    });
  }
};

/**
 * Delete disease (Admin only)
 * DELETE /api/diseases/:id
 */
export const deleteDisease = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await db.getOne('SELECT id FROM diseases WHERE id = $1', [id]);
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Penyakit tidak ditemukan'
      });
    }

    await db.query('DELETE FROM diseases WHERE id = $1', [id]);

    res.json({
      success: true,
      message: 'Penyakit berhasil dihapus'
    });
  } catch (error) {
    console.error('Delete disease error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat menghapus penyakit'
    });
  }
};

export default {
  getDiseases,
  getDiseaseById,
  createDisease,
  updateDisease,
  deleteDisease
};
