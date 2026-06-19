# Birr — private personal finance app

A free, offline, install-to-home-screen finance tracker. All data lives **only on your
device** (browser IndexedDB) — no server, no login, no subscriptions.

Built with React + Vite + TypeScript, Tailwind, Dexie (local storage), Recharts, and
vite-plugin-pwa (installable / offline).

## Run it on your computer

```bash
npm install
npm run dev
```

Open the printed address (e.g. `http://localhost:5173/my-finance-app/`).

## Put it online for free (GitHub Pages)

1. Create a GitHub repository named **`my-finance-app`** (the name matters — it must match
   the `base` in `vite.config.ts`. If you use a different name, change `APP_BASE`).
2. Push this folder to that repo's `main` branch.
3. On GitHub: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
4. The included workflow (`.github/workflows/deploy.yml`) builds and publishes automatically.
   After ~1 minute your app is live at:
   `https://<your-username>.github.io/my-finance-app/`

## Add it to your iPhone

1. Open the live link **in Safari**.
2. Tap **Share** → **Add to Home Screen** → **Add**.
3. Launch it from the new icon — full-screen, works offline.

## Living with it

- **Daily:** open → **Add** → amount → category → Save.
- **Weekly:** **More → Backup** to download a `.json` of all your data. **Restore** brings it
  back on a new device or after clearing your browser.
- **Insights:** **More → Export for Claude** copies a plain-text summary to paste into Claude.
