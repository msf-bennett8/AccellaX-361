/**
 * File: web/frontend/src/components/dashboard/admin/UserManagement.jsx
 * AccellaX 361° - User Management Component
 * 
 * Description:
 * Admin component for managing users (coaches, parents, etc.).
 */

import React, { useState } from 'react';
import { UserPlus, Edit2, Trash2, Shield } from 'lucide-react';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import Badge from '@/components/common/Badge';
import SearchBar from '@/components/common/SearchBar';

const UserManagement = ({ users, onAddUser, onEditUser, onDeleteUser, onElevateRole }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('all');

  const filteredUsers = users?.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    return matchesSearch && matchesRole;
  }) || [];

  const roleColors = {
    super_admin: 'danger',
    owner: 'warning',
    head_coach: 'primary',
    coach: 'primary',
    parent: 'success',
    payment_recorder: 'secondary',
  };

  return (
    <Card
      title="User Management"
      subtitle={`${filteredUsers.length} users`}
      headerAction={
        <Button icon={UserPlus} onClick={onAddUser}>
          Add User
        </Button>
      }
    >
      {/* Filters */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <SearchBar
            placeholder="Search users..."
            value={searchQuery}
            onChange={setSearchQuery}
          />
        </div>
        
        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="all">All Roles</option>
          <option value="coach">Coaches</option>
          <option value="parent">Parents</option>
          <option value="payment_recorder">Payment Recorders</option>
        </select>
      </div>

      {/* Users Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                User
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Role
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Email
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Status
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredUsers.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-4 py-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                      <span className="text-primary-600 font-medium">
                        {user.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{user.name}</p>
                      <p className="text-sm text-gray-500">ID: {user.id}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <Badge variant={roleColors[user.role]} size="sm">
                    {user.role.replace('_', ' ').toUpperCase()}
                  </Badge>
                </td>
                <td className="px-4 py-4 text-sm text-gray-900">
                  {user.email}
                </td>
                <td className="px-4 py-4">
                  <Badge variant={user.active ? 'active' : 'suspended'} size="sm">
                    {user.active ? 'Active' : 'Inactive'}
                  </Badge>
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center justify-end space-x-2">
                    <button
                      onClick={() => onEditUser(user)}
                      className="p-2 text-gray-600 hover:bg-gray-100 rounded-md"
                      title="Edit user"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onElevateRole(user)}
                      className="p-2 text-primary-600 hover:bg-primary-50 rounded-md"
                      title="Elevate role"
                    >
                      <Shield className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDeleteUser(user)}
                      className="p-2 text-danger-600 hover:bg-danger-50 rounded-md"
                      title="Delete user"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredUsers.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No users found</p>
        </div>
      )}
    </Card>
  );
};

export default UserManagement;
