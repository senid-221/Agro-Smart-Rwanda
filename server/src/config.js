require('dotenv').config()
const path = require('path')

const root = path.join(__dirname, '..')

module.exports = {
  root,
  port: parseInt(process.env.PORT || '8080', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  staticDir: path.resolve(root, process.env.STATIC_DIR || '../public'),
  corsOrigin: process.env.CORS_ORIGIN || '',
  db: {
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USER || 'agrosmart',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'agrosmart',
    // Set DB_SSL=true on managed Postgres providers that require TLS.
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'insecure-dev-secret',
    expires: process.env.JWT_EXPIRES || '7d'
  },
  // Used only by `npm run create-admin`; no insecure demo defaults.
  seedAdmin: {
    nationalId: process.env.ADMIN_NATIONAL_ID || '',
    phone: process.env.ADMIN_PHONE || '',
    password: process.env.ADMIN_PASSWORD || '',
    name: process.env.ADMIN_NAME || 'Admin'
  },
  openai: {
    key: process.env.OPENAI_API_KEY || '',
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    baseUrl: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1'
  }
}
