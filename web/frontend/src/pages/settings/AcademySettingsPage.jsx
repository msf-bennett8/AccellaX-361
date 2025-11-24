/**
 * File: web/frontend/src/pages/settings/AcademySettingsPage.jsx
 * AccellaX 361° - Academy Settings Page
 * 
 * Description:
 * Admin page for managing academy settings. Only accessible by admins.
 */

import React, { useState } from 'react';
import { useAcademy } from '@/hooks/useAcademy';
import AcademySettings from '@/components/dashboard/admin/AcademySettings';
import { toast } from 'react-hot-toast';

const AcademySettingsPage = () => {
  const { academy, updateAcademy, loading } = useAcademy();
  const [saving, setSaving] = useState(false);

  const handleSave = async (formData) => {
    setSaving(true);
    try {
      await updateAcademy(formData);
      toast.success('✅ Academy settings updated successfully!');
    } catch (error) {
      console.error('Failed to update academy:', error);
      toast.error('❌ Failed to update settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        <AcademySettings 
          academy={academy} 
          onSave={handleSave} 
          loading={saving} 
        />
      </div>
    </div>
  );
};

export default AcademySettingsPage;