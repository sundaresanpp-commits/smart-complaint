const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { PASSWORD_REQUIREMENTS, isStrongPassword, isValidEmail, normalizeEmail } = require('../utils/validation');

const generateToken = (user) => {
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

// @route POST /api/auth/register
exports.register = async (req, res) => {
  try {
    const { name, email, password, phone, role, department } = req.body;
    const normalizedEmail = normalizeEmail(email);
    const requestedRole = role || 'user';

    if (!name?.trim() || !normalizedEmail || !password) {
      return res.status(400).json({ message: 'Name, email and password are required' });
    }
    if (!isValidEmail(normalizedEmail)) {
      return res.status(400).json({ message: 'Please enter a valid email address' });
    }
    if (!isStrongPassword(password)) {
      return res.status(400).json({ message: PASSWORD_REQUIREMENTS });
    }

    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) return res.status(400).json({ message: 'Email already registered' });
    if (!['user', 'staff'].includes(requestedRole)) {
      return res.status(400).json({ message: 'Role must be student or staff' });
    }

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password,
      phone,
      role: requestedRole,
      department: requestedRole === 'staff' ? department || null : null,
    });
    const token = generateToken(user);
    res.status(201).json({ token, user: user.toSafeObject() });
  } catch (err) {
    res.status(500).json({ message: 'Registration failed', error: err.message });
  }
};

// @route POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail || !password) return res.status(400).json({ message: 'Email and password required' });
    if (!isValidEmail(normalizedEmail)) return res.status(400).json({ message: 'Please enter a valid email address' });

    const user = await User.findOne({ email: normalizedEmail });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    if (!user.isActive) return res.status(403).json({ message: 'Account is deactivated' });

    const token = generateToken(user);
    res.json({ token, user: user.toSafeObject() });
  } catch (err) {
    res.status(500).json({ message: 'Login failed', error: err.message });
  }
};

// @route GET /api/auth/me
exports.getProfile = async (req, res) => {
  res.json({ user: req.user.toSafeObject() });
};

// @route PUT /api/auth/me
exports.updateProfile = async (req, res) => {
  try {
    const { name, phone } = req.body;
    if (name) req.user.name = name;
    if (phone !== undefined) req.user.phone = phone;
    await req.user.save();
    res.json({ user: req.user.toSafeObject() });
  } catch (err) {
    res.status(500).json({ message: 'Update failed', error: err.message });
  }
};



