const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { PASSWORD_REQUIREMENTS, isStrongPassword, isValidEmail } = require('../utils/validation');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      validate: {
        validator: isValidEmail,
        message: 'Please enter a valid email address',
      },
    },
    password: {
      type: String,
      required: true,
      validate: {
        validator(value) {
          return !this.isModified('password') || isStrongPassword(value);
        },
        message: PASSWORD_REQUIREMENTS,
      },
    },
    role: { type: String, enum: ['user', 'staff', 'admin'], default: 'user' },
    department: { type: String, default: null }, // relevant for staff
    phone: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.toSafeObject = function () {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    role: this.role,
    department: this.department,
    phone: this.phone,
    createdAt: this.createdAt,
  };
};

module.exports = mongoose.model('User', userSchema);
