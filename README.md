# 🔐 SecureAuth — Full-Stack Enterprise Authentication & RBAC Platform (MongoDB Atlas & Mongoose)

A secure, high-performance, and responsive **Full-Stack Authentication & Identity Management System** built with **Node.js, Express, MongoDB Atlas (Mongoose ODM), JWT, Bcrypt, and Nodemailer**. Featuring a complete multi-page architecture, Role-Based Access Control (RBAC), an interactive SaaS User Dashboard, an Admin Management Portal, an Interactive OpenAPI Documentation page with live testing console, and a comprehensive 5-tier security defense suite.

---

## 🌟 Key Features & Architecture

### 1. 🖥️ Multi-Page Web Application Suite
- **`/` (Showcase Landing Page)**: Modern hero section, live security metrics, enterprise feature showcase, and architecture diagram.
- **`/login` (Dedicated Sign-In Page)**:
  - **1-Click Evaluator Demo Credentials**: Instant autofill buttons for `Admin Demo` and `User Demo` for viva evaluation.
  - Brute-force lockout alerts with countdown timer.
  - Password visibility toggle & "Remember Me" option.
- **`/register` (Dedicated Sign-Up Page)**:
  - **Real-Time Password Strength Meter**: Dynamic color-coded bar (Red -> Amber -> Blue -> Green) with live rule verification (8+ chars, uppercase, lowercase, numbers, symbols).
  - Role selection for evaluator testing (`user` or `admin`).
  - Confirm password validation.
- **`/forgot-password` (3-Step OTP Wizard)**:
  - Step 1: Registered email input with development OTP fallback display.
  - Step 2: 6-digit auto-advancing, paste-enabled OTP inputs with a 60-second cooldown resend timer.
  - Step 3: New password creation with confirmation.
- **`/dashboard` (SaaS User Portal with Sidebar)**:
  - **Overview**: Security health score (98%), active JWT status, member since date, and architecture highlights.
  - **Profile Settings**: Update display name, view registered email & role.
  - **Security Center**: Change Password form (verifies current password before updating) and Active Session tracker with recent login history (IP, device, timestamp, status).
  - **Token & API Playground**: Live JWT Bearer token viewer with copy button, decoded token claims inspector, and live "Test Protected Profile" request simulator.
- **`/admin` (Admin Management Portal — RBAC Protected)**:
  - **KPI Metrics**: Total Users, Active Users, Administrators, New Registrations (24h), and Locked Accounts.
  - **User Directory Table**: Real-time search filter by name or email, role toggle (Promote to Admin / Demote to User), account status toggle (Activate / Suspend), and secure user deletion.
  - **System-Wide Security Audit Trail**: Live log of all user authentication events with IP, client device, and status.
- **`/docs` (Interactive API Documentation)**:
  - Swagger-style interactive playground where examiners can test any REST endpoint live and inspect the real JSON response and HTTP status codes.

---

### 2. 🛡️ Enterprise Security Hardening
1. **Role-Based Access Control (RBAC)**: Segregated permissions using `authorizeRoles("admin")` middleware preventing unauthorized access to administrative endpoints.
2. **Account Lockout Defense**: Automatically locks an account for 15 minutes after 5 consecutive incorrect login passwords, defeating credential stuffing and dictionary attacks.
3. **Password Hashing**: Salted and hashed with `bcrypt` (10 rounds) before storage. Length strictly capped at 128 characters to prevent ReDoS / CPU exhaustion.
4. **Brute-Force OTP Lockout**: Invalidation and purge of OTP after 5 consecutive incorrect verification attempts.
5. **Single-Use Replay Attack Defense**: OTP fields are wiped from MongoDB (`otp: null, otpExpiresAt: null, otpAttempts: 0`) immediately upon password update.
6. **Time-To-Live (TTL)**: OTP codes strictly expire in 10 minutes.
7. **Multi-Tier Rate Limiting**: `express-rate-limit` protects against DDoS and credential stuffing on General APIs (100 req/15m), Auth endpoints (30 req/15m), and OTP endpoints (10 req/15m).
8. **HTTP Security Headers (Helmet)**: Strict CSP, framing restrictions (clickjacking defense), `X-Content-Type-Options: nosniff`, and hiding `X-Powered-By`.
9. **NoSQL Injection Prevention**: Strict type-checking rejects query operator injection payloads.
10. **Payload Size Capping**: Limits JSON payloads to 20kb to prevent Denial of Service (DoS) memory exhaustion.
11. **JWT Verification**: Protected endpoints validate tokens using `jsonwebtoken` and reject expired, forged, or malformed tokens.
12. **ObjectId Validation**: Prevents `CastError` vulnerabilities by validating MongoDB ObjectIds before database lookups.
13. **DOM XSS Defense**: Safe DOM node creation for UI notifications.

---

## 🛠️ Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Backend** | Node.js, Express.js (v5.2.1) |
| **Database** | MongoDB Atlas Cloud / Local MongoDB (via `mongoose` ODM v9.11.4) |
| **Authentication & RBAC** | JSON Web Tokens (`jsonwebtoken`), Bcrypt (`bcrypt`), Custom RBAC Middleware |
| **Email Delivery** | Nodemailer (Pooled Gmail SMTP / Direct SSL Port 465) |
| **Testing** | Jest, Supertest (TDD methodology) |
| **Frontend** | Vanilla HTML5, Modern CSS (Glassmorphism Dark System), Vanilla JavaScript, Lucide Icons |
| **Deployment** | Vercel Serverless Ready (`vercel.json`, `api/index.js`) |

---

## 📁 Project Directory Structure

```text
Authentication-Project/
├── api/
│   └── index.js               # Vercel serverless entry point
├── backend/
│   ├── config/
│   │   └── db.js              # MongoDB connection via Mongoose
│   ├── controllers/
│   │   ├── authController.js  # Register, Login, OTP, Profile, Change Password, Sessions
│   │   └── adminController.js # Admin stats, User management, Status/Role toggle, Audit logs
│   ├── middleware/
│   │   ├── authMiddleware.js  # JWT Bearer token verification middleware
│   │   ├── roleMiddleware.js  # Role-Based Access Control (RBAC) middleware
│   │   └── rateLimiter.js     # Multi-tier express-rate-limit middleware
│   ├── models/
│   │   └── User.js            # User Schema (role, isActive, lockUntil, loginHistory)
│   ├── public/                # Static multi-page web application
│   ├── routes/
│   │   ├── authRoutes.js      # Public & protected authentication endpoints
│   │   └── adminRoutes.js     # Admin RBAC protected endpoints
│   ├── tests/                 # TDD Automated Testing Suite
│   │   ├── unit/              # Unit tests (roleMiddleware, authMiddleware, User model, etc.)
│   │   └── integration/       # End-to-end HTTP API integration tests
│   ├── utils/
│   │   └── sendEmail.js       # Pooled Nodemailer email sender utility
│   ├── .env                   # Environment variables (Ignored in Git)
│   ├── .env.example           # Template for environment variables
│   ├── package.json           # Backend dependencies and scripts
│   └── server.js              # Express server & clean multi-page routing
├── public/                    # Root static assets for Vercel deployment
│   ├── index.html             # Showcase Landing Page
│   ├── login.html             # Dedicated Login Page with 1-Click Demo Pills
│   ├── register.html          # Registration Page with Password Strength Meter
│   ├── forgot-password.html   # 3-Step OTP Password Reset Wizard
│   ├── dashboard.html         # SaaS User Portal with Sidebar
│   ├── admin.html             # Admin Management Portal (RBAC)
│   ├── docs.html              # Interactive API Docs & Live Tester
│   ├── auth-helper.js         # Shared client authentication utilities
│   └── style.css              # Glassmorphic Design System
├── package.json               # Root package script runner
├── vercel.json                # Vercel deployment routing configuration
└── README.md                  # Comprehensive Documentation
```

---

## ⚙️ Installation & Setup

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v18+ recommended)
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) Account or Local MongoDB Server

### 2. Clone & Install Dependencies
```bash
git clone https://github.com/AnshGour16/Authentication-System.git
cd Authentication-System
npm install
cd backend
npm install
```

### 3. Configure Environment Variables
Create a `.env` file in the `backend/` directory based on `.env.example`:

```env
# MongoDB Atlas Connection URI
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/authentication_db?retryWrites=true&w=majority
PORT=5000

# JWT Secret Key
JWT_SECRET=your_super_secret_jwt_key_here

# Nodemailer Email Configuration (For Sending Real OTPs)
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_16_digit_gmail_app_password
EMAIL_SERVICE=gmail
```

---

## 🚀 Running the Project

### Start Development Server:
```bash
npm run dev
```

### Run Unit Tests:
```bash
cd backend
npx jest tests/unit
```

### Accessing the Web Pages:
Navigate to any of the following URLs in your browser:
- 👉 **Landing Page**: `http://localhost:5000/`
- 👉 **Sign In**: `http://localhost:5000/login`
- 👉 **Create Account**: `http://localhost:5000/register`
- 👉 **Forgot Password**: `http://localhost:5000/forgot-password`
- 👉 **User Dashboard**: `http://localhost:5000/dashboard`
- 👉 **Admin Portal**: `http://localhost:5000/admin`
- 👉 **Interactive API Docs**: `http://localhost:5000/docs`

---

## 📡 REST API Reference

### 1. Public Authentication Routes (`/api/auth`)
| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Register new user with password hashing & role | Public |
| `POST` | `/api/auth/login` | Authenticate credentials; lockout on 5 fails; returns JWT | Public |
| `POST` | `/api/auth/forgot-password` | Generate 6-digit OTP and send via SSL email | Public |
| `POST` | `/api/auth/verify-otp` | Verify 6-digit OTP (invalidates after 5 bad attempts) | Public |
| `POST` | `/api/auth/reset-password` | Reset password using verified OTP | Public |

### 2. Protected User Routes (`/api/auth`) — Requires `Authorization: Bearer <token>`
| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/auth/profile` | Retrieve profile metadata, role, and last login | Authenticated |
| `PUT` | `/api/auth/profile` | Update display name | Authenticated |
| `POST` | `/api/auth/change-password` | Change password (verifies current password) | Authenticated |
| `GET` | `/api/auth/sessions` | View active session details and login audit history | Authenticated |

### 3. Administrative RBAC Routes (`/api/admin`) — Requires `role: admin`
| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/admin/stats` | System KPI counts (Total users, active, admins, locked) | Admin Only |
| `GET` | `/api/admin/users` | List all users (supports `?search=` query) | Admin Only |
| `PATCH` | `/api/admin/users/:id/role` | Promote/demote user role (`user` vs `admin`) | Admin Only |
| `PATCH` | `/api/admin/users/:id/status` | Activate or suspend user account | Admin Only |
| `DELETE` | `/api/admin/users/:id` | Permanently delete user | Admin Only |
| `GET` | `/api/admin/audit-logs` | Retrieve system-wide security audit trail | Admin Only |

---

## 📄 License
This project is open-source and available under the ISC License.
