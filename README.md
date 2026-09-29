# AgroSmart Rwanda 🌿

AI-powered mobile app (installable PWA) that helps farmers in Rwanda detect crop
diseases from a photo or short video, get the medicine/treatment to use, and learn
modern agriculture — with all content focused on Rwanda's crops, seasons and soils.

## Features

- **AI Crop Doctor** — upload a photo or short video of a sick plant, pick the crop,
  and the on-device AI analyzes leaf color patterns against a Rwanda disease database
  (22 diseases: Maize Lethal Necrosis, Kirabiranya/BXW, potato late blight, cassava
  mosaic, coffee leaf rust, …) and returns a diagnosis with confidence, severity,
  symptoms, chemical treatment, organic options and prevention.
- **Disease Library** — searchable, filterable by crop, bilingual.
- **Crop Growing Guides** — planting → fertilizing → harvesting for 12 Rwandan crops
  (maize, beans, banana, cassava, potato, tomato, rice, coffee, tea, sorghum,
  groundnuts, sweet potato) with local districts and RAB-recommended varieties.
- **Fertilizer Guide** — NPK 17-17-17, urea, CAN, manure, compost, lime: dosage,
  application and safety, plus Rwanda soil-conservation tips.
- **Learn Agriculture** — lessons on land prep, seed selection, IPM, post-harvest
  handling, irrigation, climate-smart farming, livestock and agri-business.
- **Kinyarwanda + English** — switchable anywhere, remembered on the device.
- **Installable PWA** — manifest + service worker; the app shell caches for fast
  loads. The production app is **online-only**: accounts, catalog, orders, AI and
  admin all come from the server database (see below).

## Production backend (real database, AI & admin)

The `server/` directory is the real production stack that replaces the old
on-device prototype:

- **Node.js / Express** API that also serves the static frontend.
- **MySQL** database — users, products, categories, cart, orders, theme, AI
  training (Q&A + glossary), provider config and scan history.
- **OpenAI (GPT)** — the API key is stored **only** on the server (`.env`) and
  proxied through `POST /api/ai/chat`; it is never shipped to the browser.
- **JWT authentication** — real sign-up/login with bcrypt-hashed passwords and
  an `admin` role gating the control panel.

Full step-by-step hosting guide (Hostinger VPS: Node + MySQL + pm2 + nginx +
SSL): see **[`server/DEPLOY.md`](server/DEPLOY.md)**.

```bash
cd server
npm install
cp .env.example .env      # set DB creds, JWT_SECRET, OPENAI_API_KEY, ADMIN_PASSWORD
npm run migrate           # create tables
npm run seed              # seed catalog + create the admin user
npm start                 # http://localhost:8080  (API + frontend)
```


## Run it

The full app needs the backend (database + auth + AI). Run it from `server/`:

```bash
cd server && npm install && npm start   # serves the API and the app on :8080
```

For **frontend-only** work (no database), a zero-dependency static server is
still included — note that login, store, orders and remote AI will not function
without the backend:

```bash
node server.js        # static-only preview at http://localhost:8080
```

Open `http://localhost:8080` on your phone (same Wi-Fi, use your PC's LAN IP)
and choose **"Add to Home screen"** in the browser menu to install it like a
native app.


## Install on a phone

1. Serve the folder over your network (e.g. `node server.js`, then open
   `http://<your-pc-ip>:8080`).
2. Android Chrome: menu → *Add to Home screen* / *Install app*.
3. iPhone Safari: Share → *Add to Home Screen*.

For production hosting, serve over HTTPS (required for install prompts and the
service worker on mobile).

## Project layout

```
server.js              zero-dependency static server (frontend-only preview)
server/                production backend (Express + MySQL + OpenAI proxy + JWT)
  src/index.js         app entry: serves /api and the static frontend
  src/routes/          auth, catalog, orders, ai, admin
  src/schema.sql       MySQL schema
  src/seed.js          catalog + admin seeding
  DEPLOY.md            Hostinger VPS deployment guide
  .env.example         required environment variables (copy to .env)
public/
  index.html           app shell + PWA wiring
  styles.css           mobile-first UI
  manifest.webmanifest PWA manifest
  sw.js                service worker (caches shell; never caches /api)
  js/
    app.js             router, state, navigation, auth session
    api.js             HTTP client for the backend (/api) + cache hydration
    i18n.js            Kinyarwanda / English strings
    engine/detector.js pixel-analysis AI + diagnosis ranking
    data/diseases.js   Rwanda crop disease knowledge base
    data/crops.js      cultivation guides
    data/fertilizers.js fertilizer & soil guide
    data/lessons.js    agro-learning lessons
    screens/           home, scan, learn, library, fertilizer, store, assistant, dashboards, settings
```

## Notes

- The detection engine runs fully on-device (color-pattern analysis + knowledge-base
  matching). It is designed so a trained vision model or cloud vision API can be
  swapped in later behind the same `diagnose()` interface.
- AI output is guidance only; the app always advises contacting the sector
  agronomist / RAB for serious or notifiable outbreaks.
