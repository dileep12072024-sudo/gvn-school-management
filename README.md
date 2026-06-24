# GVN School Management System

**Geethanjali Vidya Nilayam** | Peddawaltair, Visakhapatnam, Andhra Pradesh

A comprehensive full-stack school management web application with iOS 27 liquid glass UI design.

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
- **UI Style:** iOS 27 Liquid Glass Polished Design (see `src/styles/liquid-glass.css`)

---

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| Next.js 14 (App Router) | Frontend framework |
| TypeScript | Type safety |
| Tailwind CSS | Styling |
| Liquid Glass CSS | iOS 27 Premium UI effects |
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
| Student | Own timetable, results, notices |

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
- **Transport** — Routes, vehicles, drivers, student allocation
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

## 🔐 Demo Accounts

Log in with these credentials (after running `seed.sql`):

| Role | Email | Password |
|---|---|---|
| Organiser | organiser@gvn.edu.in | GVN@2024! |
| Principal | principal@gvn.edu.in | GVN@2024! |
| Vice Principal | vp@gvn.edu.in | GVN@2024! |
| Teacher | teacher@gvn.edu.in | GVN@2024! |
| Parent | parent@gvn.edu.in | GVN@2024! |

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

## ✨ Recent Updates (June 24, 2026)

### iOS 27 Liquid Glass Polished UI System
- Premium glassmorphic effects with backdrop blur
- Liquid smooth animations (fade, float, glow, pulse)
- Frosted glass variants (light, dark, containers)
- Polished button styles with gradient effects
- Enhanced stat cards with shimmer animations
- Liquid badges (success, error, warning)
- Responsive design with accessibility support

**File:** `src/styles/liquid-glass.css`  
**Commit:** `2b9aeccbb5b368c6c42ac75468e9901a1f6440d7`

### Available CSS Classes

```jsx
// Glassmorphic containers
<div className="liquid-glass rounded-2xl p-6">Content</div>
<div className="frosted-card">Frosted</div>
<div className="frosted-modal">Modal</div>

// Buttons
<button className="btn-liquid-primary">Primary Button</button>
<button className="btn-liquid-glass">Glass Button</button>

// Cards & Stats
<div className="stat-card-liquid">Stat Card</div>
<div className="card-liquid">Card with Animation</div>

// Form Elements
<input className="input-liquid" placeholder="Enter text..." />

// Badges
<span className="badge-liquid success">Success</span>
<span className="badge-liquid error">Error</span>

// Backgrounds
<div className="bg-liquid-gradient">Animated Gradient</div>
```

---

## 📚 Project Structure

```
src/
├── app/                    # Next.js app router pages
│   ├── dashboard/         # Dashboard layout
│   ├── login/             # Authentication
│   └── [modules]/         # Feature modules
├── components/            # Reusable React components
├── lib/                   # Utilities & helpers
├── styles/                # Global & liquid glass styles
└── types/                 # TypeScript type definitions

supabase/
├── schema.sql            # Database schema
└── seed.sql              # Demo data

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

**Last Updated:** June 24, 2026  
**Version:** 0.1.0
