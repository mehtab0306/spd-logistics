# SPD Logistics — Transport & Logistics Management System

A production-ready enterprise logistics management platform built for **Super Pak Data (SPD) Goods Transport Co.** (Est. 1996, Pakistan).

---

## Features

- **Public Web Portal**:
  - Home page with live tracking search, services catalog, and fleet showcase.
  - Interactive status timeline tracking for Bilty and Tracking IDs.
  - Contact form with direct Nodemailer email dispatch.
  - Floating WhatsApp click-to-chat integration with dispatch and executive management.
  - Floating AI Customer Support Assistant powered by Groq Llama-3.
  - Legal compliance pages: Privacy Policy (`/privacy-policy`), Terms & Conditions of Carriage (`/terms`), and Cookie Policy (`/cookies`).
  - Progressive Web App (PWA) with offline fallback service worker and web manifest.

- **Role-Based Portals**:
  - **Admin & Executive Dashboard**: Complete multi-module back office (Consignments/Bilty, Cash Books, Accounts, Customers, Drivers, Vehicles, Receivables, Payables, Payments, Reports, Audit Logs, Settings).
  - **Customer Portal**: Dedicated cargo tracking, shipment history, invoice receipts, and account balances.
  - **Driver Portal**: Real-time assigned shipment viewing, delivery milestone updates, and route execution.

- **Security & Data Integrity**:
  - Cryptographic password protection with bcrypt.
  - Role-based session authentication using signed HTTP-only JWT cookies (`spd_token`).
  - Immutable system audit logging for consignment state changes.
  - Multi-tenant data isolation across customer and staff roles.

---

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS & Lucide React
- **Database & ORM**: Prisma ORM (SQLite for local development, PostgreSQL compatible for cloud)
- **Authentication**: JWT (jose) & bcryptjs
- **AI Engine**: Groq Cloud API (Llama-3 architecture)
- **Email Delivery**: Nodemailer with TLS/SSL SMTP transport

---

## Getting Started

### 1. Clone & Install Dependencies

```bash
git clone <repository-url>
cd spd-logistics
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Configure your secrets in `.env`:
- `DATABASE_URL`: Path to local SQLite or cloud PostgreSQL connection string.
- `JWT_SECRET`: Random 32+ character string for token signing.
- `GROQ_API_KEY`: Groq API key for the AI assistant.
- `SMTP_*`: Credentials for automated inquiry email forwarding.

### 3. Database Migration & Seeding

```bash
npx prisma generate
npx prisma db push
npm run db:seed
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Build for Production

```bash
npm run build
npm start
```

---

## Deployment Guide

### Vercel / Railway / Render
1. Push repository to GitHub.
2. Connect your GitHub repository to the hosting platform.
3. Configure the Environment Variables outlined in `.env.example`.
4. Deploy the build with default Next.js build command: `npm run build`.

---

## License & Ownership

&copy; 2026 Super Pak Data (SPD) Goods Transport Co. All rights reserved.
