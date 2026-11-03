# AGENTS.md — Spendwell

React expense portal (Vite + Firebase). Scope: **auth + Expense management only**.

**Stack:** React 19, Vite, Firebase Auth/Firestore, Ant Design + React Bootstrap, dayjs, Recharts, Tailwind CSS v4.

## Product

- Login with Firebase email/password
- Expense home: Summary, Transactions, Cash in hand
- Roles with access: `admin`, `super_admin`, `expense_manager`, `expense`
- Date filters use the ported `expenseRange` helpers
- Do not invent stage dates or expand into Sales Portal hiring modules

## Design

- Taste direction: **Charcoal & Lime** ([DESIGN.md](DESIGN.md))
- Brand: Charcoal `#171717`, Lime `#B8F34B`, Warm Off-White `#F5F5F0`
- Shell: charcoal sidebar for expense views + off-white content
- Views are pages (`SummaryPage`, `TransactionPage`, `CashInHandPage`), not tabs
- Brand mark: animated growth-bars `SiteLogo`
- Tokens: `src/index.css` + `src/theme/colors.js`; avoid scattering new hex values

## Hard constraints

- Do not commit/push unless asked
- Do not paste secrets from `.env`
- Prefer small focused diffs
