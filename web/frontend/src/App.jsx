/**
 * File: web/frontend/src/App.jsx
 * AccellaX 361° - Main Application Component
 * 
 * Description:
 * This is the root component of the AccellaX 361° web application.
 * It orchestrates the entire application structure including routing,
 * authentication, context providers, and global state management.
 * 
 * Architecture:
 * - Context Providers (Auth, Academy, Notifications)
 * - React Router for navigation
 * - Protected routes based on user roles
 * - Layout system (Dashboard, Auth, Public)
 * - Global error boundaries
 * - Loading states and fallbacks
 * - Toast notifications
 * - Offline detection
 * 
 * Dependencies:
 * - react-router-dom: Client-side routing
 * - Context API: Global state management
 * - React.lazy: Code splitting for performance
 * - React.Suspense: Loading fallbacks
 * 
 * User Roles Supported:
 * - super_admin: Full system access
 * - owner: Academy owner dashboard
 * - head_coach: All sessions and analytics
 * - coach: Assigned sessions only
 * - payment_recorder: Payment tracking
 * - parent: Kid's data only
 * - kid: Gamified view
 * - sponsor: Scholarship reports
 * 
 * Last Updated: 2025-01-19
 */

import React, { Suspense, lazy, useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// ==================== CONTEXT PROVIDERS ====================
import { AuthProvider, useAuth } from '@contexts/AuthContext';
import { AcademyProvider } from '@contexts/AcademyContext';
import { NotificationProvider } from '@contexts/NotificationContext';

// ==================== LAYOUTS ====================
import DashboardLayout from '@components/layout/DashboardLayout';
import AuthLayout from '@components/layout/AuthLayout';
import PublicLayout from '@components/layout/PublicLayout';

// ==================== COMMON COMPONENTS ====================
import Loader from '@components/common/Loader';
import Toast from '@components/common/Toast';

// ==================== LAZY LOADED PAGES ====================
// Code splitting for better performance - pages load only when needed

// AUTH PAGES
const LoginPage = lazy(() => import('@pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('@pages/auth/RegisterPage'));
const RoleElevationPage = lazy(() => import('@pages/auth/RoleElevationPage'));

// DASHBOARD PAGES (Role-Specific)
const AdminDashboard = lazy(() => import('@pages/dashboard/AdminDashboard'));
const CoachDashboard = lazy(() => import('@pages/dashboard/CoachDashboard'));
const ParentDashboard = lazy(() => import('@pages/dashboard/ParentDashboard'));
const KidDashboard = lazy(() => import('@pages/dashboard/KidDashboard'));
const SponsorDashboard = lazy(() => import('@pages/dashboard/SponsorDashboard'));

// ATTENDANCE PAGES
const AttendanceHistory = lazy(() => import('@pages/attendance/AttendanceHistory'));
const SessionDetail = lazy(() => import('@pages/attendance/SessionDetail'));
const AttendanceReport = lazy(() => import('@pages/attendance/AttendanceReport'));

// KIDS PAGES
const KidsPage = lazy(() => import('@pages/kids/KidsPage'));
const KidDetailPage = lazy(() => import('@pages/kids/KidDetailPage'));
const AddKidPage = lazy(() => import('@pages/kids/AddKidPage'));

// EVENTS PAGES
const EventsPage = lazy(() => import('@pages/events/EventsPage'));
const EventDetailPage = lazy(() => import('@pages/events/EventDetailPage'));
const CreateEventPage = lazy(() => import('@pages/events/CreateEventPage'));

// MESSAGES PAGES
const MessagesPage = lazy(() => import('@pages/messages/MessagesPage'));
const ConversationPage = lazy(() => import('@pages/messages/ConversationPage'));

// REPORTS PAGES
const ReportsPage = lazy(() => import('@pages/reports/ReportsPage'));
const ExportPage = lazy(() => import('@pages/reports/ExportPage'));

// PROFILE & SETTINGS PAGES
const ProfilePage = lazy(() => import('@pages/profile/ProfilePage'));
const EditProfilePage = lazy(() => import('@pages/profile/EditProfilePage'));
const SettingsPage = lazy(() => import('@pages/settings/SettingsPage'));
const AcademySettingsPage = lazy(() => import('@pages/settings/AcademySettingsPage'));

// ERROR PAGES
const NotFoundPage = lazy(() => import('@pages/errors/NotFoundPage'));
const UnauthorizedPage = lazy(() => import('@pages/errors/UnauthorizedPage'));

// ==================== GLOBAL STYLES ====================
import '@/styles/globals.css';
import '@/styles/dashboard.css';
import '@/styles/components.css';
import '@/styles/responsive.css';

// ==================== UTILITIES ====================
import { ROLES } from '@utils/constants';
import { getRoleDashboard } from '@utils/roleHelpers';

/**
 * ==================== PROTECTED ROUTE COMPONENT ====================
 * 
 * Wraps routes that require authentication
 * Redirects to login if user is not authenticated
 * Checks role-based permissions if specified
 * 
 * Props:
 * - children: Component to render if authorized
 * - allowedRoles: Array of roles that can access this route
 * - requireElevation: If true, requires elevated permissions
 */
const ProtectedRoute = ({ children, allowedRoles = [], requireElevation = false }) => {
  const { user, isAuthenticated, loading } = useAuth();

  // Show loader while checking auth status
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader size="large" />
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Check role-based permissions
  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // Check elevation requirement (for sensitive operations)
  if (requireElevation && !user?.isElevated) {
    return <Navigate to="/elevate-role" replace />;
  }

  return children;
};

/**
 * ==================== PUBLIC ROUTE COMPONENT ====================
 * 
 * For routes accessible without authentication
 * Redirects to dashboard if already logged in
 * 
 * Props:
 * - children: Component to render
 */
const PublicRoute = ({ children }) => {
  const { isAuthenticated, user } = useAuth();

  // Redirect to appropriate dashboard if already logged in
  if (isAuthenticated && user) {
    const dashboardRoute = getRoleDashboard(user.role);
    return <Navigate to={dashboardRoute} replace />;
  }

  return children;
};

/**
 * ==================== ROLE-BASED DASHBOARD REDIRECT ====================
 * 
 * Redirects /dashboard to appropriate role-specific dashboard
 */
const DashboardRedirect = () => {
  const { user } = useAuth();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const dashboardRoute = getRoleDashboard(user.role);
  return <Navigate to={dashboardRoute} replace />;
};

/**
 * ==================== OFFLINE DETECTOR COMPONENT ====================
 * 
 * Detects online/offline status and shows banner
 */
const OfflineDetector = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-warning-500 text-white px-4 py-2 text-center text-sm font-medium">
      ⚠️ You're offline. Some features may be limited.
    </div>
  );
};

/**
 * ==================== LOADING FALLBACK COMPONENT ====================
 * 
 * Shown while lazy-loaded components are being fetched
 */
const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen bg-gray-100">
    <div className="text-center">
      <Loader size="large" />
      <p className="mt-4 text-gray-600 font-medium">Loading...</p>
    </div>
  </div>
);

/**
 * ==================== ERROR BOUNDARY ====================
 * 
 * Catches JavaScript errors anywhere in the child component tree
 * Logs errors and displays fallback UI
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('❌ Error caught by boundary:', error, errorInfo);
    
    // Log to external service (e.g., Sentry)
    if (window.Sentry) {
      window.Sentry.captureException(error, { extra: errorInfo });
    }

    this.setState({ error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
          <div className="bg-white rounded-lg shadow-card p-8 max-w-md text-center">
            <div className="text-danger-500 text-5xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Oops! Something went wrong
            </h1>
            <p className="text-gray-600 mb-6">
              We're sorry for the inconvenience. Please try refreshing the page.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-primary-500 text-white px-6 py-2 rounded-lg font-medium hover:bg-primary-600 transition-colors"
            >
              Refresh Page
            </button>
            {process.env.NODE_ENV === 'development' && (
              <details className="mt-6 text-left">
                <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                  Error Details (Dev Only)
                </summary>
                <pre className="mt-2 text-xs bg-gray-100 p-4 rounded overflow-auto max-h-64">
                  {this.state.error && this.state.error.toString()}
                  {this.state.errorInfo && this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * ==================== MAIN APP COMPONENT ====================
 */
const App = () => {
  // Hide loading screen when app mounts
  useEffect(() => {
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) {
      loadingScreen.classList.add('hidden');
      setTimeout(() => loadingScreen.remove(), 300);
    }
  }, []);

  return (
    <ErrorBoundary>
      <Router>
        <AuthProvider>
          <AcademyProvider>
            <NotificationProvider>
              {/* Offline Detection Banner */}
              <OfflineDetector />

              {/* Toast Notifications */}
              <Toaster
                position="top-right"
                toastOptions={{
                  duration: 4000,
                  style: {
                    background: '#333',
                    color: '#fff',
                    borderRadius: '8px',
                    padding: '16px',
                  },
                  success: {
                    iconTheme: {
                      primary: '#4CAF50',
                      secondary: '#fff',
                    },
                  },
                  error: {
                    iconTheme: {
                      primary: '#F44336',
                      secondary: '#fff',
                    },
                  },
                }}
              />

              {/* Main Application Routes */}
              <Suspense fallback={<LoadingFallback />}>
                <Routes>
                  {/* ==================== PUBLIC ROUTES ==================== */}
                  <Route
                    path="/login"
                    element={
                      <PublicRoute>
                        <AuthLayout>
                          <LoginPage />
                        </AuthLayout>
                      </PublicRoute>
                    }
                  />
                  <Route
                    path="/register"
                    element={
                      <PublicRoute>
                        <AuthLayout>
                          <RegisterPage />
                        </AuthLayout>
                      </PublicRoute>
                    }
                  />

                  {/* ==================== ROLE ELEVATION ==================== */}
                  <Route
                    path="/elevate-role"
                    element={
                      <ProtectedRoute>
                        <AuthLayout>
                          <RoleElevationPage />
                        </AuthLayout>
                      </ProtectedRoute>
                    }
                  />

                  {/* ==================== DASHBOARD ROUTES ==================== */}
                  {/* Main Dashboard Redirect */}
                  <Route
                    path="/dashboard"
                    element={
                      <ProtectedRoute>
                        <DashboardRedirect />
                      </ProtectedRoute>
                    }
                  />

                  {/* Admin Dashboard */}
                  <Route
                    path="/dashboard/admin"
                    element={
                      <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.OWNER]}>
                        <DashboardLayout>
                          <AdminDashboard />
                        </DashboardLayout>
                      </ProtectedRoute>
                    }
                  />

                  {/* Coach Dashboard */}
                  <Route
                    path="/dashboard/coach"
                    element={
                      <ProtectedRoute allowedRoles={[ROLES.HEAD_COACH, ROLES.COACH]}>
                        <DashboardLayout>
                          <CoachDashboard />
                        </DashboardLayout>
                      </ProtectedRoute>
                    }
                  />

                  {/* Parent Dashboard */}
                  <Route
                    path="/dashboard/parent"
                    element={
                      <ProtectedRoute allowedRoles={[ROLES.PARENT]}>
                        <DashboardLayout>
                          <ParentDashboard />
                        </DashboardLayout>
                      </ProtectedRoute>
                    }
                  />

                  {/* Kid Dashboard */}
                  <Route
                    path="/dashboard/kid"
                    element={
                      <ProtectedRoute allowedRoles={[ROLES.KID]}>
                        <DashboardLayout>
                          <KidDashboard />
                        </DashboardLayout>
                      </ProtectedRoute>
                    }
                  />

                  {/* Sponsor Dashboard */}
                  <Route
                    path="/dashboard/sponsor"
                    element={
                      <ProtectedRoute allowedRoles={[ROLES.SPONSOR]}>
                        <DashboardLayout>
                          <SponsorDashboard />
                        </DashboardLayout>
                      </ProtectedRoute>
                    }
                  />

                  {/* ==================== ATTENDANCE ROUTES ==================== */}
                  <Route
                    path="/attendance"
                    element={
                      <ProtectedRoute>
                        <DashboardLayout>
                          <AttendanceHistory />
                        </DashboardLayout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/attendance/:sessionId"
                    element={
                      <ProtectedRoute>
                        <DashboardLayout>
                          <SessionDetail />
                        </DashboardLayout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/attendance/reports"
                    element={
                      <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.OWNER, ROLES.HEAD_COACH]}>
                        <DashboardLayout>
                          <AttendanceReport />
                        </DashboardLayout>
                      </ProtectedRoute>
                    }
                  />

                  {/* ==================== KIDS ROUTES ==================== */}
                  <Route
                    path="/kids"
                    element={
                      <ProtectedRoute>
                        <DashboardLayout>
                          <KidsPage />
                        </DashboardLayout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/kids/:kidId"
                    element={
                      <ProtectedRoute>
                        <DashboardLayout>
                          <KidDetailPage />
                        </DashboardLayout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/kids/add"
                    element={
                      <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.OWNER, ROLES.HEAD_COACH, ROLES.COACH]}>
                        <DashboardLayout>
                          <AddKidPage />
                        </DashboardLayout>
                      </ProtectedRoute>
                    }
                  />

                  {/* ==================== EVENTS ROUTES ==================== */}
                  <Route
                    path="/events"
                    element={
                      <ProtectedRoute>
                        <DashboardLayout>
                          <EventsPage />
                        </DashboardLayout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/events/:eventId"
                    element={
                      <ProtectedRoute>
                        <DashboardLayout>
                          <EventDetailPage />
                        </DashboardLayout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/events/create"
                    element={
                      <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.OWNER, ROLES.HEAD_COACH]}>
                        <DashboardLayout>
                          <CreateEventPage />
                        </DashboardLayout>
                      </ProtectedRoute>
                    }
                  />

                  {/* ==================== MESSAGES ROUTES ==================== */}
                  <Route
                    path="/messages"
                    element={
                      <ProtectedRoute>
                        <DashboardLayout>
                          <MessagesPage />
                        </DashboardLayout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/messages/:conversationId"
                    element={
                      <ProtectedRoute>
                        <DashboardLayout>
                          <ConversationPage />
                        </DashboardLayout>
                      </ProtectedRoute>
                    }
                  />

                  {/* ==================== REPORTS ROUTES ==================== */}
                  <Route
                    path="/reports"
                    element={
                      <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.OWNER, ROLES.HEAD_COACH]}>
                        <DashboardLayout>
                          <ReportsPage />
                        </DashboardLayout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/reports/export"
                    element={
                      <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.OWNER, ROLES.HEAD_COACH]}>
                        <DashboardLayout>
                          <ExportPage />
                        </DashboardLayout>
                      </ProtectedRoute>
                    }
                  />

                  {/* ==================== PROFILE ROUTES ==================== */}
                  <Route
                    path="/profile"
                    element={
                      <ProtectedRoute>
                        <DashboardLayout>
                          <ProfilePage />
                        </DashboardLayout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/profile/edit"
                    element={
                      <ProtectedRoute>
                        <DashboardLayout>
                          <EditProfilePage />
                        </DashboardLayout>
                      </ProtectedRoute>
                    }
                  />

                  {/* ==================== SETTINGS ROUTES ==================== */}
                  <Route
                    path="/settings"
                    element={
                      <ProtectedRoute>
                        <DashboardLayout>
                          <SettingsPage />
                        </DashboardLayout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/settings/academy"
                    element={
                      <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.OWNER]} requireElevation>
                        <DashboardLayout>
                          <AcademySettingsPage />
                        </DashboardLayout>
                      </ProtectedRoute>
                    }
                  />

                  {/* ==================== ERROR ROUTES ==================== */}
                  <Route path="/unauthorized" element={<UnauthorizedPage />} />
                  <Route path="/404" element={<NotFoundPage />} />

                  {/* ==================== ROOT & CATCH-ALL ==================== */}
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route path="*" element={<Navigate to="/404" replace />} />
                </Routes>
              </Suspense>
            </NotificationProvider>
          </AcademyProvider>
        </AuthProvider>
      </Router>
    </ErrorBoundary>
  );
};

export default App;

/**
 * ==================== USAGE NOTES ====================
 * 
 * Route Structure:
 * - All routes are organized by feature (auth, dashboard, attendance, etc.)
 * - Protected routes require authentication
 * - Role-based routes check user permissions
 * - Lazy loading improves initial load time
 * 
 * Adding New Routes:
 * 1. Create page component in src/pages/[feature]/[PageName].jsx
 * 2. Import lazily: const PageName = lazy(() => import('@pages/feature/PageName'))
 * 3. Add route in appropriate section
 * 4. Wrap with ProtectedRoute if authentication needed
 * 5. Specify allowedRoles if role-based access required
 * 
 * Context Providers:
 * - AuthContext: User authentication state
 * - AcademyContext: Academy-specific data
 * - NotificationContext: Real-time notifications
 * 
 * Layouts:
 * - DashboardLayout: For authenticated pages (sidebar, header)
 * - AuthLayout: For login/register pages
 * - PublicLayout: For public marketing pages
 * 
 * Error Handling:
 * - ErrorBoundary catches React errors
 * - NotFoundPage for 404 errors
 * - UnauthorizedPage for permission errors
 * 
 * Performance:
 * - Code splitting with React.lazy()
 * - Suspense boundaries for loading states
 * - Lazy-loaded routes reduce initial bundle size
 * 
 * Offline Support:
 * - OfflineDetector shows banner when offline
 * - Service worker caches routes
 * - Firebase handles offline data sync
 * 
 * ==================== TESTING ====================
 * 
 * Test Cases:
 * 1. ✅ Unauthenticated user redirects to /login
 * 2. ✅ Authenticated user redirects to role-specific dashboard
 * 3. ✅ Role-based routes block unauthorized users
 * 4. ✅ Elevation required routes check isElevated flag
 * 5. ✅ 404 page shows for invalid routes
 * 6. ✅ Error boundary catches and displays errors
 * 7. ✅ Lazy loading shows fallback while loading
 * 8. ✅ Offline banner appears when connection lost
 * 
 * Manual Testing:
 * - Log in as different roles
 * - Try accessing unauthorized routes
 * - Test offline mode (DevTools > Network > Offline)
 * - Verify lazy loading (Network tab)
 * - Test error boundary (throw error in component)
 * 
 * ==================== DEPLOYMENT ====================
 * 
 * Build Command:
 * npm run build
 * 
 * The build creates optimized production bundle:
 * - Minified JavaScript
 * - Code-split chunks
 * - Optimized assets
 * - Source maps (for debugging)
 * 
 * Deploy to:
 * - Vercel: Automatic from GitHub
 * - Netlify: Drag & drop or CLI
 * - Firebase Hosting: firebase deploy
 * 
 * Environment Variables:
 * - VITE_API_URL
 * - VITE_FIREBASE_API_KEY
 * - (See .env.example for full list)
 */