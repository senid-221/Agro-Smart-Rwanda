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
    // Neon (serverless Postgres) supplies a single pooled connection string.
    // When DATABASE_URL is set it wins over the discrete DB_* values below.
    url: process.env.DATABASE_URL || '',
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
  // Google Identity Services. The client ID is public (it ships to the browser);
  // the backend uses it as the expected `aud` when verifying a Google ID token.
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || ''
  },
  // Used only by `npm run create-admin`; no insecure demo defaults.
  seedAdmin: {
    email: process.env.ADMIN_EMAIL || '',
    nationalId: process.env.ADMIN_NATIONAL_ID || '',
    phone: process.env.ADMIN_PHONE || '',
    password: process.env.ADMIN_PASSWORD || '',
    name: process.env.ADMIN_NAME || 'Admin'
  },
  openai: {
    key: process.env.OPENAI_API_KEY || '',
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    // Vision-capable model for Crop Doctor photo analysis. Defaults to the chat
    // model; set explicitly (e.g. gpt-4o) if the chat model cannot see images.
    visionModel: process.env.OPENAI_VISION_MODEL || process.env.OPENAI_MODEL || 'gpt-4o-mini',
    baseUrl: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1'
  },
  // Web research for the Crop Doctor. Grounded RAB/offline KB is always primary;
  // a live search provider is used only when its key is configured. Tavily is the
  // default adapter (single JSON POST). Leave the key empty to run KB-only.
  research: {
    provider: process.env.RESEARCH_PROVIDER || 'tavily',
    apiKey: process.env.TAVILY_API_KEY || '',
    baseUrl: process.env.TAVILY_BASE_URL || 'https://api.tavily.com',
    maxResults: parseInt(process.env.RESEARCH_MAX_RESULTS || '5', 10),
    get enabled() { return !!this.apiKey }
  },
  // Password-reset OTP policy. Codes are generated server-side and shown in the app.
  reset: {
    otpTtlSec: parseInt(process.env.OTP_TTL_SEC || '600', 10),
    otpMaxAttempts: parseInt(process.env.OTP_MAX_ATTEMPTS || '5', 10),
    resendCooldownSec: parseInt(process.env.OTP_RESEND_COOLDOWN_SEC || '30', 10),
    tokenTtlSec: parseInt(process.env.RESET_TOKEN_TTL_SEC || '600', 10)
  }
}
