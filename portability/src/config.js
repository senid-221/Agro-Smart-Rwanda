const path = require('path')

const root = path.join(__dirname, '..')

module.exports = {
  root,
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  // Sandbox preview: enables the dev live-reload stream and the PWA bypass.
  preview: process.env.BASE44_PREVIEW_MODE === '1',
  get liveReload() { return this.preview || this.nodeEnv !== 'production' },
  staticDir: path.resolve(root, 'public'),
  db: {
    // Local compose infrastructure. DATABASE_URL is deliberately NOT read here:
    // the app's own Postgres lives in docker-compose.base44.yml.
    host: process.env.PGHOST || '127.0.0.1',
    port: parseInt(process.env.PGPORT || '5432', 10),
    user: process.env.PGUSER || 'hindura',
    password: process.env.PGPASSWORD || '',
    database: process.env.PGDATABASE || 'hindura'
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'hindura-insecure-dev-secret',
    expires: process.env.JWT_EXPIRES || '12h'
  },
  // Staff account for the operator/regulator back office. The repo defaults
  // file supplies a development login; set MNP_ADMIN_EMAIL / MNP_ADMIN_PASSWORD
  // in the environment to replace it before production use.
  admin: {
    email: String(process.env.MNP_ADMIN_EMAIL || 'admin@hindura.rw').trim().toLowerCase(),
    password: process.env.MNP_ADMIN_PASSWORD || 'Hindura#2026',
    name: process.env.MNP_ADMIN_NAME || 'Hindura Admin'
  },
  rules: {
    // A number that was just ported cannot be ported again within this window.
    lockDays: parseInt(process.env.MNP_LOCK_DAYS || '90', 10)
  }
}
