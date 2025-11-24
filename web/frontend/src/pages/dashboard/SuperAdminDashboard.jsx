import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import dashboardService from '../../services/dashboardService';
import auditService from '../../services/auditService';
//import '../../SuperAdminDashboard.css';
import {
  TrendingUp, Shield, TrendingDown, DollarSign, ShoppingCart, Package, Users,
  Eye, Star, AlertCircle, Clock, CheckCircle, XCircle, Truck, Heart,
  MessageSquare, ArrowUp, ArrowDown, Calendar, Download, RefreshCw,
  BarChart3, PieChart, Activity, Zap, Target, Award, ShoppingBag,
  CreditCard, Percent, Bell, Settings, Plus, ChevronRight, Filter,
  MapPin, Phone, Mail, ExternalLink, Search, ChevronDown, Minus,
  Wallet, Gift, UserPlus, ShieldCheck, AlertTriangle, Info, Tag,
  MoreVertical, UserCheck
} from 'lucide-react';

import { 
  LineChart, Line, BarChart, Bar, PieChart as RechartsPie, Pie, Cell, 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';

// Define status colors
const STATUS_COLORS = {
  'Pending': '#F59E0B',
  'Processing': '#3B82F6', 
  'Cancelled': '#EF4444',
  'Delivered': '#10B981',
  'pending': '#F59E0B',
  'processing': '#3B82F6',
  'cancelled': '#EF4444',
  'delivered': '#10B981'
};

const SuperAdminDashboardPage = () => {
  const [timeRange, setTimeRange] = useState('7days');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState('revenue');
  const [showNotifications, setShowNotifications] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date()); 
  const { user } = useAuth();
  const navigate = useNavigate();
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [saleChannels, setSaleChannels] = useState([]);
  const [topSellers, setTopSellers] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);

  // Real data from API
  const [dashboardData, setDashboardData] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [commissionBreakdown, setCommissionBreakdown] = useState(null);
  const [payouts, setPayouts] = useState([]);
  const [error, setError] = useState(null);
  const [orderStatusData, setOrderStatusData] = useState([]);

  const [trafficData, setTrafficData] = useState([
  { source: 'Direct', visitors: 4532, percentage: 35, color: '#3B82F6' },
  { source: 'Google Search', visitors: 3894, percentage: 30, color: '#10B981' },
  { source: 'Social Media', visitors: 2596, percentage: 20, color: '#F59E0B' },
  { source: 'Referral', visitors: 1298, percentage: 10, color: '#EF4444' },
  { source: 'Email', visitors: 649, percentage: 5, color: '#8B5CF6' }
]);

const [lowStockProducts, setLowStockProducts] = useState([
  { id: 1, name: 'Road Racer Elite', stock: 8, threshold: 10, category: 'Bicycles' },
  { id: 2, name: 'Mountain Bike Tires', stock: 5, threshold: 15, category: 'Spare Parts' },
  { id: 3, name: 'Bike Lock Pro', stock: 3, threshold: 20, category: 'Accessories' },
  { id: 4, name: 'Cycling Gloves M', stock: 6, threshold: 12, category: 'Accessories' }
]);

  const [recentActivities, setRecentActivities] = useState([]);

  // Mock data - Replace with API calls
  const [stats, setStats] = useState({
    revenue: {
      total: 2450000,
      change: 12.5,
      trend: 'up',
      target: 3000000,
      targetProgress: 81.67
    },
    orders: {
      total: 487,
      change: 8.3,
      trend: 'up',
      pending: 23,
      processing: 45,
      shipped: 21,
      completed: 398,
      cancelled: 21,
      avgOrderValue: 5031
    },
    products: {
      total: 145,
      active: 132,
      outOfStock: 8,
      lowStock: 15,
      draft: 5
    },
    customers: {
      total: 1234,
      new: 87,
      returning: 1147,
      change: 15.2,
      repeatRate: 62.5
    },
    views: {
      total: 45678,
      change: 23.4,
      unique: 32456,
      avgDuration: '3:45',
      bounceRate: 42.3
    },
    conversion: {
      rate: 3.2,
      change: 0.5,
      cartAbandonment: 68.5
    },
    rating: {
      average: 4.6,
      total: 1289,
      breakdown: { 5: 856, 4: 312, 3: 89, 2: 21, 1: 11 }
    }
  });

  const salesData = [
    { date: '01 Oct', revenue: 285000, orders: 42, profit: 95000, customers: 38 },
    { date: '02 Oct', revenue: 320000, orders: 48, profit: 105000, customers: 45 },
    { date: '03 Oct', revenue: 298000, orders: 45, profit: 98000, customers: 41 },
    { date: '04 Oct', revenue: 410000, orders: 62, profit: 145000, customers: 58 },
    { date: '05 Oct', revenue: 380000, orders: 58, profit: 132000, customers: 52 },
    { date: '06 Oct', revenue: 445000, orders: 68, profit: 155000, customers: 63 },
    { date: '07 Oct', revenue: 520000, orders: 79, profit: 182000, customers: 71 },
    { date: '08 Oct', revenue: 395000, orders: 61, profit: 138000, customers: 56 },
    { date: '09 Oct', revenue: 467000, orders: 71, profit: 165000, customers: 65 }
  ];

  const hourlyData = [
    { hour: '00:00', orders: 2, revenue: 8500 },
    { hour: '03:00', orders: 1, revenue: 3200 },
    { hour: '06:00', orders: 5, revenue: 21000 },
    { hour: '09:00', orders: 12, revenue: 54000 },
    { hour: '12:00', orders: 18, revenue: 89000 },
    { hour: '15:00', orders: 15, revenue: 72000 },
    { hour: '18:00', orders: 22, revenue: 105000 },
    { hour: '21:00', orders: 14, revenue: 68000 }
  ];

  const categoryPerformance = [
    { name: 'Bicycles', sales: 1250000, orders: 145, percentage: 51, color: '#ea580c', profit: 425000, roi: 34 },
    { name: 'Accessories', sales: 680000, orders: 234, percentage: 28, color: '#f97316', profit: 238000, roi: 35 },
    { name: 'Parts', sales: 420000, orders: 89, percentage: 17, color: '#fb923c', profit: 147000, roi: 35 },
    { name: 'Clothing', sales: 100000, orders: 19, percentage: 4, color: '#fdba74', profit: 35000, roi: 35 }
  ];

  const topProducts = [
    { 
      id: 1, 
      name: 'Mountain Bike Pro X500', 
      sku: 'MTB-500',
      sales: 45, 
      revenue: 2025000, 
      views: 1234, 
      stock: 15,
      rating: 4.8,
      reviews: 156,
      trend: 'up',
      trendValue: 12,
      wishlist: 89
    },
    { 
      id: 2, 
      name: 'Road Racing Bike Elite', 
      sku: 'RRB-ELT',
      sales: 32, 
      revenue: 2080000, 
      views: 987, 
      stock: 8,
      rating: 4.9,
      reviews: 98,
      trend: 'up',
      trendValue: 18,
      wishlist: 124
    },
    { 
      id: 3, 
      name: 'Kids Bicycle 16" Rainbow', 
      sku: 'KDS-16R',
      sales: 78, 
      revenue: 975000, 
      views: 2341, 
      stock: 25,
      rating: 4.7,
      reviews: 234,
      trend: 'up',
      trendValue: 8,
      wishlist: 67
    },
    { 
      id: 4, 
      name: 'Professional Bike Helmet', 
      sku: 'HLM-PRO',
      sales: 156, 
      revenue: 546000, 
      views: 3456, 
      stock: 50,
      rating: 4.6,
      reviews: 445,
      trend: 'down',
      trendValue: 5,
      wishlist: 45
    },
    { 
      id: 5, 
      name: 'Electric Mountain Bike E-Pro', 
      sku: 'EMB-EPR',
      sales: 12, 
      revenue: 1500000, 
      views: 876, 
      stock: 5,
      rating: 4.9,
      reviews: 67,
      trend: 'up',
      trendValue: 25,
      wishlist: 234
    }
  ];

  const recentOrders = [
    { 
      id: 'ORD-2024-1234', 
      customer: 'John Kamau', 
      product: 'Mountain Bike Pro X500', 
      amount: 45000, 
      status: 'pending', 
      time: '5 mins ago',
      payment: 'M-Pesa',
      location: 'Nairobi'
    },
    { 
      id: 'ORD-2024-1235', 
      customer: 'Jane Wanjiku', 
      product: 'Road Racing Bike Elite', 
      amount: 65000, 
      status: 'processing', 
      time: '12 mins ago',
      payment: 'Card',
      location: 'Mombasa'
    },
    { 
      id: 'ORD-2024-1236', 
      customer: 'Peter Ochieng', 
      product: 'Kids Bicycle 16"', 
      amount: 12500, 
      status: 'shipped', 
      time: '1 hour ago',
      payment: 'M-Pesa',
      location: 'Kisumu'
    },
    { 
      id: 'ORD-2024-1237', 
      customer: 'Mary Njeri', 
      product: 'Professional Bike Helmet', 
      amount: 3500, 
      status: 'completed', 
      time: '2 hours ago',
      payment: 'COD',
      location: 'Nakuru'
    },
    { 
      id: 'ORD-2024-1238', 
      customer: 'David Mwangi', 
      product: 'Hydraulic Disc Brakes', 
      amount: 8500, 
      status: 'cancelled', 
      time: '3 hours ago',
      payment: 'M-Pesa',
      location: 'Nairobi'
    }
  ];

  const alerts = [
    { id: 1, type: 'warning', message: 'LED Bike Light Set is running low on stock (3 units left)', time: '10 mins ago', action: 'Restock' },
    { id: 2, type: 'error', message: 'Hydraulic Disc Brakes Set is out of stock', time: '1 hour ago', action: 'Restock Now' },
    { id: 3, type: 'info', message: 'You have 23 pending orders to process', time: '2 hours ago', action: 'View Orders' },
    { id: 4, type: 'success', message: 'Mountain Bike Pro X500 has received 5 new reviews (4.8★)', time: '5 hours ago', action: 'View Reviews' },
    { id: 5, type: 'warning', message: 'Electric Mountain Bike E-Pro stock is critically low (5 units)', time: '6 hours ago', action: 'Restock' },
    { id: 6, type: 'info', message: 'Your store received 234 new visitors today', time: '8 hours ago', action: 'View Analytics' }
  ];

  const revenueByPayment = [
    { name: 'M-Pesa', value: 1470000, percentage: 60, color: '#22c55e', transactions: 312 },
    { name: 'Card Payment', value: 735000, percentage: 30, color: '#3b82f6', transactions: 98 },
    { name: 'Cash on Delivery', value: 245000, percentage: 10, color: '#f59e0b', transactions: 77 }
  ];

  const customerSegments = [
    { segment: 'New Customers', count: 87, revenue: 325000, avgOrder: 3736, color: '#3b82f6' },
    { segment: 'Returning Customers', count: 245, revenue: 1456000, avgOrder: 5943, color: '#22c55e' },
    { segment: 'VIP Customers', count: 23, revenue: 669000, avgOrder: 29087, color: '#a855f7' }
  ];

  const trafficSources = [
    { source: 'Direct', visitors: 12345, percentage: 38, orders: 156, conversion: 1.26 },
    { source: 'Social Media', visitors: 8976, percentage: 28, orders: 234, conversion: 2.61 },
    { source: 'Search Engine', visitors: 7654, percentage: 24, orders: 187, conversion: 2.44 },
    { source: 'Email Marketing', visitors: 3209, percentage: 10, orders: 98, conversion: 3.05 }
  ];

  const performanceMetrics = [
    { metric: 'Product Quality', score: 92, max: 100 },
    { metric: 'Delivery Speed', score: 85, max: 100 },
    { metric: 'Customer Service', score: 88, max: 100 },
    { metric: 'Pricing', score: 78, max: 100 },
    { metric: 'Packaging', score: 90, max: 100 },
    { metric: 'Communication', score: 86, max: 100 }
  ];

  const upcomingTasks = [
    { id: 1, task: 'Process 23 pending orders', priority: 'high', deadline: 'Today' },
    { id: 2, task: 'Restock 8 out-of-stock items', priority: 'high', deadline: 'Today' },
    { id: 3, task: 'Respond to 12 customer messages', priority: 'medium', deadline: 'Tomorrow' },
    { id: 4, task: 'Review and approve 5 product returns', priority: 'medium', deadline: 'Tomorrow' },
    { id: 5, task: 'Update pricing for 15 products', priority: 'low', deadline: 'This Week' }
  ];

  useEffect(() => {
    loadDashboardData();
  }, [timeRange]);

  const loadDashboardData = async () => {
  setLoading(true);
  setError(null);
  try {
    const period = timeRange === '24hours' ? 'today' : timeRange === '7days' ? 'week' : 'month';
    
    // Fetch all dashboard data in parallel using OWNER endpoints
    const [
      overviewData, 
      transactionsData, 
      paymentMethodsData,
      saleChannelsData,
      topSellersData,
      recentOrdersData,
      orderStatusData,
      auditLogsData
    ] = await Promise.all([
      dashboardService.getOwnerOverview(period),
      dashboardService.getTransactions({ page: 1, per_page: 10 }),
      dashboardService.getPaymentMethodsBreakdown(period),
      dashboardService.getSaleChannelsBreakdown(period),
      dashboardService.getTopSellers(5, period),
      dashboardService.getRecentOrders(10),
      dashboardService.getOrderStatusDistribution(period),
      auditService.getAuditLogs({ per_page: 13, sort_by: 'occurred_at', sort_order: 'desc' })
    ]);

    console.log('✅ Dashboard data loaded:', { 
      overviewData, 
      transactionsData,
      paymentMethodsData,
      saleChannelsData,
      topSellersData,
      recentOrdersData,
      orderStatusData,
      auditLogsData
    });
    
    // Update state with real data
    setDashboardData(overviewData.data);
    setTransactions(transactionsData.data || []);
    setPaymentMethods(paymentMethodsData.data || []);
    setSaleChannels(saleChannelsData.data || []);
    setTopSellers(topSellersData.data || []);
    setRecentTransactions(transactionsData.data?.slice(0, 5) || []);

    // Update order status distribution from API
    if (orderStatusData.data) {
      console.log('📊 Order Status Data from API:', orderStatusData.data);
      console.log('📊 First item color:', orderStatusData.data[0]?.color);
      console.log('📊 Full first item:', JSON.stringify(orderStatusData.data[0], null, 2));
      setOrderStatusData(orderStatusData.data);
    }

    // Map audit logs to recent activities with severity badges
    if (auditLogsData.data?.data) {
      const activities = auditLogsData.data.data.map(log => {
        // Determine icon based on event category
        let icon, color;
        switch (log.event_category?.toLowerCase()) {
          case 'security':
            icon = Shield;
            color = log.severity === 'high' ? 'red' : log.severity === 'medium' ? 'orange' : 'purple';
            break;
          case 'order':
            icon = ShoppingCart;
            color = 'blue';
            break;
          case 'payment':
            icon = DollarSign;
            color = 'green';
            break;
          case 'product':
            icon = Package;
            color = 'orange';
            break;
          case 'user':
            icon = UserCheck;
            color = 'indigo';
            break;
          default:
            icon = Activity;
            color = 'gray';
        }

        // Format time ago
        const timeAgo = formatTimeAgo(new Date(log.occurred_at));

        return {
          id: log.id,
          type: log.event_category,
          message: log.description,
          time: timeAgo,
          icon: icon,
          color: color,
          severity: log.severity,
          is_suspicious: log.is_suspicious
        };
      });

      setRecentActivities(activities);
      console.log('✅ Mapped audit logs to activities:', activities);
    }

    // Map API data to stats structure for the owner/super admin
    if (overviewData.data) {
      const apiData = overviewData.data;
      setStats(prev => ({
        ...prev,
        revenue: {
          total: parseFloat(apiData.total_revenue?.amount || 0),
          change: apiData.total_revenue?.change_percentage || 0,
          trend: (apiData.total_revenue?.change_percentage || 0) > 0 ? 'up' : 
                 (apiData.total_revenue?.change_percentage || 0) < 0 ? 'down' : 'flat',
          target: 3000000,
          targetProgress: ((parseFloat(apiData.total_revenue?.amount || 0)) / 3000000) * 100
        },
        // Keep existing order/customer stats as fallback
        orders: prev.orders,
        customers: prev.customers
      }));
    }

    setLoading(false);
  } catch (error) {
    console.error('❌ Error loading dashboard data:', error);
    setError(error.message || 'Failed to load dashboard data');
    setLoading(false);
  }
};

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: Clock },
      processing: { bg: 'bg-blue-100', text: 'text-blue-800', icon: RefreshCw },
      shipped: { bg: 'bg-purple-100', text: 'text-purple-800', icon: Truck },
      completed: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle },
      cancelled: { bg: 'bg-red-100', text: 'text-red-800', icon: XCircle },
      failed: { bg: 'bg-red-100', text: 'text-red-800', icon: XCircle },
      delivered: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle }
    };
    
    const style = styles[status?.toLowerCase()] || { 
      bg: 'bg-gray-100', 
      text: 'text-gray-800', 
      icon: AlertCircle 
    };
    
    const Icon = style.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${style.bg} ${style.text}`}>
        <Icon className="w-3 h-3" />
        {status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Unknown'}
      </span>
    );
  };

  const getAlertIcon = (type) => {
    const icons = {
      warning: { icon: AlertTriangle, color: 'text-yellow-600' },
      error: { icon: XCircle, color: 'text-red-600' },
      info: { icon: Info, color: 'text-blue-600' },
      success: { icon: CheckCircle, color: 'text-green-600' }
    };
    return icons[type];
  };

  const formatTimeAgo = (date) => {
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  
  return date.toLocaleDateString('en-GB', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    });
  };

  const StatCard = ({ icon: Icon, label, value, change, trend, color, suffix = '', subtitle = '' }) => (
    <div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow border border-gray-100">
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        {change !== undefined && (
          <div className={`flex items-center gap-1 text-sm font-semibold ${
            trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-600'
          }`}>
            {trend === 'up' && <ArrowUp className="w-4 h-4" />}
            {trend === 'down' && <ArrowDown className="w-4 h-4" />}
            {trend === 'flat' && <Minus className="w-4 h-4" />}
            {Math.abs(change)}%
          </div>
        )}
      </div>
      <h3 className="text-gray-600 text-sm mb-1">{label}</h3>
      <p className="text-2xl font-bold text-gray-900">{value}{suffix}</p>
      {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
      {change !== undefined && (
        <p className="text-xs text-gray-500 mt-1">vs. previous period</p>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Failed to Load Dashboard</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={loadDashboardData}
            className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome back, {user?.name?.split(' ')[0]}! 👋
            </h1>
            <p className="text-gray-600">
              Here's what's happening with your Oshocks dashboard today.
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </p>
            </div>
            
            <div className="flex items-center gap-3 flex-wrap">
              <div className="relative">
                <select
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 appearance-none pr-10 bg-white"
                >
                  <option value="24hours">Last 24 Hours</option>
                  <option value="7days">Last 7 Days</option>
                  <option value="30days">Last 30 Days</option>
                  <option value="90days">Last 90 Days</option>
                  <option value="year">This Year</option>
                  <option value="custom">Custom Range</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
              
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              
              <div className="relative">
                <button 
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Bell className="w-5 h-5 text-gray-600" />
                  {alerts.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                      {alerts.length}
                    </span>
                  )}
                </button>
                
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-96 overflow-y-auto">
                    <div className="p-4 border-b border-gray-200">
                      <h3 className="font-semibold text-gray-900">Notifications</h3>
                    </div>
                    <div className="divide-y divide-gray-100">
                      {alerts.map(alert => {
                        const alertIcon = getAlertIcon(alert.type);
                        const AlertIcon = alertIcon.icon;
                        return (
                          <div key={alert.id} className="p-4 hover:bg-gray-50 transition-colors">
                            <div className="flex gap-3">
                              <AlertIcon className={`w-5 h-5 ${alertIcon.color} flex-shrink-0 mt-0.5`} />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-gray-900 mb-1">{alert.message}</p>
                                <div className="flex items-center justify-between">
                                  <span className="text-xs text-gray-500">{alert.time}</span>
                                  <button className="text-xs text-orange-600 hover:text-orange-700 font-medium">
                                    {alert.action}
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
              
              <button className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors">
                <Download className="w-4 h-4" />
                Export Report
              </button>
            </div>
          </div>
        </div>

        {/* Revenue Target Progress */}
        <div className="bg-gradient-to-r from-orange-600 to-orange-500 rounded-lg shadow-lg p-6 mb-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold mb-1">Monthly Revenue Target</h3>
              <p className="text-orange-100 text-sm">October 2024</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold">KSh {(stats.revenue.total / 1000).toFixed(0)}K</p>
              <p className="text-orange-100 text-sm">of KSh {(stats.revenue.target / 1000).toFixed(0)}K goal</p>
            </div>
          </div>
          <div className="w-full bg-orange-400 rounded-full h-3 mb-2">
            <div
              className="bg-white h-3 rounded-full transition-all duration-500"
              style={{ width: `${stats.revenue.targetProgress}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-sm text-orange-100">
            <span>{stats.revenue.targetProgress.toFixed(1)}% completed</span>
            <span>KSh {((stats.revenue.target - stats.revenue.total) / 1000).toFixed(0)}K remaining</span>
          </div>
        </div>

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Revenue Card - Blue */}
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-white bg-opacity-20 rounded-lg">
                <DollarSign size={24} />
              </div>
              <span className={`flex items-center gap-1 text-sm ${
                stats.revenue.trend === 'up' ? 'text-green-200' : stats.revenue.trend === 'down' ? 'text-red-200' : 'text-gray-200'
              }`}>
                {stats.revenue.trend === 'up' ? <TrendingUp size={16} /> : stats.revenue.trend === 'down' ? <TrendingDown size={16} /> : <Minus size={16} />}
                {Math.abs(stats.revenue.change)}%
              </span>
            </div>
            <h3 className="text-sm font-medium opacity-90 mb-1">Total Revenue</h3>
            <p className="text-3xl font-bold mb-1">KES {stats.revenue.total.toLocaleString()}</p>
            <p className="text-xs opacity-75">vs last period</p>
          </div>

          {/* Platform Commission Card - Green */}
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-lg p-6 text-white">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-white bg-opacity-20 rounded-lg">
                <Percent size={24} />
              </div>
              <span className="text-sm text-green-200">
                {dashboardData?.platform_commission ? `${(parseFloat(dashboardData.platform_commission.rate) || 0).toFixed(1)}%` : '0%'}
              </span>
            </div>
            <h3 className="text-sm font-medium opacity-90 mb-1">Platform Commission</h3>
            <p className="text-3xl font-bold mb-1">
              KES {dashboardData?.platform_commission ? parseFloat(dashboardData.platform_commission.amount).toLocaleString() : '0'}
            </p>
            <p className="text-xs opacity-75">Average commission rate</p>
          </div>

          {/* Pending Payouts Card - Orange */}
          <div 
              onClick={() => navigate('/super-admin/payouts')}
              className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg shadow-lg p-6 text-white cursor-pointer hover:from-orange-600 hover:to-orange-700 transition-all transform hover:scale-105"
            >
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-white bg-opacity-20 rounded-lg">
                <Wallet size={24} />
              </div>
              <span className="text-sm text-orange-200">
                {payouts.filter(p => p.status === 'pending').length} pending
              </span>
            </div>
            <h3 className="text-sm font-medium opacity-90 mb-1">Pending Payouts</h3>
            <p className="text-3xl font-bold mb-1">
              KES {payouts.filter(p => p.status === 'pending').reduce((sum, p) => sum + parseFloat(p.amount || 0), 0).toLocaleString()}
            </p>
            <p className="text-xs opacity-75 flex items-center gap-1">
              Awaiting transfer
              <ChevronRight size={14} className="opacity-75" />
            </p>
          </div>

          {/* Total Orders Card - Purple */}
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-lg p-6 text-white">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-white bg-opacity-20 rounded-lg">
                <ShoppingCart size={24} />
              </div>
              <span className={`flex items-center gap-1 text-sm ${
                stats.orders.trend === 'up' ? 'text-green-200' : stats.orders.trend === 'down' ? 'text-red-200' : 'text-gray-200'
              }`}>
                {stats.orders.trend === 'up' ? <TrendingUp size={16} /> : stats.orders.trend === 'down' ? <TrendingDown size={16} /> : <Minus size={16} />}
                {Math.abs(stats.orders.change)}%
              </span>
            </div>
            <h3 className="text-sm font-medium opacity-90 mb-1">Total Orders</h3>
            <p className="text-3xl font-bold mb-1">{stats.orders.total.toLocaleString()}</p>
            <p className="text-xs opacity-75">vs last period</p>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <StatCard
            icon={DollarSign}
            label="Total Revenue"
            value={`KSh ${stats.revenue.total.toLocaleString()}`}
            change={stats.revenue.change}
            trend={stats.revenue.trend}
            color="bg-green-600"
            subtitle={dashboardData?.platform_commission ? `Commission: KSh ${parseFloat(dashboardData.platform_commission.amount).toLocaleString()}` : 'Loading...'}
            //If i will like to use non decimal commision uncomment below
            //subtitle={dashboardData?.platform_commission ? `Commission: KSh ${Math.round(parseFloat(dashboardData.platform_commission.amount)).toLocaleString()}` : 'Loading...'}
          />
          <StatCard
            icon={ShoppingCart}
            label="Total Orders"
            value={stats.orders.total}
            change={stats.orders.change}
            trend={stats.orders.trend}
            color="bg-blue-600"
            subtitle={`${stats.orders.completed} completed orders`}
          />
          <StatCard
            icon={Users}
            label="Total Customers"
            value={stats.customers.total}
            change={stats.customers.change}
            trend="up"
            color="bg-purple-600"
            subtitle={`${stats.customers.repeatRate}% repeat rate`}
          />
          <StatCard
            icon={Eye}
            label="Product Views"
            value={`${(stats.views.total / 1000).toFixed(1)}K`}
            change={stats.views.change}
            trend="up"
            color="bg-orange-600"
            subtitle={`${stats.views.avgDuration} avg duration`}
          />
        </div>

        {/* Secondary Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-yellow-600" />
              <span className="text-sm text-gray-600">Pending</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.orders.pending}</p>
            <p className="text-xs text-gray-500 mt-1">Need action</p>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <Package className="w-4 h-4 text-blue-600" />
              <span className="text-sm text-gray-600">Processing</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.orders.processing}</p>
            <p className="text-xs text-gray-500 mt-1">Being prepared</p>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <Truck className="w-4 h-4 text-purple-600" />
              <span className="text-sm text-gray-600">Shipped</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.orders.shipped}</p>
            <p className="text-xs text-gray-500 mt-1">In transit</p>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <span className="text-sm text-gray-600">Low Stock</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.products.lowStock}</p>
            <p className="text-xs text-gray-500 mt-1">Items need restock</p>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <Star className="w-4 h-4 text-yellow-600" />
              <span className="text-sm text-gray-600">Avg Rating</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.rating.average}</p>
            <p className="text-xs text-gray-500 mt-1">{stats.rating.total} reviews</p>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <Percent className="w-4 h-4 text-green-600" />
              <span className="text-sm text-gray-600">Conversion</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.conversion.rate}%</p>
            <p className="text-xs text-gray-500 mt-1">
              {stats.conversion.change > 0 ? '+' : ''}{stats.conversion.change}% change
            </p>
          </div>
        </div>

        {/* Secondary Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Conversion Rate */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Percent size={20} className="text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Conversion Rate</p>
                <p className="text-2xl font-bold">{stats.conversion.rate}%</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className={`flex items-center gap-1 ${
                stats.conversion.change > 0 ? 'text-green-600' : stats.conversion.change < 0 ? 'text-red-600' : 'text-gray-600'
              }`}>
                {stats.conversion.change > 0 ? <ArrowUp size={16} /> : stats.conversion.change < 0 ? <ArrowDown size={16} /> : <Minus size={16} />}
                {Math.abs(stats.conversion.change)}%
              </span>
              <span className="text-gray-500">vs last period</span>
            </div>
          </div>

          {/* Active Products */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <Package size={20} className="text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Active Products</p>
                <p className="text-2xl font-bold">{stats.products.active.toLocaleString()}</p>
              </div>
            </div>
            <div className="text-sm text-gray-600">
              {stats.products.outOfStock} out of stock
            </div>
          </div>

          {/* Site Visitors */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Activity size={20} className="text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Site Visitors</p>
                <p className="text-2xl font-bold">{stats.views.total.toLocaleString()}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="flex items-center gap-1 text-green-600">
                <ArrowUp size={16} />
                {stats.views.change}%
              </span>
              <span className="text-gray-500">vs last period</span>
            </div>
          </div>
        </div>

        {/* Alerts Banner */}
        {alerts.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-4 mb-6 border-l-4 border-orange-600">
            <div className="flex items-start gap-3">
              <Bell className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  Action Required 
                  <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs rounded-full font-medium">
                    {alerts.filter(a => a.type === 'error' || a.type === 'warning').length} urgent
                  </span>
                </h3>
                <div className="grid md:grid-cols-2 gap-3">
                  {alerts.slice(0, 4).map(alert => {
                    const alertIcon = getAlertIcon(alert.type);
                    const AlertIcon = alertIcon.icon;
                    return (
                      <div key={alert.id} className="flex items-start gap-2 text-sm p-2 bg-gray-50 rounded-lg">
                        <AlertIcon className={`w-4 h-4 ${alertIcon.color} flex-shrink-0 mt-0.5`} />
                        <div className="flex-1 min-w-0">
                          <span className="text-gray-700">{alert.message}</span>
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-xs text-gray-500">{alert.time}</span>
                            <button className="text-xs text-orange-600 hover:text-orange-700 font-medium">
                              {alert.action}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {alerts.length > 4 && (
                  <button className="text-orange-600 hover:text-orange-700 text-sm font-medium mt-3 flex items-center gap-1">
                    View all {alerts.length} alerts <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Payment Methods & Sale Channels */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Payment Methods Breakdown */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Payment Methods</h2>
                <p className="text-sm text-gray-600">Transaction breakdown</p>
              </div>
            </div>

            {paymentMethods.length > 0 ? (
              <div className="space-y-4">
                {paymentMethods.map((method, index) => {
                  const colors = ['#22c55e', '#3b82f6', '#f59e0b', '#8B5CF6'];
                  const color = colors[index % colors.length];
                  
                  return (
                    <div key={index}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: color }}
                          />
                          <span className="text-sm font-medium text-gray-900">{method.method}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-semibold text-gray-900">
                            KES {parseFloat(method.total_amount || 0).toLocaleString()}
                          </span>
                          <span className="text-xs text-gray-500 ml-2">({method.transaction_count} txns)</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-8">No payment data available</p>
            )}
          </div>

          {/* Sale Channels Breakdown */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Sale Channels</h2>
                <p className="text-sm text-gray-600">Revenue distribution</p>
              </div>
            </div>

            {saleChannels.length > 0 ? (
              <div className="space-y-4">
                {saleChannels.map((channel, index) => {
                  const colors = ['#3b82f6', '#22c55e', '#f59e0b', '#8B5CF6'];
                  const color = colors[index % colors.length];
                  
                  return (
                    <div key={index}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: color }}
                          />
                          <span className="text-sm font-medium text-gray-900">{channel.channel}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-semibold text-gray-900">
                            KES {parseFloat(channel.total_amount || 0).toLocaleString()}
                          </span>
                          <span className="text-xs text-gray-500 ml-2">({channel.percentage}%)</span>
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="h-2 rounded-full transition-all duration-500" 
                          style={{ 
                            width: `${channel.percentage}%`,
                            backgroundColor: color 
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-8">No channel data available</p>
            )}
          </div>
        </div>

        {/* Top Sellers */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Top Performing Sellers</h2>
              <p className="text-sm text-gray-600">Highest revenue generators</p>
            </div>
          </div>

          {topSellers.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3">#</th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3">Seller</th>
                    <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider pb-3">Total Sales</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {topSellers.map((seller, index) => (
                    <tr key={seller.seller_id} className="hover:bg-gray-50">
                      <td className="py-4">
                        <div className="flex items-center justify-center w-8 h-8 bg-orange-100 rounded-full text-sm font-semibold text-orange-600">
                          {index + 1}
                        </div>
                      </td>
                      <td className="py-4">
                        <p className="text-sm font-medium text-gray-900">{seller.seller_name}</p>
                      </td>
                      <td className="py-4 text-right">
                        <p className="text-sm font-semibold text-gray-900">KES {seller.total_sales.toLocaleString()}</p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-gray-500 text-center py-8">No seller data available</p>
          )}
        </div>

        {/* Recent Transactions */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Recent Transactions</h2>
              <p className="text-sm text-gray-600">Latest payment records</p>
            </div>
            <button className="text-orange-600 text-sm font-medium hover:underline flex items-center gap-1">
              View All <ChevronRight size={16} />
            </button>
          </div>

          {recentTransactions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3">Transaction ID</th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3">Seller</th>
                    <th className="text-center text-xs font-medium text-gray-500 uppercase tracking-wider pb-3">Method</th>
                    <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider pb-3">Amount</th>
                    <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider pb-3">Commission</th>
                    <th className="text-center text-xs font-medium text-gray-500 uppercase tracking-wider pb-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {recentTransactions.map((transaction) => (
                    <tr key={transaction.id} className="hover:bg-gray-50">
                      <td className="py-4">
                        <p className="text-sm font-medium text-gray-900">{transaction.transaction_reference}</p>
                        <p className="text-xs text-gray-500">{new Date(transaction.payment_collected_at).toLocaleString()}</p>
                      </td>
                      <td className="py-4">
                        <p className="text-sm text-gray-900">{transaction.seller?.shop_name || 'N/A'}</p>
                      </td>
                      <td className="py-4 text-center">
                        <span className="text-xs px-2 py-1 bg-gray-100 rounded-full">
                          {transaction.payment_method}
                        </span>
                      </td>
                      <td className="py-4 text-right">
                        <p className="text-sm font-semibold text-gray-900">KES {parseFloat(transaction.amount).toLocaleString()}</p>
                      </td>
                      <td className="py-4 text-right">
                        <p className="text-sm text-gray-600">KES {parseFloat(transaction.platform_commission_amount).toLocaleString()}</p>
                      </td>
                      <td className="py-4">
                        <div className="flex justify-center">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                            transaction.status === 'completed' ? 'bg-green-100 text-green-800' : 
                            transaction.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {transaction.status}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-gray-500 text-center py-8">No recent transactions</p>
          )}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Sales Trend Chart */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Sales Overview</h2>
                <p className="text-sm text-gray-600">Revenue and orders trend</p>
              </div>
              <button className="p-2 hover:bg-gray-100 rounded-lg">
                <MoreVertical size={20} className="text-gray-500" />
              </button>
            </div>
            
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={salesData}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ea580c" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#ea580c" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" stroke="#9CA3AF" fontSize={12} />
                <YAxis stroke="#9CA3AF" fontSize={12} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                  formatter={(value) => `KES ${value.toLocaleString()}`}
                />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#ea580c" 
                  fillOpacity={1} 
                  fill="url(#colorSales)" 
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Order Status Distribution */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Order Status</h2>
                <p className="text-sm text-gray-600">Current distribution</p>
              </div>
            </div>
            
            {(() => {
              console.log('🎨 Rendering Order Status Chart');
              console.log('🎨 orderStatusData:', orderStatusData);
              console.log('🎨 orderStatusData length:', orderStatusData?.length);
              console.log('🎨 orderStatusData items:', JSON.stringify(orderStatusData, null, 2));
              return null;
            })()}
            
            {orderStatusData && orderStatusData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={orderStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={2}
                      dataKey="count"
                      nameKey="status"
                    >
                      {orderStatusData.map((entry, index) => {
                        const color = entry.color || STATUS_COLORS[entry.status] || STATUS_COLORS[entry.status.toLowerCase()] || '#6B7280';
                        console.log(`🎨 Rendering Cell ${index}:`, entry.status, 'Using Color:', color);
                        return (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={color}
                            stroke={color}
                            style={{ fill: color, stroke: color }}
                          />
                        );
                      })}
                    </Pie>
                    <Tooltip 
                      formatter={(value, name, props) => {
                        console.log('🎨 Tooltip props:', props);
                        return [value, props.payload.status];
                      }}
                      contentStyle={{ 
                        backgroundColor: '#fff', 
                        border: '1px solid #e5e7eb', 
                        borderRadius: '8px' 
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>

                <div className="space-y-2 mt-4">
                  {orderStatusData.map((item, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: item.color || '#6B7280' }}
                        />
                        <span className="text-gray-700">{item.status}</span>
                      </div>
                      <span className="font-semibold text-gray-900">{item.count}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p className="text-sm">No order data available</p>
              </div>
            )}
          </div>
        </div>

        {/* Category Performance & Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Category Performance */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Category Performance</h2>
                <p className="text-sm text-gray-600">Sales by product category</p>
              </div>
              <button className="text-orange-600 text-sm font-medium hover:underline">
                View All
              </button>
            </div>

            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={categoryPerformance}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" stroke="#9CA3AF" fontSize={12} angle={-45} textAnchor="end" height={80} />
                <YAxis stroke="#9CA3AF" fontSize={12} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                  formatter={(value) => `KES ${value.toLocaleString()}`}
                />
                <Bar dataKey="sales" radius={[8, 8, 0, 0]}>
                  {categoryPerformance.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
                <p className="text-sm text-gray-600">Latest security & system events</p>
              </div>
            </div>

            {recentActivities.length > 0 ? (
              <>
                <div className="space-y-4">
                  {recentActivities.map((activity) => {
                    const Icon = activity.icon;
                    const colorClasses = {
                      blue: 'bg-blue-100 text-blue-600',
                      green: 'bg-green-100 text-green-600',
                      orange: 'bg-orange-100 text-orange-600',
                      yellow: 'bg-yellow-100 text-yellow-600',
                      red: 'bg-red-100 text-red-600',
                      purple: 'bg-purple-100 text-purple-600',
                      indigo: 'bg-indigo-100 text-indigo-600',
                      gray: 'bg-gray-100 text-gray-600'
                    };

                    const severityBadges = {
                      low: { bg: 'bg-blue-100', text: 'text-blue-800', icon: Info },
                      medium: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: AlertTriangle },
                      high: { bg: 'bg-red-100', text: 'text-red-800', icon: AlertCircle }
                    };

                    const severityStyle = severityBadges[activity.severity?.toLowerCase()] || severityBadges.low;
                    const SeverityIcon = severityStyle.icon;
                    
                    return (
                      <div key={activity.id} className="flex gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors">
                        <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${colorClasses[activity.color]}`}>
                          <Icon size={18} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm text-gray-900 flex-1">{activity.message}</p>
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${severityStyle.bg} ${severityStyle.text} flex-shrink-0`}>
                              <SeverityIcon className="w-3 h-3" />
                              {activity.severity}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <p className="text-xs text-gray-500">{activity.time}</p>
                            {activity.is_suspicious && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                <Shield className="w-3 h-3" />
                                Suspicious
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <button 
                  onClick={() => navigate('/audit-logs')}
                  className="w-full mt-4 py-2 text-sm text-orange-600 font-medium hover:bg-orange-50 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  View All Audit Logs
                  <ChevronRight className="w-4 h-4" />
                </button>
              </>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Activity className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-sm">No recent activity</p>
              </div>
            )}
          </div>
        </div>

        {/* Traffic Sources & Low Stock Alerts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Traffic Sources */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Traffic Sources</h2>
                <p className="text-sm text-gray-600">Where visitors come from</p>
              </div>
              <button className="text-orange-600 text-sm font-medium hover:underline">
                Analytics
              </button>
            </div>

            <div className="space-y-4">
              {trafficData.map((source, index) => (
                <div key={index}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: source.color }}
                      />
                      <span className="text-sm font-medium text-gray-900">{source.source}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-semibold text-gray-900">
                        {source.visitors.toLocaleString()}
                      </span>
                      <span className="text-xs text-gray-500 ml-2">{source.percentage}%</span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="h-2 rounded-full transition-all duration-500" 
                      style={{ 
                        width: `${source.percentage}%`,
                        backgroundColor: source.color 
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-6 border-t">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Total Visitors</span>
                <span className="text-lg font-bold text-gray-900">
                  {trafficData.reduce((sum, item) => sum + item.visitors, 0).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Low Stock Alerts */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Low Stock Alerts</h2>
                <p className="text-sm text-gray-600">Products need restocking</p>
              </div>
              <span className="flex items-center justify-center w-6 h-6 bg-red-100 text-red-600 rounded-full text-xs font-bold">
                {lowStockProducts.length}
              </span>
            </div>

            {lowStockProducts.length > 0 ? (
              <div className="space-y-4">
                {lowStockProducts.map((product) => (
                  <div key={product.id} className="flex items-center gap-4 p-3 bg-red-50 border border-red-100 rounded-lg">
                    <div className="flex-shrink-0 w-10 h-10 bg-red-200 rounded-full flex items-center justify-center">
                      <AlertCircle size={20} className="text-red-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{product.name}</p>
                      <p className="text-xs text-gray-600">{product.category}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-red-600">{product.stock} left</p>
                      <p className="text-xs text-gray-500">Min: {product.threshold}</p>
                    </div>
                  </div>
                ))}

                <button className="w-full py-2 text-sm text-red-600 font-medium hover:bg-red-50 rounded-lg transition-colors border border-red-200">
                  Restock All Products
                </button>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CheckCircle size={32} className="text-green-600" />
                </div>
                <p className="text-sm font-medium text-gray-900">All Products In Stock</p>
                <p className="text-xs text-gray-600 mt-1">No low stock alerts at the moment</p>
              </div>
            )}
          </div>
        </div>

        {/* Main Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Revenue & Orders Chart */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Performance Overview</h3>
                <p className="text-sm text-gray-600">Daily revenue, orders, and profit trends</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedMetric('revenue')}
                  className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                    selectedMetric === 'revenue'
                      ? 'bg-orange-100 text-orange-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  Revenue
                </button>
                <button
                  onClick={() => setSelectedMetric('orders')}
                  className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                    selectedMetric === 'orders'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  Orders
                </button>
                <button
                  onClick={() => setSelectedMetric('profit')}
                  className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                    selectedMetric === 'profit'
                      ? 'bg-green-100 text-green-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  Profit
                </button>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={salesData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ea580c" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#ea580c" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" stroke="#999" fontSize={12} />
                <YAxis stroke="#999" fontSize={12} />
                <Tooltip
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '1px solid #e5e7eb', 
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                  formatter={(value, name) => {
                    if (name === 'orders' || name === 'customers') return [value, name];
                    return [`KSh ${value.toLocaleString()}`, name];
                  }}
                />
                <Legend />
                {selectedMetric === 'revenue' && (
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#ea580c"
                    strokeWidth={2}
                    fill="url(#colorRevenue)"
                  />
                )}
                {selectedMetric === 'orders' && (
                  <Area
                    type="monotone"
                    dataKey="orders"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    fill="url(#colorOrders)"
                  />
                )}
                {selectedMetric === 'profit' && (
                  <Area
                    type="monotone"
                    dataKey="profit"
                    stroke="#22c55e"
                    strokeWidth={2}
                    fill="url(#colorProfit)"
                  />
                )}
              </AreaChart>
            </ResponsiveContainer>
            
            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-200">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Revenue</p>
                <p className="text-xl font-bold text-gray-900">
                  KSh {salesData.reduce((sum, d) => sum + d.revenue, 0).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Orders</p>
                <p className="text-xl font-bold text-gray-900">
                  {salesData.reduce((sum, d) => sum + d.orders, 0)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Profit</p>
                <p className="text-xl font-bold text-gray-900">
                  KSh {salesData.reduce((sum, d) => sum + d.profit, 0).toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* Category Performance */}
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Category Performance</h3>
            <ResponsiveContainer width="100%" height={220}>
              <RechartsPie>
                <Pie
                  data={categoryPerformance}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="percentage"
                >
                  {categoryPerformance.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value) => `${value}%`}
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '1px solid #e5e7eb', 
                    borderRadius: '8px' 
                  }}
                />
              </RechartsPie>
            </ResponsiveContainer>
            <div className="space-y-3 mt-4">
              {categoryPerformance.map((cat, idx) => (
                <div key={idx} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 flex-1">
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }}></div>
                    <span className="text-gray-700 font-medium">{cat.name}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">KSh {(cat.sales / 1000).toFixed(0)}K</p>
                    <p className="text-xs text-gray-500">{cat.orders} orders • {cat.roi}% ROI</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Hourly Performance & Performance Radar */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Hourly Performance */}
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Hourly Performance</h3>
            <p className="text-sm text-gray-600 mb-6">Peak sales times today</p>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={hourlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="hour" stroke="#999" fontSize={12} />
                <YAxis stroke="#999" fontSize={12} />
                <Tooltip
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '1px solid #e5e7eb', 
                    borderRadius: '8px' 
                  }}
                  formatter={(value, name) => {
                    if (name === 'orders') return [value, 'Orders'];
                    return [`KSh ${value.toLocaleString()}`, 'Revenue'];
                  }}
                />
                <Legend />
                <Bar dataKey="orders" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                <Bar dataKey="revenue" fill="#ea580c" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Performance Radar */}
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Store Performance Metrics</h3>
            <p className="text-sm text-gray-600 mb-6">Overall rating across key areas</p>
            <ResponsiveContainer width="100%" height={240}>
              <RadarChart data={performanceMetrics}>
                <PolarGrid stroke="#e5e7eb" />
                <PolarAngleAxis dataKey="metric" stroke="#999" fontSize={11} />
                <PolarRadiusAxis angle={90} domain={[0, 100]} stroke="#999" fontSize={11} />
                <Radar
                  name="Score"
                  dataKey="score"
                  stroke="#ea580c"
                  fill="#ea580c"
                  fillOpacity={0.3}
                  strokeWidth={2}
                />
                <Tooltip
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '1px solid #e5e7eb', 
                    borderRadius: '8px' 
                  }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Payment Methods & Customer Segments */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Payment Methods */}
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Revenue by Payment Method</h3>
            <div className="space-y-4">
              {revenueByPayment.map((method, idx) => (
                <div key={idx}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-gray-600" />
                      <span className="text-sm font-medium text-gray-900">{method.name}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-900">KSh {(method.value / 1000).toFixed(0)}K</p>
                      <p className="text-xs text-gray-500">{method.transactions} transactions • {method.percentage}%</p>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className="h-2.5 rounded-full transition-all duration-500"
                      style={{ width: `${method.percentage}%`, backgroundColor: method.color }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Average Transaction</span>
                <span className="font-bold text-gray-900">KSh 5,031</span>
              </div>
            </div>
          </div>

          {/* Customer Segments */}
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Customer Segments</h3>
            <div className="space-y-4">
              {customerSegments.map((segment, idx) => (
                <div key={idx} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                        style={{ backgroundColor: segment.color }}
                      >
                        {segment.count}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{segment.segment}</p>
                        <p className="text-xs text-gray-500">Avg: KSh {segment.avgOrder.toLocaleString()}</p>
                      </div>
                    </div>
                    <p className="text-lg font-bold text-gray-900">
                      KSh {(segment.revenue / 1000).toFixed(0)}K
                    </p>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div
                      className="h-1.5 rounded-full transition-all duration-500"
                      style={{ 
                        width: `${(segment.revenue / customerSegments.reduce((sum, s) => sum + s.revenue, 0)) * 100}%`,
                        backgroundColor: segment.color 
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Traffic Sources */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6 border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Traffic Sources</h3>
              <p className="text-sm text-gray-600">Where your customers are coming from</p>
            </div>
            <button className="text-orange-600 hover:text-orange-700 text-sm font-medium flex items-center gap-1">
              View Details <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="grid md:grid-cols-4 gap-4">
            {trafficSources.map((source, idx) => (
              <div key={idx} className="p-4 border border-gray-200 rounded-lg hover:border-orange-300 transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900">{source.source}</h4>
                  <span className="text-xs font-medium text-gray-600">{source.percentage}%</span>
                </div>
                <p className="text-2xl font-bold text-gray-900 mb-2">{source.visitors.toLocaleString()}</p>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">{source.orders} orders</span>
                  <span className="text-green-600 font-medium">{source.conversion}% conv.</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5 mt-3">
                  <div
                    className="h-1.5 rounded-full bg-orange-600 transition-all duration-500"
                    style={{ width: `${source.conversion * 20}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Products & Recent Orders */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Top Products */}
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Top Performing Products</h3>
              <button className="text-orange-600 hover:text-orange-700 text-sm font-medium flex items-center gap-1">
                View All <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3">
              {topProducts.map((product, idx) => (
                <div key={product.id} className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors border border-gray-100">
                  <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-orange-600 to-orange-500 text-white rounded-lg font-bold text-sm shadow-sm">
                    #{idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{product.name}</p>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      <span className="text-xs text-gray-600">{product.sales} sales</span>
                      <span className="text-xs text-gray-600">{product.views} views</span>
                      <span className="text-xs text-gray-600">Stock: {product.stock}</span>
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                        <span className="text-xs text-gray-900 font-medium">{product.rating}</span>
                        <span className="text-xs text-gray-500">({product.reviews})</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">
                      {(product.revenue / 1000).toFixed(0)}K
                    </p>
                    <div className={`flex items-center gap-1 text-xs ${
                      product.trend === 'up' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {product.trend === 'up' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {product.trend === 'up' ? '+' : '-'}{product.trendValue}%
                    </div>
                    <div className="flex items-center gap-1 mt-1">
                      <Heart className="w-3 h-3 text-red-500" />
                      <span className="text-xs text-gray-600">{product.wishlist}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Orders */}
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Recent Orders</h3>
              <button className="text-orange-600 hover:text-orange-700 text-sm font-medium flex items-center gap-1">
                View All <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3">
              {transactions.length > 0 ? (
                transactions.slice(0, 5).map(transaction => {
                  const orderNumber = transaction.order?.order_number || 'N/A';
                  const customerName = transaction.display?.customer_name || 'Guest';
                  const firstProduct = transaction.display?.first_product || 'N/A';
                  const county = transaction.display?.county || 'N/A';
                  const paymentMethod = transaction.payment_method 
                    ? transaction.payment_method.charAt(0).toUpperCase() + transaction.payment_method.slice(1)
                    : 'N/A';
                  const amount = parseFloat(transaction.amount || 0);
                  const createdAt = new Date(transaction.created_at);
                  const timeAgo = formatTimeAgo(createdAt);
                  
                  return (
                    <div key={transaction.id} className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors border border-gray-100">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <p className="font-medium text-gray-900 text-sm">{orderNumber}</p>
                          {transaction.order?.status ? getStatusBadge(transaction.order.status) : 
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800">
                            <AlertCircle className="w-3 h-3" />
                            Unknown
                          </span>
                        }
                        </div>
                        <p className="text-sm text-gray-900 font-medium">{customerName}</p>
                        <p className="text-xs text-gray-600 truncate">{firstProduct}</p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <CreditCard className="w-3 h-3" />
                            {paymentMethod}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {county}
                          </span>
                          <span>{timeAgo}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900">
                          KSh {amount.toLocaleString()}
                        </p>
                        <button className="text-xs text-orange-600 hover:text-orange-700 font-medium mt-1 flex items-center gap-1">
                          View <ExternalLink className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <ShoppingCart className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No recent orders yet</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Upcoming Tasks */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Upcoming Tasks</h3>
              <p className="text-sm text-gray-600">Action items requiring your attention</p>
            </div>
            <button className="text-orange-600 hover:text-orange-700 text-sm font-medium">
              Mark All Complete
            </button>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {upcomingTasks.map(task => {
              const priorityColors = {
                high: 'border-red-300 bg-red-50',
                medium: 'border-yellow-300 bg-yellow-50',
                low: 'border-blue-300 bg-blue-50'
              };
              const priorityBadge = {
                high: 'bg-red-100 text-red-700',
                medium: 'bg-yellow-100 text-yellow-700',
                low: 'bg-blue-100 text-blue-700'
              };
              return (
                <div key={task.id} className={`p-4 border-l-4 rounded-lg ${priorityColors[task.priority]}`}>
                  <div className="flex items-start justify-between mb-2">
                    <p className="font-medium text-gray-900 text-sm">{task.task}</p>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${priorityBadge[task.priority]}`}>
                      {task.priority}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {task.deadline}
                    </span>
                    <button className="text-xs text-orange-600 hover:text-orange-700 font-medium">
                      Complete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow p-6 mb-10">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            <button className="flex flex-col items-center gap-2 p-4 rounded-lg hover:bg-gray-50 transition-colors group">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                <Plus size={24} className="text-blue-600" />
              </div>
              <span className="text-sm font-medium text-gray-700">Add Product</span>
            </button>

            <button className="flex flex-col items-center gap-2 p-4 rounded-lg hover:bg-gray-50 transition-colors group">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors">
                <ShoppingBag size={24} className="text-green-600" />
              </div>
              <span className="text-sm font-medium text-gray-700">New Order</span>
            </button>

            <button className="flex flex-col items-center gap-2 p-4 rounded-lg hover:bg-gray-50 transition-colors group">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                <Users size={24} className="text-purple-600" />
              </div>
              <span className="text-sm font-medium text-gray-700">Add Customer</span>
            </button>

            <button className="flex flex-col items-center gap-2 p-4 rounded-lg hover:bg-gray-50 transition-colors group">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center group-hover:bg-orange-200 transition-colors">
                <Tag size={24} className="text-orange-600" />
              </div>
              <span className="text-sm font-medium text-gray-700">Add Category</span>
            </button>

            <button className="flex flex-col items-center gap-2 p-4 rounded-lg hover:bg-gray-50 transition-colors group">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center group-hover:bg-red-200 transition-colors">
                <Percent size={24} className="text-red-600" />
              </div>
              <span className="text-sm font-medium text-gray-700">Add Discount</span>
            </button>

            <button className="flex flex-col items-center gap-2 p-4 rounded-lg hover:bg-gray-50 transition-colors group">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center group-hover:bg-indigo-200 transition-colors">
                <Download size={24} className="text-indigo-600" />
              </div>
              <span className="text-sm font-medium text-gray-700">Export Report</span>
            </button>

            <button 
            onClick={() => navigate('/super-admin/payouts')}
            className="flex flex-col items-center gap-2 p-4 rounded-lg hover:bg-gray-50 transition-colors group"
          >
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center group-hover:bg-yellow-200 transition-colors">
              <DollarSign size={24} className="text-yellow-600" />
            </div>
            <span className="text-sm font-medium text-gray-700">Manage Payouts</span>
          </button>
          </div>
        </div>

        {/* Additional Quick Actions Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          <button className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-all text-left border border-gray-100 hover:border-orange-300 group">
            <Plus className="w-8 h-8 text-orange-600 mb-3 group-hover:scale-110 transition-transform" />
            <h4 className="font-semibold text-gray-900 mb-1">Add Product</h4>
            <p className="text-sm text-gray-600">List new item for sale</p>
          </button>
          
          <button className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-all text-left border border-gray-100 hover:border-blue-300 group">
            <ShoppingCart className="w-8 h-8 text-blue-600 mb-3 group-hover:scale-110 transition-transform" />
            <h4 className="font-semibold text-gray-900 mb-1">Manage Orders</h4>
            <p className="text-sm text-gray-600">{stats.orders.pending} pending orders</p>
          </button>
          
          <button className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-all text-left border border-gray-100 hover:border-purple-300 group">
            <MessageSquare className="w-8 h-8 text-purple-600 mb-3 group-hover:scale-110 transition-transform" />
            <h4 className="font-semibold text-gray-900 mb-1">Messages</h4>
            <p className="text-sm text-gray-600">5 unread messages</p>
          </button>
          
          <button className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-all text-left border border-gray-100 hover:border-gray-300 group">
            <Settings className="w-8 h-8 text-gray-600 mb-3 group-hover:scale-110 transition-transform" />
            <h4 className="font-semibold text-gray-900 mb-1">Store Settings</h4>
            <p className="text-sm text-gray-600">Manage your store</p>
          </button>
        </div>
      </div>

        {/* Bottom Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-4 border border-gray-200">
            <div className="flex items-center gap-3">
              <Eye size={20} className="text-gray-600" />
              <div>
                <p className="text-xs text-gray-600">Page Views</p>
                <p className="text-lg font-bold text-gray-900">45,234</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-4 border border-gray-200">
            <div className="flex items-center gap-3">
              <ShoppingCart size={20} className="text-gray-600" />
              <div>
                <p className="text-xs text-gray-600">Cart Abandonment</p>
                <p className="text-lg font-bold text-gray-900">18.5%</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-4 border border-gray-200">
            <div className="flex items-center gap-3">
              <Clock size={20} className="text-gray-600" />
              <div>
                <p className="text-xs text-gray-600">Avg. Session</p>
                <p className="text-lg font-bold text-gray-900">4m 32s</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-4 border border-gray-200">
            <div className="flex items-center gap-3">
              <MapPin size={20} className="text-gray-600" />
              <div>
                <p className="text-xs text-gray-600">Top Location</p>
                <p className="text-lg font-bold text-gray-900">Nairobi</p>
              </div>
            </div>
          </div>
        </div>

    </div>
  );
};

export default SuperAdminDashboardPage;