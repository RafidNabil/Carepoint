# Clinic & Doctors Appointment Management App

Full-stack doctor appointment and clinic management system built with Express.js, Prisma ORM, PostgreSQL, React, Vite, and Tailwind CSS.

---

## Quick Start with Docker (Recommended)

Anyone can clone this repository and run the full stack (Frontend, Backend, and PostgreSQL database pre-seeded with sample data) using Docker Compose.

### Prerequisites
- [Docker](https://docs.docker.com/get-docker/) & Docker Compose (v2+)

### Run the Application

1. **Clone the repository:**
   ```bash
   git clone <repo-url>
   cd doctors-appointment-app
   ```

2. **Start the containers:**
   ```bash
   docker compose up --build
   ```

3. **Access the application:**
   - **Frontend UI:** [http://localhost:5173](http://localhost:5173)
   - **Backend API:** [http://localhost:5000/api](http://localhost:5000/api)
   - **API Health Check:** [http://localhost:5000/api/health](http://localhost:5000/api/health)
   - **Local PostgreSQL:** `localhost:5432` (`user: postgres`, `password: postgres`, `database: doctors_appointment`)

---

## Seeded Demo Credentials

The local database is automatically initialized and seeded from `backend/sql` with sample accounts:

| Role | Email | Password |
| :--- | :--- | :--- |
| **Admin** | `james.anderson@example.com` | `Admin@12345` |
| **Doctor** | `alexander.reed@example.com` | `Doctor@12345` |
| **Doctor** | `victoria.hayes@example.com` | `Doctor@12345` |
| **Patient** | `olivia.bennett@example.com` | `Patient@12345` |
| **Patient** | `ethan.carter@example.com` | `Patient@12345` |

---

## Docker Services Architecture

The `docker-compose.yml` configures three connected services:

1. **`postgres` (PostgreSQL 16)**
   - Runs a local PostgreSQL container (replaces remote Supabase database).
   - Auto-initializes schema and indexes.
   - Auto-seeds initial data from `backend/sql` via `/docker-entrypoint-initdb.d`.
   - Data persists in a Docker named volume (`postgres_data`).

2. **`backend` (Node.js Express API & Prisma)**
   - Connects to the local PostgreSQL service (`postgres:5432`).
   - Automatically waits for Postgres to be healthy before starting.
   - Generates the Prisma client and serves the REST API on port `5000`.

3. **`frontend` (React + Vite + Nginx)**
   - Multi-stage build producing production assets served via Nginx.
   - Reverse-proxies `/api/` requests to the `backend` container.
   - Serves the Single-Page Application on port `5173`.

---

## Useful Docker Commands

- **Stop containers:**
  ```bash
  docker compose down
  ```

- **Stop and reset database volume (clean state):**
  ```bash
  docker compose down -v
  ```

- **Rebuild and restart:**
  ```bash
  docker compose up --build
  ```

- **Run SQL seeding script manually (inside backend):**
  ```bash
  docker compose exec backend npm run prisma:seed-sql
  ```

---

## Running Locally Without Docker (Optional)

If running directly on your host machine:

### Backend
```bash
cd backend
npm install
npm run prisma:generate
# Configure .env with your local or Supabase DATABASE_URL
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```