-- Hindura — mobile number portability (MNP) schema.
-- Run with `npm run migrate`; every statement is idempotent.

CREATE TABLE IF NOT EXISTS port_requests (
  id               SERIAL PRIMARY KEY,
  reference        VARCHAR(20)  NOT NULL UNIQUE,
  msisdn           VARCHAR(12)  NOT NULL,
  current_operator VARCHAR(16)  NOT NULL,
  new_operator     VARCHAR(16)  NOT NULL,
  national_id      VARCHAR(32)  NOT NULL,
  full_name        VARCHAR(140) NOT NULL,
  email            VARCHAR(160) NOT NULL DEFAULT '',
  port_mobile_money BOOLEAN     NOT NULL DEFAULT TRUE,
  status           VARCHAR(20)  NOT NULL DEFAULT 'submitted'
                   CHECK (status IN ('submitted','review','approved','rejected','completed')),
  reason           TEXT         NOT NULL DEFAULT '',
  scheduled_for    DATE,
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  completed_at     TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_port_requests_msisdn  ON port_requests (msisdn);
CREATE INDEX IF NOT EXISTS idx_port_requests_status  ON port_requests (status);
CREATE INDEX IF NOT EXISTS idx_port_requests_created ON port_requests (created_at DESC);

-- Audit trail shown as the tracking timeline.
CREATE TABLE IF NOT EXISTS port_events (
  id         SERIAL PRIMARY KEY,
  request_id INT         NOT NULL REFERENCES port_requests(id) ON DELETE CASCADE,
  status     VARCHAR(20) NOT NULL,
  note       TEXT        NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_port_events_request ON port_events (request_id, created_at);
