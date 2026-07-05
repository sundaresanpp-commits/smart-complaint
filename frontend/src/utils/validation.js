export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

export const PASSWORD_REQUIREMENTS =
  'Password must be at least 8 characters and include one uppercase letter, one lowercase letter, one number, and one special character.';

export function isValidEmail(email) {
  return EMAIL_REGEX.test(email.trim());
}

export function isStrongPassword(password) {
  return PASSWORD_REGEX.test(password);
}
