/**
 * File: web/frontend/src/hooks/useAuth.js
 * AccellaX 361° - Authentication Hook
 * 
 * Description:
 * Custom React hook for accessing authentication state and methods.
 * Provides a clean interface to the AuthContext throughout the application.
 * 
 * Usage:
 * import { useAuth } from '@/hooks/useAuth';
 * 
 * function MyComponent() {
 *   const { user, isAuthenticated, login, logout } = useAuth();
 *   // ... use auth methods and state
 * }
 */

import { useContext } from 'react';
import { AuthContext } from '@/contexts/AuthContext';

/**
 * Custom hook to access authentication context
 * @throws {Error} If used outside AuthProvider
 * @returns {Object} Authentication state and methods
 */
export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      'useAuth must be used within an AuthProvider. ' +
      'Wrap your component tree with <AuthProvider> in App.jsx'
    );
  }

  return context;
};

/**
 * Available properties and methods from useAuth():
 * 
 * STATE:
 * - user: Current user object or null
 * - loading: Boolean indicating if auth is being initialized
 * - isAuthenticated: Boolean indicating if user is logged in
 * - error: Error message if authentication failed
 * 
 * METHODS:
 * - login(email, password): Promise - Log in user
 * - register(userData): Promise - Register new user
 * - logout(): Promise - Log out current user
 * - updateProfile(data): Promise - Update user profile
 * - elevateRole(secretCode, password, targetRole): Promise - Elevate user role
 * - refreshUser(): Promise - Refresh user data from server
 * 
 * ROLE CHECKS:
 * - hasRole(roles): Boolean - Check if user has specific role(s)
 * - isAdmin(): Boolean - Check if user is admin/owner
 * - isCoach(): Boolean - Check if user is coach
 * - isParent(): Boolean - Check if user is parent
 * - isKid(): Boolean - Check if user is kid
 * - isSponsor(): Boolean - Check if user is sponsor
 * - canManageKids(): Boolean - Check if user can manage kids
 * - canViewAllSessions(): Boolean - Check if user can view all sessions
 * - canCreateEvents(): Boolean - Check if user can create events
 * - canManagePayments(): Boolean - Check if user can manage payments
 * 
 * EXAMPLES:
 * 
 * // Login
 * const { login } = useAuth();
 * try {
 *   await login('coach@academy.com', 'password123');
 *   navigate('/dashboard');
 * } catch (error) {
 *   toast.error(error.message);
 * }
 * 
 * // Check role
 * const { user, hasRole } = useAuth();
 * if (hasRole(['coach', 'head_coach'])) {
 *   return <CoachDashboard />;
 * }
 * 
 * // Conditional rendering
 * const { isAuthenticated, user } = useAuth();
 * if (!isAuthenticated) {
 *   return <Navigate to="/login" />;
 * }
 * return <div>Welcome {user.name}</div>;
 * 
 * // Role elevation
 * const { elevateRole } = useAuth();
 * try {
 *   await elevateRole('SECRET123', 'password', 'super_admin');
 *   toast.success('Role elevated successfully');
 * } catch (error) {
 *   toast.error('Elevation failed');
 * }
 */

export default useAuth;