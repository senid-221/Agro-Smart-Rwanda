const { Pool } = require('pg')
const fs = require('fs')
const path = require('path')
const config = require('./config')

// Neon (and other managed Postgres) require TLS and give a single connection
// string. Prefer it; otherwise fall back to the discrete DB_* host/port config.
const poolConfig = config.db.url
  ? { connectionString: config.db.url, ssl: { rejectUnauthorized: false } }
  : config.db

const pool = new Pool(Object.assign({ max: 10 }, poolConfig))

// pg throws on an idle-connection error; surface it instead of crashing.
pool.on('error', err => console.error('Postgres pool error:', err.message))

async function migrate() {
  const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8')
  // Run the whole file as one simple query so PL/pgSQL function bodies (which
  // contain ';' and $$ quoting) are handled by Postgres, not a naive splitter.
  // All statements are idempotent (IF NOT EXISTS / OR REPLACE / DROP IF EXISTS).
  await pool.query(sql)
}

// Small helpers -------------------------------------------------------------
// Resolves to the array of result rows (pg returns { rows, rowCount, ... }).
const query = (sql, params) => pool.query(sql, params).then(r => r.rows)

// JSONB columns are already parsed into JS objects by node-pg; be defensive.
function parseJson(value, fallback) {
  if (value == null) return fallback
  if (typeof value === 'object') return value
  try { return JSON.parse(value) } catch (e) { return fallback }
}

function rowToProduct(r) {
  return {
    id: r.id, cat: r.cat, en: r.en, rw: r.rw, price: r.price,
    unit: { en: r.unit_en, rw: r.unit_rw },
    emoji: r.emoji || '', img: r.img || '', hidden: !!r.hidden
  }
}

function rowToCategory(r) {
  return { id: r.id, en: r.en, rw: r.rw, emoji: r.emoji || '', hidden: !!r.hidden }
}

module.exports = { pool, migrate, query, parseJson, rowToProduct, rowToCategory }
