# Carepoint - Clinic & Doctor Appointment Management System

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)](https://vite.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![TanStack Query](https://img.shields.io/badge/TanStack_Query-v5-FF4154?logo=reactquery&logoColor=white)](https://tanstack.com/query/latest)
[![Lucide](https://img.shields.io/badge/Lucide-Icons-F56565?logo=lucide&logoColor=white)](https://lucide.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-Backend-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-5.x-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![Prisma](https://img.shields.io/badge/Prisma-7.x-2D3748?logo=prisma&logoColor=white)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Cloud_DB-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com/)
[![JWT](https://img.shields.io/badge/JWT-Authentication-000000?logo=jsonwebtokens&logoColor=white)](https://jwt.io/)
[![Zod](https://img.shields.io/badge/Zod-Validation-3E67B1?logo=zod&logoColor=white)](https://zod.dev/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)
[![ESLint](https://img.shields.io/badge/ESLint-Linting-4B32C3?logo=eslint&logoColor=white)](https://eslint.org/)
[![Vercel](https://img.shields.io/badge/Vercel-Deploy-000000?logo=vercel&logoColor=white)](https://vercel.com/)

A comprehensive, full-stack clinic and doctor appointment management platform. Designed for clinics and multi-doctor practices, the application streamlines patient registration, slot booking, doctor availability scheduling, prescription generation, invoice billing, and granular administrative governance.

---

## Live Demo & Deployment

- **Frontend Application (Vercel):** [https://carepoint-frontend.vercel.app](https://doctors-appointment-app-frontend.vercel.app)
- **Backend API Service:** [https://carepoint-api.onrender.com/api](https://doctors-appointment-api.onrender.com/api)

### Demo Accounts

The database comes pre-seeded with test accounts across all roles:

| Role | Email | Password |
| :--- | :--- | :--- |
| **Admin** | `james.anderson@example.com` | `Admin@12345` |
| **Doctor** | `alexander.reed@example.com` | `Doctor@12345` |
| **Patient** | `olivia.bennett@example.com` | `Patient@12345` |

---

## Database Architecture: Supabase vs. Docker PostgreSQL

This project is built with dual database flexibility:

- **Cloud & Production (Supabase):** The primary production database runs on **Supabase PostgreSQL**. Prisma ORM connects to the Supabase instance using pooled connection strings for serverless and cloud deployments.
- **Local Containerized Environment (Docker PostgreSQL):** For zero-setup local testing and complete offline development, the `docker-compose.yml` environment provisions a self-hosted **PostgreSQL 16 Alpine** container. It automatically initializes the full relational schema  and populates sample seed records via `/docker-entrypoint-initdb.d`, requiring **no Supabase account or internet connection**.

---

## Key Features

### Patient Portal
- **Authentication:** Secure registration, JWT-based login, and session persistence with refresh tokens.
- **Profile Management:** Manage personal profile, contact information, and medical background.
- **Doctor Discovery:** Search and filter verified doctors by specialization, experience, and consultation fees.
- **Slot Scheduling:** View doctor real-time availability and select convenient appointment slots.
- **Appointment Tracking:** Monitor upcoming visits, view appointment history, and check booking statuses.
- **Prescriptions & Records:** Access digital prescriptions with medications, dosage, and duration.
- **Invoices & Billing:** View detailed billing statements, invoice status, and complete online/card payments.

### Doctor Portal
- **Dashboard & Scheduling:** Configure weekly working schedules, operating hours, and consultation rates.
- **Appointment Management:** Review incoming appointments, mark visits as completed, or flag no-shows.
- **Patient Records:** View patient details, visit histories, and consultation notes.
- **Prescription Authoring:** Issue structured prescriptions with medications, dosages, frequencies, and durations directly from appointment records.

### Admin Clinic Administration
- **Clinic Operations:** Manage clinic settings, business hours, and global booking rules (e.g., maximum bookings per slot).
- **Doctors & Patient Directory:** Manage doctors, patient accounts, status updates, and credentials.
- **Appointment Supervision:** Full oversight across all clinic schedules, statuses, cancellations, and reschedules.
- **Financial Controls:** Comprehensive billing oversight, payments reconciliation, invoices, and refunds.
- **Access Control (RBAC):** Manage system roles and granular permissions.
- **Audit Trails:** Automatic logging of critical actions, entity modifications (`oldValue` vs. `newValue`), and administrative operations.

---

## System Architecture & Workflows



### Appointment Booking & Consultation Lifecycle

```mermaid
sequenceDiagram
    autonumber
    actor Patient
    participant Frontend
    participant Backend as Backend API
    participant DB as PostgreSQL / Supabase
    actor Doctor

    Patient->>Frontend: Search Doctors & select slot
    Frontend->>Backend: POST /api/appointments (patientId, doctorId, date)
    Backend->>DB: Validate schedule & booking rules
    DB-->>Backend: Slot available
    Backend->>DB: Create APPOINTMENT (status: CONFIRMED)
    Backend-->>Frontend: Appointment confirmed

    Doctor->>Frontend: View scheduled appointments
    Frontend->>Backend: GET /api/appointments
    Backend->>DB: Query appointments for doctor
    DB-->>Backend: Appointment details
    Backend-->>Frontend: Display patient list

    Doctor->>Frontend: Complete visit & generate prescription
    Frontend->>Backend: POST /api/prescriptions (appointmentId, items[])
    Backend->>DB: Insert PRESCRIPTION & PRESCRIPTION_ITEM
    Backend->>DB: Create INVOICE (status: UNPAID)
    Backend->>DB: Update APPOINTMENT (status: COMPLETED)
    Backend->>DB: Log action in AUDIT_LOG
    Backend-->>Frontend: Consultation complete

    Patient->>Frontend: View invoice & submit payment
    Frontend->>Backend: POST /api/payments (invoiceId, amount, method)
    Backend->>DB: Record PAYMENT & mark INVOICE (status: PAID)
    Backend-->>Frontend: Payment confirmed & receipt generated
```

---

## Entity Relationship Diagram (ERD)

```mermaid
erDiagram
    USER {
        uuid id PK
        string email UK
        string passwordHash
        string role "PATIENT | DOCTOR | ADMIN"
        boolean isActive "true | false"
        datetime createdAt
        datetime updatedAt
    }

    PATIENT {
        uuid id PK
        uuid userId FK
        string firstName
        string lastName
        string phone
        date dateOfBirth 
        string gender
    }

    DOCTOR {
        uuid id PK
        uuid userId FK
        string firstName 
        string lastName 
        string phone 
        string specialization 
        string qualification 
        string experience 
        text bio 
        decimal consultationFee
    }

    ROLE {
        uuid id PK
        string name UK
    }

    PERMISSION {
        uuid id PK
        string name UK "e.g. MANAGE_APPOINTMENTS"
    }

    ROLE_PERMISSION {
        uuid roleId FK
        uuid permissionId FK
    }

    DOCTOR_SCHEDULE {
        uuid id PK
        uuid doctorId FK
        int dayOfWeek 
        time startTime 
        time endTime
    }

    APPOINTMENT {
        uuid id PK
        uuid patientId FK
        uuid doctorId FK
        date appointmentDate
        string status "CONFIRMED | COMPLETED | NO_SHOW | CANCELLED"
        string paymentStatus "PENDING | PAID"
        datetime createdAt
        datetime updatedAt
    }

    PRESCRIPTION {
        uuid id PK
        uuid appointmentId FK
    }

    PRESCRIPTION_ITEM {
        uuid id PK
        uuid prescriptionId FK
        string medication "e.g. Paracetamol 500mg"
        string dosage "e.g. 1 tablet"
        string frequency "e.g. 1+0+1"
        string duration "e.g. 5 days"
    }

    INVOICE {
        uuid id PK
        uuid appointmentId FK
        decimal amount
        decimal total
        string status "UNPAID | PAID"
        datetime issuedAt
    }

    PAYMENT {
        uuid id PK
        uuid invoiceId FK
        decimal amount
        string method "CASH | CARD | ONLINE"
        string status "PENDING | COMPLETED"
        string transactionId
        datetime paidAt
    }

    CLINIC_SETTING {
        uuid id PK
        string key UK "e.g. clinic_name"
        string value "e.g. City Care Clinic"
    }

    BOOKING_RULE {
        uuid id PK
        string key UK "e.g. max_appointments_per_period"
        string value "e.g. 300"
    }

    AUDIT_LOG {
        uuid id PK
        uuid userId FK
        string action "e.g. UPDATE_APPOINTMENT"
        string entityType "e.g. APPOINTMENT"
        uuid entityId
        json oldValue
        json newValue
        datetime createdAt
    }

    REFRESH_TOKEN {
        uuid id PK
        uuid userId FK
        string tokenHash
        datetime expiresAt
        datetime createdAt
        datetime revokedAt
    }

    USER ||--o| PATIENT : "has"
    USER ||--o| DOCTOR : "has"
    USER ||--o{ REFRESH_TOKEN : "has"

    ROLE ||--o{ ROLE_PERMISSION : contains
    PERMISSION ||--o{ ROLE_PERMISSION : assigned

    DOCTOR ||--o{ DOCTOR_SCHEDULE : has

    PATIENT ||--o{ APPOINTMENT : books
    DOCTOR ||--o{ APPOINTMENT : receives

    APPOINTMENT ||--o| PRESCRIPTION : has
    PRESCRIPTION ||--|{ PRESCRIPTION_ITEM : contains

    APPOINTMENT ||--o| INVOICE : generates
    INVOICE ||--o{ PAYMENT : receives

    USER ||--o{ AUDIT_LOG : performs
```

---

## Setup & Installation Instructions

You can run the project in two ways:
1. **Docker Build (Quickest & Self-Contained):** Uses an isolated local PostgreSQL container with automated seeding.
2. **Local Machine Build:** Runs directly on your host machine, connecting to Supabase or your own local PostgreSQL database.

---

### Method 1: Docker Build

#### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (v20+)

#### Steps

1. **Clone the repository:**
   ```bash
   git clone https://github.com/RafidNabil/Carepoint.git
   cd Carepoint
   ```

2. **Configure Docker environment variables (Optional):**
   A sample `.env.docker.example` file is included in the project root:
   ```bash
   cp .env.docker.example .env
   ```
   *(Defaults are pre-configured to work out of the box).*

3. **Build and start all services:**
   ```bash
   docker compose up --build
   ```

4. **Access the application:**
   - **Frontend Web UI:** [http://localhost:5173](http://localhost:5173)
   - **Backend API:** [http://localhost:5000/api](http://localhost:5000/api)
   - **API Health Check:** [http://localhost:5000/api/health](http://localhost:5000/api/health)
   - **Local PostgreSQL Port:** `localhost:5432` (`postgres` / `postgres`)
---

### Method 2: Local Host Build (Without Docker)

Use this method to run the frontend and backend directly on your operating system, connecting either to a cloud **Supabase** database or a local PostgreSQL installation.

#### Prerequisites
- [Node.js](https://nodejs.org/) (v18.x or v20.x+)
- [npm](https://www.npmjs.com/) (v9+)
- A **Supabase** PostgreSQL instance (or local PostgreSQL 15/16)

---

#### 1. Backend Setup

1. **Navigate to the backend directory:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   Create a `.env` file in `backend/` based on `backend/.env.example`:
   ```bash
   cp .env.example .env
   ```
   Update `.env` with your Supabase credentials and security keys:
   ```env
   PORT=5000
   NODE_ENV=development

   # Supabase or local PostgreSQL connection string
   DATABASE_URL="postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"
   DIRECT_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres"

   # JWT Secrets
   JWT_ACCESS_SECRET="your_jwt_access_secret_key"
   JWT_REFRESH_SECRET="your_jwt_refresh_secret_key"

   # Client Origins
   CLIENT_URL="http://localhost:5173"
   FRONTEND_URL="http://localhost:5173"
   ```

4. **Generate Prisma Client & Apply Schema:**
   ```bash
   # Generate Prisma client
   npm run prisma:generate

   # Push schema or run migrations on your Supabase / local DB
   npx prisma db push
   ```

5. **Seed the database:**
   To seed permissions, admin, doctors, patients, and sample appointments:
   ```bash
   npm run prisma:seed-sql
   ```
   *(Or run individual seeds: `npm run prisma:seed-permission`, `npm run prisma:seed-doctor`, `npm run prisma:seed-patient`, `npm run prisma:seed-admin`).*

6. **Start the backend development server:**
   ```bash
   npm run dev
   ```
   The backend API will run at `http://localhost:5000`.

---

#### 2. Frontend Setup

1. **Open a new terminal and navigate to the frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   Create a `.env` file in `frontend/` based on `frontend/.env.example`:
   ```bash
   cp .env.example .env
   ```
   Verify or customize the settings:
   ```env
   VITE_API_URL=http://localhost:5000/api
   VITE_CURRENCY=BDT
   VITE_CLINIC_TIMEZONE=Asia/Dhaka
   ```

4. **Start the frontend development server:**
   ```bash
   npm run dev
   ```
   The Vite dev server will launch at `http://localhost:5173`.

5. **Build for Production (Vercel / Production Deployment):**
   ```bash
   npm run build
   ```
   The compiled production assets will be output to `frontend/dist/`.

---

## 📡 API Endpoints Overview

| Module | Route | Method | Description | Access |
| :--- | :--- | :---: | :--- | :--- |
| **Auth** | `/api/auth/register` | `POST` | Register a new user account | Public |
| | `/api/auth/login` | `POST` | Authenticate user & issue tokens | Public |
| | `/api/auth/refresh` | `POST` | Refresh expired access token | Public |
| | `/api/auth/logout` | `POST` | Revoke session & clear cookies | Authenticated |
| | `/api/auth/me` | `GET` | Get current user profile | Authenticated |
| **Doctors** | `/api/doctors` | `GET` | List doctors with filter parameters | Public |
| | `/api/doctors/:id` | `GET` | Retrieve detailed doctor profile | Public |
| | `/api/doctors/:id/schedules`| `GET` | Get available doctor slots | Public |
| | `/api/doctors/profile` | `PUT` | Update doctor profile & consultation fee | Doctor |
| **Patients** | `/api/patients/profile` | `GET` / `PUT` | Retrieve or update patient profile | Patient |
| **Appointments** | `/api/appointments` | `POST` | Create/book an appointment | Patient |
| | `/api/appointments/my` | `GET` | Retrieve logged-in user's appointments | Patient / Doctor |
| | `/api/appointments/:id`| `PATCH` | Update status (COMPLETED, CANCELLED, NO_SHOW) | Doctor / Admin |
| **Prescriptions** | `/api/prescriptions` | `POST` | Issue prescription with medication items | Doctor |
| | `/api/prescriptions/:id`| `GET` | Get prescription details | Patient / Doctor |
| **Invoices** | `/api/invoices` | `GET` | List user or clinic invoices | Patient / Admin |
| | `/api/invoices/:id` | `GET` | Get invoice breakdown | Patient / Admin |
| **Payments** | `/api/payments` | `POST` | Record payment transaction | Patient / Admin |
| **Admin** | `/api/admin/stats` | `GET` | Analytics & operational dashboard stats | Admin |
| | `/api/admin/users` | `GET` / `PATCH` | Manage user status and roles | Admin |
| | `/api/admin/settings` | `GET` / `POST` | Clinic settings & booking rules | Admin |
| | `/api/admin/audit-logs` | `GET` | Inspect system audit trails | Admin |
| **System** | `/api/health` | `GET` | API health check ping | Public |

---

## 🔒 Security Best Practices

- **Authentication:** Stateless short-lived JWT access tokens with secure refresh tokens stored in hashed records and HTTP-only cookies.
- **Role-Based Access Control (RBAC):** Hierarchical permission validation guards sensitive endpoints against unauthorized operations.
- **Data Protection:** Passwords securely hashed with `bcrypt`.
- **Security Headers & Rate Limiting:** Express secured with `helmet`, CORS policy origin validation, and rate limiting against brute-force attacks.
- **Audit Trails:** Immutable database logging of critical state changes and administrative modifications.

---

## 📄 License

This project is licensed under the [ISC License](LICENSE).