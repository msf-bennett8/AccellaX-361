/**
 * File: web/frontend/src/components/dashboard/admin/AcademySettings.jsx
 * AccellaX 361° - Academy Settings Component
 * 
 * Description:
 * Admin component for managing academy settings and configuration.
 */

import React, { useState } from 'react';
import { Save, Upload } from 'lucide-react';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';

const AcademySettings = ({ academy, onSave, loading }) => {
  const [formData, setFormData] = useState({
    name: academy?.name || '',
    sport: academy?.sport || '',
    location: academy?.location || '',
    email: academy?.email || '',
    phone: academy?.phone || '',
    website: academy?.website || '',
    description: academy?.description || '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Card title="Academy Settings" subtitle="Manage your academy information">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Academy Logo */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Academy Logo
          </label>
          <div className="flex items-center space-x-4">
            <div className="w-20 h-20 bg-primary-100 rounded-lg flex items-center justify-center">
              <span className="text-primary-600 font-bold text-2xl">
                {formData.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <Button variant="outline" icon={Upload} size="sm">
              Upload Logo
            </Button>
          </div>
        </div>

        {/* Academy Name */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Academy Name *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        {/* Sport */}
        <div>
          <label htmlFor="sport" className="block text-sm font-medium text-gray-700 mb-1">
            Primary Sport *
          </label>
          <select
            id="sport"
            name="sport"
            value={formData.sport}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Select sport</option>
            <option value="soccer">Soccer</option>
            <option value="basketball">Basketball</option>
            <option value="volleyball">Volleyball</option>
            <option value="tennis">Tennis</option>
            <option value="athletics">Athletics</option>
          </select>
        </div>

        {/* Location */}
        <div>
          <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
            Location
          </label>
          <input
            type="text"
            id="location"
            name="location"
            value={formData.location}
            onChange={handleChange}
            placeholder="Nairobi, Kenya"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        {/* Contact Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="contact@academy.com"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
              Phone
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="+254 700 000 000"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        {/* Website */}
        <div>
          <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-1">
            Website
          </label>
          <input
            type="url"
            id="website"
            name="website"
            value={formData.website}
            onChange={handleChange}
            placeholder="https://www.academy.com"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={4}
            placeholder="Tell us about your academy..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button
            type="submit"
            icon={Save}
            loading={loading}
          >
            Save Changes
          </Button>
        </div>
      </form>
    </Card>
  );
};

export default AcademySettings;