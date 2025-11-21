/**
 * File: web/frontend/src/pages/auth/RegisterPage.jsx
 * AccellaX 361° - Comprehensive Registration Page
 * 
 * Description:
 * This is the user registration page for the AccellaX 361° platform.
 * It provides a secure, user-friendly registration experience for multiple user types
 * (Parents, Kids, Coaches, Payment Recorders, Sponsors).
 * 
 * Features:
 * - Multi-step registration wizard (3 steps)
 * - Role-based registration (different forms per role)
 * - Real-time form validation with visual feedback
 * - Password strength indicator
 * - Email/Phone verification
 * - Terms & Conditions acceptance
 * - Profile photo upload (optional)
 * - Academy selection
 * - Age group assignment (for kids)
 * - Guardian/Parent linking (for kids)
 * - Sponsorship type selection
 * - Firebase Authentication integration
 * - Social registration (Google, Apple)
 * - Responsive design (mobile, tablet, desktop)
 * - Accessibility features (ARIA, keyboard navigation)
 * - Progress indicator
 * - Form auto-save (drafts)
 * - Email/phone uniqueness check
 * - GDPR compliance (data consent)
 * 
 * User Roles (Available for Self-Registration):
 * - Parent: Can register kids, view attendance
 * - Kid: Limited registration (requires parent approval)
 * - Coach: Requires approval from admin
 * - Payment Recorder: Requires approval from admin
 * - Sponsor: Requires approval from admin
 * 
 * Restricted Roles (Require Admin Elevation):
 * - Super Admin: Cannot self-register
 * - Academy Owner: Cannot self-register
 * - Head Coach: Cannot self-register
 * 
 * Dependencies:
 * - React 18+
 * - React Router v6
 * - AuthContext (authentication state)
 * - Firebase Auth & Firestore
 * - Lucide React (icons)
 * - React Hot Toast (notifications)
 * 
 * Routes:
 * - /register (this page)
 * - /login (redirect after registration)
 * - /verify-email (email verification)
 * 
 * Usage:
 * import RegisterPage from '@/pages/auth/RegisterPage';
 * <Route path="/register" element={<RegisterPage />} />
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { 
  User,
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  CheckCircle,
  Loader2,
  Shield,
  Phone,
  UserPlus,
  ArrowRight,
  ArrowLeft,
  Chrome,
  Apple,
  Check,
  X,
  Upload,
  Camera,
  MapPin,
  Calendar,
  Users,
  Briefcase,
  Heart,
  Baby,
  GraduationCap,
  CreditCard,
  FileText,
  Info,
  WifiOff,
  ChevronDown,
  Home,
  Building
} from 'lucide-react';
import toast from 'react-hot-toast';

/**
 * RegisterPage Component
 * Multi-step registration page for AccellaX 361°
 */
const RegisterPage = () => {
  // ==================== HOOKS ====================
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { register, registerWithGoogle, registerWithApple, user, loading: authLoading } = useAuth();
  
  // Get role from URL query parameter (optional)
  const urlRole = searchParams.get('role');
  
  // Refs
  const nameInputRef = useRef(null);
  const emailInputRef = useRef(null);
  const photoInputRef = useRef(null);
  
  // ==================== STATE ====================
  
  // Registration steps
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;
  
  // Form data
  const [formData, setFormData] = useState({
    // Step 1: Basic Info
    name: '',
    username: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: urlRole || 'parent', // Default role
    
    // Step 2: Profile Info (role-specific)
    // For all roles
    dateOfBirth: '',
    gender: '',
    address: '',
    city: 'Nairobi',
    country: 'Kenya',
    profilePhoto: null,
    
    // For Kids
    ageGroup: '',
    parentEmail: '',
    parentPhone: '',
    parentName: '',
    schoolName: '',
    
    // For Coaches
    coachingExperience: '',
    certifications: '',
    specializations: [],
    availability: [],
    
    // For Parents
    numberOfKids: 1,
    emergencyContact: '',
    emergencyPhone: '',
    
    // For Sponsors
    organizationName: '',
    sponsorshipType: '',
    sponsorshipBudget: '',
    
    // For Payment Recorders
    employmentId: '',
    department: 'Finance',
    
    // Step 3: Academy & Preferences
    academyId: '',
    academyName: 'NextGen Multisport Academy',
    sport: 'Soccer',
    programType: '',
    sponsorshipStatus: 'self_sponsored', // 'self_sponsored' or 'scholarship'
    notificationPreferences: {
      email: true,
      sms: false,
      push: true,
    },
    
    // Legal
    agreeToTerms: false,
    agreeToPrivacy: false,
    agreeToDataProcessing: false,
    parentalConsent: false, // For kids under 13
  });
  
  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSocialLoading, setIsSocialLoading] = useState({
    google: false,
    apple: false,
  });
  
  // Validation state
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  
  // Password strength
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [passwordFeedback, setPasswordFeedback] = useState('');
  
  // Email/Phone availability
  const [emailAvailable, setEmailAvailable] = useState(null);
  const [phoneAvailable, setPhoneAvailable] = useState(null);
  const [checkingAvailability, setCheckingAvailability] = useState({
    email: false,
    phone: false,
  });
  
  // Network state
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  // Photo preview
  const [photoPreview, setPhotoPreview] = useState(null);
  
  // Draft auto-save
  const [draftSaved, setDraftSaved] = useState(false);
  
  // Available roles for self-registration
  const availableRoles = [
    { value: 'parent', label: 'Parent/Guardian', icon: Users, description: 'Register your kids and track their progress' },
    { value: 'kid', label: 'Kid/Athlete', icon: Baby, description: 'Join the academy and track your attendance' },
    { value: 'coach', label: 'Coach', icon: GraduationCap, description: 'Apply to coach at the academy (requires approval)' },
    { value: 'sponsor', label: 'Sponsor', icon: Heart, description: 'Support young athletes through scholarships' },
    { value: 'payment_recorder', label: 'Payment Recorder', icon: CreditCard, description: 'Manage academy payments (requires approval)' },
  ];
  
  // Age groups for kids
  const ageGroups = ['4-6', '7-9', '10-13', '13+'];
  
  // Program types
  const programTypes = [
    'Elite Program',
    'Weekend Warrior',
    'Holiday Programme',
    'Team Support',
  ];
  
  // Coaching specializations
  const coachingSpecializations = [
    'Goalkeeper Training',
    'Defensive Tactics',
    'Offensive Strategies',
    'Youth Development',
    'Fitness & Conditioning',
    'Technical Skills',
    'Mental Coaching',
  ];
  
  // Availability slots
  const availabilitySlots = [
    'Monday 4-6 PM',
    'Wednesday 4-6 PM',
    'Friday 4-6 PM',
    'Saturday 9-11 AM',
    'Sunday 2-4:30 PM',
  ];

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
   * Load draft from localStorage
   */
  useEffect(() => {
    const savedDraft = localStorage.getItem('accellax_registration_draft');
    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft);
        
        // Ask user if they want to continue from draft
        const continueFromDraft = window.confirm(
          'You have an unfinished registration. Would you like to continue where you left off?'
        );
        
        if (continueFromDraft) {
          setFormData(prev => ({ ...prev, ...draft.formData }));
          setCurrentStep(draft.currentStep || 1);
          toast.success('Draft loaded', { icon: '📝' });
        } else {
          localStorage.removeItem('accellax_registration_draft');
        }
      } catch (error) {
        console.error('Error loading draft:', error);
      }
    }
  }, []);

  /**
   * Auto-save draft every 30 seconds
   */
  useEffect(() => {
    const saveDraft = () => {
      if (formData.name || formData.email || formData.phone) {
        const draft = {
          formData,
          currentStep,
          timestamp: new Date().toISOString(),
        };
        localStorage.setItem('accellax_registration_draft', JSON.stringify(draft));
        setDraftSaved(true);
        
        setTimeout(() => setDraftSaved(false), 2000);
      }
    };
    
    const interval = setInterval(saveDraft, 30000); // 30 seconds
    
    return () => clearInterval(interval);
  }, [formData, currentStep]);

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
      toast.error('You are offline. Registration requires internet connection.', { 
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
   * Auto-focus name input on mount
   */
  useEffect(() => {
    if (currentStep === 1) {
      nameInputRef.current?.focus();
    }
  }, [currentStep]);

  /**
   * Calculate password strength when password changes
   */
  useEffect(() => {
    if (formData.password) {
      const { strength, feedback } = calculatePasswordStrength(formData.password);
      setPasswordStrength(strength);
      setPasswordFeedback(feedback);
    } else {
      setPasswordStrength(0);
      setPasswordFeedback('');
    }
  }, [formData.password]);

  /**
   * Check email availability (debounced)
   */
  useEffect(() => {
    const checkEmail = async () => {
      if (!formData.email || !isValidEmail(formData.email)) {
        setEmailAvailable(null);
        return;
      }
      
      setCheckingAvailability(prev => ({ ...prev, email: true }));
      
      try {
        // Simulate API call (replace with actual API)
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Mock check - in production, call your API
        const exists = false; // await checkEmailExists(formData.email);
        setEmailAvailable(!exists);
        
      } catch (error) {
        console.error('Error checking email:', error);
      } finally {
        setCheckingAvailability(prev => ({ ...prev, email: false }));
      }
    };
    
    const timer = setTimeout(checkEmail, 800); // Debounce 800ms
    
    return () => clearTimeout(timer);
  }, [formData.email]);

  /**
   * Check phone availability (debounced)
   */
  useEffect(() => {
    const checkPhone = async () => {
      if (!formData.phone || !isValidPhone(formData.phone)) {
        setPhoneAvailable(null);
        return;
      }
      
      setCheckingAvailability(prev => ({ ...prev, phone: true }));
      
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Mock check
        const exists = false;
        setPhoneAvailable(!exists);
        
      } catch (error) {
        console.error('Error checking phone:', error);
      } finally {
        setCheckingAvailability(prev => ({ ...prev, phone: false }));
      }
    };
    
    const timer = setTimeout(checkPhone, 800);
    
    return () => clearTimeout(timer);
  }, [formData.phone]);

  // ==================== VALIDATION ====================
  
  /**
   * Validate single field
   */
  const validateField = (name, value) => {
    let error = '';
    
    switch (name) {
      case 'name':
        if (!value) {
          error = 'Full name is required';
        } else if (value.length < 3) {
          error = 'Name must be at least 3 characters';
        } else if (!/^[a-zA-Z\s]+$/.test(value)) {
          error = 'Name can only contain letters and spaces';
        }
        break;

      case 'username':
        if (!value) {
          error = 'Username is required';
        } else if (value.length < 3) {
          error = 'Username must be at least 3 characters';
        } else if (value.length > 30) {
          error = 'Username must be 30 characters or less';
        } else if (!/^[a-zA-Z0-9_]+$/.test(value)) {
          error = 'Username can only contain letters, numbers, and underscores';
        }
        break;
        
      case 'email':
        if (!value) {
          error = 'Email is required';
        } else if (!isValidEmail(value)) {
          error = 'Please enter a valid email address';
        } else if (emailAvailable === false) {
          error = 'This email is already registered';
        }
        break;
        
      case 'phone':
        if (!value) {
          error = 'Phone number is required';
        } else if (!isValidPhone(value)) {
          error = 'Please enter a valid Kenyan phone number';
        } else if (phoneAvailable === false) {
          error = 'This phone number is already registered';
        }
        break;
        
      case 'password':
        if (!value) {
          error = 'Password is required';
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
        } else if (value !== formData.password) {
          error = 'Passwords do not match';
        }
        break;
        
      case 'dateOfBirth':
        if (value) {
          const age = calculateAge(value);
          if (formData.role === 'kid' && age > 18) {
            error = 'Kids must be 18 years or younger';
          } else if (formData.role !== 'kid' && age < 13) {
            error = 'You must be at least 13 years old';
          }
        }
        break;
        
      case 'parentEmail':
        if (formData.role === 'kid' && calculateAge(formData.dateOfBirth) < 13) {
          if (!value) {
            error = 'Parent email is required for kids under 13';
          } else if (!isValidEmail(value)) {
            error = 'Please enter a valid parent email';
          }
        }
        break;
        
      case 'ageGroup':
        if (formData.role === 'kid' && !value) {
          error = 'Please select an age group';
        }
        break;
        
      case 'agreeToTerms':
        if (!value) {
          error = 'You must accept the Terms & Conditions';
        }
        break;
        
      case 'agreeToPrivacy':
        if (!value) {
          error = 'You must accept the Privacy Policy';
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
      // Step 1: Role selection only
      const error = validateField('role', formData.role);
      if (error) newErrors.role = error;
    } else if (step === 2) {
      // Step 2: Basic Info (name, username, email, phone, passwords)
      ['name', 'username', 'email', 'phone', 'password', 'confirmPassword'].forEach(field => {
        const error = validateField(field, formData[field]);
        if (error) newErrors[field] = error;
      });
    } else if (step === 3) {
      // Step 3: Profile Info (role-specific)
      const commonFields = ['dateOfBirth', 'gender', 'address'];
      commonFields.forEach(field => {
        const error = validateField(field, formData[field]);
        if (error) newErrors[field] = error;
      });
      
      // Role-specific validation
      if (formData.role === 'kid') {
        const kidFields = ['ageGroup', 'schoolName'];
        if (calculateAge(formData.dateOfBirth) < 13) {
          kidFields.push('parentEmail', 'parentPhone', 'parentName');
        }
        kidFields.forEach(field => {
          const error = validateField(field, formData[field]);
          if (error) newErrors[field] = error;
        });
      } else if (formData.role === 'coach') {
        if (!formData.coachingExperience) {
          newErrors.coachingExperience = 'Please describe your coaching experience';
        }
        if (formData.specializations.length === 0) {
          newErrors.specializations = 'Please select at least one specialization';
        }
      } else if (formData.role === 'sponsor') {
        if (!formData.organizationName) {
          newErrors.organizationName = 'Organization name is required';
        }
        if (!formData.sponsorshipType) {
          newErrors.sponsorshipType = 'Please select sponsorship type';
        }
      }
    } else if (step === 4) {
      // Academy & Legal validation
      ['academyName', 'sport', 'agreeToTerms', 'agreeToPrivacy'].forEach(field => {
        const error = validateField(field, formData[field]);
        if (error) newErrors[field] = error;
      });
      
      // Parental consent for kids under 13
      if (formData.role === 'kid' && calculateAge(formData.dateOfBirth) < 13) {
        if (!formData.parentalConsent) {
          newErrors.parentalConsent = 'Parental consent is required';
        }
      }
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
   * Calculate age from date of birth
   */
  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return 0;
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  /**
   * Calculate password strength
   * Returns strength (0-4) and feedback message
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
    const { name, value, type, checked, files } = e.target;
    
    let fieldValue = value;
    
    if (type === 'checkbox') {
      // Handle checkboxes
      if (name.startsWith('notificationPreferences.')) {
        const pref = name.split('.')[1];
        setFormData(prev => ({
          ...prev,
          notificationPreferences: {
            ...prev.notificationPreferences,
            [pref]: checked,
          },
        }));
        return;
      }
      fieldValue = checked;
    } else if (type === 'file') {
      // Handle file upload
      if (files && files[0]) {
        handlePhotoUpload(files[0]);
      }
      return;
    }
    
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
   * Handle multi-select change (for arrays)
   */
  const handleMultiSelectChange = (name, value) => {
    setFormData(prev => {
      const currentValues = prev[name] || [];
      const newValues = currentValues.includes(value)
        ? currentValues.filter(v => v !== value)
        : [...currentValues, value];
      
      return {
        ...prev,
        [name]: newValues,
      };
    });
    
    // Clear error
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
    if (field === 'password') {
      setShowPassword(prev => !prev);
    } else if (field === 'confirmPassword') {
      setShowConfirmPassword(prev => !prev);
    }
  };

  /**
   * Handle photo upload
   */
  const handlePhotoUpload = (file) => {
    // Validate file
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please upload an image file (JPEG, PNG, GIF, or WebP)');
      return;
    }
    
    if (file.size > maxSize) {
      toast.error('Image size must be less than 5MB');
      return;
    }
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoPreview(reader.result);
    };
    reader.readAsDataURL(file);
    
    // Store file
    setFormData(prev => ({
      ...prev,
      profilePhoto: file,
    }));
    
    toast.success('Photo uploaded successfully', { icon: '📷' });
  };

  /**
   * Remove uploaded photo
   */
  const handlePhotoRemove = () => {
    setPhotoPreview(null);
    setFormData(prev => ({
      ...prev,
      profilePhoto: null,
    }));
    if (photoInputRef.current) {
      photoInputRef.current.value = '';
    }
  };

  /**
   * Navigate to next step
   */
  const handleNextStep = () => {
    if (!validateStep(currentStep)) {
      toast.error('Please fix the errors before continuing');
      
      // Scroll to first error
      const firstErrorField = Object.keys(errors)[0];
      const element = document.querySelector(`[name="${firstErrorField}"]`);
      element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      element?.focus();
      
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
   * Handle form submission
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate final step
    if (!validateStep(currentStep)) {
      toast.error('Please fix the errors before submitting');
      return;
    }
    
    // Check internet connection
    if (!isOnline) {
      toast.error('No internet connection. Please check your network.');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Prepare registration payload
      const registrationData = {
        name: formData.name,
        username: formData.username,
        email: formData.email,
        phone: normalizePhone(formData.phone),
        password: formData.password,
        role: formData.role,
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender,
        address: formData.address,
        city: formData.city,
        country: formData.country,
        academyId: formData.academyId,
        academyName: formData.academyName,
        sport: formData.sport,
        notificationPreferences: formData.notificationPreferences,
      };
      
      // Add role-specific data
      if (formData.role === 'kid') {
        registrationData.ageGroup = formData.ageGroup;
        registrationData.schoolName = formData.schoolName;
        registrationData.programType = formData.programType;
        registrationData.sponsorshipStatus = formData.sponsorshipStatus;
        
        if (calculateAge(formData.dateOfBirth) < 13) {
          registrationData.parentEmail = formData.parentEmail;
          registrationData.parentPhone = normalizePhone(formData.parentPhone);
          registrationData.parentName = formData.parentName;
        }
      } else if (formData.role === 'coach') {
        registrationData.coachingExperience = formData.coachingExperience;
        registrationData.certifications = formData.certifications;
        registrationData.specializations = formData.specializations;
        registrationData.availability = formData.availability;
      } else if (formData.role === 'parent') {
        registrationData.numberOfKids = formData.numberOfKids;
        registrationData.emergencyContact = formData.emergencyContact;
        registrationData.emergencyPhone = normalizePhone(formData.emergencyPhone);
      } else if (formData.role === 'sponsor') {
        registrationData.organizationName = formData.organizationName;
        registrationData.sponsorshipType = formData.sponsorshipType;
        registrationData.sponsorshipBudget = formData.sponsorshipBudget;
      } else if (formData.role === 'payment_recorder') {
        registrationData.employmentId = formData.employmentId;
        registrationData.department = formData.department;
      }
      
      // Upload profile photo if exists
      if (formData.profilePhoto) {
        // In production, upload to Firebase Storage or your backend
        // const photoUrl = await uploadPhoto(formData.profilePhoto);
        // registrationData.profilePhotoUrl = photoUrl;
        registrationData.hasProfilePhoto = true;
      }
      
      // Call register function from AuthContext
      const result = await register(registrationData);
      
      // Clear draft from localStorage
      localStorage.removeItem('accellax_registration_draft');
      
      // Show success message
      toast.success(
        `Welcome to AccellaX 361°, ${formData.name}! ${
          ['coach', 'sponsor', 'payment_recorder'].includes(formData.role)
            ? 'Your account is pending approval.'
            : 'Please verify your email.'
        }`,
        { duration: 5000, icon: '🎉' }
      );
      
      // Navigate based on role
      if (['coach', 'sponsor', 'payment_recorder'].includes(formData.role)) {
        navigate('/registration-pending', { 
          state: { role: formData.role, email: formData.email } 
        });
      } else {
        navigate('/verify-email', { 
          state: { email: formData.email } 
        });
      }
      
    } catch (error) {
      console.error('Registration error:', error);
      
      // Show error message
      const errorMessage = error.message || 'Registration failed. Please try again.';
      toast.error(errorMessage, { duration: 5000 });
      
      // Set form errors if field-specific
      if (error.field) {
        setErrors(prev => ({
          ...prev,
          [error.field]: error.message,
        }));
        
        // Navigate to step with error
        if (error.step) {
          setCurrentStep(error.step);
        }
      }
      
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle Google Sign-Up
   */
  const handleGoogleRegister = async () => {
    if (!isOnline) {
      toast.error('No internet connection');
      return;
    }
    
    setIsSocialLoading(prev => ({ ...prev, google: true }));
    
    try {
      const result = await registerWithGoogle({
        role: formData.role || 'parent',
        academyName: formData.academyName,
      });
      
      toast.success(`Welcome, ${result.user.name}!`, { icon: '🎉' });
      navigate('/dashboard', { replace: true });
      
    } catch (error) {
      console.error('Google registration error:', error);
      toast.error(error.message || 'Google sign-up failed');
    } finally {
      setIsSocialLoading(prev => ({ ...prev, google: false }));
    }
  };

  /**
   * Handle Apple Sign-Up
   */
  const handleAppleRegister = async () => {
    if (!isOnline) {
      toast.error('No internet connection');
      return;
    }
    
    setIsSocialLoading(prev => ({ ...prev, apple: true }));
    
    try {
      const result = await registerWithApple({
        role: formData.role || 'parent',
        academyName: formData.academyName,
      });
      
      toast.success(`Welcome, ${result.user.name}!`, { icon: '🎉' });
      navigate('/dashboard', { replace: true });
      
    } catch (error) {
      console.error('Apple registration error:', error);
      toast.error(error.message || 'Apple sign-up failed');
    } finally {
      setIsSocialLoading(prev => ({ ...prev, apple: false }));
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
   * Check if current step is valid
   */
  const isStepValid = useMemo(() => {
    // Just check if there are errors, don't call validateStep
    return Object.keys(errors).length === 0;
  }, [errors]);

  /**
   * Get selected role details
   */
  const selectedRole = useMemo(() => {
    return availableRoles.find(r => r.value === formData.role);
  }, [formData.role]);

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
                  {step === 1 && 'Role'}
                  {step === 2 && 'Account'}
                  {step === 3 && 'Profile'}
                  {step === 4 && 'Academy'}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  /**
   * Render Step 1: Role Selection
   */
  const renderStep1 = () => {
    return (
      <div className="space-y-6">
        {/* Role Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            I am registering as a... *
          </label>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {availableRoles.map((role) => {
              const Icon = role.icon;
              const isSelected = formData.role === role.value;
              
              return (
                <button
                  key={role.value}
                  type="button"
                  onClick={() => {
                    setFormData(prev => ({ ...prev, role: role.value }));
                    setErrors(prev => ({ ...prev, role: '' }));
                  }}
                  className={`
                    p-4 border-2 rounded-lg text-left transition-all duration-200
                    hover:border-primary-300 hover:shadow-md
                    ${isSelected
                      ? 'border-primary-500 bg-primary-50 shadow-md'
                      : 'border-gray-200 bg-white'
                    }
                  `}
                >
                  <div className="flex items-start gap-3">
                    <Icon className={`w-6 h-6 mt-0.5 flex-shrink-0 ${
                      isSelected ? 'text-primary-600' : 'text-gray-400'
                    }`} />
                    <div>
                      <div className={`font-semibold mb-1 ${
                        isSelected ? 'text-primary-900' : 'text-gray-900'
                      }`}>
                        {role.label}
                      </div>
                      <div className={`text-xs ${
                        isSelected ? 'text-primary-700' : 'text-gray-500'
                      }`}>
                        {role.description}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
          
          {errors.role && (
            <p className="mt-2 text-sm text-danger-600 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {errors.role}
            </p>
          )}
        </div>
      </div>
    );
  };

  /**
   * Render Step 2: Basic Information (Name, Email, Phone, Passwords)
   */
  const renderStep2 = () => {
    return (
      <div className="space-y-6">
        {/* Full Name */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
            Full Name *
          </label>
          
          <div className="relative">
            <input
              ref={nameInputRef}
              id="name"
              name="name"
              type="text"
              required
              value={formData.name}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`
                block w-full px-4 py-3 border rounded-lg
                focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
                transition-all duration-200
                ${errors.name && touched.name 
                  ? 'border-danger-300 focus:ring-danger-500' 
                  : 'border-gray-300'
                }
              `}
              placeholder="John Doe"
            />
            
            {touched.name && !errors.name && formData.name && (
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                <CheckCircle className="h-5 w-5 text-success-500" />
              </div>
            )}
          </div>
          
          {errors.name && touched.name && (
            <p className="mt-2 text-sm text-danger-600 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {errors.name}
            </p>
          )}
        </div>

        {/*username*/}
        <div>
          <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
            Username *
          </label>
          
          <div className="relative">
            <input
              id="username"
              name="username"
              type="text"
              required
              value={formData.username}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`
                block w-full px-4 py-3 border rounded-lg
                focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
                transition-all duration-200
                ${errors.username && touched.username 
                  ? 'border-danger-300 focus:ring-danger-500' 
                  : 'border-gray-300'
                }
              `}
              placeholder="johndoe"
            />
            
            {touched.username && !errors.username && formData.username && (
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                <CheckCircle className="h-5 w-5 text-success-500" />
              </div>
            )}
          </div>
          
          {errors.username && touched.username && (
            <p className="mt-2 text-sm text-danger-600 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {errors.username}
            </p>
          )}
          
          <p className="mt-2 text-xs text-gray-500">
            Only letters, numbers, and underscores (3-30 characters)
          </p>
        </div>

        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
            Email Address *
          </label>
          
          <div className="relative">
            <input
              ref={emailInputRef}
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={formData.email}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`
                block w-full px-4 pr-10 py-3 border rounded-lg
                focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
                transition-all duration-200
                ${errors.email && touched.email 
                  ? 'border-danger-300 focus:ring-danger-500' 
                  : 'border-gray-300'
                }
              `}
              placeholder="john@example.com"
            />
            
            {/* Availability indicator */}
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              {checkingAvailability.email ? (
                <Loader2 className="h-5 w-5 text-gray-400 animate-spin" />
              ) : touched.email && !errors.email && formData.email && emailAvailable ? (
                <CheckCircle className="h-5 w-5 text-success-500" />
              ) : touched.email && emailAvailable === false ? (
                <X className="h-5 w-5 text-danger-500" />
              ) : null}
            </div>
          </div>
          
          {errors.email && touched.email && (
            <p className="mt-2 text-sm text-danger-600 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {errors.email}
            </p>
          )}
        </div>

        {/* Phone */}
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
            Phone Number *
          </label>
          
          <div className="relative">
            <input
              id="phone"
              name="phone"
              type="tel"
              autoComplete="tel"
              required
              value={formData.phone}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`
                block w-full px-4 pr-10 py-3 border rounded-lg
                focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
                transition-all duration-200
                ${errors.phone && touched.phone 
                  ? 'border-danger-300 focus:ring-danger-500' 
                  : 'border-gray-300'
                }
              `}
              placeholder="0712345678"
            />
            
            {/* Availability indicator */}
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              {checkingAvailability.phone ? (
                <Loader2 className="h-5 w-5 text-gray-400 animate-spin" />
              ) : touched.phone && !errors.phone && formData.phone && phoneAvailable ? (
                <CheckCircle className="h-5 w-5 text-success-500" />
              ) : touched.phone && phoneAvailable === false ? (
                <X className="h-5 w-5 text-danger-500" />
              ) : null}
            </div>
          </div>
          
          {errors.phone && touched.phone && (
            <p className="mt-2 text-sm text-danger-600 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {errors.phone}
            </p>
          )}
          
          {!errors.phone && (
            <p className="mt-2 text-xs text-gray-500">
              Kenyan format: 0712345678 or +254712345678
            </p>
          )}
        </div>

        {/* Password */}
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
            Password *
          </label>
          
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              required
              value={formData.password}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`
                block w-full px-4 pr-12 py-3 border rounded-lg
                focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
                transition-all duration-200
                ${errors.password && touched.password 
                  ? 'border-danger-300 focus:ring-danger-500' 
                  : 'border-gray-300'
                }
              `}
              placeholder="Create a strong password"
            />
            
            <button
              type="button"
              onClick={() => togglePasswordVisibility('password')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center hover:text-primary-600 transition-colors"
              tabIndex={-1}
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5 text-gray-400" />
              ) : (
                <Eye className="h-5 w-5 text-gray-400" />
              )}
            </button>
          </div>
          
          {/* Password strength indicator */}
          {formData.password && (
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
              <p className="text-xs text-gray-500">
                Use 8+ characters with mix of letters, numbers & symbols
              </p>
            </div>
          )}
          
          {errors.password && touched.password && (
            <p className="mt-2 text-sm text-danger-600 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {errors.password}
            </p>
          )}
        </div>

        {/* Confirm Password */}
        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
            Confirm Password *
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
              placeholder="Re-enter your password"
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
    );
  };

  /**
   * Render Step 3: Profile Information
   * (Keep the existing renderStep2 function but rename it to renderStep3)
   */

  /**
   * Render Step 3: Profile Information
   */
  const renderStep3 = () => {
    return (
      <div className="space-y-6">
        {/* Profile Photo Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Profile Photo (Optional)
          </label>
          
          <div className="flex items-center gap-4">
            {/* Photo preview */}
            <div className="relative">
              {photoPreview ? (
                <div className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-primary-100">
                  <img
                    src={photoPreview}
                    alt="Profile preview"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={handlePhotoRemove}
                    className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
                  >
                    <X className="w-6 h-6 text-white" />
                  </button>
                </div>
              ) : (
                <div className="w-24 h-24 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center">
                  <Camera className="w-8 h-8 text-gray-400" />
                </div>
              )}
            </div>
            
            {/* Upload button */}
            <div>
              <input
                ref={photoInputRef}
                type="file"
                accept="image/*"
                onChange={handleChange}
                className="hidden"
                id="profilePhoto"
                name="profilePhoto"
              />
              <label
                htmlFor="profilePhoto"
                className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <Upload className="w-4 h-4" />
                Upload Photo
              </label>
              <p className="mt-2 text-xs text-gray-500">
                JPG, PNG or GIF (max 5MB)
              </p>
            </div>
          </div>
        </div>

        {/* Date of Birth */}
        <div>
          <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700 mb-2">
            Date of Birth *
          </label>
          
          <div className="relative">
            <input
              id="dateOfBirth"
              name="dateOfBirth"
              type="date"
              required
              max={new Date().toISOString().split('T')[0]}
              value={formData.dateOfBirth}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`
                block w-full px-4 py-3 border rounded-lg
                focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
                transition-all duration-200
                ${errors.dateOfBirth && touched.dateOfBirth 
                  ? 'border-danger-300 focus:ring-danger-500' 
                  : 'border-gray-300'
                }
              `}
            />
          </div>
          
          {formData.dateOfBirth && (
            <p className="mt-2 text-sm text-gray-600">
              Age: {calculateAge(formData.dateOfBirth)} years old
            </p>
          )}
          
          {errors.dateOfBirth && touched.dateOfBirth && (
            <p className="mt-2 text-sm text-danger-600 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {errors.dateOfBirth}
            </p>
          )}
        </div>

        {/* Gender */}
        <div>
          <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-2">
            Gender *
          </label>
          
          <div className="grid grid-cols-3 gap-3">
            {['Male', 'Female', 'Other'].map((gender) => (
              <button
                key={gender}
                type="button"
                onClick={() => {
                  setFormData(prev => ({ ...prev, gender: gender.toLowerCase() }));
                  setErrors(prev => ({ ...prev, gender: '' }));
                }}
                className={`
                  px-4 py-3 border-2 rounded-lg font-medium transition-all duration-200
                  ${formData.gender === gender.toLowerCase()
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                {gender}
              </button>
            ))}
          </div>
          
          {errors.gender && touched.gender && (
            <p className="mt-2 text-sm text-danger-600 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {errors.gender}
            </p>
          )}
        </div>

        {/* Address */}
        <div>
          <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
            Address/Area of Residence *
          </label>
          
          <div className="relative">
            <textarea
              id="address"
              name="address"
              rows="2"
              required
              value={formData.address}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`
                block w-full px-4 py-3 border rounded-lg
                focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
                transition-all duration-200
                ${errors.address && touched.address 
                  ? 'border-danger-300 focus:ring-danger-500' 
                  : 'border-gray-300'
                }
              `}
              placeholder="Enter your area or neighborhood (e.g., Westlands, Nairobi)"
            />
          </div>
          
          {errors.address && touched.address && (
            <p className="mt-2 text-sm text-danger-600 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {errors.address}
            </p>
          )}
        </div>

        {/* Role-specific fields */}
        {formData.role === 'kid' && (
          <>
            {/* Age Group */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Age Group *
              </label>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {ageGroups.map((group) => (
                  <button
                    key={group}
                    type="button"
                    onClick={() => {
                      setFormData(prev => ({ ...prev, ageGroup: group }));
                      setErrors(prev => ({ ...prev, ageGroup: '' }));
                    }}
                    className={`
                      px-4 py-3 border-2 rounded-lg font-medium transition-all duration-200
                      ${formData.ageGroup === group
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                      }
                    `}
                  >
                    {group} years
                  </button>
                ))}
              </div>
              
              {errors.ageGroup && touched.ageGroup && (
                <p className="mt-2 text-sm text-danger-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.ageGroup}
                </p>
              )}
            </div>

            {/* School Name */}
            <div>
              <label htmlFor="schoolName" className="block text-sm font-medium text-gray-700 mb-2">
                School Name *
              </label>
              
              <div className="relative">
                <input
                  id="schoolName"
                  name="schoolName"
                  type="text"
                  required
                  value={formData.schoolName}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Enter your school name"
                />
              </div>
            </div>

            {/* Parent/Guardian Info (if under 13) */}
            {calculateAge(formData.dateOfBirth) < 13 && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-4">
                <div className="flex items-start gap-2">
                  <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-blue-900 mb-1">
                      Parent/Guardian Information Required
                    </h4>
                    <p className="text-sm text-blue-700">
                      Since you're under 13, we need your parent or guardian's contact information.
                    </p>
                  </div>
                </div>

                {/* Parent Name */}
                <div>
                  <label htmlFor="parentName" className="block text-sm font-medium text-gray-700 mb-2">
                    Parent/Guardian Name *
                  </label>
                  <input
                    id="parentName"
                    name="parentName"
                    type="text"
                    required
                    value={formData.parentName}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Full name"
                  />
                </div>

                {/* Parent Email */}
                <div>
                  <label htmlFor="parentEmail" className="block text-sm font-medium text-gray-700 mb-2">
                    Parent/Guardian Email *
                  </label>
                  <input
                    id="parentEmail"
                    name="parentEmail"
                    type="email"
                    required
                    value={formData.parentEmail}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="parent@example.com"
                  />
                  {errors.parentEmail && touched.parentEmail && (
                    <p className="mt-1 text-sm text-danger-600">{errors.parentEmail}</p>
                  )}
                </div>

                {/* Parent Phone */}
                <div>
                  <label htmlFor="parentPhone" className="block text-sm font-medium text-gray-700 mb-2">
                    Parent/Guardian Phone *
                  </label>
                  <input
                    id="parentPhone"
                    name="parentPhone"
                    type="tel"
                    required
                    value={formData.parentPhone}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="0712345678"
                  />
                </div>
              </div>
            )}
          </>
        )}

        {formData.role === 'coach' && (
          <>
            {/* Coaching Experience */}
            <div>
              <label htmlFor="coachingExperience" className="block text-sm font-medium text-gray-700 mb-2">
                Coaching Experience *
              </label>
              <textarea
                id="coachingExperience"
                name="coachingExperience"
                rows="4"
                required
                value={formData.coachingExperience}
                onChange={handleChange}
                onBlur={handleBlur}
                className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Describe your coaching experience, teams you've coached, achievements, etc."
              />
              {errors.coachingExperience && (
                <p className="mt-2 text-sm text-danger-600">{errors.coachingExperience}</p>
              )}
            </div>

            {/* Certifications */}
            <div>
              <label htmlFor="certifications" className="block text-sm font-medium text-gray-700 mb-2">
                Certifications (Optional)
              </label>
              <textarea
                id="certifications"
                name="certifications"
                rows="2"
                value={formData.certifications}
                onChange={handleChange}
                className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="List your coaching certifications (e.g., CAF License C, UEFA B)"
              />
            </div>

            {/* Specializations */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Coaching Specializations *
              </label>
              <div className="grid grid-cols-2 gap-2">
                {coachingSpecializations.map((spec) => (
                  <button
                    key={spec}
                    type="button"
                    onClick={() => handleMultiSelectChange('specializations', spec)}
                    className={`
                      px-3 py-2 text-sm border rounded-lg transition-all duration-200
                      ${formData.specializations.includes(spec)
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                      }
                    `}
                  >
                    <Check className={`w-4 h-4 inline mr-1 ${
                      formData.specializations.includes(spec) ? 'opacity-100' : 'opacity-0'
                    }`} />
                    {spec}
                  </button>
                ))}
              </div>
              {errors.specializations && (
                <p className="mt-2 text-sm text-danger-600">{errors.specializations}</p>
              )}
            </div>

            {/* Availability */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Availability
              </label>
              <div className="space-y-2">
                {availabilitySlots.map((slot) => (
                  <label key={slot} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.availability.includes(slot)}
                      onChange={() => handleMultiSelectChange('availability', slot)}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-700">{slot}</span>
                  </label>
                ))}
              </div>
            </div>
          </>
        )}

        {formData.role === 'parent' && (
          <>
            {/* Number of Kids */}
            <div>
              <label htmlFor="numberOfKids" className="block text-sm font-medium text-gray-700 mb-2">
                Number of Kids to Register
              </label>
              <input
                id="numberOfKids"
                name="numberOfKids"
                type="number"
                min="1"
                max="10"
                value={formData.numberOfKids}
                onChange={handleChange}
                className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <p className="mt-2 text-xs text-gray-500">
                You can add more kids to your account after registration
              </p>
            </div>

            {/* Emergency Contact */}
            <div>
              <label htmlFor="emergencyContact" className="block text-sm font-medium text-gray-700 mb-2">
                Emergency Contact Name
              </label>
              <input
                id="emergencyContact"
                name="emergencyContact"
                type="text"
                value={formData.emergencyContact}
                onChange={handleChange}
                className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Alternative contact person"
              />
            </div>

            {/* Emergency Phone */}
            <div>
              <label htmlFor="emergencyPhone" className="block text-sm font-medium text-gray-700 mb-2">
                Emergency Contact Phone
              </label>
              <input
                id="emergencyPhone"
                name="emergencyPhone"
                type="tel"
                value={formData.emergencyPhone}
                onChange={handleChange}
                className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="0712345678"
              />
            </div>
          </>
        )}

        {formData.role === 'sponsor' && (
          <>
            {/* Organization Name */}
            <div>
              <label htmlFor="organizationName" className="block text-sm font-medium text-gray-700 mb-2">
                Organization/Company Name *
              </label>
              <div className="relative">
                <input
                  id="organizationName"
                  name="organizationName"
                  type="text"
                  required
                  value={formData.organizationName}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Your organization or company"
                />
              </div>
              {errors.organizationName && (
                <p className="mt-2 text-sm text-danger-600">{errors.organizationName}</p>
              )}
            </div>

            {/* Sponsorship Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sponsorship Type *
              </label>
              <div className="space-y-2">
                {['Full Scholarship', 'Partial Scholarship', 'Equipment Donation', 'Facility Support', 'Other'].map((type) => (
                  <label key={type} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="sponsorshipType"
                      value={type.toLowerCase().replace(' ', '_')}
                      checked={formData.sponsorshipType === type.toLowerCase().replace(' ', '_')}
                      onChange={handleChange}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                    />
                    <span className="text-sm text-gray-700">{type}</span>
                  </label>
                ))}
              </div>
              {errors.sponsorshipType && (
                <p className="mt-2 text-sm text-danger-600">{errors.sponsorshipType}</p>
              )}
            </div>

            {/* Sponsorship Budget */}
            <div>
              <label htmlFor="sponsorshipBudget" className="block text-sm font-medium text-gray-700 mb-2">
                Annual Budget (Optional)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="text-gray-500">KES</span>
                </div>
                <input
                  id="sponsorshipBudget"
                  name="sponsorshipBudget"
                  type="text"
                  value={formData.sponsorshipBudget}
                  onChange={handleChange}
                  className="block w-full pl-14 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="100,000"
                />
              </div>
            </div>
          </>
        )}

        {formData.role === 'payment_recorder' && (
          <>
            {/* Employment ID */}
            <div>
              <label htmlFor="employmentId" className="block text-sm font-medium text-gray-700 mb-2">
                Employment/Staff ID
              </label>
              <input
                id="employmentId"
                name="employmentId"
                type="text"
                value={formData.employmentId}
                onChange={handleChange}
                className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="EMP-12345"
              />
            </div>

            {/* Department */}
            <div>
              <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-2">
                Department
              </label>
              <select
                id="department"
                name="department"
                value={formData.department}
                onChange={handleChange}
                className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="Finance">Finance</option>
                <option value="Administration">Administration</option>
                <option value="Operations">Operations</option>
              </select>
            </div>
          </>
        )}
      </div>
    );
  };

  /**
   * Render Step 4: Academy & Legal
   */
  const renderStep4 = () => {
    return (
      <div className="space-y-6">
        {/* Academy Selection */}
        <div>
          <label htmlFor="academyName" className="block text-sm font-medium text-gray-700 mb-2">
            Academy *
          </label>
          <div className="relative">
            <input
              id="academyName"
              name="academyName"
              type="text"
              required
              value={formData.academyName}
              onChange={handleChange}
              className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="NextGen Multisport Academy"
              readOnly
            />
          </div>
          <p className="mt-2 text-xs text-gray-500">
            Currently, only NextGen Multisport Academy is available
          </p>
        </div>

        {/* Sport Selection */}
        <div>
          <label htmlFor="sport" className="block text-sm font-medium text-gray-700 mb-2">
            Sport *
          </label>
          <select
            id="sport"
            name="sport"
            required
            value={formData.sport}
            onChange={handleChange}
            className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="Soccer">Soccer</option>
            <option value="Basketball">Basketball (Coming Soon)</option>
            <option value="Volleyball">Volleyball (Coming Soon)</option>
          </select>
        </div>

        {/* Program Type (for kids) */}
        {formData.role === 'kid' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Program Type
            </label>
            <div className="grid grid-cols-2 gap-3">
              {programTypes.map((program) => (
                <button
                  key={program}
                  type="button"
                  onClick={() => {
                    setFormData(prev => ({ ...prev, programType: program }));
                  }}
                  className={`
                    px-4 py-3 text-sm border-2 rounded-lg font-medium transition-all duration-200
                    ${formData.programType === program
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  {program}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Sponsorship Status (for kids) */}
        {formData.role === 'kid' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sponsorship Status
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setFormData(prev => ({ ...prev, sponsorshipStatus: 'self_sponsored' }));
                }}
                className={`
                  px-4 py-3 border-2 rounded-lg transition-all duration-200
                  ${formData.sponsorshipStatus === 'self_sponsored'
                    ? 'border-success-500 bg-success-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                  }
                `}
              >
                <div className="flex items-center justify-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${
                    formData.sponsorshipStatus === 'self_sponsored' ? 'bg-success-500' : 'bg-gray-300'
                  }`} />
                  <span className="font-medium">Self-Sponsored (SP)</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setFormData(prev => ({ ...prev, sponsorshipStatus: 'scholarship' }));
                }}
                className={`
                  px-4 py-3 border-2 rounded-lg transition-all duration-200
                  ${formData.sponsorshipStatus === 'scholarship'
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                  }
                `}
              >
                <div className="flex items-center justify-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${
                    formData.sponsorshipStatus === 'scholarship' ? 'bg-primary-500' : 'bg-gray-300'
                  }`} />
                  <span className="font-medium">Scholarship (SC)</span>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Notification Preferences */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Notification Preferences
          </label>
          <div className="space-y-3 bg-gray-50 p-4 rounded-lg">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="notificationPreferences.email"
                checked={formData.notificationPreferences.email}
                onChange={(e) => {
                  setFormData(prev => ({
                    ...prev,
                    notificationPreferences: {
                      ...prev.notificationPreferences,
                      email: e.target.checked,
                    },
                  }));
                }}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <div>
                <span className="text-sm font-medium text-gray-900">Email Notifications</span>
                <p className="text-xs text-gray-500">Receive updates via email</p>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="notificationPreferences.sms"
                checked={formData.notificationPreferences.sms}
                onChange={handleChange}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <div>
                <span className="text-sm font-medium text-gray-900">SMS Notifications</span>
                <p className="text-xs text-gray-500">Receive updates via SMS (standard rates apply)</p>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="notificationPreferences.push"
                checked={formData.notificationPreferences.push}
                onChange={handleChange}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <div>
                <span className="text-sm font-medium text-gray-900">Push Notifications</span>
                <p className="text-xs text-gray-500">Receive in-app notifications</p>
              </div>
            </label>
          </div>
        </div>

        {/* Legal Agreements */}
        <div className="space-y-4 border-t pt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Legal Agreements
          </h3>

          {/* Terms & Conditions */}
          <label className="flex items-start gap-3 cursor-pointer group">
            <input
              type="checkbox"
              name="agreeToTerms"
              checked={formData.agreeToTerms}
              onChange={(e) => {
                setFormData(prev => ({ ...prev, agreeToTerms: e.target.checked }));
              }}
              className="h-4 w-4 mt-1 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <div>
              <span className="text-sm text-gray-900">
                I agree to the{' '}
                <Link to="/terms" className="text-primary-600 hover:text-primary-700 underline" target="_blank">
                  Terms & Conditions
                </Link>
                {' *'}
              </span>
              {errors.agreeToTerms && (
                <p className="mt-1 text-sm text-danger-600">{errors.agreeToTerms}</p>
              )}
            </div>
          </label>

          {/* Privacy Policy */}
          <label className="flex items-start gap-3 cursor-pointer group">
            <input
              type="checkbox"
              name="agreeToPrivacy"
              checked={formData.agreeToPrivacy}
              onChange={handleChange}
              className="h-4 w-4 mt-1 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <div>
              <span className="text-sm text-gray-900">
                I agree to the{' '}
                <Link to="/privacy" className="text-primary-600 hover:text-primary-700 underline" target="_blank">
                  Privacy Policy
                </Link>
                {' *'}
              </span>
              {errors.agreeToPrivacy && (
                <p className="mt-1 text-sm text-danger-600">{errors.agreeToPrivacy}</p>
              )}
            </div>
          </label>

          {/* Data Processing Consent */}
          <label className="flex items-start gap-3 cursor-pointer group">
            <input
              type="checkbox"
              name="agreeToDataProcessing"
              checked={formData.agreeToDataProcessing}
              onChange={handleChange}
              className="h-4 w-4 mt-1 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <div>
              <span className="text-sm text-gray-900">
                I consent to the processing of my personal data as described in the Privacy Policy (GDPR)
              </span>
            </div>
          </label>

          {/* Parental Consent (for kids under 13) */}
          {formData.role === 'kid' && calculateAge(formData.dateOfBirth) < 13 && (
            <label className="flex items-start gap-3 cursor-pointer group p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <input
                type="checkbox"
                name="parentalConsent"
                checked={formData.parentalConsent}
                onChange={handleChange}
                className="h-4 w-4 mt-1 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <div>
                <span className="text-sm font-medium text-blue-900">
                  Parental Consent Required *
                </span>
                <p className="text-xs text-blue-700 mt-1">
                  I confirm that I am the parent/legal guardian of this child and consent to their registration
                  and participation in academy activities.
                </p>
                {errors.parentalConsent && (
                  <p className="mt-1 text-sm text-danger-600">{errors.parentalConsent}</p>
                )}
              </div>
            </label>
          )}
        </div>

        {/* Pending Approval Notice (for certain roles) */}
        {['coach', 'sponsor', 'payment_recorder'].includes(formData.role) && (
          <div className="p-4 bg-warning-50 border border-warning-200 rounded-lg flex items-start gap-3">
            <Info className="w-5 h-5 text-warning-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-warning-900 mb-1">
                Account Approval Required
              </h4>
              <p className="text-sm text-warning-700">
                Your {selectedRole?.label} account will be reviewed by academy administrators.
                You'll receive an email once your account is approved.
              </p>
            </div>
          </div>
        )}
      </div>
    );
  };

  // ==================== MAIN RENDER ====================
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50 py-12 px-4">
      {/* Offline Banner */}
      {!isOnline && (
        <div className="fixed top-0 left-0 right-0 bg-danger-500 text-white py-3 px-4 flex items-center justify-center gap-2 z-50 shadow-lg">
          <WifiOff className="w-5 h-5" />
          <span className="font-medium">You are offline. Registration requires an internet connection.</span>
        </div>
      )}

      {/* Draft Saved Indicator */}
      {draftSaved && (
        <div className="fixed top-4 right-4 bg-success-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 z-40 animate-fade-in-out">
          <Check className="w-4 h-4" />
          <span className="text-sm font-medium">Draft saved</span>
        </div>
      )}

      {/* Main Container - Two Column Layout */}
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          
          {/* LEFT COLUMN - Branding & Expedition */}
          <div className="order-1 space-y-8">
            {/* Logo and Header */}
            <div className="text-center">
              <Link to="/" className="inline-flex items-center justify-center w-16 h-16 bg-primary-500 rounded-2xl shadow-lg mb-4">
                <Shield className="w-10 h-10 text-white" />
              </Link>
              
              <h1 className="text-3xl md:text-4xl font-display font-bold text-gray-900 mb-2">
                Join AccellaX 361°
              </h1>
              
              <p className="text-gray-600 text-lg">
                Create your account to get started
              </p>
            </div>

            {/* Expedition Card - Hidden on mobile */}
            <div className="hidden lg:block bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700 rounded-2xl shadow-2xl overflow-hidden">
              <div className="p-8 relative">
                {/* Background Pattern */}
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
                    Expedition is the easiest way to get started on AccellaX 361°
                  </p>

                  <button
                    onClick={() => navigate('/expedition')}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-white text-orange-600 font-semibold rounded-lg hover:bg-orange-50 transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    Learn more »
                  </button>
                </div>

                {/* Robot SVG */}
                <div className="mt-8 flex justify-center">
                  <div className="w-48 h-48 relative">
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

                {/* Decorative Bottom Line */}
                <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-r from-orange-700 via-orange-600 to-orange-500"></div>
              </div>
            </div>
          </div>
          {/* END LEFT COLUMN */}

          {/* RIGHT COLUMN - Registration Form */}
          <div className="order-2">
            {/* Registration Card */}
            <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
          {/* Step Indicator */}
          {renderStepIndicator()}

          {/* Form */}
          <form onSubmit={handleSubmit}>
            {/* Step Content */}
            {currentStep === 1 && renderStep1()}
            {currentStep === 2 && renderStep2()}
            {currentStep === 3 && renderStep3()}
            {currentStep === 4 && renderStep4()}

            {/* Navigation Buttons */}
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
                <Link
                  to="/login"
                  className="flex items-center gap-2 px-6 py-3 text-gray-600 hover:text-gray-900 transition-colors font-medium"
                >
                  <ArrowLeft className="w-5 h-5" />
                  Back to Login
                </Link>
              )}

              {currentStep < totalSteps ? (
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium shadow-sm"
                >
                  Next
                  <ArrowRight className="w-5 h-5" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isLoading || !isOnline}
                  className={`
                    flex items-center gap-2 px-6 py-3 rounded-lg font-medium shadow-sm
                    transition-all duration-200
                    ${isLoading || !isOnline
                      ? 'bg-gray-400 cursor-not-allowed text-white'
                      : 'bg-success-600 text-white hover:bg-success-700 active:scale-95'
                    }
                  `}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-5 h-5" />
                      Create Account
                    </>
                  )}
                </button>
              )}
            </div>
          </form>

          {/* Social Registration (Step 1 only) */}
          {currentStep === 1 && (
            <>
              <div className="mt-8">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">Or sign up with</span>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-4">
                  {/* Google Sign Up */}
                  <button
                    type="button"
                    onClick={handleGoogleRegister}
                    disabled={isSocialLoading.google || !isOnline}
                    className="flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSocialLoading.google ? (
                      <Loader2 className="w-5 h-5 animate-spin text-gray-600" />
                    ) : (
                      <Chrome className="w-5 h-5 text-gray-600" />
                    )}
                    <span className="font-medium text-gray-700">Google</span>
                  </button>

                  {/* Apple Sign Up */}
                  <button
                    type="button"
                    onClick={handleAppleRegister}
                    disabled={isSocialLoading.apple || !isOnline}
                    className="flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSocialLoading.apple ? (
                      <Loader2 className="w-5 h-5 animate-spin text-gray-900" />
                    ) : (
                      <Apple className="w-5 h-5 text-gray-900" />
                    )}
                    <span className="font-medium text-gray-700">Apple</span>
                  </button>
                </div>
              </div>
            </>
          )}
            </div>
          </div>
          {/* END RIGHT COLUMN */}

        </div>
        {/* END Two Column Layout */}

        {/* Already have an account */}
        <p className="mt-8 text-center text-gray-600">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-primary-600 hover:text-primary-700 transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;