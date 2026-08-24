const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

const PASSWORD_REQUIREMENTS =
  'Password must be at least 8 characters and include one uppercase letter, one lowercase letter, one number, and one special character';

function isValidEmail(email) {
  return typeof email === 'string' && EMAIL_REGEX.test(email.trim());
}

function isStrongPassword(password) {
  return typeof password === 'string' && PASSWORD_REGEX.test(password);
}

function normalizeEmail(email) {
  return typeof email === 'string' ? email.trim().toLowerCase() : '';
}

function isAllowedEmailForRole(email, role) {
  if (!isValidEmail(email)) return false;
  const normalizedEmail = normalizeEmail(email);
  if (role === 'user') return normalizedEmail.endsWith('@student.tce.edu');
  return (role === 'staff' || role === 'admin') && normalizedEmail.endsWith('@tce.edu');
}

function emailDomainMessage(role) {
  return role === 'user'
    ? 'Student accounts must use an @student.tce.edu email address'
    : 'Staff and admin accounts must use an @tce.edu email address';
}

module.exports = { EMAIL_REGEX, PASSWORD_REGEX, PASSWORD_REQUIREMENTS, isValidEmail, isStrongPassword, normalizeEmail, isAllowedEmailForRole, emailDomainMessage };