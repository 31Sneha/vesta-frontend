import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(form.name, form.email, form.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <div className="auth-logo">
          <h1>Vesta</h1>
          <div><span>Create your account</span></div>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="form-field">
            <label>Full name</label>
            <input className="input" name="name" value={form.name} onChange={handleChange} placeholder="Sneha Sharma" required />
          </div>
          <div className="form-field">
            <label>Email</label>
            <input className="input" name="email" type="email" value={form.email} onChange={handleChange} placeholder="you@example.com" required />
          </div>
          <div className="form-field">
            <label>Password</label>
            <input className="input" name="password" type="password" value={form.password} onChange={handleChange} placeholder="Min. 6 characters" minLength={6} required />
          </div>
          <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: '100%', justifyContent: 'center', padding: '0.75rem' }}>
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <div className="auth-divider">Already have an account?</div>
        <Link to="/login" className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center' }}>
          Sign in
        </Link>
      </div>
    </div>
  );
}