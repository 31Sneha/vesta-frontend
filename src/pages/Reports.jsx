import { useEffect, useState } from 'react';
import api from '../utils/api';
import { formatINR, currentMonth, monthLabel } from '../utils/format';

const PALETTE = ['#1B3A4B', '#2D6A4F', '#6B1C1C', '#B8973A', '#254d63', '#3a8a65', '#8B2E2E', '#d4a843'];

export default function Reports() {
  const [month, setMonth] = useState(currentMonth());
  const [summary, setSummary] = useState(null);
  const [breakdown, setBreakdown] = useState([]);
  const [trends, setTrends] = useState([]);
  const [topExp, setTopExp] = useState([]);
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState('');
  const [insightsLoading, setInsightsLoading] = useState(false);

  const generateInsights = async () => {
    setInsightsLoading(true);
    try {
      const { data } = await api.post('/insights/generate', {
        summary,
        breakdown,
        month,
      });
      setInsights(data.insights);
    } catch (err) {
      setInsights('Failed to generate insights. Please try again.');
    }
    setInsightsLoading(false);
  };

  const load = async () => {
    setLoading(true);
    try {
      const [sRes, bRes, tRes, eRes] = await Promise.all([
        api.get(`/reports/monthly-summary?month=${month}`),
        api.get(`/reports/category-breakdown?month=${month}&type=expense`),
        api.get('/reports/trends?months=6'),
        api.get(`/reports/top-expenses?month=${month}&limit=5`),
      ]);
      setSummary(sRes.data.data);
      setBreakdown(bRes.data.data || []);
      setTrends(tRes.data.data || []);
      setTopExp(eRes.data.data || []);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, [month]);

  const maxTrend = Math.max(...trends.map((t) => Math.max(t.income || 0, t.expense || 0)), 1);

  return (
    <div className="main-content">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h2 className="page-title">Reports</h2>
          <div className="page-subtitle">Financial insights and trends</div>
        </div>
        <input type="month" className="input" style={{ width: 'auto' }} value={month} onChange={(e) => setMonth(e.target.value)} />
      </div>

      {loading ? (
        <div className="muted" style={{ textAlign: 'center', padding: '3rem' }}>Crunching numbers…</div>
      ) : (
        <>
          <div className="kpi-row" style={{ marginBottom: '1.5rem' }}>
            <div className="kpi-card">
              <div className="kpi-label">Total Income</div>
              <div className="kpi-value text-income mono">{formatINR(summary?.income?.total ?? 0)}</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-label">Total Expenses</div>
              <div className="kpi-value text-expense mono">{formatINR(summary?.expense?.total ?? 0)}</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-label">Net Savings</div>
              <div className={`kpi-value mono ${(summary?.netSavings ?? 0) >= 0 ? 'text-income' : 'text-expense'}`}>
                {formatINR(Math.abs(summary?.netSavings ?? 0))}
              </div>
            </div>
            <div className="kpi-card">
              <div className="kpi-label">Savings Rate</div>
              <div className="kpi-value mono" style={{ color: 'var(--navy)' }}>{summary?.savingsRate ?? 0}%</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
            <div className="card">
              <h3 style={{ fontSize: '1rem', color: 'var(--navy)', marginBottom: '1.25rem' }}>Spending by Category</h3>
              {breakdown.length === 0 ? (
                <div className="muted" style={{ fontSize: '0.85rem' }}>No expense data for {monthLabel(month)}.</div>
              ) : (
                breakdown.map((b, i) => (
                  <div key={b.category} style={{ marginBottom: '0.85rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: PALETTE[i % PALETTE.length], flexShrink: 0 }} />
                        <span style={{ fontWeight: 500 }}>{b.category}</span>
                      </div>
                      <span className="mono muted">{formatINR(b.total)} <span style={{ color: 'var(--muted)', fontSize: '0.75rem' }}>({b.percentage}%)</span></span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill on-track" style={{ width: `${b.percentage}%`, background: PALETTE[i % PALETTE.length] }} />
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="card">
              <h3 style={{ fontSize: '1rem', color: 'var(--navy)', marginBottom: '1.25rem' }}>Top Expenses</h3>
              {topExp.length === 0 ? (
                <div className="muted" style={{ fontSize: '0.85rem' }}>No expenses recorded.</div>
              ) : (
                topExp.map((tx, i) => (
                  <div key={tx._id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.6rem 0', borderBottom: '1px solid var(--beige-dk)' }}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--beige-dk)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 600, color: 'var(--muted)', flexShrink: 0 }}>
                      {i + 1}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 500, fontSize: '0.875rem' }}>{tx.note || tx.category}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{tx.category}</div>
                    </div>
                    <div className="text-expense mono" style={{ fontWeight: 600 }}>{formatINR(tx.amount)}</div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="card">
            <h3 style={{ fontSize: '1rem', color: 'var(--navy)', marginBottom: '1.5rem' }}>6-Month Trends</h3>
            {trends.length === 0 ? (
              <div className="muted" style={{ fontSize: '0.85rem' }}>Not enough data for trend analysis.</div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '1.5rem', height: 180, paddingBottom: '2rem', minWidth: 400 }}>
                  {trends.map((t) => (
                    <div key={t.month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
                      <div style={{ display: 'flex', gap: '4px', alignItems: 'flex-end', height: 140 }}>
                        <div title={`Income: ${formatINR(t.income || 0)}`} style={{ width: 20, height: `${((t.income || 0) / maxTrend) * 130}px`, background: 'var(--emerald)', borderRadius: '3px 3px 0 0', minHeight: 2 }} />
                        <div title={`Expense: ${formatINR(t.expense || 0)}`} style={{ width: 20, height: `${((t.expense || 0) / maxTrend) * 130}px`, background: 'var(--maroon)', borderRadius: '3px 3px 0 0', minHeight: 2 }} />
                      </div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--muted)' }}>{t.month.slice(5)}</div>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center', marginTop: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: 'var(--muted)' }}>
                    <div style={{ width: 12, height: 12, background: 'var(--emerald)', borderRadius: 2 }} /> Income
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: 'var(--muted)' }}>
                    <div style={{ width: 12, height: 12, background: 'var(--maroon)', borderRadius: 2 }} /> Expenses
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* AI Insights */}
          <div className="card" style={{ marginTop: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1rem', color: 'var(--navy)' }}>AI Financial Insights</h3>
                <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '0.2rem' }}>Powered by Google Gemini · Informational only, not financial advice</div>
              </div>
              <button
                className="btn btn-primary"
                onClick={generateInsights}
                disabled={insightsLoading || !summary}
                style={{ whiteSpace: 'nowrap' }}
              >
                {insightsLoading ? 'Analysing…' : '✦ Generate Insights'}
              </button>
            </div>

            {!insights && !insightsLoading && (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--muted)', fontSize: '0.85rem', background: 'var(--beige)', borderRadius: 'var(--radius)' }}>
                Click "Generate Insights" to get AI-powered analysis of your spending for {monthLabel(month)}.
              </div>
            )}

            {insightsLoading && (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--muted)', fontSize: '0.85rem' }}>
                Analysing your finances…
              </div>
            )}

            {insights && (
              <div style={{ fontSize: '0.9rem', lineHeight: 1.8, color: 'var(--ink)', whiteSpace: 'pre-wrap' }}>
                {insights}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}