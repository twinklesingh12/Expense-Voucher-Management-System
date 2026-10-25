const express = require('express');
const db = require('../db');
const { authenticate, allowRoles } = require('../middleware/auth');
const upload = require('../middleware/upload');
const router = express.Router();
router.use(authenticate);

const fields = `v.id, v.voucher_number, v.employee_id, u.full_name AS employee_name, u.email AS employee_email,
 v.expense_date, v.department, v.expense_title, v.category, v.description, v.amount,
 v.employee_signature, v.status, v.director_signature, v.approval_date, v.rejection_reason,
 v.created_at, v.updated_at`;
const selectBase = `SELECT ${fields} FROM vouchers v JOIN users u ON u.id = v.employee_id`;

function cleanVoucher(body) {
  const data = {
    expenseDate: String(body.expenseDate || '').trim(),
    department: String(body.department || '').trim(),
    expenseTitle: String(body.expenseTitle || '').trim(),
    category: String(body.category || '').trim(),
    description: String(body.description || '').trim(),
    amount: Number(body.amount)
  };
  if (!data.expenseDate || !data.department || !data.expenseTitle || !data.category || body.amount === '' || !Number.isFinite(data.amount) || data.amount <= 0) {
    return { error: 'Expense date, department, title, category, and a positive amount are required.' };
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data.expenseDate)) return { error: 'Please enter a valid expense date.' };
  return { data };
}

function voucherNumber() {
  return `VCH-${new Date().getFullYear()}-${Date.now().toString().slice(-8)}`;
}

router.get('/summary', async (req, res, next) => {
  try {
    let where = ''; let params = [];
    if (req.user.role === 'employee') { where = 'WHERE employee_id = ?'; params = [req.user.id]; }
    const [rows] = await db.execute(`SELECT status, COUNT(*) AS count, COALESCE(SUM(amount),0) AS total_amount FROM vouchers ${where} GROUP BY status`, params);
    const summary = { total: 0, totalAmount: 0, Draft: 0, 'Pending Approval': 0, Approved: 0, Rejected: 0 };
    for (const row of rows) {
      summary.total += Number(row.count); summary.totalAmount += Number(row.total_amount);
      summary[row.status] = Number(row.count);
    }
    res.json(summary);
  } catch (error) { next(error); }
});

router.get('/', async (req, res, next) => {
  try {
    const search = String(req.query.search || '').trim();
    const status = String(req.query.status || '').trim();
    const params = []; const conditions = [];
    if (req.user.role === 'employee') { conditions.push('v.employee_id = ?'); params.push(req.user.id); }
    if (status && ['Draft', 'Pending Approval', 'Approved', 'Rejected'].includes(status)) { conditions.push('v.status = ?'); params.push(status); }
    if (search) {
      conditions.push('(v.voucher_number LIKE ? OR v.expense_title LIKE ? OR v.department LIKE ? OR u.full_name LIKE ?)');
      const q = `%${search}%`; params.push(q, q, q, q);
    }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const [rows] = await db.execute(`${selectBase} ${where} ORDER BY v.created_at DESC`, params);
    res.json(rows);
  } catch (error) { next(error); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const [rows] = await db.execute(`${selectBase} WHERE v.id = ?`, [req.params.id]);
    const voucher = rows[0];
    if (!voucher) return res.status(404).json({ message: 'Voucher not found.' });
    if (req.user.role === 'employee' && voucher.employee_id !== req.user.id) return res.status(403).json({ message: 'You can only view your own vouchers.' });
    res.json(voucher);
  } catch (error) { next(error); }
});

router.post('/', allowRoles('employee'), upload.single('employeeSignature'), async (req, res, next) => {
  try {
    const { data, error } = cleanVoucher(req.body);
    if (error) return res.status(400).json({ message: error });
    const status = req.body.action === 'submit' ? 'Pending Approval' : 'Draft';
    if (status === 'Pending Approval' && !req.file) return res.status(400).json({ message: 'Upload your signature before submitting the voucher.' });
    const signature = req.file ? `/uploads/signatures/${req.file.filename}` : null;
    const number = voucherNumber();
    const [result] = await db.execute(
      `INSERT INTO vouchers (voucher_number, employee_id, expense_date, department, expense_title, category, description, amount, employee_signature, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [number, req.user.id, data.expenseDate, data.department, data.expenseTitle, data.category, data.description, data.amount, signature, status]
    );
    const [rows] = await db.execute(`${selectBase} WHERE v.id = ?`, [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (error) { next(error); }
});

router.put('/:id', allowRoles('employee'), upload.single('employeeSignature'), async (req, res, next) => {
  try {
    const { data, error } = cleanVoucher(req.body);
    if (error) return res.status(400).json({ message: error });
    const [existingRows] = await db.execute('SELECT * FROM vouchers WHERE id = ? AND employee_id = ?', [req.params.id, req.user.id]);
    const existing = existingRows[0];
    if (!existing) return res.status(404).json({ message: 'Voucher not found.' });
    if (existing.status !== 'Draft') return res.status(400).json({ message: 'Only Draft vouchers can be edited.' });
    const action = req.body.action === 'submit' ? 'Pending Approval' : 'Draft';
    const signature = req.file ? `/uploads/signatures/${req.file.filename}` : existing.employee_signature;
    if (action === 'Pending Approval' && !signature) return res.status(400).json({ message: 'Upload your signature before submitting the voucher.' });
    await db.execute(
      `UPDATE vouchers SET expense_date=?, department=?, expense_title=?, category=?, description=?, amount=?, employee_signature=?, status=? WHERE id=?`,
      [data.expenseDate, data.department, data.expenseTitle, data.category, data.description, data.amount, signature, action, req.params.id]
    );
    const [rows] = await db.execute(`${selectBase} WHERE v.id = ?`, [req.params.id]);
    res.json(rows[0]);
  } catch (error) { next(error); }
});

router.delete('/:id', allowRoles('employee'), async (req, res, next) => {
  try {
    const [result] = await db.execute("DELETE FROM vouchers WHERE id = ? AND employee_id = ? AND status = 'Draft'", [req.params.id, req.user.id]);
    if (!result.affectedRows) return res.status(400).json({ message: 'Voucher not found or it is no longer a Draft.' });
    res.json({ message: 'Draft voucher deleted.' });
  } catch (error) { next(error); }
});

router.post('/:id/submit', allowRoles('employee'), async (req, res, next) => {
  try {
    const [rows] = await db.execute('SELECT * FROM vouchers WHERE id = ? AND employee_id = ?', [req.params.id, req.user.id]);
    const voucher = rows[0];
    if (!voucher) return res.status(404).json({ message: 'Voucher not found.' });
    if (voucher.status !== 'Draft') return res.status(400).json({ message: 'Only Draft vouchers can be submitted.' });
    if (!voucher.employee_signature) return res.status(400).json({ message: 'Upload your signature before submitting the voucher.' });
    await db.execute("UPDATE vouchers SET status='Pending Approval' WHERE id=?", [req.params.id]);
    res.json({ message: 'Voucher submitted for approval.' });
  } catch (error) { next(error); }
});

router.post('/:id/decision', allowRoles('director'), upload.single('directorSignature'), async (req, res, next) => {
  try {
    const action = String(req.body.action || '');
    const reason = String(req.body.rejectionReason || '').trim();
    if (!['approve', 'reject'].includes(action)) return res.status(400).json({ message: 'Choose approve or reject.' });
    if (action === 'reject' && !reason) return res.status(400).json({ message: 'A rejection reason is required.' });
    if (action === 'approve' && !req.file) return res.status(400).json({ message: 'Upload the director signature before approving.' });
    const [rows] = await db.execute('SELECT * FROM vouchers WHERE id=?', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ message: 'Voucher not found.' });
    if (rows[0].status !== 'Pending Approval') return res.status(400).json({ message: 'Only pending vouchers can be approved or rejected.' });
    if (action === 'approve') {
      await db.execute("UPDATE vouchers SET status='Approved', director_signature=?, approval_date=NOW(), rejection_reason=NULL WHERE id=?", [`/uploads/signatures/${req.file.filename}`, req.params.id]);
    } else {
      await db.execute("UPDATE vouchers SET status='Rejected', rejection_reason=?, approval_date=NULL WHERE id=?", [reason, req.params.id]);
    }
    const [updated] = await db.execute(`${selectBase} WHERE v.id=?`, [req.params.id]);
    res.json(updated[0]);
  } catch (error) { next(error); }
});

module.exports = router;
