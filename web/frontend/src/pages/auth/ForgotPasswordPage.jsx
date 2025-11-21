/**
 * File: web/frontend/src/pages/auth/ForgotPasswordPage.jsx
 * AccellaX 361° - Comprehensive Password Reset Page
 * 
 * Description:
 * This page handles the password reset flow for users who forgot their password.
 * It provides a secure, user-friendly experience with email/phone verification,
 * OTP validation, and password reset functionality.
 * 
 * Features:
 * - Multi-step password reset wizard (3 steps)
 * - Email OR Phone number verification
 * - OTP (One-Time Password) verification
 * - 6-digit code input with auto-focus
 * - Resend OTP with countdown timer
 * - Password strength indicator
 * - Real-time validation with visual feedback
 * - Rate limiting protection
 * - Security measures (lockout after failed attempts)
 * - Responsive design (mobile, tablet, desktop)
 * - Accessibility features (ARIA, keyboard navigation)
 * - Progress indicator
 * - Success/error messages with animations
 * - Back to login option at any step
 * - Network status detection
 * - Loading states
 * 
 * Password Reset Flow:
 * Step 1: Enter Email/Phone → System sends OTP
 * Step 2: Enter OTP (6-digit code) → Verify OTP
 * Step 3: Create New Password → Reset complete
 * 
 * Security Features:
 * - Rate limiting: Max 3 reset requests per hour
 * - OTP expires in 10 minutes
 * - Max 5 OTP verification attempts
 * - Account lockout after failed attempts
 * - Password complexity requirements
 * - No password reuse check
 * 
 * Dependencies:
 * - React 18+
 * - React Router v6
 * - AuthContext (password reset functions)
 * - Firebase Auth
 * - Lucide React (icons)
 * - React Hot Toast (notifications)
 * 
 * Routes:
 * - /forgot-password (this page)
 * - /login (redirect after success)
 * - /reset-password/:token (alternative reset method)
 * 
 * API Endpoints:
 * - POST /api/auth/forgot-password (send OTP)
 * - POST /api/auth/verify-otp (verify OTP)
 * - POST /api/auth/reset-password (reset password)
 * 
 * Usage:
 * import ForgotPasswordPage from '@/pages/auth/ForgotPasswordPage';
 * <Route path="/forgot-password" element={<ForgotPasswordPage />} />
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle,
  Loader2,
  Shield,
  ArrowLeft,
  ArrowRight,
  Check,
  X,
  Clock,
  RefreshCw,
  Send,
  Key,
  WifiOff,
  Info,
  ShieldCheck,
  UserCheck,
  Smartphone
} from 'lucide-react';
import toast from 'react-hot-toast';

/**
 * ForgotPasswordPage Component
 * Handles complete password reset flow
 */
const ForgotPasswordPage = () => {
  // ==================== HOOKS ====================
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { 
    sendPasswordResetOTP, 
    verifyPasswordResetOTP, 
    resetPassword,
    user,
    loading: authLoading 
  } = useAuth();
  
  // Get email/phone from URL (if provided)
  const urlIdentifier = searchParams.get('identifier');
  
  // Refs
  const identifierInputRef = useRef(null);
  const otpInputRefs = useRef([]);
  const passwordInputRef = useRef(null);
  
  // ==================== STATE ====================
  
  // Reset steps
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;
  
  // Form data
  const [formData, setFormData] = useState({
    identifier: urlIdentifier || '', // Email or phone
    identifierType: '', // 'email' or 'phone'
    otp: ['', '', '', '', '', ''], // 6-digit OTP
    newPassword: '',
    confirmPassword: '',
  });
  
  // UI state
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSendingOTP, setIsSendingOTP] = useState(false);
  const [isVerifyingOTP, setIsVerifyingOTP] = useState(false);
  
  // Validation state
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  
  // Password strength
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [passwordFeedback, setPasswordFeedback] = useState('');
  
  // OTP state
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpToken, setOtpToken] = useState(null); // Token received after OTP verification
  const [otpExpiresAt, setOtpExpiresAt] = useState(null);
  const [otpResendCount, setOtpResendCount] = useState(0);
  const [canResendOTP, setCanResendOTP] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);
  
  // Security state
  const [otpAttempts, setOtpAttempts] = useState(0);
  const [maxOtpAttempts] = useState(5);
  const [resetAttempts, setResetAttempts] = useState(0);
  const [maxResetAttempts] = useState(3);
  const [isLocked, setIsLocked] = useState(false);
  const [lockoutTime, setLockoutTime] = useState(null);
  
  // Network state
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  // Timer for OTP expiry
  const [otpTimeRemaining, setOtpTimeRemaining] = useState(0);

  // ==================== EFFECTS ====================
  
  /**
   * Redirect if already authenticated
   */
  useEffect(() => {
    if (user && !authLoading) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, authLoading, navigate]);

  /**
   * Load reset attempts from localStorage
   */
  useEffect(() => {
    const attempts = parseInt(localStorage.getItem('accellax_reset_attempts') || '0', 10);
    const lockout = localStorage.getItem('accellax_reset_lockout_time');
    
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
          localStorage.removeItem('accellax_reset_lockout_time');
          localStorage.setItem('accellax_reset_attempts', '0');
          setResetAttempts(0);
        }, timeDiff);
      } else {
        // Lockout expired
        localStorage.removeItem('accellax_reset_lockout_time');
        localStorage.setItem('accellax_reset_attempts', '0');
      }
    }
    
    setResetAttempts(attempts);
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
   * Auto-focus identifier input on mount
   */
  useEffect(() => {
    if (currentStep === 1 && identifierInputRef.current) {
      identifierInputRef.current.focus();
    }
  }, [currentStep]);

  /**
   * Auto-focus first OTP input on Step 2
   */
  useEffect(() => {
    if (currentStep === 2 && otpInputRefs.current[0]) {
      otpInputRefs.current[0].focus();
    }
  }, [currentStep]);

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
   * OTP Resend countdown timer
   */
  useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(() => {
        setResendCountdown(prev => prev - 1);
      }, 1000);
      
      return () => clearTimeout(timer);
    } else if (resendCountdown === 0 && otpSent) {
      setCanResendOTP(true);
    }
  }, [resendCountdown, otpSent]);

  /**
   * OTP expiry countdown
   */
  useEffect(() => {
    if (otpExpiresAt) {
      const interval = setInterval(() => {
        const now = new Date().getTime();
        const expiry = new Date(otpExpiresAt).getTime();
        const diff = expiry - now;
        
        if (diff > 0) {
          setOtpTimeRemaining(Math.floor(diff / 1000)); // seconds
        } else {
          setOtpTimeRemaining(0);
          setOtpSent(false);
          toast.error('OTP expired. Please request a new one.', { duration: 5000 });
        }
      }, 1000);
      
      return () => clearInterval(interval);
    }
  }, [otpExpiresAt]);

  // ==================== VALIDATION ====================
  
  /**
   * Validate single field
   */
  const validateField = (name, value) => {
    let error = '';
    
    switch (name) {
      case 'identifier':
        if (!value) {
          error = 'Email or phone number is required';
        } else if (!isValidEmail(value) && !isValidPhone(value)) {
          error = 'Please enter a valid email or phone number';
        }
        break;
        
      case 'otp':
        // OTP is validated as array
        if (!Array.isArray(value)) break;
        
        const otpString = value.join('');
        if (otpString.length !== 6) {
          error = 'Please enter complete 6-digit code';
        } else if (!/^\d{6}$/.test(otpString)) {
          error = 'OTP must contain only numbers';
        }
        break;
        
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
   * Validate current step
   */
  const validateStep = (step) => {
    const newErrors = {};
    
    if (step === 1) {
      // Step 1: Identifier
      const error = validateField('identifier', formData.identifier);
      if (error) newErrors.identifier = error;
    } else if (step === 2) {
      // Step 2: OTP
      const error = validateField('otp', formData.otp);
      if (error) newErrors.otp = error;
    } else if (step === 3) {
      // Step 3: New Password
      ['newPassword', 'confirmPassword'].forEach(field => {
        const error = validateField(field, formData[field]);
        if (error) newErrors[field] = error;
      });
    }
    
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
    const phoneRegex = /^(\+?254|0)?[17]\d{8}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
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
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: value,
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
   * Handle OTP input change
   * Auto-focuses next input after entering digit
   */
  const handleOtpChange = (index, value) => {
    // Only allow single digit
    if (value.length > 1) {
      value = value[0];
    }
    
    // Only allow numbers
    if (!/^\d*$/.test(value)) {
      return;
    }
    
    // Update OTP array
    const newOtp = [...formData.otp];
    newOtp[index] = value;
    
    setFormData(prev => ({
      ...prev,
      otp: newOtp,
    }));
    
    // Auto-focus next input
    if (value && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
    
    // Clear error
    if (errors.otp) {
      setErrors(prev => ({
        ...prev,
        otp: '',
      }));
    }
  };

  /**
   * Handle OTP input keydown (for backspace)
   */
  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !formData.otp[index] && index > 0) {
      // Move to previous input on backspace
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  /**
   * Handle OTP paste
   * Allows pasting 6-digit code
   */
  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    
    // Check if pasted data is 6 digits
    if (/^\d{6}$/.test(pastedData)) {
      const otpArray = pastedData.split('');
      setFormData(prev => ({
        ...prev,
        otp: otpArray,
      }));
      
      // Focus last input
      otpInputRefs.current[5]?.focus();
      
      toast.success('OTP pasted successfully', { icon: '📋' });
    } else {
      toast.error('Please paste a valid 6-digit code');
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
   * Handle failed reset attempt (rate limiting)
   */
  const handleFailedResetAttempt = () => {
    const newAttempts = resetAttempts + 1;
    setResetAttempts(newAttempts);
    localStorage.setItem('accellax_reset_attempts', newAttempts.toString());
    
    // Lock account after max attempts
    if (newAttempts >= maxResetAttempts) {
      const lockoutDuration = 60 * 60 * 1000; // 1 hour
      const lockoutTime = new Date(Date.now() + lockoutDuration);
      
      setIsLocked(true);
      setLockoutTime(lockoutTime);
      localStorage.setItem('accellax_reset_lockout_time', lockoutTime.toISOString());
      
      toast.error(
        'Too many reset attempts. Please try again in 1 hour.',
        { duration: 8000 }
      );
      
      // Auto-unlock
      setTimeout(() => {
        setIsLocked(false);
        setLockoutTime(null);
        localStorage.removeItem('accellax_reset_lockout_time');
        localStorage.setItem('accellax_reset_attempts', '0');
        setResetAttempts(0);
      }, lockoutDuration);
    }
  };

  /**
   * Reset attempts on success
   */
  const resetAttemptCounters = () => {
    setResetAttempts(0);
    setOtpAttempts(0);
    localStorage.setItem('accellax_reset_attempts', '0');
    localStorage.removeItem('accellax_reset_lockout_time');
  };

  /**
   * Step 1: Send OTP
   */
  const handleSendOTP = async (e) => {
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
    
    // Validate
    if (!validateStep(1)) {
      toast.error('Please fix the errors in the form');
      return;
    }
    
    // Check rate limit for resends
    if (otpResendCount >= 3) {
      toast.error('Maximum resend limit reached. Please try again later.', { duration: 5000 });
      return;
    }
    
    setIsSendingOTP(true);
    
    try {
      // Determine identifier type
      const identifierType = isValidEmail(formData.identifier) ? 'email' : 'phone';
      const normalizedIdentifier = identifierType === 'phone' 
        ? normalizePhone(formData.identifier) 
        : formData.identifier;
      
      // Call API to send OTP
      const result = await sendPasswordResetOTP({
        identifier: normalizedIdentifier,
        identifierType,
      });
      
      // Set OTP sent state
      setOtpSent(true);
      setFormData(prev => ({ ...prev, identifierType }));
      setOtpExpiresAt(result.expiresAt || new Date(Date.now() + 10 * 60 * 1000)); // 10 minutes
      setResendCountdown(60); // 60 seconds before resend
      setCanResendOTP(false);
      setOtpResendCount(prev => prev + 1);
      
      // Show success message
      const maskedIdentifier = identifierType === 'email'
        ? formData.identifier.replace(/(.{2})(.*)(@.*)/, '$1***$3')
        : formData.identifier.replace(/(\d{3})(\d{4})(\d{4})/, '$1****$3');
      
      toast.success(
        `Verification code sent to ${maskedIdentifier}`,
        { icon: '📨', duration: 5000 }
      );
      
      // Move to Step 2
      setCurrentStep(2);
      
    } catch (error) {
      console.error('Send OTP error:', error);
      
      // Handle failed attempt
      handleFailedResetAttempt();
      
      // Show error message
      const errorMessage = error.message || 'Failed to send verification code. Please try again.';
      toast.error(errorMessage, { duration: 5000 });
      
      // Set form errors
      if (error.field) {
        setErrors(prev => ({
          ...prev,
          [error.field]: error.message,
        }));
      }
      
    } finally {
      setIsSendingOTP(false);
    }
  };

  /**
   * Resend OTP
   */
  const handleResendOTP = async () => {
    if (!canResendOTP || otpResendCount >= 3) {
      toast.error('Please wait before requesting another code');
      return;
    }
    
    // Reset OTP inputs
    setFormData(prev => ({
      ...prev,
      otp: ['', '', '', '', '', ''],
    }));
    setErrors(prev => ({ ...prev, otp: '' }));
    setOtpAttempts(0);
    
    // Resend
    await handleSendOTP({ preventDefault: () => {} });
  };

  /**
   * Step 2: Verify OTP
   */
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    
    // Check internet connection
    if (!isOnline) {
      toast.error('No internet connection. Please check your network.');
      return;
    }
    
    // Validate
    if (!validateStep(2)) {
      toast.error('Please enter complete verification code');
      return;
    }
    
    // Check OTP attempts
    if (otpAttempts >= maxOtpAttempts) {
      toast.error('Too many failed attempts. Please request a new code.', { duration: 5000 });
      // Reset to Step 1
      setCurrentStep(1);
      setOtpSent(false);
      setOtpAttempts(0);
      return;
    }
    
    setIsVerifyingOTP(true);
    
    try {
      const otpString = formData.otp.join('');
      
      // Call API to verify OTP
      const result = await verifyPasswordResetOTP({
        identifier: formData.identifierType === 'phone' 
          ? normalizePhone(formData.identifier) 
          : formData.identifier,
        otp: otpString,
      });
      
      // Store token for password reset
      setOtpToken(result.token);
      setOtpVerified(true);
      
      // Show success message
      toast.success('Code verified successfully!', { icon: '✅' });
      
      // Move to Step 3
      setCurrentStep(3);
      
    } catch (error) {
      console.error('Verify OTP error:', error);
      
      // Increment OTP attempts
      const newAttempts = otpAttempts + 1;
      setOtpAttempts(newAttempts);
      
      // Show error message
      const errorMessage = error.message || 'Invalid verification code. Please try again.';
      toast.error(errorMessage, { duration: 5000 });
      
      // Show remaining attempts
      if (newAttempts < maxOtpAttempts) {
        const remainingAttempts = maxOtpAttempts - newAttempts;
        toast.error(
          `${remainingAttempts} attempt${remainingAttempts === 1 ? '' : 's'} remaining`,
          { duration: 3000 }
        );
      } else {
        toast.error('Maximum attempts reached. Please request a new code.', { duration: 5000 });
        setTimeout(() => {
          setCurrentStep(1);
          setOtpSent(false);
          setOtpAttempts(0);
        }, 2000);
      }
      
      // Set form errors
      setErrors(prev => ({
        ...prev,
        otp: errorMessage,
      }));
      
    } finally {
      setIsVerifyingOTP(false);
    }
  };

  /**
   * Step 3: Reset Password
   */
  const handleResetPassword = async (e) => {
    e.preventDefault();
    
    // Check internet connection
    if (!isOnline) {
      toast.error('No internet connection. Please check your network.');
      return;
    }
    
    // Validate
    if (!validateStep(3)) {
      toast.error('Please fix the errors in the form');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Call API to reset password
      await resetPassword({
        token: otpToken,
        newPassword: formData.newPassword,
      });
      
      // Reset attempt counters
      resetAttemptCounters();
      
      // Show success message
      toast.success(
        'Password reset successful! You can now log in with your new password.',
        { icon: '🎉', duration: 5000 }
      );
      
      // Navigate to login
      setTimeout(() => {
        navigate('/login', { 
          state: { 
            message: 'Password reset successful. Please log in with your new password.' 
          } 
        });
      }, 2000);
      
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
      
      // If token expired, go back to Step 1
      if (error.code === 'TOKEN_EXPIRED') {
        toast.error('Session expired. Please start over.', { duration: 5000 });
        setTimeout(() => {
          setCurrentStep(1);
          setOtpSent(false);
          setOtpVerified(false);
          setOtpToken(null);
        }, 2000);
      }
      
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Go back to previous step
   */
  const handlePreviousStep = () => {
    if (currentStep === 2) {
      // Reset OTP state
      setFormData(prev => ({
        ...prev,
        otp: ['', '', '', '', '', ''],
      }));
      setErrors(prev => ({ ...prev, otp: '' }));
      setOtpAttempts(0);
    } else if (currentStep === 3) {
      // Reset password state
      setFormData(prev => ({
        ...prev,
        newPassword: '',
        confirmPassword: '',
      }));
      setErrors(prev => ({ ...prev, newPassword: '', confirmPassword: '' }));
    }
    
    setCurrentStep(prev => Math.max(prev - 1, 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ==================== COMPUTED VALUES ====================

  /**
   * Get progress percentage
   */
  const progressPercentage = useMemo(() => {
    return ((currentStep - 1) / (totalSteps - 1)) * 100;
  }, [currentStep]);

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

  /**
   * Format OTP time remaining
   */
  const formatOtpTimeRemaining = () => {
    const minutes = Math.floor(otpTimeRemaining / 60);
    const seconds = otpTimeRemaining % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  /**
   * Check if OTP is complete
   */
  const isOtpComplete = useMemo(() => {
    return formData.otp.every(digit => digit !== '');
  }, [formData.otp]);

  // ==================== RENDER HELPERS ====================
  
  /**
   * Render step indicator
   */
  const renderStepIndicator = () => {
    return (
      <div className="mb-8">
        {/* Progress bar */}
        <div className="relative">
          <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-200">
            <div
              style={{ width: `${progressPercentage}%` }}
              className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-primary-500 transition-all duration-500"
            />
          </div>
          
          {/* Step circles */}
          <div className="flex justify-between">
            {[1, 2, 3].map((step) => (
              <div key={step} className="text-center">
                <div
                  className={`
                    w-10 h-10 mx-auto rounded-full text-lg flex items-center justify-center
                    font-semibold transition-all duration-300
                    ${step < currentStep
                      ? 'bg-success-500 text-white'
                      : step === currentStep
                      ? 'bg-primary-500 text-white ring-4 ring-primary-100'
                      : 'bg-gray-200 text-gray-500'
                    }
                  `}
                >
                  {step < currentStep ? (
                    <Check className="w-6 h-6" />
                  ) : (
                    step
                  )}
                </div>
                <div className="text-xs mt-2 font-medium text-gray-600">
                  {step === 1 && 'Verify'}
                  {step === 2 && 'Code'}
                  {step === 3 && 'Reset'}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  /**
   * Render Step 1: Enter Email/Phone
   */
  const renderStep1 = () => {
    return (
      <div className="space-y-6">
        {/* Page Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4">
            <Key className="w-8 h-8 text-primary-600" />
          </div>
          <h2 className="text-2xl font-display font-bold text-gray-900 mb-2">
            Forgot Your Password?
          </h2>
          <p className="text-gray-600">
            No worries! Enter your email or phone number and we'll send you a verification code.
          </p>
        </div>

        {/* Email/Phone Input */}
        <form onSubmit={handleSendOTP}>
          <div>
            <label htmlFor="identifier" className="block text-sm font-medium text-gray-700 mb-2">
              Email or Phone Number *
            </label>
            
            <div className="relative">
              <input
                ref={identifierInputRef}
                id="identifier"
                name="identifier"
                type="text"
                autoComplete="username"
                required
                disabled={isLocked || isSendingOTP}
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
                placeholder="email@example.com or 0712345678"
              />
              
              {/* Icon indicator */}
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                {formData.identifier && isValidEmail(formData.identifier) ? (
                  <Mail className="h-5 w-5 text-gray-400" />
                ) : formData.identifier && isValidPhone(formData.identifier) ? (
                  <Phone className="h-5 w-5 text-gray-400" />
                ) : null}
              </div>
            </div>
            
            {/* Error Message */}
            {errors.identifier && touched.identifier && (
              <p className="mt-2 text-sm text-danger-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.identifier}
              </p>
            )}
            
            {/* Helper Text */}
            {!errors.identifier && (
              <p className="mt-2 text-xs text-gray-500">
                Enter the email or phone number associated with your account
              </p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLocked || isSendingOTP || !isOnline}
            className={`
              w-full mt-6 flex items-center justify-center gap-2 px-4 py-3 
              border border-transparent rounded-lg shadow-sm text-base font-medium text-white 
              focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500
              transition-all duration-200
              ${isLocked || isSendingOTP || !isOnline
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-primary-600 hover:bg-primary-700 active:scale-95'
              }
            `}
          >
            {isSendingOTP ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Sending Code...</span>
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                <span>Send Verification Code</span>
              </>
            )}
          </button>
        </form>

        {/* Back to Login */}
        <div className="mt-6 text-center">
          <Link
            to="/login"
            className="text-sm font-medium text-primary-600 hover:text-primary-500 transition-colors inline-flex items-center gap-1"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Login
          </Link>
        </div>
      </div>
    );
  };

  /**
   * Render Step 2: Enter OTP
   */
  const renderStep2 = () => {
    return (
      <div className="space-y-6">
        {/* Page Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-success-100 rounded-full mb-4">
            <ShieldCheck className="w-8 h-8 text-success-600" />
          </div>
          <h2 className="text-2xl font-display font-bold text-gray-900 mb-2">
            Enter Verification Code
          </h2>
          <p className="text-gray-600">
            We sent a 6-digit code to{' '}
            <span className="font-semibold text-gray-900">
              {formData.identifierType === 'email'
                ? formData.identifier.replace(/(.{2})(.*)(@.*)/, '$1***$3')
                : formData.identifier.replace(/(\d{3})(\d{4})(\d{4})/, '$1****$3')
              }
            </span>
          </p>
        </div>

        {/* OTP Inputs */}
        <form onSubmit={handleVerifyOTP}>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3 text-center">
              Verification Code *
            </label>
            
            <div className="flex justify-center gap-2 mb-4">
              {formData.otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (otpInputRefs.current[index] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(index, e)}
                  onPaste={index === 0 ? handleOtpPaste : undefined}
                  className={`
                    w-12 h-14 text-center text-2xl font-bold border-2 rounded-lg
                    focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
                    transition-all duration-200
                    ${errors.otp 
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
            {errors.otp && (
              <p className="mt-2 text-sm text-danger-600 flex items-center justify-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.otp}
              </p>
            )}
          </div>

          {/* OTP Info */}
          <div className="space-y-3">
            {/* Time Remaining */}
            {otpTimeRemaining > 0 && (
              <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                <Clock className="w-4 h-4" />
                <span>
                  Code expires in <span className="font-semibold text-primary-600">{formatOtpTimeRemaining()}</span>
                </span>
              </div>
            )}

            {/* Attempts Remaining */}
            {otpAttempts > 0 && otpAttempts < maxOtpAttempts && (
              <div className="text-center">
                <p className="text-sm text-warning-600 font-medium">
                  {maxOtpAttempts - otpAttempts} attempt{maxOtpAttempts - otpAttempts === 1 ? '' : 's'} remaining
                </p>
              </div>
            )}

            {/* Resend OTP */}
            <div className="text-center">
              {resendCountdown > 0 ? (
                <p className="text-sm text-gray-500">
                  Resend code in <span className="font-semibold">{resendCountdown}s</span>
                </p>
              ) : canResendOTP && otpResendCount < 3 ? (
                <button
                  type="button"
                  onClick={handleResendOTP}
                  disabled={isSendingOTP}
                  className="text-sm font-medium text-primary-600 hover:text-primary-500 transition-colors inline-flex items-center gap-1 disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${isSendingOTP ? 'animate-spin' : ''}`} />
                  Resend Code
                </button>
              ) : otpResendCount >= 3 ? (
                <p className="text-sm text-danger-600 font-medium">
                  Maximum resend limit reached
                </p>
              ) : null}
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!isOtpComplete || isVerifyingOTP || !isOnline}
            className={`
              w-full mt-6 flex items-center justify-center gap-2 px-4 py-3 
              border border-transparent rounded-lg shadow-sm text-base font-medium text-white 
              focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500
              transition-all duration-200
              ${!isOtpComplete || isVerifyingOTP || !isOnline
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-primary-600 hover:bg-primary-700 active:scale-95'
              }
            `}
          >
            {isVerifyingOTP ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Verifying...</span>
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5" />
                <span>Verify Code</span>
              </>
            )}
          </button>
        </form>

        {/* Back Button */}
        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={handlePreviousStep}
            className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors inline-flex items-center gap-1"
          >
            <ArrowLeft className="w-4 h-4" />
            Change Email/Phone
          </button>
        </div>
      </div>
    );
  };

  /**
   * Render Step 3: Reset Password
   */
  const renderStep3 = () => {
    return (
      <div className="space-y-6">
        {/* Page Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-success-100 rounded-full mb-4">
            <Lock className="w-8 h-8 text-success-600" />
          </div>
          <h2 className="text-2xl font-display font-bold text-gray-900 mb-2">
            Create New Password
          </h2>
          <p className="text-gray-600">
            Choose a strong password to secure your account
          </p>
        </div>

        {/* Password Form */}
        <form onSubmit={handleResetPassword}>
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
              
              {/* Password Requirements */}
              <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                <p className="text-xs font-medium text-gray-700 mb-2">Password must contain:</p>
                <ul className="space-y-1 text-xs text-gray-600">
                  <li className="flex items-center gap-2">
                    {formData.newPassword.length >= 8 ? (
                      <CheckCircle className="w-3 h-3 text-success-500" />
                    ) : (
                      <X className="w-3 h-3 text-gray-400" />
                    )}
                    At least 8 characters
                  </li>
                  <li className="flex items-center gap-2">
                    {/[a-z]/.test(formData.newPassword) ? (
                      <CheckCircle className="w-3 h-3 text-success-500" />
                    ) : (
                      <X className="w-3 h-3 text-gray-400" />
                    )}
                    One lowercase letter
                  </li>
                  <li className="flex items-center gap-2">
                    {/[A-Z]/.test(formData.newPassword) ? (
                      <CheckCircle className="w-3 h-3 text-success-500" />
                    ) : (
                      <X className="w-3 h-3 text-gray-400" />
                    )}
                    One uppercase letter
                  </li>
                  <li className="flex items-center gap-2">
                    {/\d/.test(formData.newPassword) ? (
                      <CheckCircle className="w-3 h-3 text-success-500" />
                    ) : (
                      <X className="w-3 h-3 text-gray-400" />
                    )}
                    One number
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
        <div className="mt-6 p-4 bg-blue-50 border border-blue-100 rounded-lg">
          <div className="flex items-start gap-2">
            <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-700">
              <p className="font-semibold mb-1">Security Tips:</p>
              <ul className="space-y-1 text-xs">
                <li>• Use a unique password not used on other sites</li>
                <li>• Avoid using personal information (birthdate, name)</li>
                <li>• Consider using a password manager</li>
              </ul>
            </div>
          </div>
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

      {/* Lockout Warning */}
      {isLocked && (
        <div className="fixed top-0 left-0 right-0 bg-danger-600 text-white py-4 px-4 z-50 shadow-lg">
          <div className="max-w-4xl mx-auto flex items-center justify-center gap-3">
            <AlertCircle className="w-6 h-6 flex-shrink-0" />
            <div>
              <h3 className="font-semibold">Account Temporarily Locked</h3>
              <p className="text-sm">Too many reset attempts. Please try again in {getRemainingLockoutTime()}.</p>
            </div>
          </div>
        </div>
      )}

      {/* Main Container */}
      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center justify-center w-16 h-16 bg-primary-500 rounded-2xl shadow-lg mb-4">
            <Shield className="w-10 h-10 text-white" />
          </Link>
          <h1 className="text-2xl font-display font-bold text-gray-900">
            AccellaX 361°
          </h1>
        </div>

        {/* Reset Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {/* Step Indicator */}
          {renderStepIndicator()}

          {/* Step Content */}
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-sm text-gray-600">
          <p>
            Remember your password?{' '}
            <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500 transition-colors">
              Sign in
            </Link>
          </p>
        </div>

        {/* Help Link */}
        <div className="mt-4 text-center text-xs text-gray-500">
          <Link to="/help" className="hover:text-gray-700 transition-colors">
            Need help? Contact Support
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;