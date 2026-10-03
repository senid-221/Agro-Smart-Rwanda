# Deploy AgroSmart Rwanda (Render or Hostinger VPS)

This is the **real** production stack:

- **Node.js / Express** backend (`server/`) — serves the API *and* the static frontend.
- **Neon (serverless PostgreSQL)** database — users, products, categories, cart, orders, theme, AI training, scans, crop cases. Connect with a single `DATABASE_URL` (TLS on).
- **OpenAI (GPT)** — the API key lives **only** on the server (`.env`), proxied through `POST /api/ai/chat`. It is never shipped to the browser.
- **Auth** — email + password (bcrypt) **or** "Sign in with Google" (Google Identity Services). The server verifies the Google ID token and issues the same JWT. Roles: `user` / `admin`.
- **pm2** keeps the app running; **nginx** terminates TLS and reverse-proxies to Node.

The app is **online-only**: data, AI and admin all require internet. The service worker only caches the app shell for fast loads and never caches `/api/`.

---

## Render (fastest — Node + Neon, no VPS)

Render runs the Node backend **and** serves the static frontend same-origin, so
there is no CORS or `API_BASE` setup. A `render.yaml` blueprint is included at the
repo root.

1. **Neon**: create a project, copy the **pooled** connection string
   (`…-pooler.…neon.tech/…?sslmode=require`).
2. **Google (optional)**: in Google Cloud Console create an OAuth client of type
   *Web application*; add your Render URL (e.g. `https://agrosmart-rwanda.onrender.com`)
   to *Authorized JavaScript origins*. Copy the **Client ID**. Leave blank to run
   email + password only.
3. **Render** → *New → Blueprint* → connect the GitHub repo
   (`senid-221/Agro-Smart-Rwanda`). Render reads `render.yaml`.
4. Fill the `sync:false` env vars when prompted:
   - `DATABASE_URL` = the Neon pooled string
   - `JWT_SECRET` = output of `openssl rand -hex 32`
   - `GOOGLE_CLIENT_ID` = your Google OAuth web client ID (optional)
   - `OPENAI_API_KEY` = your key (optional; enables remote AI)
   - `TAVILY_API_KEY` = your key (optional; enables live Crop Doctor research)
   - `PAYSTACK_SECRET_KEY` + `PAYSTACK_PUBLIC_KEY` = your Paystack keys (optional; enables real mobile-money checkout — see "Mobile-money payments (Paystack)")
   - `ADMIN_EMAIL` + `ADMIN_PASSWORD` (≥ 8 chars) = the admin to auto-create on boot
5. **Deploy**. On boot the server runs `migrate`, seeds the catalog, and ensures
   the admin from `ADMIN_EMAIL`/`ADMIN_PASSWORD` — no shell needed.
6. Open the Render URL → `/api/health` returns `{"ok":true}` → log in with the
   admin email + password (or Google).

Build/start used by the blueprint (Root Directory = repo root):
`build: cd server && npm install` · `start: node server/src/index.js`.

> Free-tier services spin down after idle; the first request may take ~30s to wake.
> To update: `git push` — Render redeploys automatically. Bump `CACHE` in
> `public/sw.js` when you ship new client files.

The rest of this document covers the alternative **Hostinger VPS** deployment.

---

## Mobile-money payments (Paystack) — store orders

Checkout collects **real RWF** through Paystack (MTN MoMo / Airtel Money / card).
The secret key lives **only** on the server (`.env` / Render) — it is never shipped to
the app. An order is created as `pending`, the customer is redirected to Paystack's
secure hosted checkout, and the order flips to `received` / `paid` **only** after
Paystack confirms the charge (signed webhook, plus a client verify as a backup). If
`PAYSTACK_SECRET_KEY` is blank, checkout stays record-intent (no charge) — the app
never fakes a payment.

> **RWF is zero-decimal on Paystack**: the order total is sent as whole RWF
> (e.g. `10000`), *not* multiplied by 100.

**Turn it on:**

1. Create a Paystack account (dashboard.paystack.com) and complete business
   verification. Your account region must be **Rwanda** so RWF + MTN/Airtel MoMo
   channels are available.
2. Grab your keys — **Settings → Preferences & Webhooks / API Keys & Webhooks**:
   - Test: `sk_test_…` + `pk_test_…` (validate the flow first)
   - Live: `sk_live_…` + `pk_live_…` (real money)
3. Set them on the server (Render → your service → Environment, or `server/.env`):
   ```
   PAYSTACK_SECRET_KEY=sk_live_...        # or sk_test_... while validating
   PAYSTACK_PUBLIC_KEY=pk_live_...        # or pk_test_...
   PAYSTACK_CURRENCY=RWF
   PUBLIC_APP_URL=https://agro-smart-rwanda.onrender.com
   ```
4. Register the webhook in the **same mode's** Paystack dashboard
   (Settings → Preferences & Webhooks → Callback URL):
   ```
   https://agro-smart-rwanda.onrender.com/api/paystack/webhook
   ```
   Paystack signs each event with `x-paystack-signature` (HMAC-SHA512 of the raw
   body, using your secret key); the server verifies it and rejects anything else.
   No separate webhook secret is needed — the secret key is the signing key.
5. Redeploy / restart. `migrate` adds the payment columns to `orders` automatically.
6. **Validate with TEST keys first**: place a store order, complete the test charge,
   and confirm the order shows *received* and `payment_status = paid`. Then switch to
   LIVE keys.

> Keep test and live keys separate: a `sk_test_…` charge never moves real money, and
> the test webhook URL must be registered under the test dashboard (and live under live).

---

## 0. What you need

- A Hostinger **VPS** (KVM 1 or higher) with **Ubuntu 22.04**.
- A **domain** pointed at the VPS IP (an `A` record for `yourdomain.com` and `www`).
- A **Neon** project (neon.tech) — copy its **pooled connection string** (`DATABASE_URL`).
- A **Google OAuth client ID** (Google Cloud Console → APIs & Services → Credentials → *Create credentials → OAuth client ID → Web application*). Add `https://yourdomain.com` to **Authorized JavaScript origins**.
- An **OpenAI API key** (platform.openai.com → API keys).

In the Hostinger panel: create the VPS, note its **IP**, **root password**, and set the OS to Ubuntu 22.04. In **DNS / Nameservers**, add an `A` record for your domain → the VPS IP.

---

## 1. Connect and install the stack

```bash
ssh root@YOUR_VPS_IP

# System updates
apt update && apt upgrade -y

# Node.js 20 (NodeSource)
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# nginx, git, build tools, certbot
apt install -y nginx git build-essential certbot python3-certbot-nginx

# pm2 (process manager)
npm install -g pm2
```

Verify: `node -v` (v20.x), `nginx -v`, `pm2 -v`.

> No local PostgreSQL is required — the app connects to **Neon** over TLS. (You can
> still run a local Postgres for development by leaving `DATABASE_URL` blank and
> setting the discrete `DB_*` values.)

---

## 2. Prepare the Neon database

1. In the Neon console, create a project (or branch) and note the **pooled**
   connection string, e.g.
   `postgres://USER:PASSWORD@ep-xxxx-pooler.REGION.aws.neon.tech/DBNAME?sslmode=require`.
2. You do **not** need to create tables by hand — `npm run migrate` (step 4) runs
   `schema.sql` against Neon and is safe to re-run.

> Keep the connection string secret; it goes in `server/.env` only (never committed).

---

## 3. Get the code and configure secrets

```bash
cd /var/www
git clone https://github.com/senid-221/Agro-Smart-Rwanda.git agrosmart
cd agrosmart/server
npm install

cp .env.example .env
nano .env
```

Edit `.env` — **these values are the security-critical part**:

```
PORT=8080
NODE_ENV=production
STATIC_DIR=../public

# Neon (serverless Postgres) pooled connection string — TLS is enabled automatically.
DATABASE_URL=postgres://USER:PASSWORD@ep-xxxx-pooler.REGION.aws.neon.tech/DBNAME?sslmode=require

JWT_SECRET=<paste output of: openssl rand -hex 32>
JWT_EXPIRES=7d

# Google "Sign in with Google" (Web application OAuth client). Public value.
# Leave blank to hide the Google button and run email+password only.
GOOGLE_CLIENT_ID=xxxxxxxx.apps.googleusercontent.com

OPENAI_API_KEY=sk-...               # server-side only, never in the app
OPENAI_MODEL=gpt-4o-mini
OPENAI_VISION_MODEL=gpt-4o-mini     # Crop Doctor photo analysis (use a vision model)

# Optional live web research for the Crop Doctor (RAB/offline KB is always primary).
# Leave TAVILY_API_KEY blank to run knowledge-base-only.
TAVILY_API_KEY=
RESEARCH_MAX_RESULTS=5
```

Generate the JWT secret: `openssl rand -hex 32`.

> `.env` is git-ignored — it is never committed. The OpenAI key and `DATABASE_URL` stay here.
> `GOOGLE_CLIENT_ID` is a **public** value (it ships to the browser); it is read from `.env`
> so there is a single source of truth. No admin credentials live in `.env`; the admin is
> created explicitly in step 4.
> **Forgot-password:** the reset code is generated server-side and shown in the app
> (no SMS provider needed). It is phone-based, so it applies to accounts that have a phone
> on file. Tune the OTP policy with the `OTP_*` / `RESET_TOKEN_TTL_SEC` values if you wish.
> **Crop AI Doctor:** `OPENAI_VISION_MODEL` powers photo analysis; set `TAVILY_API_KEY`
> to enable ranked, cited live research (RAB/FAO/CABI/universities first). Without it the
> Doctor still answers from the grounded offline knowledge base — it never invents sources.

---

## 4. Create tables, seed data and the admin account

```bash
npm run migrate     # creates all tables, indexes, functions and triggers from schema.sql (on Neon)
npm run seed        # seeds catalog + theme + provider ONLY (never creates a user)

# Create the real administrator (email, password, optional name):
npm run create-admin -- <email> <strongPassword> "<full name>"
# e.g.  npm run create-admin -- admin@yourdomain.com MyStr0ngPass! "Jane Admin"
```

`npm run seed` is safe to re-run: catalog rows use `ON CONFLICT DO NOTHING`, so it
**never removes store products** and never touches users.

If a database was seeded by an older version that auto-created a demo admin, remove
it with:

```bash
npm run remove-demo              # deletes the built-in demo account(s) + their carts/scans/orders
npm run remove-demo -- <id> ...  # or target specific national IDs
```

`remove-demo` only deletes demo *accounts*; it never deletes catalog products.

---

## 5. Run with pm2

```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup systemd      # copy & run the command it prints, so the app survives reboots
pm2 logs agrosmart       # check: "database schema ready" + "backend on http://localhost:8080"
```

Quick local check on the VPS:
```bash
curl http://127.0.0.1:8080/api/health     # -> {"ok":true}
```

---

## 6. nginx + SSL

```bash
cp nginx.conf.example /etc/nginx/sites-available/agrosmart
nano /etc/nginx/sites-available/agrosmart      # set server_name to your domain
ln -s /etc/nginx/sites-available/agrosmart /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

# Free HTTPS certificate (auto-configures the 443 block + redirect)
certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

Your app is now live at `https://yourdomain.com`.

---

## 7. First login

1. Open `https://yourdomain.com`.
2. **Admin tab** → the email and password you passed to `npm run create-admin` in step 4.
3. **Sign up** with email + password, or tap **Sign in with Google**, to create a farmer account.

> For the Google button to appear, `GOOGLE_CLIENT_ID` must be set in `.env` **and**
> `https://yourdomain.com` must be listed in the OAuth client's **Authorized JavaScript
> origins** in Google Cloud Console. Google users are matched to an account by their
> Google ID / email; signing in with Google also creates the account on first use.

To turn on real GPT answers, the provider is seeded as `remote` when `OPENAI_API_KEY` is set. In the Admin → AI provider panel you can switch between **remote (OpenAI)** and **builtin (on-device rules)**.

---

## Updating after code changes

```bash
cd /var/www/agrosmart
git pull
cd server
npm install              # only if dependencies changed
npm run migrate          # safe to re-run; applies any new tables
pm2 restart agrosmart
```

Frontend files are served straight from `public/`; a `git pull` + hard refresh is enough for UI-only changes. Bump `CACHE` in `public/sw.js` when you ship new client files so installed PWAs pick them up.

---

## Backups

```bash
# Neon: dump over the pooled connection string (from server/.env)
pg_dump "$DATABASE_URL" > ~/agrosmart-$(date +%F).sql
```
Neon also keeps automatic history/branches — you can restore a point in time from the
console. To restore a manual dump:
```bash
psql "$DATABASE_URL" < ~/agrosmart-YYYY-MM-DD.sql
```

---

## Security checklist

- [ ] `JWT_SECRET` is a long random string (not the default).
- [ ] `DATABASE_URL` (Neon) uses the **pooled** string with `sslmode=require`; it is only in `server/.env`.
- [ ] The admin password passed to `create-admin` is strong.
- [ ] `GOOGLE_CLIENT_ID` matches an OAuth **Web application** client whose Authorized JavaScript origins include your domain.
- [ ] No demo accounts remain (`npm run remove-demo` if the DB was seeded by an older build).
- [ ] `OPENAI_API_KEY` only ever in `server/.env` (never committed, never in `public/`).
- [ ] HTTPS enforced by certbot; nginx is the only public port (Node stays on 127.0.0.1).
- [ ] `.env` and `node_modules/` are git-ignored.
