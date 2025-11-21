/**
 * File: web/frontend/src/pages/auth/LoginPage.jsx
 * AccellaX 361°
 * 
 * User Roles:
 * - Super Admin, Academy Owner, Head Coach, Coach
 * - Payment Recorder, Parent, Kid, Sponsor
 * Routes:
 * - /login (this page)
 * - /register (registration page)
 * - /forgot-password (password reset)
 * - /elevate-role (admin elevation)
 */

import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  CheckCircle,
  Loader2,
  Shield,
  User,
  Phone,
  LogIn,
  UserPlus,
  ArrowRight,
  Chrome,
  Apple,
  Smartphone,
  WifiOff,
  Info
} from 'lucide-react';
import toast from 'react-hot-toast';

/**
 * LoginPage Component
 * Main authentication page for AccellaX 361°
 */
const LoginPage = () => {
  // ==================== HOOKS ====================
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loginWithGoogle, loginWithApple, user, loading: authLoading } = useAuth();
  
  // Get redirect path from location state (for protected routes)
  const from = location.state?.from?.pathname || '/dashboard';
  
  // Refs
  const emailInputRef = useRef(null);
  const passwordInputRef = useRef(null);
  
  // ==================== STATE ====================
  // Form data
  const [formData, setFormData] = useState({
    identifier: '', // Email or phone number
    password: '',
    rememberMe: false,
  });
  
  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSocialLoading, setIsSocialLoading] = useState({
    google: false,
    apple: false,
  });
  
  // Validation state
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  
  // Security state
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockoutTime, setLockoutTime] = useState(null);
  
  // Network state
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  // Feature flags
  const [features, setFeatures] = useState({
    emailLogin: true,
    phoneLogin: true,
    googleLogin: true,
    appleLogin: true,
    rememberMe: true,
    passwordReset: true,
    registration: true,
  });

  // ==================== EFFECTS ====================
  
  /**
   * Redirect if already authenticated
   */
  useEffect(() => {
    if (user && !authLoading) {
      navigate(from, { replace: true });
    }
  }, [user, authLoading, navigate, from]);

  /**
   * Load saved credentials from localStorage (if Remember Me was checked)
   */
  useEffect(() => {
    const savedIdentifier = localStorage.getItem('accellax_saved_identifier');
    const rememberMe = localStorage.getItem('accellax_remember_me') === 'true';
    
    if (savedIdentifier && rememberMe) {
      setFormData(prev => ({
        ...prev,
        identifier: savedIdentifier,
        rememberMe: true,
      }));
    }
  }, []);

  /**
   * Load login attempts and check for lockout
   */
  useEffect(() => {
    const attempts = parseInt(localStorage.getItem('accellax_login_attempts') || '0', 10);
    const lockout = localStorage.getItem('accellax_lockout_time');
    
    if (lockout) {
      const lockoutTime = new Date(lockout);
      const now = new Date();
      const timeDiff = lockoutTime - now;
      
      if (timeDiff > 0) {
        setIsLocked(true);
        setLockoutTime(lockoutTime);
        
        // Auto-unlock after lockout period
        setTimeout(() => {
          setIsLocked(false);
          setLockoutTime(null);
          localStorage.removeItem('accellax_lockout_time');
          localStorage.setItem('accellax_login_attempts', '0');
          setLoginAttempts(0);
        }, timeDiff);
      } else {
        // Lockout expired
        localStorage.removeItem('accellax_lockout_time');
        localStorage.setItem('accellax_login_attempts', '0');
      }
    }
    
    setLoginAttempts(attempts);
  }, []);

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
      toast.error('You are offline. Login requires internet connection.', { 
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
   * Auto-focus email input on mount
   */
  useEffect(() => {
    emailInputRef.current?.focus();
  }, []);

  /**
   * Keyboard shortcuts
   * - Ctrl/Cmd + K: Focus email input
   * - Enter: Submit form
   */
  useEffect(() => {
    const handleKeyPress = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        emailInputRef.current?.focus();
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  // ==================== VALIDATION ====================
  
  /**
   * Validate single field
   */
  const validateField = (name, value) => {
    let error = '';
    
    switch (name) {
      case 'identifier':
        if (!value) {
          error = 'Email, username, or phone number is required';
        } else if (!isValidEmail(value) && !isValidPhone(value) && !isValidUsername(value)) {
          error = 'Please enter a valid email, username, or phone number';
        }
        break;
        
      case 'password':
        if (!value) {
          error = 'Password is required';
        } else if (value.length < 6) {
          error = 'Password must be at least 6 characters';
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
    
    Object.keys(formData).forEach(key => {
      if (key !== 'rememberMe') {
        const error = validateField(key, formData[key]);
        if (error) newErrors[key] = error;
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Check if email is valid
   */
  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  /**
   * Check if phone number is valid (Kenyan format)
   */
  const isValidPhone = (phone) => {
    // Kenyan phone formats: +254..., 254..., 07..., 01...
    const phoneRegex = /^(\+?254|0)?[17]\d{8}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  };

  /**
   * Check if username is valid
   */
  const isValidUsername = (username) => {
    // Username: 3-30 chars, letters, numbers, underscores
    const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/;
    return usernameRegex.test(username);
  };

  /**
   * Normalize phone number to international format
   */
  const normalizePhone = (phone) => {
    let normalized = phone.replace(/\s/g, '');
    
    if (normalized.startsWith('0')) {
      normalized = '+254' + normalized.substring(1);
    } else if (normalized.startsWith('254')) {
      normalized = '+' + normalized;
    } else if (!normalized.startsWith('+')) {
      normalized = '+254' + normalized;
    }
    
    return normalized;
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
  const togglePasswordVisibility = () => {
    setShowPassword(prev => !prev);
  };

  /**
   * Handle login attempts and lockout
   */
  const handleFailedLogin = () => {
    const newAttempts = loginAttempts + 1;
    setLoginAttempts(newAttempts);
    localStorage.setItem('accellax_login_attempts', newAttempts.toString());
    
    // Lock account after 5 failed attempts
    if (newAttempts >= 5) {
      const lockoutDuration = 15 * 60 * 1000; // 15 minutes
      const lockoutTime = new Date(Date.now() + lockoutDuration);
      
      setIsLocked(true);
      setLockoutTime(lockoutTime);
      localStorage.setItem('accellax_lockout_time', lockoutTime.toISOString());
      
      toast.error(
        'Too many failed login attempts. Account locked for 15 minutes.',
        { duration: 8000 }
      );
      
      // Auto-unlock
      setTimeout(() => {
        setIsLocked(false);
        setLockoutTime(null);
        localStorage.removeItem('accellax_lockout_time');
        localStorage.setItem('accellax_login_attempts', '0');
        setLoginAttempts(0);
      }, lockoutDuration);
    }
  };

  /**
   * Reset login attempts on successful login
   */
  const resetLoginAttempts = () => {
    setLoginAttempts(0);
    localStorage.setItem('accellax_login_attempts', '0');
    localStorage.removeItem('accellax_lockout_time');
  };

  /**
   * Handle form submission (Email/Phone login)
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Check if locked
    if (isLocked) {
      const remainingTime = Math.ceil((lockoutTime - new Date()) / 1000 / 60);
      toast.error(`Account locked. Try again in ${remainingTime} minutes.`);
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
      // Send identifier directly - backend will handle email/username/phone
      const loginPayload = {
        identifier: formData.identifier,
        password: formData.password,
      };
      
      // Call login function from AuthContext
      const result = await login(loginPayload);

      // Add safety check
      if (!result || !result.user) {
        throw new Error('Invalid login response');
      }
            
      // Reset login attempts on success
      resetLoginAttempts();
      
      // Save credentials if Remember Me is checked
      if (formData.rememberMe) {
        localStorage.setItem('accellax_saved_identifier', formData.identifier);
        localStorage.setItem('accellax_remember_me', 'true');
      } else {
        localStorage.removeItem('accellax_saved_identifier');
        localStorage.removeItem('accellax_remember_me');
      }
      
      // Show success message
      toast.success(`Welcome back, ${result?.user?.name || 'there'}!`, {
        icon: '👋',
        duration: 3000,
      });
      
      // Navigate to dashboard (or redirect URL)
      navigate(from, { replace: true });
      
    } catch (error) {
      console.error('Login error:', error);
      
      // Handle failed login
      handleFailedLogin();
      
      // Show error message
      const errorMessage = error.message || 'Login failed. Please check your credentials.';
      toast.error(errorMessage, { duration: 5000 });
      
      // Set form errors
      if (error.field) {
        setErrors(prev => ({
          ...prev,
          [error.field]: error.message,
        }));
      }
      
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle Google Sign-In
   */
  const handleGoogleLogin = async () => {
    if (!isOnline) {
      toast.error('No internet connection');
      return;
    }
    
    setIsSocialLoading(prev => ({ ...prev, google: true }));
    
    try {
      const result = await loginWithGoogle();
      
      toast.success(`Welcome, ${result.user.name}!`, { icon: '🎉' });
      navigate(from, { replace: true });
      
    } catch (error) {
      console.error('Google login error:', error);
      toast.error(error.message || 'Google sign-in failed');
    } finally {
      setIsSocialLoading(prev => ({ ...prev, google: false }));
    }
  };

  /**
   * Handle Apple Sign-In
   */
  const handleAppleLogin = async () => {
    if (!isOnline) {
      toast.error('No internet connection');
      return;
    }
    
    setIsSocialLoading(prev => ({ ...prev, apple: true }));
    
    try {
      const result = await loginWithApple();
      
      toast.success(`Welcome, ${result.user.name}!`, { icon: '🎉' });
      navigate(from, { replace: true });
      
    } catch (error) {
      console.error('Apple login error:', error);
      toast.error(error.message || 'Apple sign-in failed');
    } finally {
      setIsSocialLoading(prev => ({ ...prev, apple: false }));
    }
  };

  // ==================== HELPER FUNCTIONS ====================
  
  /**
   * Get remaining lockout time (formatted)
   */
  const getRemainingLockoutTime = () => {
    if (!lockoutTime) return '';
    
    const now = new Date();
    const diff = lockoutTime - now;
    const minutes = Math.ceil(diff / 1000 / 60);
    
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
  };

  // ==================== RENDER ====================
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50 flex items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      {/* Offline Banner */}
      {!isOnline && (
        <div className="fixed top-0 left-0 right-0 bg-danger-500 text-white py-3 px-4 flex items-center justify-center gap-2 z-50 shadow-lg">
          <WifiOff className="w-5 h-5" />
          <span className="font-medium">You are offline. Login requires an internet connection.</span>
        </div>
      )}

      {/* Login Container - Two Column Layout */}
      <div className="w-full max-w-7xl relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          
          {/* LEFT COLUMN - Login Form */}
          <div className="order-2 lg:order-1">
            {/* Login Card */}
            <div className="bg-white rounded-2xl shadow-2xl p-8">
          {/* Lockout Warning */}
          {isLocked && (
            <div className="mb-6 p-4 bg-danger-50 border border-danger-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-danger-500 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-danger-800 mb-1">
                  Account Temporarily Locked
                </h3>
                <p className="text-sm text-danger-700">
                  Too many failed login attempts. Please try again in {getRemainingLockoutTime()}.
                </p>
              </div>
            </div>
          )}

          {/* Login Attempts Warning */}
          {loginAttempts > 0 && loginAttempts < 5 && (
            <div className={`
              mb-6 p-4 rounded-lg shadow-md border-2
              ${loginAttempts >= 3 
                ? 'bg-red-100 border-red-500' 
                : 'bg-yellow-100 border-yellow-500'
              }
            `}>
              <div className="flex items-start gap-3">
                <AlertCircle className={`
                  w-6 h-6 mt-0.5 flex-shrink-0
                  ${loginAttempts >= 3 ? 'text-red-700' : 'text-yellow-700'}
                `} />
                <div className="flex-1">
                  <h3 className={`
                    text-sm font-bold mb-1
                    ${loginAttempts >= 3 ? 'text-red-900' : 'text-yellow-900'}
                  `}>
                    Failed login attempts: {loginAttempts}/5
                  </h3>
                  <p className={`
                    text-xs font-semibold
                    ${loginAttempts >= 3 ? 'text-red-900' : 'text-yellow-900'}
                  `}>
                    {loginAttempts >= 3 
                      ? `Warning: Only ${5 - loginAttempts} attempt${5 - loginAttempts === 1 ? '' : 's'} remaining before your account is temporarily locked.`
                      : 'Your account will be temporarily locked after 5 failed attempts.'
                    }
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {/* Page Header */}
          <div className="text-center mb-8">
            <h2 className="text-2xl font-display font-bold text-gray-900 mb-2">
              Welcome Back
            </h2>
            <p className="text-gray-600">
              Sign in to access your dashboard
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email/Phone Input */}
            <div>
              <label 
                htmlFor="identifier" 
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Email, Username, or Phone
              </label>
              
              <div className="relative">
                <input
                  ref={emailInputRef}
                  id="identifier"
                  name="identifier"
                  type="text"
                  autoComplete="username"
                  required
                  disabled={isLocked || isLoading}
                  value={formData.identifier}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`
                    block w-full px-4 py-3 border rounded-lg
                    focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
                    disabled:bg-gray-100 disabled:cursor-not-allowed
                    transition-all duration-200
                    ${errors.identifier && touched.identifier 
                      ? 'border-danger-300 focus:ring-danger-500' 
                      : 'border-gray-300'
                    }
                  `}
                  placeholder="email, username, or phone"
                  aria-label="Email or phone number"
                  aria-describedby={errors.identifier ? "identifier-error" : undefined}
                  aria-invalid={errors.identifier && touched.identifier ? "true" : "false"}
                />
                
                {/* Validation Icon */}
                {touched.identifier && !errors.identifier && formData.identifier && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <CheckCircle className="h-5 w-5 text-success-500" />
                  </div>
                )}
              </div>
              
              {/* Error Message */}
              {errors.identifier && touched.identifier && (
                <p 
                  id="identifier-error" 
                  className="mt-2 text-sm text-danger-600 flex items-center gap-1"
                  role="alert"
                >
                  <AlertCircle className="w-4 h-4" />
                  {errors.identifier}
                </p>
              )}
              
              {/* Helper Text */}
              {!errors.identifier && (
                <p className="mt-2 text-xs text-gray-500">
                  Use your email, username, or phone number (e.g., johndoe or 0712345678)
                </p>
              )}
            </div>

            {/* Password Input */}
            <div>
              <label 
                htmlFor="password" 
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Password
              </label>
              
              <div className="relative">
                <input
                  ref={passwordInputRef}
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  disabled={isLocked || isLoading}
                  value={formData.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`
                    block w-full px-4 pr-12 py-3 border rounded-lg
                    focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
                    disabled:bg-gray-100 disabled:cursor-not-allowed
                    transition-all duration-200
                    ${errors.password && touched.password 
                      ? 'border-danger-300 focus:ring-danger-500' 
                      : 'border-gray-300'
                    }
                  `}
                  placeholder="Enter your password"
                  aria-label="Password"
                  aria-describedby={errors.password ? "password-error" : undefined}
                  aria-invalid={errors.password && touched.password ? "true" : "false"}
                />
                
                {/* Toggle Password Visibility */}
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  disabled={isLocked || isLoading}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center hover:text-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
              
              {/* Error Message */}
              {errors.password && touched.password && (
                <p 
                  id="password-error" 
                  className="mt-2 text-sm text-danger-600 flex items-center gap-1"
                  role="alert"
                >
                  <AlertCircle className="w-4 h-4" />
                  {errors.password}
                </p>
              )}
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              {features.rememberMe && (
                <div className="flex items-center">
                  <input
                    id="rememberMe"
                    name="rememberMe"
                    type="checkbox"
                    checked={formData.rememberMe}
                    onChange={handleChange}
                    disabled={isLocked || isLoading}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Remember me"
                  />
                  <label 
                    htmlFor="rememberMe" 
                    className="ml-2 block text-sm text-gray-700 select-none cursor-pointer"
                  >
                    Remember me
                  </label>
                </div>
              )}
              
              {features.passwordReset && (
                <Link
                  to="/forgot-password"
                  className="text-sm font-medium text-primary-600 hover:text-primary-500 transition-colors"
                  tabIndex={isLocked || isLoading ? -1 : 0}
                >
                  Forgot password?
                </Link>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLocked || isLoading || !isOnline}
              className={`
                w-full flex items-center justify-center gap-2 px-4 py-3 
                border border-transparent rounded-lg shadow-sm text-base font-medium text-white 
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500
                transition-all duration-200
                ${isLocked || isLoading || !isOnline
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-primary-600 hover:bg-primary-700 active:scale-95'
                }
              `}
              aria-label="Sign in"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  <span>Sign In</span>
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          {(features.googleLogin || features.appleLogin) && (
            <div className="mt-8">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Or continue with</span>
                </div>
              </div>

              {/* Social Login Buttons */}
              <div className="mt-6 grid grid-cols-2 gap-3">
                {/* Google Sign-In */}
                {features.googleLogin && (
                  <button
                    type="button"
                    onClick={handleGoogleLogin}
                    disabled={isLocked || isSocialLoading.google || !isOnline}
                    className={`
                      flex items-center justify-center gap-2 px-4 py-3
                      border border-gray-300 rounded-lg shadow-sm bg-white
                      text-sm font-medium text-gray-700
                      hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500
                      transition-all duration-200
                      disabled:opacity-50 disabled:cursor-not-allowed
                    `}
                    aria-label="Sign in with Google"
                  >
                    {isSocialLoading.google ? (
                      <Loader2 className="w-5 h-5 animate-spin text-primary-600" />
                    ) : (
                      <Chrome className="w-5 h-5 text-gray-700" />
                    )}
                    <span>Google</span>
                  </button>
                )}

                {/* Apple Sign-In */}
                {features.appleLogin && (
                  <button
                    type="button"
                    onClick={handleAppleLogin}
                    disabled={isLocked || isSocialLoading.apple || !isOnline}
                    className={`
                      flex items-center justify-center gap-2 px-4 py-3
                      border border-gray-300 rounded-lg shadow-sm bg-white
                      text-sm font-medium text-gray-700
                      hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500
                      transition-all duration-200
                      disabled:opacity-50 disabled:cursor-not-allowed
                    `}
                    aria-label="Sign in with Apple"
                  >
                    {isSocialLoading.apple ? (
                      <Loader2 className="w-5 h-5 animate-spin text-primary-600" />
                    ) : (
                      <Apple className="w-5 h-5 text-gray-700" />
                    )}
                    <span>Apple</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Registration Link */}
          {features.registration && (
            <div className="mt-8 text-center">
              <p className="text-sm text-gray-600">
                Don't have an account?{' '}
                <Link
                  to="/register"
                  className="font-medium text-primary-600 hover:text-primary-500 transition-colors inline-flex items-center gap-1"
                  tabIndex={isLocked || isLoading ? -1 : 0}
                >
                  Create one now
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </p>
            </div>
          )}

          {/* Mobile App Download Link */}
          <div className="mt-6 p-4 bg-primary-50 border border-primary-100 rounded-lg">
            <div className="flex items-start gap-3">
              <Smartphone className="w-5 h-5 text-primary-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-semibold text-primary-900 mb-1">
                  Are you a coach?
                </h4>
                <p className="text-xs text-primary-700 mb-2">
                  Download the AccellaX mobile app for easy attendance marking on the field.
                </p>
                <a
                  href="/download-app"
                  className="text-xs font-medium text-primary-600 hover:text-primary-700 underline"
                >
                  Download Mobile App
                </a>
              </div>
            </div>
          </div>

          {/* Role Elevation Link (Hidden - Accessible via Secret) */}
          {/* Users can access this by clicking the logo 7 times */}
          <div className="mt-6 text-center">
            <Link
              to="/elevate-role"
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
              tabIndex={-1}
            >
              Get Verified
            </Link>
          </div>
            </div>
          </div>
        {/* END LEFT COLUMN */}

        {/* RIGHT COLUMN - Branding & Promo */}
        <div className="order-1 lg:order-2 space-y-8">
          {/* Logo and Header */}
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-primary-500 rounded-2xl shadow-lg mb-4">
              <Shield className="w-12 h-12 text-white" />
            </div>
            
            <h1 className="text-4xl font-display font-bold text-gray-900 mb-2">
              AccellaX 361°
            </h1>

            <p className="text-gray-600 text-lg">
              Sports Academy Management Platform
            </p>
          </div>

          {/* Expedition Card - Hidden on mobile */}
          <div className="hidden lg:block bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700 rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-8 relative">
              {/* Background Image */}
              <div className="absolute inset-0 opacity-30">
                <img 
                  src="data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h100v100H0z' fill='%23000'/%3E%3Cpath d='M20 20l60 60M80 20L20 80' stroke='%23fff' stroke-width='2' opacity='0.1'/%3E%3C/svg%3E"
                  alt=""
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Content */}
              <div className="relative z-10">
                <h2 className="text-3xl font-display font-bold text-white mb-4">
                  AccellaX 361° Expedition
                </h2>
                
                <p className="text-white text-lg mb-6 leading-relaxed">
                  Lightsail Expedition is the easiest way to get started on AccellaX 361°
                </p>

                <button
                  onClick={() => navigate('/expedition')}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-white text-orange-600 font-semibold rounded-lg hover:bg-orange-50 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  Learn more »
                </button>
              </div>

              {/* Decorative Robot/Character Image */}
              <div className="mt-8 flex justify-center">
                <div className="w-48 h-48 relative">
                  {/* Simple Robot SVG */}
                  <svg
                    viewBox="0 0 200 200"
                    className="w-full h-full"
                    style={{ filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.3))' }}
                  >
                    {/* Robot Body */}
                    <rect x="60" y="80" width="80" height="90" rx="10" fill="white" stroke="#333" strokeWidth="3"/>
                    
                    {/* Robot Head */}
                    <rect x="70" y="40" width="60" height="50" rx="8" fill="white" stroke="#333" strokeWidth="3"/>
                    
                    {/* Eyes */}
                    <circle cx="85" cy="60" r="8" fill="#333"/>
                    <circle cx="115" cy="60" r="8" fill="#333"/>
                    <circle cx="87" cy="58" r="3" fill="white"/>
                    <circle cx="117" cy="58" r="3" fill="white"/>
                    
                    {/* Smile */}
                    <path d="M 85 75 Q 100 82 115 75" stroke="#333" strokeWidth="3" fill="none" strokeLinecap="round"/>
                    
                    {/* Antenna */}
                    <line x1="100" y1="40" x2="100" y2="25" stroke="#333" strokeWidth="3"/>
                    <circle cx="100" cy="22" r="5" fill="#ff6b00" stroke="#333" strokeWidth="2"/>
                    
                    {/* Arms */}
                    <rect x="35" y="95" width="25" height="50" rx="5" fill="white" stroke="#333" strokeWidth="3"/>
                    <rect x="140" y="95" width="25" height="50" rx="5" fill="white" stroke="#333" strokeWidth="3"/>
                    
                    {/* Hands - Thumbs up on right */}
                    <circle cx="47" cy="150" r="8" fill="white" stroke="#333" strokeWidth="2"/>
                    <path d="M 152 145 L 165 135" stroke="#333" strokeWidth="3" strokeLinecap="round"/>
                    <circle cx="152" cy="150" r="8" fill="white" stroke="#333" strokeWidth="2"/>
                    
                    {/* Legs */}
                    <rect x="70" y="170" width="25" height="20" rx="3" fill="white" stroke="#333" strokeWidth="3"/>
                    <rect x="105" y="170" width="25" height="20" rx="3" fill="white" stroke="#333" strokeWidth="3"/>
                    
                    {/* Control Panel */}
                    <circle cx="100" cy="110" r="6" fill="#ff6b00" stroke="#333" strokeWidth="2"/>
                    <rect x="85" y="130" width="10" height="15" rx="2" fill="#4ade80" stroke="#333" strokeWidth="2"/>
                    <rect x="105" y="130" width="10" height="15" rx="2" fill="#60a5fa" stroke="#333" strokeWidth="2"/>
                  </svg>
                </div>
              </div>

              {/* Decorative Lines */}
              <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-r from-orange-700 via-orange-600 to-orange-500"></div>
            </div>
          </div>
        </div>
        {/* END RIGHT COLUMN */}

        </div>
        {/* END Two Column Layout */}

        {/* Terms Agreement Notice */}
        <div className="mt-8 text-center px-4">
          <p className="text-gray-600 text-xs leading-relaxed">
            By continuing, you agree to AccellaX 361°{' '}
            <Link 
                to="/customer-agreement" 
                className="text-primary-600 hover:text-primary-700 hover:underline font-medium"
              >
              Customer Agreement
            </Link>
            {' '}or other agreement for AccellaX 361° services, and the{' '}
            <Link 
              to="/privacy" 
              className="text-primary-600 hover:text-primary-700 hover:underline font-medium"
            >
              Privacy Notice
            </Link>
            . This site uses essential cookies. See our{' '}
            <Link 
              to="/cookies" 
              className="text-primary-600 hover:text-primary-700 hover:underline font-medium"
            >
              Cookie Notice
            </Link>
            {' '}for more information.
          </p>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-gray-600 text-sm">
            &copy; {new Date().getFullYear()} AccellaX 361°. All rights reserved.
          </p>
          <div className="mt-2 flex items-center justify-center gap-4 text-xs text-gray-500">
            <Link to="/privacy" className="hover:text-gray-900 transition-colors">
              Privacy Policy
            </Link>
            <span>•</span>
            <Link to="/terms" className="hover:text-gray-900 transition-colors">
              Terms of Service
            </Link>
            <span>•</span>
            <Link to="/help" className="hover:text-gray-900 transition-colors">
              Help Center
            </Link>
          </div>
        </div>

        {/* Security Badge */}
        <div className="mt-6 flex items-center justify-center gap-2 text-gray-500 text-xs">
          <Shield className="w-4 h-4" />
          <span>Secured by Firebase Authentication</span>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
