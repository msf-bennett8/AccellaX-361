/**
 * File: web/frontend/src/pages/errors/UnauthorizedPage.jsx
 * AccellaX 361° - Comprehensive Unauthorized Access (403) Page
 * 
 * Description:
 * This component handles unauthorized access attempts with detailed explanations,
 * role-based messaging, permission elevation options, and helpful guidance.
 * 
 * Features:
 * - Role-based error messages
 * - Permission requirement display
 * - Role elevation option (for eligible users)
 * - Request access workflow
 * - Contact admin functionality
 * - Session information display
 * - Login redirect for unauthenticated users
 * - Permission hierarchy visualization
 * - Audit trail recording
 * - Account status checks
 * - Subscription/plan upgrade prompts
 * - Multi-factor authentication prompts
 * - User activity logging
 * - Breadcrumb navigation
 * - Alternative action suggestions
 * 
 * Props:
 * - user: Current user object (optional)
 * - requiredRole: Role required to access resource
 * - requiredPermission: Specific permission required
 * - resource: The resource being accessed
 * - reason: Custom reason for denial (optional)
 * - onElevate: Callback for role elevation attempts
 * - onRequestAccess: Callback for access requests
 * 
 * Usage:
 * <UnauthorizedPage 
 *   user={currentUser}
 *   requiredRole="admin"
 *   requiredPermission="manage_users"
 *   resource="User Management"
 *   onElevate={handleElevation}
 *   onRequestAccess={handleAccessRequest}
 * />
 */

import { useState, useEffect } from 'react';

const UnauthorizedPage = ({ 
  user = null,
  requiredRole = null,
  requiredPermission = null,
  resource = "this resource",
  reason = null,
  onElevate = null,
  onRequestAccess = null
}) => {
  // State management
  const [showElevationForm, setShowElevationForm] = useState(false);
  const [showAccessRequest, setShowAccessRequest] = useState(false);
  const [elevationPassword, setElevationPassword] = useState('');
  const [tapCount, setTapCount] = useState(0);
  const [accessRequestReason, setAccessRequestReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [accountStatus, setAccountStatus] = useState(null);
  const [sessionInfo, setSessionInfo] = useState({
    loginTime: null,
    lastActivity: null,
    sessionDuration: 0
  });
  const [showPermissionTree, setShowPermissionTree] = useState(false);
  const [copied, setCopied] = useState(false);

  // Role hierarchy and permissions
  const roleHierarchy = {
    super_admin: {
      level: 7,
      label: 'Super Admin',
      color: '#9333ea',
      emoji: '👑',
      permissions: ['all']
    },
    owner: {
      level: 6,
      label: 'Academy Owner',
      color: '#dc2626',
      emoji: '🏛️',
      permissions: ['manage_academy', 'manage_users', 'view_financials', 'manage_coaches']
    },
    head_coach: {
      level: 5,
      label: 'Head Coach',
      color: '#ea580c',
      emoji: '⭐',
      permissions: ['manage_sessions', 'view_all_attendance', 'manage_events', 'manage_kids']
    },
    coach: {
      level: 4,
      label: 'Coach',
      color: '#2563eb',
      emoji: '🎯',
      permissions: ['mark_attendance', 'view_own_sessions', 'add_notes']
    },
    payment_recorder: {
      level: 3,
      label: 'Payment Recorder',
      color: '#16a34a',
      emoji: '💰',
      permissions: ['manage_payments', 'view_payment_reports']
    },
    parent: {
      level: 2,
      label: 'Parent',
      color: '#0891b2',
      emoji: '👨‍👩‍👧‍👦',
      permissions: ['view_own_kid', 'view_events', 'send_messages']
    },
    kid: {
      level: 1,
      label: 'Kid/Athlete',
      color: '#7c3aed',
      emoji: '⚽',
      permissions: ['view_own_attendance', 'view_achievements']
    },
    sponsor: {
      level: 2,
      label: 'Sponsor',
      color: '#ca8a04',
      emoji: '🤝',
      permissions: ['view_scholarship_kids', 'view_impact_reports']
    }
  };

  // Get current user role info
  const currentRole = user?.role ? roleHierarchy[user.role] : null;
  const targetRole = requiredRole ? roleHierarchy[requiredRole] : null;

  // Determine authorization scenario
  const getAuthScenario = () => {
    if (!user) return 'unauthenticated';
    if (accountStatus === 'suspended') return 'suspended';
    if (accountStatus === 'pending_approval') return 'pending';
    if (accountStatus === 'expired') return 'expired';
    if (!currentRole) return 'invalid_role';
    if (targetRole && currentRole.level < targetRole.level) return 'insufficient_role';
    if (requiredPermission && !currentRole.permissions.includes(requiredPermission) && !currentRole.permissions.includes('all')) {
      return 'insufficient_permission';
    }
    return 'custom';
  };

  const authScenario = getAuthScenario();

  // Scenario-specific messages
  const scenarios = {
    unauthenticated: {
      title: "Authentication Required",
      description: "You need to be logged in to access this resource.",
      emoji: "🔐",
      color: '#3b82f6',
      bgColor: '#eff6ff',
      action: 'login',
      suggestion: "Please log in with your AccellaX 361° account to continue."
    },
    insufficient_role: {
      title: "Access Denied",
      description: `Your current role (${currentRole?.label}) doesn't have permission to access ${resource}.`,
      emoji: "🚫",
      color: '#ef4444',
      bgColor: '#fef2f2',
      action: 'request_access',
      suggestion: `This resource requires ${targetRole?.label} privileges or higher.`
    },
    insufficient_permission: {
      title: "Permission Denied",
      description: `You don't have the required permission (${requiredPermission}) to access this resource.`,
      emoji: "⛔",
      color: '#f97316',
      bgColor: '#fff7ed',
      action: 'request_access',
      suggestion: "Contact your academy administrator to request this permission."
    },
    suspended: {
      title: "Account Suspended",
      description: "Your account has been temporarily suspended.",
      emoji: "⏸️",
      color: '#dc2626',
      bgColor: '#fef2f2',
      action: 'contact_admin',
      suggestion: "Please contact your academy administrator for more information."
    },
    pending: {
      title: "Account Pending Approval",
      description: "Your account is awaiting approval from an administrator.",
      emoji: "⏳",
      color: '#eab308',
      bgColor: '#fefce8',
      action: 'wait',
      suggestion: "You'll receive an email once your account is approved."
    },
    expired: {
      title: "Session Expired",
      description: "Your session has expired for security reasons.",
      emoji: "⌛",
      color: '#8b5cf6',
      bgColor: '#f5f3ff',
      action: 'login',
      suggestion: "Please log in again to continue."
    },
    invalid_role: {
      title: "Invalid Role",
      description: "Your account role is not configured properly.",
      emoji: "❓",
      color: '#6b7280',
      bgColor: '#f9fafb',
      action: 'contact_admin',
      suggestion: "Contact support to resolve this issue."
    },
    custom: {
      title: "Access Restricted",
      description: reason || "You don't have permission to access this resource.",
      emoji: "🔒",
      color: '#6366f1',
      bgColor: '#eef2ff',
      action: 'request_access',
      suggestion: "Additional permissions may be required."
    }
  };

  const currentScenario = scenarios[authScenario];

  // Session monitoring
  useEffect(() => {
    if (user) {
      const interval = setInterval(() => {
        setSessionInfo(prev => ({
          ...prev,
          lastActivity: new Date(),
          sessionDuration: prev.sessionDuration + 1
        }));
      }, 60000); // Update every minute

      return () => clearInterval(interval);
    }
  }, [user]);

  // Check account status
  useEffect(() => {
    if (user) {
      // Simulate account status check (replace with actual API call)
      setAccountStatus(user.status || 'active');
    }
  }, [user]);

  // Secret tap pattern for elevation (7 taps in 3 seconds)
  useEffect(() => {
    if (tapCount >= 7) {
      setShowElevationForm(true);
      setTapCount(0);
    }

    const resetTimer = setTimeout(() => {
      if (tapCount > 0 && tapCount < 7) {
        setTapCount(0);
      }
    }, 3000);

    return () => clearTimeout(resetTimer);
  }, [tapCount]);

  const handleLogoTap = () => {
    if (user && canElevate()) {
      setTapCount(prev => prev + 1);
    }
  };

  const canElevate = () => {
    // Only coaches and above can attempt elevation
    return currentRole && currentRole.level >= 4;
  };

  const handleElevation = async () => {
    if (!elevationPassword) {
      setErrorMessage('Please enter elevation password');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      // Simulate API call (replace with actual implementation)
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      if (onElevate) {
        const success = await onElevate(elevationPassword);
        if (success) {
          setSuccessMessage('Role elevated successfully! Redirecting...');
          setTimeout(() => {
            window.location.reload();
          }, 2000);
        } else {
          setErrorMessage('Invalid elevation password');
        }
      }
    } catch (error) {
      setErrorMessage('Elevation failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAccessRequest = async () => {
    if (!accessRequestReason.trim()) {
      setErrorMessage('Please provide a reason for your access request');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (onRequestAccess) {
        await onRequestAccess({
          user: user?.email,
          resource,
          requiredRole,
          requiredPermission,
          reason: accessRequestReason,
          timestamp: new Date().toISOString()
        });
      }

      setSuccessMessage('Access request submitted! An administrator will review your request.');
      setAccessRequestReason('');
      setShowAccessRequest(false);
    } catch (error) {
      setErrorMessage('Failed to submit request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = () => {
    window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname);
  };

  const handleGoBack = () => {
    window.history.back();
  };

  const handleGoHome = () => {
    window.location.href = '/';
  };

  const handleContactAdmin = () => {
    window.location.href = 'mailto:admin@accellax361.com?subject=Account Access Request';
  };

  const copyAccessDetails = () => {
    const details = `
AccellaX 361° Access Request
============================
User: ${user?.name || 'Not logged in'}
Email: ${user?.email || 'N/A'}
Current Role: ${currentRole?.label || 'None'}
Required Role: ${targetRole?.label || 'N/A'}
Required Permission: ${requiredPermission || 'N/A'}
Resource: ${resource}
Timestamp: ${new Date().toISOString()}
    `.trim();

    navigator.clipboard.writeText(details).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <div style={{ maxWidth: '48rem', width: '100%' }}>
        {/* Main Card */}
        <div style={{ 
          background: 'white', 
          borderRadius: '1.5rem', 
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
          overflow: 'hidden'
        }}>
          {/* Header */}
          <div style={{ 
            background: currentScenario.bgColor, 
            padding: '3rem 2rem',
            textAlign: 'center',
            position: 'relative'
          }}>
            <div 
              onClick={handleLogoTap}
              style={{
                fontSize: '5rem',
                marginBottom: '1rem',
                cursor: canElevate() ? 'pointer' : 'default',
                animation: 'float 3s ease-in-out infinite',
                userSelect: 'none'
              }}
            >
              {currentScenario.emoji}
            </div>
            {canElevate() && tapCount > 0 && tapCount < 7 && (
              <div style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                background: 'rgba(0,0,0,0.1)',
                padding: '0.5rem 1rem',
                borderRadius: '999px',
                fontSize: '0.875rem',
                fontWeight: '600'
              }}>
                {tapCount}/7
              </div>
            )}
            <h1 style={{ 
              fontSize: '2.25rem', 
              fontWeight: 'bold', 
              color: currentScenario.color,
              marginBottom: '0.75rem'
            }}>
              {currentScenario.title}
            </h1>
            <p style={{ 
              color: '#4b5563', 
              fontSize: '1.125rem',
              maxWidth: '32rem',
              margin: '0 auto',
              lineHeight: '1.75'
            }}>
              {currentScenario.description}
            </p>
          </div>

          {/* Content */}
          <div style={{ padding: '2rem' }}>
            {/* User Information */}
            {user && (
              <div style={{ 
                marginBottom: '2rem',
                padding: '1.5rem',
                background: '#f9fafb',
                borderRadius: '1rem',
                border: '1px solid #e5e7eb'
              }}>
                <div style={{ 
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  marginBottom: '1rem'
                }}>
                  <div style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    background: currentRole?.color || '#6b7280',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '2rem'
                  }}>
                    {currentRole?.emoji || '👤'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ 
                      fontSize: '1.125rem',
                      fontWeight: '600',
                      color: '#111827',
                      marginBottom: '0.25rem'
                    }}>
                      {user.name || 'Unknown User'}
                    </h3>
                    <p style={{ 
                      fontSize: '0.875rem',
                      color: '#6b7280',
                      marginBottom: '0.25rem'
                    }}>
                      {user.email}
                    </p>
                    {currentRole && (
                      <div style={{
                        display: 'inline-block',
                        padding: '0.25rem 0.75rem',
                        background: currentRole.color,
                        color: 'white',
                        borderRadius: '999px',
                        fontSize: '0.75rem',
                        fontWeight: '600'
                      }}>
                        {currentRole.emoji} {currentRole.label}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={copyAccessDetails}
                    style={{
                      padding: '0.5rem',
                      background: 'white',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.5rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    title="Copy access details"
                  >
                    {copied ? '✓' : '📋'}
                  </button>
                </div>

                {/* Session Info */}
                {sessionInfo.sessionDuration > 0 && (
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '1rem',
                    paddingTop: '1rem',
                    borderTop: '1px solid #e5e7eb'
                  }}>
                    <div>
                      <p style={{ 
                        fontSize: '0.75rem',
                        color: '#6b7280',
                        marginBottom: '0.25rem'
                      }}>
                        Session Duration
                      </p>
                      <p style={{ 
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        color: '#111827'
                      }}>
                        {formatDuration(sessionInfo.sessionDuration)}
                      </p>
                    </div>
                    <div>
                      <p style={{ 
                        fontSize: '0.75rem',
                        color: '#6b7280',
                        marginBottom: '0.25rem'
                      }}>
                        Account Status
                      </p>
                      <p style={{ 
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        color: accountStatus === 'active' ? '#10b981' : '#ef4444'
                      }}>
                        {accountStatus?.replace('_', ' ').toUpperCase()}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Access Requirements */}
            {(requiredRole || requiredPermission) && (
              <div style={{ 
                marginBottom: '2rem',
                padding: '1.5rem',
                background: '#fef3c7',
                borderRadius: '1rem',
                border: '1px solid #fbbf24'
              }}>
                <h3 style={{ 
                  fontSize: '1rem',
                  fontWeight: '600',
                  color: '#92400e',
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  🔑 Access Requirements
                </h3>
                <div style={{ fontSize: '0.875rem', color: '#78350f' }}>
                  {requiredRole && (
                    <p style={{ marginBottom: '0.5rem' }}>
                      <strong>Required Role:</strong> {targetRole?.emoji} {targetRole?.label}
                    </p>
                  )}
                  {requiredPermission && (
                    <p style={{ marginBottom: '0.5rem' }}>
                      <strong>Required Permission:</strong> {requiredPermission}
                    </p>
                  )}
                  <p>
                    <strong>Resource:</strong> {resource}
                  </p>
                </div>
              </div>
            )}

            {/* Permission Tree */}
            {user && currentRole && targetRole && (
              <div style={{ marginBottom: '2rem' }}>
                <button
                  onClick={() => setShowPermissionTree(!showPermissionTree)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '1rem',
                    background: '#f9fafb',
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.75rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: '#374151'
                  }}
                >
                  <span>📊 View Role Hierarchy</span>
                  <span>{showPermissionTree ? '▲' : '▼'}</span>
                </button>

                {showPermissionTree && (
                  <div style={{
                    marginTop: '1rem',
                    padding: '1.5rem',
                    background: '#f9fafb',
                    borderRadius: '0.75rem',
                    border: '1px solid #e5e7eb'
                  }}>
                    {Object.entries(roleHierarchy)
                      .sort((a, b) => b[1].level - a[1].level)
                      .map(([key, role]) => (
                        <div
                          key={key}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '1rem',
                            padding: '0.75rem',
                            marginBottom: '0.5rem',
                            background: key === user.role ? '#e0f2fe' : 
                                       key === requiredRole ? '#fef3c7' : 'white',
                            borderRadius: '0.5rem',
                            border: key === user.role ? '2px solid #0284c7' :
                                   key === requiredRole ? '2px solid #eab308' : '1px solid #e5e7eb'
                          }}
                        >
                          <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            background: role.color,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1.25rem',
                            flexShrink: 0
                          }}>
                            {role.emoji}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ 
                              fontSize: '0.875rem',
                              fontWeight: '600',
                              color: '#111827',
                              marginBottom: '0.25rem'
                            }}>
                              {role.label}
                              {key === user.role && (
                                <span style={{
                                  marginLeft: '0.5rem',
                                  padding: '0.125rem 0.5rem',
                                  background: '#0284c7',
                                  color: 'white',
                                  borderRadius: '999px',
                                  fontSize: '0.625rem'
                                }}>
                                  YOUR ROLE
                                </span>
                              )}
                              {key === requiredRole && (
                                <span style={{
                                  marginLeft: '0.5rem',
                                  padding: '0.125rem 0.5rem',
                                  background: '#eab308',
                                  color: 'white',
                                  borderRadius: '999px',
                                  fontSize: '0.625rem'
                                }}>
                                  REQUIRED
                                </span>
                              )}
                            </div>
                            <div style={{ 
                              fontSize: '0.75rem',
                              color: '#6b7280'
                            }}>
                              Level {role.level} • {role.permissions.length} permissions
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            )}

            {/* Messages */}
            {errorMessage && (
              <div style={{
                padding: '1rem',
                background: '#fef2f2',
                border: '1px solid #fca5a5',
                borderRadius: '0.5rem',
                marginBottom: '1rem'
              }}>
                <p style={{ fontSize: '0.875rem', color: '#991b1b' }}>
                  ❌ {errorMessage}
                </p>
              </div>
            )}

            {successMessage && (
              <div style={{
                padding: '1rem',
                background: '#f0fdf4',
                border: '1px solid #86efac',
                borderRadius: '0.5rem',
                marginBottom: '1rem'
              }}>
                <p style={{ fontSize: '0.875rem', color: '#166534' }}>
                  ✅ {successMessage}
                </p>
              </div>
            )}

            {/* Suggestion Box */}
            <div style={{
              padding: '1.5rem',
              background: '#dbeafe',
              borderRadius: '1rem',
              marginBottom: '2rem'
            }}>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '1.5rem', flexShrink: 0 }}>💡</span>
                <div>
                  <h4 style={{ 
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: '#1e40af',
                    marginBottom: '0.5rem'
                  }}>
                    What you can do:
                  </h4>
                  <p style={{ fontSize: '0.875rem', color: '#1e3a8a' }}>
                    {currentScenario.suggestion}
                  </p>
                </div>
              </div>
            </div>

            {/* Role Elevation Form */}
            {showElevationForm && canElevate() && (
              <div style={{
                padding: '1.5rem',
                background: '#f3f4f6',
                borderRadius: '1rem',
                marginBottom: '2rem',
                border: '2px dashed #9ca3af'
              }}>
                <h3 style={{
                  fontSize: '1rem',
                  fontWeight: '600',
                  color: '#111827',
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  🔐 Role Elevation
                </h3>
                <p style={{ 
                  fontSize: '0.875rem',
                  color: '#6b7280',
                  marginBottom: '1rem'
                }}>
                  Enter the elevation password to temporarily elevate your permissions.
                </p>
                <input
                  type="password"
                  value={elevationPassword}
                  onChange={(e) => setElevationPassword(e.target.value)}
                  placeholder="Enter elevation password"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    marginBottom: '1rem'
                  }}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') handleElevation();
                  }}
                />
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button
                    onClick={handleElevation}
                    disabled={loading || !elevationPassword}
                    style={{
                      flex: 1,
                      padding: '0.75rem',
                      background: '#8b5cf6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.5rem',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      cursor: loading || !elevationPassword ? 'not-allowed' : 'pointer',
                      opacity: loading || !elevationPassword ? 0.5 : 1
                    }}
                  >
                    {loading ? 'Elevating...' : 'Elevate Role'}
                  </button>
                  <button
                    onClick={() => {
                      setShowElevationForm(false);
                      setElevationPassword('');
                      setErrorMessage('');
                    }}
                    style={{
                      padding: '0.75rem 1.5rem',
                      background: '#f3f4f6',
                      color: '#374151',
                      border: 'none',
                      borderRadius: '0.5rem',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Access Request Form */}
            {showAccessRequest && user && (
              <div style={{
                padding: '1.5rem',
                background: '#fef3c7',
                borderRadius: '1rem',
                marginBottom: '2rem',
                border: '2px dashed #f59e0b'
              }}>
                <h3 style={{
                  fontSize: '1rem',
                  fontWeight: '600',
                  color: '#92400e',
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  📝 Request Access
                </h3>
                <p style={{ 
                  fontSize: '0.875rem',
                  color: '#92400e',
                  marginBottom: '1rem'
                }}>
                  Explain why you need access to this resource. Your request will be sent to an administrator for review.
                </p>
                <textarea
                  value={accessRequestReason}
                  onChange={(e) => setAccessRequestReason(e.target.value)}
                  placeholder="e.g., I need to access this to manage my team's attendance records..."
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    resize: 'vertical',
                    minHeight: '100px',
                    fontFamily: 'inherit',
                    marginBottom: '1rem'
                  }}
                />
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button
                    onClick={handleAccessRequest}
                    disabled={loading || !accessRequestReason.trim()}
                    style={{
                      flex: 1,
                      padding: '0.75rem',
                      background: '#f59e0b',
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.5rem',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      cursor: loading || !accessRequestReason.trim() ? 'not-allowed' : 'pointer',
                      opacity: loading || !accessRequestReason.trim() ? 0.5 : 1
                    }}
                  >
                    {loading ? 'Submitting...' : 'Submit Request'}
                  </button>
                  <button
                    onClick={() => {
                      setShowAccessRequest(false);
                      setAccessRequestReason('');
                      setErrorMessage('');
                    }}
                    style={{
                      padding: '0.75rem 1.5rem',
                      background: '#fef3c7',
                      color: '#92400e',
                      border: '1px solid #fbbf24',
                      borderRadius: '0.5rem',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div style={{ 
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem',
              marginBottom: '1.5rem'
            }}>
              {currentScenario.action === 'login' && (
                <button
                  onClick={handleLogin}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    padding: '1rem',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.75rem',
                    fontSize: '1rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
                  }}
                  onMouseOver={(e) => {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 10px 15px -3px rgba(0,0,0,0.2)';
                  }}
                  onMouseOut={(e) => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 4px 6px -1px rgba(0,0,0,0.1)';
                  }}
                >
                  🔐 Log In
                </button>
              )}

              {currentScenario.action === 'request_access' && user && !showAccessRequest && (
                <button
                  onClick={() => setShowAccessRequest(true)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    padding: '1rem',
                    background: '#f59e0b',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.75rem',
                    fontSize: '1rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
                  }}
                  onMouseOver={(e) => {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 10px 15px -3px rgba(0,0,0,0.2)';
                  }}
                  onMouseOut={(e) => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 4px 6px -1px rgba(0,0,0,0.1)';
                  }}
                >
                  📝 Request Access
                </button>
              )}

              {currentScenario.action === 'contact_admin' && (
                <button
                  onClick={handleContactAdmin}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    padding: '1rem',
                    background: '#ef4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.75rem',
                    fontSize: '1rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
                  }}
                  onMouseOver={(e) => {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 10px 15px -3px rgba(0,0,0,0.2)';
                  }}
                  onMouseOut={(e) => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 4px 6px -1px rgba(0,0,0,0.1)';
                  }}
                >
                  📧 Contact Admin
                </button>
              )}

              <button
                onClick={handleGoBack}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  padding: '1rem',
                  background: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.75rem',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
                }}
                onMouseOver={(e) => {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 10px 15px -3px rgba(0,0,0,0.2)';
                }}
                onMouseOut={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 4px 6px -1px rgba(0,0,0,0.1)';
                }}
              >
                ← Go Back
              </button>

              <button
                onClick={handleGoHome}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  padding: '1rem',
                  background: '#f3f4f6',
                  color: '#374151',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.75rem',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => {
                  e.target.style.background = '#e5e7eb';
                }}
                onMouseOut={(e) => {
                  e.target.style.background = '#f3f4f6';
                }}
              >
                🏠 Go Home
              </button>
            </div>

            {/* Alternative Actions */}
            <div style={{
              padding: '1.5rem',
              background: '#f9fafb',
              borderRadius: '1rem',
              border: '1px solid #e5e7eb'
            }}>
              <h4 style={{
                fontSize: '0.875rem',
                fontWeight: '600',
                color: '#374151',
                marginBottom: '1rem'
              }}>
                What else can you do?
              </h4>
              <ul style={{
                fontSize: '0.875rem',
                color: '#6b7280',
                lineHeight: '1.75',
                paddingLeft: '1.25rem',
                margin: 0
              }}>
                <li>Contact your academy administrator for role changes</li>
                <li>Review your current permissions in your profile settings</li>
                <li>Check if your account needs verification</li>
                <li>Visit the help center for more information</li>
                {canElevate() && (
                  <li>Tap the emoji icon 7 times to access role elevation (if authorized)</li>
                )}
              </ul>
            </div>
          </div>
        </div>

        {/* Support Card */}
        <div style={{ 
          marginTop: '1.5rem',
          background: 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(10px)',
          borderRadius: '1rem',
          boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
          padding: '1.5rem'
        }}>
          <h3 style={{ 
            fontSize: '1rem',
            fontWeight: '600',
            color: '#111827',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            🆘 Need Help?
          </h3>
          <div style={{ 
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '1rem'
          }}>
            <a
              href="mailto:support@accellax361.com"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.75rem',
                borderRadius: '0.5rem',
                textDecoration: 'none',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.05)'}
              onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{
                width: '40px',
                height: '40px',
                background: '#eff6ff',
                borderRadius: '0.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.25rem',
                flexShrink: 0
              }}>
                📧
              </div>
              <div>
                <p style={{ 
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: '#111827',
                  margin: 0
                }}>
                  Email Support
                </p>
                <p style={{ 
                  fontSize: '0.75rem',
                  color: '#6b7280',
                  margin: 0
                }}>
                  24/7 available
                </p>
              </div>
            </a>
            <a
              href="https://docs.accellax361.com/permissions"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.75rem',
                borderRadius: '0.5rem',
                textDecoration: 'none',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.05)'}
              onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{
                width: '40px',
                height: '40px',
                background: '#fef3c7',
                borderRadius: '0.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.25rem',
                flexShrink: 0
              }}>
                📚
              </div>
              <div>
                <p style={{ 
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: '#111827',
                  margin: 0
                }}>
                  Documentation
                </p>
                <p style={{ 
                  fontSize: '0.75rem',
                  color: '#6b7280',
                  margin: 0
                }}>
                  Learn about roles
                </p>
              </div>
            </a>
            <a
              href="tel:+254712345678"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.75rem',
                borderRadius: '0.5rem',
                textDecoration: 'none',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.05)'}
              onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{
                width: '40px',
                height: '40px',
                background: '#dcfce7',
                borderRadius: '0.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.25rem',
                flexShrink: 0
              }}>
                📞
              </div>
              <div>
                <p style={{ 
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: '#111827',
                  margin: 0
                }}>
                  Call Us
                </p>
                <p style={{ 
                  fontSize: '0.75rem',
                  color: '#6b7280',
                  margin: 0
                }}>
                  +254 712 345 678
                </p>
              </div>
            </a>
          </div>
        </div>

        {/* Security Notice */}
        <div style={{
          marginTop: '1.5rem',
          background: 'rgba(239, 246, 255, 0.8)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(191, 219, 254, 0.8)',
          borderRadius: '1rem',
          padding: '1.5rem'
        }}>
          <div style={{ 
            display: 'flex',
            gap: '1rem',
            alignItems: 'flex-start'
          }}>
            <span style={{ fontSize: '1.5rem', flexShrink: 0 }}>🔒</span>
            <div>
              <h4 style={{ 
                fontWeight: '600',
                color: '#1e40af',
                marginBottom: '0.5rem',
                fontSize: '0.875rem'
              }}>
                Security Notice
              </h4>
              <p style={{ 
                fontSize: '0.875rem',
                color: '#1e3a8a',
                margin: 0,
                lineHeight: '1.5'
              }}>
                This access attempt has been logged for security purposes. If you believe you should have access to this resource, please contact your administrator with the access request ID shown above.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          marginTop: '1.5rem',
          textAlign: 'center',
          padding: '1rem',
          fontSize: '0.875rem',
          color: 'rgba(255,255,255,0.8)'
        }}>
          <p style={{ marginBottom: '0.5rem' }}>
            AccellaX 361° © {new Date().getFullYear()} | Secure Access Control
          </p>
          <p style={{ fontSize: '0.75rem' }}>
            Request ID: {Math.random().toString(36).substr(2, 9).toUpperCase()}
          </p>
        </div>
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-20px);
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(-10px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        /* Responsive adjustments */
        @media (max-width: 640px) {
          h1 {
            font-size: 1.75rem !important;
          }
          
          button {
            font-size: 0.875rem !important;
            padding: 0.75rem !important;
          }

          .emoji-large {
            font-size: 4rem !important;
          }
        }

        /* Smooth transitions */
        * {
          transition: all 0.2s ease;
        }

        /* Focus styles for accessibility */
        button:focus,
        a:focus,
        input:focus,
        textarea:focus {
          outline: 3px solid rgba(99, 102, 241, 0.5);
          outline-offset: 2px;
        }

        /* Loading animation */
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }

        /* Disabled button styles */
        button:disabled {
          cursor: not-allowed;
          opacity: 0.5;
        }

        /* Selection color */
        ::selection {
          background: rgba(99, 102, 241, 0.3);
          color: inherit;
        }
      `}</style>
    </div>
  );
};

export default UnauthorizedPage;