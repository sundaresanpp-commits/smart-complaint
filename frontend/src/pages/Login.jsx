import React, { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { EMAIL_REGEX, isValidEmail } from '../utils/validation';
import { ROLE_CHOICES, getAuthRole } from '../utils/authRoles';

function EyeIcon({ visible }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      {visible ? (
        <>
          <path d="M3 3l18 18" strokeLinecap="round" />
          <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" strokeLinecap="round" />
          <path d="M9.9 4.2A10.8 10.8 0 0 1 12 4c5 0 9 4.5 10 8a12.5 12.5 0 0 1-2.2 3.8" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M6.1 6.1C4.1 7.5 2.7 9.7 2 12c1 3.5 5 8 10 8 1.6 0 3.1-.5 4.4-1.2" strokeLinecap="round" strokeLinejoin="round" />
        </>
      ) : (
        <>
          <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="12" cy="12" r="3" />
        </>
      )}
    </svg>
  );
}

function RolePicker() {
  return (
    <main className="auth-page">
      <section className="auth-panel">
        <div className="auth-copy">
          <div className="auth-brand">
            <span className="auth-logo">C</span>
            <span>CampusFix</span>
          </div>
          <h1>Choose your login portal.</h1>
          <p>Students, staff, and admins each get a separate sign-in path with role checks after authentication.</p>
        </div>

        <div className="card auth-card">
          <h2>Sign in as</h2>
          <div className="auth-role-grid">
            {ROLE_CHOICES.map((choice) => (
              <Link key={choice.key} className="auth-role-card" to={`/${choice.key}/login`}>
                <strong>{choice.label}</strong>
                <span>{choice.loginCopy}</span>
              </Link>
            ))}
          </div>
          <p className="auth-switch text-sm text-slate">
            Need an account? <Link to="/register">Choose sign up</Link>
          </p>
        </div>
      </section>
    </main>
  );
}

export default function Login() {
  const { role } = useParams();
  const authRole = getAuthRole(role);
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!authRole) return <RolePicker />;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isValidEmail(email)) {
      setError('Please enter a valid email address, for example sundar@gmail.com');
      return;
    }
    if (!password) {
      setError('Password is required');
      return;
    }

    setError('');
    setLoading(true);
    try {
      await login(email.trim().toLowerCase(), password, authRole.role);
      navigate('/dashboard');
    } catch (err) {
      const message = err.response?.data?.message || (!err.response ? 'Unable to reach the backend. Check the API URL or allowed frontend origin.' : err.message);
      setError(message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-panel">
        <div className="auth-copy">
          <div className="auth-brand">
            <span className="auth-logo">C</span>
            <span>CampusFix</span>
          </div>
          <h1>{authRole.loginTitle}</h1>
          <p>{authRole.loginCopy}</p>
        </div>

        <div className="card auth-card">
          <h2>{authRole.loginTitle}</h2>
          <p className="text-slate text-sm">Use your registered {authRole.label.toLowerCase()} email and password.</p>

          <form onSubmit={handleSubmit} noValidate>
            <div className="field">
              <label>Email address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                pattern={EMAIL_REGEX.source}
                autoComplete="email"
                title="Enter a complete email address, for example sundar@gmail.com"
                required
              />
            </div>
            <div className="field">
              <label>Password</label>
              <div className="password-field">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword((current) => !current)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  <EyeIcon visible={showPassword} />
                </button>
              </div>
            </div>
            {error && <p className="field-error" style={{ marginBottom: 12 }}>{error}</p>}
            <button className="btn btn-primary" type="submit" style={{ width: '100%' }} disabled={loading}>
              {loading ? 'Signing in...' : `Sign in as ${authRole.label}`}
            </button>
          </form>

          {authRole.role !== 'admin' && (
            <p className="auth-switch text-sm text-slate">
              Need a {authRole.label.toLowerCase()} account? <Link to={`/${authRole.key}/register`}>Sign up</Link>
            </p>
          )}
          <p className="auth-switch text-sm text-slate">
            Wrong portal? <Link to="/login">Choose another role</Link>
          </p>
        </div>
      </section>
    </main>
  );
}


