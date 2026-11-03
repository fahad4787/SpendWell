# Spendwell

Expense management for finance teams — auth plus a focused ledger for summaries, transactions, and cash in hand.

## Stack

- React 19 + Vite
- Firebase Auth + Firestore
- Ant Design + React Bootstrap
- Tailwind CSS v4, Recharts, dayjs, xlsx

## Features

- Email/password login (Firebase)
- One-time admin signup when no users exist (`/signup`)
- Expense roles: `admin`, `super_admin`, `expense_manager`, `expense`
- Summary, Transactions, and Cash in hand views (`/`, `/transactions`, `/cash`)
- Date range filters, Excel import, CSV export
- Animated Spendwell growth-bars mark + Charcoal & Lime theme

## Setup (local)

```bash
npm install
cp .env.example .env   # fill Firebase VITE_* keys (optional — defaults exist in src/firebase.js)
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

## Deploy on Hostinger

1. **Build**

   ```bash
   npm install
   npm run build
   ```

   Upload everything inside `dist/` to your domain’s `public_html` (or subdomain folder).  
   Keep `.htaccess` from `dist/` — it rewrites SPA routes to `index.html`.

2. **Firebase Console** (`spendwell-37dc4`)
   - Authentication → Sign-in method → enable **Email/Password**
   - Authentication → Settings → **Authorized domains** → add your Hostinger domain (e.g. `yourdomain.com`, `www.yourdomain.com`)
   - Firestore → Rules → publish the contents of `firestore.rules` (required for signup + app data)

3. **First visit**
   - Open the site → `/signup` creates the first admin (one time)
   - Later visits use `/login`

### Subfolder install

If the app lives at `https://domain.com/spendwell/` (not a subdomain root), set in `vite.config.js`:

```js
base: '/spendwell/',
```

and change `RewriteBase /` in `public/.htaccess` to `RewriteBase /spendwell/` before rebuilding.

## Design

Direction: **Charcoal & Lime** — Charcoal `#171717`, Lime `#B8F34B`, Warm Off-White `#F5F5F0`. Geist + Geist Mono.

Full rules: [DESIGN.md](DESIGN.md).
