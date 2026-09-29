// Standalone migration runner: `npm run migrate`
const { migrate, pool } = require('./db')

migrate()
  .then(() => { console.log('✔ schema applied'); return pool.end() })
  .catch(err => { console.error('migration failed:', err.message); process.exit(1) })
