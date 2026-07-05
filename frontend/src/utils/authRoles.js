export const AUTH_ROLES = {
  student: {
    key: 'student',
    role: 'user',
    label: 'Student',
    plural: 'Students',
    loginTitle: 'Student login',
    registerTitle: 'Student sign up',
    loginCopy: 'Submit complaints, follow updates, and keep track of your campus requests.',
    registerCopy: 'Create a student account to report campus issues and monitor progress.',
  },
  staff: {
    key: 'staff',
    role: 'staff',
    label: 'Staff',
    plural: 'Staff',
    loginTitle: 'Staff login',
    registerTitle: 'Staff sign up',
    loginCopy: 'Review assigned complaints, update progress, and coordinate fixes.',
    registerCopy: 'Create a staff account for department complaint handling.',
  },
  admin: {
    key: 'admin',
    role: 'admin',
    label: 'Admin',
    plural: 'Admins',
    loginTitle: 'Admin login',
    registerTitle: 'Admin sign up',
    loginCopy: 'Manage users, analytics, escalation, and campus-wide complaint operations.',
    registerCopy: 'Create an admin account to manage staff, reports, and system settings.',
  },
};

export const ROLE_CHOICES = [AUTH_ROLES.student, AUTH_ROLES.staff, AUTH_ROLES.admin];
export const REGISTER_ROLE_CHOICES = [AUTH_ROLES.student, AUTH_ROLES.staff];

export function getAuthRole(roleKey) {
  return AUTH_ROLES[roleKey] || null;
}

