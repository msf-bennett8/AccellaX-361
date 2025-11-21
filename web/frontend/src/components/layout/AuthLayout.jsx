/**
 * File: web/frontend/src/components/layout/AuthLayout.jsx
 * AccellaX 361° - Authentication Layout Component
 * 
 * Description:
 * Layout for authentication pages (login, register, password reset).
 * Features split-screen design with branding on the left.
 */

import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const AuthLayout = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-600 to-primary-800 p-12 flex-col justify-between">
        <div>
          <Link to="/" className="flex items-center space-x-3 text-white">
            <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center">
              <span className="text-primary-600 font-bold text-2xl">A</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold">AccellaX 361°</h1>
              <p className="text-primary-100 text-sm">Sports Academy Platform</p>
            </div>
          </Link>
        </div>

        <div className="space-y-6 text-white">
          <h2 className="text-3xl font-bold">
            Streamline Your Academy Management
          </h2>
          <p className="text-lg text-primary-100">
            Track attendance, manage kids, analyze performance, and grow your
            sports academy with our comprehensive platform.
          </p>
          
          <div className="space-y-4 pt-8">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold">✓</span>
              </div>
              <div>
                <h3 className="font-semibold">Real-time Attendance</h3>
                <p className="text-sm text-primary-100">
                  Mark attendance on mobile, see updates instantly on web
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold">✓</span>
              </div>
              <div>
                <h3 className="font-semibold">Powerful Analytics</h3>
                <p className="text-sm text-primary-100">
                  Identify patterns, track progress, make data-driven decisions
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold">✓</span>
              </div>
              <div>
                <h3 className="font-semibold">Multi-role Access</h3>
                <p className="text-sm text-primary-100">
                  Coaches, parents, kids, and sponsors - everyone stays connected
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="text-primary-100 text-sm">
          © {new Date().getFullYear()} AccellaX 361°. All rights reserved.
        </div>
      </div>

      {/* Right Side - Auth Forms */}
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-20 xl:px-24">
        {/* Back to Home Link */}
        <Link
          to="/"
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-8 lg:hidden"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </Link>

        {/* Logo for Mobile */}
        <div className="lg:hidden mb-8">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-primary-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-2xl">A</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">AccellaX 361°</h1>
              <p className="text-sm text-gray-500">Sports Academy Platform</p>
            </div>
          </div>
        </div>

        {/* Auth Form Content */}
        <div className="max-w-md w-full mx-auto">
          <Outlet />
        </div>

        {/* Footer Links */}
        <div className="mt-8 text-center text-sm text-gray-600">
          <p>
            Need help?{' '}
            <Link to="/help" className="text-primary-600 hover:text-primary-700 font-medium">
              Contact Support
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;