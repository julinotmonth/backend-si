/**
 * Education Controller
 * Handles educational content operations (PostgreSQL version)
 */

import { v4 as uuidv4 } from 'uuid';
import { validationResult } from 'express-validator';
import db from '../config/database.js';
import { getPagination, formatPaginationResponse, generateSlug } from '../utils/helpers.js';
import { validationErrorHandler } from '../middleware/errorHandler.js';

/**
 * Get all education articles
 * GET /api/education
 */
export const getEducation = async (req, res) => {
  try {
    const { category, featured, search, page = 1, limit = 10 } = req.query;
    const { offset, limit: limitNum, page: pageNum } = getPagination(page, limit);

    let query = 'SELECT * FROM education WHERE 1=1';
    let countQuery = 'SELECT COUNT(*) as total FROM education WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    if (category) {
      query += ` AND category = $${paramIndex}`;
      countQuery += ` AND category = $${paramIndex}`;
      params.push(category);
      paramIndex++;
    }

    if (featured === 'true') {
      query += ' AND is_featured = true';
      countQuery += ' AND is_featured = true';
    }

    if (search) {
      query += ` AND (title ILIKE $${paramIndex} OR excerpt ILIKE $${paramIndex} OR content ILIKE $${paramIndex})`;
      countQuery += ` AND (title ILIKE $${paramIndex} OR excerpt ILIKE $${paramIndex} OR content ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    const countResult = await db.getOne(countQuery, params);
    const total = parseInt(countResult.total);

    query += ` ORDER BY is_featured DESC, created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    const articles = await db.getAll(query, [...params, limitNum, offset]);

    res.json({
      success: true,
      ...formatPaginationResponse(articles, total, pageNum, limitNum)
    });
  } catch (error) {
    console.error('Get education error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil artikel edukasi'
    });
  }
};

/**
 * Get education article by ID or slug
 * GET /api/education/:idOrSlug
 */
export const getEducationByIdOrSlug = async (req, res) => {
  try {
    const { idOrSlug } = req.params;

    let article = await db.getOne('SELECT * FROM education WHERE id = $1', [idOrSlug]);
    
    if (!article) {
      article = await db.getOne('SELECT * FROM education WHERE slug = $1', [idOrSlug]);
    }

    if (!article) {
      return res.status(404).json({
        success: false,
        message: 'Artikel tidak ditemukan'
      });
    }

    // Increment view count
    await db.query('UPDATE education SET views = views + 1 WHERE id = $1', [article.id]);

    // Get related articles (same category)
    const relatedArticles = await db.getAll(`
      SELECT id, title, slug, excerpt, image, read_time, created_at
      FROM education
      WHERE category = $1 AND id != $2
      ORDER BY created_at DESC
      LIMIT 3
    `, [article.category, article.id]);

    res.json({
      success: true,
      data: {
        ...article,
        views: article.views + 1,
        relatedArticles
      }
    });
  } catch (error) {
    console.error('Get education article error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil artikel'
    });
  }
};

/**
 * Create education article (Admin only)
 * POST /api/education
 */
export const createEducation = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: validationErrorHandler(errors)
      });
    }

    // Handle both camelCase and snake_case field names
    const { 
      title, 
      category, 
      excerpt, 
      content, 
      image, 
      author,
      readTime, read_time,
      isFeatured, is_featured 
    } = req.body;

    const finalReadTime = readTime || read_time || 5;
    const finalIsFeatured = isFeatured !== undefined ? isFeatured : (is_featured !== undefined ? is_featured : false);

    const id = uuidv4();
    let slug = generateSlug(title);

    // Check if slug exists, append number if needed
    let slugExists = await db.getOne('SELECT id FROM education WHERE slug = $1', [slug]);
    let counter = 1;
    while (slugExists) {
      slug = `${generateSlug(title)}-${counter}`;
      slugExists = await db.getOne('SELECT id FROM education WHERE slug = $1', [slug]);
      counter++;
    }

    await db.query(`
      INSERT INTO education (id, title, slug, category, excerpt, content, image, author, read_time, is_featured)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    `, [
      id, 
      title, 
      slug, 
      category || 'Umum', 
      excerpt || '', 
      content || '', 
      image || null, 
      author || 'Tim SI-DIROK', 
      finalReadTime, 
      finalIsFeatured
    ]);

    const article = await db.getOne('SELECT * FROM education WHERE id = $1', [id]);

    res.status(201).json({
      success: true,
      message: 'Artikel berhasil ditambahkan',
      data: article
    });
  } catch (error) {
    console.error('Create education error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat menambahkan artikel'
    });
  }
};

/**
 * Update education article (Admin only)
 * PUT /api/education/:id
 */
export const updateEducation = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Handle both camelCase and snake_case field names
    const { 
      title, 
      category, 
      excerpt, 
      content, 
      image, 
      author,
      readTime, read_time,
      isFeatured, is_featured 
    } = req.body;

    const finalReadTime = readTime !== undefined ? readTime : read_time;
    const finalIsFeatured = isFeatured !== undefined ? isFeatured : is_featured;

    const existing = await db.getOne('SELECT id FROM education WHERE id = $1', [id]);
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Artikel tidak ditemukan'
      });
    }

    // Generate new slug if title changed
    let slug = null;
    if (title) {
      slug = generateSlug(title);
      const slugConflict = await db.getOne('SELECT id FROM education WHERE slug = $1 AND id != $2', [slug, id]);
      if (slugConflict) {
        slug = `${slug}-${Date.now()}`;
      }
    }

    await db.query(`
      UPDATE education 
      SET title = COALESCE($1, title),
          slug = COALESCE($2, slug),
          category = COALESCE($3, category),
          excerpt = COALESCE($4, excerpt),
          content = COALESCE($5, content),
          image = COALESCE($6, image),
          author = COALESCE($7, author),
          read_time = COALESCE($8, read_time),
          is_featured = COALESCE($9, is_featured),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $10
    `, [
      title || null, 
      slug, 
      category || null, 
      excerpt || null, 
      content || null, 
      image || null, 
      author || null, 
      finalReadTime !== undefined ? finalReadTime : null, 
      finalIsFeatured !== undefined ? finalIsFeatured : null, 
      id
    ]);

    const article = await db.getOne('SELECT * FROM education WHERE id = $1', [id]);

    res.json({
      success: true,
      message: 'Artikel berhasil diperbarui',
      data: article
    });
  } catch (error) {
    console.error('Update education error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat memperbarui artikel'
    });
  }
};

/**
 * Delete education article (Admin only)
 * DELETE /api/education/:id
 */
export const deleteEducation = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await db.getOne('SELECT id FROM education WHERE id = $1', [id]);
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Artikel tidak ditemukan'
      });
    }

    await db.query('DELETE FROM education WHERE id = $1', [id]);

    res.json({
      success: true,
      message: 'Artikel berhasil dihapus'
    });
  } catch (error) {
    console.error('Delete education error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat menghapus artikel'
    });
  }
};

/**
 * Get education categories
 * GET /api/education/categories
 */
export const getCategories = async (req, res) => {
  try {
    const categories = await db.getAll(`
      SELECT category, COUNT(*) as count
      FROM education
      GROUP BY category
      ORDER BY count DESC
    `);

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
  getEducation,
  getEducationByIdOrSlug,
  createEducation,
  updateEducation,
  deleteEducation,
  getCategories
};
