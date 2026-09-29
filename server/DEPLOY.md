# Deploy AgroSmart Rwanda on a Hostinger VPS

This is the **real** production stack:

- **Node.js / Express** backend (`server/`) — serves the API *and* the static frontend.
- **PostgreSQL** database — users, products, categories, cart, orders, theme, AI training, scans.
- **OpenAI (GPT)** — the API key lives **only** on the server (`.env`), proxied through `POST /api/ai/chat`. It is never shipped to the browser.
- **JWT auth** — real registration/login with bcrypt-hashed passwords and an `admin` role.
- **pm2** keeps the app running; **nginx** terminates TLS and reverse-proxies to Node.

The app is **online-only**: data, AI and admin all require internet. The service worker only caches the app shell for fast loads and never caches `/api/`.

---

## 0. What you need

- A Hostinger **VPS** (KVM 1 or higher) with **Ubuntu 22.04**.
- A **domain** pointed at the VPS IP (an `A` record for `yourdomain.com` and `www`).
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

# PostgreSQL server
apt install -y postgresql postgresql-contrib
systemctl enable --now postgresql

# nginx, git, build tools, certbot
apt install -y nginx git build-essential certbot python3-certbot-nginx

# pm2 (process manager)
npm install -g pm2
```

Verify: `node -v` (v20.x), `psql --version`, `nginx -v`, `pm2 -v`.

---

## 2. Create the database and user

```bash
sudo -u postgres psql
```
```sql
CREATE DATABASE agrosmart ENCODING 'UTF8';
CREATE USER agrosmart WITH PASSWORD 'STRONG_DB_PASSWORD';
GRANT ALL PRIVILEGES ON DATABASE agrosmart TO agrosmart;
\c agrosmart
GRANT ALL ON SCHEMA public TO agrosmart;
\q
```

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

DB_HOST=127.0.0.1
DB_PORT=5432
DB_USER=agrosmart
DB_PASSWORD=STRONG_DB_PASSWORD      # same as step 2
DB_NAME=agrosmart

JWT_SECRET=<paste output of: openssl rand -hex 32>
JWT_EXPIRES=7d

OPENAI_API_KEY=sk-...               # server-side only, never in the app
OPENAI_MODEL=gpt-4o-mini
```

Generate the JWT secret: `openssl rand -hex 32`.

> `.env` is git-ignored — it is never committed. The OpenAI key stays here.
> No admin credentials live in `.env`; the admin is created explicitly in step 4.

---

## 4. Create tables, seed data and the admin account

```bash
npm run migrate     # creates all tables, indexes, functions and triggers from schema.sql
npm run seed        # seeds catalog + theme + provider ONLY (never creates a user)

# Create the real administrator (national ID, phone, password, optional name):
npm run create-admin -- <nationalId> <phone> <strongPassword> "<full name>"
# e.g.  npm run create-admin -- 1200012345678901 0788123456 MyStr0ngPass! "Jane Admin"
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
2. **Admin tab** → the national ID, phone and password you passed to `npm run create-admin` in step 4.
3. **Sign up** to create a normal farmer account, or share the link with farmers.

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
pg_dump -U agrosmart -h 127.0.0.1 agrosmart > ~/agrosmart-$(date +%F).sql
```
Schedule with cron and copy off-server. Restore with:
```bash
psql -U agrosmart -h 127.0.0.1 agrosmart < ~/agrosmart-YYYY-MM-DD.sql
```

---

## Security checklist

- [ ] `JWT_SECRET` is a long random string (not the default).
- [ ] `DB_PASSWORD` is strong; the admin password passed to `create-admin` is strong.
- [ ] No demo accounts remain (`npm run remove-demo` if the DB was seeded by an older build).
- [ ] `OPENAI_API_KEY` only ever in `server/.env` (never committed, never in `public/`).
- [ ] HTTPS enforced by certbot; nginx is the only public port (Node stays on 127.0.0.1).
- [ ] PostgreSQL bound to localhost (`listen_addresses` default) — not exposed to the internet.
- [ ] `.env` and `node_modules/` are git-ignored.
