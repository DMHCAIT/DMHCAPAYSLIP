import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check if environment variables are properly configured
if (!supabaseUrl || supabaseUrl === 'your_supabase_project_url_here') {
  console.warn('⚠️  Supabase URL not configured. Please set VITE_SUPABASE_URL in your .env file');
}

if (!supabaseAnonKey || supabaseAnonKey === 'your_supabase_anon_key_here') {
  console.warn('⚠️  Supabase Anon Key not configured. Please set VITE_SUPABASE_ANON_KEY in your .env file');
}

// Sample employee data
const sampleEmployees: Employee[] = [
  { id: '1', card_no: '00000001', emp_code: 'HYD0001', employee_name: 'mahender', branch: 'Hyderabad', salary: 22000, is_active: true, created_at: '2025-01-01', updated_at: '2025-01-01' },
  { id: '2', card_no: '00000002', emp_code: 'HYD0002', employee_name: 'nakshatra', branch: 'Hyderabad', salary: 28600, is_active: true, created_at: '2025-01-01', updated_at: '2025-01-01' },
  { id: '3', card_no: '00000003', emp_code: 'HYD0003', employee_name: 'mehraj', branch: 'Hyderabad', salary: 27600, is_active: true, created_at: '2025-01-01', updated_at: '2025-01-01' },
  { id: '4', card_no: '00000004', emp_code: 'HYD0004', employee_name: 'aqeel', branch: 'Hyderabad', salary: 25000, is_active: true, created_at: '2025-01-01', updated_at: '2025-01-01' },
  { id: '5', card_no: '00000005', emp_code: 'HYD0005', employee_name: 'yaseen', branch: 'Hyderabad', salary: 18000, is_active: true, created_at: '2025-01-01', updated_at: '2025-01-01' },
  { id: '6', card_no: '00000006', emp_code: 'HYD0006', employee_name: 'rafat', branch: 'Hyderabad', salary: 35000, is_active: true, created_at: '2025-01-01', updated_at: '2025-01-01' },
  { id: '7', card_no: '00000007', emp_code: 'HYD0007', employee_name: 'srilakshmi', branch: 'Hyderabad', salary: 23500, is_active: true, created_at: '2025-01-01', updated_at: '2025-01-01' },
  { id: '8', card_no: '00000008', emp_code: 'HYD0008', employee_name: 'mirza', branch: 'Hyderabad', salary: 20000, is_active: true, created_at: '2025-01-01', updated_at: '2025-01-01' },
  { id: '9', card_no: '00000009', emp_code: 'HYD0009', employee_name: 'shankar', branch: 'Hyderabad', salary: 40000, is_active: true, created_at: '2025-01-01', updated_at: '2025-01-01' },
  { id: '10', card_no: '00000010', emp_code: 'HYD0010', employee_name: 'alekhya', branch: 'Hyderabad', salary: 22500, is_active: true, created_at: '2025-01-01', updated_at: '2025-01-01' },
  { id: '11', card_no: '00000011', emp_code: 'HYD0011', employee_name: 'hussain', branch: 'Hyderabad', salary: 27000, is_active: true, created_at: '2025-01-01', updated_at: '2025-01-01' },
  { id: '12', card_no: '00000012', emp_code: 'HYD0012', employee_name: 'bhavani', branch: 'Hyderabad', salary: 25000, is_active: true, created_at: '2025-01-01', updated_at: '2025-01-01' },
  { id: '13', card_no: '00000013', emp_code: 'HYD0013', employee_name: 'khushi', branch: 'Hyderabad', salary: 22000, is_active: true, created_at: '2025-01-01', updated_at: '2025-01-01' },
  { id: '14', card_no: '00000014', emp_code: 'HYD0014', employee_name: 'nikhil', branch: 'Hyderabad', salary: 66000, is_active: true, created_at: '2025-01-01', updated_at: '2025-01-01' },
  { id: '15', card_no: '00000015', emp_code: 'HYD0015', employee_name: 'shivam', branch: 'Hyderabad', salary: 0, is_active: true, created_at: '2025-01-01', updated_at: '2025-01-01' },
  { id: '16', card_no: '00000016', emp_code: 'HYD0016', employee_name: 'akram', branch: 'Hyderabad', salary: 70000, is_active: true, created_at: '2025-01-01', updated_at: '2025-01-01' },
  { id: '17', card_no: '00000017', emp_code: 'HYD0017', employee_name: 'moin', branch: 'Hyderabad', salary: 86900, is_active: true, created_at: '2025-01-01', updated_at: '2025-01-01' },
  { id: '18', card_no: '00000018', emp_code: 'HYD0018', employee_name: 'vijayasree', branch: 'Hyderabad', salary: 18000, is_active: true, created_at: '2025-01-01', updated_at: '2025-01-01' },
  { id: '19', card_no: '00000019', emp_code: 'HYD0019', employee_name: 'rajitha', branch: 'Hyderabad', salary: 11000, is_active: true, created_at: '2025-01-01', updated_at: '2025-01-01' },
  { id: '20', card_no: '00000020', emp_code: 'HYD0020', employee_name: 'aslamali', branch: 'Hyderabad', salary: 25000, is_active: true, created_at: '2025-01-01', updated_at: '2025-01-01' },
  { id: '21', card_no: '00000021', emp_code: 'HYD0021', employee_name: 'satish', branch: 'Hyderabad', salary: 30000, is_active: true, created_at: '2025-01-01', updated_at: '2025-01-01' },
  { id: '22', card_no: '00000022', emp_code: 'HYD0022', employee_name: 'roshan', branch: 'Hyderabad', salary: 17000, is_active: true, created_at: '2025-01-01', updated_at: '2025-01-01' },
  { id: '23', card_no: '00000023', emp_code: 'HYD0023', employee_name: 'akshay', branch: 'Hyderabad', salary: 27000, is_active: true, created_at: '2025-01-01', updated_at: '2025-01-01' },
  { id: '24', card_no: '', emp_code: '', employee_name: 'susheela', branch: 'Hyderabad', salary: 10000, is_active: true, created_at: '2025-01-01', updated_at: '2025-01-01' },
  { id: '25', card_no: '', emp_code: '', employee_name: 'tejashree', branch: 'Hyderabad', salary: 20000, is_active: true, created_at: '2025-01-01', updated_at: '2025-01-01' },
  { id: '26', card_no: '', emp_code: '', employee_name: 'asiya', branch: 'Hyderabad', salary: 37000, is_active: true, created_at: '2025-01-01', updated_at: '2025-01-01' },
  { id: '27', card_no: '37', emp_code: 'DEL0037', employee_name: 'sajid', branch: 'Delhi', salary: 43000, is_active: true, created_at: '2025-01-01', updated_at: '2025-01-01' },
  { id: '28', card_no: '1745', emp_code: 'DEL1745', employee_name: 'anju', branch: 'Delhi', salary: 12650, is_active: true, created_at: '2025-01-01', updated_at: '2025-01-01' },
  { id: '29', card_no: '870', emp_code: 'DEL0870', employee_name: 'sajid it', branch: 'Delhi', salary: 11000, is_active: true, created_at: '2025-01-01', updated_at: '2025-01-01' },
  { id: '30', card_no: '6663', emp_code: 'DEL6663', employee_name: 'angela', branch: 'Delhi', salary: 25000, is_active: true, created_at: '2025-01-01', updated_at: '2025-01-01' },
  { id: '31', card_no: '7947', emp_code: 'DEL7947', employee_name: 'chhatarpal', branch: 'Delhi', salary: 23000, is_active: true, created_at: '2025-01-01', updated_at: '2025-01-01' },
  { id: '32', card_no: '38', emp_code: 'DEL0038', employee_name: 'chandan', branch: 'Delhi', salary: 50000, is_active: true, created_at: '2025-01-01', updated_at: '2025-01-01' },
  { id: '33', card_no: '399', emp_code: 'DEL0399', employee_name: 'kartij', branch: 'Delhi', salary: 12000, is_active: true, created_at: '2025-01-01', updated_at: '2025-01-01' },
  { id: '34', card_no: '4604', emp_code: 'DEL4604', employee_name: 'poonam', branch: 'Delhi', salary: 20000, is_active: true, created_at: '2025-01-01', updated_at: '2025-01-01' },
  { id: '35', card_no: '3091', emp_code: 'DEL3091', employee_name: 'sohail', branch: 'Delhi', salary: 10000, is_active: true, created_at: '2025-01-01', updated_at: '2025-01-01' },
  { id: '36', card_no: '3093', emp_code: 'DEL3093', employee_name: 'meekad', branch: 'Delhi', salary: 50000, is_active: true, created_at: '2025-01-01', updated_at: '2025-01-01' },
  { id: '37', card_no: '4402', emp_code: 'DEL4402', employee_name: 'shagun', branch: 'Delhi', salary: 50000, is_active: true, created_at: '2025-01-01', updated_at: '2025-01-01' },
  { id: '38', card_no: '2362', emp_code: 'DEL2362', employee_name: 'loveleen', branch: 'Delhi', salary: 24200, is_active: true, created_at: '2025-01-01', updated_at: '2025-01-01' },
  { id: '39', card_no: '6231', emp_code: 'DEL6231', employee_name: 'momin', branch: 'Delhi', salary: 20000, is_active: true, created_at: '2025-01-01', updated_at: '2025-01-01' },
  { id: '40', card_no: '2782', emp_code: 'DEL2782', employee_name: 'rabiya', branch: 'Delhi', salary: 15000, is_active: true, created_at: '2025-01-01', updated_at: '2025-01-01' },
  { id: '41', card_no: '6469', emp_code: 'DEL6469', employee_name: 'fasiuddin', branch: 'Delhi', salary: 45000, is_active: true, created_at: '2025-01-01', updated_at: '2025-01-01' },
  { id: '42', card_no: '2645', emp_code: 'DEL2645', employee_name: 'sahil', branch: 'Delhi', salary: 10000, is_active: true, created_at: '2025-01-01', updated_at: '2025-01-01' },
  { id: '43', card_no: '6820', emp_code: 'DEL6820', employee_name: 'lahareesh', branch: 'Delhi', salary: 18000, is_active: true, created_at: '2025-01-01', updated_at: '2025-01-01' },
  { id: '44', card_no: '2644', emp_code: 'DEL2644', employee_name: 'iqrar', branch: 'Delhi', salary: 15000, is_active: true, created_at: '2025-01-01', updated_at: '2025-01-01' },
  { id: '45', card_no: '9218', emp_code: 'DEL9218', employee_name: 'shilpi', branch: 'Delhi', salary: 12000, is_active: true, created_at: '2025-01-01', updated_at: '2025-01-01' },
  { id: '46', card_no: '6520', emp_code: 'DEL6520', employee_name: 'keshav', branch: 'Delhi', salary: 0, is_active: true, created_at: '2025-01-01', updated_at: '2025-01-01' },
  { id: '47', card_no: '7719', emp_code: 'DEL7719', employee_name: 'rajesh', branch: 'Delhi', salary: 30000, is_active: true, created_at: '2025-01-01', updated_at: '2025-01-01' },
  { id: '48', card_no: '5020', emp_code: 'DEL5020', employee_name: 'avnisha', branch: 'Delhi', salary: 25000, is_active: true, created_at: '2025-01-01', updated_at: '2025-01-01' },
  { id: '49', card_no: '120', emp_code: 'DEL0120', employee_name: 'manisha', branch: 'Delhi', salary: 12000, is_active: true, created_at: '2025-01-01', updated_at: '2025-01-01' },
  { id: '50', card_no: '7135', emp_code: 'DEL7135', employee_name: 'ashwani', branch: 'Delhi', salary: 27000, is_active: true, created_at: '2025-01-01', updated_at: '2025-01-01' },
  { id: '51', card_no: '9904', emp_code: 'DEL9904', employee_name: 'soniya', branch: 'Delhi', salary: 22000, is_active: true, created_at: '2025-01-01', updated_at: '2025-01-01' },
  { id: '52', card_no: '5395', emp_code: 'DEL5395', employee_name: 'santhosh', branch: 'Delhi', salary: 40000, is_active: true, created_at: '2025-01-01', updated_at: '2025-01-01' }
];

// Create a mock supabase client for development when env vars are not set
function createMockSupabaseClient() {
  return {
    from: (table: string) => ({
      select: (_columns = '*') => ({
        eq: (_column: string, _value: any) => ({
          order: (_column: string, _options?: any) => ({
            data: table === 'employees' ? sampleEmployees : [],
            error: null
          })
        })
      }),
      insert: (data: any) => {
        const newEmployee = {
          ...data,
          id: (sampleEmployees.length + 1).toString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        sampleEmployees.push(newEmployee);
        return {
          data: [newEmployee],
          error: null
        };
      },
      update: (data: any) => ({
        eq: (column: string, value: any) => {
          const index = sampleEmployees.findIndex((emp: any) => emp[column] === value);
          if (index !== -1) {
            sampleEmployees[index] = { ...sampleEmployees[index], ...data, updated_at: new Date().toISOString() };
            return {
              data: [sampleEmployees[index]],
              error: null
            };
          }
          return {
            data: null,
            error: { message: 'Employee not found' }
          };
        }
      }),
      delete: () => ({
        eq: (column: string, value: any) => {
          const index = sampleEmployees.findIndex((emp: any) => emp[column] === value);
          if (index !== -1) {
            const deleted = sampleEmployees.splice(index, 1);
            return {
              data: deleted,
              error: null
            };
          }
          return {
            data: null,
            error: { message: 'Employee not found' }
          };
        }
      })
    })
  } as any;
}

// Create a mock supabase client if environment variables are not set
export const supabase = (supabaseUrl && supabaseAnonKey && 
  supabaseUrl !== 'your_supabase_project_url_here' && 
  supabaseAnonKey !== 'your_supabase_anon_key_here') 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : createMockSupabaseClient();

export type Employee = {
  id: string;
  card_no: string;
  emp_code: string;
  employee_name: string;
  branch: string;
  salary: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type Attendance = {
  id: string;
  employee_id: string;
  attendance_date: string;
  status: 'present' | 'absent' | 'week_off';
  marked_at: string;
  marked_by: string | null;
  created_at: string;
};

export type Payslip = {
  id: string;
  employee_id: string;
  pay_cycle_start: string;
  pay_cycle_end: string;
  credit_date: string;
  base_salary: number;
  working_days: number;
  present_days: number;
  absent_days: number;
  per_day_salary: number;
  gross_salary: number;
  deductions: number;
  net_salary: number;
  generated_at: string;
  status: 'draft' | 'approved' | 'paid';
  created_at: string;
};

// Database service functions
export const employeeService = {
  // Get all employees
  async getAllEmployees(): Promise<Employee[]> {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .order('employee_name');
      
      if (error) {
        console.error('Database error:', error);
        // Return sample data as fallback
        return sampleEmployees;
      }
      
      return data || sampleEmployees;
    } catch (error) {
      console.error('Error fetching employees:', error);
      return sampleEmployees;
    }
  },

  // Get employee by ID
  async getEmployeeById(id: string): Promise<Employee | null> {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching employee:', error);
      return sampleEmployees.find(emp => emp.id === id) || null;
    }
  },

  // Add new employee
  async addEmployee(employee: Omit<Employee, 'id' | 'created_at' | 'updated_at'>): Promise<Employee | null> {
    try {
      const newEmployee = {
        ...employee,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('employees')
        .insert([newEmployee])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error adding employee:', error);
      // Add to sample data as fallback
      const newEmployee: Employee = {
        ...employee,
        id: (sampleEmployees.length + 1).toString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      sampleEmployees.push(newEmployee);
      return newEmployee;
    }
  },

  // Update employee
  async updateEmployee(id: string, updates: Partial<Employee>): Promise<Employee | null> {
    try {
      const updatedData = {
        ...updates,
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('employees')
        .update(updatedData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating employee:', error);
      // Update sample data as fallback
      const index = sampleEmployees.findIndex(emp => emp.id === id);
      if (index !== -1) {
        sampleEmployees[index] = { ...sampleEmployees[index], ...updates, updated_at: new Date().toISOString() };
        return sampleEmployees[index];
      }
      return null;
    }
  },

  // Delete employee
  async deleteEmployee(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('employees')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting employee:', error);
      // Remove from sample data as fallback
      const index = sampleEmployees.findIndex(emp => emp.id === id);
      if (index !== -1) {
        sampleEmployees.splice(index, 1);
        return true;
      }
      return false;
    }
  }
};

export const attendanceService = {
  // Get attendance records for an employee
  async getEmployeeAttendance(employeeId: string, startDate?: string, endDate?: string): Promise<Attendance[]> {
    try {
      let query = supabase
        .from('attendance')
        .select('*')
        .eq('employee_id', employeeId)
        .order('attendance_date', { ascending: false });
      
      if (startDate) {
        query = query.gte('attendance_date', startDate);
      }
      if (endDate) {
        query = query.lte('attendance_date', endDate);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching attendance:', error);
      return [];
    }
  },

  // Mark attendance for an employee
  async markAttendance(employeeId: string, date: string, status: 'present' | 'absent' | 'week_off'): Promise<Attendance | null> {
    try {
      const attendanceRecord = {
        employee_id: employeeId,
        attendance_date: date,
        status,
        marked_at: new Date().toISOString(),
        marked_by: 'admin', // You can replace this with actual user info
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('attendance')
        .upsert([attendanceRecord], { onConflict: 'employee_id,attendance_date' })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error marking attendance:', error);
      return null;
    }
  },

  // Get attendance summary
  async getAttendanceSummary(startDate: string, endDate: string) {
    try {
      const { data, error } = await supabase
        .from('attendance')
        .select('status, employee_id')
        .gte('attendance_date', startDate)
        .lte('attendance_date', endDate);
      
      if (error) throw error;
      
      const summary = {
        total: data?.length || 0,
        present: data?.filter((record: any) => record.status === 'present').length || 0,
        absent: data?.filter((record: any) => record.status === 'absent').length || 0,
        week_off: data?.filter((record: any) => record.status === 'week_off').length || 0
      };
      
      return summary;
    } catch (error) {
      console.error('Error getting attendance summary:', error);
      return { total: 0, present: 0, absent: 0, week_off: 0 };
    }
  }
};

export const payslipService = {
  // Generate payslip
  async generatePayslip(employeeId: string, startDate: string, endDate: string): Promise<Payslip | null> {
    try {
      // Get employee details
      const employee = await employeeService.getEmployeeById(employeeId);
      if (!employee) throw new Error('Employee not found');

      // Get attendance data for the period
      const attendanceRecords = await attendanceService.getEmployeeAttendance(employeeId, startDate, endDate);
      
      // Calculate payslip details
      const totalDays = Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1;
      const presentDays = attendanceRecords.filter(record => record.status === 'present').length;
      const absentDays = attendanceRecords.filter(record => record.status === 'absent').length;
      const perDaySalary = employee.salary / 30; // Assuming 30 working days per month
      const grossSalary = perDaySalary * presentDays;
      const deductions = perDaySalary * absentDays * 0.5; // 50% deduction for absent days
      const netSalary = grossSalary - deductions;

      const payslipData = {
        employee_id: employeeId,
        pay_cycle_start: startDate,
        pay_cycle_end: endDate,
        credit_date: new Date().toISOString(),
        base_salary: employee.salary,
        working_days: totalDays,
        present_days: presentDays,
        absent_days: absentDays,
        per_day_salary: Math.round(perDaySalary),
        gross_salary: Math.round(grossSalary),
        deductions: Math.round(deductions),
        net_salary: Math.round(netSalary),
        generated_at: new Date().toISOString(),
        status: 'draft' as const,
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('payslips')
        .insert([payslipData])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error generating payslip:', error);
      return null;
    }
  },

  // Get payslips for an employee
  async getEmployeePayslips(employeeId: string): Promise<Payslip[]> {
    try {
      const { data, error } = await supabase
        .from('payslips')
        .select('*')
        .eq('employee_id', employeeId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching payslips:', error);
      return [];
    }
  }
};
