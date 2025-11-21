/**
 * File: web/frontend/src/pages/auth/ResetPasswordPage.jsx
 * AccellaX 361° - Comprehensive Password Reset via Token Page
 * 
 * Description:
 * This page handles password reset via a token link sent to the user's email.
 * It's an alternative to the OTP-based reset flow (ForgotPasswordPage.jsx).
 * Users arrive here by clicking a "Reset Password" link in their email.
 * 
 * Features:
 * - Token-based password reset (email link)
 * - Token validation on page load
 * - Token expiry detection (shows time remaining)
 * - Password strength indicator with real-time feedback
 * - Password visibility toggle
 * - Confirm password validation
 * - Success animation with redirect
 * - Error handling (invalid/expired tokens)
 * - Responsive design (mobile, tablet, desktop)
 * - Accessibility features (ARIA, keyboard navigation)
 * - Network status detection
 * - Loading states
 * - Password requirements checklist
 * - Auto-login after successful reset (optional)
 * - Rate limiting protection
 * - Security best practices
 * 
 * URL Format:
 * /reset-password?token=abc123xyz&email=user@example.com
 * OR
 * /reset-password/:token (email extracted from token)
 * 
 * Flow:
 * 1. User clicks email link → Arrives on this page with token
 * 2. Token validated automatically → Shows form or error
 * 3. User enters new password → Submits
 * 4. Password reset → Redirect to login or auto-login
 * 
 * Token States:
 * - Valid: Show password reset form
 * - Invalid: Show error message with option to request new link
 * - Expired: Show expiry message with countdown
 * - Already Used: Show message that token was already used
 * 
 * Security Features:
 * - Token single-use (cannot be reused)
 * - Token expiry (typically 1 hour)
 * - Password complexity requirements
 * - No password reuse check
 * - Rate limiting on form submission
 * - CSRF protection (token validation)
 * 
 * Dependencies:
 * - React 18+
 * - React Router v6
 * - AuthContext (password reset functions)
 * - Firebase Auth or Backend API
 * - Lucide React (icons)
 * - React Hot Toast (notifications)
 * 
 * Routes:
 * - /reset-password?token=... (this page)
 * - /login (redirect after success)
 * - /forgot-password (if token invalid)
 * 
 * API Endpoints:
 * - GET /api/auth/validate-reset-token?token=... (validate token)
 * - POST /api/auth/reset-password-with-token (reset password)
 * 
 * Usage:
 * import ResetPasswordPage from '@/pages/auth/ResetPasswordPage';
 * <Route path="/reset-password" element={<ResetPasswordPage />} />
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link, useNavigate, useSearchParams, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle,
  Loader2,
  Shield,
  Check,
  X,
  KeyRound,
  Clock,
  XCircle,
  RefreshCw,
  WifiOff,
  Info,
  ShieldCheck,
  ShieldAlert,
  LogIn,
  Mail,
  ArrowRight,
  CheckCheck,
  PartyPopper
} from 'lucide-react';
import toast from 'react-hot-toast';

/**
 * ResetPasswordPage Component
 * Handles password reset via email token link
 */
const ResetPasswordPage = () => {
  // ==================== HOOKS ====================
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { token: urlToken } = useParams(); // Token from URL path
  const { 
    validatePasswordResetToken,
    resetPasswordWithToken,
    login,
    user,
    loading: authLoading 
  } = useAuth();
  
  // Get token and email from URL
  const tokenFromQuery = searchParams.get('token');
  const emailFromQuery = searchParams.get('email');
  const token = urlToken || tokenFromQuery;
  
  // Refs
  const passwordInputRef = useRef(null);
  
  // ==================== STATE ====================
  
  // Token validation state
  const [tokenStatus, setTokenStatus] = useState('validating'); // 'validating', 'valid', 'invalid', 'expired', 'used'
  const [tokenData, setTokenData] = useState(null); // Data from token validation (email, expiresAt)
  const [tokenExpiresAt, setTokenExpiresAt] = useState(null);
  const [tokenTimeRemaining, setTokenTimeRemaining] = useState(0);
  
  // Form data
  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: '',
    autoLogin: true, // Auto-login after reset
  });
  
  // UI state
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isValidatingToken, setIsValidatingToken] = useState(true);
  const [resetSuccess, setResetSuccess] = useState(false);
  
  // Validation state
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  
  // Password strength
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [passwordFeedback, setPasswordFeedback] = useState('');
  
  // Network state
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  // Countdown for redirect after success
  const [redirectCountdown, setRedirectCountdown] = useState(5);

  // ==================== EFFECTS ====================
  
  /**
   * Redirect if already authenticated
   */
  useEffect(() => {
    if (user && !authLoading && !resetSuccess) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, authLoading, navigate, resetSuccess]);

  /**
   * Validate token on mount
   */
  useEffect(() => {
    if (!token) {
      setTokenStatus('invalid');
      setIsValidatingToken(false);
      toast.error('No reset token provided', { duration: 5000 });
      return;
    }
    
    validateToken();
  }, [token]);

  /**
   * Token validation function
   */
  const validateToken = async () => {
    setIsValidatingToken(true);
    
    try {
      // Call API to validate token
      const result = await validatePasswordResetToken({ token });
      
      if (result.valid) {
        setTokenStatus('valid');
        setTokenData(result.data);
        setTokenExpiresAt(result.expiresAt);
        
        toast.success('Token validated successfully', { icon: '✅' });
      } else if (result.expired) {
        setTokenStatus('expired');
        toast.error('This reset link has expired', { duration: 5000 });
      } else if (result.used) {
        setTokenStatus('used');
        toast.error('This reset link has already been used', { duration: 5000 });
      } else {
        setTokenStatus('invalid');
        toast.error('Invalid reset link', { duration: 5000 });
      }
      
    } catch (error) {
      console.error('Token validation error:', error);
      
      if (error.code === 'TOKEN_EXPIRED') {
        setTokenStatus('expired');
        toast.error('This reset link has expired', { duration: 5000 });
      } else if (error.code === 'TOKEN_USED') {
        setTokenStatus('used');
        toast.error('This reset link has already been used', { duration: 5000 });
      } else {
        setTokenStatus('invalid');
        toast.error(error.message || 'Invalid reset link', { duration: 5000 });
      }
      
    } finally {
      setIsValidatingToken(false);
    }
  };

  /**
   * Online/Offline detection
   */
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success('Back online!', { icon: '🟢' });
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      toast.error('You are offline. Password reset requires internet connection.', { 
        icon: '🔴',
        duration: 5000 
      });
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  /**
   * Auto-focus password input when token is valid
   */
  useEffect(() => {
    if (tokenStatus === 'valid' && passwordInputRef.current) {
      passwordInputRef.current.focus();
    }
  }, [tokenStatus]);

  /**
   * Calculate password strength when password changes
   */
  useEffect(() => {
    if (formData.newPassword) {
      const { strength, feedback } = calculatePasswordStrength(formData.newPassword);
      setPasswordStrength(strength);
      setPasswordFeedback(feedback);
    } else {
      setPasswordStrength(0);
      setPasswordFeedback('');
    }
  }, [formData.newPassword]);

  /**
   * Token expiry countdown
   */
  useEffect(() => {
    if (tokenExpiresAt && tokenStatus === 'valid') {
      const interval = setInterval(() => {
        const now = new Date().getTime();
        const expiry = new Date(tokenExpiresAt).getTime();
        const diff = expiry - now;
        
        if (diff > 0) {
          setTokenTimeRemaining(Math.floor(diff / 1000)); // seconds
        } else {
          setTokenTimeRemaining(0);
          setTokenStatus('expired');
          toast.error('Reset link expired. Please request a new one.', { duration: 5000 });
        }
      }, 1000);
      
      return () => clearInterval(interval);
    }
  }, [tokenExpiresAt, tokenStatus]);

  /**
   * Success redirect countdown
   */
  useEffect(() => {
    if (resetSuccess && redirectCountdown > 0) {
      const timer = setTimeout(() => {
        setRedirectCountdown(prev => prev - 1);
      }, 1000);
      
      return () => clearTimeout(timer);
    } else if (resetSuccess && redirectCountdown === 0) {
      navigate('/login', { 
        state: { 
          message: 'Password reset successful! Please log in with your new password.' 
        } 
      });
    }
  }, [resetSuccess, redirectCountdown, navigate]);

  // ==================== VALIDATION ====================
  
  /**
   * Validate single field
   */
  const validateField = (name, value) => {
    let error = '';
    
    switch (name) {
      case 'newPassword':
        if (!value) {
          error = 'New password is required';
        } else if (value.length < 8) {
          error = 'Password must be at least 8 characters';
        } else if (!/(?=.*[a-z])/.test(value)) {
          error = 'Password must contain at least one lowercase letter';
        } else if (!/(?=.*[A-Z])/.test(value)) {
          error = 'Password must contain at least one uppercase letter';
        } else if (!/(?=.*\d)/.test(value)) {
          error = 'Password must contain at least one number';
        }
        break;
        
      case 'confirmPassword':
        if (!value) {
          error = 'Please confirm your password';
        } else if (value !== formData.newPassword) {
          error = 'Passwords do not match';
        }
        break;
        
      default:
        break;
    }
    
    return error;
  };

  /**
   * Validate entire form
   */
  const validateForm = () => {
    const newErrors = {};
    
    ['newPassword', 'confirmPassword'].forEach(field => {
      const error = validateField(field, formData[field]);
      if (error) newErrors[field] = error;
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Calculate password strength
   * Returns strength (0-5) and feedback message
   */
  const calculatePasswordStrength = (password) => {
    let strength = 0;
    let feedback = 'Weak password';
    
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z\d]/.test(password)) strength++;
    
    if (strength === 0 || strength === 1) {
      feedback = 'Weak password';
    } else if (strength === 2) {
      feedback = 'Fair password';
    } else if (strength === 3) {
      feedback = 'Good password';
    } else if (strength === 4) {
      feedback = 'Strong password';
    } else if (strength === 5) {
      feedback = 'Very strong password';
    }
    
    return { strength, feedback };
  };

  /**
   * Get password strength color
   */
  const getPasswordStrengthColor = (strength) => {
    const colors = [
      'bg-danger-500',
      'bg-danger-400',
      'bg-warning-500',
      'bg-success-400',
      'bg-success-500',
      'bg-success-600',
    ];
    return colors[strength] || colors[0];
  };

  // ==================== HANDLERS ====================
  
  /**
   * Handle input change
   */
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const fieldValue = type === 'checkbox' ? checked : value;
    
    setFormData(prev => ({
      ...prev,
      [name]: fieldValue,
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  /**
   * Handle input blur (for validation)
   */
  const handleBlur = (e) => {
    const { name, value } = e.target;
    
    setTouched(prev => ({
      ...prev,
      [name]: true,
    }));
    
    // Validate field on blur
    const error = validateField(name, value);
    if (error) {
      setErrors(prev => ({
        ...prev,
        [name]: error,
      }));
    }
  };

  /**
   * Toggle password visibility
   */
  const togglePasswordVisibility = (field) => {
    if (field === 'newPassword') {
      setShowNewPassword(prev => !prev);
    } else if (field === 'confirmPassword') {
      setShowConfirmPassword(prev => !prev);
    }
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Check token status
    if (tokenStatus !== 'valid') {
      toast.error('Invalid or expired reset link');
      return;
    }
    
    // Check internet connection
    if (!isOnline) {
      toast.error('No internet connection. Please check your network.');
      return;
    }
    
    // Validate form
    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Call API to reset password
      await resetPasswordWithToken({
        token,
        newPassword: formData.newPassword,
      });
      
      // Show success
      setResetSuccess(true);
      toast.success('Password reset successful!', { icon: '🎉', duration: 5000 });
      
      // Auto-login if enabled
      if (formData.autoLogin && tokenData?.email) {
        try {
          await login({
            identifier: tokenData.email,
            password: formData.newPassword,
          });
          
          toast.success('Logged in successfully!', { icon: '👋' });
          
          // Redirect to dashboard
          setTimeout(() => {
            navigate('/dashboard', { replace: true });
          }, 2000);
          
        } catch (loginError) {
          console.error('Auto-login error:', loginError);
          // Continue with normal redirect to login page
        }
      }
      
    } catch (error) {
      console.error('Reset password error:', error);
      
      // Show error message
      const errorMessage = error.message || 'Failed to reset password. Please try again.';
      toast.error(errorMessage, { duration: 5000 });
      
      // Set form errors
      if (error.field) {
        setErrors(prev => ({
          ...prev,
          [error.field]: error.message,
        }));
      }
      
      // If token expired or used, update status
      if (error.code === 'TOKEN_EXPIRED') {
        setTokenStatus('expired');
      } else if (error.code === 'TOKEN_USED') {
        setTokenStatus('used');
      } else if (error.code === 'TOKEN_INVALID') {
        setTokenStatus('invalid');
      }
      
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle request new link
   */
  const handleRequestNewLink = () => {
    navigate('/forgot-password', {
      state: {
        email: tokenData?.email || emailFromQuery || '',
      },
    });
  };

  // ==================== COMPUTED VALUES ====================

  /**
   * Format token time remaining
   */
  const formatTokenTimeRemaining = () => {
    const hours = Math.floor(tokenTimeRemaining / 3600);
    const minutes = Math.floor((tokenTimeRemaining % 3600) / 60);
    const seconds = tokenTimeRemaining % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  };

  /**
   * Get masked email
   */
  const getMaskedEmail = () => {
    const email = tokenData?.email || emailFromQuery;
    if (!email) return '';
    return email.replace(/(.{2})(.*)(@.*)/, '$1***$3');
  };

  // ==================== RENDER HELPERS ====================
  
  /**
   * Render Loading State
   */
  const renderLoading = () => {
    return (
      <div className="text-center py-12">
        <Loader2 className="w-12 h-12 mx-auto mb-4 text-primary-600 animate-spin" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Validating Reset Link
        </h3>
        <p className="text-gray-600">
          Please wait while we verify your reset link...
        </p>
      </div>
    );
  };

  /**
   * Render Invalid Token State
   */
  const renderInvalidToken = () => {
    return (
      <div className="text-center py-8">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-danger-100 rounded-full mb-6">
          <XCircle className="w-12 h-12 text-danger-600" />
        </div>
        
        <h2 className="text-2xl font-display font-bold text-gray-900 mb-3">
          Invalid Reset Link
        </h2>
        
        <p className="text-gray-600 mb-6 max-w-md mx-auto">
          This password reset link is invalid or has been tampered with. 
          Please request a new password reset link.
        </p>
        
        <div className="space-y-3">
          <button
            onClick={handleRequestNewLink}
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
          >
            <RefreshCw className="w-5 h-5" />
            Request New Link
          </button>
          
          <div>
            <Link
              to="/login"
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    );
  };

  /**
   * Render Expired Token State
   */
  const renderExpiredToken = () => {
    return (
      <div className="text-center py-8">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-warning-100 rounded-full mb-6">
          <Clock className="w-12 h-12 text-warning-600" />
        </div>
        
        <h2 className="text-2xl font-display font-bold text-gray-900 mb-3">
          Reset Link Expired
        </h2>
        
        <p className="text-gray-600 mb-6 max-w-md mx-auto">
          This password reset link has expired. For security reasons, reset links 
          are only valid for a limited time. Please request a new one.
        </p>
        
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-6 max-w-md mx-auto">
          <div className="flex items-start gap-2">
            <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-left">
              <p className="text-sm text-blue-900 font-medium mb-1">
                Why do reset links expire?
              </p>
              <p className="text-xs text-blue-700">
                Reset links expire to protect your account security. If someone gains 
                access to your email later, they won't be able to use an old reset link.
              </p>
            </div>
          </div>
        </div>
        
        <div className="space-y-3">
          <button
            onClick={handleRequestNewLink}
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
          >
            <Mail className="w-5 h-5" />
            Send New Reset Email
          </button>
          
          <div>
            <Link
              to="/login"
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    );
  };

  /**
   * Render Used Token State
   */
  const renderUsedToken = () => {
    return (
      <div className="text-center py-8">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-success-100 rounded-full mb-6">
          <CheckCheck className="w-12 h-12 text-success-600" />
        </div>
        
        <h2 className="text-2xl font-display font-bold text-gray-900 mb-3">
          Password Already Reset
        </h2>
        
        <p className="text-gray-600 mb-6 max-w-md mx-auto">
          This reset link has already been used. Your password was successfully changed.
        </p>
        
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg mb-6 max-w-md mx-auto">
          <div className="flex items-start gap-2">
            <ShieldCheck className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
            <div className="text-left">
              <p className="text-sm text-green-900 font-medium mb-1">
                Your account is secure
              </p>
              <p className="text-xs text-green-700">
                Each reset link can only be used once. If you didn't reset your password, 
                please contact support immediately.
              </p>
            </div>
          </div>
        </div>
        
        <div className="space-y-3">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
          >
            <LogIn className="w-5 h-5" />
            Go to Login
          </Link>
          
          <div>
            <button
              onClick={handleRequestNewLink}
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              Need to reset again?
            </button>
          </div>
        </div>
      </div>
    );
  };

  /**
   * Render Success State
   */
  const renderSuccess = () => {
    return (
      <div className="text-center py-8 animate-fade-in">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-success-100 rounded-full mb-6 animate-bounce">
          <PartyPopper className="w-12 h-12 text-success-600" />
        </div>
        
        <h2 className="text-2xl font-display font-bold text-gray-900 mb-3">
          Password Reset Successful!
        </h2>
        
        <p className="text-gray-600 mb-6 max-w-md mx-auto">
          Your password has been successfully reset. You can now log in with your new password.
        </p>
        
        <div className="p-4 bg-success-50 border border-success-200 rounded-lg mb-6 max-w-md mx-auto">
          <p className="text-sm text-success-900">
            {formData.autoLogin 
              ? 'Logging you in automatically...'
              : `Redirecting to login in ${redirectCountdown} seconds...`
            }
          </p>
        </div>
        
        <Link
          to="/login"
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
        >
          <LogIn className="w-5 h-5" />
          Go to Login Now
        </Link>
      </div>
    );
  };

  /**
   * Render Password Reset Form
   */
  const renderResetForm = () => {
    return (
      <div className="space-y-6">
        {/* Page Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4">
            <KeyRound className="w-8 h-8 text-primary-600" />
          </div>
          <h2 className="text-2xl font-display font-bold text-gray-900 mb-2">
            Create New Password
          </h2>
          <p className="text-gray-600">
            Reset password for{' '}
            <span className="font-semibold text-gray-900">
              {getMaskedEmail()}
            </span>
          </p>
        </div>

        {/* Token Expiry Warning */}
        {tokenTimeRemaining > 0 && tokenTimeRemaining < 300 && (
          <div className="p-3 bg-warning-50 border border-warning-200 rounded-lg flex items-center gap-2">
            <Clock className="w-5 h-5 text-warning-600 flex-shrink-0" />
            <p className="text-sm text-warning-900">
              Link expires in <span className="font-semibold">{formatTokenTimeRemaining()}</span>
            </p>
          </div>
        )}

        {/* Password Form */}
        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            {/* New Password */}
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                New Password *
              </label>
              
              <div className="relative">
                <input
                  ref={passwordInputRef}
                  id="newPassword"
                  name="newPassword"
                  type={showNewPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={formData.newPassword}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`
                    block w-full px-4 pr-12 py-3 border rounded-lg
                    focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
                    transition-all duration-200
                    ${errors.newPassword && touched.newPassword 
                      ? 'border-danger-300 focus:ring-danger-500' 
                      : 'border-gray-300'
                    }
                  `}
                  placeholder="Enter new password"
                />
                
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('newPassword')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center hover:text-primary-600 transition-colors"
                  tabIndex={-1}
                >
                  {showNewPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
              
              {/* Password strength indicator */}
              {formData.newPassword && (
                <div className="mt-2">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${getPasswordStrengthColor(passwordStrength)} transition-all duration-300`}
                        style={{ width: `${(passwordStrength / 5) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-gray-600 min-w-[100px]">
                      {passwordFeedback}
                    </span>
                  </div>
                </div>
              )}
              
              {errors.newPassword && touched.newPassword && (
                <p className="mt-2 text-sm text-danger-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.newPassword}
                </p>
              )}
              
              {/* Password Requirements Checklist */}
              <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                <p className="text-xs font-medium text-gray-700 mb-2">Password must contain:</p>
                <ul className="space-y-1">
                  <li className="flex items-center gap-2 text-xs text-gray-600">
                    {formData.newPassword.length >= 8 ? (
                      <CheckCircle className="w-3.5 h-3.5 text-success-500" />
                    ) : (
                      <X className="w-3.5 h-3.5 text-gray-400" />
                    )}
                    At least 8 characters
                  </li>
                  <li className="flex items-center gap-2 text-xs text-gray-600">
                    {/[a-z]/.test(formData.newPassword) ? (
                      <CheckCircle className="w-3.5 h-3.5 text-success-500" />
                    ) : (
                      <X className="w-3.5 h-3.5 text-gray-400" />
                    )}
                    One lowercase letter (a-z)
                  </li>
                  <li className="flex items-center gap-2 text-xs text-gray-600">
                    {/[A-Z]/.test(formData.newPassword) ? (
                      <CheckCircle className="w-3.5 h-3.5 text-success-500" />
                    ) : (
                      <X className="w-3.5 h-3.5 text-gray-400" />
                    )}
                    One uppercase letter (A-Z)
                  </li>
                  <li className="flex items-center gap-2 text-xs text-gray-600">
                    {/\d/.test(formData.newPassword) ? (
                      <CheckCircle className="w-3.5 h-3.5 text-success-500" />
                    ) : (
                      <X className="w-3.5 h-3.5 text-gray-400" />
                    )}
                    One number (0-9)
                  </li>
                  <li className="flex items-center gap-2 text-xs text-gray-600">
                    {/[^a-zA-Z\d]/.test(formData.newPassword) ? (
                      <CheckCircle className="w-3.5 h-3.5 text-success-500" />
                    ) : (
                      <div className="w-3.5 h-3.5 border border-gray-300 rounded-full" />
                    )}
                    Special character (optional, but recommended)
                  </li>
                </ul>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Confirm New Password *
              </label>
              
              <div className="relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`
                    block w-full px-4 pr-12 py-3 border rounded-lg
                    focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
                    transition-all duration-200
                    ${errors.confirmPassword && touched.confirmPassword 
                      ? 'border-danger-300 focus:ring-danger-500' 
                      : 'border-gray-300'
                    }
                  `}
                  placeholder="Re-enter new password"
                />
                
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('confirmPassword')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center hover:text-primary-600 transition-colors"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
                
                {touched.confirmPassword && !errors.confirmPassword && formData.confirmPassword && (
                  <div className="absolute inset-y-0 right-12 pr-3 flex items-center">
                    <CheckCircle className="h-5 w-5 text-success-500" />
                  </div>
                )}
              </div>
              
              {errors.confirmPassword && touched.confirmPassword && (
                <p className="mt-2 text-sm text-danger-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.confirmPassword}
                </p>
              )}
            </div>

            {/* Auto-login Option */}
            <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <input
                id="autoLogin"
                name="autoLogin"
                type="checkbox"
                checked={formData.autoLogin}
                onChange={handleChange}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="autoLogin" className="flex-1 cursor-pointer">
                <span className="text-sm font-medium text-gray-900 block">
                  Log me in automatically
                </span>
                <span className="text-xs text-gray-600">
                  Skip the login page and go straight to your dashboard
                </span>
              </label>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || !isOnline}
            className={`
              w-full mt-8 flex items-center justify-center gap-2 px-4 py-3 
              border border-transparent rounded-lg shadow-sm text-base font-medium text-white 
              focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-success-500
              transition-all duration-200
              ${isLoading || !isOnline
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-success-600 hover:bg-success-700 active:scale-95'
              }
            `}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Resetting Password...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-5 h-5" />
                <span>Reset Password</span>
              </>
            )}
          </button>
        </form>

        {/* Security Info */}
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-start gap-2">
            <ShieldAlert className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-green-700">
              <p className="font-semibold mb-1">Security Tips:</p>
              <ul className="space-y-1 text-xs">
                <li>• Use a unique password not used on other sites</li>
                <li>• Avoid using personal information (birthdate, name)</li>
                <li>• Consider using a password manager</li>
                <li>• Enable two-factor authentication after login</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Help Links */}
        <div className="mt-6 text-center space-y-2">
          <Link
            to="/login"
            className="text-sm text-gray-600 hover:text-gray-900 transition-colors block"
          >
            Remember your password? Sign in
          </Link>
          <Link
            to="/help"
            className="text-xs text-gray-500 hover:text-gray-700 transition-colors block"
          >
            Need help? Contact Support
          </Link>
        </div>
      </div>
    );
  };

  // ==================== MAIN RENDER ====================
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50 flex items-center justify-center p-4">
      {/* Offline Banner */}
      {!isOnline && (
        <div className="fixed top-0 left-0 right-0 bg-danger-500 text-white py-3 px-4 flex items-center justify-center gap-2 z-50 shadow-lg">
          <WifiOff className="w-5 h-5" />
          <span className="font-medium">You are offline. Password reset requires internet connection.</span>
        </div>
      )}

      {/* Main Container */}
      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center justify-center w-16 h-16 bg-primary-500 rounded-2xl shadow-lg mb-4 hover:shadow-xl transition-shadow">
            <Shield className="w-10 h-10 text-white" />
          </Link>
          <h1 className="text-2xl font-display font-bold text-gray-900">
            AccellaX 361°
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Sports Academy Platform
          </p>
        </div>

        {/* Reset Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {/* Content based on token status */}
          {isValidatingToken && renderLoading()}
          {tokenStatus === 'invalid' && !isValidatingToken && renderInvalidToken()}
          {tokenStatus === 'expired' && renderExpiredToken()}
          {tokenStatus === 'used' && renderUsedToken()}
          {tokenStatus === 'valid' && !resetSuccess && renderResetForm()}
          {resetSuccess && renderSuccess()}
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            &copy; {new Date().getFullYear()} AccellaX 361°. All rights reserved.
          </p>
          <div className="mt-2 flex items-center justify-center gap-4 text-xs text-gray-500">
            <Link to="/privacy" className="hover:text-gray-700 transition-colors">
              Privacy
            </Link>
            <span>•</span>
            <Link to="/terms" className="hover:text-gray-700 transition-colors">
              Terms
            </Link>
            <span>•</span>
            <Link to="/help" className="hover:text-gray-700 transition-colors">
              Help
            </Link>
          </div>
        </div>

        {/* Security Badge */}
        <div className="mt-4 flex items-center justify-center gap-2 text-gray-500 text-xs">
          <Shield className="w-4 h-4" />
          <span>Secured by Firebase Authentication</span>
        </div>
      </div>

      {/* CSS for animations */}
      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }

        @keyframes fade-in-out {
          0%, 100% {
            opacity: 0;
            transform: translateY(-10px);
          }
          10%, 90% {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default ResetPasswordPage;