

# 🔐 Modern Full-Stack Authentication & OTP Reset System

A secure, scalable, and responsive **Authentication System** built with **Node.js, Express, MySQL, JWT, Bcrypt, and Nodemailer**. Featuring a complete user lifecycle: Registration, Login, and a 3-Step OTP-based Forgot Password flow with a glassmorphism UI.

---

## 🌟 Key Features

- **User Registration**: Real-time validation, duplicate email check, and password hashing using `bcrypt`.
- **JWT Authentication**: Secure login issuing JSON Web Tokens (JWT) for session management.
- **Forgot Password via OTP**:
  - Generates secure random 6-digit OTPs.
  - Automatically calculates 10-minute Time-To-Live (TTL).
  - Delivers HTML-formatted OTP emails directly to the user's inbox via **Nodemailer**.
  - Includes a development console fallback if SMTP is not configured.
- **Single-Use OTP Security**: OTPs are permanently invalidated (`NULL`) after a successful password reset to prevent replay attacks.
- **Protected Profile Route**: JWT Bearer token authentication middleware (`authMiddleware`).
- **Auto Database Migration**: Automatically verifies and creates `users` table along with `otp` & `otp_expires_at` columns on server start.
- **Glassmorphism Frontend UI**: Built-in interactive frontend with toast notifications, password visibility toggles, 6-digit auto-focus OTP inputs, and a 60-second resend timer.

---

## 🛠️ Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Backend** | Node.js, Express.js |
| **Database** | MySQL (with `mysql2` connection pooling) |
| **Authentication** | JSON Web Tokens (`jsonwebtoken`), Bcrypt (`bcrypt`) |
| **Email Delivery** | Nodemailer (Gmail SMTP / App Password) |
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
│   │   └── authMiddleware.js  # JWT Bearer token verification middleware
│   ├── models/
│   │   └── User.js            # Mongoose Schema & User model
│   ├── public/                # Frontend static assets
│   │   ├── app.js             # Client-side validation & API integration
│   │   ├── index.html         # Responsive authentication single-page UI
│   │   └── style.css          # Glassmorphic dark design system
│   ├── routes/
│   │   └── authRoutes.js      # Public & protected authentication endpoints
│   ├── tests/                 # TDD Automated Testing Suite
│   │   ├── unit/              # Unit tests (authMiddleware, User model, sendEmail)
│   │   └── integration/       # End-to-end HTTP API integration tests
│   ├── utils/
│   │   └── sendEmail.js       # Pooled Nodemailer email sender utility
│   ├── .env                   # Environment variables (Ignored in Git)
│   ├── .env.example           # Template for environment variables
│   ├── package.json           # Dependencies and scripts (dev, test, start)
│   └── server.js              # Main Express server entry point
├── .gitignore                 # Git ignore file
└── README.md                  # Project documentation
```

---

## ⚙️ Installation & Setup

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v16+ recommended)
- [MySQL Server](https://www.mysql.com/) installed and running locally

### 2. Clone / Open the Project
```bash
cd Authentication-Project/backend
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Configure Environment Variables
Create a `.env` file in the `backend/` folder based on `.env.example`:

```env
# Database Credentials
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=authentication_db
DB_PORT=3306

# JWT Secret
JWT_SECRET=your_super_secret_jwt_key_123

# Email Credentials (Optional: for sending real emails via Gmail)
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
*Executes 31 automated test cases across 4 test suites (User Model schema validation, authMiddleware JWT verification, sendEmail utility, and end-to-end HTTP auth routes).*

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
    "userId": 1
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
      "id": 1,
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
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "created_at": "2026-09-07T00:00:00.000Z"
    }
  }
  ```

---

## 🔒 Security Best Practices Implemented

1. **Password Hashing**: Passwords are never stored in plain text; salted and hashed with `bcrypt` (10 rounds).
2. **Replay Attack Defense**: OTP fields are wiped from the database (`otp = NULL, otp_expires_at = NULL`) immediately upon password update.
3. **Time Expiration**: OTPs strictly expire in 10 minutes.
4. **JWT Verification**: Protected endpoints validate tokens using `jsonwebtoken` and reject expired or tampered tokens.
5. **CORS Protected**: Configured via Express CORS middleware for secure cross-origin requests.

---

## 📄 License
This project is open-source and available under the ISC License.
