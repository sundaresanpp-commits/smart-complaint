import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--ink)',
        padding: 20,
      }}
    >
      <div className="card" style={{ width: 400, padding: 36 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 6,
              background: 'var(--amber)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
            }}
          >
            C
          </div>
          <h1 style={{ fontSize: 20 }}>CampusFix</h1>
        </div>

        <h2 style={{ fontSize: 18, marginBottom: 4 }}>Welcome back</h2>
        <p className="text-slate text-sm" style={{ marginBottom: 24 }}>
          Log in to report or manage campus issues.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="field">
            <label>Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          {error && <p className="field-error" style={{ marginBottom: 12 }}>{error}</p>}
          <button className="btn btn-primary" type="submit" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Logging in...' : 'Log in'}
          </button>
        </form>

        <p className="text-sm text-slate" style={{ marginTop: 20, textAlign: 'center' }}>
          Don't have an account? <Link to="/register">Register</Link>
        </p>

        <div
          className="text-sm"
          style={{ marginTop: 20, padding: 12, background: 'var(--paper)', borderRadius: 6, color: 'var(--ink-soft)' }}
        >
          <strong>Demo logins</strong> (after running <code>npm run seed</code>):<br />
          admin@demo.com / password123<br />
          staff@demo.com / password123<br />
          student@demo.com / password123
        </div>
      </div>
    </div>
  );
}
