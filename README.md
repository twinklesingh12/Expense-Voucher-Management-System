# 💼 VoucherFlow — Expense Voucher Management System

## 📌 Overview

**VoucherFlow** is a role-based expense voucher management system designed to simplify the creation, submission, review, and approval of expense vouchers.

The application provides a centralized platform where employees can manage their expense vouchers, directors can review and approve or reject submissions, and accounts personnel can access voucher information for financial processing.

The system aims to improve transparency, accountability, and efficiency through a structured approval workflow and role-based access control.

## ✨ Key Features

- 🔐 **Authentication & Authorization** — Secure login with JWT-based authentication and role-based access control.
- 📝 **Voucher Management** — Create, save, edit, and submit expense vouchers.
- 🔄 **Approval Workflow** — Manage vouchers through submission, review, approval, and rejection.
- ✍️ **Digital Signature Support** — Capture or upload a signature as part of the approval process.
- 💬 **Rejection Remarks** — Record a reason when a voucher is rejected.
- 👥 **Role-Based Dashboards** — Provide functionality according to the logged-in user's role.
- 📊 **Voucher Tracking** — Track voucher details and their current status.
- 🛡️ **Protected Operations** — Restrict sensitive actions to authorized users.

## 👤 User Roles

| Role           | Responsibilities                                                                                            |
| -------------- | ----------------------------------------------------------------------------------------------------------- |
| 👨‍💻 Employee | Create, save, edit, submit, and track expense vouchers.                                                     |
| 🧑‍💼 Director | Review submitted vouchers, approve or reject them, and provide the required rejection reason and signature. |
| 📑 Accounts    | View voucher information for accounting and financial processing.                                           |

## 🛠️ Technology Stack

| Layer             | Technology            |
| ----------------- | --------------------- |
| Frontend          | React.js              |
| Frontend tooling  | Vite                  |
| Backend           | Node.js               |
| API framework     | Express.js            |
| Database          | MySQL                 |
| Authentication    | JSON Web Tokens (JWT) |
| Password security | Password hashing      |
| API style         | REST                  |
| Version control   | Git and GitHub        |

## 🏗️ Application Architecture

```text
VoucherFlow/
├── frontend/              # React + Vite application
│   ├── src/
│   ├── public/
│   └── package.json
│
├── backend/               # Node.js + Express API
│   ├── routes/             # API routes
│   ├── schema.sql          # Database schema
│   ├── .env                # Local environment variables
│   └── package.json
│
├── .gitignore
├── .env.example            # Environment variable template
└── README.md
```

> 📂 The folder tree is illustrative. Actual files and subfolders may vary according to the repository structure.

## ⚙️ Prerequisites

Install the following before running the application:

- [Node.js](https://nodejs.org/) — LTS version recommended.
- [npm](https://www.npmjs.com/) — Included with Node.js.
- [MySQL](https://dev.mysql.com/downloads/) — Database server.
- [Visual Studio Code](https://code.visualstudio.com/) — Recommended editor.
- [Git](https://git-scm.com/) — For version control.

## 🚀 Installation & Setup

### 1️⃣ Clone the repository

```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
cd VoucherFlow
```

Replace `<YOUR_GITHUB_REPOSITORY_URL>` with the URL of your GitHub repository.

### 2️⃣ Configure the database

1. Start your MySQL server.
2. Open MySQL Workbench or your preferred MySQL client.
3. Create the application database.

```sql
CREATE DATABASE voucherflow;
```

4. Import the database schema from the backend directory.

```bash
mysql -u root -p voucherflow < backend/schema.sql
```

Enter your MySQL password when prompted.

If your schema file already creates or selects a database, follow the instructions defined in that file.

### 3️⃣ Configure environment variables

Create a local environment file at `backend/.env`.

Example configuration:

```env
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=voucherflow
JWT_SECRET=replace_with_a_long_random_secret
```

> ⚠️ These variable names are examples. Match them to the variables actually read by your backend code. Never commit real passwords, JWT secrets, or API keys.

### 4️⃣ Install backend dependencies

```bash
cd backend
npm install
```

Start the backend development server:

```bash
npm run dev
```

Keep this terminal running.

### 5️⃣ Install frontend dependencies

Open a second terminal in VS Code:

```bash
cd frontend
npm install
```

Start the frontend development server:

```bash
npm run dev
```

Open the local URL printed by Vite in the terminal, commonly `http://localhost:5173`.

### 6️⃣ Create initial user accounts

If the project includes the user-creation script, run it from the backend directory:

```bash
npm run create-user
```

Follow the prompts and the project's setup instructions to create the necessary accounts.

🔒 Public registration should be limited to Employee accounts if that is how the application's authorization rules are configured. Create Director and Accounts users through the authorized setup process.

## 🗄️ Database Schema Explanation

VoucherFlow uses MySQL to persist application data.

The authoritative database definition is maintained in `backend/schema.sql`. Run that file to create the tables and constraints required by the application.

The main logical data entities are:

| Entity                   | Purpose                                                                                                               |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------- |
| 👤 Users                 | Stores user account information, credentials in hashed form, and assigned roles.                                      |
| 🧾 Vouchers              | Stores expense voucher details, ownership, submission information, and workflow status.                               |
| ✍️ Signature / File Data | Supports signature or uploaded-file references used during the voucher workflow, according to the implemented schema. |
| 🔗 Relationships         | Connects vouchers with their creators and the relevant approval information.                                          |

### 🔄 Data Relationships

- A user can create multiple vouchers.
- Each voucher is associated with its creator.
- A voucher can move through the application's configured workflow states.
- Approval and rejection information should be associated with the relevant voucher.
- Signature and uploaded-file records or references are stored according to the implemented database design.

**Important:** The entities above describe the logical data model. Check `backend/schema.sql` before documenting exact table names, columns, foreign keys, or cardinalities. The actual SQL schema is the source of truth.

## 🔌 API Documentation

The backend exposes REST API endpoints for authentication, voucher management, and approval operations.

**Base URL (local development):**

```text
http://localhost:5000
```

The actual base URL depends on the configured backend port and any API prefix used by the application.

### 🔐 Authentication

| Operation        | Purpose                                                        |
| ---------------- | -------------------------------------------------------------- |
| Register         | Create an account where registration is permitted.             |
| Login            | Authenticate a user and obtain an access token.                |
| Get current user | Retrieve the authenticated user's information, if implemented. |

### 🧾 Voucher Management

| Operation           | Purpose                                                    |
| ------------------- | ---------------------------------------------------------- |
| Create voucher      | Create a new expense voucher.                              |
| List vouchers       | Retrieve vouchers permitted for the current user.          |
| Get voucher details | Retrieve an individual voucher.                            |
| Update voucher      | Edit a voucher when its current status and role permit it. |
| Submit voucher      | Submit a draft for approval.                               |

### ✅ Approval & Review

| Operation        | Purpose                                            |
| ---------------- | -------------------------------------------------- |
| Review voucher   | Retrieve submitted vouchers for authorized review. |
| Approve voucher  | Approve a voucher with the required approval data. |
| Reject voucher   | Reject a voucher with a reason.                    |
| Upload signature | Upload or associate a signature where supported.   |

### 🧪 API Request Examples

The following examples illustrate the API conventions; replace the paths and request fields with those implemented in the backend route files.

**Example: Login**

```http
POST /api/auth/login
Content-Type: application/json
```

```json
{
  "email": "employee@example.com",
  "password": "your_password"
}
```

**Example: Create a voucher**

```http
POST /api/vouchers
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

```json
{
  "title": "Travel Expense",
  "amount": 1500,
  "description": "Business travel expense"
}
```

The request body is illustrative; use the exact field names and validation rules defined by the application.

### 🔑 Authentication & Authorization

- Protected endpoints require a valid JWT where configured.
- Role-based middleware restricts access to authorized operations.
- Employees should not be able to perform director-only approval actions.
- Accounts users have read-only access where enforced by the application's authorization rules.
- Rejection requests must include a reason if required by the implemented validation.

### 📖 How to Verify the Exact API Routes

Review the route files under `backend/routes/` and the corresponding controllers or handlers.

For each endpoint, document:

- HTTP method and exact URL.
- Required role and authentication.
- Request parameters and JSON body.
- Successful response and status code.
- Validation and error responses.

Only list endpoints that are actually implemented in the repository.

## 🔐 Security Considerations

- 🔑 Passwords are hashed before storage.
- 🎫 JWT authentication protects configured endpoints.
- 🛡️ Role-based authorization restricts sensitive operations.
- 🌱 Environment variables hold local secrets and configuration.
- 🚫 Secret files such as `.env` must not be committed to Git.
- 🧾 Input validation should be applied to voucher and approval requests.

Security behavior depends on the actual backend implementation and configuration.

## 🧠 Assumptions & Design Decisions

1. **Role-based access:** Each user has an assigned role that determines the actions available to them.
2. **Employee ownership:** Employees manage their own vouchers, subject to the configured access rules.
3. **Approval workflow:** Submitted vouchers are reviewed by an authorized Director.
4. **Rejection reason:** A rejection must include a reason to improve transparency and traceability.
5. **Signature requirement:** Approval signatures are handled through the application's supported signature or upload mechanism.
6. **Accounts access:** Accounts personnel can view voucher information without being granted approval permissions.
7. **Database persistence:** MySQL is used to store application data.
8. **Local configuration:** Database credentials, JWT secrets, and other environment-specific values are configured outside source code.
9. **Validation:** Invalid requests and unauthorized actions should be rejected by the backend.

These assumptions should be updated if the final business requirements or implemented behavior differ.

## 👨‍💻 Development Notes

This project was developed as part of the Full Stack Developer Internship evaluation process.

The implementation focuses on structured voucher management, role-based access, secure authentication, and a controlled approval workflow.

