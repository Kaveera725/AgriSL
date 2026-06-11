require('dotenv').config();
const mysql = require('mysql2');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'agrisl',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Export promise-based pool for async/await usage
module.exports = pool.promise();
