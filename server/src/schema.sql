-- AgroSmart Rwanda — PostgreSQL schema
-- Create the database with UTF8 encoding so Kinyarwanda text and emoji store correctly:
--   CREATE DATABASE agrosmart ENCODING 'UTF8';

CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  national_id   VARCHAR(32)  NOT NULL UNIQUE,
  phone         VARCHAR(20)  NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name          VARCHAR(120) NOT NULL DEFAULT '',
  role          VARCHAR(10)  NOT NULL DEFAULT 'user' CHECK (role IN ('user','admin')),
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

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
