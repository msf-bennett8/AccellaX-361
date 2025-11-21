/**
 * File: web/frontend/src/components/common/Toast.jsx
 * AccellaX 361° - Toast Notification Component
 * 
 * Description:
 * Custom toast wrapper for react-hot-toast with brand styling.
 */

import React from 'react';
import { Toaster } from 'react-hot-toast';

const Toast = () => {
  return (
    <Toaster
      position="top-right"
      reverseOrder={false}
      gutter={8}
      toastOptions={{
        // Default options
        duration: 4000,
        style: {
          background: '#fff',
          color: '#212121',
          padding: '16px',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          fontSize: '14px',
        },
        
        // Success
        success: {
          duration: 3000,
          style: {
            background: '#4CAF50',
            color: '#fff',
          },
          iconTheme: {
            primary: '#fff',
            secondary: '#4CAF50',
          },
        },
        
        // Error
        error: {
          duration: 5000,
          style: {
            background: '#F44336',
            color: '#fff',
          },
          iconTheme: {
            primary: '#fff',
            secondary: '#F44336',
          },
        },
        
        // Loading
        loading: {
          style: {
            background: '#2196F3',
            color: '#fff',
          },
        },
      }}
    />
  );
};

export default Toast;