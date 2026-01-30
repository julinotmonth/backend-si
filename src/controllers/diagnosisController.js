/**
 * Diagnosis Controller
 * Handles diagnosis operations using Certainty Factor method (PostgreSQL version)
 */

import { v4 as uuidv4 } from 'uuid';
import { validationResult } from 'express-validator';
import db from '../config/database.js';
import { 
  diagnose, 
  calculateRiskFactor, 
  adjustDiagnosisWithRisk,
  createDiagnosisSummary 
} from '../utils/certaintyFactor.js';
import { getPagination, formatPaginationResponse } from '../utils/helpers.js';
import { validationErrorHandler } from '../middleware/errorHandler.js';

/**
 * Process diagnosis
 * POST /api/diagnosis
 */
export const processDiagnosis = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: validationErrorHandler(errors)
      });
    }

    const { userData, selectedSymptoms } = req.body;
    const userId = req.user?.id || null;

    if (!selectedSymptoms || selectedSymptoms.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Minimal pilih satu gejala'
      });
    }

    // Get all necessary data from database
    const symptoms = await db.getAll('SELECT * FROM symptoms');
    const diseases = await db.getAll('SELECT * FROM diseases');
    const rules = await db.getAll('SELECT * FROM rules');

    // Parse disease JSON fields (PostgreSQL JSONB returns as object already)
    const parsedDiseases = diseases.map(d => ({
      ...d,
      prevention: d.prevention || [],
      treatment: d.treatment || [],
      statistics: d.statistics || {}
    }));

    // Calculate risk factor
    const riskFactor = calculateRiskFactor({
      age: parseInt(userData.age) || 0,
      smokingYears: parseInt(userData.smokingYears) || 0,
      cigarettesPerDay: parseInt(userData.cigarettesPerDay) || 0
    });

    // Run diagnosis
    const rawResults = diagnose(selectedSymptoms, parsedDiseases, rules, symptoms);

    // Adjust with risk factor
    const adjustedResults = adjustDiagnosisWithRisk(rawResults, riskFactor);

    // Create summary
    const summary = createDiagnosisSummary(adjustedResults, userData, riskFactor);

    // Save to database if user is logged in
    let diagnosisId = null;
    if (userId) {
      diagnosisId = uuidv4();
      await db.query(`
        INSERT INTO diagnoses (id, user_id, user_data, selected_symptoms, results, summary)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [
        diagnosisId,
        userId,
        JSON.stringify(userData),
        JSON.stringify(selectedSymptoms),
        JSON.stringify(adjustedResults),
        JSON.stringify(summary)
      ]);
    }

    res.json({
      success: true,
      message: 'Diagnosis berhasil diproses',
      data: {
        id: diagnosisId,
        results: adjustedResults,
        summary,
        riskFactor
      }
    });
  } catch (error) {
    console.error('Process diagnosis error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat memproses diagnosis'
    });
  }
};

/**
 * Get diagnosis history for current user
 * GET /api/diagnosis/history
 */
export const getHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10 } = req.query;
    const { offset, limit: limitNum, page: pageNum } = getPagination(page, limit);

    const countResult = await db.getOne(
      'SELECT COUNT(*) as total FROM diagnoses WHERE user_id = $1',
      [userId]
    );
    const total = parseInt(countResult.total);

    const diagnoses = await db.getAll(`
      SELECT * FROM diagnoses 
      WHERE user_id = $1 
      ORDER BY created_at DESC 
      LIMIT $2 OFFSET $3
    `, [userId, limitNum, offset]);

    // Parse JSON fields (PostgreSQL JSONB returns as object already)
    const parsedDiagnoses = diagnoses.map(d => ({
      id: d.id,
      userData: d.user_data || {},
      selectedSymptoms: d.selected_symptoms || [],
      results: d.results || [],
      summary: d.summary || {},
      createdAt: d.created_at
    }));

    res.json({
      success: true,
      ...formatPaginationResponse(parsedDiagnoses, total, pageNum, limitNum)
    });
  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil riwayat diagnosis'
    });
  }
};

/**
 * Get diagnosis by ID
 * GET /api/diagnosis/:id
 */
export const getDiagnosisById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const diagnosis = await db.getOne(`
      SELECT * FROM diagnoses WHERE id = $1 AND user_id = $2
    `, [id, userId]);

    if (!diagnosis) {
      return res.status(404).json({
        success: false,
        message: 'Diagnosis tidak ditemukan'
      });
    }

    res.json({
      success: true,
      data: {
        id: diagnosis.id,
        userData: diagnosis.user_data || {},
        selectedSymptoms: diagnosis.selected_symptoms || [],
        results: diagnosis.results || [],
        summary: diagnosis.summary || {},
        createdAt: diagnosis.created_at
      }
    });
  } catch (error) {
    console.error('Get diagnosis error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil data diagnosis'
    });
  }
};

/**
 * Delete diagnosis from history
 * DELETE /api/diagnosis/:id
 */
export const deleteDiagnosis = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const existing = await db.getOne(
      'SELECT id FROM diagnoses WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Diagnosis tidak ditemukan'
      });
    }

    await db.query('DELETE FROM diagnoses WHERE id = $1', [id]);

    res.json({
      success: true,
      message: 'Riwayat diagnosis berhasil dihapus'
    });
  } catch (error) {
    console.error('Delete diagnosis error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat menghapus diagnosis'
    });
  }
};

/**
 * Get diagnosis statistics (Admin)
 * GET /api/diagnosis/statistics
 */
export const getStatistics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    let dateFilter = '';
    const params = [];
    let paramIndex = 1;

    if (startDate) {
      dateFilter += ` AND created_at >= $${paramIndex}`;
      params.push(startDate);
      paramIndex++;
    }
    if (endDate) {
      dateFilter += ` AND created_at <= $${paramIndex}`;
      params.push(endDate);
      paramIndex++;
    }

    // Total diagnoses
    const totalResult = await db.getOne(
      `SELECT COUNT(*) as total FROM diagnoses WHERE 1=1 ${dateFilter}`,
      params
    );
    const total = parseInt(totalResult.total);

    // Diagnoses per day (last 30 days)
    const dailyStats = await db.getAll(`
      SELECT DATE(created_at) as date, COUNT(*) as count
      FROM diagnoses
      WHERE created_at >= CURRENT_DATE - INTERVAL '30 days' ${dateFilter}
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `, params);

    // Get all diagnoses for disease distribution
    const allDiagnoses = await db.getAll(
      `SELECT summary FROM diagnoses WHERE 1=1 ${dateFilter}`,
      params
    );

    // Calculate disease distribution
    const diseaseCount = {};
    allDiagnoses.forEach(d => {
      const summary = d.summary || {};
      const primaryDisease = summary.primaryDiagnosis?.disease?.name;
      if (primaryDisease) {
        diseaseCount[primaryDisease] = (diseaseCount[primaryDisease] || 0) + 1;
      }
    });

    // Sort by count
    const diseaseDistribution = Object.entries(diseaseCount)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count, percentage: ((count / total) * 100).toFixed(1) }));

    res.json({
      success: true,
      data: {
        total,
        dailyStats,
        diseaseDistribution
      }
    });
  } catch (error) {
    console.error('Get statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil statistik'
    });
  }
};

/**
 * Get all diagnoses (Admin)
 * GET /api/diagnosis/all
 */
export const getAllDiagnoses = async (req, res) => {
  try {
    const { page = 1, limit = 20, startDate, endDate } = req.query;
    const { offset, limit: limitNum, page: pageNum } = getPagination(page, limit);

    let whereClause = '1=1';
    const params = [];
    let paramIndex = 1;

    if (startDate) {
      whereClause += ` AND d.created_at >= $${paramIndex}`;
      params.push(startDate);
      paramIndex++;
    }
    if (endDate) {
      whereClause += ` AND d.created_at <= $${paramIndex}`;
      params.push(endDate);
      paramIndex++;
    }

    const countResult = await db.getOne(
      `SELECT COUNT(*) as total FROM diagnoses d WHERE ${whereClause}`,
      params
    );
    const total = parseInt(countResult.total);

    const diagnoses = await db.getAll(`
      SELECT d.*, u.username, u.email
      FROM diagnoses d
      JOIN users u ON d.user_id = u.id
      WHERE ${whereClause}
      ORDER BY d.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `, [...params, limitNum, offset]);

    const parsedDiagnoses = diagnoses.map(d => ({
      id: d.id,
      user: {
        id: d.user_id,
        username: d.username,
        email: d.email
      },
      userData: d.user_data || {},
      summary: d.summary || {},
      createdAt: d.created_at
    }));

    res.json({
      success: true,
      ...formatPaginationResponse(parsedDiagnoses, total, pageNum, limitNum)
    });
  } catch (error) {
    console.error('Get all diagnoses error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil data diagnosis'
    });
  }
};

export default {
  processDiagnosis,
  getHistory,
  getDiagnosisById,
  deleteDiagnosis,
  getStatistics,
  getAllDiagnoses
};
