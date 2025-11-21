/**
 * File: web/frontend/src/components/layout/PublicLayout.jsx
 * AccellaX 361° - Public Layout Component
 * 
 * Description:
 * Layout for public-facing pages (landing, about, features, etc.).
 * Includes public navbar and footer.
 */

import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '@/components/common/Navbar';
import Footer from '@/components/common/Footer';

const PublicLayout = () => {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Navbar */}
      <Navbar />

      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default PublicLayout;