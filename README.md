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
- **Installable & offline** — PWA with manifest + service worker; works without
  internet once loaded. Scan history is stored locally.

## Run it

No build step and no dependencies — plain HTML/CSS/JS. Two ways to open it:

**Option 1 — double-click (easiest):** open `public/index.html` directly in any
browser. Everything works (AI scan, lessons, library); only the "install app"
prompt and offline caching need a server/HTTPS.

**Option 2 — local server (full PWA):**

```bash
node server.js        # serves http://localhost:8080
```

Any static file server works too. Open `http://localhost:8080` on your phone
(same Wi-Fi, use your PC's LAN IP) and choose **"Add to Home screen"** in the
browser menu to install it like a native app.

## Install on a phone

1. Serve the folder over your network (e.g. `node server.js`, then open
   `http://<your-pc-ip>:8080`).
2. Android Chrome: menu → *Add to Home screen* / *Install app*.
3. iPhone Safari: Share → *Add to Home Screen*.

For production hosting, serve over HTTPS (required for install prompts and the
service worker on mobile).

## Project layout

```
server.js              zero-dependency static server (Node)
public/
  index.html           app shell + PWA wiring
  styles.css           mobile-first UI
  manifest.webmanifest PWA manifest
  sw.js                offline service worker
  js/
    app.js             router, state, navigation
    i18n.js            Kinyarwanda / English strings
    engine/detector.js pixel-analysis AI + diagnosis ranking
    data/diseases.js   Rwanda crop disease knowledge base
    data/crops.js      cultivation guides
    data/fertilizers.js fertilizer & soil guide
    data/lessons.js    agro-learning lessons
    screens/           home, scan, learn, library, fertilizer, settings
```

## Notes

- The detection engine runs fully on-device (color-pattern analysis + knowledge-base
  matching). It is designed so a trained vision model or cloud vision API can be
  swapped in later behind the same `diagnose()` interface.
- AI output is guidance only; the app always advises contacting the sector
  agronomist / RAB for serious or notifiable outbreaks.
