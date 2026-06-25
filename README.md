# Employee Management Platform

A web app for managing employees, master data, work orders, attendance, wages, and final settlements. Single-user HR operations with Firebase (Firestore + Auth + Storage).

## Features

- **Master Data** — Departments, designations, banks, sites, ESI locations, employees, work orders (alphabetically sorted)
- **Employees** — CRUD, documents (profile photo, Aadhaar, license, passbook) via Firebase Storage
- **Work Orders** — Create and edit work orders with validity and state details
- **Attendance** — Mark daily attendance by employee and month
- **Wages** — Earnings, incentives, deductions; auto-calculated totals
- **Final Settlements** — Record settlements with bonus/leave entitlements
- **Auth** — Email/password (Firebase Auth); update password from profile

## Tech Stack

React 19, TypeScript, Vite, Redux Toolkit, React Hook Form + Zod, shadcn/ui, Tailwind CSS v4, Firebase (Firestore, Auth, Storage), Sonner for toasts.

## Setup

1. Copy `.env.example` to `.env` and add your Firebase config (`VITE_FIREBASE_*`).
2. `npm install` then `npm run dev`.
3. Build: `npm run build`.

Firestore is configured for a non-default database; set the database ID in `src/config/firebase.ts` if needed (e.g. `getFirestore(app, "test")`).
