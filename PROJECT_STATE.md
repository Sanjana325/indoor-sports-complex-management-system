> **Last audited:** 2026-04-15 — Updated to reflect the removal of `court.status`, 23-table schema completion, and full wiring of Admin/Player dashboards.

---

## 1. Tech Stack & Architecture

### Backend
| Layer | Technology |
|---|---|
| Runtime | Node.js |
| Framework | Express.js 4.x |
| Database | MySQL 8 (`indoor_sports_complex_db`) |
| ORM/Driver | `mysql2` (raw parameterized queries, connection pool) |
| Email | `Brevo` (SMTP) / `nodemailer` |
| Security | `helmet`, `cors`, `OTP` verification |
| Dev tooling | `nodemon` |
| Entry point | `backend/src/server.js` |

### Frontend
| Layer | Technology |
|---|---|
| Framework | React 19 (Vite 7) |
| Routing | `react-router-dom` v7 |
| UI Component BlockedSlots, Reports, Calendar, Home)
        │   ├── player/         # 6 player pages (Home, BookCourt, AvailableClasses, MyBookings, MyClasses, MyPayments)
        │   ├── coach/          # 2 coach pages
        │   ├── staff/          # 1 staff page
        │   └── common/         # 2 shared pages
        └── styles/             # 24+ CSS files (ArenaPro UI system)
```

---

## 3. Database Overview (`Database_Schema.sql`)

The schema has **23 tables** organized across four domains:

### 3a. Users & Roles
| Table | Purpose |
|---|---|
| `useraccount` | Core user record; role enum: `SUPER_ADMIN`, `ADMIN`, `STAFF`, `COACH`, `PLAYER` |
| `coach` | Maps a `UserID` → `CoachID` (1-to-1) |
| `coachqualification` | Many-to-many: coach ↔ qualification |
| `coachsport` | Many-to-many: coach ↔ sport specialization |
| `qualification` | Lookup table for qualification names |
| `passwordresettoken` | Token-hash + expiry for email password reset |

### 3b. Facilities & Courts
| Table | Purpose |
|---|---|
| `sport` | Master list of sports (`SportID`, `SportName`, `IsActive`) |
| `court` | Physical court: name, capacity, price/hr (Availability derived from `blockedslot` and `booking`) |
| `court_sport` | Many-to-many: court ↔ sport (a court can host multiple sports) |
| `blockedslot` | Admin-defined blocked windows on a court (The single source of truth for court maintenance/blocking) |

### 3c. Scheduling, Classes & Attendance
| Table | Purpose |
|---|---|
| `class` | A class offering: sport, coach, court, title, fee, billing type |
| `classschedule` | Schedule for a class: `WEEKLY` or `ONE_TIME`, with time range |
| `classscheduleday` | Days-of-week for weekly classes (0=Sun … 6=Sat) |
| `classsession` | Individual generated session instances (date + time + status) |
| `enrollment` | Player enrollment in a class |
| `enrollmentmonth` | Monthly billing period per enrollment (for `MONTHLY` billing classes) |
| `attendance` | Per-enrollment, per-session attendance record |

### 3d. Bookings & Payments
| Table | Purpose |
|---|---|
| `booking` | Court booking: user, court, sport, datetime window, status (`PENDING_PAYMENT`, `WAITING_VERIFICATION`, `CONFIRMED`, `CANCELLED`, `EXPIRED`) |
| `payment` | Payment record: amount, method (`ONLINE`/`BANK_SLIP`), status (`PENDING`/`VERIFIED`/`REJECTED`) |
| `bookingpayment` | Links a `payment` to a `booking` (1-to-1) |
| `enrollmentmonthpayment` | Links a `payment` to an `enrollmentmonth` (1-to-1) |

---

## 4. Implemented Features Audit (Fully Connected, Full-Stack)

### ✅ Authentication
- `POST /api/auth/register` — Player self-registration with bcrypt hashing
- `POST /api/auth/login` — JWT generation, role returned in payload
- `GET /api/auth/me` — Fetch session user details
- `POST /api/auth/change-password` — Forced password change on first login (`MustChangePassword` flag)
- `POST /api/auth/forgot-password` — Sends reset email via nodemailer
- `POST /api/auth/reset-password` — Validates token hash, sets new password
- **Frontend pages:** `Login.jsx`, `Register.jsx`, `ForgotPassword.jsx`, `ResetPassword.jsx` — all fully wired with refined two-line title UI hierarchy.

### ✅ Admin — Sports Management
- `GET /api/admin/sports` — List all sports
- `POST /api/admin/sports` — Create sport
- `DELETE /api/admin/sports/:sportId` — Delete sport (DB-guarded by FK)
- **Frontend:** Dedicated 'Sports' tab in left sidebar — fully live

### ✅ Admin — User Management
- `GET /api/admin/users` — List all users (with coach qualifications & sport specializations via JOINs)
- `POST /api/admin/users` — Create user; for COACH role, also writes `coach`, `coachqualification`, `coachsport` records; returns auto-generated temp password
- `PUT /api/admin/users/:userId` — Update user details + coach records in a transaction
- `PATCH /api/admin/users/:userId/disable` — Soft-disable (`IsActive = 0`)
- `PATCH /api/admin/users/:userId/enable` — Re-enable user
- `DELETE /api/admin/users/:userId` — Hard delete (SUPER_ADMIN only)
- **Frontend:** `UserManagement.jsx` — fully live (ADD + EDIT + enable/disable + delete)

### ✅ Admin — Court Management
- `GET /api/admin/courts` — List courts with aggregated sport names
- `POST /api/admin/courts` — Create court + insert `court_sport` rows (multi-sport)
- `PUT /api/admin/courts/:courtId` — Update court + replace sport links
- `DELETE /api/admin/courts/:courtId` — Delete court (FK-guarded)
- **Frontend:** `Courts.jsx` — fully live with refined gradient header, sport-chip multi-select, per-sport sections, edit modal

### ✅ Admin — Qualifications
- `GET /api/admin/qualifications` — List all qualifications
- `POST /api/admin/qualifications` — Create qualification
- **Frontend:** Used inline inside `UserManagement.jsx` for coach creation — fully live

### ✅ Admin — Class Management
- `GET /api/admin/classes/available-courts` — Returns conflict-free courts.
- `GET /api/admin/coaches` — List active coaches.
- `GET /api/admin/classes` — List all classes.
- `POST /api/admin/classes` — Create class + schedule + sessions.
- `PUT /api/admin/classes/:classId` — Full class metadata update (wired).
- `PATCH /api/admin/classes/:classId/deactivate` / `activate` — Soft delete.
- **Frontend:** `ClassManagement.jsx` — Fully live for ADD, EDIT, and SOFT DELETE.

### ✅ Admin — Attendance & Enrollments
- `GET /api/admin/enrollments` — List all student enrollments.
- `PATCH /api/admin/enrollments/:id/cancel` — Revoke enrollment.
- `GET /api/admin/attendance` / `POST /api/admin/attendance/mark` — Session-based roll call.
- **Frontend:** `Enrollments.jsx` and `Attendance.jsx` are fully wired.

### ✅ Admin — Blocked Slots
- `GET/POST/PUT/DELETE /api/admin/blocked-slots` — Full CRUD.
- **Frontend:** `BlockedSlots.jsx` — Fully live, manages court availability.

### ✅ Player — Portals & History
- `GET /api/player/bookings` / `GET /api/player/classes` / `GET /api/player/payments` — Live data fetching.
- **Frontend:** `PlayerMyBookings.jsx`, `PlayerMyClasses.jsx`, and `PlayerMyPayments.jsx` are fully live.

### ✅ Admin — Reports & Analytics (BI)
- `GET /api/admin/reports/dashboard-stats` — Aggregates for tile display.
- `GET /api/admin/reports/[bookings|payments|attendance|enrollments]` — Granular BI data.
- **Frontend:** `Reports.jsx` and dedicated sub-pages are fully wired with interactive charts and CSV export stubs.

---

## 5. Current Gaps & Mocked Items

While most core pages are wired, some specific UI components still use local state or mocked indicators.

| Item | Mock Data Description | Missing Backend |
|---|---|---|
| `AdminHome.jsx` (Lists) | The "Today's Bookings" and "Upcoming Classes" lists are hardcoded. | Specific "Daily Agenda" endpoint |
| `PlayerHome.jsx` (Stats) | Performance tiles (Total hours, Rank) are visual-only. | Player stats aggregation |
| `Coach Portal` | Coach dashboards and class lists are still mocked stubs. | Full Coach-specific API set |
| `CSV/PDF Exports` | Buttons exist in Reports but only log to console or trigger `window.print()`. | Server-side report generation |

---

## 6. Macro Next Steps

1.  **Coach Portal Implementation**: Build `GET /api/coach/classes` and assign attendance rights to coaches.
2.  **Dashboard Refinement**: Wire the "Today's Agenda" lists in `AdminHome.jsx` and `PlayerHome.jsx`.
3.  **Real Exports**: Implement actual CSV/Excel generation for report dashboards.
4.  **Notifications**: Implement real-time socket or push notifications for class cancellations.

---

*This document is auto-generated from a workspace audit and should be updated after each major feature completion.*
