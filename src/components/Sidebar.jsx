import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV = [
  { to: '/dashboard', icon: '◈', label: 'Dashboard' },
  { to: '/transactions', icon: '↕', label: 'Transactions' },
  { to: '/budgets', icon: '◉', label: 'Budgets' },
  { to: '/reports', icon: '◎', label: 'Reports' },
  { to: '/upload', icon: '↑', label: 'Import Statement' },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <h1>Vesta</h1>
        <span>Personal Finance</span>
      </div>

      <span className="nav-section">Overview</span>
      {NAV.map(({ to, icon, label }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
        >
          <span style={{ fontSize: '1rem', opacity: 0.8 }}>{icon}</span>
          {label}
        </NavLink>
      ))}

      <div style={{ marginTop: 'auto', padding: '0 1.5rem', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '1rem' }}>
        <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.4)', marginBottom: '0.5rem' }}>
          Signed in as
        </div>
        <div style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.8)', marginBottom: '0.75rem', fontWeight: 500 }}>
          {user?.name}
        </div>
        <button
          onClick={handleLogout}
          className="btn btn-ghost"
          style={{ width: '100%', justifyContent: 'center', color: 'rgba(255,255,255,0.5)', borderColor: 'rgba(255,255,255,0.1)' }}
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}