const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { authenticate } = require('../middleware/auth');
const router = express.Router();


router.post('/register', async (req, res, next) => {
  try {
    const fullName = String(req.body.fullName || '').trim();
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    const department = String(req.body.department || '').trim();
    if (!fullName || fullName.length > 120) return res.status(400).json({ message: 'Full name is required (maximum 120 characters).' });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 150) return res.status(400).json({ message: 'Enter a valid email address.' });
    if (password.length < 12 || password.length > 128) return res.status(400).json({ message: 'Password must be between 12 and 128 characters.' });
    if (department.length > 100) return res.status(400).json({ message: 'Department must be at most 100 characters.' });

    // Public registration can create Employee accounts only. Privileged roles must be created locally.
    const [existing] = await db.execute('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length) return res.status(409).json({ message: 'An account with this email already exists.' });
    const passwordHash = await bcrypt.hash(password, 12);
    await db.execute(
      'INSERT INTO users (full_name, email, password_hash, role, department) VALUES (?, ?, ?, ?, ?)',
      [fullName, email, passwordHash, 'employee', department || null]
    );
    res.status(201).json({ message: 'Employee account created. You can now sign in.' });
  } catch (error) { next(error); }
});

router.post('/login', async (req, res, next) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    if (!email || !password) return res.status(400).json({ message: 'Email and password are required.' });

    const [rows] = await db.execute(
      'SELECT id, full_name, email, password_hash, role, department FROM users WHERE email = ?', [email]
    );
    const user = rows[0];
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ message: 'Email or password is incorrect.' });
    }

    const token = jwt.sign(
      { id: user.id, name: user.full_name, email: user.email, role: user.role, department: user.department },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );
    res.json({ token, user: { id: user.id, name: user.full_name, email: user.email, role: user.role, department: user.department } });
  } catch (error) { next(error); }
});

router.get('/me', authenticate, (req, res) => res.json({ user: req.user }));
module.exports = router;
