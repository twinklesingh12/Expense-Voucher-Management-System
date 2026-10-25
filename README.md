# VoucherFlow — Expense Voucher Management System

## 1. Project Overview

VoucherFlow is a role-based expense voucher management application built with React, Node.js, Express, and MySQL.

The application supports the creation, submission, review, approval, and rejection of expense vouchers through three user roles: Employee, Director, and Accounts.

## 2. Technology Stack

- **Frontend:** React, Vite, JavaScript, CSS
- **Backend:** Node.js, Express.js
- **Database:** MySQL
- **Authentication:** JSON Web Tokens (JWT)
- **Password Security:** bcrypt
- **File Uploads:** Multer
- **API Style:** REST

## 3. User Roles and Permissions

### Employee
- Register and sign in.
- Create, save, edit, and delete their own draft vouchers.
- Upload a signature image.
- Submit vouchers for approval.
- View voucher status and rejection reasons.

### Director
- View vouchers submitted for approval.
- Approve pending vouchers with a signature.
- Reject pending vouchers with a mandatory reason.
- Review voucher details without editing employee-entered expense information.

### Accounts
- View vouchers, signatures, and approval status.
- Cannot create, edit, delete, approve, or reject vouchers.

### Voucher Workflow

`Draft → Pending Approval → Approved / Rejected`

## 4. Prerequisites

Install the following before running the project:

- Node.js 20 or later
- npm
- MySQL 8 or a compatible MySQL server
- MySQL Workbench (recommended)
- Git
- A modern web browser

## 5. Project Setup

### Step 1: Clone the Repository

Replace the placeholder with the actual GitHub repository URL.

```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
cd VoucherFlow
```

Alternatively, download the repository ZIP and extract it.

### Step 2: Set Up the Database

1. Start the local MySQL server.
2. Open MySQL Workbench.
3. Open `backend/schema.sql`.
4. Execute the SQL script.

The script creates the `voucherflow_db` database and the required `users` and `vouchers` tables for a new installation.

**Important:** `CREATE TABLE IF NOT EXISTS` does not migrate an existing table to a newer structure. Use a proper migration or a clean development database when setting up an older database schema.

### Step 3: Configure the Backend

Open a terminal in the project root:

```powershell
cd backend
npm install
Copy-Item .env.example .env
```

Edit `backend/.env` and configure your local MySQL credentials.

Example:

```env
PORT=5000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_local_mysql_password
DB_NAME=voucherflow_db
JWT_SECRET=replace_with_a_long_random_secret
CLIENT_URL=http://localhost:5173
```

Replace the example password and JWT secret with your own values. Do not commit `.env` to GitHub.

### Step 4: Create User Accounts

Start the backend account creation utility:

```powershell
npm run create-user
```

Follow the prompts to create an account. The utility supports the `employee`, `director`, and `accounts` roles. Use a unique password of at least 12 characters.

Public registration is intended for Employee accounts only. Create Director and Accounts accounts through the local account creation utility.

### Step 5: Start the Backend

From the `backend` directory:

```powershell
npm run dev
```

The API should run at:

`http://localhost:5000`

Check database connectivity at:

`http://localhost:5000/api/health`

A healthy response is:

```json
{
  "api": "ok",
  "database": "connected"
}
```

### Step 6: Configure and Start the Frontend

Open a second terminal from the project root:

```powershell
cd frontend
npm install
Copy-Item .env.example .env
npm run dev
```

Open the local URL printed by Vite, usually:

`http://localhost:5173`

The frontend API URL can be configured in `frontend/.env`:

```env
VITE_API_URL=http://localhost:5000/api
```

Restart Vite after changing environment variables.

## 6. Database Schema

### users

Stores application users and their authentication and role information.

| Column | Purpose |
|---|---|
| `id` | Primary key |
| `full_name` | User's full name |
| `email` | Unique login email |
| `password_hash` | Hashed password |
| `role` | Employee, Director, or Accounts |
| `department` | User's department |
| `created_at` | Account creation timestamp |

### vouchers

Stores expense voucher information and its approval lifecycle.

| Column | Purpose |
|---|---|
| `id` | Primary key |
| `voucher_number` | Unique voucher identifier |
| `employee_id` | Employee foreign key referencing `users.id` |
| `expense_date` | Date of expense |
| `department` | Expense department |
| `expense_title` | Expense title |
| `category` | Expense category |
| `description` | Expense description |
| `amount` | Expense amount |
| `employee_signature` | Employee signature file reference |
| `status` | Draft, Pending Approval, Approved, or Rejected |
| `director_signature` | Director signature file reference |
| `approval_date` | Approval timestamp |
| `rejection_reason` | Reason for rejection |
| `created_at` | Creation timestamp |
| `updated_at` | Last update timestamp |

### Relationships and Constraints

- Each voucher belongs to an employee through `employee_id`.
- User emails and voucher numbers must be unique.
- Voucher status is restricted to the supported workflow values.
- Voucher amounts must be positive.
- Indexes support voucher status and employee lookups.

The schema file is `backend/schema.sql`.

## 7. API Documentation

Base URL:

`http://localhost:5000/api`

Protected endpoints require a valid JWT access token:

`Authorization: Bearer <JWT_TOKEN>`

### Authentication Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/auth/register` | Register an Employee account |
| POST | `/auth/login` | Authenticate and receive a JWT |
| GET | `/auth/me` | Retrieve the authenticated user's information |

Example registration request:

```json
{
  "fullName": "Aarav Sharma",
  "email": "aarav.employee@example.com",
  "password": "ExamplePassword@2026",
  "department": "Finance"
}
```

Public registration assigns the Employee role on the server.

### Voucher Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/vouchers/summary` | Retrieve voucher status totals |
| GET | `/vouchers` | List vouchers permitted for the current role |
| GET | `/vouchers/:id` | Retrieve an individual voucher |
| POST | `/vouchers` | Create a draft or submit a voucher |
| PUT | `/vouchers/:id` | Update an employee's own draft |
| DELETE | `/vouchers/:id` | Delete an employee's own draft |
| POST | `/vouchers/:id/submit` | Submit a signed draft |
| POST | `/vouchers/:id/decision` | Approve or reject a pending voucher |

Signature upload and voucher decision requests use multipart form data where applicable.

### Decision Request

The Director decision endpoint accepts an action of `approve` or `reject`.

- Approval requires a director signature file.
- Rejection requires a non-empty rejection reason.
- Only pending vouchers can receive a decision.

The backend validates the role and voucher status before applying the decision.

### Typical Responses

- `200 OK` — Request completed.
- `201 Created` — Resource created.
- `400 Bad Request` — Invalid input or workflow operation.
- `401 Unauthorized` — Missing or invalid authentication.
- `403 Forbidden` — Role is not permitted to perform the operation.
- `404 Not Found` — Requested resource not found.
- `409 Conflict` — Duplicate record or conflicting input.
- `500 Internal Server Error` — Unexpected server-side error.

Exact response codes depend on the endpoint and error condition.

## 8. Assumptions Made During Development

1. Each user has one assigned role: Employee, Director, or Accounts.
2. Public registration is restricted to Employee accounts.
3. Director and Accounts accounts are created by an authorized local administrator using the account creation utility.
4. Employees can edit and delete only their own draft vouchers.
5. A submitted voucher cannot be edited by the Employee.
6. A Director can approve or reject only a pending voucher.
7. Approval requires a Director signature, and rejection requires a reason.
8. Accounts is a read-only business role.
9. Signature uploads are limited to supported image formats and the configured file-size limit.
10. The application is intended for local development and evaluation unless additional production security controls are implemented.

## 9. Security Considerations

- Passwords are hashed before storage.
- JWT authentication protects private API routes.
- Role-based authorization restricts sensitive operations.
- Input validation is applied to authentication and voucher operations.
- Environment files and secrets must not be committed to version control.
- Use test data rather than real employee or financial information in a public repository.
- Before production deployment, review file access, upload validation, rate limiting, audit logging, HTTPS, secret management, and authorization at the API level.

## 10. Testing Checklist

- [ ] Employee registration and login
- [ ] Draft creation, editing, and deletion
- [ ] Signature upload
- [ ] Submission for approval
- [ ] Director approval with signature
- [ ] Director rejection with mandatory reason
- [ ] Accounts read-only access
- [ ] Access restrictions for unauthenticated users
- [ ] Role restrictions verified through direct API requests
- [ ] Database and API health checks

Record only tests that have actually passed.

## 11. Repository Structure

```text
VoucherFlow/
├── backend/
│   ├── middleware/
│   ├── routes/
│   ├── uploads/signatures/
│   ├── create-user.js
│   ├── db.js
│   ├── schema.sql
│   ├── server.js
│   └── .env.example
├── frontend/
│   ├── src/
│   ├── index.html
│   ├── vite.config.js
│   └── .env.example
├── .gitignore
└── README.md
```

## 12. Author and Submission

This project was developed as an internship evaluation project.

Repository: `<YOUR_GITHUB_REPOSITORY_URL>`

Before submission, verify the setup instructions on a clean local database, include the schema and environment templates, and remove secrets, temporary files, and unnecessary test data.
#   E x p e n s e - V o u c h e r - M a n a g e m e n t - S y s t e m  
 