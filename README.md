<div align="center">

# Fluxio — Frontend

**Inventory, product catalog, customer and invoicing management for small and medium businesses.**

![React](https://img.shields.io/badge/React-19-149eca?logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-646cff?logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06b6d4?logo=tailwindcss&logoColor=white)
![Node](https://img.shields.io/badge/Node.js-%E2%89%A520-339933?logo=nodedotjs&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-ready-2496ed?logo=docker&logoColor=white)
![Status](https://img.shields.io/badge/status-MVP-0e7490)

</div>

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Configuration](#configuration)
- [Available Scripts](#available-scripts)
- [Project Structure](#project-structure)
- [Routing](#routing)
- [Roles and Permissions](#roles-and-permissions)
- [API Communication](#api-communication)
- [Docker Deployment](#docker-deployment)
- [Security](#security)
- [Code Conventions](#code-conventions)
- [UI Principles](#ui-principles)
- [Contributing](#contributing)

---

## Overview

**Fluxio** is a web-based management application for small and medium businesses. It brings together the product catalog, stock movements, business partners (customers and suppliers) and the invoicing cycle, in compliance with Tunisian tax rules (VAT, fiscal stamp, tax ID, amounts in dinars with 3 decimal places).

This repository contains the **web interface (React SPA)**. It relies on the Fluxio API (Node.js, Express, Prisma, MySQL), which remains the source of truth for authentication, per-company data isolation and all authoritative calculations.

> The product is free during the MVP phase. This phase is used to gather feedback from early users and validate features before considering a paid offering.

---

## Features

### Authentication and Accounts

- Multi-step sign-up: personal details, company, credentials, OTP code verification
- Login with a JWT stored in a cookie, with automatic session refresh
- Password reset
- Isolated company accounts (multi-tenant architecture on the API side)

### Catalog and Stock

- Products, categories and suppliers
- Stock movements: stock in (purchases), stock out (sales), supplier returns and customer returns
- Inventory and stock alerts (low threshold, out of stock)
- Dashboard: stock health, trends, critical products and latest movements

### Sales and Invoicing

- Customer directory
- Quotes, and quote-to-invoice conversion
- Invoice generation from invoiceable movements
- Credit notes and credit note statements
- Payment tracking (partial or full payments)
- Printing and PDF preview of fiscal documents, batch printing

### Reporting and Exports

- Manager dashboard: revenue, margin by category, stock value, movement flow, collections, top customers, period filtering
- CSV exports for the accountant: sales journal, VAT summary, movements, products, customers
- Formula neutralization in CSV exports (protection against spreadsheet formula injection)

### Settings

- Company profile (tax identity, contact details) with a completeness indicator
- Team role management

---

## Tech Stack

| Area              | Tools                                                                     |
| ----------------- | ------------------------------------------------------------------------- |
| UI framework      | [React 19](https://react.dev)                                             |
| Build and dev     | [Vite 8](https://vite.dev)                                                |
| Styling           | [Tailwind CSS v4](https://tailwindcss.com), `tailwind-merge`, `clsx`      |
| Components        | [shadcn/ui](https://ui.shadcn.com), Radix UI, `class-variance-authority`  |
| Icons             | [Lucide](https://lucide.dev)                                              |
| Forms             | [React Hook Form](https://react-hook-form.com)                            |
| Charts            | [Recharts](https://recharts.org)                                          |
| Animations        | [Motion](https://motion.dev)                                              |
| Code quality      | [Oxlint](https://oxc.rs), [Prettier](https://prettier.io) (+ Tailwind plugin) |
| Production        | Multi-stage Docker build, Nginx (Alpine)                                  |

---

## Prerequisites

- **Node.js 20** or later (the Docker image uses Node 22)
- **npm** (bundled with Node.js)
- A reachable instance of the **Fluxio API** (defaults to `http://localhost:3000`)
- *Optional*: **Docker** to build the production image

---

## Getting Started

```bash
# 1. Clone the repository
git clone https://github.com/fares8lefi/Fluxio.git
cd Fluxio

# 2. Install dependencies
npm install

# 3. Set up the environment
cp .env.example .env

# 4. Start the development server
npm run dev
```

The app is available at the address printed by Vite, usually **http://localhost:5173**.

> The API must allow the frontend's origin (CORS with `credentials`), since authentication relies on cookies.

---

## Configuration

Environment variables are read by Vite at build time. Only variables prefixed with `VITE_` are exposed to the browser: **never** put secrets in them.

| Variable       | Description                   | Default                 |
| -------------- | ----------------------------- | ----------------------- |
| `VITE_API_URL` | Base URL of the Fluxio API    | `http://localhost:3000` |

`.env` and `.env.*` files are ignored by Git and Docker; only `.env.example` is versioned.

---

## Available Scripts

| Command                | Description                                   |
| ---------------------- | --------------------------------------------- |
| `npm run dev`          | Starts the development server with hot reload |
| `npm run build`        | Builds the production bundle into `dist/`     |
| `npm run preview`      | Serves the production build locally           |
| `npm run lint`         | Lints the code with Oxlint                    |
| `npm run format`       | Formats the code with Prettier                |
| `npm run format:check` | Checks formatting without modifying files     |

---

## Project Structure

The `@` alias points to `src/` (configured in `vite.config.js` and `jsconfig.json`).

```text
src/
├── assets/            # Images and static resources
├── components/
│   ├── auth/          # Sign-up flow steps and form fields
│   ├── charts/        # Dashboard charts (and manager/ for the manager view)
│   ├── dashboard/     # Stat cards, latest movements
│   ├── landing/       # Landing page elements
│   ├── layout/        # Layouts (dashboard, public header)
│   ├── print/         # Printable fiscal documents and print preview
│   └── ui/            # Generic components (Modal, Toast, Button, Skeleton…)
├── constants/         # Constants (API URL, static content)
├── contexts/          # AuthContext: user session and permissions
├── features/          # Business modules, one folder per domain
│   ├── categories/
│   ├── clients/
│   ├── inventory/
│   ├── invoices/      # Invoices, quotes, credit notes, payments, exports
│   ├── manager/       # Manager dashboard
│   ├── movements/     # Stock movements
│   ├── products/
│   ├── settings/
│   └── suppliers/
├── hooks/             # Shared hooks (useHashRoute…)
├── lib/               # Utilities: tax helpers, permissions, animations, helpers
├── pages/             # Top-level pages (landing, login, dashboard…)
├── routes/            # AppRouter: public / protected routing
├── services/          # API calls, one service per resource
├── App.jsx
├── index.css          # Tailwind entry point and theme
└── main.jsx           # Application entry point
```

**Organizing principle**: business code lives in `features/<domain>/`, reusable components in `components/`, and all network access goes through `services/`.

---

## Routing

The app uses **hash-based** routing (`useHashRoute`), which makes it compatible with any static host.

| Route                                                | Access    | Content                                         |
| ---------------------------------------------------- | --------- | ----------------------------------------------- |
| `#` (default)                                        | Public    | Landing page                                    |
| `#login`, `#signup`, `#forgot-password`              | Public    | Authentication (redirects to dashboard if logged in) |
| `#confidentialite`                                   | Public    | Privacy policy                                  |
| `#dashboard`                                         | Protected | Dashboard                                       |
| `#dashboard/products`                                | Protected | Products                                        |
| `#dashboard/categories`                              | Protected | Categories                                      |
| `#dashboard/suppliers`                               | Protected | Suppliers                                       |
| `#dashboard/inventory`                               | Protected | Inventory                                       |
| `#dashboard/movements`                               | Protected | All movements                                   |
| `#dashboard/movements/in` (`achats`)                 | Protected | Stock in                                        |
| `#dashboard/movements/out` (`ventes`)                | Protected | Stock out                                       |
| `#dashboard/movements/return-supplier`               | Protected | Supplier returns                                |
| `#dashboard/movements/return-client`                 | Protected | Customer returns                                |
| `#dashboard/clients`                                 | Protected | Customers                                       |
| `#dashboard/invoices`                                | Protected | Invoices                                        |
| `#dashboard/invoices/quotes`                         | Protected | Quotes                                          |
| `#dashboard/invoices/credit-notes`                   | Protected | Credit notes                                    |
| `#dashboard/manager`                                 | Protected | Manager dashboard                               |
| `#dashboard/settings`, `#dashboard/settings/company` | Protected | Settings                                        |

---

## Roles and Permissions

Each user has a role within their company. The `src/lib/permissions.js` module mirrors the backend rules in order to **hide** unauthorized actions; **the backend remains the authority** and rejects any request that is not allowed.

| Action           | Manager (`OWNER`) | Storekeeper (`STOCK`) | Accountant (`ACCOUNTANT`) |
| ---------------- | :---------------: | :-------------------: | :-----------------------: |
| `stock.write`    | ✅                | ✅                    | —                         |
| `billing.write`  | ✅                | —                     | ✅                        |
| `finance.read`   | ✅                | —                     | ✅                        |
| `company.manage` | ✅                | —                     | —                         |

```jsx
const { can } = useAuth();
{can('billing.write') && <Button>New invoice</Button>}
```

---

## API Communication

All calls go through the centralized client `src/services/apiClient.js`:

- **Cookies**: requests are sent with `credentials: 'include'` (no token stored in `localStorage`)
- **Automatic refresh**: on a `401` response, a single call to `/api/users/refreshToken` is shared across concurrent requests, then the original request is replayed
- **Error messages**: HTTP status codes are mapped to user-friendly messages
- **One service per resource**: `productService`, `clientService`, `invoiceService`, `exportService`, etc.

Tax amounts (VAT, totals, fiscal stamp) are **calculated and stored by the backend**. The `src/lib/fiscal.js` module is used for display only (dinar formatting, VAT breakdown, tax ID validation).

---

## Docker Deployment

The `Dockerfile` builds the app with Node, then serves it with Nginx.

```bash
# Build the image
docker build -t fluxio-frontend .

# Run the container
docker run -d -p 8080:80 --name fluxio-frontend fluxio-frontend
```

The app is then available at **http://localhost:8080**.

> `VITE_API_URL` is baked in at build time. To target a different API, provide a suitable `.env` file (or export the variable) **before** `npm run build` in your pipeline.

The `nginx.conf` configuration:

- serves `index.html` for any unknown route (SPA fallback);
- hides the Nginx version (`server_tokens off`);
- adds the security headers described below.

---

## Security

| Measure                                             | Details                                                       |
| --------------------------------------------------- | ------------------------------------------------------------- |
| Cookie-based authentication                         | No token accessible from application JavaScript               |
| `X-Frame-Options: DENY` + `frame-ancestors 'none'`  | Clickjacking protection                                       |
| `X-Content-Type-Options: nosniff`                   | Prevents MIME type sniffing                                   |
| `Referrer-Policy`                                   | `strict-origin-when-cross-origin`                             |
| `Permissions-Policy`                                | Camera, microphone and geolocation disabled                   |
| Content-Security-Policy                             | `object-src 'none'`, `base-uri 'self'`, `form-action 'self'`  |
| CSV exports                                         | Formula neutralization (`=`, `+`, `-`, `@`…)                  |
| Secrets                                             | `.env` excluded from Git and from the Docker image            |

To report a vulnerability, please contact the maintainer directly rather than opening a public issue.

---

## Code Conventions

- **Formatting**: Prettier (`.prettierrc`) with automatic Tailwind class sorting; run `npm run format` before each commit.
- **Linting**: Oxlint (`.oxlintrc.json`); `npm run lint` must pass without errors.
- **Imports**: use the `@/` alias instead of deep relative paths.
- **Components**: one component per file, named in `PascalCase`; hooks as `use-kebab-case.js` or `useCamelCase.js`.
- **Commits**: [Conventional Commits](https://www.conventionalcommits.org/) format — `feat(invoices): …`, `fix(stock): …`, `chore(deps): …`.

Additional internal guides (architecture, routing, accessibility, performance, validation…) are available in the `skills/` folder.

---

## UI Principles

- Every page is built from reusable components and responsive layouts.
- The palette uses petrol blue, cyan and emerald tones; purple is not used.
- Critical stock information must be readable, accessible and given visual priority.
- Loading, error and empty states are always handled (`Skeleton`, `ErrorBoundary`, `EmptyState`).

---

## Contributing

1. Create a branch from `main`: `git checkout -b feat/my-feature`
2. Develop, then verify: `npm run lint && npm run format:check && npm run build`
3. Commit following Conventional Commits
4. Open a Pull Request describing the change and, where relevant, include screenshots

---

<div align="center">

Built with care for small businesses · **Fluxio**

</div>
