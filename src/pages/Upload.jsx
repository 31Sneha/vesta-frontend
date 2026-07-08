import { useState } from 'react';
import api from '../utils/api';
import { formatINR, formatDate } from '../utils/format';

export default function Upload() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState([]);
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [step, setStep] = useState(1); // 1=upload, 2=preview, 3=done

  const CATEGORIES = ['Food', 'Transport', 'Utilities', 'Housing', 'Healthcare', 'Education', 'Entertainment', 'Shopping', 'Salary', 'Freelance', 'Investment', 'Other'];

  const handleFile = (e) => {
    setFile(e.target.files[0]);
    setError('');
    setSuccess('');
    setPreview([]);
    setStep(1);
  };

  const handleUpload = async () => {
    if (!file) return setError('Please select a file first.');
    setLoading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      const { data } = await api.post('/upload/statement', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setPreview(data.data || []);
      setSelected(data.data.map((_, i) => i));
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to parse file.');
    }
    setLoading(false);
  };

  const toggleRow = (idx) => {
    setSelected((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  };

  const toggleAll = () => {
    setSelected(selected.length === preview.length ? [] : preview.map((_, i) => i));
  };

  const updateCategory = (idx, category) => {
    setPreview((prev) =>
      prev.map((row, i) => (i === idx ? { ...row, category } : row))
    );
  };

  const updateType = (idx, type) => {
    setPreview((prev) =>
      prev.map((row, i) => (i === idx ? { ...row, type } : row))
    );
  };

  const handleConfirm = async () => {
    const toImport = preview.filter((_, i) => selected.includes(i));
    if (toImport.length === 0) return setError('Select at least one transaction to import.');
    setConfirming(true);
    setError('');
    try {
      const { data } = await api.post('/upload/confirm', { transactions: toImport });
      setSuccess(`Successfully imported ${data.count} transactions!`);
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to import transactions.');
    }
    setConfirming(false);
  };

  return (
    <div className="main-content">
      <div className="page-header">
        <h2 className="page-title">Import Statement</h2>
        <div className="page-subtitle">Upload your HDFC bank statement (Excel or CSV)</div>
      </div>

      {/* Step 1 — File Upload */}
      {step === 1 && (
        <div className="card" style={{ maxWidth: 560 }}>
          <h3 style={{ color: 'var(--navy)', fontSize: '1.1rem', marginBottom: '0.5rem' }}>Upload your bank statement</h3>
          <p className="muted" style={{ fontSize: '0.85rem', marginBottom: '1.5rem' }}>
            Export your statement from HDFC NetBanking as Excel (.xls/.xlsx) or CSV. Your file is processed in memory and never stored on our servers.
          </p>

          {error && <div className="alert alert-error">{error}</div>}

          <div style={{ border: '2px dashed var(--border)', borderRadius: 'var(--radius-lg)', padding: '2rem', textAlign: 'center', marginBottom: '1.5rem', background: 'var(--beige)' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📄</div>
            <div style={{ fontSize: '0.9rem', color: 'var(--muted)', marginBottom: '1rem' }}>
              {file ? file.name : 'Choose an Excel or CSV file'}
            </div>
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFile}
              style={{ display: 'none' }}
              id="file-input"
            />
            <label htmlFor="file-input" className="btn btn-ghost" style={{ cursor: 'pointer' }}>
              Browse files
            </label>
          </div>

          <button
            className="btn btn-primary"
            onClick={handleUpload}
            disabled={!file || loading}
            style={{ width: '100%', justifyContent: 'center', padding: '0.75rem' }}
          >
            {loading ? 'Parsing statement…' : 'Parse statement'}
          </button>
        </div>
      )}

      {/* Step 2 — Preview & Review */}
      {step === 2 && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <span style={{ fontWeight: 600, color: 'var(--navy)' }}>{preview.length} transactions found</span>
              <span className="muted" style={{ fontSize: '0.85rem', marginLeft: '0.75rem' }}>{selected.length} selected for import</span>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button className="btn btn-ghost" onClick={() => setStep(1)}>← Back</button>
              <button
                className="btn btn-primary"
                onClick={handleConfirm}
                disabled={confirming || selected.length === 0}
              >
                {confirming ? 'Importing…' : `Import ${selected.length} transactions`}
              </button>
            </div>
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <table className="fs-table">
              <thead>
                <tr>
                  <th style={{ width: 40 }}>
                    <input type="checkbox" checked={selected.length === preview.length} onChange={toggleAll} />
                  </th>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Type</th>
                  <th>Category</th>
                  <th style={{ textAlign: 'right' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {preview.map((row, i) => (
                  <tr key={i} style={{ opacity: selected.includes(i) ? 1 : 0.4 }}>
                    <td>
                      <input type="checkbox" checked={selected.includes(i)} onChange={() => toggleRow(i)} />
                    </td>
                    <td style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>{row.date}</td>
                    <td style={{ fontSize: '0.85rem', maxWidth: 260 }}>
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.note}</div>
                    </td>
                    <td>
                      <select
                        className="input"
                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}
                        value={row.type}
                        onChange={(e) => updateType(i, e.target.value)}
                      >
                        <option value="expense">Expense</option>
                        <option value="income">Income</option>
                      </select>
                    </td>
                    <td>
                      <select
                        className="input"
                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}
                        value={row.category}
                        onChange={(e) => updateCategory(i, e.target.value)}
                      >
                        {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <span className={`mono ${row.type === 'income' ? 'text-income' : 'text-expense'}`} style={{ fontWeight: 600 }}>
                        {row.type === 'income' ? '+' : '−'}{formatINR(row.amount)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Step 3 — Done */}
      {step === 3 && (
        <div className="card" style={{ maxWidth: 480, textAlign: 'center', padding: '3rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
          <h3 style={{ color: 'var(--navy)', marginBottom: '0.5rem' }}>{success}</h3>
          <p className="muted" style={{ fontSize: '0.85rem', marginBottom: '1.5rem' }}>
            Your transactions are now in Vesta. Head to Reports to see your spending breakdown.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
            <button className="btn btn-ghost" onClick={() => { setStep(1); setFile(null); setPreview([]); setSelected([]); setSuccess(''); }}>
              Upload another
            </button>
            <a href="/reports" className="btn btn-primary">View Reports →</a>
          </div>
        </div>
      )}
    </div>
  );
}