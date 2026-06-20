# GVN School Management System

**Geethanjali Vidya Nilayam** | Peddawaltair, Visakhapatnam, Andhra Pradesh

A comprehensive full-stack school management web application.

---

## Brand Colors
- Primary (Navy): `#1e3a5f`
- Accent (Gold): `#f59e0b`

---

## Tech Stack
| Technology | Purpose |
|---|---|
| Next.js 14 (App Router) | Frontend framework |
| TypeScript | Type safety |
| Tailwind CSS | Styling |
| Supabase | Database + Auth + Storage |
| Cloudflare Pages | Deployment |
| Recharts | Data visualizations |
| Lucide React | Icons |

---

## User Roles
| Role | Access |
|---|---|
| Organiser | Full system access |
| Principal | View all data, approve events |
| Vice Principal | Manage classes, timetable, transport |
| Teacher | Attendance, marks, timetable (own) |
| Parent | Ward's data, fees, attendance |
| Student | Own timetable, results, notices |

---

## Modules
- Authentication — Role-based login with 6 dashboards
- Dashboard — Statistics, charts, notices, upcoming events
- Students — Full CRUD with admission number, class, parent linking
- Teachers — Employee records, subject specialization
- Classes & Sections — Class management with teacher assignment
- Attendance — Daily marking with reports
- Fee Management — Payments, receipts, overdue tracking
- Exams & Results — Scheduling, marks entry, report cards
- Timetable — Period-wise schedule builder
- Notices — Pinnable announcements with role targeting
- Transport — Routes, vehicles, drivers, student allocation
- Calendar & Events — School calendar with approval flow
- Messages — Teacher-parent communication
- Leave Management — Staff leave requests with approval
- Documents — Circulars, syllabus, photo portfolio

---

## Quick Start

1. Clone: `git clone https://github.com/dileep12072024-sudo/gvn-school-management.git`
2. Install: `npm install`
3. Run `supabase/schema.sql` in your Supabase SQL Editor
4. Copy `.env.example` to `.env.local` and fill in your Supabase credentials
5. Run: `npm run dev`

---

## Demo Accounts (after running seed.sql)
| Role | Email | Password |
|---|---|---|
| Organiser | organiser@gvn.edu.in | GVN@2024! |
| Principal | principal@gvn.edu.in | GVN@2024! |
| Vice Principal | vp@gvn.edu.in | GVN@2024! |
| Teacher | teacher@gvn.edu.in | GVN@2024! |
| Parent | parent@gvn.edu.in | GVN@2024! |

---

## Deploy to Cloudflare Pages
- Build command: `npm run build`
- Build output: `.next`
- Framework: Next.js

---

(c) 2024 Geethanjali Vidya Nilayam. Built by NETETI DILIP.
