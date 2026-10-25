import { useCallback, useEffect, useMemo, useState } from 'react';
import './App.css';
import {
  WalletCards, LayoutDashboard, ReceiptText, Plus, Search, LogOut,
  FileText, Clock3, CircleCheck, CircleX, IndianRupee, ArrowUpRight, Pencil,
  Trash2, Send, Eye, X, UploadCloud, ShieldCheck, Building2, UserRound,
  Check, AlertCircle, RefreshCw
} from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const statusOptions = ['All statuses', 'Draft', 'Pending Approval', 'Approved', 'Rejected'];
const blankForm = { expenseDate: new Date().toISOString().slice(0, 10), department: '', expenseTitle: '', category: 'Travel', description: '', amount: '' };

async function request(path, options = {}, token) {
  const headers = { ...(options.headers || {}) };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (options.body && !(options.body instanceof FormData)) headers['Content-Type'] = 'application/json';
  const response = await fetch(`${API}${path}`, { ...options, headers });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || 'The request could not be completed.');
  return data;
}

function money(value) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(Number(value || 0));
}
function prettyDate(value) {
  if (!value) return '—';
  const date = new Date(`${String(value).slice(0, 10)}T00:00:00`);
  return Number.isNaN(date.getTime()) ? String(value).slice(0, 10) : date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}
function StatusBadge({ status }) {
  const key = (status || 'Draft').toLowerCase().replaceAll(' ', '-');
  return <span className={`status-badge status-${key}`}><span className="status-dot" />{status || 'Draft'}</span>;
}
function Notice({ notice, onClose }) {
  if (!notice) return null;
  return <div className={`notice ${notice.type}`} role="status"><AlertCircle size={17} /><span>{notice.text}</span><button className="icon-button notice-close" onClick={onClose} aria-label="Close message"><X size={16} /></button></div>;
}

function Login({ onLogin, onRegister, busy, error }) {
  const [mode, setMode] = useState('login');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [formError, setFormError] = useState('');
  const [success, setSuccess] = useState('');
  const submit = async e => {
    e.preventDefault(); setFormError(''); setSuccess('');
    if (mode === 'register') {
      if (password.length < 12) { setFormError('Use a password with at least 12 characters.'); return; }
      if (password !== confirmPassword) { setFormError('Passwords do not match.'); return; }
      try { const result = await onRegister({ fullName, email, department, password }); setSuccess(result.message || 'Account created. You can now sign in.'); setMode('login'); setPassword(''); setConfirmPassword(''); }
      catch (err) { setFormError(err.message || 'Registration failed.'); }
    } else onLogin(email, password);
  };
  return <main className="login-screen">
    <div className="login-brand"><div className="brand-mark"><WalletCards size={23} /></div><span>Voucher<span className="brand-light">Flow</span></span></div>
    <section className="login-card">
      <div className="login-eyebrow"><ShieldCheck size={15} /> SECURE WORKSPACE</div>
      <h1>{mode === 'login' ? 'Welcome back' : 'Create your account'}</h1>
      <p className="muted">{mode === 'login' ? 'Sign in to manage your expense vouchers.' : 'Register as an employee to get started.'}</p>
      {(formError || (mode === 'login' && error)) && <div className="form-error"><AlertCircle size={16} />{formError || error}</div>}
      {success && <div className="form-success" role="status">{success}</div>}
      <form className="login-form" onSubmit={submit}>
        {mode === 'register' && <>
          <label>Full name<input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Your full name" autoComplete="name" maxLength={120} required /></label>
          <label>Department (optional)<input value={department} onChange={e => setDepartment(e.target.value)} placeholder="e.g. Finance" maxLength={100} /></label>
        </>}
        <label>Email address<input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com" autoComplete="email" maxLength={150} required /></label>
        <label>Password<input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder={mode === 'register' ? 'At least 12 characters' : 'Enter your password'} autoComplete={mode === 'register' ? 'new-password' : 'current-password'} minLength={mode === 'register' ? 12 : 1} maxLength={128} required /></label>
        {mode === 'register' && <label>Confirm password<input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Re-enter your password" autoComplete="new-password" minLength={12} maxLength={128} required /></label>}
        <button className="button button-primary full-width" disabled={busy}>{busy ? (mode === 'register' ? 'Creating account…' : 'Signing in…') : (mode === 'register' ? 'Create employee account' : 'Sign in')} <ArrowUpRight size={17} /></button>
      </form>
      <p className="auth-switch">{mode === 'login' ? "Don't have an account?" : 'Already registered?'} <button type="button" className="text-button" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setFormError(''); setSuccess(''); }}>{mode === 'login' ? 'Register' : 'Sign in'}</button></p>
      {mode === 'register' && <p className="registration-note">Public registration is limited to Employee accounts. Director and Accounts accounts must be created locally by the project administrator.</p>}
    </section>
    <p className="login-footer">Expense Voucher Management System <span>•</span> Internal company workspace</p>
  </main>;
}

function VoucherForm({ initial, onCancel, onSave, saving }) {
  const [form, setForm] = useState(initial ? { ...blankForm, expenseDate: String(initial.expense_date || initial.expenseDate || blankForm.expenseDate).slice(0, 10), department: initial.department || '', expenseTitle: initial.expense_title || initial.expenseTitle || '', category: initial.category || 'Travel', description: initial.description || '', amount: initial.amount ?? '' } : { ...blankForm });
  const [signature, setSignature] = useState(null);
  const [formError, setFormError] = useState('');
  const set = (key, value) => setForm(prev => ({ ...prev, [key]: value }));
  const submit = async action => {
    setFormError('');
    if (!form.expenseDate || !form.department.trim() || !form.expenseTitle.trim() || !form.category || form.amount === '' || Number(form.amount) <= 0) {
      setFormError('Complete all required fields and enter an amount greater than zero.'); return;
    }
    if (action === 'submit' && !signature && !initial?.employee_signature) {
      setFormError('Upload your signature before submitting the voucher.'); return;
    }
    const data = new FormData();
    Object.entries(form).forEach(([key, value]) => data.append(key, value ?? ''));
    data.append('action', action);
    if (signature) data.append('employeeSignature', signature);
    await onSave(data, action, setFormError);
  };
  return <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) onCancel(); }}>
    <section className="modal-card" role="dialog" aria-modal="true" aria-labelledby="voucher-form-title">
      <div className="modal-heading"><div><span className="eyebrow">EXPENSE DETAILS</span><h2 id="voucher-form-title">{initial ? 'Edit draft voucher' : 'Create expense voucher'}</h2><p className="muted">Fields marked with * are required.</p></div><button className="icon-button" onClick={onCancel} aria-label="Close"><X size={20} /></button></div>
      {formError && <div className="form-error"><AlertCircle size={16} />{formError}</div>}
      <form onSubmit={e => { e.preventDefault(); submit('draft'); }}>
        <div className="form-grid">
          <label>Expense title *<input value={form.expenseTitle} onChange={e => set('expenseTitle', e.target.value)} placeholder="e.g. Client meeting travel" required maxLength={150} /></label>
          <label>Department *<input value={form.department} onChange={e => set('department', e.target.value)} placeholder="e.g. Finance" required maxLength={100} /></label>
          <label>Expense date *<input type="date" value={String(form.expenseDate || '').slice(0, 10)} onChange={e => set('expenseDate', e.target.value)} required /></label>
          <label>Category *<select value={form.category} onChange={e => set('category', e.target.value)} required>{['Travel', 'Meals', 'Office Supplies', 'Accommodation', 'Communication', 'Training', 'Other'].map(x => <option key={x}>{x}</option>)}</select></label>
          <label className="field-wide">Amount (₹) *<div className="amount-input"><IndianRupee size={16} /><input type="number" min="0.01" step="0.01" value={form.amount} onChange={e => set('amount', e.target.value)} placeholder="0.00" required /></div></label>
          <label className="field-wide">Description<textarea rows="3" value={form.description || ''} onChange={e => set('description', e.target.value)} placeholder="Add a short explanation for this expense…" maxLength={2000} /></label>
          <label className="field-wide upload-label">Employee signature {initial?.employee_signature && <span className="existing-file">Signature already uploaded</span>}<span className="upload-box"><UploadCloud size={20} /><span><strong>{signature ? signature.name : 'Upload signature image'}</strong><small>PNG, JPG or WEBP · Max 2 MB {initial?.status === 'Draft' ? '' : '· Required before submit'}</small></span><input type="file" accept="image/png,image/jpeg,image/webp" onChange={e => setSignature(e.target.files?.[0] || null)} /></span></label>
        </div>
        <div className="modal-actions"><button type="button" className="button button-secondary" onClick={onCancel}>Cancel</button><button type="submit" className="button button-secondary" disabled={saving}>{saving ? 'Saving…' : 'Save draft'}</button><button type="button" className="button button-primary" disabled={saving} onClick={() => submit('submit')}><Send size={15} /> Submit for approval</button></div>
      </form>
    </section>
  </div>;
}

function DetailModal({ voucher, user, onClose, onDecision, busy }) {
  const [action, setAction] = useState('approve');
  const [reason, setReason] = useState('');
  const [signature, setSignature] = useState(null);
  const [error, setError] = useState('');
  const canDecide = user.role === 'director' && voucher.status === 'Pending Approval';
  const decide = async () => {
    setError('');
    if (action === 'reject' && !reason.trim()) { setError('Please provide a rejection reason.'); return; }
    if (action === 'approve' && !signature) { setError('Upload the director signature before approving.'); return; }
    const data = new FormData(); data.append('action', action); data.append('rejectionReason', reason);
    if (signature) data.append('directorSignature', signature);
    await onDecision(voucher.id, data, setError);
  };
  return <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}><section className="modal-card detail-modal" role="dialog" aria-modal="true">
    <div className="modal-heading"><div><span className="eyebrow">{voucher.voucher_number}</span><h2>{voucher.expense_title}</h2><p className="muted">Submitted by {voucher.employee_name}</p></div><button className="icon-button" onClick={onClose} aria-label="Close"><X size={20} /></button></div>
    <div className="detail-status"><StatusBadge status={voucher.status} /><strong>{money(voucher.amount)}</strong></div>
    <div className="detail-grid">{[['Expense date', prettyDate(voucher.expense_date)], ['Department', voucher.department], ['Category', voucher.category], ['Created', prettyDate(voucher.created_at)], ['Employee email', voucher.employee_email], ['Approval date', voucher.approval_date ? new Date(voucher.approval_date).toLocaleDateString('en-IN') : '—']].map(([k,v]) => <div className="detail-item" key={k}><span>{k}</span><strong>{v || '—'}</strong></div>)}</div>
    <div className="detail-description"><span>Description</span><p>{voucher.description || 'No description provided.'}</p></div>
    <div className="signature-row"><div><span>Employee signature</span>{voucher.employee_signature ? <a href={`http://localhost:5000${voucher.employee_signature}`} target="_blank" rel="noreferrer">View signature <ArrowUpRight size={13} /></a> : <small>Not uploaded</small>}</div><div><span>Director signature</span>{voucher.director_signature ? <a href={`http://localhost:5000${voucher.director_signature}`} target="_blank" rel="noreferrer">View signature <ArrowUpRight size={13} /></a> : <small>Not available</small>}</div></div>
    {voucher.rejection_reason && <div className="rejection-box"><strong>Reason for rejection</strong><p>{voucher.rejection_reason}</p></div>}
    {canDecide && <div className="decision-panel"><h3>Review voucher</h3>{error && <div className="form-error"><AlertCircle size={15} />{error}</div>}<div className="decision-options"><label className={`decision-option ${action === 'approve' ? 'selected' : ''}`}><input type="radio" checked={action === 'approve'} onChange={() => setAction('approve')} />Approve</label><label className={`decision-option ${action === 'reject' ? 'selected reject-selected' : ''}`}><input type="radio" checked={action === 'reject'} onChange={() => setAction('reject')} />Reject</label></div>{action === 'approve' ? <label className="upload-label">Director signature *<span className="upload-box"><UploadCloud size={19} /><span><strong>{signature ? signature.name : 'Upload director signature'}</strong><small>PNG, JPG or WEBP · Max 2 MB</small></span><input type="file" accept="image/png,image/jpeg,image/webp" onChange={e => setSignature(e.target.files?.[0] || null)} /></span></label> : <label>Rejection reason *<textarea rows="3" value={reason} onChange={e => setReason(e.target.value)} placeholder="Explain why this voucher is being rejected…" required /></label>}<button className={`button ${action === 'approve' ? 'button-primary' : 'button-danger'} full-width`} onClick={decide} disabled={busy}>{busy ? 'Saving decision…' : action === 'approve' ? <><Check size={16} /> Approve voucher</> : <><CircleX size={16} /> Reject voucher</>}</button></div>}
    <div className="modal-actions"><button className="button button-secondary" onClick={onClose}>Close details</button></div>
  </section></div>;
}

export default function App() {
  const [token, setToken] = useState(() => sessionStorage.getItem('vf_token') || '');
  const [user, setUser] = useState(() => { try { return JSON.parse(sessionStorage.getItem('vf_user') || 'null'); } catch { return null; } });
  const [loginBusy, setLoginBusy] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [vouchers, setVouchers] = useState([]);
  const [summary, setSummary] = useState({ total: 0, totalAmount: 0, Draft: 0, 'Pending Approval': 0, Approved: 0, Rejected: 0 });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [decisionBusy, setDecisionBusy] = useState(false);
  const [notice, setNotice] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All statuses');
  const [modal, setModal] = useState(null);
  const [activePage, setActivePage] = useState('dashboard');
  const [refreshKey, setRefreshKey] = useState(0);

  const login = async (email, password) => {
    setLoginBusy(true); setLoginError('');
    try {
      const data = await request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
      sessionStorage.setItem('vf_token', data.token); sessionStorage.setItem('vf_user', JSON.stringify(data.user));
      setToken(data.token); setUser(data.user); setActivePage('dashboard');
    } catch (error) { setLoginError(error.message); }
    finally { setLoginBusy(false); }
  };
  const registerUser = async details => {
    setLoginBusy(true);
    try { return await request('/auth/register', { method: 'POST', body: JSON.stringify(details) }); }
    finally { setLoginBusy(false); }
  };
  const logout = () => { sessionStorage.removeItem('vf_token'); sessionStorage.removeItem('vf_user'); setToken(''); setUser(null); setVouchers([]); setSummary({ total: 0, totalAmount: 0, Draft: 0, 'Pending Approval': 0, Approved: 0, Rejected: 0 }); };

  const loadData = useCallback(async () => {
    if (!token || !user) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set('search', search.trim());
      if (statusFilter !== 'All statuses') params.set('status', statusFilter);
      const [list, totals] = await Promise.all([request(`/vouchers?${params.toString()}`, {}, token), request('/vouchers/summary', {}, token)]);
      setVouchers(list); setSummary(totals);
    } catch (error) {
      setNotice({ type: 'error', text: error.message });
      if (/session|log in/i.test(error.message)) logout();
    } finally { setLoading(false); }
  }, [token, user, search, statusFilter, refreshKey]);
  useEffect(() => { loadData(); }, [loadData]);

  const filteredTitle = useMemo(() => {
    if (user?.role === 'director') return activePage === 'pending' ? 'Pending approvals' : 'Voucher register';
    if (user?.role === 'accounts') return 'Voucher register';
    return activePage === 'create' ? 'Create voucher' : 'My vouchers';
  }, [user, activePage]);

  const saveVoucher = async (formData, action, setFormError) => {
    setSaving(true);
    try {
      const editing = modal?.type === 'edit';
      const result = await request(editing ? `/vouchers/${modal.voucher.id}` : '/vouchers', { method: editing ? 'PUT' : 'POST', body: formData }, token);
      setModal(null); setNotice({ type: 'success', text: action === 'submit' ? `${result.voucher_number} submitted for approval.` : editing ? 'Draft voucher updated.' : 'Draft voucher saved.' });
      setRefreshKey(v => v + 1); setActivePage('vouchers');
    } catch (error) { setFormError(error.message); }
    finally { setSaving(false); }
  };
  const deleteVoucher = async voucher => {
    if (!window.confirm(`Delete draft ${voucher.voucher_number}? This cannot be undone.`)) return;
    try { await request(`/vouchers/${voucher.id}`, { method: 'DELETE' }, token); setNotice({ type: 'success', text: 'Draft voucher deleted.' }); setRefreshKey(v => v + 1); }
    catch (error) { setNotice({ type: 'error', text: error.message }); }
  };
  const submitVoucher = async voucher => {
    if (!window.confirm(`Submit ${voucher.voucher_number} for director approval?`)) return;
    try { await request(`/vouchers/${voucher.id}/submit`, { method: 'POST', body: JSON.stringify({}) }, token); setNotice({ type: 'success', text: 'Voucher submitted for approval.' }); setRefreshKey(v => v + 1); }
    catch (error) { setNotice({ type: 'error', text: error.message }); }
  };
  const decision = async (id, formData, setError) => {
    setDecisionBusy(true);
    try {
      const updated = await request(`/vouchers/${id}/decision`, { method: 'POST', body: formData }, token);
      setModal(null); setNotice({ type: 'success', text: `${updated.voucher_number} ${updated.status.toLowerCase()}.` }); setRefreshKey(v => v + 1);
    } catch (error) { setError(error.message); }
    finally { setDecisionBusy(false); }
  };

  if (!token || !user) return <Login onLogin={login} onRegister={registerUser} busy={loginBusy} error={loginError} />;
  const roleLabel = user.role === 'employee' ? 'Employee workspace' : user.role === 'director' ? 'Director workspace' : 'Accounts workspace';
  const pageLabel = user.role === 'employee' ? 'My Vouchers' : 'Vouchers';
  const navItems = [{ id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard }, { id: 'vouchers', label: pageLabel, icon: ReceiptText }, ...(user.role === 'employee' ? [{ id: 'create', label: 'Create voucher', icon: Plus }] : []), ...(user.role === 'director' ? [{ id: 'pending', label: 'Pending approvals', icon: Clock3 }] : [])];
  const visibleVouchers = activePage === 'pending' ? vouchers.filter(v => v.status === 'Pending Approval') : vouchers;
  const pageHeading = activePage === 'dashboard' ? 'Dashboard overview' : activePage === 'create' ? 'Create voucher' : filteredTitle;

  return <div className="app-shell">
    <aside className="sidebar"><div className="sidebar-brand"><div className="brand-mark"><WalletCards size={22} /></div><span>Voucher<span className="brand-light">Flow</span></span></div><div className="workspace-label">WORKSPACE</div><nav className="side-nav">{navItems.map(item => <button key={item.id} className={`nav-item ${activePage === item.id ? 'active' : ''}`} onClick={() => item.id === 'create' ? setModal({ type: 'create' }) : setActivePage(item.id)}><item.icon size={18} /><span>{item.label}</span>{item.id === 'pending' && summary['Pending Approval'] > 0 && <span className="nav-count">{summary['Pending Approval']}</span>}</button>)}</nav><div className="sidebar-bottom"><div className="security-note"><ShieldCheck size={17} /><div><strong>Role-based access</strong><span>Secure voucher workflow</span></div></div><button className="nav-item logout-button" onClick={logout}><LogOut size={18} /><span>Sign out</span></button></div></aside>
    <main className="main-area"><header className="topbar"><div className="mobile-brand"><div className="brand-mark"><WalletCards size={19} /></div><span>Voucher<span className="brand-light">Flow</span></span></div><div className="breadcrumb"><span>Workspace</span><span className="crumb-separator">/</span><strong>{activePage === 'dashboard' ? 'Dashboard' : activePage === 'pending' ? 'Pending approvals' : activePage === 'create' ? 'Create voucher' : pageLabel}</strong></div><div className="topbar-user"><div className="avatar">{user.name.split(' ').map(x => x[0]).slice(0,2).join('').toUpperCase()}</div><div className="user-copy"><strong>{user.name}</strong><span>{user.role.charAt(0).toUpperCase() + user.role.slice(1)}</span></div><button className="icon-button top-logout" title="Sign out" onClick={logout}><LogOut size={17} /></button></div></header>
      <div className="content-area"><div className="page-heading"><div><div className="eyebrow">{roleLabel.toUpperCase()}</div><h1>{pageHeading}</h1><p>{activePage === 'dashboard' ? 'A clear view of expense vouchers and their current status.' : activePage === 'pending' ? 'Review submitted vouchers and record your decision.' : user.role === 'employee' ? 'Create, track and manage your expense submissions.' : 'Review voucher details, signatures and approval status.'}</p></div>{user.role === 'employee' && activePage !== 'create' && <button className="button button-primary" onClick={() => setModal({ type: 'create' })}><Plus size={17} /> New voucher</button>}</div>
      <Notice notice={notice} onClose={() => setNotice(null)} />
      {activePage === 'dashboard' && <>
        <section className="stats-grid">
          <StatCard icon={FileText} label="Total vouchers" value={summary.total} note="In your workspace" tone="violet" />
          <StatCard icon={Clock3} label="Pending approval" value={summary['Pending Approval']} note="Awaiting review" tone="amber" />
          <StatCard icon={CircleCheck} label="Approved" value={summary.Approved} note="Approved vouchers" tone="green" />
          <StatCard icon={CircleX} label="Rejected" value={summary.Rejected} note="Requires attention" tone="red" />
        </section>
        <section className="panel dashboard-panel"><div className="panel-heading"><div><h2>Recent vouchers</h2><p>Latest records from your voucher register.</p></div><button className="text-button" onClick={() => setActivePage(user.role === 'director' ? 'pending' : 'vouchers')}>View all <ArrowUpRight size={15} /></button></div><VoucherTable vouchers={vouchers.slice(0,5)} user={user} onView={v => setModal({ type: 'detail', voucher: v })} onEdit={v => setModal({ type: 'edit', voucher: v })} onDelete={deleteVoucher} onSubmit={submitVoucher} loading={loading} compact /></section>
        {user.role === 'employee' && <div className="dashboard-total"><div className="total-icon"><IndianRupee size={20} /></div><div><span>Total amount claimed</span><strong>{money(summary.totalAmount)}</strong></div><span className="total-caption">Across your vouchers</span></div>}
      </>}
      {activePage !== 'dashboard' && activePage !== 'create' && <section className="panel register-panel"><div className="register-toolbar"><div><h2>{activePage === 'pending' ? 'Approval queue' : 'Voucher register'}</h2><p>{visibleVouchers.length} {visibleVouchers.length === 1 ? 'record' : 'records'} found</p></div><div className="table-filters"><label className="search-box"><Search size={16} /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search vouchers…" aria-label="Search vouchers" /></label><select className="filter-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} aria-label="Filter by status">{statusOptions.map(s => <option key={s} value={s}>{s}</option>)}</select><button className="icon-button refresh-button" title="Refresh" onClick={() => setRefreshKey(v => v + 1)}><RefreshCw size={16} /></button></div></div><VoucherTable vouchers={visibleVouchers} user={user} onView={v => setModal({ type: 'detail', voucher: v })} onEdit={v => setModal({ type: 'edit', voucher: v })} onDelete={deleteVoucher} onSubmit={submitVoucher} loading={loading} /></section>}
      {activePage === 'create' && user.role === 'employee' && <section className="panel create-hint"><div className="create-icon"><Plus size={22} /></div><h2>Create a new expense voucher</h2><p>Enter the expense details, upload your signature, and submit it for director approval when ready.</p><button className="button button-primary" onClick={() => setModal({ type: 'create' })}><Plus size={17} /> Open voucher form</button></section>}
      <footer className="app-footer"><span>VoucherFlow <span className="footer-dot">•</span> Expense Voucher Management</span><span>Internal use only</span></footer>
      </div>
    </main>
    {modal?.type === 'create' && <VoucherForm onCancel={() => setModal(null)} onSave={saveVoucher} saving={saving} />}
    {modal?.type === 'edit' && <VoucherForm initial={modal.voucher} onCancel={() => setModal(null)} onSave={saveVoucher} saving={saving} />}
    {modal?.type === 'detail' && <DetailModal voucher={modal.voucher} user={user} onClose={() => setModal(null)} onDecision={decision} busy={decisionBusy} />}
  </div>;
}

function StatCard({ icon: Icon, label, value, note, tone }) {
  return <article className="stat-card"><div className={`stat-icon ${tone}`}><Icon size={19} /></div><div className="stat-copy"><span>{label}</span><strong>{value}</strong><small>{note}</small></div></article>;
}

function VoucherTable({ vouchers, user, onView, onEdit, onDelete, onSubmit, loading, compact = false }) {
  const role = user.role;
  return <div className="table-wrap"><table className="voucher-table"><thead><tr><th>Voucher</th>{role !== 'employee' && <th>Employee</th>}<th>Expense date</th><th>Department</th><th>Amount</th><th>Status</th><th className="actions-column">Actions</th></tr></thead><tbody>
    {loading ? <tr><td colSpan={role === 'employee' ? 6 : 7} className="table-message"><span className="loader" /> Loading vouchers…</td></tr> : vouchers.length === 0 ? <tr><td colSpan={role === 'employee' ? 6 : 7} className="empty-cell"><div className="empty-icon"><ReceiptText size={22} /></div><strong>No vouchers found</strong><span>{role === 'employee' ? 'Create a voucher to get started.' : 'Vouchers will appear here when available.'}</span></td></tr> : vouchers.map(v => <tr key={v.id}><td><div className="voucher-cell"><span className="voucher-file"><FileText size={16} /></span><span><strong>{v.voucher_number}</strong><small>{v.expense_title}</small></span></div></td>{role !== 'employee' && <td><div className="employee-cell"><span className="mini-avatar">{v.employee_name.split(' ').map(x => x[0]).slice(0,2).join('').toUpperCase()}</span><span>{v.employee_name}</span></div></td>}<td>{prettyDate(v.expense_date)}</td><td>{v.department}</td><td className="amount-cell">{money(v.amount)}</td><td><StatusBadge status={v.status} /></td><td><div className="row-actions"><button className="icon-button action-view" onClick={() => onView(v)} title="View details" aria-label="View details"><Eye size={16} /></button>{role === 'employee' && v.status === 'Draft' && <><button className="icon-button action-edit" onClick={() => onEdit(v)} title="Edit draft" aria-label="Edit draft"><Pencil size={15} /></button><button className="icon-button action-delete" onClick={() => onDelete(v)} title="Delete draft" aria-label="Delete draft"><Trash2 size={15} /></button><button className="icon-button action-submit" onClick={() => onSubmit(v)} title="Submit draft" aria-label="Submit draft"><Send size={15} /></button></>}</div></td></tr>)}</tbody></table></div>;
}
