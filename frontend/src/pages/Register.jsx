import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(form);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
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
        <h2 style={{ fontSize: 18, marginBottom: 4 }}>Create your account</h2>
        <p className="text-slate text-sm" style={{ marginBottom: 24 }}>
          Sign up to submit and track campus complaints.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>Full name</label>
            <input name="name" value={form.name} onChange={handleChange} required />
          </div>
          <div className="field">
            <label>Email</label>
            <input type="email" name="email" value={form.email} onChange={handleChange} required />
          </div>
          <div className="field">
            <label>Phone (optional)</label>
            <input name="phone" value={form.phone} onChange={handleChange} />
          </div>
          <div className="field">
            <label>Password</label>
            <input type="password" name="password" value={form.password} onChange={handleChange} required minLength={6} />
          </div>
          {error && <p className="field-error" style={{ marginBottom: 12 }}>{error}</p>}
          <button className="btn btn-primary" type="submit" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Creating account...' : 'Register'}
          </button>
        </form>

        <p className="text-sm text-slate" style={{ marginTop: 20, textAlign: 'center' }}>
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </div>
    </div>
  );
}
