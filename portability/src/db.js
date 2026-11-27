const { Pool } = require('pg')
const fs = require('fs')
const path = require('path')
const config = require('./config')

const pool = new Pool(Object.assign({ max: 10 }, config.db))

pool.on('error', err => console.error('Postgres pool error:', err.message))

// Apply schema.sql as one simple query so multi-statement DDL is handled by
// Postgres itself. Every statement is idempotent (IF NOT EXISTS).
async function migrate() {
  const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8')
  await pool.query(sql)
}

// Resolves to the array of rows (pg returns { rows, rowCount, ... }).
const query = (sql, params) => pool.query(sql, params).then(r => r.rows)

module.exports = { pool, migrate, query }
