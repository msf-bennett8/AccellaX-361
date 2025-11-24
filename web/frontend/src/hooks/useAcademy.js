/**
 * File: web/frontend/src/hooks/useAcademy.js
 * Custom hook for academy context
 */

import { useContext } from 'react';
import { AcademyProvider } from '@/contexts/AcademyContext';

// Just re-export the hook if it exists in the context
// OR create a simple version that returns academy data
export const useAcademy = () => {
  // For now, return a mock academy object
  // This will be replaced when you properly set up AcademyContext
  return {
    academy: {
      id: 1,
      name: 'NextGen MultiSport Academy',
      location: 'Nairobi, Kenya',
    },
    loading: false,
    error: null,
  };
};

export default useAcademy;
