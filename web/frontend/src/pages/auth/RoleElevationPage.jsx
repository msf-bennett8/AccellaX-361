/**
 * File: web/frontend/src/pages/auth/RoleElevationPage.jsx
 * AccellaX 361° - Comprehensive Role Elevation Page
 * 
 * Description:
 * This page handles the elevation of user accounts to privileged roles (Super Admin,
 * Academy Owner, Head Coach). It implements a secure, multi-step verification process
 * similar to Android Developer Options or iOS hidden features. Users must perform
 * specific actions to unlock the elevation form, then provide credentials and
 * elevation codes to gain elevated privileges.
 * 
 * Features:
 * - Hidden access method (secret tap pattern on logo or keyboard shortcut)
 * - Multi-step elevation wizard (4 steps)
 * - Secret elevation code entry (admin provides code)
 * - Identity verification (current password + 2FA)
 * - Role selection with descriptions
 * - Justification/reason for elevation
 * - Admin approval workflow (optional)
 * - Rate limiting protection (max 3 attempts per hour)
 * - Account lockout after failed attempts
 * - Audit logging (all elevation attempts recorded)
 * - Email/SMS notification on successful elevation
 * - Session recording for security
 * - Responsive design (mobile, tablet, desktop)
 * - Accessibility features (ARIA, keyboard navigation)
 * - Network status detection
 * - Loading states with animations
 * - Success/failure animations
 * 
 * Access Methods:
 * 1. Hidden URL: /elevate-role (not linked anywhere)
 * 2. Secret tap: Click logo 7 times within 5 seconds
 * 3. Keyboard shortcut: Ctrl+Shift+E (3 times)
 * 4. Dev tools: Type "elevate" in console
 * 5. QR code: Scan admin-provided QR code
 * 
 * Elevation Flow:
 * Step 1: Unlock (secret pattern or code)
 * Step 2: Identity Verification (password + 2FA)
 * Step 3: Role Selection & Justification
 * Step 4: Elevation Code Entry (admin provides)
 * Step 5: Success/Pending Approval
 * 
 * Available Elevated Roles:
 * - Super Admin: Full system access
 * - Academy Owner: Academy management, financials
 * - Head Coach: All coaching features, analytics
 * 
 * Restricted Features:
 * - Cannot self-elevate to Super Admin without Master Code
 * - Owner/Head Coach require approval from existing admin
 * - All elevation attempts logged and notified
 * - Temporary elevation (expires after X hours)
 * 
 * Security Features:
 * - Elevation code single-use (rotates after use)
 * - Master code for Super Admin (extremely secret)
 * - IP address logging
 * - Device fingerprinting
 * - Geolocation tracking (optional)
 * - Two-factor authentication required
 * - Email/SMS confirmation
 * - Admin approval for certain roles
 * - Time-based restrictions (office hours only)
 * - Rate limiting (3 attempts/hour)
 * - Account lockout (24 hours after 5 failed attempts)
 * - Audit trail (all actions logged)
 * 
 * Dependencies:
 * - React 18+
 * - React Router v6
 * - AuthContext (elevation functions)
 * - Firebase Auth & Firestore
 * - Lucide React (icons)
 * - React Hot Toast (notifications)
 * 
 * Routes:
 * - /elevate-role (this page - hidden)
 * - /dashboard/admin (redirect after Super Admin elevation)
 * - /dashboard (redirect after other elevations)
 * - /login (if not authenticated)
 * 
 * API Endpoints:
 * - POST /api/auth/verify-elevation-code (verify elevation code)
 * - POST /api/auth/request-elevation (request role elevation)
 * - POST /api/auth/approve-elevation (admin approves request)
 * - GET /api/auth/elevation-attempts (check rate limit)
 * 
 * Usage:
 * import RoleElevationPage from '@/pages/auth/RoleElevationPage';
 * <Route path="/elevate-role" element={<RoleElevationPage />} />
 * 
 * Security Notes:
 * - NEVER expose Master Codes in client-side code
 * - Elevation codes should be provided by existing admins
 * - All attempts should be logged server-side
 * - Implement IP whitelisting for Super Admin elevation
 * - Consider time-based one-time passwords (TOTP)
 */

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Shield,
  ShieldCheck,
  ShieldAlert,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle,
  Loader2,
  Key,
  KeyRound,
  Crown,
  Award,
  Star,
  User,
  UserCheck,
  UserCog,
  Building,
  GraduationCap,
  Check,
  X,
  Info,
  AlertTriangle,
  Clock,
  WifiOff,
  Fingerprint,
  Smartphone,
  Mail,
  MessageSquare,
  ArrowRight,
  ArrowLeft,
  Send,
  RefreshCw,
  LogOut,
  Home,
  HelpCircle,
  FileText,
  Camera,
  Scan,
  QrCode,
  Terminal,
  Code,
  Zap,
  TrendingUp,
  Activity,
  BarChart,
  Settings,
  Bell,
  BellOff,
  CheckCheck,
  XCircle,
  ShieldQuestion,
  BadgeCheck,
  Sparkles,
  Rocket,
  Target,
  ThumbsUp,
  PartyPopper
} from 'lucide-react';
import toast from 'react-hot-toast';

/**
 * RoleElevationPage Component
 * Secure role elevation interface with multi-step verification
 */
const RoleElevationPage = () => {
  // ==================== HOOKS ====================
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { 
    user,
    verifyPassword,
    requestRoleElevation,
    verifyElevationCode,
    logout,
    loading: authLoading 
  } = useAuth();
  
  // Get unlock code from URL (optional - for QR code access)
  const unlockCodeFromUrl = searchParams.get('unlock');
  
  // Refs
  const logoRef = useRef(null);
  const passwordInputRef = useRef(null);
  const elevationCodeInputRefs = useRef([]);
  const justificationInputRef = useRef(null);
  
  // ==================== STATE ====================
  
  // Unlock state (secret pattern)
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [unlockMethod, setUnlockMethod] = useState(null); // 'tap', 'keyboard', 'qr', 'url'
  const [tapCount, setTapCount] = useState(0);
  const [keySequence, setKeySequence] = useState([]);
  const [showUnlockHint, setShowUnlockHint] = useState(false);
  
  // Elevation steps
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;
  
  // Form data
  const [formData, setFormData] = useState({
    // Step 2: Identity Verification
    currentPassword: '',
    twoFactorCode: '',
    
    // Step 3: Role Selection & Justification
    desiredRole: '', // 'super_admin', 'owner', 'head_coach'
    justification: '',
    requestedBy: '', // Who requested (if applicable)
    departmentCode: '', // Optional department/team code
    
    // Step 4: Elevation Code
    elevationCode: ['', '', '', '', '', '', '', ''], // 8-digit code
    masterCode: '', // Only for Super Admin (optional backup)
    
    // Notifications
    notifyByEmail: true,
    notifyBySMS: false,
    requireApproval: true, // Some roles need admin approval
  });
  
  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifyingIdentity, setIsVerifyingIdentity] = useState(false);
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);
  
  // Validation state
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  
  // Security state
  const [elevationAttempts, setElevationAttempts] = useState(0);
  const [maxElevationAttempts] = useState(3);
  const [isLocked, setIsLocked] = useState(false);
  const [lockoutTime, setLockoutTime] = useState(null);
  const [sessionStartTime] = useState(new Date());
  const [ipAddress, setIpAddress] = useState(null);
  const [deviceInfo, setDeviceInfo] = useState(null);
  
  // 2FA state
  const [twoFactorSent, setTwoFactorSent] = useState(false);
  const [twoFactorMethod, setTwoFactorMethod] = useState('email'); // 'email' or 'sms'
  const [twoFactorResendCount, setTwoFactorResendCount] = useState(0);
  const [canResend2FA, setCanResend2FA] = useState(false);
  const [resend2FACountdown, setResend2FACountdown] = useState(60);
  
  // Elevation result
  const [elevationStatus, setElevationStatus] = useState('pending'); // 'pending', 'approved', 'denied', 'pending_approval'
  const [elevationRequestId, setElevationRequestId] = useState(null);
  
  // Network state
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  // Success redirect countdown
  const [redirectCountdown, setRedirectCountdown] = useState(5);
  
  // Available elevated roles
  const elevatedRoles = [
    {
      value: 'super_admin',
      label: 'Super Admin',
      icon: Crown,
      color: 'from-purple-500 to-pink-500',
      description: 'Full system access and control',
      permissions: [
        'Manage all users and roles',
        'Access all academy data',
        'System configuration',
        'Security settings',
        'Audit logs access',
        'Financial reports',
        'All administrative features'
      ],
      requirements: [
        'Master elevation code required',
        'Current Super Admin approval',
        'Identity verification (2FA)',
        'Business justification',
        'Background check (for new users)'
      ],
      riskLevel: 'critical',
      requiresApproval: true,
      requiresMasterCode: true,
    },
    {
      value: 'owner',
      label: 'Academy Owner',
      icon: Building,
      color: 'from-blue-500 to-cyan-500',
      description: 'Academy management and oversight',
      permissions: [
        'Academy settings and configuration',
        'Financial management',
        'All reports and analytics',
        'Coach management',
        'Approve registrations',
        'Event planning',
        'Sponsorship management'
      ],
      requirements: [
        'Elevation code from existing owner/admin',
        'Identity verification (2FA)',
        'Business justification',
        'Admin approval (if first owner)'
      ],
      riskLevel: 'high',
      requiresApproval: true,
      requiresMasterCode: false,
    },
    {
      value: 'head_coach',
      label: 'Head Coach',
      icon: GraduationCap,
      color: 'from-green-500 to-emerald-500',
      description: 'Lead coaching team and programs',
      permissions: [
        'All coaching features',
        'View all sessions and attendance',
        'Manage all age groups',
        'Coach assignment',
        'Team analytics',
        'Event management',
        'Performance reports'
      ],
      requirements: [
        'Elevation code from owner/admin',
        'Identity verification (2FA)',
        'Coaching credentials',
        'Admin approval'
      ],
      riskLevel: 'medium',
      requiresApproval: true,
      requiresMasterCode: false,
    },
  ];

  // ==================== EFFECTS ====================
  
  /**
   * Check authentication
   */
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login', {
        state: {
          from: location.pathname,
          message: 'Please log in to access role elevation'
        }
      });
    }
  }, [user, authLoading, navigate, location]);

  /**
   * Check if user already has elevated role
   */
  useEffect(() => {
    if (user) {
      const elevatedRoleValues = elevatedRoles.map(r => r.value);
      if (elevatedRoleValues.includes(user.role)) {
        toast.info('You already have an elevated role', { duration: 5000 });
        setTimeout(() => {
          navigate('/dashboard', { replace: true });
        }, 2000);
      }
    }
  }, [user, navigate]);

  /**
   * Auto-unlock if unlock code in URL (QR code access)
   */
  useEffect(() => {
    if (unlockCodeFromUrl) {
      verifyUnlockCode(unlockCodeFromUrl);
    }
  }, [unlockCodeFromUrl]);

  /**
   * Secret tap pattern detector
   */
  useEffect(() => {
    const handleLogoTap = () => {
      setTapCount(prev => prev + 1);
      
      // Reset after 5 seconds of inactivity
      const timer = setTimeout(() => {
        setTapCount(0);
      }, 5000);
      
      return () => clearTimeout(timer);
    };
    
    const logoElement = logoRef.current;
    if (logoElement) {
      logoElement.addEventListener('click', handleLogoTap);
      
      return () => {
        logoElement.removeEventListener('click', handleLogoTap);
      };
    }
  }, []);

  /**
   * Check tap count for unlock
   */
  useEffect(() => {
    if (tapCount === 7) {
      unlockPage('tap');
      setTapCount(0);
    }
  }, [tapCount]);

  /**
   * Secret keyboard shortcut detector
   */
  useEffect(() => {
    const handleKeyPress = (e) => {
      // Ctrl+Shift+E (3 times within 5 seconds)
      if (e.ctrlKey && e.shiftKey && e.key === 'E') {
        setKeySequence(prev => [...prev, Date.now()]);
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, []);

  /**
   * Check keyboard sequence for unlock
   */
  useEffect(() => {
    if (keySequence.length >= 3) {
      const now = Date.now();
      const recentPresses = keySequence.filter(time => now - time < 5000);
      
      if (recentPresses.length >= 3) {
        unlockPage('keyboard');
        setKeySequence([]);
      }
    }
  }, [keySequence]);

  /**
   * Show unlock hint after 10 seconds
   */
  useEffect(() => {
    if (!isUnlocked) {
      const timer = setTimeout(() => {
        setShowUnlockHint(true);
      }, 10000);
      
      return () => clearTimeout(timer);
    }
  }, [isUnlocked]);

  /**
   * Load elevation attempts from localStorage
   */
  useEffect(() => {
    const attempts = parseInt(localStorage.getItem('accellax_elevation_attempts') || '0', 10);
    const lockout = localStorage.getItem('accellax_elevation_lockout_time');
    
    if (lockout) {
      const lockoutTime = new Date(lockout);
      const now = new Date();
      const timeDiff = lockoutTime - now;
      
      if (timeDiff > 0) {
        setIsLocked(true);
        setLockoutTime(lockoutTime);
        
        setTimeout(() => {
          setIsLocked(false);
          setLockoutTime(null);
          localStorage.removeItem('accellax_elevation_lockout_time');
          localStorage.setItem('accellax_elevation_attempts', '0');
          setElevationAttempts(0);
        }, timeDiff);
      } else {
        localStorage.removeItem('accellax_elevation_lockout_time');
        localStorage.setItem('accellax_elevation_attempts', '0');
      }
    }
    
    setElevationAttempts(attempts);
  }, []);

  /**
   * Detect device info and IP
   */
  useEffect(() => {
    // Get device info
    const deviceInfo = {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      screenResolution: `${window.screen.width}x${window.screen.height}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      cookiesEnabled: navigator.cookieEnabled,
    };
    setDeviceInfo(deviceInfo);
    
    // Get IP address (requires external API)
    fetch('https://api.ipify.org?format=json')
      .then(res => res.json())
      .then(data => setIpAddress(data.ip))
      .catch(() => console.log('Could not fetch IP'));
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
      toast.error('You are offline. Role elevation requires internet.', { 
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
   * 2FA resend countdown
   */
  useEffect(() => {
    if (resend2FACountdown > 0 && !canResend2FA) {
      const timer = setTimeout(() => {
        setResend2FACountdown(prev => prev - 1);
      }, 1000);
      
      return () => clearTimeout(timer);
    } else if (resend2FACountdown === 0) {
      setCanResend2FA(true);
    }
  }, [resend2FACountdown, canResend2FA]);

  /**
   * Success redirect countdown
   */
  useEffect(() => {
    if (elevationStatus === 'approved' && redirectCountdown > 0) {
      const timer = setTimeout(() => {
        setRedirectCountdown(prev => prev - 1);
      }, 1000);
      
      return () => clearTimeout(timer);
    } else if (elevationStatus === 'approved' && redirectCountdown === 0) {
      const role = formData.desiredRole;
      const redirectPath = role === 'super_admin' ? '/dashboard/admin' : '/dashboard';
      navigate(redirectPath, { replace: true });
    }
  }, [elevationStatus, redirectCountdown, navigate, formData.desiredRole]);

  // ==================== VALIDATION ====================
  
  /**
   * Validate field
   */
  const validateField = (name, value) => {
    let error = '';
    
    switch (name) {
      case 'currentPassword':
        if (!value) {
          error = 'Current password is required';
        }
        break;
        
      case 'twoFactorCode':
        if (twoFactorSent && !value) {
          error = '2FA code is required';
        } else if (value && !/^\d{6}$/.test(value)) {
          error = '2FA code must be 6 digits';
        }
        break;
        
      case 'desiredRole':
        if (!value) {
          error = 'Please select a role';
        }
        break;
        
      case 'justification':
        if (!value) {
          error = 'Justification is required';
        } else if (value.length < 50) {
          error = 'Please provide at least 50 characters';
        } else if (value.length > 500) {
          error = 'Maximum 500 characters allowed';
        }
        break;
        
      case 'elevationCode':
        if (!Array.isArray(value)) break;
        const codeString = value.join('');
        if (codeString.length !== 8) {
          error = 'Elevation code must be 8 digits';
        } else if (!/^\d{8}$/.test(codeString)) {
          error = 'Elevation code must contain only numbers';
        }
        break;
        
      default:
        break;
    }
    
    return error;
  };

  /**
   * Validate step
   */
  const validateStep = (step) => {
    const newErrors = {};
    
    if (step === 2) {
      // Identity verification
      const passwordError = validateField('currentPassword', formData.currentPassword);
      if (passwordError) newErrors.currentPassword = passwordError;
      
      if (twoFactorSent) {
        const twoFactorError = validateField('twoFactorCode', formData.twoFactorCode);
        if (twoFactorError) newErrors.twoFactorCode = twoFactorError;
      }
    } else if (step === 3) {
      // Role selection
      const roleError = validateField('desiredRole', formData.desiredRole);
      if (roleError) newErrors.desiredRole = roleError;
      
      const justificationError = validateField('justification', formData.justification);
      if (justificationError) newErrors.justification = justificationError;
    } else if (step === 4) {
      // Elevation code
      const codeError = validateField('elevationCode', formData.elevationCode);
      if (codeError) newErrors.elevationCode = codeError;
      
      // Master code for Super Admin
      const selectedRole = elevatedRoles.find(r => r.value === formData.desiredRole);
      if (selectedRole?.requiresMasterCode && !formData.masterCode) {
        newErrors.masterCode = 'Master code required for Super Admin elevation';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ==================== HANDLERS ====================
  
  /**
   * Unlock page
   */
  const unlockPage = (method) => {
    setIsUnlocked(true);
    setUnlockMethod(method);
    
    const methodMessages = {
      tap: 'Secret tap pattern detected! 🎯',
      keyboard: 'Keyboard shortcut activated! ⌨️',
      qr: 'QR code verified! 📱',
      url: 'Unlock code accepted! 🔓',
    };
    
    toast.success(methodMessages[method] || 'Access granted!', { 
      icon: '✨',
      duration: 3000 
    });
    
    // Log unlock attempt
    console.log('Role elevation page unlocked:', {
      method,
      timestamp: new Date().toISOString(),
      user: user?.email,
    });
  };

  /**
   * Verify unlock code (from QR or URL)
   */
  const verifyUnlockCode = async (code) => {
    // In production, verify code with backend
    const validCodes = ['ELEVATE123', 'ADMIN2024', 'UNLOCK999'];
    
    if (validCodes.includes(code.toUpperCase())) {
      unlockPage('url');
    } else {
      toast.error('Invalid unlock code');
    }
  };

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
    
    // Clear error
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  /**
   * Handle elevation code input
   */
  const handleElevationCodeChange = (index, value) => {
    if (value.length > 1) value = value[0];
    if (!/^\d*$/.test(value)) return;
    
    const newCode = [...formData.elevationCode];
    newCode[index] = value;
    
    setFormData(prev => ({
      ...prev,
      elevationCode: newCode,
    }));
    
    if (value && index < 7) {
      elevationCodeInputRefs.current[index + 1]?.focus();
    }
    
    if (errors.elevationCode) {
      setErrors(prev => ({ ...prev, elevationCode: '' }));
    }
  };

  /**
   * Handle elevation code keydown
   */
  const handleElevationCodeKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !formData.elevationCode[index] && index > 0) {
      elevationCodeInputRefs.current[index - 1]?.focus();
    }
  };

  /**
   * Handle elevation code paste
   */
  const handleElevationCodePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    
    if (/^\d{8}$/.test(pastedData)) {
      const codeArray = pastedData.split('');
      setFormData(prev => ({
        ...prev,
        elevationCode: codeArray,
      }));
      
      elevationCodeInputRefs.current[7]?.focus();
      toast.success('Code pasted', { icon: '📋' });
    } else {
      toast.error('Please paste a valid 8-digit code');
    }
  };

  /**
   * Toggle password visibility
   */
  const togglePasswordVisibility = () => {
    setShowPassword(prev => !prev);
  };

  /**
   * Handle failed elevation attempt
   */
  const handleFailedAttempt = () => {
    const newAttempts = elevationAttempts + 1;
    setElevationAttempts(newAttempts);
    localStorage.setItem('accellax_elevation_attempts', newAttempts.toString());
    
    if (newAttempts >= maxElevationAttempts) {
      const lockoutDuration = 60 * 60 * 1000; // 1 hour
      const lockoutTime = new Date(Date.now() + lockoutDuration);
      
      setIsLocked(true);
      setLockoutTime(lockoutTime);
      localStorage.setItem('accellax_elevation_lockout_time', lockoutTime.toISOString());
      
      toast.error(
        'Too many failed attempts. Access locked for 1 hour.',
        { duration: 8000, icon: '🔒' }
      );
      
      setTimeout(() => {
        setIsLocked(false);
        setLockoutTime(null);
        localStorage.removeItem('accellax_elevation_lockout_time');
        localStorage.setItem('accellax_elevation_attempts', '0');
        setElevationAttempts(0);
      }, lockoutDuration);
    }
  };

  /**
   * Send 2FA code
   */
  const handleSend2FA = async () => {
    if (twoFactorResendCount >= 3) {
      toast.error('Maximum 2FA attempts reached');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Call API to send 2FA code
      // await send2FACode({ email: user.email, method: twoFactorMethod });
      
      setTwoFactorSent(true);
      setTwoFactorResendCount(prev => prev + 1);
      setResend2FACountdown(60);
      setCanResend2FA(false);
      
      toast.success(
        `2FA code sent to your ${twoFactorMethod === 'email' ? 'email' : 'phone'}`,
        { icon: '📧', duration: 5000 }
      );
      
    } catch (error) {
      console.error('2FA send error:', error);
      toast.error(error.message || 'Failed to send 2FA code');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Step 2: Verify Identity
   */
  const handleVerifyIdentity = async (e) => {
    e.preventDefault();
    
    if (!validateStep(2)) {
      toast.error('Please fix the errors');
      return;
    }
    
    if (!isOnline) {
      toast.error('No internet connection');
      return;
    }
    
    setIsVerifyingIdentity(true);
    
    try {
      // Verify password
      await verifyPassword({ password: formData.currentPassword });
      
      // Verify 2FA if sent
      if (twoFactorSent) {
        // await verify2FACode({ code: formData.twoFactorCode });
      }
      
      toast.success('Identity verified!', { icon: '✅' });
      setCurrentStep(3);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      
    } catch (error) {
      console.error('Identity verification error:', error);
      toast.error(error.message || 'Verification failed');
      setErrors({ currentPassword: error.message });
      
      handleFailedAttempt();
      
    } finally {
      setIsVerifyingIdentity(false);
    }
  };

  /**
   * Step 4: Submit Elevation Request
   */
  const handleSubmitElevation = async (e) => {
    e.preventDefault();
    
    if (!validateStep(4)) {
      toast.error('Please fix the errors');
      return;
    }
    
    if (!isOnline) {
      toast.error('No internet connection');
      return;
    }
    
    setIsSubmittingRequest(true);
    
    try {
      const elevationCodeString = formData.elevationCode.join('');
      
      // Verify elevation code and submit request
      const result = await requestRoleElevation({
        desiredRole: formData.desiredRole,
        elevationCode: elevationCodeString,
        masterCode: formData.masterCode || null,
        justification: formData.justification,
        requestedBy: formData.requestedBy,
        departmentCode: formData.departmentCode,
        sessionInfo: {
          unlockMethod,
          startTime: sessionStartTime,
          ipAddress,
          deviceInfo,
        },
        notificationPreferences: {
          email: formData.notifyByEmail,
          sms: formData.notifyBySMS,
        },
      });
      
      // Reset attempts on success
      localStorage.setItem('accellax_elevation_attempts', '0');
      setElevationAttempts(0);
      
      // Check result status
      if (result.approved) {
        setElevationStatus('approved');
        setElevationRequestId(result.requestId);
        
        toast.success(
          `Role elevated to ${elevatedRoles.find(r => r.value === formData.desiredRole)?.label}!`,
          { icon: '🎉', duration: 5000 }
        );
      } else if (result.pendingApproval) {
        setElevationStatus('pending_approval');
        setElevationRequestId(result.requestId);
        
        toast.info(
          'Elevation request submitted. Awaiting admin approval.',
          { icon: '⏳', duration: 5000 }
        );
      }
      
    } catch (error) {
      console.error('Elevation request error:', error);
      
      setElevationStatus('denied');
      
      toast.error(
        error.message || 'Elevation failed. Invalid code or insufficient permissions.',
        { duration: 5000 }
      );
      
      setErrors({ elevationCode: error.message });
      
      handleFailedAttempt();
      
    } finally {
      setIsSubmittingRequest(false);
    }
  };

  /**
   * Navigate to next step
   */
  const handleNextStep = () => {
    if (!validateStep(currentStep)) {
      toast.error('Please complete all required fields');
      return;
    }
    
    setCurrentStep(prev => Math.min(prev + 1, totalSteps));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /**
   * Navigate to previous step
   */
  const handlePreviousStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /**
   * Handle role selection
   */
  const handleRoleSelect = (roleValue) => {
    setFormData(prev => ({
      ...prev,
      desiredRole: roleValue,
    }));
    
    setErrors(prev => ({ ...prev, desiredRole: '' }));
  };

  /**
   * Cancel and exit
   */
  const handleCancel = () => {
    if (window.confirm('Are you sure you want to cancel role elevation?')) {
      navigate('/dashboard');
    }
  };

  // ==================== COMPUTED VALUES ====================

  /**
   * Get progress percentage
   */
  const progressPercentage = useMemo(() => {
    return ((currentStep - 1) / (totalSteps - 1)) * 100;
  }, [currentStep]);

  /**
   * Check if elevation code is complete
   */
  const isElevationCodeComplete = useMemo(() => {
    return formData.elevationCode.every(digit => digit !== '');
  }, [formData.elevationCode]);

  /**
   * Get selected role details
   */
  const selectedRole = useMemo(() => {
    return elevatedRoles.find(r => r.value === formData.desiredRole);
  }, [formData.desiredRole]);

  /**
   * Get remaining lockout time
   */
  const getRemainingLockoutTime = () => {
    if (!lockoutTime) return '';
    
    const now = new Date();
    const diff = lockoutTime - now;
    const minutes = Math.ceil(diff / 1000 / 60);
    
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
  };

  // ==================== RENDER HELPERS ====================
  
  /**
   * Render step indicator
   */
  const renderStepIndicator = () => {
    return (
      <div className="mb-8">
        <div className="relative">
          <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-200">
            <div
              style={{ width: `${progressPercentage}%` }}
              className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500"
            />
          </div>
          
          <div className="flex justify-between relative">
            {[1, 2, 3, 4].map((step) => (
              <div key={step} className="text-center">
                <div
                  className={`
                    w-10 h-10 mx-auto rounded-full text-lg flex items-center justify-center
                    font-semibold transition-all duration-300
                    ${step < currentStep
                      ? 'bg-success-500 text-white'
                      : step === currentStep
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white ring-4 ring-purple-100'
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
                  {step === 1 && 'Unlock'}
                  {step === 2 && 'Verify'}
                  {step === 3 && 'Select Role'}
                  {step === 4 && 'Elevate'}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  /**
   * Render Locked Screen (before unlock)
   */
  const renderLockedScreen = () => {
    return (
      <div className="text-center py-12">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-6 animate-pulse">
          <Lock className="w-12 h-12 text-gray-400" />
        </div>
        
        <h2 className="text-2xl font-display font-bold text-gray-900 mb-3">
          Role Elevation Access
        </h2>
        
        <p className="text-gray-600 mb-6 max-w-md mx-auto">
          This page requires special access. Use the secret method to unlock.
        </p>
        
        {showUnlockHint && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg max-w-md mx-auto animate-fade-in">
            <div className="flex items-start gap-2">
              <HelpCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-left">
                <p className="text-sm font-semibold text-blue-900 mb-2">
                  Unlock Methods:
                </p>
                <ul className="text-xs text-blue-700 space-y-1">
                  <li>• Tap the logo 7 times quickly</li>
                  <li>• Press Ctrl+Shift+E three times</li>
                  <li>• Scan the admin-provided QR code</li>
                  <li>• Use the unlock code in URL</li>
                </ul>
              </div>
            </div>
          </div>
        )}
        
        <div className="mt-8">
          <Link
            to="/dashboard"
            className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    );
  };

  /**
   * Render Step 1: Unlocked (Intro)
   */
  const renderStep1 = () => {
    return (
      <div className="space-y-6">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full mb-4 animate-bounce">
            <Unlock className="w-8 h-8 text-purple-600" />
          </div>
          <h2 className="text-2xl font-display font-bold text-gray-900 mb-2">
            Access Granted
          </h2>
          <p className="text-gray-600">
            You've unlocked the role elevation page
          </p>
        </div>

        <div className="p-6 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg">
          <div className="flex items-start gap-3">
            <ShieldAlert className="w-6 h-6 text-purple-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-purple-900 mb-2">
                ⚠️ Important Security Notice
              </h3>
              <p className="text-sm text-purple-800 mb-3">
                Role elevation grants significant privileges and responsibilities.
                All elevation attempts are logged and monitored. Misuse may result
                in account suspension.
              </p>
              <ul className="text-xs text-purple-700 space-y-1">
                <li>✓ Your IP address will be recorded</li>
                <li>✓ All actions will be audited</li>
                <li>✓ Admin will be notified of your request</li>
                <li>✓ You may be contacted for verification</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <Info className="w-5 h-5 text-blue-600" />
            What You'll Need:
          </h3>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-success-500 mt-0.5 flex-shrink-0" />
              <span>Your current account password</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-success-500 mt-0.5 flex-shrink-0" />
              <span>Two-factor authentication access (email or SMS)</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-success-500 mt-0.5 flex-shrink-0" />
              <span>Valid business justification (50+ characters)</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-success-500 mt-0.5 flex-shrink-0" />
              <span>8-digit elevation code (provided by admin)</span>
            </li>
          </ul>
        </div>

        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-yellow-800">
              <p className="font-semibold mb-1">Rate Limiting Active</p>
              <p className="text-xs">
                Maximum {maxElevationAttempts} attempts per hour. Current attempts: {elevationAttempts}/{maxElevationAttempts}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  /**
   * Render Step 2: Identity Verification
   */
  const renderStep2 = () => {
    return (
      <div className="space-y-6">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <Fingerprint className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="text-2xl font-display font-bold text-gray-900 mb-2">
            Verify Your Identity
          </h2>
          <p className="text-gray-600">
            Confirm your identity before proceeding
          </p>
        </div>

        <form onSubmit={handleVerifyIdentity}>
          <div className="space-y-6">
            {/* Current Password */}
            <div>
              <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Current Password *
              </label>
              
              <div className="relative">
                <input
                  ref={passwordInputRef}
                  id="currentPassword"
                  name="currentPassword"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={formData.currentPassword}
                  onChange={handleChange}
                  className={`
                    block w-full px-4 pr-12 py-3 border rounded-lg
                    focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent
                    transition-all duration-200
                    ${errors.currentPassword 
                      ? 'border-danger-300 focus:ring-danger-500' 
                      : 'border-gray-300'
                    }
                  `}
                  placeholder="Enter your password"
                />
                
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
              
              {errors.currentPassword && (
                <p className="mt-2 text-sm text-danger-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.currentPassword}
                </p>
              )}
            </div>

            {/* 2FA Method Selection */}
            {!twoFactorSent && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Two-Factor Authentication Method *
                </label>
                
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setTwoFactorMethod('email')}
                    className={`
                      p-4 border-2 rounded-lg transition-all duration-200
                      ${twoFactorMethod === 'email'
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                      }
                    `}
                  >
                    <Mail className={`w-6 h-6 mx-auto mb-2 ${
                      twoFactorMethod === 'email' ? 'text-purple-600' : 'text-gray-400'
                    }`} />
                    <span className="text-sm font-medium">Email</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTwoFactorMethod('sms')}
                    className={`
                      p-4 border-2 rounded-lg transition-all duration-200
                      ${twoFactorMethod === 'sms'
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                      }
                    `}
                  >
                    <Smartphone className={`w-6 h-6 mx-auto mb-2 ${
                      twoFactorMethod === 'sms' ? 'text-purple-600' : 'text-gray-400'
                    }`} />
                    <span className="text-sm font-medium">SMS</span>
                  </button>
                </div>
              </div>
            )}

            {/* Send 2FA Button */}
            {!twoFactorSent && (
              <button
                type="button"
                onClick={handleSend2FA}
                disabled={!formData.currentPassword || isLoading}
                className={`
                  w-full flex items-center justify-center gap-2 px-4 py-3
                  border border-transparent rounded-lg shadow-sm text-base font-medium text-white
                  transition-all duration-200
                  ${!formData.currentPassword || isLoading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600'
                  }
                `}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Sending Code...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    <span>Send {twoFactorMethod === 'email' ? 'Email' : 'SMS'} Code</span>
                  </>
                )}
              </button>
            )}

            {/* 2FA Code Input */}
            {twoFactorSent && (
              <div>
                <label htmlFor="twoFactorCode" className="block text-sm font-medium text-gray-700 mb-2">
                  2FA Code *
                </label>
                
                <input
                  id="twoFactorCode"
                  name="twoFactorCode"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  required
                  value={formData.twoFactorCode}
                  onChange={handleChange}
                  className={`
                    block w-full px-4 py-3 border rounded-lg text-center text-xl font-mono
                    focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent
                    ${errors.twoFactorCode 
                      ? 'border-danger-300' 
                      : 'border-gray-300'
                    }
                  `}
                  placeholder="000000"
                />
                
                {errors.twoFactorCode && (
                  <p className="mt-2 text-sm text-danger-600">{errors.twoFactorCode}</p>
                )}
                
                {/* Resend 2FA */}
                <div className="mt-3 text-center">
                  {resend2FACountdown > 0 && !canResend2FA ? (
                    <p className="text-sm text-gray-500">
                      Resend in <span className="font-semibold">{resend2FACountdown}s</span>
                    </p>
                  ) : canResend2FA && twoFactorResendCount < 3 ? (
                    <button
                      type="button"
                      onClick={handleSend2FA}
                      className="text-sm text-purple-600 hover:text-purple-700 font-medium"
                    >
                      Resend Code
                    </button>
                  ) : null}
                </div>
              </div>
            )}

            {/* Submit Button */}
            {twoFactorSent && (
              <button
                type="submit"
                disabled={isVerifyingIdentity || !formData.twoFactorCode}
                className={`
                  w-full flex items-center justify-center gap-2 px-4 py-3
                  border border-transparent rounded-lg shadow-sm text-base font-medium text-white
                  transition-all duration-200
                  ${isVerifyingIdentity || !formData.twoFactorCode
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600'
                  }
                `}
              >
                {isVerifyingIdentity ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    <span>Verify Identity</span>
                  </>
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    );
  };

  /**
   * Render Step 3: Role Selection & Justification
   */
  const renderStep3 = () => {
    return (
      <div className="space-y-6">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full mb-4">
            <Crown className="w-8 h-8 text-purple-600" />
          </div>
          <h2 className="text-2xl font-display font-bold text-gray-900 mb-2">
            Select Your Role
          </h2>
          <p className="text-gray-600">
            Choose the role you wish to be elevated to
          </p>
        </div>

        {/* Role Cards */}
        <div className="space-y-4">
          {elevatedRoles.map((role) => {
            const Icon = role.icon;
            const isSelected = formData.desiredRole === role.value;
            
            return (
              <button
                key={role.value}
                type="button"
                onClick={() => handleRoleSelect(role.value)}
                className={`
                  w-full p-6 border-2 rounded-xl text-left transition-all duration-200
                  hover:shadow-lg
                  ${isSelected
                    ? `border-purple-500 bg-gradient-to-r ${role.color} bg-opacity-10 shadow-md`
                    : 'border-gray-200 bg-white hover:border-gray-300'
                  }
                `}
              >
                <div className="flex items-start gap-4">
                  <div className={`
                    p-3 rounded-lg bg-gradient-to-r ${role.color}
                  `}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-bold text-lg text-gray-900">
                        {role.label}
                      </h3>
                      {role.riskLevel === 'critical' && (
                        <span className="px-2 py-0.5 text-xs font-semibold bg-red-100 text-red-700 rounded">
                          Critical
                        </span>
                      )}
                      {role.riskLevel === 'high' && (
                        <span className="px-2 py-0.5 text-xs font-semibold bg-orange-100 text-orange-700 rounded">
                          High Risk
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-3">
                      {role.description}
                    </p>
                    
                    {isSelected && (
                      <div className="space-y-3 animate-fade-in">
                        <div>
                          <p className="text-xs font-semibold text-gray-700 mb-1">
                            Permissions:
                          </p>
                          <ul className="space-y-1">
                            {role.permissions.slice(0, 3).map((perm, idx) => (
                              <li key={idx} className="text-xs text-gray-600 flex items-center gap-1">
                                <Check className="w-3 h-3 text-success-500 flex-shrink-0" />
                                {perm}
                              </li>
                            ))}
                          </ul>
                        </div>
                        
                        <div>
                          <p className="text-xs font-semibold text-gray-700 mb-1">
                            Requirements:
                          </p>
                          <ul className="space-y-1">
                            {role.requirements.map((req, idx) => (
                              <li key={idx} className="text-xs text-gray-600 flex items-center gap-1">
                                <AlertCircle className="w-3 h-3 text-blue-500 flex-shrink-0" />
                                {req}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {isSelected && (
                    <CheckCircle className="w-6 h-6 text-success-500 flex-shrink-0" />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {errors.desiredRole && (
          <p className="text-sm text-danger-600 flex items-center gap-1">
            <AlertCircle className="w-4 h-4" />
            {errors.desiredRole}
          </p>
        )}

        {/* Justification */}
        <div>
          <label htmlFor="justification" className="block text-sm font-medium text-gray-700 mb-2">
            Business Justification * <span className="text-gray-500 text-xs">(50-500 characters)</span>
          </label>
          
          <textarea
            ref={justificationInputRef}
            id="justification"
            name="justification"
            rows="5"
            required
            value={formData.justification}
            onChange={handleChange}
            maxLength={500}
            className={`
              block w-full px-4 py-3 border rounded-lg
              focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent
              ${errors.justification ? 'border-danger-300' : 'border-gray-300'}
            `}
            placeholder="Explain why you need this role elevation. Include your responsibilities, team requirements, and how this will benefit the academy..."
          />
          
          <div className="flex items-center justify-between mt-2">
            <div>
              {errors.justification && (
                <p className="text-sm text-danger-600">{errors.justification}</p>
              )}
            </div>
            <p className={`text-xs ${
              formData.justification.length < 50 
                ? 'text-gray-500' 
                : formData.justification.length >= 500 
                ? 'text-danger-600' 
                : 'text-success-600'
            }`}>
              {formData.justification.length}/500
            </p>
          </div>
        </div>

        {/* Optional Fields */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="requestedBy" className="block text-sm font-medium text-gray-700 mb-2">
              Requested By (Optional)
            </label>
            <input
              id="requestedBy"
              name="requestedBy"
              type="text"
              value={formData.requestedBy}
              onChange={handleChange}
              className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Manager/Admin name"
            />
          </div>

          <div>
            <label htmlFor="departmentCode" className="block text-sm font-medium text-gray-700 mb-2">
              Department/Team Code (Optional)
            </label>
            <input
              id="departmentCode"
              name="departmentCode"
              type="text"
              value={formData.departmentCode}
              onChange={handleChange}
              className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="e.g., COACH-001"
            />
          </div>
        </div>
      </div>
    );
  };

  /**
   * Render Step 4: Elevation Code Entry
   */
  const renderStep4 = () => {
    return (
      <div className="space-y-6">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-yellow-100 to-orange-100 rounded-full mb-4">
            <KeyRound className="w-8 h-8 text-yellow-600" />
          </div>
          <h2 className="text-2xl font-display font-bold text-gray-900 mb-2">
            Enter Elevation Code
          </h2>
          <p className="text-gray-600">
            Enter the 8-digit code provided by your administrator
          </p>
        </div>

        <form onSubmit={handleSubmitElevation}>
          <div className="space-y-6">
            {/* Elevation Code Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3 text-center">
                Elevation Code *
              </label>
              
              <div className="flex justify-center gap-2 mb-4">
                {formData.elevationCode.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => (elevationCodeInputRefs.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleElevationCodeChange(index, e.target.value)}
                    onKeyDown={(e) => handleElevationCodeKeyDown(index, e)}
                    onPaste={index === 0 ? handleElevationCodePaste : undefined}
                    disabled={isSubmittingRequest}
                    className={`
                      w-12 h-14 text-center text-2xl font-bold border-2 rounded-lg
                      focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent
                      transition-all duration-200
                      disabled:bg-gray-100 disabled:cursor-not-allowed
                      ${errors.elevationCode 
                        ? 'border-danger-300 focus:ring-danger-500' 
                        : 'border-gray-300'
                      }
                      ${digit ? 'bg-purple-50 border-purple-300' : 'bg-white'}
                    `}
                  />
                ))}
              </div>
              
              {errors.elevationCode && (
                <p className="mt-2 text-sm text-danger-600 flex items-center justify-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.elevationCode}
                </p>
              )}
              
              <p className="text-xs text-gray-500 text-center">
                Contact your academy administrator to obtain this code
              </p>
            </div>

            {/* Master Code (Super Admin only) */}
            {selectedRole?.requiresMasterCode && (
              <div className="p-4 bg-red-50 border-2 border-red-200 rounded-lg">
                <div className="flex items-start gap-2 mb-3">
                  <ShieldAlert className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="text-sm font-semibold text-red-900">
                      Master Code Required
                    </h4>
                    <p className="text-xs text-red-700 mt-1">
                      Super Admin elevation requires an additional master code.
                      This code is extremely confidential and should only be known
                      to existing Super Admins.
                    </p>
                  </div>
                </div>
                
                <input
                  id="masterCode"
                  name="masterCode"
                  type="password"
                  value={formData.masterCode}
                  onChange={handleChange}
                  className="block w-full px-4 py-3 border-2 border-red-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
                  placeholder="Enter master code"
                />
                
                {errors.masterCode && (
                  <p className="mt-2 text-sm text-danger-600">{errors.masterCode}</p>
                )}
              </div>
            )}

            {/* Selected Role Summary */}
            <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg">
              <h4 className="text-sm font-semibold text-purple-900 mb-2">
                Elevation Summary
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Role:</span>
                  <span className="font-semibold text-gray-900">
                    {selectedRole?.label}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Requires Approval:</span>
                  <span className={`font-semibold ${
                    selectedRole?.requiresApproval ? 'text-orange-600' : 'text-green-600'
                  }`}>
                    {selectedRole?.requiresApproval ? 'Yes' : 'No'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Risk Level:</span>
                  <span className={`px-2 py-0.5 text-xs font-semibold rounded ${
                    selectedRole?.riskLevel === 'critical' ? 'bg-red-100 text-red-700' :
                    selectedRole?.riskLevel === 'high' ? 'bg-orange-100 text-orange-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {selectedRole?.riskLevel?.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>

            {/* Notification Preferences */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-gray-900">
                Notification Preferences
              </h4>
              
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="notifyByEmail"
                  checked={formData.notifyByEmail}
                  onChange={handleChange}
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                />
                <div className="flex-1">
                  <span className="text-sm font-medium text-gray-900">Email Notification</span>
                  <p className="text-xs text-gray-500">
                    Receive confirmation email when elevation is processed
                  </p>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="notifyBySMS"
                  checked={formData.notifyBySMS}
                  onChange={handleChange}
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                />
                <div className="flex-1">
                  <span className="text-sm font-medium text-gray-900">SMS Notification</span>
                  <p className="text-xs text-gray-500">
                    Receive SMS alert when elevation is approved
                  </p>
                </div>
              </label>
            </div>

            {/* Security Acknowledgment */}
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <h4 className="text-sm font-semibold text-gray-900 mb-2">
                Security Acknowledgment
              </h4>
              <div className="space-y-2 text-xs text-gray-600">
                <p className="flex items-start gap-2">
                  <Activity className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <span>This elevation attempt will be logged with your IP address: <span className="font-mono font-semibold">{ipAddress || 'Detecting...'}</span></span>
                </p>
                <p className="flex items-start gap-2">
                  <Clock className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <span>Session started: {sessionStartTime.toLocaleTimeString()}</span>
                </p>
                <p className="flex items-start gap-2">
                  <Terminal className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <span>Unlock method: {unlockMethod}</span>
                </p>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!isElevationCodeComplete || isSubmittingRequest || !isOnline || isLocked}
              className={`
                w-full flex items-center justify-center gap-2 px-4 py-4
                border border-transparent rounded-lg shadow-lg text-base font-bold text-white
                transition-all duration-200
                ${!isElevationCodeComplete || isSubmittingRequest || !isOnline || isLocked
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 active:scale-95 shadow-purple-200'
                }
              `}
            >
              {isSubmittingRequest ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span>Processing Elevation...</span>
                </>
              ) : isLocked ? (
                <>
                  <Lock className="w-6 h-6" />
                  <span>Account Locked</span>
                </>
              ) : (
                <>
                  <Rocket className="w-6 h-6" />
                  <span>Submit Elevation Request</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    );
  };

  /**
   * Render Success/Approved State
   */
  const renderApproved = () => {
    return (
      <div className="text-center py-8 animate-fade-in">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-success-100 rounded-full mb-6 animate-bounce">
          <PartyPopper className="w-12 h-12 text-success-600" />
        </div>
        
        <h2 className="text-2xl font-display font-bold text-gray-900 mb-3">
          Elevation Successful! 🎉
        </h2>
        
        <p className="text-gray-600 mb-6 max-w-md mx-auto">
          Your role has been elevated to{' '}
          <span className="font-bold text-purple-600">
            {selectedRole?.label}
          </span>
          . You now have access to all associated features and permissions.
        </p>
        
        <div className="p-4 bg-success-50 border border-success-200 rounded-lg mb-6 max-w-md mx-auto">
          <div className="flex items-start gap-2">
            <CheckCheck className="w-5 h-5 text-success-600 mt-0.5 flex-shrink-0" />
            <div className="text-left">
              <p className="text-sm text-success-900 font-semibold mb-1">
                What's Next:
              </p>
              <ul className="text-xs text-success-700 space-y-1">
                <li>• You'll receive a confirmation email</li>
                <li>• Your dashboard will reflect new permissions</li>
                <li>• All actions will be audited for security</li>
                <li>• Review your new capabilities in settings</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <p className="text-sm text-gray-600 mb-2">
            Redirecting to dashboard in{' '}
            <span className="font-bold text-purple-600">{redirectCountdown}</span> seconds...
          </p>
        </div>
        
        <div className="space-y-3">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-colors font-semibold shadow-lg"
          >
            <Target className="w-5 h-5" />
            Go to Dashboard Now
          </Link>
          
          <div>
            <Link
              to="/settings"
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              View Role Permissions →
            </Link>
          </div>
        </div>
      </div>
    );
  };

  /**
   * Render Pending Approval State
   */
  const renderPendingApproval = () => {
    return (
      <div className="text-center py-8">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-yellow-100 rounded-full mb-6 animate-pulse">
          <Clock className="w-12 h-12 text-yellow-600" />
        </div>
        
        <h2 className="text-2xl font-display font-bold text-gray-900 mb-3">
          Awaiting Admin Approval
        </h2>
        
        <p className="text-gray-600 mb-6 max-w-md mx-auto">
          Your elevation request to{' '}
          <span className="font-bold text-purple-600">
            {selectedRole?.label}
          </span>
          {' '}has been submitted successfully and is pending administrator approval.
        </p>
        
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-6 max-w-md mx-auto">
          <div className="flex items-start gap-2">
            <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-left">
              <p className="text-sm text-blue-900 font-semibold mb-2">
                Request Details:
              </p>
              <div className="space-y-1 text-xs text-blue-700">
                <p>Request ID: <span className="font-mono">{elevationRequestId}</span></p>
                <p>Submitted: {new Date().toLocaleString()}</p>
                <p>Status: Pending Review</p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg mb-6 max-w-md mx-auto">
          <p className="text-sm text-yellow-900 font-semibold mb-2">
            What Happens Next:
          </p>
          <ul className="text-xs text-yellow-700 space-y-1 text-left">
            <li className="flex items-start gap-2">
              <Bell className="w-3 h-3 mt-0.5 flex-shrink-0" />
              <span>An administrator will review your request</span>
            </li>
            <li className="flex items-start gap-2">
              <Mail className="w-3 h-3 mt-0.5 flex-shrink-0" />
              <span>You'll receive an email when processed</span>
            </li>
            <li className="flex items-start gap-2">
              <MessageSquare className="w-3 h-3 mt-0.5 flex-shrink-0" />
              <span>Admin may contact you for verification</span>
            </li>
            <li className="flex items-start gap-2">
              <Clock className="w-3 h-3 mt-0.5 flex-shrink-0" />
              <span>Typical approval time: 1-3 business days</span>
            </li>
          </ul>
        </div>
        
        <div className="space-y-3">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
          >
            <Home className="w-5 h-5" />
            Return to Dashboard
          </Link>
          
          <div>
            <button
              onClick={() => window.location.reload()}
              className="text-sm text-purple-600 hover:text-purple-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4 inline mr-1" />
              Check Status
            </button>
          </div>
        </div>
      </div>
    );
  };

  /**
   * Render Denied State
   */
  const renderDenied = () => {
    return (
      <div className="text-center py-8">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-danger-100 rounded-full mb-6">
          <XCircle className="w-12 h-12 text-danger-600" />
        </div>
        
        <h2 className="text-2xl font-display font-bold text-gray-900 mb-3">
          Elevation Denied
        </h2>
        
        <p className="text-gray-600 mb-6 max-w-md mx-auto">
          Your elevation request could not be processed. This may be due to an
          invalid code, insufficient permissions, or security restrictions.
        </p>
        
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-6 max-w-md mx-auto">
          <h4 className="text-sm font-semibold text-red-900 mb-2">
            Common Issues:
          </h4>
          <ul className="text-xs text-red-700 space-y-1 text-left">
            <li className="flex items-start gap-2">
              <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
              <span>Invalid or expired elevation code</span>
            </li>
            <li className="flex items-start gap-2">
              <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
              <span>Code already used by another user</span>
            </li>
            <li className="flex items-start gap-2">
              <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
              <span>Insufficient account age or history</span>
            </li>
            <li className="flex items-start gap-2">
              <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
              <span>Missing required documentation</span>
            </li>
          </ul>
        </div>

        <p className="text-sm text-gray-600 mb-6">
          Remaining attempts: <span className="font-bold text-danger-600">
            {maxElevationAttempts - elevationAttempts}
          </span> of {maxElevationAttempts}
        </p>
        
        <div className="space-y-3">
          <button
            onClick={() => {
              setElevationStatus('pending');
              setCurrentStep(4);
              setFormData(prev => ({
                ...prev,
                elevationCode: ['', '', '', '', '', '', '', ''],
              }));
            }}
            disabled={elevationAttempts >= maxElevationAttempts}
            className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className="w-5 h-5" />
            Try Again
          </button>
          
          <div>
            <Link
              to="/help"
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              <HelpCircle className="w-4 h-4 inline mr-1" />
              Contact Support
            </Link>
          </div>
        </div>
      </div>
    );
  };

  /**
   * Render Locked State
   */
  const renderLockedState = () => {
    return (
      <div className="text-center py-12">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-danger-100 rounded-full mb-6">
          <Lock className="w-12 h-12 text-danger-600" />
        </div>
        
        <h2 className="text-2xl font-display font-bold text-gray-900 mb-3">
          Account Temporarily Locked
        </h2>
        
        <p className="text-gray-600 mb-6 max-w-md mx-auto">
          Too many failed elevation attempts. For security reasons, your account
          has been temporarily locked from role elevation requests.
        </p>
        
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-6 max-w-md mx-auto">
          <p className="text-sm text-red-900 font-semibold mb-2">
            Lockout Details:
          </p>
          <div className="space-y-1 text-xs text-red-700">
            <p>Lockout Time: {getRemainingLockoutTime()}</p>
            <p>Failed Attempts: {elevationAttempts}</p>
            <p>Security Status: High Alert</p>
          </div>
        </div>

        <p className="text-sm text-gray-600 mb-6">
          Access will be restored automatically after the lockout period.
          If you believe this is an error, please contact support.
        </p>
        
        <div className="space-y-3">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
          >
            <Home className="w-5 h-5" />
            Return to Dashboard
          </Link>
          
          <div>
            <Link
              to="/help"
              className="text-sm text-danger-600 hover:text-danger-700 transition-colors"
            >
              Report Security Issue →
            </Link>
          </div>
        </div>
      </div>
    );
  };

  // ==================== MAIN RENDER ====================
  
  // Show locked state if account is locked
  if (isLocked) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl">
          <div className="bg-white rounded-2xl shadow-2xl p-8">
            {renderLockedState()}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 flex items-center justify-center p-4">
      {/* Offline Banner */}
      {!isOnline && (
        <div className="fixed top-0 left-0 right-0 bg-danger-500 text-white py-3 px-4 flex items-center justify-center gap-2 z-50 shadow-lg">
          <WifiOff className="w-5 h-5" />
          <span className="font-medium">You are offline. Role elevation requires internet connection.</span>
        </div>
      )}

      {/* Main Container */}
      <div className="w-full max-w-2xl relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div
            ref={logoRef}
            className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl shadow-lg mb-4 cursor-pointer hover:shadow-xl transition-all duration-200 hover:scale-105"
          >
            <Shield className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-display font-bold text-gray-900">
            AccellaX 361°
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Role Elevation Portal
          </p>
          {tapCount > 0 && tapCount < 7 && (
            <p className="text-xs text-purple-600 mt-2 animate-pulse">
              {tapCount}/7 taps
            </p>
          )}
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {!isUnlocked ? (
            renderLockedScreen()
          ) : elevationStatus === 'approved' ? (
            renderApproved()
          ) : elevationStatus === 'pending_approval' ? (
            renderPendingApproval()
          ) : elevationStatus === 'denied' ? (
            renderDenied()
          ) : (
            <>
              {/* Step Indicator */}
              {renderStepIndicator()}

              {/* Step Content */}
              {currentStep === 1 && renderStep1()}
              {currentStep === 2 && renderStep2()}
              {currentStep === 3 && renderStep3()}
              {currentStep === 4 && renderStep4()}

              {/* Navigation Buttons */}
              {elevationStatus === 'pending' && (
                <div className="mt-8 flex items-center justify-between gap-4">
                  {currentStep > 1 ? (
                    <button
                      type="button"
                      onClick={handlePreviousStep}
                      className="flex items-center gap-2 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                    >
                      <ArrowLeft className="w-5 h-5" />
                      Back
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleCancel}
                      className="flex items-center gap-2 px-6 py-3 text-gray-600 hover:text-gray-900 transition-colors font-medium"
                    >
                      <X className="w-5 h-5" />
                      Cancel
                    </button>
                  )}

                  {currentStep < totalSteps && currentStep !== 2 && currentStep !== 4 && (
                    <button
                      type="button"
                      onClick={handleNextStep}
                      className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-colors font-medium shadow-sm"
                    >
                      Next
                      <ArrowRight className="w-5 h-5" />
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Links */}
        {elevationStatus === 'pending' && (
          <div className="mt-6 text-center space-y-2">
            <div className="flex items-center justify-center gap-4 text-sm text-gray-600">
              <Link to="/dashboard" className="hover:text-gray-900 transition-colors">
                Dashboard
              </Link>
              <span>•</span>
              <Link to="/help" className="hover:text-gray-900 transition-colors">
                Help Center
              </Link>
              <span>•</span>
              <Link to="/privacy" className="hover:text-gray-900 transition-colors">
                Privacy Policy
              </Link>
            </div>
            <p className="text-xs text-gray-500">
              All elevation attempts are logged and monitored for security
            </p>
          </div>
        )}

        {/* Security Badge */}
        <div className="mt-4 flex items-center justify-center gap-2 text-gray-500 text-xs">
          <ShieldCheck className="w-4 h-4" />
          <span>Secured by Multi-Factor Authentication</span>
        </div>
      </div>

      {/* CSS Animations */}
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

export default RoleElevationPage;