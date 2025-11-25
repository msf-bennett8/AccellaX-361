// src/utils/exportUtils.js
// Export utilities for AccellaX 361°
// Handles attendance data export to CSV/shareable formats

import { Share, Platform } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { formatDate, formatDateLong } from './dateUtils';
import { FILTER_LABELS } from './constants';

/**
 * Format session attendance as CSV text
 */
export const formatAttendanceCSV = (sessionData, attendanceData, filterType = 'all') => {
  const { session, academyName } = sessionData;
  
  let csv = `AccellaX 361° - Attendance Report\n`;
  csv += `${'='.repeat(50)}\n\n`;
  csv += `Academy: ${academyName || 'NextGen Multisport Academy'}\n`;
  csv += `Date: ${formatDateLong(new Date(session.session_date))}\n`;
  csv += `Day: ${session.day_of_week}\n`;
  csv += `Time: ${session.session_time}\n`;
  
  if (filterType !== 'all') {
    csv += `Filter: ${FILTER_LABELS[filterType]} Kids\n`;
  }
  
  csv += `\n${'='.repeat(50)}\n\n`;
  
  // Header row
  csv += `Name,Age Group,Sponsorship,Program,Status\n`;
  
  // Data rows
  attendanceData.forEach(kid => {
    csv += `${kid.name},${kid.age_group},${kid.sponsorshipType || 'N/A'},${kid.programType || 'N/A'},${kid.status === 'present' ? 'Present' : 'Absent'}\n`;
  });
  
  // Summary
  const presentCount = attendanceData.filter(k => k.status === 'present').length;
  const absentCount = attendanceData.filter(k => k.status === 'absent').length;
  const totalCount = attendanceData.length;
  const rate = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0;
  
  csv += `\n${'='.repeat(50)}\n`;
  csv += `SUMMARY\n`;
  csv += `${'='.repeat(50)}\n`;
  csv += `Total Kids: ${totalCount}\n`;
  csv += `Present: ${presentCount} (${rate}%)\n`;
  csv += `Absent: ${absentCount} (${100 - rate}%)\n`;
  
  if (session.general_notes) {
    csv += `\nNotes: ${session.general_notes}\n`;
  }
  
  csv += `\n${'='.repeat(50)}\n`;
  csv += `Generated: ${new Date().toLocaleString()}\n`;
  
  return csv;
};

/**
 * Export single session attendance
 */
export const exportSessionAttendance = async (sessionData, attendanceData, filterType = 'all') => {
  const csvText = formatAttendanceCSV(sessionData, attendanceData, filterType);
  
  try {
    if (Platform.OS === 'web') {
      // For web: Copy to clipboard
      await Clipboard.setStringAsync(csvText);
      return { success: true, method: 'clipboard' };
    } else {
      // For mobile: Use share
      await Share.share({
        message: csvText,
        title: `Attendance Report - ${sessionData.session.day_of_week} ${formatDate(new Date(sessionData.session.session_date))}`,
      });
      return { success: true, method: 'share' };
    }
  } catch (error) {
    console.error('Error exporting:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Export multiple sessions
 */
export const exportMultipleSessions = async (sessions, filterType = 'all') => {
  let report = `AccellaX 361° - Multi-Session Report\n`;
  report += `${'='.repeat(50)}\n`;
  report += `Generated: ${new Date().toLocaleString()}\n`;
  
  if (filterType !== 'all') {
    report += `Filter: ${FILTER_LABELS[filterType]} Kids Only\n`;
  }
  
  report += `Total Sessions: ${sessions.length}\n`;
  report += `${'='.repeat(50)}\n\n`;
  
  sessions.forEach((session, index) => {
    report += `\nSESSION ${index + 1}\n`;
    report += `${'-'.repeat(50)}\n`;
    report += `Date: ${formatDateLong(new Date(session.session_date))}\n`;
    report += `Day: ${session.day_of_week}\n`;
    report += `Time: ${session.session_time}\n`;
    report += `Present: ${session.presentCount}/${session.totalCount} (${session.attendanceRate}%)\n`;
    
    if (session.general_notes) {
      report += `Notes: ${session.general_notes}\n`;
    }
  });
  
  // Overall summary
  const totalKids = sessions.reduce((sum, s) => sum + s.totalCount, 0);
  const totalPresent = sessions.reduce((sum, s) => sum + s.presentCount, 0);
  const avgRate = sessions.length > 0 
    ? Math.round(sessions.reduce((sum, s) => sum + s.attendanceRate, 0) / sessions.length)
    : 0;
  
  report += `\n\n${'='.repeat(50)}\n`;
  report += `OVERALL SUMMARY\n`;
  report += `${'='.repeat(50)}\n`;
  report += `Total Sessions: ${sessions.length}\n`;
  report += `Total Attendance Records: ${totalKids}\n`;
  report += `Total Present: ${totalPresent}\n`;
  report += `Average Attendance Rate: ${avgRate}%\n`;
  
  try {
    if (Platform.OS === 'web') {
      await Clipboard.setStringAsync(report);
      return { success: true, method: 'clipboard' };
    } else {
      await Share.share({
        message: report,
        title: `Multi-Session Report - ${sessions.length} Sessions`,
      });
      return { success: true, method: 'share' };
    }
  } catch (error) {
    console.error('Error exporting:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Export individual kid's attendance history
 */
export const exportKidAttendanceHistory = async (kid, attendanceHistory) => {
  let report = `AccellaX 361° - Kid Attendance Report\n`;
  report += `${'='.repeat(50)}\n\n`;
  report += `Name: ${kid.name}\n`;
  report += `Age: ${kid.age} years\n`;
  report += `Age Group: ${kid.age_group}\n`;
  report += `Gender: ${kid.gender || 'Not specified'}\n`;
  report += `Area: ${kid.area_of_residence || 'Not specified'}\n`;
  report += `Sponsorship: ${kid.sponsorshipType === 'SC' ? 'Scholarship' : 'Self-Sponsored'}\n`;
  report += `Program: ${kid.programType === 'ELT' ? 'Elite' : 'Weekend Warrior'}\n`;
  report += `\n${'='.repeat(50)}\n\n`;
  
  // Stats
  const total = attendanceHistory.length;
  const present = attendanceHistory.filter(a => a.status === 'present').length;
  const absent = attendanceHistory.filter(a => a.status === 'absent').length;
  const rate = total > 0 ? Math.round((present / total) * 100) : 0;
  
  report += `ATTENDANCE STATISTICS\n`;
  report += `${'-'.repeat(50)}\n`;
  report += `Total Sessions: ${total}\n`;
  report += `Present: ${present} (${rate}%)\n`;
  report += `Absent: ${absent} (${100 - rate}%)\n`;
  report += `\n${'='.repeat(50)}\n\n`;
  
  report += `ATTENDANCE HISTORY\n`;
  report += `${'-'.repeat(50)}\n`;
  report += `Date,Day,Time,Status\n`;
  
  attendanceHistory.forEach(record => {
    const status = record.status === 'present' ? 'Present ✓' : 'Absent ✗';
    report += `${formatDate(new Date(record.session_date))},${record.day_of_week},${record.session_time},${status}\n`;
  });
  
  report += `\n${'='.repeat(50)}\n`;
  report += `Generated: ${new Date().toLocaleString()}\n`;
  
  try {
    if (Platform.OS === 'web') {
      await Clipboard.setStringAsync(report);
      return { success: true, method: 'clipboard' };
    } else {
      await Share.share({
        message: report,
        title: `Attendance Report - ${kid.name}`,
      });
      return { success: true, method: 'share' };
    }
  } catch (error) {
    console.error('Error exporting:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Copy text to clipboard (cross-platform)
 */
export const copyToClipboard = async (text) => {
  try {
    await Clipboard.setStringAsync(text);
    return { success: true };
  } catch (error) {
    console.error('Error copying to clipboard:', error);
    return { success: false, error: error.message };
  }
};

export default {
  formatAttendanceCSV,
  exportSessionAttendance,
  exportMultipleSessions,
  exportKidAttendanceHistory,
  copyToClipboard,
};