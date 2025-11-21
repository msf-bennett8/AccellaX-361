/**
 * File: web/frontend/src/components/common/Loader.jsx
 * AccellaX 361° - Loading Spinner Component
 * 
 * Description:
 * Reusable loading spinner with different sizes and overlay option.
 */

import React from 'react';
import { Loader2 } from 'lucide-react';

const Loader = ({
  size = 'md',
  overlay = false,
  fullScreen = false,
  text = null,
  className = '',
}) => {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  };

  const LoaderContent = () => (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      <Loader2 className={`${sizes[size]} text-primary-500 animate-spin`} />
      {text && (
        <p className="text-sm text-gray-600 font-medium">{text}</p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white">
        <LoaderContent />
      </div>
    );
  }

  if (overlay) {
    return (
      <div className="absolute inset-0 z-10 flex items-center justify-center bg-white bg-opacity-75 rounded-lg">
        <LoaderContent />
      </div>
    );
  }

  return <LoaderContent />;
};

export default Loader;