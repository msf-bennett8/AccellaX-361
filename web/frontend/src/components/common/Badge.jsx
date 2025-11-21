/**
 * File: web/frontend/src/components/common/Badge.jsx
 * AccellaX 361° - Badge Component
 * 
 * Description:
 * Status badges for sponsorship types, kid status, attendance status, etc.
 */

import React from 'react';
import { BADGE_COLORS } from '@/utils/constants';

const Badge = ({
  children,
  variant = 'default',
  size = 'md',
  className = '',
  fullName = '',
}) => {
  // Get color from constants or use variant
  const colorClass = BADGE_COLORS[variant] || BADGE_COLORS.default || 
    'bg-gray-100 text-gray-800';

  const sizes = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-0.5',
    lg: 'text-base px-3 py-1',
  };

  return (
    <span
      className={`
        inline-flex items-center font-medium rounded-full border
        ${colorClass}
        ${sizes[size]}
        ${className}
      `}
      title={fullName || children}
    >
      {children}
    </span>
  );
};

export default Badge;