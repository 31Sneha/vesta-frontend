import { useEffect, useState } from 'react';
import api from '../utils/api';
import { formatINR, formatDate } from '../utils/format';

const EMPTY_FORM = { amount: '', type: 'expense', category: '', date: new Date().toISOString().split('T')[0], note: '' };

const CATEGORIES = ['Food', 'Transport', 'Utilities', 'Housing', 'Healthcare', 'Education', 'Entertainment', 'Shopping', 'Salary', 'Freelance', 'Investment', 'Other'];

export default function Transactions() {
  const [txns, setTxns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editId, setEditId] = useState(null);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const { data } = await api.get('/transactions');
      setTxns(data.data || data || []);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => { setForm(EMPTY_FORM); setEditId(null); setError(''); setShowModal(true); };
  const openEdit = (tx) => {
    setForm({ amount: tx.amount, type: tx.type, category: tx.category, date: tx.date?.split('T')[0], note: tx.note || '' });
    setEditId(tx._id);
    setError('');
    setShowModal(true);
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (editId) await api.put(`/transactions/${editId}`, form);
      else await api.post('/transactions', form);
      setShowModal(false);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save transaction.');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this transaction?')) return;
    await api.delete(`/transactions/${id}`);
    load();
  };

  return (
    <div className="main-content">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h2 className="page-title">Transactions</h2>
          <div className="page-subtitle">Your complete financial record</div>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>+ Add transaction</button>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div className="muted" style={{ padding: '2rem', textAlign: 'center' }}>Loading…</div>
        ) : txns.length === 0 ? (
          <div className="muted" style={{ padding: '2rem', textAlign: 'center' }}>No transactions found.</div>
        ) : (
          <table className="fs-table">
            <thead>
              <tr>
                <th>Description</th>
                <th>Category</th>
                <th>Date</th>
                <th style={{ textAlign: 'right' }}>Amount</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {txns.map((tx) => (
                <tr key={tx._id}>
                  <td>
                    <div style={{ fontWeight: 500 }}>{tx.note || tx.category}</div>
                  </td>
                  <td><span className={`badge badge-${tx.type}`}>{tx.category}</span></td>
                  <td className="muted" style={{ fontSize: '0.85rem' }}>{formatDate(tx.date)}</td>
                  <td style={{ textAlign: 'right' }}>
                    <span className={`mono ${tx.type === 'income' ? 'text-income' : 'text-expense'}`} style={{ fontWeight: 600 }}>
                      {tx.type === 'income' ? '+' : '−'}{formatINR(tx.amount)}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      <button className="btn btn-ghost" style={{ padding: '0.3rem 0.7rem', fontSize: '0.8rem' }} onClick={() => openEdit(tx)}>Edit</button>
                      <button className="btn" style={{ padding: '0.3rem 0.7rem', fontSize: '0.8rem', background: 'rgba(107,28,28,0.08)', color: 'var(--maroon)', border: 'none' }} onClick={() => handleDelete(tx._id)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <h3 className="modal-title">{editId ? 'Edit transaction' : 'New transaction'}</h3>
            {error && <div className="alert alert-error">{error}</div>}
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-field">
                  <label>Amount (₹)</label>
                  <input className="input" name="amount" type="number" min="0" step="0.01" value={form.amount} onChange={handleChange} required />
                </div>
                <div className="form-field">
                  <label>Type</label>
                  <select className="input" name="type" value={form.type} onChange={handleChange}>
                    <option value="expense">Expense</option>
                    <option value="income">Income</option>
                  </select>
                </div>
                <div className="form-field">
                  <label>Category</label>
                  <select className="input" name="category" value={form.category} onChange={handleChange} required>
                    <option value="">Select…</option>
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-field">
                  <label>Date</label>
                  <input className="input" name="date" type="date" value={form.date} onChange={handleChange} required />
                </div>
                <div className="form-field full">
                  <label>Note (optional)</label>
                  <input className="input" name="note" value={form.note} onChange={handleChange} placeholder="e.g. Grocery run" />
                </div>
              </div>
              <div className="form-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editId ? 'Save changes' : 'Add transaction'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}