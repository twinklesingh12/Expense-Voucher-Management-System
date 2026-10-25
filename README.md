# VoucherFlow — Expense Voucher Management System

A role-based expense voucher management application built to simplify voucher creation, submission, review, and approval.

## 📌 Overview

VoucherFlow provides a centralized workspace for employees to manage expense vouchers and for authorized users to review and process them through a structured approval workflow.

The application supports three roles:

- **Employee:** Creates, saves, edits, and submits vouchers and tracks their status.
- **Director:** Reviews submitted vouchers and approves or rejects them with a reason when required.
- **Accounts:** Views vouchers, signatures, and approval statuses for accounting purposes.

## ✨ Features

- User registration and login
- Role-based access control
- Create, edit, save, and delete draft vouchers
- Submit vouchers for approval
- Digital signature upload and display
- Director approval and rejection workflow
- Rejection reasons for employees to review
- Voucher status tracking
- Accounts read-only access
- MySQL database integration
- REST API with JWT-based authentication

## 🔄 Voucher Workflow

```text
Draft
  |
  v
Pending Approval
  |
  +------> Approved
  |
  +------> Rejected
```

- **Draft:** The employee can manage the voucher before submission.
- **Pending Approval:** The voucher is submitted for the Director's review.
- **Approved:** The Director approves the voucher.
- **Rejected:** The Director rejects the voucher and provides a reason.

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React, Vite, JavaScript, CSS |
| Backend | Node.js, Express.js |
| Database | MySQL |
| Authentication | JWT |
| API style | REST API |

## 📁 Project Structure

The project is organized into frontend and backend applications.

```text
VoucherFlow/
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── .env.example
├── backend/
│   ├── package.json
│   ├── .env.example
│   └── schema.sql
└── README.md
```

*Note: Adjust this structure to match the actual files and folders in your repository.*

## ⚙️ Prerequisites

Install the following before running the project:

- Node.js and npm
- MySQL Server
- Git

## 🚀 Installation and Setup

### 1. Clone the repository

```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
cd VoucherFlow
```

Replace the placeholder with your actual GitHub repository URL.

### 2. Configure the database

1. Start your MySQL server.
2. Create the project database.
3. Run the SQL schema file provided in the repository.
4. Confirm that the required tables have been created.

Example:

```sql
CREATE DATABASE voucherflow_db;
```

If your schema file already creates the database, follow the instructions in that file instead.

### 3. Configure the backend

Open a terminal in the backend directory:

```bash
cd backend
npm install
```

Create a `.env` file using `.env.example` as a reference.

Example configuration:

```env
PORT=5000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=voucherflow_db
JWT_SECRET=your_secure_random_secret
CLIENT_URL=http://localhost:5173
```

Replace the example values with your local configuration. Use the actual environment variable names expected by your backend.

Start the backend:

```bash
npm run dev
```

The backend is expected to run at `http://localhost:5000` when configured with the example port.

### 4. Configure the frontend

Open a second terminal:

```bash
cd frontend
npm install
```

Create a frontend `.env` file if required by your application. For example:

```env
VITE_API_URL=http://localhost:5000
```

Use the variable name expected by your existing frontend code.

Start the frontend:

```bash
npm run dev
```

Open the local URL displayed by Vite, usually `http://localhost:5173`.

## 🔐 User Roles and Permissions

| Feature | Employee | Director | Accounts |
|---|:---:|:---:|:---:|
| Create vouchers | Yes | No | No |
| Edit own drafts | Yes | No | No |
| Submit vouchers | Yes | No | No |
| View vouchers | Own vouchers | All vouchers | All vouchers |
| Approve vouchers | No | Yes | No |
| Reject vouchers | No | Yes | No |
| View rejection reasons | Yes | Yes | Yes |
| View signatures | As permitted | Yes | Yes |

Permissions shown here describe the intended application workflow. Confirm that the implemented backend enforces each permission before submission.

## 📡 API Documentation

The following endpoints describe the API structure discussed during development. Verify the routes, request fields, and response formats against the actual backend before relying on this table.

All protected endpoints should use the authentication token in the request header:

```http
Authorization: Bearer <JWT_TOKEN>
```

### Authentication

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/auth/register` | Register a user |
| POST | `/auth/login` | Authenticate a user |
| GET | `/auth/me` | Retrieve the current user's information |

### Vouchers

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/vouchers` | Retrieve vouchers available to the current user |
| GET | `/vouchers/summary` | Retrieve voucher summary information |
| GET | `/vouchers/:id` | Retrieve a voucher by ID |
| POST | `/vouchers` | Create a voucher |
| PUT | `/vouchers/:id` | Update an eligible voucher |
| DELETE | `/vouchers/:id` | Delete an eligible draft |
| POST | `/vouchers/:id/submit` | Submit a voucher for approval |
| POST | `/vouchers/:id/decision` | Record an approval or rejection decision |

Access to each endpoint depends on the user's role and the voucher's current status.

## 🗄️ Database

The application uses MySQL to store user and voucher information.

The primary tables discussed during development are:

- **users:** Stores user account details, login information, and roles.
- **vouchers:** Stores voucher details, employee information, amounts, signatures, and workflow status.

Refer to the project's SQL schema file for the actual columns, data types, keys, and relationships.

## 🔒 Security and Configuration

- Keep database credentials and JWT secrets in environment variables.
- Never commit `.env` files containing real credentials.
- Include `.env.example` files with placeholder values only.
- Enforce role permissions on the backend, not only in the frontend.
- Validate submitted voucher data and approval decisions.
- Restrict edits and deletions according to the voucher workflow.
- Do not commit real employee signatures or confidential business information.

## 🧪 Testing Checklist

Before submitting the project, verify the following:

- [ ] Users can register and log in.
- [ ] Employees can create and save draft vouchers.
- [ ] Employees can submit vouchers for approval.
- [ ] Submitted vouchers appear in the Director's workspace.
- [ ] The Director can approve or reject eligible vouchers.
- [ ] Rejection reasons are recorded and visible to the employee.
- [ ] Accounts users can view vouchers without modifying them.
- [ ] Unauthorized users cannot perform restricted actions.
- [ ] Data persists correctly in MySQL.
- [ ] The application runs using the documented setup instructions.

## 🚧 Assumptions and Limitations

- Users have role-specific permissions.
- Vouchers follow the documented workflow.
- Only authorized users can perform approval decisions.
- The database schema and API behavior are defined by the implementation included in the repository.

Document any additional assumptions or incomplete features before submission.

## 👨‍💻 Development

Run the frontend and backend in separate terminals during local development.

If a dependency or configuration error occurs, check the terminal output, environment variables, database connection, and API URL.

## 📄 License and Confidentiality

Add a license only if you have permission to distribute the project under that license.

If this project was developed for an assessment or company assignment, follow the applicable confidentiality and submission requirements.

---

**VoucherFlow** — A structured workflow for expense voucher management.
