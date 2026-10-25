CREATE DATABASE IF NOT EXISTS voucherflow_db;
USE voucherflow_db;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(120) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('employee', 'director', 'accounts') NOT NULL,
  department VARCHAR(100) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS vouchers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  voucher_number VARCHAR(40) NOT NULL UNIQUE,
  employee_id INT NOT NULL,
  expense_date DATE NOT NULL,
  department VARCHAR(100) NOT NULL,
  expense_title VARCHAR(150) NOT NULL,
  category VARCHAR(80) NOT NULL,
  description TEXT,
  amount DECIMAL(12,2) NOT NULL,
  employee_signature VARCHAR(255) DEFAULT NULL,
  status ENUM('Draft','Pending Approval','Approved','Rejected') NOT NULL DEFAULT 'Draft',
  director_signature VARCHAR(255) DEFAULT NULL,
  approval_date DATETIME DEFAULT NULL,
  rejection_reason TEXT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_voucher_employee FOREIGN KEY (employee_id) REFERENCES users(id),
  INDEX idx_voucher_status (status),
  INDEX idx_voucher_employee (employee_id),
  CONSTRAINT chk_voucher_amount CHECK (amount > 0)
);
