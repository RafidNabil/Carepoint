# Clinic appointment management frontend

React, TypeScript, Vite, Tailwind CSS v4, shadcn/ui, React Router, TanStack
Query, Axios, React Hook Form, and Zod frontend for the clinic API.

## Getting started

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env` and set `VITE_API_URL` to the backend API base
   URL (for example, `http://localhost:5000/api`). The clinic timezone defaults
   to `Asia/Dhaka` and currency to `BDT`.
3. Start the development server with `npm run dev`.
4. Run `npm run build` and `npm run lint` to validate the frontend.

The Vite development server proxies `/api` to `http://localhost:5000` when
`VITE_API_URL` is not set.

## API contract and supported functionality

See [API_INVENTORY.md](./API_INVENTORY.md) for the source-verified endpoint
inventory, payload/response shapes, authorization, business rules, and known
backend limitations. The frontend uses only the existing API; it does not
simulate unsupported behavior. The backend remains authoritative for access
control and all business rules.

Authentication uses the backend's HTTP-only refresh cookie and keeps the short
lived access token in memory only. Appointments use date-only values. Payments
follow the backend's cash-only workflow.
