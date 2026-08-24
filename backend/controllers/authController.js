const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { sendEmail } = require('../utils/notify');
const { PASSWORD_REQUIREMENTS, isStrongPassword, normalizeEmail, isAllowedEmailForRole, emailDomainMessage } = require('../utils/validation');

const OTP_LIFETIME_MS = 60 * 1000;
const MAX_OTP_ATTEMPTS = 5;
const hashOtp = (otp) => crypto.createHash('sha256').update(`${process.env.OTP_SECRET || process.env.JWT_SECRET}:${otp}`).digest('hex');
const generateToken = (user) => jwt.sign({ id: user._id, role: user.role, otpVerified: true }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
const otpStatus = (user) => ({ email: user.email, role: user.role, expiresAt: user.otpExpiresAt, resendAvailableAt: user.otpNextResendAt, attemptsRemaining: Math.max(0, MAX_OTP_ATTEMPTS - user.otpAttemptCount) });

async function issueOtp(user, isResend = false) {
  const now = Date.now();
  const otp = crypto.randomInt(100000, 1000000).toString();
  const resendCount = isResend ? user.otpResendCount + 1 : 0;
  user.otpHash = hashOtp(otp);
  user.otpExpiresAt = new Date(now + OTP_LIFETIME_MS);
  user.otpUsedAt = null;
  user.otpAttemptCount = 0;
  user.otpResendCount = resendCount;
  user.otpNextResendAt = new Date(now + (resendCount + 1) * OTP_LIFETIME_MS);
  await user.save();
  try {
    await sendEmail({
      to: user.email,
      subject: 'Your CampusFix verification code',
      text: `Your CampusFix verification code is ${otp}. It expires exactly 1 minute after it was sent. Do not share this code.`,
    });
  } catch (error) {
    // Do not expose a usable OTP if delivery failed.
    user.otpHash = null;
    user.otpExpiresAt = null;
    await user.save();
    throw error;
  }
  return otpStatus(user);
}

const clearOtp = (user, used = false) => {
  user.otpHash = null;
  user.otpExpiresAt = null;
  user.otpAttemptCount = 0;
  if (used) user.otpUsedAt = new Date();
};

exports.register = async (req, res) => {
  try {
    const { name, email, password, phone, role, department } = req.body;
    const normalizedEmail = normalizeEmail(email);
    const requestedRole = role || 'user';
    if (!name?.trim() || !normalizedEmail || !password) return res.status(400).json({ message: 'Name, email and password are required' });
    if (!['user', 'staff'].includes(requestedRole)) return res.status(400).json({ message: 'Role must be student or staff' });
    if (!isAllowedEmailForRole(normalizedEmail, requestedRole)) return res.status(400).json({ message: emailDomainMessage(requestedRole) });
    if (!isStrongPassword(password)) return res.status(400).json({ message: PASSWORD_REQUIREMENTS });
    if (requestedRole === 'staff' && !department?.trim()) return res.status(400).json({ message: 'Department is required for staff accounts' });
    if (await User.findOne({ email: normalizedEmail })) return res.status(400).json({ message: 'Email already registered' });

    const user = await User.create({ name: name.trim(), email: normalizedEmail, password, phone, role: requestedRole, department: requestedRole === 'staff' ? department.trim() : null });
    const challenge = await issueOtp(user);
    return res.status(201).json({ message: 'Verification code sent. Verify your email to finish registration.', challenge });
  } catch (err) {
    return res.status(500).json({ message: err.message === 'SMTP is not configured' ? 'Email delivery is not configured. Please contact an administrator.' : 'Registration failed. Please try again.' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = normalizeEmail(email);
    if (!normalizedEmail || !password) return res.status(400).json({ message: 'Email and password required' });
    const user = await User.findOne({ email: normalizedEmail }).select('+otpHash +otpExpiresAt +otpUsedAt +otpAttemptCount +otpResendCount +otpNextResendAt');
    if (!user || !(await user.comparePassword(password))) return res.status(401).json({ message: 'Invalid email or password' });
    if (!user.isActive) return res.status(403).json({ message: 'Account is deactivated' });
    if (!isAllowedEmailForRole(user.email, user.role)) return res.status(403).json({ message: emailDomainMessage(user.role) });
    const challenge = await issueOtp(user);
    return res.json({ message: 'Verification code sent. Enter it to sign in.', challenge });
  } catch (err) {
    return res.status(500).json({ message: err.message === 'SMTP is not configured' ? 'Email delivery is not configured. Please contact an administrator.' : 'Unable to send verification code. Please try again.' });
  }
};

exports.getOtpStatus = async (req, res) => {
  const email = normalizeEmail(req.body.email);
  const user = await User.findOne({ email }).select('+otpExpiresAt +otpAttemptCount +otpNextResendAt');
  if (!user || !user.otpExpiresAt) return res.status(404).json({ message: 'No active verification code. Sign in again to request one.' });
  res.json({ challenge: otpStatus(user) });
};

exports.resendOtp = async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const user = await User.findOne({ email }).select('+otpHash +otpExpiresAt +otpUsedAt +otpAttemptCount +otpResendCount +otpNextResendAt');
    if (!user || !user.otpExpiresAt) return res.status(400).json({ message: 'No active verification request. Sign in again to request a code.' });
    const now = Date.now();
    if (user.otpNextResendAt && user.otpNextResendAt.getTime() > now) return res.status(429).json({ message: 'Please wait before requesting another code.', resendAvailableAt: user.otpNextResendAt });
    const challenge = await issueOtp(user, true);
    res.json({ message: 'A new verification code was sent.', challenge });
  } catch (err) {
    res.status(500).json({ message: err.message === 'SMTP is not configured' ? 'Email delivery is not configured. Please contact an administrator.' : 'Unable to resend verification code. Please try again.' });
  }
};

exports.verifyOtp = async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const otp = typeof req.body.otp === 'string' ? req.body.otp.trim() : '';
    if (!/^\d{6}$/.test(otp)) return res.status(400).json({ message: 'Enter the 6-digit verification code.' });
    const user = await User.findOne({ email }).select('+otpHash +otpExpiresAt +otpUsedAt +otpAttemptCount +otpResendCount +otpNextResendAt');
    if (!user || !user.otpHash || !user.otpExpiresAt || user.otpUsedAt) return res.status(400).json({ message: 'This verification code is invalid or has already been used. Sign in again.' });
    if (Date.now() >= user.otpExpiresAt.getTime()) {
      clearOtp(user);
      await user.save();
      return res.status(400).json({ message: 'This verification code has expired. Sign in again or request a new code.' });
    }
    if (user.otpAttemptCount >= MAX_OTP_ATTEMPTS) return res.status(429).json({ message: 'Too many incorrect attempts. Request a new verification code.' });
    const expected = Buffer.from(user.otpHash, 'hex');
    const received = Buffer.from(hashOtp(otp), 'hex');
    if (expected.length !== received.length || !crypto.timingSafeEqual(expected, received)) {
      user.otpAttemptCount += 1;
      const lockedOut = user.otpAttemptCount >= MAX_OTP_ATTEMPTS;
      await user.save();
      return res.status(lockedOut ? 429 : 400).json({ message: lockedOut ? 'Too many incorrect attempts. Wait for resend availability and request a new verification code.' : `Invalid verification code. ${MAX_OTP_ATTEMPTS - user.otpAttemptCount} attempts remaining.` });
    }
    clearOtp(user, true);
    user.isEmailVerified = true;
    await user.save();
    return res.json({ message: 'Email verified successfully.', token: generateToken(user), user: user.toSafeObject() });
  } catch (err) {
    return res.status(500).json({ message: 'Verification failed. Please try again.' });
  }
};

exports.getProfile = async (req, res) => res.json({ user: req.user.toSafeObject() });
exports.updateProfile = async (req, res) => {
  try {
    const { name, phone } = req.body;
    if (name) req.user.name = name;
    if (phone !== undefined) req.user.phone = phone;
    await req.user.save();
    res.json({ user: req.user.toSafeObject() });
  } catch (err) { res.status(500).json({ message: 'Update failed', error: err.message }); }
};


