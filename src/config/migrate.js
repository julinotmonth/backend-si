/**
 * Database Migration Script
 * Creates all tables for SI-DIROK using PostgreSQL
 */

import dotenv from 'dotenv';
import db, { initDatabase } from './database.js';

dotenv.config();

const runMigration = async () => {
  console.log('🚀 Starting PostgreSQL database migration...');
  
  try {
    // Initialize database connection
    await initDatabase();

    // Create ENUM types
    console.log('\n📋 Creating ENUM types...');
    
    await db.query(`
      DO $$ BEGIN
        CREATE TYPE user_role AS ENUM ('user', 'admin');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    
    await db.query(`
      DO $$ BEGIN
        CREATE TYPE gender_type AS ENUM ('male', 'female');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    
    await db.query(`
      DO $$ BEGIN
        CREATE TYPE severity_type AS ENUM ('critical', 'high', 'moderate', 'low');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    
    console.log('✅ ENUM types created');

    // Users table
    console.log('\n📋 Creating tables...');
    
    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(36) PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        username VARCHAR(100) NOT NULL,
        role user_role DEFAULT 'user',
        age INTEGER,
        gender gender_type,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Users table created');

    // Symptoms table
    await db.query(`
      CREATE TABLE IF NOT EXISTS symptoms (
        id VARCHAR(10) PRIMARY KEY,
        code VARCHAR(10) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        category VARCHAR(50) NOT NULL,
        mb DECIMAL(4,3) DEFAULT 0.5,
        md DECIMAL(4,3) DEFAULT 0.1,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Symptoms table created');

    // Diseases table
    await db.query(`
      CREATE TABLE IF NOT EXISTS diseases (
        id VARCHAR(10) PRIMARY KEY,
        code VARCHAR(10) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        probability DECIMAL(4,3) DEFAULT 0.5,
        severity severity_type DEFAULT 'moderate',
        prevention JSONB,
        treatment JSONB,
        statistics JSONB,
        image VARCHAR(255),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Diseases table created');

    // Disease Symptoms (many-to-many relationship)
    await db.query(`
      CREATE TABLE IF NOT EXISTS disease_symptoms (
        id SERIAL PRIMARY KEY,
        disease_id VARCHAR(10) NOT NULL REFERENCES diseases(id) ON DELETE CASCADE,
        symptom_id VARCHAR(10) NOT NULL REFERENCES symptoms(id) ON DELETE CASCADE,
        is_main_symptom BOOLEAN DEFAULT false,
        UNIQUE(disease_id, symptom_id)
      )
    `);
    console.log('✅ Disease Symptoms table created');

    // Rules table (for Certainty Factor calculation)
    await db.query(`
      CREATE TABLE IF NOT EXISTS rules (
        id VARCHAR(10) PRIMARY KEY,
        symptom_id VARCHAR(10) NOT NULL REFERENCES symptoms(id) ON DELETE CASCADE,
        disease_id VARCHAR(10) NOT NULL REFERENCES diseases(id) ON DELETE CASCADE,
        mb DECIMAL(4,3) NOT NULL,
        md DECIMAL(4,3) NOT NULL,
        weight DECIMAL(4,3) DEFAULT 1.0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(symptom_id, disease_id)
      )
    `);
    console.log('✅ Rules table created');

    // Diagnoses table (consultation history)
    await db.query(`
      CREATE TABLE IF NOT EXISTS diagnoses (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        user_data JSONB NOT NULL,
        selected_symptoms JSONB NOT NULL,
        results JSONB NOT NULL,
        summary JSONB NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Diagnoses table created');

    // Education content table
    await db.query(`
      CREATE TABLE IF NOT EXISTS education (
        id VARCHAR(36) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        slug VARCHAR(255) UNIQUE NOT NULL,
        category VARCHAR(100) NOT NULL,
        excerpt TEXT,
        content TEXT NOT NULL,
        image VARCHAR(255),
        author VARCHAR(100),
        read_time INTEGER DEFAULT 5,
        views INTEGER DEFAULT 0,
        is_featured BOOLEAN DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Education table created');

    // Contact messages table
    await db.query(`
      CREATE TABLE IF NOT EXISTS contact_messages (
        id VARCHAR(36) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(255) NOT NULL,
        subject VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        is_read BOOLEAN DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Contact Messages table created');

    // Create indexes
    console.log('\n📋 Creating indexes...');
    
    await db.query(`CREATE INDEX IF NOT EXISTS idx_symptoms_category ON symptoms(category)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_symptoms_code ON symptoms(code)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_diseases_code ON diseases(code)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_diseases_severity ON diseases(severity)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_rules_symptom ON rules(symptom_id)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_rules_disease ON rules(disease_id)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_diagnoses_user ON diagnoses(user_id)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_diagnoses_created ON diagnoses(created_at)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_education_category ON education(category)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_education_slug ON education(slug)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`);
    
    console.log('✅ Indexes created');

    // Create updated_at trigger function
    console.log('\n📋 Creating trigger functions...');
    
    await db.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);

    // Create triggers for updated_at
    const tablesWithUpdatedAt = ['users', 'symptoms', 'diseases', 'rules', 'education'];
    
    for (const table of tablesWithUpdatedAt) {
      await db.query(`
        DROP TRIGGER IF EXISTS update_${table}_updated_at ON ${table};
        CREATE TRIGGER update_${table}_updated_at
          BEFORE UPDATE ON ${table}
          FOR EACH ROW
          EXECUTE FUNCTION update_updated_at_column();
      `);
    }
    
    console.log('✅ Triggers created');

    console.log('\n🎉 Database migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration error:', error);
    throw error;
  } finally {
    await db.close();
    process.exit(0);
  }
};

runMigration().catch(err => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
