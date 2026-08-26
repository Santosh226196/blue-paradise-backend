# Blue Paradise Backend

Express and MongoDB backend for the Blue Paradise Water Club React application. Every endpoint uses the frontend's existing `/api` path and returns MongoDB `_id` values as the frontend-compatible `id` field.

## Run locally

Requirements: Node.js 20+ and MongoDB 7+ (local MongoDB or MongoDB Atlas).

```bash
cp .env.example .env
npm install
npm run seed
npm run dev
```

The API starts at `http://localhost:5000/api`. Initial credentials come from `.env` and default locally to `admin` / `admin123`. Change the admin password and `JWT_SECRET` outside local development.

## Frontend connection

The frontend calls relative URLs such as `/api/customers`, so production should serve the frontend and API from the same origin or reverse-proxy `/api` to this service.

For Vite development, proxy `/api` to this server:

```ts
// vite.config.ts
server: { proxy: { "/api": "http://localhost:5000" } }
```

The inspected frontend also starts MSW in every development build (`src/main.tsx`). Disable that mock startup when testing this real backend; otherwise MSW intercepts the same routes before Vite can proxy them.

## API surface

| Area | Routes |
| --- | --- |
| Health | `GET /api/health` |
| Auth | `POST /api/auth/login`, `logout`, `change-password`, `forgot-password`, `verify-otp`, `reset-password` |
| Customers | CRUD `/api/customers`; `GET /:id/visits`, `/memberships`, `/coaching`, `/transactions` |
| Billing | `GET/POST /api/billing/transactions`, `GET /transactions/today`, `GET /transactions/:id`, `GET /dashboard-stats` |
| Reports | `GET /api/reports/revenue`, `GET /api/reports/transactions` |
| Settings | `GET/PUT /api/settings` |
| Membership plans | CRUD `/api/membership-plans` |
| Staff | CRUD `/api/staff` |
| Attendance | `GET /api/attendance/today`, `/active`, `/:date`; `POST /check-in`, `/:id/check-out` |
| Due payments | CRUD-style `/api/due-payments`, plus `GET /summary` and `POST /:id/pay` |
| Schedule | CRUD `/api/schedule` |
| Announcements | CRUD `/api/announcements`, plus `GET /active` |

Date-filtered billing uses `from` and `to`. Reports accept the frontend's `period=hourly|daily|monthly|yearly` values, plus optional custom `from`/`to` dates.

## Structure

```text
src/
  config/       environment and MongoDB connection
  controllers/  business logic
  middleware/   auth and error handling
  models/       Mongoose schemas
  routes/       `/api` route definitions
  utils/        shared helpers
  app.js        Express application
  server.js     database and HTTP startup
  seed.js       non-destructive demo seed
```

## Verification

```bash
npm run check
npm test
npm run test:unit
npm run test:integration
```

Integration tests use a disposable in-memory MongoDB on loopback port `27018`, never the database in `.env`. Set `TEST_MONGO_PORT` if that port is occupied.

Login and password-reset flows use secure HTTP-only same-origin cookies as well as the response token expected by the frontend. All business routes require authentication. The frontend's relative `/api` requests send the same-origin login cookie automatically, so no API-path or payload changes are required.
