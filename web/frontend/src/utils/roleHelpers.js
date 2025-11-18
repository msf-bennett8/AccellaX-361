import { ROLES } from './constants';

export const hasRole = (user, roles) => {
  if (!user || !user.role) return false;
  const rolesArray = Array.isArray(roles) ? roles : [roles];
  return rolesArray.includes(user.role);
};

export const isAdmin = (user) => {
  return hasRole(user, [ROLES.SUPER_ADMIN, ROLES.OWNER]);
};

export const isCoach = (user) => {
  return hasRole(user, [ROLES.HEAD_COACH, ROLES.COACH]);
};

export const canManageKids = (user) => {
  return hasRole(user, [
    ROLES.SUPER_ADMIN,
    ROLES.OWNER,
    ROLES.HEAD_COACH,
    ROLES.COACH,
  ]);
};

export const canViewAllSessions = (user) => {
  return hasRole(user, [ROLES.SUPER_ADMIN, ROLES.OWNER, ROLES.HEAD_COACH]);
};

export const canCreateEvents = (user) => {
  return hasRole(user, [ROLES.SUPER_ADMIN, ROLES.OWNER, ROLES.HEAD_COACH]);
};

export const canManagePayments = (user) => {
  return hasRole(user, [
    ROLES.SUPER_ADMIN,
    ROLES.OWNER,
    ROLES.PAYMENT_RECORDER,
  ]);
};

export const getRoleDashboard = (role) => {
  const dashboards = {
    [ROLES.SUPER_ADMIN]: '/dashboard/admin',
    [ROLES.OWNER]: '/dashboard/admin',
    [ROLES.HEAD_COACH]: '/dashboard/coach',
    [ROLES.COACH]: '/dashboard/coach',
    [ROLES.PAYMENT_RECORDER]: '/dashboard/payments',
    [ROLES.PARENT]: '/dashboard/parent',
    [ROLES.KID]: '/dashboard/kid',
    [ROLES.SPONSOR]: '/dashboard/sponsor',
  };
  return dashboards[role] || '/';
};

export const getRoleLabel = (role) => {
  const labels = {
    [ROLES.SUPER_ADMIN]: 'Super Admin',
    [ROLES.OWNER]: 'Academy Owner',
    [ROLES.HEAD_COACH]: 'Head Coach',
    [ROLES.COACH]: 'Coach',
    [ROLES.PAYMENT_RECORDER]: 'Payment Recorder',
    [ROLES.PARENT]: 'Parent',
    [ROLES.KID]: 'Kid',
    [ROLES.SPONSOR]: 'Sponsor',
  };
  return labels[role] || role;
};