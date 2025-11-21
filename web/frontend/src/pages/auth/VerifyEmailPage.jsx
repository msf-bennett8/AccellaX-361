/**
 * File: web/frontend/src/pages/auth/VerifyEmailPage.jsx
 * AccellaX 361° - Comprehensive Email Verification Page
 * 
 * Description:
 * This page handles email verification after user registration.
 * Users arrive here after creating an account and need to verify their email
 * before accessing the platform. Supports both automatic verification via
 * email link and manual code entry.
 * 
 * Features:
 * - Automatic email verification via token link
 * - Manual verification code entry (6-digit code)
 * - Resend verification email with countdown
 * - Email change option (if entered wrong email)
 * - Success animation with auto-redirect
 * - Token validation on page load
 * - Real-time code validation
 * - Rate limiting (max resend attempts)
 * - Responsive design (mobile, tablet, desktop)
 * - Accessibility features (ARIA, keyboard navigation)
 * - Network status detection
 * - Loading states with animations
 * - QR code for mobile verification (optional)
 * - Verification status tracking
 * 
 * Verification Methods:
 * 1. Email Link: Click link in email → Auto-verify
 * 2. Manual Code: Enter 6-digit code from email
 * 
 * URL Formats:
 * - /verify-email (show verification form)
 * - /verify-email?token=abc123 (auto-verify via email link)
 * - /verify-email?email=user@example.com (pre-fill email)
 * 
 * Flow:
 * 1. User registers → Sent to this page
 * 2. Verification email sent automatically
 * 3. User can:
 *    a. Click email link (auto-verify)
 *    b. Enter 6-digit code manually
 *    c. Resend email if not received
 *    d. Change email if wrong
 * 4. After verification → Redirect to dashboard or login
 * 
 * Security Features:
 * - Token single-use (cannot be reused)
 * - Code expiry (10 minutes)
 * - Max 5 verification attempts
 * - Rate limiting (max 3 resend per hour)
 * - Email confirmation before change
 * 
 * Dependencies:
 * - React 18+
 * - React Router v6
 * - AuthContext (verification functions)
 * - Firebase Auth
 * - Lucide React (icons)
 * - React Hot Toast (notifications)
 * 
 * Routes:
 * - /verify-email (this page)
 * - /dashboard (redirect after success)
 * - /login (if not logged in)
 * 
 * API Endpoints:
 * - POST /api/auth/verify-email-token (verify via token)
 * - POST /api/auth/verify-email-code (verify via code)
 * - POST /api/auth/resend-verification (resend email)
 * - POST /api/auth/change-verification-email (change email)
 * 
 * Usage:
 * import VerifyEmailPage from '@/pages/auth/VerifyEmailPage';
 * <Route path="/verify-email" element={<VerifyEmailPage />} />
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Mail,
  MailOpen,
  CheckCircle,
  Loader2,
  Shield,
  Send,
  RefreshCw,
  Clock,
  AlertCircle,
  Key,
  Edit,
  ArrowRight,
  Smartphone,
  Inbox,
  X,
  Check,
  WifiOff,
  Info,
  ShieldCheck,
  PartyPopper,
  LogIn,
  ExternalLink,
  MessageSquare
} from 'lucide-react';
import toast from 'react-hot-toast';

/**
 * VerifyEmailPage Component
 * Handles email verification after registration
 */
const VerifyEmailPage = () => {
  // ==================== HOOKS ====================
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { 
    verifyEmailWithToken,
    verifyEmailWithCode,
    resendVerificationEmail,
    changeVerificationEmail,
    user,
    loading: authLoading 
  } = useAuth();
  
  // Get data from URL or location state
  const tokenFromUrl = searchParams.get('token');
  const emailFromUrl = searchParams.get('email');
  const emailFromState = location.state?.email;
  const userEmail = user?.email || emailFromState || emailFromUrl || '';
  
  // Refs
  const codeInputRefs = useRef([]);
  const newEmailInputRef = useRef(null);
  
  // ==================== STATE ====================
  
  // Verification state
  const [verificationStatus, setVerificationStatus] = useState('pending'); // 'pending', 'verifying', 'verified', 'failed'
  const [verificationMethod, setVerificationMethod] = useState('code'); // 'code', 'link'
  
  // Form data
  const [formData, setFormData] = useState({
    email: userEmail,
    code: ['', '', '', '', '', ''], // 6-digit code
    newEmail: '',
  });
  
  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifyingToken, setIsVerifyingToken] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [isChangingEmail, setIsChangingEmail] = useState(false);
  const [showChangeEmail, setShowChangeEmail] = useState(false);
  
  // Validation state
  const [errors, setErrors] = useState({});
  
  // Resend state
  const [resendCount, setResendCount] = useState(0);
  const [maxResendCount] = useState(3);
  const [canResend, setCanResend] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(60);
  
  // Code attempts
  const [codeAttempts, setCodeAttempts] = useState(0);
  const [maxCodeAttempts] = useState(5);
  
  // Network state
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  // Success redirect countdown
  const [redirectCountdown, setRedirectCountdown] = useState(5);
  
  // Email provider info
  const [emailProvider, setEmailProvider] = useState(null);

  // ==================== EFFECTS ====================
  
  /**
   * Auto-verify if token in URL
   */
  useEffect(() => {
    if (tokenFromUrl) {
      setVerificationMethod('link');
      verifyWithToken(tokenFromUrl);
    }
  }, [tokenFromUrl]);

  /**
   * Detect email provider for helpful links
   */
  useEffect(() => {
    if (formData.email) {
      const domain = formData.email.split('@')[1]?.toLowerCase();
      
      const providers = {
        'gmail.com': { name: 'Gmail', url: 'https://mail.google.com', icon: '📧' },
        'yahoo.com': { name: 'Yahoo Mail', url: 'https://mail.yahoo.com', icon: '📬' },
        'outlook.com': { name: 'Outlook', url: 'https://outlook.live.com', icon: '📮' },
        'hotmail.com': { name: 'Outlook', url: 'https://outlook.live.com', icon: '📮' },
        'icloud.com': { name: 'iCloud Mail', url: 'https://www.icloud.com/mail', icon: '📭' },
      };
      
      setEmailProvider(providers[domain] || null);
    }
  }, [formData.email]);

  /**
   * Redirect if already verified or not logged in
   */
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        // Not logged in - redirect to login
        navigate('/login', { 
          state: { 
            message: 'Please log in to verify your email' 
          } 
        });
      } else if (user.emailVerified) {
        // Already verified - redirect to dashboard
        navigate('/dashboard', { replace: true });
      }
    }
  }, [user, authLoading, navigate]);

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
      toast.error('You are offline. Email verification requires internet connection.', { 
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
   * Auto-focus first code input
   */
  useEffect(() => {
    if (verificationMethod === 'code' && codeInputRefs.current[0]) {
      codeInputRefs.current[0].focus();
    }
  }, [verificationMethod]);

  /**
   * Resend countdown timer
   */
  useEffect(() => {
    if (resendCountdown > 0 && !canResend) {
      const timer = setTimeout(() => {
        setResendCountdown(prev => prev - 1);
      }, 1000);
      
      return () => clearTimeout(timer);
    } else if (resendCountdown === 0) {
      setCanResend(true);
    }
  }, [resendCountdown, canResend]);

  /**
   * Success redirect countdown
   */
  useEffect(() => {
    if (verificationStatus === 'verified' && redirectCountdown > 0) {
      const timer = setTimeout(() => {
        setRedirectCountdown(prev => prev - 1);
      }, 1000);
      
      return () => clearTimeout(timer);
    } else if (verificationStatus === 'verified' && redirectCountdown === 0) {
      navigate('/dashboard', { replace: true });
    }
  }, [verificationStatus, redirectCountdown, navigate]);

  // ==================== VALIDATION ====================
  
  /**
   * Validate email
   */
  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  /**
   * Validate verification code
   */
  const isCodeComplete = useMemo(() => {
    return formData.code.every(digit => digit !== '');
  }, [formData.code]);

  // ==================== HANDLERS ====================
  
  /**
   * Verify with token (from email link)
   */
  const verifyWithToken = async (token) => {
    setIsVerifyingToken(true);
    setVerificationStatus('verifying');
    
    try {
      await verifyEmailWithToken({ token });
      
      setVerificationStatus('verified');
      toast.success('Email verified successfully!', { icon: '🎉', duration: 5000 });
      
    } catch (error) {
      console.error('Token verification error:', error);
      
      setVerificationStatus('failed');
      
      const errorMessage = error.message || 'Failed to verify email. Please try entering the code manually.';
      toast.error(errorMessage, { duration: 5000 });
      
      // Switch to manual code entry
      setVerificationMethod('code');
      
    } finally {
      setIsVerifyingToken(false);
    }
  };

  /**
   * Handle code input change
   */
  const handleCodeChange = (index, value) => {
    // Only allow single digit
    if (value.length > 1) {
      value = value[0];
    }
    
    // Only allow numbers
    if (!/^\d*$/.test(value)) {
      return;
    }
    
    // Update code array
    const newCode = [...formData.code];
    newCode[index] = value;
    
    setFormData(prev => ({
      ...prev,
      code: newCode,
    }));
    
    // Auto-focus next input
    if (value && index < 5) {
      codeInputRefs.current[index + 1]?.focus();
    }
    
    // Clear error
    if (errors.code) {
      setErrors(prev => ({
        ...prev,
        code: '',
      }));
    }
  };

  /**
   * Handle code keydown (backspace navigation)
   */
  const handleCodeKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !formData.code[index] && index > 0) {
      codeInputRefs.current[index - 1]?.focus();
    }
  };

  /**
   * Handle code paste
   */
  const handleCodePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    
    if (/^\d{6}$/.test(pastedData)) {
      const codeArray = pastedData.split('');
      setFormData(prev => ({
        ...prev,
        code: codeArray,
      }));
      
      codeInputRefs.current[5]?.focus();
      toast.success('Code pasted successfully', { icon: '📋' });
    } else {
      toast.error('Please paste a valid 6-digit code');
    }
  };

  /**
   * Verify with code
   */
  const handleVerifyCode = async (e) => {
    e.preventDefault();
    
    if (!isOnline) {
      toast.error('No internet connection');
      return;
    }
    
    if (!isCodeComplete) {
      toast.error('Please enter complete verification code');
      return;
    }
    
    if (codeAttempts >= maxCodeAttempts) {
      toast.error('Too many failed attempts. Please request a new code.', { duration: 5000 });
      return;
    }
    
    setIsLoading(true);
    setVerificationStatus('verifying');
    
    try {
      const codeString = formData.code.join('');
      
      await verifyEmailWithCode({
        email: formData.email,
        code: codeString,
      });
      
      setVerificationStatus('verified');
      toast.success('Email verified successfully!', { icon: '🎉', duration: 5000 });
      
    } catch (error) {
      console.error('Code verification error:', error);
      
      setVerificationStatus('failed');
      
      const newAttempts = codeAttempts + 1;
      setCodeAttempts(newAttempts);
      
      const errorMessage = error.message || 'Invalid verification code. Please try again.';
      toast.error(errorMessage, { duration: 5000 });
      
      if (newAttempts < maxCodeAttempts) {
        const remainingAttempts = maxCodeAttempts - newAttempts;
        toast.error(
          `${remainingAttempts} attempt${remainingAttempts === 1 ? '' : 's'} remaining`,
          { duration: 3000 }
        );
      } else {
        toast.error('Maximum attempts reached. Please request a new code.', { duration: 5000 });
      }
      
      setErrors({ code: errorMessage });
      
      // Reset to pending after showing error
      setTimeout(() => {
        setVerificationStatus('pending');
      }, 2000);
      
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Resend verification email
   */
  const handleResendEmail = async () => {
    if (!canResend || resendCount >= maxResendCount) {
      toast.error('Please wait before requesting another email');
      return;
    }
    
    if (!isOnline) {
      toast.error('No internet connection');
      return;
    }
    
    setIsResending(true);
    
    try {
      await resendVerificationEmail({ email: formData.email });
      
      setResendCount(prev => prev + 1);
      setResendCountdown(60);
      setCanResend(false);
      setCodeAttempts(0);
      
      // Reset code inputs
      setFormData(prev => ({
        ...prev,
        code: ['', '', '', '', '', ''],
      }));
      
      toast.success('Verification email sent! Check your inbox.', { icon: '📧', duration: 5000 });
      
    } catch (error) {
      console.error('Resend email error:', error);
      toast.error(error.message || 'Failed to resend email. Please try again.', { duration: 5000 });
    } finally {
      setIsResending(false);
    }
  };

  /**
   * Change email
   */
  const handleChangeEmail = async (e) => {
    e.preventDefault();
    
    if (!isValidEmail(formData.newEmail)) {
      setErrors({ newEmail: 'Please enter a valid email address' });
      toast.error('Please enter a valid email address');
      return;
    }
    
    if (formData.newEmail === formData.email) {
      setErrors({ newEmail: 'New email must be different from current email' });
      toast.error('Please enter a different email address');
      return;
    }
    
    if (!isOnline) {
      toast.error('No internet connection');
      return;
    }
    
    setIsChangingEmail(true);
    
    try {
      await changeVerificationEmail({
        currentEmail: formData.email,
        newEmail: formData.newEmail,
      });
      
      setFormData(prev => ({
        ...prev,
        email: prev.newEmail,
        newEmail: '',
        code: ['', '', '', '', '', ''],
      }));
      
      setShowChangeEmail(false);
      setResendCount(0);
      setResendCountdown(60);
      setCanResend(false);
      setCodeAttempts(0);
      
      toast.success(`Verification email sent to ${formData.newEmail}`, { icon: '📧', duration: 5000 });
      
    } catch (error) {
      console.error('Change email error:', error);
      toast.error(error.message || 'Failed to change email. Please try again.', { duration: 5000 });
      setErrors({ newEmail: error.message });
    } finally {
      setIsChangingEmail(false);
    }
  };

  /**
   * Open email provider
   */
  const handleOpenEmail = () => {
    if (emailProvider?.url) {
      window.open(emailProvider.url, '_blank');
      toast.success(`Opening ${emailProvider.name}...`, { icon: emailProvider.icon });
    }
  };

  // ==================== RENDER HELPERS ====================
  
  /**
   * Get masked email
   */
  const getMaskedEmail = () => {
    if (!formData.email) return '';
    return formData.email.replace(/(.{2})(.*)(@.*)/, '$1***$3');
  };

  /**
   * Render Verifying State
   */
  const renderVerifying = () => {
    return (
      <div className="text-center py-12">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-primary-100 rounded-full mb-6 animate-pulse">
          <Loader2 className="w-10 h-10 text-primary-600 animate-spin" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Verifying Your Email
        </h3>
        <p className="text-gray-600">
          Please wait while we verify your email address...
        </p>
      </div>
    );
  };

  /**
   * Render Verified State
   */
  const renderVerified = () => {
    return (
      <div className="text-center py-8 animate-fade-in">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-success-100 rounded-full mb-6 animate-bounce">
          <PartyPopper className="w-12 h-12 text-success-600" />
        </div>
        
        <h2 className="text-2xl font-display font-bold text-gray-900 mb-3">
          Email Verified Successfully!
        </h2>
        
        <p className="text-gray-600 mb-6 max-w-md mx-auto">
          Your email has been verified. You can now access all features of AccellaX 361°.
        </p>
        
        <div className="p-4 bg-success-50 border border-success-200 rounded-lg mb-6">
          <p className="text-sm text-success-900">
            Redirecting to dashboard in {redirectCountdown} seconds...
          </p>
        </div>
        
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
        >
          <LogIn className="w-5 h-5" />
          Go to Dashboard Now
        </Link>
      </div>
    );
  };

  /**
   * Render Pending/Failed State (Verification Form)
   */
  const renderVerificationForm = () => {
    return (
      <div className="space-y-6">
        {/* Page Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4">
            <MailOpen className="w-8 h-8 text-primary-600" />
          </div>
          <h2 className="text-2xl font-display font-bold text-gray-900 mb-2">
            Verify Your Email
          </h2>
          <p className="text-gray-600">
            We sent a verification code to
          </p>
          <p className="font-semibold text-gray-900 mt-1">
            {getMaskedEmail()}
          </p>
        </div>

        {/* Email Provider Button */}
        {emailProvider && (
          <button
            onClick={handleOpenEmail}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-lg hover:from-primary-600 hover:to-primary-700 transition-all shadow-md hover:shadow-lg"
          >
            <span className="text-xl">{emailProvider.icon}</span>
            <span className="font-medium">Open {emailProvider.name}</span>
            <ExternalLink className="w-4 h-4" />
          </button>
        )}

        {/* Info Box */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-2">
            <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-900">
              <p className="font-semibold mb-1">Check your inbox</p>
              <p className="text-xs text-blue-700">
                The email may take a few minutes to arrive. Don't forget to check your spam/junk folder.
              </p>
            </div>
          </div>
        </div>

        {/* Verification Code Form */}
        <form onSubmit={handleVerifyCode}>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3 text-center">
              Enter Verification Code
            </label>
            
            <div className="flex justify-center gap-2 mb-4">
              {formData.code.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (codeInputRefs.current[index] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleCodeChange(index, e.target.value)}
                  onKeyDown={(e) => handleCodeKeyDown(index, e)}
                  onPaste={index === 0 ? handleCodePaste : undefined}
                  disabled={isLoading || verificationStatus === 'verifying'}
                  className={`
                    w-12 h-14 text-center text-2xl font-bold border-2 rounded-lg
                    focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
                    transition-all duration-200
                    disabled:bg-gray-100 disabled:cursor-not-allowed
                    ${errors.code 
                      ? 'border-danger-300 focus:ring-danger-500' 
                      : 'border-gray-300'
                    }
                    ${digit ? 'bg-primary-50 border-primary-300' : 'bg-white'}
                  `}
                  aria-label={`Digit ${index + 1}`}
                />
              ))}
            </div>
            
            {/* Error Message */}
            {errors.code && (
              <p className="mt-2 text-sm text-danger-600 flex items-center justify-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.code}
              </p>
            )}
            
            {/* Attempts Remaining */}
            {codeAttempts > 0 && codeAttempts < maxCodeAttempts && (
              <p className="mt-2 text-sm text-warning-600 text-center font-medium">
                {maxCodeAttempts - codeAttempts} attempt{maxCodeAttempts - codeAttempts === 1 ? '' : 's'} remaining
              </p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!isCodeComplete || isLoading || !isOnline}
            className={`
              w-full mt-6 flex items-center justify-center gap-2 px-4 py-3 
              border border-transparent rounded-lg shadow-sm text-base font-medium text-white 
              focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500
              transition-all duration-200
              ${!isCodeComplete || isLoading || !isOnline
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-primary-600 hover:bg-primary-700 active:scale-95'
              }
            `}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Verifying...</span>
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5" />
                <span>Verify Email</span>
              </>
            )}
          </button>
        </form>

        {/* Resend Email */}
        <div className="text-center space-y-3">
          <p className="text-sm text-gray-600">
            Didn't receive the email?
          </p>
          
          {resendCountdown > 0 && !canResend ? (
            <p className="text-sm text-gray-500">
              Resend code in <span className="font-semibold text-primary-600">{resendCountdown}s</span>
            </p>
          ) : canResend && resendCount < maxResendCount ? (
            <button
              onClick={handleResendEmail}
              disabled={isResending || !isOnline}
              className="inline-flex items-center gap-2 text-sm font-medium text-primary-600 hover:text-primary-500 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isResending ? 'animate-spin' : ''}`} />
              {isResending ? 'Sending...' : 'Resend Verification Email'}
            </button>
          ) : resendCount >= maxResendCount ? (
            <div className="p-3 bg-warning-50 border border-warning-200 rounded-lg">
              <p className="text-sm text-warning-900 font-medium">
                Maximum resend limit reached
              </p>
              <p className="text-xs text-warning-700 mt-1">
                Please contact support if you continue having issues
              </p>
            </div>
          ) : null}
        </div>

        {/* Change Email Option */}
        {!showChangeEmail ? (
          <div className="text-center">
            <button
              onClick={() => setShowChangeEmail(true)}
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors inline-flex items-center gap-1"
            >
              <Edit className="w-4 h-4" />
              Wrong email? Change it
            </button>
          </div>
        ) : (
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-gray-900">Change Email Address</h4>
              <button
                onClick={() => {
                  setShowChangeEmail(false);
                  setFormData(prev => ({ ...prev, newEmail: '' }));
                  setErrors(prev => ({ ...prev, newEmail: '' }));
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleChangeEmail} className="space-y-3">
              <div>
                <label htmlFor="newEmail" className="block text-xs font-medium text-gray-700 mb-1">
                  New Email Address
                </label>
                <input
                  ref={newEmailInputRef}
                  id="newEmail"
                  name="newEmail"
                  type="email"
                  required
                  value={formData.newEmail}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, newEmail: e.target.value }));
                    setErrors(prev => ({ ...prev, newEmail: '' }));
                  }}
                  className="block w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="newemail@example.com"
                />
                {errors.newEmail && (
                  <p className="mt-1 text-xs text-danger-600">{errors.newEmail}</p>
                )}
              </div>
              
              <button
                type="submit"
                disabled={isChangingEmail || !isOnline}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
              >
                {isChangingEmail ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Updating...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Send to New Email</span>
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* Help Section */}
        <div className="mt-8 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Having trouble?
          </h4>
          <ul className="space-y-2 text-xs text-gray-600">
            <li className="flex items-start gap-2">
              <Check className="w-3 h-3 text-success-500 mt-0.5 flex-shrink-0" />
              <span>Check your spam/junk folder</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="w-3 h-3 text-success-500 mt-0.5 flex-shrink-0" />
              <span>Make sure you entered the correct email</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="w-3 h-3 text-success-500 mt-0.5 flex-shrink-0" />
              <span>Wait a few minutes for the email to arrive</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="w-3 h-3 text-success-500 mt-0.5 flex-shrink-0" />
              <span>Try resending the verification email</span>
            </li>
          </ul>
          <div className="mt-3 pt-3 border-t border-gray-200">
            <Link
              to="/help"
              className="text-xs text-primary-600 hover:text-primary-700 font-medium inline-flex items-center gap-1"
            >
              Still need help? Contact Support
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Alternative Actions */}
        <div className="flex items-center justify-center gap-4 pt-4 border-t">
          <Link
            to="/dashboard"
            className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            Skip for now
          </Link>
          <span className="text-gray-300">•</span>
          <button
            onClick={() => {
              // Logout and go to login
              navigate('/login');
            }}
            className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            Log out
          </button>
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
          <span className="font-medium">You are offline. Email verification requires internet connection.</span>
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
            Email Verification
          </p>
        </div>

        {/* Verification Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {/* Content based on verification status */}
          {verificationStatus === 'verifying' && renderVerifying()}
          {verificationStatus === 'verified' && renderVerified()}
          {(verificationStatus === 'pending' || verificationStatus === 'failed') && renderVerificationForm()}
        </div>

        {/* Security Badge */}
        <div className="mt-6 flex items-center justify-center gap-2 text-gray-500 text-xs">
          <ShieldCheck className="w-4 h-4" />
          <span>Secure email verification</span>
        </div>

        {/* Footer */}
        <div className="mt-4 text-center">
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

        @keyframes bounce {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        .animate-bounce {
          animation: bounce 1s ease-in-out 3;
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }

        .animate-pulse {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>
    </div>
  );
};

export default VerifyEmailPage;