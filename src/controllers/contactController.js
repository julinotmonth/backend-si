/**
 * Contact Controller
 * Handles contact form submissions (PostgreSQL version)
 */

import { v4 as uuidv4 } from 'uuid';
import { validationResult } from 'express-validator';
import db from '../config/database.js';
import { validationErrorHandler } from '../middleware/errorHandler.js';

/**
 * Submit contact message
 * POST /api/contact
 */
export const submitContact = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: validationErrorHandler(errors)
      });
    }

    const { name, email, subject, message } = req.body;

    const id = uuidv4();
    await db.query(`
      INSERT INTO contact_messages (id, name, email, subject, message)
      VALUES ($1, $2, $3, $4, $5)
    `, [id, name, email, subject, message]);

    res.status(201).json({
      success: true,
      message: 'Pesan berhasil dikirim. Kami akan segera menghubungi Anda.'
    });
  } catch (error) {
    console.error('Submit contact error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengirim pesan'
    });
  }
};

export default {
  submitContact
};
