/**
 * Database Migration Down Script
 * Drops all tables for SI-DIROK (PostgreSQL)
 * WARNING: This will delete all data!
 */

import dotenv from 'dotenv';
import db, { initDatabase } from './database.js';

dotenv.config();

const runMigrationDown = async () => {
  console.log('⚠️  Starting database migration DOWN (dropping tables)...');
  console.log('⚠️  WARNING: This will delete all data!\n');
  
  try {
    await initDatabase();

    // Drop tables in reverse order (respecting foreign keys)
    const tables = [
      'contact_messages',
      'diagnoses',
      'education',
      'rules',
      'disease_symptoms',
      'diseases',
      'symptoms',
      'users'
    ];

    for (const table of tables) {
      await db.query(`DROP TABLE IF EXISTS ${table} CASCADE`);
      console.log(`✅ Dropped table: ${table}`);
    }

    // Drop ENUM types
    const enumTypes = ['severity_type', 'gender_type', 'user_role'];
    
    for (const enumType of enumTypes) {
      await db.query(`DROP TYPE IF EXISTS ${enumType} CASCADE`);
      console.log(`✅ Dropped type: ${enumType}`);
    }

    // Drop trigger function
    await db.query(`DROP FUNCTION IF EXISTS update_updated_at_column CASCADE`);
    console.log('✅ Dropped trigger function');

    console.log('\n🎉 All tables dropped successfully!');
    
  } catch (error) {
    console.error('❌ Migration down error:', error);
    throw error;
  } finally {
    await db.close();
    process.exit(0);
  }
};

runMigrationDown().catch(err => {
  console.error('❌ Migration down failed:', err);
  process.exit(1);
});
