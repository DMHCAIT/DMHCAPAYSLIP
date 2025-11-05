import { useState, useEffect } from 'react';
import { 
  Users, 
  UserCheck, 
  Clock, 
  DollarSign, 
  TrendingUp, 
  AlertCircle,
  CalendarDays,
  Award
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface DashboardStats {
  totalEmployees: number;
  presentToday: number;
  absentToday: number;
  lateArrivals: number;
  totalSalary: number;
  pendingPayslips: number;
}

interface RecentActivity {
  id: string;
  type: 'attendance' | 'employee' | 'payroll';
  message: string;
  timestamp: string;
  status: 'success' | 'warning' | 'error';
}

export function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalEmployees: 0,
    presentToday: 0,
    absentToday: 0,
    lateArrivals: 0,
    totalSalary: 0,
    pendingPayslips: 0
  });
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    
    try {
      // Load employee stats
      const { data: employees, error: empError } = await supabase
        .from('employees')
        .select('*')
        .eq('is_active', true);

      if (!empError && employees) {
        const totalEmployees = employees.length;
        const totalSalary = employees.reduce((sum: number, emp: any) => sum + (emp.basic_salary || 0), 0);
        
        setStats(prev => ({
          ...prev,
          totalEmployees,
          totalSalary,
          presentToday: Math.floor(totalEmployees * 0.85), // Mock data
          absentToday: Math.floor(totalEmployees * 0.15),
          lateArrivals: Math.floor(totalEmployees * 0.1),
          pendingPayslips: Math.floor(totalEmployees * 0.2)
        }));
      }

      // Mock recent activities
      setRecentActivities([
        {
          id: '1',
          type: 'attendance',
          message: 'Attendance imported for October 2025',
          timestamp: new Date().toISOString(),
          status: 'success'
        },
        {
          id: '2',
          type: 'employee',
          message: 'New employee added: John Doe',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          status: 'success'
        },
        {
          id: '3',
          type: 'payroll',
          message: 'Monthly payroll processing pending',
          timestamp: new Date(Date.now() - 7200000).toISOString(),
          status: 'warning'
        }
      ]);

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: 'short'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Welcome back! Here's what's happening with your team today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Users className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Employees</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalEmployees}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <UserCheck className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Present Today</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.presentToday}</p>
              <p className="text-xs text-green-600">
                {((stats.presentToday / stats.totalEmployees) * 100).toFixed(1)}% attendance
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Clock className="h-8 w-8 text-amber-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Late Arrivals</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.lateArrivals}</p>
              <p className="text-xs text-amber-600">This week</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <DollarSign className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Salary</p>
              <p className="text-2xl font-semibold text-gray-900">
                {formatCurrency(stats.totalSalary)}
              </p>
              <p className="text-xs text-purple-600">Monthly</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 gap-4">
              <button className="flex items-center p-4 rounded-lg border-2 border-dashed border-gray-300 hover:border-blue-500 hover:bg-blue-50 transition-colors">
                <CalendarDays className="h-8 w-8 text-blue-600 mr-3" />
                <div className="text-left">
                  <p className="font-medium text-gray-900">Mark Attendance</p>
                  <p className="text-xs text-gray-500">Today's attendance</p>
                </div>
              </button>
              
              <button className="flex items-center p-4 rounded-lg border-2 border-dashed border-gray-300 hover:border-green-500 hover:bg-green-50 transition-colors">
                <Award className="h-8 w-8 text-green-600 mr-3" />
                <div className="text-left">
                  <p className="font-medium text-gray-900">Generate Payslips</p>
                  <p className="text-xs text-gray-500">Monthly payroll</p>
                </div>
              </button>
              
              <button className="flex items-center p-4 rounded-lg border-2 border-dashed border-gray-300 hover:border-purple-500 hover:bg-purple-50 transition-colors">
                <Users className="h-8 w-8 text-purple-600 mr-3" />
                <div className="text-left">
                  <p className="font-medium text-gray-900">Add Employee</p>
                  <p className="text-xs text-gray-500">New team member</p>
                </div>
              </button>
              
              <button className="flex items-center p-4 rounded-lg border-2 border-dashed border-gray-300 hover:border-orange-500 hover:bg-orange-50 transition-colors">
                <TrendingUp className="h-8 w-8 text-orange-600 mr-3" />
                <div className="text-left">
                  <p className="font-medium text-gray-900">View Reports</p>
                  <p className="text-xs text-gray-500">Analytics & insights</p>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3">
                  <div className={`flex-shrink-0 w-2 h-2 rounded-full mt-2 ${
                    activity.status === 'success' ? 'bg-green-500' : 
                    activity.status === 'warning' ? 'bg-amber-500' : 'bg-red-500'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{activity.message}</p>
                    <p className="text-xs text-gray-500">{formatTime(activity.timestamp)}</p>
                  </div>
                  {activity.status === 'warning' && (
                    <AlertCircle className="h-4 w-4 text-amber-500" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Attendance Overview */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Attendance Overview</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{stats.presentToday}</div>
              <div className="text-sm text-gray-600">Present</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-red-600">{stats.absentToday}</div>
              <div className="text-sm text-gray-600">Absent</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-amber-600">{stats.lateArrivals}</div>
              <div className="text-sm text-gray-600">Late</div>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-6">
            <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
              <span>Attendance Rate</span>
              <span>{((stats.presentToday / stats.totalEmployees) * 100).toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-600 h-2 rounded-full" 
                style={{ width: `${(stats.presentToday / stats.totalEmployees) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}