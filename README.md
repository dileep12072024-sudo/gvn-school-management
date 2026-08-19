# GVN School Management System

**Geethanjali Vidya Nilayam** | Peddawaltair, Visakhapatnam, Andhra Pradesh

A full-stack school management web application — Supabase Auth and Postgres RLS
behind a classical, glossy, mobile-first UI.

---

## 🌐 Live Demo

**🚀 View the Web Application:**
- **Development Build:** `npm run dev` → http://localhost:3000
- **Production Build:** Deployed on Cloudflare Pages (set up in `wrangler.toml`)
- **Cloudflare Pages URL:** To be deployed at your connected Cloudflare account

> **Demo Accounts Available** (see below for credentials)

---

## 🎨 Brand Colors & UI

- **Primary (Navy):** `#1e3a5f`
- **Accent (Gold):** `#f59e0b`
- **UI Style:** "Meridian" — layered shadow depth, a small specular gloss band,
  pointer-tracked 3D tilt on pointer devices. No blur-glass, no neon.
  See `src/app/globals.css`.

---

## 🛠️ Tech Stack

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

## 👥 User Roles

| Role | Access |
|---|---|
| Organiser | Full system access |
| Principal | View all data, approve events |
| Vice Principal | Manage classes, timetable, transport |
| Teacher | Attendance, marks, timetable (own) |
| Parent | Ward's data, fees, attendance |

---

## 📋 Modules

- **Authentication** — Role-based login with 6 dashboards
- **Dashboard** — Statistics, charts, notices, upcoming events
- **Students** — Full CRUD with admission number, class, parent linking
- **Teachers** — Employee records, subject specialization
- **Classes & Sections** — Class management with teacher assignment
- **Attendance** — Daily marking with reports
- **Fee Management** — Payments, receipts, overdue tracking
- **Exams & Results** — Scheduling, marks entry, report cards
- **Timetable** — Period-wise schedule builder
- **Notices** — Pinnable announcements with role targeting
- **Transport** — Routes, vehicles, drivers (own records, no login), student allocation
- **Calendar & Events** — School calendar with approval flow
- **Messages** — Teacher-parent communication
- **Leave Management** — Staff leave requests with approval
- **Documents** — Circulars, syllabus, photo portfolio

---

## 🚀 Quick Start

1. **Clone the repository:**
   ```bash
   git clone https://github.com/dileep12072024-sudo/gvn-school-management.git
   cd gvn-school-management
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up database (Supabase):**
   - Create a Supabase project
   - Run `supabase/schema.sql` in your Supabase SQL Editor
   - Run `supabase/seed.sql` for demo data

4. **Configure environment variables:**
   ```bash
   cp .env.example .env.local
   ```
   Fill in your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   ```

5. **Run development server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser

---

## 🔐 Accounts

There is no public sign-up. Logins are Supabase Auth users created by the school;
`profiles.role` decides what each one can reach, and RLS enforces it in the database.

Create the first accounts in **Supabase → Authentication → Users**, then set the role:

```sql
UPDATE public.profiles SET role = 'principal' WHERE email = 'principal@gvn.edu.in';
```

Roles: `organiser`, `principal`, `vice_principal`, `teacher`, `parent`.

Students do not sign in for themselves — a parent account carries the child's
view of attendance, fees and results.

A parent only ever sees their own child — link them by setting
`students.parent_id` to that profile's id.

> Never commit real passwords to this file.

---

## 🚀 Deploy to Cloudflare Pages

1. **Build the application:**
   ```bash
   npm run pages:build
   ```

2. **Preview locally:**
   ```bash
   npm run preview
   ```

3. **Deploy to Cloudflare:**
   ```bash
   npm run deploy
   ```

**Cloudflare Configuration:**
- **Build command:** `npm run build`
- **Build output directory:** `.next`
- **Framework preset:** Next.js

---

## 🎨 Design system

All styling routes through CSS custom properties and component classes in
`src/app/globals.css`; pages compose the primitives in `src/components/ui`.

```jsx
<div className="panel p-6">…</div>        {/* raised surface, gloss band     */}
<div className="panel-flat p-4">…</div>   {/* one step down                  */}
<div className="plaque p-4">…</div>       {/* engraved / inset               */}
<button className="btn btn-primary" />    {/* indigo key, hard bottom edge   */}
<button className="btn btn-accent" />     {/* teal key                       */}
<button className="btn btn-ghost" />      {/* paper key                      */}
<input className="input" />               {/* milled well, 16px on mobile    */}
<div className="stat-grid">…</div>        {/* auto-fitting tile row          */}
```

Mobile-first specifics worth knowing before you edit:

- `.input` is **16px** below the `sm` breakpoint on purpose — anything smaller
  makes iOS Safari zoom the viewport on focus and never zoom back.
- `--tap` is 40px, raised to 44px under `@media (pointer: coarse)`.
- `Modal` renders as a bottom sheet under `sm`, a centred dialog above it.
- `Tilt3D` no-ops for non-mouse pointers; a tap would otherwise leave the card
  stuck at an angle.
- Layout height uses `100dvh`, not `100vh`, so mobile Safari's URL bar does not
  bury the last row of a table.

---

## 📚 Project Structure

```
src/
├── app/                    # Next.js app router pages
│   ├── dashboard/         # Dashboard layout
│   ├── login/             # Authentication
│   └── [modules]/         # Feature modules
├── components/
│   ├── layout/            # Shell, sidebar, header
│   └── ui/                # PageHeader, StatCard, Modal, TableShell, Tilt3D
├── context/               # AuthContext
├── lib/                   # supabase (browser), supabase-server, nav, grading
└── types/                 # TypeScript type definitions

supabase/
├── schema.sql            # Full schema: tables, RLS policies, storage, indexes
└── migrations/
    └── 001_portal.sql    # Tightens student/attendance/results/fees RLS and
                          # adds students.profile_id (run on existing installs)

public/                   # Static assets
```

---

## 🤝 Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

© 2024 Geethanjali Vidya Nilayam. All rights reserved.

Built with ❤️ by **NETETI DILIP**

---

## 📞 Support

For issues, questions, or suggestions:
- Open an [Issue](https://github.com/dileep12072024-sudo/gvn-school-management/issues)
- Check the [GitHub Discussions](https://github.com/dileep12072024-suo/gvn-school-management/discussions)

---

**Last Updated:** 18 August 2026  
**Version:** 0.1.0
