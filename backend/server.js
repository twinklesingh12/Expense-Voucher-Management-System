require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./db');
const authRoutes = require('./routes/auth');
const voucherRoutes = require('./routes/vouchers');

const app = express();
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/', (_req, res) => res.json({ message: 'VoucherFlow API is running.' }));
app.get('/api/health', async (_req, res) => {
  try { await db.query('SELECT 1'); res.json({ api: 'ok', database: 'connected' }); }
  catch (_error) { res.status(500).json({ api: 'ok', database: 'disconnected' }); }
});
app.use('/api/auth', authRoutes);
app.use('/api/vouchers', voucherRoutes);

app.use((err, _req, res, _next) => {
  console.error(err.message);
  if (err.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ message: 'Signature image must be 2 MB or smaller.' });
  if (err.message && err.message.startsWith('Upload a PNG')) return res.status(400).json({ message: err.message });
  if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'A record with this information already exists.' });
  res.status(500).json({ message: 'Something went wrong on the server. Please try again.' });
});

const PORT = Number(process.env.PORT || 5000);
app.listen(PORT, () => console.log(`VoucherFlow API running at http://localhost:${PORT}`));
