const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Verifies JWT and attaches req.user
const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Not authorized, no token provided' });
    }
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded.otpVerified) return res.status(401).json({ message: 'Email verification is required' });
    const user = await User.findById(decoded.id).select('-password');
    if (!user || !user.isActive || !user.isEmailVerified) {
      return res.status(401).json({ message: 'User is not authorized or email verification is required' });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Not authorized, token invalid or expired' });
  }
};

// Restricts route to specific roles: e.g. authorize('admin', 'staff')
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden: insufficient permissions' });
    }
    next();
  };
};

module.exports = { protect, authorize };


