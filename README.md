# Spendwell

Expense management for finance teams — auth plus a focused ledger for summaries, transactions, and cash in hand.

## Stack

- React 19 + Vite
- Firebase Auth + Firestore
- Ant Design + React Bootstrap
- Tailwind CSS v4, Recharts, dayjs, xlsx

## Features

- Email/password login (Firebase)
- Expense roles: `admin`, `super_admin`, `expense_manager`, `expense`
- Summary, Transactions, and Cash in hand views (`/`, `/transactions`, `/cash`)
- Date range filters, Excel import, CSV export
- Animated Spendwell growth-bars mark + Charcoal & Lime theme

## Setup

```bash
npm install
cp .env.example .env   # fill Firebase VITE_* keys
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

## Design

Direction: **Charcoal & Lime** — Charcoal `#171717`, Lime `#B8F34B`, Warm Off-White `#F5F5F0`. Geist + Geist Mono.

Full rules: [DESIGN.md](DESIGN.md).
