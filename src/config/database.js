/**
 * Database Configuration
 * PostgreSQL connection using pg (node-postgres)
 * Provides connection pool for efficient database operations
 */

import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

// Database configuration
const dbConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    }
  : {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 5432,
      database: process.env.DB_NAME || 'sidirok_db',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || '',
      max: 20, // Maximum number of clients in the pool
      idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
      connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
    };

// Create connection pool
const pool = new Pool(dbConfig);

// Pool error handling
pool.on('error', (err) => {
  console.error('❌ Unexpected error on idle PostgreSQL client:', err);
  process.exit(-1);
});

// Pool connection event
pool.on('connect', () => {
  if (process.env.NODE_ENV === 'development') {
    console.log('✅ New client connected to PostgreSQL');
  }
});

/**
 * Initialize database connection
 * Tests the connection and logs the result
 */
export const initDatabase = async () => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    console.log('✅ Database connected successfully at:', result.rows[0].now);
    client.release();
    return true;
  } catch (error) {
    console.error('❌ Database connection error:', error.message);
    throw error;
  }
};

/**
 * Database wrapper providing consistent API
 * Compatible with the existing controller patterns
 */
const db = {
  /**
   * Execute a query with parameters
   * @param {string} text - SQL query with $1, $2, etc. placeholders
   * @param {Array} params - Query parameters
   * @returns {Promise<Object>} - Query result
   */
  async query(text, params = []) {
    const start = Date.now();
    try {
      const result = await pool.query(text, params);
      const duration = Date.now() - start;
      
      if (process.env.NODE_ENV === 'development' && process.env.LOG_QUERIES === 'true') {
        console.log('📝 Query executed:', { text: text.substring(0, 50) + '...', duration: `${duration}ms`, rows: result.rowCount });
      }
      
      return result;
    } catch (error) {
      console.error('❌ Query error:', error.message);
      throw error;
    }
  },

  /**
   * Get a single row
   * @param {string} text - SQL query
   * @param {Array} params - Query parameters
   * @returns {Promise<Object|undefined>} - Single row or undefined
   */
  async getOne(text, params = []) {
    const result = await this.query(text, params);
    return result.rows[0];
  },

  /**
   * Get all rows
   * @param {string} text - SQL query
   * @param {Array} params - Query parameters
   * @returns {Promise<Array>} - Array of rows
   */
  async getAll(text, params = []) {
    const result = await this.query(text, params);
    return result.rows;
  },

  /**
   * Execute a query and return affected row count
   * @param {string} text - SQL query
   * @param {Array} params - Query parameters
   * @returns {Promise<number>} - Number of affected rows
   */
  async run(text, params = []) {
    const result = await this.query(text, params);
    return result.rowCount;
  },

  /**
   * Execute multiple queries in a transaction
   * @param {Function} callback - Async function that receives a client
   * @returns {Promise<any>} - Result of the callback
   */
  async transaction(callback) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  /**
   * Get the connection pool
   * @returns {Pool} - PostgreSQL connection pool
   */
  getPool() {
    return pool;
  },

  /**
   * Close all connections
   */
  async close() {
    await pool.end();
    console.log('✅ Database pool closed');
  },

  /**
   * Check if database is ready
   * @returns {Promise<boolean>}
   */
  async isReady() {
    try {
      await pool.query('SELECT 1');
      return true;
    } catch {
      return false;
    }
  }
};

export default db;
