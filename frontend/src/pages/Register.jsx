import React, { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { EMAIL_REGEX, PASSWORD_REQUIREMENTS, isStrongPassword, isValidEmail } from '../utils/validation';
import { REGISTER_ROLE_CHOICES, getAuthRole } from '../utils/authRoles';

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
          <h1>Choose your sign up portal.</h1>
          <p>Create the right account type for your CampusFix role: student or staff.</p>
        </div>

        <div className="card auth-card">
          <h2>Sign up as</h2>
          <div className="auth-role-grid">
            {REGISTER_ROLE_CHOICES.map((choice) => (
              <Link key={choice.key} className="auth-role-card" to={`/${choice.key}/register`}>
                <strong>{choice.label}</strong>
                <span>{choice.registerCopy}</span>
              </Link>
            ))}
          </div>
          <p className="auth-switch text-sm text-slate">
            Already registered? <Link to="/login">Choose login</Link>
          </p>
        </div>
      </section>
    </main>
  );
}

export default function Register() {
  const { role } = useParams();
  const authRole = getAuthRole(role);
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '', phone: '', department: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!authRole) return <RolePicker />;
  if (authRole.role === 'admin') {
    return (
      <main className="auth-page">
        <section className="auth-panel">
          <div className="auth-copy">
            <div className="auth-brand">
              <span className="auth-logo">C</span>
              <span>CampusFix</span>
            </div>
            <h1>Admin login only.</h1>
            <p>Admin accounts are created by existing admins. Use the admin login portal if you already have access.</p>
          </div>
          <div className="card auth-card">
            <h2>Admin sign up is disabled</h2>
            <p className="text-slate text-sm">For security, admins cannot create accounts from the public sign up page.</p>
            <Link className="btn btn-primary" to="/admin/login" style={{ width: '100%', justifyContent: 'center', marginTop: 24 }}>Admin login</Link>
            <p className="auth-switch text-sm text-slate">Need another account type? <Link to="/register">Choose sign up</Link></p>
          </div>
        </section>
      </main>
    );
  }

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const validateForm = () => {
    if (!form.name.trim()) return 'Full name is required';
    if (!isValidEmail(form.email)) return 'Please enter a valid email address, for example sundar@gmail.com';
    if (authRole.role === 'staff' && !form.department.trim()) return 'Department is required for staff accounts';
    if (!isStrongPassword(form.password)) return PASSWORD_REQUIREMENTS;
    if (form.password !== form.confirmPassword) return 'Passwords do not match';
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    const { confirmPassword, ...registrationData } = form;

    setError('');
    setLoading(true);
    try {
      await register({
        ...registrationData,
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
        department: authRole.role === 'staff' ? form.department.trim() : undefined,
        role: authRole.role,
      });
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
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
          <h1>{authRole.registerTitle}</h1>
          <p>{authRole.registerCopy}</p>
        </div>

        <div className="card auth-card">
          <h2>{authRole.registerTitle}</h2>
          <p className="text-slate text-sm">Register once, then use the {authRole.label.toLowerCase()} login page.</p>

          <form onSubmit={handleSubmit} noValidate>
            <div className="field">
              <label>Full name</label>
              <input name="name" value={form.name} onChange={handleChange} autoComplete="name" required />
            </div>
            <div className="field">
              <label>Email address</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                pattern={EMAIL_REGEX.source}
                autoComplete="email"
                title="Enter a complete email address, for example sundar@gmail.com"
                required
              />
            </div>
            <div className="field">
              <label>Phone number</label>
              <input name="phone" value={form.phone} onChange={handleChange} autoComplete="tel" placeholder="Optional" />
            </div>
            {authRole.role === 'staff' && (
              <div className="field">
                <label>Department</label>
                <input name="department" value={form.department} onChange={handleChange} autoComplete="organization" required />
              </div>
            )}
            <div className="field">
              <label>Password</label>
              <div className="password-field">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  autoComplete="new-password"
                  required
                  minLength={8}
                  title={PASSWORD_REQUIREMENTS}
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
              <span className="text-sm text-slate">Use 8+ characters with uppercase, lowercase, number, and special character.</span>
            </div>
            <div className="field">
              <label>Confirm password</label>
              <div className="password-field">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  autoComplete="new-password"
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowConfirmPassword((current) => !current)}
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  title={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  <EyeIcon visible={showConfirmPassword} />
                </button>
              </div>
            </div>
            {error && <p className="field-error" style={{ marginBottom: 12 }}>{error}</p>}
            <button className="btn btn-primary" type="submit" style={{ width: '100%' }} disabled={loading}>
              {loading ? 'Creating account...' : `Create ${authRole.label} account`}
            </button>
          </form>

          <p className="auth-switch text-sm text-slate">
            Already registered? <Link to={`/${authRole.key}/login`}>Sign in</Link>
          </p>
          <p className="auth-switch text-sm text-slate">
            Wrong portal? <Link to="/register">Choose another role</Link>
          </p>
        </div>
      </section>
    </main>
  );
}

