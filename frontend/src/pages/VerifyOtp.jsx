import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const formatRemaining = (timestamp) => Math.max(0, Math.ceil((new Date(timestamp).getTime() - Date.now()) / 1000));
const formatTime = (seconds) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;

export default function VerifyOtp() {
  const navigate = useNavigate(); const location = useLocation(); const { verifyOtp } = useAuth();
  const [email] = useState(location.state?.email || sessionStorage.getItem('otpEmail') || '');
  const [challenge, setChallenge] = useState(location.state?.challenge || null);
  const [otp, setOtp] = useState(''); const [error, setError] = useState(''); const [message, setMessage] = useState(''); const [loading, setLoading] = useState(false); const [now, setNow] = useState(Date.now());
  const refreshStatus = async () => { try { const res = await api.post('/auth/otp/status', { email }); setChallenge(res.data.challenge); } catch (err) { setError(err.response?.data?.message || 'Unable to restore verification status.'); } };
  useEffect(() => { if (!email) { navigate('/login', { replace: true }); return; } refreshStatus(); }, [email]);
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(timer); }, []);
  const expiresIn = challenge?.expiresAt ? Math.max(0, Math.ceil((new Date(challenge.expiresAt).getTime() - now) / 1000)) : 0;
  const resendIn = challenge?.resendAvailableAt ? Math.max(0, Math.ceil((new Date(challenge.resendAvailableAt).getTime() - now) / 1000)) : 0;
  const submit = async (event) => { event.preventDefault(); setError(''); setMessage(''); setLoading(true); try { await verifyOtp(email, otp); navigate('/dashboard', { replace: true }); } catch (err) { setError(err.response?.data?.message || 'Verification failed.'); if (err.response?.status === 400 || err.response?.status === 429) refreshStatus(); } finally { setLoading(false); } };
  const resend = async () => { setError(''); setMessage(''); setLoading(true); try { const res = await api.post('/auth/otp/resend', { email }); setChallenge(res.data.challenge); setOtp(''); setMessage('A new code was sent. Previous codes no longer work.'); } catch (err) { setError(err.response?.data?.message || 'Unable to resend code.'); if (err.response?.data?.resendAvailableAt) setChallenge((current) => ({ ...current, resendAvailableAt: err.response.data.resendAvailableAt })); } finally { setLoading(false); } };
  return <main className="auth-page"><section className="auth-panel"><div className="auth-copy"><div className="auth-brand"><span className="auth-logo">C</span><span>CampusFix</span></div><h1>Check your email.</h1><p>Enter the 6-digit code sent to {email}. You are not signed in until it is verified.</p></div><div className="card auth-card"><h2>Email verification</h2><p className="text-slate text-sm">{expiresIn ? `Code expires in ${formatTime(expiresIn)}.` : 'This code has expired. Request a new one or sign in again.'}</p><form onSubmit={submit}><div className="field"><label>Verification code</label><input value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" placeholder="123456" required /></div>{error && <p className="field-error" style={{ marginBottom: 12 }}>{error}</p>}{message && <p className="text-sm" style={{ marginBottom: 12 }}>{message}</p>}<button className="btn btn-primary" type="submit" style={{ width: '100%' }} disabled={loading || !expiresIn}>{loading ? 'Verifying...' : 'Verify and sign in'}</button></form><button className="btn" type="button" onClick={resend} disabled={loading || resendIn > 0} style={{ width: '100%', marginTop: 12 }}>{resendIn > 0 ? `Resend available in ${formatTime(resendIn)}` : 'Resend OTP'}</button><p className="auth-switch text-sm text-slate"><Link to="/login">Back to sign in</Link></p></div></section></main>;
}
