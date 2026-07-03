import { useEffect, useState } from 'react';
import api from '../utils/api';
import { formatINR, currentMonth, monthLabel } from '../utils/format';

const CATEGORIES = ['Food', 'Transport', 'Utilities', 'Housing', 'Healthcare', 'Education', 'Entertainment', 'Shopping', 'Other'];
const EMPTY_FORM = { category: '', limit: '', period: 'monthly', month: currentMonth(), notes: '' };

export default function Budgets() {
  const month = currentMonth();
  const [budgets, setBudgets] = useState([]);
  const [summary, setSummary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editId, setEditId] = useState(null);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const [bRes, sRes] = await Promise.all([
        api.get(`/budgets?month=${month}`),
        api.get(`/budgets/summary?month=${month}`),
      ]);
      setBudgets(bRes.data.data || []);
      setSummary(sRes.data.data || []);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => { setForm(EMPTY_FORM); setEditId(null); setError(''); setShowModal(true); };
  const openEdit = (b) => {
    setForm({ category: b.category, limit: b.limit, period: b.period, month: b.month || month, notes: b.notes || '' });
    setEditId(b._id);
    setError('');
    setShowModal(true);
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (editId) await api.put(`/budgets/${editId}`, form);
      else await api.post('/budgets', form);
      setShowModal(false);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save budget.');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this budget?')) return;
    await api.delete(`/budgets/${id}`);
    load();
  };

  const summaryMap = {};
  summary.forEach((s) => { summaryMap[s.category] = s; });

  return (
    <div className="main-content">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h2 className="page-title">Budgets</h2>
          <div className="page-subtitle">{monthLabel(month)} · Spending limits</div>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>+ New budget</button>
      </div>

      {loading ? (
        <div className="muted" style={{ textAlign: 'center', padding: '2rem' }}>Loading…</div>
      ) : budgets.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <h3 style={{ color: 'var(--navy)', marginBottom: '0.5rem' }}>No budgets yet</h3>
          <p className="muted">Set spending limits by category to track where your money goes.</p>
          <button className="btn btn-primary" onClick={openAdd} style={{ marginTop: '1rem' }}>Create your first budget</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
          {budgets.map((b) => {
            const s = summaryMap[b.category] || { spent: 0, percentage: 0, status: 'on-track', remaining: b.limit };
            return (
              <div key={b._id} className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--navy)' }}>{b.category}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--muted)', textTransform: 'capitalize' }}>{b.period}</div>
                  </div>
                  <span className={`badge ${s.status === 'exceeded' ? 'badge-expense' : s.status === 'warning' ? 'badge-warning' : 'badge-income'}`}>
                    {s.status === 'exceeded' ? 'Over limit' : s.status === 'warning' ? 'Near limit' : 'On track'}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.4rem' }}>
                  <span className="muted">Spent</span>
                  <span className="mono" style={{ fontWeight: 600 }}>{formatINR(s.spent)} <span className="muted">/ {formatINR(b.limit)}</span></span>
                </div>

                <div className="progress-bar">
                  <div className={`progress-fill ${s.status}`} style={{ width: `${Math.min(s.percentage, 100)}%` }} />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginTop: '0.4rem' }}>
                  <span className="muted">{s.percentage}% used</span>
                  <span className={s.remaining >= 0 ? 'text-income' : 'text-expense'}>
                    {s.remaining >= 0 ? formatINR(s.remaining) + ' left' : formatINR(Math.abs(s.remaining)) + ' over'}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                  <button className="btn btn-ghost" style={{ flex: 1, justifyContent: 'center', fontSize: '0.8rem', padding: '0.4rem' }} onClick={() => openEdit(b)}>Edit</button>
                  <button className="btn" style={{ flex: 1, justifyContent: 'center', fontSize: '0.8rem', padding: '0.4rem', background: 'rgba(107,28,28,0.08)', color: 'var(--maroon)', border: 'none' }} onClick={() => handleDelete(b._id)}>Delete</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <h3 className="modal-title">{editId ? 'Edit budget' : 'New budget'}</h3>
            {error && <div className="alert alert-error">{error}</div>}
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-field">
                  <label>Category</label>
                  <select className="input" name="category" value={form.category} onChange={handleChange} required>
                    <option value="">Select…</option>
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-field">
                  <label>Monthly limit (₹)</label>
                  <input className="input" name="limit" type="number" min="1" value={form.limit} onChange={handleChange} required />
                </div>
                <div className="form-field">
                  <label>Period</label>
                  <select className="input" name="period" value={form.period} onChange={handleChange}>
                    <option value="monthly">Monthly</option>
                    <option value="weekly">Weekly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
                <div className="form-field">
                  <label>Month</label>
                  <input className="input" name="month" type="month" value={form.month} onChange={handleChange} />
                </div>
                <div className="form-field full">
                  <label>Notes (optional)</label>
                  <input className="input" name="notes" value={form.notes} onChange={handleChange} placeholder="Any context…" />
                </div>
              </div>
              <div className="form-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editId ? 'Save changes' : 'Create budget'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}