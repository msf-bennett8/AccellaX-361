// Location: /apps/assessment/src/contexts/UndoContext.js
// Undo/Redo State Manager - Phase 6.1

import React, { createContext, useState, useContext, useEffect, useRef } from 'react';

const UndoContext = createContext();

export const useUndo = () => {
  const context = useContext(UndoContext);
  if (!context) {
    throw new Error('useUndo must be used within UndoProvider');
  }
  return context;
};

const MAX_HISTORY = 10;
const AUTO_CLEAR_TIMEOUT = 30000; // 30 seconds

export const UndoProvider = ({ children }) => {
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const clearTimerRef = useRef(null);

  // Auto-clear undo stack after 30 seconds of inactivity
  useEffect(() => {
    if (undoStack.length > 0) {
      // Clear existing timer
      if (clearTimerRef.current) {
        clearTimeout(clearTimerRef.current);
      }

      // Set new timer
      clearTimerRef.current = setTimeout(() => {
        console.log('🗑️ Auto-clearing undo stack (30s timeout)');
        setUndoStack([]);
        setRedoStack([]);
      }, AUTO_CLEAR_TIMEOUT);
    }

    return () => {
      if (clearTimerRef.current) {
        clearTimeout(clearTimerRef.current);
      }
    };
  }, [undoStack.length]);

  /**
   * Record an action in the undo stack
   * @param {Object} action - Action to record
   * @param {string} action.type - Action type ('metric_change', 'bulk_edit', etc.)
   * @param {Object} action.data - Action data
   * @param {Function} action.undo - Function to undo the action
   * @param {string} action.description - Human-readable description
   */
  const recordAction = (action) => {
    const newAction = {
      ...action,
      id: `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
    };

    setUndoStack(prev => {
      const newStack = [...prev, newAction];
      // Keep only last MAX_HISTORY actions
      if (newStack.length > MAX_HISTORY) {
        return newStack.slice(-MAX_HISTORY);
      }
      return newStack;
    });

    // Clear redo stack when new action is recorded
    setRedoStack([]);

    console.log('📝 Action recorded:', action.type, action.description);
  };

  /**
   * Undo the last action
   * @returns {Object|null} Undone action or null
   */
  const undo = async () => {
    if (undoStack.length === 0) {
      console.log('⚠️ Nothing to undo');
      return null;
    }

    const action = undoStack[undoStack.length - 1];
    
    try {
      // Execute undo function
      if (action.undo && typeof action.undo === 'function') {
        await action.undo();
      }

      // Move action from undo to redo stack
      setUndoStack(prev => prev.slice(0, -1));
      setRedoStack(prev => [...prev, action]);

      console.log('↩️ Undone:', action.description);
      return action;
    } catch (error) {
      console.error('❌ Error undoing action:', error);
      return null;
    }
  };

  /**
   * Redo the last undone action
   * @returns {Object|null} Redone action or null
   */
  const redo = async () => {
    if (redoStack.length === 0) {
      console.log('⚠️ Nothing to redo');
      return null;
    }

    const action = redoStack[redoStack.length - 1];
    
    try {
      // Execute redo function (re-apply original action)
      if (action.redo && typeof action.redo === 'function') {
        await action.redo();
      }

      // Move action from redo to undo stack
      setRedoStack(prev => prev.slice(0, -1));
      setUndoStack(prev => [...prev, action]);

      console.log('↪️ Redone:', action.description);
      return action;
    } catch (error) {
      console.error('❌ Error redoing action:', error);
      return null;
    }
  };

  /**
   * Clear all undo/redo history
   */
  const clearHistory = () => {
    setUndoStack([]);
    setRedoStack([]);
    console.log('🗑️ Undo history cleared');
  };

  /**
   * Check if undo is available
   */
  const canUndo = () => undoStack.length > 0;

  /**
   * Check if redo is available
   */
  const canRedo = () => redoStack.length > 0;

  /**
   * Get the last action description (for UI display)
   */
  const getLastActionDescription = () => {
    if (undoStack.length === 0) return null;
    return undoStack[undoStack.length - 1].description;
  };

  /**
   * Get undo stack size
   */
  const getUndoCount = () => undoStack.length;

  /**
   * Get redo stack size
   */
  const getRedoCount = () => redoStack.length;

  const value = {
    // Actions
    recordAction,
    undo,
    redo,
    clearHistory,

    // Queries
    canUndo,
    canRedo,
    getLastActionDescription,
    getUndoCount,
    getRedoCount,

    // State (for debugging)
    undoStack,
    redoStack,
  };

  return <UndoContext.Provider value={value}>{children}</UndoContext.Provider>;
};

export default UndoContext;