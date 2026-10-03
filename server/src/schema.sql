-- AgroSmart Rwanda — PostgreSQL schema
-- Create the database with UTF8 encoding so Kinyarwanda text and emoji store correctly:
--   CREATE DATABASE agrosmart ENCODING 'UTF8';

-- Users authenticate with email + password, or "Sign in with Google".
-- email / google_id are the primary identities; national_id / phone are optional
-- profile fields (phone still powers the OTP reset). password_hash is null for
-- Google-only accounts.
CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  email         VARCHAR(255),
  google_id     VARCHAR(64),
  national_id   VARCHAR(32)  UNIQUE,
  phone         VARCHAR(20),
  password_hash VARCHAR(255),
  name          VARCHAR(120) NOT NULL DEFAULT '',
  avatar        TEXT         NOT NULL DEFAULT '',
  auth_provider VARCHAR(16)  NOT NULL DEFAULT 'password' CHECK (auth_provider IN ('password','google')),
  role          VARCHAR(10)  NOT NULL DEFAULT 'user' CHECK (role IN ('user','admin')),
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Idempotent migration for databases created before email/Google auth.
ALTER TABLE users ADD COLUMN IF NOT EXISTS email         VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id     VARCHAR(64);
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar        TEXT NOT NULL DEFAULT '';
ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_provider VARCHAR(16) NOT NULL DEFAULT 'password';
ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;
ALTER TABLE users ALTER COLUMN national_id   DROP NOT NULL;
ALTER TABLE users ALTER COLUMN phone         DROP NOT NULL;
-- Unique per-identity indexes (multiple NULLs allowed, so partial profiles are fine).
CREATE UNIQUE INDEX IF NOT EXISTS uq_users_email  ON users (email);
CREATE UNIQUE INDEX IF NOT EXISTS uq_users_google ON users (google_id);

CREATE TABLE IF NOT EXISTS products (
  id      VARCHAR(64) PRIMARY KEY,
  cat     VARCHAR(32)  NOT NULL DEFAULT 'seeds',
  en      VARCHAR(160) NOT NULL DEFAULT '',
  rw      VARCHAR(160) NOT NULL DEFAULT '',
  price   INT          NOT NULL DEFAULT 0,
  unit_en VARCHAR(64)  NOT NULL DEFAULT 'piece',
  unit_rw VARCHAR(64)  NOT NULL DEFAULT 'igikoresho 1',
  emoji   VARCHAR(16)  NOT NULL DEFAULT '',
  img     TEXT,
  hidden  BOOLEAN      NOT NULL DEFAULT FALSE,
  sort    INT          NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS categories (
  id     VARCHAR(32) PRIMARY KEY,
  en     VARCHAR(80) NOT NULL DEFAULT '',
  rw     VARCHAR(80) NOT NULL DEFAULT '',
  emoji  VARCHAR(16) NOT NULL DEFAULT '',
  hidden BOOLEAN     NOT NULL DEFAULT FALSE,
  sort   INT         NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS carts (
  user_id    INT PRIMARY KEY,
  items      JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS orders (
  id         SERIAL PRIMARY KEY,
  user_id    INT,
  items      JSONB NOT NULL,
  total      INT NOT NULL DEFAULT 0,
  status     VARCHAR(20) NOT NULL DEFAULT 'received',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Paystack payment tracking for store orders. `reference` is OUR unique payment
-- reference (sent to Paystack and echoed back on the webhook + redirect return).
-- payment_status: unpaid -> paid (on a verified charge.success) or failed.
-- amount_paid is the whole-RWF integer Paystack confirmed (RWF is zero-decimal).
ALTER TABLE orders ADD COLUMN IF NOT EXISTS reference        VARCHAR(64);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status   VARCHAR(20) NOT NULL DEFAULT 'unpaid';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS paid_at          TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS gateway          VARCHAR(20);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS gateway_ref      VARCHAR(64);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS gateway_response VARCHAR(255);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS amount_paid      INT;
-- One live payment reference per order (NULLs allowed for legacy record-intent rows).
CREATE UNIQUE INDEX IF NOT EXISTS uq_orders_reference ON orders (reference) WHERE reference IS NOT NULL;


CREATE TABLE IF NOT EXISTS theme (
  id   VARCHAR(16) PRIMARY KEY,
  data JSONB NOT NULL
);

CREATE TABLE IF NOT EXISTS ai_qa (
  id   VARCHAR(64) PRIMARY KEY,
  q    TEXT, a TEXT,
  q_en TEXT, a_en TEXT
);

CREATE TABLE IF NOT EXISTS ai_glossary (
  id     VARCHAR(64) PRIMARY KEY,
  term   VARCHAR(120),
  def    TEXT,
  def_en TEXT
);

CREATE TABLE IF NOT EXISTS provider (
  id              VARCHAR(16) PRIMARY KEY,
  mode            VARCHAR(20) NOT NULL DEFAULT 'remote',
  model           VARCHAR(64) NOT NULL DEFAULT '',
  research_online BOOLEAN     NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS scans (
  id         SERIAL PRIMARY KEY,
  user_id    INT,
  crop       VARCHAR(32),
  disease    VARCHAR(64),
  confidence INT,
  meta       JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- One-time codes for the "Forgot password" SMS reset flow.
CREATE TABLE IF NOT EXISTS password_resets (
  id         SERIAL PRIMARY KEY,
  user_id    INT          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  phone      VARCHAR(20)  NOT NULL,
  code_hash  VARCHAR(255) NOT NULL,
  expires_at TIMESTAMPTZ  NOT NULL,
  attempts   INT          NOT NULL DEFAULT 0,
  consumed   BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Crop AI Doctor conversation memory (per farmer, chronological).
CREATE TABLE IF NOT EXISTS ai_messages (
  id         SERIAL PRIMARY KEY,
  user_id    INT          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role       VARCHAR(10)  NOT NULL CHECK (role IN ('user','assistant')),
  content    TEXT         NOT NULL,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- A Crop Health Case: one crop problem a farmer is managing over time. Lets the
-- Doctor continue an existing case, compare follow-ups and track outcomes.
CREATE TABLE IF NOT EXISTS crop_cases (
  id            SERIAL PRIMARY KEY,
  user_id       INT          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  crop          VARCHAR(32)  NOT NULL DEFAULT '',
  variety       VARCHAR(80)  NOT NULL DEFAULT '',
  district      VARCHAR(60)  NOT NULL DEFAULT '',
  sector        VARCHAR(60)  NOT NULL DEFAULT '',
  planting_date VARCHAR(40)  NOT NULL DEFAULT '',
  growth_stage  VARCHAR(40)  NOT NULL DEFAULT '',
  farm_size     VARCHAR(40)  NOT NULL DEFAULT '',
  symptoms      TEXT         NOT NULL DEFAULT '',
  suspected     VARCHAR(160) NOT NULL DEFAULT '',
  status        VARCHAR(16)  NOT NULL DEFAULT 'open'
                CHECK (status IN ('open','monitoring','resolved','closed')),
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Link each conversation turn to the Crop Health Case it belongs to (nullable:
-- general chat with no active case). Placed after crop_cases exists.
ALTER TABLE ai_messages ADD COLUMN IF NOT EXISTS case_id INT REFERENCES crop_cases(id) ON DELETE SET NULL;

-- Case Intelligence: emergency flag + latest computed recovery score (0-100).
ALTER TABLE crop_cases ADD COLUMN IF NOT EXISTS emergency BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE crop_cases ADD COLUMN IF NOT EXISTS emergency_reason VARCHAR(200) NOT NULL DEFAULT '';
ALTER TABLE crop_cases ADD COLUMN IF NOT EXISTS recovery_score INT;

-- Smart Treatment Planner: scheduled actions for a case.
CREATE TABLE IF NOT EXISTS case_tasks (
  id           SERIAL PRIMARY KEY,
  case_id      INT          NOT NULL REFERENCES crop_cases(id) ON DELETE CASCADE,
  user_id      INT          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind         VARCHAR(16)  NOT NULL DEFAULT 'treatment'
               CHECK (kind IN ('treatment','monitor','prevent','escalate')),
  title        VARCHAR(200) NOT NULL DEFAULT '',
  detail       TEXT         NOT NULL DEFAULT '',
  task_date    DATE,
  status       VARCHAR(12)  NOT NULL DEFAULT 'pending'
               CHECK (status IN ('pending','done','skipped')),
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Every report, photo finding, treatment, follow-up or outcome on a case.
CREATE TABLE IF NOT EXISTS case_observations (
  id            SERIAL PRIMARY KEY,
  case_id       INT          NOT NULL REFERENCES crop_cases(id) ON DELETE CASCADE,
  user_id       INT          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind          VARCHAR(16)  NOT NULL DEFAULT 'report'
                CHECK (kind IN ('report','followup','treatment','outcome','image')),
  note          TEXT         NOT NULL DEFAULT '',
  images        JSONB        NOT NULL DEFAULT '[]',
  status_change VARCHAR(16)  NOT NULL DEFAULT '',
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Research provenance: what evidence backed a recommendation, and how reliable.
CREATE TABLE IF NOT EXISTS research_records (
  id         SERIAL PRIMARY KEY,
  user_id    INT          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  case_id    INT          REFERENCES crop_cases(id) ON DELETE SET NULL,
  query      TEXT         NOT NULL DEFAULT '',
  crop       VARCHAR(32)  NOT NULL DEFAULT '',
  findings   TEXT         NOT NULL DEFAULT '',
  sources    JSONB        NOT NULL DEFAULT '[]',
  confidence VARCHAR(10)  NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Crop-protection product knowledge base (admin-seeded from verified labels /
-- RAB registration only — the AI must NEVER invent rows or field values here).
CREATE TABLE IF NOT EXISTS ai_products (
  id                VARCHAR(64) PRIMARY KEY,
  name              VARCHAR(160) NOT NULL DEFAULT '',
  name_en           VARCHAR(160) NOT NULL DEFAULT '',
  active_ingredient VARCHAR(160) NOT NULL DEFAULT '',
  type              VARCHAR(32)  NOT NULL DEFAULT '',
  target_crop       VARCHAR(64)  NOT NULL DEFAULT '',
  target_problem    VARCHAR(160) NOT NULL DEFAULT '',
  application       TEXT         NOT NULL DEFAULT '',
  dose              VARCHAR(120) NOT NULL DEFAULT '',
  phi               VARCHAR(40)  NOT NULL DEFAULT '',
  rei               VARCHAR(40)  NOT NULL DEFAULT '',
  resistance_group  VARCHAR(40)  NOT NULL DEFAULT '',
  registration      VARCHAR(120) NOT NULL DEFAULT '',
  safety            TEXT         NOT NULL DEFAULT '',
  source            VARCHAR(200) NOT NULL DEFAULT '',
  verified_at       TIMESTAMPTZ,
  created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Community Q&A: real farmer posts + replies (moderatable by admins).
CREATE TABLE IF NOT EXISTS community_posts (
  id         SERIAL PRIMARY KEY,
  user_id    INT          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  author     VARCHAR(120) NOT NULL DEFAULT '',
  district   VARCHAR(60)  NOT NULL DEFAULT '',
  title      VARCHAR(160) NOT NULL DEFAULT '',
  body       TEXT         NOT NULL DEFAULT '',
  crop       VARCHAR(32)  NOT NULL DEFAULT '',
  status     VARCHAR(12)  NOT NULL DEFAULT 'open'
             CHECK (status IN ('open','answered','closed')),
  hidden     BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS community_replies (
  id         SERIAL PRIMARY KEY,
  post_id    INT          NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  user_id    INT          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  author     VARCHAR(120) NOT NULL DEFAULT '',
  body       TEXT         NOT NULL DEFAULT '',
  helpful    INT          NOT NULL DEFAULT 0,
  hidden     BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Expert Human Assistance: recorded subscription intent (no live charging).
-- Plans: monthly = 10000 FRW, yearly = 100000 FRW, both auto-renewing.
CREATE TABLE IF NOT EXISTS subscriptions (
  id         SERIAL PRIMARY KEY,
  user_id    INT          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan       VARCHAR(16)  NOT NULL CHECK (plan IN ('monthly','yearly')),
  amount     INT          NOT NULL DEFAULT 0,
  currency   VARCHAR(8)   NOT NULL DEFAULT 'RWF',
  status     VARCHAR(16)  NOT NULL DEFAULT 'pending'
             CHECK (status IN ('pending','active','expired','cancelled')),
  phone      VARCHAR(20)  NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Indexes for the hot query paths (per-user orders/scans, catalog by category).
CREATE INDEX IF NOT EXISTS idx_orders_user_created ON orders (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_scans_user_created ON scans (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_created ON community_posts (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_replies_post ON community_replies (post_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_subs_user ON subscriptions (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_cat ON products (cat);
CREATE INDEX IF NOT EXISTS idx_pwreset_phone ON password_resets (phone, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_messages_user ON ai_messages (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cases_user ON crop_cases (user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_obs_case ON case_observations (case_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tasks_case ON case_tasks (case_id, task_date ASC, id ASC);
CREATE INDEX IF NOT EXISTS idx_research_user ON research_records (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_products_crop ON ai_products (target_crop);

-- Function + trigger: keep carts.updated_at current (Postgres has no ON UPDATE).
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_carts_updated_at ON carts;
CREATE TRIGGER trg_carts_updated_at
  BEFORE UPDATE ON carts
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_cases_updated_at ON crop_cases;
CREATE TRIGGER trg_cases_updated_at
  BEFORE UPDATE ON crop_cases
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

