# Spendwell

Expense management for finance teams — auth plus a focused ledger for summaries, transactions, and cash in hand.

Cloned from the Sales Portal **Financial Management (Expense)** module, restyled as a standalone product.

## Stack

- React 19 + Vite
- Firebase Auth + Firestore
- Ant Design + React Bootstrap
- Recharts, dayjs, xlsx, Sass

## Features

- Email/password login (Firebase)
- Expense roles: `admin`, `super_admin`, `expense_manager`, `expense`
- Summary, Transactions, and Cash in hand tabs
- Date range filters, Excel import, CSV export
- Animated Spendwell mark + achromatic ledger theme

## Setup

```bash
cd "/Users/fahadnadeem/Documents/React/Spendwell"
npm install
cp .env.example .env   # fill Firebase VITE_* keys
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

## Design

Direction: **Achromatic ledger** (taste-skill) — ink chrome, blue-grey ground `#f2f4f7`, chart hue `#1d5fbf`, Geist + Geist Mono.
