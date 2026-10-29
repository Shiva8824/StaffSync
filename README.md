# StaffSync - Modern Human Resource Management System (HRMS)

[![MERN Stack](https://img.shields.io/badge/Stack-MERN-blue.svg)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-v22+-green.svg)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-v4.21-lightgrey.svg)](https://expressjs.com/)
[![React](https://img.shields.io/badge/React-v18-cyan.svg)](https://reactjs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-emerald.svg)](https://mongodb.com/)
[![License: ISC](https://img.shields.io/badge/License-ISC-yellow.svg)](https://opensource.org/licenses/ISC)

> **SmartBridge Experiential Learning Program — Capstone Project**  
> **Author:** Shiva Prasad  
> StaffSync is a comprehensive, production-ready, full-stack Human Resource Management System designed to digitize workforce operations, attendance monitoring, multi-tiered leave approval workflows, employee upskilling, and organizational announcements.

---

## 🌟 Executive Summary

StaffSync addresses the organizational inefficiencies of decentralized employee records, manual spreadsheet attendance tracking, and delayed leave authorization. Built on the MERN stack with strict Role-Based Access Control (RBAC), StaffSync equips three distinct user tiers—**HR Administrators**, **Department Managers**, and **Employees**—with custom dashboards, operational workflows, and verified server-side security.

---

## 🏛️ System Architecture & Technology Stack

```
StaffSync/
├── client/                     # Frontend Application (React + Vite)
│   ├── public/                 # Static assets & favicon
│   ├── src/
│   │   ├── api/                # Axios instance with JWT interceptors & API services
│   │   ├── components/common/  # Reusable UI (Navbar, Sidebar, Badges, Modals, StatCards)
│   │   ├── context/            # AuthContext (state + token) & ToastContext (alerts)
│   │   ├── layouts/            # MainLayout (with Sidebar & Topbar) & AuthLayout
│   │   ├── pages/              # Landing, Auth, Dashboards, and Module Pages
│   │   ├── routes/             # React Router configuration & ProtectedRoute guards
│   │   ├── utils/              # Formatting helpers (dates, currency, duration)
│   │   ├── App.jsx             # Root React component
│   │   ├── main.jsx            # React DOM mounting
│   │   └── index.css           # Plus Jakarta Sans styling, custom design tokens
│   ├── .env.example            # Client environment variable template
│   ├── index.html              # HTML5 entrypoint
│   └── vite.config.js          # Vite configuration with API reverse proxy
│
├── server/                     # Backend Application (Node.js + Express)
│   ├── src/
│   │   ├── config/             # Mongoose MongoDB connection
│   │   ├── controllers/        # Business logic controllers for all modules
│   │   ├── middleware/         # JWT Auth, Role RBAC, Validator, Error Handling
│   │   ├── models/             # Mongoose Schemas (User, Employee, Attendance, etc.)
│   │   ├── routes/             # RESTful API endpoints
│   │   ├── services/           # Notification dispatch service
│   │   ├── utils/              # DB Seed script with realistic demo data
│   │   ├── app.js              # Express app, CORS, Morgan, Error handlers
│   │   └── server.js           # Server bootstrap & graceful shutdown
│   ├── tests/                  # Automated integration tests (Supertest + node:test)
│   ├── .env.example            # Backend environment variable template
│   └── package.json            # Server dependencies & scripts
│
├── .gitignore                  # Git ignore rules for node_modules, .env, build output
├── package.json                # Root orchestration scripts
└── README.md                   # Full documentation & setup guide
```

### Core Technologies
- **Frontend:** React 18, Vite, React Router DOM v6, Axios, Bootstrap 5, React Bootstrap, Bootstrap Icons.
- **Backend:** Node.js v22+, Express.js, MongoDB, Mongoose ODM, JSON Web Tokens (JWT), bcryptjs, Morgan.
- **Validation & Security:** express-validator, strict CORS whitelist, password hashing (10 salt rounds), query-level data isolation.
- **Testing:** Node.js native test runner (`node:test`, `node:assert`), Supertest.

---

## 👥 Role-Based Access Control (RBAC) Matrix

| Module / Action | HR Administrator | Department Manager | Employee |
|---|:---:|:---:|:---:|
| **Dashboard** | Organization-wide Metrics | Team Shift & Leave Stats | Personal Profile & Shift Tracker |
| **View Employees** | All Employees | Assigned Direct Reports | Self Only |
| **Create / Edit Employees** | Full Permissions | View Only | Permitted Profile Fields Only |
| **Punch Attendance** | Personal Check-in/out | Personal + Team View | Personal Check-in/out |
| **Attendance History** | All Employees | Team Reports | Personal History |
| **Apply for Leave** | Yes | Yes | Yes |
| **Review / Authorize Leaves** | Company-Wide | Assigned Team Members Only | No (Self-review forbidden) |
| **Company Announcements** | Create All / Department | Create Department | View Relevant Announcements |
| **Training Programs** | Create / Edit / Delete | Create / Edit | View / Self-Enroll |
| **Notifications** | Scoped to User | Scoped to User | Scoped to User |

---

## 🔑 Demonstration Accounts

StaffSync comes pre-configured with a database seed command that populates verified accounts with complete employee records, past attendance logs, pending leaves, and active workshops.

| Role | Email Address | Password | Sample Identity |
|---|---|---|---|
| **HR Administrator** | `hr@staffsync.com` | `Password123!` | Sarah Jenkins (Chief HR Officer) |
| **Manager** | `manager@staffsync.com` | `Password123!` | Michael Scott (VP of Engineering) |
| **Employee** | `employee@staffsync.com` | `Password123!` | Alex Morgan (Senior Full Stack Engineer) |

> 💡 **Quick Login Feature:** The login screen (`/login`) includes **1-Click Demo Buttons** for HR Admin, Manager, and Employee to allow instant demonstration without typing.

---

## ⚙️ Prerequisites & Installation

### Prerequisites
1. **Node.js** (v18.0.0 or higher, v22 recommended)
2. **npm** (v9+ or v10+)
3. **MongoDB** (Local instance running on `mongodb://localhost:27017` or MongoDB Atlas URI)

---

### Step-by-Step Setup

#### 1. Clone or Open the Repository
```bash
git clone <repository_url>
cd futureSkillsProject1
```

#### 2. Install Dependencies
You can install dependencies for both the client and server concurrently from the root directory:
```bash
# Install root, backend, and frontend dependencies
npm run install:all
```
*(Or navigate to `server/` and `client/` individually and run `npm install` in each).*

#### 3. Environment Variables Configuration

**Backend (`server/.env`):**
Create `server/.env` or copy from `server/.env.example`:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/staffsync
JWT_SECRET=staffsync_super_secret_jwt_key_2025_experiential_learning
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

**Frontend (`client/.env`):**
Create `client/.env` or copy from `client/.env.example`:
```env
VITE_API_URL=http://localhost:5000/api
```

#### 4. Seed the Database
Run the safe database seed script to populate sample roles, employees, attendance records, leaves, announcements, and training programs:
```bash
npm run seed
```
*(Or inside `server/`: `npm run seed`)*

#### 5. Start Development Servers
Run the backend and frontend development servers:

**Terminal 1 (Backend Server on Port 5000):**
```bash
npm run dev:server
# Server listens at http://localhost:5000
```

**Terminal 2 (Frontend Client on Port 5173):**
```bash
npm run dev:client
# Client accessible at http://localhost:5173
```

Open your browser and navigate to `http://localhost:5173`.

---

## 🧪 Automated Testing

StaffSync features automated integration tests covering authentication, route authorization, business logic constraints, and edge cases.

### What is Tested:
1. **Health Check:** `GET /api/health` returns HTTP 200 OK and uptime metadata.
2. **Authentication:** Validates login, password comparison, token generation, and password hash exclusion.
3. **Role Enforcement:** Prevents privilege escalation during public registration (enforces `Employee` role).
4. **Data Isolation:** Ensures employees only access their own profile and attendance records.
5. **Attendance Integrity:**
   - Single daily check-in validation.
   - Prevents duplicate daily check-in (`400 Bad Request`).
   - Prevents check-out without prior check-in.
6. **Leave Management Rules:**
   - Rejects leave applications where end date is earlier than start date.
   - Detects and rejects overlapping pending or approved leave applications.
   - **Conflict of Interest Prevention:** Prevents managers/HR from approving their own leave requests.
7. **Announcements:** Validates that only HR can broadcast company-wide (`All`) announcements.
8. **Trainings:** Prevents duplicate enrollment in the same workshop.
9. **Notifications:** Verifies recipient-scoped data isolation and read status toggling.
10. **Dashboard:** Verifies that dashboard metrics are computed dynamically from live database records.

### Running the Test Suite
```bash
npm test
```
*(Or inside `server/`: `npm test`)*

Output confirms 100% pass across all integration suites:
```
✔ Health Check: GET /api/health returns 200 OK and healthy status
✔ Auth: Obtain tokens for HR, Manager, and Employee
✔ Employees: HR can create a new employee with user account
✔ Employees: Non-HR (Employee) is forbidden from creating employee records
✔ Employees: Employee only receives their own record when listing employees
✔ Attendance: Employee check-in, duplicate prevention, and check-out cycle
✔ Leaves: Reject leave application when end date is earlier than start date
✔ Leaves: Reject overlapping leave applications
✔ Leaves: Prevent self-approval of leave request
✔ Announcements: HR can create company-wide announcement
✔ Announcements: Non-HR cannot create company-wide announcement
✔ Trainings: Prevent duplicate enrollment in training
✔ Notifications: User can fetch only their own notifications and mark them as read
✔ Dashboard: Returns live role-specific stats for HR and Employee
tests 14 | pass 14 | fail 0
```

---

## 📡 RESTful API Reference

All protected endpoints require the HTTP Header:
`Authorization: Bearer <jwt_token>`

### Health & Auth Endpoints
- `GET  /api/health` — Service health and uptime check
- `POST /api/auth/register` — Public employee registration
- `POST /api/auth/login` — Authenticate and receive JWT token
- `GET  /api/auth/me` — Retrieve current user profile and linked employee record
- `POST /api/auth/logout` — Logout user session

### Employee Management Endpoints
- `GET    /api/employees` — List employees (HR: all, Manager: team, Employee: self)
- `GET    /api/employees/:id` — Get single employee dossier
- `POST   /api/employees` — Create new employee and provision user account (HR only)
- `PUT    /api/employees/:id` — Update employee information (HR: all, Employee: contact fields)
- `DELETE /api/employees/:id` — Deactivate employee and terminate status (HR only)

### Attendance Endpoints
- `POST /api/attendance/check-in` — Record daily check-in with late calculation
- `POST /api/attendance/check-out` — Record daily check-out and work duration
- `GET  /api/attendance/today` — Current day's shift status
- `GET  /api/attendance/my-history` — Paginated personal attendance logs
- `GET  /api/attendance/team` — Team attendance roster for date (Manager/HR)
- `GET  /api/attendance/all` — Company-wide daily attendance summary (HR only)

### Leave Management Endpoints
- `POST  /api/leaves` — Apply for leave with overlap detection
- `GET   /api/leaves/my-leaves` — View personal leave history
- `GET   /api/leaves` — Review queue (HR: all, Manager: team reports)
- `PATCH /api/leaves/:id/review` — Approve/Reject leave with reviewer notes
- `PATCH /api/leaves/:id/cancel` — Cancel pending leave application

### Announcements Endpoints
- `GET    /api/announcements` — View published announcements filtered by audience
- `POST   /api/announcements` — Create announcement (HR: All/Dept, Manager: Dept)
- `PUT    /api/announcements/:id` — Update announcement
- `DELETE /api/announcements/:id` — Delete announcement

### Training Programs Endpoints
- `GET    /api/trainings` — List upcoming/ongoing training workshops
- `POST   /api/trainings` — Create training program (HR / Manager)
- `PUT    /api/trainings/:id` — Update training details / status
- `POST   /api/trainings/:id/enroll` — Self-enroll in training workshop
- `DELETE /api/trainings/:id` — Remove training program (HR only)

### Notifications & Dashboard
- `GET   /api/notifications` — Retrieve user alerts and unread count
- `PATCH /api/notifications/:id/read` — Mark notification as read
- `PATCH /api/notifications/read-all` — Mark all alerts as read
- `DELETE /api/notifications/:id` — Dismiss notification
- `GET   /api/dashboard` — Live role-specific metrics and counters

---

## 🚀 Production Build & Deployment

### Build Frontend Bundle
```bash
cd client
npm run build
```
Creates an optimized production bundle inside `client/dist/`.

### Deployment Instructions (Render / Railway / Heroku / AWS)
1. **Database:** Deploy a MongoDB cluster on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. **Backend Service:**
   - Set Build Command: `cd server && npm install`
   - Set Start Command: `cd server && npm start`
   - Set Environment Variables: `PORT`, `MONGODB_URI`, `JWT_SECRET`, `CLIENT_URL`, `NODE_ENV=production`.
3. **Frontend Service (Vercel / Netlify / Static Host):**
   - Root directory: `client`
   - Build command: `npm run build`
   - Output directory: `dist`
   - Environment Variable: `VITE_API_URL=https://your-backend-api-domain.com/api`

---

## 📄 License
This project is licensed under the **ISC License**. Developed as part of the **SmartBridge Experiential Learning Program Capstone**.
