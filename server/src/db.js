const mysql = require('mysql2/promise')
const fs = require('fs')
const path = require('path')
const config = require('./config')

const pool = mysql.createPool({
  host: config.db.host,
  port: config.db.port,
  user: config.db.user,
  password: config.db.password,
  database: config.db.database,
  waitForConnections: true,
  connectionLimit: 10,
  charset: 'utf8mb4_unicode_ci',
  namedPlaceholders: false
})

async function migrate() {
  const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8')
  const conn = await pool.getConnection()
  try {
    // schema.sql is a list of CREATE TABLE statements separated by ';'
    const statements = sql
      .split(/;\s*[\r\n]+/)
      .map(s => s.trim())
      .filter(s => s.length && !s.startsWith('--'))
    for (const stmt of statements) {
      await conn.query(stmt)
    }
  } finally {
    conn.release()
  }
}

// Small helpers -------------------------------------------------------------
const query = (sql, params) => pool.query(sql, params).then(r => r[0])

// JSON columns come back already parsed by mysql2, but be defensive.
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
