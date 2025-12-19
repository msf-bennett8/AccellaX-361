import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
  Platform,
  Switch,
  Modal,
  Share,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import Header from '../../components/common/Header';
import { COLORS as APP_COLORS } from '../../utils/constants';

const COLORS = {
  background: '#F5F5F5',
  white: '#FFFFFF',
  text: '#1A1A1A',
  textSecondary: '#666666',
  primary: '#2196F3',
  error: '#F44336',
  warning: '#FF9800',
  success: '#4CAF50',
  info: '#2196F3',
  debug: '#9E9E9E',
  shadow: '#000000',
  border: '#E0E0E0',
};

const LOG_LEVELS = {
  DEBUG: 'debug',
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error',
  SYSTEM: 'system',
};

const TABS = [
  { id: 'all', label: 'All Logs', icon: 'list' },
  { id: 'error', label: 'Errors', icon: 'close-circle' },
  { id: 'warning', label: 'Warnings', icon: 'warning' },
  { id: 'info', label: 'Info', icon: 'information-circle' },
  { id: 'debug', label: 'Debug', icon: 'bug' },
];

// Mock logs for demonstration - Replace with your actual logging system
const generateMockLogs = () => {
  const modules = ['Auth', 'Database', 'API', 'Navigation', 'Sync', 'Assessment', 'Network'];
  const actions = [
    'User login attempt',
    'Data fetch',
    'Database query',
    'Navigation to screen',
    'API request',
    'Sync operation',
    'Form validation',
    'File upload',
  ];
  
  const logs = [];
  for (let i = 0; i < 50; i++) {
    const level = Object.values(LOG_LEVELS)[Math.floor(Math.random() * 5)];
    const module = modules[Math.floor(Math.random() * modules.length)];
    const action = actions[Math.floor(Math.random() * actions.length)];
    
    logs.push({
      id: `log_${i}`,
      timestamp: new Date(Date.now() - Math.random() * 86400000).toISOString(),
      level,
      module,
      action,
      message: level === 'error' 
        ? `${action} failed in ${module}: Connection timeout`
        : level === 'warning'
        ? `${action} in ${module}: Slow response detected (2.5s)`
        : `${action} completed successfully in ${module}`,
      details: level === 'error' ? {
        stack: 'Error: Connection timeout\n  at fetch.then.catch\n  at processTicksAndRejections',
        code: 'ETIMEDOUT',
        endpoint: '/api/v1/data',
      } : null,
      userId: 'user_123',
      appVersion: '1.0.0',
      platform: Platform.OS,
    });
  }
  
  return logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
};

export default function AppLogScreen() {
  const navigation = useNavigation();
  const [logs, setLogs] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLog, setSelectedLog] = useState(null);
  const [showMenu, setShowMenu] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [debugEnabled, setDebugEnabled] = useState(true);
  const [filters, setFilters] = useState({
    modules: [],
    dateFrom: null,
    dateTo: null,
  });

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      const logger = (await import('../../services/loggerService')).default;
      const realLogs = await logger.getLogs();
      
      if (realLogs.length > 0) {
        setLogs(realLogs);
      } else {
        // Show mock logs if no real logs exist yet
        const mockLogs = generateMockLogs();
        setLogs(mockLogs);
      }
    } catch (error) {
      console.error('Error loading logs:', error);
      // Fallback to mock logs
      const mockLogs = generateMockLogs();
      setLogs(mockLogs);
    }
  };

  const saveLogs = async (newLogs) => {
    setLogs(newLogs);
    // Save to AsyncStorage with size limit (keep last 500 logs)
    const logsToSave = newLogs.slice(0, 500);
    await AsyncStorage.setItem('app_logs', JSON.stringify(logsToSave));
  };

  const filteredLogs = useMemo(() => {
    let filtered = logs;

    // Filter by tab
    if (activeTab !== 'all') {
      filtered = filtered.filter(log => log.level === activeTab);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(log =>
        log.message.toLowerCase().includes(query) ||
        log.module.toLowerCase().includes(query) ||
        log.action.toLowerCase().includes(query)
      );
    }

    // Filter by debug toggle
    if (!debugEnabled) {
      filtered = filtered.filter(log => log.level !== LOG_LEVELS.DEBUG);
    }

    // Filter by modules
    if (filters.modules.length > 0) {
      filtered = filtered.filter(log => filters.modules.includes(log.module));
    }

    // Filter by date range
    if (filters.dateFrom) {
      filtered = filtered.filter(log => new Date(log.timestamp) >= new Date(filters.dateFrom));
    }
    if (filters.dateTo) {
      filtered = filtered.filter(log => new Date(log.timestamp) <= new Date(filters.dateTo));
    }

    return filtered;
  }, [logs, activeTab, searchQuery, debugEnabled, filters]);

  const getLogIcon = (level) => {
    switch (level) {
      case LOG_LEVELS.ERROR:
        return { name: 'close-circle', color: COLORS.error };
      case LOG_LEVELS.WARNING:
        return { name: 'warning', color: COLORS.warning };
      case LOG_LEVELS.INFO:
        return { name: 'information-circle', color: COLORS.info };
      case LOG_LEVELS.DEBUG:
        return { name: 'bug', color: COLORS.debug };
      case LOG_LEVELS.SYSTEM:
        return { name: 'settings', color: COLORS.primary };
      default:
        return { name: 'information-circle', color: COLORS.info };
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const copyLog = async (log) => {
    const text = `[${log.level.toUpperCase()}] ${log.timestamp}
Module: ${log.module}
Action: ${log.action}
Message: ${log.message}
${log.details ? `Details: ${JSON.stringify(log.details, null, 2)}` : ''}`;
    
    await Clipboard.setStringAsync(text);
    
    // Simple success feedback without alert
    if (Platform.OS === 'web') {
      console.log('✅ Log copied to clipboard');
    } else {
      Alert.alert('✅ Copied', 'Log copied to clipboard');
    }
  };

  const copyAllLogs = async () => {
    const text = filteredLogs.map(log => 
      `[${log.level.toUpperCase()}] ${log.timestamp} - ${log.module}: ${log.message}`
    ).join('\n\n');
    
    await Clipboard.setStringAsync(text);
    Alert.alert('✅ Copied', `${filteredLogs.length} logs copied to clipboard`);
    setShowMenu(false);
  };

  const clearLogs = () => {
    // Close the menu first
    setShowMenu(false);
    
    // Show confirmation using the existing modal system
    if (Platform.OS === 'web') {
      // For web, use window.confirm
      if (window.confirm('🧹 Clear Logs\n\nAre you sure you want to clear all logs? This cannot be undone.')) {
        (async () => {
          const logger = (await import('../../services/loggerService')).default;
          await logger.clearLogs();
          setLogs([]);
        })();
      }
    } else {
      // For mobile, use Alert
      Alert.alert(
        '🧹 Clear Logs',
        'Are you sure you want to clear all logs? This cannot be undone.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Clear',
            style: 'destructive',
            onPress: async () => {
              const logger = (await import('../../services/loggerService')).default;
              await logger.clearLogs();
              setLogs([]);
            },
          },
        ]
      );
    }
  };

  const exportLogs = async () => {
    try {
      const fileName = `app-logs-${Date.now()}.json`;
      const content = JSON.stringify(filteredLogs, null, 2);
      
      if (Platform.OS === 'web') {
        const blob = new Blob([content], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        link.click();
        URL.revokeObjectURL(url);
        Alert.alert('✅ Exported', `Logs saved as ${fileName}`);
      } else {
        const fileUri = FileSystem.documentDirectory + fileName;
        await FileSystem.writeAsStringAsync(fileUri, content);
        
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(fileUri);
        } else {
          Alert.alert('✅ Saved', `Logs saved to: ${fileUri}`);
        }
      }
      
      setShowMenu(false);
    } catch (error) {
      Alert.alert('❌ Error', 'Failed to export logs');
    }
  };

  const shareLogs = async () => {
    try {
      const text = filteredLogs.slice(0, 20).map(log => 
        `[${log.level.toUpperCase()}] ${log.timestamp}\n${log.module}: ${log.message}`
      ).join('\n\n');
      
      await Share.share({
        message: text,
        title: 'App Logs',
      });
      
      setShowMenu(false);
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const renderLogItem = (log) => {
    const icon = getLogIcon(log.level);
    const isSelected = selectedLog?.id === log.id;
    
    return (
      <TouchableOpacity
        key={log.id}
        style={[styles.logItem, isSelected && styles.logItemSelected]}
        onPress={() => setSelectedLog(isSelected ? null : log)}
        onLongPress={() => copyLog(log)}
      >
        <View style={styles.logHeader}>
          <View style={styles.logIconContainer}>
            <Ionicons name={icon.name} size={20} color={icon.color} />
          </View>
          
          <View style={styles.logContent}>
            <View style={styles.logTitleRow}>
              <Text style={styles.logModule}>{log.module}</Text>
              <Text style={styles.logTimestamp}>{formatTimestamp(log.timestamp)}</Text>
            </View>
            
            <Text style={styles.logMessage} numberOfLines={isSelected ? undefined : 2}>
              {log.message}
            </Text>
            
            <Text style={styles.logAction}>{log.action}</Text>
          </View>
        </View>
        
        {isSelected && log.details && (
          <View style={styles.logDetails}>
            <Text style={styles.logDetailsTitle}>Details:</Text>
            <Text style={styles.logDetailsText}>
              {JSON.stringify(log.details, null, 2)}
            </Text>
            
            <TouchableOpacity
              style={styles.copyButton}
              onPress={() => copyLog(log)}
            >
              <Ionicons name="copy-outline" size={16} color={COLORS.primary} />
              <Text style={styles.copyButtonText}>Copy Log</Text>
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderMenuOption = (icon, label, onPress, color = COLORS.text) => (
    <TouchableOpacity style={styles.menuOption} onPress={onPress}>
      <Ionicons name={icon} size={20} color={color} />
      <Text style={[styles.menuOptionText, { color }]}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header - Keep AccellaX Style */}
      <Header
        title="App Logs"
        onLeftPress={() => navigation.openDrawer()}
        rightIcon={
          <TouchableOpacity
            style={styles.headerIconButton}
            onPress={() => setShowMenu(true)}
          >
            <Ionicons name="ellipsis-vertical" size={20} color={APP_COLORS.white} />
          </TouchableOpacity>
        }
      />
      
      {/* Secondary Actions Bar */}
      <View style={styles.secondaryActionsBar}>
        <TouchableOpacity
          style={[styles.actionButton, showFilters && styles.actionButtonActive]}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Ionicons 
            name="options-outline" 
            size={20} 
            color={showFilters ? APP_COLORS.primary : APP_COLORS.textSecondary} 
          />
          <Text style={[styles.actionButtonText, showFilters && styles.actionButtonTextActive]}>
            Filters
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={COLORS.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search logs..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor={COLORS.textSecondary}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Compact Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.compactTabsContainer}
        contentContainerStyle={styles.compactTabsContent}
      >
        {TABS.map(tab => {
          const count = logs.filter(log => 
            tab.id === 'all' || log.level === tab.id
          ).length;
          
          return (
            <TouchableOpacity
              key={tab.id}
              style={[styles.compactTab, activeTab === tab.id && styles.compactTabActive]}
              onPress={() => setActiveTab(tab.id)}
            >
              <Ionicons
                name={tab.icon}
                size={16}
                color={activeTab === tab.id ? COLORS.primary : COLORS.textSecondary}
              />
              <Text style={[
                styles.compactTabText,
                activeTab === tab.id && styles.compactTabTextActive
              ]}>
                {tab.label}
              </Text>
              <View style={[
                styles.compactBadge,
                activeTab === tab.id && styles.compactBadgeActive
              ]}>
                <Text style={[
                  styles.compactBadgeText,
                  activeTab === tab.id && styles.compactBadgeTextActive
                ]}>
                  {count}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Compact Filter Chips */}
      {showFilters && (
        <View style={styles.filterChipsContainer}>
          <TouchableOpacity
            style={[styles.filterChip, debugEnabled && styles.filterChipActive]}
            onPress={() => setDebugEnabled(!debugEnabled)}
          >
            <Ionicons 
              name={debugEnabled ? "bug" : "bug-outline"} 
              size={14} 
              color={debugEnabled ? APP_COLORS.white : APP_COLORS.primary} 
            />
            <Text style={[styles.filterChipText, debugEnabled && styles.filterChipTextActive]}>
              Debug
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Logs List */}
      <ScrollView
        style={styles.logsList}
        contentContainerStyle={styles.logsContent}
      >
        {filteredLogs.length > 0 ? (
          filteredLogs.map(renderLogItem)
        ) : (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons
              name="text-box-search-outline"
              size={64}
              color={COLORS.textSecondary}
            />
            <Text style={styles.emptyStateTitle}>No Logs Found</Text>
            <Text style={styles.emptyStateText}>
              {searchQuery
                ? 'Try adjusting your search or filters'
                : 'Logs will appear here as events occur'}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Menu Modal */}
      <Modal
        visible={showMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMenu(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowMenu(false)}
        >
          <View style={styles.menuContainer}>
            <View style={styles.menuHeader}>
              <Text style={styles.menuTitle}>Log Actions</Text>
              <TouchableOpacity onPress={() => setShowMenu(false)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>
            
            {renderMenuOption('copy-outline', 'Copy All Visible Logs', copyAllLogs)}
            {renderMenuOption('download-outline', 'Export Logs', exportLogs)}
            {renderMenuOption('share-social-outline', 'Share Logs', shareLogs)}
            {renderMenuOption('trash-outline', 'Clear All Logs', clearLogs, COLORS.error)}
            {renderMenuOption('reload', 'Refresh', loadLogs)}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Stats Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Showing {filteredLogs.length} of {logs.length} logs
        </Text>
        <Text style={styles.footerText}>
          {logs.filter(l => l.level === 'error').length} errors · 
          {logs.filter(l => l.level === 'warning').length} warnings
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  
  // Header Icon Button
  headerIconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Secondary Actions Bar
  secondaryActionsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  actionButtonActive: {
    backgroundColor: COLORS.primary + '15',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  actionButtonTextActive: {
    color: COLORS.primary,
  },
  
  // Search
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    gap: 8,
    elevation: 2,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: COLORS.text,
  },
  
  // Compact Tabs
  compactTabsContainer: {
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    maxHeight: 44,
  },
  compactTabsContent: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
    alignItems: 'center',
  },
  compactTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  compactTabActive: {
    backgroundColor: COLORS.primary + '15',
  },
  compactTabText: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  compactTabTextActive: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  compactBadge: {
    backgroundColor: COLORS.border,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 8,
    minWidth: 18,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactBadgeActive: {
    backgroundColor: COLORS.primary,
  },
  compactBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  compactBadgeTextActive: {
    color: COLORS.white,
  },
  
  // Filter Chips
  filterChipsContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    gap: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.text,
  },
  filterChipTextActive: {
    color: COLORS.white,
  },
  
  // Logs List
  logsList: {
    flex: 1,
  },
  logsContent: {
    padding: 16,
    gap: 12,
  },
  logItem: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.border,
  },
  logItemSelected: {
    borderLeftColor: COLORS.primary,
    backgroundColor: COLORS.primary + '05',
  },
  logHeader: {
    flexDirection: 'row',
    gap: 12,
  },
  logIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logContent: {
    flex: 1,
  },
  logTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  logModule: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  logTimestamp: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  logMessage: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 20,
    marginBottom: 4,
  },
  logAction: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },
  logDetails: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  logDetailsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  logDetailsText: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 11,
    color: COLORS.textSecondary,
    backgroundColor: COLORS.background,
    padding: 8,
    borderRadius: 6,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginTop: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: COLORS.primary + '15',
    borderRadius: 6,
    gap: 6,
  },
  copyButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
  },
  
  // Empty State
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  
  // Menu Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  menuContainer: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
  },
  menuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  menuTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  menuOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  menuOptionText: {
    fontSize: 16,
    fontWeight: '500',
  },
  
  // Footer
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  footerText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
});
