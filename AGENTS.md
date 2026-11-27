# Repository notes (Base44 sandbox)

This repository now holds **two apps**:

| App | Location | Port | Stack |
| --- | --- | --- | --- |
| AgroSmart Rwanda (original) | `public/` + `server/` | 8080 | Express + PostgreSQL + OpenAI |
| **Hindura** — mobile number portability | `portability/` | **3000** (preview entry) | Express + PostgreSQL + vanilla-JS PWA |

`docker-compose.base44.yml` runs **Hindura only**; it is the app shown in the
Base44 preview. AgroSmart is untouched and still runs with `cd server && npm start`.

## Run / restart

```bash
docker compose -f docker-compose.base44.yml up -d --build
docker compose -f docker-compose.base44.yml ps
curl -s http://localhost:3000/api/health
```

- `db` is `postgres:16-alpine`; the schema is applied once by the `migrate`
  service, then `app` runs `node --watch src/index.js` from the bind-mounted
  source (live reload, no image rebuild).
- Frontend files under `portability/public/` are static; the server watches that
  directory and pushes a reload over SSE (`/__reload`). The PWA service worker
  is only registered when `BASE44_PREVIEW_MODE` is not `1`.

## Environment quirks

- The app connects with **`PGHOST` / `PGUSER` / `PGPASSWORD` / `PGDATABASE`**,
  deliberately **not** `DATABASE_URL`: the platform secret `DATABASE_URL` points
  at the AgroSmart Neon database and must not be used here.
- `/run/base44/app.env` is listed last in `env_file:` so dashboard secrets
  override `.env.base44-defaults`. Staff login defaults:
  `admin@hindura.rw` / `Hindura2026!` (override with `MNP_ADMIN_EMAIL` /
  `MNP_ADMIN_PASSWORD` before production).

## Business rules (server-enforced)

- Numbers: `078`/`079` → MTN, `072`/`073` → Airtel. `250…`, `+250…`, `07…`
  and `7…` inputs are normalised to `07XXXXXXXX`.
- One active request per number; a number ported within `MNP_LOCK_DAYS`
  (default 90) cannot be ported again.
- Status flow: `submitted → review → approved → completed`, or `rejected`
  (reason required). Approval schedules the next working day.
- Every change writes a `port_events` row, which powers the public timeline.

## Verify a change

1. `curl -s http://localhost:3000/api/health` → `{"ok":true}`
2. Submit a request in the UI (any valid number, e.g. `0781234567`, 16-digit
   national ID) and copy the `MNP-XXXXXX` reference.
3. Track it at `#/track/<ref>`; approve it in `#/admin` and confirm the status
   and timeline change.
4. Delete test rows when done:
   `docker compose -f docker-compose.base44.yml exec -T db psql -U hindura -d hindura -c "DELETE FROM port_requests WHERE msisdn='0781234567'"`

There is no automated test suite in this repo; syntax-check server files with
`docker compose -f docker-compose.base44.yml exec -T app node --check src/index.js`.
