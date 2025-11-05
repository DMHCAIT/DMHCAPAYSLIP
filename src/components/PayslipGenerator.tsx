import { useState, useEffect } from 'react';
import { 
  FileText, 
  Download, 
  IndianRupee, 
  Users, 
  Calendar, 
  Calculator,
  Play,
  CheckCircle,
  Clock,
  Filter,
  Search,
  Settings,
  Eye,
  RefreshCw
} from 'lucide-react';
import { supabase, Employee, Payslip } from '../lib/supabase';
import { getPayCycleDates, countWorkingDays, calculatePayslip } from '../utils/payslipCalculations';

interface AttendanceRecord {
  id: string;
  employee_id: string;
  attendance_date: string;
  status: 'present' | 'absent' | 'half_day' | 'late' | 'week_off' | 'holiday';
  in_time?: string;
  out_time?: string;
  total_hours?: number;
}

interface PayrollProcessing {
  selectedEmployees: string[];
  payPeriod: 'monthly' | 'weekly' | 'custom';
  startDate: string;
  endDate: string;
  attendanceFilter: 'all' | 'present_only' | 'custom_threshold';
  minimumDays: number;
  includeHalfDays: boolean;
  overtimeRate: number;
  deductionRules: {
    absentDeduction: boolean;
    lateDeduction: boolean;
    halfDayDeduction: boolean;
  };
}

type PayslipGeneratorProps = {
  employees: Employee[];
};

function PayslipGenerator({ employees }: PayslipGeneratorProps) {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [generatedPayslips, setGeneratedPayslips] = useState<(Payslip & { employee: Employee })[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'selection' | 'processing' | 'results'>('selection');
  const [searchTerm, setSearchTerm] = useState('');
  const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([]);
  
  const [payrollConfig, setPayrollConfig] = useState<PayrollProcessing>({
    selectedEmployees: [],
    payPeriod: 'monthly',
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0],
    attendanceFilter: 'all',
    minimumDays: 15,
    includeHalfDays: true,
    overtimeRate: 1.5,
    deductionRules: {
      absentDeduction: true,
      lateDeduction: true,
      halfDayDeduction: true
    }
  });

  // Load attendance data for the selected period
  const loadAttendanceData = async (startDate: string, endDate: string) => {
    try {
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
        .gte('attendance_date', startDate)
        .lte('attendance_date', endDate);

      if (error) throw error;
      setAttendanceData(data || []);
    } catch (error) {
      console.error('Error loading attendance data:', error);
    }
  };

  // Handle employee selection
  const handleEmployeeSelection = (employeeId: string, selected: boolean) => {
    setPayrollConfig(prev => ({
      ...prev,
      selectedEmployees: selected
        ? [...prev.selectedEmployees, employeeId]
        : prev.selectedEmployees.filter(id => id !== employeeId)
    }));
  };

  // Select all employees
  const selectAllEmployees = (select: boolean) => {
    setPayrollConfig(prev => ({
      ...prev,
      selectedEmployees: select ? filteredEmployees.map(emp => emp.id.toString()) : []
    }));
  };

  // Update payroll configuration
  const updatePayrollConfig = (updates: Partial<PayrollProcessing>) => {
    setPayrollConfig(prev => ({ ...prev, ...updates }));
  };

  // Calculate attendance statistics for an employee
  const calculateEmployeeAttendance = (employeeId: string) => {
    const records = attendanceData.filter(r => r.employee_id === employeeId);
    const present = records.filter(r => r.status === 'present').length;
    const halfDay = records.filter(r => r.status === 'half_day').length;
    const late = records.filter(r => r.status === 'late').length;
    const absent = records.filter(r => r.status === 'absent').length;
    
    const workingDays = present + (payrollConfig.includeHalfDays ? halfDay * 0.5 : halfDay) + late;
    
    return { present, halfDay, late, absent, workingDays, totalRecords: records.length };
  };

  // Filter employees based on search term
  const filteredEmployees = employees.filter(emp =>
    emp.employee_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.emp_code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Process payroll with advanced settings
  const processPayroll = async () => {
    if (payrollConfig.selectedEmployees.length === 0) {
      alert('Please select at least one employee');
      return;
    }

    setLoading(true);
    setActiveTab('processing');

    try {
      // Load attendance data for the period
      await loadAttendanceData(payrollConfig.startDate, payrollConfig.endDate);

      const payslipsData: (Payslip & { employee: Employee })[] = [];
      const selectedEmps = employees.filter(emp => 
        payrollConfig.selectedEmployees.includes(emp.id.toString())
      );

      for (const employee of selectedEmps) {
        if (employee.salary === 0) continue;

        const attendance = calculateEmployeeAttendance(employee.id.toString());
        
        // Apply attendance filter
        if (payrollConfig.attendanceFilter === 'custom_threshold' && 
            attendance.workingDays < payrollConfig.minimumDays) {
          continue;
        }

        const totalWorkingDays = countWorkingDays(
          payrollConfig.startDate,
          payrollConfig.endDate
        );

        const calculations = calculateAdvancedPayslip(
          employee.salary,
          attendance.workingDays,
          totalWorkingDays,
          attendance,
          payrollConfig
        );

        // Check for existing payslip
        const { data: existingPayslip } = await supabase
          .from('payslips')
          .select('*')
          .eq('employee_id', employee.id)
          .eq('pay_cycle_start', payrollConfig.startDate)
          .maybeSingle();

        if (existingPayslip) {
          const { data: updatedPayslip } = await supabase
            .from('payslips')
            .update({
              present_days: attendance.present,
              absent_days: attendance.absent,
              per_day_salary: calculations.perDaySalary,
              gross_salary: calculations.grossSalary,
              deductions: calculations.deductions,
              net_salary: calculations.netSalary,
              working_days: totalWorkingDays
            })
            .eq('id', existingPayslip.id)
            .select()
            .single();

          if (updatedPayslip) {
            payslipsData.push({ ...updatedPayslip, employee });
          }
        } else {
          const { data: newPayslip } = await supabase
            .from('payslips')
            .insert({
              employee_id: employee.id,
              pay_cycle_start: payrollConfig.startDate,
              pay_cycle_end: payrollConfig.endDate,
              salary_credit_date: payrollConfig.endDate,
              present_days: attendance.present,
              absent_days: attendance.absent,
              per_day_salary: calculations.perDaySalary,
              gross_salary: calculations.grossSalary,
              deductions: calculations.deductions,
              net_salary: calculations.netSalary,
              working_days: totalWorkingDays
            })
            .select()
            .single();

          if (newPayslip) {
            payslipsData.push({ ...newPayslip, employee });
          }
        }
      }

      setGeneratedPayslips(payslipsData);
      setActiveTab('results');

    } catch (error) {
      console.error('Error processing payroll:', error);
      alert('Error processing payroll. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Advanced payslip calculation
  const calculateAdvancedPayslip = (
    monthlySalary: number,
    workingDays: number,
    totalWorkingDays: number,
    attendance: any,
    config: PayrollProcessing
  ) => {
    const perDaySalary = monthlySalary / totalWorkingDays;
    let grossSalary = perDaySalary * workingDays;
    let deductions = 0;

    // Apply deduction rules
    if (config.deductionRules.absentDeduction) {
      deductions += attendance.absent * perDaySalary;
    }

    if (config.deductionRules.lateDeduction) {
      deductions += attendance.late * (perDaySalary * 0.1); // 10% deduction for late
    }

    if (config.deductionRules.halfDayDeduction && !config.includeHalfDays) {
      deductions += attendance.halfDay * (perDaySalary * 0.5);
    }

    const netSalary = Math.max(0, grossSalary - deductions);

    return {
      perDaySalary: Math.round(perDaySalary),
      grossSalary: Math.round(grossSalary),
      deductions: Math.round(deductions),
      netSalary: Math.round(netSalary)
    };
  };

  useEffect(() => {
    if (payrollConfig.startDate && payrollConfig.endDate) {
      loadAttendanceData(payrollConfig.startDate, payrollConfig.endDate);
    }
  }, [payrollConfig.startDate, payrollConfig.endDate]);

  const generatePayslips = async () => {
    setLoading(true);
    const { payStart, payEnd, creditDate } = getPayCycleDates(selectedMonth, selectedYear);
    const workingDays = countWorkingDays(payStart, payEnd);

    const payslipsData: (Payslip & { employee: Employee })[] = [];

    for (const employee of employees) {
      if (employee.salary === 0) continue;

      const { data: attendanceData } = await supabase
        .from('attendance')
        .select('*')
        .eq('employee_id', employee.id)
        .gte('attendance_date', payStart)
        .lte('attendance_date', payEnd)
        .eq('status', 'present');

      const presentDays = attendanceData?.length || 0;
      const calculations = calculatePayslip(employee.salary, presentDays, workingDays);

      const { data: existingPayslip } = await supabase
        .from('payslips')
        .select('*')
        .eq('employee_id', employee.id)
        .eq('pay_cycle_start', payStart)
        .maybeSingle();

      if (existingPayslip) {
        const { data: updatedPayslip } = await supabase
          .from('payslips')
          .update({
            present_days: presentDays,
            absent_days: calculations.absentDays,
            per_day_salary: calculations.perDaySalary,
            gross_salary: calculations.grossSalary,
            deductions: calculations.deductions,
            net_salary: calculations.netSalary,
          })
          .eq('id', existingPayslip.id)
          .select()
          .single();

        if (updatedPayslip) {
          payslipsData.push({ ...updatedPayslip, employee });
        }
      } else {
        const { data: newPayslip } = await supabase
          .from('payslips')
          .insert({
            employee_id: employee.id,
            pay_cycle_start: payStart,
            pay_cycle_end: payEnd,
            credit_date: creditDate,
            base_salary: employee.salary,
            working_days: workingDays,
            present_days: presentDays,
            absent_days: calculations.absentDays,
            per_day_salary: calculations.perDaySalary,
            gross_salary: calculations.grossSalary,
            deductions: calculations.deductions,
            net_salary: calculations.netSalary,
            status: 'draft',
          })
          .select()
          .single();

        if (newPayslip) {
          payslipsData.push({ ...newPayslip, employee });
        }
      }
    }

    setGeneratedPayslips(payslipsData);
    setLoading(false);
  };

  const downloadPayslip = (payslip: Payslip & { employee: Employee }) => {
    const content = `
PAYSLIP
${payslip.employee.branch} Branch

Pay Period: ${new Date(payslip.pay_cycle_start).toLocaleDateString()} to ${new Date(payslip.pay_cycle_end).toLocaleDateString()}
Credit Date: ${new Date(payslip.credit_date).toLocaleDateString()}

Employee Details:
Employee Code: ${payslip.employee.emp_code}
Employee Name: ${payslip.employee.employee_name}
Card No: ${payslip.employee.card_no}

Salary Details:
Base Salary: ₹${payslip.base_salary.toLocaleString('en-IN')}
Working Days: ${payslip.working_days}
Present Days: ${payslip.present_days}
Absent Days: ${payslip.absent_days}
Per Day Salary: ₹${payslip.per_day_salary.toLocaleString('en-IN')}

Gross Salary: ₹${payslip.gross_salary.toLocaleString('en-IN')}
Deductions: ₹${payslip.deductions.toLocaleString('en-IN')}
Net Salary: ₹${payslip.net_salary.toLocaleString('en-IN')}

Generated on: ${new Date(payslip.generated_at).toLocaleString()}
    `;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payslip_${payslip.employee.emp_code}_${payslip.pay_cycle_start}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i);

  return (
    <div className="space-y-6">
      {/* Header with Navigation */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3 mb-6">
            <Calculator className="w-6 h-6 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Advanced Payroll Processing</h3>
          </div>

          {/* Tab Navigation */}
          <div className="flex bg-gray-100 rounded-lg p-1 mb-6">
            <button
              onClick={() => setActiveTab('selection')}
              className={`flex-1 flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'selection' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Users className="w-4 h-4 mr-2" />
              Employee Selection
            </button>
            <button
              onClick={() => setActiveTab('processing')}
              className={`flex-1 flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'processing' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Settings className="w-4 h-4 mr-2" />
              Payroll Settings
            </button>
            <button
              onClick={() => setActiveTab('results')}
              className={`flex-1 flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'results' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <FileText className="w-4 h-4 mr-2" />
              Generated Payslips
            </button>
          </div>
        </div>

        {/* Employee Selection Tab */}
        {activeTab === 'selection' && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h4 className="text-lg font-semibold text-gray-900">Select Employees for Payroll</h4>
                <p className="text-sm text-gray-600">Choose employees to include in payroll processing</p>
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
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => selectAllEmployees(true)}
                    className="px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Select All
                  </button>
                  <button
                    onClick={() => selectAllEmployees(false)}
                    className="px-3 py-2 text-sm bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                  >
                    Clear All
                  </button>
                </div>
              </div>
            </div>

            {/* Employee Selection Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredEmployees.map((employee) => {
                const isSelected = payrollConfig.selectedEmployees.includes(employee.id.toString());
                const attendance = calculateEmployeeAttendance(employee.id.toString());
                
                return (
                  <div
                    key={employee.id}
                    className={`border rounded-lg p-4 cursor-pointer transition-all ${
                      isSelected 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleEmployeeSelection(employee.id.toString(), !isSelected)}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                          isSelected 
                            ? 'border-blue-500 bg-blue-500' 
                            : 'border-gray-300'
                        }`}>
                          {isSelected && (
                            <CheckCircle className="w-3 h-3 text-white" />
                          )}
                        </div>
                        <div>
                          <h5 className="font-medium text-gray-900 capitalize">
                            {employee.employee_name}
                          </h5>
                          <p className="text-sm text-gray-500">{employee.emp_code}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Monthly Salary:</span>
                        <span className="font-medium flex items-center">
                          <IndianRupee className="w-3 h-3" />
                          {employee.salary?.toLocaleString('en-IN') || '0'}
                        </span>
                      </div>
                      
                      {attendance.totalRecords > 0 && (
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="flex items-center space-x-1">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span>Present: {attendance.present}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                            <span>Absent: {attendance.absent}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                            <span>Half Day: {attendance.halfDay}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                            <span>Late: {attendance.late}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Summary and Next Button */}
            <div className="flex items-center justify-between mt-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-6">
                <div className="text-sm">
                  <span className="text-gray-600">Selected Employees:</span>
                  <span className="font-medium ml-1">{payrollConfig.selectedEmployees.length}</span>
                </div>
                <div className="text-sm">
                  <span className="text-gray-600">Total Employees:</span>
                  <span className="font-medium ml-1">{filteredEmployees.length}</span>
                </div>
              </div>
              
              <button
                onClick={() => setActiveTab('processing')}
                disabled={payrollConfig.selectedEmployees.length === 0}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Configure Payroll Settings
              </button>
            </div>
          </div>
        )}

        {/* Payroll Settings Tab */}
        {activeTab === 'processing' && (
          <div className="p-6">
            <div className="mb-6">
              <h4 className="text-lg font-semibold text-gray-900">Payroll Configuration</h4>
              <p className="text-sm text-gray-600">Configure payroll settings and attendance parameters</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Pay Period Settings */}
              <div className="space-y-6">
                <div>
                  <h5 className="text-md font-medium text-gray-900 mb-4">Pay Period Settings</h5>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Pay Period Type
                      </label>
                      <select
                        value={payrollConfig.payPeriod}
                        onChange={(e) => updatePayrollConfig({ 
                          payPeriod: e.target.value as 'monthly' | 'weekly' | 'custom' 
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="monthly">Monthly</option>
                        <option value="weekly">Weekly</option>
                        <option value="custom">Custom Period</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Start Date
                        </label>
                        <input
                          type="date"
                          value={payrollConfig.startDate}
                          onChange={(e) => updatePayrollConfig({ startDate: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          End Date
                        </label>
                        <input
                          type="date"
                          value={payrollConfig.endDate}
                          onChange={(e) => updatePayrollConfig({ endDate: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Attendance Filter Settings */}
                <div>
                  <h5 className="text-md font-medium text-gray-900 mb-4">Attendance Settings</h5>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Attendance Filter
                      </label>
                      <select
                        value={payrollConfig.attendanceFilter}
                        onChange={(e) => updatePayrollConfig({ 
                          attendanceFilter: e.target.value as 'all' | 'present_only' | 'custom_threshold' 
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="all">Include All Employees</option>
                        <option value="present_only">Present Days Only</option>
                        <option value="custom_threshold">Minimum Days Threshold</option>
                      </select>
                    </div>

                    {payrollConfig.attendanceFilter === 'custom_threshold' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Minimum Working Days
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="31"
                          value={payrollConfig.minimumDays}
                          onChange={(e) => updatePayrollConfig({ minimumDays: parseInt(e.target.value) })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    )}

                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id="includeHalfDays"
                        checked={payrollConfig.includeHalfDays}
                        onChange={(e) => updatePayrollConfig({ includeHalfDays: e.target.checked })}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <label htmlFor="includeHalfDays" className="text-sm font-medium text-gray-700">
                        Count Half Days as 0.5 Working Days
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Deduction Rules */}
              <div className="space-y-6">
                <div>
                  <h5 className="text-md font-medium text-gray-900 mb-4">Deduction Rules</h5>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <label className="text-sm font-medium text-gray-700">
                          Absent Day Deductions
                        </label>
                        <p className="text-xs text-gray-500">Deduct full day salary for absent days</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={payrollConfig.deductionRules.absentDeduction}
                        onChange={(e) => updatePayrollConfig({
                          deductionRules: { 
                            ...payrollConfig.deductionRules, 
                            absentDeduction: e.target.checked 
                          }
                        })}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <label className="text-sm font-medium text-gray-700">
                          Late Arrival Deductions
                        </label>
                        <p className="text-xs text-gray-500">10% deduction for late arrivals</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={payrollConfig.deductionRules.lateDeduction}
                        onChange={(e) => updatePayrollConfig({
                          deductionRules: { 
                            ...payrollConfig.deductionRules, 
                            lateDeduction: e.target.checked 
                          }
                        })}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <label className="text-sm font-medium text-gray-700">
                          Half Day Deductions
                        </label>
                        <p className="text-xs text-gray-500">50% deduction for half days (if not counted as working)</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={payrollConfig.deductionRules.halfDayDeduction}
                        onChange={(e) => updatePayrollConfig({
                          deductionRules: { 
                            ...payrollConfig.deductionRules, 
                            halfDayDeduction: e.target.checked 
                          }
                        })}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Summary */}
                <div className="p-4 border border-blue-200 rounded-lg bg-blue-50">
                  <h6 className="text-sm font-medium text-blue-900 mb-2">Processing Summary</h6>
                  <div className="space-y-1 text-xs text-blue-800">
                    <div>Selected Employees: {payrollConfig.selectedEmployees.length}</div>
                    <div>Period: {payrollConfig.startDate} to {payrollConfig.endDate}</div>
                    <div>Filter: {payrollConfig.attendanceFilter.replace('_', ' ')}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between mt-6 p-4 bg-gray-50 rounded-lg">
              <button
                onClick={() => setActiveTab('selection')}
                className="px-6 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-100"
              >
                Back to Selection
              </button>
              
              <button
                onClick={processPayroll}
                disabled={loading || payrollConfig.selectedEmployees.length === 0}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    <span>Process Payroll</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Results Tab */}
        {activeTab === 'results' && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h4 className="text-lg font-semibold text-gray-900">Generated Payslips</h4>
                <p className="text-sm text-gray-600">
                  {generatedPayslips.length > 0 && (
                    <>
                      Pay period: {new Date(payrollConfig.startDate).toLocaleDateString()} 
                      {' to '} 
                      {new Date(payrollConfig.endDate).toLocaleDateString()}
                    </>
                  )}
                </p>
              </div>
              
              {generatedPayslips.length > 0 && (
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setActiveTab('processing')}
                    className="px-4 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50"
                  >
                    Modify Settings
                  </button>
                  <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                    Download All
                  </button>
                </div>
              )}
            </div>

            {generatedPayslips.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Employee</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Attendance</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Gross Salary</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Deductions</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Net Salary</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {generatedPayslips.map((payslip) => (
                      <tr key={payslip.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900 capitalize">
                              {payslip.employee.employee_name}
                            </div>
                            <div className="text-xs text-gray-500">{payslip.employee.emp_code}</div>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <span className="text-green-600">Present: {payslip.present_days}</span>
                              <span className="text-red-600">Absent: {payslip.absent_days}</span>
                            </div>
                            <div className="text-xs text-gray-500">
                              Working Days: {payslip.working_days}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center gap-1">
                            <IndianRupee className="w-3 h-3" />
                            {payslip.gross_salary.toLocaleString('en-IN')}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-red-600 font-medium">
                          <div className="flex items-center gap-1">
                            <IndianRupee className="w-3 h-3" />
                            {payslip.deductions.toLocaleString('en-IN')}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-green-600">
                          <div className="flex items-center gap-1">
                            <IndianRupee className="w-4 h-4" />
                            {payslip.net_salary.toLocaleString('en-IN')}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => downloadPayslip(payslip)}
                              className="text-blue-600 hover:text-blue-800 p-1 rounded"
                              title="Download Payslip"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                            <button
                              className="text-gray-600 hover:text-gray-800 p-1 rounded"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h5 className="text-lg font-medium text-gray-900 mb-2">No Payslips Generated</h5>
                <p className="text-gray-600 mb-4">
                  Configure payroll settings and process payroll to generate payslips.
                </p>
                <button
                  onClick={() => setActiveTab('selection')}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Start Payroll Process
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default PayslipGenerator;
