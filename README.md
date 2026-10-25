# 🔐 Full-Stack Authentication & OTP Reset System (MongoDB Atlas & Mongoose)

A secure, high-performance, and responsive **Full-Stack Authentication System** built with **Node.js, Express, MongoDB Atlas (Mongoose ODM), JWT, Bcrypt, and Nodemailer**. Featuring a complete user lifecycle: Registration, Login, and a 3-Step OTP-based Password Reset with a glassmorphism UI, comprehensive security hardening (Helmet, Rate Limiting, Brute-Force lockout), and a full 38-test TDD automated testing suite.

---

## 🌟 Key Features

- **User Registration**: Real-time validation, duplicate email check, max-length protection, and salted password hashing using `bcrypt`.
- **JWT Authentication**: Secure login issuing JSON Web Tokens (JWT) for stateless session management with 24-hour expiration.
- **Instant OTP Forgot Password Flow**:
  - Secure random 6-digit OTP generation with 10-minute Time-To-Live (TTL).
  - **High-Speed Direct SSL Email Delivery**: Configured via direct SSL (`smtp.gmail.com:465`) for fast transmission to user inboxes.
  - Includes a development console fallback if SMTP is not configured.
- **Enterprise-Grade Brute Force & Replay Defense**:
  - **OTP Lockout**: Automatically tracks failed attempts and invalidates the OTP after 5 consecutive incorrect guesses.
  - **Single-Use Replay Defense**: OTP fields are wiped immediately upon password reset.
- **Security Hardening**:
  - **Helmet HTTP Headers**: Custom Content Security Policy (CSP), clickjacking defense, nosniff, and cross-origin controls.
  - **Rate Limiting**: Multi-tier rate limiting via `express-rate-limit` for General APIs (100 req/15m), Auth endpoints (30 req/15m), and OTP endpoints (10 req/15m).
  - **NoSQL Injection Prevention**: Strict type-checking against operator injection payloads.
  - **Payload Size Capping**: Limits request bodies to 20kb to prevent Denial of Service (DoS) memory exhaustion.
  - **DOM XSS Defense**: Safe DOM text node construction in frontend toast notifications.
- **Protected Profile Route**: JWT Bearer token authentication middleware with MongoDB ObjectId validation.
- **Glassmorphism Frontend UI**: Built-in responsive UI with animated toast notifications, password show/hide toggles, 6-digit auto-focusing OTP inputs, and a 60-second resend countdown timer.
- **Complete TDD Test Suite**: 38 automated Unit and Integration tests across 5 test suites using **Jest** and **Supertest**.

---

## 🛠️ Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Backend** | Node.js, Express.js |
| **Database** | MongoDB Atlas Cloud / Local MongoDB (via `mongoose` ODM) |
| **Authentication** | JSON Web Tokens (`jsonwebtoken`), Bcrypt (`bcrypt`) |
| **Email Delivery** | Nodemailer (Pooled Gmail SMTP / App Password) |
| **Testing** | Jest, Supertest (TDD methodology) |
| **Frontend** | Vanilla HTML5, Modern CSS (Glassmorphism), Vanilla JavaScript, Lucide Icons |

---

## 📁 Project Directory Structure

```text
Authentication-Project/
├── backend/
│   ├── config/
│   │   └── db.js              # MongoDB connection via Mongoose
│   ├── controllers/
│   │   └── authController.js  # Controller logic (Register, Login, OTP, Reset, Profile)
│   ├── middleware/
│   │   ├── authMiddleware.js  # JWT Bearer token verification middleware
│   │   └── rateLimiter.js     # Multi-tier express-rate-limit middleware
│   ├── models/
│   │   └── User.js            # Mongoose Schema & User model
│   ├── public/                # Frontend static assets
│   │   ├── app.js             # Client-side validation & API integration
│   │   ├── index.html         # Responsive authentication single-page UI
│   │   └── style.css          # Glassmorphic dark design system
│   ├── routes/
│   │   └── authRoutes.js      # Public & protected authentication endpoints
│   ├── tests/                 # TDD Automated Testing Suite
│   │   ├── unit/              # Unit tests (authMiddleware, User model, sendEmail, rateLimiter)
│   │   └── integration/       # End-to-end HTTP API integration tests
│   ├── utils/
│   │   └── sendEmail.js       # Pooled Nodemailer email sender utility
│   ├── .env                   # Environment variables (Ignored in Git)
│   ├── .env.example           # Template for environment variables
│   ├── package.json           # Dependencies and scripts (dev, test, start)
│   └── server.js              # Main Express server entry point
├── .gitignore                 # Git ignore file (protects secrets & node_modules)
└── README.md                  # Project documentation
```

---

## ⚙️ Installation & Setup

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v18+ recommended)
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) Account or Local MongoDB Server

### 2. Clone / Open the Project
```bash
git clone https://github.com/AnshGour16/Authentication-System.git
cd Authentication-System/backend
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Configure Environment Variables
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

> **Note on Gmail App Password**: Go to [Google Security](https://myaccount.google.com/security) ➔ Enable 2-Step Verification ➔ Generate **App Password** ➔ Paste the 16-character key into `EMAIL_PASS`.

---

## 🚀 Running the Project

### Start Development Server (with Auto-Reload):
```bash
npm run dev
```

### Run Automated Unit & Integration Tests (TDD):
```bash
npm test
```
*Executes all 31 automated tests across 4 test suites (User Model schema validation, authMiddleware JWT verification, sendEmail utility, and end-to-end HTTP auth routes).*

### Start Production Server:
```bash
npm start
```

Once running, open your browser and navigate to:
👉 **`http://localhost:5000`**

---

## 📡 API Reference

### Base URL: `/api/auth`

#### 1. Register User
- **Endpoint:** `POST /api/auth/register`
- **Body:**
  ```json
  {
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123"
  }
  ```
- **Response (201 Created):**
  ```json
  {
    "success": true,
    "message": "User registered successfully",
    "userId": "671ad89e7f3a9b1c2d3e4f5a"
  }
  ```

#### 2. Login User
- **Endpoint:** `POST /api/auth/login`
- **Body:**
  ```json
  {
    "email": "john@example.com",
    "password": "password123"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Login successful",
    "token": "<JWT_TOKEN>",
    "user": {
      "id": "671ad89e7f3a9b1c2d3e4f5a",
      "name": "John Doe",
      "email": "john@example.com"
    }
  }
  ```

#### 3. Forgot Password (Request OTP)
- **Endpoint:** `POST /api/auth/forgot-password`
- **Body:**
  ```json
  {
    "email": "john@example.com"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "OTP sent successfully to your email",
    "email": "john@example.com"
  }
  ```

#### 4. Verify OTP
- **Endpoint:** `POST /api/auth/verify-otp`
- **Body:**
  ```json
  {
    "email": "john@example.com",
    "otp": "584920"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "OTP verified successfully"
  }
  ```

#### 5. Reset Password
- **Endpoint:** `POST /api/auth/reset-password`
- **Body:**
  ```json
  {
    "email": "john@example.com",
    "otp": "584920",
    "newPassword": "NewStrongPassword456"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Password reset successfully! You can now log in with your new password."
  }
  ```

#### 6. Get User Profile (Protected)
- **Endpoint:** `GET /api/auth/profile`
- **Headers:** `Authorization: Bearer <JWT_TOKEN>`
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "user": {
      "id": "671ad89e7f3a9b1c2d3e4f5a",
      "name": "John Doe",
      "email": "john@example.com",
      "created_at": "2026-10-25T00:00:00.000Z"
    }
  }
  ```

---

## 🔒 Security Best Practices Implemented

1. **Password Hashing**: Passwords are salted and hashed with `bcrypt` (10 rounds) before storage. Length capped at 128 characters to eliminate ReDoS / CPU exhaustion.
2. **Brute Force Defense & OTP Lockout**: Automatic attempt tracking locks out and wipes OTP after 5 consecutive failed verification attempts.
3. **Single-Use Replay Attack Defense**: OTP fields are wiped from MongoDB (`otp: null, otpExpiresAt: null, otpAttempts: 0`) immediately upon password update.
4. **Time Expiration**: OTPs strictly expire in 10 minutes.
5. **Multi-Tier Rate Limiting**: `express-rate-limit` protects against DDoS and credential stuffing on auth and OTP routes.
6. **HTTP Security Headers (Helmet)**: Strict CSP, framing restrictions (clickjacking protection), X-Content-Type-Options nosniff, and hiding `X-Powered-By`.
7. **NoSQL Injection Prevention**: Strict type-checking rejects query operator injection payloads.
8. **Request Body Size Capping**: Limits JSON payloads to 20kb to prevent memory exhaustion attacks.
9. **JWT Verification**: Protected endpoints validate tokens using `jsonwebtoken` and reject expired, forged, or malformed tokens.
10. **ObjectId Validation**: Prevents CastError vulnerabilities by validating MongoDB ObjectIds before database lookups.
11. **DOM XSS Defense**: Safe DOM node creation for UI notifications.

---

## 🧪 Automated Testing Results

```text
PASS tests/integration/authRoutes.test.js
PASS tests/unit/rateLimiter.test.js
PASS tests/unit/User.model.test.js
PASS tests/unit/authMiddleware.test.js
PASS tests/unit/sendEmail.test.js

Test Suites: 5 passed, 5 total
Tests:       38 passed, 38 total
Snapshots:   0 total
Ran all test suites.
```

---

## 📄 License
This project is open-source and available under the ISC License.
