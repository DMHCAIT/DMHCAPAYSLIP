import React, { useState, useEffect } from 'react';
import { 
  Users, 
  User, 
  BarChart3, 
  Upload, 
  Search,
  CheckCircle,
  XCircle,
  Calendar as CalendarIcon
} from 'lucide-react';
import { supabase, Employee } from '../lib/supabase';

interface AttendanceRecord {
  id: string;
  employee_id: string;
  attendance_date: string;
  status: 'present' | 'absent' | 'half_day' | 'late' | 'week_off' | 'holiday';
  in_time?: string;
  out_time?: string;
  total_hours?: number;
  marked_at?: string;
  marked_by?: string;
  notes?: string;
}

interface AttendanceManagementProps {
  employees: Employee[];
}

const AttendanceManagement: React.FC<AttendanceManagementProps> = ({ employees }) => {
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [viewMode, setViewMode] = useState<'today' | 'monthly'>('today');

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Test database connection and load initial data
    const initializeAttendance = async () => {
      console.log('🔄 Initializing Attendance Management...');
      
      // Test employees table connection
      try {
        const { error: empError } = await supabase
          .from('employees')
          .select('count(*)')
          .limit(1);
          
        if (empError) {
          console.error('❌ Cannot connect to employees table:', empError);
        } else {
          console.log('✅ Employees table connection successful');
        }
      } catch (error) {
        console.error('❌ Database connection error:', error);
      }
      
      // Test attendance table connection
      try {
        const { error: attError } = await supabase
          .from('attendance')
          .select('count(*)')
          .limit(1);
          
        if (attError) {
          console.error('❌ Cannot connect to attendance table:', attError);
        } else {
          console.log('✅ Attendance table connection successful');
        }
      } catch (error) {
        console.error('❌ Attendance table connection error:', error);
      }
      
      // Load today's attendance
      loadTodayAttendance();
    };
    
    initializeAttendance();
  }, []);

  const loadTodayAttendance = async () => {
    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('attendance')
        .select(`
          *,
          employees!inner(
            id,
            employee_name,
            emp_code,
            branch
          )
        `)
        .eq('attendance_date', today);

      if (error) {
        console.error('❌ Database error loading today\'s attendance:', error);
        setAttendanceRecords([]);
      } else {
        console.log(`✅ Loaded ${data?.length || 0} attendance records for today`);
        setAttendanceRecords(data || []);
      }
    } catch (error) {
      console.error('❌ Error loading today\'s attendance:', error);
      setAttendanceRecords([]);
    } finally {
      setLoading(false);
    }
  };

  const loadMonthlyData = async (month: Date) => {
    setLoading(true);
    try {
      const startOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);
      const endOfMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0);

      const { data, error } = await supabase
        .from('attendance')
        .select(`
          *,
          employees!inner(
            id,
            employee_name,
            emp_code,
            branch
          )
        `)
        .gte('attendance_date', startOfMonth.toISOString().split('T')[0])
        .lte('attendance_date', endOfMonth.toISOString().split('T')[0]);

      if (error) {
        console.error('❌ Database error loading monthly attendance:', error);
        setAttendanceRecords([]);
      } else {
        const monthName = month.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        console.log(`✅ Loaded ${data?.length || 0} attendance records for ${monthName}`);
        setAttendanceRecords(data || []);
      }
    } catch (error) {
      console.error('❌ Error loading monthly attendance:', error);
      setAttendanceRecords([]);
    } finally {
      setLoading(false);
    }
  };

  const handleMonthChange = (month: Date) => {
    setSelectedMonth(month);
    if (viewMode === 'monthly') {
      loadMonthlyData(month);
    }
  };

  const handleViewModeChange = (mode: 'today' | 'monthly') => {
    setViewMode(mode);
    if (mode === 'today') {
      loadTodayAttendance();
    } else {
      loadMonthlyData(selectedMonth);
    }
  };

  const loadMonthlyAttendance = async (employee: Employee, month: Date) => {
    setLoading(true);
    try {
      const startOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);
      const endOfMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0);

      const { data, error } = await supabase
        .from('attendance')
        .select(`
          *,
          employees!inner(
            id,
            employee_name,
            emp_code,
            branch
          )
        `)
        .eq('employee_id', employee.id)
        .gte('attendance_date', startOfMonth.toISOString().split('T')[0])
        .lte('attendance_date', endOfMonth.toISOString().split('T')[0])
        .order('attendance_date', { ascending: true });

      if (error) {
        console.error('❌ Database error loading monthly attendance:', error);
        setAttendanceRecords([]);
      } else {
        const monthName = month.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        console.log(`✅ Loaded ${data?.length || 0} attendance records for ${employee.employee_name} in ${monthName}`);
        setAttendanceRecords(data || []);
      }
    } catch (error) {
      console.error('❌ Error loading monthly attendance:', error);
      setAttendanceRecords([]);
    } finally {
      setLoading(false);
    }
  };

  const markAttendance = async (employeeId: string, date: Date, status: 'present' | 'absent' | 'half_day' | 'late' | 'week_off' | 'holiday') => {
    try {
      const dateStr = date.toISOString().split('T')[0];
      const currentTime = new Date();
      
      // Calculate appropriate times and hours based on status
      let inTime = null;
      let outTime = null;
      let totalHours = null;
      
      if (status === 'present') {
        inTime = '09:00:00';
        outTime = '18:00:00';
        totalHours = 8.0;
      } else if (status === 'half_day') {
        inTime = '09:00:00';
        outTime = '13:00:00';
        totalHours = 4.0;
      } else if (status === 'late') {
        inTime = '10:00:00'; // Late arrival
        outTime = '18:00:00';
        totalHours = 7.0;
      }
      
      const { error } = await supabase
        .from('attendance')
        .upsert({
          employee_id: employeeId,
          attendance_date: dateStr,
          status,
          in_time: inTime,
          out_time: outTime,
          total_hours: totalHours,
          marked_at: currentTime.toISOString(),
          marked_by: 'Admin User'
        });

      if (!error) {
        console.log(`✅ Attendance marked: ${status} for employee ${employeeId} on ${dateStr}`);
        // Reload attendance data
        if (selectedEmployee) {
          loadMonthlyAttendance(selectedEmployee, currentMonth);
        } else {
          loadTodayAttendance();
        }
      } else {
        console.error('❌ Error marking attendance:', error);
      }
    } catch (error) {
      console.error('❌ Error marking attendance:', error);
    }
  };

  const handleEmployeeSelect = (employee: Employee) => {
    setSelectedEmployee(employee);
    setShowCalendar(true);
    loadMonthlyAttendance(employee, currentMonth);
  };

  const handleCloseCalendar = () => {
    setShowCalendar(false);
    setSelectedEmployee(null);
    loadTodayAttendance();
  };

  const filteredEmployees = employees.filter(emp =>
    emp.employee_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.emp_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.branch.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getAttendanceStatus = (employeeId: string, date: string) => {
    const record = attendanceRecords.find(r => r.employee_id === employeeId && r.attendance_date === date);
    return record?.status || 'absent';
  };

  const getTodayAttendance = (employeeId: string) => {
    const today = new Date().toISOString().split('T')[0];
    return getAttendanceStatus(employeeId, today);
  };

  const renderCalendar = () => {
    if (!selectedEmployee) return null;

    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(<div key={`empty-${i}`} className="h-10"></div>);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateStr = date.toISOString().split('T')[0];
      const status = getAttendanceStatus(selectedEmployee.id, dateStr);
      const isToday = dateStr === new Date().toISOString().split('T')[0];

      days.push(
        <div
          key={day}
          className={`h-10 flex items-center justify-center cursor-pointer rounded-lg text-sm font-medium transition-all duration-200 relative group hover:scale-105 hover:shadow-sm ${
            isToday ? 'bg-blue-100 text-blue-800 border-2 border-blue-300 animate-pulse' : ''
          } ${
            status === 'present' ? 'bg-green-100 text-green-800 hover:bg-green-200 hover:shadow-green-200' :
            status === 'absent' ? 'bg-red-100 text-red-800 hover:bg-red-200 hover:shadow-red-200' :
            status === 'late' ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200 hover:shadow-yellow-200' :
            status === 'half_day' ? 'bg-orange-100 text-orange-800 hover:bg-orange-200 hover:shadow-orange-200' :
            'bg-gray-50 text-gray-600 hover:bg-blue-50 hover:text-blue-700'
          }`}
          onClick={() => {
            // Cycle through attendance statuses: absent -> present -> half_day -> late -> absent
            let newStatus: 'present' | 'absent' | 'half_day' | 'late' | 'week_off' | 'holiday';
            if (status === 'absent' || !status) {
              newStatus = 'present';
            } else if (status === 'present') {
              newStatus = 'half_day';
            } else if (status === 'half_day') {
              newStatus = 'late';
            } else {
              newStatus = 'absent';
            }
            markAttendance(selectedEmployee.id, date, newStatus);
          }}
          title={`${date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
Current: ${
            status === 'present' ? '✅ Present' :
            status === 'absent' ? '❌ Absent' :
            status === 'half_day' ? '🕐 Half Day' :
            status === 'late' ? '⏰ Late' :
            '⚪ Not Marked'
          }
Click to cycle: ${
            status === 'absent' || !status ? 'Next → Present' :
            status === 'present' ? 'Next → Half Day' :
            status === 'half_day' ? 'Next → Late' :
            'Next → Absent'
          }`}
        >
          <span className="relative z-10">{day}</span>
          {/* Status indicator */}
          <div className="absolute top-0 right-0 w-2 h-2 rounded-full opacity-75">
            {status === 'present' && <div className="w-full h-full bg-green-600 rounded-full"></div>}
            {status === 'absent' && <div className="w-full h-full bg-red-600 rounded-full"></div>}
            {status === 'half_day' && <div className="w-full h-full bg-orange-600 rounded-full"></div>}
            {status === 'late' && <div className="w-full h-full bg-yellow-600 rounded-full"></div>}
          </div>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-7 gap-1">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="h-10 flex items-center justify-center text-sm font-semibold text-gray-700">
            {day}
          </div>
        ))}
        {days}
      </div>
    );
  };

  // Calculate attendance statistics based on view mode
  const calculateAttendanceStats = () => {
    if (viewMode === 'today') {
      const presentToday = employees.filter(emp => getTodayAttendance(emp.id) === 'present').length;
      const absentToday = employees.length - presentToday;
      const rateToday = employees.length > 0 ? (presentToday / employees.length * 100).toFixed(1) : '0';
      
      return {
        presentCount: presentToday,
        absentCount: absentToday,
        attendanceRate: rateToday,
        label: 'Today'
      };
    } else {
      // Monthly view - calculate based on loaded monthly data
      const uniqueEmployees = new Set(attendanceRecords.map(record => record.employee_id));
      const presentInMonth = attendanceRecords.filter(record => record.status === 'present').length;
      const totalRecords = attendanceRecords.length;
      const rateMonth = totalRecords > 0 ? (presentInMonth / totalRecords * 100).toFixed(1) : '0';
      
      return {
        presentCount: presentInMonth,
        absentCount: totalRecords - presentInMonth,
        attendanceRate: rateMonth,
        label: selectedMonth.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      };
    }
  };

  const { presentCount, absentCount, attendanceRate, label } = calculateAttendanceStats();

  if (showCalendar && selectedEmployee) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center p-6 border-b">
            <div>
              <h3 className="text-xl font-semibold text-gray-900">
                Attendance Calendar - {selectedEmployee.employee_name}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {selectedEmployee.emp_code} • {selectedEmployee.branch}
              </p>
            </div>
            <button
              onClick={handleCloseCalendar}
              className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
            >
              ×
            </button>
          </div>

          <div className="p-6">
            {/* Month Navigation */}
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded"
              >
                ← Previous
              </button>
              <h4 className="text-lg font-semibold">
                {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </h4>
              <button
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded"
              >
                Next →
              </button>
            </div>

            {/* Legend and Instructions */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg border-l-4 border-blue-500">
              <h5 className="text-sm font-semibold text-gray-900 mb-3">📖 How to Use Calendar:</h5>
              <p className="text-xs text-gray-600 mb-3">
                🖱️ <strong>Click any date</strong> to cycle through attendance status: Absent → Present → Half Day → Late → Absent
              </p>
              
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-green-100 rounded relative">
                    <div className="absolute top-0 right-0 w-2 h-2 bg-green-600 rounded-full"></div>
                  </div>
                  <span className="text-sm">✅ Present</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-red-100 rounded relative">
                    <div className="absolute top-0 right-0 w-2 h-2 bg-red-600 rounded-full"></div>
                  </div>
                  <span className="text-sm">❌ Absent</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-orange-100 rounded relative">
                    <div className="absolute top-0 right-0 w-2 h-2 bg-orange-600 rounded-full"></div>
                  </div>
                  <span className="text-sm">🕐 Half Day</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-yellow-100 rounded relative">
                    <div className="absolute top-0 right-0 w-2 h-2 bg-yellow-600 rounded-full"></div>
                  </div>
                  <span className="text-sm">⏰ Late</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-blue-100 border-2 border-blue-300 rounded"></div>
                  <span className="text-sm">📅 Today</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-gray-50 rounded border border-gray-300"></div>
                  <span className="text-sm">⚪ Not Marked</span>
                </div>
              </div>
            </div>

            {/* Calendar Grid */}
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              renderCalendar()
            )}

            {/* Quick Action Buttons */}
            <div className="mt-6 pt-6 border-t">
              <h5 className="text-sm font-semibold text-gray-900 mb-3 text-center">🚀 Quick Actions for Today:</h5>
              <div className="flex justify-center space-x-3">
                <button
                  onClick={() => markAttendance(selectedEmployee.id, new Date(), 'present')}
                  className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                >
                  <span className="mr-2">✅</span>
                  Present
                </button>
                <button
                  onClick={() => markAttendance(selectedEmployee.id, new Date(), 'half_day')}
                  className="flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm"
                >
                  <span className="mr-2">🕐</span>
                  Half Day
                </button>
                <button
                  onClick={() => markAttendance(selectedEmployee.id, new Date(), 'absent')}
                  className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                >
                  <span className="mr-2">❌</span>
                  Absent
                </button>
                <button
                  onClick={() => markAttendance(selectedEmployee.id, new Date(), 'late')}
                  className="flex items-center px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-sm"
                >
                  <span className="mr-2">⏰</span>
                  Late
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Employees</p>
              <p className="text-3xl font-bold text-gray-900">{employees.length}</p>
            </div>
            <Users className="w-12 h-12 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Present {viewMode === 'today' ? 'Today' : 'Records'}
              </p>
              <p className="text-3xl font-bold text-green-600">{presentCount}</p>
            </div>
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                {viewMode === 'today' ? 'Absent Today' : 'Other Records'}
              </p>
              <p className="text-3xl font-bold text-red-600">{absentCount}</p>
            </div>
            <XCircle className="w-12 h-12 text-red-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Attendance Rate</p>
              <p className="text-3xl font-bold text-purple-600">{attendanceRate}%</p>
            </div>
            <BarChart3 className="w-12 h-12 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Employee List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center space-x-4">
              <h3 className="text-lg font-semibold text-gray-900">Employee Attendance</h3>
              
              {/* View Mode Toggle */}
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => handleViewModeChange('today')}
                  className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                    viewMode === 'today' 
                      ? 'bg-white text-blue-600 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Today
                </button>
                <button
                  onClick={() => handleViewModeChange('monthly')}
                  className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                    viewMode === 'monthly' 
                      ? 'bg-white text-blue-600 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Monthly
                </button>
              </div>
              
              {/* Month Selector - Only show when in monthly mode */}
              {viewMode === 'monthly' && (
                <div className="flex items-center space-x-2">
                  <CalendarIcon className="w-4 h-4 text-gray-500" />
                  <input
                    type="month"
                    value={selectedMonth.toISOString().slice(0, 7)}
                    onChange={(e) => {
                      const newMonth = new Date(e.target.value + '-01');
                      handleMonthChange(newMonth);
                    }}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search employees..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
                <Upload className="w-4 h-4 inline mr-2" />
                Import Data
              </button>
            </div>
          </div>
          
          {/* Show current filter info */}
          <div className="mt-3 text-sm text-gray-600">
            {viewMode === 'today' ? (
              <span>Showing attendance for today ({new Date().toLocaleDateString()})</span>
            ) : (
              <span>Showing attendance for {selectedMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Branch</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {viewMode === 'today' ? "Today's Status" : 'Monthly Summary'}
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {viewMode === 'today' ? 'Time Info' : 'Total Days'}
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="flex justify-center items-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      <span className="ml-3 text-gray-600">Loading employees...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    {searchTerm ? 'No employees found matching your search.' : 'No employees found.'}
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((employee) => {
                  const todayStatus = getTodayAttendance(employee.id);
                  return (
                    <tr key={employee.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <User className="w-5 h-5 text-blue-600" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 capitalize">
                              {employee.employee_name}
                            </div>
                            <div className="text-sm text-gray-500">
                              ID: {employee.emp_code}
                            </div>
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 capitalize">{employee.branch}</div>
                        <div className="text-sm text-gray-500">Salary: ${employee.salary}</div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        {viewMode === 'today' ? (
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            todayStatus === 'present' ? 'bg-green-100 text-green-800' :
                            todayStatus === 'absent' ? 'bg-red-100 text-red-800' :
                            todayStatus === 'late' ? 'bg-yellow-100 text-yellow-800' :
                            todayStatus === 'half_day' ? 'bg-orange-100 text-orange-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {todayStatus === 'present' ? '✅ Present' :
                             todayStatus === 'absent' ? '❌ Absent' :
                             todayStatus === 'late' ? '⏰ Late' :
                             todayStatus === 'half_day' ? '🕐 Half Day' :
                             '⚪ Not Marked'}
                          </span>
                        ) : (
                          <div className="text-sm">
                            {(() => {
                              const employeeRecords = attendanceRecords.filter(r => r.employee_id === employee.id);
                              const present = employeeRecords.filter(r => r.status === 'present').length;
                              const absent = employeeRecords.filter(r => r.status === 'absent').length;
                              const halfDay = employeeRecords.filter(r => r.status === 'half_day').length;
                              const late = employeeRecords.filter(r => r.status === 'late').length;
                              
                              return (
                                <div className="space-y-1">
                                  {present > 0 && <div className="text-green-600">✅ {present} Present</div>}
                                  {halfDay > 0 && <div className="text-orange-600">🕐 {halfDay} Half Day</div>}
                                  {late > 0 && <div className="text-yellow-600">⏰ {late} Late</div>}
                                  {absent > 0 && <div className="text-red-600">❌ {absent} Absent</div>}
                                  {employeeRecords.length === 0 && <div className="text-gray-400">No records</div>}
                                </div>
                              );
                            })()}
                          </div>
                        )}
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="text-xs text-gray-600">
                          {viewMode === 'today' ? (() => {
                            const todayRecord = attendanceRecords.find(r => 
                              r.employee_id === employee.id && 
                              r.attendance_date === new Date().toISOString().split('T')[0]
                            );
                            if (todayRecord && todayRecord.in_time) {
                              return (
                                <>
                                  <div>In: {todayRecord.in_time}</div>
                                  {todayRecord.out_time && <div>Out: {todayRecord.out_time}</div>}
                                  {todayRecord.total_hours && <div>{todayRecord.total_hours}h</div>}
                                </>
                              );
                            }
                            return <div className="text-gray-400">—</div>;
                          })() : (() => {
                            const employeeRecords = attendanceRecords.filter(r => r.employee_id === employee.id);
                            const totalDays = employeeRecords.length;
                            const workingDays = employeeRecords.filter(r => 
                              ['present', 'half_day', 'late'].includes(r.status)
                            ).length;
                            
                            return (
                              <div>
                                <div className="font-medium">{totalDays} Total</div>
                                <div className="text-green-600">{workingDays} Working</div>
                              </div>
                            );
                          })()}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex justify-center space-x-1">
                          {viewMode === 'today' && (
                            <>
                              <button
                                onClick={() => markAttendance(employee.id, new Date(), 'present')}
                                className="text-green-600 hover:text-green-800 text-xs font-medium px-2 py-1 rounded hover:bg-green-50 transition-colors"
                                title="Mark Present"
                              >
                                ✅
                              </button>
                              <button
                                onClick={() => markAttendance(employee.id, new Date(), 'half_day')}
                                className="text-orange-600 hover:text-orange-800 text-xs font-medium px-2 py-1 rounded hover:bg-orange-50 transition-colors"
                                title="Mark Half Day"
                              >
                                🕐
                              </button>
                              <button
                                onClick={() => markAttendance(employee.id, new Date(), 'absent')}
                                className="text-red-600 hover:text-red-800 text-xs font-medium px-2 py-1 rounded hover:bg-red-50 transition-colors"
                                title="Mark Absent"
                              >
                                ❌
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => handleEmployeeSelect(employee)}
                            className="text-blue-600 hover:text-blue-800 text-xs font-medium px-2 py-1 rounded hover:bg-blue-50 transition-colors ml-1"
                            title="View Calendar"
                          >
                            <CalendarIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AttendanceManagement;