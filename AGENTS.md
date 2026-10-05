# Base44 Dev Environment

- Run everything with `docker compose -f docker-compose.base44.yml up -d` (project name `app`).
- **Single origin**: the Express server (`server/src/index.js`) serves both the API and the static frontend from `public/` on port 8080, mapped to host port 3000. There is no separate frontend dev server or build step — frontend edits are picked up on browser refresh; backend edits hot-reload via `node --watch`.
- The app **auto-migrates and seeds** on every boot (`migrate()`, `seedCatalog()`, `seedSingletons()`, `ensureAdminFromEnv()` in `start()`). There is no separate migration/seed step to run.
- Postgres is a compose service (`db`, user/db `agrosmart`, dev password `agrosmart_dev_pw`). Do not delete the `db_data` volume.
- Env layering: `.env.base44-defaults` (committed placeholders, incl. dev admin `admin@agrosmart.rw` / `AgroAdmin-2026`) → `/run/base44/app.env` (platform secrets, always wins). Local DB creds are inline in compose `environment:`. Never put user-supplied secrets under `environment:` in compose.
- External integrations (OpenAI, Tavily research, Paystack payments, Google sign-in) are **optional**: the app boots and works without them; features activate when their keys appear in `/run/base44/app.env`.
- Verify: `curl http://localhost:3000/api/health` → `{"ok":true}`; `POST /api/auth/login` with the dev admin returns a JWT; `GET /api/products` returns the seeded catalog.
- `server/` uses CommonJS despite `"type": "module"` in the root `package.json` (server has its own manifest without `type`); deps install happens in `server/` (`npm --prefix server install` equivalent — compose does it on container start).
