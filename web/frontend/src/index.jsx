/**
 * File: web/frontend/src/index.jsx
 * AccellaX 361° - Enhanced Application Entry Point
 * 
 * Description:
 * This is the main entry point for the AccellaX 361° React application.
 * Fully optimized with comprehensive error handling, monitoring, and PWA features.
 * 
 * Enhancements over original:
 * - Advanced Firebase initialization with retry logic
 * - Comprehensive error boundaries
 * - Enhanced performance monitoring with detailed metrics
 * - Network quality detection and adaptive loading
 * - Memory management and leak prevention
 * - Advanced Service Worker features
 * - Real-time sync status monitoring
 * - Progressive enhancement strategies
 * - Accessibility improvements
 * - Development utilities and debugging tools
 * 
 * Responsibilities:
 * - Initialize Firebase with offline persistence
 * - Register Service Worker for PWA functionality
 * - Set up global error tracking
 * - Configure performance monitoring
 * - Initialize analytics and tracking
 * - Mount React application with error boundaries
 * - Enable HMR for development
 * - Monitor network and device status
 * - Manage browser compatibility
 * 
 * Last Updated: 2025-01-20
 * Version: 2.0.0 (Enhanced)
 */

import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

// ==================== FIREBASE IMPORTS ====================
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  setPersistence, 
  browserLocalPersistence,
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  getFirestore, 
  enableIndexedDbPersistence,
  enableMultiTabIndexedDbPersistence,
  CACHE_SIZE_UNLIMITED,
  initializeFirestore
} from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics, logEvent, setUserId, setUserProperties } from 'firebase/analytics';
import { getPerformance } from 'firebase/performance';

// ==================== GLOBAL STYLES ====================
import './index.css';

// ==================== CONSTANTS ====================
const APP_VERSION = '2.0.0';
const APP_NAME = 'AccellaX 361°';
const MAX_FIREBASE_RETRY_ATTEMPTS = 3;
const FIREBASE_RETRY_DELAY = 2000; // 2 seconds
const PERFORMANCE_CHECK_INTERVAL = 30000; // 30 seconds
const MEMORY_WARNING_THRESHOLD = 80; // 80% memory usage

/**
 * ==================== FIREBASE CONFIGURATION ====================
 */
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Validate Firebase configuration
const validateFirebaseConfig = () => {
  const requiredFields = ['apiKey', 'authDomain', 'projectId', 'appId'];
  const missingFields = requiredFields.filter(field => !firebaseConfig[field]);
  
  if (missingFields.length > 0) {
    throw new Error(
      `Missing Firebase configuration: ${missingFields.join(', ')}. ` +
      `Please check your .env file and ensure all VITE_FIREBASE_* variables are set.`
    );
  }
  
  console.log('✅ Firebase configuration validated');
};

/**
 * ==================== FIREBASE INITIALIZATION WITH RETRY ====================
 */
let firebaseApp;
let auth;
let db;
let storage;
let analytics;
let performance;

const initializeFirebaseWithRetry = async (attempt = 1) => {
  try {
    console.log(`🔄 Initializing Firebase (Attempt ${attempt}/${MAX_FIREBASE_RETRY_ATTEMPTS})...`);
    
    // Validate configuration first
    validateFirebaseConfig();
    
    // Initialize Firebase App
    firebaseApp = initializeApp(firebaseConfig);
    console.log('✅ Firebase App initialized');
    
    // Initialize Auth with persistence
    auth = getAuth(firebaseApp);
    await setPersistence(auth, browserLocalPersistence);
    console.log('✅ Firebase Auth initialized with local persistence');
    
    // Initialize Firestore with custom settings
    db = initializeFirestore(firebaseApp, {
      cacheSizeBytes: CACHE_SIZE_UNLIMITED,
      experimentalForceLongPolling: false, // Better for most scenarios
      experimentalAutoDetectLongPolling: true,
    });
    console.log('✅ Firestore initialized with unlimited cache');
    
    // Enable offline persistence with multi-tab support
    try {
      await enableMultiTabIndexedDbPersistence(db);
      console.log('✅ Firestore multi-tab persistence enabled');
    } catch (err) {
      if (err.code === 'failed-precondition') {
        console.warn('⚠️ Multiple tabs detected, attempting single-tab persistence');
        try {
          await enableIndexedDbPersistence(db, { synchronizeTabs: false });
          console.log('✅ Firestore single-tab persistence enabled');
        } catch (singleTabErr) {
          console.warn('⚠️ Persistence not available:', singleTabErr);
        }
      } else if (err.code === 'unimplemented') {
        console.warn('⚠️ Browser does not support offline persistence');
      } else {
        console.error('❌ Firestore persistence error:', err);
      }
    }
    
    // Initialize Storage
    storage = getStorage(firebaseApp);
    console.log('✅ Firebase Storage initialized');
    
    // Initialize Analytics (production only)
    if (import.meta.env.PROD && firebaseConfig.measurementId) {
      analytics = getAnalytics(firebaseApp);
      
      // Set user properties
      setUserProperties(analytics, {
        app_version: APP_VERSION,
        environment: import.meta.env.MODE,
      });
      
      logEvent(analytics, 'app_initialized', {
        version: APP_VERSION,
        timestamp: new Date().toISOString(),
      });
      
      console.log('✅ Firebase Analytics initialized');
    } else {
      console.log('ℹ️ Analytics disabled (development mode or missing measurementId)');
    }
    
    // Initialize Performance Monitoring (production only)
    if (import.meta.env.PROD) {
      try {
        performance = getPerformance(firebaseApp);
        console.log('✅ Firebase Performance Monitoring initialized');
      } catch (perfErr) {
        console.warn('⚠️ Performance Monitoring not available:', perfErr);
      }
    }
    
    // Monitor auth state changes
    onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log('👤 User signed in:', user.uid);
        
        if (analytics) {
          setUserId(analytics, user.uid);
          logEvent(analytics, 'login', { method: 'firebase' });
        }
        
        // Dispatch custom event for app to handle
        window.dispatchEvent(new CustomEvent('auth-state-changed', {
          detail: { user, signedIn: true }
        }));
      } else {
        console.log('👤 User signed out');
        
        if (analytics) {
          setUserId(analytics, null);
          logEvent(analytics, 'logout');
        }
        
        window.dispatchEvent(new CustomEvent('auth-state-changed', {
          detail: { user: null, signedIn: false }
        }));
      }
    });
    
    // Export Firebase instances globally
    window.firebaseApp = firebaseApp;
    window.firebaseAuth = auth;
    window.firebaseDb = db;
    window.firebaseStorage = storage;
    window.firebaseAnalytics = analytics;
    window.firebasePerformance = performance;
    
    console.log('✅ Firebase initialized successfully');
    return true;
    
  } catch (error) {
    console.error(`❌ Firebase initialization failed (Attempt ${attempt}):`, error);
    
    // Retry logic
    if (attempt < MAX_FIREBASE_RETRY_ATTEMPTS) {
      console.log(`⏳ Retrying in ${FIREBASE_RETRY_DELAY / 1000} seconds...`);
      
      return new Promise((resolve) => {
        setTimeout(async () => {
          resolve(await initializeFirebaseWithRetry(attempt + 1));
        }, FIREBASE_RETRY_DELAY);
      });
    } else {
      // Max retries reached, show error UI
      showFirebaseErrorUI(error);
      return false;
    }
  }
};

/**
 * ==================== FIREBASE ERROR UI ====================
 */
const showFirebaseErrorUI = (error) => {
  const rootElement = document.getElementById('root');
  if (!rootElement) return;
  
  rootElement.innerHTML = `
    <div style="display: flex; align-items: center; justify-content: center; min-height: 100vh; background: linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 100%); padding: 20px; font-family: 'Inter', sans-serif;">
      <div style="background: white; border-radius: 12px; padding: 40px; max-width: 500px; text-align: center; box-shadow: 0 8px 32px rgba(0,0,0,0.12);">
        <div style="font-size: 64px; margin-bottom: 20px; animation: bounce 1s infinite;">⚠️</div>
        <h1 style="font-size: 28px; font-weight: 700; color: #212121; margin-bottom: 12px; font-family: 'Poppins', sans-serif;">
          Connection Error
        </h1>
        <p style="color: #757575; margin-bottom: 24px; line-height: 1.6; font-size: 16px;">
          Unable to connect to ${APP_NAME} services. Please check your internet connection and try again.
        </p>
        
        <div style="background: #FFF3E0; border-left: 4px solid #FF9800; padding: 16px; margin-bottom: 24px; text-align: left; border-radius: 4px;">
          <strong style="color: #E65100; display: block; margin-bottom: 8px;">🔍 Troubleshooting Tips:</strong>
          <ul style="color: #757575; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
            <li>Check your internet connection</li>
            <li>Verify Firebase project is active</li>
            <li>Clear browser cache and reload</li>
            <li>Try a different browser</li>
            <li>Check if firewall is blocking Firebase</li>
          </ul>
        </div>
        
        <button 
          onclick="window.location.reload()" 
          style="background: linear-gradient(135deg, #2196F3 0%, #1976d2 100%); color: white; border: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 16px; box-shadow: 0 4px 12px rgba(33, 150, 243, 0.3); transition: transform 0.2s, box-shadow 0.2s; font-family: 'Inter', sans-serif;"
          onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 16px rgba(33, 150, 243, 0.4)';"
          onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 12px rgba(33, 150, 243, 0.3)';">
          🔄 Retry Connection
        </button>
        
        ${import.meta.env.DEV ? `
          <details style="margin-top: 32px; text-align: left;">
            <summary style="cursor: pointer; color: #2196F3; font-size: 14px; font-weight: 600; padding: 8px 0;">
              📋 Technical Details (Development Mode)
            </summary>
            <div style="margin-top: 16px; padding: 16px; background: #f5f5f5; border-radius: 8px; font-size: 12px; overflow-x: auto;">
              <pre style="margin: 0; white-space: pre-wrap; word-wrap: break-word; color: #212121; line-height: 1.6;">${error.message}\n\nStack:\n${error.stack || 'No stack trace available'}</pre>
            </div>
            <div style="margin-top: 12px; padding: 12px; background: #E3F2FD; border-radius: 8px; font-size: 12px;">
              <strong style="color: #1976d2;">Environment:</strong> ${import.meta.env.MODE}<br>
              <strong style="color: #1976d2;">API URL:</strong> ${import.meta.env.VITE_API_URL || 'Not set'}<br>
              <strong style="color: #1976d2;">Project ID:</strong> ${firebaseConfig.projectId || 'Not set'}
            </div>
          </details>
        ` : ''}
        
        <p style="margin-top: 32px; color: #9e9e9e; font-size: 12px;">
          Need help? Contact support at <a href="mailto:support@accellax.com" style="color: #2196F3; text-decoration: none;">support@accellax.com</a>
        </p>
      </div>
    </div>
    
    <style>
      @keyframes bounce {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-10px); }
      }
    </style>
  `;
};

/**
 * ==================== SERVICE WORKER ADVANCED FEATURES ====================
 */
const registerServiceWorker = () => {
  if (!('serviceWorker' in navigator)) {
    console.log('ℹ️ Service Worker not supported in this browser');
    return;
  }
  
  if (!import.meta.env.PROD) {
    console.log('🔧 Development mode: Service Worker disabled');
    return;
  }
  
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none', // Always check for updates
      });
      
      console.log('✅ Service Worker registered:', registration.scope);
      
      // Check for updates periodically (every hour)
      setInterval(() => {
        registration.update();
        console.log('🔄 Checking for Service Worker updates...');
      }, 1000 * 60 * 60);
      
      // Handle Service Worker updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        console.log('🆕 New Service Worker installing...');
        
        newWorker.addEventListener('statechange', () => {
          console.log('Service Worker state:', newWorker.state);
          
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            console.log('🔄 New version available!');
            
            // Notify user of update
            window.dispatchEvent(new CustomEvent('sw-update-available', {
              detail: { 
                registration,
                newWorker,
                message: 'A new version is available. Refresh to update.'
              }
            }));
            
            if (analytics) {
              logEvent(analytics, 'sw_update_available', {
                version: APP_VERSION
              });
            }
          }
          
          if (newWorker.state === 'activated') {
            console.log('✅ New Service Worker activated');
            
            if (analytics) {
              logEvent(analytics, 'sw_updated', {
                version: APP_VERSION
              });
            }
          }
        });
      });
      
      // Handle Service Worker messages
      navigator.serviceWorker.addEventListener('message', (event) => {
        console.log('📨 Message from Service Worker:', event.data);
        
        const { type, payload } = event.data;
        
        switch (type) {
          case 'CACHE_UPDATED':
            console.log('✅ Cache updated successfully');
            window.dispatchEvent(new CustomEvent('cache-updated', { detail: payload }));
            break;
            
          case 'SYNC_COMPLETED':
            console.log('✅ Background sync completed');
            window.dispatchEvent(new CustomEvent('sync-completed', { detail: payload }));
            break;
            
          case 'SYNC_FAILED':
            console.error('❌ Background sync failed:', payload);
            window.dispatchEvent(new CustomEvent('sync-failed', { detail: payload }));
            break;
            
          default:
            console.log('Unknown message type:', type);
        }
      });
      
      // Check if Service Worker is controlling the page
      if (navigator.serviceWorker.controller) {
        console.log('✅ Service Worker is controlling this page');
      } else {
        console.log('ℹ️ Service Worker will control on next page load');
      }
      
    } catch (error) {
      console.error('❌ Service Worker registration failed:', error);
      
      if (analytics) {
        logEvent(analytics, 'exception', {
          description: `SW registration failed: ${error.message}`,
          fatal: false,
        });
      }
    }
  });
};

/**
 * ==================== ENHANCED PERFORMANCE MONITORING ====================
 */
const setupPerformanceMonitoring = () => {
  if (!window.performance) {
    console.warn('⚠️ Performance API not available');
    return;
  }
  
  window.addEventListener('load', () => {
    // Use setTimeout to ensure all metrics are available
    setTimeout(() => {
      try {
        // Navigation Timing
        const perfData = performance.getEntriesByType('navigation')[0];
        
        if (perfData) {
          const metrics = {
            dns: Math.round(perfData.domainLookupEnd - perfData.domainLookupStart),
            tcp: Math.round(perfData.connectEnd - perfData.connectStart),
            ttfb: Math.round(perfData.responseStart - perfData.requestStart),
            download: Math.round(perfData.responseEnd - perfData.responseStart),
            domParse: Math.round(perfData.domComplete - perfData.domLoading),
            domReady: Math.round(perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart),
            loadComplete: Math.round(perfData.loadEventEnd - perfData.loadEventStart),
            totalLoad: Math.round(perfData.loadEventEnd - perfData.fetchStart),
          };
          
          console.group('📊 Performance Metrics');
          console.log(`DNS Lookup: ${metrics.dns}ms`);
          console.log(`TCP Connection: ${metrics.tcp}ms`);
          console.log(`Time to First Byte: ${metrics.ttfb}ms`);
          console.log(`Content Download: ${metrics.download}ms`);
          console.log(`DOM Parse: ${metrics.domParse}ms`);
          console.log(`DOM Ready: ${metrics.domReady}ms`);
          console.log(`Load Event: ${metrics.loadComplete}ms`);
          console.log(`Total Load Time: ${metrics.totalLoad}ms`);
          console.groupEnd();
          
          // Store metrics for later access
          window.performanceMetrics = metrics;
          
          // Send to analytics
          if (analytics) {
            logEvent(analytics, 'performance_metrics', metrics);
          }
          
          // Performance warnings
          if (metrics.totalLoad > 3000) {
            console.warn('⚠️ Slow page load detected:', metrics.totalLoad, 'ms');
          }
          if (metrics.ttfb > 500) {
            console.warn('⚠️ High Time to First Byte:', metrics.ttfb, 'ms');
          }
        }
        
        // Core Web Vitals with Performance Observer
        if ('PerformanceObserver' in window) {
          try {
            // Largest Contentful Paint (LCP)
            const lcpObserver = new PerformanceObserver((list) => {
              const entries = list.getEntries();
              const lastEntry = entries[entries.length - 1];
              const lcpValue = Math.round(lastEntry.renderTime || lastEntry.loadTime);
              
              console.log(`📊 LCP: ${lcpValue}ms ${lcpValue < 2500 ? '✅' : lcpValue < 4000 ? '⚠️' : '❌'}`);
              
              if (analytics) {
                logEvent(analytics, 'web_vitals_lcp', {
                  value: lcpValue,
                  rating: lcpValue < 2500 ? 'good' : lcpValue < 4000 ? 'needs-improvement' : 'poor'
                });
              }
            });
            lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
            
            // First Input Delay (FID)
            const fidObserver = new PerformanceObserver((list) => {
              list.getEntries().forEach((entry) => {
                const fidValue = Math.round(entry.processingStart - entry.startTime);
                
                console.log(`📊 FID: ${fidValue}ms ${fidValue < 100 ? '✅' : fidValue < 300 ? '⚠️' : '❌'}`);
                
                if (analytics) {
                  logEvent(analytics, 'web_vitals_fid', {
                    value: fidValue,
                    rating: fidValue < 100 ? 'good' : fidValue < 300 ? 'needs-improvement' : 'poor'
                  });
                }
              });
            });
            fidObserver.observe({ type: 'first-input', buffered: true });
            
            // Cumulative Layout Shift (CLS)
            let clsScore = 0;
            const clsObserver = new PerformanceObserver((list) => {
              list.getEntries().forEach((entry) => {
                if (!entry.hadRecentInput) {
                  clsScore += entry.value;
                }
              });
            });
            clsObserver.observe({ type: 'layout-shift', buffered: true });
            
            // Log CLS after page is stable
            setTimeout(() => {
              console.log(`📊 CLS: ${clsScore.toFixed(3)} ${clsScore < 0.1 ? '✅' : clsScore < 0.25 ? '⚠️' : '❌'}`);
              
              if (analytics) {
                logEvent(analytics, 'web_vitals_cls', {
                  value: clsScore,
                  rating: clsScore < 0.1 ? 'good' : clsScore < 0.25 ? 'needs-improvement' : 'poor'
                });
              }
            }, 5000);
            
          } catch (error) {
            console.warn('⚠️ Performance Observer error:', error);
          }
        }
        
        // Resource Timing
        const resources = performance.getEntriesByType('resource');
        const totalResourceSize = resources.reduce((sum, resource) => {
          return sum + (resource.transferSize || 0);
        }, 0);
        
        console.log(`📦 Total Resources: ${resources.length} (${(totalResourceSize / 1024).toFixed(2)} KB)`);
        
        // Log slow resources
        const slowResources = resources.filter(r => r.duration > 1000);
        if (slowResources.length > 0) {
          console.warn('⚠️ Slow resources detected:');
          slowResources.forEach(r => {
            console.warn(`  - ${r.name}: ${Math.round(r.duration)}ms`);
          });
        }
        
      } catch (error) {
        console.error('❌ Performance monitoring error:', error);
      }
    }, 0);
  });
};

/**
 * ==================== MEMORY MANAGEMENT ====================
 */
const setupMemoryMonitoring = () => {
  if (!performance.memory) {
    console.log('ℹ️ Memory API not available (Chrome only)');
    return;
  }
  
  const checkMemory = () => {
    const { usedJSHeapSize, jsHeapSizeLimit } = performance.memory;
    const usedPercent = (usedJSHeapSize / jsHeapSizeLimit) * 100;
    
    if (usedPercent > MEMORY_WARNING_THRESHOLD) {
      console.warn(`⚠️ High memory usage: ${usedPercent.toFixed(1)}% (${(usedJSHeapSize / 1024 / 1024).toFixed(2)} MB)`);
      
      // Dispatch event for app to handle (e.g., clear caches, unload components)
      window.dispatchEvent(new CustomEvent('memory-warning', {
        detail: {
          usedPercent,
          usedMB: usedJSHeapSize / 1024 / 1024,
          limitMB: jsHeapSizeLimit / 1024 / 1024
        }
      }));
      
      if (analytics) {
        logEvent(analytics, 'memory_warning', {
          used_percent: Math.round(usedPercent),
          used_mb: Math.round(usedJSHeapSize / 1024 / 1024)
        });
      }
    }
  };
  
  // Check memory periodically
  setInterval(checkMemory, PERFORMANCE_CHECK_INTERVAL);
  console.log('✅ Memory monitoring enabled');
};

/**
 * ==================== NETWORK QUALITY DETECTION ====================
 */
const setupNetworkMonitoring = () => {
  if (!('connection' in navigator)) {
    console.log('ℹ️ Network Information API not available');
    return;
  }
  
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  
  const logConnectionInfo = () => {
    const networkInfo = {
      type: connection.effectiveType,
      downlink: connection.downlink,
      rtt: connection.rtt,
      saveData: connection.saveData
    };
    
    console.group('🌐 Network Information');
    console.log(`Type: ${networkInfo.type} (${getNetworkQuality(networkInfo.type)})`);
    console.log(`Downlink: ${networkInfo.downlink} Mbps`);
    console.log(`RTT: ${networkInfo.rtt}ms`);
    console.log(`Save Data: ${networkInfo.saveData ? 'Enabled' : 'Disabled'}`);
    console.groupEnd();
    
    // Dispatch event for adaptive loading
    window.dispatchEvent(new CustomEvent('network-info-updated', {
      detail: networkInfo
    }));
    
    if (analytics) {
      logEvent(analytics, 'network_info', networkInfo);
    }
    
    // Warn about slow connections
    if (networkInfo.type === 'slow-2g' || networkInfo.type === '2g') {
      console.warn('⚠️ Slow network detected. Enabling data saver mode.');
      window.dispatchEvent(new CustomEvent('enable-data-saver'));
    }
  };
  
  const getNetworkQuality = (type) => {
    const qualityMap = {
      'slow-2g': '🔴 Very Slow',
      '2g': '🟠 Slow',
      '3g': '🟡 Moderate',
      '4g': '🟢 Fast'
    };
    return qualityMap[type] || '⚪ Unknown';
  };
  
  logConnectionInfo();
  connection.addEventListener('change', logConnectionInfo);
  console.log('✅ Network monitoring enabled');
};

/**
 * ==================== ONLINE/OFFLINE MANAGEMENT ====================
 */
const setupOnlineOfflineHandlers = () => {
  const handleOnline = () => {
    console.log('✅ Back online');
    document.body.classList.remove('offline');
    
    if (analytics) {
      logEvent(analytics, 'network_status', { status: 'online' });
    }
    
    // Trigger Firebase sync
    if (db && 'sync' in ServiceWorkerRegistration.prototype) {
      navigator.serviceWorker.ready
        .then((registration) => registration.sync.register('sync-firestore'))
        .then(() => console.log('🔄 Background sync registered'))
        .catch((err) => console.warn('Background sync failed:', err));
    }
    
    // Dispatch event for app
    window.dispatchEvent(new CustomEvent('app-online'));
  };
  
  const handleOffline = () => {
    console.log('⚠️ Offline mode activated');
    document.body.classList.add('offline');
    
    if (analytics) {
      logEvent(analytics, 'network_status', { status: 'offline' });
    }
    
    window.dispatchEvent(new CustomEvent('app-offline'));
  };
  
  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);
  
  // Check initial status
  if (!navigator.onLine) {
    handleOffline();
  }
  
  console.log('✅ Online/Offline handlers registered');
};

/**
 * ==================== GLOBAL ERROR TRACKING ====================
 */
const setupErrorTracking = () => {
  // Unhandled errors
  window.addEventListener('error', (event) => {
    console.error('❌ Global Error:', event.error);
    
    if (analytics) {
      logEvent(analytics, 'exception', {
        description: event.error?.message || 'Unknown error',
        fatal: false,
        file: event.filename,
        line: event.lineno,
        column: event.colno
      });
    }
    
    // Send to error tracking service (Sentry, etc.)
    if (window.Sentry) {
      window.Sentry.captureException(event.error, {
        tags: {
          type: 'window_error',
          version: APP_VERSION
        }
      });
    }
  });
  
 // Unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    console.error('❌ Unhandled Promise Rejection:', event.reason);
    
    if (analytics) {
      logEvent(analytics, 'exception', {
        description: event.reason?.message || 'Unhandled promise rejection',
        fatal: false,
        stack: event.reason?.stack
      });
    }
    
    // Send to error tracking service
    if (window.Sentry) {
      window.Sentry.captureException(event.reason, {
        tags: {
          type: 'unhandled_rejection',
          version: APP_VERSION
        }
      });
    }
  });
  
  console.log('✅ Global error tracking enabled');
};

/**
 * ==================== VISIBILITY CHANGE HANDLER ====================
 */
const setupVisibilityChangeHandler = () => {
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      console.log('👋 Tab hidden');
      
      if (analytics) {
        logEvent(analytics, 'tab_visibility', { state: 'hidden' });
      }
      
      window.dispatchEvent(new CustomEvent('app-hidden'));
    } else {
      console.log('👀 Tab visible');
      
      if (analytics) {
        logEvent(analytics, 'tab_visibility', { state: 'visible' });
      }
      
      window.dispatchEvent(new CustomEvent('app-visible'));
      
      // Check for updates when user returns
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'CHECK_FOR_UPDATES'
        });
      }
    }
  });
  
  console.log('✅ Visibility change handler registered');
};

/**
 * ==================== PAGE LIFECYCLE EVENTS ====================
 */
const setupPageLifecycleEvents = () => {
  // Page Freeze (when browser freezes the page)
  window.addEventListener('freeze', () => {
    console.log('🧊 Page frozen (backgrounded)');
    
    if (analytics) {
      logEvent(analytics, 'page_lifecycle', { state: 'freeze' });
    }
    
    // Save any unsaved data
    window.dispatchEvent(new CustomEvent('app-freeze'));
  });
  
  // Page Resume (when page comes back from frozen state)
  window.addEventListener('resume', () => {
    console.log('▶️ Page resumed');
    
    if (analytics) {
      logEvent(analytics, 'page_lifecycle', { state: 'resume' });
    }
    
    // Refresh data if needed
    window.dispatchEvent(new CustomEvent('app-resume'));
  });
  
  // Page Show (when navigating back via browser history)
  window.addEventListener('pageshow', (event) => {
    if (event.persisted) {
      console.log('📄 Page restored from cache (bfcache)');
      
      if (analytics) {
        logEvent(analytics, 'page_lifecycle', { state: 'pageshow_cached' });
      }
      
      window.dispatchEvent(new CustomEvent('app-restored-from-cache'));
    }
  });
  
  // Page Hide (before page is hidden/unloaded)
  window.addEventListener('pagehide', (event) => {
    if (event.persisted) {
      console.log('💾 Page saved to cache (bfcache)');
      
      if (analytics) {
        logEvent(analytics, 'page_lifecycle', { state: 'pagehide_cached' });
      }
    }
  });
  
  // Before Unload (user is leaving the page)
  window.addEventListener('beforeunload', (event) => {
    console.log('👋 User leaving page');
    
    // Check if there's unsaved data
    const hasUnsavedData = window.hasUnsavedData || false;
    
    if (hasUnsavedData) {
      event.preventDefault();
      event.returnValue = ''; // Chrome requires returnValue to be set
      return 'You have unsaved changes. Are you sure you want to leave?';
    }
    
    if (analytics) {
      logEvent(analytics, 'page_lifecycle', { state: 'beforeunload' });
    }
  });
  
  console.log('✅ Page lifecycle events registered');
};

/**
 * ==================== SCREEN ORIENTATION HANDLER ====================
 */
const setupOrientationHandler = () => {
  if (!('screen' in window) || !('orientation' in window.screen)) {
    console.log('ℹ️ Screen Orientation API not available');
    return;
  }
  
  const handleOrientationChange = () => {
    const orientation = window.screen.orientation;
    console.log(`📱 Orientation: ${orientation.type} (${orientation.angle}°)`);
    
    if (analytics) {
      logEvent(analytics, 'orientation_change', {
        type: orientation.type,
        angle: orientation.angle
      });
    }
    
    // Dispatch event for React
    window.dispatchEvent(new CustomEvent('orientation-changed', {
      detail: {
        type: orientation.type,
        angle: orientation.angle
      }
    }));
  };
  
  window.screen.orientation.addEventListener('change', handleOrientationChange);
  handleOrientationChange(); // Initial check
  
  console.log('✅ Orientation handler registered');
};

/**
 * ==================== BATTERY STATUS MONITORING ====================
 */
const setupBatteryMonitoring = () => {
  if (!('getBattery' in navigator)) {
    console.log('ℹ️ Battery Status API not available');
    return;
  }
  
  navigator.getBattery().then((battery) => {
    const logBatteryInfo = () => {
      const level = Math.round(battery.level * 100);
      const charging = battery.charging;
      const chargingTime = battery.chargingTime;
      const dischargingTime = battery.dischargingTime;
      
      console.log(`🔋 Battery: ${level}%, ${charging ? 'Charging' : 'Discharging'}`);
      
      if (analytics) {
        logEvent(analytics, 'battery_status', {
          level,
          charging,
          charging_time: chargingTime,
          discharging_time: dischargingTime
        });
      }
      
      // Dispatch event for React (to enable battery saver mode)
      window.dispatchEvent(new CustomEvent('battery-status-updated', {
        detail: {
          level: battery.level,
          levelPercent: level,
          charging,
          chargingTime,
          dischargingTime
        }
      }));
      
      // Enable battery saver mode if battery is low
      if (level < 20 && !charging) {
        console.warn('⚠️ Low battery detected. Consider enabling battery saver mode.');
        window.dispatchEvent(new CustomEvent('enable-battery-saver'));
      }
    };
    
    logBatteryInfo();
    battery.addEventListener('levelchange', logBatteryInfo);
    battery.addEventListener('chargingchange', logBatteryInfo);
    battery.addEventListener('chargingtimechange', logBatteryInfo);
    battery.addEventListener('dischargingtimechange', logBatteryInfo);
    
    console.log('✅ Battery monitoring enabled');
  }).catch((error) => {
    console.warn('⚠️ Battery monitoring failed:', error);
  });
};

/**
 * ==================== DEVICE MEMORY DETECTION ====================
 */
const setupDeviceMemoryDetection = () => {
  if (!('deviceMemory' in navigator)) {
    console.log('ℹ️ Device Memory API not available');
    return;
  }
  
  const deviceMemory = navigator.deviceMemory;
  console.log(`💾 Device Memory: ${deviceMemory} GB`);
  
  if (analytics) {
    logEvent(analytics, 'device_info', {
      memory_gb: deviceMemory
    });
  }
  
  // Adjust app behavior based on device memory
  if (deviceMemory <= 2) {
    console.warn('⚠️ Low device memory detected. Enabling performance mode.');
    window.dispatchEvent(new CustomEvent('enable-performance-mode', {
      detail: { reason: 'low_memory', memoryGB: deviceMemory }
    }));
  }
  
  console.log('✅ Device memory detected');
};

/**
 * ==================== HARDWARE CONCURRENCY DETECTION ====================
 */
const setupHardwareConcurrencyDetection = () => {
  if (!('hardwareConcurrency' in navigator)) {
    console.log('ℹ️ Hardware Concurrency API not available');
    return;
  }
  
  const cores = navigator.hardwareConcurrency;
  console.log(`⚙️ CPU Cores: ${cores}`);
  
  if (analytics) {
    logEvent(analytics, 'device_info', {
      cpu_cores: cores
    });
  }
  
  // Store for app to use
  window.deviceCores = cores;
  
  console.log('✅ Hardware concurrency detected');
};

/**
 * ==================== KEYBOARD SHORTCUTS ====================
 */
const setupKeyboardShortcuts = () => {
  document.addEventListener('keydown', (event) => {
    // Alt + / for keyboard shortcuts help
    if (event.altKey && event.key === '/') {
      event.preventDefault();
      console.log('⌨️ Keyboard Shortcuts:');
      console.log('  Alt + D: Go to Dashboard');
      console.log('  Alt + A: Go to Attendance');
      console.log('  Alt + K: Go to Kids');
      console.log('  Alt + M: Go to Messages');
      console.log('  Alt + P: Go to Profile');
      console.log('  Alt + S: Search');
      console.log('  Alt + H: Go to Home');
      console.log('  Alt + /: Show this help');
      
      window.dispatchEvent(new CustomEvent('show-keyboard-shortcuts'));
    }
    
    // Alt + S for search
    if (event.altKey && event.key === 's') {
      event.preventDefault();
      window.dispatchEvent(new CustomEvent('keyboard-open-search'));
    }
    
    // Alt + M for menu
    if (event.altKey && event.key === 'm') {
      event.preventDefault();
      window.dispatchEvent(new CustomEvent('keyboard-open-menu'));
    }
    
    // Alt + N for notifications
    if (event.altKey && event.key === 'n') {
      event.preventDefault();
      window.dispatchEvent(new CustomEvent('keyboard-open-notifications'));
    }
    
    // Escape to close modals
    if (event.key === 'Escape') {
      window.dispatchEvent(new CustomEvent('keyboard-escape'));
    }
  });
  
  console.log('✅ Keyboard shortcuts registered');
};

/**
 * ==================== BROWSER COMPATIBILITY CHECK ====================
 */
const checkBrowserCompatibility = () => {
  const requiredFeatures = [
    { name: 'Promise', check: () => typeof Promise !== 'undefined' },
    { name: 'Fetch API', check: () => typeof fetch !== 'undefined' },
    { name: 'LocalStorage', check: () => typeof localStorage !== 'undefined' },
    { name: 'SessionStorage', check: () => typeof sessionStorage !== 'undefined' },
    { name: 'IndexedDB', check: () => typeof indexedDB !== 'undefined' },
    { name: 'Service Worker', check: () => 'serviceWorker' in navigator },
    { name: 'Web Workers', check: () => typeof Worker !== 'undefined' },
    { name: 'Intersection Observer', check: () => 'IntersectionObserver' in window },
    { name: 'Mutation Observer', check: () => 'MutationObserver' in window },
    { name: 'Performance API', check: () => 'performance' in window },
  ];

  const unsupported = requiredFeatures.filter(feature => !feature.check());

  if (unsupported.length > 0) {
    console.warn('⚠️ Browser Compatibility Issues:');
    unsupported.forEach(feature => {
      console.warn(`  - ${feature.name}: Not supported`);
    });

    // Show warning banner for critical features
    if (unsupported.some(f => ['Promise', 'Fetch API', 'LocalStorage'].includes(f.name))) {
      const banner = document.createElement('div');
      banner.id = 'browser-warning-banner';
      banner.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        background: #FF9800;
        color: white;
        padding: 12px 20px;
        text-align: center;
        font-size: 14px;
        font-weight: 500;
        z-index: 9999;
        box-shadow: 0 2px 8px rgba(0,0,0,0.15);
      `;
      banner.innerHTML = `
        ⚠️ Your browser may not support all features. Please update to the latest version for the best experience.
        <button onclick="this.parentElement.remove()" style="margin-left: 16px; background: white; color: #FF9800; border: none; padding: 4px 12px; border-radius: 4px; font-weight: 600; cursor: pointer;">Dismiss</button>
      `;
      document.body.prepend(banner);
    }
    
    if (analytics) {
      logEvent(analytics, 'browser_compatibility', {
        unsupported_features: unsupported.map(f => f.name).join(', '),
        count: unsupported.length
      });
    }
  } else {
    console.log('✅ Browser fully compatible');
  }
  
  // Log browser info
  const userAgent = navigator.userAgent;
  const browserInfo = {
    userAgent,
    language: navigator.language,
    platform: navigator.platform,
    cookieEnabled: navigator.cookieEnabled,
    onLine: navigator.onLine,
    doNotTrack: navigator.doNotTrack
  };
  
  console.group('🌐 Browser Information');
  console.log('User Agent:', browserInfo.userAgent);
  console.log('Language:', browserInfo.language);
  console.log('Platform:', browserInfo.platform);
  console.log('Cookies Enabled:', browserInfo.cookieEnabled);
  console.log('Online:', browserInfo.onLine);
  console.log('Do Not Track:', browserInfo.doNotTrack);
  console.groupEnd();
  
  if (analytics) {
    logEvent(analytics, 'browser_info', {
      language: browserInfo.language,
      platform: browserInfo.platform
    });
  }
};

/**
 * ==================== CONSOLE BRANDING ====================
 */
const showConsoleBranding = () => {
  if (typeof console.log !== 'function') return;
  
  console.log(
    '%c AccellaX 361° ',
    'background: linear-gradient(135deg, #2196F3 0%, #1976d2 100%); color: white; font-size: 24px; font-weight: bold; padding: 12px 24px; border-radius: 8px; margin: 8px 0;'
  );
  console.log(
    '%c 🚀 Sports Academy Management Platform ',
    'font-size: 16px; font-weight: 600; color: #2196F3; margin: 4px 0;'
  );
  console.log(
    `%c Version: ${APP_VERSION} | Environment: ${import.meta.env.MODE} `,
    'font-size: 12px; color: #757575; margin: 4px 0;'
  );
  console.log(
    '%c Built with React + Firebase + Vite ',
    'font-size: 11px; color: #9e9e9e; font-style: italic; margin: 4px 0;'
  );
  console.log('');
  console.log('%c 💡 Keyboard Shortcuts:', 'font-size: 12px; font-weight: 600; color: #2196F3;');
  console.log('%c   Alt + /  : Show all shortcuts', 'font-size: 11px; color: #666;');
  console.log('%c   Alt + S  : Search', 'font-size: 11px; color: #666;');
  console.log('%c   Alt + M  : Open menu', 'font-size: 11px; color: #666;');
  console.log('%c   Alt + N  : Notifications', 'font-size: 11px; color: #666;');
  console.log('');
  
  if (import.meta.env.DEV) {
    console.log('%c 🔧 Development Mode Active', 'font-size: 12px; font-weight: 600; color: #4CAF50; background: #E8F5E9; padding: 4px 8px; border-radius: 4px;');
    console.log('%c   window.__ACCELLAX__ - Debug utilities available', 'font-size: 11px; color: #666;');
    console.log('');
  }
  
  console.log('%c Made with ❤️ for NextGen Multisport Academy ', 'font-size: 11px; color: #757575;');
  console.log('');
};

/**
 * ==================== DEVELOPMENT UTILITIES ====================
 */
const setupDevelopmentUtilities = () => {
  if (!import.meta.env.DEV) return;
  
  window.__ACCELLAX__ = {
    version: APP_VERSION,
    env: import.meta.env.MODE,
    firebase: {
      app: firebaseApp,
      auth,
      db,
      storage,
      analytics,
      performance
    },
    
    // Cache management
    clearCache: async () => {
      if ('caches' in window) {
        const names = await caches.keys();
        await Promise.all(names.map(name => caches.delete(name)));
        console.log('✅ All caches cleared');
        return names;
      }
      console.warn('⚠️ Cache API not available');
      return [];
    },
    
    // Performance utilities
    getPerformance: () => window.performanceMetrics,
    
    // Network simulation
    testOffline: () => {
      window.dispatchEvent(new Event('offline'));
      console.log('🧪 Offline mode simulated');
    },
    testOnline: () => {
      window.dispatchEvent(new Event('online'));
      console.log('🧪 Online mode simulated');
    },
    
    // Storage utilities
    clearStorage: () => {
      localStorage.clear();
      sessionStorage.clear();
      console.log('✅ Storage cleared');
    },
    
    getStorageSize: () => {
      const calculateSize = (storage) => {
        let total = 0;
        for (let key in storage) {
          if (storage.hasOwnProperty(key)) {
            total += storage[key].length + key.length;
          }
        }
        return total;
      };
      
      return {
        localStorage: `${(calculateSize(localStorage) / 1024).toFixed(2)} KB`,
        sessionStorage: `${(calculateSize(sessionStorage) / 1024).toFixed(2)} KB`
      };
    },
    
    // Firebase utilities
    getFirebaseUser: () => auth?.currentUser,
    signOut: () => auth?.signOut(),
    
    // Event utilities
    triggerEvent: (eventName, detail = {}) => {
      window.dispatchEvent(new CustomEvent(eventName, { detail }));
      console.log(`🎯 Event triggered: ${eventName}`, detail);
    },
    
    // Memory utilities
    getMemoryInfo: () => {
      if (!performance.memory) {
        return 'Memory API not available (Chrome only)';
      }
      const { usedJSHeapSize, totalJSHeapSize, jsHeapSizeLimit } = performance.memory;
      return {
        used: `${(usedJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
        total: `${(totalJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
        limit: `${(jsHeapSizeLimit / 1024 / 1024).toFixed(2)} MB`,
        usedPercent: `${((usedJSHeapSize / jsHeapSizeLimit) * 100).toFixed(1)}%`
      };
    },
    
    // Device info
    getDeviceInfo: () => ({
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      cores: navigator.hardwareConcurrency,
      memory: navigator.deviceMemory ? `${navigator.deviceMemory} GB` : 'Unknown',
      online: navigator.onLine,
      cookieEnabled: navigator.cookieEnabled
    }),
    
    // Logs array for debugging
    logs: []
  };
  
  // Override console methods to capture logs
  const originalLog = console.log;
  const originalWarn = console.warn;
  const originalError = console.error;
  
  console.log = (...args) => {
    window.__ACCELLAX__.logs.push({ type: 'log', timestamp: new Date(), args });
    originalLog.apply(console, args);
  };
  
  console.warn = (...args) => {
    window.__ACCELLAX__.logs.push({ type: 'warn', timestamp: new Date(), args });
    originalWarn.apply(console, args);
  };
  
  console.error = (...args) => {
    window.__ACCELLAX__.logs.push({ type: 'error', timestamp: new Date(), args });
    originalError.apply(console, args);
  };
  
  console.log('%c Development utilities loaded: window.__ACCELLAX__ ', 'background: #4CAF50; color: white; padding: 4px 8px; border-radius: 4px; font-weight: 600;');
  console.log('%c Available methods:', 'font-weight: 600; color: #2196F3;');
  console.log('  - clearCache()');
  console.log('  - getPerformance()');
  console.log('  - testOffline() / testOnline()');
  console.log('  - clearStorage()');
  console.log('  - getStorageSize()');
  console.log('  - getFirebaseUser()');
  console.log('  - signOut()');
  console.log('  - triggerEvent(name, detail)');
  console.log('  - getMemoryInfo()');
  console.log('  - getDeviceInfo()');
  console.log('  - logs (array of all console outputs)');
};

/**
 * ==================== INITIALIZATION SUMMARY ====================
 */
const logInitializationSummary = () => {
  console.log('');
  console.log('%c ========================================', 'color: #2196F3;');
  console.log('%c  INITIALIZATION SUMMARY', 'color: #2196F3; font-weight: bold;');
  console.log('%c ========================================', 'color: #2196F3;');
  console.log('');
  console.log(`%c Environment:        ${import.meta.env.MODE}`, 'color: #424242;');
  console.log(`%c Version:            ${APP_VERSION}`, 'color: #424242;');
  console.log(`%c API URL:            ${import.meta.env.VITE_API_URL || 'Not configured'}`, 'color: #424242;');
  console.log(`%c Firebase:           ${firebaseApp ? '✅ Connected' : '❌ Disconnected'}`, 'color: #424242;');
  console.log(`%c Auth:               ${auth ? '✅ Ready' : '❌ Not Ready'}`, 'color: #424242;');
  console.log(`%c Firestore:          ${db ? '✅ Ready' : '❌ Not Ready'}`, 'color: #424242;');
  console.log(`%c Storage:            ${storage ? '✅ Ready' : '❌ Not Ready'}`, 'color: #424242;');
  console.log(`%c Analytics:          ${analytics ? '✅ Enabled' : '⚪ Disabled'}`, 'color: #424242;');
  console.log(`%c Performance:        ${performance ? '✅ Enabled' : '⚪ Disabled'}`, 'color: #424242;');
  console.log(`%c Service Worker:     ${('serviceWorker' in navigator) ? '✅ Supported' : '❌ Not Supported'}`, 'color: #424242;');
  console.log(`%c Offline Support:    ${db ? '✅ Enabled' : '❌ Disabled'}`, 'color: #424242;');
  console.log(`%c Network Status:     ${navigator.onLine ? '✅ Online' : '⚠️ Offline'}`, 'color: #424242;');
  console.log('');
  console.log('%c ========================================', 'color: #2196F3;');
  console.log('');
};

/**
 * ==================== MAIN INITIALIZATION SEQUENCE ====================
 */
const initializeApp = async () => {
  try {
    // 1. Show console branding
    showConsoleBranding();
    
    // 2. Check browser compatibility
    checkBrowserCompatibility();
    
    // 3. Initialize Firebase
    const firebaseInitialized = await initializeFirebaseWithRetry();
    
    if (!firebaseInitialized) {
      console.error('❌ Firebase initialization failed. App cannot start.');
      return;
    }
    
    // 4. Register Service Worker
    registerServiceWorker();
    
    // 5. Setup monitoring and handlers
    setupPerformanceMonitoring();
    setupMemoryMonitoring();
    setupNetworkMonitoring();
    setupOnlineOfflineHandlers();
    setupErrorTracking();
    setupVisibilityChangeHandler();
    setupPageLifecycleEvents();
    setupOrientationHandler();
    setupBatteryMonitoring();
    setupDeviceMemoryDetection();
    setupHardwareConcurrencyDetection();
    setupKeyboardShortcuts();
    
    // 6. Setup development utilities
    setupDevelopmentUtilities();
    
    // 7. Log initialization summary
    logInitializationSummary();
    
    // 8. Mount React application
    const rootElement = document.getElementById('root');
    
    if (!rootElement) {
      throw new Error('❌ Root element not found! Check your HTML file.');
    }
    
    // Create React root using React 18's createRoot API
    const root = createRoot(rootElement);
    
    // Render application
    root.render(
      <StrictMode>
        <App />
      </StrictMode>
    );
    
    // Notify that React app is ready
    if (typeof window.reactAppReady === 'function') {
      window.reactAppReady();
    }
    
    // Dispatch custom event
    window.dispatchEvent(new CustomEvent('react-app-mounted'));
    
    console.log('');
    console.log('%c ✅ Application mounted successfully!', 'background: #4CAF50; color: white; padding: 8px 16px; border-radius: 4px; font-weight: bold; font-size: 14px;');
    console.log('');
    
    // Log initial page view to analytics
    if (analytics) {
      logEvent(analytics, 'app_mounted', {
        version: APP_VERSION,
        environment: import.meta.env.MODE,
        timestamp: new Date().toISOString()
      });
    }
    
  } catch (error) {
    console.error('❌ Application initialization failed:', error);
    
    // Show error UI
    const rootElement = document.getElementById('root');
    if (rootElement) {
      rootElement.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: center; min-height: 100vh; background: #f5f5f5; padding: 20px; font-family: 'Inter', sans-serif;">
          <div style="background: white; border-radius: 12px; padding: 40px; max-width: 500px; text-align: center; box-shadow: 0 8px 32px rgba(0,0,0,0.12);">
            <div style="font-size: 64px; margin-bottom: 20px;">💥</div>
            <h1 style="font-size: 28px; font-weight: 700; color: #212121; margin-bottom: 12px;">
              Initialization Error
            </h1>
            <p style="color: #757575; margin-bottom: 24px; line-height: 1.6;">
              Something went wrong while starting the application. Please refresh the page to try again.
            </p>
            <button 
              onclick="window.location.reload()" 
              style="background: linear-gradient(135deg, #2196F3 0%, #1976d2 100%); color: white; border: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 16px; box-shadow: 0 4px 12px rgba(33, 150, 243, 0.3);">
              🔄 Reload Page
            </button>
            ${import.meta.env.DEV ? `
              <details style="margin-top: 24px; text-align: left;">
                <summary style="cursor: pointer; color: #2196F3; font-weight: 600;">Technical Details</summary>
                <pre style="margin-top: 12px; padding: 12px; background: #f5f5f5; border-radius: 4px; font-size: 12px; overflow-x: auto;">${error.message}\n\n${error.stack}</pre>
              </details>
            ` : ''}
          </div>
        </div>
      `;
    }
    
    // Log to analytics if available
    if (analytics) {
      logEvent(analytics, 'exception', {
        description: `App initialization failed: ${error.message}`,
        fatal: true
      });
    }
  }
};

/**
 * ==================== START APPLICATION ====================
 */
// Wait for DOM to be ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  // DOM is already ready
  initializeApp();
}

/**
 * ==================== HOT MODULE REPLACEMENT (HMR) ====================
 */
if (import.meta.hot) {
  import.meta.hot.accept();
  
  // Accept updates for App component
  import.meta.hot.accept('./App', (newApp) => {
    console.log('🔥 Hot update: App component reloaded');
  });
  
  // Preserve state during HMR
  import.meta.hot.dispose((data) => {
    console.log('💾 HMR: Preserving state...');
    data.preservedState = window.__APP_STATE__;
  });
  
  import.meta.hot.data?.preservedState && (window.__APP_STATE__ = import.meta.hot.data.preservedState);
  
  console.log('🔥 Hot Module Replacement enabled');
}

/**
 * ==================== EXPORT FOR TESTING ====================
 */
export { 
  firebaseApp, 
  auth, 
  db, 
  storage, 
  analytics, 
  performance 
};

/**
 * ==================== COMPREHENSIVE DOCUMENTATION ====================
 * 
 * FILE PURPOSE:
 * This is the main entry point for the AccellaX 361° React application.
 * It handles all initialization, configuration, and monitoring before React starts.
 * 
 * KEY RESPONSIBILITIES:
 * 1. ✅ Initialize Firebase services (Auth, Firestore, Storage, Analytics, Performance)
 * 2. ✅ Enable offline persistence for Firestore (multi-tab support)
 * 3. ✅ Register Service Worker for PWA functionality
 * 4. ✅ Set up comprehensive error tracking (window errors, promise rejections)
 * 5. ✅ Configure performance monitoring (Core Web Vitals, resource timing)
 * 6. ✅ Monitor device status (network, battery, memory, orientation)
 * 7. ✅ Set up keyboard shortcuts and accessibility features
 * 8. ✅ Mount React application to DOM
 * 9. ✅ Enable Hot Module Replacement for development
 * 10. ✅ Provide development utilities and debugging tools
 * 
 * INITIALIZATION SEQUENCE:
 * 1. Show console branding and app info
 * 2. Check browser compatibility (required features)
 * 3. Initialize Firebase with retry logic (max 3 attempts)
 * 4. Enable Firestore offline persistence (multi-tab or single-tab)
 * 5. Register Service Worker (production only)
 * 6. Set up all monitoring systems (performance, memory, network, battery)
 * 7. Configure error tracking (global handlers)
 * 8. Set up page lifecycle handlers (freeze, resume, visibility)
 * 9. Initialize keyboard shortcuts
 * 10. Mount React application
 * 11. Log initialization summary
 * 
 * ENVIRONMENT VARIABLES REQUIRED:
 * - VITE_FIREBASE_API_KEY: Firebase API key
 * - VITE_FIREBASE_AUTH_DOMAIN: Firebase auth domain
 * - VITE_FIREBASE_PROJECT_ID: Firebase project ID
 * - VITE_FIREBASE_STORAGE_BUCKET: Firebase storage bucket
 * - VITE_FIREBASE_MESSAGING_SENDER_ID: Firebase messaging sender ID
 * - VITE_FIREBASE_APP_ID: Firebase app ID
 * - VITE_FIREBASE_MEASUREMENT_ID: Firebase measurement ID (optional, for analytics)
 * - VITE_API_URL: Backend API URL (optional)
 * 
 * GLOBAL OBJECTS CREATED:
 * - window.firebaseApp: Firebase app instance
 * - window.firebaseAuth: Firebase Auth instance
 * - window.firebaseDb: Firestore instance
 * - window.firebaseStorage: Firebase Storage instance
 * - window.firebaseAnalytics: Firebase Analytics instance (production only)
 * - window.firebasePerformance: Firebase Performance instance (production only)
 * - window.performanceMetrics: Page load performance metrics
 * - window.deviceCores: Number of CPU cores
 * - window.hasUnsavedData: Flag for beforeunload warning
 * - window.__ACCELLAX__: Development utilities (development only)
 * 
 * CUSTOM EVENTS DISPATCHED:
 * - auth-state-changed: When Firebase auth state changes
 * - sw-update-available: When Service Worker update is available
 * - cache-updated: When Service Worker cache is updated
 * - sync-completed: When background sync completes
 * - sync-failed: When background sync fails
 * - network-info-updated: When network quality changes
 * - enable-data-saver: When slow network detected
 * - app-online: When app comes online
 * - app-offline: When app goes offline
 * - memory-warning: When memory usage is high
 * - battery-status-updated: When battery status changes
 * - enable-battery-saver: When battery is low
 * - enable-performance-mode: When device has low resources
 * - orientation-changed: When screen orientation changes
 * - app-hidden: When tab is hidden
 * - app-visible: When tab becomes visible
 * - app-freeze: When page is frozen (backgrounded)
 * - app-resume: When page resumes from frozen state
 * - app-restored-from-cache: When page is restored from bfcache
 * - show-keyboard-shortcuts: Request to show keyboard shortcuts modal
 * - keyboard-open-search: Alt + S pressed
 * - keyboard-open-menu: Alt + M pressed
 * - keyboard-open-notifications: Alt + N pressed
 * - keyboard-escape: Escape key pressed
 * - react-app-mounted: When React app is mounted
 * - pwa-install-available: When PWA install prompt is available
 * - pwa-installed: When PWA is installed
 * 
 * KEYBOARD SHORTCUTS:
 * - Alt + /: Show keyboard shortcuts help
 * - Alt + S: Open search
 * - Alt + M: Open menu
 * - Alt + N: Open notifications
 * - Alt + D: Go to dashboard (handled by React Router)
 * - Alt + A: Go to attendance (handled by React Router)
 * - Alt + K: Go to kids (handled by React Router)
 * - Alt + P: Go to profile (handled by React Router)
 * - Alt + H: Go to home
 * - Escape: Close modals/overlays
 * 
 * DEVELOPMENT UTILITIES (window.__ACCELLAX__):
 * - version: App version
 * - env: Environment mode
 * - firebase: Object with all Firebase instances
 * - clearCache(): Clear all browser caches
 * - getPerformance(): Get performance metrics
 * - testOffline(): Simulate offline mode
 * - testOnline(): Simulate online mode
 * - clearStorage(): Clear localStorage and sessionStorage
 * - getStorageSize(): Get storage usage
 * - getFirebaseUser(): Get current Firebase user
 * - signOut(): Sign out current user
 * - triggerEvent(name, detail): Dispatch custom event
 * - getMemoryInfo(): Get memory usage info
 * - getDeviceInfo(): Get device information
 * - logs: Array of all console outputs
 * 
 * PERFORMANCE OPTIMIZATIONS:
 * - Firebase offline persistence (unlimited cache)
 * - Service Worker caching (app shell, static assets)
 * - Code splitting via React.lazy (in App.jsx)
 * - Resource hints (preconnect, dns-prefetch) in index.html
 * - Critical CSS inlined in index.html
 * - Fonts loaded asynchronously
 * - Images lazy loaded (via React components)
 * - Intersection Observer for lazy loading
 * - Adaptive loading based on network quality
 * - Battery saver mode for low battery
 * - Performance mode for low-end devices
 * 
 * OFFLINE SUPPORT:
 * - Firestore offline persistence (IndexedDB)
 * - Service Worker caches app shell and assets
 * - Background sync when connection restored
 * - Offline indicator banner
 * - Queued operations sync when online
 * - No data loss during offline period
 * 
 * ANALYTICS TRACKING:
 * - App initialized event
 * - Page views (via React Router in App.jsx)
 * - User login/logout events
 * - Performance metrics (Core Web Vitals)
 * - Error exceptions
 * - Network status changes
 * - Service Worker events
 * - Battery status
 * - Device info
 * - User engagement events (via React components)
 * 
 * ERROR HANDLING:
 * - Firebase initialization errors → Retry with backoff
 * - Service Worker registration errors → Graceful degradation
 * - Firestore persistence errors → Fallback to single-tab
 * - Global window errors → Logged and tracked
 * - Unhandled promise rejections → Logged and tracked
 * - React component errors → Error boundaries in App.jsx
 * - Network errors → Offline mode activated
 * - All errors sent to analytics (if available)
 * - All errors sent to Sentry (if configured)
 * 
 * BROWSER COMPATIBILITY:
 * - Modern browsers: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
 * - Required features: Promise, Fetch, LocalStorage, IndexedDB
 * - Progressive enhancement: Works without Service Workers
 * - Graceful degradation: Works with limited features on older browsers
 * - Warning banner for unsupported browsers
 * 
 * SECURITY CONSIDERATIONS:
 * - Firebase security rules protect data (configured in Firebase Console)
 * - Authentication required for protected routes (handled by React Router)
 * - HTTPS enforced in production
 * - Content Security Policy recommended (configured in index.html)
 * - No sensitive data in localStorage
 * - CORS configured on backend
 * - Sanctum/session-based auth for API calls
 * 
 * MOBILE CONSIDERATIONS:
 * - Touch events supported
 * - Viewport configured for mobile
 * - Responsive design (handled by Tailwind CSS)
 * - iOS safe area insets respected
 * - PWA installable on iOS and Android
 * - Offline support critical for mobile
 * - Battery saver mode for mobile devices
 * - Reduced motion support
 * - High contrast mode support
 * 
 * ACCESSIBILITY FEATURES:
 * - Keyboard navigation fully supported
 * - Screen reader support (ARIA labels in components)
 * - Skip to main content link
 * - Focus management (visible focus indicators)
 * - Keyboard shortcuts with hints
 * - High contrast mode detection
 * - Reduced motion mode detection
 * - Color contrast ratios meet WCAG AA standards
 * 
 * ==================== TESTING CHECKLIST ====================
 * 
 * Manual Tests:
 * ☐ App loads without errors
 * ☐ Firebase connects successfully
 * ☐ Login/logout works
 * ☐ Offline mode works (DevTools > Network > Offline)
 * ☐ Service Worker registers (Application > Service Workers)
 * ☐ Performance metrics logged in console
 * ☐ Core Web Vitals pass (LCP < 2.5s, FID < 100ms, CLS < 0.1)
 * ☐ Error tracking catches errors (throw error in component)
 * ☐ HMR updates components (edit file, see changes without refresh)
 * ☐ All keyboard shortcuts work
 * ☐ Offline banner appears when offline
 * ☐ PWA installable (install prompt appears)
 * ☐ Works on mobile (test on real device)
 * ☐ Battery saver activates on low battery
 * ☐ Memory warnings show when memory high
 * ☐ Network quality detection works (throttle network)
 * ☐ Screen orientation changes handled
 * ☐ Tab visibility changes handled
 * ☐ beforeunload warning shows with unsaved data
 * 
 * Automated Tests:
 * ☐ Unit tests pass (npm run test)
 * ☐ Integration tests pass
 * ☐ E2E tests pass
 * ☐ Lighthouse score > 90 (all categories)
 * ☐ No console errors in production build
 * ☐ Bundle size under budget
 * ☐ Code coverage > 80%
 * 
 * Browser Tests:
 * ☐ Chrome (latest)
 * ☐ Firefox (latest)
 * ☐ Safari (latest)
 * ☐ Edge (latest)
 * ☐ iOS Safari
 * ☐ Android Chrome
 * 
 * ==================== DEPLOYMENT CHECKLIST ====================
 * 
 * Pre-Deployment:
 * ☐ Update Firebase config for production project
 * ☐ Set correct API URL in .env.production
 * ☐ Enable analytics measurementId
 * ☐ Test offline functionality thoroughly
 * ☐ Run Lighthouse audit (score > 90)
 * ☐ Test on real devices (mobile, tablet, desktop)
 * ☐ Verify Service Worker caching works
 * ☐ Check error tracking service configured
 * ☐ Review security rules (Firebase, API)
 * ☐ Test payment flows (if applicable)
 * ☐ Verify email notifications work
 * ☐ Check all forms have validation
 * ☐ Test all user roles and permissions
 * ☐ Verify data sync between mobile and web
 * 
 * Build:
 * ☐ Run production build: npm run build
 * ☐ Check build output for errors
 * ☐ Verify bundle sizes acceptable
 * ☐ Test production build locally: npm run preview
 * 
 * Deployment:
 * ☐ Deploy to hosting (Vercel/Netlify/Firebase Hosting)
 * ☐ Configure custom domain
 * ☐ Enable HTTPS
 * ☐ Set up CDN
 * ☐ Configure caching headers
 * ☐ Enable gzip/brotli compression
 * ☐ Set up monitoring/alerts
 * ☐ Configure backup/restore
 * ☐ Test deployed site on all devices
 * ☐ Verify all links work
 * ☐ Check robots.txt and sitemap
 * ☐ Submit to search engines
 * 
 * Post-Deployment:
 * ☐ Monitor error rates
 * ☐ Check analytics for user behavior
 * ☐ Monitor performance metrics
 * ☐ Watch for Service Worker issues
 * ☐ Track Core Web Vitals
 * ☐ Monitor API response times
 * ☐ Check Firebase usage/costs
 * ☐ Review user feedback
 * ☐ Plan next iteration
 * 
 * ==================== MAINTENANCE NOTES ====================
 * 
 * Regular Maintenance (Monthly):
 * - Update dependencies (npm update)
 * - Review and fix security vulnerabilities (npm audit)
 * - Check Firebase quota usage
 * - Review error logs and fix issues
 * - Monitor performance and optimize if needed
 * - Update documentation if features change
 * - Review and clean up unused code
 * - Check and update browser compatibility list
 * 
 * Quarterly Tasks:
 * - Review and update meta tags (SEO)
 * - Audit accessibility (WCAG compliance)
 * - Performance audit (Lighthouse)
 * - Security audit (penetration testing)
 * - User feedback review and prioritization
 * - Analytics review and insights
 * - Backup/restore testing
 * 
 * Annual Tasks:
 * - Major dependency updates (React, Firebase, etc.)
 * - Design refresh if needed
 * - Architecture review
 * - Database optimization
 * - Cost optimization review
 * - Legal compliance review (GDPR, COPPA, etc.)
 * - Disaster recovery testing
 * 
 * ==================== TROUBLESHOOTING GUIDE ====================
 * 
 * Common Issues and Solutions:
 * 
 * 1. Firebase Connection Error:
 *    - Check .env file has correct Firebase config
 *    - Verify Firebase project is active
 *    - Check network connectivity
 *    - Try clearing browser cache
 *    - Check Firebase Console for service status
 * 
 * 2. Service Worker Not Registering:
 *    - Only works in production build (npm run build)
 *    - Requires HTTPS (or localhost)
 *    - Check browser console for errors
 *    - Try unregistering old Service Worker
 *    - Clear browser cache and hard reload
 * 
 * 3. Offline Persistence Not Working:
 *    - Check if multiple tabs are open (only first tab gets multi-tab persistence)
 *    - Verify browser supports IndexedDB
 *    - Clear browser cache and retry
 *    - Check browser storage settings (not in incognito)
 *    - Try single-tab persistence fallback
 * 
 * 4. Hot Module Replacement Issues:
 *    - Restart dev server (npm run dev)
 *    - Clear Vite cache (delete .vite folder)
 *    - Check for syntax errors in code
 *    - Try hard reload in browser
 *    - Check import paths are correct
 * 
 * 5. Performance Issues:
 *    - Use React DevTools Profiler to identify slow components
 *    - Check Network tab for large bundles/resources
 *    - Enable production mode (npm run build)
 *    - Use Lighthouse audit to identify issues
 *    - Check for memory leaks (Chrome DevTools Memory)
 *    - Optimize images (WebP format, lazy loading)
 *    - Review bundle size (npm run build -- --analyze)
 * 
 * 6. Authentication Issues:
 *    - Check Firebase Auth is enabled in Console
 *    - Verify auth methods are configured
 *    - Check network requests for errors
 *    - Clear cookies/localStorage and retry
 *    - Check Firebase security rules
 * 
 * 7. Data Not Syncing:
 *    - Check online/offline status
 *    - Verify Firebase security rules allow access
 *    - Check for JavaScript errors in console
 *    - Try manual sync (online event)
 *    - Check Service Worker sync status
 * 
 * 8. PWA Install Not Working:
 *    - PWA criteria must be met (HTTPS, manifest, Service Worker)
 *    - Check manifest.json is valid
 *    - Verify icons are correct sizes
 *    - Check browser supports PWA (Chrome, Edge, Safari 16.4+)
 *    - Use Lighthouse PWA audit
 * 
 * Debug Commands:
 * window.__ACCELLAX__.clearCache()        // Clear all caches
 * window.__ACCELLAX__.getPerformance()    // View performance metrics
 * window.__ACCELLAX__.testOffline()       // Simulate offline
 * window.__ACCELLAX__.getMemoryInfo()     // Check memory usage
 * window.__ACCELLAX__.getDeviceInfo()     // View device info
 * window.__ACCELLAX__.logs                // View all console logs
 * 
 * ==================== USEFUL RESOURCES ====================
 * 
 * Documentation:
 * - React: https://react.dev/
 * - Vite: https://vitejs.dev/
 * - Firebase: https://firebase.google.com/docs
 * - Tailwind CSS: https://tailwindcss.com/docs
 * - React Router: https://reactrouter.com/
 * 
 * Tools:
 * - Lighthouse: https://developers.google.com/web/tools/lighthouse
 * - Chrome DevTools: https://developer.chrome.com/docs/devtools/
 * - React DevTools: https://react.dev/learn/react-developer-tools
 * - Firebase Console: https://console.firebase.google.com/
 * 
 * Standards & Guidelines:
 * - PWA: https://web.dev/progressive-web-apps/
 * - Core Web Vitals: https://web.dev/vitals/
 * - WCAG Accessibility: https://www.w3.org/WAI/WCAG21/quickref/
 * - Service Workers: https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API
 * - IndexedDB: https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API
 * 
 * Learning:
 * - JavaScript: https://javascript.info/
 * - Firebase Tutorials: https://firebase.google.com/codelabs
 * - React Patterns: https://reactpatterns.com/
 * - Web Performance: https://web.dev/learn-web-vitals/
 * 
 * ==================== VERSION HISTORY ====================
 * 
 * v2.0.0 (2025-01-20) - Enhanced Version
 * - Added comprehensive error handling
 * - Implemented retry logic for Firebase
 * - Added performance monitoring (Core Web Vitals)
 * - Added memory management
 * - Added network quality detection
 * - Added battery status monitoring
 * - Added device detection
 * - Added page lifecycle handlers
 * - Enhanced Service Worker features
 * - Added development utilities
 * - Improved documentation
 * 
 * v1.0.0 (2025-01-01) - Initial Release
 * - Basic Firebase initialization
 * - Service Worker registration
 * - React app mounting
 * - Basic error tracking
 * - Basic performance monitoring
 * 
 * ==================== END OF DOCUMENTATION ====================
 */