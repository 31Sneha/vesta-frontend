import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { formatINR, formatDate, currentMonth, monthLabel } from '../utils/format';

export default function Dashboard() {
  const { user } = useAuth();
  const month = currentMonth();
  const [summary, setSummary] = useState(null);
  const [recent, setRecent] = useState([]);
  const [budgetSummary, setBudgetSummary] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [sumRes, txRes, budRes] = await Promise.all([
          api.get(`/reports/monthly-summary?month=${month}`),
          api.get('/transactions'),
          api.get(`/budgets/summary?month=${month}`),
        ]);
        setSummary(sumRes.data.data);
        setRecent((txRes.data.data || txRes.data || []).slice(0, 5));
        setBudgetSummary(budRes.data.data || []);
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    };
    fetchData();
  }, [month]);

  if (loading) {
    return (
      <div className="main-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div className="muted">Loading your finances…</div>
      </div>
    );
  }

  const savings = summary?.netSavings ?? 0;

  return (
    <div className="main-content">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2 className="page-title">Good {getGreeting()}, {user?.name?.split(' ')[0]}.</h2>
          <div className="page-subtitle">{monthLabel(month)} at a glance</div>
        </div>
        <img
          src="/logo_Vesta.png"
          alt="Vesta logo"
          style={{ width: '240px', height: '240px' }}
        />
      </div>

      <div className="kpi-row">
        <div className="kpi-card">
          <div className="kpi-label">Income</div>
          <div className="kpi-value text-income mono">{formatINR(summary?.income?.total ?? 0)}</div>
          <div className="kpi-sub">{summary?.income?.count ?? 0} transactions</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Expenses</div>
          <div className="kpi-value text-expense mono">{formatINR(summary?.expense?.total ?? 0)}</div>
          <div className="kpi-sub">{summary?.expense?.count ?? 0} transactions</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Net Savings</div>
          <div className={`kpi-value mono ${savings >= 0 ? 'text-income' : 'text-expense'}`}>
            {formatINR(Math.abs(savings))}
          </div>
          <div className="kpi-sub">{savings >= 0 ? `${summary?.savingsRate ?? 0}% savings rate` : 'Overspent this month'}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Budgets tracked</div>
          <div className="kpi-value mono" style={{ color: 'var(--navy)' }}>{budgetSummary.length}</div>
          <div className="kpi-sub">{budgetSummary.filter((b) => b.status === 'exceeded').length} exceeded</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.1rem', color: 'var(--navy)' }}>Recent Transactions</h3>
            <Link to="/transactions" style={{ fontSize: '0.78rem', color: 'var(--maroon)', textDecoration: 'none' }}>View all →</Link>
          </div>
          {recent.length === 0 ? (
            <div className="muted" style={{ fontSize: '0.85rem', padding: '1rem 0' }}>
              No transactions yet. <Link to="/transactions" style={{ color: 'var(--navy)' }}>Add one</Link>
            </div>
          ) : (
            recent.map((tx) => (
              <div key={tx._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0', borderBottom: '1px solid var(--beige-dk)' }}>
                <div>
                  <div style={{ fontWeight: 500, fontSize: '0.875rem' }}>{tx.note || tx.category}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{tx.category} · {formatDate(tx.date)}</div>
                </div>
                <div className={`mono ${tx.type === 'income' ? 'text-income' : 'text-expense'}`} style={{ fontWeight: 500, fontSize: '0.9rem' }}>
                  {tx.type === 'income' ? '+' : '−'}{formatINR(tx.amount)}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.1rem', color: 'var(--navy)' }}>Budget Overview</h3>
            <Link to="/budgets" style={{ fontSize: '0.78rem', color: 'var(--maroon)', textDecoration: 'none' }}>Manage →</Link>
          </div>
          {budgetSummary.length === 0 ? (
            <div className="muted" style={{ fontSize: '0.85rem', padding: '1rem 0' }}>
              No budgets set. <Link to="/budgets" style={{ color: 'var(--navy)' }}>Create one</Link>
            </div>
          ) : (
            budgetSummary.slice(0, 5).map((b) => (
              <div key={b.budgetId} style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                  <span style={{ fontWeight: 500 }}>{b.category}</span>
                  <span className="mono muted">{formatINR(b.spent)} / {formatINR(b.limit)}</span>
                </div>
                <div className="progress-bar">
                  <div className={`progress-fill ${b.status}`} style={{ width: `${Math.min(b.percentage, 100)}%` }} />
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--muted)', marginTop: '0.2rem' }}>{b.percentage}% used</div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}