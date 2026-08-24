export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
export const PASSWORD_REQUIREMENTS = 'Password must be at least 8 characters and include one uppercase letter, one lowercase letter, one number, and one special character.';
export function isValidEmail(email) { return EMAIL_REGEX.test(email.trim()); }
export function isAllowedEmailForRole(email, role) {
  const normalized = email.trim().toLowerCase();
  return role === 'user' ? normalized.endsWith('@student.tce.edu') : (role === 'staff' || role === 'admin') && normalized.endsWith('@tce.edu');
}
export function domainMessage(role) { return role === 'user' ? 'Students must use an @student.tce.edu email address' : 'Staff and admins must use an @tce.edu email address'; }
export function isStrongPassword(password) { return PASSWORD_REGEX.test(password); }
