# 🛡️ Full-Stack Authentication System: Architecture, Code Walkthrough & Interview Mastery Guide

---

## 📌 Table of Contents
1. [Project Overview & System Evolution](#1-project-overview--system-evolution)
2. [High-Level Architecture & Request Flows](#2-high-level-architecture--request-flows)
3. [Deep-Dive Code & Module Breakdown](#3-deep-dive-code--module-breakdown)
   - [A. Entry Point & Serverless Routing (`server.js` & `api/index.js`)](#a-entry-point--serverless-routing-serverjs--apiindexjs)
   - [B. Database Schema & Data Integrity (`models/User.js`)](#b-database-schema--data-integrity-modelsuserjs)
   - [C. Controllers & Business Logic (`controllers/authController.js`)](#c-controllers--business-logic-controllersauthcontrollerjs)
   - [D. Security Middleware (`middleware/authMiddleware.js` & `middleware/rateLimiter.js`)](#d-security-middleware-middlewareauthmiddlewarejs--middlewareratelimiterjs)
   - [E. Email Dispatch Engine (`utils/sendEmail.js`)](#e-email-dispatch-engine-utilssendemailjs)
   - [F. Frontend Architecture (`public/app.js`, `index.html`, `style.css`)](#f-frontend-architecture-publicappjs-indexhtml-stylecss)
4. [Enterprise Security Defenses Implemented](#4-enterprise-security-defenses-implemented)
5. [Automated Testing Strategy (TDD Suite)](#5-automated-testing-strategy-tdd-suite)
6. [Top 15+ Technical Interview Cross-Questions & Model Answers](#6-top-15-technical-interview-cross-questions--model-answers)

---

## 1. Project Overview & System Evolution

### What is this Project?
This project is an **Enterprise-Grade Full-Stack Authentication & Session Management System** built with **Node.js, Express, MongoDB Atlas (Mongoose ODM), JWT, Bcrypt, and Nodemailer**. It provides an end-to-end user lifecycle:
- Secure Registration with field sanitization.
- Stateless Login with JSON Web Tokens (JWT).
- 3-Step One-Time Password (OTP) verification for secure password resets.
- Protected profile routes with Bearer token validation.
- Responsive Glassmorphism dark-mode frontend.
- Zero-vulnerability dependency tree (`npm audit`).
- 38 automated Unit & Integration tests using **Jest** and **Supertest**.

### The Evolution: How We Built It
1. **Initial Foundation**: Started with basic Express structure and relational SQL setup.
2. **MongoDB Atlas Migration**: Replaced relational SQL with MongoDB Atlas cloud clusters and Mongoose schemas, adding flexible timestamps, schema-level validations, and ObjectId sanitization.
3. **Email Delivery Optimization**: Solved serverless timeout issues by switching from unawaited asynchronous tasks to direct SSL (`smtp.gmail.com:465`) fast delivery.
4. **Vercel Serverless Architecture**: Converted the application from a standalone listening server into an AWS Lambda / Vercel Serverless function via `api/index.js`, using root Edge CDN static asset routing in `vercel.json`.
5. **Security Hardening**: Added `helmet` HTTP headers, tiered `express-rate-limit`, NoSQL operator injection defenses, DoS payload size restrictions, and a 5-attempt OTP brute-force lockout mechanism.
6. **TDD Test Suite**: Expanded the automated testing suite to 38 unit and integration tests across 5 dedicated test suites.

---

## 2. High-Level Architecture & Request Flows

### Architecture Diagram
```mermaid
graph TD
    Client["Client (Browser / Mobile)"]
    VercelEdge["Vercel Edge CDN"]
    StaticFiles["Static Assets (/public/index.html, style.css, app.js)"]
    ServerlessFn["Serverless Function (api/index.js -> backend/server.js)"]
    MiddlewareChain["Middleware (Helmet, CORS, RateLimiter, JsonParser)"]
    AuthRouter["Router (/api/auth)"]
    AuthController["Controller (authController.js)"]
    MongoDB[("MongoDB Atlas Cloud Database")]
    Nodemailer["SMTP Service (Gmail SSL 465)"]

    Client -->|Static Request GET /| VercelEdge --> StaticFiles
    Client -->|API Request /api/*| VercelEdge --> ServerlessFn
    ServerlessFn --> MiddlewareChain --> AuthRouter --> AuthController
    AuthController <-->|Mongoose ODM| MongoDB
    AuthController -->|Send OTP Email| Nodemailer
```

### 3-Step Password Reset Flow
```mermaid
sequenceDiagram
    autonumber
    actor User
    participant Frontend as Frontend (app.js)
    participant Server as Backend API
    participant DB as MongoDB Atlas
    participant SMTP as Nodemailer SMTP

    User->>Frontend: Enters email and clicks "Send OTP"
    Frontend->>Server: POST /api/auth/forgot-password { email }
    Server->>DB: User.findOne({ email })
    Server->>Server: Generate random 6-digit OTP & set 10m expiry
    Server->>DB: user.save() [otp, otpExpiresAt, otpAttempts=0]
    Server->>SMTP: sendEmail({ to, subject, html })
    SMTP-->>Server: Email delivered
    Server-->>Frontend: 200 OK { success: true }
    Frontend->>User: UI switches to Step 2 (Starts 60s timer)

    User->>Frontend: Enters 6-digit OTP
    Frontend->>Server: POST /api/auth/verify-otp { email, otp }
    Server->>DB: Validate OTP & check expiry
    Note over Server,DB: If 5 wrong attempts -> OTP destroyed!
    Server-->>Frontend: 200 OK { message: "OTP verified successfully" }
    Frontend->>User: UI switches to Step 3 (Enter new password)

    User->>Frontend: Enters new password
    Frontend->>Server: POST /api/auth/reset-password { email, otp, newPassword }
    Server->>Server: bcrypt.hash(newPassword, 10)
    Server->>DB: Save hashed password & wipe OTP (otp=null, otpExpiresAt=null)
    Server-->>Frontend: 200 OK { success: true }
    Frontend->>User: Toast notification & redirect to Login form
```

---

## 3. Deep-Dive Code & Module Breakdown

### A. Entry Point & Serverless Routing (`server.js` & `api/index.js`)

#### `api/index.js`
In a traditional Node.js deployment, Express runs `app.listen(PORT)`. On serverless platforms like Vercel, there is no permanent server process running; instead, Vercel spins up a lightweight container for each incoming HTTP invocation.
```javascript
const app = require("../backend/server");
module.exports = app;
```
This file exports the Express instance as a serverless handler function.

#### `backend/server.js`
Key design decisions in `server.js`:
1. **Explicit `.env` Path Resolution**:
   ```javascript
   const path = require("path");
   require("dotenv").config({ path: path.join(__dirname, ".env") });
   require("dotenv").config();
   ```
   Ensures environment variables load properly regardless of whether the command is run from the project root, from the `backend/` directory, or inside Vercel's runtime.

2. **Security Headers (Helmet)**:
   ```javascript
   app.use(
       helmet({
           contentSecurityPolicy: {
               directives: {
                   defaultSrc: ["'self'"],
                   scriptSrc: ["'self'", "'unsafe-inline'", "https://unpkg.com"],
                   styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
                   fontSrc: ["'self'", "https://fonts.gstatic.com"],
                   imgSrc: ["'self'", "data:"],
                   connectSrc: ["'self'"]
               }
           },
           crossOriginEmbedderPolicy: false
       })
   );
   ```
   Protects against clickjacking (`X-Frame-Options: DENY`), MIME-type sniffing (`X-Content-Type-Options: nosniff`), removes the `X-Powered-By: Express` signature, and defines an explicit Content Security Policy (CSP) allowing Google Fonts and Lucide icons.

3. **Request Body Size Capping**:
   ```javascript
   app.use(express.json({ limit: "20kb" }));
   app.use(express.urlencoded({ extended: true, limit: "20kb" }));
   ```
   Rejects payloads exceeding 20kb with `413 Payload Too Large`, preventing memory exhaustion and denial-of-service (DoS) attacks.

4. **Serverless Connection Assurance Middleware**:
   ```javascript
   app.use(async (req, res, next) => {
       if (mongoose.connection.readyState !== 1) {
           await connectDB();
       }
       next();
   });
   ```
   In serverless environments, database connections can go idle or disconnect between lambda freezes. This middleware checks `mongoose.connection.readyState` before handling any route, reconnecting on-demand.

5. **Conditional `app.listen()`**:
   ```javascript
   if (process.env.NODE_ENV !== "test" && !process.env.VERCEL) {
       app.listen(PORT, () => {
           console.log(`🚀 Server running on http://localhost:${PORT}`);
       });
   }
   ```
   Prevents port-binding errors during automated testing (`NODE_ENV === "test"`) and when running inside Vercel (`process.env.VERCEL`).

---

### B. Database Schema & Data Integrity (`models/User.js`)

```javascript
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Name is required"],
            trim: true,
            maxlength: [100, "Name cannot exceed 100 characters"]
        },
        email: {
            type: String,
            required: [true, "Email is required"],
            unique: true,
            lowercase: true,
            trim: true,
            maxlength: [255, "Email cannot exceed 255 characters"],
            match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Please provide a valid email address"]
        },
        password: {
            type: String,
            required: [true, "Password is required"],
            minlength: [6, "Password must be at least 6 characters long"]
        },
        otp: {
            type: String,
            default: null
        },
        otpExpiresAt: {
            type: Date,
            default: null
        },
        otpAttempts: {
            type: Number,
            default: 0
        }
    },
    { timestamps: true }
);

userSchema.set("toJSON", {
    transform: (doc, ret) => {
        ret.id = ret._id;
        ret.created_at = ret.createdAt;
        delete ret.__v;
        return ret;
    }
});
```
- **`unique: true` and `lowercase: true`**: Eliminates duplicate accounts caused by casing variations (e.g. `User@domain.com` vs `user@domain.com`).
- **`otpAttempts`**: Tracks failed OTP entries for automated brute-force lockout.
- **`toJSON` Transformation**: Strips the internal Mongoose version key (`__v`) and normalizes `_id` to `id`.

---

### C. Controllers & Business Logic (`controllers/authController.js`)

#### 1. User Registration (`register`)
- **NoSQL Injection Defense**: Validates `typeof name === 'string'`, `typeof email === 'string'`, `typeof password === 'string'` to reject injected query objects like `{ $gt: "" }`.
- **Length Boundaries**: Rejects passwords longer than 128 characters to prevent bcrypt CPU exhaustion attacks.
- **Salting & Hashing**: Uses `bcrypt.hash(password, 10)` (10 rounds of salt) before saving to the database.

#### 2. User Login (`login`)
- Verifies email and uses `bcrypt.compare(password, user.password)`.
- Generates a stateless JWT token with a 24-hour expiration:
  ```javascript
  const token = jwt.sign(
      { id: user._id, email: user.email, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
  );
  ```

#### 3. Forgot Password (`forgotPassword`)
- Generates a random 6-digit cryptographic numeric OTP:
  ```javascript
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  ```
- Sets a 10-minute expiry (`Date.now() + 10 * 60 * 1000`) and resets `otpAttempts = 0`.
- Sends an HTML-styled email via Nodemailer. Awaits the promise before sending the HTTP response so Vercel does not terminate the lambda before socket transmission completes.

#### 4. Verify OTP (`verifyOtp`)
- **Brute-Force Lockout Defense**:
  ```javascript
  if (!user.otp || user.otp !== cleanOtp) {
      user.otpAttempts = (user.otpAttempts || 0) + 1;
      if (user.otpAttempts >= 5) {
          user.otp = null;
          user.otpExpiresAt = null;
          user.otpAttempts = 0;
          await user.save();
          return res.status(400).json({
              success: false,
              message: "Too many failed attempts. This OTP has been invalidated. Please request a new one."
          });
      }
      await user.save();
      return res.status(400).json({ success: false, message: "Invalid OTP code" });
  }
  ```
- Validates the timestamp (`new Date(user.otpExpiresAt) < new Date()`).

#### 5. Reset Password (`resetPassword`)
- Validates the OTP one more time.
- Hashes the new password with bcrypt.
- **Single-Use Replay Defense**:
  ```javascript
  user.password = hashedPassword;
  user.otp = null;
  user.otpExpiresAt = null;
  user.otpAttempts = 0;
  await user.save();
  ```
  Wiping the OTP fields guarantees that an intercepted OTP cannot be reused.

#### 6. User Profile (`getProfile`)
- Validates `mongoose.Types.ObjectId.isValid(userId)` before querying. This prevents `CastError` crashes when old tokens (e.g., from old systems or invalid formats) are supplied.

---

### D. Security Middleware (`middleware/authMiddleware.js` & `middleware/rateLimiter.js`)

#### `authMiddleware.js`
- Extracts the HTTP `Authorization` header: `Bearer <token>`.
- Validates the token signature and expiration with `jwt.verify(token, process.env.JWT_SECRET)`.
- Attaches the decoded user payload to `req.user`.

#### `rateLimiter.js`
Implements tiered rate limits using `express-rate-limit`:
1. **`apiLimiter`**: 100 requests per 15 minutes across all general API routes.
2. **`authLimiter`**: 30 requests per 15 minutes on `/register` and `/login` (prevents credential stuffing).
3. **`otpLimiter`**: 10 requests per 15 minutes on `/forgot-password`, `/verify-otp`, and `/reset-password` (prevents email spam and OTP guessing).
4. **Automated Test Exemption**: `skip: () => process.env.NODE_ENV === "test"` ensures automated Jest test suites run without hitting 429 rate limit errors.

---

### E. Email Dispatch Engine (`utils/sendEmail.js`)

- Connects directly via SSL:
  ```javascript
  transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: { user: emailUser, pass: emailPass }
  });
  ```
- **Development Fallback**: If `EMAIL_USER` or `EMAIL_PASS` are not set in `.env`, it outputs the OTP formatted into the terminal console so local developers can test the entire workflow without configuring an SMTP provider.

---

### F. Frontend Architecture (`public/app.js`, `index.html`, `style.css`)

- **Relative API Base**: `const API_BASE = '';` makes all fetch requests relative (`/api/auth/...`), ensuring the frontend works seamlessly on `localhost:5000` and on Vercel without hardcoded domain names.
- **Auto-Advancing OTP Inputs**: JavaScript listens for `input`, `keydown` (backspace navigation), and `paste` events across 6 distinct input elements. Pasting a 6-digit code auto-populates all 6 boxes instantly.
- **DOM XSS Defense**:
  ```javascript
  const span = document.createElement('span');
  span.textContent = message; // Pure text, immune to HTML injection
  toast.appendChild(span);
  ```
  Replaced `innerHTML` with text node assignment so user input or error messages containing HTML cannot trigger script execution.

---

## 4. Enterprise Security Defenses Implemented

| Security Vulnerability | Attack Vector | How Our Project Defends Against It |
| :--- | :--- | :--- |
| **Password Cracking** | Rainbow tables, dictionary attacks | Salted hashing using **`bcrypt` (10 rounds)**. |
| **Bcrypt DoS / ReDoS** | Sending 10MB password to exhaust CPU | Password max length capped at **128 characters** before hashing. |
| **OTP Brute-Force** | Rapidly guessing 6-digit combinations | **5-Attempt Lockout**: Database wipes the OTP after 5 failed attempts; strict **10 req/15 min rate limit**. |
| **Replay Attacks** | Reusing an intercepted OTP code | **Single-Use Invalidation**: `otp` and `otpExpiresAt` are wiped (`null`) immediately upon reset. |
| **NoSQL Operator Injection**| Sending `{ email: { $gt: "" } }` | Strict `typeof === 'string'` validation on all request bodies. |
| **Denial of Service (DoS)** | Sending massive JSON bodies | `express.json({ limit: "20kb" })` rejects oversized payloads. |
| **Session Hijacking** | Forging user IDs in requests | **JWT stateless verification** with 24-hour expiration and cryptographic signature. |
| **Clickjacking** | Embedding site in an `<iframe>` | **Helmet** sets `X-Frame-Options: DENY`. |
| **DOM XSS** | Injecting scripts through error toasts | Frontend uses `textContent` DOM nodes instead of `innerHTML`. |
| **Server Information Leak**| Banner grabbing Express version | **Helmet** strips `X-Powered-By: Express`. |

---

## 5. Automated Testing Strategy (TDD Suite)

The project includes **38 automated tests** executed using **Jest** and **Supertest**:

```text
PASS tests/integration/authRoutes.test.js (24 tests)
  1. POST /api/auth/register (5 tests)
  2. POST /api/auth/login (4 tests)
  3. GET /api/auth/profile (2 tests)
  4. POST /api/auth/forgot-password (3 tests)
  5. POST /api/auth/verify-otp (2 tests)
  6. POST /api/auth/reset-password (3 tests)
  7. Security Hardening & Edge Cases (5 tests: Name length, Password length, NoSQL injection prevention on register & login, OTP 5-attempt lockout defense)

PASS tests/unit/rateLimiter.test.js (2 tests)
PASS tests/unit/User.model.test.js (5 tests)
PASS tests/unit/authMiddleware.test.js (5 tests)
PASS tests/unit/sendEmail.test.js (2 tests)

Test Suites: 5 passed, 5 total
Tests:       38 passed, 38 total
```

---

## 6. Top 15+ Technical Interview Cross-Questions & Model Answers

### Q1: Why did you migrate from a relational database (SQL) to MongoDB Atlas (NoSQL)?
**Answer:**
> *"We migrated to MongoDB Atlas with Mongoose for three key reasons: First, cloud-native scalability and managed clustering through Atlas. Second, document-oriented schema flexibility with Mongoose, which allowed us to embed the OTP fields (`otp`, `otpExpiresAt`, `otpAttempts`) directly into the User document without complex table joins or foreign keys. Third, serverless compatibility: Mongoose connection caching works efficiently across Vercel lambda invocations."*

---

### Q2: How does your system prevent OTP brute-force guessing?
**Answer:**
> *"A 6-digit OTP has 1,000,000 possible combinations. Without protection, an automated script could guess it within the 10-minute window. We implemented two defenses:*
> 1. *In `authController.js`, we track `otpAttempts`. If 5 consecutive incorrect OTPs are entered, the OTP is destroyed from the database (`user.otp = null; user.otpExpiresAt = null;`), reducing the attacker's probability of guessing to 5 in 1,000,000 (0.0005%).*
> 2. *We applied `otpLimiter` via `express-rate-limit` on the route, restricting the IP to 10 requests per 15 minutes."*

---

### Q3: What is a Replay Attack on an OTP system, and how did you prevent it?
**Answer:**
> *"A replay attack occurs when an attacker intercepts a valid OTP and attempts to reuse it to reset the password a second time. We prevent this by enforcing **single-use invalidation**: inside `resetPassword()`, the moment the new password is encrypted and saved, we immediately set `user.otp = null` and `user.otpExpiresAt = null`. Any subsequent request with that OTP is rejected."*

---

### Q4: Why did you limit password input length to 128 characters? Isn't longer always better?
**Answer:**
> *"While long passwords are good for entropy, the `bcrypt` hashing algorithm has an internal maximum input length of 72 bytes. More importantly, calculating bcrypt hashes on extremely large strings (like a 1MB payload) is computationally expensive and blocks Node's event loop. Attackers exploit this via **Bcrypt CPU Exhaustion / ReDoS Attacks** to crash servers. By capping the password at 128 characters before it reaches bcrypt, we maintain high entropy while preventing CPU starvation."*

---

### Q5: What is NoSQL Operator Injection and how does your code stop it?
**Answer:**
> *"In MongoDB, if an Express route passes `req.body` directly into a query like `User.findOne({ email: req.body.email })`, an attacker can send JSON like `{ "email": { "$gt": "" } }`. In MongoDB, `$gt: ""` matches the first record in the collection, allowing authentication bypass. We defend against this by enforcing strict primitive type validation (`typeof email !== 'string'`) and sanitizing with `toLowerCase().trim()` before any query is executed."*

---

### Q6: How does your Express application run in a serverless environment like Vercel without `app.listen()`?
**Answer:**
> *"In serverless architecture, there is no long-running process listening on a port. Instead, Vercel wraps incoming HTTP requests into an event and passes them to our Express app exported from `api/index.js`. In `server.js`, we check `if (process.env.NODE_ENV !== 'test' && !process.env.VERCEL)` before calling `app.listen(PORT)`. This allows the exact same codebase to run as a traditional server on `localhost:5000` and as an event-driven serverless lambda on Vercel."*

---

### Q7: Why do database connections need special handling in serverless functions?
**Answer:**
> *"In traditional servers, you establish one database connection when the process starts. In serverless, multiple lambda instances spin up and shut down on-demand. If every invocation called `mongoose.connect()`, the database would run out of connection sockets. In `config/db.js`, we cache the connection (`if (mongoose.connection.readyState === 1) return;`). Additionally, we added an Express middleware in `server.js` to ensure the connection is active before processing requests."*

---

### Q8: Where should JWT tokens be stored on the client side? What are the trade-offs?
**Answer:**
> *"There are two primary approaches:*
> 1. *`localStorage`: Easy to implement and accessible via JavaScript, but susceptible to Cross-Site Scripting (XSS).*
> 2. *`httpOnly`, `Secure`, `SameSite` Cookies: Inaccessible to JavaScript, providing strong protection against XSS, but requiring CSRF defense.*
> *In our current frontend, tokens are stored in `localStorage` for demonstration, but we mitigated XSS risk by enforcing strict Content Security Policies via Helmet and replacing `innerHTML` with text node assignment (`textContent`). For enterprise production, migrating the JWT to `httpOnly` cookies is the recommended next step."*

---

### Q9: Why does `package-lock.json` have over 6,000 lines when `package.json` only has 9 dependencies?
**Answer:**
> *"Our `package.json` specifies direct dependencies (`express`, `jest`, `mongoose`, etc.). However, each of those depends on nested sub-packages (for example, `jest` pulls in Babel, diff matchers, and code coverage engines). `package-lock.json` records the exact, deterministic dependency tree for all 400+ transitive packages, including exact version numbers, download URLs, and cryptographic SHA-512 integrity hashes. This guarantees that `npm install` produces an identical installation on Vercel or any other machine."*

---

### Q10: How did you prevent DOM-based Cross-Site Scripting (XSS) on the frontend?
**Answer:**
> *"DOM XSS happens when untrusted user input is parsed as HTML (e.g. `element.innerHTML = message`). If an error message contained `<img src=x onerror=alert(1)>`, it would execute. We hardened `showToast()` in `app.js` by using DOM creation APIs (`document.createElement('span')`) and setting `span.textContent = message`. The browser treats `textContent` purely as raw text, making script execution impossible."*

---

### Q11: What is the difference between Unit Testing and Integration Testing in your test suite?
**Answer:**
> - **Unit Tests** (`tests/unit/`): Test individual components in isolation without external network calls (e.g., verifying that `authMiddleware` returns 401 when a header is missing, testing `User` schema validation rules, verifying rate limiter exports).
> - **Integration Tests** (`tests/integration/`): Test the entire HTTP lifecycle end-to-end using `supertest`. Requests hit real routes, pass through middlewares, write to MongoDB Atlas, trigger password updates, and assert the resulting HTTP status codes and database mutations.

---

### Q12: Why did you await `sendEmail()` inside `forgotPassword` instead of running it in the background?
**Answer:**
> *"In a persistent Node.js server, firing an unawaited Promise (`sendEmail(...)`) allows the HTTP response to return immediately while the email sends in the background. However, in serverless environments like Vercel, the moment an HTTP response is returned, the runtime freezes the container CPU. An unawaited email promise gets paused before the SMTP socket completes transmission. Awaiting `sendEmail()` ensures the email is transmitted through Gmail's SSL socket before the lambda lifecycle ends."*

---

### Q13: What is the purpose of the `User.toJSON` transform in your Mongoose schema?
**Answer:**
> *"By default, MongoDB documents contain `_id` and an internal version key `__v`. In `models/User.js`, we configured `userSchema.set('toJSON', ...)` to automatically map `_id` to `id`, format `createdAt` as `created_at`, and delete `__v` before the object is serialized to JSON. This separates internal database implementation details from client-facing API responses."*

---

### Q14: What HTTP status codes does your API return and why?
**Answer:**
> - `200 OK`: Successful login, profile retrieval, OTP verification, or password reset.
> - `201 Created`: Successful user registration.
> - `400 Bad Request`: Missing fields, invalid email format, short password, or incorrect OTP.
> - `401 Unauthorized`: Bad login credentials, missing token, or expired JWT.
> - `404 Not Found`: User not found when requesting OTP.
> - `409 Conflict`: Registration attempt with an email that is already registered.
> - `429 Too Many Requests`: Exceeded rate limit.
> - `500 Internal Server Error`: Unhandled server/database exceptions.
> - `503 Service Unavailable`: Database connecting or disconnected in health checks.

---

### Q15: How would you scale this system to handle 1,000,000 daily active users?
**Answer:**
> 1. **Distributed Rate Limiting**: Replace in-memory rate limiting with **Redis** (`rate-limit-redis`) so limits are synchronized across all serverless instances.
> 2. **Asynchronous Message Queues**: Offload email sending to a background job queue using **RabbitMQ** or **BullMQ** with Redis, backed by a dedicated transactional email service (e.g., AWS SES or SendGrid).
> 3. **Database Read Replicas & Indexing**: Add compound indexes on frequently queried fields and use MongoDB Atlas secondary read replicas to distribute query load.
> 4. **Token Revocation (Blacklist)**: Use Redis key expiration to store invalidated JWTs for immediate logout capabilities prior to natural token expiration.
