<div align="center">
  <img src="https://via.placeholder.com/150" alt="OpsHub Logo" width="120" />
  
  # OpsHub — Enterprise Management System

  **A modern, full-featured HR & Employee Management Platform** <br/>
  Built to manage the complete employee lifecycle—from onboarding and attendance to payroll and compliance.

  [![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat&logo=next.js)](https://nextjs.org/)
  [![Supabase](https://img.shields.io/badge/Supabase-Auth_%2B_DB-3ECF8E?style=flat&logo=supabase)](https://supabase.com/)
  [![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?style=flat&logo=prisma)](https://prisma.io/)
  [![TailwindCSS](https://img.shields.io/badge/Tailwind-CSS_4-38B2AC?style=flat&logo=tailwind-css)](https://tailwindcss.com/)
  [![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

  [**View Live Demo**](#) • [**Report Bug**](#) • [**Request Feature**](#)
</div>

---

## 🌟 Overview
OpsHub is an end-to-end Enterprise Management System designed to streamline human resources, payroll, and internal communications. Wrapped in a polished, ledger-themed UI with offline PWA support, command-palette navigation, and bilingual (English/Bengali) capabilities, it offers enterprise-grade functionality with the speed of a modern web app.

---

## ✨ Features
- **Identity & Access Management:** Robust Role-Based Access Control (RBAC) with hierarchical privileges (Employee, Manager, HR, Admin, CEO). Secure Supabase authentication with email/magic-link invites.
- **Attendance & Time Tracking:** Real-time presence tracking via Supabase Realtime broadcast channels. Clock-in/out functionality with geofencing and offline-ready service workers.
- **Automated Payroll System:** Dynamic payroll structures, deductions, PF matching, and one-click generation of PDF payslips (compliant with local labor laws).
- **Core HR Modules:** Centralized dashboards for leave management, assets, helpdesk ticketing, shift rosters, and performance tracking (OKRs).
- **Compliance & Security:** NID encryption-at-rest, strict API hardening, and comprehensive audit logs.
- **Performance Optimized:** Built on Next.js 15 App Router, React 19, and Turbopack for instantaneous navigation and data mutations.

---

## 🚀 Tech Stack

### Frontend
- **Framework:** Next.js 15 (App Router, React 19)
- **Styling:** Tailwind CSS 4, Framer Motion, shadcn-style UI primitives
- **PWA:** Serwist service worker
- **State/Data:** tRPC-style lightweight proxy over Next.js Server Actions

### Backend & Database
- **Database:** PostgreSQL (via Supabase)
- **ORM:** Prisma
- **Auth & Realtime:** Supabase Auth & Realtime
- **Microservices:** Go (Fiber) for rapid PDF generation

### Tools & Testing
- **Observability:** Sentry, PostHog
- **Testing:** Vitest (Unit), Playwright (E2E)

---

## 📸 Visuals

*(Replace the placeholders below with actual screenshots of your application)*

<div align="center">
  <img src="https://via.placeholder.com/800x450?text=Dashboard+Overview" alt="Dashboard Overview" width="800"/>
  <p><i>Centralized Dashboard Overview</i></p>
</div>

<div align="center">
  <img src="https://via.placeholder.com/800x450?text=Payroll+System+&+Payslips" alt="Payroll System" width="800"/>
  <p><i>Payroll Vault & PDF Slip Generation</i></p>
</div>

---

## 🛠️ Installation & Setup

### Prerequisites
- Node.js (v18+)
- pnpm (recommended) or npm
- A Supabase Project (for DB and Auth)

### 1. Clone the repository
```bash
git clone https://github.com/your-username/opshub-ems.git
cd opshub-ems
```

### 2. Install dependencies
```bash
pnpm install
```
*(The `postinstall` script will automatically run `prisma generate`)*

### 3. Configure Environment Variables
Copy the example environment file:
```bash
cp .env.example .env
```
Update `.env` with your Supabase credentials:
- `DATABASE_URL` / `DIRECT_URL` (Supabase connection strings)
- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_SUPABASE_SERVICE_ROLE_KEY`
- `OWNER_EMAIL` (Sets the immutable system CEO)

### 4. Database Setup
Push the schema to your development database:
```bash
npx prisma db push
```
*(Optional)* Seed the database with demo data:
```bash
pnpm ts-node prisma/seed.ts
```
> **Warning:** Seeding will clear existing data. Never run this against a production database.

### 5. Start the Development Server
```bash
pnpm dev
```
Navigate to `http://localhost:3000` to view the application.

---

## 🧪 Testing

Run the test suites to verify role hierarchy, spoof prevention, and payroll calculations:
```bash
pnpm test          # Unit tests (Vitest)
pnpm test:e2e      # E2E tests (Playwright)
```

---

## 🛡️ Security Best Practices
- **Never Commit Secrets:** Ensure `.env` files are ignored. Rotate any compromised keys immediately.
- **RBAC Enforced:** The `isCEO` privilege is derived securely from the database or owner flag, preventing designation spoofing.
- **Migrations:** For staging/production, always prefer `prisma migrate dev` / `prisma migrate deploy` over `db push` to maintain reproducible schema states.

---

## 📄 License
This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
