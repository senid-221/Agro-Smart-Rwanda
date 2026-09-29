# Deploy AgroSmart Rwanda on a Hostinger VPS

This is the **real** production stack:

- **Node.js / Express** backend (`server/`) — serves the API *and* the static frontend.
- **MySQL** database — users, products, categories, cart, orders, theme, AI training, scans.
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

# MySQL server
apt install -y mysql-server
systemctl enable --now mysql

# nginx, git, build tools, certbot
apt install -y nginx git build-essential certbot python3-certbot-nginx

# pm2 (process manager)
npm install -g pm2
```

Verify: `node -v` (v20.x), `mysql --version`, `nginx -v`, `pm2 -v`.

---

## 2. Create the database and user

```bash
mysql -u root -p
```
```sql
CREATE DATABASE agrosmart CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'agrosmart'@'localhost' IDENTIFIED BY 'STRONG_DB_PASSWORD';
GRANT ALL PRIVILEGES ON agrosmart.* TO 'agrosmart'@'localhost';
FLUSH PRIVILEGES;
EXIT;
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
DB_USER=agrosmart
DB_PASSWORD=STRONG_DB_PASSWORD      # same as step 2
DB_NAME=agrosmart

JWT_SECRET=<paste output of: openssl rand -hex 32>
JWT_EXPIRES=7d

ADMIN_NATIONAL_ID=1199080000000000
ADMIN_PHONE=0788000000
ADMIN_PASSWORD=<a strong admin password>   # change after first login
ADMIN_NAME=Admin

OPENAI_API_KEY=sk-...               # server-side only, never in the app
OPENAI_MODEL=gpt-4o-mini
```

Generate the JWT secret: `openssl rand -hex 32`.

> `.env` is git-ignored — it is never committed. The OpenAI key stays here.

---

## 4. Create tables and seed data

```bash
npm run migrate     # creates all tables from schema.sql
npm run seed        # seeds catalog + theme + provider, creates the admin user
```

`npm run seed` is safe to re-run: catalog rows use `INSERT IGNORE` and an existing admin is left untouched.

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
2. **Admin tab** → national ID `1199080000000000`, phone `0788000000`, and the `ADMIN_PASSWORD` you set. (Change it after logging in.)
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
mysqldump -u agrosmart -p agrosmart > ~/agrosmart-$(date +%F).sql
```
Schedule with cron and copy off-server. Restore with:
```bash
mysql -u agrosmart -p agrosmart < ~/agrosmart-YYYY-MM-DD.sql
```

---

## Security checklist

- [ ] `JWT_SECRET` is a long random string (not the default).
- [ ] `DB_PASSWORD` and `ADMIN_PASSWORD` are strong; default admin password changed after first login.
- [ ] `OPENAI_API_KEY` only ever in `server/.env` (never committed, never in `public/`).
- [ ] HTTPS enforced by certbot; nginx is the only public port (Node stays on 127.0.0.1).
- [ ] MySQL bound to localhost (default) — not exposed to the internet.
- [ ] `.env` and `node_modules/` are git-ignored.
