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
