const { Pool } = require('pg')
const fs = require('fs')
const path = require('path')
const config = require('./config')

const pool = new Pool(Object.assign({ max: 10 }, config.db))

// pg throws on an idle-connection error; surface it instead of crashing.
pool.on('error', err => console.error('Postgres pool error:', err.message))

async function migrate() {
  const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8')
  // schema.sql is a list of statements separated by ';' at end of line.
  const statements = sql
    .split(/;\s*[\r\n]+/)
    .map(s => s.trim())
    .filter(s => s.length && !s.startsWith('--'))
  for (const stmt of statements) {
    await pool.query(stmt)
  }
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
