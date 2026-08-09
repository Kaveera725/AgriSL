require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function migrate() {
  // Connect without selecting a database — init.sql creates and selects it.
  // multipleStatements allows running the whole schema file at once.
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    multipleStatements: true,
  });

  try {
    const sql = fs.readFileSync(path.join(__dirname, 'init.sql'), 'utf8');
    console.log('Running schema from init.sql...');
    await connection.query(sql);
    console.log('Schema created.');

    // Make sure subsequent queries target the right database.
    await connection.query(`USE \`${process.env.DB_NAME || 'agrisl'}\``);

    // Idempotent column additions for databases created before a schema change.
    // CREATE TABLE IF NOT EXISTS above leaves existing tables untouched, so new
    // columns must be added here. MySQL 8 has no "ADD COLUMN IF NOT EXISTS", so
    // each add is guarded by an information_schema check.
    const addColumnIfMissing = async (table, column, definition) => {
      const [[{ count }]] = await connection.query(
        `SELECT COUNT(*) AS count FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
        [table, column]
      );
      if (count === 0) {
        await connection.query(`ALTER TABLE \`${table}\` ADD COLUMN ${definition}`);
        console.log(`Added column ${table}.${column}`);
      }
    };

    // PlantNet plant-species identification stored on each disease report.
    await addColumnIfMissing(
      'disease_reports',
      'identified_species',
      'identified_species VARCHAR(255) AFTER image_path'
    );

    // Custom ML model output columns (TF.js MobileNetV2 / Python microservice).
    // Added alongside the two-stage disease detection feature (Stage 1 TF.js +
    // Stage 2 GPT-4o Vision). All three are nullable so legacy reports are unaffected.
    await addColumnIfMissing(
      'disease_reports',
      'ml_prediction',
      "`ml_prediction` VARCHAR(200) NULL COMMENT 'Disease class predicted by custom ML model' AFTER treatment_si"
    );
    await addColumnIfMissing(
      'disease_reports',
      'ml_confidence',
      "`ml_confidence` DECIMAL(5,2) NULL COMMENT 'ML model confidence score as percentage' AFTER ml_prediction"
    );
    await addColumnIfMissing(
      'disease_reports',
      'ml_class_index',
      "`ml_class_index` INT NULL COMMENT 'Numeric class index from ML model output' AFTER ml_confidence"
    );

    // Officer certification fields (added for the officer verification flow).
    await addColumnIfMissing(
      'users',
      'designation',
      'designation VARCHAR(150) NULL AFTER district'
    );
    await addColumnIfMissing(
      'users',
      'province',
      'province VARCHAR(100) NULL AFTER designation'
    );
    await addColumnIfMissing(
      'users',
      'cert_document_path',
      'cert_document_path VARCHAR(255) NULL AFTER province'
    );
    await addColumnIfMissing(
      'users',
      'rejection_reason',
      'rejection_reason TEXT NULL AFTER cert_document_path'
    );
    await addColumnIfMissing(
      'users',
      'deactivation_reason',
      'deactivation_reason TEXT NULL AFTER rejection_reason'
    );
    await addColumnIfMissing(
      'users',
      'is_active',
      'is_active TINYINT NOT NULL DEFAULT 1 AFTER is_approved'
    );
    await addColumnIfMissing(
      'users',
      'profile_picture',
      'profile_picture VARCHAR(255) NULL AFTER is_active'
    );

    // Seed users (idempotent — skip if the email already exists).
    const users = [
      { name: 'Admin', email: 'admin@agrisl.lk', password: 'admin123', role: 'admin', district: 'Colombo', is_approved: 1 },
      { name: 'Test Farmer', email: 'farmer@agrisl.lk', password: 'farmer123', role: 'farmer', district: 'Kandy', is_approved: 1 },
      { name: 'Test Officer', email: 'officer@agrisl.lk', password: 'officer123', role: 'officer', district: 'Galle', is_approved: 1 },
    ];

    for (const u of users) {
      const hash = await bcrypt.hash(u.password, 10);
      await connection.query(
        `INSERT INTO users (name, email, password_hash, role, district, is_approved)
         VALUES (?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE name = VALUES(name)`,
        [u.name, u.email, hash, u.role, u.district, u.is_approved]
      );
      console.log(`Seeded user: ${u.email} (${u.role})`);
    }

    console.log('\nMigration complete. Seed credentials:');
    console.log('  admin@agrisl.lk / admin123');
    console.log('  farmer@agrisl.lk / farmer123');
    console.log('  officer@agrisl.lk / officer123');
  } finally {
    await connection.end();
  }
}

migrate().catch((err) => {
  console.error('Migration failed:', err.code || '', err.message || err);
  if (err.code === 'ECONNREFUSED') {
    console.error(
      '\nCould not reach a MySQL server at ' +
        `${process.env.DB_HOST || 'localhost'}. ` +
        'Make sure MySQL is installed and running, then retry: npm run migrate'
    );
  }
  process.exit(1);
});
