# StockFlow

A small multi-tenant inventory app. Each organization signs up, manages its own products, and sees
what is running low. Built with Next.js 14 (App Router), Prisma and SQLite.

## Quick start

Needs Node.js 20.19 or newer.

```bash
npm install
cp .env.example .env          # Windows: copy .env.example .env
# open .env and set JWT_SECRET to a long random string
npx prisma migrate dev --name init
npm run seed                  # optional: demo data
npm run dev
```

Open http://localhost:3000.

Demo login (after `npm run seed`): `demo@stockflow.dev` / `Demo12345!`
A second account, `other@stockflow.dev` (same password), has its own separate products.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the app in development |
| `npm run build` / `npm start` | Production build and server |
| `npm run seed` | Create demo organizations and products |
| `npm test` | Run the tests against a separate test database |

## Features

- **Auth:** sign up with email, password and organization name; log in and out. Passwords are hashed
  with bcrypt, and the session is a signed JWT in an httpOnly cookie.
- **Products:** create, edit, delete (with a confirm dialog), search by name or SKU, sort, filter to
  low stock only, and adjust stock quickly with +/- numbers.
- **Dashboard:** total products, total units on hand, and a low stock table.
- **Settings:** default low stock threshold for products that do not have their own.

## Design decisions

- **Tenant isolation.** The organization id comes only from the verified login token, never from the
  request. Every database query in `lib/inventory.js` filters by it, so another organization's product
  id simply returns 404. This is covered by tests.
- **Service layer.** API routes in `app/api` are thin. The rules live in `lib/inventory.js`,
  `lib/accounts.js`, `lib/validate.js` and `lib/stock.js`, which keeps them easy to read and test.
- **Low stock rule.** A product is low when `quantity <= threshold`. A product's own threshold wins;
  otherwise the organization default (5 until changed) is used. Quantity 0 shows as "Out of stock".
- **SKUs** are stored in upper case and are unique per organization, so `pen-1` and `PEN-1` are the same
  SKU. Two organizations can use the same SKU.
- **Atomic stock changes.** The +/- adjustment is a single database update with a `quantity >= 0`
  condition, so two simultaneous requests cannot push stock below zero.
- **Security basics.** Login fails with a generic message and similar timing for unknown emails.
  The app refuses to start without a `JWT_SECRET` of at least 16 characters, and the cookie is
  `secure` in production.

## Tests

`npm test` creates a throwaway database (`prisma/test.db`) and runs:

- rules and validation (low stock logic, input checks)
- tenant isolation (read, edit, adjust and delete across organizations, lists, dashboard, settings)
- SKU uniqueness, stock adjustments (including simultaneous ones), low stock thresholds, login and signup

## Project layout

```
prisma/schema.prisma     Organization, User, Product
prisma/seed.js           demo data
lib/inventory.js         product, dashboard and settings logic (tenant-scoped)
lib/accounts.js          signup and login
lib/validate.js          input checks
lib/stock.js             low stock rule
lib/auth.js, secret.js   JWT session handling
lib/route.js             wrapper for API routes (auth check, error handling)
app/api/...              REST routes
app/(app)/...            dashboard, products and settings pages
app/login, app/signup    auth pages
components/              Nav, ProductForm, ConfirmDialog, AuthSide
tests/                   node:test suites
```

## API

All routes except signup and login need the login cookie. Errors return `{ "error": "message" }`.

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/auth/signup`, `/api/auth/login`, `/api/auth/logout` | Auth |
| GET, POST | `/api/products` (`?q=` to search) | List, create |
| GET, PUT, PATCH, DELETE | `/api/products/:id` | Read, edit, adjust (`{ "delta": -3 }`), delete |
| GET | `/api/dashboard` | Totals and low stock list |
| GET, PUT | `/api/settings` | Default low stock threshold |

## Trade-offs and what I would do next

- SQLite keeps setup to one command. For deployment, switch the Prisma provider to PostgreSQL and run
  `npx prisma migrate deploy`; set `DATABASE_URL` and `JWT_SECRET` before building.
- One user per organization, as the brief specifies. Invites and roles would come next.
- Not included on purpose (out of scope): password reset, stock movement history, CSV import,
  rate limiting on login, and pagination for very large catalogs.
