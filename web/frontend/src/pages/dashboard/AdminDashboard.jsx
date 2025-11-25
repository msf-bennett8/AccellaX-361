import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// TEMPORARY MOCK - Replace later with real implementation
const useAuth = () => ({ 
  user: { 
    name: 'Bennett Oraro',
    role: 'head_coach',
    email: 'bennett@accellax.com',
    academy: 'NextGen Multisport Academy'
  } 
});

// TEMPORARY MOCK SERVICES - Replace later with real API calls
const dashboardService = {
  getAcademyOverview: async (period) => ({ 
    data: {
      total_athletes: { count: 87, change_percentage: 12.5 },
      attendance_rate: { percentage: 85.3, change_percentage: 3.2 },
      active_programs: { count: 4, change_percentage: 0 },
      total_sessions: { count: 45, change_percentage: 8.1 },
      total_revenue: { amount: 1245000, change_percentage: 15.3 }
    }
  }),
  getRecentSessions: async (params) => ({ 
    data: [
      {
        id: 1,
        session_reference: 'SES-2025-001',
        session_date: new Date().toISOString(),
        age_group: '10-13 years',
        coach: { name: 'Coach Bennett Oraro' },
        program: 'Elite Training',
        attendance_count: 18,
        total_enrolled: 22,
        attendance_rate: 81.8,
        status: 'completed',
        session_time: '4:00 PM - 6:00 PM',
        location: 'Main Field',
        notes: 'Great energy today, worked on passing drills',
        created_at: new Date().toISOString()
      },
      {
        id: 2,
        session_reference: 'SES-2025-002',
        session_date: new Date(Date.now() - 86400000).toISOString(),
        age_group: '7-9 years',
        coach: { name: 'Coach Mary Njeri' },
        program: 'Weekend Warrior',
        attendance_count: 15,
        total_enrolled: 18,
        attendance_rate: 83.3,
        status: 'completed',
        session_time: '9:00 AM - 11:00 AM',
        location: 'Training Ground A',
        notes: 'Focused on basic ball control',
        created_at: new Date(Date.now() - 86400000).toISOString()
      },
      {
        id: 3,
        session_reference: 'SES-2025-003',
        session_date: new Date(Date.now() - 172800000).toISOString(),
        age_group: '13+ years',
        coach: { name: 'Coach John Kamau' },
        program: 'Team Support',
        attendance_count: 20,
        total_enrolled: 25,
        attendance_rate: 80.0,
        status: 'completed',
        session_time: '4:00 PM - 6:00 PM',
        location: 'Main Field',
        notes: 'Tactical training, reviewed 4-4-2 formation',
        created_at: new Date(Date.now() - 172800000).toISOString()
      },
      {
        id: 4,
        session_reference: 'SES-2025-004',
        session_date: new Date(Date.now() - 259200000).toISOString(),
        age_group: '4-6 years',
        coach: { name: 'Coach Sarah Akinyi' },
        program: 'Holiday Programme',
        attendance_count: 12,
        total_enrolled: 15,
        attendance_rate: 80.0,
        status: 'completed',
        session_time: '2:00 PM - 4:00 PM',
        location: 'Training Ground B',
        notes: 'Fun games and basic coordination exercises',
        created_at: new Date(Date.now() - 259200000).toISOString()
      },
      {
        id: 5,
        session_reference: 'SES-2025-005',
        session_date: new Date().toISOString(),
        age_group: '10-13 years',
        coach: { name: 'Coach Peter Ochieng' },
        program: 'Elite Training',
        attendance_count: 0,
        total_enrolled: 20,
        attendance_rate: 0,
        status: 'scheduled',
        session_time: '6:00 PM - 8:00 PM',
        location: 'Main Field',
        notes: 'Upcoming evening session',
        created_at: new Date().toISOString()
      }
    ]
  }),
  getPaymentMethodsBreakdown: async (period) => ({ 
    data: [
      { method: 'M-Pesa', total_amount: 850000, transaction_count: 68, percentage: 68 },
      { method: 'Cash', total_amount: 295000, transaction_count: 19, percentage: 24 },
      { method: 'Bank Transfer', total_amount: 100000, transaction_count: 8, percentage: 8 }
    ]
  }),
  getProgramEnrollmentBreakdown: async (period) => ({ 
    data: [
      { program: 'Elite Training', enrolled: 35, percentage: 40, revenue: 525000 },
      { program: 'Weekend Warrior', enrolled: 28, percentage: 32, revenue: 420000 },
      { program: 'Holiday Programme', enrolled: 15, percentage: 17, revenue: 180000 },
      { program: 'Team Support', enrolled: 9, percentage: 11, revenue: 120000 }
    ]
  }),
  getTopPerformingAthletes: async (limit, period) => ({ 
    data: [
      { athlete_id: 1, athlete_name: 'Ahmed Hassan', age_group: '10-13', attendance_rate: 98.5, sessions_attended: 42, program: 'Elite Training' },
      { athlete_id: 2, athlete_name: 'Fatima Ali', age_group: '7-9', attendance_rate: 96.2, sessions_attended: 38, program: 'Weekend Warrior' },
      { athlete_id: 3, athlete_name: 'John Kipchoge', age_group: '13+', attendance_rate: 94.8, sessions_attended: 40, program: 'Team Support' },
      { athlete_id: 4, athlete_name: 'Mary Wanjiku', age_group: '10-13', attendance_rate: 93.5, sessions_attended: 39, program: 'Elite Training' },
      { athlete_id: 5, athlete_name: 'David Omondi', age_group: '7-9', attendance_rate: 91.7, sessions_attended: 35, program: 'Weekend Warrior' }
    ]
  }),
  getRecentEnrollments: async (limit) => ({ 
    data: [
      {
        id: 1,
        enrollment_number: 'ENR-2025-001',
        athlete_name: 'Grace Njeri',
        age: 11,
        age_group: '10-13',
        program: 'Elite Training',
        payment_status: 'paid',
        payment_method: 'M-Pesa',
        amount: 15000,
        parent_name: 'Jane Njeri',
        parent_phone: '+254712345678',
        location: 'Nairobi',
        enrolled_at: new Date().toISOString()
      },
      {
        id: 2,
        enrollment_number: 'ENR-2025-002',
        athlete_name: 'Kevin Otieno',
        age: 8,
        age_group: '7-9',
        program: 'Weekend Warrior',
        payment_status: 'pending',
        payment_method: 'Cash',
        amount: 10000,
        parent_name: 'Peter Otieno',
        parent_phone: '+254723456789',
        location: 'Kisumu',
        enrolled_at: new Date(Date.now() - 3600000).toISOString()
      },
      {
        id: 3,
        enrollment_number: 'ENR-2025-003',
        athlete_name: 'Sarah Mwangi',
        age: 14,
        age_group: '13+',
        program: 'Team Support',
        payment_status: 'paid',
        payment_method: 'Bank Transfer',
        amount: 12000,
        parent_name: 'Daniel Mwangi',
        parent_phone: '+254734567890',
        location: 'Nakuru',
        enrolled_at: new Date(Date.now() - 7200000).toISOString()
      }
    ]
  }),
  getAttendanceDistribution: async (period) => ({ 
    data: [
      { status: 'Present', count: 398, color: '#10B981' },
      { status: 'Absent', count: 68, color: '#EF4444' },
      { status: 'Excused', count: 23, color: '#F59E0B' },
      { status: 'Late', count: 15, color: '#3B82F6' }
    ]
  })
};

const auditService = {
  getAuditLogs: async (params) => ({ 
    data: {
      data: [
        {
          id: 1,
          event_category: 'security',
          description: 'New coach account created: Coach John Kamau',
          severity: 'low',
          is_suspicious: false,
          occurred_at: new Date(Date.now() - 300000).toISOString()
        },
        {
          id: 2,
          event_category: 'enrollment',
          description: 'New athlete enrolled: Ahmed Hassan (Elite Training)',
          severity: 'low',
          is_suspicious: false,
          occurred_at: new Date(Date.now() - 600000).toISOString()
        },
        {
          id: 3,
          event_category: 'payment',
          description: 'Payment received: KES 15,000 via M-Pesa for Elite Training',
          severity: 'low',
          is_suspicious: false,
          occurred_at: new Date(Date.now() - 900000).toISOString()
        },
        {
          id: 4,
          event_category: 'security',
          description: 'Failed login attempt from unknown IP',
          severity: 'medium',
          is_suspicious: true,
          occurred_at: new Date(Date.now() - 1200000).toISOString()
        },
        {
          id: 5,
          event_category: 'session',
          description: 'Training session updated: Elite Training schedule changed to 6:00 PM',
          severity: 'low',
          is_suspicious: false,
          occurred_at: new Date(Date.now() - 1800000).toISOString()
        },
        {
          id: 6,
          event_category: 'user',
          description: 'Parent profile updated: Emergency contact information changed',
          severity: 'low',
          is_suspicious: false,
          occurred_at: new Date(Date.now() - 2400000).toISOString()
        },
        {
          id: 7,
          event_category: 'security',
          description: 'Admin role elevated for user: Coach Kamau',
          severity: 'high',
          is_suspicious: false,
          occurred_at: new Date(Date.now() - 3000000).toISOString()
        },
        {
          id: 8,
          event_category: 'enrollment',
          description: 'Enrollment cancelled: Kevin Otieno withdrawn from Weekend Warrior',
          severity: 'medium',
          is_suspicious: false,
          occurred_at: new Date(Date.now() - 3600000).toISOString()
        },
        {
          id: 9,
          event_category: 'payment',
          description: 'Payment refund processed: KES 10,000 for cancelled enrollment',
          severity: 'medium',
          is_suspicious: false,
          occurred_at: new Date(Date.now() - 4200000).toISOString()
        },
        {
          id: 10,
          event_category: 'security',
          description: 'Multiple failed login attempts detected',
          severity: 'high',
          is_suspicious: true,
          occurred_at: new Date(Date.now() - 4800000).toISOString()
        },
        {
          id: 11,
          event_category: 'user',
          description: 'New parent account registered: Jane Njeri',
          severity: 'low',
          is_suspicious: false,
          occurred_at: new Date(Date.now() - 5400000).toISOString()
        },
        {
          id: 12,
          event_category: 'session',
          description: 'New program added: Summer Holiday Camp 2025',
          severity: 'low',
          is_suspicious: false,
          occurred_at: new Date(Date.now() - 6000000).toISOString()
        },
        {
          id: 13,
          event_category: 'payment',
          description: 'Bulk payment import completed: 25 M-Pesa transactions',
          severity: 'low',
          is_suspicious: false,
          occurred_at: new Date(Date.now() - 6600000).toISOString()
        }
      ]
    }
  })
};

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

const AdminDashboardPage = () => {
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
  const [programEnrollments, setProgramEnrollments] = useState([]);
  const [topAthletes, setTopAthletes] = useState([]);
  const [recentSessions, setRecentSessions] = useState([]);

  // Real data from API
  const [dashboardData, setDashboardData] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [paymentBreakdown, setPaymentBreakdown] = useState(null);
  const [pendingPayments, setPendingPayments] = useState([
    { id: 1, athlete: 'Kevin Otieno', amount: 15000, due_date: '2024-11-15', status: 'overdue', parent: 'Peter Otieno' },
    { id: 2, athlete: 'Grace Njeri', amount: 15000, due_date: '2024-11-20', status: 'pending', parent: 'Jane Njeri' },
    { id: 3, athlete: 'Sarah Mwangi', amount: 12000, due_date: '2024-11-25', status: 'pending', parent: 'Daniel Mwangi' }
  ]);
  const [error, setError] = useState(null);
  const [orderStatusData, setOrderStatusData] = useState([]);

  // Replaced by enrollmentSources - keeping for backward compatibility
const [trafficData, setTrafficData] = useState([
  { source: 'Walk-in', visitors: 45, percentage: 38, orders: 18, conversion: 40.0, color: '#3B82F6' },
  { source: 'Social Media', visitors: 33, percentage: 28, orders: 12, conversion: 36.4, color: '#10B981' },
  { source: 'Referral', visitors: 28, percentage: 24, orders: 15, conversion: 53.6, color: '#F59E0B' },
  { source: 'Website', visitors: 12, percentage: 10, orders: 6, conversion: 50.0, color: '#EF4444' }
]);

const [lowAttendanceAlerts, setLowAttendanceAlerts] = useState([
  { id: 1, name: 'Ahmed Hassan', attendance_rate: 45, threshold: 50, category: 'Chronic Absentee', age_group: '10-13' },
  { id: 2, name: 'Sarah Mwangi', attendance_rate: 48, threshold: 50, category: 'Chronic Absentee', age_group: '13+' },
  { id: 3, name: 'Kevin Otieno', attendance_rate: 62, threshold: 75, category: 'Inconsistent', age_group: '7-9' },
  { id: 4, name: 'Grace Njeri', attendance_rate: 68, threshold: 75, category: 'Inconsistent', age_group: '10-13' }
]);

  const [recentActivities, setRecentActivities] = useState([]);

  // Mock data - Replace with API calls
  const [stats, setStats] = useState({
    revenue: {
      total: 1245000,
      change: 15.3,
      trend: 'up',
      target: 1500000,
      targetProgress: 83.0
    },
    athletes: {
      total: 87,
      change: 12.5,
      trend: 'up',
      active: 82,
      suspended: 3,
      inactive: 2,
      new_this_month: 8
    },
    sessions: {
      total: 45,
      change: 8.1,
      trend: 'up',
      completed: 38,
      scheduled: 7,
      cancelled: 2,
      avgAttendanceRate: 85.3
    },
    programs: {
      total: 4,
      elite: 35,
      weekend: 28,
      holiday: 15,
      team: 9
    },
    attendance: {
      total_attendances: 1834,
      change: 10.8,
      present: 1587,
      absent: 198,
      excused: 34,
      late: 15,
      rate: 86.5
    },
    coaches: {
      total: 6,
      active: 6,
      avgSessionsPerCoach: 7.5
    },
    payments: {
      rate: 92.5,
      change: 3.5,
      pending: 7,
      overdue: 4
    },
    satisfaction: {
      average: 4.7,
      total: 156,
      breakdown: { 5: 98, 4: 42, 3: 12, 2: 3, 1: 1 }
    }
  });

  const attendanceData = [
    { date: '18 Nov', sessions: 5, attendance: 78, attendance_rate: 87.6, enrollments: 2 },
    { date: '19 Nov', sessions: 6, attendance: 92, attendance_rate: 89.3, enrollments: 3 },
    { date: '20 Nov', sessions: 4, attendance: 65, attendance_rate: 84.4, enrollments: 1 },
    { date: '21 Nov', sessions: 7, attendance: 105, attendance_rate: 88.2, enrollments: 4 },
    { date: '22 Nov', sessions: 5, attendance: 82, attendance_rate: 86.8, enrollments: 2 },
    { date: '23 Nov', sessions: 6, attendance: 95, attendance_rate: 90.5, enrollments: 5 },
    { date: '24 Nov', sessions: 8, attendance: 118, attendance_rate: 85.5, enrollments: 3 },
    { date: '25 Nov', sessions: 5, attendance: 88, attendance_rate: 91.7, enrollments: 2 },
    { date: '26 Nov', sessions: 6, attendance: 98, attendance_rate: 87.5, enrollments: 4 }
  ];

  const sessionTimeData = [
    { time: '6:00 AM', sessions: 0, attendance: 0 },
    { time: '9:00 AM', sessions: 2, attendance: 28 },
    { time: '12:00 PM', sessions: 1, attendance: 15 },
    { time: '2:00 PM', sessions: 3, attendance: 45 },
    { time: '4:00 PM', sessions: 5, attendance: 85 },
    { time: '6:00 PM', sessions: 3, attendance: 52 },
    { time: '8:00 PM', sessions: 1, attendance: 18 }
  ];

  const programPerformance = [
    { name: 'Elite Training', enrolled: 35, sessions: 18, percentage: 40, color: '#ea580c', revenue: 525000, attendance_rate: 89.2 },
    { name: 'Weekend Warrior', enrolled: 28, sessions: 14, percentage: 32, color: '#f97316', revenue: 420000, attendance_rate: 85.7 },
    { name: 'Holiday Programme', enrolled: 15, sessions: 8, percentage: 17, color: '#fb923c', revenue: 180000, attendance_rate: 87.5 },
    { name: 'Team Support', enrolled: 9, sessions: 5, percentage: 11, color: '#fdba74', revenue: 120000, attendance_rate: 83.3 }
  ];

  const initialTopAthletes = [
    { 
      id: 1, 
      name: 'Ahmed Hassan', 
      athlete_id: 'ATH-001',
      age: 11,
      age_group: '10-13',
      sessions_attended: 42, 
      attendance_rate: 98.5, 
      program: 'Elite Training',
      skill_level: 'Advanced',
      parent: 'Mohamed Hassan',
      phone: '+254712345678',
      trend: 'up',
      trendValue: 5,
      fitness_score: 92
    },
    { 
      id: 2, 
      name: 'Fatima Ali', 
      athlete_id: 'ATH-002',
      age: 8,
      age_group: '7-9',
      sessions_attended: 38, 
      attendance_rate: 96.2, 
      program: 'Weekend Warrior',
      skill_level: 'Intermediate',
      parent: 'Ali Ibrahim',
      phone: '+254723456789',
      trend: 'up',
      trendValue: 8,
      fitness_score: 88
    },
    { 
      id: 3, 
      name: 'John Kipchoge', 
      athlete_id: 'ATH-003',
      age: 14,
      age_group: '13+',
      sessions_attended: 40, 
      attendance_rate: 94.8, 
      program: 'Team Support',
      skill_level: 'Advanced',
      parent: 'Peter Kipchoge',
      phone: '+254734567890',
      trend: 'up',
      trendValue: 3,
      fitness_score: 90
    },
    { 
      id: 4, 
      name: 'Mary Wanjiku', 
      athlete_id: 'ATH-004',
      age: 12,
      age_group: '10-13',
      sessions_attended: 39, 
      attendance_rate: 93.5, 
      program: 'Elite Training',
      skill_level: 'Intermediate',
      parent: 'Jane Wanjiku',
      phone: '+254745678901',
      trend: 'down',
      trendValue: 2,
      fitness_score: 86
    },
    { 
      id: 5, 
      name: 'David Omondi', 
      athlete_id: 'ATH-005',
      age: 9,
      age_group: '7-9',
      sessions_attended: 35, 
      attendance_rate: 91.7, 
      program: 'Weekend Warrior',
      skill_level: 'Beginner',
      parent: 'Rose Omondi',
      phone: '+254756789012',
      trend: 'up',
      trendValue: 12,
      fitness_score: 82
    }
  ];

  const initialRecentSessions = [
    { 
      id: 'SES-2024-1234', 
      coach: 'Coach Bennett Oraro', 
      program: 'Elite Training', 
      age_group: '10-13 years',
      attendance: '18/22',
      attendance_rate: 81.8,
      status: 'completed', 
      time: '2 hours ago',
      location: 'Main Field',
      duration: '2 hours'
    },
    { 
      id: 'SES-2024-1235', 
      coach: 'Coach Mary Njeri', 
      program: 'Weekend Warrior', 
      age_group: '7-9 years',
      attendance: '15/18',
      attendance_rate: 83.3,
      status: 'completed', 
      time: '1 day ago',
      location: 'Training Ground A',
      duration: '2 hours'
    },
    { 
      id: 'SES-2024-1236', 
      coach: 'Coach John Kamau', 
      program: 'Team Support', 
      age_group: '13+ years',
      attendance: '20/25',
      attendance_rate: 80.0,
      status: 'completed', 
      time: '2 days ago',
      location: 'Main Field',
      duration: '2 hours'
    },
    { 
      id: 'SES-2024-1237', 
      coach: 'Coach Sarah Akinyi', 
      program: 'Holiday Programme', 
      age_group: '4-6 years',
      attendance: '12/15',
      attendance_rate: 80.0,
      status: 'completed', 
      time: '3 days ago',
      location: 'Training Ground B',
      duration: '2.5 hours'
    },
    { 
      id: 'SES-2024-1238', 
      coach: 'Coach Peter Ochieng', 
      program: 'Elite Training', 
      age_group: '10-13 years',
      attendance: '0/20',
      attendance_rate: 0,
      status: 'scheduled', 
      time: 'Today at 6:00 PM',
      location: 'Main Field',
      duration: '2 hours'
    }
  ];

  const alerts = [
    { id: 1, type: 'warning', message: '3 athletes have chronic absenteeism (below 50% attendance)', time: '10 mins ago', action: 'View Athletes' },
    { id: 2, type: 'error', message: '4 payment reminders overdue for this month', time: '1 hour ago', action: 'Send Reminders' },
    { id: 3, type: 'info', message: 'You have 7 scheduled sessions for today', time: '2 hours ago', action: 'View Schedule' },
    { id: 4, type: 'success', message: 'Elite Training program received 5 new parent reviews (4.8★)', time: '5 hours ago', action: 'View Reviews' },
    { id: 5, type: 'warning', message: '2 athletes have missed 3 consecutive sessions', time: '6 hours ago', action: 'Contact Parents' },
    { id: 6, type: 'info', message: '8 new enrollment inquiries received this week', time: '8 hours ago', action: 'View Inquiries' }
  ];

  const revenueByPayment = [
    { name: 'M-Pesa', value: 850000, percentage: 68, color: '#22c55e', transactions: 68 },
    { name: 'Cash', value: 295000, percentage: 24, color: '#3b82f6', transactions: 19 },
    { name: 'Bank Transfer', value: 100000, percentage: 8, color: '#f59e0b', transactions: 8 }
  ];

  const athleteSegments = [
    { segment: 'New Athletes', count: 8, revenue: 120000, avgPayment: 15000, color: '#3b82f6' },
    { segment: 'Regular Athletes', count: 65, revenue: 975000, avgPayment: 15000, color: '#22c55e' },
    { segment: 'Elite Athletes', count: 14, revenue: 210000, avgPayment: 15000, color: '#a855f7' }
  ];

  const enrollmentSources = [
    { source: 'Walk-in', inquiries: 45, percentage: 38, enrollments: 18, conversion: 40.0 },
    { source: 'Social Media', inquiries: 33, percentage: 28, enrollments: 12, conversion: 36.4 },
    { source: 'Referral', inquiries: 28, percentage: 24, enrollments: 15, conversion: 53.6 },
    { source: 'Website', inquiries: 12, percentage: 10, enrollments: 6, conversion: 50.0 }
  ];

  const performanceMetrics = [
    { metric: 'Training Quality', score: 92, max: 100 },
    { metric: 'Coach Effectiveness', score: 88, max: 100 },
    { metric: 'Parent Satisfaction', score: 90, max: 100 },
    { metric: 'Facility Condition', score: 85, max: 100 },
    { metric: 'Safety Standards', score: 95, max: 100 },
    { metric: 'Communication', score: 87, max: 100 }
  ];

  const upcomingTasks = [
    { id: 1, task: 'Contact parents of 3 chronically absent athletes', priority: 'high', deadline: 'Today' },
    { id: 2, task: 'Send payment reminders to 4 overdue accounts', priority: 'high', deadline: 'Today' },
    { id: 3, task: 'Review 8 new enrollment applications', priority: 'medium', deadline: 'Tomorrow' },
    { id: 4, task: 'Complete fitness assessments for 12 athletes', priority: 'medium', deadline: 'This Week' },
    { id: 5, task: 'Update training schedules for holiday programme', priority: 'low', deadline: 'This Week' }
  ];

  // Top products converted to top athletes (additional mock data for charts)
  const topProducts = [
    { 
      id: 1, 
      name: 'Ahmed Hassan', 
      sku: 'ATH-001',
      sales: 42, 
      revenue: 15000, 
      views: 42, 
      stock: 98.5,
      rating: 4.9,
      reviews: 8,
      trend: 'up',
      trendValue: 5,
      wishlist: 12
    },
    { 
      id: 2, 
      name: 'Fatima Ali', 
      sku: 'ATH-002',
      sales: 38, 
      revenue: 15000, 
      views: 38, 
      stock: 96.2,
      rating: 4.8,
      reviews: 7,
      trend: 'up',
      trendValue: 8,
      wishlist: 10
    },
    { 
      id: 3, 
      name: 'John Kipchoge', 
      sku: 'ATH-003',
      sales: 40, 
      revenue: 12000, 
      views: 40, 
      stock: 94.8,
      rating: 4.9,
      reviews: 9,
      trend: 'up',
      trendValue: 3,
      wishlist: 11
    },
    { 
      id: 4, 
      name: 'Mary Wanjiku', 
      sku: 'ATH-004',
      sales: 39, 
      revenue: 15000, 
      views: 39, 
      stock: 93.5,
      rating: 4.7,
      reviews: 6,
      trend: 'down',
      trendValue: 2,
      wishlist: 8
    },
    { 
      id: 5, 
      name: 'David Omondi', 
      sku: 'ATH-005',
      sales: 35, 
      revenue: 10000, 
      views: 35, 
      stock: 91.7,
      rating: 4.6,
      reviews: 5,
      trend: 'up',
      trendValue: 12,
      wishlist: 7
    }
  ];

  // Program performance data (used in charts)
  const programPerformanceData = programPerformance;

  // Athlete segments data (used in charts)
  const athleteSegmentsData = athleteSegments;

  // Enrollment sources data (used in charts)
  const enrollmentSourcesData = enrollmentSources;

  // Revenue data for the performance overview chart
  const revenueData = [
    { date: '18 Nov', revenue: 145000, enrollments: 5, fees_collected: 95000, athletes: 78 },
    { date: '19 Nov', revenue: 168000, enrollments: 6, fees_collected: 105000, athletes: 92 },
    { date: '20 Nov', revenue: 128000, enrollments: 4, fees_collected: 85000, athletes: 65 },
    { date: '21 Nov', revenue: 189000, enrollments: 7, fees_collected: 125000, athletes: 105 },
    { date: '22 Nov', revenue: 156000, enrollments: 5, fees_collected: 102000, athletes: 82 },
    { date: '23 Nov', revenue: 175000, enrollments: 6, fees_collected: 115000, athletes: 95 },
    { date: '24 Nov', revenue: 208000, enrollments: 8, fees_collected: 138000, athletes: 118 },
    { date: '25 Nov', revenue: 162000, enrollments: 5, fees_collected: 108000, athletes: 88 },
    { date: '26 Nov', revenue: 182000, enrollments: 6, fees_collected: 120000, athletes: 98 }
  ];

  // Initialize with mock data
  useEffect(() => {
    if (topAthletes.length === 0) {
      setTopAthletes(initialTopAthletes);
    }
    if (recentSessions.length === 0) {
      setRecentSessions(initialRecentSessions);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [timeRange]);

  const loadDashboardData = async () => {
  setLoading(true);
  setError(null);
  try {
    const period = timeRange === '24hours' ? 'today' : timeRange === '7days' ? 'week' : 'month';
    
    // Simulate network delay for realism
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Fetch all dashboard data in parallel using MOCK endpoints
    const [
      overviewData, 
      sessionsData, 
      paymentMethodsData,
      programEnrollmentData,
      topAthletesData,
      recentEnrollmentsData,
      attendanceStatusData,
      auditLogsData
    ] = await Promise.all([
      dashboardService.getAcademyOverview(period),
      dashboardService.getRecentSessions({ page: 1, per_page: 10 }),
      dashboardService.getPaymentMethodsBreakdown(period),
      dashboardService.getProgramEnrollmentBreakdown(period),
      dashboardService.getTopPerformingAthletes(5, period),
      dashboardService.getRecentEnrollments(10),
      dashboardService.getAttendanceDistribution(period),
      auditService.getAuditLogs({ per_page: 13, sort_by: 'occurred_at', sort_order: 'desc' })
    ]);

    console.log('✅ Dashboard data loaded (MOCK DATA):', { 
      overviewData, 
      sessionsData,
      paymentMethodsData,
      programEnrollmentData,
      topAthletesData,
      recentEnrollmentsData,
      attendanceStatusData,
      auditLogsData
    });
    
    // Update state with mock data
    setDashboardData(overviewData.data);
    setTransactions(sessionsData.data || []);
    setPaymentMethods(paymentMethodsData.data || []);
    setProgramEnrollments(programEnrollmentData.data || []);
    setTopAthletes(topAthletesData.data || []);
    setRecentSessions(sessionsData.data?.slice(0, 5) || []);

    // Update attendance status distribution from mock API
    if (attendanceStatusData.data) {
      console.log('📊 Attendance Status Data from MOCK API:', attendanceStatusData.data);
      console.log('📊 First item color:', attendanceStatusData.data[0]?.color);
      console.log('📊 Full first item:', JSON.stringify(attendanceStatusData.data[0], null, 2));
      setOrderStatusData(attendanceStatusData.data);
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
          case 'enrollment':
            icon = UserPlus;
            color = 'blue';
            break;
          case 'payment':
            icon = DollarSign;
            color = 'green';
            break;
          case 'session':
            icon = Activity;
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
      console.log('✅ Mapped audit logs to activities (MOCK):', activities);
    }

    // Map mock API data to stats structure for the academy
    if (overviewData.data) {
      const apiData = overviewData.data;
      setStats(prev => ({
        ...prev,
        athletes: {
          total: parseInt(apiData.total_athletes?.count || 0),
          change: apiData.total_athletes?.change_percentage || 0,
          trend: (apiData.total_athletes?.change_percentage || 0) > 0 ? 'up' : 
                 (apiData.total_athletes?.change_percentage || 0) < 0 ? 'down' : 'flat',
          active: prev.athletes.active,
          suspended: prev.athletes.suspended,
          inactive: prev.athletes.inactive,
          new_this_month: prev.athletes.new_this_month
        },
        attendance: {
          ...prev.attendance,
          rate: parseFloat(apiData.attendance_rate?.percentage || 0),
          change: apiData.attendance_rate?.change_percentage || 0
        },
        sessions: {
          total: parseInt(apiData.total_sessions?.count || 0),
          change: apiData.total_sessions?.change_percentage || 0,
          trend: (apiData.total_sessions?.change_percentage || 0) > 0 ? 'up' : 
                 (apiData.total_sessions?.change_percentage || 0) < 0 ? 'down' : 'flat',
          completed: prev.sessions.completed,
          scheduled: prev.sessions.scheduled,
          cancelled: prev.sessions.cancelled,
          avgAttendanceRate: prev.sessions.avgAttendanceRate
        },
        revenue: {
          total: parseFloat(apiData.total_revenue?.amount || 0),
          change: apiData.total_revenue?.change_percentage || 0,
          trend: (apiData.total_revenue?.change_percentage || 0) > 0 ? 'up' : 
                 (apiData.total_revenue?.change_percentage || 0) < 0 ? 'down' : 'flat',
          target: 1500000,
          targetProgress: ((parseFloat(apiData.total_revenue?.amount || 0)) / 1500000) * 100
        }
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
  <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 hover:shadow-md transition-shadow border border-gray-100 w-full min-w-0">
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
  <div className="min-h-screen bg-gray-50 p-2 sm:p-4 md:p-6 overflow-x-hidden w-full">
    <div className="w-full max-w-full px-2 sm:px-4 md:max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 w-full">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-4 w-full">
            <div className="min-w-0 flex-1">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-2 break-words">
                Welcome back, Coach {user?.name?.split(' ')[0]}! 👋
              </h1>
              <p className="text-sm md:text-base text-gray-600 break-words">
                Here's what's happening at NextGen Academy today.
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </p>
            </div>
            
            <div className="flex items-center gap-2 flex-wrap justify-end">
              <div className="relative w-full sm:w-auto">
                <select
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value)}
                  className="w-full sm:w-auto px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 appearance-none pr-10 bg-white text-gray-900 text-sm"
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
                className="flex items-center gap-2 px-3 sm:px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 text-gray-900"
              >
                <RefreshCw className={`w-4 h-4 text-gray-900 ${refreshing ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
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
                  <div className="absolute right-0 mt-2 w-[calc(100vw-2rem)] sm:w-96 max-w-md bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-96 overflow-y-auto">
                    <div className="p-4 border-b border-gray-200">
                      <h3 className="font-semibold text-gray-900">Notifications</h3>
                    </div>
                    <div className="divide-y divide-gray-100">
                      {alerts.map(alert => {
                        const alertIcon = getAlertIcon(alert.type);
                        const AlertIcon = alertIcon.icon;
                        return (
                          <div key={alert.id} className="p-4 hover:bg-blue-100 transition-colors cursor-pointer">
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
              
              <button className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm whitespace-nowrap">
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Export Report</span>
                <span className="sm:hidden">Export</span>
              </button>
            </div>
          </div>
        </div>

        {/* Attendance Rate Progress */}
        <div className="bg-gradient-to-r from-orange-600 to-orange-500 rounded-lg shadow-lg p-4 sm:p-6 mb-6 text-white w-full">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold mb-1">Monthly Attendance Target</h3>
              <p className="text-orange-100 text-sm">November 2024</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold">{stats.attendance.rate.toFixed(1)}%</p>
              <p className="text-orange-100 text-sm">Target: 90% attendance rate</p>
            </div>
          </div>
          <div className="w-full bg-orange-400 rounded-full h-3 mb-2">
            <div
              className="bg-white h-3 rounded-full transition-all duration-500"
              style={{ width: `${(stats.attendance.rate / 90) * 100}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-sm text-orange-100">
            <span>{((stats.attendance.rate / 90) * 100).toFixed(1)}% of target</span>
            <span>{(90 - stats.attendance.rate).toFixed(1)}% to reach goal</span>
          </div>
        </div>

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-6 md:mb-8 w-full">
          {/* Total Athletes Card - Blue */}
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-white bg-opacity-20 rounded-lg">
                <Users size={24} />
              </div>
              <span className={`flex items-center gap-1 text-sm ${
                stats.athletes.trend === 'up' ? 'text-green-200' : stats.athletes.trend === 'down' ? 'text-red-200' : 'text-gray-200'
              }`}>
                {stats.athletes.trend === 'up' ? <TrendingUp size={16} /> : stats.athletes.trend === 'down' ? <TrendingDown size={16} /> : <Minus size={16} />}
                {Math.abs(stats.athletes.change)}%
              </span>
            </div>
            <h3 className="text-sm font-medium opacity-90 mb-1">Total Athletes</h3>
            <p className="text-3xl font-bold mb-1">{stats.athletes.total}</p>
            <p className="text-xs opacity-75">{stats.athletes.new_this_month} new this month</p>
          </div>

          {/* Attendance Rate Card - Green */}
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-lg p-6 text-white">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-white bg-opacity-20 rounded-lg">
                <CheckCircle size={24} />
              </div>
              <span className={`flex items-center gap-1 text-sm ${
                stats.attendance.change > 0 ? 'text-green-200' : 'text-red-200'
              }`}>
                {stats.attendance.change > 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                {Math.abs(stats.attendance.change)}%
              </span>
            </div>
            <h3 className="text-sm font-medium opacity-90 mb-1">Attendance Rate</h3>
            <p className="text-3xl font-bold mb-1">{stats.attendance.rate.toFixed(1)}%</p>
            <p className="text-xs opacity-75">Target: 90% attendance</p>
          </div>

          {/* Total Sessions Card - Orange */}
          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg shadow-lg p-6 text-white">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-white bg-opacity-20 rounded-lg">
                <Activity size={24} />
              </div>
              <span className={`flex items-center gap-1 text-sm ${
                stats.sessions.trend === 'up' ? 'text-green-200' : stats.sessions.trend === 'down' ? 'text-red-200' : 'text-gray-200'
              }`}>
                {stats.sessions.trend === 'up' ? <TrendingUp size={16} /> : stats.sessions.trend === 'down' ? <TrendingDown size={16} /> : <Minus size={16} />}
                {Math.abs(stats.sessions.change)}%
              </span>
            </div>
            <h3 className="text-sm font-medium opacity-90 mb-1">Total Sessions</h3>
            <p className="text-3xl font-bold mb-1">{stats.sessions.total}</p>
            <p className="text-xs opacity-75">{stats.sessions.scheduled} scheduled today</p>
          </div>

          {/* Total Revenue Card - Purple */}
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-lg p-6 text-white">
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
            <p className="text-3xl font-bold mb-1">KES {(stats.revenue.total / 1000).toFixed(0)}K</p>
            <p className="text-xs opacity-75">vs last period</p>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <StatCard
            icon={Users}
            label="Active Athletes"
            value={stats.athletes.active}
            change={stats.athletes.change}
            trend={stats.athletes.trend}
            color="bg-green-600"
            subtitle={`${stats.athletes.suspended} suspended, ${stats.athletes.inactive} inactive`}
          />
          <StatCard
            icon={Activity}
            label="Total Sessions"
            value={stats.sessions.total}
            change={stats.sessions.change}
            trend={stats.sessions.trend}
            color="bg-blue-600"
            subtitle={`${stats.sessions.completed} completed this month`}
          />
          <StatCard
            icon={CheckCircle}
            label="Attendance Rate"
            value={`${stats.attendance.rate.toFixed(1)}%`}
            change={stats.attendance.change}
            trend={stats.attendance.change > 0 ? 'up' : 'down'}
            color="bg-purple-600"
            subtitle={`${stats.attendance.present} total attendances`}
          />
          <StatCard
            icon={DollarSign}
            label="Monthly Revenue"
            value={`KSh ${(stats.revenue.total / 1000).toFixed(0)}K`}
            change={stats.revenue.change}
            trend={stats.revenue.trend}
            color="bg-orange-600"
            subtitle={`Payment rate: ${stats.payments.rate}%`}
          />
        </div>

        {/* Secondary Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4 mb-4 md:mb-6 w-full overflow-x-auto">
          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-yellow-600" />
              <span className="text-sm text-gray-600">Elite Program</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.programs.elite}</p>
            <p className="text-xs text-gray-500 mt-1">Athletes enrolled</p>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-4 h-4 text-blue-600" />
              <span className="text-sm text-gray-600">Weekend</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.programs.weekend}</p>
            <p className="text-xs text-gray-500 mt-1">Athletes enrolled</p>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4 text-purple-600" />
              <span className="text-sm text-gray-600">Holiday</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.programs.holiday}</p>
            <p className="text-xs text-gray-500 mt-1">Athletes enrolled</p>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-4 h-4 text-red-600" />
              <span className="text-sm text-gray-600">Team Support</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.programs.team}</p>
            <p className="text-xs text-gray-500 mt-1">Athletes enrolled</p>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <Star className="w-4 h-4 text-yellow-600" />
              <span className="text-sm text-gray-600">Satisfaction</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.satisfaction.average}</p>
            <p className="text-xs text-gray-500 mt-1">{stats.satisfaction.total} reviews</p>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-4 h-4 text-green-600" />
              <span className="text-sm text-gray-600">Payment Rate</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.payments.rate}%</p>
            <p className="text-xs text-gray-500 mt-1">
              {stats.payments.pending} pending
            </p>
          </div>
        </div>

        {/* Secondary Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Avg Attendance Rate */}
          <div className="bg-white rounded-lg shadow p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-orange-100 rounded-lg">
                <CheckCircle size={20} className="text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Avg Attendance</p>
                <p className="text-2xl font-bold">{stats.sessions.avgAttendanceRate.toFixed(1)}%</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className={`flex items-center gap-1 ${
                stats.attendance.change > 0 ? 'text-green-600' : stats.attendance.change < 0 ? 'text-red-600' : 'text-gray-600'
              }`}>
                {stats.attendance.change > 0 ? <ArrowUp size={16} /> : stats.attendance.change < 0 ? <ArrowDown size={16} /> : <Minus size={16} />}
                {Math.abs(stats.attendance.change)}%
              </span>
              <span className="text-gray-500">vs last period</span>
            </div>
          </div>

          {/* Active Programs */}
          <div className="bg-white rounded-lg shadow p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <Activity size={20} className="text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Active Programs</p>
                <p className="text-2xl font-bold">{stats.programs.total}</p>
              </div>
            </div>
            <div className="text-sm text-gray-600">
              {stats.athletes.total} total athletes enrolled
            </div>
          </div>

          {/* Active Coaches */}
          <div className="bg-white rounded-lg shadow p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Users size={20} className="text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Active Coaches</p>
                <p className="text-2xl font-bold">{stats.coaches.total}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-600">
                Avg {stats.coaches.avgSessionsPerCoach} sessions/coach
              </span>
            </div>
          </div>
        </div>

        {/* Alerts Banner */}
        {alerts.length > 0 && (
  <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4 mb-6 border-l-4 border-orange-600 w-full overflow-hidden">
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

        {/* Payment Methods & Program Enrollment */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-6 md:mb-8">
          {/* Payment Methods Breakdown */}
          <div className="bg-white rounded-lg shadow p-4 sm:p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Payment Methods</h2>
                <p className="text-sm text-gray-600">Fee payment breakdown</p>
              </div>
            </div>

            {paymentMethods.length > 0 ? (
              <div className="space-y-4">
                {paymentMethods.map((method, index) => {
                  const colors = ['#22c55e', '#3b82f6', '#f59e0b', '#8B5CF6'];
                  const color = colors[index % colors.length];
                  
                  return (
                    <div key={`payment-${method.method}-${index}`}>
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
                          <span className="text-xs text-gray-500 ml-2">({method.transaction_count} payments)</span>
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

          {/* Program Enrollment Breakdown */}
          <div className="bg-white rounded-lg shadow p-4 sm:p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Program Enrollment</h2>
                <p className="text-sm text-gray-600">Athletes by program</p>
              </div>
            </div>

            {programEnrollments.length > 0 ? (
              <div className="space-y-4">
                {programEnrollments.map((channel, index) => {
                  const colors = ['#ea580c', '#f97316', '#fb923c', '#fdba74'];
                  const color = colors[index % colors.length];
                  
                  return (
                    <div key={`program-${channel.program}-${index}`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: color }}
                          />
                          <span className="text-sm font-medium text-gray-900">{channel.program || channel.channel}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-semibold text-gray-900">
                            {channel.enrolled || 0} athletes
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
              <p className="text-sm text-gray-500 text-center py-8">No enrollment data available</p>
            )}
          </div>
        </div>

        {/* Top Athletes */}
        <div className="bg-white rounded-lg shadow p-4 sm:p-6 mb-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Top Performing Athletes</h2>
              <p className="text-sm text-gray-600">Highest attendance rates</p>
            </div>
          </div>

          {topAthletes.length > 0 ? (
          <div className="overflow-x-auto -mx-2 sm:-mx-6 w-full">
          <div className="inline-block min-w-full align-middle px-2 sm:px-6">
            <table className="w-full min-w-[400px]">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 px-4">#</th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 px-4">Athlete</th>
                    <th className="text-center text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 px-4">Age Group</th>
                    <th className="text-center text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 px-4">Program</th>
                    <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 px-4">Attendance Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {topAthletes.map((athlete, index) => (
                    <tr key={athlete.athlete_id || athlete.id} className="hover:bg-gray-50 bg-white">
                      <td className="py-4 px-4">
                        <div className="flex items-center justify-center w-8 h-8 bg-orange-100 rounded-full text-sm font-semibold text-orange-600">
                          {index + 1}
                        </div>
                      </td>
                      <td className="py-4">
                        <p className="text-sm font-medium text-gray-900">{athlete.athlete_name || athlete.name}</p>
                      </td>
                      <td className="py-4 text-center">
                        <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                          {athlete.age_group || 'N/A'}
                        </span>
                      </td>
                      <td className="py-4 text-center">
                        <span className="text-xs text-gray-600">{athlete.program || 'N/A'}</span>
                      </td>
                      <td className="py-4 text-right">
                        <p className="text-sm font-semibold text-gray-900">{athlete.attendance_rate || 0}%</p>
                        <p className="text-xs text-gray-500">{athlete.sessions_attended || 0} sessions</p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500 text-center py-8">No athlete data available</p>
          )}
        </div>

        {/* Recent Sessions */}
        <div className="bg-white rounded-lg shadow p-4 sm:p-6 mb-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Recent Training Sessions</h2>
              <p className="text-sm text-gray-600">Latest session records</p>
            </div>
            <button className="text-orange-600 text-sm font-medium hover:underline flex items-center gap-1">
              View All <ChevronRight size={16} />
            </button>
          </div>

          {recentSessions.length > 0 ? (
          <div className="overflow-x-auto -mx-2 sm:-mx-6 w-full">
            <div className="inline-block min-w-full align-middle px-2 sm:px-6">
              <table className="w-full min-w-[550px]">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 px-4">Session ID</th>
                      <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 px-4">Coach</th>
                      <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 px-4">Program</th>
                      <th className="text-center text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 px-4">Age Group</th>
                      <th className="text-center text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 px-4">Attendance</th>
                      <th className="text-center text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {recentSessions.map((session) => (
                      <tr key={session.id} className="hover:bg-gray-50 bg-white">
                        <td className="py-4 px-4">
                          <p className="text-sm font-medium text-gray-900">{session.session_reference || session.transaction_reference}</p>
                          <p className="text-xs text-gray-500">{new Date(session.session_date || session.payment_collected_at).toLocaleString()}</p>
                        </td>
                        <td className="py-4">
                          <p className="text-sm text-gray-900">{session.coach?.name || session.seller?.shop_name || 'N/A'}</p>
                        </td>
                        <td className="py-4">
                          <p className="text-sm text-gray-900">{session.program || 'N/A'}</p>
                        </td>
                        <td className="py-4 text-center">
                          <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                            {session.age_group || 'N/A'}
                          </span>
                        </td>
                        <td className="py-4 text-center">
                          <p className="text-sm font-semibold text-gray-900">{session.attendance_count || 0}/{session.total_enrolled || 0}</p>
                          <p className="text-xs text-gray-500">{session.attendance_rate || 0}%</p>
                        </td>
                        <td className="py-4">
                          <div className="flex justify-center">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                              session.status === 'completed' ? 'bg-green-100 text-green-800' : 
                              session.status === 'scheduled' ? 'bg-blue-100 text-blue-800' : 
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {session.status}
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500 text-center py-8">No recent sessions</p>
          )}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
         {/* Attendance Overview Chart */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow p-6 overflow-hidden">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Attendance Overview</h2>
                <p className="text-sm text-gray-600">Daily attendance and session trends</p>
              </div>
              <button className="p-2 hover:bg-gray-100 rounded-lg">
                <MoreVertical size={20} className="text-gray-500" />
              </button>
            </div>
            
            <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={attendanceData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
              <defs>
                <linearGradient id="colorAttendance" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ea580c" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#ea580c" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" stroke="#9CA3AF" fontSize={10} tick={{ fontSize: 10 }} />
              <YAxis stroke="#9CA3AF" fontSize={10} tick={{ fontSize: 10 }} width={35} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                  formatter={(value, name) => {
                    if (name === 'attendance') return [value, 'Attendees'];
                    if (name === 'attendance_rate') return [value + '%', 'Rate'];
                    return [value, name];
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="attendance" 
                  stroke="#ea580c" 
                  fillOpacity={1} 
                  fill="url(#colorAttendance)" 
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Attendance Status Distribution */}
          <div className="bg-white rounded-lg shadow p-4 sm:p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Attendance Status</h2>
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
                  <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
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
                        const color = entry.color || STATUS_COLORS[entry.status] || STATUS_COLORS[entry.status?.toLowerCase()] || '#6B7280';
                        console.log(`🎨 Rendering Cell ${index}:`, entry.status, 'Using Color:', color);
                        return (
                          <Cell 
                            key={`attendance-status-${entry.status}-${index}`} 
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
                    <div key={`status-${item.status}-${index}`} className="flex items-center justify-between text-sm">
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

        {/* Program Performance & Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Program Performance */}
          <div className="bg-white rounded-lg shadow p-4 sm:p-6 overflow-hidden">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Program Performance</h2>
                <p className="text-sm text-gray-600">Enrollment by program type</p>
              </div>
              <button className="text-orange-600 text-sm font-medium hover:underline">
                View All
              </button>
            </div>

            <ResponsiveContainer width="100%" height={300}>
            <BarChart data={programPerformance} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" stroke="#9CA3AF" fontSize={10} tick={{ fontSize: 10 }} angle={-45} textAnchor="end" height={80} />
              <YAxis stroke="#9CA3AF" fontSize={10} tick={{ fontSize: 10 }} width={35} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                  formatter={(value, name) => {
                    if (name === 'enrolled') return [value, 'Athletes'];
                    if (name === 'attendance_rate') return [value + '%', 'Attendance'];
                    return [value, name];
                  }}
                />
                <Bar dataKey="enrolled" radius={[8, 8, 0, 0]}>
                  {programPerformance.map((entry, index) => (
                    <Cell key={`program-bar-${entry.name}-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-lg shadow p-4 sm:p-6">
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
                  onClick={() => console.log('TODO: Navigate to /audit-logs page')}
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

        {/* Enrollment Sources & Attendance Alerts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Enrollment Sources */}
          <div className="bg-white rounded-lg shadow p-4 sm:p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Enrollment Sources</h2>
                <p className="text-sm text-gray-600">How athletes find us</p>
              </div>
              <button className="text-orange-600 text-sm font-medium hover:underline">
                Analytics
              </button>
            </div>

            <div className="space-y-4">
              {enrollmentSources.map((source, index) => (
                <div key={`enrollment-${source.source}-${index}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: ['#3B82F6', '#22c55e', '#F59E0B', '#EF4444'][index] }}
                      />
                      <span className="text-sm font-medium text-gray-900">{source.source}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-semibold text-gray-900">
                        {source.enrollments}
                      </span>
                      <span className="text-xs text-gray-500 ml-2">({source.conversion}%)</span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="h-2 rounded-full transition-all duration-500" 
                      style={{ 
                        width: `${source.percentage}%`,
                        backgroundColor: ['#3B82F6', '#22c55e', '#F59E0B', '#EF4444'][index]
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-6 border-t">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Total Inquiries</span>
                <span className="text-lg font-bold text-gray-900">
                  {enrollmentSources.reduce((sum, item) => sum + item.inquiries, 0)}
                </span>
              </div>
            </div>
          </div>

          {/* Attendance Alerts */}
          <div className="bg-white rounded-lg shadow p-4 sm:p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Attendance Alerts</h2>
                <p className="text-sm text-gray-600">Athletes needing attention</p>
              </div>
              <span className="flex items-center justify-center w-6 h-6 bg-red-100 text-red-600 rounded-full text-xs font-bold">
                {alerts.filter(a => a.type === 'warning' || a.type === 'error').length}
              </span>
            </div>

            {alerts.length > 0 ? (
              <div className="space-y-4">
                {alerts.slice(0, 4).map((alert) => {
                  const alertColors = {
                    warning: { bg: 'bg-yellow-50', border: 'border-yellow-100', iconBg: 'bg-yellow-200', iconColor: 'text-yellow-600' },
                    error: { bg: 'bg-red-50', border: 'border-red-100', iconBg: 'bg-red-200', iconColor: 'text-red-600' },
                    info: { bg: 'bg-blue-50', border: 'border-blue-100', iconBg: 'bg-blue-200', iconColor: 'text-blue-600' },
                  };
                  const colors = alertColors[alert.type] || alertColors.info;
                  
                  return (
                    <div key={alert.id} className={`flex items-center gap-4 p-3 ${colors.bg} border ${colors.border} rounded-lg`}>
                      <div className={`flex-shrink-0 w-10 h-10 ${colors.iconBg} rounded-full flex items-center justify-center`}>
                        <AlertTriangle size={20} className={colors.iconColor} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">{alert.message}</p>
                        <p className="text-xs text-gray-600">{alert.time}</p>
                      </div>
                      <button className="text-xs text-orange-600 font-medium hover:underline">
                        {alert.action}
                      </button>
                    </div>
                  );
                })}

                <button className="w-full py-2 text-sm text-orange-600 font-medium hover:bg-orange-50 rounded-lg transition-colors border border-orange-200">
                  View All Alerts
                </button>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CheckCircle size={32} className="text-green-600" />
                </div>
                <p className="text-sm font-medium text-gray-900">All Clear!</p>
                <p className="text-xs text-gray-600 mt-1">No attendance alerts at the moment</p>
              </div>
            )}
          </div>
        </div>

        {/* Main Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 mb-4 md:mb-6">
          {/* Revenue & Orders Chart */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-sm p-6 border border-gray-100 overflow-hidden">
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
              <AreaChart data={attendanceData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
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
                <XAxis dataKey="date" stroke="#999" fontSize={10} tick={{ fontSize: 10 }} />
                <YAxis stroke="#999" fontSize={10} tick={{ fontSize: 10 }} width={35} />
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
                <p className="text-sm text-gray-600 mb-1">Total Sessions</p>
                <p className="text-xl font-bold text-gray-900">
                  {attendanceData.reduce((sum, d) => sum + d.sessions, 0)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Attendance</p>
                <p className="text-xl font-bold text-gray-900">
                  {attendanceData.reduce((sum, d) => sum + d.attendance, 0)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Avg Attendance Rate</p>
                <p className="text-xl font-bold text-gray-900">
                  {(attendanceData.reduce((sum, d) => sum + d.attendance_rate, 0) / attendanceData.length).toFixed(1)}%
                </p>
              </div>
            </div>
          </div>

          {/* Program Performance */}
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Program Performance</h3>
            <ResponsiveContainer width="100%" height={220}>
              <RechartsPie margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                <Pie
                  data={programPerformance}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="percentage"
                >
                  {programPerformance.map((entry, index) => (
                    <Cell key={`program-pie-${entry.name}-${index}`} fill={entry.color} />
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
              {programPerformance.map((prog, idx) => (
                <div key={`program-legend-${prog.name}-${idx}`} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 flex-1">
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: prog.color }}></div>
                    <span className="text-gray-700 font-medium">{prog.name}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">{prog.enrolled} athletes</p>
                    <p className="text-xs text-gray-500">{prog.attendance_rate}% attendance</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Session Time Performance & Performance Radar */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Session Time Performance */}
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100 overflow-hidden">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Session Time Performance</h3>
            <p className="text-sm text-gray-600 mb-6">Attendance by time of day</p>
            <ResponsiveContainer width="100%" height={240}>
            <BarChart data={sessionTimeData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="time" stroke="#999" fontSize={10} tick={{ fontSize: 10 }} angle={-45} textAnchor="end" height={60} />
              <YAxis stroke="#999" fontSize={10} tick={{ fontSize: 10 }} width={35} />
                <Tooltip
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '1px solid #e5e7eb', 
                    borderRadius: '8px' 
                  }}
                  formatter={(value, name) => {
                    if (name === 'sessions') return [value, 'Sessions'];
                    return [value, 'Attendees'];
                  }}
                />
                <Legend />
                <Bar dataKey="sessions" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                <Bar dataKey="attendance" fill="#ea580c" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Performance Radar */}
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100 overflow-hidden">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Academy Performance Metrics</h3>
            <p className="text-sm text-gray-600 mb-6">Overall rating across key areas</p>
            <ResponsiveContainer width="100%" height={240}>
            <RadarChart data={performanceMetrics} margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
              <PolarGrid stroke="#e5e7eb" />
              <PolarAngleAxis dataKey="metric" stroke="#999" tick={{ fontSize: 9 }} />
              <PolarRadiusAxis angle={90} domain={[0, 100]} stroke="#999" tick={{ fontSize: 9 }} />
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
                <div key={`revenue-method-${method.name}-${idx}`}>
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

          {/* Athlete Segments */}
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Athlete Segments</h3>
            <div className="space-y-4">
              {athleteSegments.map((segment, idx) => (
                <div key={`athlete-segment-${segment.segment}-${idx}`} className="p-4 bg-gray-50 rounded-lg">
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
                        <p className="text-xs text-gray-500">Avg: KSh {segment.avgPayment.toLocaleString()}</p>
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
                        width: `${(segment.revenue / athleteSegments.reduce((sum, s) => sum + s.revenue, 0)) * 100}%`,
                        backgroundColor: segment.color 
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Enrollment Sources */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6 border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Enrollment Sources</h3>
                <p className="text-sm text-gray-600">How athletes find us</p>
              </div>
              <button className="text-orange-600 hover:text-orange-700 text-sm font-medium flex items-center gap-1">
                View Details <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <div className="grid md:grid-cols-4 gap-4">
              {enrollmentSources.map((source, idx) => (
              <div key={`enrollment-source-${source.source}-${idx}`} className="p-4 border border-gray-200 rounded-lg hover:border-orange-300 transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900">{source.source}</h4>
                  <span className="text-xs font-medium text-gray-600">{source.percentage}%</span>
                </div>
                <p className="text-2xl font-bold text-gray-900 mb-2">{source.enrollments} enrollments</p>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">{source.inquiries} inquiries</span>
                  <span className="text-green-600 font-medium">{source.conversion}% conv.</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5 mt-3 overflow-hidden">
                  <div
                    className="h-1.5 rounded-full bg-orange-600 transition-all duration-500"
                    style={{ width: `${Math.min(source.conversion, 100)}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Products & Recent Orders */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Top Athletes */}
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Top Performing Athletes</h3>
              <button className="text-orange-600 hover:text-orange-700 text-sm font-medium flex items-center gap-1">
                View All <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3">
              {topAthletes.map((athlete, idx) => (
                <div key={athlete.id} className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors border border-gray-100">
                  <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-orange-600 to-orange-500 text-white rounded-lg font-bold text-sm shadow-sm">
                    #{idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{athlete.name}</p>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      <span className="text-xs text-gray-600">{athlete.age} years</span>
                      <span className="text-xs text-gray-600">{athlete.age_group}</span>
                      <span className="text-xs text-gray-600">{athlete.program}</span>
                      <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full">{athlete.skill_level}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">
                      {athlete.attendance_rate}%
                    </p>
                    <div className={`flex items-center gap-1 text-xs ${
                      athlete.trend === 'up' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {athlete.trend === 'up' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {athlete.trend === 'up' ? '+' : '-'}{athlete.trendValue}%
                    </div>
                    <div className="flex items-center gap-1 mt-1">
                      <Activity className="w-3 h-3 text-orange-500" />
                      <span className="text-xs text-gray-600">{athlete.sessions_attended} sessions</span>
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
            {upcomingTasks.map((task, taskIndex) => {
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
                <div key={`task-${task.id}-${taskIndex}`} className={`p-4 border-l-4 rounded-lg ${priorityColors[task.priority]}`}>
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
        <div className="bg-white rounded-lg shadow p-4 sm:p-6 mb-10">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3 md:gap-4">
            <button className="flex flex-col items-center gap-2 p-4 rounded-lg hover:bg-gray-50 transition-colors group">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                <UserPlus size={24} className="text-blue-600" />
              </div>
              <span className="text-xs sm:text-sm font-medium text-gray-700">Add Athlete</span>
            </button>

            <button className="flex flex-col items-center gap-2 p-4 rounded-lg hover:bg-gray-50 transition-colors group">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors">
                <Activity size={24} className="text-green-600" />
              </div>
              <span className="text-sm font-medium text-gray-700">New Session</span>
            </button>

            <button className="flex flex-col items-center gap-2 p-4 rounded-lg hover:bg-gray-50 transition-colors group">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                <Users size={24} className="text-purple-600" />
              </div>
              <span className="text-sm font-medium text-gray-700">Add Parent</span>
            </button>

            <button className="flex flex-col items-center gap-2 p-4 rounded-lg hover:bg-gray-50 transition-colors group">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center group-hover:bg-orange-200 transition-colors">
                <Calendar size={24} className="text-orange-600" />
              </div>
              <span className="text-sm font-medium text-gray-700">Add Event</span>
            </button>

            <button className="flex flex-col items-center gap-2 p-4 rounded-lg hover:bg-gray-50 transition-colors group">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center group-hover:bg-red-200 transition-colors">
                <UserCheck size={24} className="text-red-600" />
              </div>
              <span className="text-sm font-medium text-gray-700">Add Coach</span>
            </button>

            <button className="flex flex-col items-center gap-2 p-4 rounded-lg hover:bg-gray-50 transition-colors group">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center group-hover:bg-indigo-200 transition-colors">
                <Download size={24} className="text-indigo-600" />
              </div>
              <span className="text-sm font-medium text-gray-700">Export Report</span>
            </button>

            <button 
            onClick={() => console.log('TODO: Navigate to /payments page')}
            className="flex flex-col items-center gap-2 p-4 rounded-lg hover:bg-gray-50 transition-colors group"
          >
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center group-hover:bg-yellow-200 transition-colors">
              <DollarSign size={24} className="text-yellow-600" />
            </div>
            <span className="text-sm font-medium text-gray-700">Manage Payments</span>
          </button>
          </div>
        </div>

        {/* Additional Quick Actions Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          <button className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-all text-left border border-gray-100 hover:border-orange-300 group">
            <UserPlus className="w-8 h-8 text-orange-600 mb-3 group-hover:scale-110 transition-transform" />
            <h4 className="font-semibold text-gray-900 mb-1">Add Athlete</h4>
            <p className="text-sm text-gray-600">Register new athlete</p>
          </button>
          
          <button className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-all text-left border border-gray-100 hover:border-blue-300 group">
            <Activity className="w-8 h-8 text-blue-600 mb-3 group-hover:scale-110 transition-transform" />
            <h4 className="font-semibold text-gray-900 mb-1">Manage Sessions</h4>
            <p className="text-sm text-gray-600">{stats.sessions.scheduled} scheduled today</p>
          </button>
          
          <button className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-all text-left border border-gray-100 hover:border-purple-300 group">
            <MessageSquare className="w-8 h-8 text-purple-600 mb-3 group-hover:scale-110 transition-transform" />
            <h4 className="font-semibold text-gray-900 mb-1">Messages</h4>
            <p className="text-sm text-gray-600">5 unread messages</p>
          </button>
          
          <button className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-all text-left border border-gray-100 hover:border-gray-300 group">
            <Settings className="w-8 h-8 text-gray-600 mb-3 group-hover:scale-110 transition-transform" />
            <h4 className="font-semibold text-gray-900 mb-1">Academy Settings</h4>
            <p className="text-sm text-gray-600">Manage your academy</p>
          </button>
        </div>
      </div>

        {/* Bottom Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-4 border border-gray-200">
            <div className="flex items-center gap-3">
              <Eye size={20} className="text-gray-600" />
              <div>
                <p className="text-xs text-gray-600">Session Views</p>
                <p className="text-lg font-bold text-gray-900">{stats.sessions.total}</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-4 border border-gray-200">
            <div className="flex items-center gap-3">
              <Activity size={20} className="text-gray-600" />
              <div>
                <p className="text-xs text-gray-600">Session Cancel Rate</p>
                <p className="text-lg font-bold text-gray-900">{((stats.sessions.cancelled / stats.sessions.total) * 100).toFixed(1)}%</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-4 border border-gray-200">
            <div className="flex items-center gap-3">
              <Clock size={20} className="text-gray-600" />
              <div>
                <p className="text-xs text-gray-600">Avg. Session Duration</p>
                <p className="text-lg font-bold text-gray-900">2h 00m</p>
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

export default AdminDashboardPage;