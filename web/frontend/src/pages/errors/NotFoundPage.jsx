// File: web/frontend/src/pages/errors/NotFoundPage.jsx

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { 
  Home, 
  Search, 
  ArrowLeft, 
  BookOpen, 
  MessageSquare,
  MapPin,
  Compass,
  TrendingUp,
  FileQuestion,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Clock,
  Lightbulb,
  RefreshCw,
  Mail,
  Phone,
  User,
  Calendar,
  BarChart3,
  Settings,
  Users,
  Activity,
  Target,
  Award,
  Zap,
  Shield,
  Heart,
  Star,
  Bookmark,
  Archive,
  Download,
  Upload,
  Share2,
  Filter
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { ROLES } from '@/utils/constants';
import { getRoleDashboard } from '@/utils/roleHelpers';

const NotFoundPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [currentAnimation, setCurrentAnimation] = useState(0);
  const [breadcrumb, setBreadcrumb] = useState([]);
  const [recentPages, setRecentPages] = useState([]);
  const [suggestedActions, setSuggestedActions] = useState([]);
  const [showContactForm, setShowContactForm] = useState(false);
  const [contactData, setContactData] = useState({ name: '', email: '', message: '' });
  const [theme, setTheme] = useState('light');
  
  const searchInputRef = useRef(null);

  const animations = [
    { icon: FileQuestion, color: 'text-blue-500', rotate: 'rotate-12' },
    { icon: Compass, color: 'text-purple-500', rotate: '-rotate-12' },
    { icon: MapPin, color: 'text-red-500', rotate: 'rotate-6' },
    { icon: Target, color: 'text-green-500', rotate: '-rotate-6' },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentAnimation((prev) => (prev + 1) % animations.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const paths = location.pathname.split('/').filter(Boolean);
    setBreadcrumb(paths);
    
    const recent = JSON.parse(localStorage.getItem('recentPages') || '[]');
    setRecentPages(recent.slice(0, 5));
    
    generateSuggestedActions();
    
    document.title = '404 - Page Not Found | AccellaX 361°';
  }, [location, user]);

  const generateSuggestedActions = () => {
    const actions = [];
    
    if (user) {
      const dashboard = getRoleDashboard(user.role);
      actions.push({
        icon: Home,
        label: 'Go to Dashboard',
        description: 'Return to your personalized dashboard',
        path: dashboard,
        color: 'bg-blue-500'
      });

      if ([ROLES.SUPER_ADMIN, ROLES.OWNER, ROLES.HEAD_COACH, ROLES.COACH].includes(user.role)) {
        actions.push(
          {
            icon: Users,
            label: 'Manage Kids',
            description: 'View and manage athlete profiles',
            path: '/kids',
            color: 'bg-purple-500'
          },
          {
            icon: Activity,
            label: 'View Attendance',
            description: 'Check attendance records and reports',
            path: '/attendance',
            color: 'bg-green-500'
          },
          {
            icon: Calendar,
            label: 'Upcoming Events',
            description: 'See scheduled training and events',
            path: '/events',
            color: 'bg-orange-500'
          }
        );
      }

      if ([ROLES.PARENT].includes(user.role)) {
        actions.push(
          {
            icon: User,
            label: 'My Kid\'s Profile',
            description: 'View your child\'s attendance and progress',
            path: '/dashboard/parent',
            color: 'bg-pink-500'
          },
          {
            icon: Calendar,
            label: 'Training Schedule',
            description: 'See upcoming training sessions',
            path: '/events',
            color: 'bg-indigo-500'
          }
        );
      }

      if ([ROLES.KID].includes(user.role)) {
        actions.push(
          {
            icon: Award,
            label: 'My Achievements',
            description: 'View your attendance streak and badges',
            path: '/dashboard/kid',
            color: 'bg-yellow-500'
          },
          {
            icon: TrendingUp,
            label: 'My Progress',
            description: 'Track your improvement over time',
            path: '/dashboard/kid',
            color: 'bg-teal-500'
          }
        );
      }

      actions.push({
        icon: MessageSquare,
        label: 'Messages',
        description: 'Check your messages and notifications',
        path: '/messages',
        color: 'bg-red-500'
      });
    } else {
      actions.push(
        {
          icon: Home,
          label: 'Go to Homepage',
          description: 'Start from the beginning',
          path: '/',
          color: 'bg-blue-500'
        },
        {
          icon: User,
          label: 'Sign In',
          description: 'Access your account',
          path: '/login',
          color: 'bg-green-500'
        }
      );
    }

    actions.push(
      {
        icon: BookOpen,
        label: 'Help Center',
        description: 'Browse documentation and guides',
        path: '/help',
        color: 'bg-gray-600'
      },
      {
        icon: Search,
        label: 'Site Search',
        description: 'Search for what you need',
        action: () => searchInputRef.current?.focus(),
        color: 'bg-cyan-500'
      }
    );

    setSuggestedActions(actions);
  };

  const performSearch = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const allPages = [
      { title: 'Dashboard', path: user ? getRoleDashboard(user.role) : '/login', category: 'Main' },
      { title: 'Kids Management', path: '/kids', category: 'Athletes' },
      { title: 'Attendance Records', path: '/attendance', category: 'Tracking' },
      { title: 'Attendance Reports', path: '/attendance/reports', category: 'Reports' },
      { title: 'Events Calendar', path: '/events', category: 'Events' },
      { title: 'Create Event', path: '/events/create', category: 'Events' },
      { title: 'Messages', path: '/messages', category: 'Communication' },
      { title: 'Notifications', path: '/notifications', category: 'Communication' },
      { title: 'Analytics Dashboard', path: '/reports', category: 'Analytics' },
      { title: 'Export Reports', path: '/reports/export', category: 'Reports' },
      { title: 'My Profile', path: '/profile', category: 'Account' },
      { title: 'Settings', path: '/settings', category: 'Account' },
      { title: 'Payment Tracking', path: '/payments', category: 'Finance' },
      { title: 'Coach Management', path: '/coaches', category: 'Staff' },
      { title: 'Sponsor Portal', path: '/sponsors', category: 'Sponsors' },
      { title: 'Help Center', path: '/help', category: 'Support' },
    ];

    const results = allPages.filter(page => 
      page.title.toLowerCase().includes(query.toLowerCase()) ||
      page.category.toLowerCase().includes(query.toLowerCase())
    );

    setSearchResults(results);
    setIsSearching(false);
  };

  useEffect(() => {
    const debounce = setTimeout(() => {
      performSearch(searchQuery);
    }, 300);

    return () => clearTimeout(debounce);
  }, [searchQuery]);

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    
    try {
      await fetch('/api/support/report-404', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...contactData,
          attemptedUrl: location.pathname,
          referrer: document.referrer,
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString()
        })
      });
      
      setShowContactForm(false);
      setContactData({ name: '', email: '', message: '' });
      alert('Thank you for reporting this issue. We\'ll look into it!');
    } catch (error) {
      console.error('Failed to send report:', error);
    }
  };

  const CurrentIcon = animations[currentAnimation].icon;

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 ${
      theme === 'dark' ? 'bg-gray-900' : 'bg-gradient-to-br from-blue-50 via-white to-purple-50'
    }`}>
      <div className="max-w-6xl w-full">
        
        {/* Main 404 Section */}
        <div className={`text-center mb-12 ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
          <div className="mb-6 flex justify-center">
            <div className="relative">
              <div className={`text-9xl font-bold ${
                theme === 'dark' ? 'text-gray-700' : 'text-gray-200'
              } select-none`}>
                404
              </div>
              <div className={`absolute inset-0 flex items-center justify-center transition-all duration-500 ${
                animations[currentAnimation].rotate
              }`}>
                <CurrentIcon className={`w-24 h-24 ${animations[currentAnimation].color} animate-pulse`} />
              </div>
            </div>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Oops! Page Not Found
          </h1>
          
          <p className={`text-xl mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
            Looks like this page went off the field!
          </p>
          
          <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
            Requested URL: <code className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">{location.pathname}</code>
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-12 max-w-2xl mx-auto">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for pages, features, or help topics..."
              className={`w-full pl-12 pr-4 py-4 rounded-xl border-2 focus:border-primary-500 focus:outline-none transition-colors ${
                theme === 'dark' 
                  ? 'bg-gray-800 border-gray-700 text-white' 
                  : 'bg-white border-gray-200'
              }`}
            />
            {isSearching && (
              <RefreshCw className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary-500 animate-spin" />
            )}
          </div>

          {searchResults.length > 0 && (
            <div className={`mt-4 rounded-xl border overflow-hidden ${
              theme === 'dark' 
                ? 'bg-gray-800 border-gray-700' 
                : 'bg-white border-gray-200'
            }`}>
              {searchResults.map((result, index) => (
                <Link
                  key={index}
                  to={result.path}
                  className={`block p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b last:border-b-0 ${
                    theme === 'dark' ? 'border-gray-700' : 'border-gray-100'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold">{result.title}</div>
                      <div className="text-sm text-gray-500">{result.category}</div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Suggested Actions Grid */}
        <div className="mb-12">
          <h2 className={`text-2xl font-bold mb-6 text-center ${
            theme === 'dark' ? 'text-white' : 'text-gray-800'
          }`}>
            Where would you like to go?
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {suggestedActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <button
                  key={index}
                  onClick={() => action.path ? navigate(action.path) : action.action()}
                  className={`p-6 rounded-xl border-2 text-left transition-all hover:scale-105 hover:shadow-xl ${
                    theme === 'dark'
                      ? 'bg-gray-800 border-gray-700 hover:border-gray-600'
                      : 'bg-white border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className={`w-12 h-12 ${action.color} rounded-lg flex items-center justify-center mb-4`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className={`font-semibold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                    {action.label}
                  </h3>
                  <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    {action.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Recent Pages */}
        {recentPages.length > 0 && (
          <div className={`mb-12 p-6 rounded-xl ${
            theme === 'dark' ? 'bg-gray-800' : 'bg-white'
          }`}>
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5 text-primary-500" />
              <h3 className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                Recently Visited Pages
              </h3>
            </div>
            <div className="space-y-2">
              {recentPages.map((page, index) => (
                <Link
                  key={index}
                  to={page.path}
                  className={`block p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>{page.title}</span>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Help Resources */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className={`p-6 rounded-xl text-center ${
            theme === 'dark' ? 'bg-gray-800' : 'bg-blue-50'
          }`}>
            <BookOpen className="w-10 h-10 text-blue-500 mx-auto mb-3" />
            <h3 className={`font-semibold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
              Documentation
            </h3>
            <p className={`text-sm mb-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              Learn how to use AccellaX 361°
            </p>
            <Link 
              to="/help" 
              className="text-blue-500 hover:text-blue-600 text-sm font-medium inline-flex items-center gap-1"
            >
              View Docs <ExternalLink className="w-3 h-3" />
            </Link>
          </div>

          <div className={`p-6 rounded-xl text-center ${
            theme === 'dark' ? 'bg-gray-800' : 'bg-green-50'
          }`}>
            <MessageSquare className="w-10 h-10 text-green-500 mx-auto mb-3" />
            <h3 className={`font-semibold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
              Contact Support
            </h3>
            <p className={`text-sm mb-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              We're here to help you
            </p>
            <button 
              onClick={() => setShowContactForm(true)}
              className="text-green-500 hover:text-green-600 text-sm font-medium inline-flex items-center gap-1"
            >
              Report Issue <Mail className="w-3 h-3" />
            </button>
          </div>

          <div className={`p-6 rounded-xl text-center ${
            theme === 'dark' ? 'bg-gray-800' : 'bg-purple-50'
          }`}>
            <Lightbulb className="w-10 h-10 text-purple-500 mx-auto mb-3" />
            <h3 className={`font-semibold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
              Tips & Tricks
            </h3>
            <p className={`text-sm mb-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              Get the most out of the platform
            </p>
            <Link 
              to="/help/tips" 
              className="text-purple-500 hover:text-purple-600 text-sm font-medium inline-flex items-center gap-1"
            >
              Learn More <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Common Issues */}
        <div className={`p-6 rounded-xl mb-12 ${
          theme === 'dark' ? 'bg-gray-800' : 'bg-white'
        }`}>
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="w-5 h-5 text-yellow-500" />
            <h3 className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
              Common Issues & Solutions
            </h3>
          </div>
          <div className="space-y-3">
            <details className="cursor-pointer">
              <summary className={`font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                The page I'm looking for was here before
              </summary>
              <p className={`mt-2 text-sm pl-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                We may have moved or renamed it. Try using the search bar above or check our sitemap.
              </p>
            </details>
            <details className="cursor-pointer">
              <summary className={`font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                I typed the URL manually
              </summary>
              <p className={`mt-2 text-sm pl-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                Double-check for typos. URLs are case-sensitive and must be exact.
              </p>
            </details>
            <details className="cursor-pointer">
              <summary className={`font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                I clicked a link from somewhere
              </summary>
              <p className={`mt-2 text-sm pl-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                The link might be outdated. Please report it to us so we can fix it.
              </p>
            </details>
          </div>
        </div>

        {/* Quick Navigation */}
        <div className="flex flex-wrap justify-center gap-4 mb-8">
          <button
            onClick={() => navigate(-1)}
            className={`px-6 py-3 rounded-lg flex items-center gap-2 transition-colors ${
              theme === 'dark'
                ? 'bg-gray-800 hover:bg-gray-700 text-white'
                : 'bg-white hover:bg-gray-50 text-gray-800 border border-gray-200'
            }`}
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </button>
          
          <Link
            to={user ? getRoleDashboard(user.role) : '/'}
            className="px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-lg flex items-center gap-2 transition-colors"
          >
            <Home className="w-4 h-4" />
            {user ? 'Dashboard' : 'Homepage'}
          </Link>

          <button
            onClick={() => window.location.reload()}
            className={`px-6 py-3 rounded-lg flex items-center gap-2 transition-colors ${
              theme === 'dark'
                ? 'bg-gray-800 hover:bg-gray-700 text-white'
                : 'bg-white hover:bg-gray-50 text-gray-800 border border-gray-200'
            }`}
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>

        {/* Footer */}
        <div className={`text-center text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
          <p className="mb-2">
            Need help? Contact us at{' '}
            <a href="mailto:support@accellax361.com" className="text-primary-500 hover:text-primary-600">
              support@accellax361.com
            </a>
          </p>
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="text-primary-500 hover:text-primary-600 text-xs"
          >
            Switch to {theme === 'dark' ? 'Light' : 'Dark'} Mode
          </button>
        </div>
      </div>

      {/* Contact Form Modal */}
      {showContactForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className={`max-w-md w-full p-6 rounded-xl ${
            theme === 'dark' ? 'bg-gray-800' : 'bg-white'
          }`}>
            <h3 className={`text-xl font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
              Report This Issue
            </h3>
            <form onSubmit={handleContactSubmit}>
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Your Name"
                  value={contactData.name}
                  onChange={(e) => setContactData({...contactData, name: e.target.value})}
                  required
                  className={`w-full px-4 py-2 rounded-lg border ${
                    theme === 'dark' 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300'
                  }`}
                />
                <input
                  type="email"
                  placeholder="Your Email"
                  value={contactData.email}
                  onChange={(e) => setContactData({...contactData, email: e.target.value})}
                  required
                  className={`w-full px-4 py-2 rounded-lg border ${
                    theme === 'dark' 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300'
                  }`}
                />
                <textarea
                  placeholder="What were you trying to access?"
                  value={contactData.message}
                  onChange={(e) => setContactData({...contactData, message: e.target.value})}
                  required
                  rows={4}
                  className={`w-full px-4 py-2 rounded-lg border ${
                    theme === 'dark' 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300'
                  }`}
                />
                <div className="flex gap-3">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors"
                  >
                    Send Report
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowContactForm(false)}
                    className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
                      theme === 'dark'
                        ? 'bg-gray-700 hover:bg-gray-600 text-white'
                        : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                    }`}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotFoundPage;