/**
 * File: web/frontend/src/components/common/Card.jsx
 * AccellaX 361° - Card Component
 * 
 * Description:
 * Reusable card container for content sections.
 */

import React from 'react';

const Card = ({
  children,
  title = null,
  subtitle = null,
  headerAction = null,
  footer = null,
  padding = 'default',
  hover = false,
  className = '',
}) => {
  const paddings = {
    none: '',
    sm: 'p-4',
    default: 'p-6',
    lg: 'p-8',
  };

  return (
    <div
      className={`
        bg-white rounded-lg border border-gray-200
        ${hover ? 'hover:shadow-card-hover transition-shadow duration-200' : 'shadow-card'}
        ${className}
      `}
    >
      {(title || subtitle || headerAction) && (
        <div className={`border-b border-gray-200 ${paddings[padding]}`}>
          <div className="flex items-center justify-between">
            <div>
              {title && (
                <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
              )}
              {subtitle && (
                <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
              )}
            </div>
            {headerAction && <div>{headerAction}</div>}
          </div>
        </div>
      )}

      <div className={paddings[padding]}>{children}</div>

      {footer && (
        <div className={`border-t border-gray-200 bg-gray-50 rounded-b-lg ${paddings[padding]}`}>
          {footer}
        </div>
      )}
    </div>
  );
};

export default Card;